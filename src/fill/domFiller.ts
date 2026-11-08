import type { Profile as LegacyProfile } from '../types/profile';
import type { Profile as VaultProfile, Card, SiteRule } from '../core/schemas/vault';
import type { PaymentCard } from '../types/vault';
import {
  type FieldAttributes,
  rankFieldCandidates,
  detectCardField,
  resolveProfileValue,
  shouldSkipField,
  computeFieldSignature,
  findSiteRuleMapping,
  type ProfileFieldKey,
} from '../matcher';
import type { CanonicalKey } from '../core/canonical';

export type FillableProfile = VaultProfile | LegacyProfile;
export type FillableCard = PaymentCard | Card;
export type FillMode = 'all' | 'emptyOnly' | 'focusedOnly';

export type FillableElement =
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;

export interface FillOptions {
  mode?: FillMode;
  overwriteNonEmpty?: boolean;
  siteRule?: SiteRule | null;
  highlight?: boolean;
}

export interface CardFillResult {
  filledCount: number;
  blockedReason?: 'insecure_http' | 'unconfirmed' | 'cross_origin_iframe';
  hasCrossOriginPaymentIframe?: boolean;
  fallbackCopyOffered?: boolean;
}

interface UndoEntry {
  element: FillableElement;
  previousValue: string;
  previousChecked?: boolean;
  previousSelectedIndex?: number;
}

let lastFillSnapshot: UndoEntry[] = [];

// Country name <-> ISO code lookup for smart select matching
const COUNTRY_CODES: Record<string, string[]> = {
  us: ['united states', 'united states of america', 'usa', 'u.s.', 'u.s.a.'],
  gb: ['united kingdom', 'uk', 'great britain', 'england'],
  bd: ['bangladesh', 'বাংলাদেশ', 'bgd'],
  in: ['india', 'ind', 'ভারত'],
  ca: ['canada', 'can'],
  au: ['australia', 'aus'],
  de: ['germany', 'deutschland', 'deu'],
  fr: ['france', 'fra'],
  jp: ['japan', 'jpn'],
  sg: ['singapore', 'sgp'],
};

/**
 * Checks whether an element is hidden, invisible, or a honeypot trap.
 */
export function isElementHiddenOrHoneypot(el: Element): boolean {
  if (
    el.hasAttribute('hidden') ||
    el.getAttribute('aria-hidden') === 'true' ||
    el.getAttribute('type')?.toLowerCase() === 'hidden'
  ) {
    return true;
  }

  const htmlEl = el as HTMLElement;
  if (htmlEl.closest) {
    const hiddenAncestor = htmlEl.closest(
      '[hidden], [aria-hidden="true"], [style*="display:none"], [style*="display: none"], [style*="visibility:hidden"], [style*="visibility: hidden"]',
    );
    if (hiddenAncestor) return true;
  }

  if (htmlEl.style) {
    if (
      htmlEl.style.display === 'none' ||
      htmlEl.style.visibility === 'hidden' ||
      htmlEl.style.opacity === '0'
    ) {
      return true;
    }
  }

  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    try {
      const cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') {
        return true;
      }
    } catch {
      // ignore computed style errors in detached nodes
    }
  }

  return false;
}

/**
 * Extracts comprehensive semantic attributes from a DOM element for heuristic matching.
 */
