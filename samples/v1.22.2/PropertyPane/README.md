# PropertyPane Sample Harness

## Summary

This sample project is the primary property-pane parity harness for SPFx Local Workbench.

Its purpose is not just to demonstrate controls. It is meant to give us a small set of focused web parts that:

- establish the expected behavior in the SharePoint online workbench first
- make regressions easy to spot in the local workbench
- separate scenarios enough that failures are debuggable

The harness currently contains:

- `StandardControls`
- `StandardControlVariations`
- `PnpControls`
- `AdvancedBehavior`
- `PageAndAccordion`
- `ValidationAndFocus`
- `DynamicData`

`StandardControls` and `PnpControls` are baseline coverage. `StandardControlVariations` isolates built-in field variants, and the remaining web parts are scenario-focused parity surfaces.

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.22.2-green.svg)

## Prerequisites

- Node.js version compatible with SPFx 1.22.2 for this sample
- A Microsoft 365 tenant for validating behavior in the online workbench
- Heft available locally

## Running The Sample

From this folder:

```bash
npm install
heft start --clean
```

Then:

1. Open the hosted local workbench for local testing.
2. Open the online workbench in SharePoint for baseline verification.

## Why These Samples Exist

The goal is to validate the samples themselves against the online workbench first. Once we trust the samples, we use the same interactions to validate the local workbench host implementation.

That means each sample should answer:

- what host capability it is exercising
- which property proves that capability
- what visible result should change when the property works correctly

## Recommended Verification Order

Run the samples in this order when validating the online workbench:

1. `StandardControls`
2. `StandardControlVariations`
3. `AdvancedBehavior`
4. `PageAndAccordion`
5. `ValidationAndFocus`
6. `DynamicData`
7. `PnpControls`

Why this order:

- `StandardControls` confirms the basic built-in field path is healthy.
- `StandardControlVariations` confirms built-in field variants such as placeholders, fallback values, disabled/read-only states, and multiline behavior.
- `AdvancedBehavior` confirms non-reactive apply, button semantics, and custom fields before moving into more layered scenarios.
- `PageAndAccordion` confirms page/group host behavior.
- `ValidationAndFocus` confirms focus, validation timing, and direct error-message details.
- `DynamicData` confirms the most host-sensitive scenario last.
- `PnpControls` is best used as a broad regression surface after native SPFx behaviors look correct.

## Sample Details

### StandardControls

Purpose:

- baseline built-in SPFx property pane controls
- simple reactive updates
- stable first-pass smoke test

What it demonstrates:

- `textField`
  Verifies a normal text field updates the rendered web part value.
- `toggle`
  Verifies toggle checked state and displayed text update correctly.
- `checkbox`
  Verifies checkbox boolean updates.
- `dropdown`
  Verifies single-select dropdown choice updates.
- `choiceGroup`
  Verifies single-select radio-style option updates.
- `slider`
  Verifies numeric updates through slider interaction.
- `label`
  Verifies read-only informational field rendering.
- `horizontalRule`
  Verifies separator rendering.
- `link`
  Verifies display-only link rendering.
- `button`
  Verifies button rendering and click handling in the native host.

How to verify:

1. Add the web part.
2. Open the property pane.
3. Change each interactive control once.
4. Confirm the rendered summary table updates immediately for the stored properties.
5. Confirm display-only fields render without breaking layout.

Expected result:

- Changes apply reactively.
- No pane crash, render error, or serialization warning occurs.

### StandardControlVariations

Purpose:

- built-in control variations for standard property-pane fields
- text-field behavior and styling variants
- toggle behavior and accessibility variants
- checkbox, choice-group, dropdown, slider, button, label, and link variants
- a dedicated home for future built-in control-variation coverage beyond the baseline sample

What it demonstrates:

- `ariaPlaceholderText`
  Verifies `placeholder` rendering and an explicit `ariaLabel` on a text field.
- `fallbackValueText`
  Verifies `value` is used as a fallback display only while the bound property is unset.
- `readOnlyValue`
  Verifies `readOnly` independently from stylistic variants.
- `underlinedValue`
  Verifies `underlined` as a separate stylistic variant.
- `disabledValue`
  Verifies `disabled`.
- `limitedLengthValue`
  Verifies `maxLength` with a clearly visible 10-character limit.
- `multilineStaticValue`
  Verifies multiline rendering without resize behavior.
- `multilineResizableValue`
  Verifies multiline, rows, resize behavior, and `maxLength`.
- `toggleTextValue`
  Verifies toggle state with explicit `onText` and `offText`.
- `toggleInlineLabelValue`
  Verifies `inlineLabel` positioning behavior without on/off text.
