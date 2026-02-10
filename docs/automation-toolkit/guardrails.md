## Build Guardrails (Blogs)

These scripts enforce deterministic behavior and prevent common “static site drift” issues.

### 1) CSS guardrail — forbid `<style>` tags inside main.css
**File:** `scripts/check-css.mjs`  
**Checks:** `public/assets/css/main.css`  
**Why:** `<style>` inside a `.css` file is almost always a paste accident that can destabilize parsing and styling.

**Run:**
- `node scripts/check-css.mjs`

---

### 2) Canonical posts grid guardrail — enforce bottom-of-file marker
**File:** `scripts/check-canonical-grid.mjs`  
**Marker:** `/* JLT_CANONICAL_POSTS_GRID_V1 */`  
**Rule:** marker must exist exactly once and be the last non-whitespace line.

**Run:**
- `node scripts/check-canonical-grid.mjs`
- Debug mode: `DEBUG=1 node scripts/check-canonical-grid.mjs`

---

### 3) Local release contract — deploy check
**Command:** `npm run deploy:check`  
Runs:
- CSS guardrails
- generator
- Vercel static output assembly
- output verification

If this passes locally, the deployment should be deterministic.
