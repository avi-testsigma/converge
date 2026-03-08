# Sigma XML Node Reference

Complete attribute reference for all behavior tree nodes.

---

## Control Flow

### Sequence
Execute children in order until one fails.
```xml
<Sequence>
  <!-- children -->
</Sequence>
```

### Selector
Execute children until one succeeds.
```xml
<Selector>
  <!-- children -->
</Selector>
```

### Parallel
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| strategy | "strict" \| "any" | "strict" | strict=all must succeed, any=at least one |

```xml
<Parallel strategy="strict">
  <!-- children -->
</Parallel>
```

### Conditional
```xml
<Conditional>
  <Conditional.If><!-- condition --></Conditional.If>
  <Conditional.Then><!-- actions --></Conditional.Then>
  <Conditional.ElseIf><!-- condition --></Conditional.ElseIf>
  <Conditional.ElseIf.Then><!-- actions --></Conditional.ElseIf.Then>
  <Conditional.Else><!-- actions --></Conditional.Else>
</Conditional>
```

### ForEach
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| collection | string | - | Blackboard key of element collection (DOM elements) |
| collectionProfileId | string | - | Test data profile name (data-driven iteration) |
| item | string | "item" | Variable name for current item |
| index | string | "index" | Variable name for current index |

One of `collection` or `collectionProfileId` is required.

```xml
<!-- Iterate over DOM elements -->
<ForEach collection="items" item="currentItem" index="i">
  <!-- body -->
</ForEach>

<!-- Iterate over test data profile sets -->
<ForEach collectionProfileId="LoginCredentials" item="dataSet" index="i">
  <Fill element="_input" text="${testData['username']}" />
</ForEach>
```

### While
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| max_iterations | number | 100 | Safety limit |

```xml
<While max_iterations="10">
  <While.Condition><!-- condition --></While.Condition>
  <While.Body><!-- body --></While.Body>
</While>
```

### Recovery
```xml
<Recovery>
  <Recovery.Try><!-- main flow --></Recovery.Try>
  <Recovery.Catch><!-- error handling --></Recovery.Catch>
  <Recovery.Finally><!-- cleanup --></Recovery.Finally>
</Recovery>
```

---

## Decorators

### RetryUntilSuccessful
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| num_attempts | number | 3 | Max retry attempts |
| delay_ms | number | 0 | Delay between retries (ms) |

### Timeout
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| msec | number | required | Timeout in milliseconds |

### Delay
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| msec | number | required | Delay in milliseconds |

### Repeat
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| num_cycles | number | required | Number of repetitions |

### Invert
Flips SUCCESS/FAILURE. No attributes.

### ForceSuccess / ForceFailure
Always returns SUCCESS/FAILURE. No attributes.

### RunOnce
Executes child once, caches result. No attributes.

### Precondition
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| condition | string | required | Condition expression |

### SoftAssert
Converts FAILURE to SUCCESS, logs failures. No attributes.

---

## Element Location

### Locate
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| as | string | required | Store result with this name |
| timeout | number | 5000 | Wait timeout (ms) |
| css | string | - | CSS selector |
| xpath | string | - | XPath selector |
| text | string | - | Text content |
| testId | string | - | data-testid attribute |
| role | string | - | ARIA role |
| name | string | - | Accessible name (with role) |
| label | string | - | Label text |
| placeholder | string | - | Placeholder text |
| title | string | - | Title attribute |
| alt | string | - | Alt text |
| exact | boolean | false | Exact text match |

### LocateElement
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| ID | string | required | Element registry ID |
| as | string | required | Store result with this name |

### First / Last
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| elements | string | required | Collection variable |
| as | string | required | Store result |

### Nth
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| elements | string | required | Collection variable |
| index | number | required | Index to get |
| indexBase | 0 \| 1 | 1 | 0-based or 1-based |
| as | string | required | Store result |

### Count
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| elements | string | required | Collection variable |
| outputKey | string | required | Store count |

### Filter
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| elements | string | required | Collection variable |
| as | string | required | Store filtered result |
| hasText | string | - | Filter by text content |
| hasElement | string | - | Filter by child element |
| hasAttribute | string | - | Filter by attribute presence |
| attribute | string | - | Attribute name (with equals) |
| equals | string | - | Attribute value (with attribute) |
| visible | boolean | - | Filter by visibility |

### Exclude
Same as Filter, but excludes matching elements.

### Within
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Parent element variable |

### Frame
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Iframe element variable |

### Shadow
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Shadow host element |

---

## Actions

