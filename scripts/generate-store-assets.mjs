#!/usr/bin/env node
/* global process, console */
/**
 * Stashfill Store Asset Generator
 * Uses Playwright headless Chromium to generate pixel-perfect
 * store screenshots (1280x800) and promotional tiles (440x280, 1400x560).
 */

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT_DIR = process.cwd();
const ASSETS_DIR = join(ROOT_DIR, 'store/assets');
mkdirSync(ASSETS_DIR, { recursive: true });

const STASHFILL_SVG_LOGO = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="primaryBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
    <linearGradient id="boltGrad" x1="20" y1="12" x2="28" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="#A855F7" />
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#primaryBg)" />
  <rect x="8" y="10" width="32" height="6" rx="2" fill="white" fill-opacity="0.25" />
  <rect x="6" y="14" width="36" height="24" rx="4" fill="white" fill-opacity="0.15" />
  <path d="M26 12L18 25H25L22 36L31 22H24L26 12Z" fill="url(#boltGrad)" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round" />
  <circle cx="38" cy="10" r="3.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5" />
</svg>
`;

function getHtmlWrapper(content, width, height) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #0B0F19;
      color: #F8FAFC;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

// 1. Screenshot 1: 1-Click Form Filling
function getScreenshot1Html() {
  return getHtmlWrapper(`
  <div style="width: 1280px; height: 800px; background: radial-gradient(circle at top right, #1E1B4B 0%, #0B0F19 60%); padding: 48px; display: flex; flex-direction: column; justify-content: space-between;">
    <!-- Header banner -->
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${STASHFILL_SVG_LOGO}
        <div>
          <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">Stashfill</h1>
          <p style="font-size: 13px; color: #94A3B8;">Offline, no-login autofill & quick-paste browser extension</p>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <span class="badge" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399;">
          ● 100% Offline
        </span>
        <span class="badge" style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); color: #A5B4FC;">
          1-Click Autofill
        </span>
      </div>
    </div>

    <!-- Title section -->
    <div style="text-align: center; margin-top: 10px;">
      <h2 style="font-size: 32px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">
        Fill Complex Web Forms in <span style="background: linear-gradient(135deg, #60A5FA, #A855F7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">1 Single Click</span>
      </h2>
      <p style="font-size: 15px; color: #94A3B8; margin-top: 6px;">
        Works seamlessly with React controlled forms, Vue v-model, Google Forms, Shadow DOM & iframes.
      </p>
    </div>

    <!-- Main Mockup Split -->
    <div style="display: flex; gap: 28px; height: 500px; margin-top: 16px;">
      <!-- Webpage Mockup -->
      <div style="flex: 1.2; background: #13192B; border: 1px solid #1E293B; border-radius: 18px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #1E293B; padding-bottom: 12px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #EF4444;"></div>
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #F59E0B;"></div>
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #10B981;"></div>
          <div style="background: #0B0F19; border-radius: 8px; padding: 4px 16px; font-size: 11px; color: #64748B; margin-left: 12px; flex: 1;">
            https://store.example.com/checkout
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 16px;">
          <div style="font-size: 14px; font-weight: 700; color: #F8FAFC;">Shipping & Billing Information</div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 11px; color: #94A3B8; font-weight: 600;">Full Name</label>
              <div style="background: #0B0F19; border: 2px solid #10B981; border-radius: 10px; padding: 9px 12px; font-size: 13px; color: #F1F5F9; box-shadow: 0 0 12px rgba(16, 185, 129, 0.25); display: flex; justify-content: space-between; align-items: center;">
                <span>Shanto Roy</span>
                <span style="font-size: 10px; color: #10B981; font-weight: 700;">✓ STASHFILL</span>
              </div>
            </div>
            <div>
              <label style="font-size: 11px; color: #94A3B8; font-weight: 600;">Email Address</label>
              <div style="background: #0B0F19; border: 2px solid #10B981; border-radius: 10px; padding: 9px 12px; font-size: 13px; color: #F1F5F9; box-shadow: 0 0 12px rgba(16, 185, 129, 0.25); display: flex; justify-content: space-between; align-items: center;">
                <span>shanto@example.com</span>
                <span style="font-size: 10px; color: #10B981; font-weight: 700;">✓ STASHFILL</span>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 11px; color: #94A3B8; font-weight: 600;">Phone Number</label>
              <div style="background: #0B0F19; border: 2px solid #10B981; border-radius: 10px; padding: 9px 12px; font-size: 13px; color: #F1F5F9; box-shadow: 0 0 12px rgba(16, 185, 129, 0.25); display: flex; justify-content: space-between; align-items: center;">
                <span>+880 1711 000000</span>
                <span style="font-size: 10px; color: #10B981; font-weight: 700;">✓ STASHFILL</span>
              </div>
            </div>
            <div>
              <label style="font-size: 11px; color: #94A3B8; font-weight: 600;">Postal Code</label>
              <div style="background: #0B0F19; border: 2px solid #10B981; border-radius: 10px; padding: 9px 12px; font-size: 13px; color: #F1F5F9; box-shadow: 0 0 12px rgba(16, 185, 129, 0.25); display: flex; justify-content: space-between; align-items: center;">
                <span>1207</span>
                <span style="font-size: 10px; color: #10B981; font-weight: 700;">✓ STASHFILL</span>
              </div>
            </div>
          </div>

          <div>
            <label style="font-size: 11px; color: #94A3B8; font-weight: 600;">Street Address</label>
            <div style="background: #0B0F19; border: 2px solid #10B981; border-radius: 10px; padding: 9px 12px; font-size: 13px; color: #F1F5F9; box-shadow: 0 0 12px rgba(16, 185, 129, 0.25); display: flex; justify-content: space-between; align-items: center;">
              <span>House 42, Road 11, Dhanmondi, Dhaka</span>
              <span style="font-size: 10px; color: #10B981; font-weight: 700;">✓ STASHFILL</span>
            </div>
          </div>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 8px 14px; font-size: 11px; color: #34D399; display: flex; align-items: center; justify-content: space-between;">
          <span>⚡ 5 fields matched and filled in 12ms</span>
          <span style="font-weight: 700; text-decoration: underline; cursor: pointer;">Undo Fill</span>
        </div>
      </div>

      <!-- Extension Popup Mockup -->
      <div style="flex: 0.8; background: #0F172A; border: 1px solid #334155; border-radius: 18px; padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1E293B; padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #4F46E5, #6366F1); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px;">SF</div>
            <div>
              <div style="font-size: 13px; font-weight: 700;">Stashfill</div>
              <div style="font-size: 10px; color: #10B981; font-weight: 600;">● Offline</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <span style="font-size: 11px; background: #1E293B; padding: 2px 8px; border-radius: 6px; color: #94A3B8;">EN</span>
            <span style="font-size: 11px; background: #1E293B; padding: 2px 8px; border-radius: 6px; color: #94A3B8;">🌙</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; background: #1E293B; border-radius: 10px; padding: 8px 12px;">
          <span style="font-size: 11px; color: #94A3B8;">Active Profile:</span>
          <span style="font-size: 12px; font-weight: 700; color: #F8FAFC;">Personal ★</span>
        </div>

        <button style="background: linear-gradient(135deg, #4F46E5, #6366F1); border: none; border-radius: 12px; padding: 12px; color: white; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
          ⚡ Fill Form
        </button>

        <div style="background: #1E293B; border-radius: 10px; padding: 8px 12px; font-size: 11px; color: #64748B;">
          Search fields... (Press /)
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; overflow: hidden;">
          <div style="background: #1E293B; border-radius: 10px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 9px; color: #94A3B8; font-weight: 700;">NAME</div>
              <div style="font-size: 12px; color: #F1F5F9; font-weight: 600;">Shanto Roy</div>
            </div>
            <div style="display: flex; gap: 4px;">
              <span style="background: #4F46E5; font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Fill</span>
              <span style="background: #334155; font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Copy</span>
            </div>
          </div>

          <div style="background: #1E293B; border-radius: 10px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 9px; color: #94A3B8; font-weight: 700;">EMAIL</div>
              <div style="font-size: 12px; color: #F1F5F9; font-weight: 600;">shanto@example.com</div>
            </div>
            <div style="display: flex; gap: 4px;">
              <span style="background: #4F46E5; font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Fill</span>
              <span style="background: #334155; font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Copy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `, 1280, 800);
}

