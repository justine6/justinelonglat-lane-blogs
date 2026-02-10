---
title: Reproducible Static Blog Guardrails
date: 2026-02-08
description: I turned a static blog into a reproducible engineering system with deterministic builds, curated index pinning, and a canonical CSS layer to eliminate cascade drift.
tags:
  - devops
  - reproducibility
  - ci/cd
  - static-sites
  - guardrails
  - automation
  - build-contract
  - css
---

# Reproducible Static Blog Guardrails

I turned a static blog into a reproducible engineering system with **deterministic builds**, **curated index pinning**, and a **canonical CSS layer** to eliminate cascade drift.

This post is a case study of how a “simple static site” becomes a real engineering system when you treat **output correctness** as a contract — not a hope.

---

## The failure mode: static sites drift quietly

Static sites can degrade without any obvious single “bug”:

- A small CSS block gets duplicated, and the cascade starts behaving differently.
- A generator rewrites an index page you meant to hand-curate.
- A stray `<style>` tag sneaks into a stylesheet (often from copy/paste), and now you have HTML inside CSS.
- A build produces output that looks fine locally — but differs in CI or on Vercel.

These are *drift problems*. They’re hard to debug because they’re not always syntax errors.
They’re usually *invariants* being violated.

So I added guardrails.

---

## Guardrail #1 — “No HTML inside CSS”

### The problem
CSS is not HTML. If a `<style>` tag ends up inside `main.css`, it can:

- break parsers and minifiers,
- trigger weird runtime behavior,
- create “it works on my machine” differences.

Sometimes it happens because of copied snippets that include `<style>...</style>`.

### The solution
A prebuild script that:

1) strips CSS comments (so `<style>` inside comments doesn’t false-positive),
2) fails the build if real `<style>` tags exist.

**Script:** `scripts/check-css.mjs`

---

## Guardrail #2 — Canonical CSS layer to stop cascade drift

### The problem
CSS drift is real: the same selector appears in multiple places, and whichever one is last wins.
That makes layout behavior unstable over time, especially for “core UI primitives” like post cards.

### The solution
I introduced a **canonical posts grid block** that must:

- exist exactly once,
- sit at the **very bottom** of `public/assets/css/main.css`,
- end with a single marker:

```css
/* JLT_CANONICAL_POSTS_GRID_V1 */
