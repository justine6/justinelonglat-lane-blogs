
<!-- ========================================================= -->
<!-- CI / CD & Site Badges                                     -->
<!-- ========================================================= -->

[![Build & Deploy — Blog](https://github.com/justine6/jutellane-blogs/actions/workflows/blog.yml/badge.svg?branch=main)](https://github.com/justine6/jutellane-blogs/actions/workflows/blog.yml)
[![Live Site](https://img.shields.io/website?url=https%3A%2F%2Fjustine6.github.io%2Fjutellane-blogs)](https://justine6.github.io/jutellane-blogs/)
[![Last Commit](https://img.shields.io/github/last-commit/justine6/jutellane-blogs/main)](https://github.com/justine6/jutellane-blogs/commits/main)
[![RSS](https://img.shields.io/badge/RSS-feed.xml-orange)](https://justine6.github.io/jutellane-blogs/feed.xml)

**Live blog:** https://justine6.github.io/jutellane-blogs/  
**Projects:** https://www.justinelonglat-lane.com/projects  

---

# 🧩 Justine Longla T. — Automated Publishing & Validation Platform

This repository powers a **production-grade content platform** built with the
same discipline applied to modern CI/CD systems.

Posts, metadata, routes, RSS feeds, and static artifacts are **automated, validated,
and deployed deterministically** — with failures halting release.

> This is *content as code*, enforced end-to-end.

---

## Why This Exists

Most content platforms rely on:
- manual steps
- implicit state
- fragile routing
- unvalidated outputs

That approach does not scale and silently breaks trust.

This platform applies **engineering discipline to publishing**:

- Deterministic structure
- Mandatory validation gates
- Reproducible outputs
- Git-backed auditability

---

## Platform Architecture

<p align="center">
  <img
    src="./assets/diagrams/automated-publishing-pipeline.svg"
    alt="Automated Publishing & Validation Pipeline"
    width="900"
  />
</p>

**Lifecycle:**  
Draft → Validate → Build → Release → Public Platform

---

## Core System Components

### 1. Drafts (Source of Truth)

- Markdown / MDX content
- Stored in Git
- No hidden state
- No manual publishing

Git is the **single source of truth**.

---

### 2. Post Creation & Control Plane

PowerShell tooling enforces:

- Directory structure
- Naming conventions
- Metadata completeness
- Stable, predictable output paths

Every post begins from a **known baseline**.

---

### 3. Validation Layer (Release Gate)

Before publishing, the pipeline validates:

- Internal links and routes
- Generated HTML output
- RSS integrity
- Sitemap correctness
- Stable URLs

**Any failure halts the pipeline immediately.**

Fail fast. Fail loud. Fix once.

---

### 4. Public Platform

Only verified artifacts are released:

- Blog grid & individual posts
- Tags and indexes
- Docs pages
- Project links
- RSS consumers

All outputs are static, predictable, and cache-safe.

---

## CI / CD Workflow Overview

The GitHub Actions pipeline is split into two stages:

### Stage 1 — Fix · Validate · Build

- Normalize front matter
- Validate structure & metadata
- Generate:
  - `posts.json`
  - `feed.xml`
  - `sitemap.xml`
  - `tags/`
- Upload verified build artifacts

### Stage 2 — Deploy

- Publish **only validated artifacts**
- Deploy to GitHub Pages
- No partial or unverified releases

---

## Safe Metadata Updates via Pull Requests

To avoid non–fast-forward errors and unsafe pushes:

- Metadata updates are committed via **automated PRs**
- Powered by `peter-evans/create-pull-request`

Generated files are never pushed blindly to `main`.

### Why This Matters

- Clean history
- Auditable changes
- Predictable CI behavior
- Zero manual intervention

---

## Developer Utilities (PowerShell)

### Safe Rebase & Push

Handles rejected pushes safely and consistently.

```powershell
pwsh ./tools/Safe-Rebase.ps1
