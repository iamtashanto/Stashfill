'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Is Stashfill really 100% offline with zero network requests?',
    answer:
      'Yes. Stashfill does not have a backend server, account database, or telemetry endpoint. Every build is verified by an automated CI script (scripts/check-code-safety.mjs) that fails if fetch, XMLHttpRequest, WebSocket, eval, or dynamic script injection appears anywhere in production source code. All your data stays strictly in your browser local storage.',
  },
  {
    question: 'How is Stashfill different from Google Chrome or Apple Safari built-in autofill?',
    answer:
      'Default browser autofill is rigid: it only recognizes basic address and payment fields, regularly fails to trigger on modern React/Vue inputs, doesn’t support reusable custom snippets (like {{date}} or job cover letters), doesn’t support multiple distinct personal/work profiles, and syncs your personal details to Google or Apple cloud accounts. Stashfill is 100% local, keyboard-navigable in <100ms, supports custom site rules, and works across complex Shadow DOM boundaries.',
  },
  {
    question: 'How does Stashfill differ from FakeFiller?',
    answer:
      'FakeFiller is designed for developers and QA engineers who need dummy, randomized placeholder data (like "Lorem Ipsum" or fake credit card numbers) to test form validations. Stashfill is designed for everyday use with your REAL personal, work, and custom data so you never have to re-type real forms again.',
  },
  {
    question: 'How are payment cards and high-risk sensitive data protected?',
    answer:
      'Sensitive payment cards and vault fields are encrypted using the W3C Web Cryptography API with PBKDF2-SHA256 (600,000 iterations) and AES-GCM 256-bit authenticated encryption. Payment cards are NEVER auto-suggested or passively filled—they are only populated after you explicitly confirm in an active dialog. Furthermore, copying card details automatically triggers a 15-second timer to wipe your clipboard.',
  },
  {
    question: 'Why does Stashfill work on React and Vue forms when other extensions fail?',
    answer:
      'Modern frontend frameworks (React 18/19, Vue 3, Angular) use internal value tracking trackers (such as React’s _valueTracker). When an extension sets input.value directly, React ignores the change and reverts it. Stashfill properly retrieves the native HTMLInputElement value setter from the prototype, invokes it to synchronize the framework’s internal tracker, and dispatches bubbled synthetic input, change, and blur events.',
  },
  {
    question: 'Can I backup, import, and export my data across different computers?',
    answer:
      'Yes! Stashfill provides one-click export to clean JSON (with payment cards stripped for safety), CSV, or a password-protected encrypted .stashfill backup file. In addition, Stashfill automatically maintains rolling local backup snapshots so you can easily restore your profiles if you make a mistake.',
  },
  {
    question: 'Is Stashfill free and open source?',
    answer:
      'Yes, Stashfill is 100% free and open source under the permissive MIT license. You can inspect the entire codebase, audit the cryptographic implementation, and build the extension yourself from GitHub.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            Everything you need to know about Stashfill&apos;s privacy, architecture, and features.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {faq.question}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-500' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
