---
name: verify-change
description: Verify a change to the SPFx Local Workbench extension - type-check, lint, unit tests, bundles - and check it stays SPFx-agnostic. Use after editing anything under src/, webview/ or packages/, before reporting a change as done.
---

# Verify a change

1. **Generic check.** Search your diff for product names, tenant hosts, user names or special cases for one web
   part. The workbench must work for any SPFx solution. Examples use `contoso.sharepoint.com` / `example.com`.
2. **Build everything:** `npm run compile` (builds `packages/shared` and the Storybook addon, runs `tsc --noEmit`,
   ESLint, CSS module typings, and both bundles). Fix every error in source files, never in `dist/`.
   - If you changed `packages/shared`, the compile rebuilds it first; the webview imports the built package.
   - CSS module typings (`*.module.css.d.ts`) are generated; don't edit them.
3. **Unit tests:** `npm test`. Add or extend tests for pure logic you changed: tests live next to the code
   (`*.test.ts`), e.g. `src/workbench/proxy/MockRuleEngine.test.ts`.
4. **Formatting:** `npm run format:check` on the files you touched (run `npm run format` only on your own files if
   needed; don't reformat unrelated code).
5. **Strings and settings:** every new user-facing string is in `package.nls.json`; every new setting is in
   `package.json`, README.md (settings table) and the relevant doc.
6. **Behaviour:** if the change is visible in the workbench, check it in an Extension Development Host (F5) or an
   installed build (`install-local-build` skill), following docs/testing.md. Say so plainly if you couldn't.
7. **Record it:** add the change to `CHANGELOG.md` under `[Unreleased]`.

Report: commands run with pass/fail, tests added, what was checked by hand and what wasn't.
