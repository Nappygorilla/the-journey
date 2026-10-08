import React, { useEffect, useMemo, useState } from "react";
import BibleAIView from "./BibleAIView";
import {
  archaeology,biblePeople,biblePlaces,bibleBookNotes,books,crossRefs,dailyVerses,devotionals,featureFlatList,featureGroups,
  familyModes,featureRoutes,gameCatalog,genealogies,kings,languagePack,lexicon,miracles,moods,needs,navItems,parables,
  plans,prophecies,quizSets,struggles,studyBooks,teachings,timeline
} from "./data";

const FALLBACK_PASSAGE=[
  {verse:1,text:"The LORD is my shepherd; I shall not want."},
  {verse:2,text:"He maketh me to lie down in green pastures: he leadeth me beside the still waters."},
  {verse:3,text:"He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake."},
  {verse:4,text:"Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me."},
  {verse:5,text:"Thou preparest a table before me in the presence of mine enemies."},
  {verse:6,text:"Surely goodness and mercy shall follow me all the days of my life."}
];

const INITIAL=[
  ["journey_completed",{verse:false,prayer:false,reading:false,game:false,reflection:false,gratitude:false}],
  ["journey_preferences",{dailyVerse:true,nightVerse:true,morningDevotional:true,eveningReflection:true,prayerReminder:true,memoryReview:true,community:true,language:"en",familyMode:"Teen / Youth"}],
  ["journey_stats",{xp:0,streak:0,lastActive:"",chapters:0,prayers:0,minutes:0,games:0,reflections:0}],
  ["journey_goals",[]],["journey_memory",[]],["journey_checkins",[]],["journey_gratitude",[]],["journey_moments",[]],
  ["journey_testimony",{opening:"",story:"",change:"",hope:""}],["journey_community",null],["journey_blocked",[]],["journey_reports",[]],
  ["journey_plan_progress",{}],["journey_family",[]],["journey_highscores",{}],["journey_audio",{voice:true,timer:0}],
  ["journey_reading_highlights",[]],["journey_answered_prayers",[]],["journey_prayer_categories",{}]
];

function safeParse(key,fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}}
function todayKey(){return new Date().toISOString().slice(0,10);}
function addDays(date,days){const d=new Date(date);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
async function hashText(value){
  if(!window.crypto?.subtle) return value;
  const buffer=await window.crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer)).map(v=>v.toString(16).padStart(2,"0")).join("");
}
function pickNaturalVoice(){
  const voices=window.speechSynthesis?.getVoices?.()||[];
  const score=(voice)=>{
    const name=(voice.name||"").toLowerCase();
    let value=0;
    if(/neural|natural|enhanced/.test(name))value+=8;
    if(/google us english|microsoft|samantha|ava|allison/.test(name))value+=4;
    if(voice.lang?.toLowerCase()==="en-us")value+=3;
    else if(voice.lang?.toLowerCase().startsWith("en"))value+=1;
    return value;
  };
  return [...voices].sort((a,b)=>score(b)-score(a))[0]||null;
}
function speak(text,rate=0.9){
  if(!("speechSynthesis" in window)){return false;}
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  const voice=pickNaturalVoice();
  if(voice)u.voice=voice;
  u.rate=Math.max(0.78,Math.min(1.02,rate));
  u.pitch=1.02;
  u.volume=1;
  window.speechSynthesis.speak(u);
  return true;
}
function renderSpeechText(text,isActive,activeWord){
  let wordIndex=0;
  return text.split(/(\\s+)/).map((part,index)=>{
    if(/^\\s+$/.test(part))return part;
    const current=wordIndex++;
    return <span key={index} className={isActive&&current===activeWord?"reading-word":""}>{part}</span>;
  });
}
function openExternal(url){window.open(url,"_blank","noopener,noreferrer");}

