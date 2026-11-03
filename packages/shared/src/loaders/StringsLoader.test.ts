import { describe, expect, it } from 'vitest';

import { StringsLoader } from './StringsLoader';

// The path lookups are pure; they are private because only loadStrings() needs them
interface IStringsLoaderInternals {
  findStringsResources(
    scriptResources: Record<string, unknown>,
    entryModuleId?: string,
    localeOverride?: string,
  ): { moduleName: string; path: string }[];
}

const loader = new StringsLoader('https://localhost:4321') as unknown as IStringsLoaderInternals;

describe('StringsLoader.findStringsResources', () => {
  it('reads the expanded localizedPath form', () => {
    const resources = {
      'my-strings': {
        type: 'localizedPath',
        defaultPath: 'my-strings_en-us.js',
        paths: { 'en-US': 'my-strings_en-us.js', 'fr-FR': 'my-strings_fr-fr.js' },
      },
    };
    expect(loader.findStringsResources(resources, undefined, 'fr-fr')).toEqual([
      { moduleName: 'my-strings', path: 'my-strings_fr-fr.js' },
    ]);
  });

  it('reads the compact localizedPath form gulp serve emits', () => {
    const resources = {
      AllStrings: {
        type: 'localizedPath',
        defaultPath: 'AllStrings_en-us.js',
        paths: { p: 'AllStrings_', l: { 'en-US': 'en-us', 'pt-PT': 'pt-pt' }, s: '.js' },
      },
    };
    expect(loader.findStringsResources(resources, undefined, 'pt-PT')).toEqual([
      { moduleName: 'AllStrings', path: 'AllStrings_pt-pt.js' },
    ]);
  });

  it('falls back to the default path for an unknown locale', () => {
    const resources = {
      AllStrings: {
        type: 'localizedPath',
        defaultPath: 'AllStrings_en-us.js',
        paths: { p: 'AllStrings_', l: { 'en-US': 'en-us' }, s: '.js' },
      },
    };
    expect(loader.findStringsResources(resources, undefined, 'de-de')).toEqual([
      { moduleName: 'AllStrings', path: 'AllStrings_en-us.js' },
    ]);
    expect(loader.findStringsResources(resources)).toEqual([
      { moduleName: 'AllStrings', path: 'AllStrings_en-us.js' },
    ]);
  });

  it('returns every strings module of a bundle, not only the first', () => {
    const resources = {
      ControlStrings: { type: 'localizedPath', defaultPath: 'ControlStrings_en-us.js', paths: {} },
      AllStrings: { type: 'localizedPath', defaultPath: 'AllStrings_en-us.js', paths: {} },
    };
    expect(loader.findStringsResources(resources).map((r) => r.moduleName)).toEqual([
      'ControlStrings',
      'AllStrings',
    ]);
  });

  it('treats only "...Strings" path resources as strings, and skips the entry module', () => {
    const resources = {
      'my-web-part': { type: 'path', path: 'my-web-part.js' },
      'react-bundle': { type: 'path', path: 'react.js' },
      MyStrings: { type: 'path', path: 'MyStrings_en-us.js' },
      EntryStrings: { type: 'path', path: 'EntryStrings.js' },
    };
    expect(loader.findStringsResources(resources, 'EntryStrings')).toEqual([
      { moduleName: 'MyStrings', path: 'MyStrings_en-us.js' },
    ]);
  });
});
