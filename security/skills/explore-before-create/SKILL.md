---
name: explore-before-create
description: "Before building new features, explore existing codebase structure to discover what's already implemented and avoid redundant work."
---

# Explore Before Creating New Files

A key workflow pattern for platform evolution: **always explore existing structure before attempting to create new files**. This avoids redundant work and reveals gaps that need enhancement.

## Workflow

1. **Scan the existing directory structure**
   - Use `ls -la` or file exploration tools to understand what's already there
   - Look at file organization, naming conventions, and existing patterns

2. **Identify existing implementations**
   - Check if requested features are already built (even partially)
   - Look for similar modules that might be templates or provide patterns
   - Review existing configuration files and documentation

3. **Compare against requirements**
   - List what's already built vs. what's actually needed
   - Focus effort on genuine gaps rather than reimplementing existing code

4. **Proceed with informed creation**
   - Now that you understand the landscape, create or modify files
   - Use discovered patterns from existing codebase
   - Build on top of existing infrastructure where appropriate

## When to Apply

This pattern is especially valuable when:
- Asked to add multiple new modules to an existing platform
- Building on a complex framework with many pre-existing components
- Working in unfamiliar territory within a familiar codebase
- Task involves "evolution" or "extension" of existing systems

## Example Investigation Sequence

```
1. List root directory → understand project structure
2. Explore key subdirectories → find existing modules
3. Check module implementations → verify what's built
4. Cross-reference with requirements → identify real gaps
5. Create only what's missing → avoid redundancy
```

By following this pattern, you avoid wasted effort creating files that already exist and can focus on genuine value-add work.