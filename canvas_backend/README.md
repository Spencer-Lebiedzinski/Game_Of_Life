# Canvas Planner Backend

FastAPI backend for a hackathon project that connects to Canvas and returns student-friendly dashboard data.

## What it does

- Connects to Canvas with either:
  - a manual access token for fast local testing, or
  - OAuth for a multi-user demo
- Fetches:
  - courses
  - enrollments / grade info
  - assignments
  - submissions
- Returns a merged `/api/canvas/dashboard` response with:
  - course name
  - current grade / score
  - next 3 assignments due in the next 7 days
  - missing count
  - late count
  - priority score

## Project structure

```text
app/
  main.py
  config.py
  schemas.py
  routes/
    canvas.py
  services/
    canvas_client.py
    canvas_dashboard.py
requirements.txt
.env.example
```

## Quick start

```bash
cd canvas_backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`.

### Fastest setup: manual token mode

Set:

```env
CANVAS_BASE_URL=https://your-school.instructure.com
CANVAS_TOKEN=your-token
```

Then run:

```bash
uvicorn app.main:app --reload --port 8000
```

Open:

- `http://localhost:8000/health`
- `http://localhost:8000/api/canvas/courses`
- `http://localhost:8000/api/canvas/grades`
- `http://localhost:8000/api/canvas/dashboard`

## OAuth mode

Fill in:

```env
CANVAS_CLIENT_ID=...
CANVAS_CLIENT_SECRET=...
CANVAS_REDIRECT_URI=http://localhost:8000/api/canvas/callback
FRONTEND_REDIRECT_URL=http://localhost:3000/settings/integrations
```

Then start OAuth:

```text
GET /api/canvas/login?user_id=demo_user
```

After the callback succeeds, the access token is stored **in memory** under that `user_id`.

For protected requests, send the same user id from your frontend:

```http
X-User-Id: demo_user
```

Example:

```bash
curl -H "X-User-Id: demo_user" http://localhost:8000/api/canvas/dashboard
```

## Frontend example

```ts
const res = await fetch("http://localhost:8000/api/canvas/dashboard", {
  headers: {
    "X-User-Id": "demo_user",
  },
});

const data = await res.json();
console.log(data);
```

## Example dashboard response

```json
{
  "courses": [
    {
      "course_id": "12345",
      "course_name": "Math 230",
      "current_grade": "B+",
      "current_score": 88.4,
      "missing_count": 1,
      "late_count": 0,
      "priority_score": 7,
      "upcoming_assignments": [
        {
          "assignment_id": "998",
          "name": "Homework 8",
          "due_at": "2026-03-29T23:59:00Z",
          "points_possible": 25,
          "submitted": false,
          "late": false,
          "score": null,
          "workflow_state": "unsubmitted"
        }
      ]
    }
  ]
}
```

## Important hackathon notes

- OAuth tokens are stored in memory only. If the server restarts, users need to reconnect.
- For a production app, store tokens in a database and encrypt them.
- This backend is read-only. It does not submit work back to Canvas.
- The dashboard logic is intentionally simple so it is easy to demo and customize.
