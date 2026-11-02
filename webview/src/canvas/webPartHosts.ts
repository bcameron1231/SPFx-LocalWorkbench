/**
 * The DOM element each web part renders into, kept outside React.
 *
 * In the SharePoint layout, changing a section's columns or moving a section moves web parts to another
 * place in the React tree, and React would drop their DOM (and the rendered web part with it). Instead,
 * each web part keeps one element for its lifetime, and the canvas slot it currently sits in adopts it.
 */
const hosts = new Map<string, HTMLDivElement>();

export function getWebPartHost(instanceId: string, className: string): HTMLDivElement {
  let host = hosts.get(instanceId);
  if (!host) {
    host = document.createElement('div');
    host.id = `webpart-${instanceId}`;
    hosts.set(instanceId, host);
  }
  host.className = className;
  return host;
}

/** Drops the element of a removed web part */
export function releaseWebPartHost(instanceId: string): void {
  hosts.get(instanceId)?.remove();
  hosts.delete(instanceId);
}
