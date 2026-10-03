# Vynk: Smart Hostel Complaint Management Platform

> A smart and efficient platform for reporting, prioritizing, tracking, and resolving hostel complaints with automated AI triage and SLA tracking.

## 🚀 Deployment on Vercel

This application is configured as a standard Vite + React SPA with zero external runtime database requirements and a Vercel serverless function for server-side Gemini API calls.

### Build & Deploy Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: 20.x or 22.x

### Environment Variables
Configure the following variable in your Vercel Project Settings > Environment Variables:
- `GEMINI_API_KEY`: Your Google Gemini API Key (enables live AI complaint triage, embeddings, and recurring issue insights).

## 🛠️ Project Structure

- `index.html` - HTML5 application entry point
- `src/` - React TypeScript source code
  - `src/main.tsx` - App entry point
  - `src/App.tsx` - React router & protected role routing
  - `src/pages/` - Role-based views: Student Dashboard, Maintenance Staff Queue, Warden & Admin Dashboard, Super Admin Portal
  - `src/components/` - Timeline, StatusBadge, SeverityBadge, ServiceResolutionHub, ComplaintTracker
  - `src/context/` - AuthContext with role switcher, SocketContext
  - `src/api/client.ts` - Client API service with offline/demo state and Gemini endpoint routing
- `api/gemini.ts` - Vercel serverless function handling server-side Gemini API requests
- `vercel.json` - SPA rewrites ensuring deep links and browser refreshes work seamlessly
- `vite.config.ts` - Vite configuration with local dev server and API mock routing

## 👥 Demo Accounts

The platform includes pre-configured demo credentials:

| Role | Email | Password |
|---|---|---|
| **Student** | `student1@vynk.local` | `password123` |
| **Maintenance** | `tech.plumbing@vynk.local` | `password123` |
| **Warden** | `warden.boys@vynk.local` | `password123` |
| **Super Admin** | `admin@vynk.local` | `password123` |

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
