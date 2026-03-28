from fastapi import APIRouter, HTTPException, Query
import httpx, os

router = APIRouter()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    **({"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}),
}

@router.get("/{owner}/{name}")
async def get_repo(owner: str, name: str):
    async with httpx.AsyncClient() as client:
        repo_res  = await client.get(f"https://api.github.com/repos/{owner}/{name}", headers=HEADERS)
        tree_res  = await client.get(
            f"https://api.github.com/repos/{owner}/{name}/git/trees/HEAD?recursive=1",
            headers=HEADERS
        )

    if repo_res.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Repository {owner}/{name} not found or is private.")
    if repo_res.status_code == 403:
        raise HTTPException(status_code=403, detail="GitHub API rate limit hit. Add a GITHUB_TOKEN.")

    repo = repo_res.json()
    tree = tree_res.json().get("tree", []) if tree_res.status_code == 200 else []

    return {
        "name":              repo.get("name"),
        "owner":             repo.get("owner", {}).get("login"),
        "description":       repo.get("description"),
        "language":          repo.get("language"),
        "stargazers_count":  repo.get("stargazers_count", 0),
        "forks_count":       repo.get("forks_count", 0),
        "open_issues_count": repo.get("open_issues_count", 0),
        "default_branch":    repo.get("default_branch", "main"),
        "topics":            repo.get("topics", []),
        "tree":              tree,
    }

@router.get("/{owner}/{name}/file")
async def get_file(owner: str, name: str, path: str = Query(...)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/repos/{owner}/{name}/contents/{path}",
            headers=HEADERS
        )
    if res.status_code != 200:
        raise HTTPException(status_code=404, detail="File not found.")

    data = res.json()
    content = data.get("content", "")
    if data.get("encoding") == "base64":
        import base64
        try:
            content = base64.b64decode(content.replace("\n", "")).decode("utf-8", errors="replace")
        except Exception:
            content = "[Binary file — cannot display]"
    return {"path": path, "content": content, "size": data.get("size", 0)}