- `toggleInlineLabelTextValue`
  Verifies `inlineLabel` positioning behavior with on/off text present.
- `toggleAriaLabelOnlyValue`
  Verifies toggle accessibility labeling through `ariaLabel` alone.
- `toggleStateAriaLabelValue`
  Verifies state-specific accessibility labeling through `onAriaLabel` and `offAriaLabel`.
- `toggleDisabledValue`
  Verifies a disabled toggle remains non-interactive.
- `checkboxValue`
  Verifies a standard checkbox binding.
- `checkboxAriaLabelValue`
  Verifies checkbox accessibility labeling through `ariaLabel`.
- `checkboxDisabledValue`
  Verifies a disabled checkbox remains non-interactive.
- `choiceGroupValue`
  Verifies a standard choice group with option-level aria labels.
- `choiceGroupIconValue`
  Verifies choice-group options rendered with icons.
- `choiceGroupImageValue`
  Verifies choice-group options rendered with `imageSrc`, `imageAlt`, and `selectedImageSrc`.
- `choiceGroupDisabledOptionValue`
  Verifies a choice group containing a disabled option.
- `dropdownValue`
  Verifies a standard dropdown binding.
- `dropdownAriaValue`
  Verifies dropdown accessibility labeling through `ariaLabel` and `ariaDescription`.
- `dropdownGroupedValue`
  Verifies dropdown headers/dividers and explicit option indexes.
- `dropdownAnimalValue`
  Verifies `calloutProps.calloutMaxHeight` with a longer dropdown list that should scroll within a constrained callout.
- `dropdownDisabledValue`
  Verifies a disabled dropdown remains non-interactive.
- `sliderValue`
  Verifies a standard slider with visible numeric value and a disabled slider variant for the same bound property.
- `sliderHiddenValue`
  Verifies `showValue: false` on a slider while still updating the bound value.
- `buttonValue`
  Verifies `PropertyPaneButton` bound-value mutation and reset behavior across `Normal`, `Primary`, `Hero`, `Compound`, `Command`, and `Icon` button types, including disabled variants.
- label variations
  Verify `PropertyPaneLabel` as display-only instructional text in the pane.
- link variations
  Verify `PropertyPaneLink` for enabled links, popup-window links, and disabled link rendering.

How to verify:

1. Add the web part.
2. Open the property pane.
3. In `Placeholder And Aria Label`, confirm the placeholder text is visible before typing.
4. Type into `Placeholder And Aria Label` and confirm the placeholder disappears and the rendered summary updates `ariaPlaceholderText`.
5. In `Value Fallback`, confirm the field initially shows the fallback text while the rendered summary shows `fallbackValueText = (unset)`.
6. Type a custom value into `Value Fallback` and confirm the rendered summary changes from `(unset)` to the entered value.
7. Confirm `Read-Only` cannot be edited.
8. Confirm `Underlined` is editable and visually distinct from `Read-Only`.
9. Confirm `Disabled` is not interactive.
10. Type more than 10 characters into `Max Length (10)` and confirm the value stops at 10 characters.
11. Confirm `Multiline` supports multiple lines without resize affordances.
12. Confirm `Multiline Resizable` allows multiline editing and shows resize behavior.
13. In `Toggle With On/Off Text`, switch the toggle and confirm both the UI state and rendered summary update.
14. In `Inline Label Toggle`, confirm the label is positioned inline without on/off text and the rendered summary updates when toggled.
15. In `Inline Label Toggle With Text`, confirm the label remains inline and on/off text is also shown.
16. In `Aria Label Only Toggle`, toggle it once and use it as the `ariaLabel`-only accessibility surface.
17. In `State Aria Label Toggle`, toggle it once and use it as the `onAriaLabel`/`offAriaLabel` accessibility surface.
18. Confirm `Disabled Toggle` is not interactive.
19. In `Standard Checkbox`, toggle it and confirm the rendered summary updates.
20. In `Checkbox With Aria Label`, toggle it and use it as the checkbox accessibility surface.
21. Confirm `Disabled Checkbox` is not interactive.
22. In `Standard Choice Group`, switch selections and confirm the rendered summary updates.
23. In `Choice Group With Icons`, confirm the icon options render and selection changes update the rendered summary.
24. In `Choice Group With Images`, confirm each choice uses an image, selected choices swap to their `selectedImageSrc`, and the rendered summary updates.
25. In `Choice Group With Disabled Option`, confirm the disabled option cannot be selected.
26. In `Standard Dropdown`, choose a different option and confirm the rendered summary updates.
27. In `Dropdown With Aria Labels`, change the selection and use it as the dropdown accessibility surface.
28. In `Dropdown With Option Types`, confirm headers/dividers render correctly and a selectable option updates the rendered summary.
29. In `Dropdown With Callout Max Height`, open the menu, confirm all 10 animal options are available, and confirm the callout stays height-constrained and scrollable.
30. Confirm `Disabled Dropdown` is not interactive.
31. In `Standard Slider`, move the slider and confirm the rendered summary updates `sliderValue`.
32. In `Slider Without Value Display`, move the slider and confirm the rendered summary updates `sliderHiddenValue` even though no inline numeric value is shown.
33. Confirm `Disabled Slider` is not interactive.
34. In `Append "!" To Button Value`, click the button and confirm the rendered summary appends exclamation points to `buttonValue`.
35. Confirm `Disabled Normal Button` is not interactive.
36. In `Reset Button Value`, click the button and confirm the rendered summary resets `buttonValue` to `Ready`.
37. Confirm `Disabled Primary Button` is not interactive.
38. In `Hero Button`, click the button and confirm the rendered summary updates `buttonValue` to `Hero`.
39. Confirm `Disabled Hero Button` is not interactive.
40. In `Compound Button`, confirm the description text renders, click it, and confirm the rendered summary updates `buttonValue` to `Compound`.
41. Confirm `Disabled Compound Button` is not interactive.
42. In `Command Button`, confirm the command-style button renders with an icon, click it, and confirm the rendered summary updates `buttonValue` to `Command`.
43. Confirm `Disabled Command Button` is not interactive.
44. In `Icon Button`, confirm the icon-style button renders, click it, and confirm the rendered summary updates `buttonValue` to `Icon`.
45. Confirm `Disabled Icon Button` is not interactive.
46. In `Label Variations`, confirm both labels render as display-only guidance text with no input control.
47. In `Link Variations`, confirm the documentation link renders as an actionable link.
48. In `Open SPFx docs in popup window`, confirm the link opens a relatively small popup window near the bottom-left of the screen.
49. Confirm the disabled link is not interactive.