### Click
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| button | "left" \| "right" \| "middle" | "left" | Mouse button |
| clickCount | number | 1 | Number of clicks |
| delay | number | 0 | Delay between clicks (ms) |
| force | boolean | false | Bypass actionability checks |
| positionX | number | - | X offset from center |
| positionY | number | - | Y offset from center |
| percent | number | - | Click at percentage (0-100) |

### DoubleClick / RightClick
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |

### Fill
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| text | string | required | Text to fill |

### Clear
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |

### Press
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| key | string | required | Key or key combo (e.g., "Enter", "Control+a") |

### Hover
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |

### Focus / Blur
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |

### Check / Uncheck
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Checkbox element |

### SelectRadio
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Radio button element |

### SelectOption
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Select element |
| value | string | - | Option value |
| label | string | - | Option label text |
| index | number | - | Option index |

### DragAndDrop
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| source | string | required | Source element |
| target | string | required | Target element |

### UploadFile
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | File input element |
| path | string | required | File path |

---

## Navigation

### Navigate
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| url | string | required | URL to navigate to |
| wait_until | string | "load" | load, domcontentloaded, networkidle, commit |

### Reload / GoBack / GoForward
No attributes.

### ClosePage
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| pageRef | string | - | Page reference variable |
| index | number | - | Page index |
| (none) | - | - | Closes current page |

### OpenNewTab
No attributes. Opens blank new tab.

### WaitForNewPage
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| as | string | required | Store page reference |
| timeout | number | 30000 | Wait timeout (ms) |

### SwitchToPage
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| pageRef | string | - | Page reference variable |
| index | number | - | Page index |
| urlPattern | string | - | URL glob pattern |
| titlePattern | string | - | Title pattern |

### GetAllPages
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| outputKey | string | required | Store pages array |

### GetPageCount
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| outputKey | string | required | Store count |

---

## Data Extraction

### GetText
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| outputKey | string | required | Store text |
| innerText | boolean | false | Use innerText instead of textContent |

### GetAttribute
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| attribute | string | required | Attribute name |
| outputKey | string | required | Store value |

### GetValue
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Input element |
| outputKey | string | required | Store value |

### GetInnerHTML
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| outputKey | string | required | Store HTML |

### GetTitle
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| outputKey | string | required | Store title |

### GetCurrentURL
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| outputKey | string | required | Store URL |

### GetBoundingBox
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| outputKey | string | required | Store {x, y, width, height} |

### GetCSS
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| property | string | required | CSS property name |
| outputKey | string | required | Store value |

---

## Verification

### ExpectVisible
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| expectedState | boolean | true | true=visible, false=hidden |
| timeout | number | 5000 | Wait timeout (ms) |

### ExpectEnabled
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| expectedState | boolean | true | true=enabled, false=disabled |
| timeout | number | 5000 | Wait timeout (ms) |

### ExpectText
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| expected | string | required | Expected text |
| exact | boolean | false | Exact match vs contains |
| timeout | number | 5000 | Wait timeout (ms) |

### ExpectValue
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Input element |
| expected | string | required | Expected value |
| timeout | number | 5000 | Wait timeout (ms) |

### ExpectTitle
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| expected | string | required | Expected title |
| timeout | number | 5000 | Wait timeout (ms) |

### ExpectURL
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| expected | string | required | Expected URL (supports *, **, ?) |
| timeout | number | 5000 | Wait timeout (ms) |

### ExpectCount
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| elements | string | required | Collection variable |
| expected | number | required | Expected count |
| timeout | number | 5000 | Wait timeout (ms) |

### ExpectAttribute
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| element | string | required | Element variable |
| attribute | string | required | Attribute name |
| expected | string | required | Expected value |
| timeout | number | 5000 | Wait timeout (ms) |

### AssertValue
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| actual | string | required | Actual value (supports ${var}) |
| operator | string | required | equals, notEquals, contains, greaterThan, lessThan, greaterOrEqual, lessOrEqual, matches |
| expected | string | required | Expected value |

---

## Utilities

### Screenshot
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| path | string | - | File path to save |
| outputKey | string | - | Store buffer to variable |
| fullPage | boolean | false | Capture full page |
| element | string | - | Capture specific element |
| type | "png" \| "jpeg" | "png" | Image format |
| quality | number | - | JPEG quality (0-100) |

### HandleDialog
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| action | "accept" \| "dismiss" \| "getMessage" | required | Dialog action |
| promptText | string | - | Text for prompt dialogs |
| timeout | number | 5000 | Wait timeout (ms) |

### ManageCookie
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| action | "get" \| "set" \| "delete" \| "clear" | required | Cookie action |
| name | string | - | Cookie name |
| value | string | - | Cookie value (for set) |
| domain | string | - | Cookie domain |
| path | string | "/" | Cookie path |
| expires | number | - | Expiration timestamp |
| httpOnly | boolean | false | HTTP only flag |
| secure | boolean | false | Secure flag |
| sameSite | "Strict" \| "Lax" \| "None" | - | SameSite policy |