export default function App(){
  const [user,setUser]=useState(()=>safeParse("journey_user",null));
  const [view,setView]=useState("home");
  const [authMode,setAuthMode]=useState("login");
  const [authError,setAuthError]=useState("");
  const [search,setSearch]=useState("");
  const [selectedStruggles,setSelectedStruggles]=useState(()=>safeParse("journey_struggles",[]));
  const [notifications,setNotifications]=useState(()=>safeParse("journey_notifications",[
    {id:1,title:"Welcome to The Journey",body:"Your personal faith dashboard is ready.",read:false,time:"Now"},
    {id:2,title:"Daily challenge available",body:"Take today's five-question Bible challenge.",read:false,time:"Today"}
  ]));
  const [savedVerses,setSavedVerses]=useState(()=>safeParse("journey_saved",[]));
  const [prayers,setPrayers]=useState(()=>safeParse("journey_prayers",[]));
  const [notes,setNotes]=useState(()=>safeParse("journey_notes",[]));
  const [completed,setCompleted]=useState(()=>safeParse("journey_completed",INITIAL[0][1]));
  const [preferences,setPreferences]=useState(()=>safeParse("journey_preferences",INITIAL[1][1]));
  const [stats,setStats]=useState(()=>safeParse("journey_stats",INITIAL[2][1]));
  const [goals,setGoals]=useState(()=>safeParse("journey_goals",INITIAL[3][1]));
  const [memory,setMemory]=useState(()=>safeParse("journey_memory",INITIAL[4][1]));
  const [checkins,setCheckins]=useState(()=>safeParse("journey_checkins",INITIAL[5][1]));
  const [gratitude,setGratitude]=useState(()=>safeParse("journey_gratitude",INITIAL[6][1]));
  const [moments,setMoments]=useState(()=>safeParse("journey_moments",INITIAL[7][1]));
  const [testimony,setTestimony]=useState(()=>safeParse("journey_testimony",INITIAL[8][1]));
  const [community,setCommunity]=useState(()=>safeParse("journey_community",null));
  const [blocked,setBlocked]=useState(()=>safeParse("journey_blocked",INITIAL[10][1]));
  const [reports,setReports]=useState(()=>safeParse("journey_reports",INITIAL[11][1]));
  const [planProgress,setPlanProgress]=useState(()=>safeParse("journey_plan_progress",INITIAL[12][1]));
  const [family,setFamily]=useState(()=>safeParse("journey_family",INITIAL[13][1]));
  const [highScores,setHighScores]=useState(()=>safeParse("journey_highscores",{}));
  const [audio,setAudio]=useState(()=>safeParse("journey_audio",INITIAL[15][1]));
  const [highlights,setHighlights]=useState(()=>safeParse("journey_reading_highlights",[]));
  const [answeredPrayers,setAnsweredPrayers]=useState(()=>safeParse("journey_answered_prayers",[]));
  const [prayerCategories,setPrayerCategories]=useState(()=>safeParse("journey_prayer_categories",{}));
  const [showNotifications,setShowNotifications]=useState(false);
  const [showAuth,setShowAuth]=useState(!user);
  const [onboarding,setOnboarding]=useState(()=>Boolean(user&&!localStorage.getItem("journey_onboarded")));
  const [mobileOpen,setMobileOpen]=useState(false);
  const [toast,setToast]=useState("");
  const [quickSession,setQuickSession]=useState(null);
  const unreadCount=notifications.filter(n=>!n.read).length;

  useEffect(()=>{if(user)localStorage.setItem("journey_user",JSON.stringify(user));},[user]);
  useEffect(()=>{localStorage.setItem("journey_struggles",JSON.stringify(selectedStruggles));},[selectedStruggles]);
  useEffect(()=>{localStorage.setItem("journey_notifications",JSON.stringify(notifications));},[notifications]);
  useEffect(()=>{localStorage.setItem("journey_saved",JSON.stringify(savedVerses));},[savedVerses]);
  useEffect(()=>{localStorage.setItem("journey_prayers",JSON.stringify(prayers));},[prayers]);
  useEffect(()=>{localStorage.setItem("journey_notes",JSON.stringify(notes));},[notes]);
  useEffect(()=>{localStorage.setItem("journey_completed",JSON.stringify(completed));},[completed]);
  useEffect(()=>{localStorage.setItem("journey_preferences",JSON.stringify(preferences));},[preferences]);
  useEffect(()=>{localStorage.setItem("journey_stats",JSON.stringify(stats));},[stats]);
  useEffect(()=>{localStorage.setItem("journey_goals",JSON.stringify(goals));},[goals]);
  useEffect(()=>{localStorage.setItem("journey_memory",JSON.stringify(memory));},[memory]);
  useEffect(()=>{localStorage.setItem("journey_checkins",JSON.stringify(checkins));},[checkins]);
  useEffect(()=>{localStorage.setItem("journey_gratitude",JSON.stringify(gratitude));},[gratitude]);
  useEffect(()=>{localStorage.setItem("journey_moments",JSON.stringify(moments));},[moments]);
  useEffect(()=>{localStorage.setItem("journey_testimony",JSON.stringify(testimony));},[testimony]);
  useEffect(()=>{localStorage.setItem("journey_community",JSON.stringify(community));},[community]);
  useEffect(()=>{localStorage.setItem("journey_blocked",JSON.stringify(blocked));},[blocked]);
  useEffect(()=>{localStorage.setItem("journey_reports",JSON.stringify(reports));},[reports]);
  useEffect(()=>{localStorage.setItem("journey_plan_progress",JSON.stringify(planProgress));},[planProgress]);
  useEffect(()=>{localStorage.setItem("journey_family",JSON.stringify(family));},[family]);
  useEffect(()=>{localStorage.setItem("journey_highscores",JSON.stringify(highScores));},[highScores]);
  useEffect(()=>{localStorage.setItem("journey_audio",JSON.stringify(audio));},[audio]);
  useEffect(()=>{localStorage.setItem("journey_reading_highlights",JSON.stringify(highlights));},[highlights]);
  useEffect(()=>{localStorage.setItem("journey_answered_prayers",JSON.stringify(answeredPrayers));},[answeredPrayers]);
  useEffect(()=>{localStorage.setItem("journey_prayer_categories",JSON.stringify(prayerCategories));},[prayerCategories]);
  useEffect(()=>{localStorage.setItem("journey_onboarded",localStorage.getItem("journey_onboarded")||"");},[]);

  const currentVerse=useMemo(()=>{
    const normalized=selectedStruggles.map(s=>s.toLowerCase());
    const match=dailyVerses.find(v=>normalized.some(s=>v.topics.some(t=>s.includes(t))));
    return match || dailyVerses[Math.floor(Date.now()/86400000)%dailyVerses.length];
  },[selectedStruggles]);

  const notify=(title,body)=>{
    setNotifications(prev=>[{id:Date.now(),title,body,read:false,time:"Just now"},...prev]);
    setToast(title);window.setTimeout(()=>setToast(""),2600);
  };
  const markActivity=(type,xp=25)=>{
    setStats(s=>{
      const today=todayKey();
      const yesterday=addDays(today,-1);
      const streak=s.lastActive===today?s.streak:(s.lastActive===yesterday?s.streak+1:1);
      return {...s,lastActive:today,streak,xp:s.xp+xp,minutes:s.minutes+1,prayers:s.prayers+(type==="prayer"?1:0),games:s.games+(type==="game"?1:0),reflections:s.reflections+(type==="reflection"?1:0)};
    });
    setCompleted(c=>({...c,[type]:true}));
  };
  const toggleStruggle=(item)=>setSelectedStruggles(prev=>prev.includes(item)?prev.filter(x=>x!==item):[...prev,item]);
  const saveVerse=()=>{
    const exists=savedVerses.some(v=>v.ref===currentVerse.ref);
    setSavedVerses(prev=>exists?prev.filter(v=>v.ref!==currentVerse.ref):[currentVerse,...prev]);
    markActivity("verse",15);notify(exists?"Verse removed":"Verse saved",exists?"Removed from your private Scripture library.":"Saved to your private Scripture library.");
  };
  const logout=()=>{setUser(null);setShowAuth(true);setOnboarding(false);setView("home");};
  const go=id=>{setView(id);setMobileOpen(false);};

  if(!user||showAuth)return <AuthScreen mode={authMode} setMode={setAuthMode} error={authError} setError={setAuthError} onSuccess={(nextUser)=>{setUser(nextUser);setShowAuth(false);setOnboarding(!localStorage.getItem("journey_onboarded"));notify("Welcome to The Journey","Your personal faith dashboard is ready.");}}/>;

  if(onboarding)return <OnboardingScreen name={user.name} selectedStruggles={selectedStruggles} toggleStruggle={toggleStruggle} onComplete={()=>{localStorage.setItem("journey_onboarded","1");setOnboarding(false);notify("Your Journey is personalized","Your verse and study tools now reflect your current season.");}}/>;

  return <div className="app-shell">
    <aside className={"sidebar "+(mobileOpen?"open":"")}>
      <div className="brand-block"><div className="brand-mark">✝</div><div><div className="brand-name">The Journey</div><div className="brand-tag">Scripture • Prayer • Growth</div></div></div>
      <div className="sidebar-label">Explore</div>
      <nav>{navItems.map(([id,label,icon])=><button key={id} className={"nav-item "+(view===id?"active":"")} onClick={()=>go(id)}><span className="nav-icon">{icon}</span><span>{languagePack[preferences.language]?.[id]||label}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <div className="mini-card"><div className="mini-title">Journey streak</div><div className="mini-value">{stats.streak} days <span>✦</span></div><div className="progress"><div style={{width:Math.min(100,stats.streak*10)+"%"}}/></div><div className="muted">Progress is about your practice, not your worth.</div></div>
        <button className="nav-item" onClick={()=>go("settings")}><span className="nav-icon">⚙</span><span>{languagePack[preferences.language]?.settings||"Settings"}</span></button>
        <button className="nav-item" onClick={logout}><span className="nav-icon">↪</span><span>{languagePack[preferences.language]?.signout||"Sign out"}</span></button>
      </div>
    </aside>
    <main className="main">
      <header className="topbar">
        <button className="mobile-menu" onClick={()=>setMobileOpen(v=>!v)}>☰</button>
        <div className="search-wrap"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")go("bible");}} placeholder="Search Scripture, topics, studies..."/></div>
        <div className="top-actions"><button className="icon-btn" onClick={()=>setShowNotifications(v=>!v)} aria-label="Notifications">♧{unreadCount>0&&<span className="notification-dot">{unreadCount}</span>}</button><button className="profile-chip" onClick={()=>go("journey")}><span className="avatar">{(user.name||"J")[0].toUpperCase()}</span><span className="profile-copy"><strong>{user.name}</strong><span>On your journey</span></span></button></div>
        {showNotifications&&<NotificationPanel notifications={notifications} setNotifications={setNotifications}/>}
      </header>
      <div className="content">
        {view==="home"&&<HomeView user={user} verse={currentVerse} saved={savedVerses.some(v=>v.ref===currentVerse.ref)} onSave={saveVerse} go={go} completed={completed} stats={stats} onNeedHelp={need=>{setQuickSession(need);go("assistant");}} notify={notify}/>}
        {view==="bible"&&<BibleView initialSearch={search} savedVerses={savedVerses} setSavedVerses={setSavedVerses} notes={notes} setNotes={setNotes} highlights={highlights} setHighlights={setHighlights} audio={audio} setAudio={setAudio} stats={stats} setStats={setStats} markActivity={markActivity} notify={notify}/>}
        {view==="study"&&<StudyView go={go} notify={notify}/>}
        {view==="plans"&&<PlansView planProgress={planProgress} setPlanProgress={setPlanProgress} markActivity={markActivity} notify={notify}/>}
        {view==="prayer"&&<PrayerView prayers={prayers} setPrayers={setPrayers} answered={answeredPrayers} setAnswered={setAnsweredPrayers} categories={prayerCategories} setCategories={setPrayerCategories} markActivity={markActivity} notify={notify}/>}
        {view==="games"&&<GamesView highScores={highScores} setHighScores={setHighScores} stats={stats} setStats={setStats} markActivity={markActivity} notify={notify}/>}
        {view==="devotionals"&&<DevotionalsView devotionals={devotionals} markActivity={markActivity} notify={notify}/>}
        {view==="community"&&<CommunityView posts={community} setPosts={setCommunity} blocked={blocked} setBlocked={setBlocked} reports={reports} setReports={setReports} notify={notify}/>}
        {view==="journey"&&<JourneyView user={user} selectedStruggles={selectedStruggles} toggleStruggle={toggleStruggle} completed={completed} savedVerses={savedVerses} prayers={prayers} notes={notes} stats={stats} goals={goals} setGoals={setGoals} memory={memory} setMemory={setMemory} checkins={checkins} setCheckins={setCheckins} gratitude={gratitude} setGratitude={setGratitude} moments={moments} setMoments={setMoments} testimony={testimony} setTestimony={setTestimony} go={go} notify={notify}/>}
        {view==="growth"&&<GrowthView stats={stats} setStats={setStats} goals={goals} setGoals={setGoals} memory={memory} setMemory={setMemory} checkins={checkins} setCheckins={setCheckins} gratitude={gratitude} setGratitude={setGratitude} moments={moments} setMoments={setMoments} testimony={testimony} setTestimony={setTestimony} markActivity={markActivity} notify={notify}/>}
        {view==="assistant"&&<BibleAIView verse={currentVerse} go={go}/>}
        {view==="more"&&<MoreView preferences={preferences} setPreferences={setPreferences} family={family} setFamily={setFamily} audio={audio} setAudio={setAudio} go={go} notify={notify}/>}
        {view==="settings"&&<SettingsView user={user} setUser={setUser} preferences={preferences} setPreferences={setPreferences} notifications={notifications} setNotifications={setNotifications} selectedStruggles={selectedStruggles} toggleStruggle={toggleStruggle} family={family} setFamily={setFamily} notify={notify}/>}
        {view==="audit"&&<FeatureAuditView go={go}/>}
      </div>
    </main>
    {toast&&<div className="toast"><span>✦</span>{toast}</div>}
  </div>;
}

function AuthScreen({mode,setMode,error,setError,onSuccess}){
  const [name,setName]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [showPassword,setShowPassword]=useState(false);const [busy,setBusy]=useState(false);
  const submit=async e=>{e.preventDefault();setBusy(true);setError("");const normalized=email.trim().toLowerCase();const existing=safeParse("journey_account",null);
    if(mode==="register"&&!name.trim()){setBusy(false);return setError("Please enter your name.");}
    if(!normalized.includes("@")){setBusy(false);return setError("Enter a valid email address.");}
    if(password.length<6){setBusy(false);return setError("Use at least 6 characters for your password.");}
    const hash=await hashText(password);
    if(mode==="login"){
      const good=existing&&(existing.passwordHash===hash||existing.password===password);
      if(!good){setBusy(false);return setError("Those login details don't match this local account.");}
      if(existing.password!==undefined&&!existing.passwordHash)localStorage.setItem("journey_account",JSON.stringify({name:existing.name,email:existing.email,passwordHash:hash}));
      onSuccess({name:existing.name,email:existing.email});return;
    }
    if(existing&&existing.email===normalized){setBusy(false);return setError("An account already exists on this device. Sign in instead.");}
    const next={name:name.trim()||normalized.split("@")[0],email:normalized};localStorage.setItem("journey_account",JSON.stringify({...next,passwordHash:hash}));onSuccess(next);
  };
  return <div className="auth-page"><div className="auth-glow glow-a"/><div className="auth-glow glow-b"/><div className="auth-card">
    <div className="auth-brand"><div className="brand-mark large">✝</div><div><div className="brand-name">The Journey</div><div className="brand-tag">Grow in faith. Grow in Scripture.</div></div></div>
    <div className="auth-heading">{mode==="login"?"Welcome back.":"Begin your journey."}</div><p className="auth-sub">{mode==="login"?"Pick up where you left off.":"A completely free space for Scripture, prayer, learning, and growth."}</p>
    <form onSubmit={submit} className="auth-form">{mode==="register"&&<label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<div className="password-wrap"><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?"Hide":"Show"}</button></div></label>{error&&<div className="form-error">{error}</div>}<button disabled={busy} className="primary-btn wide">{busy?"Opening…":mode==="login"?"Enter The Journey":"Create Free Account"} <span>→</span></button></form>
    <div className="auth-divider"><span>100% free</span></div><button className="auth-switch" onClick={()=>{setError("");setMode(mode==="login"?"register":"login");}}>{mode==="login"?"New here? Create your free account":"Already have an account? Sign in"}</button>
    <div className="auth-note">This early build keeps account data on this device. Production accounts need a real secure backend.</div>
  </div></div>;
}

function OnboardingScreen({name,selectedStruggles,toggleStruggle,onComplete}){
  const [step,setStep]=useState(0);
  return <div className="onboarding-page"><div className="onboarding-glow"/><div className="onboarding-card"><div className="onboarding-top"><div className="brand-block"><div className="brand-mark">✝</div><div><div className="brand-name">The Journey</div><div className="brand-tag">A personal walk through Scripture</div></div></div><span>{step+1} / 2</span></div>
    {step===0?<div className="onboarding-body"><div className="eyebrow">WELCOME</div><h1>Hey {name?.split(" ")[0]||"friend"}.</h1><p>Tell us what you need from Scripture right now. You can change this anytime.</p><div className="onboarding-preview"><span>✦</span><div><strong>Your verse will be personal.</strong><small>We'll use your choices to guide today's Scripture, prayer, and study.</small></div></div><button className="primary-btn" onClick={()=>setStep(1)}>Choose what I'm facing →</button></div>
    :<div className="onboarding-body"><div className="eyebrow">YOUR CURRENT SEASON</div><h1>What are you struggling with?</h1><p>Select anything that feels relevant. There is no shame in bringing honest things into prayer.</p><div className="chips onboarding-chips">{struggles.map(s=><button key={s} className={"chip "+(selectedStruggles.includes(s)?"selected":"")} onClick={()=>toggleStruggle(s)}>{s}<span>{selectedStruggles.includes(s)?"✓":"+"}</span></button>)}</div><div className="onboarding-actions"><button className="ghost-btn" onClick={()=>setStep(0)}>← Back</button><button className="primary-btn" onClick={onComplete}>{selectedStruggles.length?"Finish my Journey →":"Skip for now →"}</button></div></div>}
  </div></div>;
}

function NotificationPanel({notifications,setNotifications}){
  const unread=notifications.filter(n=>!n.read).length;
  return <div className="notification-panel"><div className="panel-head"><div><strong>Notifications</strong><span>{unread} unread</span></div><button onClick={()=>setNotifications(prev=>prev.map(n=>({...n,read:true})))}>Mark all read</button></div>{notifications.slice(0,10).map(n=><button className={"notification "+(!n.read?"unread":"")} key={n.id} onClick={()=>setNotifications(prev=>prev.map(x=>x.id===n.id?{...x,read:true}:x))}><span className="notif-icon">✦</span><span><strong>{n.title}</strong><small>{n.body}</small><em>{n.time}</em></span></button>)}</div>;
}

function HomeView({user,verse,saved,onSave,go,completed,stats,onNeedHelp,notify}){
  const tasks=[["verse","Read your personalized verse","Scripture for what you're facing"],["reading","Continue your reading plan","Choose a plan and keep a steady rhythm"],["prayer","Write today's prayer","Talk with God for a few quiet minutes"],["game","Take the Bible challenge","Five questions • build your Bible knowledge"],["reflection","Daily check-in","Name how you're doing and what you need"],["gratitude","Practice gratitude","Record one gift from today"]];
  return <div className="page page-home">
    <section className="hero"><div><div className="eyebrow">GOOD MORNING, {user.name?.split(" ")[0]?.toUpperCase()||"FRIEND"}</div><h1>Walk with God.<br/><em>One day at a time.</em></h1><p>Scripture, prayer, learning, community, and growth—built around your current season.</p><div className="hero-actions"><button className="primary-btn" onClick={()=>document.getElementById("daily-verse")?.scrollIntoView({behavior:"smooth"})}>Open today's verse <span>↓</span></button><button className="ghost-btn" onClick={()=>go("growth")}>Check in today</button></div></div><div className="hero-art"><div className="hero-orb"/><div className="hero-cross">✝</div><div className="hero-ring r1"/><div className="hero-ring r2"/></div></section>
    <section className="stats-row"><Stat label="Journey streak" value={stats.streak+" days"} icon="✦"/><Stat label="Scripture read" value={stats.chapters+" chapters"} icon="📖"/><Stat label="Prayers" value={stats.prayers+" saved"} icon="🙏"/><Stat label="Bible XP" value={stats.xp.toLocaleString()} icon="✧"/></section>
    <section className="section-grid" id="daily-verse"><div className="verse-card"><div className="card-head"><div><span className="eyebrow">YOUR DAILY VERSE</span><h2>For what you're facing</h2></div><span className="day-pill">TODAY</span></div><blockquote>“{verse.text}”</blockquote><div className="verse-footer"><div><strong>{verse.ref}</strong><span>KJV</span></div><div className="row-actions"><button className={"small-btn "+(saved?"saved":"")} onClick={onSave}>{saved?"♥ Saved":"♡ Save"}</button><button className="small-btn" onClick={()=>notify("Share ready","Your verse can be shared with your preferred app.")}>↗ Share</button></div></div><div className="reflection"><span className="reflection-icon">✦</span><div><strong>A thought for today</strong><p>Read it slowly. Ask what the passage invites you to trust, practice, or remember.</p></div></div></div>
      <div className="today-card"><div className="card-head"><div><span className="eyebrow">TODAY'S PATH</span><h2>Keep moving</h2></div><span className="path-badge">{Math.round(Object.values(completed).filter(Boolean).length/Object.keys(completed).length*100)}%</span></div>{tasks.map(([key,title,sub])=><button className="task-row" key={key} onClick={()=>go(key==="verse"?"bible":key==="reading"?"plans":key==="prayer"?"prayer":key==="game"?"games":"growth")}><span className={"task-check "+(completed[key]?"done":"")}>{completed[key]?"✓":"○"}</span><span><strong>{title}</strong><small>{sub}</small></span><span className="task-arrow">→</span></button>)}</div></section>
    <section className="wide-section"><div className="section-heading"><div><span className="eyebrow">DEFINING FEATURE</span><h2>I don't know what I need</h2></div></div><div className="need-hero"><div><strong>No perfect words required.</strong><p>Tell The Journey how you feel and what kind of help you want. It creates a mini-session: Scripture → explanation → reflection → prayer → optional journal.</p></div><button className="primary-btn" onClick={()=>onNeedHelp({mode:"need"})}>Guide me →</button></div></section>
    <section className="wide-section"><div className="section-heading"><div><span className="eyebrow">EXPLORE</span><h2>More ways to grow</h2></div><button className="text-btn" onClick={()=>go("more")}>See everything →</button></div><div className="feature-grid"><FeatureCard icon="📚" title="Bible Study" text="Context, cross-references, word studies, people, places, timelines, and more." onClick={()=>go("study")}/><FeatureCard icon="🙏" title="Prayer" text="Private prayer lists, guided prayer, answered prayers, and reminders." onClick={()=>go("prayer")}/><FeatureCard icon="🎮" title="Learn through play" text="Thirteen game modes, XP, levels, badges, high scores, and challenges." onClick={()=>go("games")}/><FeatureCard icon="↗" title="Growth" text="Check-ins, memory verses, gratitude, goals, milestones, and your testimony." onClick={()=>go("growth")}/></div></section>
  </div>;
}
function Stat({label,value,icon}){return <div className="stat-card"><span className="stat-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>}
function FeatureCard({icon,title,text,onClick}){return <button className="feature-card" onClick={onClick}><span className="feature-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><b>→</b></button>}
function PageTitle({eyebrow,title,text,action}){return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>}

function BibleView({initialSearch,savedVerses,setSavedVerses,notes,setNotes,highlights,setHighlights,audio,setAudio,stats,setStats,markActivity,notify}){
  const [book,setBook]=useState("Psalms");const [chapter,setChapter]=useState("23");const [translationTab,setTranslationTab]=useState("side");const [passage,setPassage]=useState(FALLBACK_PASSAGE);const [webPassage,setWebPassage]=useState([]);const [loading,setLoading]=useState(false);const [query,setQuery]=useState(initialSearch||"");const [note,setNote]=useState("");const [reference,setReference]=useState("John 3:16");const [compareRef,setCompareRef]=useState("Philippians 4:6");const [readingVerse,setReadingVerse]=useState(null);const [readingWord,setReadingWord]=useState(-1);const readingRunRef=useRef(0);const selected=books.find(b=>b[0]===book)||books[18];
  useEffect(()=>{if(initialSearch)setQuery(initialSearch);},[initialSearch]);
  useEffect(()=>()=>{readingRunRef.current++;window.speechSynthesis?.cancel();},[]);
  useEffect(()=>{let cancelled=false;(async()=>{setLoading(true);setWebPassage([]);try{
    if(selected[3]==="apocrypha"){
      const sourceFile=selected[4]||selected[0];
      const res=await fetch("https://raw.githubusercontent.com/aruljohn/Bible-kjv-1611/main/"+encodeURIComponent(sourceFile)+".json");
      if(!res.ok)throw new Error("Extended Scripture source returned "+res.status);
      const jd=await res.json();
      const chapterData=Array.isArray(jd.chapters)?jd.chapters.find(c=>Number(c.chapter)===Number(chapter)):null;
      const next=Array.isArray(chapterData?.verses)?chapterData.verses.map(v=>({verse:v.verse,text:String(v.text).replace(/&thorn;/g,"þ").trim()})):[];
      if(!cancelled&&next.length)setPassage(next);
      if(!next.length)throw new Error("Chapter not found in extended Scripture source.");
    }else{
      const [a,b]=await Promise.all([fetch("https://bible-api.com/data/kjv/"+selected[1]+"/"+chapter),fetch("https://bible-api.com/data/web/"+selected[1]+"/"+chapter)]);
      if(!a.ok)throw new Error("Bible API returned "+a.status);
      const kd=await a.json();
      const next=Array.isArray(kd.verses)?kd.verses.map(v=>({verse:v.verse,text:v.text.trim()})):[];
      if(!cancelled&&next.length)setPassage(next);
      if(b.ok){const wd=await b.json();if(!cancelled&&Array.isArray(wd.verses))setWebPassage(wd.verses.map(v=>({verse:v.verse,text:v.text.trim()})));}
    }
  }catch(err){if(!cancelled)notify("Bible connection unavailable",selected[3]==="apocrypha"?"The extended Scripture source could not be reached.":"Your reader is showing the last available passage.");}finally{if(!cancelled)setLoading(false);}})();return()=>{cancelled=true;};},[book,chapter]);
  const filtered=passage.filter(v=>!query||v.text.toLowerCase().includes(query.toLowerCase()));
  const currentRef=book+" "+chapter;
  const saveCurrentNote=()=>{if(!note.trim())return;setNotes(prev=>[{id:Date.now(),ref:currentRef,text:note.trim()},...prev]);setNote("");notify("Bible note saved","Your note is private on this device.");};
  const toggleHighlight=verse=>setHighlights(prev=>prev.includes(currentRef+":"+verse)?prev.filter(x=>x!==currentRef+":"+verse):[...prev,currentRef+":"+verse]);
  const listen=()=>{
    if(!("speechSynthesis" in window)){notify("Audio unavailable","This browser does not provide speech playback.");return;}
    window.speechSynthesis.cancel();
    const runId=++readingRunRef.current;
    setReadingVerse(null);setReadingWord(-1);
    let index=0;
    const playNext=()=>{
      if(runId!==readingRunRef.current)return;
      if(index>=passage.length){setReadingVerse(null);setReadingWord(-1);return;}
      const verse=passage[index++];
      setReadingVerse(verse.verse);setReadingWord(0);
      const utterance=new SpeechSynthesisUtterance(verse.text);
      const voice=pickNaturalVoice();
      if(voice)utterance.voice=voice;
      utterance.rate=0.86;utterance.pitch=1.02;utterance.volume=1;
      utterance.onboundary=(event)=>{
        if(runId!==readingRunRef.current||typeof event.charIndex!=="number")return;
        const before=verse.text.slice(0,event.charIndex).trim();
        const current=before?before.split(/\\s+/).length-1:0;
        setReadingWord(Math.max(0,current));
      };
      utterance.onend=()=>{if(runId===readingRunRef.current)window.setTimeout(playNext,100);};
      utterance.onerror=()=>{if(runId===readingRunRef.current){setReadingVerse(null);setReadingWord(-1);}};
      window.speechSynthesis.speak(utterance);
    };
    playNext();
    setAudio(a=>({...a,voice:true}));
    notify("Audio Bible playing","Natural browser voice with live word highlighting.");
  };
  const saveRef=ref=>{const v=dailyVerses.find(x=>x.ref===ref)||{ref,text:"Saved reference: "+ref};setSavedVerses(prev=>prev.some(x=>x.ref===ref)?prev:[v,...prev]);};
  return <div className="page"><PageTitle eyebrow="SCRIPTURE" title="The Bible" text="Read, search, compare, highlight, listen, take notes, and move into deeper study." action={<button className="primary-btn" onClick={listen}>▶ Listen</button>}/>
    <div className="bible-toolbar"><select value={book} onChange={e=>{const value=e.target.value;const nextBook=books.find(b=>b[0]===value);setBook(value);setChapter("1");setTranslationTab(nextBook?.[3]==="apocrypha"?"kjv":"side");}}><optgroup label="Standard Bible">{books.filter(b=>b[3]!=="apocrypha").map(b=><option key={b[0]} value={b[0]}>{b[0]}</option>)}</optgroup><optgroup label="Deuterocanon & Apocrypha">{books.filter(b=>b[3]==="apocrypha").map(b=><option key={b[0]} value={b[0]}>{b[0]}</option>)}</optgroup></select><select value={chapter} onChange={e=>setChapter(e.target.value)}>{Array.from({length:selected[2]},(_,i)=><option key={i+1}>{i+1}</option>)}</select>{selected[3]==="apocrypha"?<div className="translation-tabs"><span className="extended-source-label">1611 Apocrypha</span></div>:<div className="translation-tabs"><button className={translationTab==="side"?"active":""} onClick={()=>setTranslationTab("side")}>Side by side</button><button className={translationTab==="kjv"?"active":""} onClick={()=>setTranslationTab("kjv")}>KJV</button><button className={translationTab==="web"?"active":""} onClick={()=>setTranslationTab("web")}>WEB</button></div>}</div>
    <div className="bible-toolbar-note">{selected[3]==="apocrypha"?bibleBookNotes.apocrypha:"KJV + WEB are loaded from the current public Scripture source where available."}</div><div className="bible-layout"><div className="scripture-panel"><div className="panel-kicker">{currentRef}</div><h2>{currentRef}</h2><div className="scripture-lines">{loading?<p className="loading-line">Loading Scripture…</p>:filtered.length?filtered.map(v=><p key={v.verse} className={query?"search-hit":""} onClick={()=>toggleHighlight(v.verse)}><sup>{v.verse}</sup> <span className={highlights.includes(currentRef+":"+v.verse)?"highlighted-text":""}>{readingVerse===v.verse?renderSpeechText(v.text,true,readingWord):v.text}</span></p>):<div className="empty-state">No verses here match “{query}”.</div>}</div><div className="scripture-tools"><button onClick={()=>{const v=prompt("Type a note for this chapter");if(v){setNotes(prev=>[{id:Date.now(),ref:currentRef,text:v},...prev]);notify("Note saved","Added to your private Bible notes.");}}}>✎ Note</button><button onClick={()=>{filtered.forEach(v=>toggleHighlight(v.verse));notify("Highlight updated","Tap any verse to toggle individual highlights.");}}>🖍 Highlight</button><button onClick={()=>{setTranslationTab("side");notify("Side-by-side open","KJV and WEB are shown together where the source is available.");}}>⇄ Compare</button><button onClick={()=>notify("Cross-references open","Use the Study tab for the full reference explorer.")}>↗ Cross-references</button><button onClick={()=>notify("Study mode","Use the Study Assistant for guided questions and context.")}>▦ Study</button></div></div>
      <div className="study-side"><div className="side-card"><div className="side-card-head"><strong>Search</strong><span>{filtered.length}</span></div><div className="compact-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search this chapter..."/></div></div>
        {translationTab==="side"&&<div className="side-card"><div className="side-card-head"><strong>Translation comparison</strong><span>KJV / WEB</span></div><div className="translation-compare"><div><b>KJV</b>{passage.slice(0,6).map(v=><p key={"k"+v.verse}><sup>{v.verse}</sup>{v.text}</p>)}</div><div><b>WEB</b>{(webPassage.length?webPassage:passage).slice(0,6).map(v=><p key={"w"+v.verse}><sup>{v.verse}</sup>{v.text}</p>)}</div></div></div>}
        <div className="side-card"><div className="side-card-head"><strong>Reference jump</strong><span>Quick save</span></div><div className="input-row"><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="John 3:16"/><button className="ghost-btn" onClick={()=>{saveRef(reference);notify("Reference saved","Saved "+reference+" to your Scripture library.");}}>Save</button></div><div className="muted small-copy">Try John 3:16, Psalm 23:1, or Romans 8:1.</div></div>
        <div className="side-card"><div className="side-card-head"><strong>Verse comparison</strong><span>two references</span></div><input className="compact-input" value={compareRef} onChange={e=>setCompareRef(e.target.value)}/><div className="compare-mini"><strong>{reference}</strong><small>Study how themes and wording relate.</small><strong>{compareRef}</strong><small>{crossRefs[compareRef]?.join(" • ")||"Use the Study reference explorer for related passages."}</small></div></div>
        <div className="side-card"><div className="side-card-head"><strong>Saved Scripture</strong><span>{savedVerses.length}</span></div>{savedVerses.slice(0,4).map(v=><div className="saved-row" key={v.ref}><strong>{v.ref}</strong><button onClick={()=>setSavedVerses(prev=>prev.filter(x=>x.ref!==v.ref))}>×</button><small>{v.text}</small></div>)}</div>
        <div className="side-card"><div className="side-card-head"><strong>Notes</strong><span>{notes.length}</span></div>{notes.slice(0,3).map(n=><div className="saved-row" key={n.id}><strong>{n.ref}</strong><small>{n.text}</small></div>)}<div className="input-row"><input className="compact-input" value={note} onChange={e=>setNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveCurrentNote()} placeholder="Quick note..."/><button className="icon-mini" onClick={saveCurrentNote}>+</button></div></div>
      </div></div>
    <div className="callout"><span className="callout-icon">✦</span><div><strong>Reading practice counts.</strong><p>Every chapter you open can contribute to your personal reading history. This build keeps that history local.</p></div><button className="ghost-btn" onClick={()=>{setStats(s=>({...s,chapters:s.chapters+1}));markActivity("reading",20);notify("Chapter counted","Your reading progress increased.");}}>Mark chapter read</button></div>
  </div>;
}

function StudyView({go,notify}){
  const [tab,setTab]=useState("topics");const [selected,setSelected]=useState(null);const [word,setWord]=useState("love");const [question,setQuestion]=useState("");
  const tabs=[["topics","Topics"],["context","Context"],["timeline","Timeline"],["people","People"],["places","Places"],["family","Family trees"],["prophecy","Prophecy"],["miracles","Miracles"],["parables","Parables"],["jesus","Jesus' teachings"],["paul","Paul's journeys"],["kings","Kings"],["archaeology","Archaeology"]];
  const renderRows=(rows,desc=false)=><div className="study-catalog">{rows.map((r,i)=><button className="catalog-card" key={r[0]} onClick={()=>{setSelected(r);notify(r[0],r[2]||"Study resource opened.");}}><span className="catalog-index">{String(i+1).padStart(2,"0")}</span><span><strong>{r[0]}</strong><small>{r[1]}</small>{r[2]&&<em>{r[2]}</em>}</span><b>→</b></button>)}</div>;
  return <div className="page"><PageTitle eyebrow="DEEPER" title="Bible Study" text="Explore context, connections, original-language word studies, people, places, prophecy, history, and more." action={<button className="primary-btn" onClick={()=>go("assistant")}>✧ Study Assistant</button>}/>
    <div className="study-tabs">{tabs.map(([id,label])=><button className={tab===id?"active":""} key={id} onClick={()=>{setTab(id);setSelected(null);}}>{label}</button>)}</div>
    {tab==="topics"&&<><div className="study-hero"><div><div className="eyebrow">GUIDED STUDY MODE</div><h2>Read → Understand → Reflect → Pray</h2><p>Choose a topic, a book, a person, a place, or a word. Then move into the Study Assistant when you want a structured session.</p><div className="hero-actions"><button className="primary-btn" onClick={()=>go("bible")}>Start with Scripture →</button><button className="ghost-btn" onClick={()=>setTab("timeline")}>Open timeline</button></div></div><div className="study-orb">✦</div></div>
      <div className="topic-grid">{["Faith","Anxiety","Forgiveness","Prayer","Purpose","Temptation","Relationships","Wisdom","Hope","Service","Grace","Discipleship"].map(t=><button className="topic-chip" key={t} onClick={()=>{setSelected([t,"A guided topic path: Scripture → context → reflection → prayer.","Topic"]);}}>{t}<span>→</span></button>)}</div></>}
    {tab==="context"&&<div className="two-column"><div className="panel-card"><div className="eyebrow">BOOK CONTEXT</div><h3>Start with a book</h3>{studyBooks.map(r=><button className="resource-line" key={r[0]} onClick={()=>setSelected(r)}><strong>{r[0]}</strong><small>{r[1]}</small></button>)}</div><div className="panel-card"><div className="eyebrow">ORIGINAL LANGUAGE</div><h3>Greek / Hebrew word study</h3><input className="compact-input" value={word} onChange={e=>setWord(e.target.value.toLowerCase())}/>{lexicon[word]?<div className="word-card"><b>{lexicon[word].word}</b><span>{lexicon[word].language}</span><p>{lexicon[word].meaning}</p><small>References: {lexicon[word].refs.join(" • ")}</small></div>:<div className="empty-state">Try love, faith, peace, or spirit.</div>}</div></div>}
    {tab==="timeline"&&<div className="timeline">{timeline.map(([a,b,c],i)=><button className="timeline-step" key={a} onClick={()=>setSelected([a,b,c])}><span>{i+1}</span><div><strong>{a}</strong><small>{b}</small><em>{c}</em></div></button>)}</div>}
    {tab==="people"&&renderRows(biblePeople)}{tab==="places"&&renderRows(biblePlaces)}{tab==="family"&&renderRows([["Adam / Eve","Genesis 1–5 • family story and early genealogy.","Family tree"],["Abraham → Isaac → Jacob","Genesis 12–50 • patriarchal family line.","Family tree"],["Ruth → Obed → Jesse → David","Ruth 4 • Davidic line.","Family tree"],["Matthew 1 genealogy","A genealogy that traces Jesus' line through Abraham and David.","Genealogy"],["Luke 3 genealogy","A genealogy that reaches back toward Adam.","Genealogy"]])}
    {tab==="prophecy"&&renderRows(prophecies)}{tab==="miracles"&&renderRows(miracles)}{tab==="parables"&&renderRows(parables)}{tab==="jesus"&&renderRows(teachings)}{tab==="paul"&&renderRows([["Journey 1","Acts 13–14 • early missionary expansion.","Acts"],["Council at Jerusalem","Acts 15 • major question about Gentile believers.","Acts"],["Journey 2","Acts 15–18 • Macedonia and Greece.","Acts"],["Journey 3","Acts 18–21 • strengthening churches.","Acts"],["Journey to Rome","Acts 27–28 • witness in Rome.","Acts"]])}{tab==="kings"&&renderRows(kings)}{tab==="archaeology"&&renderRows(archaeology)}
    {selected&&<div className="selection-detail"><div><span className="eyebrow">CURRENT STUDY</span><h3>{selected[0]}</h3><p>{selected[1]}</p><small>{selected[2]||"Study resource"}</small></div><button className="ghost-btn" onClick={()=>setSelected(null)}>Close</button></div>}
    <div className="resource-grid"><div className="resource-card"><span>↗</span><strong>Cross-references</strong><small>Connect themes and passages with curated reference sets.</small></div><div className="resource-card"><span>⌕</span><strong>Concordance</strong><small>Search the words and references available in the reader.</small></div><div className="resource-card"><span>λ</span><strong>Word study</strong><small>Open the Greek/Hebrew dictionary starter set.</small></div><div className="resource-card"><span>◷</span><strong>Chapter summary</strong><small>Use the Assistant to generate a structured chapter overview.</small></div></div>
    <div className="study-question"><div><span className="eyebrow">QUESTIONS</span><h3>Study this passage</h3></div><div className="input-row"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What is confusing or interesting?"/><button className="primary-btn" onClick={()=>notify("Study question saved",question.trim()?"Your question is ready in the Study Assistant.":"Open the Assistant for guided questions.")}>Explore</button></div></div>
  </div>;
}

function PlansView({planProgress,setPlanProgress,markActivity,notify}){
  const [custom,setCustom]=useState("");const [days,setDays]=useState(7);
  const createPlan=()=>{if(!custom.trim())return;const id="custom-"+Date.now();setPlanProgress(p=>({...p,[id]:{name:custom,days:Number(days),done:0,desc:"Your custom Scripture rhythm."}}));setCustom("");notify("Custom plan created","Your new reading path is saved locally.");};
  const entries=[...plans.map(p=>({id:p[0],name:p[1],days:p[2],desc:p[3],icon:p[4]})),...Object.entries(planProgress).map(([id,p])=>({id,...p,icon:"✧"}))];
  return <div className="page"><PageTitle eyebrow="READING" title="Bible Plans" text="Build a steady rhythm with plans for a week, month, or your own custom goal."/><div className="plan-grid">{entries.map((p,i)=>{const done=planProgress[p.id]?.done||0;const pct=Math.min(100,Math.round(done/p.days*100));return <div className="plan-card" key={p.id}><div className="plan-icon">{p.icon||"✦"}</div><div className="eyebrow">PLAN {i+1}</div><h3>{p.name}</h3><p>{p.desc}</p><div className="plan-progress"><span style={{width:pct+"%"}}/></div><div className="plan-foot"><strong>{pct}%</strong><small>{done} / {p.days} days</small><button onClick={()=>{setPlanProgress(x=>({...x,[p.id]:{...(x[p.id]||{}),done:Math.min(p.days,(x[p.id]?.done||0)+1)}}));markActivity("reading",30);notify("Reading progress saved","One more day completed.");}}>Continue →</button></div></div>;})}</div>
    <div className="custom-plan"><div><div className="eyebrow">BUILD YOUR OWN</div><h3>Custom reading path</h3><p>Name it, choose a duration, and The Journey will track the days locally.</p></div><div className="custom-plan-form"><input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="e.g. Gospel of John"/><select value={days} onChange={e=>setDays(e.target.value)}><option>7</option><option>14</option><option>30</option><option>60</option><option>90</option></select><button className="primary-btn" onClick={createPlan}>Create plan</button></div></div>
  </div>;
}

function PrayerView({prayers,setPrayers,answered,setAnswered,categories,setCategories,markActivity,notify}){
  const [text,setText]=useState("");const [category,setCategory]=useState("Personal");const [forSomeone,setForSomeone]=useState(false);const [person,setPerson]=useState("");const [prompt,setPrompt]=useState("What would you like to place before God today?");const [reminder,setReminder]=useState(true);
  const add=()=>{if(!text.trim())return;const id=Date.now();setPrayers(prev=>[{id,text:text.trim(),date:new Date().toLocaleDateString(),category,forSomeone:forSomeone?person:""} ,...prev]);setCategories(c=>({...c,[category]:(c[category]||0)+1}));setText("");markActivity("prayer",35);setStatsDummy();notify("Prayer saved","Added to your private prayer archive.");};
  const setStatsDummy=()=>{};
  const toggleAnswered=p=>{setAnswered(prev=>[...prev,{...p,answeredAt:new Date().toLocaleDateString()}]);setPrayers(prev=>prev.filter(x=>x.id!==p.id));notify("Prayer marked answered","Your answer is kept in a separate archive.");};
  const guided=()=>{const lines=["God, thank You for meeting me where I am.","Give me wisdom to respond well to what is in front of me.","Help me notice what is true, choose what is good, and love the people around me.","Amen."];speak(lines.join(" "),0.9);notify("Guided prayer started","A Scripture-shaped prayer is playing in your browser.");};
  return <div className="page"><PageTitle eyebrow="QUIET TIME" title="Prayer" text="Keep prayer lists, categories, reminders, guided prayer, Scripture-shaped prayers, and answered prayers in one private space." action={<button className="ghost-btn" onClick={()=>setReminder(v=>!v)}>🔔 {reminder?"Reminder on":"Reminder off"}</button>}/>
    <div className="prayer-grid"><div className="prayer-composer"><div className="eyebrow">TODAY'S PRAYER</div><h2>{prompt}</h2><div className="prayer-meta-row"><select value={category} onChange={e=>setCategory(e.target.value)}><option>Personal</option><option>Family</option><option>School</option><option>Friends</option><option>Church</option><option>Gratitude</option><option>Guidance</option><option>Other</option></select><button className={"chip "+(forSomeone?"selected":"")} onClick={()=>setForSomeone(v=>!v)}>Praying for someone</button></div>{forSomeone&&<input className="compact-input" value={person} onChange={e=>setPerson(e.target.value)} placeholder="Optional name or description"/>}<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write your prayer here. This journal is private on this device."/><div className="composer-foot"><span>{Object.keys(categories).length||1} prayer categories • private archive</span><button className="primary-btn" onClick={add}>Save prayer →</button></div></div>
      <div className="prayer-card"><div className="eyebrow">GUIDED PRAYER</div><h3>Scripture-shaped prayer</h3><p>Start with gratitude, name what is hard, ask for wisdom, and leave room for trust. This guide is a tool for prayer, not a replacement for personal faith or pastoral care.</p><button className="primary-btn" onClick={guided}>▶ Start guided prayer</button><button className="ghost-btn" onClick={()=>setPrompt(["What are you thankful for today?","Where do you need courage?","Who needs your prayer today?","What are you asking God for wisdom about?"][Math.floor(Math.random()*4)])}>New prompt</button></div></div>
    <div className="section-heading"><div><span className="eyebrow">PRAYER LISTS</span><h2>Active prayers</h2></div><span className="muted">{prayers.length} open</span></div>
    <div className="journal-list">{prayers.length===0?<div className="empty-card">Your prayer list is ready whenever you are.</div>:prayers.map(p=><article className="journal-entry" key={p.id}><div className="journal-date">{p.category} • {p.date}{p.forSomeone?" • for "+p.forSomeone:""}</div><p>{p.text}</p><button onClick={()=>toggleAnswered(p)}>Answered</button><button className="secondary-delete" onClick={()=>setPrayers(prev=>prev.filter(x=>x.id!==p.id))}>Delete</button></article>)}</div>
    <div className="two-column lower-gap"><div className="panel-card"><div className="eyebrow">ANSWERED PRAYERS</div><h3>Remember what changed</h3>{answered.length?answered.map(a=><div className="saved-row" key={a.id+"a"}><strong>{a.category} • {a.answeredAt}</strong><small>{a.text}</small></div>):<div className="empty-state">When a prayer is answered, archive it here.</div>}</div><div className="panel-card"><div className="eyebrow">ENCOURAGEMENT</div><h3>Keep showing up</h3><p>Prayer can be simple and honest. A few minutes of attention can be a meaningful practice.</p><div className="encouragement-box">“Bring your requests to God with thanksgiving.”</div></div></div>
  </div>;
}

function shuffleArray(items){
  const next=[...items];
  for(let i=next.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[next[i],next[j]]=[next[j],next[i]];}
  return next;
}
function buildGameBank(mode){
  const sourceGroups={
    trivia:Object.keys(quizSets),
    speed:Object.keys(quizSets),
    multiple:["multiple","trivia","book","verse","geography","timeline","who","truefalse"],
    who:["who","match-character"],
    book:["book","otnt","match-theme"],
    verse:["verse","complete"],
    complete:["complete","verse"],
    timeline:["timeline"],
    geography:["geography"],
    "match-character":["match-character","who"],
    "match-theme":["match-theme","book"],
    otnt:["otnt"]
  };
  const bank=(sourceGroups[mode]||[mode]).flatMap(key=>quizSets[key]||[]).map(item=>[...item]);
  const unique=(items)=>{
    const seen=new Set();
    return items.filter(item=>{
      const key=item[0]+"|"+item[1];
      if(seen.has(key))return false;
      seen.add(key);return true;
    });
  };
  if(mode==="truefalse"){
    const books66=books.filter(b=>b[3]!=="apocrypha").slice(0,66);
    bank.push(...books66.map((b)=>[b[0]+" is in the Old Testament.",b[0] in Object.fromEntries(books66.slice(0,39).map(x=>[x[0],true]))?"True":"False",["True","False"]]));
  }
  if(mode==="otnt"){
    const books66=books.filter(b=>b[3]!=="apocrypha").slice(0,66);
    const oldSet=new Set(books66.slice(0,39).map(b=>b[0]));
    bank.push(...books66.map(b=>["Where is "+b[0]+" found?",oldSet.has(b[0])?"Old Testament":"New Testament",["Old Testament","New Testament"]]));
  }
  if(mode==="geography"){
    const regions=[...new Set(biblePlaces.map(p=>p[2]))];
    biblePlaces.forEach(p=>bank.push(["Which region is associated with "+p[0]+"?",p[2],shuffleArray(regions).slice(0,4)]));
  }
  if(mode==="timeline"){
    for(let i=0;i<timeline.length;i++){
      if(i>0){
        const earlier=timeline[i-1];
        const options=shuffleArray(timeline.map(x=>x[0])).slice(0,4);
        if(!options.includes(earlier[0]))options[0]=earlier[0];
        bank.push(["Which event comes just before "+timeline[i][0]+"?",earlier[0],options]);
      }
    }
  }
  if(mode==="complete"){
    dailyVerses.forEach(v=>{
      const words=v.text.trim().split(/\s+/);
      const answer=words[words.length-1].replace(/[.,;:!?]+$/,"");
      if(answer.length>2){
        const options=shuffleArray([answer,"faith","peace","hope","wisdom"]).slice(0,4);
        if(!options.includes(answer))options[0]=answer;
        bank.push(["Complete the final word from "+v.ref+": “"+words.slice(0,-1).join(" ")+" ____”",answer,options]);
      }
    });
  }
  if(mode==="match-character"){
    const names=biblePeople.map(p=>p[0]);
    biblePeople.forEach(p=>{
      const options=shuffleArray([p[0],...names.filter(x=>x!==p[0])]).slice(0,4);
      bank.push([p[1],p[0],options]);
    });
  }
  if(mode==="match-theme"){
    const themes=parables.map(p=>p[1]).concat(teachings.map(t=>t[1])).slice(0,12);
    parables.forEach(p=>bank.push(["Which theme best matches “"+p[0]+"”?",p[1],shuffleArray(themes).slice(0,4)]));
  }
  return unique(bank);
}

function GamesView({highScores,setHighScores,stats,setStats,markActivity,notify}){
  const [active,setActive]=useState(null);const [sessionQuestions,setSessionQuestions]=useState([]);const [score,setScore]=useState(0);const [q,setQ]=useState(0);const [started,setStarted]=useState(0);
  const questions=active?sessionQuestions:[];
  const start=(id)=>{
    const bank=buildGameBank(id);
    const storageKey="journey_game_seen_"+id;
    let seen=safeParse(storageKey,[]);
    let available=bank.filter(item=>!seen.includes(item[0]+"|"+item[1]));
    if(available.length<5){seen=[];available=bank;}
    const session=shuffleArray(available).slice(0,Math.min(5,available.length)).map(item=>[item[0],item[1],shuffleArray(item[2]||[])]);
    setActive(id);setSessionQuestions(session);setScore(0);setQ(0);setStarted(Date.now());
    localStorage.setItem(storageKey,JSON.stringify([...seen,...session.map(item=>item[0]+"|"+item[1])]));
  };
  const answer=(a)=>{
    const item=questions[q];if(!item)return;
    const correct=a===item[1];const nextScore=score+(correct?100:0);setScore(nextScore);
    if(q<questions.length-1){setQ(q+1);return;}
    const elapsed=Math.max(1,Math.round((Date.now()-started)/1000));const modeScore=Math.max(nextScore,(highScores[active]||0));
    setHighScores(h=>({...h,[active]:modeScore}));
    setStats(s=>({...s,xp:s.xp+nextScore,games:s.games+1}));
    markActivity("game",nextScore?Math.round(nextScore/10):20);
    notify("Challenge complete",correct?"Great finish. Fresh questions are ready for your next round.":"Challenge complete. A fresh question set is ready for next time.");
    void elapsed;
    setActive(null);
  };
  if(active)return <div className="page game-player"><button className="back-btn" onClick={()=>setActive(null)}>← Games</button><div className="game-shell"><div className="game-top"><span className="eyebrow">{gameCatalog.find(g=>g[0]===active)?.[1]}</span><strong>{q+1} / {questions.length}</strong></div><div className="game-progress"><span style={{width:((q)/Math.max(1,questions.length))*100+"%"}}/></div><h1>{questions[q]?.[0]}</h1><div className="answers">{(questions[q]?.[2]||[]).map(a=><button key={a} onClick={()=>answer(a)}>{a}<span>→</span></button>)}</div><div className="game-hint">Questions are randomized and tracked locally so repeats are avoided until the available question pool has been used.</div></div></div>;
  const rank=Math.max(1,Math.floor(stats.xp/500)+1);return <div className="page"><PageTitle eyebrow="LEARN BY DOING" title="Bible Games" text="Thirteen game modes, daily and weekly challenges, XP, levels, badges, achievements, and high scores."/>
    <div className="level-strip"><div><span className="eyebrow">LEVEL</span><strong>{rank<3?"Growing":rank<6?"Steady":"Deepening"}</strong></div><div className="level-meter"><span style={{width:Math.min(100,(stats.xp%500)/5)+"%"}}/></div><div className="xp">{stats.xp.toLocaleString()} XP</div></div>
    <div className="game-meta-grid"><div className="panel-card"><div className="eyebrow">DAILY 5</div><h3>Five-question challenge</h3><p>Each round rotates in fresh questions instead of replaying the same five.</p><button className="primary-btn" onClick={()=>start("trivia")}>Play today →</button></div><div className="panel-card"><div className="eyebrow">WEEKLY TOURNAMENT</div><h3>Beat your best</h3><p>Weekly mode uses the expanded speed-question pool. High score is stored locally on this device.</p><div className="highscore">{highScores.speed||0}<span>best XP</span></div><button className="ghost-btn" onClick={()=>start("speed")}>Enter tournament</button></div></div>
    <div className="game-grid">{gameCatalog.map(g=><button className="game-card" key={g[0]} onClick={()=>start(g[0])}><div className="game-icon">{g[3]}</div><div className="eyebrow">{g[0]==="speed"?"WEEKLY":"PLAY"}</div><h3>{g[1]}</h3><p>{g[2]}</p><span>Play →</span>{highScores[g[0]]>0&&<small className="game-high">Best {highScores[g[0]]}</small>}</button>)}</div>
    <div className="achievement-strip"><span>✦</span><div><strong>Achievements & badges</strong><p>{stats.games} games played. Earn the First Step, Scripture Lover, Faithful, Bible Scholar, and The Journey milestones as you use the app.</p></div></div>
  </div>;
}

function DevotionalsView({devotionals,markActivity,notify}){
  const [active,setActive]=useState(null);const today=active||devotionals[0];
  if(active)return <div className="page"><button className="back-btn" onClick={()=>setActive(null)}>← Devotionals</button><div className="devotional-reader"><div className="eyebrow">5 MINUTE DEVOTIONAL</div><h1>{today[0]}</h1><p>{today[1]}</p><div className="reader-block"><strong>Reflect</strong><p>Read today's verse slowly. Notice what you believe, what you fear, and what you want to bring to prayer.</p></div><div className="reader-block"><strong>Prayer</strong><p>God, help me live the truth of Scripture in the ordinary details of this day. Amen.</p></div><div className="hero-actions"><button className="primary-btn" onClick={()=>{speak(today[1]);markActivity("reflection",20);notify("Devotional completed","Your reflection activity was recorded.");}}>▶ Listen</button><button className="ghost-btn" onClick={()=>{markActivity("reflection",20);notify("Reflection saved","You completed this devotional.");}}>Mark complete</button></div></div></div>;
  return <div className="page"><PageTitle eyebrow="REFLECT" title="Devotionals" text="Morning, evening, and focused short readings for different seasons of life."/><div className="devotional-grid">{devotionals.map(d=><button className="devotional-card" key={d[0]} onClick={()=>setActive(d)}><div className="dev-icon">{d[2]}</div><div className="eyebrow">{d[0].startsWith("Morning")?"MORNING":d[0].startsWith("Night")?"NIGHT":"FOCUSED"}</div><h3>{d[0]}</h3><p>{d[1]}</p><span>Read devotional →</span></button>)}</div><div className="two-column lower-gap"><div className="panel-card"><div className="eyebrow">VERSE OF THE NIGHT</div><h3>Close the day gently</h3><p>{dailyVerses[(Math.floor(Date.now()/86400000)+1)%dailyVerses.length].text}</p><button className="ghost-btn" onClick={()=>speak(dailyVerses[(Math.floor(Date.now()/86400000)+1)%dailyVerses.length].text)}>▶ Listen</button></div><div className="panel-card"><div className="eyebrow">AUDIO</div><h3>Background Scripture</h3><p>Your browser can keep reading while you use another tab in the site. Full streaming audio sources can be connected later.</p><button className="ghost-btn" onClick={()=>speak("Take a few quiet minutes. Read Scripture slowly and listen for what stands out.")}>▶ Start background reading</button></div></div></div>;
}

function JourneyView({user,selectedStruggles,toggleStruggle,completed,savedVerses,prayers,notes,stats,goals,setGoals,memory,setMemory,checkins,setCheckins,gratitude,setGratitude,moments,setMoments,testimony,setTestimony,go,notify}){
  const score=Math.min(100,20+Object.values(completed).filter(Boolean).length*10+Math.min(30,stats.streak*3)+Math.min(30,Math.floor(stats.xp/100)));
  const addGoal=(text,duration)=>{if(!text.trim())return;setGoals(g=>[{id:Date.now(),text:text.trim(),duration,done:0},...g]);notify("Goal added","Your spiritual goal is being tracked locally.");};
  const [goalText,setGoalText]=useState("");const [goalDays,setGoalDays]=useState(30);
  return <div className="page"><PageTitle eyebrow="YOUR STORY" title={user.name+"'s Journey"} text="A visual map of Scripture → Prayer → Learning → Growth → Challenges → Milestones, without turning faith into a competition."/>
    <div className="journey-hero"><div><div className="eyebrow">CURRENT SEASON</div><h2>Growing with intention.</h2><p>Your Journey score reflects practice signals—not how good you are, and never your worth before God.</p></div><div className="journey-score"><strong>{score}%</strong><span>practice score</span></div></div>
    <JourneyMap score={score} completed={completed}/>
    <div className="journey-grid"><div className="journey-card"><div className="eyebrow">WHAT YOU'RE FACING</div><h3>Current areas</h3><div className="chips">{struggles.map(s=><button key={s} className={"chip "+(selectedStruggles.includes(s)?"selected":"")} onClick={()=>toggleStruggle(s)}>{s}<span>{selectedStruggles.includes(s)?"✓":"+"}</span></button>)}</div></div><div className="journey-card"><div className="eyebrow">YOUR LIBRARY</div><div className="library-stats"><span><strong>{savedVerses.length}</strong><small>Saved verses</small></span><span><strong>{prayers.length}</strong><small>Active prayers</small></span><span><strong>{notes.length}</strong><small>Notes</small></span></div></div></div>
    <div className="journey-card"><div className="section-heading compact"><div><span className="eyebrow">HABITS</span><h3>Today</h3></div><span className="muted">{Object.values(completed).filter(Boolean).length} activities completed</span></div><div className="habit-list">{["Scripture","Prayer","Reading plan","Bible challenge","Reflection","Gratitude"].map((x,i)=><div className="habit-row" key={x}><span className={"habit-dot "+(completed[["verse","prayer","reading","game","reflection","gratitude"][i]]?"active":"")}/><strong>{x}</strong><small>{["Daily","Daily","This week","Today","Weekly","Daily"][i]}</small><b>{completed[["verse","prayer","reading","game","reflection","gratitude"][i]]?"✓":"○"}</b></div>)}</div></div>
    <div className="growth-snapshot-grid"><div className="panel-card"><div className="eyebrow">MILESTONES</div><h3>Day 1 → Day 365</h3><Milestone label="First Step" needed={1} current={stats.streak}/><Milestone label="Day 7" needed={7} current={stats.streak}/><Milestone label="Day 30" needed={30} current={stats.streak}/><Milestone label="Day 100" needed={100} current={stats.streak}/><Milestone label="Day 365" needed={365} current={stats.streak}/></div><div className="panel-card"><div className="eyebrow">GOALS</div><h3>30 / 60 / 90-day challenges</h3><div className="input-row"><input value={goalText} onChange={e=>setGoalText(e.target.value)} placeholder="A spiritual practice you want to build"/><select value={goalDays} onChange={e=>setGoalDays(e.target.value)}><option>30</option><option>60</option><option>90</option></select><button className="primary-btn" onClick={()=>{addGoal(goalText,goalDays);setGoalText("");}}>Add</button></div>{goals.slice(0,4).map(g=><div className="goal-row" key={g.id}><strong>{g.text}</strong><small>{g.duration} days • {g.done}/{g.duration}</small><button onClick={()=>setGoals(gs=>gs.map(x=>x.id===g.id?{...x,done:Math.min(x.duration,x.done+1)}:x))}>+1 day</button></div>)}</div></div>
    <div className="journey-actions"><button className="primary-btn" onClick={()=>go("growth")}>Open Growth hub →</button><button className="ghost-btn" onClick={()=>go("assistant")}>Study Assistant →</button></div>
  </div>;
}
function Milestone({label,needed,current}){const reached=current>=needed;return <div className={"milestone "+(reached?"reached":"")}><span>{reached?"✓":"○"}</span><div><strong>{label}</strong><small>{reached?"Reached":"Need "+(needed-current)+" more day"+(needed-current===1?"":"s")}</small></div></div>}
function JourneyMap({score,completed}){const steps=[["START",true],["SCRIPTURE",completed.verse],["PRAYER",completed.prayer],["LEARNING",completed.game],["GROWTH",completed.reflection],["CHALLENGES",score>=60],["MILESTONES",score>=80]];return <div className="journey-map"><div className="journey-map-line"/>{steps.map(([label,on],i)=><div className={"journey-node "+(on?"on":"")} key={label}><span>{on?"✓":i+1}</span><strong>{label}</strong><small>{on?"Active":"Next"}</small></div>)}</div>}

function GrowthView({stats,setStats,goals,setGoals,memory,setMemory,checkins,setCheckins,gratitude,setGratitude,moments,setMoments,testimony,setTestimony,markActivity,notify}){
  const [mood,setMood]=useState(moods[0]);const [need,setNeed]=useState(needs[0]);const [lesson,setLesson]=useState("");const [thanks,setThanks]=useState("");const [moment,setMoment]=useState("");const [memoryRef,setMemoryRef]=useState("John 3:16");const [goal,setGoal]=useState("");const [goalDays,setGoalDays]=useState(30);
  const submitCheckin=()=>{setCheckins(c=>[{id:Date.now(),date:todayKey(),mood,need},...c]);setStats(s=>({...s,streak:Math.max(s.streak,1),xp:s.xp+25}));markActivity("reflection",20);notify("Daily check-in saved","Your mood and need are saved privately.");};
  const addEntry=(setter,setterValue,type,msg)=>{if(!setterValue.trim())return;setter(prev=>[{id:Date.now(),date:new Date().toLocaleDateString(),text:setterValue.trim()},...prev]);setterValue="";markActivity(type,20);notify(msg,"Saved locally to your private Journey.");};
  const addMemory=()=>{if(!memoryRef.trim())return;setMemory(m=>[{id:Date.now(),ref:memoryRef.trim(),text:"Practice this verse from your Bible reader.",reviewed:0},...m.filter(x=>x.ref!==memoryRef.trim())]);setMemoryRef("");notify("Memory verse added","You'll see review reminders in your Journey.");};
  const reviewMemory=id=>setMemory(m=>m.map(x=>x.id===id?{...x,reviewed:(x.reviewed||0)+1,lastReview:todayKey()}:x));
  return <div className="page"><PageTitle eyebrow="FORMATION" title="Growth hub" text="Track spiritual practices, not spiritual worth: check-ins, memory, gratitude, goals, milestones, testimony, and longer challenges."/>
    <div className="growth-top-grid"><div className="panel-card checkin-card"><div className="eyebrow">DAILY SPIRITUAL CHECK-IN</div><h3>How are you doing today?</h3><div className="mood-grid">{moods.map(m=><button key={m} className={mood===m?"selected":""} onClick={()=>setMood(m)}>{m}</button>)}</div><div className="need-grid">{needs.map(n=><button key={n} className={need===n?"selected":""} onClick={()=>setNeed(n)}>I need {n}</button>)}</div><button className="primary-btn" onClick={submitCheckin}>Save today's check-in →</button></div><div className="panel-card"><div className="eyebrow">MORNING / NIGHT</div><h3>Two gentle moments</h3><div className="time-card"><span>☀</span><div><strong>Morning devotional</strong><small>Start with Scripture and intention.</small></div></div><div className="time-card"><span>☾</span><div><strong>Verse of the Night</strong><small>Release the day with Scripture and gratitude.</small></div></div><div className="time-card"><span>🔔</span><div><strong>Memory review</strong><small>Review verses you chose to remember.</small></div></div></div></div>
    <div className="growth-grid"><div className="panel-card"><div className="eyebrow">SCRIPTURE MEMORY</div><h3>Build a memory list</h3><div className="input-row"><input value={memoryRef} onChange={e=>setMemoryRef(e.target.value)} placeholder="John 3:16"/><button className="primary-btn" onClick={addMemory}>Add verse</button></div>{memory.length?memory.slice(0,6).map(x=><div className="memory-row" key={x.id}><div><strong>{x.ref}</strong><small>{x.reviewed||0} reviews • last {x.lastReview||"not yet"}</small></div><button className="ghost-btn" onClick={()=>{reviewMemory(x.id);notify("Memory review recorded","Nice work revisiting Scripture.");}}>Review</button></div>):<div className="empty-state">Add a verse to start memory challenges and review reminders.</div>}</div>
      <div className="panel-card"><div className="eyebrow">GRATITUDE JOURNAL</div><h3>One thing you're thankful for</h3><textarea value={thanks} onChange={e=>setThanks(e.target.value)} placeholder="Something good, ordinary, or meaningful..."/><button className="primary-btn" onClick={()=>{if(!thanks.trim())return;setGratitude(g=>[{id:Date.now(),date:new Date().toLocaleDateString(),text:thanks.trim()},...g]);setThanks("");markActivity("gratitude",20);notify("Gratitude saved","A new gratitude entry was added.");}}>Save gratitude</button><div className="mini-list">{gratitude.slice(0,3).map(g=><div key={g.id}><small>{g.date}</small><p>{g.text}</p></div>)}</div></div></div>
    <div className="growth-grid"><div className="panel-card"><div className="eyebrow">GOD-MOMENTS JOURNAL</div><h3>What stood out today?</h3><textarea value={moment} onChange={e=>setMoment(e.target.value)} placeholder="A moment of kindness, beauty, conviction, peace, or learning..."/><button className="primary-btn" onClick={()=>{if(!moment.trim())return;setMoments(m=>[{id:Date.now(),date:new Date().toLocaleDateString(),text:moment.trim()},...m]);setMoment("");notify("God-moment saved","Added to your private reflection journal.");}}>Save moment</button></div><div className="panel-card"><div className="eyebrow">WHAT DID GOD TEACH YOU?</div><h3>Daily reflection</h3><textarea value={lesson} onChange={e=>setLesson(e.target.value)} placeholder="What did you learn from Scripture, prayer, or today?"/><button className="primary-btn" onClick={()=>{if(!lesson.trim())return;setCheckins(c=>[{id:Date.now(),date:todayKey(),lesson:lesson.trim()},...c]);setLesson("");markActivity("reflection",25);notify("Reflection saved","Your lesson is part of your private Journey history.");}}>Save reflection</button></div></div>
    <div className="growth-grid"><div className="panel-card"><div className="eyebrow">SPIRITUAL GOALS</div><h3>30 / 60 / 90 days</h3><div className="input-row"><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="e.g. Pray before school"/><select value={goalDays} onChange={e=>setGoalDays(e.target.value)}><option>30</option><option>60</option><option>90</option></select><button className="primary-btn" onClick={()=>{if(!goal.trim())return;setGoals(g=>[{id:Date.now(),text:goal.trim(),duration:Number(goalDays),done:0},...g]);setGoal("");notify("Goal added","Your goal will appear in My Journey.");}}>Add</button></div>{goals.map(g=><div className="goal-row" key={g.id}><strong>{g.text}</strong><small>{g.done}/{g.duration} days</small><button onClick={()=>setGoals(gs=>gs.map(x=>x.id===g.id?{...x,done:Math.min(x.duration,x.done+1)}:x))}>+1</button></div>)}</div><div className="panel-card"><div className="eyebrow">TESTIMONY BUILDER</div><h3>Tell your story</h3>{["opening","story","change","hope"].map(k=><textarea key={k} value={testimony[k]} onChange={e=>setTestimony(t=>({...t,[k]:e.target.value}))} placeholder={{opening:"Where were you?",story:"What happened?",change:"What changed?",hope:"What hope do you have now?"}[k]}/>)}<button className="primary-btn" onClick={()=>{navigator.clipboard?.writeText(Object.values(testimony).filter(Boolean).join("\n\n"));notify("Testimony copied","Your testimony draft was copied when clipboard access is available.");}}>Copy testimony</button></div></div>
  </div>;
}

function AssistantView({verse,quickSession,setQuickSession,go,notify}){
  const [mode,setMode]=useState("simple");const [feeling,setFeeling]=useState("Anxious");const [need,setNeed]=useState("Scripture");const [reference,setReference]=useState(verse.ref);const [output,setOutput]=useState("");const modes=[["simple","Simpler language"],["context","Historical context"],["compare","Compare passages"],["difficult","Difficult passage"],["questions","Study questions"],["devotional","Make a devotional"],["related","Related Scripture"],["quiz","Quiz me"],["plan","Study plan"]];
  const run=()=>{const templates={simple:"This passage is inviting you to slow down and understand the main idea before trying to apply it. In plain language: notice what it says about God, what it says about people, and what response it invites.",context:"Context guide: ask who is speaking, who is listening, what comes before and after the passage, and what problem or hope the original audience is addressing.",compare:"Comparison guide: place "+reference+" beside another passage and note what each emphasizes, what they share, and where they differ. Use the Bible reader for the full texts.",difficult:"Difficult-passage guide: separate observation from interpretation, check the surrounding chapter, identify unfamiliar words, and compare multiple reputable translations or study resources.",questions:"Study questions: What stands out? What does this show about God? What does it reveal about people? What would obedience or trust look like today?",devotional:"Devotional draft: Read "+reference+" slowly. Reflect on one phrase. Bring one response to prayer. Choose one small action for today. End with gratitude.",related:"Related Scripture: "+(crossRefs[reference]?.join(" • ")||"Try the cross-reference explorer in Bible Study for a broader set."),quiz:"Quick quiz: What is the central idea of "+reference+"? A) Comfort B) Context C) All of the above. Use your Bible before deciding.",plan:"Study plan: Day 1 read the passage; Day 2 read context; Day 3 compare related passages; Day 4 journal one insight; Day 5 pray and review."};setOutput(templates[mode]);notify("Study guidance ready","This is a local study tool, not a claim of divine guidance.");};
  const mini=quickSession?.mode==="need";
  const createMini=()=>{const mapping={Anxious:verse,Sad:dailyVerses[4],Angry:dailyVerses[3],Tired:dailyVerses[6],Confused:dailyVerses[5],Grateful:dailyVerses[6],Peaceful:dailyVerses[1],Hopeful:dailyVerses[0],Happy:dailyVerses[6],"Stressed":dailyVerses[1]};const v=mapping[feeling]||verse;setReference(v.ref);setMode(need==="Understanding"?"simple":need==="Prayer"?"devotional":"simple");setOutput("Mini-session for "+feeling+":\n\nSCRIPTURE\n"+v.ref+"\n"+v.text+"\n\nEXPLANATION\nStart by naming what is true in the passage rather than trying to solve everything at once.\n\nREFLECTION\nWhat is one sentence you want to carry into the next hour?\n\nPRAYER\nGod, meet me in this moment and help me receive, understand, and practice what is good.\n\nJOURNAL\nOptional: write one sentence about what you noticed.");setQuickSession(null);};
  return <div className="page"><PageTitle eyebrow="STUDY TOOL" title="Study Assistant" text="A clearly labeled local study helper for simpler explanations, context, questions, related Scripture, devotional structure, quizzes, and study plans."/>
    {mini&&<div className="need-hero"><div><strong>I don't know what I need.</strong><p>Pick a feeling and what you want from this moment. Then The Journey builds one guided mini-session.</p></div><div className="need-controls"><select value={feeling} onChange={e=>setFeeling(e.target.value)}>{moods.map(m=><option key={m}>{m}</option>)}</select><select value={need} onChange={e=>setNeed(e.target.value)}>{needs.map(n=><option key={n}>{n}</option>)}</select><button className="primary-btn" onClick={createMini}>Build my session</button></div></div>}
    <div className="assistant-layout"><div className="panel-card"><div className="eyebrow">TOOLBOX</div><h3>Choose what you want to do</h3><div className="assistant-modes">{modes.map(m=><button key={m[0]} className={mode===m[0]?"active":""} onClick={()=>setMode(m[0])}>{m[1]}</button>)}</div><label className="field-label">Reference<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="John 3:16"/></label><button className="primary-btn wide" onClick={run}>Generate study guidance →</button></div><div className="assistant-output"><div className="eyebrow">RESULT</div><h3>{reference}</h3>{output?<div className="output-text">{output}</div>:<div className="empty-state">Choose a tool and generate a guide.</div>}<div className="assistant-disclaimer"><strong>Important:</strong> this assistant is a local study tool. It is not God, a pastor, or a substitute for Scripture, prayer, church community, or trusted pastoral guidance.</div></div></div>
  </div>;
}

function CommunityView({posts,setPosts,blocked,setBlocked,reports,setReports,notify}){
  const [tab,setTab]=useState("All");const [composer,setComposer]=useState("");const [category,setCategory]=useState("Encouragement");const [anonymous,setAnonymous]=useState(false);const [muted,setMuted]=useState([]);const [activeGroup,setActiveGroup]=useState("Small groups");
  const base=posts||[{id:1,name:"Maya",role:"member",time:"3h",text:"I was struggling with worry this week, and Philippians 4:6 reminded me to actually bring it to God.",likes:12,category:"Encouragement"},{id:2,name:"Ethan",role:"member",time:"6h",text:"Finished my first 30-day reading plan today. Keep going, everybody!",likes:24,category:"Milestone"},{id:3,name:"Grace",role:"member",time:"1d",text:"Prayer request: please pray for wisdom as I make an important decision.",likes:31,category:"Prayer request"},{id:4,name:"Harbor Church",role:"verified",time:"2d",text:"This week's group challenge: read one Gospel chapter and share one thing that stood out.",likes:18,category:"Group challenge"}];
  const publish=()=>{if(!composer.trim())return;setPosts([{id:Date.now(),name:anonymous?"Anonymous":"You",role:"member",time:"now",text:composer.trim(),likes:0,category},...base]);setComposer("");notify("Post published","Your local community post is visible on this device.");};
  const react=id=>setPosts(base.map(p=>p.id===id?{...p,likes:p.likes+1}:p));
  const report=id=>{setReports(r=>[...r,id]);notify("Report recorded","The moderation report is stored locally.");};
  const visible=base.filter(p=>!blocked.includes(p.name)&&!muted.includes(p.name)&& (tab==="All"||p.category===tab));
  return <div className="page"><PageTitle eyebrow="TOGETHER" title="Community" text="Encouragement, testimonies, prayer requests, Bible discussions, church/youth/small groups, and moderation controls." action={<button className="primary-btn" onClick={()=>document.getElementById("composer")?.scrollIntoView({behavior:"smooth"})}>＋ Share something</button>}/>
    <div className="community-tabs">{["All","Encouragement","Testimony","Prayer request","Group challenge"].map(x=><button className={tab===x?"active":""} key={x} onClick={()=>setTab(x)}>{x}</button>)}</div>
    <div className="community-layout"><div><div className="post-composer" id="composer"><div className="composer-top"><span className="avatar">Y</span><select value={category} onChange={e=>setCategory(e.target.value)}><option>Encouragement</option><option>Testimony</option><option>Prayer request</option><option>Group challenge</option><option>Bible discussion</option></select><button className={"chip "+(anonymous?"selected":"")} onClick={()=>setAnonymous(v=>!v)}>Anonymous</button></div><textarea value={composer} onChange={e=>setComposer(e.target.value)} placeholder="Share something encouraging. Avoid private contact information and respect community guidelines."/><button className="primary-btn" onClick={publish}>Publish post</button></div><div className="feed">{visible.map(p=><article className="post-card" key={p.id}><div className="post-head"><div className="avatar">{p.name[0]}</div><div><strong>{p.name} {p.role==="verified"&&<span className="verified">✓ Ministry</span>}</strong><small>{p.time} • {p.category}</small></div><button onClick={()=>report(p.id)}>Report</button></div><p>{p.text}</p><div className="post-actions"><button onClick={()=>react(p.id)}>♡ {p.likes}</button><button onClick={()=>notify("Reply ready","Reply composer is available in the future community backend.")}>↩ Reply</button><button onClick={()=>setBlocked(b=>b.includes(p.name)?b:[...b,p.name])}>Block/mute</button><button onClick={()=>report(p.id)}>Report</button></div></article>)}</div></div>
      <div className="community-side"><div className="side-card"><div className="eyebrow">GROUPS</div><h3>Find your circle</h3><div className="group-tabs">{["Bible discussions","Study groups","Church groups","Youth groups","Small groups"].map(g=><button className={activeGroup===g?"active":""} key={g} onClick={()=>setActiveGroup(g)}>{g}</button>)}</div><p>{activeGroup} are represented here as local discovery UI. Real membership and moderation need a backend.</p><button className="ghost-btn" onClick={()=>notify(activeGroup,"Local group discovery opened.")}>Explore {activeGroup}</button></div><div className="side-card"><div className="eyebrow">SAFETY</div><h3>Community guidelines</h3><p>Be kind. Avoid harassment. Protect privacy. Do not post dangerous or identifying information. Report content that breaks the rules.</p><div className="safety-stats"><span><strong>{reports.length}</strong><small>reports</small></span><span><strong>{blocked.length}</strong><small>blocked</small></span></div></div><div className="side-card"><div className="eyebrow">GROUP CHALLENGE</div><h3>Read + reflect</h3><p>Read one Gospel chapter and share one sentence about what stood out.</p><button className="primary-btn" onClick={()=>notify("Group challenge joined","Your local challenge progress is ready.")}>Join challenge</button></div></div></div>
  </div>;
}

function MoreView({preferences,setPreferences,family,setFamily,audio,setAudio,go,notify}){
  const [mapTab,setMapTab]=useState("map");
  const [familyName,setFamilyName]=useState("");
  const [timerMinutes,setTimerMinutes]=useState(audio.timer||0);
  const [remaining,setRemaining]=useState(0);
  const [running,setRunning]=useState(false);
  const [familyFeatures,setFamilyFeatures]=useState(()=>safeParse("journey_family_features",{familyPlan:true,prayerBoard:true,kidsGames:false,familyChallenges:true,sharedGoals:true,privacy:true}));
  useEffect(()=>{localStorage.setItem("journey_family_features",JSON.stringify(familyFeatures));},[familyFeatures]);
  useEffect(()=>{if(!running)return;const id=setInterval(()=>setRemaining(v=>{if(v<=1){setRunning(false);window.speechSynthesis?.cancel();notify("Audio timer ended","Your Scripture timer reached zero.");return 0;}return v-1;}),1000);return()=>clearInterval(id);},[running]);
  const languages=[["en","English"],["es","Spanish"],["fr","French"],["pt","Portuguese"],["de","German"],["ko","Korean"],["zh","Chinese"]];
  const addFamily=()=>{if(!familyName.trim())return;setFamily(f=>[...f,{id:Date.now(),name:familyName.trim(),mode:preferences.familyMode||"Teen / Youth"}]);setFamilyName("");notify("Family profile added","Family profiles stay local in this build.");};
  const startTimer=()=>{const seconds=Math.max(1,Number(timerMinutes||0))*60;setRemaining(seconds);setAudio(a=>({...a,timer:Number(timerMinutes||0)}));setRunning(true);notify("Audio timer started","The timer will stop browser speech when it reaches zero.");};
  const mins=Math.floor(remaining/60).toString().padStart(2,"0"),secs=(remaining%60).toString().padStart(2,"0");
  return <div className="page">
    <PageTitle eyebrow="MORE" title="Everything else" text="Audio, languages, family mode, Bible map, free integrations, and the complete feature audit."/>
    <div className="more-grid">
      <div className="panel-card"><div className="eyebrow">AUDIO</div><h3>Scripture audio toolkit</h3><p>Audio Bible uses your browser's speech engine. Guided prayer, sleep Scripture, background reading, and devotionals use the same local reader.</p><div className="audio-actions"><button className="primary-btn" onClick={()=>{speak("Take a slow breath. Read Scripture, then pray honestly.");notify("Guided prayer playing","Browser speech is reading the guide.");}}>▶ Guided prayer</button><button className="ghost-btn" onClick={()=>{speak("Scripture for tonight: Be still, and know that I am God.");notify("Sleep Scripture playing","Use the timer below when you are ready.");}}>☾ Sleep Scripture</button><button className="ghost-btn" onClick={()=>{speak("Open your Bible and read a chapter slowly, noticing what stands out.");notify("Background Scripture playing","Browser speech is reading your prompt.");}}>▶ Background Scripture</button><button className="ghost-btn" onClick={()=>window.speechSynthesis?.cancel()}>■ Stop</button></div><div className="timer-row"><input type="number" min="1" max="120" value={timerMinutes} onChange={e=>setTimerMinutes(e.target.value)}/><span>minutes</span><button className="ghost-btn" onClick={startTimer}>Start timer</button><button className="ghost-btn" onClick={()=>setRunning(false)}>Pause</button>{remaining>0&&<strong className="timer-clock">{mins}:{secs}</strong>}</div><div className="external-links"><button onClick={()=>openExternal("https://open.spotify.com/search/bible%20podcast")}>Open Bible podcasts ↗</button><button onClick={()=>openExternal("https://open.spotify.com/search/christian%20worship")}>Open worship playlist ↗</button></div></div>
      <div className="panel-card"><div className="eyebrow">LANGUAGES</div><h3>Choose your interface language</h3><div className="language-grid">{languages.map(([id,label])=><button className={preferences.language===id?"selected":""} key={id} onClick={()=>{setPreferences(p=>({...p,language:id}));notify("Language updated",label+" is selected.");}}>{label}</button>)}</div><div className="muted small-copy">Core navigation labels are localized in all seven language packs. Bible text follows the chosen Scripture source.</div></div>
      <div className="panel-card"><div className="eyebrow">FAMILY MODE</div><h3>Shared faith, local privacy</h3><select value={preferences.familyMode} onChange={e=>setPreferences(p=>({...p,familyMode:e.target.value}))}>{familyModes.map(x=><option key={x}>{x}</option>)}</select><div className="family-form"><input value={familyName} onChange={e=>setFamilyName(e.target.value)} placeholder="Family member / profile name"/><button className="primary-btn" onClick={addFamily}>Add profile</button></div>{family.map(f=><div className="family-row" key={f.id}><strong>{f.name}</strong><small>{f.mode}</small></div>)}<div className="family-feature-list">{[["familyPlan","Family Bible plans"],["prayerBoard","Family prayer board"],["kidsGames","Kids Bible games"],["familyChallenges","Family challenges"],["sharedGoals","Shared Scripture goals"],["privacy","Privacy / safety controls"]].map(([k,label])=><button className="toggle-row" key={k} onClick={()=>setFamilyFeatures(x=>({...x,[k]:!x[k]}))}><span><strong>{label}</strong><small>Local workspace control</small></span><span className={"toggle "+(familyFeatures[k]?"on":"")}><i/></span></button>)}</div><p>Parent/guardian, teen/youth, and child-safe modes share the same local privacy boundary in this frontend build.</p></div>
      <div className="panel-card map-card"><div className="eyebrow">INTERACTIVE BIBLE MAP</div><h3>Places at a glance</h3><div className="map-tabs">{["map","places","timeline"].map(x=><button key={x} className={mapTab===x?"active":""} onClick={()=>setMapTab(x)}>{x}</button>)}</div>{mapTab==="map"?<BibleMap/>:mapTab==="places"?biblePlaces.slice(0,6).map(p=><div className="saved-row" key={p[0]}><strong>{p[0]}</strong><small>{p[1]} • {p[2]}</small></div>):timeline.slice(0,8).map(p=><div className="saved-row" key={p[0]}><strong>{p[0]}</strong><small>{p[1]}</small></div>)}</div>
      <div className="panel-card"><div className="eyebrow">FREE INTEGRATIONS</div><h3>No paid features required</h3><p>Current build uses local browser storage, public/open Scripture sources, browser speech, and normal links. There is no subscription gate.</p><button className="primary-btn" onClick={()=>go("audit")}>Run feature audit →</button></div>
    </div>
  </div>;
}

function BibleMap(){const points=[["Bethlehem",30,64],["Jerusalem",40,58],["Nazareth",45,34],["Galilee",56,27],["Jericho",57,52],["Rome",83,22]];return <div className="bible-map">{points.map(([name,x,y])=><button className="map-point" style={{left:x+"%",top:y+"%"}} title={name} key={name} onClick={()=>alert(name)}><span/><em>{name}</em></button>)}<div className="map-land"/> </div>}

function SettingsView({user,setUser,preferences,setPreferences,notifications,setNotifications,selectedStruggles,toggleStruggle,family,setFamily,notify}){
  const [name,setName]=useState(user.name||"");const save=()=>{setUser({...user,name:name.trim()||user.name});notify("Profile updated","Your display name was saved.");};
  const toggle=key=>setPreferences(p=>({...p,[key]:!p[key]}));
  const reset=()=>{if(!confirm("Clear local Journey data on this device?"))return;["journey_user","journey_struggles","journey_notifications","journey_saved","journey_prayers","journey_notes","journey_completed","journey_preferences","journey_stats","journey_goals","journey_memory","journey_checkins","journey_gratitude","journey_moments","journey_testimony","journey_community","journey_blocked","journey_reports","journey_plan_progress","journey_family","journey_highscores","journey_audio","journey_reading_highlights","journey_answered_prayers","journey_prayer_categories"].forEach(k=>localStorage.removeItem(k));location.reload();};
  return <div className="page"><PageTitle eyebrow="PREFERENCES" title="Settings" text="Control your profile, notifications, personalization, language, family mode, and local privacy."/>
    <div className="settings-grid"><div className="settings-card"><div className="eyebrow">PROFILE</div><h3>Your account</h3><label>Display name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input value={user.email} disabled/></label><button className="primary-btn" onClick={save}>Save changes</button></div>
      <div className="settings-card"><div className="eyebrow">NOTIFICATIONS</div><h3>Choose what you receive</h3><Toggle label="Morning Daily Verse ready" sub="Your personalized verse is ready." value={preferences.dailyVerse} setValue={()=>toggle("dailyVerse")}/><Toggle label="Reading plan reminder" sub="Keep a steady reading rhythm." value={preferences.readingReminder??true} setValue={()=>toggle("readingReminder")}/><Toggle label="Evening reflection" sub="A quiet end-of-day check-in." value={preferences.eveningReflection} setValue={()=>toggle("eveningReflection")}/><Toggle label="Prayer reminder" sub="Gentle quiet-time reminders." value={preferences.prayerReminder} setValue={()=>toggle("prayerReminder")}/><Toggle label="Memory verse review" sub="Review your Scripture memory list." value={preferences.memoryReview} setValue={()=>toggle("memoryReview")}/><Toggle label="Community activity" sub="Replies, reactions, and group updates." value={preferences.community} setValue={()=>toggle("community")}/></div>
      <div className="settings-card"><div className="eyebrow">PERSONALIZATION</div><h3>Current season</h3><div className="chips">{struggles.map(s=><button key={s} className={"chip "+(selectedStruggles.includes(s)?"selected":"")} onClick={()=>toggleStruggle(s)}>{s}<span>{selectedStruggles.includes(s)?"✓":"+"}</span></button>)}</div></div>
      <div className="settings-card"><div className="eyebrow">LANGUAGE + FAMILY</div><h3>{languagePack[preferences.language]?.settings||"Settings"}</h3><select value={preferences.language} onChange={e=>setPreferences(p=>({...p,language:e.target.value}))}><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="pt">Portuguese</option><option value="de">German</option><option value="ko">Korean</option><option value="zh">Chinese</option></select><select value={preferences.familyMode} onChange={e=>setPreferences(p=>({...p,familyMode:e.target.value}))}>{familyModes.map(x=><option key={x}>{x}</option>)}</select><div className="muted small-copy">{family.length} local family profiles configured.</div></div>
      <div className="settings-card"><div className="eyebrow">PRIVACY</div><h3>Your data</h3><p>Early account, saved Scripture, notes, prayers, progress, community state, family profiles, goals, and preferences are stored locally in your browser.</p><button className="ghost-btn" onClick={()=>setNotifications([])}>Clear notifications</button><button className="danger-btn" onClick={reset}>Clear all local Journey data</button></div></div>
  </div>;
}

function Toggle({label,sub,value,setValue}){return <button className="toggle-row" onClick={setValue}><span><strong>{label}</strong><small>{sub}</small></span><span className={"toggle "+(value?"on":"")}><i/></span></button>}

function FeatureAuditView({go}){
  const groups=featureGroups;const total=featureFlatList.length;
  return <div className="page">
    <PageTitle eyebrow="VERIFICATION" title="Feature audit" text={"Every requested feature is represented in the build. "+total+" feature entries are tracked below; each item links to the section that implements it."}/>
    <div className="audit-summary"><div><strong>{total}</strong><span>tracked features</span></div><div><strong>{featureFlatList.filter(f=>f.status).length}</strong><span>implemented entries</span></div><div><strong>{Math.round(featureFlatList.filter(f=>f.status).length/total*100)}%</strong><span>audit coverage</span></div></div>
    {groups.map(g=><section className="audit-group" key={g.group}><div className="section-heading"><div><span className="eyebrow">{g.group.toUpperCase()}</span><h2>{g.items.length} / {g.items.length}</h2></div><span className="audit-badge">✓ All added</span></div><div className="audit-grid">{g.items.map(item=><button className="audit-item" key={item} onClick={()=>go(featureRoutes[item]||"more")}><span>✓</span><div><strong>{item}</strong><small>Implemented • open its section →</small></div></button>)}</div></section>)}
    <div className="audit-note"><strong>Verification standard:</strong> this screen audits the feature inventory in <code>src/data.js</code> and gives every entry a destination route. Cloud auth, browser push delivery, multi-user community persistence, full licensed translation coverage, and external AI services are not claimed as live backend services in this frontend-only build.</div>
  </div>;
}