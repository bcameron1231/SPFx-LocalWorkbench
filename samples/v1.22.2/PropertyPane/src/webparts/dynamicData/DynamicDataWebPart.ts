import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { DynamicProperty } from '@microsoft/sp-component-base';
import type { IDynamicDataCallables, IDynamicDataPropertyDefinition } from '@microsoft/sp-dynamic-data';
import type IWebPartPropertiesMetadata from '@microsoft/sp-webpart-base/lib/core/IWebPartPropertiesMetadata';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import DynamicData, { type IDynamicDataProps } from './components/DynamicData';
import {
  DYNAMIC_DATA_PROPERTY_DEFINITIONS,
  buildDynamicDataPropertyPaneConfiguration,
  ensureDynamicProperty,
  getDynamicDataPropertyValue,
  resolveDynamicDisplayValue,
  resolveDynamicNumberDisplayValue,
  type DynamicPropertyLike,
} from './dynamicDataSupport';

export interface IDynamicDataWebPartProps {
  sourceText: string;
  sourceCount: number;
  connectedDisplayMode: string;
  connectedSourceNote: string;
  dynamicText?: DynamicProperty<unknown>;
  dynamicCount?: DynamicProperty<number>;
  dynamicSummary?: DynamicProperty<unknown>;
  lastConditionalAction?: string;
  manualConnectionLabel: string;
  showConnectedConfiguration: boolean;
}

export default class DynamicDataWebPart extends BaseClientSideWebPart<IDynamicDataWebPartProps> implements IDynamicDataCallables {
  public async onInit(): Promise<void> {
    await super.onInit();

    this.context.dynamicDataSourceManager.initializeSource(this);
    this.context.dynamicDataSourceManager.updateMetadata({
      title: `${this.context.manifest.alias} Source`,
      description: 'Dynamic data sample source for property pane parity validation.',
    });

    this.properties.dynamicText = ensureDynamicProperty(
      this.properties.dynamicText,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.dynamicCount = ensureDynamicProperty(
      this.properties.dynamicCount,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.dynamicSummary = ensureDynamicProperty(
      this.properties.dynamicSummary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
  }

  public render(): void {
    const element: React.ReactElement<IDynamicDataProps> = React.createElement(DynamicData, {
      sourceText: this.properties.sourceText,
      sourceCount: this.properties.sourceCount,
      connectedDisplayMode: this.properties.connectedDisplayMode,
      connectedSourceNote: this.properties.connectedSourceNote,
      dynamicTextValue: resolveDynamicDisplayValue(this.properties.dynamicText),
      dynamicCountValue: resolveDynamicNumberDisplayValue(this.properties.dynamicCount),
      dynamicSummaryValue: resolveDynamicDisplayValue(this.properties.dynamicSummary),
      lastConditionalAction: this.properties.lastConditionalAction ?? 'none yet',
      manualConnectionLabel: this.properties.manualConnectionLabel,
      showConnectedConfiguration: this.properties.showConnectedConfiguration,
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    this.properties.dynamicText?.dispose();
    this.properties.dynamicCount?.dispose();
    this.properties.dynamicSummary?.dispose();
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected get propertiesMetadata(): IWebPartPropertiesMetadata {
    return {
      dynamicText: {
        dynamicPropertyType: 'string',
      },
      dynamicCount: {
        dynamicPropertyType: 'number',
      },
      dynamicSummary: {
        dynamicPropertyType: 'string',
      },
    };
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

    if (propertyPath === 'sourceText') {
      this.context.dynamicDataSourceManager.notifyPropertyChanged('text');
      this.context.dynamicDataSourceManager.notifyPropertyChanged('summary');
    }

    if (propertyPath === 'sourceCount') {
      this.context.dynamicDataSourceManager.notifyPropertyChanged('count');
      this.context.dynamicDataSourceManager.notifyPropertyChanged('summary');
    }
  }

  protected getPropertyPaneConfiguration() {
    return buildDynamicDataPropertyPaneConfiguration({
      onShowPrimaryGroup: this._handleShowPrimaryGroup,
      onShowSecondaryGroup: this._handleShowSecondaryGroup,
      showSecondaryGroup: this.properties.showConnectedConfiguration,
    });
  }

  public getPropertyDefinitions(): ReadonlyArray<IDynamicDataPropertyDefinition> {
    return DYNAMIC_DATA_PROPERTY_DEFINITIONS;
  }

  public getPropertyValue(propertyId: string): unknown {
    return getDynamicDataPropertyValue(
      {
        sourceCount: this.properties.sourceCount,
        sourceText: this.properties.sourceText,
      },
      propertyId,
    );
  }

  private _handleShowPrimaryGroup = (): void => {
    this.properties.showConnectedConfiguration = false;
    this.properties.lastConditionalAction = 'onShowPrimaryGroup';
    console.log('[DynamicData] onShowPrimaryGroup invoked.');
    this.render();
    this.context.propertyPane.refresh();
  };

  private _handleShowSecondaryGroup = (): void => {
    this.properties.showConnectedConfiguration = true;
    this.properties.lastConditionalAction = 'onShowSecondaryGroup';
    console.log('[DynamicData] onShowSecondaryGroup invoked.');
    this.render();
    this.context.propertyPane.refresh();
  };
}
