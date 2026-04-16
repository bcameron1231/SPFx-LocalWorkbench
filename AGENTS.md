# Agents Guide for SPFx LocalWorkbench

## Project Overview

**SPFx LocalWorkbench** is an open-source VS Code extension created by the PnP team that provides a local development environment for SharePoint Framework (SPFx) web parts and extensions. It offers features unavailable in Microsoft's standard workbench:

- **Integrated local workbench** directly within VS Code
- **Robust API proxy system** for SharePoint API mocking
- **Storybook integration** for component-driven development
- **Advanced debugging and theming** capabilities

**Target Users**: SPFx developers working with TypeScript and React. Skill levels vary greatly, so prioritize:

- Simple, intuitive design for common workflows
- Advanced features available but not obtrusive
- Clear, streamlined experience for average developers

**Supported Versions**: SPFx 1.22+ only. All projects use **Heft** (never Gulp).

**Development Platforms**: All tooling, scripts, and conventions must work on both **macOS** and **Windows** development machines. Use cross-platform tools and avoid platform-specific shell commands.

---

## Architecture

### Monorepo Structure

```
SPFx-LocalWorkbench/
├── packages/
│   ├── shared/              # Shared utilities, mocks, components
│   └── storybook-addon-spfx/ # Storybook addon for SPFx
├── src/
│   ├── extension.ts         # VS Code extension entry point
│   └── workbench/           # Webview workbench implementation
├── webview/                 # Browser-side workbench UI
└── samples/                 # Sample SPFx projects
```

### Package Responsibilities

#### `packages/shared/`

**Purpose**: Shared code between Storybook addon and workbench webview/extension.

**Exports**:

- **Components**: React components (ThemePickerDropdown, ThemePreview)
- **Mocks**: SPFx context mocks (StatusRenderer, buildMockPageContext, etc.)
- **Types**: TypeScript interfaces for SPFx APIs
- **Utils**: Theme builders, loaders, helpers

**Constraints**:

- No framework-specific dependencies (must work in both Node.js and browser)
- Pure TypeScript/React only
- Export both types and runtime code
- Node.js-specific utilities (file I/O, process) go in `utils/node/` subpath

#### `packages/storybook-addon-spfx/`

**Purpose**: Storybook addon that wraps SPFx components with mock context.

**Independence Goal**: This addon should remain usable in standalone Storybook instances outside of SPFx LocalWorkbench. While LocalWorkbench is always the priority, **any feature that couples the addon to the VS Code extension MUST be explicitly called out and confirmed** before implementation. Consider alternative patterns (e.g., extension-specific features vs addon features).

**Features**:

- Theme toolbar for switching SharePoint themes
- Display mode toggle (Edit/Read)
- Locale selection
- Property pane integration
- Mock SPFx context injection

#### `src/` and `webview/`

**Purpose**: VS Code extension and webview-based workbench.

**Features**:

- Component picker
- Property pane
- Extension support (ApplicationCustomizer, etc.)
- API proxy for SharePoint REST/Graph calls
- Theme management

---

## Critical Build Configuration

### ⚠️ Package.json Exports Must Match TypeScript Output

**Problem**: The Storybook addon package had mismatched paths that broke in clean builds.

**Root Cause**:

- TypeScript config: `"outDir": "./dist"` outputs files to `dist/`
- Old package.json exports pointed to `dist/storybook-addon-spfx/src/`
- CSS copy script was copying to wrong location

**Solution** (already fixed):

```json
// packages/storybook-addon-spfx/package.json
{
  "main": "dist/preset.js", // NOT dist/storybook-addon-spfx/src/preset.js
  "types": "dist/preset.d.ts",
  "exports": {
    ".": "./dist/preset.js",
    "./manager": "./dist/manager.js",
    "./preview": "./dist/preview.js"
  },
  "scripts": {
    "copy-assets": "copyfiles -u 1 \"src/**/*.css\" \"src/**/*.css.d.ts\" dist"
  }
}
```

**Why it worked before**: Vite's dev mode used TypeScript path mappings and resolved from source, bypassing package.json exports. Clean builds exposed the broken configuration.