Expected result:

- Placeholder and aria-label configuration render correctly on the text field sample.
- `value` behaves like an initial fallback for unset properties rather than a permanently controlled text-field value.
- `maxLength` is enforced clearly on the dedicated limited-length field.
- Read-only, underlined, and disabled states are clearly distinct.
- Static and resizable multiline variants behave differently in the expected way.
- Toggle text, inline-label, accessibility-label, state-aria-label, and disabled-state variations all render and behave as expected.
- Checkbox, choice-group, dropdown, slider, button, label, and link variations render correctly and respect disabled/accessibility-related configuration, including image-based choice-group options and button bound-value mutation across all supported button types.

### AdvancedBehavior

Purpose:

- non-reactive property pane behavior
- button bound-value mutation
- native custom field lifecycle and `changeCallback`
- non-reactive custom-field validity affecting `Apply`

What it demonstrates:

- `bufferedText`
  Verifies non-reactive buffering. The web part should not update until `Apply` is clicked.
- `buttonValue`
  Verifies `PropertyPaneButton` receives the current bound value and can return a new one.
- `customFieldLabel`
  Purely descriptive. Helps visually anchor the custom field test area.
- custom validation field input
  Verifies `PropertyPaneCustomField` `onRender`, `onDispose`, and `changeCallback` in non-reactive mode.
- `customValue`
  Stores the entered custom field text.
- `customFieldStatus`
  Stores validity state derived by the custom field after apply.

How to verify:

1. Add the web part.
2. Open the property pane.
3. Change `Buffered Text`.
4. Confirm the rendered web part does not update yet.
5. Click `Apply`.
6. Confirm `bufferedText` updates in the rendered summary.
7. Click `Append "!" to Button Value` multiple times.
8. Click `Apply` if needed.
9. Confirm `buttonValue` reflects each appended `!`.
10. Type fewer than 3 characters in the custom field.
11. Confirm the inline custom status shows invalid guidance.
12. Confirm `Apply` cannot be used while the field is invalid.
13. Type 3 or more characters.
14. Confirm the status becomes valid and `Apply` becomes usable again.
15. Click `Apply`.
16. Confirm both `customValue` and `customFieldStatus` are reflected in the rendered summary.

Expected result:

- Non-reactive fields wait for `Apply`.
- The button mutates the bound value rather than acting like a no-op.
- The custom field updates the expected properties without crashing the pane.
- Invalid custom-field state prevents apply until the field becomes valid.

### PageAndAccordion

Purpose:

- multi-page property panes
- `displayGroupsAsAccordion`
- `isCollapsed`

What it demonstrates:

