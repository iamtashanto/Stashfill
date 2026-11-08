'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How is 100% offline verified and guaranteed?',
    answer:
      'Stashfill operates without backend servers, user accounts, or analytics tracking. Every build is verified by an automated CI script (scripts/check-code-safety.mjs) that immediately halts compilation if fetch, XMLHttpRequest, WebSocket, eval, or dynamic script injection appears anywhere in production source code. All user data stays strictly in local browser storage.',
  },
  {
    question: 'Why does Stashfill work on React and Vue forms when standard autofill fails?',
    answer:
      'Modern frontend frameworks (React 18/19, Vue 3, Angular) use internal value tracking trackers (such as React’s _valueTracker). Direct DOM .value assignments are ignored and reset on re-render. Stashfill retrieves the native HTMLInputElement value setter from the prototype, invokes it to synchronize the framework’s internal tracker, and dispatches bubbled synthetic input, change, and blur events.',
  },
  {
    question: 'How does Stashfill differ from FakeFiller?',
    answer:
      'FakeFiller generates randomized dummy text (e.g. lorem ipsum or pseudo-credit cards) intended for QA staging tests. Stashfill stores and populates your REAL, verified personal, work, and custom identity data for actual web checkouts, job applications, and SaaS onboarding portals.',
  },
  {
    question: 'How are sensitive payment cards protected?',
    answer:
      'Payment cards and high-risk vault fields are encrypted using standard W3C Web Cryptography with PBKDF2-SHA256 (600,000 iterations) and AES-GCM 256-bit authenticated encryption. Card fields are NEVER passively auto-suggested—they are only populated after you explicitly confirm in an active dialog. Copying card details triggers a 15-second automatic clipboard scrubber.',
  },
  {
    question: 'Does Stashfill support nested Shadow DOM and iframes?',
    answer:
      'Yes. The autofill content script features a recursive DOM walker that traverses open shadowRoot instances and same-origin frames, ensuring full compatibility with Salesforce, Google Forms, HubSpot, and custom Web Components.',
  },
  {
    question: 'Can I export, import, or back up my data?',
    answer:
      'Yes. You can export your data to plain JSON (cards stripped for safety), CSV, or a password-protected encrypted .stashfill backup file. Stashfill also maintains rolling local snapshots so you can easily restore previous states.',
  },
  {
    question: 'Is Stashfill completely free and open source?',
    answer:
      'Yes. Stashfill is distributed under the permissive MIT license. You can inspect every line of source code, run tests, and compile the extension locally from GitHub.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-zinc-50/50 dark:bg-[#090a0f] border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Reference &amp; FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
            Technical answers regarding architecture, security, and runtime constraints.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl tech-card overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-bold text-xs sm:text-sm text-zinc-950 dark:text-white font-mono">
                    {faq.question}
                  </span>
                  <div className={`p-1 rounded text-zinc-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-zinc-900 dark:text-white' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-0 text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-3 font-sans">
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
