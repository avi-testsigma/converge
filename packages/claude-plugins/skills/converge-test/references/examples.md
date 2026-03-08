# Sigma XML Examples

Real-world test patterns and templates.

---

## Click Actions

### Basic Click

```xml
<BehaviorTree ID="template-click" params="element">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <Click element="_el" />
  </Sequence>
</BehaviorTree>
```

### Click If Visible (Optional Click)

```xml
<BehaviorTree ID="template-click-if-visible" params="element">
  <ForceSuccess>
    <Sequence>
      <LocateElement ID="${element}" as="_el" />
      <ExpectVisible element="_el" expectedState="true" timeout="1000" />
      <Click element="_el" />
    </Sequence>
  </ForceSuccess>
</BehaviorTree>
```

### Click and Switch to New Window

```xml
<BehaviorTree ID="template-click-new-window" params="element">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <Parallel strategy="strict">
      <WaitForNewPage as="_newPage" timeout="10000" />
      <Click element="_el" />
    </Parallel>
    <SwitchToPage pageRef="_newPage" />
  </Sequence>
</BehaviorTree>
```

### Click Table Row by Index

```xml
<BehaviorTree ID="template-click-table-row" params="element, rowIndex">
  <Sequence>
    <LocateElement ID="${element}" as="_table" />
    <Within element="_table">
      <Locate role="row" as="_rows" />
      <Nth elements="_rows" index="${rowIndex}" indexBase="1" as="_row" />
      <Click element="_row" />
    </Within>
  </Sequence>
</BehaviorTree>
```

### Click and Handle Alert

```xml
<BehaviorTree ID="template-click-with-alert" params="element">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <Parallel strategy="strict">
      <HandleDialog action="accept" timeout="5000" />
      <Click element="_el" />
    </Parallel>
  </Sequence>
</BehaviorTree>
```

### Double Click

```xml
<BehaviorTree ID="template-double-click" params="element">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <DoubleClick element="_el" />
  </Sequence>
</BehaviorTree>
```

### Right Click (Context Menu)

```xml
<BehaviorTree ID="template-right-click" params="element">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <RightClick element="_el" />
  </Sequence>
</BehaviorTree>
```

---

## Input Actions

### Enter Text

```xml
<BehaviorTree ID="template-enter-text" params="element, text">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <Fill element="_el" text="${text}" />
  </Sequence>
</BehaviorTree>
```

### Clear and Enter Text

```xml
<BehaviorTree ID="template-clear-and-enter" params="element, text">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <Clear element="_el" />
    <Fill element="_el" text="${text}" />
  </Sequence>
</BehaviorTree>
```

### Enter Text and Press Enter

```xml
<BehaviorTree ID="template-enter-and-submit" params="element, text">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <Fill element="_el" text="${text}" />
    <Press element="_el" key="Enter" />
  </Sequence>
</BehaviorTree>
```

### Select from Dropdown

```xml
<BehaviorTree ID="template-select-by-value" params="element, value">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <SelectOption element="_el" value="${value}" />
  </Sequence>
</BehaviorTree>

<BehaviorTree ID="template-select-by-label" params="element, label">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <SelectOption element="_el" label="${label}" />
  </Sequence>
</BehaviorTree>
```

### Checkbox Operations

```xml
<BehaviorTree ID="template-check" params="element">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <Check element="_el" />
  </Sequence>
</BehaviorTree>

<BehaviorTree ID="template-uncheck" params="element">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <Uncheck element="_el" />
  </Sequence>
</BehaviorTree>
```

---

## Verification Actions

### Verify Element Visible

```xml
<BehaviorTree ID="template-verify-visible" params="element">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <ExpectVisible element="_el" expectedState="true" timeout="5000" />
  </Sequence>
</BehaviorTree>
```

### Verify Element Not Visible

```xml
<BehaviorTree ID="template-verify-not-visible" params="element">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <ExpectVisible element="_el" expectedState="false" timeout="5000" />
  </Sequence>
</BehaviorTree>
```

### Verify Text Contains

```xml
<BehaviorTree ID="template-verify-text" params="element, expectedText">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <ExpectText element="_el" expected="${expectedText}" />
  </Sequence>
</BehaviorTree>
```

### Verify Text Exact Match

