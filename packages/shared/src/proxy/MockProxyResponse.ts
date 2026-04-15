/**
 * Mock Proxy Response
 *
 * SPFx-compatible response wrapper that mimics SPHttpClientResponse.
 * Web parts call .json(), .text(), .ok, .status on these objects.
 */
export class MockProxyResponse {
  public readonly ok: boolean;
  public readonly status: number;
  public readonly headers: Record<string, string>;
  private readonly _body: string;

  constructor(status: number, body: string, headers: Record<string, string>) {
    this.ok = status >= 200 && status < 300;
    this.status = status;
    this.headers = headers;
    this._body = body;
  }

  async json(): Promise<any> {
    try {
      return JSON.parse(this._body);
    } catch {
      return {};
    }
  }

  async text(): Promise<string> {
    return this._body;
  }
}
