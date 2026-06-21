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
} from '../shared/dynamicData';
import type { IDynamicDataDetails } from '../shared/dynamicData';

export interface IDynamicDataConsumerWebPartProps {
  connectedDisplayMode: string;
  connectedSourceNote: string;
  depthDefault?: DynamicProperty<unknown>;
  depthOne?: DynamicProperty<unknown>;
  depthZero?: DynamicProperty<unknown>;
  fieldSetDefaultPrimary?: DynamicProperty<unknown>;
  fieldSetDefaultSecondary?: DynamicProperty<unknown>;
  fieldSetFilteredPropertyPrimary?: DynamicProperty<IDynamicDataDetails>;
  fieldSetFilteredPropertySecondary?: DynamicProperty<IDynamicDataDetails>;
  fieldSetSharedPropertyPrimary?: DynamicProperty<unknown>;
  fieldSetSharedPropertySecondary?: DynamicProperty<unknown>;
  fieldSetSharedSourcePrimary?: DynamicProperty<unknown>;
  fieldSetSharedSourceSecondary?: DynamicProperty<unknown>;
  fieldSetSharedSourceFilteredPrimary?: DynamicProperty<unknown>;
  fieldSetSharedSourceFilteredSecondary?: DynamicProperty<unknown>;
  filteredToDetails?: DynamicProperty<IDynamicDataDetails>;
  lastConditionalAction?: string;
  manualConnectionLabel: string;
  showConnectedConfiguration: boolean;
}

