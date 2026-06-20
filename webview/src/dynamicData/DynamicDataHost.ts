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
  return normalizedPath.split('.').filter(Boolean).reduce<unknown>((currentValue, segment) => {
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
  private propertyChangedListeners = new Map<string, Map<string, Set<DynamicDataCallback>>>();
  private sourceChangedListeners = new Map<string, Set<DynamicDataCallback>>();
  private sources = new Map<string, IRegisteredSource>();

  createProvider(): Record<string, unknown> {
    return {
      _dynamicDataSourceId: '',
      _getData: <TData>(reference: IDynamicDataReferenceLike | string): TData | undefined => {
        const { property, propertyPath, sourceId } = getReferenceParts(reference);
        const source = this.sources.get(sourceId);
        if (!source || !property) {
          return undefined;
        }

        const propertyValue = source.source.getPropertyValue(property);
        return getValueAtPath(propertyValue, propertyPath) as TData | undefined;
      },
      getAvailableSources: (): ReadonlyArray<IDynamicDataSourceLike> =>
        Array.from(this.sources.values()).map((source) => source.source),
      getAvailableSourcesByComponentId: (componentId: string): ReadonlyArray<IDynamicDataSourceLike> =>
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
        const listeners = this.sourceChangedListeners.get(sourceId) ?? new Set<DynamicDataCallback>();
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

  createSourceManager(componentId: string, instanceId: string, alias?: string): Record<string, unknown> {
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
      getAnnotatedPropertyValueAsync: async (propertyId: string) => source.getAnnotatedPropertyValue(propertyId),
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
        this.propertyChangedListeners.get(sourceId)?.get(propertyId)?.forEach((listener) => listener());
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

  private emitAvailableSourcesChanged(): void {
    this.availableSourceListeners.forEach((listener) => listener());
  }
}
