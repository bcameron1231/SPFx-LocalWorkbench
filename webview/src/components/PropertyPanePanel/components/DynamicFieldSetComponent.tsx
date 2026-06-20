import { Dropdown, Stack, Text, type IDropdownOption } from '@fluentui/react';
import React, { FC, useMemo } from 'react';

import type {
  IDynamicDataSourceViewModel,
  IDynamicFieldFiltersViewModel,
  IDynamicFieldSetViewModel,
} from '../types';

interface IDynamicFieldSetEntry {
  filters?: IDynamicFieldFiltersViewModel;
  key: string;
  label?: string;
  reference?: string;
  value?: string;
}

interface IDynamicFieldSetComponentProps {
  entries: IDynamicFieldSetEntry[];
  label?: string;
  onChange: (targetProperty: string, reference: string | undefined) => void;
  sharedConfiguration?: IDynamicFieldSetViewModel['sharedConfiguration'];
  sources: IDynamicDataSourceViewModel[];
}

function parseReference(reference?: string): { propertyId?: string; sourceId?: string } {
  if (!reference) {
    return {};
  }

  const [sourceId, propertyId] = reference.split(':');
  return { propertyId, sourceId };
}

export const DynamicFieldSetComponent: FC<IDynamicFieldSetComponentProps> = ({
  entries,
  label,
  onChange,
  sharedConfiguration,
  sources,
}) => {
  const sharedDepth = sharedConfiguration?.depth ?? 0;
  const sharedSourceEnabled = sharedDepth >= 1;
  const sharedPropertyEnabled = sharedDepth >= 2;
  const sharedSourceFilters = sharedConfiguration?.source?.filters;
  const sharedPropertyFilters = sharedConfiguration?.property?.filters;
  const sharedSourceLabel = sharedConfiguration?.source?.sourcesLabel || 'Shared source';

  const availableSources = useMemo(
    () =>
      sources.filter((source) => {
        if (sharedSourceFilters?.componentId && source.metadata?.componentId !== sharedSourceFilters.componentId) {
          return false;
        }
        return true;
      }),
    [sharedSourceFilters?.componentId, sources],
  );

  const sharedSourceId = sharedSourceEnabled
    ? sharedSourceFilters?.sourceId ||
      entries.map((entry) => parseReference(entry.reference).sourceId).find(Boolean)
    : undefined;
  const sharedSource = availableSources.find((source) => source.id === sharedSourceId);
  const sharedSourceOptions = useMemo<IDropdownOption[]>(
    () =>
      (sharedSourceFilters?.sourceId && sharedSource ? [sharedSource] : availableSources).map((source) => ({
        key: source.id,
        text: source.metadata?.title || source.id,
      })),
    [availableSources, sharedSource, sharedSourceFilters?.sourceId],
  );

  const sharedPropertyId = sharedPropertyEnabled
    ? sharedPropertyFilters?.propertyId ||
      entries.map((entry) => parseReference(entry.reference).propertyId).find(Boolean)
    : undefined;
  const sharedPropertySource = sharedSource;
  const sharedPropertyOptions = useMemo<IDropdownOption[]>(
    () =>
      (sharedPropertyFilters?.propertyId && sharedPropertySource?.properties.some((property) => property.id === sharedPropertyFilters.propertyId)
        ? sharedPropertySource.properties.filter((property) => property.id === sharedPropertyFilters.propertyId)
        : sharedPropertySource?.properties || []
      ).map((property) => ({
        key: property.id,
        text: property.title,
      })),
    [sharedPropertyFilters?.propertyId, sharedPropertySource],
  );

  const updateAllEntries = (sourceId: string | undefined, propertyId: string | undefined) => {
    for (const entry of entries) {
      onChange(entry.key, sourceId && propertyId ? `${sourceId}:${propertyId}` : undefined);
    }
  };

  return (
    <Stack tokens={{ childrenGap: 12 }} className="pp-field">
      {label && <Text variant="mediumPlus">{label}</Text>}
      {sharedSourceEnabled && (
        <Dropdown
          label={sharedSourceLabel}
          selectedKey={sharedSourceId}
          disabled={!!sharedSourceFilters?.sourceId}
          options={sharedSourceOptions}
          onChange={(_, option) => {
            const nextSourceId = typeof option?.key === 'string' ? option.key : undefined;
            const nextSource = availableSources.find((source) => source.id === nextSourceId);
            const nextPropertyId =
              sharedPropertyFilters?.propertyId && nextSource?.properties.some((property) => property.id === sharedPropertyFilters.propertyId)
                ? sharedPropertyFilters.propertyId
                : nextSource?.properties[0]?.id;
            updateAllEntries(nextSourceId, nextPropertyId);
          }}
        />
      )}
      {sharedPropertyEnabled && (
        <Dropdown
          label="Shared property"
          disabled={!sharedSourceId || !!sharedPropertyFilters?.propertyId}
          selectedKey={sharedPropertyId}
          options={sharedPropertyOptions}
          onChange={(_, option) => {
            const nextPropertyId = typeof option?.key === 'string' ? option.key : undefined;
            updateAllEntries(sharedSourceId, nextPropertyId);
          }}
        />
      )}
      {entries.map((entry) => {
        const { propertyId, sourceId } = parseReference(entry.reference);
        const sourceFilters = entry.filters;
        const entrySources = availableSources.filter((source) => {
          if (sourceFilters?.componentId && source.metadata?.componentId !== sourceFilters.componentId) {
            return false;
          }
          return true;
        });
        const forcedEntrySource = sourceFilters?.sourceId
          ? entrySources.find((source) => source.id === sourceFilters.sourceId)
          : undefined;
        const effectiveSourceId = sharedSourceId || forcedEntrySource?.id || sourceId;
        const selectedSource = entrySources.find((source) => source.id === effectiveSourceId);
        const forcedEntryProperty = sourceFilters?.propertyId
          ? selectedSource?.properties.find((property) => property.id === sourceFilters.propertyId)
          : undefined;
        const effectivePropertyId = sharedPropertyId || forcedEntryProperty?.id || propertyId;
        const propertyOptions: IDropdownOption[] = (
          forcedEntryProperty ? [forcedEntryProperty] : selectedSource?.properties || []
        ).map((property) => ({
          key: property.id,
          text: property.title,
        }));

        return (
          <Stack key={entry.key} tokens={{ childrenGap: 6 }}>
            <Text>{entry.label || entry.key}</Text>
            {!sharedSourceEnabled && (
              <Dropdown
                label="Source"
                disabled={!!forcedEntrySource}
                selectedKey={effectiveSourceId}
                options={entrySources.map((source) => ({
                  key: source.id,
                  text: source.metadata?.title || source.id,
                }))}
                onChange={(_, option) => {
                  const nextSourceId = typeof option?.key === 'string' ? option.key : undefined;
                  const nextPropertyId =
                    sourceFilters?.propertyId &&
                    entrySources.find((source) => source.id === nextSourceId)?.properties.some((property) => property.id === sourceFilters.propertyId)
                      ? sourceFilters.propertyId
                      : entrySources.find((source) => source.id === nextSourceId)?.properties[0]?.id;
                  onChange(entry.key, nextSourceId && nextPropertyId ? `${nextSourceId}:${nextPropertyId}` : undefined);
                }}
              />
            )}
            {!sharedPropertyEnabled && (
              <Dropdown
                disabled={!effectiveSourceId || !!forcedEntryProperty}
                label="Property"
                selectedKey={effectivePropertyId}
                options={propertyOptions}
                onChange={(_, option) => {
                  const nextPropertyId = typeof option?.key === 'string' ? option.key : undefined;
                  onChange(
                    entry.key,
                    effectiveSourceId && nextPropertyId ? `${effectiveSourceId}:${nextPropertyId}` : undefined,
                  );
                }}
              />
            )}
            {entry.value !== undefined && <Text variant="small">Current value: {entry.value}</Text>}
          </Stack>
        );
      })}
    </Stack>
  );
};