export default class DynamicDataConsumerWebPart extends BaseClientSideWebPart<IDynamicDataConsumerWebPartProps> {
  public async onInit(): Promise<void> {
    await super.onInit();

    // SPFx can deserialize persisted dynamic-property state before rebuilding live DynamicProperty instances.
    // Reconstructing them here makes the sample safe across reloads and across the online/local workbenches.
    this.properties.depthDefault = ensureDynamicProperty(
      this.properties.depthDefault,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.depthZero = ensureDynamicProperty(
      this.properties.depthZero,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.depthOne = ensureDynamicProperty(
      this.properties.depthOne,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetDefaultPrimary = ensureDynamicProperty(
      this.properties.fieldSetDefaultPrimary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetDefaultSecondary = ensureDynamicProperty(
      this.properties.fieldSetDefaultSecondary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetSharedSourcePrimary = ensureDynamicProperty(
      this.properties.fieldSetSharedSourcePrimary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetSharedSourceSecondary = ensureDynamicProperty(
      this.properties.fieldSetSharedSourceSecondary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetSharedSourceFilteredPrimary = ensureDynamicProperty(
      this.properties.fieldSetSharedSourceFilteredPrimary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetSharedSourceFilteredSecondary = ensureDynamicProperty(
      this.properties.fieldSetSharedSourceFilteredSecondary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetSharedPropertyPrimary = ensureDynamicProperty(
      this.properties.fieldSetSharedPropertyPrimary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetSharedPropertySecondary = ensureDynamicProperty(
      this.properties.fieldSetSharedPropertySecondary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetFilteredPropertyPrimary = ensureDynamicProperty(
      this.properties.fieldSetFilteredPropertyPrimary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.fieldSetFilteredPropertySecondary = ensureDynamicProperty(
      this.properties.fieldSetFilteredPropertySecondary,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
    this.properties.filteredToDetails = ensureDynamicProperty(
      this.properties.filteredToDetails,
      this.context.dynamicDataProvider,
      () => this.render(),
    );
  }

  public render(): void {
    const depthDefaultValue = resolveDynamicDisplayValue(this.properties.depthDefault);
    const depthZeroValue = resolveDynamicDisplayValue(this.properties.depthZero);
    const depthOneValue = resolveDynamicDisplayValue(this.properties.depthOne);
    const filteredToDetailsValue = resolveDynamicDisplayValue(this.properties.filteredToDetails);
    const fieldSetDefaultPrimaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetDefaultPrimary,
    );
    const fieldSetDefaultSecondaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetDefaultSecondary,
    );
    const fieldSetSharedSourcePrimaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetSharedSourcePrimary,
    );
    const fieldSetSharedSourceSecondaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetSharedSourceSecondary,
    );
    const fieldSetSharedSourceFilteredPrimaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetSharedSourceFilteredPrimary,
    );
    const fieldSetSharedSourceFilteredSecondaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetSharedSourceFilteredSecondary,
    );
    const fieldSetSharedPropertyPrimaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetSharedPropertyPrimary,
    );
    const fieldSetSharedPropertySecondaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetSharedPropertySecondary,
    );
    const fieldSetFilteredPropertyPrimaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetFilteredPropertyPrimary,
    );
    const fieldSetFilteredPropertySecondaryValue = resolveDynamicDisplayValue(
      this.properties.fieldSetFilteredPropertySecondary,
    );

    const element: React.ReactElement<IDynamicDataConsumerProps> = React.createElement(DynamicDataConsumer, {
      connectedDisplayMode: this.properties.connectedDisplayMode,
      connectedPreviewValue: resolveConnectedPreview(
        { connectedDisplayMode: this.properties.connectedDisplayMode },
        depthDefaultValue,
        fieldSetSharedSourcePrimaryValue,
        fieldSetSharedSourceSecondaryValue,
        filteredToDetailsValue,
      ),
      connectedSourceNote: this.properties.connectedSourceNote,
      depthDefaultValue,
      depthOneValue,
      depthZeroValue,
      fieldSetDefaultPrimaryValue,
      fieldSetDefaultSecondaryValue,
      fieldSetFilteredPropertyPrimaryValue,
      fieldSetFilteredPropertySecondaryValue,
      fieldSetSharedPropertyPrimaryValue,
      fieldSetSharedPropertySecondaryValue,
      fieldSetSharedSourcePrimaryValue,
      fieldSetSharedSourceSecondaryValue,
      fieldSetSharedSourceFilteredPrimaryValue,
      fieldSetSharedSourceFilteredSecondaryValue,
      filteredToDetailsValue,
      lastConditionalAction: this.properties.lastConditionalAction ?? DYNAMIC_DATA_CONDITIONAL_ACTIONS.none,
      manifestInfo: getManifestMetadata(this.context.manifest),
      manualConnectionLabel: this.properties.manualConnectionLabel,
      showConnectedConfiguration: this.properties.showConnectedConfiguration,
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    this.properties.depthDefault?.dispose();
    this.properties.depthZero?.dispose();
    this.properties.depthOne?.dispose();
    this.properties.fieldSetDefaultPrimary?.dispose();
    this.properties.fieldSetDefaultSecondary?.dispose();
    this.properties.fieldSetSharedSourcePrimary?.dispose();
    this.properties.fieldSetSharedSourceSecondary?.dispose();
    this.properties.fieldSetSharedSourceFilteredPrimary?.dispose();
    this.properties.fieldSetSharedSourceFilteredSecondary?.dispose();
    this.properties.fieldSetSharedPropertyPrimary?.dispose();
    this.properties.fieldSetSharedPropertySecondary?.dispose();
    this.properties.fieldSetFilteredPropertyPrimary?.dispose();
    this.properties.fieldSetFilteredPropertySecondary?.dispose();
    this.properties.filteredToDetails?.dispose();
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected get propertiesMetadata(): IWebPartPropertiesMetadata {
    return {
      depthDefault: {
        dynamicPropertyType: 'string',
      },
      depthZero: {
        dynamicPropertyType: 'string',
      },
      depthOne: {
        dynamicPropertyType: 'string',
      },
      fieldSetDefaultPrimary: {
        dynamicPropertyType: 'string',
      },
      fieldSetDefaultSecondary: {
        dynamicPropertyType: 'string',
      },
      fieldSetSharedSourcePrimary: {
        dynamicPropertyType: 'string',
      },
      fieldSetSharedSourceSecondary: {
        dynamicPropertyType: 'string',
      },
      fieldSetSharedSourceFilteredPrimary: {
        dynamicPropertyType: 'string',
      },
      fieldSetSharedSourceFilteredSecondary: {
        dynamicPropertyType: 'string',
      },
      fieldSetSharedPropertyPrimary: {
        dynamicPropertyType: 'string',
      },
      fieldSetSharedPropertySecondary: {
        dynamicPropertyType: 'string',
      },
      fieldSetFilteredPropertyPrimary: {
        dynamicPropertyType: 'object',
      },
      fieldSetFilteredPropertySecondary: {
        dynamicPropertyType: 'object',
      },
      filteredToDetails: {
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
