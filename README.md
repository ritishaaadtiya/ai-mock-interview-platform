# AI Mock Interview Platform

An AI-powered mock interview platform that simulates realistic technical and behavioral interviews.

## Product Flow

Interview → Evaluate → Find Weakness → Practice → Re-interview → Improve

## Tech Stack

### Backend
- Python
- Django
- Django REST Framework
- PostgreSQL

### Frontend
- Next.js
- TypeScript

### AI
- OpenAI API

## Project Structure

backend/   - Django backend
frontend/  - Next.js frontend
docs/      - Architecture and project documentation

## Local Configuration

Copy `.env.example` to `.env` and set `OPENAI_API_KEY` to a valid OpenAI API key. The backend requires it to generate interview questions and evaluate answers. After changing `.env`, recreate the backend container so Docker loads the updated environment:

```sh
docker compose up -d --force-recreate backend
```

For production, set `OPENAI_API_KEY` in `.env.prod` and recreate the backend using the production Compose configuration. Do not commit either environment file or share the API key.