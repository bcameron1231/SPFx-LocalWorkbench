/**
 * Locale selector toolbar control
 * Allows switching between different locales
 */

import React from 'react';
import { useGlobals } from '@storybook/manager-api';
import { IconButton, WithTooltip, TooltipLinkList } from '@storybook/components';
import { TOOLBAR_IDS, EVENTS } from '../constants';

const COMMON_LOCALES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'es-ES', name: 'Español' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'ko-KR', name: '한국어' },
];

export const LocaleToolbar: React.FC = () => {
  const [globals, updateGlobals] = useGlobals();
  const currentLocale = globals.spfxLocale || 'en-US';
  
  const currentLocaleName = COMMON_LOCALES.find(l => l.code === currentLocale)?.name || currentLocale;

  const handleLocaleChange = (locale: string) => {
    updateGlobals({ spfxLocale: locale });
    
    // Emit event for the preview
    const channel = (window as any).__STORYBOOK_ADDONS_CHANNEL__;
    if (channel) {
      channel.emit(EVENTS.LOCALE_CHANGED, locale);
    }
  };

  const links = COMMON_LOCALES.map(locale => ({
    id: locale.code,
    title: locale.name,
    active: locale.code === currentLocale,
    onClick: () => handleLocaleChange(locale.code),
  }));

  return (
    <WithTooltip
      placement="top"
      trigger="click"
      closeOnOutsideClick
      tooltip={<TooltipLinkList links={links} />}
    >
      <IconButton key={TOOLBAR_IDS.LOCALE} title="Select Locale">
        🌐 <span style={{ marginLeft: '4px', fontSize: '12px' }}>{currentLocaleName}</span>
      </IconButton>
    </WithTooltip>
  );
};
