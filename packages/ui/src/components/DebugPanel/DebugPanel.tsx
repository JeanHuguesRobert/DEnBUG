import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { TracePanel } from '../TracePanel';
import { DomainSelector } from '../DomainSelector';
import { StackPanel } from '../StackPanel';
import { FilterBar } from '../FilterBar';
import { useDebug } from '../../contexts/DebugContext'; // updated path

export const DebugPanel: React.FC = () => {
  const { selectedStackFrame } = useDebug();
  const [tab, setTab] = React.useState(0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <FilterBar />
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Traces" />
        <Tab label="Domains" />
        <Tab label="Stack" />
      </Tabs>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {tab === 0 && <TracePanel />}
        {tab === 1 && <DomainSelector />}
        {tab === 2 && selectedStackFrame !== null && <StackPanel />}
      </Box>
    </Box>
  );
};