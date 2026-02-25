# Mock Data Generation

The SPFx Local Workbench includes tools to help you **generate and populate** your `api-mocks.json` configuration file without writing it by hand. These tools are available from the **Command Palette** (`Ctrl+Shift+P` → search "SPFx Mock Data") or from the workbench toolbar.

> **Prerequisites:** Make sure you understand how the mock rule system works. See [PROXY.md](PROXY.md) for the full architecture, rule syntax, and matching behavior.

---

## Table of Contents

- [Scaffold Mock Config](#scaffold-mock-config)
- [Generate Status Code Stubs](#generate-status-code-stubs)
- [Import JSON File](#import-json-file)
- [Import CSV File](#import-csv-file)
- [Record Requests](#record-requests)
- [How Rules Are Merged](#how-rules-are-merged)
- [Disabled Rules](#disabled-rules)
- [URL Matching Behavior](#url-matching-behavior)

---

## Scaffold Mock Config

**Command:** `SPFx Mock Data: Scaffold API Mock Configuration`

Creates a starter `.spfx-workbench/api-mocks.json` file with one example rule if it doesn't already exist. This is the quickest way to get started.

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

---

## Generate Status Code Stubs

**Command:** `SPFx Mock Data: Generate Status Code Stubs`

An interactive wizard that generates mock rules for one or more HTTP status codes. Useful for testing how your web part handles success, auth failures, throttling, and server errors.

### Wizard Steps

1. **URL pattern** — The API endpoint to mock (e.g., `/api/orders` or `/_api/web/lists`)
2. **HTTP method** — `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, or `ANY`
3. **Client type** — Which SPFx client the rule applies to:
   - `Any` — matches all client types
   - `spHttp` — `SPHttpClient` calls
   - `http` — `HttpClient` calls
   - `aadHttp` — `AadHttpClient` calls
   - `fetch` — global `fetch()` calls
4. **Status codes** — Multi-select from common codes: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `429`, `500`, `503`

### What It Generates

The **first** selected status code is enabled. All others are generated with `"disabled": true` so you can toggle between them:

```json
{
  "match": { "url": "/api/orders", "method": "GET", "clientType": "aadHttp" },
  "response": {
    "status": 200,
    "headers": { "content-type": "application/json" },
    "body": { "value": [] }
  }
},
{
  "match": { "url": "/api/orders", "method": "GET", "clientType": "aadHttp" },
  "response": {
    "status": 401,
    "headers": { "content-type": "application/json" },
    "body": { "error": { "code": "Unauthorized", "message": "Access denied. Bearer token is missing or invalid." } }
  },
  "disabled": true
},
{
  "match": { "url": "/api/orders", "method": "GET", "clientType": "aadHttp" },
  "response": {
    "status": 500,
    "headers": { "content-type": "application/json" },
    "body": { "error": { "code": "InternalServerError", "message": "An internal server error occurred." } }
  },
  "disabled": true
}
```

To test a different scenario, set `"disabled": true` on the 200 rule and remove it from the 401 or 500 rule.

---

## Import JSON File

**Command:** `SPFx Mock Data: Import JSON File as Mock`

Use an existing `.json` file as the response body for a mock rule. This is handy when you have sample API responses saved from a real SharePoint or Graph call.

### Workflow

1. **Pick a JSON file** from your filesystem
2. **Enter URL, method, client type, and status code** (same prompts as status code stubs)
3. **Choose storage mode:**
   - **Inline body** — embeds the JSON directly in the rule's `body` property
   - **Reference file** — sets the rule's `bodyFile` to the relative path of the file (the file itself is not copied)

### Example with `bodyFile`

If you select a file at `.spfx-workbench/mocks/lists.json`, the generated rule looks like:

```json
{
  "match": { "url": "/_api/web/lists", "method": "GET" },
  "response": {
    "status": 200,
    "headers": { "content-type": "application/json" },
    "bodyFile": ".spfx-workbench/mocks/lists.json"
  }
}
```

This keeps your `api-mocks.json` small and lets you manage large response payloads in separate files.

---

## Import CSV File

**Command:** `SPFx Mock Data: Import CSV File as Mock`

Parse a `.csv` file and use its rows as the JSON response body for a mock rule. This is useful when you have tabular data in a spreadsheet that you want to serve as a mock API response.

### Workflow

1. **Pick a CSV file** — the first row is treated as column headers
2. **Preview** — shows a preview of the first 3 parsed rows as JSON objects
3. **Choose response format:**
   - **Array** — plain JSON array: `[{...}, {...}]`
   - **SharePoint REST** — wrapped as `{ "d": { "results": [{...}, {...}] } }`
   - **Graph / OData** — wrapped as `{ "value": [{...}, {...}] }`
4. **Enter URL, method, client type, and status code**

### Example

Given a CSV file:

```csv
Title,ID,Status
Project Alpha,1,Active
Project Beta,2,Complete
```

With "SharePoint REST" format selected, the generated rule contains:

```json
{
  "match": { "url": "/_api/web/lists/getbyTitle('Projects')/items", "method": "GET" },
  "response": {
    "status": 200,
    "headers": { "content-type": "application/json" },
    "body": {
      "d": {
        "results": [
          { "Title": "Project Alpha", "ID": "1", "Status": "Active" },
          { "Title": "Project Beta", "ID": "2", "Status": "Complete" }
        ]
      }
    }
  }
}
```

### CSV Parsing Notes

- The built-in parser handles quoted fields and escaped quotes (`""`)
- All values are imported as strings
- Empty rows are skipped

---

## Record Requests

**Command:** `SPFx Mock Data: Record Requests & Generate Rules`

> ⚠️ **Work in Progress** — This feature currently captures the **URL, HTTP method, and client type** of unmatched requests. It does **not** capture request or response bodies. After generating rules, you will need to manually populate the response `body` for each rule.

### How It Works

Recording uses a **toggle** model:

1. **First run** — starts recording. The workbench automatically refreshes so your web parts re-initialize and make their API calls. A red **"Recording API Requests..."** indicator appears in the status bar.
2. **While recording** — every API request that does **not** match an existing rule is captured (URL, method, client type). Requests that match existing rules are served normally and not recorded.
3. **Second run** — stops recording and shows you a list of all unique captured requests. You can multi-select which ones to generate rules for, then pick a default status code.

### What It Generates

Each recorded request becomes a stub rule with a placeholder response body:

```json
{
  "match": {
    "url": "https://contoso.sharepoint.com/sites/devsite/_api/web/lists/getbyTitle('Documents')/items",
    "method": "GET",
    "clientType": "spHttp"
  },
  "response": {
    "status": 200,
    "headers": { "content-type": "application/json" },
    "body": { "value": [] }
  }
}
```

### Typical Workflow

1. Open the workbench and add your web part
2. Run **Record Requests** — the web part refreshes and makes its API calls, all of which return 404 (or whatever your `fallbackStatus` is set to)
3. Run **Record Requests** again — review the captured URLs, select all, pick `200 OK`
4. Open `api-mocks.json` and fill in the `body` for each generated rule with your test data
5. Refresh the workbench — your web part now gets mock data

This saves you from manually discovering all the API endpoints your web part calls.

---

## How Rules Are Merged

All generators **append** new rules to your existing `api-mocks.json` file. They never overwrite or remove existing rules. If the file doesn't exist, it is created automatically.

After generation, the file is opened in the editor so you can review and adjust the rules.

---

## Disabled Rules

Rules can include a `"disabled": true` property. Disabled rules are **skipped** during matching, allowing you to keep multiple response variants for the same URL and toggle between them:

```json
{
  "match": { "url": "/api/data", "method": "GET" },
  "response": { "status": 200, "body": { "value": [{ "id": 1 }] } }
},
{
  "match": { "url": "/api/data", "method": "GET" },
  "response": { "status": 500, "body": { "error": "Server error" } },
  "disabled": true
}
```

To switch to a 500 error scenario, set `"disabled": true` on the first rule and remove it from the second.

---

## URL Matching Behavior

When multiple rules match the same request URL (using substring matching), the **most specific rule wins** — determined by the longest matching URL pattern. This means you don't need to worry about rule ordering for substring matches.

For example, with these two rules:

```json
{ "match": { "url": "/_api/web/lists/getbyTitle('Test')" } },
{ "match": { "url": "/_api/web/lists/getbyTitle('Test')/items" } }
```

A request to `/_api/web/lists/getbyTitle('Test')/items` matches the **second** rule (44 characters is more specific than 38), even though the first rule also matches as a substring.

For **glob pattern** rules (`"urlPattern": true`), first match wins — specificity cannot be inferred from pattern length.

---

## All Commands

| Command | Description |
|---|---|
| `SPFx Mock Data: Scaffold API Mock Configuration` | Create a starter `api-mocks.json` file |
| `SPFx Mock Data: Generate Status Code Stubs` | Generate rules for multiple status codes via wizard |
| `SPFx Mock Data: Import JSON File as Mock` | Import a JSON file as a mock response body |
| `SPFx Mock Data: Import CSV File as Mock` | Parse a CSV file into a JSON mock response |
| `SPFx Mock Data: Record Requests & Generate Rules` | Capture unmatched requests and generate stub rules |

All commands are also accessible from the **Command Palette** (`Ctrl+Shift+P`).
