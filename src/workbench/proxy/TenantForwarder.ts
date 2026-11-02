// Tenant Forwarder
//
// Sends proxied requests to a real Microsoft 365 tenant from the extension host, with an access
// token from VS Code's built-in Microsoft sign-in. Used wherever the proxy would otherwise hand a
// request to the network unauthenticated (passthrough, mock-passthrough, record).
//
// - Only the SharePoint host of the configured page context and Microsoft Graph are forwarded.
// - The token never reaches the webview: the request's own Authorization/Cookie headers are dropped
//   and the token is added here.
// - Read-only unless spfxLocalWorkbench.tenant.allowWrites is on: writes get a 403 from the workbench.
import * as vscode from 'vscode';

import { explicitSetting, readPersonalSettings } from '../config/PersonalSettings';
import { getWorkbenchSettings } from '../config/WorkbenchConfig';
import type { IProxyRequest, IProxyResponse } from './types';

const GRAPH_ORIGIN = 'https://graph.microsoft.com';

const DEFAULT_SHAREPOINT_SCOPES = ['AllSites.Read'];
const DEFAULT_SHAREPOINT_WRITE_SCOPES = ['AllSites.Write'];
const DEFAULT_GRAPH_SCOPES = [
  'User.Read',
  'User.ReadBasic.All',
  'Calendars.Read',
  'Group.Read.All',
  'Sites.Read.All',
];

// Headers from the webview that must not reach the tenant
const DROPPED_HEADERS = new Set([
  'authorization',
  'cookie',
  'x-requestdigest',
  'origin',
  'referer',
  'host',
]);

