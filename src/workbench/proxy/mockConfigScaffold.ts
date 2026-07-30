import type { IMockConfig } from './types';

/** Creates the starter configuration written by the scaffold command. */
export function createMockConfigScaffold(): IMockConfig {
  return {
    delay: 0,
    rules: [
      {
        name: 'Get site lists',
        match: {
          url: '/_api/web/lists',
          method: 'GET',
        },
        response: {
          status: 200,
          headers: { 'content-type': 'application/json;odata=verbose' },
          body: {
            d: {
              results: [
                { Title: 'Documents', Id: '1', ItemCount: 5 },
                { Title: 'Site Pages', Id: '2', ItemCount: 3 },
              ],
            },
          },
        },
      },
    ],
  };
}
