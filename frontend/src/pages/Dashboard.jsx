import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService, getCurrentWeather, getForecast } from '../services/apiService'

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const WX_MAP = {
  'clear sky':'☀️','few clouds':'🌤️','scattered clouds':'⛅','broken clouds':'☁️',
  'overcast clouds':'☁️','light rain':'🌦️','moderate rain':'🌧️','heavy intensity rain':'🌧️',
  'shower rain':'🌦️','rain':'🌧️','thunderstorm':'⛈️','snow':'❄️','light snow':'🌨️',
  'mist':'🌫️','fog':'🌫️','haze':'🌫️','drizzle':'🌦️',
}
const wxIcon = (desc='') => { const d=desc.toLowerCase(); for(const[k,v] of Object.entries(WX_MAP)){if(d.includes(k))return v} return '🌡️' }

const badgeClass = (cat='') => {
  const m={documents:'badge-documents',clothing:'badge-clothing',clothes:'badge-clothes',
    electronics:'badge-electronics',health:'badge-health',accessories:'badge-accessories',
    essentials:'badge-essentials',toiletries:'badge-toiletries'}
  return m[cat.toLowerCase()]||'badge-other'
}
const priDot = (p) => ({high:'🔴',medium:'🟡',low:'🟢'}[p]||'⚪')
const priClass= (p) => ({high:'pri-high',medium:'pri-medium',low:'pri-low'}[p]||'')

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '—'
const nightsCount = (s,e) => (!s||!e) ? 0 : Math.max(0,Math.round((new Date(e)-new Date(s))/86400000))

// ─────────────────────────────────────────────────────────────────────────────
// Smart packing suggestions per weather condition
// ─────────────────────────────────────────────────────────────────────────────
const ALWAYS = [
  {name:'Passport / ID',       category:'Documents',    priority:'high',   reason:'📄 Always required'},
  {name:'Phone & charger',     category:'Electronics',  priority:'high',   reason:'🔌 Stay connected'},
  {name:'Power bank',          category:'Electronics',  priority:'medium', reason:'🔋 Backup power'},
  {name:'Toothbrush & paste',  category:'Toiletries',   priority:'high',   reason:'🪥 Daily hygiene'},
  {name:'Deodorant',           category:'Toiletries',   priority:'medium', reason:'✨ Stay fresh'},
  {name:'Travel adaptor',      category:'Electronics',  priority:'medium', reason:'🔌 Foreign sockets'},
  {name:'First aid kit',       category:'Health',       priority:'medium', reason:'🩺 Safety first'},
  {name:'Snacks',              category:'Essentials',   priority:'low',    reason:'🍫 Hunger emergencies'},
]
const SUNNY = [
  {name:'Sunscreen SPF 50+',   category:'Health',       priority:'high',   reason:'☀️ UV protection'},
  {name:'Sunglasses',          category:'Accessories',  priority:'high',   reason:'😎 Eye protection'},
  {name:'Wide-brim hat',       category:'Accessories',  priority:'high',   reason:'🧢 Head shading'},
  {name:'Light linen shirt',   category:'Clothing',     priority:'medium', reason:'🌡️ Breathable fabric'},
  {name:'Water bottle 1L',     category:'Essentials',   priority:'high',   reason:'💧 Hydration essential'},
  {name:'Flip flops',          category:'Clothing',     priority:'low',    reason:'🏖️ Sandy ground'},
  {name:'After-sun lotion',    category:'Health',       priority:'low',    reason:'☀️ Soothe sunburn'},
]
const RAINY = [
  {name:'Compact umbrella',    category:'Accessories',  priority:'high',   reason:'🌧️ Stay dry'},
  {name:'Waterproof jacket',   category:'Clothing',     priority:'high',   reason:'🌧️ Wind & rain'},
  {name:'Waterproof boots',    category:'Clothing',     priority:'medium', reason:'🌧️ Wet pavement'},
  {name:'Zip-lock bags',       category:'Essentials',   priority:'medium', reason:'💼 Protect gadgets'},
  {name:'Quick-dry towel',     category:'Essentials',   priority:'low',    reason:'🚿 Dries fast'},
  {name:'Spare socks ×3',      category:'Clothing',     priority:'medium', reason:'🧦 Dry feet'},
]
const COLD = [
  {name:'Thermal base layer',  category:'Clothing',     priority:'high',   reason:'❄️ Core warmth'},
  {name:'Down / puffer jacket',category:'Clothing',     priority:'high',   reason:'❄️ Insulation'},
  {name:'Wool gloves',         category:'Accessories',  priority:'high',   reason:'❄️ Frostbite prevention'},
  {name:'Beanie hat',          category:'Accessories',  priority:'high',   reason:'❄️ 40% heat from head'},
  {name:'Scarf',               category:'Accessories',  priority:'medium', reason:'❄️ Neck warmth'},
  {name:'Lip balm',            category:'Health',       priority:'medium', reason:'💨 Prevent chapping'},
  {name:'Hand warmers',        category:'Accessories',  priority:'low',    reason:'🔥 Extra warmth'},
  {name:'Thermal socks',       category:'Clothing',     priority:'high',   reason:'❄️ Warm feet'},
]
const WINDY = [
  {name:'Windproof jacket',    category:'Clothing',     priority:'high',   reason:'💨 Block gusts'},
  {name:'Chin-strap hat',      category:'Accessories',  priority:'medium', reason:'💨 Won\'t blow off'},
  {name:'Lip balm',            category:'Health',       priority:'medium', reason:'💨 Wind chapping'},
  {name:'Goggles / wrap shades',category:'Accessories', priority:'low',    reason:'💨 Eye protection'},
]