// 2. Screenshot 2: Encrypted Vault
function getScreenshot2Html() {
  return getHtmlWrapper(`
  <div style="width: 1280px; height: 800px; background: radial-gradient(circle at top center, #1E1B4B 0%, #0B0F19 70%); padding: 48px; display: flex; flex-direction: column; justify-content: space-between;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${STASHFILL_SVG_LOGO}
        <div>
          <h1 style="font-size: 26px; font-weight: 800;">Stashfill Encrypted Vault</h1>
          <p style="font-size: 13px; color: #94A3B8;">On-device AES-GCM 256-bit PBKDF2 encryption</p>
        </div>
      </div>
      <span class="badge" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399;">
        🔒 Unlocked (Auto-locks in 5m)
      </span>
    </div>

    <!-- Title section -->
    <div style="text-align: center; margin-top: 10px;">
      <h2 style="font-size: 32px; font-weight: 800; color: #FFFFFF;">
        Bank-Grade Security for Payment Cards
      </h2>
      <p style="font-size: 15px; color: #94A3B8; margin-top: 6px;">
        Zero transmission. Ephemeral memory. Luhn verification & 15-second clipboard auto-clear.
      </p>
    </div>

    <!-- Cards Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: 480px; margin-top: 20px;">
      <!-- Card 1 -->
      <div style="background: linear-gradient(135deg, #1E1B4B, #0F172A); border: 1px solid #3730A3; border-radius: 20px; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 18px; font-weight: 800; color: #FFFFFF;">Personal Sapphire</div>
            <div style="font-size: 11px; color: #818CF8; font-weight: 600; margin-top: 2px;">Primary Checkout Card</div>
          </div>
          <div style="background: #FFFFFF; border-radius: 8px; padding: 4px 12px; font-weight: 900; font-size: 16px; color: #1A1F71;">
            VISA
          </div>
        </div>

        <div style="font-family: monospace; font-size: 22px; font-weight: 700; letter-spacing: 2px; color: #F8FAFC; margin: 24px 0;">
          •••• •••• •••• 4242
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
          <div>
            <div style="font-size: 10px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Cardholder</div>
            <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">SHANTO ROY</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Expires</div>
            <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">08 / 29</div>
          </div>
          <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 6px 12px; font-size: 11px; color: #34D399; font-weight: 700;">
            ✓ Valid Luhn Check
          </div>
        </div>
      </div>

      <!-- Card 2 -->
      <div style="background: linear-gradient(135deg, #18181B, #09090B); border: 1px solid #27272A; border-radius: 20px; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 18px; font-weight: 800; color: #FFFFFF;">Business Corporate</div>
            <div style="font-size: 11px; color: #A1A1AA; font-weight: 600; margin-top: 2px;">Work Expenses & Cloud Bills</div>
          </div>
          <div style="background: #EB001B; border-radius: 8px; padding: 4px 12px; font-weight: 900; font-size: 16px; color: #FFFFFF;">
            MC
          </div>
        </div>

        <div style="font-family: monospace; font-size: 22px; font-weight: 700; letter-spacing: 2px; color: #F8FAFC; margin: 24px 0;">
          •••• •••• •••• 5555
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
          <div>
            <div style="font-size: 10px; color: #A1A1AA; text-transform: uppercase; font-weight: 700;">Cardholder</div>
            <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">SHANTO ROY</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #A1A1AA; text-transform: uppercase; font-weight: 700;">Expires</div>
            <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">12 / 28</div>
          </div>
          <div style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 8px; padding: 6px 12px; font-size: 11px; color: #A5B4FC; font-weight: 700;">
            Ephemeral CVV
          </div>
        </div>
      </div>
    </div>
  </div>
  `, 1280, 800);
}

