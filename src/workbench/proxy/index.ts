// Proxy Module Index
//
// Re-exports all proxy-related types and classes.

export { ApiProxyService } from './ApiProxyService';
export { MockRuleEngine } from '@spfx-local-workbench/shared';
export { MockConfigGenerator } from './MockConfigGenerator';
export type { IRecordedRequest } from './generators';
export type {
  IMockConfig,
  IMockRule,
  IMockRuleMatch,
  IMockRuleResponse,
  IProxyRequest,
  IProxyResponse,
  IProxySettings,
  ApiClientType,
  ProxyMode,
  ProxyModeOptions,
  IMockModeOptions,
  IPassthroughModeOptions,
  IRecordModeOptions,
} from './types';
