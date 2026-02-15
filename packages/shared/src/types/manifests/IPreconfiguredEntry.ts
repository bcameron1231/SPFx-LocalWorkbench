import type { ILocalizedString } from '../ILocalizedString';

/**
 * Preconfigured entry for component
 * Defines default configuration shown in toolbox/add panel
 */
export interface IPreconfiguredEntry {
  /** Display title (localized) */
  title: ILocalizedString;
  
  /** Description (localized) */
  description: ILocalizedString;
  
  /** Office UI Fabric icon name */
  officeFabricIconFontName?: string;
  
  /** Custom icon URL */
  iconImageUrl?: string;
  
  /** Toolbox group ID */
  groupId: string;
  
  /** Toolbox group name (localized) */
  group?: ILocalizedString;
  
  /** Default property values */
  properties?: Record<string, any>;
}
