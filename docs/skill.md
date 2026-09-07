# Skills Reference

## Project: DriveLuxe — Premium Car Rental Platform

A catalogue of the capabilities ("skills") used and available in this project.
Beginner-friendly: each entry explains *what it does* and *where it's used*.

---

## 1. Skills Used in This Project

### Image Generation (`z-ai image`)
- **What:** Creates a brand-new image from a text description using an AI model.
- **Used for:** The dark luxury hero banner (`public/hero-car.png`).
- **How:** CLI `z-ai image -p "<prompt>" -o <path> -s 1440x720`. Runs server-side
  / CLI only (the SDK must never be imported in client code).

### Image Search (`z-ai image-search`)
- **What:** Searches the public web for real photos matching a query and
  re-hosts them on stable OSS URLs so they always load.
- **Used for:** Car catalog photos (sedan, SUV, sports, convertible, electric).
- **How:** CLI `z-ai image-search -q "<query>" --count N --no-rank -o out.json`.
  The returned `original_url` values are embedded directly in `<img src>`.

### LLM (Large Language Model)
- **What:** Generates text / answers / summaries from a prompt.
- **Available for:** A future "AI concierge" chat that recommends cars based on
  user needs (Phase 3 idea). Not wired into Phase 1–2.

### Web Search / Web Reader
- **What:** Retrieve up-to-date info or extract article content from URLs.
- **Available for:** Enriching car descriptions with live specs (future).

### VLM (Vision Language Model)
- **What:** Understands images (describe, answer questions about an image).
- **Available for:** Auto-generating alt text / captions for uploaded car
  images (Phase 3, if admin upload is added).

### TTS / ASR (Text↔Speech)
- **What:** Convert text→audio or audio→text.
- **Available for:** Voice-guided car descriptions or voice search (future).

---

## 2. How to Invoke a Skill

1. The Skill tool loads the skill's full instructions (parameters, examples).
2. Follow those instructions — usually a CLI command or a backend SDK call.
3. **Critical:** `z-ai-web-dev-sdk` is backend-only. Never `import` it in a
   `'use client'` component or a browser bundle.

### CLI quick reference

```bash
# Generate an image
z-ai image -p "prompt" -o ./out.png -s 1440x720

# Search real images
z-ai image-search -q "a red sports car" --count 5 --no-rank -o results.json
```

---

## 3. Where Skills Live in This Codebase

- Generated/searched image assets → `public/` and referenced by URL in the
  Prisma seed (`prisma/seed.ts`).
- No SDK calls happen at runtime in Phase 1–2; images were fetched once during
  setup and stored as static assets / stable URLs.

---

## 4. Adding a New Skill Later (checklist)

1. Confirm the skill exists in the available skills list.
2. Read its `SKILL.md` (via the Skill tool) for exact parameters.
3. Decide CLI (one-off) vs backend SDK (runtime).
4. If runtime: place the call in a Route Handler (`src/app/api/*`), never in a
   client component.
5. Handle errors gracefully and return the standard API envelope.
6. Update this file and `memory.md`.
