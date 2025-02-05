import React from 'react';
import { Box, Typography } from '@mui/material';

export interface DebugBannerProps {
  title?: string;
}

export const DebugBanner: React.FC<DebugBannerProps> = ({ title = 'Debug Panel' }) => {
  return (
    <Box sx={{ p: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
};