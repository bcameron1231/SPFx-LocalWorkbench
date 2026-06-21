import type { IPageContextConfig } from '@spfx-local-workbench/shared';

interface IDynamicDataReferenceLike {
  property?: string;
  propertyPath?: string;
  reference?: string;
  sourceId?: string;
}

interface IDynamicDataSourceMetadataLike {
  alias?: string;
  componentId?: string;
  description?: string;
  instanceId?: string;
  title: string;
}

interface IDynamicDataPropertyDefinitionLike {
  description?: string;
  id: string;
  title: string;
}

interface IDynamicDataSourceLike {
  allowedEventsAsync?: () => Promise<ReadonlyArray<unknown>>;
  getAnnotatedPropertyValue: (propertyId: string) => unknown;
  getAnnotatedPropertyValueAsync: (propertyId: string) => Promise<unknown>;
  getPropertyDefinitions: () => ReadonlyArray<IDynamicDataPropertyDefinitionLike>;
  getPropertyDefinitionsAsync: () => Promise<ReadonlyArray<IDynamicDataPropertyDefinitionLike>>;
  getPropertyValue: (propertyId: string) => unknown;
  getPropertyValueAsync: (propertyId: string) => Promise<unknown>;
  id: string;
  metadata: IDynamicDataSourceMetadataLike;
  sendEvent?: (eventName: string, data: unknown) => void;
}

interface IDynamicDataCallablesLike {
  allowedEvents?: () => ReadonlyArray<unknown>;
  getAnnotatedPropertyValue?: (propertyId: string) => unknown;
  getPropertyDefinitions: () => ReadonlyArray<IDynamicDataPropertyDefinitionLike>;
  getPropertyValue: (propertyId: string) => unknown;
  sendEvent?: (eventName: string, data: unknown) => void;
}

interface IRegisteredSource {
  callables?: IDynamicDataCallablesLike;
  componentId: string;
  id: string;
  instanceId: string;
  metadata: IDynamicDataSourceMetadataLike;
  source: IDynamicDataSourceLike;
}

type DynamicDataCallback = () => void;

const PAGE_ENVIRONMENT_SOURCE_ID = 'PageContext.PageEnvironment';
const PAGE_ENVIRONMENT_COMPONENT_ID = 'page-environment';
const PAGE_ENVIRONMENT_INSTANCE_ID = 'page-environment';
const DEFAULT_DYNAMIC_DATA_STRINGS = {
  currentUserInformationTitle: 'Current user information',
  fragmentLabel: 'URL fragment',
  itemIdLabel: 'Item id',
  listUrlLabel: 'List link',
  pageEnvironmentDescription:
    'Built-in mock page environment values mapped from the configured SPFx page context.',
  pageEnvironmentSourceAlias: 'Page environment',
  pageEnvironmentSourceTitle: 'Page environment',
  propertiesLabelFormat: "{0}'s properties",
  queryParametersLabel: 'Query parameters',
  queryStringTitle: 'Query string',
  searchTitle: 'Search',
  siteClassificationLabel: 'Site classification',
  siteCollectionUrlLabel: 'Site collection link',
  siteDescriptionLabel: 'Site description',
  siteLogoUrlLabel: 'Site logo',
  sitePropertiesTitle: 'Site properties',
  siteTitleLabel: 'Site title',
  siteUrlLabel: 'Site link',
  userEmailLabel: 'User email',
  userLoginLabel: 'Login name',
  userNameLabel: 'User name',
};

function toAbsoluteUrl(url: string | undefined, baseUrl: string): string {
  if (!url) {
    return '';
  }

  try {
    return new URL(url, `${baseUrl.replace(/\/$/, '')}/`).toString();
  } catch {
    return url;
  }
}

function readQueryParameters(search: string): Record<string, string | string[]> {
  const params = new URLSearchParams(search);
  const values = new Map<string, string[]>();

  params.forEach((value, key) => {
    const existing = values.get(key) ?? [];
    existing.push(value);
    values.set(key, existing);
  });

  return Array.from(values.entries()).reduce<Record<string, string | string[]>>(
    (acc, [key, value]) => {
      acc[key] = value.length === 1 ? value[0] : value;
      return acc;
    },
    {},
  );
}

