/**
 * Tenant images
 *
 * Images hosted in SharePoint (<img src="https://contoso.sharepoint.com/...">) need the user's
 * sign-in, which the webview does not have. This watches the page for such images (img src/srcset
 * and inline background-image), loads them through the proxy (the extension host adds the token)
 * and swaps in a local blob: URL.
 */
import type { IProxyTransport } from '@spfx-local-workbench/shared';
import { base64ToBytes } from '@spfx-local-workbench/shared';

import { getSiteOrigin, toTenantUrl as toTenantUrlFor } from './tenantUrls';

const loaded = new Map<string, Promise<string | undefined>>();
let requestCounter = 0;

/** Starts watching the document. siteUrl is the page context site, e.g. https://contoso.sharepoint.com/sites/dev */
export function installTenantImages(transport: IProxyTransport, siteUrl: string | undefined): void {
  const siteOrigin = getSiteOrigin(siteUrl);
  if (!siteOrigin) {
    return;
  }
  const toTenantUrl = (raw: string) => toTenantUrlFor(raw, siteOrigin);

  const load = (tenantUrl: string): Promise<string | undefined> => {
    let pending = loaded.get(tenantUrl);
    if (!pending) {
      pending = transport
        .sendRequest({
          id: `tenant-image-${++requestCounter}-${Date.now()}`,
          url: tenantUrl,
          method: 'GET',
          headers: { Accept: 'image/*,*/*;q=0.8' },
          clientType: 'http',
        })
        .then((response) => {
          if (
            response.status < 200 ||
            response.status >= 300 ||
            response.bodyEncoding !== 'base64'
          ) {
            return undefined;
          }
          const type = Object.entries(response.headers ?? {}).find(
            ([k]) => k.toLowerCase() === 'content-type',
          )?.[1];
          const blob = new Blob(
            [base64ToBytes(response.body) as BlobPart],
            type ? { type } : undefined,
          );
          return URL.createObjectURL(blob);
        })
        .catch(() => undefined);
      loaded.set(tenantUrl, pending);
    }
    return pending;
  };

  const processImage = (img: HTMLImageElement) => {
    const src = img.getAttribute('src');
    const tenantSrc = src ? toTenantUrl(src) : undefined;
    if (tenantSrc) {
      void load(tenantSrc).then((blobUrl) => {
        // Only replace if the src did not change meanwhile
        if (img.getAttribute('src') === src) {
          // Not loadable: a data: URL fails for real, so the component's own fallback runs
          img.setAttribute('src', blobUrl ?? 'data:,');
        }
      });
    }

    const srcset = img.getAttribute('srcset');
    if (srcset && srcset.split(',').some((part) => toTenantUrl(part.trim().split(/\s+/)[0]))) {
      // The proxied src is enough; a tenant srcset would win over it and stay broken
      img.removeAttribute('srcset');
    }
  };

  const processBackground = (element: HTMLElement) => {
    const background = element.style.backgroundImage;
    const match = background && /url\(\s*["']?([^"')]+)["']?\s*\)/i.exec(background);
    const tenantUrl = match ? toTenantUrl(match[1]) : undefined;
    if (tenantUrl) {
      void load(tenantUrl).then((blobUrl) => {
        if (blobUrl && element.style.backgroundImage === background) {
          element.style.backgroundImage = `url("${blobUrl}")`;
        }
      });
    }
  };

  const processNode = (node: Node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    if (node instanceof HTMLImageElement) {
      processImage(node);
    } else if (node.style?.backgroundImage) {
      processBackground(node);
    }
    node.querySelectorAll('img').forEach(processImage);
    node.querySelectorAll<HTMLElement>('[style*="background"]').forEach(processBackground);
  };

  // The first, unauthenticated load of a tenant image fails before the proxied copy arrives. Components
  // that fall back on error (avatars switching to initials) would never show the image, so hide that
  // error from them; a load that really fails is reported later through the data: URL above.
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && toTenantUrl(target.getAttribute('src') ?? '')) {
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        processNode(mutation.target);
      } else {
        mutation.addedNodes.forEach(processNode);
      }
    }
  }).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'style'],
  });

  processNode(document.body);
}
