/**
 * API Proxy Types (Extension-Specific)
 *
 * Extension-host specific types for proxy operating modes and settings.
 * Shared types (IMockConfig, IProxyRequest, etc.) are in @spfx-local-workbench/shared.
 */
import type {
  ApiClientType,
  IMockConfig,
  IMockRule,
  IMockRuleMatch,
  IMockRuleResponse,
  IProxyRequest,
  IProxyResponse,
} from '@spfx-local-workbench/shared';

// Re-export shared types for convenience
export type {
  ApiClientType,
  IMockConfig,
  IMockRule,
  IMockRuleMatch,
  IMockRuleResponse,
  IProxyRequest,
  IProxyResponse,
};

/** Proxy operating modes */
export type ProxyMode = 'mock' | 'mock-passthrough' | 'passthrough' | 'record';

export interface IMockModeOptions {
  mockFile: string;

  defaultDelay: number;

  fallbackStatus: number;
}

export interface IPassthroughModeOptions {
  allowedOrigins?: string[];
}

export interface IRecordModeOptions {
  mockFile: string;

  fallbackStatus: number;

  serveMocksWhileRecording: boolean;
}

export type ProxyModeOptions =
  | { mode: 'mock'; options: IMockModeOptions }
  | { mode: 'mock-passthrough'; options: IMockModeOptions }
  | { mode: 'passthrough'; options: IPassthroughModeOptions }
  | { mode: 'record'; options: IRecordModeOptions };

/** VS Code settings for proxy behavior */
export interface IProxySettings {
  enabled: boolean;

  activeMode: ProxyModeOptions;

  logRequests: boolean;
}
