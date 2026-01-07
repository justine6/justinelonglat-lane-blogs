---
title: "Shipping Content Like Code"
description: "Why my blog now ships through the same CI/CD pipeline as my applications — and what that unlocks."
date: 2025-12-20
tags:
  - devops
  - cicd
  - content-automation
  - platform-engineering
---

Every change you see on this blog now moves through a proper pipeline.

No more “quick edits in production”. Posts are written as Markdown, tracked in Git, validated locally, and then shipped through the same CI/CD flow that I use for real applications.

That discipline buys me a few things:

- **Reproducible builds** – I can re-generate the entire blog from source at any time.
- **Automated checks** – internal links, HTML structure, RSS, and sitemap get validated on every run.
- **Versioned releases** – content goes out in tagged releases (v1.3.0, v1.4.0, …), not invisible edits.

It might look like “just content”, but I treat it like any other production system:
if users depend on it, it deserves reliability.

This December post is the bridge between the old way of publishing and the new pipeline-driven approach you’re seeing now.
