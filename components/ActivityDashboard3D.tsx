'use client'
import { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCommit, GitPullRequest, AlertCircle, Users, ExternalLink, Clock, Tag } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'

const COLORS = ['#6366f1','#c9a84c','#ef4444','#22c55e','#3b82f6','#8b5cf6','#06b6d4','#f59e0b']
const TT_STYLE = { backgroundColor:'#0d1117', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'8px', fontFamily:'Inter', fontSize:'11px', color:'#a5b4fc' }

/* ── 3D Bar graph inside Canvas ── */
function Bar3D({ x, z, height, color, maxH }: any) {
  const ref = useRef<THREE.Mesh>(null)
  const norm = Math.max(0.05, height / maxH)
  const h = norm * 2.5

  useFrame(({ clock }) => {
    if (ref.current) {
      const glow = 0.3 + Math.sin(clock.elapsedTime * 1.5 + x) * 0.15
      ;(ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow
    }
  })

  return (
    <mesh ref={ref} position={[x, h / 2 - 1.5, z]}>
      <boxGeometry args={[0.35, h, 0.35]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  )
}

function Bars3DScene({ bars }: { bars: Array<{ value: number; color: string }> }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  const total = bars.length
  const spread = 0.7

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 4, 3]} intensity={1.5} color="#6366f1" />
      <pointLight position={[-3, 2, -3]} intensity={0.8} color="#c9a84c" />
      <gridHelper args={[total * spread + 1, total + 1, '#1e2638', '#161b27']} position={[0, -1.5, 0]} />
      {bars.map((b, i) => (
        <Bar3D key={i} x={(i - (total - 1) / 2) * spread} z={0} height={b.value} color={b.color} maxH={max} />
      ))}
      <OrbitControls enableZoom enablePan makeDefault autoRotate autoRotateSpeed={0.5} />
      <fog attach="fog" args={['#06080f', 12, 22]} />
    </>
  )
}

interface Props { owner: string; name: string }