**Rule**: Always verify package.json `main`, `types`, and `exports` match the `outDir` from tsconfig.json.

---

## Import Patterns

### Importing from `@spfx-local-workbench/shared`

#### ✅ Correct Patterns

```typescript
// Main barrel export (preferred for most cases)
import {
  DEFAULT_THEME_NAME,
  buildMockPageContext,
  StatusRenderer,
  type ITheme
} from '@spfx-local-workbench/shared';

// Subpath exports for utilities
import { buildFluentTheme } from '@spfx-local-workbench/shared/fluent';

// Node.js-only utilities (file I/O, process access, etc.)
// Use ONLY in extension code, never in browser/webview/Storybook
import { localize } from '@spfx-local-workbench/shared/utils/node';

// Direct subpath when needed (wildcards supported)
import { StatusRenderer } from '@spfx-local-workbench/shared/mocks';
```

#### ❌ Avoid

```typescript
// Never import from dist/ or source paths
import { StatusRenderer } from '@spfx-local-workbench/shared/dist/mocks/StatusRenderer';
import { StatusRenderer } from '../../../shared/src/mocks/StatusRenderer';

// Don't bypass barrel exports without reason
import { StatusRenderer } from '@spfx-local-workbench/shared/mocks/StatusRenderer';
```

### CSS Module Imports

```typescript
// Component-scoped CSS modules
import styles from './MyComponent.module.css';

// Shared package CSS (when needed in Storybook)
import '@spfx-local-workbench/shared/mocks/StatusRenderer.module.css';
```

### Export Patterns

#### For new exports in `shared/src/index.ts`:

```typescript
// Use wildcard exports for directories with index.ts
export * from './components';
export * from './mocks';

// ALSO add explicit named exports for classes/functions
// (Ensures compatibility with Storybook's webpack)
export {
  buildMockPageContext,
  StatusRenderer,
  ThemePickerDropdown,
  // ...
} from './mocks';
```

**Why both?**: Wildcard `export *` works for types and some bundlers, but explicit named exports ensure classes are available in all module resolution scenarios (especially Storybook/webpack).

---

## Development Workflow

### Building the Project

```bash
# Full build (all packages, type checking, linting)
npm run compile

# Build shared package only
npm run packages:build:shared

# Build Storybook addon only
npm run packages:build:addon

# Watch mode for development
cd packages/shared && npm run watch
cd packages/storybook-addon-spfx && npm run watch
```

### Testing Changes

**Manual testing with sample web parts**:

1. **For workbench changes**: Press F5 to launch extension host
2. **For Storybook changes**: Restart Storybook after rebuilding addon
3. **After package.json changes**: Clear caches and restart

```bash
# Clear caches before testing clean builds
npm run clean:cache

# Clear all build outputs
npm run clean:dist

# Full clean (cache + dist)
npm run clean
```

### Verifying Exports

```bash
# Check if a class/function is exported from shared (example: buildMockPageContext)
grep "buildMockPageContext" packages/shared/dist/index.js

# Verify TypeScript declarations
grep "buildMockPageContext" packages/shared/dist/index.d.ts

# Test runtime import resolution
node -e "import('@spfx-local-workbench/shared').then(m => console.log(Object.keys(m)))"
```

---

## Critical Constraints

### Code Organization

1. **Shared code location**: Anything reusable between Storybook addon and workbench MUST go in `packages/shared/`
2. **React components**:
   - Use function components and hooks by default
   - Props defined in same file as component
   - One component per file (except small wrappers)
   - No framework dependencies in shared package
3. **SPFx compatibility**: Must match Microsoft's implementation exactly for context APIs

### React Patterns

1. **Function components**: Always use function components unless there's a clear technical constraint
2. **Hooks**: Extract complex logic into custom hooks when it improves clarity
3. **useEffect**: Use sparingly - prefer event handlers, useMemo, or other hooks when possible
4. **Class components acceptable when**:
   - Implementing error boundaries (until React 18+ adoption)
   - Maintaining compatibility with legacy SPFx APIs that expect class-based lifecycle
   - Clear performance benefit demonstrated
