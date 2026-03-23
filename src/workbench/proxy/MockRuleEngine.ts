// Mock Rule Engine
//
// Matches incoming API requests against configured mock rules.
// Supports exact substring matching and glob-style patterns.

import type { IMockRule, IMockRuleMatch, IProxyRequest } from './types';

// Converts a simple glob pattern to a RegExp.
// Supports `*` (any chars except /) and `**` (any chars including /).
// Special regex characters are escaped except for the glob wildcards.
function globToRegex(pattern: string): RegExp {
    // Escape regex special characters except * 
    let regexStr = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&');

    // Replace ** first (matches anything including /)
    regexStr = regexStr.replace(/\*\*/g, '@@DOUBLE_STAR@@');
    // Replace single * (matches anything except /)
    regexStr = regexStr.replace(/\*/g, '[^/]*');
    // Restore double star
    regexStr = regexStr.replace(/@@DOUBLE_STAR@@/g, '.*');

    return new RegExp(regexStr, 'i');
}

// Tests whether a request URL matches a rule's URL pattern.
function matchUrl(requestUrl: string, match: IMockRuleMatch): boolean {
    if (match.urlPattern) {
        const regex = globToRegex(match.url);
        return regex.test(requestUrl);
    }
    // Default: case-insensitive substring match
    return requestUrl.toLowerCase().includes(match.url.toLowerCase());
}

// Tests whether a request matches a single rule.
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

    // Replace all rules (called when config file is loaded/reloaded).
    setRules(rules: IMockRule[]): void {
        this._rules = rules;
    }

    // Returns the current rules (for diagnostics / recording).
    getRules(): readonly IMockRule[] {
        return this._rules;
    }

    // Finds the best matching rule for a given request.
    // For substring matches, the most specific (longest URL pattern) wins.
    // For glob patterns, first match wins (since specificity can't be inferred from length).
    // If two substring matches have the same URL length, the first one in the list wins.
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
}
