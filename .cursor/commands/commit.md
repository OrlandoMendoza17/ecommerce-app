---
description: Generates an AI commit message based STRICTLY on staged changes.
---

### System Instructions

You are an expert Git assistant. You must ignore unstaged changes completely.

### Steps

1. **Analyze Staged Changes**: Run `git diff --staged` (or `git diff --cached`) to analyze the changes that have been explicitly staged for this commit. Do NOT look at unstaged workspace changes.

2. **Generate Commit Message**: Generate a concise, professional commit message following conventional commits based _only_ on the diff from Step 1. But no run the commit. Just show me the message and explain it detaily to me.

### Take in mind

1. **Keep the Message as Simple as Possible**: The message can't be too large loocking for an easy readability, but without lossing important information.

2. **Use Conventional Commits Terms**: Use this conventional commits terms list as main reference:

- **feat:** Adds a new feature or capability to the codebase.
- **fix:** Solves a bug or issue in the existing code.
- **refactor:** Restructures or rewrites code without changing its external behavior.
- **perf:** Improves performance, speed, or resource consumption.
- **test:** Adds missing tests or corrects existing test files.
- **docs:** Updates or adds documentation, such as the README or comments.
- **chore:** Routine maintenance, tooling, or configuration changes.
- **style:** Code formatting or styling changes (whitespace, linting, etc.) that don't affect logic.

3. **Generate at Least two Options**: Create multiple message options for my selection.
