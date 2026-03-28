'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,LineChart,Line } from 'recharts'

const COLORS = ['#6366f1','#c9a84c','#3b82f6','#8b5cf6','#06b6d4','#f59e0b','#818cf8','#a5b4fc']
const TT = { backgroundColor:'#0d1117',border:'1px solid rgba(99,102,241,0.25)',borderRadius:'8px',fontFamily:'JetBrains Mono',fontSize:'11px',color:'#a5b4fc' }

interface Props { repoData:any; owner:string; name:string }
export default function CodeMetrics({ repoData }:Props) {
  const tree = repoData?.tree||[]
  const files = tree.filter((f:any)=>f.type==='blob')

  const langData = useMemo(()=>{
    const c:Record<string,number>={}
    files.forEach((f:any)=>{ const e=f.path.split('.').pop()||'other'; c[e]=(c[e]||0)+1 })
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([n,v])=>({name:'.'+n,value:v}))
  },[tree])

  const dirData = useMemo(()=>{
    const c:Record<string,number>={}
    files.forEach((f:any)=>{ const d=f.path.includes('/')?f.path.split('/')[0]:'root'; c[d]=(c[d]||0)+1 })
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([n,v])=>({name:n,value:v}))
  },[tree])

  const depthData = useMemo(()=>{
    const d:Record<number,number>={}
    files.forEach((f:any)=>{ const n=f.path.split('/').length; d[n]=(d[n]||0)+1 })
    return Object.entries(d).sort((a,b)=>+a[0]-+b[0]).map(([depth,count])=>({depth:'L'+depth,count}))
  },[tree])

  const total=files.length; const dirs=tree.filter((f:any)=>f.type==='tree').length
  const maxDepth=Math.max(...files.map((f:any)=>f.path.split('/').length),0)
  const health=Math.min(100,Math.round(100-Math.min(total/20,30)-Math.min(maxDepth*2,20)))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Total Files',total,'#6366f1'],['Directories',dirs,'#c9a84c'],['Max Depth',maxDepth,'#3b82f6'],['Health',health+'%','#22c55e']].map(([l,v,c],i)=>(
          <motion.div key={l as string} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
            className="glass rounded-xl p-4 border border-white/5">
            <div className="text-2xl font-black font-mono" style={{color:c as string}}>{String(v)}</div>
            <div className="text-xs text-[var(--text3)] mt-0.5">{l as string}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-[var(--surface2)] px-5 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Files by Extension</span>
          </div>
          <div className="p-5"><ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={langData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
              label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10} fontFamily="JetBrains Mono">
              {langData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie><Tooltip contentStyle={TT}/></PieChart>
          </ResponsiveContainer></div>
        </motion.div>
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
          className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-[var(--surface2)] px-5 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Files per Directory</span>
          </div>
          <div className="p-5"><ResponsiveContainer width="100%" height={220}>
            <BarChart data={dirData} margin={{top:5,right:5,bottom:5,left:-20}}>
              <XAxis dataKey="name" tick={{fill:'#475569',fontSize:10,fontFamily:'JetBrains Mono'}}/>
              <YAxis tick={{fill:'#475569',fontSize:10,fontFamily:'JetBrains Mono'}}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} style={{filter:'drop-shadow(0 0 6px rgba(99,102,241,0.4))'}}/>
            </BarChart>
          </ResponsiveContainer></div>
        </motion.div>
      </div>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
        className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="bg-[var(--surface2)] px-5 py-3 border-b border-white/5">
          <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">File Depth Distribution</span>
        </div>
        <div className="p-5"><ResponsiveContainer width="100%" height={160}>
          <LineChart data={depthData} margin={{top:5,right:20,bottom:5,left:-20}}>
            <XAxis dataKey="depth" tick={{fill:'#475569',fontSize:10,fontFamily:'JetBrains Mono'}}/>
            <YAxis tick={{fill:'#475569',fontSize:10,fontFamily:'JetBrains Mono'}}/>
            <Tooltip contentStyle={TT}/>
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2}
              dot={{fill:'#6366f1',strokeWidth:0,r:3}} style={{filter:'drop-shadow(0 0 4px rgba(99,102,241,0.6))'}}/>
          </LineChart>
        </ResponsiveContainer></div>
      </motion.div>
    </div>
  )
}
