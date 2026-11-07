# Good First Issues for New Contributors

Welcome! Stashfill is an open-source, offline, privacy-first browser extension built with WXT, Preact, and TypeScript.
If you are looking to make your first contribution, here is a curated list of well-scoped, bite-sized tasks.

---

### 1. Add Synonym Translations for Additional Languages

- **Area**: `src/matcher/synonyms/`
- **Description**: Stashfill ships with English (`en.json`) and Bangla (`bn.json`) synonym dictionaries. Adding a new language (e.g., Spanish, German, French, Hindi, Japanese) is a pure JSON data change mapping form field terms, autocomplete values, and keywords to our canonical keys.
- **Difficulty**: Beginner
- **Skills**: JSON, Language fluency

### 2. Add New Built-In Profile Templates

- **Area**: `src/core/templates/index.ts`
- **Description**: Add useful domain-specific starting templates (e.g., "Freelancer / Invoicing Profile", "Student / Academic Profile", or "Software Developer Profile").
- **Difficulty**: Beginner
- **Skills**: TypeScript, Data Modeling

### 3. Keyboard Shortcut for Switching Profiles in Popup

- **Area**: `entrypoints/popup/App.tsx`
- **Description**: Add number-key shortcuts (`Alt+1` through `Alt+9` or `Ctrl+[` / `Ctrl+]`) in the popup search view to instantly cycle or select active profiles without touching the mouse.
- **Difficulty**: Intermediate
- **Skills**: Preact, Keyboard event handling, Accessibility

### 4. Custom Expiry Date Format Support

- **Area**: `src/core/luhn.ts` & `src/matcher/matcher.ts`
- **Description**: Add support for parsing and formatting payment card expiry fields that use `YYYY-MM` or full written month names in selects.
- **Difficulty**: Intermediate
- **Skills**: TypeScript, RegExp, Unit Testing

### 5. Add Drag-and-Drop Visual Reordering for Custom Fields

- **Area**: `entrypoints/options/App.tsx`
- **Description**: Improve the Options page field list by adding native HTML5 drag-and-drop handles for reordering fields within a profile.
- **Difficulty**: Intermediate
- **Skills**: Preact, CSS, Drag & Drop API, A11y
