'use client';

import { useState } from 'react';
import { 
  Cpu, 
  Layers, 
  FileCode2, 
  EyeOff, 
  CheckCircle2, 
  Keyboard
} from 'lucide-react';

interface ArchitectureTopic {
  id: string;
  name: string;
  badge: string;
  description: string;
  codeSnippet: string;
  highlights: string[];
}

const ARCHITECTURE_TOPICS: ArchitectureTopic[] = [
  {
    id: 'react-sync',
    name: 'React 18/19 & Vue v-model Reconciliation',
    badge: 'Core Runtime Engine',
    description:
      'Standard autofill tools fail on modern web apps because React and Vue ignore direct DOM value assignments. Stashfill queries the native HTMLInputElement value setter from the prototype, updates React\'s internal _valueTracker descriptor, and dispatches bubbled synthetic events.',
    codeSnippet: `// Intercept prototype descriptor & synchronize framework state
const setter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype, 
  'value'
)?.set;

// Execute native setter in host element context
setter?.call(element, targetValue);

// Synchronize React internal value tracker to prevent rollback
const tracker = (element as any)._valueTracker;
if (tracker) {
  tracker.setValue(previousValue);
}

// Dispatch synthetic bubbling input and change events
element.dispatchEvent(new Event('input', { bubbles: true }));
element.dispatchEvent(new Event('change', { bubbles: true }));`,
    highlights: [
      'Bypasses React synthetic event state de-synchronization',
      'Fully compatible with Vue v-model and Angular form controls',
      'Zero monkey-patching of page global variables',
    ],
  },
  {
    id: 'crypto-vault',
    name: 'AES-GCM 256-Bit Hardware Encrypted Vault',
    badge: 'W3C SubtleCrypto',
    description:
      'Payment cards and confidential credentials are never stored in plaintext. Keys are derived locally in browser memory via PBKDF2-SHA256 (600,000 iterations). Cards are never passively filled without explicit user consent.',
    codeSnippet: `// Derive 256-bit AES-GCM key from master passphrase
const keyMaterial = await crypto.subtle.importKey(
  'raw', 
  encoder.encode(passphrase), 
  'PBKDF2', 
  false, 
  ['deriveKey']
);

const aesKey = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: cryptoRandomSalt, // 16 bytes
    iterations: 600_000,
    hash: 'SHA-256',
  },
  keyMaterial,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);

// Ephemeral 15-second clipboard scrubbing on sensitive copy
navigator.clipboard.writeText(decryptedCardNumber);
setTimeout(() => navigator.clipboard.writeText(''), 15_000);`,
    highlights: [
      'Derived using 600,000 rounds of PBKDF2-SHA256',
      'Ephemeral one-time CVV — never persisted to disk',
      'Automatic 15-second clipboard wiper on card copy',
    ],
  },
  {
    id: 'shadow-dom',
    name: 'Recursive Shadow DOM & Iframe Traversal',
    badge: 'DOM Penetration',
    description:
      'Enterprise software (Salesforce, Google Forms, HubSpot, Shopify) nests inputs inside open shadow roots and same-origin frames where standard document.querySelectorAll fails.',
    codeSnippet: `// Recursive walker traversing open shadow roots & nested frames
function collectFillableInputs(root: Document | ShadowRoot): HTMLInputElement[] {
  const inputs: HTMLInputElement[] = [];
  const elements = root.querySelectorAll('*');

  for (const el of elements) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      inputs.push(el as any);
    }
    // Penetrate open Shadow DOM boundaries
    if (el.shadowRoot) {
      inputs.push(...collectFillableInputs(el.shadowRoot));
    }
    // Traverse same-origin frames safely
    if (el instanceof HTMLIFrameElement && el.contentDocument) {
      inputs.push(...collectFillableInputs(el.contentDocument));
    }
  }
  return inputs;
}`,
    highlights: [
      'Recursively descends into shadowRoot instances',
      'Supports nested same-origin iframes cleanly',
      'Handles contenteditable, selects, radios, and checkboxes',
    ],
  },
  {
    id: 'snippet-engine',
    name: 'Dynamic Snippet Variables & Universal UTF-8 Engine',
    badge: 'Template Expander',
    description:
      'Expand reusable dynamic templates in any input or rich-text editor using trigger codes (;sig, ;date, ;uuid). Stashfill fully supports Unicode and international alphabets (Latin, Cyrillic, Arabic, Bangla, CJK, Emoji) across all fields and clipboard operations.',
    codeSnippet: `// Dynamic template variable interpolation & cursor positioning
export function expandSnippetVariables(content: string): { text: string; cursorOffset?: number } {
  const now = new Date();
  let expanded = content
    .replace(/\\{\\{date\\}\\}/g, now.toISOString().split('T')[0])
    .replace(/\\{\\{time\\}\\}/g, now.toTimeString().split(' ')[0])
    .replace(/\\{\\{year\\}\\}/g, String(now.getFullYear()))
    .replace(/\\{\\{uuid\\}\\}/g, crypto.randomUUID())
    .replace(/\\{\\{random:(\\d+),(\\d+)\\}\\}/g, (_, min, max) => {
      const low = parseInt(min, 10);
      const high = parseInt(max, 10);
      return String(Math.floor(Math.random() * (high - low + 1)) + low);
    });

  // Calculate dynamic cursor caret anchor
  const cursorIndex = expanded.indexOf('{{cursor}}');
  return {
    text: expanded.replace('{{cursor}}', ''),
    cursorOffset: cursorIndex !== -1 ? cursorIndex : undefined,
  };
}`,
    highlights: [
      'Sub-millisecond token evaluation ({{date}}, {{time}}, {{uuid}}, {{random}})',
      'Universal UTF-8 encoding: complete support for all languages and alphabets',
      'Intelligent cursor caret positioning post-expansion',
    ],
  },
];

