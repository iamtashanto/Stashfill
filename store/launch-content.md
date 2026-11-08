# Stashfill Launch Content & Community Posts

---

## 1. Product Hunt Listing

### Tagline

1-Click offline autofill for your real data. No accounts. Zero trackers.

### Short Pitch

Save your personal data once (name, email, phone, addresses, custom text, and encrypted cards). Fill or paste it into any web form in one click. 100% offline, privacy-first, open-source. Think FakeFiller, but for your real data.

### Maker First Comment

> Hey Product Hunt! 👋
>
> We're the team behind **Stashfill**.
>
> How many times a day do you re-type your email, phone number, shipping address, or custom info into a web form, job application, or checkout page?
>
> Most existing form fillers either:
>
> 1. Generate fake dummy text (great for QA, useless for daily life), or
> 2. Require an online account, cloud synchronization, and broad permissions to track everything you do.
>
> We built Stashfill on a different set of principles:
>
> - **100% Offline & Local**: No accounts, no servers, zero telemetry. An automated CI check fails our build if `fetch` or `XMLHttpRequest` appears anywhere in our production source.
> - **Works Everywhere**: Handles React controlled inputs (`_valueTracker`), Vue `v-model`, open Shadow DOM, same-origin iframes, and `contenteditable`.
> - **AES-GCM 256-Bit Encrypted Vault**: High-risk data (payment cards) is sealed inside an encrypted vault derived via PBKDF2 (600,000 iterations). Fills only after an explicit confirmation.
> - **Fast & Accessible**: Popup opens under 100 ms with 200 items, full keyboard-first navigation, dark/light theme, and English & Bangla (বাংলা) support.
>
> Stashfill is 100% open-source under the MIT license. We'd love your feedback!

---

## 2. Hacker News: Show HN

### Title

Show HN: Stashfill – 1-Click offline autofill for your real data (open-source)

### Post Body

Hi HN,

