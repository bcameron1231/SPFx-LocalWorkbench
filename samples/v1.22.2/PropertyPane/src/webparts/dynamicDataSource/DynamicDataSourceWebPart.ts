import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import type { IDynamicDataCallables, IDynamicDataPropertyDefinition } from '@microsoft/sp-dynamic-data';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import DynamicDataSource, { type IDynamicDataSourceProps } from './components/DynamicDataSource';
import { getManifestMetadata } from '../shared/components/ManifestMetadataBadge';
import {
  buildDynamicDataDetails,
  buildDynamicDataSourcePropertyPaneConfiguration,
  DYNAMIC_DATA_PROPERTY_DEFINITIONS,
  DYNAMIC_DATA_PROPERTY_IDS,
  formatDynamicValue,
  getDynamicDataPropertyValue,
  type IDynamicDataSourceState,
} from '../shared/dynamicData';

export interface IDynamicDataSourceWebPartProps extends IDynamicDataSourceState {}

export default class DynamicDataSourceWebPart
  extends BaseClientSideWebPart<IDynamicDataSourceWebPartProps>
  implements IDynamicDataCallables
{
  public async onInit(): Promise<void> {
    await super.onInit();

    // Dynamic-data sources must register themselves so they appear in the built-in connection picker.
    this.context.dynamicDataSourceManager.initializeSource(this);
    this.context.dynamicDataSourceManager.updateMetadata({
      title: 'Dynamic Data Source',
      description: 'Publishes primitive and object-valued properties for dynamic-data sample validation.',
    });
  }

  public render(): void {
    const sourceState = this._getSourceState();
    const sourceSummary = getDynamicDataPropertyValue(sourceState, DYNAMIC_DATA_PROPERTY_IDS.summary);
    const sourceDetails = buildDynamicDataDetails(sourceState);

    const element: React.ReactElement<IDynamicDataSourceProps> = React.createElement(DynamicDataSource, {
      manifestInfo: getManifestMetadata(this.context.manifest),
      sourceCategory: sourceState.sourceCategory,
      sourceCount: sourceState.sourceCount,
      sourceDetailsValue: formatDynamicValue(sourceDetails),
      sourceEmphasis: sourceState.sourceEmphasis,
      sourceSummary: String(sourceSummary),
      sourceText: sourceState.sourceText,
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

    // Notify each affected property explicitly so connected consumers refresh both direct and derived values.
    if (propertyPath === 'sourceText') {
      this.context.dynamicDataSourceManager.notifyPropertyChanged(DYNAMIC_DATA_PROPERTY_IDS.text);
      this.context.dynamicDataSourceManager.notifyPropertyChanged(DYNAMIC_DATA_PROPERTY_IDS.summary);
      this.context.dynamicDataSourceManager.notifyPropertyChanged(DYNAMIC_DATA_PROPERTY_IDS.details);
    }

    if (propertyPath === 'sourceCount') {
      this.context.dynamicDataSourceManager.notifyPropertyChanged(DYNAMIC_DATA_PROPERTY_IDS.count);
      this.context.dynamicDataSourceManager.notifyPropertyChanged(DYNAMIC_DATA_PROPERTY_IDS.summary);
      this.context.dynamicDataSourceManager.notifyPropertyChanged(DYNAMIC_DATA_PROPERTY_IDS.details);
    }

    if (propertyPath === 'sourceCategory' || propertyPath === 'sourceEmphasis') {
      this.context.dynamicDataSourceManager.notifyPropertyChanged(DYNAMIC_DATA_PROPERTY_IDS.details);
    }
  }

  protected getPropertyPaneConfiguration(): ReturnType<typeof buildDynamicDataSourcePropertyPaneConfiguration> {
    return buildDynamicDataSourcePropertyPaneConfiguration();
  }

  /** Property definitions are the source-side contract that consumers see in the connection picker. */
  public getPropertyDefinitions(): ReadonlyArray<IDynamicDataPropertyDefinition> {
    return DYNAMIC_DATA_PROPERTY_DEFINITIONS;
  }

  /** Property values are read on demand by connected consumers. */
  public getPropertyValue(propertyId: string): unknown {
    const value = getDynamicDataPropertyValue(this._getSourceState(), propertyId);

    if (value === undefined) {
      throw new Error(`Unknown dynamic-data property ID: ${propertyId}`);
    }

    return value;
  }

  private _getSourceState(): IDynamicDataSourceState {
    return {
      sourceCategory: this.properties.sourceCategory,
      sourceCount: this.properties.sourceCount,
      sourceEmphasis: this.properties.sourceEmphasis,
      sourceText: this.properties.sourceText,
    };
  }
}
