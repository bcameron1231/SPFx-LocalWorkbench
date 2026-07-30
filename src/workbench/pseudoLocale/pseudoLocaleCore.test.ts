import { describe, expect, it } from 'vitest';

import {
  PseudoLocaleSourceError,
  accentPseudoLocaleText,
  areResourceUrisEqual,
  isDirectLocaleJavaScriptPath,
  isLocFolderPath,
  pseudoLocalizeString,
  transformPseudoLocaleSource,
  validatePseudoLocaleName,
} from './pseudoLocaleCore';

describe('accentPseudoLocaleText', () => {
  it('matches the supplied helloStorybook accent style', () => {
    expect(accentPseudoLocaleText('Dark theme')).toBe('Ďàŕķ ţĥēmē');
    expect(accentPseudoLocaleText('Description')).toBe('Ďēśċŕîƥţîōń');
    expect(
      accentPseudoLocaleText('The app is running on your local environment as SharePoint web part'),
    ).toBe('Ţĥē àƥƥ îś ŕûńńîńĝ ōń ŷōûŕ ļōċàļ ēńvîŕōńmēńţ àś ŚĥàŕēƤōîńţ wēƀ ƥàŕţ');
  });

  it('preserves named and numbered placeholders', () => {
    expect(accentPseudoLocaleText('Hello {name}, item {0}')).toBe('Ĥēļļō {name}, îţēm {0}');
  });
});

describe('pseudoLocalizeString', () => {
  it('matches the supplied short-string delimiter style at 35 percent', () => {
    expect(pseudoLocalizeString('Dark theme', 35)).toBe('[!!Ďàŕķ ţĥēmē!!]');
  });

  it('uses the minimum four bangs at zero percent', () => {
    expect(pseudoLocalizeString('Hello', 0)).toBe('[!!Ĥēļļō!!]');
  });

  it('puts an odd extra bang on the suffix', () => {
    expect(pseudoLocalizeString('abcdefghijklmnopqrst', 35)).toBe('[!!!àƀċďēƒĝĥîĵķļmńōƥqŕśţ!!!!]');
  });

  it('accepts decimal and maximum expansion percentages', () => {
    expect(pseudoLocalizeString('abcdefghij', 45.5)).toBe('[!!àƀċďēƒĝĥîĵ!!!]');
    expect(pseudoLocalizeString('ab', 400)).toBe('[!!!!àƀ!!!!]');
  });

  it('counts Unicode grapheme clusters for expansion', () => {
    expect(pseudoLocalizeString('a\u0301bcdefghijklmno', 35)).toBe('[!!!à́ƀċďēƒĝĥîĵķļmńō!!!]');
  });

  it('leaves empty strings empty', () => {
    expect(pseudoLocalizeString('', 35)).toBe('');
  });

  it('rejects percentages outside the supported range', () => {
    expect(() => pseudoLocalizeString('Hello', -1)).toThrow(RangeError);
    expect(() => pseudoLocalizeString('Hello', 401)).toThrow(RangeError);
    expect(() => pseudoLocalizeString('Hello', Number.NaN)).toThrow(RangeError);
  });
});

describe('transformPseudoLocaleSource', () => {
  it('preserves structure, comments, quote style, and empty values', () => {
    const source = `define([], function() {
  return {
    // Keep this comment
    DarkTheme: "Dark theme",
    'Greeting': 'Hello {name}\\n',
    Message: 'It\\'s ready',
    Empty: ''
  };
});`;

    expect(transformPseudoLocaleSource(source, 35)).toBe(`define([], function() {
  return {
    // Keep this comment
    DarkTheme: "[!!Ďàŕķ ţĥēmē!!]",
    'Greeting': '[!!Ĥēļļō {name}\\n!!!]',
    Message: '[!!Îţ\\'ś ŕēàďŷ!!]',
    Empty: ''
  };
});`);
  });

  it('rejects malformed JavaScript', () => {
    expect(() => transformPseudoLocaleSource('define([', 35)).toThrow(PseudoLocaleSourceError);
  });

  it('rejects unsupported AMD shapes and dynamic values', () => {
    expect(() => transformPseudoLocaleSource('export default { A: "Hello" };', 35)).toThrow(
      PseudoLocaleSourceError,
    );
    expect(() =>
      transformPseudoLocaleSource('define([], function() { return { A: getValue() }; });', 35),
    ).toThrow(PseudoLocaleSourceError);
  });
});

describe('validatePseudoLocaleName', () => {
  it('accepts cross-platform-safe custom names', () => {
    expect(validatePseudoLocaleName('qps-ploc')).toBeUndefined();
    expect(validatePseudoLocaleName('custom.locale-1')).toBeUndefined();
  });

  it.each([
    ['', 'empty'],
    ['qps ploc', 'whitespace'],
    ['qps/ploc', 'invalidCharacters'],
    ['qps:ploc', 'invalidCharacters'],
    ['.', 'dotSegment'],
    ['qps-ploc.', 'trailingPeriod'],
    ['CON', 'reservedName'],
    ['lpt1.locale', 'reservedName'],
    ['qps-ploc.js', 'includesExtension'],
  ] as const)('rejects %j as %s', (value, expectedError) => {
    expect(validatePseudoLocaleName(value)).toBe(expectedError);
  });
});

describe('areResourceUrisEqual', () => {
  it('compares URI components case-insensitively', () => {
    expect(
      areResourceUrisEqual(
        { scheme: 'file', authority: '', path: '/Workspace/Extensions/Header/loc/qps-ploc.js' },
        { scheme: 'file', authority: '', path: '/workspace/extensions/header/LOC/QPS-PLOC.JS' },
      ),
    ).toBe(true);
  });

  it('distinguishes different resources', () => {
    expect(
      areResourceUrisEqual(
        { scheme: 'file', authority: '', path: '/workspace/one/loc/qps-ploc.js' },
        { scheme: 'file', authority: '', path: '/workspace/two/loc/qps-ploc.js' },
      ),
    ).toBe(false);
  });
});

describe('loc resource path detection', () => {
  it.each([
    '/project/src/webparts/hero/loc',
    '/project/src/extensions/header/LOC',
    '/project/src/libraryComponents/card/loc',
    'C:\\project\\src\\customComponents\\dashboard\\loc',
  ])('recognizes a loc folder under any component type: %s', (resourcePath) => {
    expect(isLocFolderPath(resourcePath)).toBe(true);
  });

  it.each([
    '/project/src/webparts/hero/loc/en-us.js',
    '/project/src/extensions/header/LOC/EN-US.JS',
    '/project/src/libraryComponents/card/loc/fr-fr.js',
    'C:\\project\\src\\customComponents\\dashboard\\loc\\de-de.js',
  ])('recognizes a direct locale file under any component type: %s', (resourcePath) => {
    expect(isDirectLocaleJavaScriptPath(resourcePath)).toBe(true);
  });

  it('rejects non-loc folders, nested locale files, and non-JavaScript files', () => {
    expect(isLocFolderPath('/project/src/extensions/header/assets')).toBe(false);
    expect(isDirectLocaleJavaScriptPath('/project/src/extensions/header/loc/nested/en-us.js')).toBe(
      false,
    );
    expect(isDirectLocaleJavaScriptPath('/project/src/extensions/header/loc/en-us.json')).toBe(
      false,
    );
  });
});
