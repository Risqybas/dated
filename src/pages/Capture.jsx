import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cap-root {
    --ink:    #0d0b08;
    --cream:  #f5f0e8;
    --dust:   #8a8178;
    --gold:   #b8955a;
    --green:  #4a7c6b;
    --red:    #c0392b;
    font-family: 'DM Sans', sans-serif;
    height: 100dvh;
    min-height: 100svh;
    background: var(--ink);
    color: var(--cream);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .cap-header {
    position: absolute;
    top: 0; left: 0; right: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    padding-top: max(1rem, env(safe-area-inset-top));
    background: linear-gradient(to bottom, rgba(13,11,8,0.8) 0%, transparent 100%);
  }

  .cap-header-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    font-weight: 300;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--cream);
  }

  .cap-close-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(13,11,8,0.5);
    color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s;
  }
  .cap-close-btn:hover { background: rgba(255,255,255,0.1); }

  /* ── ADDED: credits badge in header ── */
  .cap-credits-badge {
    display: flex; align-items: center; gap: 5px;
    background: rgba(184,149,90,0.15);
    border: 1px solid rgba(184,149,90,0.3);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.72rem; font-weight: 500;
    letter-spacing: 0.06em;
    color: var(--gold);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s;
  }
  .cap-credits-badge:hover { background: rgba(184,149,90,0.25); }
  .cap-credits-badge.low { color: #e07070; border-color: rgba(192,57,43,0.3); background: rgba(192,57,43,0.1); }

  .cap-viewport {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    overflow: hidden;
  }

  .cap-video {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }

  .cap-canvas { display: none; }

  .cap-timer-ring {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.4s;
  }
  .cap-timer-ring.visible { opacity: 1; }
  .cap-ring-svg { transform: rotate(-90deg); }
  .cap-ring-track { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 3; }
  .cap-ring-progress { fill: none; stroke: var(--gold); stroke-width: 3; stroke-linecap: round; transition: stroke-dashoffset 1s linear, stroke 0.5s; }
  .cap-ring-progress.urgent { stroke: #e07070; }
  .cap-timer-text {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.8rem; font-weight: 300;
    color: var(--cream); line-height: 1;
    text-shadow: 0 2px 12px rgba(0,0,0,0.6);
  }
  .cap-timer-text.urgent { color: #e07070; }

  .cap-viewfinder { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
  .cap-bracket { position: absolute; width: 28px; height: 28px; }
  .cap-bracket::before, .cap-bracket::after { content: ''; position: absolute; background: rgba(245,240,232,0.6); }
  .cap-bracket::before { width: 100%; height: 1.5px; }
  .cap-bracket::after  { width: 1.5px; height: 100%; }
  .cap-bracket.tl { top: 20px; left: 20px; }
  .cap-bracket.tl::before { top: 0; left: 0; }
  .cap-bracket.tl::after  { top: 0; left: 0; }
  .cap-bracket.tr { top: 20px; right: 20px; }
  .cap-bracket.tr::before { top: 0; right: 0; }
  .cap-bracket.tr::after  { top: 0; right: 0; }
  .cap-bracket.bl { bottom: 20px; left: 20px; }
  .cap-bracket.bl::before { bottom: 0; left: 0; }
  .cap-bracket.bl::after  { bottom: 0; left: 0; }
  .cap-bracket.br { bottom: 20px; right: 20px; }
  .cap-bracket.br::before { bottom: 0; right: 0; }
  .cap-bracket.br::after  { bottom: 0; right: 0; }

  .cap-flip-btn {
    position: absolute;
    top: max(1rem, env(safe-area-inset-top));
    right: 4.5rem;
    z-index: 20;
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(13,11,8,0.5);
    color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s, transform 0.3s;
  }
  .cap-flip-btn:active { transform: rotate(180deg); }

  .cap-controls {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    z-index: 20;
    display: flex; flex-direction: column;
    align-items: center; gap: 0.75rem;
    padding: 1.5rem 1.5rem;
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
    background: linear-gradient(to top, rgba(13,11,8,0.85) 0%, transparent 100%);
  }

  .cap-hint { font-size: 0.72rem; font-weight: 300; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(245,240,232,0.45); text-align: center; }

  .cap-shutter-wrap { display: flex; align-items: center; justify-content: center; gap: 2.5rem; }

  .cap-shutter {
    width: 72px; height: 72px;
    border-radius: 50%;
    border: 3px solid rgba(245,240,232,0.8);
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.12s, border-color 0.2s;
    position: relative;
  }
  .cap-shutter::after {
    content: '';
    width: 56px; height: 56px;
    border-radius: 50%;
    background: var(--cream);
    transition: background 0.2s, transform 0.12s;
  }
  .cap-shutter:active { transform: scale(0.93); }
  .cap-shutter:active::after { background: var(--gold); transform: scale(0.9); }
  .cap-shutter:disabled { opacity: 0.35; cursor: not-allowed; }

  .cap-flash { position: absolute; inset: 0; z-index: 30; background: white; pointer-events: none; opacity: 0; }
  .cap-flash.flashing { animation: flash 0.35s ease-out forwards; }
  @keyframes flash { 0% { opacity: 0.9; } 100% { opacity: 0; } }

  .cap-preview-root {
    position: absolute;
    inset: 0;
    z-index: 40;
    background: var(--ink);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    animation: fadeIn 0.3s ease both;
  }
  @keyframes fadeIn { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: scale(1); } }

  .cap-preview-img {
    width: 100%;
    height: 58vh;
    max-height: 58vh;
    object-fit: cover;
    display: block;
    flex-shrink: 0;
  }

  .cap-preview-controls {
    padding: 1.25rem 1.5rem;
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: var(--ink);
    flex-shrink: 0;
  }

  .cap-caption-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; font-weight: 300;
    outline: none; resize: none;
    transition: border-color 0.2s;
  }
  .cap-caption-input::placeholder { color: rgba(200,191,175,0.3); }
  .cap-caption-input:focus { border-color: var(--gold); }

  .cap-preview-btns { display: grid; grid-template-columns: 1fr 2fr; gap: 0.75rem; }

  .cap-btn-retake {
    padding: 0.8rem; background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px; color: var(--cream);
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 400;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: border-color 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .cap-btn-retake:hover { border-color: rgba(255,255,255,0.3); }

  .cap-btn-save {
    padding: 0.8rem; background: var(--gold); border: none;
    border-radius: 8px; color: var(--ink);
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500;
    letter-spacing: 0.05em; text-transform: uppercase;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s, transform 0.12s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .cap-btn-save:hover:not(:disabled) { opacity: 0.88; }
  .cap-btn-save:active:not(:disabled) { transform: scale(0.97); }
  .cap-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

  .cap-uploading {
    position: absolute; inset: 0; z-index: 50;
    background: rgba(13,11,8,0.92);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 1.2rem; animation: fadeIn 0.2s ease both;
  }
  .cap-upload-spinner {
    width: 40px; height: 40px;
    border: 2px solid rgba(184,149,90,0.2);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .cap-upload-label { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 300; letter-spacing: 0.1em; color: var(--cream); }
  .cap-upload-sub { font-size: 0.72rem; color: rgba(200,191,175,0.4); letter-spacing: 0.06em; margin-top: -0.5rem; }

  .cap-wardrobe-root {
    position: absolute; inset: 0; z-index: 45;
    background: var(--ink);
    display: flex; flex-direction: column;
    animation: slideUp 0.4s cubic-bezier(0.22,0.68,0,1.2) both;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

  .cap-wardrobe-header {
    padding: 1.5rem 1.25rem 0.5rem;
    padding-top: max(1.5rem, env(safe-area-inset-top));
    background: rgba(13,11,8,0.95);
    position: sticky; top: 0; z-index: 2;
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
  }

  .cap-wardrobe-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 300;
    color: var(--cream); margin-bottom: 0.25rem;
  }

  .cap-wardrobe-sub {
    font-size: 0.78rem; color: var(--dust); font-weight: 300;
    line-height: 1.5; margin-bottom: 0.85rem;
  }

  .cap-wardrobe-body { padding: 1rem 1.25rem 0; }

  .cap-wardrobe-section-label {
    font-size: 0.65rem; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--dust); margin-bottom: 0.65rem;
  }

  .cap-suggestion-card {
    display: flex; align-items: center; gap: 0.85rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: border-color 0.2s, background 0.2s;
    animation: fadeUp 0.3s cubic-bezier(0.22,0.68,0,1.2) both;
  }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .cap-suggestion-card.selected {
    border-color: var(--gold);
    background: rgba(184,149,90,0.08);
  }

  .cap-suggestion-check {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    border: 1.5px solid rgba(255,255,255,0.2);
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, border-color 0.2s;
  }
  .cap-suggestion-card.selected .cap-suggestion-check {
    background: var(--gold);
    border-color: var(--gold);
  }

  .cap-suggestion-info { flex: 1; min-width: 0; }

  .cap-suggestion-name {
    font-size: 0.875rem; font-weight: 500;
    color: var(--cream); margin-bottom: 2px;
  }

  .cap-suggestion-meta {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  }

  .cap-suggestion-tag {
    font-size: 0.65rem; font-weight: 400;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--dust);
    background: rgba(255,255,255,0.05);
    border-radius: 999px;
    padding: 2px 7px;
  }

  .cap-suggestion-tag.gold {
    color: var(--gold);
    background: rgba(184,149,90,0.1);
  }

  .cap-suggestion-existing {
    font-size: 0.65rem; color: #7ec8b0;
    display: flex; align-items: center; gap: 3px;
    background: rgba(74,124,107,0.1);
    border-radius: 999px; padding: 2px 7px;
  }

  .cap-suggestion-edit {
    margin-top: 0.6rem;
    display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
  }

  .cap-edit-input {
    padding: 0.5rem 0.65rem;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem; font-weight: 300;
    outline: none;
    transition: border-color 0.2s;
  }
  .cap-edit-input:focus { border-color: var(--gold); }
  .cap-edit-input::placeholder { color: rgba(200,191,175,0.3); }

  .cap-wardrobe-footer {
    position: sticky; bottom: 0;
    background: rgba(13,11,8,0.95);
    border-top: 0.5px solid rgba(255,255,255,0.07);
    padding: 1rem 1.25rem;
    display: flex; gap: 0.65rem;
  }

  .cap-wardrobe-skip {
    padding: 0.8rem 1.2rem;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px; color: var(--dust);
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: border-color 0.2s;
    white-space: nowrap;
  }
  .cap-wardrobe-skip:hover { border-color: rgba(255,255,255,0.3); }

  .cap-wardrobe-confirm {
    flex: 1; padding: 0.8rem;
    background: var(--gold); border: none;
    border-radius: 8px; color: var(--ink);
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500;
    letter-spacing: 0.05em; text-transform: uppercase;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .cap-wardrobe-confirm:hover:not(:disabled) { opacity: 0.85; }
  .cap-wardrobe-confirm:disabled { opacity: 0.45; cursor: not-allowed; }

  .cap-denied {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 1rem; padding: 2rem; text-align: center;
  }
  .cap-denied-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(192,57,43,0.12);
    border: 1px solid rgba(192,57,43,0.25);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 0.5rem;
  }
  .cap-denied-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 300; color: var(--cream); }
  .cap-denied-body { font-size: 0.82rem; color: var(--dust); line-height: 1.6; max-width: 280px; }
  .cap-denied-btn { margin-top: 0.5rem; padding: 0.75rem 1.5rem; background: var(--gold); border: none; border-radius: 8px; color: var(--ink); font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; }

  .cap-toast {
    position: absolute; bottom: 100px; left: 1rem; right: 1rem; z-index: 60;
    background: rgba(192,57,43,0.9); border-radius: 8px;
    padding: 0.75rem 1rem; font-size: 0.82rem; color: #fff; text-align: center;
    animation: fadeUp 0.25s ease both;
  }

  .cap-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(13,11,8,0.25);
    border-top-color: var(--ink); border-radius: 50%;
    animation: spin 0.65s linear infinite;
  }

  /* ── ADDED: Paywall modal ── */
  .cap-paywall-overlay {
    position: absolute; inset: 0; z-index: 70;
    background: rgba(13,11,8,0.88);
    display: flex; align-items: flex-end;
    animation: fadeIn 0.2s ease both;
  }

  .cap-paywall-sheet {
    width: 100%;
    background: #1a1714;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 1.5rem 1.5rem;
    padding-bottom: max(2rem, env(safe-area-inset-bottom));
    animation: slideUp 0.35s cubic-bezier(0.22,0.68,0,1.2) both;
  }

  .cap-paywall-handle {
    width: 36px; height: 3px;
    background: rgba(255,255,255,0.15);
    border-radius: 999px;
    margin: 0 auto 1.25rem;
  }

  .cap-paywall-icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: rgba(184,149,90,0.12);
    border: 1px solid rgba(184,149,90,0.25);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 0.85rem;
  }

  .cap-paywall-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 300;
    color: var(--cream); margin-bottom: 0.35rem;
  }

  .cap-paywall-sub {
    font-size: 0.8rem; color: var(--dust); line-height: 1.55;
    margin-bottom: 1.25rem;
  }

  .cap-paywall-packages {
    display: flex; flex-direction: column; gap: 0.65rem;
    margin-bottom: 1rem;
  }

  .cap-pkg-card {
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px;
    padding: 0.9rem 1.1rem;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: border-color 0.2s, background 0.2s;
  }
  .cap-pkg-card.selected {
    border-color: var(--gold);
    background: rgba(184,149,90,0.08);
  }
  .cap-pkg-card:hover { border-color: rgba(255,255,255,0.2); }

  .cap-pkg-left { display: flex; flex-direction: column; gap: 3px; }

  .cap-pkg-name {
    font-size: 0.9rem; font-weight: 500; color: var(--cream);
  }

  .cap-pkg-detail {
    font-size: 0.72rem; color: var(--dust); letter-spacing: 0.04em;
  }

  .cap-pkg-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem; font-weight: 300; color: var(--gold);
  }

  .cap-paywall-cta {
    width: 100%; padding: 0.9rem;
    background: var(--gold); border: none;
    border-radius: 10px; color: var(--ink);
    font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 500;
    letter-spacing: 0.05em; text-transform: uppercase;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-bottom: 0.65rem;
  }
  .cap-paywall-cta:hover:not(:disabled) { opacity: 0.88; }
  .cap-paywall-cta:disabled { opacity: 0.5; cursor: not-allowed; }

  .cap-paywall-cancel {
    width: 100%; padding: 0.65rem;
    background: transparent; border: none;
    color: var(--dust); font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_SECONDS = 120;
const RING_R        = 52;
const RING_CIRC     = 2 * Math.PI * RING_R;

const ITEM_CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories", "other"];

// ── ADDED: credit packages matching your Stripe price IDs ──
const PACKAGES = [
  { id: "starter", label: "10 Scans",  detail: "SGD 0.05 · SGD 0.005 per scan", price: "SGD 0.05", priceId: "price_1TkGq63zXc5XMP0pZoeDu7pS", credits: 10 },
  { id: "pro",     label: "50 Scans",  detail: "SGD 0.05 · SGD 0.001 per scan", price: "SGD 0.05", priceId: "price_1TkGq63zXc5XMP0pZoeDu7pS", credits: 50 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

async function compressImage(blob, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(resolve, "image/jpeg", quality);
    };
    img.src = URL.createObjectURL(blob);
  });
}