// 3. Screenshot 3: Multi-Profile & Custom Fields
function getScreenshot3Html() {
  return getHtmlWrapper(`
  <div style="width: 1280px; height: 800px; background: #0B0F19; padding: 48px; display: flex; flex-direction: column; justify-content: space-between;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${STASHFILL_SVG_LOGO}
        <div>
          <h1 style="font-size: 26px; font-weight: 800;">Stashfill Profiles & Categories</h1>
          <p style="font-size: 13px; color: #94A3B8;">Personal, Work, and Custom Data Management</p>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <span style="background: #4F46E5; color: white; padding: 6px 16px; border-radius: 10px; font-size: 12px; font-weight: 700;">Personal ★</span>
        <span style="background: #1E293B; color: #94A3B8; padding: 6px 16px; border-radius: 10px; font-size: 12px; font-weight: 700;">Work</span>
        <span style="background: #1E293B; color: #94A3B8; padding: 6px 16px; border-radius: 10px; font-size: 12px; font-weight: 700;">Social Links</span>
      </div>
    </div>

    <!-- Category Pills -->
    <div style="display: flex; gap: 10px; background: #13192B; padding: 10px 16px; border-radius: 12px; border: 1px solid #1E293B;">
      <span style="background: #4F46E5; color: white; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;">All Categories (12)</span>
      <span style="background: #1E293B; color: #CBD5E1; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;">Personal Info (4)</span>
      <span style="background: #1E293B; color: #CBD5E1; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;">Contact Details (3)</span>
      <span style="background: #1E293B; color: #CBD5E1; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;">Address (3)</span>
      <span style="background: #1E293B; color: #CBD5E1; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;">Custom Fields (2)</span>
    </div>

    <!-- Fields Stack -->
    <div style="display: flex; flex-direction: column; gap: 14px; height: 480px; overflow: hidden;">
      <div style="background: #13192B; border: 1px solid #1E293B; border-radius: 14px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="color: #64748B; font-size: 14px; cursor: grab;">↕</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px; font-weight: 700; color: #F8FAFC;">Full Name</span>
              <span style="font-family: monospace; font-size: 11px; background: rgba(99, 102, 241, 0.2); color: #A5B4FC; padding: 2px 8px; border-radius: 6px;">name</span>
              <span style="font-size: 10px; background: #1E293B; color: #94A3B8; padding: 2px 6px; border-radius: 6px;">TEXT</span>
            </div>
            <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; font-family: monospace;">Shanto Roy</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="background: #1E293B; font-size: 11px; padding: 4px 10px; border-radius: 8px; color: #CBD5E1;">Category: Personal</span>
          <span style="background: #1E293B; font-size: 11px; padding: 4px 10px; border-radius: 8px; color: #EF4444;">Delete</span>
        </div>
      </div>

      <div style="background: #13192B; border: 1px solid #1E293B; border-radius: 14px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="color: #64748B; font-size: 14px; cursor: grab;">↕</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px; font-weight: 700; color: #F8FAFC;">Tax / SSN ID</span>
              <span style="font-family: monospace; font-size: 11px; background: rgba(99, 102, 241, 0.2); color: #A5B4FC; padding: 2px 8px; border-radius: 6px;">custom_tax</span>
              <span style="font-size: 10px; background: rgba(245, 158, 11, 0.2); color: #FBBF24; padding: 2px 6px; border-radius: 6px;">🔒 SENSITIVE</span>
            </div>
            <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; font-family: monospace;">•••••••••••</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="background: #1E293B; font-size: 11px; padding: 4px 10px; border-radius: 8px; color: #CBD5E1;">Category: Custom</span>
          <span style="background: #1E293B; font-size: 11px; padding: 4px 10px; border-radius: 8px; color: #EF4444;">Delete</span>
        </div>
      </div>

      <div style="background: #13192B; border: 1px solid #1E293B; border-radius: 14px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="color: #64748B; font-size: 14px; cursor: grab;">↕</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px; font-weight: 700; color: #F8FAFC;">Email Address</span>
              <span style="font-family: monospace; font-size: 11px; background: rgba(99, 102, 241, 0.2); color: #A5B4FC; padding: 2px 8px; border-radius: 6px;">email</span>
              <span style="font-size: 10px; background: #1E293B; color: #94A3B8; padding: 2px 6px; border-radius: 6px;">EMAIL</span>
            </div>
            <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; font-family: monospace;">shanto@example.com</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="background: #1E293B; font-size: 11px; padding: 4px 10px; border-radius: 8px; color: #CBD5E1;">Category: Contact</span>
          <span style="background: #1E293B; font-size: 11px; padding: 4px 10px; border-radius: 8px; color: #EF4444;">Delete</span>
        </div>
      </div>
    </div>
  </div>
  `, 1280, 800);
}

