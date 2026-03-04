# Intelligent QA: The Quality Intelligence Layer

## From Convergence to Continuous Quality

Converge started as a development-time convergence engine: generate code and tests in parallel, loop until they agree, ship. The Quality Intelligence Layer extends this into a platform that **understands your system deeply, guards it continuously, and gets smarter with every iteration**.

This doesn't replace the developer-friendly spectrum. It deepens it. Every surface — from a CLI command to the full desktop app — gains intelligence underneath. A `/converge-test` invocation now benefits from risk scoring. A Storybook panel shows coverage gaps. The desktop app runs a full intelligence dashboard. Same entry points, smarter engine.

## Three Acts of Quality

```
Act 1: BUILD          Act 2: GUARD           Act 3: LEARN
(Development)         (Post-Merge)           (Continuous)

Requirement           Production              Outcome Data
    ↓                 Monitoring              (what worked,
Generate Code           ↓                     what didn't)
Generate Tests        Release Gating              ↓
    ↓                     ↓                  Update Models
Converge              Anomaly Detection      Refine Risk Scores
    ↓                     ↓                  Improve Generation
Review & Merge        Incident → Test            ↓
                          ↓                  Feed back into
                      Continuous Guard       Act 1 and Act 2
```

### Act 1: Build (Development Time)

What Converge already does. The convergence loop: envision → ground → generate → red check → converge → review → merge. Tests from requirements, visual prototypes, cascading confidence. This remains the core.

**What intelligence adds to Build:**
- Risk-informed test generation (focus tests on high-risk areas)
- Coverage-aware decomposition (identify untested paths before generating)
- Historical pattern matching (this code area broke 40% of the time — allocate more agents)
- Budget-aware execution (1000 test runs available — maximize information per run)

### Act 2: Guard (Post-Merge)

Quality doesn't end at merge. The Guard phase monitors the deployed system and feeds issues back to the Build phase.

- **Continuous Monitoring** — Watch error rates, performance degradation, unexpected behavior patterns
- **Release Gating** — Composite confidence score (not binary pass/fail) based on test results, code risk, and business impact
- **Production Feedback** — When production anomalies are detected, generate regression tests for the exact failing scenario
- **Incident-to-Test** — Every production incident that gets fixed automatically becomes a regression test

### Act 3: Learn (Continuous)

The system compounds knowledge across every interaction.

- **Pattern Learning** — Which tests catch real bugs vs noise? Which code areas cluster defects?
- **Model Refinement** — Risk scores adjust based on prediction accuracy. Test generation templates improve based on defect detection history.
- **Developer Feedback Integration** — False positives dismissed by developers reduce future noise. Production bugs not caught by tests expose coverage gaps.

---

## The Eight Pillars

Each pillar maps to Converge's architecture and surfaces across the spectrum.

### 1. Perception & Intelligence

**QA's mission starts with understanding.** Before generating a single test, the system needs to know what matters.

**Current in Converge:**
- Grounding agent explores codebase (framework, conventions, relevant files)
- Visual mockup comparison (screenshot vs approved design)

**Expanded:**

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| **Coverage Intelligence** | Map the application's functionality without human test planning | Static analysis + behavior extraction + documentation mining → coverage heat map |
| **Risk Predictor** | Anticipate where bugs are most likely | Code complexity + historical defect density + change frequency + business criticality + dependency chains → risk scores per component |
| **Behavior Pattern Recognition** | Learn what "normal" looks like | Baseline performance, data flow patterns, state machine transitions, error patterns → deviation detector |

**Across the Spectrum:**
- **CLI Skill**: Risk score printed alongside test results (`Risk: HIGH — 3 of 5 tests target critical payment paths`)
- **Storybook Addon**: Coverage indicator per story (green = well-tested, amber = gaps, red = untested)
- **VS Code Extension**: Inline gutter icons showing risk level per function/module
- **Desktop App**: Full intelligence dashboard — coverage heat map, risk distribution, trend lines

**Agent:** `risk-agent` — Analyzes codebase, computes risk scores, tracks trends. Read-only access. Runs periodically or on code change events.

### 2. Test Planning & Prioritization

**The agent decides what to test and in what order.** Not all code deserves equal testing effort.

**Current in Converge:**
- Test generation from requirements (test-agent)
- Red-phase verification (tests must fail before code)

**Expanded:**

| Capability | What It Does | Decision Factors |
|-----------|-------------|-----------------|
| **Intelligent Test Generation** | Create tests without human specification | Boundary analysis, state space exploration, API contract testing, error injection, production data patterns |
| **Risk-Based Prioritization** | Schedule tests by maximum impact per resource | Business impact × blast radius × user frequency × historical failure rate |
| **Regression Test Intelligence** | Maintain a smart regression suite | Change impact analysis, obsolete test detection, flaky test quarantine, test-to-requirement traceability |

