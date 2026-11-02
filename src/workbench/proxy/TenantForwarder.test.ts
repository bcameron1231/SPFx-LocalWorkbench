import { describe, expect, it, vi } from 'vitest';

import { TenantForwarder, describeSignInFailure } from './TenantForwarder';

vi.mock('vscode', () => ({}));

const SITE = 'https://contoso.sharepoint.com/sites/devsite';

function req(method: string, url: string, body?: string, headers?: Record<string, string>) {
  return { id: '1', method, url, body, headers, clientType: 'fetch' as const };
}

describe('TenantForwarder.isReadOnly', () => {
  it('allows GET and HEAD', () => {
    expect(TenantForwarder.isReadOnly(req('GET', `${SITE}/_api/web/lists`), 'sharepoint')).toBe(
      true,
    );
    expect(TenantForwarder.isReadOnly(req('HEAD', `${SITE}/_api/web`), 'sharepoint')).toBe(true);
  });

  it('allows SharePoint POST endpoints that only read', () => {
    expect(TenantForwarder.isReadOnly(req('POST', `${SITE}/_api/contextinfo`), 'sharepoint')).toBe(
      true,
    );
    expect(
      TenantForwarder.isReadOnly(req('POST', `${SITE}/_api/search/postquery`), 'sharepoint'),
    ).toBe(true);
    expect(
      TenantForwarder.isReadOnly(
        req('POST', `${SITE}/_api/web/lists/getbytitle('Events')/RenderListDataAsStream`),
        'sharepoint',
      ),
    ).toBe(true);
    expect(
      TenantForwarder.isReadOnly(
        req(
          'POST',
          `${SITE}/_api/web/Lists/GetById('1')/RenderListFilterData?FieldInternalName='Category'`,
        ),
        'sharepoint',
      ),
    ).toBe(true);
  });

  it('blocks SharePoint writes', () => {
    expect(
      TenantForwarder.isReadOnly(
        req('POST', `${SITE}/_api/web/lists/getbytitle('Events')/items`),
        'sharepoint',
      ),
    ).toBe(false);
    expect(
      TenantForwarder.isReadOnly(
        req('DELETE', `${SITE}/_api/web/lists/getbytitle('Events')/items(1)`),
        'sharepoint',
      ),
    ).toBe(false);
    expect(TenantForwarder.isReadOnly(req('PATCH', `${SITE}/_api/web`), 'sharepoint')).toBe(false);
    // A read endpoint turned into a write with X-HTTP-Method
    expect(
      TenantForwarder.isReadOnly(
        req('POST', `${SITE}/_api/contextinfo`, undefined, { 'X-HTTP-Method': 'MERGE' }),
        'sharepoint',
      ),
    ).toBe(false);
  });

  it('allows SharePoint batches only when every part is a GET', () => {
    const reads = `--batch_1\r\nContent-Type: application/http\r\n\r\nGET ${SITE}/_api/web/lists HTTP/1.1\r\nAccept: application/json\r\n\r\n--batch_1\r\nContent-Type: application/http\r\n\r\nGET ${SITE}/_api/web HTTP/1.1\r\n\r\n--batch_1--`;
    const mixed = `${reads}\r\n--batch_1\r\nContent-Type: application/http\r\n\r\nPOST ${SITE}/_api/web/lists/getbytitle('Events')/items HTTP/1.1\r\n\r\n{}\r\n--batch_1--`;
    const merge = `--batch_1\r\nContent-Type: application/http\r\n\r\nGET ${SITE}/_api/web HTTP/1.1\r\nX-HTTP-Method: MERGE\r\n\r\n--batch_1--`;
    expect(
      TenantForwarder.isReadOnly(req('POST', `${SITE}/_api/$batch`, reads), 'sharepoint'),
    ).toBe(true);
    expect(
      TenantForwarder.isReadOnly(req('POST', `${SITE}/_api/$batch`, mixed), 'sharepoint'),
    ).toBe(false);
    expect(
      TenantForwarder.isReadOnly(req('POST', `${SITE}/_api/$batch`, merge), 'sharepoint'),
    ).toBe(false);
    expect(TenantForwarder.isReadOnly(req('POST', `${SITE}/_api/$batch`, ''), 'sharepoint')).toBe(
      false,
    );
  });

  it('allows Graph batches only when every request is a GET', () => {
    const url = 'https://graph.microsoft.com/v1.0/$batch';
    const reads = JSON.stringify({
      requests: [
        { id: '1', method: 'GET', url: '/me' },
        { id: '2', url: '/users' },
      ],
    });
    const mixed = JSON.stringify({
      requests: [
        { id: '1', method: 'GET', url: '/me' },
        { id: '2', method: 'POST', url: '/me/events' },
      ],
    });
    expect(TenantForwarder.isReadOnly(req('POST', url, reads), 'graph')).toBe(true);
    expect(TenantForwarder.isReadOnly(req('POST', url, mixed), 'graph')).toBe(false);
    expect(TenantForwarder.isReadOnly(req('POST', url, 'not json'), 'graph')).toBe(false);
  });

  it('blocks other Graph writes', () => {
    expect(
      TenantForwarder.isReadOnly(
        req('POST', 'https://graph.microsoft.com/v1.0/me/events', '{}'),
        'graph',
      ),
    ).toBe(false);
    expect(
      TenantForwarder.isReadOnly(req('PATCH', 'https://graph.microsoft.com/v1.0/me'), 'graph'),
    ).toBe(false);
  });
});

