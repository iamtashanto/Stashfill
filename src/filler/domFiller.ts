import type { Profile } from '../types/profile';
import type { PaymentCard } from '../types/vault';
import {
  type FieldAttributes,
  matchProfileField,
  matchPaymentField,
  resolveProfileValue,
  type ProfileFieldKey,
} from './matcher';

export type FillableElement =
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;

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
    const labelEl = el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
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

  // 4. Check aria-labelledby
  const ariaLabelledby = el.getAttribute('aria-labelledby');
  if (!labelText && ariaLabelledby && el.ownerDocument) {
    const labelledbyEl = el.ownerDocument.getElementById(ariaLabelledby);
    if (labelledbyEl) {
      labelText = labelledbyEl.textContent || '';
    }
  }

  return {
    type,
    name,
    id,
    autocomplete,
    placeholder,
    ariaLabel,
    labelText: labelText.trim(),
  };
}

/**
 * Traverses DOM tree including Shadow DOM and accessible iframes.
 */
export function collectFillableElements(root: Document | ShadowRoot | Element): FillableElement[] {
  const fillables: FillableElement[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;

      if (isFillable(el)) {
        fillables.push(el as FillableElement);
      }

      // Check Shadow Root
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
          // Cross-origin iframe boundary, ignore
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

  if (el instanceof HTMLInputElement) {
    const excludedTypes = ['hidden', 'submit', 'button', 'reset', 'image', 'file'];
    return !excludedTypes.includes(el.type.toLowerCase());
  }

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    return true;
  }

  if (el instanceof HTMLElement && el.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Sets value on React and Vue controlled inputs by invoking original prototype setter
 * and resetting internal value trackers.
 */
export function setNativeInputValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const isTextarea = el instanceof HTMLTextAreaElement;
  const proto = isTextarea ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');

  if (descriptor && descriptor.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }

  // Bypass React internal value tracker
  const tracker = (el as unknown as { _valueTracker?: { setValue: (v: string) => void } })
    ._valueTracker;
  if (tracker) {
    tracker.setValue(value);
  }
}

/**
 * Fills a single element with a value and dispatches appropriate synthetic events.
 */
export function fillElement(el: FillableElement, value: string): boolean {
  if (!el || value === undefined || value === null) return false;

  el.focus();

  if (el instanceof HTMLInputElement) {
    const type = el.type.toLowerCase();

    if (type === 'checkbox') {
      const shouldCheck =
        value.toLowerCase() === 'true' ||
        value === '1' ||
        value.toLowerCase() === el.value.toLowerCase();
      el.checked = shouldCheck;
      dispatchInputEvents(el);
      return true;
    }

    if (type === 'radio') {
      if (el.value.toLowerCase() === value.toLowerCase()) {
        el.checked = true;
        dispatchInputEvents(el);
        return true;
      }
      return false;
    }

    setNativeInputValue(el, value);
    dispatchInputEvents(el);
    return true;
  }

  if (el instanceof HTMLTextAreaElement) {
    setNativeInputValue(el, value);
    dispatchInputEvents(el);
    return true;
  }

  if (el instanceof HTMLSelectElement) {
    const lowerVal = value.toLowerCase().trim();
    let matchedIndex = -1;

    for (let i = 0; i < el.options.length; i++) {
      const opt = el.options[i];
      if (!opt) continue;
      const optVal = opt.value.toLowerCase().trim();
      const optText = (opt.textContent || '').toLowerCase().trim();

      if (optVal === lowerVal || optText === lowerVal) {
        matchedIndex = i;
        break;
      }
    }

    // Fallback: partial match
    if (matchedIndex === -1 && lowerVal.length > 2) {
      for (let i = 0; i < el.options.length; i++) {
        const opt = el.options[i];
        if (!opt) continue;
        const optText = (opt.textContent || '').toLowerCase().trim();
        if (optText.includes(lowerVal) || lowerVal.includes(optText)) {
          matchedIndex = i;
          break;
        }
      }
    }

    if (matchedIndex >= 0) {
      el.selectedIndex = matchedIndex;
      dispatchInputEvents(el);
      return true;
    }
    return false;
  }

  if (el instanceof HTMLElement && el.isContentEditable) {
    try {
      if (el.ownerDocument.queryCommandSupported?.('insertText')) {
        el.ownerDocument.execCommand('selectAll', false);
        el.ownerDocument.execCommand('insertText', false, value);
      } else {
        el.textContent = value;
      }
    } catch {
      el.textContent = value;
    }
    dispatchInputEvents(el);
    return true;
  }

  return false;
}

function dispatchInputEvents(el: HTMLElement) {
  const events = [
    new Event('input', { bubbles: true, composed: true }),
    new Event('change', { bubbles: true, composed: true }),
  ];
  events.forEach((ev) => el.dispatchEvent(ev));
  el.blur();
}

/**
 * Fills entire detected form on the page using the active Profile.
 * Payment fields are strictly excluded.
 */
export function fillFormWithProfile(
  root: Document | Element,
  profile: Profile,
): { filledCount: number; matchedFields: ProfileFieldKey[] } {
  // If active focused element is inside a form, prioritize that form
  let container: Document | Element = root;
  const activeEl = root.ownerDocument?.activeElement || (root as Document).activeElement;
  if (activeEl && activeEl.closest) {
    const form = activeEl.closest('form');
    if (form) {
      container = form;
    }
  }

  const elements = collectFillableElements(container);
  let filledCount = 0;
  const matchedFields: ProfileFieldKey[] = [];
  const filledFieldsSet = new Set<ProfileFieldKey>();

  for (const el of elements) {
    const attrs = extractFieldAttributes(el);
    const matchedKey = matchProfileField(attrs);

    if (matchedKey) {
      const val = resolveProfileValue(profile, matchedKey);
      if (val) {
        const success = fillElement(el, val);
        if (success) {
          filledCount++;
          matchedFields.push(matchedKey);
          filledFieldsSet.add(matchedKey);
        }
      }
    }
  }

  return { filledCount, matchedFields };
}

/**
 * Fills payment card fields into form.
 * STRICT: Only called when the user explicitly triggers payment card fill and confirms.
 */
export function fillPaymentCard(
  root: Document | Element,
  card: PaymentCard,
): { filledCount: number } {
  const elements = collectFillableElements(root);
  let filledCount = 0;

  for (const el of elements) {
    const attrs = extractFieldAttributes(el);
    const field = matchPaymentField(attrs);

    if (!field) continue;

    let valueToFill = '';
    switch (field) {
      case 'cardNumber':
        valueToFill = card.cardNumber;
        break;
      case 'cardholderName':
        valueToFill = card.cardholderName;
        break;
      case 'cvv':
        valueToFill = card.cvv;
        break;
      case 'expMonth':
        valueToFill = card.expMonth;
        break;
      case 'expYear':
        valueToFill = card.expYear.length === 4 ? card.expYear.slice(-2) : card.expYear;
        break;
      case 'expiry':
        // MM/YY format
        valueToFill = `${card.expMonth}/${card.expYear.slice(-2)}`;
        break;
    }

    if (valueToFill) {
      const success = fillElement(el, valueToFill);
      if (success) {
        filledCount++;
      }
    }
  }

  return { filledCount };
}