I built Stashfill (https://github.com/stashfill/stashfill), an open-source, offline browser extension (Manifest V3) that lets you save your personal data once and fill or paste it into any web form in one click.

**Why?**
Extensions like FakeFiller are wonderful for QA testing with random data, but when filling real-world forms (job portals, shipping checkouts, government registries, SaaS onboarding), you need your _real_ information filled quickly. At the same time, giving a browser extension broad network access to all your personal credentials and identity data is a massive security hazard.

**How it works & technical choices:**

1. **Zero-Network Architecture**: No backend servers, no analytics, no accounts. We run a grep-based CI check (`scripts/check-code-safety.mjs`) that fails the build if `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, or dynamic scripts exist in production source.
2. **Framework DOM Reconciliation**: Modern React inputs listen to internal `_valueTracker` descriptors, and Vue binds to `v-model`. Standard DOM `.value = x` assignment doesn't trigger state updates. Stashfill overrides the prototype value setter, synchronizes the framework tracker, and dispatches bubbled `input`, `change`, and `blur` events.
3. **Encrypted Vault**: Stored using W3C Web Cryptography API (`crypto.subtle`) with PBKDF2-SHA256 (600,000 iterations) and AES-GCM 256. Cards are never auto-suggested or passively filled—only filled after an active confirmation dialog with ephemeral CVV and 15-second clipboard clearing.
4. **Heuristic Matcher**: Combines autocomplete tokens, input types, camelCase/snake_case tokenization, labels, placeholders, aria-labels, and synonym dictionaries (English and Bangla at launch).

Code is on GitHub under MIT: https://github.com/stashfill/stashfill
Landing page: https://stashfill.tashanto.com

Would love to hear your thoughts, feedback, and edge-case form bug reports!

---

## 3. Reddit Posts

### Post A: `r/chrome_extensions`

**Title:** I built Stashfill: an open-source, 100% offline autofill extension with zero trackers
**Body:**

> Hey r/chrome_extensions,
>
> If you're tired of re-typing your contact details, work info, and snippets on random forms, check out **Stashfill**.
>
> It's an offline-only extension built with WXT, Preact, and TypeScript:
>
> - **1-Click Form Filling**: Works across React, Vue, shadow DOM, Google Forms, and nested iframes.
> - **Zero Network**: No servers, no tracking, no login.
> - **Encrypted Vault**: Sensitive payment card data is encrypted with AES-GCM 256 and PBKDF2 (600,000 iterations).
> - **Fast**: Popup opens in under 100 ms with 200+ saved items.
> - **Search & Quick Paste**: Focus on open, arrow key navigation, Enter to copy/fill.
>
> Check out the GitHub repo: https://github.com/stashfill/stashfill
> Free, open source, MIT.

### Post B: `r/privacy`

**Title:** Stashfill: A zero-telemetry, strictly offline autofill extension with encrypted local vault
**Body:**

> Hello r/privacy,
>
> Autofill tools and password managers increasingly push users into mandatory cloud accounts, telemetry collection, and closed-source backends.
>
> We built **Stashfill** to be the opposite:
>
> 1. **Zero External Requests**: There is literally no backend. Our CI fails if any network API is present in the source.
> 2. **Client-Side Encryption**: Cards and sensitive fields are encrypted with AES-GCM 256-bit using keys derived via PBKDF2 (600k rounds). Master passphrase is never written to disk.
> 3. **Minimal Permissions**: Requests only `storage`, `activeTab`, `scripting`, and `contextMenus`. No broad host permissions.
> 4. **No Passive Filling of Financial Data**: Payment cards require explicit confirmation before filling, with ephemeral one-time CVV and a 15-second auto-clearing clipboard.
>
> Source code and threat model:
>
> - GitHub: https://github.com/stashfill/stashfill
> - Threat Model: https://github.com/stashfill/stashfill/blob/main/THREAT_MODEL.md

### Post C: `r/SideProject`

**Title:** Stashfill – Like FakeFiller, but for your real saved data (100% offline & open-source)
**Body:**

> Hey everyone! I got tired of constantly typing the same shipping addresses, job application details, and snippets across the web, so I created **Stashfill**.
>
> You save your data once locally in profiles (Personal, Work, Developer, etc.) and fill entire forms in one click or with `Alt+Shift+F`.
>
> Built with WXT, Preact, Tailwind, and Vitest.
> GitHub: https://github.com/stashfill/stashfill

---

## 4. DEV.to Technical Article

**Title:** Building an Offline, Privacy-First Browser Extension with WXT, Preact, and Web Crypto
**Tags:** `#webdev #javascript #typescript #opensource`

### Summary Outline

1. **The Architecture of an Offline-First Extension**: Why we committed to zero network requests and how we enforce it via automated AST and regex grep CI checks.
2. **Framework DOM Reconciliation**: Overriding `HTMLInputElement.prototype.value` and synchronizing React's `_valueTracker` so controlled inputs don't wipe filled values.
3. **Designing a Fast Heuristic Matcher**: Scoring autocomplete attributes, tokenized camelCase/snake_case IDs, and localized synonym dictionaries in < 50ms across 200 inputs.
4. **Hardware-Accelerated Web Crypto in MV3**: PBKDF2 key derivation with 600,000 iterations + AES-GCM 256-bit encryption for sensitive vaults without adding external bloated crypto libraries.
5. **Cross-Browser Manifest V3**: Targeting Chrome, Edge, and Firefox from a single codebase using WXT.

---

## 5. Local Community Post (Bangla / বাংলা)

**Title:** স্ট্যাশফিল (Stashfill) — সম্পূর্ণ অফলাইন ও প্রাইভেসি-ফার্স্ট ফর্ম অটোফিল ব্রাউজার এক্সটেনশন

**Post Text:**

> আসসালামু আলাইকুম সবাইকে! 👋
>
> দৈনন্দিন কাজ, চাকরি আবেদন বা অনলাইন কেনাকাটায় বারবার নিজের নাম, ঠিকানা, ফোন নম্বর বা তথ্য টাইপ করা বেশ ক্লান্তিকর।
>
> এই সমস্যা সমাধানের জন্য তৈরি করেছি **Stashfill** — একটি ওপেন-সোর্স, অফলাইন-অনলি ব্রাউজার এক্সটেনশন।
>
> **মূল বৈশিষ্ট্যসমূহ:**
>
> - ⚡ **১-ক্লিকে অটোফিল**: যেকোনো ওয়েবসাইটে এক ক্লিকেই আপনার তথ্য বসে যাবে (React, Vue, Shadow DOM বা Google Forms-এও সহজে কাজ করে)।
> - 🔒 **১০০% অফলাইন ও নিরাপদ**: কোনো অ্যাকাউন্ট বা ইন্টারনেটের প্রয়োজন নেই। আপনার কোনো তথ্য কখনো আমাদের বা কোনো সার্ভারে যায় না।
> - 🛡️ **এনক্রিপ্টেড ভল্ট**: সংবেদনশীল তথ্য ও পেমেন্ট কার্ড AES-GCM 256-বিট দিয়ে এনক্রিপ্ট করে আপনার কম্পিউটারে সুরক্ষিত থাকে।
> - 🇧🇩 **বাংলা ভাষা সাপোর্ট**: ইংরেজির পাশাপাশি সম্পূর্ণ ইন্টারফেস বাংলায় ব্যবহার করা যায় এবং বাংলা ফর্ম ফিল্ড সিনোনিম সরাসরি সাপোর্ট করে।
> - ⌨️ **কীবোর্ড-ফ্রেন্ডলি ও সুপার ফাস্ট**: ২০০+ ফিল্ডের মধ্যেও ১০০ মিলিসেকেন্ডের কম সময়ে পপআপ ওপেন ও সার্চ করা যায়।
>
> এক্সটেনশনটি সম্পূর্ণ ফ্রি এবং MIT লাইসেন্সে ওপেন-সোর্স:  
> 🔗 **গিটহাব রিপোজিটরি**: https://github.com/stashfill/stashfill  
> 🌐 **ওয়েবসাইট**: https://stashfill.tashanto.com
>
> আপনাদের গঠনমূলক মতামত ও পরামর্শ সাদরে প্রত্যাশিত! ধন্যবাদ।
