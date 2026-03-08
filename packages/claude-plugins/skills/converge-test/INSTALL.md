# Installing /converge-test

## Prerequisites

- **Node.js 22+**
- **Claude Code** installed and authenticated ([docs](https://docs.anthropic.com/en/docs/claude-code))

## Step 1: Install sigmascript

sigmascript is the test runner that executes `.sigma` behavior tree files. It's published as `@testsigmainc/sigmascript` on the GitHub Packages registry.

### Configure the private registry

Add an `.npmrc` file in your project root (or `~/.npmrc` for global access):

```ini
@testsigmainc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Replace `YOUR_GITHUB_PAT` with a GitHub personal access token that has `read:packages` scope. [Create one here](https://github.com/settings/tokens/new?scopes=read:packages).

### Install the package

```bash
npm install --save-dev @testsigmainc/sigmascript
```

Verify it works:

```bash
npx sigmascript --version
```

## Step 2: Add the skill to Claude Code

There are three ways to install the skill, from simplest to broadest:

### Option A: Project-scoped (recommended)

Copy the skill into your project's `.claude/skills/` directory. Claude Code auto-discovers skills from this directory — no configuration needed.

```bash
# From your project root:
mkdir -p .claude/skills

# Copy the skill
cp -r /path/to/testsigma-converge/packages/claude-plugins/skills/converge-test .claude/skills/converge-test
```

Commit `.claude/skills/converge-test/` to your repo so the whole team gets it.

### Option B: Personal (all your projects)

Install to your personal Claude Code skills directory:

```bash
cp -r /path/to/testsigma-converge/packages/claude-plugins/skills/converge-test ~/.claude/skills/converge-test
```

This makes `/converge-test` available in every project you open with Claude Code.

### Option C: Plugin marketplace (team distribution)

When packaged as a Claude Code plugin, install via:

```
/plugin install converge-test@<marketplace-name>
```

Or browse available plugins:

```
/plugin
```

## Step 3: Use it

Open your project in Claude Code and invoke the skill:

```
/converge-test Add a login page with email/password authentication
```

Claude will:
1. **Ground** — explore your codebase (framework, conventions, relevant files)
2. **Generate** — write `.sigma` test files from the requirement
3. **Red Check** — run the tests to verify they all fail (confirms they test new behavior)
4. **Report** — present results and suggest what to implement next

After you implement the feature:

```
/converge-test run
```

Claude will re-run the tests and diagnose any failures.

## Troubleshooting

### "sigmascript: command not found"

sigmascript should be installed as a project dependency and invoked via `npx`:

```bash
npx sigmascript --version
```

If you see a 401/403 error during install, check your `.npmrc` — the GitHub PAT may have expired or lack `read:packages` scope.

### "No test plans defined"

The skill generates `sigma.config.ts` automatically during the GENERATE phase. If it's missing, check that the GENERATE phase completed successfully.

### Tests time out immediately

Make sure your dev server is running before running tests:

```bash
npm run dev
```

The generated tests navigate to your app's URL (typically `http://localhost:3000`). The server must be running for Playwright to interact with it.
