---
title: "Stop CSS Chaos: Load Order, Modules, and a Reusable Hero Pattern"
date: 2026-01-08
tags: ["css", "docs", "static-sites", "frontend", "architecture"]
---

## The problem
If your site has multiple CSS files, it’s easy to end up with:
- duplicated selectors
- conflicting hero styles
- changes that “randomly” stop working

The root cause is almost always **unclear ownership** (what lives where) and **incorrect load order**.

---

## The rule that fixes 90% of CSS problems
**Base system first → page modules last**

That means:

1. `styles.css` (system base)
2. `main.css` (page modules / overrides)

Later CSS wins when selectors match.

### Correct `<head>`
```html
<link rel="stylesheet" href="/styles.css" />
<link rel="stylesheet" href="/assets/css/main.css" />
