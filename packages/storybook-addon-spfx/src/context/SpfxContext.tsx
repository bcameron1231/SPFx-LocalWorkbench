/**
 * React context for SPFx story state
 */
import React, { ReactNode, createContext, useContext } from 'react';

import { DisplayMode } from '../constants';

interface ISpfxContextValue {
  componentId: string;
  displayMode: DisplayMode;
  themeId: string;
  locale: string;
  properties: Record<string, any>;
}

const SpfxContext = createContext<ISpfxContextValue | undefined>(undefined);

interface ISpfxContextProviderProps extends ISpfxContextValue {
  children: ReactNode;
}

export const SpfxContextProvider: React.FC<ISpfxContextProviderProps> = ({
  children,
  ...value
}) => {
  return <SpfxContext.Provider value={value}>{children}</SpfxContext.Provider>;
};

export const useSpfxContext = (): ISpfxContextValue => {
  const context = useContext(SpfxContext);
  if (!context) {
    throw new Error('useSpfxContext must be used within SpfxContextProvider');
  }
  return context;
};
