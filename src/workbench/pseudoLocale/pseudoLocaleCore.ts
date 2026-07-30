import { parse } from 'acorn';
import type {
  ArrowFunctionExpression,
  CallExpression,
  ExpressionStatement,
  FunctionExpression,
  ObjectExpression,
  Program,
  Property,
  SpreadElement,
} from 'acorn';

const SOURCE_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const PSEUDO_LOWERCASE = 'àƀċďēƒĝĥîĵķļmńōƥqŕśţûvwxŷž';
const SOURCE_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PSEUDO_UPPERCASE = 'ÀƁĊĎĒƑĜĤÎĴĶĻMŃŌƤQŔŚŢÛVWXŶŽ';
const PLACEHOLDER_PATTERN = /\{[^{}\r\n]+\}/g;
const WINDOWS_RESERVED_NAME_PATTERN = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const INVALID_FILENAME_CHARACTER_PATTERN = /[<>:"/\\|?*\u0000-\u001f]/;

const CHARACTER_MAP = new Map<string, string>([
  ...Array.from(
    SOURCE_LOWERCASE,
    (character, index) => [character, PSEUDO_LOWERCASE[index]] as const,
  ),
  ...Array.from(
    SOURCE_UPPERCASE,
    (character, index) => [character, PSEUDO_UPPERCASE[index]] as const,
  ),
]);

const graphemeSegmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

/** Reasons a pseudo-locale filename can be rejected. */
export type PseudoLocaleNameValidationError =
  | 'empty'
  | 'whitespace'
  | 'invalidCharacters'
  | 'dotSegment'
  | 'trailingPeriod'
  | 'reservedName'
  | 'includesExtension';

/** Reasons a source locale file can be rejected. */
export type PseudoLocaleSourceErrorCode =
  | 'invalidJavaScript'
  | 'invalidAmdShape'
  | 'unsupportedProperty';

/** URI components used for case-insensitive resource comparison. */
export interface IResourceUriComponents {
  scheme: string;
  authority: string;
  path: string;
}

/** Error thrown when a locale source cannot be safely transformed. */
export class PseudoLocaleSourceError extends Error {
  public constructor(
    public readonly code: PseudoLocaleSourceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'PseudoLocaleSourceError';
  }
}

/** Apply the deterministic pseudo-locale accent map while preserving placeholders. */
export function accentPseudoLocaleText(value: string): string {
  let result = '';
  let cursor = 0;

  for (const match of value.matchAll(PLACEHOLDER_PATTERN)) {
    const matchIndex = match.index;
    result += accentPlainText(value.slice(cursor, matchIndex));
    result += match[0];
    cursor = matchIndex + match[0].length;
  }

  result += accentPlainText(value.slice(cursor));
  return result;
}

/** Generate a pseudo-localized string using SPFx-style expansion delimiters. */
export function pseudoLocalizeString(value: string, expansionPercent: number): string {
  validateExpansionPercent(expansionPercent);

  if (value.length === 0) {
    return value;
  }

  const graphemeLength = Array.from(graphemeSegmenter.segment(value)).length;
  const bangCount = Math.max(4, Math.ceil((graphemeLength * expansionPercent) / 100));
  const leadingBangCount = Math.floor(bangCount / 2);
  const trailingBangCount = bangCount - leadingBangCount;

  return `[${'!'.repeat(leadingBangCount)}${accentPseudoLocaleText(value)}${'!'.repeat(
    trailingBangCount,
  )}]`;
}

/** Transform the string values in a standard AMD locale source file. */
export function transformPseudoLocaleSource(source: string, expansionPercent: number): string {
  validateExpansionPercent(expansionPercent);

  const program = parseLocaleProgram(source);
  const localeObject = findLocaleObject(program);
  const replacements = localeObject.properties.map((property) =>
    createPropertyReplacement(source, property, expansionPercent),
  );

  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce(
      (result, replacement) =>
        `${result.slice(0, replacement.start)}${replacement.value}${result.slice(replacement.end)}`,
      source,
    );
}

/** Validate a pseudo-locale name without its `.js` extension. */
export function validatePseudoLocaleName(
  value: string,
): PseudoLocaleNameValidationError | undefined {
  if (value.length === 0) {
    return 'empty';
  }

  if (/\s/u.test(value)) {
    return 'whitespace';
  }

  if (value.toLowerCase().endsWith('.js')) {
    return 'includesExtension';
  }

  if (value === '.' || value === '..') {
    return 'dotSegment';
  }

  if (value.endsWith('.')) {
    return 'trailingPeriod';
  }

  if (INVALID_FILENAME_CHARACTER_PATTERN.test(value)) {
    return 'invalidCharacters';
  }

  if (WINDOWS_RESERVED_NAME_PATTERN.test(value)) {
    return 'reservedName';
  }

  return undefined;
}

/** Compare URI components using the feature's case-insensitive resource matching rules. */
export function areResourceUrisEqual(
  first: IResourceUriComponents,
  second: IResourceUriComponents,
): boolean {
  return (
    first.scheme.toLowerCase() === second.scheme.toLowerCase() &&
    first.authority.toLowerCase() === second.authority.toLowerCase() &&
    first.path.toLowerCase() === second.path.toLowerCase()
  );
}

/** Determine whether a resource path identifies a folder named `loc`. */
export function isLocFolderPath(resourcePath: string): boolean {
  const pathParts = getResourcePathParts(resourcePath);
  return pathParts.at(-1)?.toLowerCase() === 'loc';
}

/** Determine whether a resource path identifies a direct JavaScript child of a `loc` folder. */
export function isDirectLocaleJavaScriptPath(resourcePath: string): boolean {
  const pathParts = getResourcePathParts(resourcePath);
  return (
    pathParts.at(-2)?.toLowerCase() === 'loc' &&
    pathParts.at(-1)?.toLowerCase().endsWith('.js') === true
  );
}

interface ISourceReplacement {
  start: number;
  end: number;
  value: string;
}

function getResourcePathParts(resourcePath: string): string[] {
  return resourcePath.split(/[\\/]/u).filter((part) => part.length > 0);
}

function accentPlainText(value: string): string {
  return Array.from(value, (character) => CHARACTER_MAP.get(character) ?? character).join('');
}

function validateExpansionPercent(expansionPercent: number): void {
  if (!Number.isFinite(expansionPercent) || expansionPercent < 0 || expansionPercent > 400) {
    throw new RangeError('Expansion percent must be a finite number from 0 through 400.');
  }
}

function parseLocaleProgram(source: string): Program {
  try {
    return parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  } catch (error: unknown) {
    throw new PseudoLocaleSourceError(
      'invalidJavaScript',
      'The source locale is not valid JavaScript.',
      { cause: error },
    );
  }
}

function findLocaleObject(program: Program): ObjectExpression {
  const expressionStatements = program.body.filter(
    (statement): statement is ExpressionStatement => statement.type === 'ExpressionStatement',
  );

  if (expressionStatements.length !== 1) {
    throwInvalidAmdShape();
  }

  const expression = expressionStatements[0].expression;
  if (
    expression.type !== 'CallExpression' ||
    expression.callee.type !== 'Identifier' ||
    expression.callee.name !== 'define'
  ) {
    throwInvalidAmdShape();
  }

  const factory = getFactoryFunction(expression);
  if (factory.body.type !== 'BlockStatement') {
    throwInvalidAmdShape();
  }

  const returnStatements = factory.body.body.filter(
    (statement) => statement.type === 'ReturnStatement',
  );
  if (returnStatements.length !== 1 || returnStatements[0].argument?.type !== 'ObjectExpression') {
    throwInvalidAmdShape();
  }

  return returnStatements[0].argument;
}

function getFactoryFunction(
  callExpression: CallExpression,
): FunctionExpression | ArrowFunctionExpression {
  const factory = callExpression.arguments.at(-1);
  if (
    !factory ||
    (factory.type !== 'FunctionExpression' && factory.type !== 'ArrowFunctionExpression')
  ) {
    throwInvalidAmdShape();
  }

  return factory;
}

function createPropertyReplacement(
  source: string,
  property: Property | SpreadElement,
  expansionPercent: number,
): ISourceReplacement {
  if (
    property.type !== 'Property' ||
    property.kind !== 'init' ||
    property.method ||
    property.shorthand ||
    property.computed ||
    (property.key.type !== 'Identifier' &&
      !(property.key.type === 'Literal' && typeof property.key.value === 'string')) ||
    property.value.type !== 'Literal' ||
    typeof property.value.value !== 'string'
  ) {
    throw new PseudoLocaleSourceError(
      'unsupportedProperty',
      'Locale objects must contain only non-computed string properties.',
    );
  }

  const quote = source[property.value.start];
  if (quote !== "'" && quote !== '"') {
    throw new PseudoLocaleSourceError(
      'unsupportedProperty',
      'Locale string values must use single or double quotes.',
    );
  }

  if (property.value.value.length === 0) {
    return {
      start: property.value.start,
      end: property.value.end,
      value: source.slice(property.value.start, property.value.end),
    };
  }

  return {
    start: property.value.start,
    end: property.value.end,
    value: quoteJavaScriptString(
      pseudoLocalizeString(property.value.value, expansionPercent),
      quote,
    ),
  };
}

function quoteJavaScriptString(value: string, quote: "'" | '"'): string {
  let result = quote;

  for (const character of value) {
    if (character === '\\') {
      result += '\\\\';
    } else if (character === quote) {
      result += `\\${quote}`;
    } else if (character === '\n') {
      result += '\\n';
    } else if (character === '\r') {
      result += '\\r';
    } else if (character === '\t') {
      result += '\\t';
    } else if (character === '\b') {
      result += '\\b';
    } else if (character === '\f') {
      result += '\\f';
    } else {
      const codePoint = character.codePointAt(0);
      if (
        codePoint !== undefined &&
        (codePoint < 0x20 || codePoint === 0x2028 || codePoint === 0x2029)
      ) {
        result += `\\u${codePoint.toString(16).padStart(4, '0')}`;
      } else {
        result += character;
      }
    }
  }

  return `${result}${quote}`;
}

function throwInvalidAmdShape(): never {
  throw new PseudoLocaleSourceError(
    'invalidAmdShape',
    'The source locale must be an AMD module whose factory returns a flat object.',
  );
}
