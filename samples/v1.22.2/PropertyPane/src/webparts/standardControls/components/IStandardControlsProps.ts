import type { IManifestMetadata } from '../../shared/components/ManifestMetadataBadge';

export interface IStandardControlsProps {
  textField: string;
  toggle: boolean;
  checkbox: boolean;
  dropdown: string;
  slider: number;
  choiceGroup: string;
  manifestInfo: IManifestMetadata;
}