export default function BentoFeatures() {
  const [activeTabId, setActiveTabId] = useState<string>('react-sync');

  const activeTopic = ARCHITECTURE_TOPICS.find((t) => t.id === activeTabId)!;

  return (
    <section id="architecture" className="py-24 relative overflow-hidden bg-zinc-50/50 dark:bg-[#090a0f] border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-4 shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
            <span>Systems Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-3">
            Engineered for edge cases others ignore.
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed">
            Most autofill extensions are simple scripts that break on modern Single Page Applications. 
            Stashfill is built like a precision browser engine.
          </p>
        </div>

        {/* Technical Architecture Deep-Dive Tabs */}
        <div className="rounded-xl tech-card shadow-xl overflow-hidden mb-12">
          
          {/* Tab Bar */}
          <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 text-xs font-mono">
            {ARCHITECTURE_TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTabId(topic.id)}
                className={`px-4 py-3 font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                  activeTabId === topic.id
                    ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white bg-white dark:bg-zinc-950'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>{topic.name}</span>
                <span className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {topic.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Content Pane */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-white dark:bg-zinc-950">
            
            {/* Description & Technical Points */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  {activeTopic.badge}
                </span>
                <h3 className="text-xl font-bold text-zinc-950 dark:text-white">
                  {activeTopic.name}
                </h3>
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {activeTopic.description}
              </p>

              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  Key Implementation Guarantees:
                </div>
                {activeTopic.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Code Representation */}
            <div className="lg:col-span-7 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-[#0c0d12] text-zinc-300 font-mono text-xs">
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#12141c] border-b border-zinc-800 text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>stashfill-core/{activeTopic.id}.ts</span>
                </div>
                <span className="text-emerald-400 font-semibold text-[10px]">TypeScript Strict</span>
              </div>
              <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed text-zinc-300">
                <code>{activeTopic.codeSnippet}</code>
              </pre>
            </div>

          </div>

        </div>

        {/* 3 Technical Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-xl tech-card">
            <div className="flex items-center gap-2 mb-3">
              <EyeOff className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-bold font-mono text-zinc-950 dark:text-white">
                Zero-Network CI Gatekeeper
              </h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Every production build runs <code className="font-mono text-zinc-900 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">check-code-safety.mjs</code>. The build is killed immediately if fetch, XMLHttpRequest, or WebSocket appears in production code.
            </p>
          </div>

          <div className="p-6 rounded-xl tech-card">
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-bold font-mono text-zinc-950 dark:text-white">
                Sub-100ms Keyboard Flow
              </h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Opens with instant search autofocus. Filter 200+ fields in milliseconds with <kbd className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">/</kbd>, navigate with arrow keys, and press Enter to copy or fill without touching your mouse.
            </p>
          </div>

          <div className="p-6 rounded-xl tech-card">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold font-mono text-zinc-950 dark:text-white">
                Encrypted Portable Snapshots
              </h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Export your identity vault as password-protected <code className="font-mono text-zinc-900 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">.stashfill</code> backups or plain JSON with automatic rolling local snapshots.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
