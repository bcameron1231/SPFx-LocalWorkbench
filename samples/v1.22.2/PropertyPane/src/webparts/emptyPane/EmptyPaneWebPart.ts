import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import type { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import EmptyPane, { type IEmptyPaneProps } from './components/EmptyPane';
import { getManifestMetadata } from '../shared/components/ManifestMetadataBadge';

export interface IEmptyPaneWebPartProps {}

export default class EmptyPaneWebPart extends BaseClientSideWebPart<IEmptyPaneWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IEmptyPaneProps> = React.createElement(EmptyPane, {
      manifestInfo: getManifestMetadata(this.context.manifest),
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        
      ],
    };
  }
}
