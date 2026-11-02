import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSiteOrigin, toTenantUrl } from './tenantUrls';

const SITE_ORIGIN = 'https://contoso.sharepoint.com';

beforeEach(() => {
  // The webview address: an opaque host without a dot
  vi.stubGlobal('location', new URL('https://abc123.vscode-resource.example/index.html'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getSiteOrigin', () => {
  it('returns the origin of the site URL', () => {
    expect(getSiteOrigin('https://contoso.sharepoint.com/sites/dev')).toBe(SITE_ORIGIN);
  });

  it('returns undefined for a missing or invalid URL', () => {
    expect(getSiteOrigin(undefined)).toBeUndefined();
    expect(getSiteOrigin('not a url')).toBeUndefined();
  });
});

describe('toTenantUrl', () => {
  it('keeps absolute URLs on the site origin', () => {
    expect(toTenantUrl(`${SITE_ORIGIN}/sites/dev/Media/a.png`, SITE_ORIGIN)).toBe(
      `${SITE_ORIGIN}/sites/dev/Media/a.png`,
    );
  });

  it('moves server-relative SharePoint paths to the site host', () => {
    expect(toTenantUrl('/sites/dev/Media/a.png?x=1', SITE_ORIGIN)).toBe(
      `${SITE_ORIGIN}/sites/dev/Media/a.png?x=1`,
    );
    expect(toTenantUrl('/_layouts/15/userphoto.aspx?size=M', SITE_ORIGIN)).toBe(
      `${SITE_ORIGIN}/_layouts/15/userphoto.aspx?size=M`,
    );
  });

  it('moves absolute URLs built on the webview host to the site host', () => {
    expect(toTenantUrl('https://abc123.vscode-resource.example/sites/dev/a.png', SITE_ORIGIN)).toBe(
      `${SITE_ORIGIN}/sites/dev/a.png`,
    );
  });

  it('ignores webview paths that are not SharePoint paths', () => {
    expect(toTenantUrl('/vendor/react.js', SITE_ORIGIN)).toBeUndefined();
  });

  it('ignores other hosts, blob and data URLs and empty values', () => {
    expect(toTenantUrl('https://example.com/sites/dev/a.png', SITE_ORIGIN)).toBeUndefined();
    expect(toTenantUrl('blob:https://abc123/1-2-3', SITE_ORIGIN)).toBeUndefined();
    expect(toTenantUrl('data:image/png;base64,AAAA', SITE_ORIGIN)).toBeUndefined();
    expect(toTenantUrl('', SITE_ORIGIN)).toBeUndefined();
  });

  it('includes Microsoft Graph only when asked', () => {
    const graph = 'https://graph.microsoft.com/v1.0/me';
    expect(toTenantUrl(graph, SITE_ORIGIN)).toBeUndefined();
    expect(toTenantUrl(graph, SITE_ORIGIN, { includeGraph: true })).toBe(graph);
  });
});
