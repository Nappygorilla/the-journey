import React, { useEffect, useMemo, useState } from "react";

const verses = [
  {
    ref: "Isaiah 41:10",
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.",
    topics: ["fear", "anxiety", "strength", "worry", "courage"]
  },
  {
    ref: "Philippians 4:6",
    text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
    topics: ["anxiety", "worry", "prayer", "peace"]
  },
  {
    ref: "1 Corinthians 10:13",
    text: "God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape.",
    topics: ["temptation", "self-control", "sin", "strength"]
  },
  {
    ref: "Ephesians 4:32",
    text: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
    topics: ["forgiveness", "anger", "relationships", "grace"]
  },
  {
    ref: "Psalm 34:18",
    text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
    topics: ["grief", "loneliness", "sadness", "comfort"]
  },
  {
    ref: "Proverbs 3:5",
    text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
    topics: ["doubt", "purpose", "wisdom", "trust"]
  },
  {
    ref: "Galatians 5:22",
    text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.",
    topics: ["growth", "self-control", "peace", "faith"]
  }
];

const struggles = [
  "Anxiety / worry", "Fear", "Anger", "Temptation", "Self-control", "Forgiveness",
  "Loneliness", "Grief", "Doubt", "Relationships", "Pride", "Jealousy",
  "Finding purpose", "Growing closer to God", "Stress", "Guilt"
];

const navItems = [
  ["home", "Home", "⌂"],
  ["bible", "Bible", "✦"],
  ["study", "Study", "▦"],
  ["plans", "Plans", "◷"],
  ["prayer", "Prayer", "♡"],
  ["games", "Games", "⌁"],
  ["devotionals", "Devotionals", "☼"],
  ["community", "Community", "◉"],
  ["journey", "My Journey", "♧"]
];

const games = [
  { title: "Daily Bible Challenge", meta: "5 questions • 2 min", icon: "⚡", level: "Quick" },
  { title: "Who Am I?", meta: "10 clues • 4 min", icon: "◉", level: "Growing" },
  { title: "Complete the Verse", meta: "8 rounds • 5 min", icon: "✦", level: "Growing" },
  { title: "Bible Timeline", meta: "10 events • 6 min", icon: "◷", level: "Advanced" },
  { title: "Which Book?", meta: "12 questions • 5 min", icon: "▤", level: "Quick" },
  { title: "Faith in Action", meta: "Scenario quiz • 4 min", icon: "♡", level: "Reflect" }
];

