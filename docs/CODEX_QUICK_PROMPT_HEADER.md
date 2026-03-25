# Codex Quick Prompt Header

Use this at the top of every Codex request.

---

Follow the workflow and constraints in docs/CODEX_PR_PLAYBOOK.md for this task.

Key rules:
- Keep scope tightly limited to the requested change
- Do not refactor unrelated code
- Do not rename unrelated functions or files
- Reuse existing systems where possible (do not duplicate logic)
- Keep the patch small and local

Mandatory:
- Define branch name and PR title
- Clearly state strict scope (what can and cannot change)
- Define expected behaviour in plain language
- Include validation steps
- Update version badge in index.html
- Update docs if behaviour/structure changes (or explicitly state no changes)

End requirement:
- Provide summary of files changed and confirm no unrelated behaviour was modified

If anything is unclear:
→ choose the smallest safe implementation that satisfies the requirement without affecting other systems
