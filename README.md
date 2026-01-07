# ⚽ TacticalMaster

A modern, interactive football/soccer tactics board with AI-powered coaching assistance. Design training drills, visualize formations, and get intelligent suggestions from an AI coach—all in a sleek web interface.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![Gemini](https://img.shields.io/badge/Gemini_AI-2.5-4285F4?logo=google)

## ✨ Features

### 🏟️ Interactive Pitch
- **Multiple pitch layouts**: Full field, half field, goal area (box), or empty canvas
- **Drag & drop** players, balls, cones, goals, and agility ladders onto the pitch
- **Rotate and label** items with jersey numbers or custom names
- **Responsive design** that works on desktop and mobile

### ✏️ Drawing Tools
- **Movement lines** — Show player runs (solid yellow arrows)
- **Pass lines** — Illustrate passing patterns (dashed blue arrows)  
- **Dribble lines** — Indicate dribbling paths (dotted white arrows)
- Drag line endpoints to adjust, or drag the whole line to reposition

### 🤖 AI Coach (Gemini 2.5)
- Chat with an AI assistant that understands football tactics
- Ask for drill setups like *"Create a 4v2 rondo"* or *"Show a corner kick setup"*
- **One-click visualization** — Apply AI-generated formations directly to the pitch

### 💾 Session Management
- **Save & load** tactical sessions to local storage
- **Undo/redo** history for all actions
- **Export to PNG** — Download your tactics as an image

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Gemini API key](https://ai.google.dev/) for AI Coach features

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tacticalmaster.git
cd tacticalmaster

# Install dependencies
npm install
# or with pnpm
pnpm install
```

### Configuration

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎮 Usage

1. **Select a pitch layout** when the app starts (or click "Pitch" in the navbar to change later)
2. **Add items** from the sidebar — players, goalkeeper, ball, cones, goals, or agility ladder
3. **Switch tools** in the toolbar to draw movement, pass, or dribble lines
4. **Click items** to select them, then edit labels or delete
5. **Open AI Coach** (purple button) to get AI-generated drill suggestions
6. **Save your session** and export as an image when done

### Keyboard Shortcuts

| Action | How |
|--------|-----|
| Move items | Drag with cursor tool selected |
| Draw lines | Select a line tool, then drag on pitch |
| Edit label | Click item, then type in toolbar |
| Delete | Select item/line, click trash icon |

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [Lucide React](https://lucide.dev/) | Icons |
| [Google Gemini AI](https://ai.google.dev/) | AI coaching |
| [html-to-image](https://github.com/bubkoo/html-to-image) | PNG export |

## 📁 Project Structure

```
tacticalmaster/
├── App.tsx              # Main app component, state management
├── components/
│   ├── Pitch.tsx        # Interactive pitch canvas
│   └── AICoach.tsx      # AI chat interface
├── services/
│   └── geminiService.ts # Gemini API integration
├── types.ts             # TypeScript type definitions
├── constants.ts         # Item & line configurations
└── index.tsx            # App entry point
```

## 📄 License

MIT

---

*Built for coaches, by someone who should probably be outside on a pitch instead of writing code.*