**Budget-Aware Execution:**
```
Budget: 1000 test runs before deadline
Decision: 600 runs on payment module (high risk, high impact)
          200 runs on user dashboard (medium risk, high traffic)
          150 runs on settings page (low risk, recent changes)
           50 runs on help pages (low risk, low traffic)

Dynamic: Defect found in settings → reallocate 100 runs from help → settings
```

**Across the Spectrum:**
- **CLI Skill**: `--budget 100` flag → run the 100 most valuable tests
- **Storybook Addon**: Stories sorted by risk, high-risk stories get more test variants
- **VS Code Extension**: CodeLens shows "3 high-priority tests | 12 low-priority" per component
- **Desktop App**: Test planning dashboard with budget allocation, drag-and-drop priority override

### 3. Autonomous Test Execution

**The agent actually runs tests and captures real data.** Beyond functional testing.

**Current in Converge:**
- BT test execution (functional)
- Visual verification (screenshot comparison)
- Lint + typecheck (syntax)
- Unit tests (logic)

**Expanded:**

| Testing Mode | What It Catches | Technique |
|-------------|----------------|-----------|
| **Performance** | Slowdowns under load | Response time baselines, memory profiling, CPU hotspots |
| **Security** | Vulnerabilities | OWASP patterns, injection testing, auth bypass attempts, header validation |
| **Accessibility** | Barriers to use | WCAG compliance, screen reader compatibility, keyboard navigation |
| **Chaos** | Fragility | Network failures, dependency outages, resource exhaustion, clock skew |
| **Cross-Environment** | Platform-specific bugs | Different browsers, OS, device sizes, network conditions |

**Self-Healing Execution:**

Most test maintenance is waste. Tests break because locators change, timing varies, or test data becomes stale — not because the app is broken.

| Failure Type | What Heals It | How |
|-------------|-------------|-----|
| Locator drift | Smart locator fallback | Multi-attribute matching (data-testid → text → visual → DOM position) |
| Timing issues | Adaptive waits | Learn typical load times per action, adjust dynamically |
| Data staleness | Test data refresh | Detect stale fixtures, regenerate from schema |
| Flow changes | **Semantic re-derivation** | .sigma files encode INTENT ("verify checkout works"), not just steps — re-derive steps from intent against current app state |

The last row is Converge's unique advantage. Because `.sigma` behavior trees encode test intent as a tree of goals (not a linear script of click-here-type-there), the system can re-plan the steps while preserving the acceptance criteria. This is semantic self-healing — no other tool does this.

**Agent:** `heal-agent` — Analyzes test failures classified as "test infrastructure" (not app bugs), applies appropriate healing strategy, verifies fix, updates test.

### 4. Defect Detection & Analysis

**The agent identifies problems and explains them.** Not just "test failed" — what failed, why, and what to do about it.

**Current in Converge:**
- Diagnose agent (BT event log + screenshots → diagnostic report)
- Fix agent (applies targeted fix from diagnostic report)

**Expanded:**

**Multi-Level Detection:**
- **Obvious:** Crashes, exceptions, timeouts, assertion failures
- **Subtle:** Data integrity issues (silent write failures, stale reads), race conditions, memory leaks, resource exhaustion, state inconsistency (UI shows X, database has Y)
- **Behavioral anomalies:** Statistical outliers (this transaction is 100x slower than baseline)

**Root Cause Analysis Engine:**

```typescript
interface EnrichedDiagnosticReport extends DiagnosticReport {
  rootCause: {
    executionTrace: string[]          // Which code paths executed
    stateSnapshot: Record<string, any> // State before and after failure
    baselineComparison: string         // How this differs from normal behavior
    correlatedChanges: GitCommit[]     // Recent code changes in affected area
    resourceMetrics: {                 // System health at failure time
      memory: number
      cpu: number
      networkLatency: number
      openConnections: number
    }
  }
  triage: {
    fingerprint: string               // Deduplicate same root cause
    severity: 'critical' | 'high' | 'medium' | 'low'
    businessImpact: string
    likelyOwner: string               // Based on code ownership + change history
    relatedDefects: string[]           // Previously seen similar patterns
  }
}
```

**Defect Deduplication:**
Same root cause shouldn't create 1000 bug reports. Fingerprint defects → group by root cause → report once with occurrence count and affected tests.

**Agent:** `triage-agent` — Receives raw diagnostic reports, deduplicates, scores severity × frequency × business impact, assigns likely owner, groups related failures.

### 5. Orchestration & Decision Making

