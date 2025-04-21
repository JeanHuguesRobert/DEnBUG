import React from 'react';
import { useDomain } from '../contexts/DomainContext';

export function DomainSelector() {
  const { filters, setFilters } = useDomain();

  return (
    <select 
      value={filters.domain || ''}
      onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
    >
      <option value="">Select Domain</option>
      {/* ...additional options can be added here... */}
    </select>
  );
}