export default function ActivityDashboard3D({ owner, name }: Props) {
  const [data, setData] = useState<any>({ commits:[], prs:[], issues:[], contributors:[], languages:[] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'commits'|'prs'|'issues'|'contributors'>('commits')

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
    const h: Record<string,string> = {
      Accept: 'application/vnd.github.v3+json',
      ...(token && token !== 'your-github-token-here' && token.length > 10 ? { Authorization: `Bearer ${token}` } : {})
    }
    Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${name}/commits?per_page=30`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${name}/pulls?state=all&per_page=20`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${name}/issues?state=all&per_page=20`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${name}/contributors?per_page=15`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${name}/languages`, { headers: h }).then(r => r.ok ? r.json() : {}),
    ]).then(([commits, prs, issues, contributors, langs]) => {
      setData({
        commits: Array.isArray(commits) ? commits : [],
        prs: Array.isArray(prs) ? prs : [],
        issues: Array.isArray(issues) ? issues.filter((i:any) => !i.pull_request) : [],
        contributors: Array.isArray(contributors) ? contributors : [],
        languages: Object.entries(langs || {}).map(([k,v]) => ({ name: k, value: v as number })),
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [owner, name])

  // Commits per day chart
  const commitsPerDay = (() => {
    const map: Record<string,number> = {}
    data.commits.forEach((c:any) => {
      const d = c.commit?.author?.date?.slice(0,10)
      if (d) map[d] = (map[d]||0) + 1
    })
    return Object.entries(map).sort().slice(-10).map(([date,count]) => ({ date: date.slice(5), count }))
  })()

  // PR status
  const prOpen   = data.prs.filter((p:any) => p.state === 'open').length
  const prClosed = data.prs.filter((p:any) => p.state === 'closed').length
  const prMerged = data.prs.filter((p:any) => p.merged_at).length
  const prData   = [
    { name:'Open', value: prOpen,   color:'#22c55e' },
    { name:'Merged', value: prMerged, color:'#6366f1' },
    { name:'Closed', value: prClosed - prMerged, color:'#94a3b8' },
  ].filter(d => d.value > 0)

  // Issues status
  const issOpen   = data.issues.filter((i:any) => i.state === 'open').length
  const issClosed = data.issues.filter((i:any) => i.state === 'closed').length
  const issData   = [
    { name:'Open', value: issOpen,   color:'#ef4444' },
    { name:'Closed', value: issClosed, color:'#94a3b8' },
  ].filter(d => d.value > 0)

  // 3D bars — contributor commit counts
  const bars3d = data.contributors.slice(0,8).map((c:any, i:number) => ({
    value: c.contributions || 0,
    color: COLORS[i % COLORS.length],
  }))

  const STAT_TABS = [
    { id:'commits',      label:'Commits',      icon: GitCommit,      count: data.commits.length,      color:'#6366f1' },
    { id:'prs',          label:'Pull Requests', icon: GitPullRequest,  count: data.prs.length,          color:'#c9a84c' },
    { id:'issues',       label:'Issues',        icon: AlertCircle,    count: data.issues.length,        color:'#ef4444' },
    { id:'contributors', label:'Contributors',  icon: Users,           count: data.contributors.length, color:'#22c55e' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-full gap-3 text-[var(--text2)]">
      <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"/>
      <span className="text-sm">Fetching repository activity...</span>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      {/* ── Stat pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_TABS.map(({ id, label, icon: Icon, count, color }) => (
          <motion.button key={id}
            onClick={() => setActiveTab(id as any)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`p-4 rounded-2xl border text-left transition-all ${activeTab===id ? 'border-indigo-500/50 bg-indigo-500/10' : 'glass border-white/5 hover:border-white/10'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }}/>
              <span className="text-xs text-[var(--text3)]">{label}</span>
            </div>
            <div className="text-2xl font-black font-mono" style={{ color }}>{count}</div>
          </motion.button>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Commits over time — line chart */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
          className="lg:col-span-2 glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-[var(--surface2)] px-4 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Commit Activity (last 10 days)</span>
          </div>
          <div className="p-4">
            {commitsPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={commitsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2638"/>
                  <XAxis dataKey="date" tick={{ fill:'#475569', fontSize:10 }}/>
                  <YAxis tick={{ fill:'#475569', fontSize:10 }} width={25}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2}
                    dot={{ fill:'#6366f1', r:3 }} name="Commits"/>
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-[var(--text3)] text-sm text-center py-8">No commit data available</p>}
          </div>
        </motion.div>

        {/* Language breakdown */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
          className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-[var(--surface2)] px-4 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Languages</span>
          </div>
          <div className="p-4">
            {data.languages.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.languages.slice(0,6)} cx="50%" cy="50%" outerRadius={60}
                    dataKey="value" nameKey="name">
                    {data.languages.slice(0,6).map((_:any,i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={TT_STYLE} formatter={(v:any,n:any) => [n,'']}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-[var(--text3)] text-sm text-center py-8">No language data</p>}
          </div>
        </motion.div>
      </div>

      {/* ── PR / Issues charts ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
          className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-[var(--surface2)] px-4 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Pull Requests</span>
          </div>
          <div className="p-4 flex items-center gap-4">
            {prData.length > 0 ? (
              <>
                <PieChart width={100} height={100}>
                  <Pie data={prData} cx={50} cy={50} innerRadius={28} outerRadius={45} dataKey="value">
                    {prData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {prData.map(d=>(
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{background:d.color}}/>
                      <span className="text-[var(--text2)]">{d.name}</span>
                      <span className="font-bold ml-auto" style={{color:d.color}}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-[var(--text3)] text-sm text-center w-full py-6">No PR data</p>}
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-[var(--surface2)] px-4 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Issues</span>
          </div>
          <div className="p-4 flex items-center gap-4">
            {issData.length > 0 ? (
              <>
                <PieChart width={100} height={100}>
                  <Pie data={issData} cx={50} cy={50} innerRadius={28} outerRadius={45} dataKey="value">
                    {issData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {issData.map(d=>(
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{background:d.color}}/>
                      <span className="text-[var(--text2)]">{d.name}</span>
                      <span className="font-bold ml-auto" style={{color:d.color}}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-[var(--text3)] text-sm text-center w-full py-6">No issue data</p>}
          </div>
        </motion.div>
      </div>

      {/* ── 3D contributor bars ── */}
      {bars3d.length > 0 && (
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
          className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-[var(--surface2)] px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">3D Contributor Activity</span>
            <span className="text-xs text-[var(--text3)] font-mono">drag to rotate</span>
          </div>
          <div className="grid lg:grid-cols-2">
            {/* 3D Canvas */}
            <div style={{height:240}}>
              <Canvas camera={{ position:[0,2,6], fov:50 }} style={{background:'transparent'}}>
                <Bars3DScene bars={bars3d}/>
              </Canvas>
            </div>
            {/* Contributor list */}
            <div className="p-4 space-y-2 border-t lg:border-t-0 lg:border-l border-white/5 overflow-y-auto" style={{maxHeight:240}}>
              {data.contributors.slice(0,8).map((c:any, i:number) => (
                <a key={i} href={c.html_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group">
                  <img src={c.avatar_url} alt={c.login} className="w-7 h-7 rounded-full border border-white/10 flex-shrink-0"/>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">{c.login}</div>
                    <div className="text-xs text-[var(--text3)]">{c.contributions} commits</div>
                  </div>
                  <div className="h-1.5 w-16 bg-[var(--surface2)] rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.round((c.contributions / (data.contributors[0]?.contributions||1)) * 100)}%`,
                      background: COLORS[i%COLORS.length]
                    }}/>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Detail list for active tab ── */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
        className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="bg-[var(--surface2)] px-4 py-3 border-b border-white/5 flex items-center gap-2">
          {(() => {
            const t = STAT_TABS.find(s=>s.id===activeTab)!
            return <><t.icon size={13} style={{color:t.color}}/><span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Recent {t.label}</span></>
          })()}
        </div>
        <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
          {activeTab==='commits' && data.commits.slice(0,8).map((c:any,i:number)=>(
            <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-white/3">
              <GitCommit size={13} className="text-indigo-400 flex-shrink-0 mt-0.5"/>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white truncate">{c.commit?.message?.split('\n')[0]}</p>
                <p className="text-xs text-[var(--text3)] mt-0.5">{c.commit?.author?.name} · {c.commit?.author?.date?.slice(0,10)}</p>
              </div>
            </div>
          ))}
          {activeTab==='prs' && data.prs.slice(0,8).map((p:any,i:number)=>(
            <a key={i} href={p.html_url} target="_blank" rel="noopener noreferrer"
              className="px-4 py-3 flex items-start gap-3 hover:bg-white/3 block">
              <GitPullRequest size={13} className="text-[#c9a84c] flex-shrink-0 mt-0.5"/>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white truncate">#{p.number} {p.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${p.state==='open'?'bg-green-500/15 text-green-400':'bg-purple-500/15 text-purple-400'}`}>{p.merged_at?'merged':p.state}</span>
                  <span className="text-xs text-[var(--text3)]">{p.user?.login}</span>
                </div>
              </div>
              <ExternalLink size={11} className="text-[var(--text3)] flex-shrink-0 mt-0.5"/>
            </a>
          ))}
          {activeTab==='issues' && data.issues.slice(0,8).map((iss:any,i:number)=>(
            <a key={i} href={iss.html_url} target="_blank" rel="noopener noreferrer"
              className="px-4 py-3 flex items-start gap-3 hover:bg-white/3 block">
              <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5"/>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white truncate">#{iss.number} {iss.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${iss.state==='open'?'bg-red-500/15 text-red-400':'bg-gray-500/15 text-gray-400'}`}>{iss.state}</span>
                  <span className="text-xs text-[var(--text3)]">{iss.user?.login}</span>
                </div>
              </div>
              <ExternalLink size={11} className="text-[var(--text3)] flex-shrink-0 mt-0.5"/>
            </a>
          ))}
          {activeTab==='contributors' && data.contributors.slice(0,8).map((c:any,i:number)=>(
            <a key={i} href={c.html_url} target="_blank" rel="noopener noreferrer"
              className="px-4 py-3 flex items-center gap-3 hover:bg-white/3">
              <img src={c.avatar_url} alt={c.login} className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0"/>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white">{c.login}</div>
                <div className="text-xs text-[var(--text3)]">{c.contributions} commits</div>
              </div>
              <ExternalLink size={11} className="text-[var(--text3)]"/>
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
