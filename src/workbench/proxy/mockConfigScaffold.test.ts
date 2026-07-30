import * as fs from 'node:fs';
import * as path from 'node:path';

import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

import { createMockConfigScaffold } from './mockConfigScaffold';

interface IJsonValidationContribution {
  fileMatch: string | string[];
  url: string;
}

interface IExtensionManifest {
  contributes?: {
    jsonValidation?: IJsonValidationContribution[];
  };
}

function readJson(relativePath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8'),
  ) as unknown;
}

describe('mock config scaffold schema', () => {
  it('associates generated api-mocks.json files with the bundled schema', () => {
    const manifest = readJson('package.json') as IExtensionManifest;
    expect(manifest.contributes?.jsonValidation).toContainEqual({
      fileMatch: '**/api-mocks.json',
      url: './schemas/api-mocks.schema.json',
    });
  });

  it('validates the exact generated starter against the bundled schema', () => {
    const schema = readJson('schemas/api-mocks.schema.json') as object;
    const validate = new Ajv().compile(schema);

    expect(validate(createMockConfigScaffold()), JSON.stringify(validate.errors)).toBe(true);
  });
});
