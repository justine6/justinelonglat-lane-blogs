---
title: "When a Single Warning Turned Into a Docs-as-Code Masterclass"
description: "How a stubborn html-validate warning about a raw '>' pushed a docs pipeline to production-grade rigor."
date: 2026-01-06
tags:
  - devops
  - documentation
  - ci/cd
  - html
  - automation
  - powershell
  - bash
slug: docs-pipeline-warning-to-masterclass
---

I spent this week refining the documentation pipeline for one of my projects —  
the kind of work that usually feels quiet and invisible, but ends up supporting everything else.

The goal sounded simple: lint Markdown, format everything consistently, validate links,
validate generated HTML, and make sure the pipeline fails when something is wrong.

In other words, treat **documentation with the same discipline as production code**.

Everything worked beautifully… except for one stubborn warning:

Because that’s DevOps.
