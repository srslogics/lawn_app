# Celebration Lawn Command

A real client-server application foundation for a celebration lawn business.

## Current scope

- Python `FastAPI` backend
- PostgreSQL persistence via `SQLAlchemy`
- Static asset serving from the same app
- Booking, client, vendor, payment, task, enquiry, dashboard, and reset endpoints
- Frontend wired to live API instead of `localStorage`
- Public enquiry page for customer leads

## Database

- Primary database: PostgreSQL
- Local config file: `.env`
- Example config: `.env.example`
- SSL is enabled for hosted PostgreSQL connections

## Run

```bash
uvicorn main:app --host 127.0.0.1 --port 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

Public enquiry page:

- [http://127.0.0.1:4173/enquiry](http://127.0.0.1:4173/enquiry)

The backend will automatically read database settings from `.env` and connect to PostgreSQL. If no PostgreSQL settings are present, it falls back to local SQLite for development.

## API

- `GET /api/health`
- `GET /api/bootstrap`
- `GET /api/dashboard`
- `GET|POST /api/bookings`
- `PATCH /api/bookings/:id/status`
- `GET|POST /api/clients`
- `GET|POST /api/vendors`
- `GET|POST /api/payments`
- `GET|POST /api/tasks`
- `GET|POST /api/enquiries`
- `POST /api/reset`

`GET /api/health` now reports both the configured database and the currently active database, so it is easy to see whether PostgreSQL is live or whether the app fell back to local SQLite.
