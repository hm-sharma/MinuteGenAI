# MinuteGenAI 🎙️🤖

An elegant, developer-centric **Meeting Intelligence Instrument** designed to parse raw meeting transcripts or subtitle arrays and compile structured, professional **Minutes of Meeting (MOM)** instantly.

MinuteGenAI utilizes a robust **FastAPI** backend proxy to securely handle requests to the **Google Gemini API** (using the latest high-performance `gemini-3.5-flash` model series) and a premium, responsive **Vanilla HTML/CSS/JS** single-page application dashboard on the frontend.

---

## Key Features

- **Intelligence Dashboard**: Track your drafting stats, including total summaries compiled, estimation of time saved, and pending action items.
- **Drag-and-Drop Parser**: Easily drag and drop VTT, SRT, or TXT raw transcript files.
- **Format Profiles**: Tailor the tone of the output summary:
  - *Professional Administrative Brief* (Balanced formal tone)
  - *Action-Oriented Task Logs* (Deliverables & owners focused)
  - *Exhaustive Documentation* (Detailed arguments & deep-dives)
  - *Concise Minimalist Bullet Points* (High-level takeaways)
- **Advanced Model Choices**: Fully updated support for latest Gemini models (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, and `gemini-3.1-flash-lite`).
- **Command Palette (⌘K / Ctrl+K)**: Instant shortcut menu to search through archived meetings, pending tasks, or look up keyword presets.
- **Easy Exporting**: Copy MOM output directly as Markdown (MD), HTML (formatted for email clients), or print to PDF.
- **Local Archive Database**: All summaries are automatically stored locally for offline viewing and search.

---

## Project Structure

```
MinuteGenAI/
├── api/
│   └── index.py         # FastAPI app (runs as Vercel Serverless Function)
├── gemini-api.js        # Frontend API service calling local/production backend
├── index.html           # Main frontend single-page application
├── styles.css           # Premium styling with Space Grotesk & Inter
├── app.js               # Frontend application state & UI controller
├── config.js            # Frontend configuration with auto-environment detection
├── samples.js           # Sandbox demo transcripts (Sprint planning, marketing)
├── vercel.json          # Vercel deployment rewrite rules
├── .env                 # API keys (should be gitignored!)
└── .gitignore           # File and folder ignore patterns
```

---

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js (for running the frontend dev server, optional but recommended)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Local Backend Setup
1. Open your terminal in the project directory:
   ```bash
   cd MinuteGenAI
   ```
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the root directory (or update the existing one) and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
4. Start the FastAPI backend:
   ```bash
   uvicorn api.index:app --reload
   ```
   The backend will start running locally at `http://localhost:8000`.

### 2. Local Frontend Setup
1. In a separate terminal tab, run the frontend development server:
   ```bash
   npm run dev
   ```
   This will host the static frontend on `http://localhost:3000`.
2. Open your browser and navigate to `http://localhost:3000` to start compiling transcripts!

---

## Production Deployment on Vercel 🚀

This project is fully configured to be deployed as a single application on Vercel (hosting both frontend static files and python serverless API endpoints).

1. Push your project to a GitHub repository.
2. In the Vercel Dashboard, import your repository.
3. Keep the **Root Directory** as default (`.` / root directory).
4. In the Vercel project settings, add an **Environment Variable**:
   * **Key**: `GEMINI_API_KEY`
   * **Value**: *[Your Google AI Studio API Key]*
5. Click **Deploy**. Vercel will build the frontend assets and automatically compile the FastAPI serverless functions under the `/api` route.

---

## License

This project is open-source and licensed under the [MIT License](LICENSE).