```xml
<BehaviorTree ID="template-verify-text-exact" params="element, expectedText">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <ExpectText element="_el" expected="${expectedText}" exact="true" />
  </Sequence>
</BehaviorTree>
```

### Verify Input Value

```xml
<BehaviorTree ID="template-verify-value" params="element, expectedValue">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <ExpectValue element="_el" expected="${expectedValue}" />
  </Sequence>
</BehaviorTree>
```

### Verify Element Count

```xml
<BehaviorTree ID="template-verify-count" params="element, expectedCount">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <ExpectCount elements="_el" expected="${expectedCount}" />
  </Sequence>
</BehaviorTree>
```

### Verify URL

```xml
<BehaviorTree ID="template-verify-url" params="expectedUrl">
  <ExpectURL expected="${expectedUrl}" timeout="10000" />
</BehaviorTree>
```

### Verify Page Title

```xml
<BehaviorTree ID="template-verify-title" params="expectedTitle">
  <ExpectTitle expected="${expectedTitle}" timeout="5000" />
</BehaviorTree>
```

---

## Navigation Actions

### Navigate to URL

```xml
<BehaviorTree ID="template-navigate" params="url">
  <Navigate url="${url}" wait_until="domcontentloaded" />
</BehaviorTree>
```

### Navigate and Wait for Element

```xml
<BehaviorTree ID="template-navigate-wait" params="url, element">
  <Sequence>
    <Navigate url="${url}" />
    <LocateElement ID="${element}" as="_el" />
    <ExpectVisible element="_el" expectedState="true" timeout="10000" />
  </Sequence>
</BehaviorTree>
```

### Go Back/Forward

```xml
<BehaviorTree ID="template-go-back">
  <GoBack />
</BehaviorTree>

<BehaviorTree ID="template-go-forward">
  <GoForward />
</BehaviorTree>
```

### Reload Page

```xml
<BehaviorTree ID="template-reload">
  <Reload />
</BehaviorTree>
```

---

## Data Extraction

### Store Text to Variable

```xml
<BehaviorTree ID="template-get-text" params="element, outputKey">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <GetText element="_el" outputKey="${outputKey}" />
  </Sequence>
</BehaviorTree>
```

### Store Attribute to Variable

```xml
<BehaviorTree ID="template-get-attribute" params="element, attribute, outputKey">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <GetAttribute element="_el" attribute="${attribute}" outputKey="${outputKey}" />
  </Sequence>
</BehaviorTree>
```

### Store Input Value

```xml
<BehaviorTree ID="template-get-value" params="element, outputKey">
  <Sequence>
    <LocateElement ID="${element}" as="_el" />
    <GetValue element="_el" outputKey="${outputKey}" />
  </Sequence>
</BehaviorTree>
```

---

## Complete Test Examples

### Login Flow

```xml
<BehaviorTree ID="LoginTest">
  <Sequence>
    <Navigate url="https://example.com/login" />

    <Locate css="#username" as="usernameField" timeout="5000" />
    <Fill element="usernameField" text="admin@example.com" />

    <Locate css="#password" as="passwordField" />
    <Fill element="passwordField" text="secretPassword123" />

    <Locate css="button[type='submit']" as="loginBtn" />
    <Click element="loginBtn" />

    <ExpectURL expected="**/dashboard" timeout="10000" />
    <Locate css=".user-menu" as="userMenu" />
    <ExpectVisible element="userMenu" expectedState="true" timeout="5000" />
  </Sequence>
</BehaviorTree>
```

### Search and Verify Results

```xml
<BehaviorTree ID="SearchTest">
  <Sequence>
    <Navigate url="https://example.com" />

    <Locate css="input[type='search']" as="searchInput" />
    <Fill element="searchInput" text="test query" />
    <Press element="searchInput" key="Enter" />

    <!-- Wait for results to load -->
    <Locate css=".search-results" as="results" timeout="10000" />
    <ExpectVisible element="results" expectedState="true" />

    <!-- Verify result count -->
    <Locate css=".search-result-item" as="resultItems" />
    <Count elements="resultItems" outputKey="resultCount" />
    <AssertValue actual="${resultCount}" operator="greaterThan" expected="0" />

    <!-- Click first result -->
    <First elements="resultItems" as="firstResult" />
    <Click element="firstResult" />
  </Sequence>
</BehaviorTree>
```

