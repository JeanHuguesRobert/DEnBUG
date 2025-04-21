import React from 'react';
import { DebugProvider } from '../contexts/DebugContext';
import { DomainProvider } from '../contexts/DomainContext';

export function Debugger({ children }: { children: React.ReactNode }) {
  return (
    <DomainProvider>
      <DebugProvider>
        {children}
      </DebugProvider>
    </DomainProvider>
  );
}