export function extractFieldAttributes(el: Element): FieldAttributes {
  const type = (el.getAttribute('type') || (el as HTMLInputElement).type || '').toLowerCase();
  const name = el.getAttribute('name') || '';
  const id = el.getAttribute('id') || '';
  const autocomplete = el.getAttribute('autocomplete') || '';
  const placeholder = el.getAttribute('placeholder') || '';
  const ariaLabel =
    el.getAttribute('aria-label') ||
    el.getAttribute('aria-placeholder') ||
    el.getAttribute('title') ||
    '';

  let labelText = '';

  // 1. Check native .labels if available on input/textarea/select
  if ('labels' in el && (el as HTMLInputElement).labels) {
    const labels = (el as HTMLInputElement).labels;
    if (labels && labels.length > 0) {
      labelText = Array.from(labels)
        .map((l) => l.textContent || '')
        .join(' ');
    }
  }

  // 2. Check for="id"
  if (!labelText && id && el.ownerDocument) {
    const rootNode = el.getRootNode?.() as Document | ShadowRoot | undefined;
    const labelEl =
      (rootNode && 'querySelector' in rootNode
        ? rootNode.querySelector(`label[for="${CSS.escape(id)}"]`)
        : null) || el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (labelEl) {
      labelText = labelEl.textContent || '';
    }
  }

  // 3. Check enclosing label ancestor
  if (!labelText) {
    const parentLabel = el.closest('label');
    if (parentLabel) {
      labelText = parentLabel.textContent || '';
    }
  }

  // 4. Check aria-labelledby (supports space-separated multiple IDs, e.g. Google Forms)
  const ariaLabelledby = el.getAttribute('aria-labelledby');
  if (!labelText && ariaLabelledby && el.ownerDocument) {
    const ids = ariaLabelledby.split(/\s+/).filter(Boolean);
    const texts: string[] = [];
    for (const refId of ids) {
      const labelledbyEl = el.ownerDocument.getElementById(refId);
      if (labelledbyEl?.textContent) {
        texts.push(labelledbyEl.textContent.trim());
      }
    }
    if (texts.length > 0) {
      labelText = texts.join(' ');
    }
  }

  // 5. Nearby text (e.g. Google Forms heading inside [role="listitem"], fieldset legend, or previousElementSibling)
  let nearbyText = '';
  const listItemContainer = el.closest('[role="listitem"], .Qr7Oae, fieldset, .form-group, .field');
  if (listItemContainer) {
    const heading = listItemContainer.querySelector(
      '[role="heading"], legend, .M7eMe, label, .field-label',
    );
    if (heading && heading !== el && !heading.contains(el)) {
      nearbyText = (heading.textContent || '').trim();
    }
  }
  if (!nearbyText && el.previousElementSibling) {
    nearbyText = (el.previousElementSibling.textContent || '').trim();
  }

  const htmlEl = el as HTMLInputElement;
  const maxLength =
    typeof htmlEl.maxLength === 'number' && htmlEl.maxLength > 0
      ? htmlEl.maxLength
      : Number(el.getAttribute('maxlength')) || undefined;

  const tabIndexAttr = el.getAttribute('tabindex');
  const tabIndex = tabIndexAttr !== null ? Number(tabIndexAttr) : undefined;

  return {
    type,
    name,
    id,
    autocomplete,
    placeholder,
    ariaLabel,
    labelText: labelText.trim(),
    nearbyText,
    disabled: el.hasAttribute('disabled'),
    readOnly: el.hasAttribute('readonly'),
    tabIndex,
    maxLength,
    isHoneypot: isElementHiddenOrHoneypot(el),
  };
}

/**
 * Traverses DOM tree including open Shadow DOM and accessible same-origin iframes.
 */
export function collectFillableElements(root: Document | ShadowRoot | Element): FillableElement[] {
  const fillables: FillableElement[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;

      if (isElementHiddenOrHoneypot(el)) {
        return;
      }

      if (isFillable(el)) {
        fillables.push(el as FillableElement);
      }

      // Check open Shadow Root
      if (el.shadowRoot) {
        walk(el.shadowRoot);
      }

      // Check same-origin iframes
      if (el instanceof HTMLIFrameElement) {
        try {
          if (el.contentDocument) {
            walk(el.contentDocument);
          }
        } catch {
          // Cross-origin iframe boundary, ignore during passive traversal
        }
      }
    }

    for (let child = node.firstChild; child; child = child.nextSibling) {
      walk(child);
    }
  }

  walk(root);
  return fillables;
}

