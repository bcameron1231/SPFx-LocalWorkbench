import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { DynamicProperty } from '@microsoft/sp-component-base';
import type IWebPartPropertiesMetadata from '@microsoft/sp-webpart-base/lib/core/IWebPartPropertiesMetadata';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import DynamicDataConsumer, { type IDynamicDataConsumerProps } from './components/DynamicDataConsumer';
import { getManifestMetadata } from '../shared/components/ManifestMetadataBadge';
import {
  buildDynamicDataConsumerPropertyPaneConfiguration,
  DYNAMIC_DATA_CONDITIONAL_ACTIONS,
  ensureDynamicProperty,
  resolveConnectedPreview,
  resolveDynamicDisplayValue,
  resolveDynamicNumberDisplayValue,
} from '../shared/dynamicData';
import type { IDynamicDataDetails } from '../shared/dynamicData';

export interface IDynamicDataConsumerWebPartProps {
  connectedDisplayMode: string;
  connectedSourceNote: string;
  dynamicText?: DynamicProperty<unknown>;
  dynamicCount?: DynamicProperty<number>;
  dynamicSummary?: DynamicProperty<unknown>;
  dynamicDetails?: DynamicProperty<IDynamicDataDetails>;
  lastConditionalAction?: string;
  manualConnectionLabel: string;
  showConnectedConfiguration: boolean;
}

export default class DynamicDataConsumerWebPart extends BaseClientSideWebPart<IDynamicDataConsumerWebPartProps> {
  public async onInit(): Promise<void> {
    await super.onInit();

    // SPFx can deserialize persisted dynamic-property state before rebuilding live DynamicProperty instances.
    // Reconstructing them here makes the sample safe across reloads and across the online/local workbenches.
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
    this.properties.dynamicDetails = ensureDynamicProperty(
      this.properties.dynamicDetails,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
  }

  public render(): void {
    const dynamicTextValue = resolveDynamicDisplayValue(this.properties.dynamicText);
    const dynamicCountValue = resolveDynamicNumberDisplayValue(this.properties.dynamicCount);
    const dynamicSummaryValue = resolveDynamicDisplayValue(this.properties.dynamicSummary);
    const dynamicDetailsValue = resolveDynamicDisplayValue(this.properties.dynamicDetails);

    const element: React.ReactElement<IDynamicDataConsumerProps> = React.createElement(DynamicDataConsumer, {
      connectedDisplayMode: this.properties.connectedDisplayMode,
      connectedPreviewValue: resolveConnectedPreview(
        { connectedDisplayMode: this.properties.connectedDisplayMode },
        dynamicTextValue,
        dynamicCountValue,
        dynamicSummaryValue,
        dynamicDetailsValue,
      ),
      connectedSourceNote: this.properties.connectedSourceNote,
      dynamicCountValue,
      dynamicDetailsValue,
      dynamicSummaryValue,
      dynamicTextValue,
      lastConditionalAction: this.properties.lastConditionalAction ?? DYNAMIC_DATA_CONDITIONAL_ACTIONS.none,
      manifestInfo: getManifestMetadata(this.context.manifest),
      manualConnectionLabel: this.properties.manualConnectionLabel,
      showConnectedConfiguration: this.properties.showConnectedConfiguration,
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    this.properties.dynamicText?.dispose();
    this.properties.dynamicCount?.dispose();
    this.properties.dynamicSummary?.dispose();
    this.properties.dynamicDetails?.dispose();
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
      dynamicDetails: {
        dynamicPropertyType: 'object',
      },
    };
  }

  protected getPropertyPaneConfiguration(): ReturnType<typeof buildDynamicDataConsumerPropertyPaneConfiguration> {
    return buildDynamicDataConsumerPropertyPaneConfiguration({
      onShowPrimaryGroup: this._handleShowPrimaryGroup,
      onShowSecondaryGroup: this._handleShowSecondaryGroup,
      showSecondaryGroup: this.properties.showConnectedConfiguration,
    });
  }

  private _handleShowPrimaryGroup = (): void => {
    this.properties.showConnectedConfiguration = false;
    this.properties.lastConditionalAction = DYNAMIC_DATA_CONDITIONAL_ACTIONS.primary;
    console.log('[DynamicDataConsumer] onShowPrimaryGroup invoked.');
    this.render();
    this.context.propertyPane.refresh();
  };

  private _handleShowSecondaryGroup = (): void => {
    this.properties.showConnectedConfiguration = true;
    this.properties.lastConditionalAction = DYNAMIC_DATA_CONDITIONAL_ACTIONS.secondary;
    console.log('[DynamicDataConsumer] onShowSecondaryGroup invoked.');
    this.render();
    this.context.propertyPane.refresh();
  };
}
