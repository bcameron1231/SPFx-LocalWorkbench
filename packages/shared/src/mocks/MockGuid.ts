/**
 * Mock Guid class that matches the SPFx sp-core-library Guid interface
 */
export class MockGuid {
  private static readonly _guidRegEx =
    /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
  private _guid: string;

  /**
   * Use Guid.parse() or Guid.tryParse() instead of the constructor.
   */
  private constructor(guid: string) {
    this._guid = guid.toLowerCase();
  }

  /**
   * Returns a new empty Guid instance.
   */
  static get empty(): MockGuid {
    return new MockGuid('00000000-0000-0000-0000-000000000000');
  }

  /**
   * Returns a new Guid instance with a pseudo-randomly generated GUID,
   * according to the version 4 UUID algorithm from RFC 4122.
   */
  static newGuid(): MockGuid {
    // Generate a version 4 UUID (not cryptographically secure, just for testing)
    return new MockGuid(
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }),
    );
  }

  /**
   * Parses the input string to construct a new Guid object.
   * If the string cannot be parsed, then an error is thrown.
   *
   * Accepts formats:
   * - "d5369f3bbd7a412a9c0f7f0650bb5489"
   * - "d5369f3b-bd7a-412a-9c0f-7f0650bb5489"
   * - "{d5369f3b-bd7a-412a-9c0f-7f0650bb5489}"
   * - "/Guid(d5369f3b-bd7a-412a-9c0f-7f0650bb5489)/"
   */
  static parse(guidString: string | undefined | null): MockGuid {
    const result = MockGuid.tryParse(guidString);
    if (!result) {
      throw new Error(`Invalid GUID string: ${guidString}`);
    }
    return result;
  }

  /**
   * Attempts to parse the input string to construct a new Guid object.
   * If the string cannot be parsed, then undefined is returned.
   */
  static tryParse(guid: string | undefined | null): MockGuid | undefined {
    if (!guid) {
      return undefined;
    }

    const normalized = MockGuid._normalize(guid);
    if (!normalized || !MockGuid._guidRegEx.test(normalized)) {
      return undefined;
    }

    // Ensure proper format with dashes
    const cleaned = normalized.replace(/-/g, '');
    const formatted = `${cleaned.substr(0, 8)}-${cleaned.substr(8, 4)}-${cleaned.substr(12, 4)}-${cleaned.substr(16, 4)}-${cleaned.substr(20, 12)}`;

    return new MockGuid(formatted);
  }

  /**
   * Indicates whether a GUID is valid, i.e. whether it would be successfully
   * parsed by Guid.tryParse().
   */
  static isValid(guid: string | undefined | null): boolean {
    return MockGuid.tryParse(guid) !== undefined;
  }

  /**
   * Normalize GUIDs in SharePoint formats:
   * - Guid(...) -> ...
   * - /Guid(...)/ -> ...
   * - {...} -> ...
   */
  private static _normalize(guid: string): string {
    let normalized = guid.trim();

    // Remove /Guid(...)/ wrapper
    if (normalized.startsWith('/Guid(') && normalized.endsWith(')/')) {
      normalized = normalized.substring(6, normalized.length - 2);
    }
    // Remove Guid(...) wrapper
    else if (normalized.startsWith('Guid(') && normalized.endsWith(')')) {
      normalized = normalized.substring(5, normalized.length - 1);
    }

    // Remove curly braces
    if (normalized.startsWith('{') && normalized.endsWith('}')) {
      normalized = normalized.substring(1, normalized.length - 1);
    }

    return normalized.trim();
  }

  /**
   * Compare this instance to another Guid instance
   */
  equals(guid: MockGuid): boolean {
    return this._guid === guid._guid;
  }

  /**
   * Returns a string representation of the GUID in lowercase hexadecimal without braces.
   * Example: 'd5369f3b-bd7a-412a-9c0f-7f0650bb5489'
   */
  toString(): string {
    return this._guid;
  }
}
