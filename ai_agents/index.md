# Use with AI agents

OmniPackage ships an agent skill so AI coding assistants can scaffold, fill, and debug your packaging.

## Claude Code

Install the skill as a plugin. It triggers on packaging tasks and updates with the tool:

```text
/plugin marketplace add omnipackage/omnipackage-rs
/plugin install omnipackage@omnipackage
```

CLI equivalent: `claude plugin marketplace add omnipackage/omnipackage-rs && claude plugin install omnipackage@omnipackage`. Refresh later with `claude plugin update omnipackage@omnipackage`.

## Any other agent

Point it at the full documentation in one file:

- <https://docs.omnipackage.org/llms-full.txt> — the whole site as a single Markdown file
- <https://docs.omnipackage.org/llms.txt> — a short index of the pages

Both follow the [llms.txt](https://llmstxt.org/) convention; paste the URL into your agent or `curl` it in.
