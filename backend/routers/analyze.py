from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx, os
from typing import Optional, List

router = APIRouter()

GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

async def call_gemini(prompt: str) -> str:
    if not GEMINI_KEY:
        return "⚠️ No GEMINI_API_KEY set. Add it to backend/.env"
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"{GEMINI_URL}?key={GEMINI_KEY}",
            json={"contents": [{"parts": [{"text": prompt}]}]},
        )
    if res.status_code != 200:
        raise HTTPException(status_code=502, detail="Gemini API error: " + res.text)
    data = res.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]

class RepoAnalyzeRequest(BaseModel):
    owner: str
    name: str
    description: Optional[str] = ""
    language: Optional[str] = ""
    file_paths: List[str] = []

class FileExplainRequest(BaseModel):
    owner: str
    name: str
    path: str
    content: str

@router.post("/repo")
async def analyze_repo(req: RepoAnalyzeRequest):
    prompt = f"""Analyse this GitHub repository and provide a comprehensive technical overview.

Repository: {req.owner}/{req.name}
Description: {req.description or "No description"}
Primary Language: {req.language or "Unknown"}
File tree sample:
{chr(10).join(req.file_paths[:40])}

Provide in markdown:
## What this project does
(2-3 sentence summary)

## Architecture Overview
(Main components and layers)

## Tech Stack
(Each major technology and its role)

## Key Files to Understand First
(Most important files for a new developer)

## Getting Started
(What to read in what order)

Be specific and technical. Use bullet points where helpful."""

    text = await call_gemini(prompt)
    return {"summary": text, "model": "gemini-1.5-flash"}

@router.post("/file")
async def explain_file(req: FileExplainRequest):
    truncated = req.content[:4000] if len(req.content) > 4000 else req.content
    prompt = f"""Explain this code file from the repository {req.owner}/{req.name}.

File path: {req.path}
Content:
```
{truncated}
```

Provide in markdown:
## What this file does
(Concise description)

## Key Functions / Classes
(List the most important ones with brief descriptions)

## How it fits in the project
(Its role in the broader architecture)

Keep it concise, technical, and helpful for a developer new to this codebase."""

    text = await call_gemini(prompt)
    return {"explanation": text, "file": req.path, "model": "gemini-1.5-flash"}

@router.post("/security")
async def security_scan(req: RepoAnalyzeRequest):
    prompt = f"""Perform a security analysis of this repository.

Repository: {req.owner}/{req.name}
Language: {req.language}
Files: {chr(10).join(req.file_paths[:30])}

Identify in markdown:
## Security Risk Summary
(Overall risk level: LOW / MEDIUM / HIGH)

## Potential Vulnerabilities
(List any patterns that could indicate security issues based on file names and structure)

## Recommendations
(Concrete steps to improve security)

Be specific and actionable."""

    text = await call_gemini(prompt)
    return {"report": text, "model": "gemini-1.5-flash"}