5. **Priority**: Simplicity and clarity over clever abstractions

### Styling

1. **Storybook UI**: Match Storybook's design system and practices
2. **SPFx surfaces**: Use Fluent UI styles, must be themeable
3. **VS Code UI**: Match VS Code conventions for commands, panels, etc.

### Build Requirements

1. **TypeScript**: Strict mode enabled
2. **ESM modules**: All packages use ES modules (`"type": "module"`)
3. **Cross-Platform**: All scripts, tooling, and commands must work on both macOS and Windows
   - Use `rimraf` instead of `rm -rf` for file deletion
   - Use `copyfiles` for cross-platform file copying
   - Avoid platform-specific shell commands (use npm scripts or Node.js)
4. **SPFx Samples**: Test with SPFx 1.22+ projects that use **Heft** (not Gulp). This project doesn't use Heft directly, but avoid generating instructions or tooling that reference Gulp since it's deprecated in modern SPFx.

### Git Operations

1. **Moving/Renaming Files**: **ALWAYS** use `git mv` instead of manual file operations
   - Preserves git history and blame information
   - Makes code archaeology easier for future maintainers
   - Example: `git mv webview/src/proxy/ProxyHttpClient.ts packages/shared/src/proxy/clients/ProxyHttpClient.ts`
2. **After moving**: Update all import paths and verify with `npm run compile`
3. **Commit moves separately**: Keep file moves in separate commits from content changes when possible
4. **Commits are manual only**: Git commits should NOT be done by the agent, only the user

---

## Common Development Tasks

### Adding New SPFx Mock APIs

**Example: Adding a context property like `context.httpClient` or `context.statusRenderer`**

1. **Create mock implementation** in `packages/shared/src/mocks/`:

   ```typescript
   // Example: HttpClient.ts
   export class MockHttpClient implements HttpClient {
     // Implementation matching Microsoft's API exactly
   }
   ```

2. **Export from mocks/index.ts**:

   ```typescript
   export { MockHttpClient } from './HttpClient';
   ```

3. **Export from shared/src/index.ts** (explicit named export):

   ```typescript
   export { MockHttpClient, buildMockPageContext } from './mocks';
   ```

4. **Integrate into contexts**:
   - `webview/src/mocks/SpfxContext.ts`
   - `packages/storybook-addon-spfx/src/decorators/withSpfx.tsx`

5. **Build and test**:
   ```bash
   npm run compile
   # Test in both workbench (F5) and Storybook
   ```

### Adding Workbench UI Features

1. Create component in `webview/src/components/`
2. Follow React best practices (props in same file, one per file)
3. Use Fluent UI components for theming support
4. Add CSS module (`.module.css`) for component styles
5. Register theme CSS variables if needed in `buildFluentTheme.ts`

### Fixing SPFx Compatibility Issues

1. **Reference Microsoft's implementation**: Check `@microsoft/sp-*` packages
2. **Match API signatures exactly**: Interface names, method signatures, return types
3. **Test with real web parts**: Use samples from `samples/` directory
4. **Verify in both environments**: Workbench AND Storybook

---

## Debugging Tips

### Storybook Issues

**"Cannot read properties of undefined"** in web parts:

- Check if mock context property exists in `withSpfx.tsx` and `SpfxContext.ts`
- Verify mock is properly instantiated (not undefined at runtime)
- Check browser console for import errors

**CSS not loading**:

- Verify CSS files copied to `dist/` alongside JS files
- Check package.json `copy-assets` script path
- Restart Storybook after rebuild

**Module resolution errors**:

- Ensure package.json exports match tsconfig.json outDir
- Clear caches: `npm run clean:cache` (or add clean scripts to package.json)
- Check explicit named exports in `shared/src/index.ts`

### Extension/Webview Issues

**Web part crashes on load**:

- Check `webview/src/mocks/SpfxContext.ts` for missing properties
- Verify theme CSS variables registered in `buildFluentTheme.ts`
- Check browser console in webview (Developer Tools)

**TypeScript errors in extension**:

- Run `npm run check-types` to see all type errors
- Ensure `@types/*` packages match runtime versions

---

## File Conventions

### Naming

