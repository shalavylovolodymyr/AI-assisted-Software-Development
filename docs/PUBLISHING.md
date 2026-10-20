# Manual GitHub publication

No repository was pushed and no GitHub account or cloud resource was created.
Review source, proposed ADRs, validation limits and `.gitignore` first. Run the checks
in README. Install Docker and run `docker compose up --build` before claiming the
container acceptance criterion. Check the site, health, seed and persistence after restart.

Create an **empty** repository called `signal` in your own GitHub account using the
GitHub website. Do not initialize a second README there. Then, from this project root:

```bash
git init -b main
git add .
git diff --cached --stat
git diff --cached --check
git status --short
```

Confirm `.env`, `.local`, `.venv`, `node_modules`, test reports and credentials are absent.
Demo database credentials and fictional identities are intentionally documented.
After your review, replace `YOUR_GITHUB_USERNAME` below:

```bash
git commit -m "Build SIGNAL capstone application"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/signal.git
git push -u origin main
```

These publication commands are instructions for the owner and were not executed by Codex.
If this folder already has Git metadata when you follow them, retain it and inspect the
existing branch/remotes before initializing or adding a remote. Never overwrite history.
Open the Actions tab, inspect both validation and container jobs, and only then record
the actual run URL/result in VALIDATION.md. A configured workflow is not a green CI run.
External deployment requires a separate explicit decision, production authentication,
credentials, hosting target, rollback plan and approval.
