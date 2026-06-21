import { type IDropdownOption, Text } from '@fluentui/react';
import React, { FC, useEffect, useMemo, useState } from 'react';

import type { IDynamicDataSourceViewModel, IDynamicFieldFiltersViewModel } from '../types';
import { DropdownComponent } from './DropdownComponent';

interface IDynamicFieldComponentProps {
  currentReference?: string;
  currentValue?: string;
  filters?: IDynamicFieldFiltersViewModel;
  label?: string;
  onChange: (reference: string | undefined) => void;
  sourceLabel?: string;
  sources: IDynamicDataSourceViewModel[];
}

const WHOLE_OBJECT_OPTION_KEY = '__dynamic-field-whole-object__';

function normalizeComponentId(componentId?: string | { toString(): string }): string | undefined {
  if (!componentId) {
    return undefined;
  }

  return typeof componentId === 'string' ? componentId : componentId.toString();
}

function parseReferenceParts(reference?: string): {
  pathSegments: string[];
  propertyId?: string;
  sourceId?: string;
} {
  if (!reference) {
    return { pathSegments: [] };
  }

  const [sourceId, propertyId, ...pathSegments] = reference.split(':');
  return {
    pathSegments: pathSegments.flatMap((segment) => segment.split('.').filter(Boolean)),
    propertyId,
    sourceId,
  };
}

function getObjectChildKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((_, index) => String(index));
  }

  return Object.keys(value as Record<string, unknown>);
}

function getNestedValue(value: unknown, pathSegments: string[]): unknown {
  return pathSegments.reduce<unknown>((currentValue, segment) => {
    if (!currentValue || typeof currentValue !== 'object') {
      return undefined;
    }

    if (Array.isArray(currentValue)) {
      const index = Number(segment);
      return Number.isNaN(index) ? undefined : currentValue[index];
    }

    return (currentValue as Record<string, unknown>)[segment];
  }, value);
}

function isObjectLike(value: unknown): boolean {
  return typeof value === 'object' && value !== null;
}

function formatPropertiesLabel(name: string): string {
  const template =
    window.__workbenchConfig?.dynamicDataStrings?.propertiesLabelFormat ?? "{0}'s properties";
  return template.replace('{0}', name);
}

function getNestedPropertyDisplayLabel(
  sourceTitle: string | undefined,
  propertyId: string | undefined,
  childKey: string,
): string {
  const strings = window.__workbenchConfig?.dynamicDataStrings;

  if (sourceTitle === strings?.pageEnvironmentSourceTitle && propertyId === 'siteProperties') {
    const sitePropertyLabels: Record<string, string | undefined> = {
      itemId: strings?.itemIdLabel,
      listUrl: strings?.listUrlLabel,
      siteClassification: strings?.siteClassificationLabel,
      siteCollectionUrl: strings?.siteCollectionUrlLabel,
      siteDescription: strings?.siteDescriptionLabel,
      siteLogoUrl: strings?.siteLogoUrlLabel,
      siteTitle: strings?.siteTitleLabel,
      siteUrl: strings?.siteUrlLabel,
    };

    return sitePropertyLabels[childKey] ?? childKey;
  }

  if (
    sourceTitle === strings?.pageEnvironmentSourceTitle &&
    propertyId === 'currentUserInformation'
  ) {
    const currentUserLabels: Record<string, string | undefined> = {
      userEmail: strings?.userEmailLabel,
      userLogin: strings?.userLoginLabel,
      userName: strings?.userNameLabel,
    };

    return currentUserLabels[childKey] ?? childKey;
  }

  if (sourceTitle === strings?.pageEnvironmentSourceTitle && propertyId === 'queryString') {
    const queryStringLabels: Record<string, string | undefined> = {
      fragment: strings?.fragmentLabel,
      queryParameters: strings?.queryParametersLabel,
    };

    return queryStringLabels[childKey] ?? childKey;
  }

  return childKey;
}

function getForcedPropertyId(
  source: IDynamicDataSourceViewModel | undefined,
  filters?: IDynamicFieldFiltersViewModel,
): string | undefined {
  if (!filters?.propertyId) {
    return undefined;
  }

  return source?.properties.find((property) => property.id === filters.propertyId)?.id;
}