### Scroll
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| position | "top" \| "bottom" | - | Scroll to position |
| element | string | - | Element to scroll into view |
| x | number | - | Scroll to X coordinate |
| y | number | - | Scroll to Y coordinate |
| deltaX | number | - | Scroll by X delta |
| deltaY | number | - | Scroll by Y delta |
| behavior | "auto" \| "smooth" | "auto" | Scroll behavior |

### LogMessage
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| level | "info" \| "warn" \| "error" \| "debug" | "info" | Log level |
| message | string | required | Message (supports ${var}) |

### WaitForURL
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| url | string | required | URL glob pattern (supports *, **, ?) |
| timeout | number | 30000 | Wait timeout (ms) |

**IMPORTANT:** Uses `url` attribute, NOT `expected`. This differs from `ExpectURL` which uses `expected`.

```xml
<WaitForURL url="http://example.com/dashboard/**" timeout="10000" />
```

### WaitForSelector
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| selector | string | required | CSS selector to wait for |
| state | "attached" \| "detached" \| "visible" \| "hidden" | "visible" | Target state |
| timeout | number | 30000 | Wait timeout (ms) |

### Script
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| (child text/CDATA) | string | required | JavaScript code to run in BT runtime |

Runs JavaScript in the **Node.js BT runtime** context. Has access to the blackboard.

```xml
<Script><![CDATA[
  const val = blackboard.get('priceText');
  blackboard.set('priceNum', parseFloat(val.replace('$', '')));
]]></Script>
```

**Important**: Use `<![CDATA[...]]>` to wrap JavaScript. See gotchas #16.

### EvaluateScript
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| script | string | - | JavaScript code (inline attribute) |
| (child text/CDATA) | string | - | JavaScript code (child text alternative) |
| element | string | - | Execute in element context (passed as `arguments[0]`) |
| outputKey | string | - | Store return value on blackboard |
| args | string | - | JSON arguments |

Runs JavaScript **inside the browser** via `page.evaluate()`. Does NOT have blackboard access.

```xml
<EvaluateScript outputKey="scrollHeight"><![CDATA[
  return document.body.scrollHeight;
]]></EvaluateScript>
```

**Important**: `Script` = BT runtime (blackboard access), `EvaluateScript` = browser (DOM access). See gotchas #15.

### AssertValue
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| actual | string | required | Actual value (supports ${var}) |
| operator | string | required | Comparison operator |
| expected | string | required | Expected value |

Operators: `equals`, `notEquals`, `contains`, `greaterThan`, `lessThan`, `greaterOrEqual`, `lessOrEqual`, `matches`

Often used with `Script` for computed assertions:
```xml
<Script><![CDATA[
  blackboard.set('_isValid', someCondition ? 'true' : 'false');
]]></Script>
<AssertValue actual="${_isValid}" operator="equals" expected="true" />
```

### RegexExtract
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| input | string | required | Input string or ${var} |
| pattern | string | required | Regex pattern |
| outputKey | string | required | Store result |
| flags | string | - | Regex flags (g, i, m, etc.) |
| matchIndex | number | 0 | Which match to extract |

### ResumePoint
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| id | string | required | Unique identifier |

---

## Electron

### LaunchElectronApp
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| cwd | string | required | Working directory |
| executablePath | string | required | Path to Electron |
| args | string | "." | Arguments |
| env | string | - | JSON environment variables |
| timeout | number | 30000 | Launch timeout (ms) |
| as | string | - | Store app reference |

### CloseElectronApp
No attributes. Closes the current Electron app.

### SwitchElectronWindow
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| index | number | - | Window index |
| titlePattern | string | - | Window title pattern |
| urlPattern | string | - | Window URL pattern |

### WaitForElectronWindow
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| as | string | required | Store window reference |
| timeout | number | 30000 | Wait timeout (ms) |

### GetAllElectronWindows
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| outputKey | string | required | Store windows array |

### EvaluateInMain
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| script | string | required | JavaScript code |
| outputKey | string | - | Store result |

---

## Metadata

### Step
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| name | string | - | Step name |
| nl_description | string | - | Natural language description |
| generated | boolean | false | Auto-generated flag |
| author | string | - | Author name |
| timestamp | string | - | Creation timestamp |

### StepGroup
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| ID | string | required | BehaviorTree ID to execute |
| (params) | any | - | Parameters defined in BehaviorTree |

### BehaviorTree
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| ID | string | required | Unique identifier |
| params | string | - | Comma-separated parameter names |
