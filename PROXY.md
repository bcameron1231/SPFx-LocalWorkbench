# API Proxy & Mock System

The SPFx Local Workbench includes a built-in API proxy system that lets your web parts and extensions make HTTP calls (via `SPHttpClient`, `HttpClient`, `AadHttpClient`) and receive configurable mock responses — all without hitting a live SharePoint or Azure AD endpoint.

> **Important:** This is _not_ a network proxy. No HTTP traffic leaves your machine. Instead, the extension provides **drop-in replacement classes** that extend the same interface as the native SPFx HTTP clients. When your web part calls `this.context.spHttpClient.get(...)`, the call is intercepted, serialized, and routed through VS Code's `postMessage` channel to the extension host, where it is matched against your mock rules and a response is returned.

## How It Works

The proxy system has three layers:

### 1. Proxy Client Classes (Webview)

The workbench replaces the real SPFx HTTP clients with proxy-aware versions:

| Real SPFx Class | Proxy Replacement | Client Type Tag |
|---|---|---|
| `SPHttpClient` | `ProxySPHttpClient` | `spHttp` |
| `HttpClient` | `ProxyHttpClient` | `http` |
| `AadHttpClient` | `ProxyAadHttpClient` | `aadHttp` |

Each proxy class exposes the same methods your web parts already use — `get()`, `post()`, `put()`, `patch()`, `delete()`, `fetch()`, etc. — so **no code changes** are required in your web part.

Under the hood, every method call:

1. Serializes the request (URL, method, headers, body) into a plain object.
2. Tags it with a **client type** (`spHttp`, `http`, or `aadHttp`) so mock rules can distinguish between SharePoint REST calls, generic HTTP calls, and AAD-protected API calls.
3. Sends it through the **Proxy Bridge**.

### 2. Proxy Bridge (Webview ↔ Extension Host)

The `ProxyBridge` is a singleton that manages communication between the webview and the VS Code extension host using `postMessage`:

```
┌─────────────────────────────────────────────────┐
│  Webview (your web part)                        │
│                                                 │
│  this.context.spHttpClient.get(url)             │
│        │                                        │
│        ▼                                        │
│  ProxySPHttpClient._send()                      │
│        │                                        │
│        ▼                                        │
│  ProxyBridge.sendRequest()                      │
│        │  assigns unique correlation ID         │
│        │  stores Promise in pending map         │
│        ▼                                        │
│  vscodeApi.postMessage({ command: 'apiRequest', │
│    id, url, method, headers, body, clientType })│
└────────────────────┬────────────────────────────┘
                     │  postMessage
                     ▼
┌─────────────────────────────────────────────────┐
│  Extension Host                                 │
│                                                 │
│  WorkbenchPanel._handleMessage()                │
│        │                                        │
│        ▼                                        │
│  ApiProxyService.handleRequest()                │
│        │                                        │
│        ▼                                        │
│  MockRuleEngine.match(request)                  │
│        │  first matching rule wins              │
│        ▼                                        │
│  Build response (inline body or bodyFile)       │
│        │                                        │
│        ▼                                        │
│  panel.webview.postMessage({ command:           │
│    'apiResponse', id, status, headers, body })  │
└────────────────────┬────────────────────────────┘
                     │  postMessage
                     ▼
┌─────────────────────────────────────────────────┐
│  Webview                                        │
│                                                 │
│  ProxyBridge listens for 'apiResponse'          │
│        │  matches correlation ID                │
│        ▼                                        │
│  Resolves the pending Promise                   │
│        │                                        │
│        ▼                                        │
│  Returns MockProxyResponse to web part          │
│  (.ok, .status, .json(), .text())               │
└─────────────────────────────────────────────────┘
```

Each request gets a unique correlation ID so multiple in-flight requests are routed back to the correct caller. A 30-second timeout prevents requests from hanging indefinitely.

### 3. API Proxy Service & Mock Rule Engine (Extension Host)

The `ApiProxyService` lives in the extension host (Node.js side) and:

- Loads your mock configuration file (default: `.spfx-workbench/api-mocks.json`).
- Watches the file for changes and hot-reloads rules automatically.
- Passes each incoming request to the `MockRuleEngine`, which evaluates rules in order — **first match wins**.
- Logs all proxied requests to the **SPFx API Proxy** output channel.

## Setting Up API Mocks

### 1. Create the Mock Configuration File

Create a file at `.spfx-workbench/api-mocks.json` in your project root (or run the scaffold command, which creates one for you):

```json
{
  "delay": 0,
  "rules": [
    {
      "match": {
        "url": "/_api/web/lists",
        "method": "GET"
      },
      "response": {
        "status": 200,
        "headers": { "content-type": "application/json;odata=verbose" },
        "body": {
          "d": {
            "results": [
              { "Title": "Documents", "Id": "1", "ItemCount": 5 },
              { "Title": "Site Pages", "Id": "2", "ItemCount": 3 }
            ]
          }
        }
      }
    }
  ]
}
```

### 2. Configuration File Structure

| Property | Type | Description |
|---|---|---|
| `delay` | `number` | Global default delay (ms) applied to all responses unless overridden per-rule. |
| `rules` | `IMockRule[]` | Array of mock rules. Evaluated in order; first match wins. |

