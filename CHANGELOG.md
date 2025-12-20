# Changelog

All notable changes to this project are documented in this file.

This project follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`) and documents
changes with an emphasis on **platform stability, automation maturity, and
production-readiness**.

---

## [v1.2.0] - 2025-01-24
### Added
- Fully automated post creation and publishing workflow driven by scripted tooling.
- Validation gates for internal links, generated HTML output, and RSS feeds.
- Reproducible and repeatable content generation across environments.

### Changed
- Unified header and navigation behavior across Home, Blog Posts, Docs, and Projects.
- Aligned project links to canonical main-site URLs to prevent cross-site drift.
- Hardened deployment configuration to support predictable CI/CD execution.

### Fixed
- Restored and stabilized blog and project card/grid routing.
- Eliminated edge cases causing empty or unreachable project/post views.

### Platform & Delivery
- Established a production-grade publishing pipeline with deterministic outcomes.
- Elevated the blog platform from manual publishing to automated, validated delivery.

---

## [v1.1.0] - 2025-01-15
### Added
- Unified branding across the blog ecosystem to match the **JustineLonglaT-Lane** platform identity.
- Consistent calls-to-action (CTAs) linking to Docs, Resume, Brochure, and the main site.
- Standardized content and site structure (`blog/`, `docs/`, `posts/`, `projects/`) for a clearer publishing workflow.

### Changed
- Refined layout and typography to improve readability and visual consistency.
- Updated metadata, OpenGraph configuration, and site-wide section headers.
- Streamlined navigation paths to prevent cross-site fragmentation and unpredictable routing.

### Fixed
- Removed deprecated and duplicated `.bak` files, unused assets, and stale backup folders.
- Corrected broken links that previously generated 404 errors across blog and docs pages.
- Resolved nested repository issues by restoring a clean Git structure and workspace state.

### Maintenance
- Performed repository hygiene using controlled cleanup (`git clean -fd`).
- Ensured alignment between local repository layout and GitHub remote structure.
- Prepared the platform for automated releases and future CI/CD enforcement.

---

## [v1.0.0] - Initial Release
### Added
- Initial blog and documentation publishing foundation.
- Static site generation for posts, projects, and supporting pages.
- Baseline navigation and content layout.

### Notes
- This release established the foundation upon which subsequent stabilization,
  branding, and automation improvements were built.
