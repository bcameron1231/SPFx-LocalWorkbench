import * as vscode from 'vscode';

import { getErrorMessage, logger } from '@spfx-local-workbench/shared';
import { localize } from '@spfx-local-workbench/shared/utils/node';

import {
  PseudoLocaleSourceError,
  areResourceUrisEqual,
  isDirectLocaleJavaScriptPath,
  isLocFolderPath,
  transformPseudoLocaleSource,
  validatePseudoLocaleName,
} from './pseudoLocaleCore';
import type { PseudoLocaleNameValidationError } from './pseudoLocaleCore';

/** Default pseudo-locale length expansion recommended by the SPFx guidance. */
export const DEFAULT_PSEUDO_LOCALE_EXPANSION_PERCENT = 35;

const log = logger.createChild('PseudoLocaleGenerator');

/** Run the pseudo-locale generation wizard for an Explorer or editor resource. */
export async function generatePseudoLocale(resource?: vscode.Uri): Promise<boolean> {
  try {
    const contextResource = resource ?? vscode.window.activeTextEditor?.document.uri;
    if (!contextResource) {
      vscode.window.showErrorMessage(
        localize(
          'pseudoLocale.error.noResource',
          'Run this command from a loc folder or a JavaScript file inside one.',
        ),
      );
      return false;
    }

    const localeContext = await resolveLocaleContext(contextResource);
    if (!localeContext) {
      vscode.window.showErrorMessage(
        localize(
          'pseudoLocale.error.invalidResource',
          'The selected resource must be a loc folder or a JavaScript file directly inside one.',
        ),
      );
      return false;
    }

    const locEntries = await getLocEntries(localeContext.locUri);
    const localeFiles = locEntries
      .filter(
        ({ filename, fileType }) =>
          filename.toLowerCase().endsWith('.js') && (fileType & vscode.FileType.Directory) === 0,
      )
      .sort(compareLocaleFiles);
    if (localeFiles.length === 0) {
      vscode.window.showErrorMessage(
        localize(
          'pseudoLocale.error.noLocaleFiles',
          'The selected loc folder does not contain any JavaScript locale files.',
        ),
      );
      return false;
    }

    const sourceUri = localeContext.sourceUri ?? (await promptForSourceLocale(localeFiles));
    if (!sourceUri) {
      return false;
    }

    const pseudoLocaleName = await promptForPseudoLocaleName(sourceUri);
    if (!pseudoLocaleName) {
      return false;
    }

    const targetFilename = `${pseudoLocaleName}.js`;
    const existingTarget = locEntries.find(
      ({ filename }) => filename.toLowerCase() === targetFilename.toLowerCase(),
    );
    const targetUri = vscode.Uri.joinPath(
      localeContext.locUri,
      existingTarget?.filename ?? targetFilename,
    );

    if (areResourceUrisEqual(sourceUri, targetUri)) {
      vscode.window.showErrorMessage(
        localize(
          'pseudoLocale.error.sameFile',
          'The pseudo locale name must be different from the source locale filename.',
        ),
      );
      return false;
    }

    if (existingTarget && (existingTarget.fileType & vscode.FileType.Directory) !== 0) {
      vscode.window.showErrorMessage(
        localize(
          'pseudoLocale.error.targetIsFolder',
          'A folder named {0} already exists in this loc folder.',
          targetFilename,
        ),
      );
      return false;
    }

    const dirtyTargetDocument = vscode.workspace.textDocuments.find(
      (document) => document.isDirty && areResourceUrisEqual(document.uri, targetUri),
    );
    if (dirtyTargetDocument) {
      vscode.window.showErrorMessage(
        localize(
          'pseudoLocale.error.targetDirty',
          'Save or revert the existing {0} file before overwriting it.',
          targetFilename,
        ),
      );
      return false;
    }

    const source = await readSourceText(sourceUri);
    const expansionPercent = getExpansionPercent(localeContext.locUri);
    const generatedSource = transformPseudoLocaleSource(source, expansionPercent);

    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(generatedSource, 'utf-8'));
    const openFileLabel = localize('pseudoLocale.action.openFile', 'Open file');
    const selectedAction = await vscode.window.showInformationMessage(
      localize('pseudoLocale.success', 'Pseudo locale {0} generated successfully.', targetFilename),
      openFileLabel,
    );
    if (selectedAction === openFileLabel) {
      try {
        await vscode.window.showTextDocument(targetUri);
      } catch (error: unknown) {
        log.error('Pseudo locale was generated but could not be opened:', error);
        vscode.window.showErrorMessage(
          localize(
            'pseudoLocale.error.openFile',
            'The pseudo locale was generated, but {0} could not be opened: {1}',
            targetFilename,
            getErrorMessage(error),
          ),
        );
      }
    }
    return true;
  } catch (error: unknown) {
    log.error('Failed to generate pseudo locale:', error);
    vscode.window.showErrorMessage(getGenerationErrorMessage(error));
    return false;
  }
}

interface ILocaleContext {
  locUri: vscode.Uri;
  sourceUri?: vscode.Uri;
}

interface ILocEntry {
  filename: string;
  uri: vscode.Uri;
  fileType: vscode.FileType;
}

async function resolveLocaleContext(resource: vscode.Uri): Promise<ILocaleContext | undefined> {
  const stat = await vscode.workspace.fs.stat(resource);
  const isDirectory = (stat.type & vscode.FileType.Directory) !== 0;

  if (isDirectory) {
    return isLocFolderPath(resource.path) ? { locUri: resource } : undefined;
  }

  const locUri = vscode.Uri.joinPath(resource, '..');
  if (isDirectLocaleJavaScriptPath(resource.path)) {
    return { locUri, sourceUri: resource };
  }

  return undefined;
}

