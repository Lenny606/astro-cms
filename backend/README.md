# Astro CMS Backend

The backend for the Astro CMS, built with **FastAPI** and managed with **Poetry**.

## Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Package Manager:** [Poetry](https://python-poetry.org/)
- **Database:** MongoDB (via [Motor](https://motor.readthedocs.io/))
- **Static Files:** FastAPI StaticFiles for image uploads

## Setup

### Prerequisites

- Python 3.12+
- Poetry
- MongoDB instance

### Installation

1. Install dependencies:
   ```bash
   poetry install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and update the values.
   ```bash
   cp .env.example .env
   ```

## Development

Run the development server with live reload:

```bash
poetry run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
You can access the interactive API documentation at `http://localhost:8000/docs`.

## API Endpoints

- `GET /health` - Check API and Database status.
- `GET /api/settings` - Retrieve global CMS settings (localized headlines).
- `POST /api/settings` - Update global CMS settings.
- `POST /api/upload` - Upload an image to the media library.
- `GET /posts` - List blog posts (coming soon).
- `GET /folder/{filename}` - Serve uploaded static files.

## Project Structure

- `app/main.py` - FastAPI application configuration and endpoints.
- `app/database.py` - MongoDB connection logic.
- `folder/` - Directory for uploaded images.
- `pyproject.toml` - Poetry configuration and dependencies.
