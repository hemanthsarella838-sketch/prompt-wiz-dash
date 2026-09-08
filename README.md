# Prompt Perfector

Build a complete, standalone React web application for an "AI Prompt Optimizer & Quality Scoring Dashboard".

UI & Layout (Modern AI SaaS Aesthetic):

- Split-screen workspace (Left: Input & Controls | Right: Output & Scoring Analytics).

- Dark mode theme (#0B0F19 background, violet/indigo accents #6366F1, glassmorphism cards).

Features to Include:

1. Input Section:

   - Textarea with live character, word, and estimated token counts.

   - Preset selector chips ("Fix Vague Prompt", "Coding Task", "Make Structured").

   - Domain selector dropdown (Coding, Academic, Writing, Marketing).

   - "Optimize Prompt", "Clear", and "Load Sample" buttons.

2. Output Section:

   - 3 Quality Scoring Gauges (Clarity, Completeness, Efficiency) from 0–100%.

   - Intent and Domain classification badges.

   - Tabbed view: "Optimized Prompt" (with Copy button), "Side-by-Side Diff", and "Improvements Made".

3. Storage & History:

   - Save optimization runs to localStorage so history persists across refreshes.

   - Slide-over history drawer to reload past prompts.

4. Mock AI Engine:

   - Include built-in dynamic optimization simulation logic so every sample prompt optimizes instantly without needing an external API key.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://prompt-wiz-dash.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/82165e46-2506-408e-97db-9d4eb466bdd3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