- `accordionName`
  Verifies a field in a default-expanded accordion group.
- `collapsedNotes`
  Verifies a field in a default-collapsed accordion group.
- `pageTwoAudience`
  Verifies a standard dropdown on the second property-pane page.
- `pageTwoHighlight`
  Verifies a standard toggle on the second property-pane page.
- `pageTwoNotes`
  Verifies multiline persisted content on the second property-pane page.
- `pageThreeSummary`
  Verifies a third-page text field state.
- `pageThreeStatus`
  Verifies a third page can carry its own dropdown state.
- required label sample
  Verifies the `required` asterisk on `PropertyPaneLabel`.
- `pageThreeHiddenNameValue`
  Verifies a group with `isGroupNameHidden` set to `true`.

How to verify:

1. Add the web part.
2. Open the property pane.
3. Confirm Page 1 opens with one group expanded and one collapsed.
4. Expand and collapse both groups manually.
5. Edit `Accordion Name`.
6. Expand the collapsed group and edit `Collapsed Notes`.
7. Switch to Page 2.
8. Confirm `Audience` and `Notes` render as standard non-accordion groups.
9. Change `Target Audience`, toggle `Highlight this section`, and edit `Page Two Notes`.
10. Switch to Page 3.
11. Confirm the `Required label sample` row shows the required asterisk.
12. Confirm the hidden-name group renders its field without displaying the group header text.
13. Edit `Page Three Summary`, `Release Status`, and `Hidden Group Name Value`.
14. Confirm the rendered summary reflects the values from all three pages.

Expected result:

- Page switching works.
- Accordion groups respect initial collapsed state and interactive expand/collapse.
- The second and third pages retain their own persisted values.
- Required-field label rendering shows the expected asterisk.
- Hidden group names suppress the group header while still rendering the field content.
- No conditional-group or dynamic-connection affordances appear in this sample.

### ValidationAndFocus

Purpose:

- `shouldFocus`
- text validation callbacks
- validation timing options
- reactive custom-field `changeCallback` behavior

What it demonstrates:

- `defaultFocusCandidate`
  Preserved as part of a disabled `shouldFocus` repro for a known focus-stealing bug.
- `focusTarget`
  Preserved as part of a disabled `shouldFocus` repro for a known focus-stealing bug.
- `deferredValidatedText`
  Verifies deferred validation timing without the broken focus-in/out flags.
- `immediateValidatedText`
  Verifies immediate validation while typing without the broken focus-in/out flags.
- `directErrorValidatedText`
  Verifies direct `errorMessage` rendering without blocking value updates.
- `customValidationValue`
  Verifies a custom field updates its bound property immediately in reactive mode.
- `customValidationStatus`
  Verifies a custom field can update a second related property through `changeCallback`.

How to verify:

1. Add the web part.
2. Open the property pane.
3. Confirm the active sample currently starts with the `Validation` group because the `shouldFocus` repro is intentionally commented out pending a bug report.
4. Type a value containing spaces into `Immediate Validation`.
5. Confirm the validation error appears immediately while typing.
6. Remove spaces and confirm the error clears immediately.
7. Click into `Deferred Validation` with fewer than 5 characters entered.
8. Confirm the error appears only after the deferred validation interval.
9. Enter 5 or more characters and confirm the error clears.
10. Type an exclamation point into `Direct Validation`.
11. Confirm the direct error message appears while the value still updates.
12. Remove the exclamation point and confirm the direct error clears.
13. Type fewer than 3 characters in the custom validation field.
14. Confirm the inline custom status shows invalid guidance and the rendered summary updates immediately.
15. Type 3 or more characters.
16. Confirm both `customValidationValue` and `customValidationStatus` update immediately in the rendered summary.

Expected result:

- The commented-out `shouldFocus` repro remains available for bug reporting, but is not part of the active verification path.
- Validation timing matches the configured immediate and deferred behaviors.
- Direct `errorMessage` rendering works without blocking property updates.
- The shared custom validation field demonstrates immediate reactive `changeCallback` updates.

### DynamicData

Purpose:

- `PropertyPaneDynamicField`
- `PropertyPaneDynamicFieldSet`
- `PropertyPaneConditionalGroup`
- dynamic property serialization
- dynamic source registration and updates

What it demonstrates:

- `sourceText`
  The text value exposed by this web part as a dynamic data source property.
- `sourceCount`
  The numeric value exposed by this web part as a dynamic data source property.
- `dynamicText`
  Verifies a single `PropertyPaneDynamicField` connection.
- `dynamicCount`
  Verifies one member of a `PropertyPaneDynamicFieldSet`.
