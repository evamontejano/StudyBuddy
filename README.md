📚 StudyBuddy — AI-Powered Learning Assistant

StudyBuddy is a full-stack web application designed to help students learn smarter by transforming study materials into structured, interactive learning content using AI.

Students can upload notes (PDFs, DOCs, images), receive AI-generated summaries, key notes, and flashcards, chat with an AI tutor, and track their learning progress over time.

🎯 Project Goals

Turn unstructured learning materials into structured knowledge

Support active learning through flashcards and study sessions

Provide an AI-powered tutor for contextual and general questions

Track learning progress in a meaningful way

This project was built as a full-stack academic + portfolio project, focusing on clean architecture, AI integration, and best practices.

🧠 Core Features

📁 Lesson Upload — PDF, DOC, or image (OCR supported)

🟩 AI Summary — concise overview of the lesson

🟨 Key Notes — extracted concepts and definitions

🟦 Q&A Flashcards — AI-generated questions & answers

💬 AI Chat Tutor — ask questions with or without lesson context

📊 Progress Tracking — visualize learning progress

🔐 Authentication — JWT-based login & registration

⚙️ Backend Overview
Tech stack

Java 21

Spring Boot 3

Spring Security + JWT

Spring Data JPA (Hibernate)

PostgreSQL

Spring AI (Ollama)

Apache Tika + Tesseract OCR

📄 Backend documentation:
➡️ See backend/README.md

🎨 Frontend Overview

Tech stack

React 18

TypeScript

Vite

Tailwind CSS

Radix UI + shadcn/ui

Chart.js

📄 Frontend documentation:
➡️ See frontend/README.md

🚀 Running the Project Locally
1️⃣ Backend
cd backend
$env:SPRING_PROFILES_ACTIVE="local"
./mvnw.cmd spring-boot:run


Make sure:

PostgreSQL is running

application-local.properties contains real credentials

Ollama is running 

2️⃣ Frontend
cd frontend
npm install
npm run dev


The frontend expects the backend API to be available locally.

🔐 Configuration & Secrets

application.properties

committed

contains safe placeholder values only

application-local.properties

contains real secrets

gitignored

.env

gitignored

This setup keeps the repository safe for public GitHub use.

📈 Learning & Academic Focus

This project demonstrates:

Layered backend architecture

Secure authentication

AI integration in real applications

File processing & OCR

State-driven frontend UI

Clean Git & configuration practices

It can be extended into:

agentic AI workflows

RAG-based contextual chat

spaced repetition algorithms
