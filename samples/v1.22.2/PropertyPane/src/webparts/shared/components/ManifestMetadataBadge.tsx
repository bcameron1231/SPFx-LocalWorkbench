import * as React from 'react';
import styles from './ManifestMetadataBadge.module.scss';

export interface IManifestMetadata {
  alias: string;
  id: string;
  version: string;
}

export interface IManifestMetadataBadgeProps {
  manifestInfo: IManifestMetadata;
}

export function getManifestMetadata(manifest: {
  alias?: string;
  id?: unknown;
  version?: unknown;
}): IManifestMetadata {
  return {
    alias: manifest.alias ?? '(unknown alias)',
    id: String(manifest.id ?? '(unknown id)'),
    version: String(manifest.version ?? '(unknown version)'),
  };
}

export default function ManifestMetadataBadge(
  props: IManifestMetadataBadgeProps,
): React.ReactElement<IManifestMetadataBadgeProps> {
  const { manifestInfo } = props;

  return (
    <aside className={styles.badge} aria-label="Sample manifest metadata">
      <span>{manifestInfo.version}</span>
      <span title={`Alias: ${manifestInfo.alias}\nID: ${manifestInfo.id}`}>
        {manifestInfo.alias}
      </span>
    </aside>
  );
}