### 3. Mock Rule Structure

Each rule has a **match** section and a **response** section:

#### Match

| Property | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | URL substring to match against the request URL. |
| `method` | `string` | No | HTTP method filter (`GET`, `POST`, etc.). If omitted, matches any method. |
| `clientType` | `string` | No | Restrict to a specific client: `spHttp`, `http`, or `aadHttp`. |
| `urlPattern` | `boolean` | No | When `true`, `url` is treated as a glob pattern instead of a substring. |

#### Response

| Property | Type | Required | Description |
|---|---|---|---|
| `status` | `number` | Yes | HTTP status code to return (e.g., `200`, `404`, `500`). |
| `headers` | `object` | No | Response headers. Defaults to `{ "content-type": "application/json" }`. |
| `body` | `any` | No | Inline response body. Can be an object (auto-serialized to JSON) or a string. |
| `bodyFile` | `string` | No | Path to a file containing the response body (relative to workspace root). Use this for large responses. |
| `delay` | `number` | No | Per-rule delay in milliseconds (overrides the global `delay`). |

> **Note:** `body` and `bodyFile` are mutually exclusive. If both are specified, `bodyFile` takes precedence.

## Examples

### Match by URL substring

Matches any request where the URL contains `/_api/web/lists`:

```json
{
  "match": { "url": "/_api/web/lists" },
  "response": {
    "status": 200,
    "body": { "d": { "results": [] } }
  }
}
```

### Match by URL glob pattern

Matches any request to a list items endpoint using a wildcard:

```json
{
  "match": {
    "url": "/_api/web/lists/getbytitle('*')/items",
    "urlPattern": true
  },
  "response": {
    "status": 200,
    "body": { "d": { "results": [] } }
  }
}
```

### Match by method and client type

Only matches POST requests made through `SPHttpClient`:

```json
{
  "match": {
    "url": "/_api/web/lists",
    "method": "POST",
    "clientType": "spHttp"
  },
  "response": {
    "status": 201,
    "body": { "d": { "Id": "3", "Title": "New List" } }
  }
}
```

### Respond with an external file

Keep large mock payloads in separate JSON files:

```json
{
  "match": { "url": "/_api/search/query" },
  "response": {
    "status": 200,
    "bodyFile": ".spfx-workbench/mocks/search-results.json"
  }
}
```

### Simulate an error

```json
{
  "match": { "url": "/_api/web/lists/getbytitle('Missing')" },
  "response": {
    "status": 404,
    "body": {
      "odata.error": {
        "code": "-2130575338, System.ArgumentException",
        "message": { "value": "List 'Missing' does not exist." }
      }
    }
  }
}
```

### Simulate latency

```json
{
  "match": { "url": "/_api/web/lists" },
  "response": {
    "status": 200,
    "delay": 2000,
    "body": { "d": { "results": [] } }
  }
}
```

### Mock an AAD-protected API

Target calls made through `AadHttpClient` to a custom backend:

```json
{
  "match": {
    "url": "https://myapi.azurewebsites.net/api/items",
    "clientType": "aadHttp"
  },
  "response": {
    "status": 200,
    "body": [
      { "id": 1, "name": "Item One" },
      { "id": 2, "name": "Item Two" }
    ]
  }
}
```

## VS Code Settings

You can customize proxy behavior through VS Code settings:

| Setting | Default | Description |
|---|---|---|
| `spfxLocalWorkbench.proxy.mockFile` | `.spfx-workbench/api-mocks.json` | Path to the mock config file (relative to workspace root). |
| `spfxLocalWorkbench.proxy.defaultDelay` | `0` | Default delay (ms) for all mock responses. |
| `spfxLocalWorkbench.proxy.fallbackStatus` | `404` | HTTP status returned when no mock rule matches a request. |
| `spfxLocalWorkbench.proxy.logRequests` | `true` | Log all proxied requests to the **SPFx API Proxy** output channel. |

## Viewing Proxy Logs

All proxied requests are logged to the **SPFx API Proxy** output channel (accessible via **View → Output** and selecting "SPFx API Proxy" from the dropdown). Each entry shows the HTTP method, URL, client type, whether a rule matched, and the response status.

## How the Response Object Works

The `MockProxyResponse` returned to your web part mirrors the SPFx `SPHttpClientResponse` interface:

| Property / Method | Description |
|---|---|
| `.ok` | `true` if status is 200–299. |
| `.status` | The HTTP status code. |
| `.headers` | Response headers object. |
| `.json()` | Returns a `Promise` that resolves to the parsed JSON body. |
| `.text()` | Returns a `Promise` that resolves to the raw string body. |

Your existing web part code like `response.json().then(data => ...)` works without modification.

## Tips

- **Rules are evaluated in order** — put more specific rules above generic catch-all rules.
- **Hot reload** — edit `api-mocks.json` and save; the extension picks up changes automatically without restarting the workbench.
- **Use `bodyFile`** for large payloads to keep your mock config readable.
- **Check the Output channel** ("SPFx API Proxy") to verify which rules are matching and debug unexpected 404s.
- **Unmatched requests** return the `fallbackStatus` (default `404`) with a JSON body describing what was requested, making it easy to identify missing mock rules.