export const DynamicFieldComponent: FC<IDynamicFieldComponentProps> = ({
  currentReference,
  currentValue,
  filters,
  label,
  onChange,
  sourceLabel = 'Connect to source',
  sources,
}) => {
  const [optimisticReference, setOptimisticReference] = useState<string | undefined>();
  const effectiveReference = optimisticReference ?? currentReference;
  const parsedReference = useMemo(
    () => parseReferenceParts(effectiveReference),
    [effectiveReference],
  );
  const [pendingSourceId, setPendingSourceId] = useState<string | undefined>(
    parsedReference.sourceId,
  );
  const [pendingPropertyId, setPendingPropertyId] = useState<string | undefined>(
    parsedReference.propertyId,
  );
  const [pendingPathSegments, setPendingPathSegments] = useState<string[]>(
    parsedReference.pathSegments,
  );

  useEffect(() => {
    console.debug('[DynamicDataTrace] DynamicFieldComponent prop sync', {
      currentReference,
      currentValue,
      effectiveReference,
      optimisticReference,
      parsedReference,
      pendingSourceId,
      pendingPropertyId,
      pendingPathSegments,
    });

    if (optimisticReference !== undefined) {
      if (currentReference === optimisticReference) {
        setOptimisticReference(undefined);
      } else if (currentReference === undefined) {
        return;
      } else {
        setOptimisticReference(undefined);
      }
    }

    const hasLocalSelection =
      !!pendingSourceId || !!pendingPropertyId || pendingPathSegments.length > 0;
    const hasIncomingReference =
      !!parsedReference.sourceId ||
      !!parsedReference.propertyId ||
      parsedReference.pathSegments.length > 0;

    if (!hasIncomingReference && hasLocalSelection) {
      return;
    }

    setPendingSourceId(parsedReference.sourceId);
    setPendingPropertyId(parsedReference.propertyId);
    setPendingPathSegments(parsedReference.pathSegments);
  }, [
    currentReference,
    optimisticReference,
    parsedReference.pathSegments,
    parsedReference.propertyId,
    parsedReference.sourceId,
    pendingPathSegments.length,
    pendingPropertyId,
    pendingSourceId,
  ]);

  const emitReferenceChange = (reference: string | undefined) => {
    console.debug('[DynamicDataTrace] DynamicFieldComponent emitReferenceChange', {
      currentReference,
      nextReference: reference,
      optimisticReference,
      pendingSourceId,
      pendingPropertyId,
      pendingPathSegments,
    });
    setOptimisticReference(reference);
    onChange(reference);
  };

  const filteredSources = useMemo(
    () =>
      sources.filter((source) => {
        const filteredComponentId = normalizeComponentId(filters?.componentId);

        if (filteredComponentId && source.metadata?.componentId !== filteredComponentId) {
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
  const effectiveSourceId = forcedSource?.id || pendingSourceId || parsedReference.sourceId;

  const sourceOptions = useMemo<IDropdownOption[]>(
    () =>
      [...sourceOptionsBase]
        .sort((left, right) =>
          (left.metadata?.title || left.id).localeCompare(right.metadata?.title || right.id),
        )
        .map((source) => ({
          key: source.id,
          text: source.metadata?.title || source.id,
        })),
    [sourceOptionsBase],
  );

  const selectedSource = sourceOptionsBase.find((source) => source.id === effectiveSourceId);
  const propertyId =
    effectiveSourceId === parsedReference.sourceId
      ? (pendingPropertyId ?? parsedReference.propertyId)
      : pendingPropertyId;
  const filteredPropertiesBase = selectedSource?.properties || [];
  const forcedPropertyId = getForcedPropertyId(selectedSource, filters);
  const forcedProperty = forcedPropertyId
    ? filteredPropertiesBase.find((property) => property.id === forcedPropertyId)
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

  const selectedProperty = propertyOptionsBase.find(
    (property) => property.id === effectivePropertyId,
  );
  const selectedPropertyValue =
    effectivePropertyId && selectedSource?.getPropertyValue
      ? selectedSource.getPropertyValue(effectivePropertyId)
      : undefined;

  const nestedPathSegments = pendingPathSegments;

  const nestedDropdowns = useMemo(() => {
    if (!selectedProperty || !isObjectLike(selectedPropertyValue)) {
      return [];
    }

    const dropdowns: Array<{
      basePath: string[];
      key: string;
      label: string;
      options: IDropdownOption[];
      selectedKey: string;
      onChange: (value: string | number | undefined) => void;
    }> = [];

    let currentValue: unknown = selectedPropertyValue;
    let currentLabel = selectedProperty.title;
    const basePath: string[] = [];

    while (isObjectLike(currentValue)) {
      const selectedSegment = nestedPathSegments[basePath.length] ?? '';
      const childKeys = getObjectChildKeys(currentValue);
      const pathBaseForDropdown = [...basePath];

      dropdowns.push({
        basePath: pathBaseForDropdown,
        key: `${selectedProperty.id}-${basePath.join('.') || 'root'}`,
        label: formatPropertiesLabel(currentLabel),
        onChange: (value) => {
          const nextSegment =
            typeof value === 'string' && value !== WHOLE_OBJECT_OPTION_KEY ? value : '';
          const nextPathSegments = [...pathBaseForDropdown];

          if (nextSegment) {
            nextPathSegments.push(nextSegment);
          }

          emitReferenceChange(
            effectiveSourceId && effectivePropertyId
              ? `${effectiveSourceId}:${effectivePropertyId}${nextPathSegments.length ? `:${nextPathSegments.join('.')}` : ''}`
              : undefined,
          );
        },
        options: [
          { key: WHOLE_OBJECT_OPTION_KEY, text: '' },
          ...childKeys.map((childKey) => ({
            key: childKey,
            text: getNestedPropertyDisplayLabel(
              selectedSource?.metadata?.title,
              effectivePropertyId,
              childKey,
            ),
          })),
        ],
        selectedKey: selectedSegment || WHOLE_OBJECT_OPTION_KEY,
      });

      if (!selectedSegment) {
        break;
      }

      basePath.push(selectedSegment);
      currentValue = getNestedValue(selectedPropertyValue, basePath);
      currentLabel = selectedSegment;
    }

    return dropdowns;
  }, [
    effectivePropertyId,
    effectiveSourceId,
    nestedPathSegments,
    onChange,
    selectedProperty,
    selectedPropertyValue,
  ]);

  return (
    <div className="pp-field" style={{ marginTop: 12 }}>
      {label && (
        <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
          {label}
        </Text>
      )}
      <DropdownComponent
        label={sourceLabel}
        disabled={!!forcedSource}
        selectedKey={effectiveSourceId}
        options={sourceOptions}
        onChange={(value) => {
          const nextSourceId = typeof value === 'string' ? value : undefined;
          const nextSelectedSource = sourceOptionsBase.find((source) => source.id === nextSourceId);
          const nextForcedPropertyId = getForcedPropertyId(nextSelectedSource, filters);
          console.debug('[DynamicDataTrace] DynamicFieldComponent source change', {
            nextForcedPropertyId,
            nextSourceId,
            previousSourceId: effectiveSourceId,
          });
          setPendingSourceId(nextSourceId);
          setPendingPropertyId(nextForcedPropertyId);
          setPendingPathSegments([]);
          emitReferenceChange(
            nextSourceId && nextForcedPropertyId
              ? `${nextSourceId}:${nextForcedPropertyId}`
              : undefined,
          );
        }}
      />
      {selectedSource && !forcedProperty && (
        <DropdownComponent
          label={formatPropertiesLabel(selectedSource.metadata?.title || selectedSource.id)}
          selectedKey={effectivePropertyId}
          options={propertyOptions}
          onChange={(value) => {
            const nextPropertyId = typeof value === 'string' ? value : undefined;
            console.debug('[DynamicDataTrace] DynamicFieldComponent property change', {
              sourceId: effectiveSourceId,
              nextPropertyId,
              previousPropertyId: effectivePropertyId,
            });
            setPendingPropertyId(nextPropertyId);
            setPendingPathSegments([]);
            emitReferenceChange(
              effectiveSourceId && nextPropertyId
                ? `${effectiveSourceId}:${nextPropertyId}`
                : undefined,
            );
          }}
        />
      )}
      {nestedDropdowns.map((dropdown) => (
        <DropdownComponent
          key={dropdown.key}
          label={dropdown.label}
          selectedKey={dropdown.selectedKey}
          options={dropdown.options}
          onChange={(value) => {
            const nextSegment =
              typeof value === 'string' && value !== WHOLE_OBJECT_OPTION_KEY ? value : '';
            const resolvedPathSegments = nextSegment
              ? [...dropdown.basePath, nextSegment]
              : dropdown.basePath;
            console.debug('[DynamicDataTrace] DynamicFieldComponent nested change', {
              sourceId: effectiveSourceId,
              propertyId: effectivePropertyId,
              basePath: dropdown.basePath,
              optionValue: value,
              nextSegment,
              resolvedPathSegments,
            });
            setPendingPathSegments(resolvedPathSegments);
            dropdown.onChange(
              value === WHOLE_OBJECT_OPTION_KEY ? undefined : value,
            );
          }}
        />
      ))}
    </div>
  );
};