### Form with Validation

```xml
<BehaviorTree ID="FormValidationTest">
  <Sequence>
    <Navigate url="https://example.com/form" />

    <!-- Submit empty form to trigger validation -->
    <Locate css="button[type='submit']" as="submitBtn" />
    <Click element="submitBtn" />

    <!-- Verify validation messages -->
    <Locate css=".error-message" as="errors" />
    <ExpectVisible element="errors" expectedState="true" timeout="3000" />

    <!-- Fill required fields -->
    <Locate css="#name" as="nameInput" />
    <Fill element="nameInput" text="John Doe" />

    <Locate css="#email" as="emailInput" />
    <Fill element="emailInput" text="john@example.com" />

    <!-- Submit again -->
    <Click element="submitBtn" />

    <!-- Verify success -->
    <ExpectVisible element="errors" expectedState="false" timeout="3000" />
    <Locate css=".success-message" as="success" />
    <ExpectText element="success" expected="Form submitted successfully" />
  </Sequence>
</BehaviorTree>
```

### Modal Dialog Interaction

```xml
<BehaviorTree ID="ModalTest">
  <Sequence>
    <Navigate url="https://example.com" />

    <!-- Open modal -->
    <Locate css="button.open-modal" as="openBtn" />
    <Click element="openBtn" />

    <!-- Wait for modal -->
    <Locate css=".modal" as="modal" timeout="5000" />
    <ExpectVisible element="modal" expectedState="true" />

    <!-- Interact within modal -->
    <Within element="modal">
      <Locate css="input[name='field']" as="modalInput" />
      <Fill element="modalInput" text="Modal data" />

      <Locate css="button.save" as="saveBtn" />
      <Click element="saveBtn" />
    </Within>

    <!-- Verify modal closed -->
    <ExpectVisible element="modal" expectedState="false" timeout="5000" />
  </Sequence>
</BehaviorTree>
```

### Pagination Loop

```xml
<BehaviorTree ID="PaginationTest">
  <Sequence>
    <Navigate url="https://example.com/list" />

    <!-- Process all pages -->
    <While max_iterations="10">
      <While.Condition>
        <Sequence>
          <Locate css="button.next-page" as="nextBtn" timeout="1000" />
          <ExpectEnabled element="nextBtn" expectedState="true" timeout="1000" />
        </Sequence>
      </While.Condition>
      <While.Body>
        <Sequence>
          <!-- Process current page -->
          <Locate css=".list-item" as="items" />
          <Count elements="items" outputKey="itemCount" />
          <LogMessage level="info" message="Found ${itemCount} items on page" />

          <!-- Go to next page -->
          <Click element="nextBtn" />
          <ExpectVisible element="spinner" expectedState="false" timeout="10000" />
        </Sequence>
      </While.Body>
    </While>
  </Sequence>
</BehaviorTree>
```

### Drag and Drop

```xml
<BehaviorTree ID="DragDropTest">
  <Sequence>
    <Navigate url="https://example.com/kanban" />

    <Locate css=".card[data-id='123']" as="card" />
    <Locate css=".column[data-status='done']" as="doneColumn" />

    <DragAndDrop source="card" target="doneColumn" />

    <!-- Verify card moved -->
    <Within element="doneColumn">
      <Locate css=".card[data-id='123']" as="movedCard" timeout="3000" />
      <ExpectVisible element="movedCard" expectedState="true" />
    </Within>
  </Sequence>
</BehaviorTree>
```

### File Upload

```xml
<BehaviorTree ID="FileUploadTest">
  <Sequence>
    <Navigate url="https://example.com/upload" />

    <Locate css="input[type='file']" as="fileInput" />
    <UploadFile element="fileInput" path="/path/to/test-file.pdf" />

    <!-- Verify upload -->
    <Locate css=".upload-progress" as="progress" />
    <ExpectVisible element="progress" expectedState="true" timeout="3000" />
    <ExpectVisible element="progress" expectedState="false" timeout="30000" />

    <Locate css=".upload-success" as="success" />
    <ExpectText element="success" expected="File uploaded successfully" />
  </Sequence>
</BehaviorTree>
```

### Iframe Interaction

