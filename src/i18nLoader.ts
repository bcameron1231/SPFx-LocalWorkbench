import * as fs from 'fs';
import * as path from 'path';

export function loadPackageNls(extensionPath: string, language?: string): Record<string, string> {
    const result: Record<string, string> = {};
    const defaultFile = path.join(extensionPath, 'package.nls.json');
    try {
        if (fs.existsSync(defaultFile)) {
            const txt = fs.readFileSync(defaultFile, 'utf8');
            Object.assign(result, JSON.parse(txt));
        }
    } catch {
        // ignore
    }

    if (!language) { return result; }
    const candidates = [language];
    if (language.indexOf('-') !== -1) {
        candidates.push(language.split('-')[0]);
    }

    for (const cand of candidates) {
        const file = path.join(extensionPath, `package.nls.${cand}.json`);
        try {
            if (fs.existsSync(file)) {
                const txt = fs.readFileSync(file, 'utf8');
                const obj = JSON.parse(txt);
                Object.assign(result, obj);
                break; // prefer first matching locale
            }
        } catch {
            // ignore parse errors
        }
    }

    return result;
}