describe('TenantForwarder.resolveSharePointUrl', () => {
  const settings = {
    enabled: true,
    tenantId: 'contoso.onmicrosoft.com',
    clientId: '',
    allowWrites: false,
    sharePointScopes: [],
    graphScopes: [],
    sharePointOrigin: 'https://contoso.sharepoint.com',
    graphTokenHosts: ['https://api.example.com'],
  };

  it('sends SharePoint paths built on the webview address to the site host', () => {
    const resolved = TenantForwarder.resolveSharePointUrl(
      req(
        'GET',
        "https://02f9vvsk8h3t10srbe7qop3ja7/sites/devsite/_api/web/lists/getByTitle('Events')/views?$top=1",
      ),
      settings,
    );
    expect(resolved.url).toBe(
      "https://contoso.sharepoint.com/sites/devsite/_api/web/lists/getByTitle('Events')/views?$top=1",
    );
  });

  it('sends server-relative SharePoint paths to the site host', () => {
    const resolved = TenantForwarder.resolveSharePointUrl(
      req('GET', '/sites/devsite/_api/v2.1/insights/recentSites?%24top=5'),
      settings,
    );
    expect(resolved.url).toBe(
      'https://contoso.sharepoint.com/sites/devsite/_api/v2.1/insights/recentSites?%24top=5',
    );
  });

  it('leaves other URLs alone', () => {
    for (const url of [
      'https://02f9vvsk8h3t10srbe7qop3ja7/index.html',
      'https://localhost:4321/sites/x/_api/web',
      'https://example.com/sites/x',
      'https://graph.microsoft.com/v1.0/me',
    ]) {
      expect(TenantForwarder.resolveSharePointUrl(req('GET', url), settings).url).toBe(url);
    }
  });
});

describe('TenantForwarder.getResource', () => {
  const forwarder = new TenantForwarder(() => {});
  const settings = {
    enabled: true,
    tenantId: 'contoso.onmicrosoft.com',
    clientId: '',
    allowWrites: false,
    sharePointScopes: [],
    graphScopes: [],
    sharePointOrigin: 'https://contoso.sharepoint.com',
    graphTokenHosts: ['https://api.example.com'],
  };

  it('forwards only the page context site host and Graph', () => {
    expect(forwarder.getResource(`${SITE}/_api/web`, settings)).toBe('sharepoint');
    expect(forwarder.getResource('https://graph.microsoft.com/v1.0/me', settings)).toBe('graph');
    expect(
      forwarder.getResource('https://other.sharepoint.com/_api/web', settings),
    ).toBeUndefined();
    expect(
      forwarder.getResource('https://contoso.sharepoint.com.evil.example/_api/web', settings),
    ).toBeUndefined();
    expect(forwarder.getResource('https://example.com/api/x', settings)).toBeUndefined();
  });

  it('forwards nothing when disabled or without a tenant', () => {
    expect(
      forwarder.getResource(`${SITE}/_api/web`, { ...settings, enabled: false }),
    ).toBeUndefined();
    expect(
      forwarder.getResource(`${SITE}/_api/web`, { ...settings, tenantId: '' }),
    ).toBeUndefined();
  });
});

describe('TenantForwarder trusted API hosts', () => {
  const forwarder = new TenantForwarder(() => {});
  const settings = {
    enabled: true,
    tenantId: 'contoso.onmicrosoft.com',
    clientId: '',
    allowWrites: false,
    sharePointScopes: [],
    graphScopes: [],
    sharePointOrigin: 'https://contoso.sharepoint.com',
    graphTokenHosts: ['https://api.example.com'],
  };

  it('treats only listed origins as trusted', () => {
    expect(forwarder.getResource('https://api.example.com/users', settings)).toBe('graphDelegate');
    expect(
      forwarder.getResource('https://api.example.com.evil.example/users', settings),
    ).toBeUndefined();
    expect(forwarder.getResource('https://other.example.com/users', settings)).toBeUndefined();
  });

  it('recognises the placeholder token the web part was given', () => {
    const withPlaceholder = req('POST', 'https://api.example.com/users', '{}', {
      Authorization: 'Bearer spfx-local-workbench-placeholder-token',
    });
    const withOther = req('POST', 'https://api.example.com/users', '{}', {
      Authorization: 'Bearer abc',
    });
    expect(TenantForwarder.carriesPlaceholderToken(withPlaceholder)).toBe(true);
    expect(TenantForwarder.carriesPlaceholderToken(withOther)).toBe(false);
    expect(
      TenantForwarder.carriesPlaceholderToken(req('GET', 'https://api.example.com/users')),
    ).toBe(false);
  });
});