// SharePoint POST endpoints that only read data
const SHAREPOINT_READ_POSTS = [
  /\/_api\/contextinfo$/i,
  /\/_api\/search\/postquery/i,
  /\/renderlistdataasstream/i,
  /\/renderlistfilterdata/i,
  /\/getitems$/i,
  /\/getitems\(/i,
  /\/_api\/sp\.utilities\.utility\.searchprincipalsusingcontextweb/i,
  /\/_api\/sp\.ui\.applicationpages\.clientpeoplepickerwebserviceinterface\.clientpeoplepickersearchuser/i,
];

/** 'graphDelegate': a trusted API host that the web part calls with a Graph token (e.g. its own backend) */
type TenantResource = 'sharepoint' | 'graph' | 'graphDelegate';

/** Must match LOCAL_WORKBENCH_TOKEN in webview/src/mocks/SpfxContext.ts */
const PLACEHOLDER_TOKEN = 'spfx-local-workbench-placeholder-token';

export interface ITenantSettings {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  allowWrites: boolean;
  sharePointScopes: string[];
  graphScopes: string[];
  /** Origin of the page context site, e.g. https://contoso.sharepoint.com */
  sharePointOrigin: string | undefined;
  /**
   * Origins of APIs that may receive the user's Graph token, e.g. a product's own backend.
   * Only requests that already carry the workbench placeholder token get the real one.
   */
  graphTokenHosts: string[];
}

export class TenantForwarder {
  private readonly _log: (message: string) => void;
  /** Sign-in failures by resource and settings; cleared when the settings change */
  private readonly _failures = new Map<string, string>();

  constructor(log: (message: string) => void) {
    this._log = log;
  }

  /** Forget remembered sign-in failures, e.g. after the user changed settings */
  resetSignInFailures(): void {
    this._failures.clear();
  }

  /** VS Code settings set explicitly win; otherwise the personal settings file; otherwise defaults */
  static readSettings(): ITenantSettings {
    const tenant = vscode.workspace.getConfiguration('spfxLocalWorkbench.tenant');
    const personal = readPersonalSettings();
    // Tenant settings are machine-scoped: only user settings count, never a repository's
    const explicit = <T>(key: string) => explicitSetting<T>('spfxLocalWorkbench.tenant', key, true);
    const pageContext = getWorkbenchSettings().context.pageContext;

    let sharePointOrigin: string | undefined;
    try {
      sharePointOrigin = pageContext?.site?.absoluteUrl
        ? new URL(pageContext.site.absoluteUrl).origin.toLowerCase()
        : undefined;
    } catch {
      sharePointOrigin = undefined;
    }

    const tenantId = (explicit<string>('tenantId') ?? personal.tenantId ?? '').trim();
    return {
      // A tenant in the personal settings file turns tenant mode on
      enabled: explicit<boolean>('enabled') ?? !!personal.tenantId,
      tenantId,
      clientId: (explicit<string>('clientId') ?? personal.clientId ?? '').trim(),
      allowWrites: explicit<boolean>('allowWrites') ?? personal.allowWrites ?? false,
      sharePointScopes: tenant.get<string[]>('sharePointScopes', DEFAULT_SHAREPOINT_SCOPES),
      graphScopes: tenant.get<string[]>('graphScopes', DEFAULT_GRAPH_SCOPES),
      sharePointOrigin,
      graphTokenHosts: (explicit<string[]>('graphTokenHosts') ?? personal.graphTokenHosts ?? [])
        .map((host) => {
          try {
            return new URL(host).origin.toLowerCase();
          } catch {
            return '';
          }
        })
        .filter((origin) => origin.startsWith('https://')),
    };
  }

  /** Which tenant resource a URL belongs to, or undefined when it must not be forwarded */
  getResource(
    url: string,
    settings: ITenantSettings = TenantForwarder.readSettings(),
  ): TenantResource | undefined {
    if (!settings.enabled || !settings.tenantId) {
      return undefined;
    }
    let origin: string;
    try {
      origin = new URL(url).origin.toLowerCase();
    } catch {
      return undefined;
    }
    if (origin === GRAPH_ORIGIN) {
      return 'graph';
    }
    if (settings.sharePointOrigin && origin === settings.sharePointOrigin) {
      return 'sharepoint';
    }
    if (settings.graphTokenHosts.includes(origin)) {
      return 'graphDelegate';
    }
    return undefined;
  }

  /** Whether the web part sent the workbench placeholder token, i.e. it asked for a token */
  static carriesPlaceholderToken(request: IProxyRequest): boolean {
    return Object.entries(request.headers ?? {}).some(
      ([key, value]) =>
        key.toLowerCase() === 'authorization' && String(value).includes(PLACEHOLDER_TOKEN),
    );
  }

  /**
   * Forwards the request to the tenant. Returns undefined when the request is not for the tenant,
   * so the caller can keep its own passthrough behaviour.
   */
  async tryForward(originalRequest: IProxyRequest): Promise<IProxyResponse | undefined> {
    const settings = TenantForwarder.readSettings();
    const request = TenantForwarder.resolveSharePointUrl(originalRequest, settings);
    const resource = this.getResource(request.url, settings);
    if (!resource) {
      return undefined;
    }

    // A trusted API only gets a token when the web part asked for one
    if (resource === 'graphDelegate' && !TenantForwarder.carriesPlaceholderToken(request)) {
      return undefined;
    }

    // Trusted APIs are listed explicitly by the user; their reads may be POSTs, so they skip the guard
    if (
      resource !== 'graphDelegate' &&
      !settings.allowWrites &&
      !TenantForwarder.isReadOnly(request, resource)
    ) {
      this._log(`  Tenant: blocked ${request.method} (writes are disabled)`);
      if (/\/_vti_bin\/client\.svc\/ProcessQuery/i.test(request.url)) {
        this._log(
          `  Tenant: CSOM methods in the blocked request: ${csomMethodNames(request.body).join(', ') || '(none found)'}`,
        );
      }
      return jsonResponse(request.id, 403, {
        error:
          'Blocked by the SPFx Local Workbench: writes to the tenant are disabled. Turn on spfxLocalWorkbench.tenant.allowWrites to allow them.',
      });
    }

    let token: string;
    try {
      token = await this._getToken(resource, settings);
    } catch (error: unknown) {
      return this._signInFailedResponse(request, resource, settings, error);
    }

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.headers ?? {})) {
      if (!DROPPED_HEADERS.has(key.toLowerCase())) {
        headers[key] = value;
      }
    }
    headers['Authorization'] = `Bearer ${token}`;
    if (
      resource === 'sharepoint' &&
      !Object.keys(headers).some((k) => k.toLowerCase() === 'accept')
    ) {
      headers['Accept'] = 'application/json;odata=nometadata';
    }

    const response = await fetch(request.url, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      // The webview must not see auth-related response headers
      if (!/^(set-cookie|www-authenticate)$/i.test(key)) {
        responseHeaders[key] = value;
      }
    });
    // Binary content (images, files) travels base64-encoded; text stays as it is
    const contentType = response.headers.get('content-type') ?? '';
    const isText =
      !contentType ||
      /^(text\/|application\/(json|xml|javascript|x-javascript|ecmascript|atom\+xml)|.*\+(json|xml))/i.test(
        contentType,
      );
    const body = isText
      ? await response.text()
      : Buffer.from(await response.arrayBuffer()).toString('base64');
    this._log(
      `  Tenant (${resource}): ${response.status}${isText ? '' : ` [binary ${contentType}]`}`,
    );

    return {
      id: request.id,
      status: response.status,
      headers: responseHeaders,
      body,
      matched: false,
      ...(isText ? {} : { bodyEncoding: 'base64' as const }),
    };
  }

  /**
   * Code that builds SharePoint URLs from the page address (location.origin + a server-relative
   * path) gets the webview's address in the workbench. Those requests are sent to the site's host.
   */
  static resolveSharePointUrl(request: IProxyRequest, settings: ITenantSettings): IProxyRequest {
    if (!settings.enabled || !settings.sharePointOrigin) {
      return request;
    }
    // fetch() with a server-relative URL (/sites/...) reaches the proxy without a host
    if (/^\/(sites|teams|_api|_layouts|_vti_bin)(\/|$)/i.test(request.url)) {
      return { ...request, url: settings.sharePointOrigin + request.url };
    }
    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return request;
    }
    // Webview origins are a bare ID (no dot); SharePoint paths start with a known root
    const isWebviewHost = !url.hostname.includes('.') && url.hostname !== 'localhost';
    const isSharePointPath = /^\/(sites|teams|_api|_layouts|_vti_bin)(\/|$)/i.test(url.pathname);
    if (!isWebviewHost || !isSharePointPath) {
      return request;
    }
    return { ...request, url: settings.sharePointOrigin + url.pathname + url.search };
  }

  /** Requests that only read data. Batches count as reads only when every part is a read. */
  static isReadOnly(request: IProxyRequest, resource: 'sharepoint' | 'graph'): boolean {
    const method = request.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD') {
      return true;
    }
    if (method !== 'POST') {
      return false;
    }

    const url = request.url.split('?')[0];
    if (/\/\$batch$/i.test(url)) {
      return resource === 'graph'
        ? isReadOnlyGraphBatch(request.body)
        : isReadOnlySharePointBatch(request.body);
    }
    if (resource === 'sharepoint' && /\/_vti_bin\/client\.svc\/ProcessQuery$/i.test(url)) {
      return isReadOnlyCsom(request.body);
    }
    if (resource === 'sharepoint') {
      const httpMethodOverride = Object.entries(request.headers ?? {}).find(
        ([k]) => k.toLowerCase() === 'x-http-method',
      );
      if (httpMethodOverride) {
        return false;
      }
      return SHAREPOINT_READ_POSTS.some((pattern) => pattern.test(url));
    }
    return false;
  }

  /**
   * A failed sign-in is remembered per resource and settings, so the user is not asked again on
   * every request. Requests for that resource get a 403 the web part can handle (Graph-shaped for
   * Graph), and one notification points to the setup guide.
   */
  private _signInFailedResponse(
    request: IProxyRequest,
    resource: TenantResource,
    settings: ITenantSettings,
    error: unknown,
  ): IProxyResponse {
    const raw = error instanceof Error ? error.message : String(error);
    const usesGraph = resource !== 'sharepoint';
    const reason = describeSignInFailure(raw, usesGraph, settings);
    const key = failureKey(resource, settings);

    if (!this._failures.has(key)) {
      this._failures.set(key, reason);
      this._log(
        `  Tenant: sign-in for ${usesGraph ? 'Microsoft Graph' : 'SharePoint'} failed: ${raw}`,
      );
      this._log(`  Tenant: ${reason}`);
      void vscode.window
        .showWarningMessage(`SPFx Local Workbench: ${reason}`, OPEN_GUIDE)
        .then((choice) => {
          if (choice === OPEN_GUIDE) {
            void openTenantGuide();
          }
        });
    }

    const body = usesGraph
      ? { error: { code: 'LocalWorkbench_SignInFailed', message: reason } }
      : {
          'odata.error': {
            code: 'LocalWorkbench_SignInFailed',
            message: { lang: 'en-US', value: reason },
          },
        };
    return jsonResponse(request.id, 403, body);
  }

  private async _getToken(resource: TenantResource, settings: ITenantSettings): Promise<string> {
    const knownFailure = this._failures.get(failureKey(resource, settings));
    if (knownFailure) {
      throw new Error(knownFailure);
    }
    // VS Code's own app is not preauthorized for these Graph permissions: asking the user to sign in
    // could only end in AADSTS65002, so fail straight away with the guidance
    if (resource !== 'sharepoint' && !settings.clientId) {
      throw new Error('AADSTS65002: no clientId set; Microsoft Graph needs your own Entra ID app');
    }

    const usesGraph = resource === 'graph' || resource === 'graphDelegate';
    const origin = usesGraph ? GRAPH_ORIGIN : settings.sharePointOrigin!;
    const scopeNames = usesGraph
      ? settings.graphScopes
      : settings.allowWrites
        ? [...settings.sharePointScopes, ...DEFAULT_SHAREPOINT_WRITE_SCOPES]
        : settings.sharePointScopes;

    const scopes = scopeNames.map((scope) =>
      scope.includes('://') ? scope : `${origin}/${scope}`,
    );
    scopes.push(`VSCODE_TENANT:${settings.tenantId}`);
    if (settings.clientId) {
      scopes.push(`VSCODE_CLIENT_ID:${settings.clientId}`);
    }

    // VS Code caches the session and refreshes the token; the first call shows its sign-in prompt
    const session = await vscode.authentication.getSession('microsoft', scopes, {
      createIfNone: true,
    });
    return session.accessToken;
  }
}

