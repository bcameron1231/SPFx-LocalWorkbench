/**
 * Mock Rule Engine
 *
 * Matches incoming API requests against configured mock rules.
 * Supports exact substring matching and glob-style patterns.
 * Browser-compatible: accepts a bodyFile loader function instead of using Node.js fs.
 */
import type {
  IMockConfig,
  IMockRule,
  IMockRuleMatch,
  IProxyRequest,
  IProxyResponse,
} from './types';

/** Type for the bodyFile loader function (injected by transport) */
export type BodyFileLoader = (path: string) => Promise<string>;

/**
 * Converts a simple glob pattern to a RegExp.
 * Supports `*` (any chars except /) and `**` (any chars including /).
 * Special regex characters are escaped except for the glob wildcards.
 */
function globToRegex(pattern: string): RegExp {
  // Escape regex special characters except *
  let regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Replace ** first (matches anything including /)
  regexStr = regexStr.replace(/\*\*/g, '@@DOUBLE_STAR@@');
  // Replace single * (matches anything except /)
  regexStr = regexStr.replace(/\*/g, '[^/]*');
  // Restore double star
  regexStr = regexStr.replace(/@@DOUBLE_STAR@@/g, '.*');

  return new RegExp(regexStr, 'i');
}

/** Tests whether a request URL matches a rule's URL pattern. */
function matchUrl(requestUrl: string, match: IMockRuleMatch): boolean {
  if (match.urlPattern) {
    const regex = globToRegex(match.url);
    return regex.test(requestUrl);
  }
  // Default: case-insensitive substring match
  return requestUrl.toLowerCase().includes(match.url.toLowerCase());
}

/** Tests whether a request matches a single rule. */
function matchRule(request: IProxyRequest, rule: IMockRule): boolean {
  // URL match is required
  if (!matchUrl(request.url, rule.match)) {
    return false;
  }

  // Method match (if specified)
  if (rule.match.method && rule.match.method.toUpperCase() !== request.method.toUpperCase()) {
    return false;
  }

  // Client type match (if specified)
  if (rule.match.clientType && rule.match.clientType !== request.clientType) {
    return false;
  }

  return true;
}

export class MockRuleEngine {
  private _rules: IMockRule[] = [];
  private _bodyFileLoader: BodyFileLoader | undefined;
  private _defaultDelay: number = 0;
  private _fallbackStatus: number = 404;

  /**
   * Create a new MockRuleEngine
   * @param bodyFileLoader Optional function to load body files (e.g., from Node.js fs or browser fetch)
   */
  constructor(bodyFileLoader?: BodyFileLoader) {
    this._bodyFileLoader = bodyFileLoader;
  }

  /**
   * Load mock configuration (replaces all rules)
   * @param config Mock configuration with rules and optional default delay
   */
  setConfig(config: IMockConfig): void {
    this._rules = config.rules;
    this._defaultDelay = config.delay ?? 0;
  }

  /** Set the HTTP status returned when no rule matches. Defaults to 404. */
  setFallbackStatus(status: number): void {
    this._fallbackStatus = status;
  }

  /**
   * Replace all rules (called when config file is loaded/reloaded).
   * @param rules Array of mock rules
   */
  setRules(rules: IMockRule[]): void {
    this._rules = rules;
  }

  /**
   * Returns the current rules (for diagnostics / recording).
   */
  getRules(): readonly IMockRule[] {
    return this._rules;
  }

  /**
   * Finds the best matching rule for a given request.
   * For substring matches, the most specific (longest URL pattern) wins.
   * For glob patterns, first match wins (since specificity can't be inferred from length).
   */
  match(request: IProxyRequest): IMockRule | undefined {
    let bestMatch: IMockRule | undefined;
    let bestLength = -1;

    for (const rule of this._rules) {
      if (rule.disabled) {
        continue;
      }
      if (!matchRule(request, rule)) {
        continue;
      }

      // Glob patterns: return immediately (first match wins)
      if (rule.match.urlPattern) {
        return rule;
      }

      // Substring matches: pick the longest (most specific) URL pattern
      const len = rule.match.url.length;
      if (len > bestLength) {
        bestMatch = rule;
        bestLength = len;
      }
    }

    return bestMatch;
  }

  /**
   * Process a request through the mock rule engine and return a response.
   * @param request The proxy request to process
   * @param preMatchedRule Optional pre-matched rule to skip the internal rule scan
   * @returns Promise resolving to the mock response
   */
  async processRequest(
    request: IProxyRequest,
    preMatchedRule?: IMockRule,
  ): Promise<IProxyResponse> {
    const rule = preMatchedRule ?? this.match(request);

    if (!rule) {
      return {
        id: request.id,
        status: this._fallbackStatus,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          error: 'No mock rule matched',
          url: request.url,
          method: request.method,
          clientType: request.clientType,
        }),
        matched: false,
      };
    }

    // Get response body
    let body: string;
    if (rule.response.bodyFile) {
      // Load body from file
      if (!this._bodyFileLoader) {
        console.warn(
          `[MockRuleEngine] No bodyFileLoader configured, returning empty object for ${rule.response.bodyFile}`,
        );
        body = '{}';
      } else {
        try {
          body = await this._bodyFileLoader(rule.response.bodyFile);
        } catch (error) {
          console.warn(
            `[MockRuleEngine] Failed to load body file ${rule.response.bodyFile}:`,
            error,
          );
          return {
            id: request.id,
            status: 500,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              error: 'Failed to load bodyFile',
              bodyFile: rule.response.bodyFile,
              message: error instanceof Error ? error.message : String(error),
            }),
            matched: true,
          };
        }
      }
    } else if (rule.response.body !== undefined) {
      // Inline body
      body =
        typeof rule.response.body === 'string'
          ? rule.response.body
          : JSON.stringify(rule.response.body);
    } else {
      // No body specified
      body = '{}';
    }

    // Apply delay if specified
    const delay = rule.response.delay ?? this._defaultDelay;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    return {
      id: request.id,
      status: rule.response.status,
      headers: rule.response.headers ?? { 'content-type': 'application/json' },
      body,
      matched: true,
    };
  }
}
