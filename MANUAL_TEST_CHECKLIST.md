# Stashfill Manual QA & Cross-Browser Test Checklist

This checklist is used for manual release validation across Chrome, Firefox, Edge, and real-world web applications.

---

## 1. Extension Installation & Load Tests

| Browser             | Test Action                                                                          | Expected Result                                                       | Pass/Fail |
| ------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | --------- |
| **Google Chrome**   | Load unpacked from `.output/chrome-mv3` via `chrome://extensions`                    | Loads with zero errors, icon visible in toolbar, popup opens on click | [ ]       |
| **Mozilla Firefox** | Load temporary add-on from `.output/firefox-mv3/manifest.json` via `about:debugging` | Loads with zero manifest errors, gecko ID verified, popup opens       | [ ]       |
| **Microsoft Edge**  | Load unpacked from `.output/edge-mv3` via `edge://extensions`                        | Loads with zero errors, context menu and shortcuts work               | [ ]       |
| **Safari** (macOS)  | Convert with `xcrun safari-web-extension-converter` and run in Xcode                 | Extension loads in Safari Settings > Extensions                       | [ ]       |

---

## 2. Core Functional Tests

### 2.1 First-Run & Onboarding

- [ ] Install on a clean profile.
- [ ] Open Options or click Extension Icon.
- [ ] 3-step Onboarding wizard appears.
- [ ] Selecting "Personal", "Work", or "Developer" template populates default fields.
- [ ] Completing wizard transitions directly into the dashboard.

### 2.2 Popup Interactions

- [ ] Click extension icon or press `Alt+Shift+F` (or configured shortcut).
- [ ] Search input receives immediate autofocus.
- [ ] Type to filter fields (e.g. typing "mail" filters email addresses in < 15ms).
- [ ] Press `Down Arrow` and `Enter` to copy or fill focused field.
- [ ] Press `Esc` to close popup.
- [ ] Click "Fill All Fields" -> matching fields on active tab populate with green highlight.
- [ ] Click "Undo" -> previous values restore without losing form state.

### 2.3 Options Page CRUD & Settings

- [ ] Create a new Profile, add custom text and date fields.
- [ ] Switch active profile from popup header dropdown.
- [ ] Switch language to Bangla (`বাংলা`) -> UI updates instantly without page reload.
- [ ] Switch language back to English -> UI updates instantly.
- [ ] Toggle Theme: Light, Dark, System -> CSS custom variables update immediately.
- [ ] Export Plain JSON -> Downloaded JSON file excludes payment cards and has safety banner.
- [ ] Export Encrypted Backup -> Prompts for master passphrase, downloads `.stashfill` file.
- [ ] Import Backup -> Dry-run modal displays count of new, modified, and conflicting fields.

### 2.4 Vault & Payment Card Security

- [ ] Attempt to save a payment card without setting master passphrase -> App forces passphrase creation.
- [ ] Set master passphrase with strength feedback.
- [ ] Save a test card (e.g. Visa 4532 0151 1283 0366).
- [ ] Verify card number is masked as `VISA •••• 0366` in all UI lists.
- [ ] Click "Reveal" -> Prompts for unlock; reveals number only when unlocked.
- [ ] Copy Card Number -> Copies to clipboard; wait 15 seconds; verify clipboard clears automatically.
- [ ] Lock Vault -> Card details and CVV are inaccessible until unlocked.
- [ ] Inactivity Timeout: Wait configured timeout (e.g. 5 minutes) -> Vault locks automatically.

---

## 3. Real-World Web Form Compatibility Tests

| Site / Form Type              | Target URL / Scenario                   | Test Steps                                | Expected Result                                                                              | Pass/Fail |
| ----------------------------- | --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- | --------- |
| **Google Forms**              | Multi-question Google Form              | Fill All via Popup or `Alt+Shift+F`       | Correctly resolves `aria-labelledby` and role headings, fills inputs                         | [ ]       |
| **GitHub**                    | Settings > Profile                      | Click "Fill Form"                         | Fills Name, Bio (contenteditable), Company, Website                                          | [ ]       |
| **Stripe / Shopify Checkout** | Hosted Checkout page                    | Open card picker in Stashfill             | Detects split card boxes or single card field, requires explicit confirmation before filling | [ ]       |
| **LinkedIn**                  | Contact Info Edit modal                 | Quick fill email and phone                | Triggers React synthetic events; values persist upon clicking Save                           | [ ]       |
| **Government / Portal Forms** | Bangla National Portal / e-Service form | Fill form using Bangla profile            | Bangla synonyms match national ID, father's name, district, division correctly               | [ ]       |
| **Dynamic SPA**               | Vue / Angular form with validation      | Fill all fields                           | `v-model` / reactive state updates and submit button enables                                 | [ ]       |
| **Rich Text Editor**          | Quill / TinyMCE / Contenteditable       | Right-click context menu "Insert Snippet" | Snippet expands `{{date}}` and places cursor correctly                                       | [ ]       |

---

## 4. Accessibility & Contrast Verification

- [ ] Tab navigation through Popup: all buttons, inputs, and toggles reachable via keyboard only.
- [ ] Visible focus rings on all active elements.
- [ ] Screen reader check (VoiceOver on Mac / NVDA on Windows): reads labels, dialog titles, and live status.
- [ ] WCAG AA color contrast check: contrast ratio >= 4.5:1 on both light and dark themes.