const OPEN_GUIDE = 'Open setup guide';

/** The failure cache is keyed by everything that changes which sign-in is attempted */
function failureKey(resource: TenantResource, settings: ITenantSettings): string {
  const usesGraph = resource !== 'sharepoint';
  return [
    usesGraph ? 'graph' : 'sharepoint',
    settings.tenantId,
    settings.clientId,
    settings.allowWrites,
  ].join('|');
}

/** Turns a sign-in error into an explanation with the next step */
export function describeSignInFailure(
  raw: string,
  usesGraph: boolean,
  settings: ITenantSettings,
): string {
  const target = usesGraph
    ? 'Microsoft Graph sources (Outlook, Microsoft 365 groups, Entra ID people)'
    : 'SharePoint data';
  if (/AADSTS65002/.test(raw) || (usesGraph && !settings.clientId && /preauthori/i.test(raw))) {
    return `${target} need your own Entra ID app: VS Code's built-in app is not allowed to request these permissions. Register an app and set "clientId" in your personal settings. SharePoint data keeps working.`;
  }
  if (/AADSTS65001|consent/i.test(raw)) {
    return `${target}: the app has no consent in your tenant yet. Grant admin consent for its permissions, then reload the workbench.`;
  }
  if (/AADSTS50011|redirect/i.test(raw)) {
    return `${target}: the app's redirect URIs are incomplete. Add the redirect URIs listed in the setup guide, then reload the workbench.`;
  }
  if (/AADSTS700016|AADSTS90002/.test(raw)) {
    return `${target}: the tenant or app ID was not found. Check "tenantId" and "clientId" in your personal settings.`;
  }
  if (/cancel/i.test(raw)) {
    return `${target}: sign-in was cancelled. Reload the workbench to try again.`;
  }
  return `${target} could not sign in (${raw.slice(0, 200)}). See the setup guide.`;
}

