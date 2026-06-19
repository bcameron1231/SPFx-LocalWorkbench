import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { MessageBarType } from '@fluentui/react/lib/MessageBar';
import { SpinnerSize } from '@fluentui/react/lib/Spinner';

import { PropertyFieldBrandFontPicker } from '@pnp/spfx-property-controls/lib/PropertyFieldBrandFontPicker';
import { PropertyFieldButton } from '@pnp/spfx-property-controls/lib/PropertyFieldButton';
import { PropertyFieldCodeEditor, PropertyFieldCodeEditorLanguages } from '@pnp/spfx-property-controls/lib/PropertyFieldCodeEditor';
import { PropertyFieldCollectionData, CustomCollectionFieldType } from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData';
import { PropertyFieldColorPicker, PropertyFieldColorPickerStyle } from '@pnp/spfx-property-controls/lib/PropertyFieldColorPicker';
import { PropertyFieldColumnPicker, PropertyFieldColumnPickerOrderBy, IColumnReturnProperty } from '@pnp/spfx-property-controls/lib/PropertyFieldColumnPicker';
import { PropertyFieldDateTimePicker, DateConvention, TimeConvention, IDateTimeFieldValue } from '@pnp/spfx-property-controls/lib/PropertyFieldDateTimePicker';
import { PropertyFieldEnterpriseTermPicker } from '@pnp/spfx-property-controls/lib/PropertyFieldEnterpriseTermPicker';
import { PropertyFieldFilePicker, IFilePickerResult } from '@pnp/spfx-property-controls/lib/PropertyFieldFilePicker';
import { PropertyFieldFolderPicker, IFolder } from '@pnp/spfx-property-controls/lib/PropertyFieldFolderPicker';
import { PropertyFieldGrid } from '@pnp/spfx-property-controls/lib/PropertyFieldGrid';
import { IItem } from '@pnp/spfx-property-controls/lib/propertyFields/propertyFieldGrid/grid/IItem';
import { PropertyFieldGuid } from '@pnp/spfx-property-controls/lib/PropertyFieldGuid';
import { PropertyFieldIconPicker } from '@pnp/spfx-property-controls/lib/PropertyFieldIconPicker';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';
import { PropertyFieldMessage } from '@pnp/spfx-property-controls/lib/PropertyFieldMessage';
import { PropertyFieldMonacoEditor } from '@pnp/spfx-property-controls/lib/PropertyFieldMonacoEditor';
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect';
import { PropertyFieldNumber } from '@pnp/spfx-property-controls/lib/PropertyFieldNumber';
import { PropertyFieldOrder } from '@pnp/spfx-property-controls/lib/PropertyFieldOrder';
import { PropertyFieldPassword } from '@pnp/spfx-property-controls/lib/PropertyFieldPassword';
import { PropertyFieldPeoplePicker, PrincipalType, IPropertyFieldGroupOrPerson } from '@pnp/spfx-property-controls/lib/PropertyFieldPeoplePicker';
import { IRoleDefinitionInformation, PropertyFieldRoleDefinitionPicker } from '@pnp/spfx-property-controls/lib/PropertyFieldRoleDefinitionPicker';
import { PropertyFieldSearch } from '@pnp/spfx-property-controls/lib/PropertyFieldSearch';
import { PropertyFieldSitePicker, IPropertyFieldSite } from '@pnp/spfx-property-controls/lib/PropertyFieldSitePicker';
import { PropertyFieldSpinButton } from '@pnp/spfx-property-controls/lib/PropertyFieldSpinButton';
import { PropertyFieldSpinner } from '@pnp/spfx-property-controls/lib/PropertyFieldSpinner';
import { PropertyFieldSwatchColorPicker } from '@pnp/spfx-property-controls/lib/PropertyFieldSwatchColorPicker';
import { PropertyFieldTeamPicker, IPropertyFieldTeam } from '@pnp/spfx-property-controls/lib/PropertyFieldTeamPicker';
import { PropertyFieldTermPicker, IPickerTerms } from '@pnp/spfx-property-controls/lib/PropertyFieldTermPicker';
import { PropertyFieldViewPicker, PropertyFieldViewPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldViewPicker';
import { PropertyPaneMarkdownContent } from '@pnp/spfx-property-controls/lib/PropertyPaneMarkdownContent';
import { PropertyPanePropertyEditor } from '@pnp/spfx-property-controls/lib/PropertyPanePropertyEditor';
import { PropertyPaneWebPartInformation } from '@pnp/spfx-property-controls/lib/PropertyPaneWebPartInformation';

import PnpControls from './components/PnpControls';
import { IPnpControlsProps } from './components/IPnpControlsProps';
import { getManifestMetadata } from '../shared/components/ManifestMetadataBadge';

export interface IPnpControlsWebPartProps {
  color: string;
  swatchColor: string;
  brandFont: string;
  iconName: string;
  password: string;
  searchValue: string;
  htmlCode: string;
  monacoCode: string;
  guid: string;
  dateTime: IDateTimeFieldValue;
  numberValue: number;
  spinValue: number;
  multiSelect: string[];
  orderedItems: { title: string }[];
  collectionData: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  gridItems: IItem[];
  lists: string;
  column: string;
  view: string;
  people: IPropertyFieldGroupOrPerson[];
  teams: IPropertyFieldTeam[];
  filePickerResult: IFilePickerResult;
  folderPicker: IFolder;
  terms: IPickerTerms;
  enterpriseTerms: IPickerTerms;
  sites: IPropertyFieldSite[];
  roleDefinitions: IRoleDefinitionInformation[];
}

const GRID_ITEMS: IItem[] = [
  { key: '1', icon: 'Document', title: 'Document 1', description: 'First document' },
  { key: '2', icon: 'Document', title: 'Document 2', description: 'Second document' },
  { key: '3', icon: 'Document', title: 'Document 3', description: 'Third document' },
  { key: '4', icon: 'Document', title: 'Document 4', description: 'Fourth document' },
];

const DEFAULT_ORDER_ITEMS = [{ title: 'First' }, { title: 'Second' }, { title: 'Third' }];

export default class PnpControlsWebPart extends BaseClientSideWebPart<IPnpControlsWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IPnpControlsProps> = React.createElement(
      PnpControls,
      {
        manifestInfo: getManifestMetadata(this.context.manifest),
        color: this.properties.color,
        swatchColor: this.properties.swatchColor,
        brandFont: this.properties.brandFont,
        iconName: this.properties.iconName,
        password: this.properties.password,
        searchValue: this.properties.searchValue,
        htmlCode: this.properties.htmlCode,
        monacoCode: this.properties.monacoCode,
        guid: this.properties.guid,
        dateTime: this.properties.dateTime,
        numberValue: this.properties.numberValue,
        spinValue: this.properties.spinValue,
        multiSelect: this.properties.multiSelect,
        orderedItems: this.properties.orderedItems,
        collectionData: this.properties.collectionData,
        gridItems: this.properties.gridItems,
        lists: this.properties.lists,
        column: this.properties.column,
        view: this.properties.view,
        people: this.properties.people,
        teams: this.properties.teams,
        filePickerResult: this.properties.filePickerResult,
        folderPicker: this.properties.folderPicker,
        terms: this.properties.terms,
        enterpriseTerms: this.properties.enterpriseTerms,
        sites: this.properties.sites,
        roleDefinitions: this.properties.roleDefinitions,
      }
    );

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
        {
          header: { description: 'PnP Controls — Page 1 of 2' },
          groups: [
            {
              groupName: 'About',
              groupFields: [
                PropertyPaneWebPartInformation({
                  description: 'Showcases all <a href="https://pnp.github.io/sp-dev-fx-property-controls/" target="_blank">PnP SPFx Property Controls</a>.',
                  key: 'webPartInfoId'
                }),
                PropertyFieldMessage('messageField', {
                  key: 'messageFieldId',
                  text: 'Controls on Page 2 require a SharePoint context to function.',
                  messageType: MessageBarType.info,
                  isVisible: true
                }),
                PropertyFieldSpinner('spinnerField', {
                  key: 'spinnerFieldId',
                  label: 'Spinner example',
                  isVisible: true,
                  size: SpinnerSize.medium
                }),
                PropertyPaneMarkdownContent({
                  markdown: '## PnP Controls\nThis web part demonstrates **all** PnP SPFx property controls (excluding WithCallout variants).',
                  key: 'markdownId'
                }),
                PropertyPanePropertyEditor({
                  webpart: this,
                  key: 'propertyEditorId'
                })
              ]
            },
            {
              groupName: 'Text Inputs',
              groupFields: [
                PropertyFieldPassword('password', {
                  key: 'passwordId',
                  label: 'Password',
                  value: this.properties.password,
                  onChanged: (value: string) => {
                    this.properties.password = value;
                    this.render();
                  }
                }),
                PropertyFieldSearch('searchValue', {
                  key: 'searchValueId',
                  placeholder: 'Search...',
                  value: this.properties.searchValue,
                  onSearch: (value: string) => {
                    this.properties.searchValue = value;
                    this.render();
                  }
                }),
                PropertyFieldCodeEditor('htmlCode', {
                  label: 'Code Editor (HTML)',
                  panelTitle: 'Edit HTML',
                  initialValue: this.properties.htmlCode,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  language: PropertyFieldCodeEditorLanguages.HTML,
                  key: 'htmlCodeId'
                }),
                PropertyFieldMonacoEditor('monacoCode', {
                  key: 'monacoCodeId',
                  value: this.properties.monacoCode,
                  showMiniMap: true,
                  onChange: (newValue: string) => {
                    this.properties.monacoCode = newValue;
                    this.render();
                  },
                  language: 'json',
                  showLineNumbers: true
                }),
                PropertyFieldGuid('guid', {
                  key: 'guidId',
                  label: 'GUID',
                  value: this.properties.guid,
                  onChanged: (value: string) => {
                    this.properties.guid = value;
                    this.render();
                  }
                })
              ]
            },
            {
              groupName: 'Numbers & Ordering',
              groupFields: [
                PropertyFieldNumber('numberValue', {
                  key: 'numberValueId',
                  label: 'Number',
                  value: this.properties.numberValue,
                  minValue: 0,
                  maxValue: 100
                }),
                PropertyFieldSpinButton('spinValue', {
                  label: 'Spin Button',
                  initialValue: this.properties.spinValue,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  min: 0,
                  max: 20,
                  step: 1,
                  suffix: ' units',
                  key: 'spinValueId'
                }),
                PropertyFieldMultiSelect('multiSelect', {
                  key: 'multiSelectId',
                  label: 'Multi Select',
                  options: [
                    { key: 'EN', text: 'English' },
                    { key: 'FR', text: 'French' },
                    { key: 'NL', text: 'Dutch' },
                    { key: 'DE', text: 'German' }
                  ],
                  selectedKeys: this.properties.multiSelect
                }),
                PropertyFieldOrder('orderedItems', {
                  key: 'orderedItemsId',
                  label: 'Reorder Items',
                  items: (this.properties.orderedItems && this.properties.orderedItems.length > 0)
                    ? this.properties.orderedItems
                    : DEFAULT_ORDER_ITEMS,
                  textProperty: 'title',
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties
                }),
                PropertyFieldCollectionData('collectionData', {
                  key: 'collectionDataId',
                  label: 'Collection Data',
                  panelHeader: 'Manage collection',
                  manageBtnLabel: 'Manage',
                  value: this.properties.collectionData,
                  fields: [
                    { id: 'name', title: 'Name', type: CustomCollectionFieldType.string },
                    { id: 'age', title: 'Age', type: CustomCollectionFieldType.number }
                  ]
                })
              ]
            },
            {
              groupName: 'Colors, Fonts & Icons',
              groupFields: [
                PropertyFieldColorPicker('color', {
                  label: 'Color Picker',
                  selectedColor: this.properties.color,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  style: PropertyFieldColorPickerStyle.Inline,
                  key: 'colorId'
                }),
                PropertyFieldSwatchColorPicker('swatchColor', {
                  label: 'Swatch Color',
                  selectedColor: this.properties.swatchColor,
                  colors: [
                    { color: '#ffb900', label: 'Yellow' },
                    { color: '#d83b01', label: 'Orange' },
                    { color: '#e81123', label: 'Red' },
                    { color: '#0078d4', label: 'Blue' },
                    { color: '#107c10', label: 'Green' },
                    { color: '#5c2d91', label: 'Purple' }
                  ],
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  key: 'swatchColorId'
                }),
                PropertyFieldIconPicker('iconName', {
                  key: 'iconNameId',
                  label: 'Icon Picker',
                  currentIcon: this.properties.iconName,
                  onSave: (icon: string) => {
                    this.properties.iconName = icon;
                    this.render();
                  },
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  buttonLabel: 'Select icon'
                }),
                PropertyFieldBrandFontPicker('brandFont', {
                  key: 'brandFontId',
                  label: 'Brand Font',
                  initialValue: this.properties.brandFont,
                  context: this.context,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties
                })
              ]
            },
            {
              groupName: 'Date, Actions & Grid',
              groupFields: [
                PropertyFieldDateTimePicker('dateTime', {
                  label: 'Date & Time',
                  initialDate: this.properties.dateTime,
                  dateConvention: DateConvention.DateTime,
                  timeConvention: TimeConvention.Hours12,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  key: 'dateTimeId'
                }),
                PropertyFieldButton('buttonAction', {
                  key: 'buttonActionId',
                  text: 'Refresh Web Part',
                  isPrimary: true,
                  isVisible: true,
                  onClick: () => { this.render(); }
                }),
                PropertyFieldGrid('gridItems', {
                  key: 'gridItemsId',
                  label: 'Grid Items',
                  items: GRID_ITEMS,
                  defaultSelectedItems: this.properties.gridItems || [],
                  multiSelect: true,
                  isVisible: true,
                  onSelected: (items: IItem[]) => {
                    this.properties.gridItems = items;
                    this.render();
                  }
                })
              ]
            }
          ]
        },
        {
          header: { description: 'PnP Controls — Page 2 of 2 (SharePoint)' },
          groups: [
            {
              groupName: 'List Pickers',
              groupFields: [
                PropertyFieldListPicker('lists', {
                  label: 'Select a list',
                  selectedList: this.properties.lists,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  context: this.context,
                  key: 'listsId'
                }),
                PropertyFieldColumnPicker('column', {
                  label: 'Select a column',
                  context: this.context,
                  selectedColumn: this.properties.column,
                  listId: this.properties.lists,
                  disabled: false,
                  orderBy: PropertyFieldColumnPickerOrderBy.Title,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  key: 'columnId',
                  displayHiddenColumns: false,
                  columnReturnProperty: IColumnReturnProperty.Title
                }),
                PropertyFieldViewPicker('view', {
                  label: 'Select a view',
                  listId: this.properties.lists,
                  selectedView: this.properties.view,
                  orderBy: PropertyFieldViewPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  context: this.context,
                  key: 'viewId'
                })
              ]
            },
            {
              groupName: 'People & Teams',
              groupFields: [
                PropertyFieldPeoplePicker('people', {
                  label: 'People Picker',
                  initialData: this.properties.people,
                  allowDuplicate: false,
                  principalType: [PrincipalType.Users, PrincipalType.SharePoint, PrincipalType.Security],
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  context: this.context,
                  properties: this.properties,
                  searchTextLimit: 10,
                  key: 'peopleId'
                }),
                PropertyFieldTeamPicker('teams', {
                  key: 'teamsId',
                  context: this.context,
                  label: 'Select teams',
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  initialTeams: this.properties.teams,
                  multiSelect: true
                })
              ]
            },
            {
              groupName: 'Files & Folders',
              groupFields: [
                PropertyFieldFilePicker('filePickerResult', {
                  context: this.context,
                  filePickerResult: this.properties.filePickerResult,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  onSave: (e: IFilePickerResult) => {
                    this.properties.filePickerResult = e;
                    this.render();
                  },
                  onChanged: (e: IFilePickerResult) => {
                    this.properties.filePickerResult = e;
                    this.render();
                  },
                  key: 'filePickerId',
                  buttonLabel: 'Select a file',
                  label: 'File Picker'
                }),
                PropertyFieldFolderPicker('folderPicker', {
                  context: this.context,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  key: 'folderPickerId',
                  label: 'Folder Picker',
                  selectedFolder: this.properties.folderPicker,
                  canCreateFolders: true,
                  rootFolder: {
                    Name: 'Shared Documents',
                    ServerRelativeUrl: '/sites/spfx_sparkle/Shared Documents'
                  },
                  onSelect: (folder: IFolder) => {
                    this.properties.folderPicker = folder;
                    this.render();
                  }
                })
              ]
            },
            {
              groupName: 'Term Store',
              groupFields: [
                PropertyFieldTermPicker('terms', {
                  label: 'Term Picker',
                  panelTitle: 'Select terms',
                  initialValues: this.properties.terms,
                  allowMultipleSelections: true,
                  excludeSystemGroup: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  context: this.context,
                  key: 'termsId'
                }),
                PropertyFieldEnterpriseTermPicker('enterpriseTerms', {
                  label: 'Enterprise Term Picker',
                  panelTitle: 'Select enterprise terms',
                  initialValues: this.properties.enterpriseTerms,
                  allowMultipleSelections: true,
                  excludeSystemGroup: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  context: this.context,
                  key: 'enterpriseTermsId'
                })
              ]
            },
            {
              groupName: 'Sites & Roles',
              groupFields: [
                PropertyFieldSitePicker('sites', {
                  label: 'Site Picker',
                  initialSites: this.properties.sites,
                  multiSelect: true,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  context: this.context,
                  key: 'sitesId'
                }),
                PropertyFieldRoleDefinitionPicker('roleDefinitions', {
                  context: this.context,
                  label: 'Role Definitions',
                  roleDefinitions: this.properties.roleDefinitions,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  key: 'roleDefinitionsId'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