function buildPageEnvironmentValues(pageContext: IPageContextConfig): Record<string, unknown> {
  const siteAbsoluteUrl = pageContext.site.absoluteUrl;
  const webAbsoluteUrl = pageContext.web.absoluteUrl;

  return {
    currentUserInformation: {
      userName: pageContext.user.displayName,
      userEmail: pageContext.user.email,
      userLogin: pageContext.user.loginName,
    },
    queryString: {
      queryParameters: readQueryParameters(window.location.search),
      fragment: window.location.hash.replace(/^#/, ''),
    },
    search: {},
    siteProperties: {
      siteUrl: webAbsoluteUrl,
      siteCollectionUrl: siteAbsoluteUrl,
      listUrl: toAbsoluteUrl(pageContext.list?.serverRelativeUrl, siteAbsoluteUrl),
      itemId: pageContext.listItem?.id ?? 0,
      siteClassification: pageContext.site.classification ?? '',
      siteTitle: pageContext.web.title ?? '',
      siteDescription: pageContext.web.description ?? '',
      siteLogoUrl: toAbsoluteUrl(pageContext.web.logoUrl, webAbsoluteUrl),
    },
  };
}

function getDynamicDataStrings() {
  return window.__workbenchConfig?.dynamicDataStrings ?? DEFAULT_DYNAMIC_DATA_STRINGS;
}

function getPageEnvironmentPropertyDefinitions(): ReadonlyArray<IDynamicDataPropertyDefinitionLike> {
  const strings = getDynamicDataStrings();

  return [
    {
      id: 'siteProperties',
      title: strings.sitePropertiesTitle,
    },
    {
      id: 'currentUserInformation',
      title: strings.currentUserInformationTitle,
    },
    {
      id: 'queryString',
      title: strings.queryStringTitle,
    },
    {
      id: 'search',
      title: strings.searchTitle,
    },
  ];
}

function parseReference(reference: string): {
  property?: string;
  propertyPath?: string;
  sourceId: string;
} {
  const [sourceId, property, ...rest] = reference.split(':');
  return {
    sourceId,
    property,
    propertyPath: rest.length > 0 ? rest.join(':') : undefined,
  };
}

function getValueAtPath(value: unknown, propertyPath?: string): unknown {
  if (!propertyPath || value === undefined || value === null) {
    return value;
  }

  const normalizedPath = propertyPath.replace(/\[(\d+)\]/g, '.$1');
  return normalizedPath
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((currentValue, segment) => {
      if (currentValue === undefined || currentValue === null) {
        return undefined;
      }

      if (Array.isArray(currentValue)) {
        const index = Number(segment);
        return Number.isNaN(index) ? undefined : currentValue[index];
      }

      if (typeof currentValue === 'object' && segment in currentValue) {
        return (currentValue as Record<string, unknown>)[segment];
      }

      return undefined;
    }, value);
}

function getReferenceParts(reference: IDynamicDataReferenceLike | string): {
  property?: string;
  propertyPath?: string;
  sourceId: string;
} {
  if (typeof reference === 'string') {
    return parseReference(reference);
  }

  if (reference.reference) {
    return parseReference(reference.reference);
  }

  return {
    sourceId: reference.sourceId || '',
    property: reference.property,
    propertyPath: reference.propertyPath,
  };
}

export class DynamicDataHost {
  private availableSourceListeners = new Set<DynamicDataCallback>();
  private pageEnvironmentValues: Record<string, unknown>;
  private propertyChangedListeners = new Map<string, Map<string, Set<DynamicDataCallback>>>();
  private sourceChangedListeners = new Map<string, Set<DynamicDataCallback>>();
  private sources = new Map<string, IRegisteredSource>();

  constructor(pageContext: IPageContextConfig) {
    this.pageEnvironmentValues = buildPageEnvironmentValues(pageContext);
    this.registerPageEnvironmentSource();
  }

  createProvider(): Record<string, unknown> {
    return {
      _dynamicDataSourceId: '',
      _getData: <TData>(reference: IDynamicDataReferenceLike | string): TData | undefined => {
        const { property, propertyPath, sourceId } = getReferenceParts(reference);
        const source = this.sources.get(sourceId);

        console.debug('[DynamicDataDebug] provider._getData request', {
          property,
          propertyPath,
          reference:
            typeof reference === 'string'
              ? reference
              : reference.reference ?? {
                  property: reference.property,
                  propertyPath: reference.propertyPath,
                  sourceId: reference.sourceId,
                },
          sourceFound: !!source,
          sourceId,
        });

        if (!source || !property) {
          return undefined;
        }

        const propertyValue = source.source.getPropertyValue(property);
        const resolvedValue = getValueAtPath(propertyValue, propertyPath) as TData | undefined;

        console.debug('[DynamicDataDebug] provider._getData resolved', {
          property,
          propertyPath,
          resolvedValue,
          sourceId,
        });

        return resolvedValue;
      },
      getAvailableSources: (): ReadonlyArray<IDynamicDataSourceLike> =>
        Array.from(this.sources.values()).map((source) => source.source),
      getAvailableSourcesByComponentId: (
        componentId: string,
      ): ReadonlyArray<IDynamicDataSourceLike> =>
        Array.from(this.sources.values())
          .filter((source) => source.componentId === componentId)
          .map((source) => source.source),
      registerAvailableSourcesChanged: (callback: DynamicDataCallback) => {
        this.availableSourceListeners.add(callback);
      },
      registerPropertyChanged: (
        sourceId: string,
        propertyId: string,
        callback: DynamicDataCallback,
      ) => {
        const propertyListeners = this.propertyChangedListeners.get(sourceId) ?? new Map();
        const listeners = propertyListeners.get(propertyId) ?? new Set<DynamicDataCallback>();
        listeners.add(callback);
        propertyListeners.set(propertyId, listeners);
        this.propertyChangedListeners.set(sourceId, propertyListeners);
      },
      registerSourceChanged: (sourceId: string, callback: DynamicDataCallback) => {
        const listeners =
          this.sourceChangedListeners.get(sourceId) ?? new Set<DynamicDataCallback>();
        listeners.add(callback);
        this.sourceChangedListeners.set(sourceId, listeners);
      },
      tryGetSource: (sourceId: string): IDynamicDataSourceLike | undefined =>
        this.sources.get(sourceId)?.source,
      unregisterAvailableSourcesChanged: (callback: DynamicDataCallback) => {
        this.availableSourceListeners.delete(callback);
      },
      unregisterPropertyChanged: (
        sourceId: string,
        propertyId: string,
        callback: DynamicDataCallback,
      ) => {
        const propertyListeners = this.propertyChangedListeners.get(sourceId);
        const listeners = propertyListeners?.get(propertyId);
        listeners?.delete(callback);
      },
      unregisterSourceChanged: (sourceId: string, callback: DynamicDataCallback) => {
        this.sourceChangedListeners.get(sourceId)?.delete(callback);
      },
    };
  }

  createSourceManager(
    componentId: string,
    instanceId: string,
    alias?: string,
  ): Record<string, unknown> {
    const sourceId = `WebPart.${componentId}.${instanceId}`;
    const sourceMetadata: IDynamicDataSourceMetadataLike = {
      alias,
      componentId,
      instanceId,
      title: alias || 'Dynamic Data Source',
    };

    const source: IDynamicDataSourceLike = {
      getAnnotatedPropertyValue: (propertyId: string) => {
        const registeredSource = this.sources.get(sourceId);
        const value = registeredSource?.callables?.getAnnotatedPropertyValue?.(propertyId);
        if (value !== undefined) {
          return value;
        }

        return registeredSource?.callables?.getPropertyValue(propertyId);
      },
      getAnnotatedPropertyValueAsync: async (propertyId: string) =>
        source.getAnnotatedPropertyValue(propertyId),
      getPropertyDefinitions: () =>
        this.sources.get(sourceId)?.callables?.getPropertyDefinitions() || [],
      getPropertyDefinitionsAsync: async () => source.getPropertyDefinitions(),
      getPropertyValue: (propertyId: string) =>
        this.sources.get(sourceId)?.callables?.getPropertyValue(propertyId),
      getPropertyValueAsync: async (propertyId: string) => source.getPropertyValue(propertyId),
      id: sourceId,
      metadata: sourceMetadata,
    };

    const registeredSource: IRegisteredSource = {
      componentId,
      id: sourceId,
      instanceId,
      metadata: sourceMetadata,
      source,
    };

    return {
      dispose: () => {
        this.sources.delete(sourceId);
        this.propertyChangedListeners.delete(sourceId);
        this.sourceChangedListeners.delete(sourceId);
        this.emitAvailableSourcesChanged();
      },
      initializeSource: (callables: IDynamicDataCallablesLike) => {
        registeredSource.callables = callables;
        this.sources.set(sourceId, registeredSource);
        this.emitAvailableSourcesChanged();
      },
      notifyPropertyChanged: (propertyId: string) => {
        this.propertyChangedListeners
          .get(sourceId)
          ?.get(propertyId)
          ?.forEach((listener) => listener());
        this.sourceChangedListeners.get(sourceId)?.forEach((listener) => listener());
      },
      notifySourceChanged: () => {
        this.sourceChangedListeners.get(sourceId)?.forEach((listener) => listener());
      },
      sourceId,
      updateMetadata: (metadata: Partial<IDynamicDataSourceMetadataLike>) => {
        registeredSource.metadata = {
          ...registeredSource.metadata,
          ...metadata,
        };
        registeredSource.source.metadata = registeredSource.metadata;
        this.sources.set(sourceId, registeredSource);
        this.emitAvailableSourcesChanged();
      },
    };
  }

  updatePageContext(pageContext: IPageContextConfig): void {
    this.pageEnvironmentValues = buildPageEnvironmentValues(pageContext);

    getPageEnvironmentPropertyDefinitions().forEach((property) => {
      this.propertyChangedListeners
        .get(PAGE_ENVIRONMENT_SOURCE_ID)
        ?.get(property.id)
        ?.forEach((listener) => listener());
    });

    this.sourceChangedListeners.get(PAGE_ENVIRONMENT_SOURCE_ID)?.forEach((listener) => listener());
  }

  private emitAvailableSourcesChanged(): void {
    this.availableSourceListeners.forEach((listener) => listener());
  }

  private registerPageEnvironmentSource(): void {
    const strings = getDynamicDataStrings();
    const propertyDefinitions = getPageEnvironmentPropertyDefinitions();
    const metadata: IDynamicDataSourceMetadataLike = {
      alias: strings.pageEnvironmentSourceAlias,
      componentId: PAGE_ENVIRONMENT_COMPONENT_ID,
      description: strings.pageEnvironmentDescription,
      instanceId: PAGE_ENVIRONMENT_INSTANCE_ID,
      title: strings.pageEnvironmentSourceTitle,
    };

    const callables: IDynamicDataCallablesLike = {
      getPropertyDefinitions: () => getPageEnvironmentPropertyDefinitions(),
      getPropertyValue: (propertyId: string) => this.pageEnvironmentValues[propertyId],
    };

    this.sources.set(PAGE_ENVIRONMENT_SOURCE_ID, {
      callables,
      componentId: PAGE_ENVIRONMENT_COMPONENT_ID,
      id: PAGE_ENVIRONMENT_SOURCE_ID,
      instanceId: PAGE_ENVIRONMENT_INSTANCE_ID,
      metadata,
      source: {
        getAnnotatedPropertyValue: (propertyId: string) => callables.getPropertyValue(propertyId),
        getAnnotatedPropertyValueAsync: async (propertyId: string) =>
          callables.getPropertyValue(propertyId),
        getPropertyDefinitions: () => getPageEnvironmentPropertyDefinitions(),
        getPropertyDefinitionsAsync: async () => propertyDefinitions,
        getPropertyValue: (propertyId: string) => callables.getPropertyValue(propertyId),
        getPropertyValueAsync: async (propertyId: string) => callables.getPropertyValue(propertyId),
        id: PAGE_ENVIRONMENT_SOURCE_ID,
        metadata,
      },
    });
  }
}
