import { describe, expect, it, vi } from 'vitest';

import { applyWebPartPropertyChange } from '../../packages/shared/src/components/PropertyPanePanel';
import type { IActiveWebPart } from '../../packages/shared/src/types';

function createWebPart(
  properties: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
): IActiveWebPart {
  const instance = {
    properties,
    render: vi.fn(),
    ...overrides,
  };

  return {
    context: {
      dynamicDataProvider: { id: 'provider' },
    },
    instance: instance as IActiveWebPart['instance'],
    instanceId: 'test-instance',
    manifest: {} as IActiveWebPart['manifest'],
    properties,
  };
}

describe('applyWebPartPropertyChange', () => {
  it('writes ordinary properties, invokes the public callback, and renders', () => {
    const onPropertyPaneFieldChanged = vi.fn();
    const webPart = createWebPart({ title: 'Before' }, { onPropertyPaneFieldChanged });

    const result = applyWebPartPropertyChange(webPart, 'title', 'After');

    expect(result).toEqual({ title: 'After' });
    expect(onPropertyPaneFieldChanged).toHaveBeenCalledWith('title', 'Before', 'After');
    expect(webPart.instance.render).toHaveBeenCalledOnce();
  });

  it('lets the internal SPFx handler own the property write', () => {
    const internalHandler = vi.fn(function (
      this: { properties: Record<string, unknown> },
      propertyPath: string,
      value: unknown,
    ) {
      this.properties[propertyPath] = value;
      return true;
    });
    const webPart = createWebPart(
      { title: 'Before' },
      { _onPropertyPaneFieldChanged: internalHandler },
    );

    const result = applyWebPartPropertyChange(webPart, 'title', 'After');

    expect(result).toEqual({ title: 'After' });
    expect(internalHandler).toHaveBeenCalledWith('title', 'After');
    expect(webPart.instance.render).not.toHaveBeenCalled();
  });

  it('applies values submitted by a non-reactive property pane', () => {
    const webPart = createWebPart({ count: 1 }, { disableReactivePropertyChanges: true });

    const result = applyWebPartPropertyChange(webPart, 'count', 2);

    expect(result.count).toBe(2);
    expect(webPart.instance.render).toHaveBeenCalledOnce();
  });

  it('updates an existing DynamicProperty value in place', () => {
    const dynamicProperty = {
      setReference: vi.fn(),
      setValue: vi.fn(),
    };
    const webPart = createWebPart({ selection: dynamicProperty });

    const result = applyWebPartPropertyChange(webPart, 'selection', 42);

    expect(dynamicProperty.setValue).toHaveBeenCalledWith(42);
    expect(result.selection).toBe(dynamicProperty);
  });

  it('creates a replacement DynamicProperty for an internal SPFx handler', () => {
    class TestDynamicProperty {
      public reference?: string;

      constructor(
        public readonly provider: unknown,
        public readonly callback?: () => void,
      ) {}

      public setReference(reference: string): void {
        this.reference = reference;
      }

      public setValue(): void {}
    }

    const original = new TestDynamicProperty({ id: 'old' });
    const internalHandler = vi.fn(function (
      this: { properties: Record<string, unknown> },
      propertyPath: string,
      value: unknown,
    ) {
      this.properties[propertyPath] = value;
      return true;
    });
    const webPart = createWebPart(
      { selection: original },
      { _onPropertyPaneFieldChanged: internalHandler },
    );

    const result = applyWebPartPropertyChange(
      webPart,
      'selection',
      'PageContext.PageEnvironment:siteProperties:siteTitle',
    );
    const replacement = result.selection as TestDynamicProperty;

    expect(replacement).toBeInstanceOf(TestDynamicProperty);
    expect(replacement).not.toBe(original);
    expect(replacement.provider).toBe(webPart.context.dynamicDataProvider);
    expect(replacement.reference).toBe('PageContext.PageEnvironment:siteProperties:siteTitle');
  });
});
