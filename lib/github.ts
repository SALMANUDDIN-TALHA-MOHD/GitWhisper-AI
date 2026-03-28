const BASE = 'https://api.github.com'

function headers(): Record<string, string> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
  // Only add Authorization if token exists AND looks valid (starts with ghp_, gho_, etc.)
  const isValidToken = token && token !== 'your-github-token-here' && token.length > 10
  return {
    Accept: 'application/vnd.github.v3+json',
    ...(isValidToken ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function fetchRepoData(owner: string, name: string) {
  const [repoRes, treeRes] = await Promise.all([
    fetch(`${BASE}/repos/${owner}/${name}`, { headers: headers() }),
    fetch(`${BASE}/repos/${owner}/${name}/git/trees/HEAD?recursive=1`, { headers: headers() }),
  ])

  if (!repoRes.ok) {
    const err = await repoRes.json().catch(() => ({}))
    if (repoRes.status === 401) throw new Error('GitHub token is invalid. Remove NEXT_PUBLIC_GITHUB_TOKEN from .env.local or replace it with a valid token.')
    if (repoRes.status === 404) throw new Error(`Repository "${owner}/${name}" not found. Make sure it is public.`)
    if (repoRes.status === 403) throw new Error('GitHub API rate limit reached. Add a valid NEXT_PUBLIC_GITHUB_TOKEN to .env.local to increase the limit.')
    throw new Error(err.message || `GitHub API error ${repoRes.status}`)
  }

  const repo = await repoRes.json()
  const tree = treeRes.ok ? (await treeRes.json()).tree || [] : []

  return { ...repo, tree }
}

export async function fetchFileContent(owner: string, name: string, path: string): Promise<string> {
  const res = await fetch(`${BASE}/repos/${owner}/${name}/contents/${path}`, { headers: headers() })
  if (!res.ok) throw new Error('File not found')
  const data = await res.json()
  if (data.encoding === 'base64' && data.content) {
    try { return atob(data.content.replace(/\n/g, '')) } catch { return data.content }
  }
  return data.content || ''
}

export function buildFileTree(flat: Array<{ path: string; type: string; sha?: string }>): any[] {
  const root: any[] = []
  const map: Record<string, any> = {}

  flat.forEach(item => {
    const parts = item.path.split('/')
    const name  = parts[parts.length - 1]
    const node  = { name, path: item.path, type: item.type, children: [] }
    map[item.path] = node
    if (parts.length === 1) {
      root.push(node)
    } else {
      const parentPath = parts.slice(0, -1).join('/')
      if (map[parentPath]) map[parentPath].children.push(node)
      else root.push(node)
    }
  })

  const sort = (nodes: any[]) => {
    nodes.sort((a, b) => {
      if (a.type === 'tree' && b.type !== 'tree') return -1
      if (a.type !== 'tree' && b.type === 'tree') return 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach(n => n.children && sort(n.children))
    return nodes
  }

  return sort(root)
}
