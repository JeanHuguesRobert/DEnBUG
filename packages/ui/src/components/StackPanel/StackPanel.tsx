import React from 'react';
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useDebug } from '../../contexts/DebugContext';
import type { Trace } from 'denbug';

export interface StackFrame {
  function: string;
  file: string;
  line: number;
  column: number;
}

export interface TraceWithStack extends Trace {
  stack?: StackFrame[];
}

export const StackPanel: React.FC<{ selectedTrace: TraceWithStack | null }> = ({ selectedTrace }) => {
  const { selectedStackFrame, selectStackFrame } = useDebug();

  if (!selectedTrace?.stack) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">No stack trace available</Typography>
      </Box>
    );
  }

  return (
    <List dense>
      {(selectedTrace.stack as StackFrame[]).map((frame: StackFrame, index: number) => (
        <ListItem 
          key={`${frame.file}:${frame.line}:${frame.column}`}
          button
          selected={selectedStackFrame === index}
          onClick={() => selectStackFrame(index)}
        >
          <ListItemText
            primary={frame.function}
            secondary={`${frame.file}:${frame.line}:${frame.column}`}
          />
        </ListItem>
      ))}
    </List>
  );
};