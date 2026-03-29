# MongoDB URI Setup

Your friend needs this in:

`backend/.env`

Use this exact line:

```env
MONGODB_URI=mongodb+srv://spencerlebiedzinski_db_user:zcwWfD8NLLSiUQpW@game-of-life.wqzlvvp.mongodb.net/?appName=Game-of-Life
```

Recommended backend `.env` example:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://spencerlebiedzinski_db_user:zcwWfD8NLLSiUQpW@game-of-life.wqzlvvp.mongodb.net/?appName=Game-of-Life
```

If Mongo still does not connect on his laptop:

1. Make sure `backend/.env` exists.
2. Make sure the backend is started from the project root or `backend` directory so dotenv loads correctly.
3. Confirm the laptop's IP is allowed in MongoDB Atlas network access.
4. If Atlas is locked down, temporarily allow `0.0.0.0/0` for the presentation and tighten it later.
