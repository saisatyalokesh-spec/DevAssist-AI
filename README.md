# 🧭 DevAssist AI — FastAPI + Next.js

**Debug Smarter. Build Faster.**

An AI-powered technical troubleshooting assistant for SaaS support teams. Describe a problem, paste
an error, or upload a screenshot — it retrieves the matching approved guide 📚, walks you through it
step by step 🪜, and tells you exactly who to escalate to 🚨 if there's no confident answer. Built
with FastAPI (backend + RAG engine) and Next.js (frontend), reading from a local SQLite database.

This README follows the same structure as the app itself: **Project Overview** first, then
**Retrieval & Modules**, then how to set it up and run it.

---

## 1. 📋 Project Overview

*A RAG-based technical support platform — combining OCR screenshot reading, TF-IDF knowledge
retrieval, iterative step-by-step troubleshooting, and automatic escalation routing into one
grounded assistant for junior developers.*

### 🧩 What it does

Describe a problem — paste text, an error log, or a screenshot — and DevAssist AI does the thinking
for you. You get one clean guidance panel with causes, steps, and the next action, and it never
invents an answer that isn't backed by the knowledge base.

### 🔀 How it flows, end to end

```
📝 You describe the problem (text, log, or screenshot)
        │
        ▼
🖥️  NEXT.JS frontend sends it to the backend
        │
        ▼
⚡ FASTAPI backend receives the request
        │
        ▼
🔎 OCR (if screenshot) → RAG retrieval engine
   ├── 📚 Common Problems knowledge base
   └── 🧩 Complex Problems knowledge base
        │
        ▼
📊 One guidance panel — causes, steps,
   current action, responsible team
        │
        ▼
🔁 You report what happened → loop continues,
   or the ticket is solved / escalated
```

### ✨ What you can do with it

| Feature | In plain terms | Why it matters |
|---|---|---|
| 🧭 **Troubleshoot** | One box for pasting an error or describing a problem. | Everything else in the app runs off this one input. |
| 🖼️ **Upload Screenshot** | Drop in a screenshot and OCR reads the error out of it for you. | No retyping error text by hand. |
| 📚 **Knowledge-Grounded Guidance** | Causes and steps come only from the approved knowledge base. | Never a made-up fix. |
| 🔁 **Iterative Troubleshooting** | Mark a step complete, report what happened, get the next step. | Mirrors how a real senior engineer would walk you through it. |
| 🔖 **Saved Solutions** | Every analyzed ticket is saved automatically, the moment guidance is produced. | Always an up-to-date reference for the whole team. |
| 🚨 **Smart Escalation** | Routes to the responsible team with the reason attached. | No guessing who to ping. |
| 📤 **Knowledge Base Upload** | Replace the Common/Complex `.docx` right from the UI. | Keeps the knowledge current with zero downtime. |
| 💬 **Floating AI Assistant** | Same troubleshooting flow in a chat bubble, plus "how do I...?" app help. | Feels like a real product help chatbot, not just a form. |

---

## 2. 🧠 Retrieval & Modules

### 🤖 The core engine

| Task | Approach | Simple explanation |
|---|---|---|
| 🔎 **Retrieval** | TF-IDF + cosine similarity (scikit-learn) | Matches your problem's wording against every guide in the knowledge base and scores how confident the match is — fast, explainable, no external API key needed. |
| 🖼️ **OCR** | Tesseract via `pytesseract` | Reads the error text straight out of a screenshot so it can be treated exactly like typed text. |
| 🔁 **Iterative Loop** | Deterministic step engine | Walks the guide's authored steps one at a time, and only re-runs retrieval when a genuinely different error appears. |

### ⚙️ Supporting infrastructure

| Module | What it does |
|---|---|
| ⚡ **FastAPI backend** | Handles every analyze, troubleshoot, and knowledge-base request. |
| 🗄️ **SQLite database** | Stores sessions, steps, escalations, and saved solutions. |
| 📄 **python-docx parser** | Reads the Common/Complex knowledge-base documents into guides. |
| 🖥️ **Next.js frontend** | The app you click through — dashboard, workspace, saved solutions. |
| 💬 **Floating chat widget** | The same troubleshooting engine, in a chat-style panel on every page. |

---

## 3. ⚙️ Setup

### 📦 Knowledge base files

Copy your two knowledge-base `.docx` files into `app/backend/data/raw/`.

### 📥 Install dependencies

```bash
cd AI-Project
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

cd app/frontend
npm install
```

Screenshot analysis also needs the Tesseract OCR binary installed on your machine (`brew install
tesseract` on macOS, `sudo apt-get install tesseract-ocr` on Ubuntu/Debian, or the installer from
[UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) on Windows).

### ▶️ Run it — two terminals

**Terminal 1 — backend:**
```bash
cd AI-Project
uvicorn app.backend.main:app --reload
```
Runs at `http://localhost:8000`. Visit `http://localhost:8000/docs` to try every endpoint directly.

**Terminal 2 — frontend:**
```bash
cd AI-Project/app/frontend
npm run dev
```
Runs at `http://localhost:3000`. Start the backend first.

---

## 4. 📝 Good to know

- 🔎 **Retrieval is TF-IDF, not semantic** — fast and needs no external model, but keyword-based.
  Ambiguous short queries can occasionally match an adjacent guide in the same category.
- 🧑‍💻 **Single-tenant** — no login or user accounts yet, by design for the current scope.
- 🗄️ **SQLite by default** — fine for development; switch to PostgreSQL via `DATABASE_URL` for
  concurrent production use.
- 💬 **The chat assistant knows the difference** — "how do I...?" questions are answered locally
  with app-navigation steps, while genuine technical errors always go through the real retrieval
  engine, never a guess.
