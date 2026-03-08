# Sigma Validation Reference

Comprehensive validation system for Sigma behavior tree tests.

---

## Validation Pipeline

When loading a Sigma project, validation runs in this order:

```
1. File Discovery
   └─→ Find all .sigma files matching patterns

2. Platform Validation
   └─→ Verify platform is 'web' or 'mobile'

3. XSD Schema Validation (if enabled)
   └─→ Check XML structure against XSD schema
   └─→ Detect unknown node types
   └─→ Report ALL structural errors at once

4. Parsing + Attribute Validation (if enabled)
   └─→ Parse XML to AST
   └─→ Validate each node's attributes via Joi schemas
   └─→ Collect all attribute errors

5. Parse Error Check
   └─→ Throw if any validation errors from steps 3-4

6. Tree Building
   └─→ Convert AST to executable TreeNode instances
   └─→ Register in tree registry

7. Parameter Validation (if enabled)
   └─→ Check declared params match usage
   └─→ Validate StepGroup calls have required params

8. Reference Validation (if enabled)
   └─→ Verify all SubTree references exist
   └─→ Check for duplicate BehaviorTree IDs
   └─→ Report cross-file reference issues
```

---

## 1. XSD Schema Validation

### Purpose
Validates XML structure against the XSD schema to catch unknown/misspelled node types.

### What It Catches
- Unknown element names (typos like `<Clck>` instead of `<Click>`)
- Invalid nesting (e.g., `<Click>` inside `<Click>`)
- Structural violations

### Implementation
- Located in `bt-xml/xsd-validator.ts`
- Uses custom tree-walking (not external xmllint)
- Extracts valid elements from XSD via regex
- Reports ALL errors at once (batch mode)

### Example Errors

```
Error: Unknown element 'Clck' in file tests/login.sigma
  At: root > Sequence > Clck
  Did you mean: Click, Clear, Check?

Error: Unknown element 'Locte' in file tests/search.sigma
  At: root > Sequence > Locte
  Did you mean: Locate, LocateElement?
```

---

## 2. Attribute Validation (Joi)

### Purpose
Validates node attributes match their declared schemas - correct names, types, and values.

### What It Catches
- Unknown attributes (typos like `timout` instead of `timeout`)
- Missing required attributes
- Wrong attribute types (string where number expected)
- Invalid enum values

### Implementation
- Located in `bt-xml/attribute-validator.ts`
- Schemas merged from:
  - `bt-core` - control flow nodes
  - `bt-playwright` - web automation nodes (when platform='web')
  - `bt-mobile` - mobile nodes (when platform='mobile')
- Uses Joi for schema validation

### Configuration

```typescript
const validator = new AttributeValidator({
  platform: 'web',           // 'web' or 'mobile'
  strictAttributes: true,    // Report unknown attributes
  debug: false,              // Verbose logging
});
```

### Example Errors

```
Error: Missing required attribute 'element' on Click node
  File: tests/checkout.sigma, line 45
  Node path: root > Sequence > Click

Error: Unknown attribute 'timout' on Locate node
  File: tests/login.sigma, line 12
  Valid attributes: css, xpath, text, testId, role, name, label,
                   placeholder, title, alt, as, timeout, exact

Error: Invalid value for attribute 'button' on Click node
  Expected: "left" | "right" | "middle"
  Received: "center"
  File: tests/actions.sigma, line 78

Warning: Unknown attribute 'description' on Sequence node
  File: tests/main.sigma, line 5
  This attribute will be ignored
```

### Strict vs Non-Strict Mode

**Strict Mode (default)**:
- Unknown attributes cause errors
- All attribute issues are errors

**Non-Strict Mode**:
- Unknown attributes cause warnings
- Continues execution with warnings logged

---

## 3. Reference Validation

### Purpose
Validates that SubTree/StepGroup references point to existing BehaviorTree definitions.

### What It Catches
- Missing BehaviorTree definitions
- Duplicate BehaviorTree IDs across files
- External file references (warning)

### Implementation
- Located in `bt-xml/reference-validator.ts`
- Runs AFTER all trees are parsed and built
- Validates across ALL files in project
- Batch reports all reference issues

### Example Errors

