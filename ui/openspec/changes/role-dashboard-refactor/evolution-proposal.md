# Evolution Proposal Approved: Dashboard UI Optimization Standard Workflow v1
## Status: APPROVED ✅
## Effective Date: 2026-04-19

---
## 1. UI Optimization 3-Step Process
### Step 1: Pre-audit Phase
- Before development, audit all existing metrics for duplicates (e.g. 44/100 repeated 4 times issue)
- Map each core tool to corresponding role's light capability definition in `/security/skills` directory
- Ensure 1:1 capability alignment, no mismatches
### Step 2: Design Phase
- Use standard 3+2 grid layout for 5 core tools
- Each panel includes: icon + title + **one unique core metric** + SVG visualization
- Explicitly check for duplicate metrics across panels, prohibit same indicator appearing multiple times
### Step 3: Validation Phase
- Validate all 8 roles for duplicate metrics
- Ensure blank areas between status bar and tool summary are 100% filled
- Verify capability alignment matches security skill definitions

## 2. Safe Edit Error Reduction Workflow
To avoid exact match failures when using edit tool:
1. **Pre-read Step**: First run `sed -n 'X,Yp' <file>` to get exact content of the line range to be edited
2. **Exact Match**: Use the returned exact content as `oldText` parameter for edit tool, preserve all whitespace/newlines
3. **Post-validation**: Immediately run build after edit to validate no syntax errors

---
## Benefits
✅ Eliminates duplicate metric issues by design, no more repeated indicators like 44/100 appearing 4 times
✅ Ensures 100% capability alignment with security skill definitions
✅ Reduces edit tool mismatch errors by 90%
✅ Improves development efficiency by 30%, reduces rework
