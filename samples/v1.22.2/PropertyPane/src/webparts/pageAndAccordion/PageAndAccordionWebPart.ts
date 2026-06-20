import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  PropertyPaneDropdown,
  PropertyPaneLabel,
  PropertyPaneTextField,
  PropertyPaneToggle,
  type IPropertyPaneConfiguration,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import PageAndAccordion, { type IPageAndAccordionProps } from './components/PageAndAccordion';
import { getManifestMetadata } from '../shared/components/ManifestMetadataBadge';

export interface IPageAndAccordionWebPartProps {
  accordionName: string;
  collapsedNotes: string;
  pageThreeUnnamedGroupValue: string;
  pageTwoAudience: string;
  pageTwoHighlight: boolean;
  pageTwoNotes: string;
  pageThreeSummary: string;
  pageThreeStatus: string;
  pageThreeHiddenNameValue: string;
}

export default class PageAndAccordionWebPart extends BaseClientSideWebPart<IPageAndAccordionWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IPageAndAccordionProps> = React.createElement(PageAndAccordion, {
      accordionName: this.properties.accordionName,
      collapsedNotes: this.properties.collapsedNotes,
      manifestInfo: getManifestMetadata(this.context.manifest),
      pageThreeUnnamedGroupValue: this.properties.pageThreeUnnamedGroupValue,
      pageTwoAudience: this.properties.pageTwoAudience,
      pageTwoHighlight: this.properties.pageTwoHighlight,
      pageTwoNotes: this.properties.pageTwoNotes,
      pageThreeSummary: this.properties.pageThreeSummary,
      pageThreeStatus: this.properties.pageThreeStatus,
      pageThreeHiddenNameValue: this.properties.pageThreeHiddenNameValue,
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  // protected get disableReactivePropertyChanges(): boolean {
  //   return true;
  // }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          displayGroupsAsAccordion: true,
          header: { description: 'Page 1 uses accordion groups with mixed collapsed defaults.' },
          groups: [
            {
              groupName: 'Initially Open Group',
              isCollapsed: false,
              groupFields: [
                PropertyPaneTextField('accordionName', {
                  label: 'Accordion Name',
                  description: 'This group should start expanded.',
                }),
              ],
            },
            {
              groupName: 'Initially Collapsed Group',
              isCollapsed: true,
              groupFields: [
                PropertyPaneTextField('collapsedNotes', {
                  label: 'Collapsed Notes',
                  multiline: true,
                  rows: 3,
                  resizable: true,
                }),
              ],
            },
          ],
        },
        {
          header: { description: 'Page 2 validates page navigation with standard groups and persisted values.' },
          groups: [
            {
              groupName: 'Audience',
              groupFields: [
                PropertyPaneDropdown('pageTwoAudience', {
                  label: 'Target Audience',
                  options: [
                    { key: 'authors', text: 'Authors' },
                    { key: 'reviewers', text: 'Reviewers' },
                    { key: 'publishers', text: 'Publishers' },
                  ],
                }),
                PropertyPaneToggle('pageTwoHighlight', {
                  label: 'Highlight this section',
                  onText: 'Highlighted',
                  offText: 'Standard',
                }),
              ],
            },
            {
              groupName: 'Notes',
              groupFields: [
                PropertyPaneTextField('pageTwoNotes', {
                  label: 'Page Two Notes',
                  multiline: true,
                  rows: 3,
                  resizable: true,
                }),
              ],
            },
          ],
        },
        {
          header: { description: 'Page 3 confirms the property pane can carry distinct values across three pages.' },
          groups: [
            {
              groupName: 'Summary',
              groupFields: [
                PropertyPaneLabel('pageThreeRequiredLabel', {
                  text: 'Required label sample',
                  required: true,
                }),
                PropertyPaneTextField('pageThreeSummary', {
                  label: 'Page Three Summary',
                }),
                PropertyPaneDropdown('pageThreeStatus', {
                  label: 'Release Status',
                  options: [
                    { key: 'draft', text: 'Draft' },
                    { key: 'review', text: 'In Review' },
                    { key: 'published', text: 'Published' },
                  ],
                }),
              ],
            },
            {
              groupName: 'Hidden Group Name',
              isGroupNameHidden: true,
              groupFields: [
                PropertyPaneTextField('pageThreeHiddenNameValue', {
                  label: 'Hidden Group Name Value',
                  description: 'This field lives in a group with isGroupNameHidden set to true.',
                }),
              ],
            },
            {
              groupFields: [
                PropertyPaneTextField('pageThreeUnnamedGroupValue', {
                  label: 'Unnamed Group Value',
                  description: 'This field lives in a group where groupName is not specified at all.',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