// 4. Screenshot 4: Multilingual & Accessible (Bangla + English)
function getScreenshot4Html() {
  return getHtmlWrapper(`
  <div style="width: 1280px; height: 800px; background: radial-gradient(circle at top right, #1E1B4B 0%, #0B0F19 70%); padding: 48px; display: flex; flex-direction: column; justify-content: space-between;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${STASHFILL_SVG_LOGO}
        <div>
          <h1 style="font-size: 26px; font-weight: 800;">Stashfill — বহুভাষিক ও অ্যাক্সেসিবল</h1>
          <p style="font-size: 13px; color: #94A3B8;">Built-in English and বাংলা dictionaries with full WCAG AA compliance</p>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <span class="badge" style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); color: #C7D2FE;">
          🌐 বাংলা ও English
        </span>
        <span class="badge" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399;">
          🌙 High-Contrast Dark Mode
        </span>
      </div>
    </div>

    <!-- Title section -->
    <div style="text-align: center; margin-top: 10px;">
      <h2 style="font-size: 32px; font-weight: 800; color: #FFFFFF;">
        Native Language Support & High Accessibility
      </h2>
      <p style="font-size: 15px; color: #94A3B8; margin-top: 6px;">
        Switch between English and বাংলা seamlessly. Keyboard-first navigation (Esc, /, Tab, Enter).
      </p>
    </div>

    <!-- Split Mockup: English & Bangla side-by-side -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: 480px; margin-top: 20px;">
      <!-- English Dashboard Pane -->
      <div style="background: #13192B; border: 1px solid #1E293B; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1E293B; padding-bottom: 12px;">
          <span style="font-weight: 800; font-size: 14px; color: #F8FAFC;">English Interface</span>
          <span style="background: #1E293B; padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #94A3B8;">Language: EN</span>
        </div>
        <div style="background: #0B0F19; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 700;">DEFAULT ACTION</div>
            <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">Fill Form Instantly</div>
          </div>
          <span style="background: #4F46E5; color: white; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;">Fill Form</span>
        </div>
        <div style="background: #0B0F19; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 700;">STORAGE ENCRYPTION</div>
            <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">Encrypted Vault</div>
          </div>
          <span style="background: rgba(16, 185, 129, 0.2); color: #34D399; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;">Unlocked</span>
        </div>
        <div style="background: #0B0F19; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 700;">PRIVACY ASSURANCE</div>
            <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">Zero Network Requests</div>
          </div>
          <span style="background: rgba(99, 102, 241, 0.2); color: #A5B4FC; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;">100% Offline</span>
        </div>
      </div>

      <!-- Bangla Dashboard Pane -->
      <div style="background: #13192B; border: 1px solid #1E293B; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1E293B; padding-bottom: 12px;">
          <span style="font-weight: 800; font-size: 14px; color: #F8FAFC;">বাংলা ইন্টারফেস</span>
          <span style="background: #1E293B; padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #34D399; font-weight: 700;">ভাষা: বাংলা</span>
        </div>
        <div style="background: #0B0F19; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 700;">প্রধান অ্যাকশন</div>
            <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">এক ক্লিকে ফর্ম পূরণ করুন</div>
          </div>
          <span style="background: #4F46E5; color: white; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;">ফর্ম পূরণ করুন</span>
        </div>
        <div style="background: #0B0F19; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 700;">সুরক্ষিত সংরক্ষণাগার</div>
            <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">এনক্রিপ্টেড ভল্ট</div>
          </div>
          <span style="background: rgba(16, 185, 129, 0.2); color: #34D399; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;">আনলকড</span>
        </div>
        <div style="background: #0B0F19; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 700;">প্রাইভেসি প্রতিশ্রুতি</div>
            <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">কোনো নেটওয়ার্ক রিকোয়েস্ট নেই</div>
          </div>
          <span style="background: rgba(99, 102, 241, 0.2); color: #A5B4FC; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;">১০০% অফলাইন</span>
        </div>
      </div>
    </div>
  </div>
  `, 1280, 800);
}