```
Error: SubTree 'LoginFloww' not found
  Referenced in: tests/main.sigma, line 23
  Node path: root > Sequence > StepGroup
  Available trees: LoginFlow, CheckoutFlow, SearchFlow, RegistrationFlow

Error: Duplicate BehaviorTree ID 'LoginFlow'
  First defined in: tests/auth/login.sigma, line 5
  Also defined in: tests/legacy/old-login.sigma, line 3
  Use unique IDs for each BehaviorTree

Warning: StepGroup references external file 'shared/common.sigma'
  Referenced in: tests/main.sigma, line 45
  Ensure external file is included in project patterns
```

### Cross-File Validation

Reference validation works across all files:

```
tests/
├── main.sigma           # References LoginFlow, CheckoutFlow
├── auth/
│   └── login.sigma      # Defines LoginFlow
└── checkout/
    └── checkout.sigma   # Defines CheckoutFlow
```

All references are validated after all files are loaded.

---

## 4. Parameter Validation

### Purpose
Ensures parameters declared in BehaviorTree definitions match their usage.

### What It Catches
- Using undeclared parameters (`${param}` not in `params` attribute)
- Missing required parameters in StepGroup calls
- Extra parameters passed to StepGroup

### Implementation
- Located in `bt-xml/parameter-validator.ts`
- Validates `${paramName}` references against declared params
- Validates StepGroup calls match target's parameter list

### Parameter Declaration

```xml
<BehaviorTree ID="LoginFlow" params="username, password">
  <Sequence>
    <!-- These must match declared params -->
    <Fill element="usernameInput" text="${username}" />
    <Fill element="passwordInput" text="${password}" />
  </Sequence>
</BehaviorTree>
```

### Example Errors

```
Error: Parameter 'usrname' used but not declared
  BehaviorTree: LoginFlow
  Declared params: username, password
  File: tests/auth.sigma, line 15
  Fix: Check spelling or add to params attribute

Error: Missing required parameter 'password' in StepGroup call
  StepGroup ID: LoginFlow
  Required params: username, password
  Provided params: username
  File: tests/main.sigma, line 30

Error: Unexpected parameter 'rememberMe' in StepGroup call
  StepGroup ID: LoginFlow
  Declared params: username, password
  File: tests/main.sigma, line 30
  Fix: Remove parameter or add to BehaviorTree params
```

---

## 5. Configuration Validation (Zod)

### Purpose
Validates `sigma.config.ts` configuration file structure.

### What It Catches
- Invalid configuration structure
- Wrong types for config values
- Missing required fields
- Invalid enum values

### Implementation
- Located in `sigmascript/config/loader.ts`
- Uses Zod for schema validation
- Validates on config load

### Config Schema

```typescript
// Test case
TestCaseSchema = {
  id: string,              // Required
  file: string,            // Required
  description?: string,
  skip?: boolean,
  tags?: string[],
  timeout?: number,
}

// Test plan
TestPlanSchema = {
  name: string,            // Required
  tests: TestCase[],       // Required, min 1
  description?: string,
  parallel?: boolean,
  workers?: number,
}

// Full config
SigmaConfigSchema = {
  project?: {
    baseDir?: string,
    patterns?: string[],
    platform?: 'web' | 'mobile',
    debug?: boolean,
    inspectTree?: boolean,
  },
  browser?: {
    type?: 'chromium' | 'firefox' | 'webkit',
    headless?: boolean,
    slowMo?: number,
    timeout?: number,
    viewport?: { width: number, height: number },
  },
  screenshots?: {
    dir?: string,
    onFailure?: boolean,
    onSuccess?: boolean,
  },
  plans?: TestPlan[],
  defaultPlan?: string,
  timeout?: number,
  failFast?: boolean,
  retries?: number,
}
```

### CLI Validation

```bash
# Validate configuration
sigmascript validate

# Output on success:
# ✅ Configuration is valid
#
# Project: ./tests
# Browser: chromium (headless)
# Plans: 3
#
# Available plans:
#   - smoke (2 tests)
#   - main (1 test) [default]
#   - regression (15 tests)
```

---

## Validation APIs

### Project Loading with Validation

```typescript
import { loadSigmaProject } from '@testsigmainc/bt-xml';

// Full validation (default)
const result = await loadSigmaProject({
  baseDir: './tests',
  platform: 'web',
  validation: {
    enabled: true,
    strict: true,
  },
});

// Disabled validation (not recommended for production)
const result = await loadSigmaProject({
  baseDir: './tests',
  platform: 'web',
  validation: {
    enabled: false,
  },
});
```

### Standalone Attribute Validation

