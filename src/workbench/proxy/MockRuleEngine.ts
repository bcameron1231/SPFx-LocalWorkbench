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

    // Finds the first matching rule for a given request.
    // Rules are evaluated in order; first match wins.
    // Returns undefined if no rule matches.
    match(request: IProxyRequest): IMockRule | undefined {
        for (const rule of this._rules) {
            if (matchRule(request, rule)) {
                return rule;
            }
        }
        return undefined;
    }
}