**The agent coordinates everything and makes trade-offs.**

**Current in Converge:**
- Orchestrator engine manages the convergence lifecycle
- State machine: IDLE → ... → MERGED
- Event stream for all convergence activities

**Expanded:**

**Resource Allocation:**
```
Situation: 3 features in flight, 2 hours of compute budget remaining
Decision:
  Feature A (payment refactor): 60% budget — high risk, high business impact
  Feature B (dashboard redesign): 30% budget — medium risk, user-facing
  Feature C (admin settings): 10% budget — low risk, internal-only

  As defects found in Feature C → bump to 20%, reduce B to 20%
```

**Human-in-the-Loop Triggers:**

The system handles 95%+ autonomously. It escalates to humans for:

| Trigger | Why | Example |
|---------|-----|---------|
| Severity-critical bugs | Business decision required | Payment processing failure detected |
| Ambiguous failures | Could be app, test, or infrastructure | Intermittent timeout — real slowdown or flaky network? |
| Novel patterns | Model has no precedent | Never-before-seen error signature |
| Risk trade-offs | Release timing vs. quality | "3 low-severity bugs remain. Release with known issues or delay?" |

**Release Gate Logic:**

Not binary pass/fail. A composite confidence assessment:

```typescript
interface ReleaseAssessment {
  verdict: 'safe' | 'acceptable_risk' | 'risky' | 'stop'
  confidence: number                    // How confident is the model in this verdict
  factors: {
    coverageAchieved: number            // vs target
    riskScore: number                   // vs acceptable threshold
    defects: { critical: number; high: number; medium: number; low: number }
    regressionStatus: 'clean' | 'minor' | 'major'
    visualMatchScore: number
    predictionAccuracy: number          // Historical: how often was model right?
  }
  reasoning: string                     // Natural language explanation
  recommendation: string                // "Ship it" / "Fix 2 high-severity issues first" / "Needs more testing"
}
```

### 6. External Integration

**The agent connects with the rest of your system.** Converge is local-first, but it speaks to external services when configured.

| Integration | What It Does | Protocol |
|------------|-------------|----------|
| **Git/CI/CD** | Trigger test runs on commits/PRs, report results as checks | GitHub Actions, GitLab CI, Jenkins webhooks |
| **Issue Tracking** | Auto-file bugs with reproduction steps, link to code + test + diagnosis | Jira, Linear, GitHub Issues API |
| **Monitoring** | Ingest production metrics, detect anomalies, correlate with test results | Datadog, New Relic, CloudWatch webhooks |
| **Communication** | Real-time critical alerts, daily summaries, weekly trends | Slack, Teams, email webhooks |

**The Feedback Bridge:**
```
Production alert (Datadog) → Converge ingests anomaly
  → Correlates with recent deployments
  → Identifies likely code path
  → Generates regression test for the scenario
  → Adds to regression suite
  → Next convergence run includes the new test
```

This closes the most important loop: **every production issue becomes a test that prevents recurrence.**

### 7. Configuration & Control

**The agent adapts to your system's needs.** Different codebases have different risk profiles.

**Customizable Risk Model:**
```yaml
# .converge/risk-config.yaml
modules:
  payments:
    risk_weight: 10           # Maximum scrutiny
    test_strategy: exhaustive
    coverage_target: 95%
  dashboard:
    risk_weight: 5
    test_strategy: risk_focused
    coverage_target: 80%
  help_pages:
    risk_weight: 1
    test_strategy: smoke
    coverage_target: 50%

global:
  flaky_test_quarantine: true
  auto_heal_locators: true
  max_convergence_iterations: 10
```

**Test Strategy Templates:**
Different for web apps, APIs, mobile, microservices. Machine-learned over time — adjust based on what actually catches bugs in your codebase.

**Gradual Rollout Support:**
For teams with feature flags or canary infrastructure:
```
Deploy to 5% of users → monitor for 1 hour →
  Error rate normal? → expand to 25%
  Error rate elevated? → auto-rollback + generate diagnostic
```

### 8. Feedback & Continuous Learning

**The agent improves over time.** Every test run, every diagnosis, every human decision teaches the system.

**What It Tracks:**
- Which tests catch real bugs vs. produce noise
- Which code areas cluster defects
- Which change patterns precede failures
- Which risk predictions were accurate
- What false positives developers dismissed
- What production issues tests missed

**Feedback Loops:**

```
Defect found in production
  → Was it in a high-risk area? (If not: risk model under-weighted it)
  → Did any test cover this path? (If not: coverage gap)
  → Did a test run and pass? (If so: test was inadequate)
  → Update: risk scores, coverage targets, test generation templates
  → Next cycle: similar areas get more scrutiny
```

