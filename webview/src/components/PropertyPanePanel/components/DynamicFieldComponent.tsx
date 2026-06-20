import { Dropdown, Text, type IDropdownOption } from '@fluentui/react';
import React, { FC, useMemo } from 'react';

import type { IDynamicDataSourceViewModel, IDynamicFieldFiltersViewModel } from '../types';

interface IDynamicFieldComponentProps {
  currentReference?: string;
  currentValue?: string;
  filters?: IDynamicFieldFiltersViewModel;
  label?: string;
  onChange: (reference: string | undefined) => void;
  propertyLabel?: string;
  sourceLabel?: string;
  sources: IDynamicDataSourceViewModel[];
}

function parseReference(reference?: string): { propertyId?: string; sourceId?: string } {
  if (!reference) {
    return {};
  }

  const [sourceId, propertyId] = reference.split(':');
  return { propertyId, sourceId };
}

export const DynamicFieldComponent: FC<IDynamicFieldComponentProps> = ({
  currentReference,
  currentValue,
  filters,
  label,
  onChange,
  propertyLabel = 'Property',
  sourceLabel = 'Connect to source',
  sources,
}) => {
  const { propertyId, sourceId } = parseReference(currentReference);

  const filteredSources = useMemo(
    () =>
      sources.filter((source) => {
        if (filters?.componentId && source.metadata?.componentId !== filters.componentId) {
          return false;
        }
        return true;
      }),
    [filters?.componentId, sources],
  );

  const forcedSource = filters?.sourceId
    ? filteredSources.find((source) => source.id === filters.sourceId)
    : undefined;
  const sourceOptionsBase = forcedSource ? [forcedSource] : filteredSources;
  const effectiveSourceId = forcedSource?.id || sourceId;

  const sourceOptions = useMemo<IDropdownOption[]>(
    () =>
      sourceOptionsBase.map((source) => ({
        key: source.id,
        text: source.metadata?.title || source.id,
      })),
    [sourceOptionsBase],
  );

  const selectedSource = sourceOptionsBase.find((source) => source.id === effectiveSourceId);
  const filteredPropertiesBase = selectedSource?.properties || [];
  const forcedProperty = filters?.propertyId
    ? filteredPropertiesBase.find((property) => property.id === filters.propertyId)
    : undefined;
  const propertyOptionsBase = forcedProperty ? [forcedProperty] : filteredPropertiesBase;
  const effectivePropertyId = forcedProperty?.id || propertyId;
  const propertyOptions = useMemo<IDropdownOption[]>(
    () =>
      propertyOptionsBase.map((property) => ({
        key: property.id,
        text: property.title,
      })),
    [propertyOptionsBase],
  );

  return (
    <div className="pp-field">
      {label && <Text variant="mediumPlus">{label}</Text>}
      <Dropdown
        label={sourceLabel}
        disabled={!!forcedSource}
        selectedKey={effectiveSourceId}
        options={sourceOptions}
        onChange={(_, option) => {
          const nextSourceId = typeof option?.key === 'string' ? option.key : undefined;
          const nextSource = sourceOptionsBase.find((source) => source.id === nextSourceId);
          const nextPropertyId = filters?.propertyId && nextSource?.properties.some((property) => property.id === filters.propertyId)
            ? filters.propertyId
            : nextSource?.properties[0]?.id;
          onChange(nextSourceId && nextPropertyId ? `${nextSourceId}:${nextPropertyId}` : undefined);
        }}
      />
      <Dropdown
        disabled={!selectedSource || !!forcedProperty}
        label={propertyLabel}
        selectedKey={effectivePropertyId}
        options={propertyOptions}
        onChange={(_, option) => {
          const nextPropertyId = typeof option?.key === 'string' ? option.key : undefined;
          onChange(effectiveSourceId && nextPropertyId ? `${effectiveSourceId}:${nextPropertyId}` : undefined);
        }}
      />
      {currentValue !== undefined && <Text variant="small">Current value: {currentValue}</Text>}
    </div>
  );
};
