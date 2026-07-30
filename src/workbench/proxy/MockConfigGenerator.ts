// Mock Config Generator
//
// Orchestrates the different mock data generators and manages the config file.
// Individual generators live in the ./generators/ folder:
//   - StatusStubGenerator   — wizard-driven status-code stubs
//   - JsonFileGenerator     — import a JSON file as response body
//   - CsvFileGenerator      — parse CSV rows into a JSON array response body
//   - RecordedRequestGenerator — generate rules from recorded unmatched requests
import * as path from 'path';
import * as vscode from 'vscode';

import {
  BASE_SCENARIO_LABEL,
  isReservedScenarioName,
  validateMockConfig,
} from '@spfx-local-workbench/shared';
import { localize } from '@spfx-local-workbench/shared/utils/node';

import {
  generateFromRecordedRequests,
  generateStatusStubs,
  importCsvFile,
  importJsonFile,
} from './generators';
import type { IRecordedRequest } from './generators';
import { appendMockRules } from './mockConfigDestinations';
import type { MockRuleDestination } from './mockConfigDestinations';
import type { IMockConfig, IMockRule } from './types';

// Re-export IRecordedRequest so existing consumers keep working.
export type { IRecordedRequest } from './generators';

/** Result of writing generated rules to Base rules or a scenario. */
export interface IMockRuleSaveResult {
  destinationLabel: string;
  ruleCount: number;
  scenarioName?: string;
}

type DestinationKind = 'base' | 'scenario' | 'new';

interface IDestinationQuickPickItem extends vscode.QuickPickItem {
  destinationType: DestinationKind;
  scenarioName?: string;
}

// ── Main Generator Class ───────────────────────────────────────────

export class MockConfigGenerator {
  private readonly _workspaceRoot: string;
  private readonly _mockFilePath: string;
  private readonly _activeScenarioName: string | undefined;

  constructor(
    workspaceRoot: string,
    mockFileRelative?: string,
    activeScenarioName?: string,
  ) {
    this._workspaceRoot = workspaceRoot;
    this._activeScenarioName = activeScenarioName;
    this._mockFilePath = path.join(
      workspaceRoot,
      mockFileRelative ?? '.spfx-workbench/api-mocks.json',
    );
  }

  // ── 1. Quick Status-Code Stubs ──────────────────────────────────

  async generateStatusStubs(): Promise<IMockRuleSaveResult | undefined> {
    const rules = await generateStatusStubs();
    if (!rules) {
      return undefined;
    }
    return this._saveRules(rules);
  }

  // ── 2. Import JSON File ─────────────────────────────────────────

  async importJsonFile(): Promise<IMockRuleSaveResult | undefined> {
    const rules = await importJsonFile(this._workspaceRoot);
    if (!rules) {
      return undefined;
    }
    return this._saveRules(rules);
  }

  // ── 3. Import CSV File ──────────────────────────────────────────

  async importCsvFile(): Promise<IMockRuleSaveResult | undefined> {
    const rules = await importCsvFile();
    if (!rules) {
      return undefined;
    }
    return this._saveRules(rules);
  }

  // ── 4. Generate Rules from Recorded Requests ────────────────────

  async generateFromRecordedRequests(
    requests: IRecordedRequest[],
  ): Promise<IMockRuleSaveResult | undefined> {
    const rules = await generateFromRecordedRequests(requests);
    if (!rules) {
      return undefined;
    }
    return this._saveRules(rules);
  }

  // ── Save Destination ────────────────────────────────────────────

