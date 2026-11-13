# Vibe

@AGENTS.md

A vibe-coding web app built with **Next.js (App Router) + TypeScript + Tailwind CSS**.
The app idea is still being decided; right now this is the starter project.

## About the owner
- Beginner with the terminal and code: explain each step in plain language, and say what a command does before asking them to run it.
- Never handle their passwords, tokens, or login codes. They do logins (GitHub, Vercel) themselves.

## Commands
- `npm run dev`: start the local dev server at http://localhost:3000
- `npm run build`: production build (run this before pushing to catch errors)
- `npm run lint`: check the code for problems

## Where things live
- Pages: `src/app/` (`src/app/page.tsx` is the home page)
- Static files (images, icons): `public/`

## Git, GitHub, and deploys
- The repo is **public** on GitHub, so never commit secrets. API keys go in `.env.local` (gitignored); add them on Vercel under Project → Settings → Environment Variables.
- Hosted on Vercel at https://vibe-delta-orpin.vercel.app (GitHub: https://github.com/jbposton/vibe). Every push to `main` deploys automatically.
