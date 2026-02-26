# Converge: Vision Document

## One-Liner

An AI development orchestrator that pairs vibe coding with vibe testing — generating code and executable acceptance tests in parallel, then converging them in an automated loop until the product matches expectations.

## The Problem

Today's AI coding tools (Claude Code, Codex, Cursor) are powerful code generators. Tools like Conductor.build let you run many of them in parallel. But they all share a fundamental gap: **there is no automated way to verify that the generated code matches what the user actually wanted.**

The human remains the sole quality gate. They must:
- Read every line of generated code
- Manually test the running application
- Mentally compare the result against their original intent
- Write feedback, wait for fixes, review again

This doesn't scale. When you're orchestrating 5-10 parallel agents, the review bottleneck kills the productivity gain.

## The Insight

**Tests are executable specifications.** If you generate tests FROM the requirement (not from the code), those tests become an automated verification layer between the AI and the human. The human reviews test adequacy ("does this test capture what I want?") rather than code correctness ("does this code do what I want?"). Tests are shorter, more readable, and directly tied to intent.

The second insight: **visual prototypes are reviewable specifications.** A mockup is faster to approve or reject than a written spec. Generating a visual prototype first, then deriving both code and tests from the approved visual, creates a tight specification loop.

## The Vision

Converge transforms the development workflow from:

```
Requirement → Code → Manual QA → Fix → Ship
```

To:

```
Requirement → Visual Prototype → Approve →
  ┌→ Code Agents (parallel)  ─┐
  └→ Test Agents (parallel)  ─┘
        → Automated Convergence Loop
        → Human Reviews (what passes)
        → Ship
```

### Core Loop

1. **Envision**: User describes what they want. Converge generates visual mockups (images/video) showing possible implementations. User picks one or iterates.

2. **Decompose**: The approved vision is broken into parallel work units — components, APIs, pages — each with corresponding acceptance criteria.

3. **Dual-Track Generate**: Code agents and test agents work simultaneously in isolated git worktrees. Code agents implement. Test agents generate `.sigma` behavior tree files encoding acceptance criteria.

4. **Converge**: Code branches are merged into an integration branch. The behavior tree test suite runs against it. Failures produce structured diagnostics (which step failed, screenshots, DOM state). Fix agents are dispatched. Loop until convergence.

5. **Verify**: Visual verification compares screenshots of the running implementation against the approved mockup. Functional tests + visual tests must both pass.

6. **Review**: The human sees a dashboard — test pass rate, visual similarity score, convergence timeline. They review the generated tests ("do these capture my intent?") and the final result, not intermediate code.

## Principles

### Test-First Orchestration
Tests are generated from the requirement, not from the code. Tests are the specification. Code agents are scored by how many tests they pass. This is TDD at the orchestration level.

### Living Documentation
The `.sigma` behavior tree files serve triple duty:
- **For QA**: Executable automated tests
- **For PMs**: Readable step-by-step workflows (rendered in sigma-authoring)
- **For Developers**: Acceptance criteria in precise, unambiguous format

One artifact, three audiences. The test suite IS the documentation.

### Cascading Confidence
Multiple verification layers filter issues before human review:
- **Level 1**: Lint + typecheck (syntax correctness)
- **Level 2**: Unit tests (logic correctness)
- **Level 3**: Behavior tree tests (functional correctness)
- **Level 4**: Visual verification (design correctness)
- **Level 5**: Human review (intent correctness)

Each level catches a class of problems so the human only deals with high-level intent questions.

### Local-First
Everything runs on the user's machine. Their repos, their API keys, their privacy. No cloud dependency for core functionality. Fast iteration without network latency.

## Target User

Converge targets the **builder** — the person who knows what they want to build and wants to build it fast. This is increasingly a merged PM/developer role:

- Developers who want automated QA alongside their AI-generated code
- Product-minded engineers who prototype ideas rapidly
- Technical PMs who can describe features precisely
- Solo founders and small teams who need to ship fast with confidence

The key trait: they can approve a visual prototype and validate acceptance criteria, but don't want to manually QA every code change.

## Positioning

| Tool | What It Does | Gap |
|------|-------------|-----|
| Claude Code / Codex | Single AI coding agent | No verification, no parallelism |
| Conductor / Claude Squad | Parallel code agents | No automated verification |
| Cursor / Windsurf | IDE-integrated AI | Conductor-mode only, no orchestration |
| Testsigma / Playwright | Test automation | No code generation, no AI orchestration |
| **Converge** | Parallel code + test agents with convergence loop | -- |

Converge occupies a unique position: it's the only tool that generates both code AND its verification criteria, then automatically converges them.

## What We Leverage

This isn't built from scratch. We bring:

- **behaviour-tree-ecosystem**: Production-grade BT runtime with 60+ Playwright atoms, XML format designed for LLM generation, event streaming for diagnostics
- **sigma-authoring**: Visual test editor for reviewing/editing generated tests, with live execution and screencast
- **bt-agent-trpc**: Remote test execution with real-time results over WebSocket
- **recorder extension**: Can record user interactions as behavior trees (future: spec capture)

## Success Metrics

For the MVP:
- Time from requirement to reviewable output (target: < 15 min for a typical feature)
- Test generation accuracy (% of generated tests that correctly encode the requirement)
- Convergence rate (% of features that reach all-tests-pass within 5 iterations)
- Review time reduction (time human spends reviewing vs building manually)

## Future Roadmap (Post-MVP)

- **Competitive Agents**: Spawn multiple implementations of the same task, pick the one that passes the most tests
- **Spec Recording**: User walks through desired workflow in browser, recording becomes the acceptance test
- **Team Collaboration**: Multiple humans orchestrating shared agent pools
- **CI/CD Integration**: Converge runs as part of the deployment pipeline (generated tests become regression suite)
- **Self-Improving Tests**: Agent that hardens flaky tests by adding proper waits, retries, and resilience patterns
