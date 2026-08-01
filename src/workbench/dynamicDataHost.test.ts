import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_PAGE_CONTEXT } from '../../packages/shared/src/constants';
import { DynamicDataHost } from '../../packages/shared/src/dynamicData';

function createPageContext() {
  return structuredClone(DEFAULT_PAGE_CONTEXT);
}

describe('DynamicDataHost', () => {
  it('exposes host-neutral Page Environment values and nested references', () => {
    const pageContext = createPageContext();
    pageContext.web.title = 'Storybook site';
    const host = new DynamicDataHost(pageContext, {
      location: {
        hash: '#details',
        search: '?tag=one&tag=two',
      },
    });
    const provider = host.createProvider();

    expect(provider._getData('PageContext.PageEnvironment:siteProperties:siteTitle')).toBe(
      'Storybook site',
    );
    expect(
      provider._getData('PageContext.PageEnvironment:queryString:queryParameters.tag'),
    ).toEqual(['one', 'two']);
    expect(provider._getData('PageContext.PageEnvironment:queryString:fragment')).toBe('details');
  });

  it('uses supplied strings without requiring Workbench globals', () => {
    const host = new DynamicDataHost(createPageContext(), {
      strings: {
        pageEnvironmentSourceTitle: 'Story environment',
      },
    });

    expect(host.createProvider().getAvailableSources()[0].metadata.title).toBe('Story environment');
  });

  it('registers, notifies, filters, and disposes component sources', () => {
    const host = new DynamicDataHost(createPageContext());
    const provider = host.createProvider();
    const availableSourcesChanged = vi.fn();
    const propertyChanged = vi.fn();
    const sourceChanged = vi.fn();
    provider.registerAvailableSourcesChanged(availableSourcesChanged);

    const manager = host.createSourceManager('component-id', 'instance-id', 'Example source');
    manager.initializeSource({
      getPropertyDefinitions: () => [{ id: 'message', title: 'Message' }],
      getPropertyValue: (propertyId) => (propertyId === 'message' ? 'Hello' : undefined),
    });

    expect(
      provider.getAvailableSourcesByComponentId('component-id').map((source) => source.id),
    ).toEqual([manager.sourceId]);
    expect(provider.tryGetSource(manager.sourceId)?.getPropertyValue('message')).toBe('Hello');

    provider.registerPropertyChanged(manager.sourceId, 'message', propertyChanged);
    provider.registerSourceChanged(manager.sourceId, sourceChanged);
    manager.notifyPropertyChanged('message');
    manager.notifySourceChanged();

    expect(propertyChanged).toHaveBeenCalledOnce();
    expect(sourceChanged).toHaveBeenCalledTimes(2);

    manager.dispose();

    expect(provider.tryGetSource(manager.sourceId)).toBeUndefined();
    expect(availableSourcesChanged).toHaveBeenCalledTimes(2);
  });

  it('updates the stable Page Environment source and notifies consumers', () => {
    const host = new DynamicDataHost(createPageContext());
    const provider = host.createProvider();
    const propertyChanged = vi.fn();
    const sourceChanged = vi.fn();
    provider.registerPropertyChanged(
      'PageContext.PageEnvironment',
      'siteProperties',
      propertyChanged,
    );
    provider.registerSourceChanged('PageContext.PageEnvironment', sourceChanged);

    const updatedPageContext = createPageContext();
    updatedPageContext.web.title = 'Updated site';
    host.updatePageContext(updatedPageContext);

    expect(provider._getData('PageContext.PageEnvironment:siteProperties:siteTitle')).toBe(
      'Updated site',
    );
    expect(propertyChanged).toHaveBeenCalledOnce();
    expect(sourceChanged).toHaveBeenCalledOnce();
  });
});