```
Developer dismisses test failure as false positive
  → What caused it? Timing? Stale data? Locator drift?
  → Update: heal-agent learns this pattern
  → Next cycle: auto-heal instead of reporting
  → Track: false positive rate trends down over time
```

**Model Refinement:**
- Risk scoring recalibrated after each release (prediction vs. reality)
- Test generation templates evolved based on defect detection rate
- Flakiness detection learns environmental quirks (e.g., "tests on CI run 2x slower, adjust timeouts")

---

## New Agent Types

| Agent | Purpose | Tools | Runs When |
|-------|---------|-------|-----------|
| **risk-agent** | Compute risk scores from code analysis + defect history | Read, Glob, Grep, Bash (read-only) | On code change, periodically |
| **monitor-agent** | Watch production metrics, detect anomalies | Read, WebFetch, Bash (read-only) | Continuous post-deploy |
| **triage-agent** | Deduplicate defects, score severity, assign owners | Read, Glob, Grep | After diagnosis phase |
| **heal-agent** | Self-heal broken tests (locator, timing, data) | Read, Write, Edit, Bash | When test fails as "test infrastructure" |

These join the existing seven: ground, code, test, fix, fix-regression, diagnose, walkthrough.

---

## Across the Spectrum

The spectrum remains the core organizing principle. QA intelligence manifests differently at each level:

| Capability | CLI Skill | Storybook Addon | VS Code Extension | Desktop App |
|-----------|-----------|-----------------|-------------------|-------------|
| **Risk Scoring** | Risk badge in output | Risk indicator per story | Gutter icons per function | Full heat map dashboard |
| **Coverage Intelligence** | Coverage summary | Gap indicator per story | Inline uncovered paths | Coverage explorer with drill-down |
| **Smart Prioritization** | `--budget N` flag | Sort stories by risk | Prioritized test list | Budget allocation dashboard |
| **Multi-Modal Testing** | `--security --a11y` flags | A11y panel per story | Security warnings inline | Full multi-modal suite |
| **Self-Healing** | Auto-retry with healing | Auto-update locators | Healing suggestions | Healing dashboard with approvals |
| **Defect Triage** | Grouped failure output | Grouped per component | Inline diagnostic cards | Triage queue with assignment |
| **Release Gating** | Confidence score in output | — | Status bar verdict | Release dashboard with reasoning |
| **Production Monitoring** | Alert notifications | — | Alert sidebar | Monitoring dashboard |
| **Learning** | Improving defaults | Better test generation | Smarter diagnostics | Learning analytics |

The CLI user gets smarter defaults. The desktop user gets full visibility. Same engine. Different depth.

---

## Competitive White Space

Based on landscape analysis, Converge occupies unique white space:

### What Exists (We Compete On Quality)
- Locator-based self-healing (Testim, Mabl, Katalon)
- Predictive test selection (CloudBees/Launchable)
- LLM-assisted test authoring (Testsigma, Momentic)
- Visual AI regression (Applitools)
- ML-based failure classification (BrowserStack, Parasoft)

### What's Poor (We Do Better)
- Flow-level self-healing → **Converge: semantic self-healing via intent-encoded .sigma files**
- Multi-agent QA coordination → **Converge: 11 specialized agent types with shared context**
- Cross-system root cause analysis → **Converge: enriched diagnostics with correlation engine**

### What Doesn't Exist (We Create)
1. **Semantic self-healing** — .sigma trees encode intent, not just steps. When flows change, re-derive steps from intent. No other tool has this.
2. **Closed-loop quality intelligence** — Build → Guard → Learn as one continuous system. Everyone else has siloed tools that need human glue.
3. **Business-context-aware test prioritization** — Payments module gets 10x the scrutiny of help pages. Configurable per module.
4. **Production-anomaly-to-regression-test pipeline** — Every production incident automatically becomes a test.
5. **AI release confidence scoring** — Composite score with reasoning, not binary pass/fail.
6. **Developer-first QA intelligence** — Every other platform targets QA teams. Converge targets developers with a spectrum from CLI to full orchestration.

The deepest moat: **the platform that connects production behavior, code changes, test results, business context, and release decisions into a single feedback loop — where each component informs the others automatically — will own the next generation of QA.** That's Converge.

---

## Relation to Existing Docs

- **VISION.md** — Principles expanded with Continuous Quality, Intelligence Compounds
- **ARCHITECTURE.md** — New layers: Intelligence Engine, Monitoring Service, Learning Engine
- **MVP.md** — Phases 6-8 added for post-MVP QA intelligence
- **CLAUDE_PLUGINS.md** — New MCP tools and skills for intelligence features
