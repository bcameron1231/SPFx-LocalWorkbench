import { IDateTimeFieldValue } from '@pnp/spfx-property-controls/lib/PropertyFieldDateTimePicker';
import type { IManifestMetadata } from '../../shared/components/ManifestMetadataBadge';

export interface IPnpControlsProps {
  manifestInfo: IManifestMetadata;
  // Text & colour
  color: string;
  swatchColor: string;
  brandFont: string;
  iconName: string;
  password: string;
  searchValue: string;
  htmlCode: string;
  monacoCode: string;
  guid: string;
  // Numbers & selections
  dateTime: IDateTimeFieldValue;
  numberValue: number;
  spinValue: number;
  multiSelect: string[];
  orderedItems: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  collectionData: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  gridItems: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  // SharePoint pickers
  lists: string;
  column: string;
  view: string;
  people: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  teams: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  filePickerResult: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  folderPicker: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  terms: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  enterpriseTerms: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  sites: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  roleDefinitions: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}
