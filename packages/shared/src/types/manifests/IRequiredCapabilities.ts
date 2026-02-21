/**
 * Host capabilities that the web part requires in order to be usable.
 *
 * Modelled after the `requiredCapabilities` property in
 * client-side-web-part-manifest.schema.json.
 *
 * If the host page does not support a listed capability the web part will not
 * appear in the toolbox.
 */
export interface IRequiredCapabilities {
  /**
   * When true, the web part requires a Bing Maps key to be configured on the site.
   * The key can be used to render Bing Maps controls using the provided coordinates.
   */
  BingMapsKey?: boolean;
  /**
   * Authentication models the web part requires from the host.
   * The model is used to connect with Microsoft Graph, O365 connectors, etc.
   */
  AuthenticationModel?: ('OpenIDConnect' | 'Federated')[];
}
