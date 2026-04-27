/**
 * The default list of domains allowed to be iframed, mirroring SharePoint's built-in HTML Field Security allow-list.
 *
 * Each entry covers both the bare domain and all subdomains when used with `buildFrameSrc`.
 * For example, `youtube.com` covers both `https://youtube.com` and `https://www.youtube.com`, matching SharePoint's domain-entry semantics.
 * HTTPS is implied for all entries, as SharePoint only allows secure iframes.
 * Maintained here AND in the primary package.json for the extension (required here for standalone usage in storybook-addon)
 */
export const DEFAULT_HTML_FIELD_SECURITY_DOMAINS: string[] = [
  'youtube.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'bing.com',
  'office.microsoft.com',
  'officeclient.microsoft.com',
  'store.office.com',
  'skydrive.live.com',
  'powerbi.com',
  'powerbigov.us',
  'sway.com',
  'docs.com',
  'powerapps.com',
  'flow.microsoft.com',
  'powerapps.us',
  'flow.microsoft.us',
  'app.smartsheet.com',
  'publish.smartsheet.com',
  'www.slideshare.net',
  'youtu.be',
  'read.amazon.com',
  'onedrive.live.com',
  'www.microsoft.com',
  'forms.office365.us',
  'support.office.com',
  'embed.ted.com',
  'channel9.msdn.com',
  'forms.office.com',
  'videoplayercdn.osi.office.net',
  'forms.microsoft.com',
  'forms.osi.office365.us',
  'sway.office.com',
  'sway.cloud.microsoft',
  'linkedin.com',
  'web.yammer.com',
  'customervoice.microsoft.com',
  'loop.usercontent.microsoft',
  'outlook.office365.com',
  'engage.cloud.microsoft',
];
