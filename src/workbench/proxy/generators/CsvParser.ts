export interface CsvParseWarning {
    /** 1-based row number. */
    row: number;
    message: string;
}

export interface CsvParseSuccess {
    ok: true;
    rows: Record<string, string>[];
    warnings: CsvParseWarning[];
}

export interface CsvParseError {
    ok: false;
    error: string;
    warnings: CsvParseWarning[];
}

export type CsvParseResult = CsvParseSuccess | CsvParseError;

export interface CsvParseOptions {
    delimiter?: string;
    maxRows?: number;
}

/**
 * Parses CSV text into an array of key-value row objects.
 * Returns a result union — check `result.ok` before accessing rows.
 */
export function parseCsv(text: string, options?: CsvParseOptions): CsvParseResult {
    const delimiter = options?.delimiter ?? ',';
    const maxRows = options?.maxRows ?? 0;
    const warnings: CsvParseWarning[] = [];

    // Strip UTF-8 BOM
    const cleaned = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;

    // State-machine tokeniser — walks the string character-by-character
    let fields: string[][] = [];
    let currentField = '';
    let currentRow: string[] = [];
    let inQuotes = false;
    let rowStart = 1;
    let pos = 0;

    while (pos < cleaned.length) {
        const ch = cleaned[pos];

        if (inQuotes) {
            if (ch === '"') {
                // Escaped quote ("") vs closing quote
                if (pos + 1 < cleaned.length && cleaned[pos + 1] === '"') {
                    currentField += '"';
                    pos += 2;
                    continue;
                }
                inQuotes = false;
                pos++;

                // After closing quote we expect delimiter, newline, or EOF — anything else is malformed
                if (pos < cleaned.length) {
                    const next = cleaned[pos];
                    if (next !== delimiter && next !== '\r' && next !== '\n') {
                        warnings.push({
                            row: rowStart,
                            message: `Unexpected character '${next}' after closing quote (position ${pos}). Content may be misaligned.`,
                        });
                        // Consume until the next delimiter/newline so we don't lose data
                        while (pos < cleaned.length && cleaned[pos] !== delimiter && cleaned[pos] !== '\r' && cleaned[pos] !== '\n') {
                            currentField += cleaned[pos];
                            pos++;
                        }
                    }
                }
                continue;
            }
            currentField += ch;
            pos++;
            continue;
        }

        if (ch === '"') {
            if (currentField.length > 0) {
                // Mid-field quote isn't valid RFC 4180 but happens in the wild
                warnings.push({
                    row: rowStart,
                    message: `Quote encountered in the middle of an unquoted field (position ${pos}). Treating remainder as quoted.`,
                });
            }
            inQuotes = true;
            pos++;
            continue;
        }

        if (ch === delimiter) {
            currentRow.push(currentField);
            currentField = '';
            pos++;
            continue;
        }

        if (ch === '\r' || ch === '\n') {
            // Treat \r\n as one line break
            if (ch === '\r' && pos + 1 < cleaned.length && cleaned[pos + 1] === '\n') {
                pos++;
            }
            currentRow.push(currentField);
            currentField = '';
            fields.push(currentRow);
            currentRow = [];
            rowStart = fields.length + 1;
            pos++;

            if (maxRows > 0 && fields.length > maxRows) {
                break;
            }
            continue;
        }

        currentField += ch;
        pos++;
    }

    // Flush last row if file didn't end with a newline
    if (currentRow.length > 0 || currentField.length > 0) {
        currentRow.push(currentField);
        fields.push(currentRow);
    }

    if (inQuotes) {
        return {
            ok: false,
            error: `Unterminated quoted field starting around row ${rowStart}. Ensure all opening quotes have a matching closing quote.`,
            warnings,
        };
    }

    // Drop blank lines
    fields = fields.filter(row => !(row.length === 1 && row[0].trim() === ''));

    if (fields.length === 0) {
        return { ok: false, error: 'The CSV text is empty.', warnings };
    }

    if (fields.length < 2) {
        return { ok: false, error: 'The CSV text contains a header row but no data rows.', warnings };
    }

    // Build row objects from headers + data
    const headers = fields[0].map(h => h.trim());

    const emptyHeaderIndices = headers
        .map((h, i) => (h === '' ? i + 1 : -1))
        .filter(i => i !== -1);
    if (emptyHeaderIndices.length > 0) {
        warnings.push({
            row: 1,
            message: `Empty header(s) in column(s) ${emptyHeaderIndices.join(', ')}. Rows will have empty-string keys for those columns.`,
        });
    }

    const seen = new Set<string>();
    for (const h of headers) {
        if (seen.has(h)) {
            warnings.push({ row: 1, message: `Duplicate header "${h}". Last value wins for each row.` });
        }
        seen.add(h);
    }

    const rows: Record<string, string>[] = [];
    const headerCount = headers.length;

    for (let i = 1; i < fields.length; i++) {
        const values = fields[i];

        if (values.length !== headerCount) {
            warnings.push({
                row: i + 1,
                message: `Expected ${headerCount} field(s) but found ${values.length}. Missing fields default to empty strings; extra fields are ignored.`,
            });
        }

        const row: Record<string, string> = {};
        for (let j = 0; j < headerCount; j++) {
            row[headers[j]] = values[j] ?? '';
        }
        rows.push(row);
    }

    return { ok: true, rows, warnings };
}