```typescript
import { AttributeValidator } from '@testsigmainc/bt-xml';

const validator = new AttributeValidator({
  platform: 'web',
  strictAttributes: true,
});

// Validate single node
const errors = validator.validateNode(node, 'file.sigma');

// Validate entire tree
const errors = validator.validateTree(rootNode, 'file.sigma');

// Validate parsed sigma file
const errors = validator.validateSigmaFile(root, 'file.sigma');

// Check if node type is valid
const isValid = validator.hasNodeType('Click');  // true
const isValid = validator.hasNodeType('Clck');   // false

// Get valid attributes for a node
const attrs = validator.getValidAttributes('Click');
// ['element', 'button', 'clickCount', 'delay', 'force', ...]
```

### Validation Error Handling

```typescript
import { loadSigmaProject, SigmaValidationError } from '@testsigmainc/bt-xml';

try {
  await loadSigmaProject({ ... });
} catch (error) {
  if (error instanceof SigmaValidationError) {
    console.log('Validation failed:');
    error.errors.forEach(err => {
      console.log(`[${err.severity}] ${err.message}`);
      if (err.filePath) console.log(`  File: ${err.filePath}`);
      if (err.lineNumber) console.log(`  Line: ${err.lineNumber}`);
      if (err.nodePath) console.log(`  Path: ${err.nodePath}`);
    });
  }
}
```

---

## Error Types

### SigmaError Hierarchy

```typescript
SigmaError                    // Base class
├── SigmaParseError           // XML parsing failures
├── SigmaValidationError      // Validation failures (contains errors[])
├── SigmaTreeBuildError       // Tree construction failures
├── SigmaNodeError            // Node-specific runtime errors
└── SigmaVariableError        // Variable substitution errors
```

### ValidationError Structure

```typescript
interface ValidationError {
  message: string;           // Human-readable error message
  lineNumber?: number;       // Line in source file
  columnNumber?: number;     // Column in source file
  nodePath?: string;         // Path like "root > Sequence > Click"
  filePath?: string;         // Source file path
  severity: 'error' | 'warning';
}
```

---

## Best Practices

### 1. Enable Validation in Development
```typescript
// Always validate during development
validation: { enabled: true, strict: true }
```

### 2. Use Strict Mode in CI/CD
```yaml
# In CI pipeline
- run: sigmascript validate
- run: sigmascript test --fail-fast
```

### 3. Review All Errors
Validation reports ALL errors at once. Fix them systematically:
1. Fix structural errors (XSD) first
2. Then attribute errors (Joi)
3. Then reference errors
4. Finally parameter errors

### 4. Use Descriptive BehaviorTree IDs
```xml
<!-- Good: Clear, unique IDs -->
<BehaviorTree ID="UserLogin_ValidCredentials">
<BehaviorTree ID="Checkout_WithCoupon">

<!-- Bad: Generic, collision-prone -->
<BehaviorTree ID="Test1">
<BehaviorTree ID="Flow">
```

### 5. Declare All Parameters
```xml
<!-- Good: Explicitly declare all params -->
<BehaviorTree ID="Login" params="username, password, rememberMe">

<!-- Bad: Use undeclared params -->
<BehaviorTree ID="Login">
  <Fill text="${undeclaredParam}" />  <!-- Error! -->
```

### 6. Check Validation Output in Logs
```
[bt-xml] Loading project from ./tests
[bt-xml] Found 12 .sigma files
[bt-xml] XSD validation passed
[bt-xml] Attribute validation: 0 errors, 2 warnings
[bt-xml] Reference validation passed
[bt-xml] Parameter validation passed
[bt-xml] Project loaded successfully
```

---

## Troubleshooting

### "Unknown element" errors
- Check node name spelling
- Verify node exists for your platform (web vs mobile)
- Check XSD schema for valid node names

### "Unknown attribute" errors
- Check attribute name spelling
- Verify attribute exists for that node type
- Some attributes are platform-specific

### "Missing SubTree" errors
- Verify BehaviorTree ID matches exactly (case-sensitive)
- Ensure file containing the tree is included in patterns
- Check for typos in StepGroup ID attribute

### "Duplicate BehaviorTree ID" errors
- Use unique IDs across all files
- Consider namespacing: `Auth_Login`, `Checkout_Login`

### Validation not running
- Check `validation.enabled` is true (default)
- Ensure files match `patterns` glob
- Check `platform` matches your node types