```xml
<BehaviorTree ID="IframeTest">
  <Sequence>
    <Navigate url="https://example.com/embed" />

    <Locate css="iframe#content" as="iframe" />
    <Frame element="iframe">
      <!-- Actions inside iframe -->
      <Locate css=".iframe-button" as="btn" />
      <Click element="btn" />
      <ExpectText element=".result" expected="Success" />
    </Frame>

    <!-- Back to main frame automatically after Frame block -->
    <Locate css=".main-content" as="main" />
    <ExpectVisible element="main" expectedState="true" />
  </Sequence>
</BehaviorTree>
```

### Table Cell Interaction (Nested Within)

```xml
<BehaviorTree ID="ClickTableCell" params="tableElement, rowIndex, colIndex">
  <Sequence>
    <LocateElement ID="${tableElement}" as="_table" />
    <Within element="_table">
      <Locate role="row" as="_rows" />
      <Nth elements="_rows" index="${rowIndex}" indexBase="1" as="_row" />
      <Within element="_row">
        <Locate role="cell" as="_cells" />
        <Nth elements="_cells" index="${colIndex}" indexBase="1" as="_cell" />
        <Click element="_cell" />
      </Within>
    </Within>
  </Sequence>
</BehaviorTree>
```

### Data-Driven Test with Test Data Profile

```xml
<BehaviorTree ID="DataDrivenLogin">
  <Sequence>
    <Navigate url="https://example.com/login" />
    <ForEach collectionProfileId="LoginCredentials" item="dataSet" index="i">
      <Sequence>
        <Locate css="#username" as="_user" />
        <Clear element="_user" />
        <Fill element="_user" text="${testData['username']}" />
        <Locate css="#password" as="_pass" />
        <Clear element="_pass" />
        <Fill element="_pass" text="${testData['password']}" />
        <Locate role="button" name="Login" as="_btn" />
        <Click element="_btn" />
        <ExpectURL expected="**/dashboard" timeout="10000" />
        <LogMessage level="info" message="Login verified for data set ${i}" />
        <Navigate url="https://example.com/logout" />
      </Sequence>
    </ForEach>
  </Sequence>
</BehaviorTree>
```

### Computed Assertion with Script

```xml
<BehaviorTree ID="VerifyPriceWithTax">
  <Sequence>
    <Navigate url="https://example.com/product/123" />
    <Locate css=".price" as="_price" />
    <GetText element="_price" outputKey="priceText" />
    <Script><![CDATA[
      const price = parseFloat(blackboard.get('priceText').replace('$', ''));
      const withTax = (price * 1.08).toFixed(2);
      blackboard.set('expectedTotal', withTax);
    ]]></Script>
    <Locate css=".total" as="_total" />
    <ExpectText element="_total" expected="$${expectedTotal}" />
  </Sequence>
</BehaviorTree>
```

### Optional Step with ForceSuccess

```xml
<BehaviorTree ID="TestWithOptionalBanner">
  <Sequence>
    <Navigate url="https://example.com" />
    <!-- Dismiss cookie banner if present (don't fail if not) -->
    <ForceSuccess>
      <Sequence>
        <Locate text="Accept Cookies" as="_cookieBtn" timeout="2000" />
        <Click element="_cookieBtn" />
      </Sequence>
    </ForceSuccess>
    <!-- Continue with main test -->
    <Locate css=".main-content" as="_main" />
    <ExpectVisible element="_main" expectedState="true" />
  </Sequence>
</BehaviorTree>
```

### Electron App Test

```xml
<BehaviorTree ID="ElectronAppTest">
  <Sequence>
    <!-- Launch app -->
    <LaunchElectronApp
      cwd="/path/to/app"
      executablePath="/path/to/electron"
      args="."
      timeout="30000" />

    <WaitForLoadState state="domcontentloaded" timeout="10000" />

    <!-- Interact with app -->
    <Locate text="Get Started" as="startBtn" timeout="5000" />
    <Click element="startBtn" />

    <!-- Wait for new window if needed -->
    <WaitForElectronWindow as="newWindow" timeout="10000" />
    <SwitchElectronWindow index="1" />

    <!-- Continue in new window -->
    <Locate css=".editor" as="editor" timeout="5000" />
    <ExpectVisible element="editor" expectedState="true" />

    <!-- Cleanup -->
    <CloseElectronApp />
  </Sequence>
</BehaviorTree>
```
