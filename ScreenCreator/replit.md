# Центр Развития Мозга (Brain Development Center)

## Overview

This is a neurological assessment and cognitive training application for a Brain Development Center. The platform enables specialists to create patient profiles, conduct ADHD questionnaires, generate AI-powered diagnostic reports, and provide cognitive training games for children and adults.

Key features:
- Patient profile management (children and adults)
- ADHD symptom questionnaire with checklist
- AI-powered diagnostic report generation using Google Gemini
- Real-time chat with AI assistant for patient consultation
- Suite of cognitive training games (Stroop test, Schulte tables, N-Back, etc.)
- Specialist chat functionality
- Admin dashboard with page view analytics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React useState for local state
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Structure**: RESTful endpoints organized in modular route files
  - `/api/profiles` - Patient profile CRUD operations
  - `/api/analyze` - AI-powered diagnostic analysis
  - `/api/chat` - Chat messaging with AI integration
  - `/api/view` and `/api/stats` - Page analytics

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver
- **ORM**: Drizzle ORM with Zod validation schemas
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Tables**: profiles, chatMessages, chatLogs, pageViews

### AI Integration
- **Provider**: Google Gemini AI (via `@google/generative-ai`)
- **Use Cases**: 
  - Diagnostic report generation from questionnaire data
  - Chat-based patient consultation assistant
- **Configuration**: Uses Replit's AI integrations with proxy base URL

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route pages
│   ├── lib/             # Utilities and API helpers
│   └── data/            # Static data (Russian words dictionary)
├── server/              # Express backend
│   ├── routes/          # API route handlers
│   └── services/        # Business logic (AI service)
├── shared/              # Shared code (schema, types)
└── migrations/          # Drizzle database migrations
```

### Key Design Patterns
- **Shared Schema**: Database schema defined in `shared/schema.ts` is used by both frontend (for types) and backend (for database operations)
- **Background Processing**: AI analysis runs asynchronously with status polling
- **Local Storage**: Chat messages and prompts cached in browser localStorage
- **Session Storage**: Current profile ID stored in sessionStorage for navigation

## External Dependencies

### Database
- **PostgreSQL**: Primary data store via `DATABASE_URL` environment variable
- **Neon Serverless**: Serverless PostgreSQL connection pooling

### AI Services
- **Google Gemini AI**: Diagnostic analysis and chat responses
  - Requires `AI_INTEGRATIONS_GEMINI_API_KEY` environment variable
  - Optional `AI_INTEGRATIONS_GEMINI_BASE_URL` for Replit proxy

### Frontend Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms)
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities

### Development Tools
- **Drizzle Kit**: Database migration management (`npm run db:push`)
- **esbuild**: Server bundling for production
- **Vite**: Frontend dev server and bundler