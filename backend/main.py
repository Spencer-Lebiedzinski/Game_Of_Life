from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.onboarding import router as onboarding_router
from routes.checkin import router as checkin_router
from routes.suggestions import router as suggestions_router

app = FastAPI(title="Game of Life API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(onboarding_router, prefix="/api")
app.include_router(checkin_router, prefix="/api")
app.include_router(suggestions_router, prefix="/api")
