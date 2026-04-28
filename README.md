# Celebration Lawn Command

A real client-server application foundation for a celebration lawn business.

## Current scope

- Python `FastAPI` backend
- SQLite persistence via `SQLAlchemy`
- Static asset serving from the same app
- Booking, client, vendor, payment, task, dashboard, and reset endpoints
- Frontend wired to live API instead of `localStorage`

## Run

```bash
uvicorn main:app --host 127.0.0.1 --port 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

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
- `POST /api/reset`
