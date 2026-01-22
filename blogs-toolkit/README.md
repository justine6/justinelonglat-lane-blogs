# JTL Blogs Toolkit (blogs-toolkit)

A PowerShell toolkit that acts like an internal “API” for the JustineLonglaT-Lane Blogs site:
post scaffolding, publishing, metadata generation, listings/tags, validation guardrails, and safe ops workflows.

The **public interface** is `blogs-toolkit/run.ps1`.

---

## Quick start (the only commands you need to remember)

From the repo root:

```powershell
# Create a new post
pwsh ./blogs-toolkit/run.ps1 new -Title '...' -Tags tag1,tag2 -Summary '...'

# Publish draft → canonical structure
pwsh ./blogs-toolkit/run.ps1 publish

# Build (default)
pwsh ./blogs-toolkit/run.ps1 build

# Build (override site URL used in metadata/canonical URLs)
pwsh ./blogs-toolkit/run.ps1 build -SiteUrl 'https://blogs.justinelonglat-lane.com'

# Build (override posts root)
pwsh ./blogs-toolkit/run.ps1 build -PostsRoot '.\posts'

# Build (skip metadata regeneration)
pwsh ./blogs-toolkit/run.ps1 build -SkipMetadata

# Serve locally
pwsh ./blogs-toolkit/run.ps1 serve

# Validate guardrails (pre-tag / pre-deploy)
pwsh ./blogs-toolkit/run.ps1 validate

# Safe rebase helper
pwsh ./blogs-toolkit/run.ps1 rebase-safe

# Repair/suture workflow (repo recovery / harmonization utility)
pwsh ./blogs-toolkit/run.ps1 suture
