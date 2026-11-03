/**
 * Mock Proxy Response
 *
 * SPFx-compatible response wrapper that mimics SPHttpClientResponse.
 * Web parts call .json(), .text(), .ok, .status on these objects.
 */
import { decodeProxyBody } from './utils/proxyBody';

export class MockProxyResponse {
  public readonly ok: boolean;
  public readonly status: number;
  public readonly headers: Record<string, string>;
  private readonly _body: string;
  private readonly _encoding: 'base64' | undefined;

  constructor(status: number, body: string, headers: Record<string, string>, encoding?: 'base64') {
    this.ok = status >= 200 && status < 300;
    this.status = status;
    this.headers = headers;
    this._body = body;
    this._encoding = encoding;
  }

  async json(): Promise<any> {
    try {
      return JSON.parse(await this.text());
    } catch {
      return {};
    }
  }

  async text(): Promise<string> {
    const decoded = decodeProxyBody(this._body, this._encoding);
    return typeof decoded === 'string' ? decoded : new TextDecoder().decode(decoded);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const decoded = decodeProxyBody(this._body, this._encoding);
    const bytes = typeof decoded === 'string' ? new TextEncoder().encode(decoded) : decoded;
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  }

  async blob(): Promise<Blob> {
    const type = Object.entries(this.headers).find(
      ([k]) => k.toLowerCase() === 'content-type',
    )?.[1];
    return new Blob([await this.arrayBuffer()], type ? { type } : undefined);
  }
}
