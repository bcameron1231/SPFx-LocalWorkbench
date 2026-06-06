/** Controls which external domains are allowed to be iframed, mirroring SharePoint's HTML Field Security setting. */
export interface IHtmlFieldSecurityConfig {
  /**
   * Policy mode:
   * - `'none'` — no external iframes allowed (only the serve URL)
   * - `'allowAll'` — all domains allowed (`frame-src *`)
   * - `'allowList'` — only domains in `allowedDomains` are allowed (SharePoint default)
   */
  policy: 'none' | 'allowAll' | 'allowList';

  /** Domains allowed when `policy` is `'allowList'`. Each entry covers both the bare domain and all subdomains (`https://*.domain`). */
  allowedDomains: string[];
}
