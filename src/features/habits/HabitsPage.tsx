import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Activity, Archive, ArrowLeft, Check, ChevronLeft, ChevronRight, Flame, MoreHorizontal, Plus, RotateCcw, SkipForward, Target, Trash2, X } from 'lucide-react'
import { addMonths, format, subMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import { db } from '../../db'
import { localDate, uid, type Habit, type HabitCompletion, type HabitFrequency } from '../../domain'
import { dayState, getFrequency, habitStats, isScheduled, localDay, shiftDay, type HabitDayState } from './habitLogic'
import styles from './HabitsPage.module.css'

const weekdays = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']
const colors = ['#438a67','#467caf','#d48252','#9877bd','#d26575','#399c9a','#bd9b3b','#65758b']
type FrequencyForm = 'daily'|'weekly'|'monthly'

interface Props { onRefresh: () => Promise<void>; onNotice: (message:string)=>void }

export default function HabitsPage({ onRefresh, onNotice }:Props) {
  const today=localDate()
  const [habits,setHabits]=useState<Habit[]>([]),[completions,setCompletions]=useState<HabitCompletion[]>([])
  const [archivedView,setArchivedView]=useState(false),[selected,setSelected]=useState<Habit|null>(null),[editing,setEditing]=useState<Habit|null>(null),[formOpen,setFormOpen]=useState(false)
  const [month,setMonth]=useState(new Date()),[selectedDay,setSelectedDay]=useState(today),[menu,setMenu]=useState<string|null>(null)
  const load=useCallback(async()=>{
    const all=await db.habits.toArray()
    const done=all.length?await db.completions.where('habitId').anyOf(all.map(h=>h.id)).toArray():[]
    setHabits(all.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)))
    setCompletions(done)
    setSelected(current=>current?all.find(h=>h.id===current.id)??null:null)
  },[])
  useEffect(()=>{void load()},[load])
  const visible=habits.filter(h=>h.archived===archivedView)
  const dates=useMemo(()=>Array.from({length:14},(_,i)=>shiftDay(today,i-13)),[today])
  const writeStatus=async(habit:Habit,date:string,status:HabitCompletion['status']|null)=>{
    if(date>today)return
    const matches=completions.filter(c=>c.habitId===habit.id&&c.localDate===date)
    const id=matches[0]?.id??`${habit.id}::${date}`
    if(status)await db.completions.put({id,habitId:habit.id,localDate:date,status,createdAt:matches[0]?.createdAt??new Date().toISOString(),updatedAt:new Date().toISOString()})
    else await Promise.all(matches.map(c=>db.completions.delete(c.id)))
    if(status&&matches.length>1)await Promise.all(matches.slice(1).map(c=>db.completions.delete(c.id)))
    await load();await onRefresh()
  }
  const editHabit=(habit?:Habit)=>{setMenu(null);setEditing(habit??null);setFormOpen(true)}
  const saveHabit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    const data=new FormData(event.currentTarget), title=String(data.get('title')??'').trim()
    if(!title){onNotice('Alışkanlık adı gerekli.');return}
    const period=String(data.get('period')||'daily') as FrequencyForm
    const selectedDays=data.getAll('weekdays').map(Number)
    const target=period==='weekly'?Number(data.get('weeklyTarget')||3):period==='monthly'?Number(data.get('monthlyTarget')||5):1
    const frequency:HabitFrequency={period,target,...(period==='daily'?{weekdays:selectedDays.length?selectedDays:[0,1,2,3,4,5,6]}:{})}
    const now=new Date().toISOString(), id=editing?.id??uid()
    const habit:Habit={id,kind:'habit',title,description:String(data.get('description')||'').trim(),color:String(data.get('color')||colors[0]),frequency,schedule:frequency.weekdays??[],archived:editing?.archived??false,localDate:editing?.localDate??today,createdAt:editing?.createdAt??now,updatedAt:now}
    await db.habits.put(habit);setFormOpen(false);setEditing(null);await load();await onRefresh();onNotice(editing?'Alışkanlık güncellendi.':'Alışkanlık eklendi.')
  }
  const archiveHabit=async(habit:Habit)=>{await db.habits.put({...habit,archived:!habit.archived,updatedAt:new Date().toISOString()});setMenu(null);await load();await onRefresh();onNotice(habit.archived?'Alışkanlık arşivden çıkarıldı.':'Alışkanlık arşivlendi.')}
  const deleteHabit=async(habit:Habit)=>{if(!confirm(`“${habit.title}” alışkanlığı ve tüm geçmiş kayıtları kalıcı olarak silinsin mi?`))return;await db.transaction('rw',db.habits,db.completions,async()=>{await db.habits.delete(habit.id);await db.completions.where('habitId').equals(habit.id).delete()});setMenu(null);setSelected(null);await load();await onRefresh();onNotice('Alışkanlık ve geçmişi silindi.')}

  if(selected){
    const stats=habitStats(selected,completions,today),frequency=getFrequency(selected)
    const monthStart=format(month,'yyyy-MM'),first=localDate(new Date(month.getFullYear(),month.getMonth(),1)),offset=(localDay(first).getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate()
    const dayCompletions=completions.filter(c=>c.habitId===selected.id&&c.localDate===selectedDay)
    const weekly=Array.from({length:8},(_,i)=>{const start=shiftDay(today,-((localDay(today).getDay()+6)%7)-7*(7-i));const end=shiftDay(start,6);const value=completions.filter(c=>c.habitId===selected.id&&c.localDate>=start&&c.localDate<=end&&c.status!=='skipped').length;return {label:format(localDay(start),'d',{locale:tr}),value}})
    const monthly=Array.from({length:6},(_,i)=>{const date=subMonths(month,5-i),start=format(date,'yyyy-MM-01'),end=localDate(new Date(date.getFullYear(),date.getMonth()+1,0));return {label:format(date,'MMM',{locale:tr}),value:completions.filter(c=>c.habitId===selected.id&&c.localDate>=start&&c.localDate<=end&&c.status!=='skipped').length}})
    const history=Array.from({length:90},(_,i)=>shiftDay(today,-i)).filter(d=>d>=selected.localDate)
    return <section className={styles.detail}>
      <button className={styles.back} onClick={()=>setSelected(null)}><ArrowLeft size={17}/> Alışkanlıklara dön</button>
      <header className={styles.detailHeader}><span className={styles.habitColor} style={{'--habit-color':selected.color||colors[0]} as CSSProperties}/><div className={styles.detailTitle}><div className="eyebrow">ALIŞKANLIK DETAYI</div><h1>{selected.title}</h1><p>{selected.description||frequencyText(frequency)}</p></div><button className="secondary" onClick={()=>editHabit(selected)}>Düzenle</button></header>
      <div className={styles.statGrid}><Stat icon={<Flame/>} label="Mevcut seri" value={`${stats.currentStreak} ${stats.periodLabel}`} /><Stat icon={<Target/>} label="En uzun seri" value={`${stats.longestStreak} ${stats.periodLabel}`} /><Stat icon={<Activity/>} label="Tamamlama oranı" value={`${stats.completionRate}%`} /><Stat icon={<Check/>} label="Tutarlılık" value={`${stats.consistencyScore}%`} /></div>
      <section className="panel"><div className="panel-heading"><div><h2>Haftalık ilerleme</h2><p>Son 8 haftadaki tamamlanma sayısı</p></div><b className={styles.progressText}>{stats.currentPeriodProgress}{frequency.period==='daily'?' gün':` / ${frequency.target}`}</b></div><div className={styles.progressChart}>{weekly.map((w,i)=><div className={styles.progressColumn} key={`${w.label}-${i}`} title={`${w.value} tamamlandı`}><span style={{height:`${Math.max(w.value?8:3,Math.min(100,w.value/7*100))}%`,background:selected.color||'var(--accent)'}}/><small>{w.label}</small></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Aylık ilerleme</h2><p>Son 6 aydaki tamamlanma sayısı</p></div></div><div className={styles.progressChart}>{monthly.map((m,i)=><div className={styles.progressColumn} key={`${m.label}-${i}`} title={`${m.value} tamamlandı`}><span style={{height:`${Math.max(m.value?8:3,Math.min(100,m.value/31*100))}%`,background:selected.color||'var(--accent)'}}/><small>{m.label}</small></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Geçmiş takvimi</h2><p>Bir güne dokunarak durumunu güncelle.</p></div><div className={styles.monthNav}><button onClick={()=>setMonth(subMonths(month,1))} aria-label="Önceki ay"><ChevronLeft/></button><b>{format(month,'MMMM yyyy',{locale:tr})}</b><button onClick={()=>setMonth(addMonths(month,1))} aria-label="Sonraki ay" disabled={monthStart>=today.slice(0,7)}><ChevronRight/></button></div></div><div className={styles.heatmap}><div className={styles.weekdays}>{weekdays.slice(1).concat(weekdays[0]).map(d=><span key={d}>{d}</span>)}</div><div className={styles.calendar}>{Array.from({length:offset},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:days},(_,i)=>{const date=`${monthStart}-${String(i+1).padStart(2,'0')}`,state=dayState(selected,date,completions,today);return <button key={date} title={`${format(localDay(date),'d MMMM yyyy',{locale:tr})}: ${stateText(state)}`} className={`${styles.heatDay} ${styles[state]}`} style={state==='completed'?{background:selected.color||'var(--accent)',borderColor:selected.color||'var(--accent)'}:undefined} aria-label={`${date}: ${stateText(state)}`} aria-pressed={selectedDay===date} disabled={date>today||date<selected.localDate||!isScheduled(selected,date)} onClick={()=>setSelectedDay(date)}>{i+1}</button>})}</div></div><div className={styles.legend}><span><i className={styles.completed}/>Tamamlandı</span><span><i className={styles.missed}/>Aksadı</span><span><i className={styles.skipped}/>Atlandı</span><span><i className={styles.unscheduled}/>Plan dışı</span></div><div className={styles.dayActions}><b>{format(localDay(selectedDay),'d MMMM yyyy',{locale:tr})} · {stateText(dayState(selected,selectedDay,completions,today))}</b><div><button className="secondary" disabled={selectedDay>today||!isScheduled(selected,selectedDay)} onClick={()=>void writeStatus(selected,selectedDay,'skipped')}><SkipForward size={15}/> Atla</button><button className="primary" disabled={selectedDay>today||!isScheduled(selected,selectedDay)} onClick={()=>void writeStatus(selected,selectedDay,dayCompletions.some(c=>c.status!=='skipped')?null:'completed')}><Check size={15}/>{dayCompletions.some(c=>c.status!=='skipped')?'İşareti kaldır':'Tamamlandı'}</button></div></div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Son kayıtlar</h2><p>Günlük durum geçmişi</p></div></div><div className={styles.history}>{history.map(date=><div key={date}><time>{format(localDay(date),'d MMM yyyy',{locale:tr})}</time><span className={`${styles.stateDot} ${styles[dayState(selected,date,completions,today)]}`}/><b>{stateText(dayState(selected,date,completions,today))}</b></div>)}</div></section>
      {formOpen&&<HabitForm habit={editing} onClose={()=>{setFormOpen(false);setEditing(null)}} onSubmit={saveHabit}/>}
    </section>
  }

  return <section className={styles.page}>
    <div className="page-heading"><div><div className="eyebrow">HER KÜÇÜK ADIM ÖNEMLİ</div><h1>Alışkanlıklar</h1><p>Bugünün ve geçmiş günlerin ilerlemesini takip et.</p></div><button className="primary" onClick={()=>editHabit()}><Plus size={17}/> Alışkanlık ekle</button></div>
    <section className={`panel ${styles.tracker}`}><div className={styles.trackerHead}><div><h2>Son günler</h2><p>Bugün {format(localDay(today),'d MMMM yyyy',{locale:tr})} · Bir güne dokunarak işaretle.</p></div><div className={styles.dayHeader}>{dates.map(date=><div key={date} className={date===today?styles.today:''}><small>{weekdays[localDay(date).getDay()]}</small><b>{Number(date.slice(-2))}</b></div>)}</div></div>
      <div className={styles.viewTabs}><button className={!archivedView?styles.activeTab:''} onClick={()=>setArchivedView(false)}>Aktif <span>{habits.filter(h=>!h.archived).length}</span></button><button className={archivedView?styles.activeTab:''} onClick={()=>setArchivedView(true)}>Arşiv <span>{habits.filter(h=>h.archived).length}</span></button></div>
      {visible.length?visible.map(h=><div className={styles.habitRow} key={h.id}><button className={styles.habitName} aria-label={h.title} onClick={()=>setSelected(h)}><i style={{'--habit-color':h.color||colors[0]} as CSSProperties}/><span><b>{h.title}</b><small>{frequencyText(getFrequency(h))}</small></span></button><div className={styles.dayCells}>{dates.map(date=>{const state=dayState(h,date,completions,today);return <button key={date} className={`${styles.dayCell} ${styles[state]}`} style={state==='completed'?{background:h.color||'var(--accent)',borderColor:h.color||'var(--accent)'}:undefined} aria-label={`${h.title}, ${date}: ${stateText(state)}`} title={`${date} · ${stateText(state)}`} disabled={date>today||date<h.localDate||!isScheduled(h,date)} onClick={()=>void writeStatus(h,date,completions.some(c=>c.habitId===h.id&&c.localDate===date&&c.status!=='skipped')?null:'completed')}>{state==='completed'?<Check size={14}/>:state==='missed'?<span/>:state==='skipped'?<span>–</span>:null}</button>})}</div><div className={styles.rowActions}><button aria-label={`${h.title} işlemleri`} onClick={()=>setMenu(menu===h.id?null:h.id)}><MoreHorizontal size={17}/></button>{menu===h.id&&<div className={styles.menu}><button onClick={()=>editHabit(h)}>Düzenle</button><button onClick={()=>void archiveHabit(h)}>{archivedView?<RotateCcw size={15}/>:<Archive size={15}/>} {archivedView?'Arşivden çıkar':'Arşivle'}</button><button onClick={()=>void deleteHabit(h)}><Trash2 size={15}/> Sil</button></div>}</div></div>):<div className={styles.empty}><div><Activity size={21}/></div><b>{archivedView?'Arşiv boş':'İlk alışkanlığını oluştur'}</b><p>{archivedView?'Arşivlediğin alışkanlıklar burada görünür.':'Küçük ve sürdürülebilir hedeflerle başlayabilirsin.'}</p>{!archivedView&&<button className="secondary" onClick={()=>editHabit()}><Plus size={15}/> Alışkanlık oluştur</button>}</div>}
      <div className={styles.statusLegend}><span><i className={styles.completed}/>Tamamlandı</span><span><i className={styles.missed}/>Aksadı</span><span><i className={styles.skipped}/>Atlandı</span><span><i className={styles.future}/>Gelecek</span></div>
    </section>
    {formOpen&&<HabitForm habit={editing} onClose={()=>{setFormOpen(false);setEditing(null)}} onSubmit={saveHabit}/>}
  </section>
}

function HabitForm({habit,onClose,onSubmit}:{habit:Habit|null;onClose:()=>void;onSubmit:(event:FormEvent<HTMLFormElement>)=>void}){
  const frequency=getFrequency(habit??{id:'',kind:'habit',title:'',schedule:[0,1,2,3,4,5,6],archived:false,localDate:localDate(),createdAt:'',updatedAt:''})
  const [period,setPeriod]=useState<FrequencyForm>(frequency.period)
  const [days,setDays]=useState<number[]>(frequency.weekdays??[0,1,2,3,4,5,6])
  return <div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><form className={styles.form} onSubmit={onSubmit}><div className={styles.formHead}><div><div className="eyebrow">ALIŞKANLIK</div><h2>{habit?'Düzenle':'Yeni alışkanlık'}</h2></div><button type="button" className="icon-button" aria-label="Kapat" onClick={onClose}><X size={18}/></button></div><label>Ad<input name="title" required maxLength={80} autoFocus defaultValue={habit?.title} placeholder="Örn. Kitap oku"/></label><label>Açıklama <small>(isteğe bağlı)</small><textarea name="description" rows={2} maxLength={250} defaultValue={habit?.description} placeholder="Bu alışkanlığı neden edinmek istiyorsun?"/></label><div className={styles.formLabel}>Renk</div><div className={styles.colorChoices}>{colors.map(color=><label key={color} aria-label={`Renk ${color}`}><input type="radio" name="color" value={color} defaultChecked={(habit?.color||colors[0])===color}/><i style={{background:color}}/></label>)}</div><label>Sıklık<select name="period" value={period} onChange={e=>setPeriod(e.target.value as FrequencyForm)}><option value="daily">Günlük</option><option value="weekly">Haftalık hedef</option><option value="monthly">Aylık hedef</option></select></label>{period==='daily'?<div><div className={styles.formLabel}>Hangi günler?</div><div className={styles.weekdayChoices}>{weekdays.map((label,index)=><label key={label}><input type="checkbox" name="weekdays" value={index} checked={days.includes(index)} onChange={()=>setDays(current=>current.includes(index)?current.filter(d=>d!==index):[...current,index])}/><span>{label}</span></label>)}</div></div>:<label>Hedef {period==='weekly'?'(kez / hafta)':'(kez / ay)'}<input type="number" name={period==='weekly'?'weeklyTarget':'monthlyTarget'} min="1" max={period==='weekly'?7:31} defaultValue={frequency.period===period?frequency.target:period==='weekly'?3:5}/></label>}<div className={styles.formActions}><button type="button" className="secondary" onClick={onClose}>Vazgeç</button><button type="submit" className="primary"><Check size={16}/>{habit?'Kaydet':'Oluştur'}</button></div></form></div>
}

function Stat({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <div className={styles.stat}><span>{icon}</span><small>{label}</small><b>{value}</b></div>}
function frequencyText(frequency:HabitFrequency){return frequency.period==='daily'?`Günlük · ${frequency.weekdays?.length??7} gün/hafta`:frequency.period==='weekly'?`${frequency.target} kez / hafta`:`${frequency.target} kez / ay`}
function stateText(state:HabitDayState){return ({completed:'Tamamlandı',skipped:'Atlandı',missed:'Aksadı',future:'Gelecek',unscheduled:'Plan dışı',pending:'Dönem sürüyor'})[state]}
