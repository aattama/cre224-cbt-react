# CRE 224 CBT Practice

A React + Vite practice CBT app for CRE 224 — Multimedia Development & Application,
built from the course's lecture materials (187 questions across 19 topics).

## Run it locally in VS Code

1. Unzip this folder and open it in VS Code.
2. Open a terminal (Terminal → New Terminal) and install dependencies:
   ```
   npm install
   ```
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open the URL it prints (usually `http://localhost:5173`) in your browser.

To build a static production version you can host anywhere:
```
npm run build
```
This outputs a `dist/` folder — open `dist/index.html` or deploy that folder to any
static host.

## What's new in this version

- **Fixed:** "End test" now ends the attempt immediately (it previously relied on a
  browser `confirm()` dialog that some environments block). It now shows an inline
  "Are you sure?" banner instead.
- **Added:** a **Previous** button next to Next, so you can move freely backward and
  forward through the test. Answered questions stay locked (showing what you picked,
  and in Practice mode, whether it was correct) when you revisit them.

## Editing the question bank

All questions live in `src/data/questions.json` as a flat array:
```json
{ "c": "Category name", "q": "Question text", "o": ["opt A","opt B","opt C","opt D"], "a": 1, "e": "short explanation" }
```
`a` is the zero-based index of the correct option in `o`. Add, edit, or remove entries
freely — the app picks up new categories and counts automatically.

## Project structure

```
cre224-cbt/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx        # quiz logic and screens
│   ├── App.css         # styling
│   └── data/
│       └── questions.json
└── README.md
```
