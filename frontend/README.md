# StudyBuddy Frontend

Modern, responsive UI for the StudyBuddy learning platform. This app provides authentication flows, lesson browsing, study/quiz modes, progress tracking, and chat with context-aware assistance.

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS
- Radix UI + shadcn/ui

## Getting Started
1. Install dependencies:
  npm install
2. Start the dev server:
  npm run dev

## Available Scripts
- npm run dev — start the development server
- npm run build — create a production build
- npm run preview — preview the production build locally

## Environment
The frontend expects the backend API to be running. Update API endpoints in [src/lib/api.ts](src/lib/api.ts) if needed.

## Project Structure
- src/app — application pages and UI components
- src/lib — API helpers and shared utilities
- src/styles — global styles and theme tokens