// 5. Screenshot 5: Offline Backups & Complete Local Control
function getScreenshot5Html() {
  return getHtmlWrapper(`
  <div style="width: 1280px; height: 800px; background: #0B0F19; padding: 48px; display: flex; flex-direction: column; justify-content: space-between;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${STASHFILL_SVG_LOGO}
        <div>
          <h1 style="font-size: 26px; font-weight: 800;">Stashfill Backup & Recovery</h1>
          <p style="font-size: 13px; color: #94A3B8;">Automatic local rolling snapshots & encrypted export</p>
        </div>
      </div>
      <span class="badge" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399;">
        ✓ Zero Cloud Dependence
      </span>
    </div>

    <!-- Title section -->
    <div style="text-align: center; margin-top: 10px;">
      <h2 style="font-size: 32px; font-weight: 800; color: #FFFFFF;">
        Total Data Portability & Safety
      </h2>
      <p style="font-size: 15px; color: #94A3B8; margin-top: 6px;">
        Export your data anytime (JSON, CSV, Encrypted AES-256). Dry-run preview prevents duplicate conflicts.
      </p>
    </div>

    <!-- Content Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: 480px; margin-top: 20px;">
      <!-- Export & Import Card -->
      <div style="background: #13192B; border: 1px solid #1E293B; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="font-weight: 800; font-size: 16px; color: #F8FAFC;">Export & Import Vault</div>
          <p style="font-size: 12px; color: #94A3B8;">Plain JSON and CSV exports exclude payment cards. Cards travel only inside encrypted backups.</p>

          <div style="background: #0B0F19; border: 1px solid #1E293B; border-radius: 12px; padding: 14px;">
            <label style="font-size: 11px; color: #94A3B8; font-weight: 700;">EXPORT FORMAT</label>
            <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-top: 4px;">🔒 Encrypted Stashfill Envelope (.json)</div>
          </div>

          <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: #A5B4FC;">DRY-RUN IMPORT PREVIEW</div>
            <div style="display: flex; gap: 10px; margin-top: 8px;">
              <span style="background: rgba(16, 185, 129, 0.2); color: #34D399; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">+8 New Fields</span>
              <span style="background: rgba(245, 158, 11, 0.2); color: #FBBF24; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">2 Duplicates Skipped</span>
            </div>
          </div>
        </div>

        <button style="background: linear-gradient(135deg, #4F46E5, #6366F1); border: none; border-radius: 12px; padding: 12px; color: white; font-weight: 700; font-size: 13px;">
          ⬇ Download Encrypted Backup
        </button>
      </div>

      <!-- Rolling Snapshots Card -->
      <div style="background: #13192B; border: 1px solid #1E293B; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: 800; font-size: 16px; color: #F8FAFC;">Rolling Local Snapshots</div>
            <span style="background: #1E293B; color: #94A3B8; font-size: 11px; padding: 2px 8px; border-radius: 6px;">Last 5 Versions</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="background: #0B0F19; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #FFFFFF;">Snapshot — Today, 12:45 AM</div>
                <div style="font-size: 11px; color: #64748B;">3 profiles · 12 fields · 2 cards</div>
              </div>
              <span style="background: #4F46E5; color: white; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer;">Restore</span>
            </div>

            <div style="background: #0B0F19; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #FFFFFF;">Snapshot — Yesterday, 8:30 PM</div>
                <div style="font-size: 11px; color: #64748B;">3 profiles · 10 fields · 2 cards</div>
              </div>
              <span style="background: #1E293B; color: #CBD5E1; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer;">Restore</span>
            </div>

            <div style="background: #0B0F19; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #FFFFFF;">Snapshot — 3 days ago</div>
                <div style="font-size: 11px; color: #64748B;">2 profiles · 8 fields · 1 card</div>
              </div>
              <span style="background: #1E293B; color: #CBD5E1; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer;">Restore</span>
            </div>
          </div>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 10px 14px; font-size: 11px; color: #34D399;">
          🛡️ Automatic local snapshot taken on every configuration save.
        </div>
      </div>
    </div>
  </div>
  `, 1280, 800);
}