/** Opens TENANT.md shipped with the extension */
export async function openTenantGuide(): Promise<void> {
  const extension = vscode.extensions.getExtension('m365pnp.pnp-spfx-local-workbench');
  if (!extension) {
    return;
  }
  const guide = vscode.Uri.joinPath(extension.extensionUri, 'TENANT.md');
  await vscode.commands.executeCommand('markdown.showPreview', guide);
}

/**
 * CSOM/JSOM sends every call of a query as one ProcessQuery XML request. Queries, CAML reads and
 * searches only call reading methods; changes call methods like Update, Add*, Delete*, Recycle or
 * SetFieldValue. (SetProperty elements set properties of client-side objects such as a KeywordQuery,
 * so they are not writes by themselves; a change to a server object also calls Update.)
 */
const CSOM_WRITE_METHOD =
  /^(Update|SystemUpdate|UpdateOverwriteVersion|Add|Create|Delete|Recycle|Remove|SetFieldValue|Set[A-Z]\w*Permission|Move|Copy|CheckIn|CheckOut|UndoCheckOut|Publish|Unpublish|Approve|Deny|Upload|StartUpload|ContinueUpload|FinishUpload|SaveBinary|BreakRoleInheritance|ResetRoleInheritance|Restore|Follow|Unfollow|Like|Unlike|Rate|SetRating|SetLike|Validate(Update)?ListItem)/;