export function isFillable(el: Element): boolean {
  if (el.hasAttribute('disabled') || el.hasAttribute('readonly')) {
    return false;
  }
  if (isElementHiddenOrHoneypot(el)) {
    return false;
  }

  if (el instanceof HTMLInputElement) {
    const excludedTypes = ['hidden', 'submit', 'button', 'reset', 'image', 'file', 'password'];
    return !excludedTypes.includes(el.type.toLowerCase());
  }

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    return true;
  }

  if (
    el instanceof HTMLElement &&
    (el.isContentEditable || el.getAttribute('contenteditable') === 'true')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a fillable element currently has a non-empty user value.
 */
export function isElementNonEmpty(el: FillableElement): boolean {
  if (el instanceof HTMLInputElement) {
    const t = el.type.toLowerCase();
    if (t === 'checkbox' || t === 'radio') return false;
    return el.value.trim().length > 0;
  }
  if (el instanceof HTMLTextAreaElement) {
    return el.value.trim().length > 0;
  }
  if (el instanceof HTMLSelectElement) {
    return false;
  }
  if (
    el instanceof HTMLElement &&
    (el.isContentEditable || el.getAttribute('contenteditable') === 'true')
  ) {
    return (el.textContent || '').trim().length > 0;
  }
  return false;
}

/**
 * Formats a date string into YYYY-MM-DD for HTML5 <input type="date">.
 */
export function normalizeDateValue(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // Match DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const p1 = Number(slashMatch[1]);
    const p2 = Number(slashMatch[2]);
    const year = slashMatch[3]!;
    // If first part > 12, it is DD/MM/YYYY
    const month = p1 > 12 ? p2 : p1;
    const day = p1 > 12 ? p1 : p2;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return trimmed;
}

/**
 * Sets value on React and Vue controlled inputs by invoking original prototype setter
 * from the element's own window realm and resetting internal value trackers.
 */
export function setNativeInputValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const win = (el.ownerDocument?.defaultView || window) as typeof window;
  const isTextarea = el.tagName.toLowerCase() === 'textarea';
  const proto = isTextarea
    ? (win.HTMLTextAreaElement?.prototype ?? HTMLTextAreaElement.prototype)
    : (win.HTMLInputElement?.prototype ?? HTMLInputElement.prototype);
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');

  const previousValue = el.value;
  if (descriptor && descriptor.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }

  // Bypass React 16/17/18 internal _valueTracker (must set previous value so React sees a change!)
  const tracker = (el as unknown as { _valueTracker?: { setValue: (v: string) => void } })
    ._valueTracker;
  if (tracker) {
    tracker.setValue(previousValue || value);
  }
}

/**
 * Applies a brief visual highlight on a filled element so the user sees what changed.
 */
export function highlightFilledElement(el: HTMLElement): void {
  if (!el || !el.style) return;
  const prevOutline = el.style.outline;
  const prevTransition = el.style.transition;
  el.style.transition = 'outline 0.2s ease-in-out';
  el.style.outline = '2px solid #10b981';
  setTimeout(() => {
    try {
      el.style.outline = prevOutline;
      el.style.transition = prevTransition;
    } catch {
      // ignore if element was removed
    }
  }, 900);
}

/**
 * Captures undo state for an element before modifying it.
 */
function captureUndoEntry(el: FillableElement): UndoEntry {
  if (el instanceof HTMLInputElement) {
    return {
      element: el,
      previousValue: el.value,
      previousChecked: el.checked,
    };
  }
  if (el instanceof HTMLTextAreaElement) {
    return {
      element: el,
      previousValue: el.value,
    };
  }
  if (el instanceof HTMLSelectElement) {
    return {
      element: el,
      previousValue: el.value,
      previousSelectedIndex: el.selectedIndex,
    };
  }
  return {
    element: el,
    previousValue: el.textContent || '',
  };
}

/**
 * Undoes the last fill operation and restores previous field values.
 */