async function getLocEntries(locUri: vscode.Uri): Promise<ILocEntry[]> {
  const entries = await vscode.workspace.fs.readDirectory(locUri);

  return entries.map(([filename, fileType]) => ({
    filename,
    uri: vscode.Uri.joinPath(locUri, filename),
    fileType,
  }));
}

function compareLocaleFiles(left: ILocEntry, right: ILocEntry): number {
  const leftIsDefault = left.filename.toLowerCase() === 'en-us.js';
  const rightIsDefault = right.filename.toLowerCase() === 'en-us.js';
  if (leftIsDefault !== rightIsDefault) {
    return leftIsDefault ? -1 : 1;
  }
  return left.filename.localeCompare(right.filename, undefined, { sensitivity: 'base' });
}

async function promptForSourceLocale(localeFiles: ILocEntry[]): Promise<vscode.Uri | undefined> {
  const selection = await vscode.window.showQuickPick(
    localeFiles.map(({ filename, uri }) => ({ label: filename, uri })),
    {
      title: localize('pseudoLocale.source.title', 'Generate pseudo locale: Source locale'),
      placeHolder: localize(
        'pseudoLocale.source.placeholder',
        'Select the locale to pseudo-localize',
      ),
      ignoreFocusOut: true,
    },
  );

  return selection?.uri;
}

async function promptForPseudoLocaleName(sourceUri: vscode.Uri): Promise<string | undefined> {
  const sourceFilename = getUriBasename(sourceUri).toLowerCase();

  return vscode.window.showInputBox({
    title: localize('pseudoLocale.name.title', 'Generate pseudo locale: Locale name'),
    prompt: localize(
      'pseudoLocale.name.prompt',
      'Enter the pseudo locale name without the .js extension',
    ),
    value: 'qps-ploc',
    ignoreFocusOut: true,
    validateInput: (value) => {
      const validationError = validatePseudoLocaleName(value);
      if (validationError) {
        return getNameValidationMessage(validationError);
      }

      if (`${value}.js`.toLowerCase() === sourceFilename) {
        return localize(
          'pseudoLocale.name.validation.sameFile',
          'The pseudo locale name must be different from the source locale filename.',
        );
      }

      return undefined;
    },
  });
}

async function readSourceText(sourceUri: vscode.Uri): Promise<string> {
  const openDocument = vscode.workspace.textDocuments.find((document) =>
    areResourceUrisEqual(document.uri, sourceUri),
  );
  if (openDocument) {
    return openDocument.getText();
  }

  const bytes = await vscode.workspace.fs.readFile(sourceUri);
  return Buffer.from(bytes).toString('utf-8');
}

function getExpansionPercent(resource: vscode.Uri): number {
  const configuredValue = vscode.workspace
    .getConfiguration('spfxLocalWorkbench.pseudoLocale', resource)
    .get<number>('lengthExpansionPercent', DEFAULT_PSEUDO_LOCALE_EXPANSION_PERCENT);

  if (!Number.isFinite(configuredValue) || configuredValue < 0 || configuredValue > 400) {
    log.warn(
      `Invalid pseudo-locale expansion percent "${configuredValue}"; using ${DEFAULT_PSEUDO_LOCALE_EXPANSION_PERCENT}.`,
    );
    return DEFAULT_PSEUDO_LOCALE_EXPANSION_PERCENT;
  }

  return configuredValue;
}

function getNameValidationMessage(error: PseudoLocaleNameValidationError): string {
  switch (error) {
    case 'empty':
      return localize('pseudoLocale.name.validation.empty', 'Enter a pseudo locale name.');
    case 'whitespace':
      return localize(
        'pseudoLocale.name.validation.whitespace',
        'The pseudo locale name cannot contain whitespace.',
      );
    case 'invalidCharacters':
      return localize(
        'pseudoLocale.name.validation.invalidCharacters',
        'The pseudo locale name contains characters that are not valid in filenames.',
      );
    case 'dotSegment':
      return localize(
        'pseudoLocale.name.validation.dotSegment',
        'The pseudo locale name cannot be . or ..',
      );
    case 'trailingPeriod':
      return localize(
        'pseudoLocale.name.validation.trailingPeriod',
        'The pseudo locale name cannot end with a period.',
      );
    case 'reservedName':
      return localize(
        'pseudoLocale.name.validation.reservedName',
        'The pseudo locale name is reserved by Windows.',
      );
    case 'includesExtension':
      return localize(
        'pseudoLocale.name.validation.includesExtension',
        'Enter the pseudo locale name without the .js extension.',
      );
  }
}

function getGenerationErrorMessage(error: unknown): string {
  if (error instanceof PseudoLocaleSourceError) {
    switch (error.code) {
      case 'invalidJavaScript':
        return localize(
          'pseudoLocale.error.invalidJavaScript',
          'The selected locale file is not valid JavaScript.',
        );
      case 'invalidAmdShape':
        return localize(
          'pseudoLocale.error.invalidAmdShape',
          'The selected locale must be an AMD module whose factory returns a flat object.',
        );
      case 'unsupportedProperty':
        return localize(
          'pseudoLocale.error.unsupportedProperty',
          'The selected locale must contain only non-computed string properties.',
        );
    }
  }

  return localize(
    'pseudoLocale.error.generate',
    'Failed to generate the pseudo locale: {0}',
    getErrorMessage(error),
  );
}

function getUriBasename(uri: vscode.Uri): string {
  const lastSlashIndex = uri.path.lastIndexOf('/');
  return uri.path.slice(lastSlashIndex + 1);
}
