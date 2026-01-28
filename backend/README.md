# StudyBuddy Backend

Backend service for StudyBuddy. Provides lesson upload, AI chat, AI cards (summary, key notes, MCQ), and study progress tracking.

## Prerequisites
- Java 21
- Maven (or use `mvnw` / `mvnw.cmd`)
- PostgreSQL (local)
- Optional: Ollama running locally
- Optional: Tesseract OCR installed for image OCR

## Configuration
This project uses a `local` Spring profile for developer machines.

1) Keep safe placeholders in `src/main/resources/application.properties` (already set).
2) Put real local values in `src/main/resources/application-local.properties` (gitignored).
3) Activate the local profile:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
```

### Required local values (example)
```
spring.datasource.url=jdbc:postgresql://localhost:5432/studybuddy
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.ai.ollama.base-url=http://localhost:11434
spring.ai.ollama.chat.options.model=llama3:8b
app.upload.dir=uploads
app.tesseract.datapath=C:\\Program Files\\Tesseract-OCR
app.tesseract.lang=eng
```

## Run Locally
From the `backend/` folder:

```powershell
./mvnw.cmd spring-boot:run
```

## Tests
```powershell
./mvnw.cmd test
```

## Notes
- CORS is open for local development.
- AI features use Spring AI with Ollama; if Ollama is not available, endpoints return a friendly message.