function safeParse(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export default function App() {
  const [user, setUser] = useState(() => safeParse("journey_user", null));
  const [view, setView] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStruggles, setSelectedStruggles] = useState(() => safeParse("journey_struggles", []));
  const [notifications, setNotifications] = useState(() => safeParse("journey_notifications", [
    { id: 1, title: "Welcome to The Journey", body: "Your personalized faith dashboard is ready.", read: false, time: "Now" },
    { id: 2, title: "Daily challenge available", body: "Take today's 5-question Bible Challenge.", read: false, time: "Today" }
  ]));
  const [savedVerses, setSavedVerses] = useState(() => safeParse("journey_saved", []));
  const [prayers, setPrayers] = useState(() => safeParse("journey_prayers", []));
  const [notes, setNotes] = useState(() => safeParse("journey_notes", []));
  const [completed, setCompleted] = useState(() => safeParse("journey_completed", { verse:false, prayer:false, reading:false, game:false }));
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuth, setShowAuth] = useState(!user);
  const [onboarding, setOnboarding] = useState(() => Boolean(user && !localStorage.getItem("journey_onboarded")));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { localStorage.setItem("journey_user", JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem("journey_struggles", JSON.stringify(selectedStruggles)); }, [selectedStruggles]);
  useEffect(() => { localStorage.setItem("journey_notifications", JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem("journey_saved", JSON.stringify(savedVerses)); }, [savedVerses]);
  useEffect(() => { localStorage.setItem("journey_prayers", JSON.stringify(prayers)); }, [prayers]);
  useEffect(() => { localStorage.setItem("journey_notes", JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem("journey_completed", JSON.stringify(completed)); }, [completed]);

  const currentVerse = useMemo(() => {
    if (selectedStruggles.length) {
      const match = verses.find(v => selectedStruggles.some(s => v.topics.includes(s.toLowerCase().split(" / ")[0].split(" ")[0])));
      if (match) return match;
    }
    const day = Math.floor(Date.now() / 86400000);
    return verses[day % verses.length];
  }, [selectedStruggles]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const notify = (title, body) => {
    setNotifications(prev => [{ id: Date.now(), title, body, read:false, time:"Just now" }, ...prev]);
    setToast(title);
    window.setTimeout(() => setToast(""), 2600);
  };

  const saveVerse = () => {
    const exists = savedVerses.some(v => v.ref === currentVerse.ref);
    if (exists) {
      setSavedVerses(prev => prev.filter(v => v.ref !== currentVerse.ref));
      notify("Verse removed", "The verse was removed from your saved Scripture.");
    } else {
      setSavedVerses(prev => [currentVerse, ...prev]);
      notify("Verse saved", "Saved to your personal Scripture collection.");
    }
    setCompleted(c => ({...c, verse:true}));
  };

  const toggleStruggle = (item) => {
    setSelectedStruggles(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const logout = () => {
    setUser(null);
    setShowAuth(true);
    setView("home");
  };

  if (!user || showAuth) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        error={authError}
        setError={setAuthError}
        onSuccess={(nextUser) => {
          setUser(nextUser);
          setShowAuth(false);
          notify("Welcome to The Journey", "Your personal faith dashboard is ready.");
          setOnboarding(true);
        }}
      />
    );
  }

  if (onboarding) {
    return <OnboardingScreen
      name={user.name}
      selectedStruggles={selectedStruggles}
      toggleStruggle={toggleStruggle}
      onComplete={() => {
        localStorage.setItem("journey_onboarded", "1");
        setOnboarding(false);
        notify("Your Journey is personalized", "Your Daily Verse now reflects what you chose.");
      }}
    />;
  }

  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobileOpen ? "open" : "")}>
        <div className="brand-block">
          <div className="brand-mark">✝</div>
          <div>
            <div className="brand-name">The Journey</div>
            <div className="brand-tag">Scripture • Prayer • Growth</div>
          </div>
        </div>
        <div className="sidebar-label">Explore</div>
        <nav>
          {navItems.map(([id,label,icon]) => (
            <button key={id} className={"nav-item " + (view===id ? "active" : "")} onClick={() => {setView(id);setMobileOpen(false);}}>
              <span className="nav-icon">{icon}</span><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-card">
            <div className="mini-title">Journey streak</div>
            <div className="mini-value">7 days <span>🔥</span></div>
            <div className="progress"><div style={{width:"70%"}} /></div>
            <div className="muted">Keep growing in the Word.</div>
          </div>
          <button className="nav-item" onClick={() => setView("settings")}><span className="nav-icon">⚙</span><span>Settings</span></button>
          <button className="nav-item" onClick={logout}><span className="nav-icon">↪</span><span>Sign out</span></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(v=>!v)}>☰</button>
          <div className="search-wrap">
            <span>⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setView("bible");}}} placeholder="Search Scripture, topics, studies..." />
          </div>
          <div className="top-actions">
            <button className="icon-btn" onClick={()=>setShowNotifications(v=>!v)} aria-label="Notifications">
              ♧{unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
            </button>
            <div className="profile-chip" onClick={()=>setView("journey")}>
              <div className="avatar">{(user.name || "J")[0].toUpperCase()}</div>
              <div className="profile-copy"><strong>{user.name || "Friend"}</strong><span>On your journey</span></div>
            </div>
          </div>
          {showNotifications && (
            <div className="notification-panel">
              <div className="panel-head"><div><strong>Notifications</strong><span>{unreadCount} unread</span></div><button onClick={()=>setNotifications(prev=>prev.map(n=>({...n,read:true})))}>Mark all read</button></div>
              {notifications.slice(0,6).map(n=><button className={"notification " + (!n.read ? "unread":"")} key={n.id} onClick={()=>setNotifications(prev=>prev.map(x=>x.id===n.id?{...x,read:true}:x))}><span className="notif-icon">✦</span><span><strong>{n.title}</strong><small>{n.body}</small><em>{n.time}</em></span></button>)}
            </div>
          )}
        </header>

        <div className="content">
          {view === "home" && <HomeView user={user} verse={currentVerse} saved={savedVerses.some(v=>v.ref===currentVerse.ref)} onSave={saveVerse} setView={setView} completed={completed} notify={notify}/>}
          {view === "bible" && <BibleView search={search} savedVerses={savedVerses} setSavedVerses={setSavedVerses} notes={notes} setNotes={setNotes} notify={notify}/>}
          {view === "study" && <StudyView setView={setView}/>}
          {view === "plans" && <PlansView completed={completed} setCompleted={setCompleted} notify={notify}/>}
          {view === "prayer" && <PrayerView prayers={prayers} setPrayers={setPrayers} setCompleted={setCompleted} notify={notify}/>}
          {view === "games" && <GamesView setCompleted={setCompleted} notify={notify}/>}
          {view === "devotionals" && <DevotionalsView setView={setView}/>}
          {view === "community" && <CommunityView notify={notify}/>}
          {view === "journey" && <JourneyView user={user} selectedStruggles={selectedStruggles} toggleStruggle={toggleStruggle} completed={completed} savedVerses={savedVerses} prayers={prayers} notes={notes} />}
          {view === "settings" && <SettingsView user={user} notifications={notifications} setNotifications={setNotifications} setUser={setUser} notify={notify}/>}
        </div>
      </main>
      {toast && <div className="toast"><span>✦</span>{toast}</div>}
    </div>
  );
}