export function undoLastFill(): number {
  if (lastFillSnapshot.length === 0) return 0;
  let restored = 0;
  for (const entry of lastFillSnapshot) {
    const el = entry.element;
    if (!el.isConnected) continue;
    if (el instanceof HTMLInputElement) {
      const t = el.type.toLowerCase();
      if (t === 'checkbox' || t === 'radio') {
        el.checked = Boolean(entry.previousChecked);
      } else {
        setNativeInputValue(el, entry.previousValue);
      }
      dispatchInputEvents(el);
      restored++;
    } else if (el instanceof HTMLTextAreaElement) {
      setNativeInputValue(el, entry.previousValue);
      dispatchInputEvents(el);
      restored++;
    } else if (el instanceof HTMLSelectElement) {
      if (typeof entry.previousSelectedIndex === 'number') {
        el.selectedIndex = entry.previousSelectedIndex;
      } else {
        el.value = entry.previousValue;
      }
      dispatchInputEvents(el);
      restored++;
    } else if (
      el instanceof HTMLElement &&
      (el.isContentEditable || el.getAttribute('contenteditable') === 'true')
    ) {
      el.textContent = entry.previousValue;
      dispatchInputEvents(el);
      restored++;
    }
  }
  lastFillSnapshot = [];
  return restored;
}

