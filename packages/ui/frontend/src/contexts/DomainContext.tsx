import React, { createContext, useContext, useState } from 'react';

interface DomainContextValue {
  filters: { domain?: string };
  setFilters: (f: { domain?: string }) => void;
}

const DomainContext = createContext<DomainContextValue>({} as DomainContextValue);

export const DomainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<{ domain?: string }>({});
  return (
    <DomainContext.Provider value={{ filters, setFilters }}>
      {children}
    </DomainContext.Provider>
  );
};

export const useDomain = () => useContext(DomainContext);