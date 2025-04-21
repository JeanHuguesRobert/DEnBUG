import React, { useContext } from 'react';
import { 
  Box, 
  TextField, 
  FormControlLabel, 
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  FilterList as FilterIcon,
  BugReport as BugIcon,
  Code as CodeIcon,
  PlayCircleOutline as PlayIcon
} from '@mui/icons-material';
import { DebugContext } from '../../contexts/DebugContext';

export const FilterBar: React.FC = () => {
  const { filters, setFilters } = useContext(DebugContext) as {
    filters: any;
    setFilters: (f: any) => void;
  };

  const handleConsoleToggle = (method: keyof typeof filters.console) => {
    setFilters({
      console: {
        ...filters.console,
        [method]: !filters.console?.[method]
      }
    });
  };

  return (
    <Box sx={{ 
      p: 1, 
      display: 'flex', 
      gap: 2, 
      alignItems: 'center',
      borderBottom: 1,
      borderColor: 'divider',
      bgcolor: 'background.paper'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterIcon color="action" />
        <TextField
          size="small"
          placeholder="Filter domains..."
          value={filters.domain || ''}
          onChange={(e) => setFilters({ domain: e.target.value })}
          sx={{ width: 200 }}
        />
      </Box>

      <Divider orientation="vertical" flexItem />

      <ToggleButtonGroup 
        size="small"
        aria-label="console filters"
      >
        <Tooltip title="Show log messages">
          <ToggleButton
            value="log"
            selected={filters.console?.log}
            onClick={() => handleConsoleToggle('log')}
          >
            Log
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Show info messages">
          <ToggleButton
            value="info"
            selected={filters.console?.info}
            onClick={() => handleConsoleToggle('info')}
          >
            Info
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Show warnings">
          <ToggleButton
            value="warn"
            selected={filters.console?.warn}
            onClick={() => handleConsoleToggle('warn')}
          >
            Warn
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Show errors">
          <ToggleButton
            value="error"
            selected={filters.console?.error}
            onClick={() => handleConsoleToggle('error')}
          >
            Error
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Show assertions">
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.assert}
                onChange={(e) => setFilters({ assert: e.target.checked })}
                size="small"
                icon={<BugIcon />}
                checkedIcon={<BugIcon color="primary" />}
              />
            }
            label="Assertions"
          />
        </Tooltip>

        <Tooltip title="Show stack traces">
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.stack}
                onChange={(e) => setFilters({ stack: e.target.checked })}
                size="small"
                icon={<CodeIcon />}
                checkedIcon={<CodeIcon color="primary" />}
              />
            }
            label="Stack"
          />
        </Tooltip>

        <Tooltip title="Show only active domains">
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.active}
                onChange={(e) => setFilters({ active: e.target.checked })}
                size="small"
                icon={<PlayIcon />}
                checkedIcon={<PlayIcon color="primary" />}
              />
            }
            label="Active Only"
          />
        </Tooltip>
      </Box>
    </Box>
  );
};