function OnboardingScreen({name,selectedStruggles,toggleStruggle,onComplete}) {
  const [step,setStep] = useState(0);
  return (
    <div className="onboarding-page">
      <div className="onboarding-glow" />
      <div className="onboarding-card">
        <div className="onboarding-top">
          <div className="brand-block">
            <div className="brand-mark">✝</div>
            <div><div className="brand-name">The Journey</div><div className="brand-tag">A personal walk through Scripture</div></div>
          </div>
          <span>{step + 1} / 2</span>
        </div>
        {step === 0 ? (
          <div className="onboarding-body">
            <div className="eyebrow">WELCOME</div>
            <h1>Hey {name?.split(" ")[0] || "friend"}.</h1>
            <p>Before we begin, tell us what you need from Scripture right now. You can change this anytime.</p>
            <div className="onboarding-preview"><span>✦</span><div><strong>Your verse will be personal.</strong><small>We'll use your choices to guide today's Scripture and reflection.</small></div></div>
            <button className="primary-btn" onClick={()=>setStep(1)}>Choose what I'm facing →</button>
          </div>
        ) : (
          <div className="onboarding-body">
            <div className="eyebrow">YOUR CURRENT SEASON</div>
            <h1>What are you struggling with?</h1>
            <p>Select anything that feels relevant. There is nothing to be ashamed of here.</p>
            <div className="chips onboarding-chips">
              {struggles.map(s=><button key={s} className={selectedStruggles.includes(s)?"chip selected":"chip"} onClick={()=>toggleStruggle(s)}>{s}<span>{selectedStruggles.includes(s)?"✓":"+"}</span></button>)}
            </div>
            <div className="onboarding-actions"><button className="ghost-btn" onClick={()=>setStep(0)}>← Back</button><button className="primary-btn" onClick={onComplete}>{selectedStruggles.length ? "Finish my Journey →" : "Skip for now →"}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthScreen({mode,setMode,error,setError,onSuccess}) {
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [showPassword,setShowPassword] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (mode === "register" && !name.trim()) return setError("Please enter your name.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Use at least 6 characters for your password.");
    const next = { name: name.trim() || email.split("@")[0], email };
    localStorage.setItem("journey_account", JSON.stringify({email,password,name:next.name}));
    onSuccess(next);
  };

  return (
    <div className="auth-page">
      <div className="auth-glow glow-a"/><div className="auth-glow glow-b"/>
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark large">✝</div>
          <div><div className="brand-name">The Journey</div><div className="brand-tag">Grow in faith. Grow in Scripture.</div></div>
        </div>
        <div className="auth-heading">{mode==="login" ? "Welcome back." : "Begin your journey."}</div>
        <p className="auth-sub">{mode==="login" ? "Pick up where you left off." : "A free space for Scripture, prayer, learning, and growth."}</p>
        <form onSubmit={submit} className="auth-form">
          {mode==="register" && <label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}
          <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
          <label>Password<div className="password-wrap"><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?"Hide":"Show"}</button></div></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn wide">{mode==="login" ? "Enter The Journey" : "Create Free Account"} <span>→</span></button>
        </form>
        <div className="auth-divider"><span>100% free</span></div>
        <button className="auth-switch" onClick={()=>{setError("");setMode(mode==="login"?"register":"login");}}>
          {mode==="login" ? "New here? Create your free account" : "Already have an account? Sign in"}
        </button>
        <div className="auth-note">Your early account data is stored locally in this version. No paid features, ever.</div>
      </div>
    </div>
  );
}

function HomeView({user,verse,saved,onSave,setView,completed,notify}) {
  const tasks = [
    ["verse","Read your personalized verse","Scripture for what you're facing"],
    ["reading","Continue your reading plan","Luke • Day 14"],
    ["prayer","Write today's prayer","2 minutes of quiet reflection"],
    ["game","Take the Bible challenge","5 questions • 2 minutes"]
  ];
  return <div className="page page-home">
    <section className="hero">
      <div>
        <div className="eyebrow">GOOD MORNING, {user.name?.split(" ")[0]?.toUpperCase() || "FRIEND"}</div>
        <h1>Walk with God.<br/><em>One day at a time.</em></h1>
        <p>Your journey is personal. Scripture, prayer, study, and challenges—built around where you are today.</p>
        <div className="hero-actions"><button className="primary-btn" onClick={()=>document.getElementById("daily-verse")?.scrollIntoView({behavior:"smooth"})}>Open today's verse <span>↓</span></button><button className="ghost-btn" onClick={()=>setView("journey")}>View my journey</button></div>
      </div>
      <div className="hero-art">
        <div className="hero-orb"></div>
        <div className="hero-cross">✝</div>
        <div className="hero-ring r1"></div><div className="hero-ring r2"></div>
      </div>
    </section>

    <section className="stats-row">
      <Stat label="Faith streak" value="7 days" icon="🔥"/>
      <Stat label="Scripture read" value="42 chapters" icon="📖"/>
      <Stat label="Prayers" value="18 saved" icon="🙏"/>
      <Stat label="Bible XP" value="1,240" icon="✦"/>
    </section>

    <section className="section-grid" id="daily-verse">
      <div className="verse-card">
        <div className="card-head"><div><span className="eyebrow">YOUR DAILY VERSE</span><h2>For what you're facing</h2></div><span className="day-pill">TODAY</span></div>
        <blockquote>“{verse.text}”</blockquote>
        <div className="verse-footer"><div><strong>{verse.ref}</strong><span>KJV</span></div><div className="row-actions"><button className={"small-btn " + (saved ? "saved":"")} onClick={onSave}>{saved?"♥ Saved":"♡ Save"}</button><button className="small-btn" onClick={()=>notify("Verse shared","Your share action is ready to connect to your favorite app.")}>↗ Share</button></div></div>
        <div className="reflection"><span className="reflection-icon">✦</span><div><strong>A thought for today</strong><p>Bring this verse into your day slowly. Let the words shape your response before you rush to the next thing.</p></div></div>
      </div>
      <div className="today-card">
        <div className="card-head"><div><span className="eyebrow">TODAY'S PATH</span><h2>Keep moving</h2></div><span className="path-badge">70%</span></div>
        {tasks.map(([key,title,sub])=><button className="task-row" key={key} onClick={()=>setView(key==="verse"?"bible":key==="reading"?"plans":key==="prayer"?"prayer":"games")}><span className={"task-check "+(completed[key]?"done":"")}>{completed[key]?"✓":"○"}</span><span><strong>{title}</strong><small>{sub}</small></span><span className="task-arrow">→</span></button>)}
      </div>
    </section>

    <section className="wide-section">
      <div className="section-heading"><div><span className="eyebrow">EXPLORE</span><h2>More ways to grow</h2></div><button className="text-btn" onClick={()=>setView("study")}>See everything →</button></div>
      <div className="feature-grid">
        <FeatureCard icon="📚" title="Bible Study" text="Commentary, cross-references, topics, word studies, and more." onClick={()=>setView("study")}/>
        <FeatureCard icon="🙏" title="Prayer Journal" text="Keep private prayers, gratitude, and answered-prayer notes." onClick={()=>setView("prayer")}/>
        <FeatureCard icon="🎮" title="Learn through play" text="Quizzes, challenges, memory games, timelines, and Bible trivia." onClick={()=>setView("games")}/>
        <FeatureCard icon="☼" title="Devotionals" text="Short, focused reflections for mornings, nights, and hard seasons." onClick={()=>setView("devotionals")}/>
      </div>
    </section>
  </div>
}

function Stat({label,value,icon}) { return <div className="stat-card"><span className="stat-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div> }
function FeatureCard({icon,title,text,onClick}) { return <button className="feature-card" onClick={onClick}><span className="feature-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><b>→</b></button> }

function BibleView({search,savedVerses,setSavedVerses,notes,setNotes,notify}) {
  const books = [
    ["Genesis","GEN",50],["Exodus","EXO",40],["Leviticus","LEV",27],["Numbers","NUM",36],["Deuteronomy","DEU",34],
    ["Joshua","JOS",24],["Judges","JDG",21],["Ruth","RUT",4],["1 Samuel","1SA",31],["2 Samuel","2SA",24],
    ["1 Kings","1KI",22],["2 Kings","2KI",25],["1 Chronicles","1CH",29],["2 Chronicles","2CH",36],
    ["Ezra","EZR",10],["Nehemiah","NEH",13],["Esther","EST",10],["Job","JOB",42],["Psalms","PSA",150],
    ["Proverbs","PRO",31],["Ecclesiastes","ECC",12],["Song of Solomon","SNG",8],["Isaiah","ISA",66],
    ["Jeremiah","JER",52],["Lamentations","LAM",5],["Ezekiel","EZK",48],["Daniel","DAN",12],["Hosea","HOS",14],
    ["Joel","JOL",3],["Amos","AMO",9],["Obadiah","OBA",1],["Jonah","JON",4],["Micah","MIC",7],
    ["Nahum","NAM",3],["Habakkuk","HAB",3],["Zephaniah","ZEP",3],["Haggai","HAG",2],["Zechariah","ZEC",14],
    ["Malachi","MAL",4],["Matthew","MAT",28],["Mark","MRK",16],["Luke","LUK",24],["John","JHN",21],
    ["Acts","ACT",28],["Romans","ROM",16],["1 Corinthians","1CO",16],["2 Corinthians","2CO",13],
    ["Galatians","GAL",6],["Ephesians","EPH",6],["Philippians","PHP",4],["Colossians","COL",4],
    ["1 Thessalonians","1TH",5],["2 Thessalonians","2TH",3],["1 Timothy","1TI",6],["2 Timothy","2TI",4],
    ["Titus","TIT",3],["Philemon","PHM",1],["Hebrews","HEB",13],["James","JAS",5],["1 Peter","1PE",5],
    ["2 Peter","2PE",3],["1 John","1JN",5],["2 John","2JN",1],["3 John","3JN",1],["Jude","JUD",1],["Revelation","REV",22]
  ];
  const [book,setBook] = useState("Psalms");
  const [chapter,setChapter] = useState("23");
  const [passage,setPassage] = useState([
    {verse:1,text:"The LORD is my shepherd; I shall not want."},
    {verse:2,text:"He maketh me to lie down in green pastures: he leadeth me beside the still waters."},
    {verse:3,text:"He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake."},
    {verse:4,text:"Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me."},
    {verse:5,text:"Thou preparest a table before me in the presence of mine enemies."},
    {verse:6,text:"Surely goodness and mercy shall follow me all the days of my life."}
  ]);
  const [loading,setLoading] = useState(false);
  const [query,setQuery] = useState(search || "");
  const [note,setNote] = useState("");
  const selected = books.find(b=>b[0]===book) || books[18];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://bible-api.com/data/kjv/${selected[1]}/${chapter}`);
        if (!response.ok) throw new Error("Bible API request failed");
        const data = await response.json();
        const next = Array.isArray(data.verses) ? data.verses.map(v=>({verse:v.verse,text:v.text.trim()})) : [];
        if (!cancelled && next.length) setPassage(next);
      } catch {
        if (!cancelled) notify("Bible connection unavailable","Showing your last available passage. Try again in a moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [book,chapter]);

  useEffect(()=>{ if(search) setQuery(search); },[search]);

  const filtered = passage.filter(v => !query || v.text.toLowerCase().includes(query.toLowerCase()));
  return <div className="page">
    <PageTitle eyebrow="SCRIPTURE" title="The Bible" text="Read and search Scripture by book and chapter. The reader uses the public-domain KJV as the first live translation." action={<button className="primary-btn" onClick={()=>notify("Audio Bible","Audio controls are ready to connect to an approved Scripture audio source.")}>▶ Listen</button>}/>
    <div className="bible-toolbar">
      <select value={book} onChange={e=>{setBook(e.target.value);setChapter("1")}}>{books.map(b=><option key={b[0]}>{b[0]}</option>)}</select>
      <select value={chapter} onChange={e=>setChapter(e.target.value)}>{Array.from({length:selected[2]},(_,i)=><option key={i+1}>{i+1}</option>)}</select>
      <div className="translation"><span>KJV</span><span className="muted">Live Scripture source</span></div>
    </div>
    <div className="bible-layout">
      <div className="scripture-panel">
        <div className="panel-kicker">{book} {chapter}</div>
        <h2>{book} {chapter}</h2>
        <div className="scripture-lines">
          {loading ? <p className="loading-line">Loading Scripture…</p> : filtered.map(v=><p key={v.verse} className={query?"search-hit":""}><sup>{v.verse}</sup> {v.text}</p>)}
          {!loading && filtered.length===0 && <div className="empty-state">No verses in this chapter match your search.</div>}
        </div>
        <div className="scripture-tools"><button onClick={()=>notify("Highlight ready","Highlighting is saved locally in this version.")}>🖍 Highlight</button><button onClick={()=>setNotes(prev=>[{id:Date.now(),ref:`${book} ${chapter}`,text:"New Bible note"},...prev])}>✎ Note</button><button onClick={()=>notify("Cross-references","Related passages can be opened from the study view.")}>↗ Cross-references</button><button onClick={()=>notify("Study mode","Opening deeper study resources.")}>▦ Study</button></div>
      </div>
      <div className="study-side">
        <div className="side-card"><div className="side-card-head"><strong>Search this chapter</strong><span>{filtered.length}</span></div><div className="compact-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search verses..." /></div>{query && <div className="muted" style={{marginTop:8}}>Showing matching verses.</div>}</div>
        <div className="side-card"><div className="side-card-head"><strong>Saved Scripture</strong><span>{savedVerses.length}</span></div>{savedVerses.length===0?<div className="empty-state">Save verses as you study them.</div>:savedVerses.slice(0,4).map(v=><div className="saved-row" key={v.ref}><strong>{v.ref}</strong><button onClick={()=>setSavedVerses(prev=>prev.filter(x=>x.ref!==v.ref))}>×</button><small>{v.text}</small></div>)}</div>
        <div className="side-card"><div className="side-card-head"><strong>Your notes</strong><span>{notes.length}</span></div>{notes.slice(0,3).map(n=><div className="saved-row" key={n.id}><strong>{n.ref}</strong><small>{n.text}</small></div>)}<input className="compact-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Write a quick note..." onKeyDown={e=>{if(e.key==="Enter"&&note.trim()){setNotes(prev=>[{id:Date.now(),ref:`${book} ${chapter}`,text:note.trim()},...prev]);setNote("")}}}/></div>
      </div>
    </div>
  </div>
}
function StudyView({setView}) {
  const topics = ["Faith","Anxiety","Forgiveness","Prayer","Purpose","Temptation","Relationships","Wisdom"];
  return <div className="page"><PageTitle eyebrow="DEEPER" title="Bible Study" text="Go beyond reading. Explore the context, connections, and meaning around Scripture."/>
    <div className="study-hero"><div><div className="eyebrow">GUIDED STUDY MODE</div><h2>Read → Understand → Reflect → Pray</h2><p>Pick a passage or a topic and let The Journey organize a focused study path for you.</p><button className="primary-btn" onClick={()=>setView("bible")}>Start with Scripture →</button></div><div className="study-orb">✦</div></div>
    <div className="section-heading"><div><span className="eyebrow">TOPICS</span><h2>What do you want to study?</h2></div></div>
    <div className="topic-grid">{topics.map(t=><button className="topic-chip" key={t} onClick={()=>setView("bible")}>{t}<span>→</span></button>)}</div>
    <div className="resource-grid">
      {["Cross-references","Bible dictionary","Concordance","Word studies","Historical context","Bible maps","Character profiles","Parables & miracles"].map((x,i)=><div className="resource-card" key={x}><span>{["↗","◫","⌕","λ","◷","⌖","◉","✦"][i]}</span><strong>{x}</strong><small>Explore this study resource.</small></div>)}
    </div>
  </div>
}

function PlansView({completed,setCompleted,notify}) {
  const plans = [
    ["Luke in 30 Days","A guided journey through the life and teachings of Jesus.","42%","14 / 30 days"],
    ["7 Days of Peace","Scripture and prayer for a calmer heart.","72%","5 / 7 days"],
    ["Build a Prayer Habit","A simple 14-day path to consistent prayer.","21%","3 / 14 days"]
  ];
  return <div className="page"><PageTitle eyebrow="READING" title="Bible Plans" text="Build a steady rhythm with plans that fit your season." action={<button className="ghost-btn" onClick={()=>notify("New plan","Plan builder is ready for custom reading paths.")}>＋ New plan</button>}/>
    <div className="plan-grid">{plans.map(([name,desc,pct,count],i)=><div className="plan-card" key={name}><div className="plan-icon">{["✦","♡","◷"][i]}</div><div className="eyebrow">PLAN {i+1}</div><h3>{name}</h3><p>{desc}</p><div className="plan-progress"><span style={{width:pct}}/></div><div className="plan-foot"><strong>{pct}</strong><small>{count}</small><button onClick={()=>{setCompleted(c=>({...c,reading:true}));notify("Reading progress saved","Keep going—you're building a habit.")}}>Continue →</button></div></div>)}</div>
    <div className="callout"><span className="callout-icon">☼</span><div><strong>Need a plan for what you're facing?</strong><p>Choose a topic and we'll suggest a focused sequence of Scripture, reflection, and prayer.</p></div><button className="text-btn">Build a path →</button></div>
  </div>
}

function PrayerView({prayers,setPrayers,setCompleted,notify}) {
  const [text,setText] = useState("");
  const addPrayer = () => { if(!text.trim()) return; setPrayers(prev=>[{id:Date.now(),text:text.trim(),date:new Date().toLocaleDateString()},...prev]); setText(""); setCompleted(c=>({...c,prayer:true})); notify("Prayer saved","Your prayer was added to your private journal."); };
  return <div className="page"><PageTitle eyebrow="QUIET TIME" title="Prayer" text="A private place to talk with God, remember what you're praying for, and celebrate answers."/>
    <div className="prayer-grid">
      <div className="prayer-composer"><div className="eyebrow">TODAY'S PRAYER</div><h2>What's on your heart?</h2><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write your prayer here. This space is private on this device."/><div className="composer-foot"><span>Private journal</span><button className="primary-btn" onClick={addPrayer}>Save prayer →</button></div></div>
      <div className="prayer-card"><div className="eyebrow">PRAYER OF THE DAY</div><h3>“Be still, and know that I am God.”</h3><p>Take a slow breath. Bring one concern to God, then leave a little room for gratitude.</p><button className="ghost-btn" onClick={()=>notify("Prayer reminder set","You'll see a reminder in your notification center.")}>🔔 Remind me later</button></div>
    </div>
    <div className="section-heading"><div><span className="eyebrow">YOUR JOURNAL</span><h2>Saved prayers</h2></div><span className="muted">{prayers.length} total</span></div>
    <div className="journal-list">{prayers.length===0?<div className="empty-card">Your prayer journal is ready whenever you are.</div>:prayers.map(p=><article className="journal-entry" key={p.id}><div className="journal-date">{p.date}</div><p>{p.text}</p><button onClick={()=>setPrayers(prev=>prev.filter(x=>x.id!==p.id))}>Delete</button></article>)}</div>
  </div>
}

function GamesView({setCompleted,notify}) {
  const [active,setActive] = useState(null);
  const [score,setScore] = useState(0);
  if (active) return <GamePlayer game={active} score={score} setScore={setScore} finish={()=>{setCompleted(c=>({...c,game:true}));setActive(null);notify("Challenge complete","Your Bible XP has been updated.");}}/>;
  return <div className="page"><PageTitle eyebrow="LEARN BY DOING" title="Bible Games" text="Test your understanding, learn new facts, and build Scripture memory through play."/>
    <div className="level-strip"><div><span className="eyebrow">YOUR LEVEL</span><strong>Growing</strong></div><div className="level-meter"><span style={{width:"62%"}}/></div><div className="xp">1,240 XP</div></div>
    <div className="game-grid">{games.map(g=><button className="game-card" key={g.title} onClick={()=>{setScore(0);setActive(g)}}><div className="game-icon">{g.icon}</div><div className="eyebrow">{g.level}</div><h3>{g.title}</h3><p>{g.meta}</p><span>Play →</span></button>)}</div>
  </div>
}

function GamePlayer({game,score,setScore,finish}) {
  const [q,setQ] = useState(0);
  const questions = [
    ["Who built the ark?","Noah",["Noah","Moses","David","Solomon"]],
    ["Which book contains the Beatitudes?","Matthew",["Genesis","Matthew","Romans","Acts"]],
    ["What is the first fruit of the Spirit listed in Galatians 5?","Love",["Love","Wisdom","Courage","Justice"]]
  ];
  const item = questions[q % questions.length];
  return <div className="page game-player"><button className="back-btn" onClick={finish}>← Exit challenge</button><div className="game-shell"><div className="game-top"><span className="eyebrow">{game.title}</span><strong>{q+1} / 5</strong></div><div className="game-progress"><span style={{width:((q)/4)*100+"%"}}/></div><h1>{item[0]}</h1><div className="answers">{item[2].map(a=><button key={a} onClick={()=>{if(a===item[1])setScore(score+100); if(q<4)setQ(q+1); else finish();}}>{a}<span>→</span></button>)}</div><div className="game-hint">Answer carefully. Each question helps reinforce what you're learning.</div></div></div>
}

function DevotionalsView({setView}) {
  const cards = [["Morning: Begin with God","A five-minute reset before the day starts.","☀"],["When You're Anxious","Slow down, pray, and remember what Scripture says about God's presence.","♡"],["Night: Release the Day","A quiet reflection for ending the day with gratitude.","☾"],["Finding Your Purpose","A guided reflection on gifts, obedience, and direction.","✦"],["Learning to Forgive","A practical Scripture path toward grace and release.","↗"],["Growing in Prayer","Simple rhythms for building a consistent prayer life.","🙏"]];
  return <div className="page"><PageTitle eyebrow="REFLECT" title="Devotionals" text="Short, focused moments built to help you slow down and apply Scripture."/>
    <div className="devotional-grid">{cards.map(([t,d,i])=><button className="devotional-card" key={t} onClick={()=>setView("bible")}><div className="dev-icon">{i}</div><div className="eyebrow">5 MIN</div><h3>{t}</h3><p>{d}</p><span>Read devotional →</span></button>)}</div>
  </div>
}

function CommunityView({notify}) {
  const posts = [
    ["Maya","I was struggling with worry this week, and Philippians 4:6 reminded me to actually bring it to God.","3h","12"],
    ["Ethan","Finished my first 30-day reading plan today. Keep going, everybody!","6h","24"],
    ["Grace","Prayer request: please pray for wisdom as I make an important decision.","1d","31"]
  ];
  return <div className="page"><PageTitle eyebrow="TOGETHER" title="Community" text="Encourage one another, share testimonies, and learn together—with thoughtful moderation." action={<button className="primary-btn" onClick={()=>notify("Create post","Your community composer is ready.")}>＋ Share something</button>}/>
    <div className="community-layout"><div className="feed">{posts.map(([name,text,time,likes])=><article className="post-card" key={name}><div className="post-head"><div className="avatar">{name[0]}</div><div><strong>{name}</strong><small>{time}</small></div><button>•••</button></div><p>{text}</p><div className="post-actions"><button>♡ {likes}</button><button>↩ Reply</button><button>↗ Share</button></div></article>)}</div><div className="community-side"><div className="side-card"><div className="eyebrow">YOUR GROUPS</div><h3>Small groups</h3><p>Join a reading group, study group, or prayer circle.</p><button className="ghost-btn" onClick={()=>notify("Groups","Group discovery is ready for your future community backend.")}>Explore groups</button></div><div className="side-card"><div className="eyebrow">SAFETY</div><h3>Keep it encouraging</h3><p>Community spaces include reporting, moderation, privacy controls, and clear guidelines.</p></div></div></div>
  </div>
}

function JourneyView({user,selectedStruggles,toggleStruggle,completed,savedVerses,prayers,notes}) {
  return <div className="page"><PageTitle eyebrow="YOUR STORY" title={user.name ? user.name + "'s Journey" : "My Journey"} text="Your private progress, saved Scripture, habits, and current season."/>
    <div className="journey-hero"><div><div className="eyebrow">CURRENT SEASON</div><h2>Growing with intention.</h2><p>Keep choosing what to practice. Your path changes as you do.</p></div><div className="journey-score"><strong>68%</strong><span>journey complete</span></div></div>
    <div className="journey-grid"><div className="journey-card"><div className="eyebrow">WHAT YOU'RE FACING</div><h3>Choose your current areas</h3><div className="chips">{struggles.map(s=><button key={s} className={selectedStruggles.includes(s)?"chip selected":"chip"} onClick={()=>toggleStruggle(s)}>{s}<span>{selectedStruggles.includes(s)?"✓":"+"}</span></button>)}</div></div><div className="journey-card"><div className="eyebrow">YOUR LIBRARY</div><div className="library-stats"><span><strong>{savedVerses.length}</strong><small>Saved verses</small></span><span><strong>{prayers.length}</strong><small>Prayers</small></span><span><strong>{notes.length}</strong><small>Notes</small></span></div></div></div>
    <div className="journey-card"><div className="section-heading compact"><div><span className="eyebrow">HABITS</span><h3>This week's growth</h3></div><span className="muted">{Object.values(completed).filter(Boolean).length}/4 completed today</span></div><div className="habit-list">{["Scripture","Prayer","Reading plan","Bible challenge","Reflection","Gratitude"].map((x,i)=><div className="habit-row" key={x}><span className={i<4 && Object.values(completed).filter(Boolean).length>i?"habit-dot active":"habit-dot"}></span><strong>{x}</strong><small>{["Daily","Daily","This week","Today","Weekly","Daily"][i]}</small><b>{i<4?"✓":"○"}</b></div>)}</div></div>
  </div>
}

function SettingsView({user,notifications,setNotifications,setUser,notify}) {
  const [name,setName] = useState(user.name || "");
  const [daily,setDaily] = useState(true);
  const [prayer,setPrayer] = useState(true);
  const [community,setCommunity] = useState(true);
  const save = ()=>{setUser({...user,name:name.trim()||user.name});notify("Profile updated","Your settings were saved.");};
  return <div className="page"><PageTitle eyebrow="PREFERENCES" title="Settings" text="Control your profile, notification preferences, and the way The Journey feels."/>
    <div className="settings-grid"><div className="settings-card"><div className="eyebrow">PROFILE</div><h3>Your account</h3><label>Display name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input value={user.email} disabled/></label><button className="primary-btn" onClick={save}>Save changes</button></div>
      <div className="settings-card"><div className="eyebrow">NOTIFICATIONS</div><h3>Choose what you receive</h3><Toggle label="Daily verse" sub="Your personalized verse is ready." value={daily} setValue={setDaily}/><Toggle label="Prayer reminders" sub="Gentle reminders for quiet time." value={prayer} setValue={setPrayer}/><Toggle label="Community activity" sub="Replies, group posts, and reactions." value={community} setValue={setCommunity}/><div className="settings-note">Browser push notifications can be connected when the site is deployed with HTTPS and a push service.</div></div>
      <div className="settings-card"><div className="eyebrow">PRIVACY</div><h3>Your data</h3><p>Early account data, saved verses, notes, and prayer journal entries are stored locally on this device.</p><button className="ghost-btn" onClick={()=>{setNotifications([]);notify("Notifications cleared","Your notification inbox is empty.")}}>Clear notifications</button></div>
    </div></div>
}

function Toggle({label,sub,value,setValue}) { return <button className="toggle-row" onClick={()=>setValue(v=>!v)}><span><strong>{label}</strong><small>{sub}</small></span><span className={"toggle "+(value?"on":"")}><i/></span></button> }
function PageTitle({eyebrow,title,text,action}) { return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div> }