describe('describeSignInFailure', () => {
  const settings = {
    enabled: true,
    tenantId: 'contoso.onmicrosoft.com',
    clientId: '',
    allowWrites: false,
    sharePointScopes: [],
    graphScopes: [],
    sharePointOrigin: 'https://contoso.sharepoint.com',
    graphTokenHosts: [],
  };

  it('explains that Graph needs an own app when VS Code app is not preauthorized', () => {
    const message = describeSignInFailure(
      "AADSTS65002: Consent between first party application 'aebc6443-...' and first party resource '00000003-...' must be configured via preauthorization",
      true,
      settings,
    );
    expect(message).toMatch(/own Entra ID app/);
    expect(message).toMatch(/SharePoint data keeps working/);
  });

  it('points to redirect URIs and consent problems', () => {
    expect(
      describeSignInFailure('AADSTS50011: The redirect URI ... does not match', true, settings),
    ).toMatch(/redirect URIs/);
    expect(
      describeSignInFailure(
        'AADSTS65001: The user or administrator has not consented',
        true,
        settings,
      ),
    ).toMatch(/admin consent/);
  });
});

describe('TenantForwarder.isReadOnly (CSOM ProcessQuery)', () => {
  const url = `${SITE}/_vti_bin/client.svc/ProcessQuery`;
  const wrap = (actions: string, objectPaths = '') =>
    `<Request xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="Javascript Library"><Actions>${actions}</Actions><ObjectPaths>${objectPaths}</ObjectPaths></Request>`;

  it('allows CAML reads and searches', () => {
    const caml = wrap(
      '<ObjectPath Id="1" ObjectPathId="0" /><Query Id="2" ObjectPathId="1"><Query SelectAllProperties="true"><Properties /></Query></Query>',
      '<Method Id="1" ParentId="0" Name="GetItems"><Parameters><Parameter TypeId="{3d248d7b-fc86-40a3-aa97-02a75d69fb8a}"><Property Name="ViewXml" Type="String">&lt;View/&gt;</Property></Parameter></Parameters></Method>',
    );
    const search = wrap(
      '<SetProperty Id="3" ObjectPathId="2" Name="QueryText"><Parameter Type="String">news</Parameter></SetProperty><Method Name="ExecuteQuery" Id="4" ObjectPathId="5"><Parameters><Parameter ObjectPathId="2" /></Parameters></Method>',
    );
    expect(TenantForwarder.isReadOnly(req('POST', url, caml), 'sharepoint')).toBe(true);
    expect(TenantForwarder.isReadOnly(req('POST', url, search), 'sharepoint')).toBe(true);
  });

  it('allows filling client-side query objects (KeywordQuery collections)', () => {
    const search = wrap(
      '<Method Name="Add" Id="10" ObjectPathId="3"><Parameters><Parameter Type="String">Title</Parameter></Parameters></Method>' +
        '<Method Name="ExecuteQuery" Id="11" ObjectPathId="5"><Parameters><Parameter ObjectPathId="1" /></Parameters></Method>',
      '<Constructor Id="1" TypeId="{80173281-fffd-47b6-9a49-312e06ff8428}" />' +
        '<Property Id="3" ParentId="1" Name="SelectProperties" />' +
        '<Constructor Id="5" TypeId="{8d2ac302-db2f-46fe-9015-872b35f15098}" />',
    );
    expect(TenantForwarder.isReadOnly(req('POST', url, search), 'sharepoint')).toBe(true);
  });

  it('blocks Add on server collections', () => {
    const addList = wrap(
      '<ObjectPath Id="20" ObjectPathId="19" />',
      '<StaticProperty Id="16" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" />' +
        '<Property Id="17" ParentId="16" Name="Web" /><Property Id="18" ParentId="17" Name="Lists" />' +
        '<Method Id="19" ParentId="18" Name="Add"><Parameters /></Method>',
    );
    const addToServerCollection = wrap(
      '<Method Name="Add" Id="30" ObjectPathId="18"><Parameters /></Method>',
      '<StaticProperty Id="16" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" />' +
        '<Property Id="17" ParentId="16" Name="Web" /><Property Id="18" ParentId="17" Name="Lists" />',
    );
    expect(TenantForwarder.isReadOnly(req('POST', url, addList), 'sharepoint')).toBe(false);
    expect(TenantForwarder.isReadOnly(req('POST', url, addToServerCollection), 'sharepoint')).toBe(
      false,
    );
  });

  it('blocks CSOM writes', () => {
    const update = wrap(
      '<Method Name="SetFieldValue" Id="5" ObjectPathId="4"><Parameters /></Method><Method Name="Update" Id="6" ObjectPathId="4" />',
    );
    const add = wrap(
      '<ObjectPath Id="7" ObjectPathId="6" />',
      '<Method Id="6" ParentId="3" Name="AddItem"><Parameters /></Method>',
    );
    const recycle = wrap('<Method Name="Recycle" Id="8" ObjectPathId="4" />');
    for (const body of [update, add, recycle]) {
      expect(TenantForwarder.isReadOnly(req('POST', url, body), 'sharepoint')).toBe(false);
    }
    expect(TenantForwarder.isReadOnly(req('POST', url, 'not csom'), 'sharepoint')).toBe(false);
  });
});