function tagTypeToCategory(tagType) {
  const map = {
    item: "other", clothing: "other", top: "tops", bottom: "bottoms",
    outerwear: "outerwear", shoes: "shoes", accessory: "accessories",
    dress: "dresses",
  };
  return map[tagType?.toLowerCase()] ?? "other";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Capture() {
  const navigate          = useNavigate();
  const { user }          = useAuth();

  const videoRef          = useRef(null);
  const canvasRef         = useRef(null);
  const streamRef         = useRef(null);
  const timerRef          = useRef(null);
  const flashRef          = useRef(null);

  const [camReady,    setCamReady]    = useState(false);
  const [denied,      setDenied]      = useState(false);
  const [facingMode,  setFacingMode]  = useState("environment");
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [timerActive, setTimerActive] = useState(false);

  const [preview,     setPreview]     = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [caption,     setCaption]     = useState("");

  const [uploadStep,  setUploadStep]  = useState("idle");
  const [toast,       setToast]       = useState("");

  const [showWardrobe,    setShowWardrobe]    = useState(false);
  const [suggestions,     setSuggestions]     = useState([]);
  const [selectedItems,   setSelectedItems]   = useState({});
  const [editFields,      setEditFields]      = useState({});
  const [savingWardrobe,  setSavingWardrobe]  = useState(false);
  const [savedOutfitId,   setSavedOutfitId]   = useState(null);

  // ── ADDED: credits state ──
  const [scanCredits,     setScanCredits]     = useState(null); // null = loading
  const [showPaywall,     setShowPaywall]     = useState(false);
  const [selectedPkg,     setSelectedPkg]     = useState("starter");
  const [checkingOut,     setCheckingOut]     = useState(false);

  // ── ADDED: fetch credits on mount ──
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("scan_credits")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setScanCredits(data?.scan_credits ?? 0));
  }, [user]);

  // ── ADDED: refresh credits when returning from Stripe ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      // Re-fetch credits — webhook may take a second
      setTimeout(() => {
        supabase
          .from("profiles")
          .select("scan_credits")
          .eq("id", user?.id)
          .single()
          .then(({ data }) => {
            setScanCredits(data?.scan_credits ?? 0);
            setToast("Credits added! You're ready to scan.");
            setTimeout(() => setToast(""), 3500);
          });
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      }, 1500);
    }
  }, []);

  // ── Start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing) => {
    const mode = facing ?? facingMode;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(resolve => {
          videoRef.current.onloadedmetadata = resolve;
        });
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("muted", "true");
        await videoRef.current.play().catch(err => {
          if (err.name !== "AbortError") console.error("[Capture] play error:", err);
        });
      }
      setCamReady(true);
      setDenied(false);
      setSecondsLeft(TOTAL_SECONDS);
      setTimerActive(true);
    } catch (err) {
      console.error("[Capture] camera error:", err);
      if (mode === "environment") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await new Promise(resolve => { videoRef.current.onloadedmetadata = resolve; });
            await videoRef.current.play().catch(() => {});
          }
          setCamReady(true);
          setDenied(false);
          setSecondsLeft(TOTAL_SECONDS);
          setTimerActive(true);
          return;
        } catch {
          // fall through to denied
        }
      }
      setDenied(true);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
    };
  }, []);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timerRef.current); setTimerActive(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  // ── Flip camera ───────────────────────────────────────────────────────────
  function handleFlip() {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  }

  // ── Capture photo ─────────────────────────────────────────────────────────
  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!video.videoWidth || !video.videoHeight) {
      setToast("Camera not ready yet. Please wait a moment.");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (flashRef.current) {
      flashRef.current.classList.remove("flashing");
      void flashRef.current.offsetWidth;
      flashRef.current.classList.add("flashing");
    }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) {
        setToast("Failed to capture image. Please try again.");
        setTimeout(() => setToast(""), 3000);
        return;
      }
      setPreviewBlob(blob);
      setPreview(URL.createObjectURL(blob));
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
      setTimerActive(false);
    }, "image/jpeg", 0.95);
  }

  // ── Retake ────────────────────────────────────────────────────────────────
  function handleRetake() {
    setPreview(null);
    setPreviewBlob(null);
    setCaption("");
    setShowWardrobe(false);
    setSuggestions([]);
    setSelectedItems({});
    setEditFields({});
    startCamera(facingMode);
  }

  // ── ADDED: Stripe checkout ────────────────────────────────────────────────
  async function handleBuyCredits() {
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { package_id: selectedPkg },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      setToast("Checkout failed. Please try again.");
      setTimeout(() => setToast(""), 3500);
    } finally {
      setCheckingOut(false);
    }
  }

  // ── Save outfit + analyze ─────────────────────────────────────────────────
  async function handleSave() {
    if (!previewBlob || !user) return;

    // ── ADDED: check credits before uploading ──
    if (scanCredits !== null && scanCredits <= 0) {
      setShowPaywall(true);
      return;
    }

    setUploadStep("uploading");

    try {
      const compressed = await compressImage(previewBlob);
      const ts = Date.now();
      const filePath = `${user.id}/${ts}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("outfit-photos-raw")
        .upload(filePath, compressed, { contentType: "image/jpeg", cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("outfit-photos-raw").getPublicUrl(filePath);
      const imageUrl = urlData?.publicUrl ?? null;

      const { data: newOutfit, error: dbError } = await supabase
        .from("outfits")
        .insert({
          user_id:       user.id,
          raw_image_url: imageUrl,
          caption:       caption.trim() || null,
          captured_at:   new Date().toISOString(),
          visibility:    "private",
        })
        .select("id")
        .single();
      if (dbError) throw dbError;

      setSavedOutfitId(newOutfit.id);
      setUploadStep("analyzing");

      try {
        await supabase.functions.invoke("remove-bg", {
          body: { outfit_id: newOutfit.id, image_url: imageUrl },
        });
      } catch (bgErr) {
        console.warn("[Capture] remove-bg failed:", bgErr);
      }

      try {
        const { data: tagResult, error: tagError } = await supabase.functions.invoke("analyze-outfit", {
          body: { outfit_id: newOutfit.id, image_url: imageUrl },
        });

        // ── ADDED: handle no_credits returned from edge function ──
        if (tagError?.message?.includes("no_credits") || tagResult?.error === "no_credits") {
          setUploadStep("done");
          setShowPaywall(true);
          return;
        }

        // ── ADDED: update local credits count after successful scan ──
        if (tagResult?.credits_remaining !== undefined) {
          setScanCredits(tagResult.credits_remaining);
        }

        if (tagResult?.tags?.length > 0) {
          const itemTags = tagResult.tags.filter(t =>
            ["item", "clothing", "top", "bottom", "outerwear", "shoes", "accessory", "dress"]
              .includes(t.category?.toLowerCase() ?? t.tag_type?.toLowerCase() ?? "")
          );

          if (itemTags.length > 0) {
            const { data: existingItems } = await supabase
              .from("wardrobe_items")
              .select("id, name")
              .eq("user_id", user.id);

            const suggestions = itemTags.slice(0, 6).map(t => {
              const tagName = t.tag_value ?? t.tag ?? "";
              const existingMatch = (existingItems ?? []).find(
                i => i.name.toLowerCase() === tagName.toLowerCase()
              );
              return {
                name:       tagName,
                category:   tagTypeToCategory(t.category ?? t.tag_type),
                confidence: t.confidence ?? 0.5,
                isNew:      !existingMatch,
                existingId: existingMatch?.id ?? null,
              };
            });

            setSuggestions(suggestions);
            const preSelected = {};
            const preEdit = {};
            suggestions.forEach((s, i) => {
              preSelected[i] = true;
              preEdit[i] = { name: s.name, category: s.category };
            });
            setSelectedItems(preSelected);
            setEditFields(preEdit);
            setUploadStep("done");
            setShowWardrobe(true);
            return;
          }
        }
      } catch (aiErr) {
        console.warn("[Capture] analyze-outfit failed:", aiErr);
      }

      setUploadStep("done");
      navigate("/calendar");

    } catch (err) {
      console.error("[Capture] save error:", err);
      setToast(err.message ?? "Upload failed. Please try again.");
      setTimeout(() => setToast(""), 4000);
      setUploadStep("idle");
    }
  }

  // ── Confirm wardrobe items ─────────────────────────────────────────────────
  async function handleConfirmWardrobe() {
    setSavingWardrobe(true);
    const selectedSuggestions = suggestions.filter((_, i) => selectedItems[i]);

    for (const suggestion of selectedSuggestions) {
      const idx = suggestions.indexOf(suggestion);
      const fields = editFields[idx] ?? {};
      const name     = fields.name     || suggestion.name;
      const category = fields.category || suggestion.category;

      if (suggestion.isNew) {
        const { data: newItem } = await supabase
          .from("wardrobe_items")
          .insert({ user_id: user.id, name, category, wear_count: 1 })
          .select("id")
          .single();

        if (newItem && savedOutfitId) {
          await supabase.from("outfit_wardrobe_items").insert({
            outfit_id: savedOutfitId, wardrobe_item_id: newItem.id,
          }).catch(() => {});
        }
      } else if (suggestion.existingId) {
        await supabase.rpc("increment_wear_count", { item_id: suggestion.existingId })
          .catch(async () => {
            const { data: item } = await supabase
              .from("wardrobe_items").select("wear_count").eq("id", suggestion.existingId).single();
            await supabase.from("wardrobe_items")
              .update({ wear_count: (item?.wear_count ?? 0) + 1 })
              .eq("id", suggestion.existingId);
          });

        if (savedOutfitId) {
          await supabase.from("outfit_wardrobe_items").insert({
            outfit_id: savedOutfitId, wardrobe_item_id: suggestion.existingId,
          }).catch(() => {});
        }
      }
    }

    setSavingWardrobe(false);
    navigate("/calendar");
  }

  function toggleItem(idx) {
    setSelectedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  }

  function updateEditField(idx, field, value) {
    setEditFields(prev => ({ ...prev, [idx]: { ...(prev[idx] ?? {}), [field]: value } }));
  }

  const progress   = secondsLeft / TOTAL_SECONDS;
  const dashOffset = RING_CIRC * (1 - progress);
  const urgent     = secondsLeft <= 30;
  const isUploading = uploadStep === "uploading" || uploadStep === "analyzing";
  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  return (
    <>
      <style>{STYLES}</style>
      <div className="cap-root">

        {/* ── Permission denied ── */}
        {denied && (
          <div className="cap-denied">
            <div className="cap-denied-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9.5" stroke="#e07070" strokeWidth="1.3"/>
                <path d="M7 7l8 8M15 7l-8 8" stroke="#e07070" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="cap-denied-title">Camera access needed</div>
            <p className="cap-denied-body">Please allow camera access in your browser settings and try again.</p>
            <button className="cap-denied-btn" onClick={() => startCamera()}>Try again</button>
          </div>
        )}

        {/* ── Camera view ── */}
        {!denied && !preview && (
          <>
            <div className="cap-header">
              <span className="cap-header-title">Today's outfit</span>

              {/* ── ADDED: credits badge ── */}
              {scanCredits !== null && (
                <button
                  className={`cap-credits-badge${scanCredits <= 2 ? " low" : ""}`}
                  onClick={() => setShowPaywall(true)}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M6 3.5v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {scanCredits} scan{scanCredits !== 1 ? "s" : ""} left
                </button>
              )}

              <button className="cap-close-btn" onClick={() => navigate("/feed")} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {camReady && (
              <button className="cap-flip-btn" onClick={handleFlip} aria-label="Flip camera">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </button>
            )}

            <div className="cap-viewport">
              <video
                ref={videoRef}
                className="cap-video"
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />
              <canvas ref={canvasRef} className="cap-canvas" />
              <div ref={flashRef} className="cap-flash" />
              <div className="cap-viewfinder">
                <div className="cap-bracket tl" />
                <div className="cap-bracket tr" />
                <div className="cap-bracket bl" />
                <div className="cap-bracket br" />
              </div>
              <div className={`cap-timer-ring${(secondsLeft <= 60 || urgent) && timerActive ? " visible" : ""}`}>
                <svg className="cap-ring-svg" width="120" height="120" viewBox="0 0 120 120">
                  <circle className="cap-ring-track" cx="60" cy="60" r={RING_R} />
                  <circle
                    className={`cap-ring-progress${urgent ? " urgent" : ""}`}
                    cx="60" cy="60" r={RING_R}
                    strokeDasharray={RING_CIRC}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <div className={`cap-timer-text${urgent ? " urgent" : ""}`}>{fmt(secondsLeft)}</div>
              </div>
            </div>

            <div className="cap-controls">
              <span className="cap-hint">
                {secondsLeft === 0 ? "Time's up — capture now" : timerActive ? `${fmt(secondsLeft)} remaining` : "Tap to capture"}
              </span>
              <div className="cap-shutter-wrap">
                <button className="cap-shutter" onClick={handleCapture} disabled={!camReady} aria-label="Take photo" />
              </div>
            </div>
          </>
        )}

        {/* ── Preview / confirm ── */}
        {preview && !showWardrobe && (
          <div className="cap-preview-root">
            <img src={preview} alt="Captured outfit" className="cap-preview-img" />
            <div className="cap-preview-controls">
              <textarea
                className="cap-caption-input"
                placeholder="Add a caption… (optional)"
                rows={2}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                maxLength={280}
              />
              <div className="cap-preview-btns">
                <button className="cap-btn-retake" onClick={handleRetake} disabled={isUploading}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
                  </svg>
                  Retake
                </button>
                <button className="cap-btn-save" onClick={handleSave} disabled={isUploading}>
                  {isUploading ? (
                    <><span className="cap-spinner" style={{ borderTopColor: "var(--ink)" }} />
                    {uploadStep === "uploading" ? "Saving…" : "Analysing…"}</>
                  ) : "Save outfit"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Uploading overlay ── */}
        {isUploading && (
          <div className="cap-uploading">
            <div className="cap-upload-spinner" />
            <div className="cap-upload-label">
              {uploadStep === "uploading" ? "Saving your outfit…" : "Analysing with AI…"}
            </div>
            <div className="cap-upload-sub">
              {uploadStep === "analyzing" ? "Detecting wardrobe items" : "Compressing image"}
            </div>
          </div>
        )}

        {/* ── Wardrobe suggestion screen ── */}
        {showWardrobe && (
          <div className="cap-wardrobe-root">
            <div className="cap-wardrobe-header">
              <div className="cap-wardrobe-title">We spotted these items</div>
              <div className="cap-wardrobe-sub">
                Select the items you wore today to add or update them in your wardrobe.
              </div>
            </div>

            <div className="cap-wardrobe-body">
              <div className="cap-wardrobe-section-label">
                {suggestions.length} item{suggestions.length !== 1 ? "s" : ""} detected
              </div>

              {suggestions.map((s, i) => {
                const isSelected = !!selectedItems[i];
                const fields = editFields[i] ?? { name: s.name, category: s.category };
                return (
                  <div
                    key={i}
                    className={`cap-suggestion-card${isSelected ? " selected" : ""}`}
                    onClick={() => toggleItem(i)}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="cap-suggestion-check">
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="cap-suggestion-info">
                      <div className="cap-suggestion-name">{fields.name || s.name}</div>
                      <div className="cap-suggestion-meta">
                        <span className="cap-suggestion-tag gold">{fields.category || s.category}</span>
                        <span className="cap-suggestion-tag">{Math.round(s.confidence * 100)}% match</span>
                        {!s.isNew && (
                          <span className="cap-suggestion-existing">
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="#7ec8b0" strokeWidth="1.6" strokeLinecap="round"/>
                            </svg>
                            In wardrobe
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="cap-suggestion-edit" onClick={e => e.stopPropagation()}>
                          <input
                            className="cap-edit-input"
                            value={fields.name}
                            onChange={e => updateEditField(i, "name", e.target.value)}
                            placeholder="Item name"
                            maxLength={60}
                          />
                          <select
                            className="cap-edit-input"
                            value={fields.category}
                            onChange={e => updateEditField(i, "category", e.target.value)}
                            style={{ cursor: "pointer" }}
                          >
                            {ITEM_CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cap-wardrobe-footer">
              <button className="cap-wardrobe-skip" onClick={() => navigate("/calendar")}>Skip</button>
              <button
                className="cap-wardrobe-confirm"
                onClick={handleConfirmWardrobe}
                disabled={savingWardrobe || selectedCount === 0}
              >
                {savingWardrobe
                  ? <><span className="cap-spinner" /> Saving…</>
                  : `Add ${selectedCount} item${selectedCount !== 1 ? "s" : ""} to wardrobe`
                }
              </button>
            </div>
          </div>
        )}

        {/* ── ADDED: Paywall modal ── */}
        {showPaywall && (
          <div className="cap-paywall-overlay" onClick={() => setShowPaywall(false)}>
            <div className="cap-paywall-sheet" onClick={e => e.stopPropagation()}>
              <div className="cap-paywall-handle" />
              <div className="cap-paywall-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="cap-paywall-title">Top up scan credits</div>
              <div className="cap-paywall-sub">
                AI outfit analysis uses 1 credit per scan. You currently have <strong style={{color:"var(--cream)"}}>{scanCredits ?? 0} credits</strong> remaining.
              </div>

              <div className="cap-paywall-packages">
                {PACKAGES.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`cap-pkg-card${selectedPkg === pkg.id ? " selected" : ""}`}
                    onClick={() => setSelectedPkg(pkg.id)}
                  >
                    <div className="cap-pkg-left">
                      <div className="cap-pkg-name">{pkg.label}</div>
                      <div className="cap-pkg-detail">{pkg.detail}</div>
                    </div>
                    <div className="cap-pkg-price">{pkg.price}</div>
                  </div>
                ))}
              </div>

              <button className="cap-paywall-cta" onClick={handleBuyCredits} disabled={checkingOut}>
                {checkingOut
                  ? <><span className="cap-spinner" /> Redirecting…</>
                  : "Buy credits"}
              </button>
              <button className="cap-paywall-cancel" onClick={() => setShowPaywall(false)}>
                Maybe later
              </button>
            </div>
          </div>
        )}

        {toast && <div className="cap-toast">{toast}</div>}
      </div>
    </>
  );
}