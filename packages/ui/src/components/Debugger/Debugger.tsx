import React from 'react';
import { Box, Paper } from '@mui/material';
import { DebugBanner } from '../DebugBanner';
import { DomainSelector } from '../DomainSelector';
import { TracePanel } from '../TracePanel';
import { StackPanel } from '../StackPanel';
import { StepControls } from '../StepControls';

export const Debugger: React.FC = () => {
  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DebugBanner />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <DomainSelector />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TracePanel />
          <StackPanel />
          <StepControls />
        </Box>
      </Box>
    </Paper>
  );
};