// 6. Promo Small (440x280)
function getPromoSmallHtml() {
  return getHtmlWrapper(`
  <div style="width: 440px; height: 280px; background: radial-gradient(circle at center, #1E1B4B 0%, #0B0F19 100%); padding: 32px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 14px;">
    ${STASHFILL_SVG_LOGO}
    <div>
      <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.02em; color: #FFFFFF;">Stashfill</h1>
      <p style="font-size: 13px; color: #A5B4FC; font-weight: 600; margin-top: 4px;">1-Click Offline Autofill & Quick Paste</p>
    </div>
    <div style="display: flex; gap: 8px;">
      <span class="badge" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399; font-size: 10px;">
        100% Offline
      </span>
      <span class="badge" style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); color: #C7D2FE; font-size: 10px;">
        AES-256 Vault
      </span>
    </div>
  </div>
  `, 440, 280);
}

// 5. Promo Marquee (1400x560)
function getPromoMarqueeHtml() {
  return getHtmlWrapper(`
  <div style="width: 1400px; height: 560px; background: radial-gradient(circle at center, #1E1B4B 0%, #0B0F19 100%); padding: 60px 80px; display: flex; justify-content: space-between; align-items: center;">
    <div style="max-width: 650px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${STASHFILL_SVG_LOGO}
        <span class="badge" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399; font-size: 13px;">
          ● 100% Offline & Private
        </span>
      </div>

      <h1 style="font-size: 46px; font-weight: 900; line-height: 1.15; color: #FFFFFF; letter-spacing: -0.02em;">
        Your Data. Your Device.<br />
        <span style="background: linear-gradient(135deg, #60A5FA, #A855F7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          1-Click Autofill Everywhere.
        </span>
      </h1>

      <p style="font-size: 17px; color: #94A3B8; line-height: 1.5;">
        Save your personal details, snippets, and cards once. Fill any form on any website with a single click. Zero accounts. Zero servers.
      </p>

      <div style="display: flex; gap: 14px; font-size: 13px; font-weight: 700; color: #CBD5E1;">
        <span>✓ React & Vue Ready</span>
        <span>✓ AES-GCM 256 Encrypted</span>
        <span>✓ Multilingual (EN + বাংলা)</span>
      </div>
    </div>

    <!-- Visual Card Stack Preview -->
    <div style="width: 480px; background: #13192B; border: 1px solid #1E293B; border-radius: 24px; padding: 28px; box-shadow: 0 30px 60px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; font-weight: 700; color: #F8FAFC;">Active Profile: Personal ★</span>
        <span style="font-size: 12px; color: #34D399; font-weight: 600;">10 Fields Ready</span>
      </div>
      <div style="background: linear-gradient(135deg, #4F46E5, #6366F1); border-radius: 14px; padding: 14px; text-align: center; font-weight: 800; font-size: 15px;">
        ⚡ 1-Click Form Filling
      </div>
      <div style="background: #0B0F19; border-radius: 12px; padding: 12px; font-size: 12px; font-family: monospace; color: #94A3B8; display: flex; justify-content: space-between;">
        <span>name: Shanto Roy</span>
        <span style="color: #34D399;">✓ Filled</span>
      </div>
      <div style="background: #0B0F19; border-radius: 12px; padding: 12px; font-size: 12px; font-family: monospace; color: #94A3B8; display: flex; justify-content: space-between;">
        <span>email: shanto@example.com</span>
        <span style="color: #34D399;">✓ Filled</span>
      </div>
      <div style="background: #0B0F19; border-radius: 12px; padding: 12px; font-size: 12px; font-family: monospace; color: #94A3B8; display: flex; justify-content: space-between;">
        <span>card: VISA •••• 4242</span>
        <span style="color: #A5B4FC;">🔒 AES-256</span>
      </div>
    </div>
  </div>
  `, 1400, 560);
}

