# ChurchFlow Dashboard — Design System Blueprint

## Overview
**ChurchFlow Dashboard** is the management hub for **RCCG Everflourishing Mega Sanctuary (Ogun Province 27)**.
This design system defines the visual language, OKLCH color architecture, motion physics, responsive layout grid, and component contracts.

---

## 1. Color System (OKLCH Color Space)

Using perceptual OKLCH color space ensures uniform lightness across dark surfaces, zero hue-drift on gold gradients, and AAA contrast ratios for legibility.

### Theme Palettes

#### Theme 1: Royal Navy & Gold (`royal-navy`)
- `--bg-canvas`: `oklch(0.13 0.03 260)`
- `--surface-card`: `oklch(0.17 0.04 265 / 0.70)`
- `--surface-border`: `oklch(0.78 0.16 75 / 0.18)`
- `--accent-gold`: `oklch(0.78 0.16 75)`
- `--accent-gold-light`: `oklch(0.88 0.12 85)`
- `--text-primary`: `oklch(0.98 0.00 0)`
- `--text-secondary`: `oklch(0.75 0.02 260)`
- `--glow-accent`: `oklch(0.78 0.16 75 / 0.15)`

#### Theme 2: Celestial Purple & Gold (`celestial-purple`)
- `--bg-canvas`: `oklch(0.12 0.04 295)`
- `--surface-card`: `oklch(0.16 0.06 295 / 0.70)`
- `--surface-border`: `oklch(0.82 0.17 80 / 0.20)`
- `--accent-gold`: `oklch(0.82 0.17 80)`
- `--accent-gold-light`: `oklch(0.90 0.12 85)`
- `--text-primary`: `oklch(0.98 0.00 0)`
- `--text-secondary`: `oklch(0.78 0.03 295)`
- `--glow-accent`: `oklch(0.82 0.17 80 / 0.18)`

#### Theme 3: Emerald Sanctuary & Gold (`emerald-sanctuary`)
- `--bg-canvas`: `oklch(0.12 0.04 165)`
- `--surface-card`: `oklch(0.16 0.05 165 / 0.70)`
- `--surface-border`: `oklch(0.80 0.15 85 / 0.20)`
- `--accent-gold`: `oklch(0.80 0.15 85)`
- `--accent-gold-light`: `oklch(0.89 0.11 90)`
- `--text-primary`: `oklch(0.98 0.00 0)`
- `--text-secondary`: `oklch(0.76 0.03 165)`
- `--glow-accent`: `oklch(0.80 0.15 85 / 0.18)`

#### Theme 4: Obsidian Gold (`obsidian-gold`)
- `--bg-canvas`: `oklch(0.09 0.01 260)`
- `--surface-card`: `oklch(0.13 0.02 260 / 0.75)`
- `--surface-border`: `oklch(0.84 0.18 78 / 0.22)`
- `--accent-gold`: `oklch(0.84 0.18 78)`
- `--accent-gold-light`: `oklch(0.92 0.12 85)`
- `--text-primary`: `oklch(0.99 0.00 0)`
- `--text-secondary`: `oklch(0.72 0.01 260)`
- `--glow-accent`: `oklch(0.84 0.18 78 / 0.20)`

---

## 2. Motion Architecture (Emil Kowalski Framework)

### Core Rules
1. **Physical Tactile Feedback**: Every button, link, and interactive item scales down to `scale(0.97)` on `:active` with `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1)`.
2. **Never Animate from scale(0)**: Entrances start from `scale(0.96)` with `opacity: 0`.
3. **Custom Easings**:
   - `--ease-out`: `cubic-bezier(0.23, 1, 0.32, 1)` (UI fast enter)
   - `--ease-drawer`: `cubic-bezier(0.32, 0.72, 0, 1)` (Drawers & sheets)
   - `--ease-in-out`: `cubic-bezier(0.77, 0, 0.175, 1)` (On-screen movement)
4. **Origin-Aware Transforms**: Popovers scale relative to their trigger element using `transform-origin: top right`.
5. **Touch-Device Guard**: Hover animations are encapsulated in `@media (hover: hover) and (pointer: fine)`.
6. **Reduced Motion**: Full fallback via `@media (prefers-reduced-motion: reduce)`.

---

## 3. Typography & Hierarchy

- **Display Headings**: `Fraunces` (Serif display, refined sanctuary aesthetic)
- **Body Text**: `IBM Plex Sans` (Technical clarity & high legibility)
- **Scale**:
  - `Display Large`: 32px / 2.25rem (Hero Welcome)
  - `Heading 1`: 24px / 1.5rem (Page Titles)
  - `Heading 2`: 18px / 1.125rem (Section Headers)
  - `Body`: 14px / 0.875rem (Standard content)
  - `Small`: 12px / 0.75rem (Labels, table headers)
  - `Micro`: 10px / 0.625rem (Badges, subtext)

---

## 4. Glassmorphism & Elevation

- **`glass-card`**: `backdrop-filter: blur(16px); border: 1px solid var(--surface-border); border-radius: 20px;`
- **`btn-gold`**: Linear gradient from gold highlight to deep gold, active press `scale(0.97)`.
- **`btn-glass`**: Semi-transparent border fill, hover lightens background, active press `scale(0.97)`.
- **`stat-card`**: Top linear highlight border, subtle background radial glow on hover.

---

## 5. Accessibility Standards
- High contrast outline on `:focus-visible` (`2px solid var(--accent-gold)` with `2px` offset).
- Semantic HTML tags (`<header>`, `<aside>`, `<main>`, `<nav>`, `<article>`).
- Keyboard navigable popovers and mobile drawer.
