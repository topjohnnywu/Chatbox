# NexusAI Studio - Architecture, API Documentation & Production Guide

NexusAI is a full-stack, Claude-inspired AI assistant platform engineered with a Bring-Your-Own-Key (BYOK) architecture, streaming SSE responses, rich Markdown formatting, and cross-platform UX (optimized for Mobile touch and Windows desktop).

---

## 📁 System Folder Structure

```
├── prisma/
│   └── schema.prisma           # PostgreSQL database schema (Users, Conversations, Messages, Providers, Memories)
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx         # Mobile drawer & desktop sidebar (search, history grouping, pin, rename, delete)
│   │   ├── ChatMessage.tsx     # Markdown renderer, code blocks, syntax copy, thinking collapsible tag
│   │   ├── ChatInput.tsx       # Auto-expanding composer, file attachment dropzone, model & temp controls
│   │   ├── ProviderSettingsModal.tsx # BYOK setup (OpenAI, Groq, Ollama, LM Studio, OpenRouter, Gemini)
│   │   ├── MemoryModal.tsx     # Custom instructions and persistent memory context manager
│   │   └── ExportModal.tsx     # Conversation exporter (Markdown, JSON, and print-to-PDF)
│   ├── lib/
│   │   ├── presets.ts          # Provider presets and AI personas (Architect, Writer, Researcher, etc.)
│   │   └── storage.ts          # Persistent storage engine and export helpers
│   ├── server/
│   │   └── chatHandler.ts      # Node.js OpenAI-compatible SSE streaming proxy
│   ├── types/
│   │   └── chat.ts             # TypeScript definitions
│   ├── App.tsx                 # Main application coordinator
│   ├── index.css               # Windows-tailored thin scrollbars, typography, and styling
│   └── main.tsx                # React 19 root entry
├── Dockerfile                  # Multi-stage production container build
├── docker-compose.yml          # Containerized app + PostgreSQL setup
├── server.ts                   # Production Express server
└── vite.config.ts              # Vite dev server with integrated API middleware
```

---

## 📡 API Reference

### 1. `POST /api/chat`
Sends messages to any OpenAI-compatible provider with token-by-token Server-Sent Events (SSE).

**Request Body:**
```json
{
  "provider": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-proj-...",
    "model": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 4096
  },
  "messages": [
    {
      "role": "user",
      "content": "Explain WebSocket streaming vs SSE",
      "attachments": [
        {
          "name": "schema.ts",
          "content": "export interface Config { ... }",
          "isImage": false
        }
      ]
    }
  ],
  "stream": true
}
```

**Response (SSE Stream):**
```
data: {"choices":[{"delta":{"content":"Server"},"index":0}]}
data: {"choices":[{"delta":{"content":"-Sent"},"index":0}]}
data: {"choices":[{"delta":{"content":" Events"},"index":0}]}
data: [DONE]
```

---

### 2. `GET /api/health`
Health check endpoint for Docker container orchestration and load balancers.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-01T08:50:00.000Z",
  "service": "NexusAI Studio API"
}
```

---

## 🛡️ Production Security Checklist

1. **Client-Side Key Protection:**
   - User API keys are stored strictly in client-side LocalStorage or transmitted ephemerally via HTTPS headers.
   - Keys are never persisted in server logs or analytics.
2. **SSRF (Server-Side Request Forgery) Mitigation:**
   - When self-hosting in untrusted multi-tenant environments, restrict custom `baseUrl` hosts to allowed domains or run outbound proxy filters.
3. **XSS Sanitization:**
   - Markdown rendering safely escapes HTML and executes safe rendering through `react-markdown` and `remark-gfm`.
4. **Input Size & Rate Limiting:**
   - Attachment size is bounded in the client FileReader and Express body parser limits large payloads to prevent DoS.
5. **CORS Isolation:**
   - API endpoints enforce same-origin communication when bundled with the Vite/Express frontend.

---

## 🚀 Deployment Guide

### Local Development:
```bash
npm install
npm run dev
# App starts at http://localhost:3000
```

### Docker Deployment:
```bash
docker compose up -d --build
```
The application will launch on `http://localhost:3000` with connected PostgreSQL on port `5432`.