- **Components**: PascalCase (e.g., `ThemePickerDropdown.tsx`)
- **CSS Modules**: Match component name (e.g., `ThemePickerDropdown.module.css`)
- **Utilities**: camelCase (e.g., `buildFluentTheme.ts`)
- **Mocks**: Match SPFx class name or prefix with Mock (e.g., `StatusRenderer.ts`, `MockHttpClient.ts`)

### CSS Modules

```typescript
// Always generate type definitions
// File: Component.module.css.d.ts (auto-generated by tcm)
export const className: string;
```

### Comments

Use **JSDoc style** for all documentation comments:

**Single-line format** (preferred when space permits):

```typescript
/** Serialized API request */
export interface IProxyRequest {
  /** Unique correlation ID for async response matching */
  id: string;

  /** The request URL */
  url: string;
}
```

**Multi-line format** (for longer descriptions):

```typescript
/**
 * Mock Rule Engine
 *
 * Matches incoming API requests against configured mock rules.
 * Supports exact substring matching and glob-style patterns.
 * Browser-compatible: accepts a bodyFile loader function instead of using Node.js fs.
 */
export class MockRuleEngine {
  /**
   * Create a new MockRuleEngine
   * @param bodyFileLoader Optional function to load body files (e.g., from Node.js fs or browser fetch)
   */
  constructor(bodyFileLoader?: BodyFileLoader) {
    // ...
  }
}
```

**Guidelines**:

- Use `/** ... */` for public APIs (interfaces, classes, exported functions, and their members)
- **Never use `/** */` inside a function or method body** — use `//` for all logic annotations within a function
- Use `@param` to document parameters when helpful for clarity
- Include examples for complicated or non-obvious methods/classes
- Avoid redundant tags like `@returns` unless the return value needs explanation

### TypeScript

```typescript
// Use explicit imports for types
import type { ITheme, IThemePalette } from '@spfx-local-workbench/shared';

// Props in same file as component
export interface IMyComponentProps {
  theme: ITheme;
  onThemeChange: (theme: ITheme) => void;
}

export const MyComponent: React.FC<IMyComponentProps> = ({ theme, onThemeChange }) => {
  // Implementation
};
```

---

## Testing Checklist

Before submitting changes:

- [ ] `npm run compile` succeeds with no errors
- [ ] TypeScript types are correct (`npm run check-types`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Changes work in **workbench** (F5 extension host)
- [ ] Changes work in **Storybook** (if applicable)
- [ ] No console errors in browser/webview
- [ ] Theme switching works (if UI component)
- [ ] Matches Microsoft's SPFx behavior (if mock API)

### Sample Testing Strategy

**When testing changes, consider:**

1. **Modify existing samples** when the change is straightforward (e.g., adding a new context property call)
2. **Create new sample web parts** for:
   - Complex scenarios or edge cases
   - New SPFx features not covered by existing samples
   - Demonstrating specific API usage patterns
3. **Recommend sample improvements** when you identify gaps in test coverage

---

## Resources

### Key Files for Reference

- **Package exports**: `packages/*/package.json` - verify exports match outDir
- **TypeScript config**: `packages/*/tsconfig.json` - check paths, outDir
- **Theme system**: `packages/shared/src/utils/buildFluentTheme.ts`
- **Workbench context**: `webview/src/mocks/SpfxContext.ts`
- **Storybook context**: `packages/storybook-addon-spfx/src/decorators/withSpfx.tsx`

### SPFx Reference

- [SPFx Documentation](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [SPFx API Reference](https://learn.microsoft.com/en-us/javascript/api/sp-webpart-base/)
- Microsoft's packages: `@microsoft/sp-webpart-base`, `@microsoft/sp-core-library`

---

## Questions or Issues?

When encountering errors:

1. **Check this guide first** for common patterns/pitfalls
2. **Verify package.json exports** match TypeScript outDir
3. **Clear caches** and rebuild clean
4. **Test in both environments** (workbench and Storybook)
5. **Check Microsoft's implementation** for SPFx APIs

This project follows PnP community standards. When in doubt, ask for clarification rather than assuming patterns from other projects.
