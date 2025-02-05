# Build Requirements

## Development Environment

### Required Tools
- Node.js >= 14.0.0
- npm >= 7.0.0 or yarn >= 1.22.0
- TypeScript >= 4.5.0
- Visual Studio Code (recommended)

### VSCode Extensions
- ESLint
- Prettier
- Jest Runner
- TypeScript + JavaScript
- Material Icon Theme (recommended)
- Debug Extension Pack

### VSCode Configuration
```json
// filepath: /c:/tweesic/denbug/.vscode/settings.json
{
    "typescript.tsdk": "node_modules/typescript/lib",
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "jest.autoRun": "off",
    "jest.showCoverageOnLoad": true
}
```

## Project Structure
```plaintext
denbug/
├── packages/
│   ├── core/               # Core debugging library
│   │   ├── src/           # Source code
│   │   ├── tests/         # Unit tests
│   │   ├── tsconfig.json  # TypeScript config
│   │   └── package.json   # Package manifest
│   └── ui/                # React-based debugger UI
│       ├── src/           # UI source code
│       ├── tests/         # UI tests
│       ├── vite.config.ts # Vite configuration
│       └── package.json   # Package manifest
├── examples/              # Usage examples
├── docs/                 # Documentation
├── turbo.json           # Turborepo config
└── package.json         # Root manifest
```

### Turborepo Configuration
```json
// filepath: /c:/tweesic/denbug/turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Test Configuration
```javascript
// filepath: /c:/tweesic/denbug/jest.config.js
module.exports = {
  projects: [
    '<rootDir>/packages/*/jest.config.js'
  ],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageReporters: ['text', 'html'],
  reporters: ['default', 'jest-junit']
};
```

## Initial Setup Commands (Windows)
```batch
# Install global dependencies
npm install -g turbo typescript jest

# Clone and setup repository
git clone https://github.com/JeanHuguesRobert/denbug.git
cd denbug
npm install

# Setup husky for git hooks
npx husky install
```

### Git Configuration
```batch
# Configure Git for Windows line endings
git config --global core.autocrlf true

# Setup Git identity
git config --global user.name "JeanHuguesRobert"
git config --global user.email "jean_hugues_robert@yahoo.com"
```

### Repository Configuration
```json
// filepath: /c:/tweesic/denbug/.npmrc
registry=https://registry.npmjs.org/
@denbug:registry=https://registry.npmjs.org/
save-exact=true
```

```json
// filepath: /c:/tweesic/denbug/package.json
{
  "name": "denbug-workspace",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "dev": "turbo run dev",
    "clean": "turbo run clean",
    "verify": "npm run lint && npm run type-check && npm run test && npm run build"
  },
  "author": "JeanHuguesRobert",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/JeanHuguesRobert/denbug.git"
  }
}
```

## Development Workflow
```batch
# Start development environment
npm run dev

# Run tests with coverage
npm test

# Build for production
npm run build

# Clean builds
npm run clean
```

## Quality Checks
```batch
# Run all checks
npm run verify

# Individual checks
npm run lint
npm run type-check
npm run test
npm run build
```

## Build Artifacts Location
```plaintext
denbug/
├── packages/
│   ├── core/
│   │   └── dist/          # Core library output
│   └── ui/
│       └── dist/          # UI bundle output
├── docs/                  # Generated docs
└── coverage/              # Test coverage
```

## Environment Setup (.env files)
```ini
// filepath: /c:/tweesic/denbug/.env
NODE_ENV=development
DEBUG=denbug:*
VITE_APP_VERSION=$npm_package_version
```

```ini
// filepath: /c:/tweesic/denbug/.env.production
NODE_ENV=production
DEBUG=denbug:error
VITE_APP_VERSION=$npm_package_version
```