- `dynamicSummary`
  Verifies another member of a `PropertyPaneDynamicFieldSet`.
- shared source configuration
  Verifies the field set can share source selection across grouped entries.
- `showConnectedConfiguration`
  Verifies the persisted initial state for the conditional group on reopen.
- `manualConnectionLabel`
  Verifies the primary conditional group used before switching to the connected configuration.
- `connectedSourceNote`
  Verifies the secondary conditional group content used after switching to the connected configuration.
- `connectedDisplayMode`
  Verifies additional persisted fields inside the secondary conditional group.
- `lastConditionalAction`
  Verifies `onShowPrimaryGroup` and `onShowSecondaryGroup` fire when the built-in connector switches the active group.

How to verify:

1. Add the web part.
2. Open the property pane.
3. Confirm the `Source` group renders `Source Text` and `Source Count`.
4. Confirm the `Connections` group renders one standalone dynamic field plus one dynamic field set.
5. Before connecting anything, confirm the web part renders `"(not connected)"` for dynamic consumer values.
6. Connect `Dynamic Text` to one available source/property combination.
7. Confirm the web part continues rendering and the `dynamicText` summary updates.
8. Change the selected property in the same field and confirm object-valued and primitive-valued selections both render safely.
9. Configure the `Dynamic Field Set`.
10. Confirm shared source selection behaves as expected and each member can pick its property.
11. Update `Source Text` and `Source Count`.
12. Confirm connected values refresh in the rendered summary.
13. Switch to Page 2.
14. Confirm the primary conditional group is visible with the built-in connector (`...`) above it.
15. Edit `Manual Connection Label`.
16. Click the connector and choose `Connect to source`.
17. Confirm the secondary conditional group appears and the rendered summary shows `lastConditionalAction = onShowSecondaryGroup`.
18. Edit `Connected Source Note` and `Connected Display Mode`.
19. Click `Remove connection`.
20. Confirm the primary group returns and the rendered summary shows `lastConditionalAction = onShowPrimaryGroup`.
21. Close and reopen the property pane.
22. Confirm the initial conditional-group state now matches the persisted `showConnectedConfiguration` value.
23. Confirm no serialization errors repeat in the console while editing.

Expected result:

- The web part can act as both source and consumer.
- Unconnected dynamic properties do not crash render.
- Connected values update when source values change.
- Dynamic field set configuration does not fall back to placeholder behavior.
- Conditional-group behavior is exercised on the sample where its connection-oriented UX actually makes sense.

### PnpControls

Purpose:

- broad regression coverage for PnP property controls
- confirmation that native property-pane host changes do not break PnP integration

What it demonstrates:

- a wide mix of PnP property controls across text, numbers, collections, pickers, taxonomy, and site-related selectors

How to verify:

1. Add the web part.
2. Open the property pane.
3. Move through both pages.
4. Interact with a representative selection of controls from each section.
5. Confirm the rendered summary updates and the pane remains stable.

Expected result:

- The web part opens and remains interactive.
- Host changes for native SPFx fields do not regress PnP control rendering paths.

## Online Workbench Sign-Off Checklist

Use this checklist once the samples are loaded in the online workbench:

- `StandardControls` opens and reactively updates.
- `StandardControlVariations` verifies built-in field variants such as placeholder, value fallback, disabled/read-only, and multiline behavior.
- `AdvancedBehavior` verifies non-reactive `Apply`, button mutation, and custom field apply gating.
- `PageAndAccordion` verifies page navigation, accordion state, and multi-page value persistence.
- `ValidationAndFocus` verifies focus, validation timing, direct errors, and reactive custom-field updates.
- `DynamicData` verifies dynamic source/consumer behavior and avoids render/serialization failures.
- `PnpControls` still behaves as a broad regression surface.

When all seven behave correctly in the online workbench, the sample harness can be treated as the expected baseline for local workbench parity validation.

## Local Workbench Follow-Up

After online validation is complete, run the same scenarios in the local workbench in the same order. Compare:

- property pane structure
- control availability
- update timing
- focus behavior
- validation behavior
- page/group behavior
- dynamic data behavior
- console/serialization stability

Differences found at that point are local-host parity gaps, not sample-design uncertainty.

## References

- [SharePoint Framework Overview](https://learn.microsoft.com/sharepoint/dev/spfx/sharepoint-framework-overview)
- [SPFx Web Parts](https://learn.microsoft.com/sharepoint/dev/spfx/web-parts/overview-client-side-web-parts)
- [SPFx Property Pane](https://learn.microsoft.com/sharepoint/dev/spfx/web-parts/basics/integrate-with-property-pane)
- [Heft Documentation](https://heft.rushstack.io/)
