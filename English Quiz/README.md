# English Studio

English Studio is a mobile-first Class 10 English learning app, developed by Venush. It is a Vite + React + TypeScript application with a Vercel serverless function for Groq-powered quizzes.

## Deploy to Vercel

1. Push this project to a Git repository and import it into Vercel.
2. Keep the Vite framework preset. The included `vercel.json` uses `npm run build` and publishes `dist`.
3. In Vercel Project Settings -> Environment Variables, add these server-side variables:
   - `GROQ_API_KEY`: your Groq API key
   - `GROQ_MODEL`: a Groq chat-completion model available to your account (default: `openai/gpt-oss-20b`)
   - `GROQ_BASE_URL`: `https://api.groq.com/openai/v1`
4. Redeploy after adding or changing the variables.

Do not prefix the Groq key with `NEXT_PUBLIC_` or expose it in browser code. The Vercel function at `/api/generate-quiz` is the only part of the app that calls Groq. If the key is not configured, AI quizzes show a retryable configuration error and the 15-question offline practice set remains available.

The frontend is an existing Vite implementation, not a Next.js app. Vercel serves the Vite build and the root-level `api/` TypeScript file as a serverless function. The app uses no database, ORM, database credentials or migrations.

## Run locally

```bash
npm install
npm run dev
```

Vite's development server does not execute Vercel serverless functions. Use the offline practice set during `npm run dev`, or run the Vercel CLI (`vercel dev`) to exercise `/api/generate-quiz` locally with the environment variables above.

## Student data and privacy

Student names and simple preferences use `localStorage`. Learning records, quiz attempts, question fingerprints, flashcard progress, XP, statistics and awards use IndexedDB in the current browser and device. No student data is sent to a database or synced across devices. Groq receives only the selected topic, difficulty, duplicate-prevention fingerprints and (when requested) missed-question prompts needed to generate a quiz. Download and store a JSON backup regularly.

## Quality checks

```bash
npx tsc --noEmit
npm run build
```