  private async _saveRules(
    newRules: IMockRule[],
  ): Promise<IMockRuleSaveResult | undefined> {
    const initialConfig = await this._readConfig();
    const destination = await this._pickDestination(initialConfig);
    if (!destination) {
      return undefined;
    }

    let pendingNewScenario:
      | {
          name: string;
          description?: string;
        }
      | undefined;
    if (destination.destinationType === 'new') {
      pendingNewScenario = await this._promptForNewScenario(initialConfig);
      if (!pendingNewScenario) {
        return undefined;
      }
    }

    // Re-read immediately before the write so destination validation uses the
    // latest configuration if the user edited the file during the prompts.
    const config = await this._readConfig();
    let scenarioName: string | undefined;
    let saveDestination: MockRuleDestination;

    if (destination.destinationType === 'base') {
      saveDestination = { destinationType: 'base' };
    } else if (destination.destinationType === 'scenario') {
      const scenario = config.scenarios?.find(
        (candidate) => candidate.name === destination.scenarioName,
      );
      if (!scenario) {
        throw new Error(
          localize(
            'mock.destination.removed',
            'Scenario "{0}" no longer exists. No rules were saved.',
            destination.scenarioName ?? '',
          ),
        );
      }
      scenarioName = scenario.name;
      saveDestination = {
        destinationType: 'scenario',
        scenarioName,
      };
    } else {
      const newScenario = pendingNewScenario!;
      const validationError = this._validateNewScenarioName(newScenario.name, config);
      if (validationError) {
        throw new Error(validationError);
      }
      scenarioName = newScenario.name;
      saveDestination = {
        destinationType: 'new',
        scenarioName,
        ...(newScenario.description ? { description: newScenario.description } : {}),
      };
    }

    const updatedConfig = appendMockRules(config, newRules, saveDestination);

    // Ensure directory exists
    const configDir = path.dirname(this._mockFilePath);
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(configDir));

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(this._mockFilePath),
      Buffer.from(JSON.stringify(updatedConfig, null, 2), 'utf-8'),
    );

    // Open the file for the user to review
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(this._mockFilePath));
    await vscode.window.showTextDocument(doc);

    return {
      destinationLabel: scenarioName ?? BASE_SCENARIO_LABEL,
      ruleCount: newRules.length,
      scenarioName,
    };
  }

  private async _readConfig(): Promise<IMockConfig> {
    try {
      const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(this._mockFilePath));
      const text = Buffer.from(raw).toString('utf-8');
      return validateMockConfig(JSON.parse(text) as unknown);
    } catch (error: unknown) {
      if (
        error instanceof vscode.FileSystemError &&
        (error.code === 'FileNotFound' || /not found/i.test(error.message))
      ) {
        return { rules: [] };
      }
      throw error;
    }
  }

  private async _pickDestination(
    config: IMockConfig,
  ): Promise<IDestinationQuickPickItem | undefined> {
    const items: IDestinationQuickPickItem[] = [
      {
        label: `$(database) ${localize('mock.destination.base', BASE_SCENARIO_LABEL)}`,
        description: localize(
          'mock.destination.ruleCount',
          '{0} rule(s)',
          config.rules.length,
        ),
        destinationType: 'base',
      },
      ...(config.scenarios ?? []).map(
        (scenario): IDestinationQuickPickItem => ({
          label: `$(layers) ${scenario.name}`,
          description: scenario.description,
          detail: localize(
            'mock.destination.ruleCount',
            '{0} rule(s)',
            scenario.rules.length,
          ),
          destinationType: 'scenario',
          scenarioName: scenario.name,
        }),
      ),
      {
        label: `$(add) ${localize('mock.destination.newScenario', 'New scenario…')}`,
        description: localize(
          'mock.destination.newScenario.description',
          'Create a scenario and save the generated rules to it',
        ),
        destinationType: 'new',
      },
    ];

    const activeItem =
      items.find(
        (item) =>
          item.destinationType === 'scenario' &&
          item.scenarioName === this._activeScenarioName,
      ) ?? items[0];

    return new Promise<IDestinationQuickPickItem | undefined>((resolve) => {
      const quickPick = vscode.window.createQuickPick<IDestinationQuickPickItem>();
      let completed = false;
      const complete = (value?: IDestinationQuickPickItem) => {
        if (completed) {
          return;
        }
        completed = true;
        resolve(value);
        quickPick.dispose();
      };

      quickPick.title = localize('mock.destination.title', 'Save generated rules to…');
      quickPick.placeholder = localize(
        'mock.destination.placeholder',
        'Choose Base rules, an existing scenario, or create a new scenario',
      );
      quickPick.ignoreFocusOut = true;
      quickPick.items = items;
      quickPick.activeItems = [activeItem];
      quickPick.onDidAccept(() => {
        complete(quickPick.selectedItems[0] ?? quickPick.activeItems[0]);
      });
      quickPick.onDidHide(() => complete());
      quickPick.show();
    });
  }

  private async _promptForNewScenario(
    config: IMockConfig,
  ): Promise<{ name: string; description?: string } | undefined> {
    const name = await vscode.window.showInputBox({
      title: localize('mock.destination.newScenario.name.title', 'New Scenario — Name'),
      prompt: localize(
        'mock.destination.newScenario.name.prompt',
        'Enter a unique name for the scenario',
      ),
      ignoreFocusOut: true,
      validateInput: (value) => this._validateNewScenarioName(value.trim(), config),
    });
    if (name === undefined) {
      return undefined;
    }

    const description = await vscode.window.showInputBox({
      title: localize(
        'mock.destination.newScenario.description.title',
        'New Scenario — Description (optional)',
      ),
      prompt: localize(
        'mock.destination.newScenario.description.prompt',
        'Briefly explain when to use this scenario',
      ),
      ignoreFocusOut: true,
    });
    if (description === undefined) {
      return undefined;
    }

    return {
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
    };
  }

  private _validateNewScenarioName(name: string, config: IMockConfig): string | undefined {
    if (!name) {
      return localize(
        'mock.destination.newScenario.name.required',
        'A scenario name is required.',
      );
    }
    if (isReservedScenarioName(name)) {
      return localize(
        'mock.destination.newScenario.name.reserved',
        '"{0}" is reserved for the built-in Base rules selection.',
        name,
      );
    }
    if (config.scenarios?.some((scenario) => scenario.name === name)) {
      return localize(
        'mock.destination.newScenario.name.duplicate',
        'A scenario named "{0}" already exists.',
        name,
      );
    }
    return undefined;
  }
}
