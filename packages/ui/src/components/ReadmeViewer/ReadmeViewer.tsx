import React, { useState, useEffect, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import { DebugContext } from '../context/DebugContext';
import { Box, Paper, Typography } from '@mui/material';
import './ReadmeViewer.css';

export const ReadmeViewer: React.FC = () => {
  const [content, setContent] = useState('Loading...');
  const { domains } = useContext(DebugContext);
  const activeDomains = domains.filter(d => d.enabled);

  useEffect(() => {
    fetch('/README.md')
      .then(response => response.text())
      .then(text => setContent(text))
      .catch(error => {
        console.error('Error loading README:', error);
        setContent(`
# denbug

A lightweight JavaScript execution tracer with hierarchical domains and rich debugging features.

## Active Domains (${activeDomains.length})

${activeDomains.map(d => `- ${d.name}${d.echo ? ' (echo)' : ''}`).join('\n')}

## Features

- **Hierarchical Domains**: Use \`:' as delimiter (e.g., \`app:ui:button\`)
- **Auto Detection**: Messages can trigger subdomain traces
- **Echo Control**: Each domain has an \`:echo\` subdomain for console output
- **Rich Context**: Automatic stack trace and source location capture
- **Time Travel**: Navigate through trace history
- **Live Filtering**: Filter by domain, type, and state

## Quick Start

1. Create a domain:
   \`\`\`javascript
   let ui_de = false;
   const bug_ui = debug.domain('app:ui', 
       () => ui_de, 
       v => ui_de = v
   );
   \`\`\`

2. Use the domain:
   \`\`\`javascript
   ui_de&&bug_ui('button clicked', { x: 100, y: 200 });
   \`\`\`

3. Enable console output:
   \`\`\`javascript
   debug.enable('app:ui:echo');
   \`\`\`
`);
      });
  }, [activeDomains]);

  return (
    <Box className="readme-viewer" sx={{ p: 2 }}>
      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </Paper>
    </Box>
  );
};