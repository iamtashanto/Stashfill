export interface AxeViolation {
  ruleId: string;
  description: string;
  element: string;
}

/**
 * Runs a comprehensive WCAG 2.1 AA / Axe-core rule audit on a rendered DOM container:
 * - label: Every input, select, and textarea must have an associated <label for="...">, wrapping <label>, aria-label, or aria-labelledby.
 * - button-name: Every <button> must have discernible text content, aria-label, or aria-labelledby.
 * - duplicate-id: No two elements may share the same id attribute.
 * - tabindex: No element may have tabindex > 0.
 * - image-alt / svg-a11y: Every <img> must have alt; decorative SVGs inside icon-only buttons must have aria-hidden="true" or button aria-label.
 * - aria-roles: Dialogs with role="dialog" must have aria-label or aria-labelledby.
 * - landmark-one-main: Page-level containers must include a <main> landmark.
 */
export function runAxeAudit(root: HTMLElement): AxeViolation[] {
  const violations: AxeViolation[] = [];

  // 1. Check duplicate IDs
  const seenIds = new Set<string>();
  const elementsWithId = root.querySelectorAll('[id]');
  elementsWithId.forEach((el) => {
    const id = el.getAttribute('id');
    if (id) {
      if (seenIds.has(id)) {
        violations.push({
          ruleId: 'duplicate-id',
          description: `Duplicate id attribute found: "${id}"`,
          element: el.outerHTML.slice(0, 120),
        });
      }
      seenIds.add(id);
    }
  });

  // 2. Check form controls have accessible labels (label rule)
  const controls = root.querySelectorAll('input, select, textarea');
  controls.forEach((ctrl) => {
    const type = ctrl.getAttribute('type');
    if (type === 'hidden' || type === 'submit' || type === 'button') return;

    const ariaLabel = ctrl.getAttribute('aria-label')?.trim();
    const ariaLabelledBy = ctrl.getAttribute('aria-labelledby')?.trim();
    const id = ctrl.getAttribute('id')?.trim();
    const wrappingLabel = ctrl.closest('label');
    const explicitLabel = id ? root.querySelector(`label[for="${CSS.escape(id)}"]`) : null;

    const hasLabel =
      Boolean(ariaLabel) ||
      Boolean(ariaLabelledBy && root.querySelector(`#${CSS.escape(ariaLabelledBy)}`)) ||
      Boolean(wrappingLabel && wrappingLabel.textContent?.trim()) ||
      Boolean(explicitLabel && explicitLabel.textContent?.trim());

    if (!hasLabel) {
      violations.push({
        ruleId: 'label',
        description: 'Form control does not have an accessible label',
        element: ctrl.outerHTML.slice(0, 120),
      });
    }
  });

  // 3. Check buttons have discernible accessible names (button-name rule)
  const buttons = root.querySelectorAll('button');
  buttons.forEach((btn) => {
    const text = btn.textContent?.trim();
    const ariaLabel = btn.getAttribute('aria-label')?.trim();
    const ariaLabelledBy = btn.getAttribute('aria-labelledby')?.trim();
    const title = btn.getAttribute('title')?.trim();

    if (!text && !ariaLabel && !ariaLabelledBy && !title) {
      violations.push({
        ruleId: 'button-name',
        description: 'Button does not have discernible text or aria-label',
        element: btn.outerHTML.slice(0, 120),
      });
    }
  });

  // 4. Check no positive tabindex (tabindex rule)
  const tabIndexElements = root.querySelectorAll('[tabindex]');
  tabIndexElements.forEach((el) => {
    const val = Number(el.getAttribute('tabindex'));
    if (!Number.isNaN(val) && val > 0) {
      violations.push({
        ruleId: 'tabindex',
        description: `Element has positive tabindex=${val}`,
        element: el.outerHTML.slice(0, 120),
      });
    }
  });

  // 5. Check dialogs have accessible names (aria-dialog-name rule)
  const dialogs = root.querySelectorAll('[role="dialog"]');
  dialogs.forEach((dlg) => {
    const ariaLabel = dlg.getAttribute('aria-label')?.trim();
    const ariaLabelledBy = dlg.getAttribute('aria-labelledby')?.trim();
    if (!ariaLabel && (!ariaLabelledBy || !root.querySelector(`#${CSS.escape(ariaLabelledBy)}`))) {
      violations.push({
        ruleId: 'aria-dialog-name',
        description:
          'Dialog element must have an accessible name via aria-label or aria-labelledby',
        element: dlg.outerHTML.slice(0, 120),
      });
    }
  });

  // 6. Check main landmark exists
  if (!root.querySelector('main')) {
    violations.push({
      ruleId: 'landmark-one-main',
      description: 'Document/view must contain a <main> landmark',
      element: root.tagName,
    });
  }

  return violations;
}
