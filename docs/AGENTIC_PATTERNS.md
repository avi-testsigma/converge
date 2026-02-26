# Agentic Engineering Patterns: How They Shape Converge

Analysis of [Simon Willison's Agentic Engineering Patterns](https://simonwillison.net/guides/agentic-engineering-patterns/) and how each pattern asserts, opposes, or inspires additions to Converge's design.

## Pattern: "Writing Code is Cheap Now"

**Source**: Willison argues AI has made code production nearly free, but "good code" (correct, tested, maintainable, secure) remains expensive. The developer's burden shifts from writing code to ensuring quality.

**Assertion**: This is the economic foundation of Converge. If code is cheap, the scarce resource is verification. Converge invests compute in verification layers (tests, visual checks, walkthroughs, regression safety) rather than optimizing for more code generation. Every other orchestrator (Conductor, Claude Squad) optimizes for generating more code faster. We optimize for generating more confidence faster.

**Design impact**: Cascading Confidence levels 0-7 directly address every dimension of Willison's "good code" checklist — correctness (BT tests), problem-solving alignment (visual verification against mockup), test coverage (generated alongside code), and maintainability (change walkthrough for reviewability).

## Pattern: "Red/Green TDD"

**Source**: Willison's four-word prompt "Use red/green TDD" encapsulates: write tests first, confirm they fail, implement until they pass. He identifies two risks it mitigates: **non-functional code** (agents write code that doesn't work) and **unnecessary code** (agents build features that never get used).

**Assertion**: This is literally Converge's core thesis — Test-First Orchestration. We generate tests from the requirement (not from the code), and code agents' success is measured by tests passing. This is red/green TDD at the system level.

**Gap it exposed**: Our original design generated tests and code in parallel but never verified the red phase. If a generated test passes without any code changes, it's vacuous — it doesn't actually test anything new.

**Design change**: Added explicit red-phase verification. After test agents complete, generated `.sigma` tests are run against the CURRENT codebase (before code agent changes). Any test that passes is flagged as vacuous and must be rewritten with stricter assertions.

## Pattern: "First Run the Tests"

**Source**: Willison recommends opening any agent session by running existing tests. Four strategic purposes: (1) discovery — agent finds test infrastructure, (2) project scope — test count signals complexity, (3) mental framing — shifts agent into testing mindset, (4) learning — agents read tests to understand existing features.

**Assertion**: Validates the convergence loop as a feedback mechanism. Also validates that agents are "already biased toward testing" — meaning our test agents should produce decent output, and fix agents will naturally try to make tests pass.

**Gap it exposed**: Our original design had no concept of a baseline. We never ran existing project tests before or after agent work. Code agents could break existing functionality and we'd never know.

**Design changes**:
1. **Baseline recording**: Run existing test suite before agents start. Record pass/fail state.
2. **Regression checking**: After each convergence iteration, run existing tests again. New failures compared to baseline are regressions that get their own fix agents.
3. **Grounding agent**: A new agent type (`ground`) that explores the codebase, reads existing tests, identifies conventions and relevant files. Its report is fed to all code agents as context. This implements Willison's "discovery" and "learning" purposes.

## Pattern: "Linear Walkthroughs"

**Source**: Willison describes having agents generate structured, narrative explanations of code — reading through a codebase systematically and documenting functionality. Key use case: making sense of rapidly-produced code, including "vibe coded" projects.

**Relevance**: After convergence, our system produces code that the human didn't write and may not fully understand. The review step shows diffs and test results, but diffs are hard to read and don't explain intent.

**Gap it exposed**: No explainability layer. The human sees WHAT changed (diffs) and WHETHER it works (tests), but not WHY it was built this way or HOW the pieces connect.

**Design change**: Added a `walkthrough` agent type. After convergence, this agent reads all diffs, test results, and the original requirement, then produces a narrative summary: what was built, why, and how it connects to the existing codebase. This becomes the first thing the human reads in the review step — before diffs, before tests. It turns the review from "decode these diffs" to "read this story, then verify the details."

## Summary: What Changed

| Pattern | Impact on Converge |
|---------|-------------------|
| Code is cheap | Validates core economic thesis; Cascading Confidence addresses the "expensive" parts |
| Red/Green TDD | Validates Test-First Orchestration; **added red-phase verification** |
| First Run the Tests | **Added baseline recording, regression checking, grounding agent** |
| Linear Walkthroughs | **Added walkthrough agent and narrative change summaries** |

## What It Doesn't Cover (And We Should Watch)

Willison's guide is still early (4 patterns published). Patterns likely coming that will be relevant:

- **Prompt engineering for agents** — How to structure prompts for code generation agents. Directly relevant to our code-agent.md, test-agent.md, and fix-agent.md prompt templates.
- **Reviewing agent output** — Patterns for efficiently reviewing AI-generated code. Could inform how we structure the review step and what the walkthrough should emphasize.
- **Agent coordination** — Multi-agent patterns. Directly relevant to our orchestration and convergence design.
- **Debugging agent failures** — When agents go off-track. Relevant to our diagnosis agent and the max-iterations-reached fallback.

We should revisit this analysis as new patterns are published.