function csomMethodNames(body?: string): string[] {
  return [...(body ?? '').matchAll(/<(?:Static)?Method\b[^>]*\bName="([^"]+)"/g)].map((m) => m[1]);
}

const attribute = (tag: string, name: string): string | undefined =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

/**
 * Write methods called on server objects. Objects created in the page (<Constructor>, e.g. a
 * KeywordQuery) and everything reached from them are client-side: filling their collections with
 * Add is not a change to tenant data.
 */
function isReadOnlyCsom(body?: string): boolean {
  if (!body || !/<Request\b/i.test(body)) {
    return false;
  }

  const objectPaths = /<ObjectPaths>([\s\S]*)<\/ObjectPaths>/i.exec(body)?.[1] ?? '';
  const actions = /<Actions>([\s\S]*)<\/Actions>/i.exec(body)?.[1] ?? '';

  // Object path id -> parent id, and which ids are created client-side
  const parentOf = new Map<string, string | undefined>();
  const constructed = new Set<string>();
  const pathMethods: { parentId: string | undefined; name: string }[] = [];
  for (const match of objectPaths.matchAll(
    /<(Constructor|Property|Method|StaticProperty|StaticMethod|Identity)\b[^>]*>/g,
  )) {
    const [tag, kind] = match;
    const id = attribute(tag, 'Id');
    if (!id) continue;
    const parentId = attribute(tag, 'ParentId');
    parentOf.set(id, parentId);
    if (kind === 'Constructor') constructed.add(id);
    if (kind === 'Method' || kind === 'StaticMethod') {
      pathMethods.push({ parentId, name: attribute(tag, 'Name') ?? '' });
    }
  }
  const isClientSide = (id: string | undefined): boolean => {
    for (
      let current = id, depth = 0;
      current !== undefined && depth < 100;
      current = parentOf.get(current), depth++
    ) {
      if (constructed.has(current)) return true;
    }
    return false;
  };

  // Methods that create object paths, e.g. list.getItems(caml) or items.add(info)
  if (pathMethods.some((m) => CSOM_WRITE_METHOD.test(m.name) && !isClientSide(m.parentId))) {
    return false;
  }
  // Methods called as actions, e.g. item.update() or keywordQuery.get_selectProperties().add('Title')
  for (const match of actions.matchAll(/<(?:Static)?Method\b[^>]*>/g)) {
    const name = attribute(match[0], 'Name') ?? '';
    if (CSOM_WRITE_METHOD.test(name) && !isClientSide(attribute(match[0], 'ObjectPathId'))) {
      return false;
    }
  }
  return true;
}

function isReadOnlySharePointBatch(body?: string): boolean {
  if (!body) {
    return false;
  }
  // Each part has a request line ("GET https://... HTTP/1.1"); an X-HTTP-Method header turns a POST into a write
  const requestLines = body.match(/^(GET|POST|PUT|PATCH|DELETE|MERGE) https?:\/\/\S+/gim) ?? [];
  if (requestLines.length === 0) {
    return false;
  }
  const allGets = requestLines.every((line) => /^GET /i.test(line));
  return allGets && !/^X-HTTP-Method:/im.test(body);
}

function isReadOnlyGraphBatch(body?: string): boolean {
  try {
    const parsed = JSON.parse(body ?? '') as { requests?: { method?: string }[] };
    return (
      Array.isArray(parsed.requests) &&
      parsed.requests.every((r) => (r.method ?? 'GET').toUpperCase() === 'GET')
    );
  } catch {
    return false;
  }
}

function jsonResponse(id: string, status: number, body: unknown): IProxyResponse {
  return {
    id,
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    matched: false,
  };
}
