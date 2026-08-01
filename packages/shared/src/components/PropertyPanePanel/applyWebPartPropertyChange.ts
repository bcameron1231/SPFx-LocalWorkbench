import type { IActiveWebPart } from '../../types';
import { logger } from '../../utils';

interface IDynamicPropertyLike {
  constructor?: DynamicPropertyConstructor;
  setReference?: (reference: string) => void;
  setValue?: (value: unknown) => void;
}

type DynamicPropertyConstructor = new (
  provider: unknown,
  callback?: () => void,
) => IDynamicPropertyLike;

interface IPropertyPaneAwareWebPart {
  _onPropertyPaneFieldChanged?: (
    propertyPath: string,
    updatedValue: unknown,
    fieldType?: unknown,
  ) => boolean;
  properties?: Record<string, unknown>;
}

function isDynamicPropertyLike(value: unknown): value is IDynamicPropertyLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    (typeof (value as IDynamicPropertyLike).setReference === 'function' ||
      typeof (value as IDynamicPropertyLike).setValue === 'function')
  );
}

function getRegisteredDynamicPropertyConstructor(): DynamicPropertyConstructor | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return (
    window as Window & {
      __amdModules?: Record<
        string,
        {
          DynamicProperty?: DynamicPropertyConstructor;
        }
      >;
    }
  ).__amdModules?.['@microsoft/sp-component-base']?.DynamicProperty;
}

function createRenderCallback(webPart: IActiveWebPart): () => void {
  return () => {
    try {
      webPart.instance.render();
    } catch (error: unknown) {
      logger.warn('Error rendering web part after Dynamic Data changed:', error);
    }
  };
}

function resolveDynamicPropertyValue(
  webPart: IActiveWebPart,
  currentValue: unknown,
  newValue: unknown,
  hasInternalHandler: boolean,
): unknown {
  if (!isDynamicPropertyLike(currentValue)) {
    if (typeof newValue !== 'string' || !newValue.includes(':')) {
      return newValue;
    }

    const DynamicProperty = getRegisteredDynamicPropertyConstructor();
    if (!DynamicProperty) {
      return newValue;
    }

    const dynamicProperty = new DynamicProperty(
      webPart.context.dynamicDataProvider,
      createRenderCallback(webPart),
    );
    dynamicProperty.setReference?.(newValue);
    return dynamicProperty;
  }

  if (typeof newValue === 'string' && newValue.includes(':')) {
    if (!hasInternalHandler && typeof currentValue.setReference === 'function') {
      currentValue.setReference(newValue);
      return currentValue;
    }

    const currentConstructor =
      typeof currentValue.constructor === 'function' &&
      currentValue.constructor !== (Object as unknown as DynamicPropertyConstructor)
        ? currentValue.constructor
        : undefined;
    const DynamicProperty = currentConstructor ?? getRegisteredDynamicPropertyConstructor();

    if (DynamicProperty) {
      const dynamicProperty = new DynamicProperty(
        webPart.context.dynamicDataProvider,
        createRenderCallback(webPart),
      );
      dynamicProperty.setReference?.(newValue);
      return dynamicProperty;
    }

    currentValue.setReference?.(newValue);
    return currentValue;
  }

  currentValue.setValue?.(newValue);
  return currentValue;
}

/**
 * Apply a property pane change using SPFx-compatible callback and DynamicProperty behavior.
 *
 * @param webPart Active web part receiving the property change
 * @param targetProperty Property pane target path
 * @param newValue Value supplied by the property pane field
 */
export function applyWebPartPropertyChange(
  webPart: IActiveWebPart,
  targetProperty: string,
  newValue: unknown,
): Record<string, unknown> {
  const instance = webPart.instance as typeof webPart.instance & IPropertyPaneAwareWebPart;
  const liveProperties = instance.properties ?? webPart.properties;
  const oldValue = liveProperties[targetProperty] ?? webPart.properties[targetProperty];
  const internalPropertyPaneChanged = instance._onPropertyPaneFieldChanged;
  const nextValue = resolveDynamicPropertyValue(
    webPart,
    oldValue,
    newValue,
    typeof internalPropertyPaneChanged === 'function',
  );

  if (typeof internalPropertyPaneChanged === 'function') {
    try {
      internalPropertyPaneChanged.call(webPart.instance, targetProperty, nextValue);
    } catch (error: unknown) {
      logger.warn('Error calling _onPropertyPaneFieldChanged:', error);
    }
  } else {
    liveProperties[targetProperty] = nextValue;
    webPart.properties[targetProperty] = nextValue;

    if (typeof webPart.instance.onPropertyPaneFieldChanged === 'function') {
      try {
        webPart.instance.onPropertyPaneFieldChanged(targetProperty, oldValue, nextValue);
      } catch (error: unknown) {
        logger.warn('Error calling onPropertyPaneFieldChanged:', error);
      }
    }

    try {
      webPart.instance.render();
    } catch (error: unknown) {
      logger.warn('Error rendering web part after property change:', error);
    }
  }

  const resolvedProperties = instance.properties ?? webPart.properties;
  webPart.properties = resolvedProperties;
  return { ...resolvedProperties };
}
