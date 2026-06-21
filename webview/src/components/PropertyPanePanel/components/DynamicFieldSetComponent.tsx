import { Stack, type IDropdownOption } from '@fluentui/react';
import React, { FC, useEffect, useMemo, useState } from 'react';

import { DropdownComponent } from './DropdownComponent';
import { DynamicFieldComponent } from './DynamicFieldComponent';
import type {
  IDynamicDataSourceViewModel,
  IDynamicFieldSetViewModel,
} from '../types';

interface IDynamicFieldSetEntry {
  key: string;
  label?: string;
  propertyValueDepth?: number;
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

function normalizeComponentId(componentId?: string | { toString(): string }): string | undefined {
  if (!componentId) {
    return undefined;
  }

  return typeof componentId === 'string' ? componentId : componentId.toString();
}

function parseReference(reference?: string): { propertyId?: string; sourceId?: string } {
  if (!reference) {
    return {};
  }

  const [sourceId, propertyId] = reference.split(':');
  return { propertyId, sourceId };
}

function formatPropertiesLabel(name: string): string {
  const template =
    window.__workbenchConfig?.dynamicDataStrings?.propertiesLabelFormat ?? "{0}'s properties";
  return template.replace('{0}', name);
}

export const DynamicFieldSetComponent: FC<IDynamicFieldSetComponentProps> = ({
  entries,
  label: _label,
  onChange,
  sharedConfiguration,
  sources,
}) => {
  const sharedDepth = sharedConfiguration?.depth ?? 0;
  const sharedSourceEnabled = sharedDepth >= 1;
  const sharedPropertyEnabled = sharedDepth >= 2;
  const sharedSourceFilters = sharedConfiguration?.source?.filters;
  const sharedPropertyFilters = sharedConfiguration?.property?.filters;
  const sharedSourceLabel = sharedConfiguration?.source?.sourcesLabel || 'Connect to source';

  const availableSources = useMemo(
    () =>
      sources.filter((source) => {
        const filteredComponentId = normalizeComponentId(sharedSourceFilters?.componentId);

        if (filteredComponentId && source.metadata?.componentId !== filteredComponentId) {
          return false;
        }
        return true;
      }),
    [sharedSourceFilters?.componentId, sources],
  );

  const derivedSharedSourceId = sharedSourceEnabled
    ? sharedSourceFilters?.sourceId ||
      entries.map((entry) => parseReference(entry.reference).sourceId).find(Boolean)
    : undefined;
  const [sharedSourceId, setSharedSourceId] = useState<string | undefined>(derivedSharedSourceId);
  const derivedSharedPropertyId =
    sharedPropertyEnabled && derivedSharedSourceId
      ? sharedPropertyFilters?.propertyId ||
        entries.map((entry) => parseReference(entry.reference).propertyId).find(Boolean)
      : undefined;
  const [sharedPropertyId, setSharedPropertyId] = useState<string | undefined>(
    derivedSharedPropertyId,
  );

  useEffect(() => {
    setSharedSourceId(derivedSharedSourceId);
  }, [derivedSharedSourceId]);

  useEffect(() => {
    setSharedPropertyId(derivedSharedPropertyId);
  }, [derivedSharedPropertyId]);

  const sharedSource = availableSources.find((source) => source.id === sharedSourceId);
  const sharedSourceOptions = useMemo<IDropdownOption[]>(
    () =>
      (sharedSourceFilters?.sourceId && sharedSource ? [sharedSource] : availableSources)
        .sort((left, right) =>
          (left.metadata?.title || left.id).localeCompare(right.metadata?.title || right.id),
        )
        .map((source) => ({
          key: source.id,
          text: source.metadata?.title || source.id,
        })),
    [availableSources, sharedSource, sharedSourceFilters?.sourceId],
  );
  const forcedSharedPropertyId = sharedPropertyFilters?.propertyId;
  const sharedPropertyOptions = useMemo<IDropdownOption[]>(
    () =>
      (forcedSharedPropertyId
        ? sharedSource?.properties.filter((property) => property.id === forcedSharedPropertyId) ||
          []
        : sharedSource?.properties || []
      ).map((property) => ({
        key: property.id,
        text: property.title,
      })),
    [forcedSharedPropertyId, sharedSource?.properties],
  );

  const displayEntries = useMemo(
    () =>
      entries.map((entry) => {
        const parsedEntryReference = parseReference(entry.reference);
        const sourceMatches = !sharedSourceEnabled || parsedEntryReference.sourceId === sharedSourceId;
        const propertyMatches =
          !sharedPropertyEnabled || parsedEntryReference.propertyId === sharedPropertyId;

        return {
          ...entry,
          displayReference: sourceMatches && propertyMatches ? entry.reference : undefined,
        };
      }),
    [entries, sharedPropertyEnabled, sharedPropertyId, sharedSourceEnabled, sharedSourceId],
  );

  return (
    <Stack tokens={{ childrenGap: 12 }} className="pp-field">
      {sharedSourceEnabled && (
        <DropdownComponent
          label={sharedSourceLabel}
          selectedKey={sharedSourceId}
          disabled={!!sharedSourceFilters?.sourceId}
          options={sharedSourceOptions}
          onChange={(value) => {
            const nextSourceId = typeof value === 'string' ? value : undefined;
            const nextSharedSource = availableSources.find((source) => source.id === nextSourceId);
            const nextSharedPropertyId = sharedPropertyEnabled
              ? nextSharedSource?.properties.find(
                  (property) => property.id === forcedSharedPropertyId,
                )?.id
              : undefined;

            setSharedSourceId(nextSourceId);
            setSharedPropertyId(nextSharedPropertyId);

            if (sharedPropertyEnabled && nextSourceId && nextSharedPropertyId) {
              for (const entry of entries) {
                onChange(entry.key, `${nextSourceId}:${nextSharedPropertyId}`);
              }
            }
          }}
        />
      )}
      {sharedPropertyEnabled && sharedSourceId && !forcedSharedPropertyId && (
        <DropdownComponent
          label={formatPropertiesLabel(sharedSource?.metadata?.title || sharedSourceId)}
          selectedKey={sharedPropertyId ?? null}
          options={sharedPropertyOptions}
          onChange={(value) => {
            const nextPropertyId = typeof value === 'string' ? value : undefined;
            setSharedPropertyId(nextPropertyId);

            if (sharedSourceId && nextPropertyId) {
              for (const entry of entries) {
                onChange(entry.key, `${sharedSourceId}:${nextPropertyId}`);
              }
            }
          }}
        />
      )}
      {(!sharedSourceEnabled || sharedSourceId) &&
        (!sharedPropertyEnabled || sharedPropertyId) &&
        displayEntries.map((entry) => (
          <DynamicFieldComponent
            key={`${entry.key}:${sharedSourceId ?? ''}:${sharedPropertyId ?? ''}`}
            currentReference={entry.displayReference}
            currentValue={entry.value}
            filters={
              sharedPropertyEnabled
                ? {
                    propertyId: sharedPropertyId,
                    sourceId: sharedSourceId,
                  }
                : sharedSourceEnabled
                  ? {
                      sourceId: sharedSourceId,
                    }
                  : undefined
            }
            hideSourceDropdown={sharedSourceEnabled}
            label={entry.label}
            propertyValueDepth={entry.propertyValueDepth}
            sourceLabel="Connect to source"
            sources={sources}
            onChange={(reference) => onChange(entry.key, reference)}
          />
        ))}
    </Stack>
  );
};