async function main() {
  console.log('Launching headless Chromium to render Web Store visual assets...');
  const browser = await chromium.launch();

  const renderTask = async (name, html, width, height) => {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent(html);
    await page.waitForTimeout(100);
    const dest = join(ASSETS_DIR, name);
    await page.screenshot({ path: dest, type: 'png' });
    await page.close();
    console.log(`✓ Rendered: store/assets/${name} (${width}x${height})`);
  };

  await renderTask('screenshot-1-autofill-1280x800.png', getScreenshot1Html(), 1280, 800);
  await renderTask('screenshot-2-encrypted-vault-1280x800.png', getScreenshot2Html(), 1280, 800);
  await renderTask('screenshot-3-profiles-fields-1280x800.png', getScreenshot3Html(), 1280, 800);
  await renderTask('screenshot-4-multilingual-1280x800.png', getScreenshot4Html(), 1280, 800);
  await renderTask('screenshot-5-backups-snapshots-1280x800.png', getScreenshot5Html(), 1280, 800);
  await renderTask('promo-small-440x280.png', getPromoSmallHtml(), 440, 280);
  await renderTask('promo-marquee-1400x560.png', getPromoMarqueeHtml(), 1400, 560);

  await browser.close();
  console.log('All store screenshots and promotional tiles generated successfully!');
}

main().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
