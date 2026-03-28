from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import repos, analyze, health

app = FastAPI(
    title="CodexAI Backend",
    description="AI-powered code analysis API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,  prefix="/health",  tags=["health"])
app.include_router(repos.router,   prefix="/repos",   tags=["repos"])
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