function getSuggestions(weather) {
  if (!weather) return ALWAYS
  const desc = (weather.description||'').toLowerCase()
  const temp = weather.temp ?? 20
  const wind = weather.wind ?? 0
  let extra = []
  if (temp <= 8  || desc.includes('snow'))                     extra = COLD
  else if (temp >= 28 || desc.includes('clear')||desc.includes('sun')) extra = SUNNY
  else if (desc.includes('rain')||desc.includes('drizzle')||desc.includes('shower')) extra = RAINY
  if (wind > 28) extra = [...WINDY, ...extra]
  return [...extra, ...ALWAYS]
}

// ─────────────────────────────────────────────────────────────────────────────
// ProgressRing
// ─────────────────────────────────────────────────────────────────────────────
function ProgressRing({ pct, size=96, stroke=7 }) {
  const r = (size - stroke*2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct/100) * circ
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#ring-grad)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={offset} style={{transition:'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)'}}/>
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1b4332"/>
          <stop offset="50%"  stopColor="#2d6a4f"/>
          <stop offset="100%" stopColor="#74c69d"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WeatherPanel
// ─────────────────────────────────────────────────────────────────────────────
function WeatherPanel({ destination }) {
  const [wx, setWx]           = useState(null)
  const [forecast, setFore]   = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    if (!destination?.name) return
    setLoading(true); setErr(''); setWx(null); setFore([])

    Promise.all([
      getCurrentWeather(destination.name).catch(()=>null),
      getForecast(destination.name).catch(()=>null),
    ]).then(([cur, fore]) => {
      if (cur) {
        setWx({
          temp:        Math.round(cur.main.temp),
          feelsLike:   Math.round(cur.main.feels_like),
          humidity:    cur.main.humidity,
          wind:        Math.round(cur.wind.speed * 3.6),
          description: cur.weather[0].description,
          icon:        wxIcon(cur.weather[0].description),
          pressure:    cur.main.pressure,
          visibility:  cur.visibility ? Math.round(cur.visibility/1000) : null,
          country:     cur.sys.country,
        })
      } else {
        setErr('City not found. Check spelling.')
      }
      if (fore?.list) {
        const days = {}
        fore.list.forEach(item => {
          const key = new Date(item.dt*1000).toLocaleDateString('en-US',{weekday:'short'})
          if (!days[key]) days[key] = {temps:[], descs:[], key}
          days[key].temps.push(item.main.temp)
          days[key].descs.push(item.weather[0].description)
        })
        setFore(Object.values(days).slice(0,5).map(d => ({
          day:  d.key,
          high: Math.round(Math.max(...d.temps)),
          low:  Math.round(Math.min(...d.temps)),
          icon: wxIcon(d.descs[Math.floor(d.descs.length/2)]),
        })))
      }
    }).finally(() => setLoading(false))
  }, [destination?.name])

  return (
    <div className="glass rounded-3xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <span>🌐</span>
        <h3 className="font-display text-lg font-semibold text-white">Live Weather</h3>
        {wx && <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400"><span className="live-dot">●</span> LIVE</span>}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8">
          <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
          <span className="text-white/30 text-sm">Fetching live data…</span>
        </div>
      )}

      {err && !loading && (
        <div className="flex flex-col items-center justify-center flex-1 py-8">
          <div className="text-5xl mb-3">🌫️</div>
          <p className="text-white/40 text-sm text-center">{err}</p>
        </div>
      )}

      {wx && !loading && (
        <div className="flex flex-col gap-5 flex-1">
          {/* Hero temp */}
          <div className="flex items-start gap-4">
            <div className="text-6xl bounce-slow select-none">{wx.icon}</div>
            <div>
              <div className="text-5xl font-bold text-white leading-none">
                {wx.temp}°<span className="text-3xl text-white/40 font-normal">C</span>
              </div>
              <div className="text-white/55 capitalize text-sm mt-1">{wx.description}</div>
              <div className="text-white/30 text-xs mt-0.5">Feels like {wx.feelsLike}°C</div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {icon:'💧', label:'Humidity',   val:`${wx.humidity}%`},
              {icon:'💨', label:'Wind',       val:`${wx.wind} km/h`},
              {icon:'👁️', label:'Visibility', val: wx.visibility ? `${wx.visibility} km` : '—'},
              {icon:'🔵', label:'Pressure',   val:`${wx.pressure} hPa`},
            ].map(s=>(
              <div key={s.label} className="stat-card">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-white/35 text-xs">{s.label}</div>
                <div className="text-white font-semibold text-sm">{s.val}</div>
              </div>
            ))}
          </div>

          {/* 5-day forecast */}
          {forecast.length>0 && (
            <div>
              <div className="text-white/35 text-xs uppercase tracking-widest mb-3">5-Day Forecast</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {forecast.map((d,i)=>(
                  <div key={i} className="flex-shrink-0 stat-card text-center min-w-[58px]">
                    <div className="text-white/40 text-xs mb-1">{d.day}</div>
                    <div className="text-2xl mb-1">{d.icon}</div>
                    <div className="text-white text-xs font-bold">{d.high}°</div>
                    <div className="text-white/30 text-xs">{d.low}°</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PackingSection
// ─────────────────────────────────────────────────────────────────────────────
function PackingSection({ trip, weather }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newCat, setNewCat]     = useState('Essentials')
  const [newPri, setNewPri]     = useState('medium')
  const [filter, setFilter]     = useState('all')
  const [addedSet, setAddedSet] = useState(new Set())
  const [suggestions, setSugg]  = useState([])

  const CATS = ['Essentials','Clothing','Electronics','Documents','Health','Accessories','Toiletries','Other']

  const load = useCallback(async () => {
    if (!trip) return
    setLoading(true)
    try { setItems(await apiService.getItems(trip._id)) }
    catch { } finally { setLoading(false) }
  }, [trip])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSugg(getSuggestions(weather)); setAddedSet(new Set()) }, [weather, trip?._id])

  const addItem = async () => {
    if (!newName.trim() || !trip) return
    await apiService.addItem({name:newName, category:newCat, priority:newPri, destinationId:trip._id})
    setNewName(''); load()
  }

  const toggle = async (id) => {
    const updated = await apiService.toggleItemPacked(id)
    setItems(prev => prev.map(i => i._id===id ? updated : i))
  }

  const remove = async (id) => {
    await apiService.deleteItem(id)
    setItems(prev => prev.filter(i => i._id!==id))
  }

  const addSugg = async (s, idx) => {
    if (!trip || addedSet.has(idx)) return
    await apiService.addItem({name:s.name, category:s.category, priority:s.priority, destinationId:trip._id})
    setAddedSet(prev => new Set([...prev, idx]))
    load()
  }

  const packed = items.filter(i=>i.packed).length
  const total  = items.length
  const pct    = total ? Math.round((packed/total)*100) : 0

  const displayed = filter==='all'     ? items
                  : filter==='packed'  ? items.filter(i=>i.packed)
                  :                      items.filter(i=>!i.packed)

  const statusMsg = pct===100 ? '🎉 Fully packed! Bon voyage!' : pct>=70 ? '✨ Almost ready!' : pct>=40 ? '💪 Good progress!' : total===0 ? '🧳 Add items to start' : '⬜ Just getting started…'

  return (
    <div className="flex flex-col gap-4">

      {/* ── Progress card ── */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <ProgressRing pct={pct} size={96} stroke={7}/>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-xl">{pct}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl font-semibold text-white mb-1">Packing Progress</h3>
            <p className="text-white/40 text-sm mb-3">{packed} of {total} items packed</p>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <div className="prog-bar-fill h-full" style={{width:`${pct}%`}}/>
            </div>
            <p className="text-white/30 text-xs mt-2">{statusMsg}</p>
          </div>
        </div>
      </div>

      {/* ── Add item ── */}
      <div className="glass rounded-3xl p-5">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">Add Custom Item</div>
        <div className="flex flex-col gap-2">
          <input className="inp" placeholder="Item name…" value={newName}
            onChange={e=>setNewName(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addItem()}/>
          <div className="flex gap-2">
            <select className="inp flex-1 text-sm" value={newCat} onChange={e=>setNewCat(e.target.value)}>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            <select className="inp w-36 text-sm" value={newPri} onChange={e=>setNewPri(e.target.value)}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <button onClick={addItem} className="btn-primary">+ Add to List</button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="glass rounded-2xl p-1.5 flex gap-1">
        {[
          {key:'all',     label:`All (${total})`},
          {key:'unpacked',label:`⬜ Todo (${total-packed})`},
          {key:'packed',  label:`✅ Done (${packed})`},
        ].map(t=>(
          <button key={t.key} onClick={()=>setFilter(t.key)}
            className={`tab-btn ${filter===t.key?'active':''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Items list ── */}
      <div className="glass rounded-3xl p-4">
        {loading ? (
          <div className="py-10 text-center text-white/25 text-sm">Loading…</div>
        ) : displayed.length===0 ? (
          <div className="py-10 text-center">
            <div className="text-5xl mb-2">🧳</div>
            <p className="text-white/30 text-sm">
              {filter==='all' ? 'No items yet. Add some above!' : filter==='packed' ? 'Nothing packed yet.' : 'Everything is packed! 🎉'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 stagger">
            {displayed.map(item=>(
              <div key={item._id} className={`item-row group ${item.packed?'is-packed':''}`}>
                {/* Checkbox */}
                <button onClick={()=>toggle(item._id)} className={`cb-wrap ${item.packed?'checked':''}`}>
                  {item.packed && (
                    <svg className="cb-check" width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L3.8 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                {/* Name */}
                <span className={`flex-1 text-sm font-medium select-none transition-all duration-300
                  ${item.packed?'line-through text-white/25':'text-white'}`}>
                  {item.name}
                </span>

                {/* Badges — show on hover */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <span className={`badge ${badgeClass(item.category)}`}>{item.category}</span>
                  <span className={`text-xs ${priClass(item.priority)}`}>{priDot(item.priority)}</span>
                </div>

                {/* Delete */}
                <button onClick={()=>remove(item._id)}
                  className="text-white/15 hover:text-red-400 transition-colors text-xl leading-none
                    opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Weather-based suggestions ── */}
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🤖</span>
          <h4 className="font-display text-base font-semibold text-white">Smart Suggestions</h4>
          <span className="ml-auto text-xs text-white/25">Weather-based</span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
          {suggestions.map((s,i)=>(
            <button key={i} onClick={()=>addSugg(s,i)} disabled={addedSet.has(i)}
              className={`chip ${addedSet.has(i)?'added':''}`}>
              <span className={`badge flex-shrink-0 ${badgeClass(s.category)} ${addedSet.has(i)?'opacity-40':''}`}>
                {addedSet.has(i)?'✓':'+'}
              </span>
              <span className={`text-sm flex-1 text-left ${addedSet.has(i)?'line-through text-white/30':'text-white'}`}>
                {s.name}
              </span>
              <span className="text-xs text-white/25 flex-shrink-0">{s.reason}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const nav  = useNavigate()
  const user = JSON.parse(localStorage.getItem('user')||'{}')

  const [trips, setTrips]         = useState([])
  const [current, setCurrent]     = useState(null)
  const [wx, setWx]               = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState({name:'',country:'',startDate:'',endDate:''})
  const [formErr, setFormErr]     = useState('')
  const [mobileTab, setMobTab]    = useState('packing') // 'packing' | 'weather'
  const [savingTrip, setSaving]   = useState(false)

  const loadTrips = async () => {
    try { const d = await apiService.getDestinations(); setTrips(d) } catch {}
  }

  useEffect(()=>{ loadTrips() },[])

  const selectTrip = async (trip) => {
    setCurrent(trip); setWx(null); setMobTab('packing')
    try {
      const data = await getCurrentWeather(trip.name)
      setWx({
        temp:        Math.round(data.main.temp),
        feelsLike:   Math.round(data.main.feels_like),
        humidity:    data.main.humidity,
        wind:        Math.round(data.wind.speed*3.6),
        description: data.weather[0].description,
        icon:        wxIcon(data.weather[0].description),
      })
    } catch {}
  }

  const openNew = () => {
    setEditId(null)
    setForm({name:'',country:'',startDate:'',endDate:''})
    setFormErr('')
    setShowForm(true)
  }

  const openEdit = (trip, e) => {
    e.stopPropagation()
    setEditId(trip._id)
    setForm({name:trip.name, country:trip.country,
      startDate: trip.startDate?.split('T')[0]||'',
      endDate:   trip.endDate?.split('T')[0]||''})
    setFormErr('')
    setShowForm(true)
  }

  const saveTrip = async () => {
    const {name,country,startDate,endDate} = form
    if (!name||!country||!startDate||!endDate){ setFormErr('Please fill all fields'); return }
    setSaving(true)
    try {
      if (editId) { await apiService.updateDestination(editId, form); setEditId(null) }
      else        { await apiService.createDestination(form) }
      setForm({name:'',country:'',startDate:'',endDate:''}); setShowForm(false); setFormErr('')
      await loadTrips()
    } catch(e){ setFormErr(e.response?.data?.error||'Could not save trip') }
    finally { setSaving(false) }
  }

  const deleteTrip = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this trip and all its packing items?')) return
    await apiService.deleteDestination(id)
    if (current?._id===id){ setCurrent(null); setWx(null) }
    loadTrips()
  }

  const logout = () => { localStorage.clear(); nav('/login') }

  return (
    <div className="bg-aurora min-h-screen relative overflow-x-hidden">
      <div className="orb orb-green"/>
      <div className="orb orb-amber"/>

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4 border-b border-white/6 glass">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center text-lg">✈️</div>
          <span className="font-display text-xl font-bold text-white tracking-tight">Pack & Go</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 glass px-3 py-1.5 rounded-full">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white select-none">
              {user.name?.[0]?.toUpperCase()||'U'}
            </div>
            <span className="text-white/60 text-sm">{user.name}</span>
          </div>
          <button onClick={logout} className="text-white/35 hover:text-red-400 text-sm transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
            Sign out
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6
        grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

        {/* ─── LEFT: Trips sidebar ─── */}
        <aside className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">My Trips</h2>
            <button onClick={showForm ? ()=>{setShowForm(false);setEditId(null)} : openNew}
              className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-light
                transition-all duration-200 hover:scale-110
                bg-gradient-to-br from-emerald-700 to-emerald-500 text-white shadow-lg shadow-emerald-900/30">
              {showForm ? '×' : '+'}
            </button>
          </div>

          {/* Trip form */}
          {showForm && (
            <div className="glass-strong rounded-2xl p-5 scale-in">
              <div className="text-white/45 text-xs uppercase tracking-widest font-semibold mb-4">
                {editId ? '✏️ Edit Trip' : '🗺️ New Trip'}
              </div>
              {formErr && <p className="text-red-400 text-xs mb-3 bg-red-500/10 px-3 py-2 rounded-xl">{formErr}</p>}
              <div className="flex flex-col gap-3">
                <input className="inp" placeholder="City (e.g. Tokyo)" value={form.name}
                  onChange={e=>setForm({...form,name:e.target.value})}/>
                <input className="inp" placeholder="Country (e.g. Japan)" value={form.country}
                  onChange={e=>setForm({...form,country:e.target.value})}/>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-white/35 text-xs block mb-1">Departure</label>
                    <input type="date" className="inp text-sm" value={form.startDate}
                      onChange={e=>setForm({...form,startDate:e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-white/35 text-xs block mb-1">Return</label>
                    <input type="date" className="inp text-sm" value={form.endDate}
                      onChange={e=>setForm({...form,endDate:e.target.value})}/>
                  </div>
                </div>
                <button onClick={saveTrip} disabled={savingTrip} className="btn-primary mt-1">
                  {savingTrip
                    ? <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg> Saving…
                      </span>
                    : editId ? '✓ Update Trip' : '🗺️ Create Trip'}
                </button>
              </div>
            </div>
          )}

          {/* Trip list */}
          <div className="flex flex-col gap-2 stagger">
            {trips.length===0 && !showForm && (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3 bounce-slow">🗺️</div>
                <p className="text-white/40 text-sm">No trips yet.</p>
                <p className="text-white/20 text-xs mt-1">Tap + to plan your first adventure!</p>
              </div>
            )}

            {trips.map(trip=>{
              const nights = nightsCount(trip.startDate, trip.endDate)
              const isActive = current?._id===trip._id
              return (
                <div key={trip._id} onClick={()=>selectTrip(trip)}
                  className={`trip-card ${isActive?'active':''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span>📍</span>
                        <span className="font-semibold text-white text-sm truncate">{trip.name}</span>
                      </div>
                      <div className="text-white/35 text-xs mb-2 pl-6">{trip.country}</div>
                      <div className="flex items-center gap-2 pl-6 flex-wrap">
                        <span className="text-xs text-white/35 bg-white/6 px-2 py-0.5 rounded-full">
                          {fmtDate(trip.startDate)} → {fmtDate(trip.endDate)}
                        </span>
                        {nights>0 && (
                          <span className="text-xs text-white/25">{nights} nights</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button onClick={e=>openEdit(trip,e)}
                        className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/8 transition-all text-xs">✏️</button>
                      <button onClick={e=>deleteTrip(trip._id,e)}
                        className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">🗑️</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ─── RIGHT: Main content ─── */}
        <main>
          {!current ? (
            <div className="glass rounded-3xl p-16 text-center flex flex-col items-center justify-center min-h-[60vh]">
              <div className="text-9xl mb-6 bounce-slow select-none">🌍</div>
              <h2 className="font-display text-3xl font-bold text-white mb-3">Where to next?</h2>
              <p className="text-white/35 max-w-sm leading-relaxed">
                Select a trip on the left or create a new one. We'll check the live weather and suggest exactly what to pack.
              </p>
              <button onClick={openNew}
                className="mt-8 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600
                  text-white font-semibold text-sm hover:from-emerald-700 hover:to-emerald-500
                  transition-all hover:-translate-y-1 shadow-lg shadow-emerald-900/30">
                + Plan a Trip
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 fade-in">

              {/* Trip hero banner */}
              <div className="glass rounded-3xl px-6 py-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📍</span>
                      <h2 className="font-display text-2xl font-bold text-white">{current.name}</h2>
                      <span className="text-white/40 font-normal">,</span>
                      <span className="font-display text-xl text-white/60">{current.country}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs glass px-3 py-1.5 rounded-full text-white/50">
                        📅 {fmtDate(current.startDate)} – {fmtDate(current.endDate)}
                      </span>
                      <span className="text-xs glass px-3 py-1.5 rounded-full text-white/50">
                        🌙 {nightsCount(current.startDate,current.endDate)} nights
                      </span>
                      {wx && (
                        <span className="text-xs px-3 py-1.5 rounded-full text-emerald-300 bg-emerald-900/30 border border-emerald-700/30">
                          {wx.icon} {wx.temp}°C · {wx.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Mobile tab toggle */}
                  <div className="flex sm:hidden gap-2 mt-2">
                    <button onClick={()=>setMobTab('packing')}
                      className={`tab-btn ${mobileTab==='packing'?'active':''}`}>🧳 Packing</button>
                    <button onClick={()=>setMobTab('weather')}
                      className={`tab-btn ${mobileTab==='weather'?'active':''}`}>🌤 Weather</button>
                  </div>
                </div>
              </div>

              {/* Content columns */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
                {/* Packing list */}
                <div className={mobileTab==='weather'?'hidden sm:block':''}>
                  <PackingSection trip={current} weather={wx}/>
                </div>
                {/* Weather panel */}
                <div className={mobileTab==='packing'?'hidden sm:block':''}>
                  <WeatherPanel destination={current}/>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