function matchSelectOptionIndex(el: HTMLSelectElement, value: string): number {
  const lowerVal = value.toLowerCase().trim();
  const numericVal = /^\d+$/.test(lowerVal) ? Number(lowerVal) : null;

  // 1. Exact value or text match (or numeric month match e.g. "09" === "9")
  for (let i = 0; i < el.options.length; i++) {
    const opt = el.options[i];
    if (!opt) continue;
    const optVal = opt.value.toLowerCase().trim();
    const optText = (opt.textContent || '').toLowerCase().trim();

    if (optVal === lowerVal || optText === lowerVal) {
      return i;
    }
    if (numericVal !== null) {
      if (/^\d+$/.test(optVal) && Number(optVal) === numericVal) return i;
      if (lowerVal.length === 2 && optVal === `20${lowerVal}`) return i;
      if (lowerVal.length === 4 && optVal === lowerVal.slice(-2)) return i;
    }
  }

  // 2. Country code <-> Country name matching
  for (const [iso, aliases] of Object.entries(COUNTRY_CODES)) {
    const isTargetCountry = iso === lowerVal || aliases.includes(lowerVal);
    if (isTargetCountry) {
      for (let i = 0; i < el.options.length; i++) {
        const opt = el.options[i];
        if (!opt) continue;
        const optVal = opt.value.toLowerCase().trim();
        const optText = (opt.textContent || '').toLowerCase().trim();
        if (optVal === iso || aliases.includes(optVal) || aliases.includes(optText)) {
          return i;
        }
      }
    }
  }

  // 3. Fuzzy / substring match
  if (lowerVal.length >= 2) {
    for (let i = 0; i < el.options.length; i++) {
      const opt = el.options[i];
      if (!opt) continue;
      const optText = (opt.textContent || '').toLowerCase().trim();
      if (optText && (optText.includes(lowerVal) || lowerVal.includes(optText))) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Fills a single element with a value and dispatches synthetic events so frameworks notice.
 */
export function fillElement(el: FillableElement, value: string, highlight = false): boolean {
  if (!el || value === undefined || value === null) return false;
  if (isElementHiddenOrHoneypot(el)) return false;

  el.focus();

  const tag = el.tagName.toLowerCase();

  if (tag === 'input') {
    const inputEl = el as HTMLInputElement;
    const type = (inputEl.type || 'text').toLowerCase();
    if (type === 'password' || type === 'hidden') return false;

    if (type === 'checkbox') {
      const shouldCheck =
        value.toLowerCase() === 'true' ||
        value === '1' ||
        value.toLowerCase() === inputEl.value.toLowerCase();
      inputEl.checked = shouldCheck;
      dispatchInputEvents(inputEl);
      if (highlight) highlightFilledElement(inputEl);
      return true;
    }

    if (type === 'radio') {
      const radioLabel = (extractFieldAttributes(inputEl).labelText || '').toLowerCase();
      if (
        inputEl.value.toLowerCase() === value.toLowerCase() ||
        (radioLabel && radioLabel === value.toLowerCase())
      ) {
        inputEl.checked = true;
        dispatchInputEvents(inputEl);
        if (highlight) highlightFilledElement(inputEl);
        return true;
      }
      return false;
    }

    const finalVal = type === 'date' ? normalizeDateValue(value) : value;
    setNativeInputValue(inputEl, finalVal);
    dispatchInputEvents(inputEl);
    if (highlight) highlightFilledElement(inputEl);
    return true;
  }

  if (tag === 'textarea') {
    const textareaEl = el as HTMLTextAreaElement;
    setNativeInputValue(textareaEl, value);
    dispatchInputEvents(textareaEl);
    if (highlight) highlightFilledElement(textareaEl);
    return true;
  }

  if (tag === 'select') {
    const selectEl = el as HTMLSelectElement;
    const matchedIndex = matchSelectOptionIndex(selectEl, value);
    if (matchedIndex >= 0) {
      selectEl.selectedIndex = matchedIndex;
      dispatchInputEvents(selectEl);
      if (highlight) highlightFilledElement(selectEl);
      return true;
    }
    return false;
  }

  if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
    try {
      if (el.ownerDocument?.queryCommandSupported?.('insertText')) {
        el.ownerDocument.execCommand('selectAll', false);
        el.ownerDocument.execCommand('insertText', false, value);
      } else {
        el.textContent = value;
      }
    } catch {
      el.textContent = value;
    }
    dispatchInputEvents(el);
    if (highlight) highlightFilledElement(el);
    return true;
  }

  return false;
}

function dispatchInputEvents(el: HTMLElement) {
  const events = [
    new Event('input', { bubbles: true, composed: true }),
    new Event('change', { bubbles: true, composed: true }),
    new Event('blur', { bubbles: true, composed: true }),
  ];
  events.forEach((ev) => el.dispatchEvent(ev));
}

/**
 * Fills detected form fields on the page using the active Profile.
 * Supports modes ('all', 'emptyOnly', 'focusedOnly'), Undo snapshot, and SiteRule fieldMappings priority.
 * Payment fields and password/honeypot fields are strictly excluded.
 */
export function fillFormWithProfile(
  root: Document | Element,
  profile: FillableProfile,
  options: FillOptions = {},
): { filledCount: number; matchedFields: ProfileFieldKey[] } {
  const mode = options.mode ?? 'all';
  const overwriteNonEmpty = options.overwriteNonEmpty ?? mode === 'all';
  const siteRule = options.siteRule ?? null;

  if (siteRule?.autoFillRule === 'never') {
    return { filledCount: 0, matchedFields: [] };
  }

  let elements: FillableElement[] = [];
  if (mode === 'focusedOnly') {
    const activeEl = (root.ownerDocument?.activeElement ||
      (root as Document).activeElement) as FillableElement | null;
    if (activeEl && isFillable(activeEl)) {
      elements = [activeEl];
    }
  } else {
    let container: Document | Element = root;
    const activeEl = root.ownerDocument?.activeElement || (root as Document).activeElement;
    if (activeEl && activeEl.closest) {
      const form = activeEl.closest('form');
      if (form) {
        container = form;
      }
    }
    elements = collectFillableElements(container);
  }

  let filledCount = 0;
  const matchedFields: ProfileFieldKey[] = [];
  const undoEntries: UndoEntry[] = [];

  for (const el of elements) {
    if (mode === 'emptyOnly' || !overwriteNonEmpty) {
      if (isElementNonEmpty(el)) {
        continue;
      }
    }

    const attrs = extractFieldAttributes(el);
    if (shouldSkipField(attrs).skip) {
      continue;
    }

    // 1. Check SiteRule fieldMappings first (SiteRule mappings take priority over heuristic matcher!)
    let resolvedValue = '';
    let matchedKeyForReport: ProfileFieldKey | null = null;

    if (siteRule) {
      const sig = computeFieldSignature(el, attrs);
      const mapping = findSiteRuleMapping(siteRule, sig);
      if (mapping) {
        resolvedValue = resolveProfileValue(profile, mapping.targetKey as CanonicalKey);
        matchedKeyForReport = (mapping.targetKey as ProfileFieldKey) || 'fullName';
      }
    }

    // 2. Automatic heuristic matcher fallback
    if (!resolvedValue) {
      const ranked = rankFieldCandidates(attrs);
      if (!ranked.skipped && ranked.candidates.length > 0) {
        const top = ranked.candidates[0]!;
        if (siteRule?.disabledFields?.includes(top.key)) {
          continue;
        }
        resolvedValue = resolveProfileValue(profile, top.key);
        matchedKeyForReport = top.key as unknown as ProfileFieldKey;
      }
    }

    // 3. Single-input or focused-target fallback:
    // When filling a page or form that has only 1 input (e.g. search bar <input name="q">, query box, or focusedOnly),
    // and no specific canonical key reached >= 0.5 confidence, fall back to the primary profile field (fullName, firstName, or first non-empty field).
    if (!resolvedValue && (elements.length === 1 || mode === 'focusedOnly')) {
      if ('fields' in profile && Array.isArray(profile.fields)) {
        const primaryField =
          profile.fields.find((f) => f.key === 'full_name' && f.value?.trim()) ||
          profile.fields.find((f) => f.key === 'first_name' && f.value?.trim()) ||
          profile.fields.find((f) => !f.sensitive && f.value && f.value.trim().length > 0);
        if (primaryField && primaryField.value) {
          resolvedValue = primaryField.value;
          matchedKeyForReport = (primaryField.key || 'fullName') as unknown as ProfileFieldKey;
        }
      } else if ('fullName' in profile && profile.fullName) {
        resolvedValue = profile.fullName;
        matchedKeyForReport = 'fullName';
      }
    }

    if (resolvedValue) {
      const snapshot = captureUndoEntry(el);
      const success = fillElement(el, resolvedValue, options.highlight ?? true);
      if (success) {
        undoEntries.push(snapshot);
        filledCount++;
        if (matchedKeyForReport) {
          matchedFields.push(matchedKeyForReport);
        }
      }
    }
  }

  if (undoEntries.length > 0) {
    lastFillSnapshot = undoEntries;
  }

  return { filledCount, matchedFields };
}

/**
 * Checks whether a document contains cross-origin payment iframes (e.g. Stripe, Braintree, Adyen).
 */
export function hasCrossOriginPaymentIframe(root: Document | Element): boolean {
  const iframes = Array.from(root.querySelectorAll('iframe'));
  for (const iframe of iframes) {
    const src = (iframe.getAttribute('src') || '').toLowerCase();
    const name = (iframe.getAttribute('name') || '').toLowerCase();
    const title = (iframe.getAttribute('title') || '').toLowerCase();
    const isPaymentProvider = /stripe|braintree|adyen|checkout|card|payment|paypal|square/i.test(
      `${src} ${name} ${title}`,
    );
    let isCrossOrigin = false;
    try {
      // Accessing contentDocument on a cross-origin iframe either throws or returns null when src is external
      if (src.startsWith('http') && !iframe.contentDocument) {
        isCrossOrigin = true;
      }
    } catch {
      isCrossOrigin = true;
    }
    if (isCrossOrigin && isPaymentProvider) {
      return true;
    }
  }
  return false;
}

/**
 * Copies a sensitive card value to clipboard and schedules auto-clear after `clearAfterMs` (default 15 seconds).
 */
export async function copyCardNumberWithAutoClear(
  cardNumber: string,
  clearAfterMs = 15000,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(cardNumber);
    if (clearAfterMs > 0) {
      setTimeout(async () => {
        try {
          // If readText is supported, only clear if clipboard still holds this card number
          if (navigator.clipboard.readText) {
            try {
              const current = await navigator.clipboard.readText();
              if (current !== cardNumber) {
                return; // User has since copied other content; do not clobber
              }
            } catch {
              // Permission to read might not be granted; proceed to overwrite
            }
          }
          await navigator.clipboard.writeText('');
        } catch {
          // ignore if document lost focus
        }
      }, clearAfterMs);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Fills payment card fields into form.
 * PART C CARD FILL RULES:
 * - Only on https pages (block http and insecure protocols; allow localhost for local dev/testing).
 * - Only through an explicit confirmed Fill card action (confirmed !== true strictly blocks).
 * - Handles split 4-box card numbers, MM/YY and MM/YYYY expiry formats, month/year selects, and optional/ephemeral CVV.
 * - Does not force cross-origin payment iframes; reports `hasCrossOriginPaymentIframe` so caller can offer Copy number with auto-clear.
 */
export function fillPaymentCard(
  root: Document | Element,
  card: FillableCard,
  options: {
    protocol?: string;
    confirmed?: boolean;
    ephemeralCvv?: string;
    allowInsecureForTest?: boolean;
  } = {},
): CardFillResult {
  const protocol =
    options.protocol ??
    (typeof window !== 'undefined' && window.location ? window.location.protocol : 'https:');

  // Block insecure HTTP and all non-HTTPS schemes strictly
  if (protocol !== 'https:' && !options.allowInsecureForTest) {
    return {
      filledCount: 0,
      blockedReason: 'insecure_http',
    };
  }

  // Explicit confirmation is strictly mandatory on every card fill
  if (options.confirmed !== true) {
    return {
      filledCount: 0,
      blockedReason: 'unconfirmed',
    };
  }

  const elements = collectFillableElements(root);
  let filledCount = 0;

  const rawNumber =
    'number' in card && typeof card.number === 'string'
      ? card.number
      : 'cardNumber' in card && typeof card.cardNumber === 'string'
        ? card.cardNumber
        : '';
  const digitsOnly = rawNumber.replace(/\D/g, '');

  const cardholderName =
    'cardholder' in card && typeof card.cardholder === 'string'
      ? card.cardholder
      : 'cardholderName' in card && typeof card.cardholderName === 'string'
        ? card.cardholderName
        : '';
  // CVV is never persisted unless enabled; allow ephemeral in-memory CVV at fill time
  const cvv = options.ephemeralCvv?.trim() || card.cvv || '';
  const expMonth = (card.expMonth || '').padStart(2, '0');
  const rawYear = card.expYear || '';
  const expYear2 = rawYear.length === 4 ? rawYear.slice(-2) : rawYear;
  const expYear4 = rawYear.length === 2 ? `20${rawYear}` : rawYear;

  const undoEntries: UndoEntry[] = [];

  for (const el of elements) {
    const attrs = extractFieldAttributes(el);
    const detected = detectCardField(attrs);

    if (!detected) continue;

    let valueToFill = '';
    switch (detected.field) {
      case 'cardNumber':
        valueToFill = digitsOnly;
        break;
      case 'cardNumberSplit1':
        valueToFill = digitsOnly.slice(0, 4);
        break;
      case 'cardNumberSplit2':
        valueToFill = digitsOnly.slice(4, 8);
        break;
      case 'cardNumberSplit3':
        valueToFill = digitsOnly.slice(8, 12);
        break;
      case 'cardNumberSplit4':
        valueToFill = digitsOnly.slice(12, 16);
        break;
      case 'cardholderName':
        valueToFill = cardholderName;
        break;
      case 'cvv':
        // CVV filled ONLY if the user stored it
        valueToFill = cvv;
        break;
      case 'expMonth':
        valueToFill = expMonth;
        break;
      case 'expYear':
        valueToFill =
          el instanceof HTMLSelectElement ? expYear2 : attrs.maxLength === 4 ? expYear4 : expYear2;
        break;
      case 'expiry':
      case 'expiryMMYY':
      case 'expiryMMYYYY': {
        const useFourDigitYear =
          detected.expiryFormat === 'MM/YYYY' || detected.field === 'expiryMMYYYY';
        valueToFill = useFourDigitYear ? `${expMonth}/${expYear4}` : `${expMonth}/${expYear2}`;
        break;
      }
    }

    if (valueToFill) {
      const snapshot = captureUndoEntry(el);
      const success = fillElement(el, valueToFill, true);
      if (success) {
        undoEntries.push(snapshot);
        filledCount++;
      }
    }
  }

  if (undoEntries.length > 0) {
    lastFillSnapshot = undoEntries;
  }

  const crossOriginIframe = hasCrossOriginPaymentIframe(root);
  if (filledCount === 0 && crossOriginIframe) {
    return {
      filledCount: 0,
      blockedReason: 'cross_origin_iframe',
      hasCrossOriginPaymentIframe: true,
      fallbackCopyOffered: true,
    };
  }

  return {
    filledCount,
    hasCrossOriginPaymentIframe: crossOriginIframe,
  };
}
