# Web app setup guide (Next.js + GitHub + Vercel)

How the Vibe project was set up on 2026-11-13, written to reuse for future projects.
**Part 1** is one-time setup for the Mac (already done). **Part 2** is repeated for each new project.

Result for Vibe:
- Code: https://github.com/jbposton/vibe (public)
- Live site: https://vibe-delta-orpin.vercel.app

---

## Part 1: One-time Mac setup (done, skip next time)

1. **git** is built into macOS. Your name and email are already set globally.
2. **Node.js (LTS)** was installed from the official installer at https://nodejs.org/en/download (macOS Installer `.pkg`). It's needed to run Next.js.
3. **GitHub CLI (`gh`)** was installed from https://github.com/cli/cli/releases/latest (`gh_<version>_macOS_universal.pkg`).
   - That installer isn't signed, so macOS may block it. Fix: System Settings → Privacy & Security → **Open Anyway**.
4. **Log in to GitHub** in the terminal with `gh auth login`, answering GitHub.com → HTTPS → Yes → Login with a web browser. Then paste the one-time code on github.com.
   - Check it worked with `gh auth status`.
5. **Vercel account:** sign up at https://vercel.com with **Continue with GitHub** (Hobby plan, free).

Homebrew wasn't used. Everything came from the official installers.

---

## Part 2: Each new project

1. **Make a folder** for the project and open it in Claude Code.
   - Tip: use a **lowercase** folder name (e.g. `my-app`). `create-next-app` refuses names with capital letters when it runs inside the folder.
2. **Create the starter app** with Next.js, TypeScript, Tailwind and the App Router:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
   ```
   It sets up git and a `.gitignore` that already ignores `.env*` files.
3. **Add `CLAUDE.md` and `README.md`:** say what the project is, how to run it, and that Claude should explain each step.
4. **Check it runs locally** with `npm run dev`, then open http://localhost:3000.
5. **Make the first commit and create the GitHub repo:**
   ```bash
   git add . && git commit -m "Initial commit"
   gh repo create <name> --public --source=. --push
   ```
   You can rename the repo later. GitHub redirects the old address, and Vercel follows the rename.
6. **Deploy on Vercel:** Add New → Project → **Import** the repo → keep the defaults → **Deploy**.
   - You get a link like `https://<name>-xxxx.vercel.app`. A random ending is added when the plain name is already taken.
   - To give Vercel access to a new repo: Configure GitHub App → add the repo.
7. **Test the whole pipeline:** change the heading in `src/app/page.tsx`, then commit and push. The live site should update in under a minute.

---

## Rules to keep

- **Never commit secrets** (API keys, passwords). They go in `.env.local`, which git ignores, and on Vercel under Project → Settings → Environment Variables.
- Public repos are visible to everyone, so check what you're about to push.
- Run `npm run build` before pushing to catch errors before they reach the live site.

## Later options
- **Custom domain:** Vercel → Project → Settings → Domains, then add the DNS records it shows at the company where you bought the domain.
