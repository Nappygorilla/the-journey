import React, { useMemo, useRef, useState } from "react";
import { books, crossRefs, dailyVerses, lexicon, parables, studyBooks, teachings } from "./data";

const MODEL_ID = "Qwen3-0.6B-q4f16_1-MLC";
const MODEL_CDN = "https://esm.run/@mlc-ai/web-llm@0.2.85";

const escapeRegExp = (value) => value
  .replaceAll("\\", "\\\\")
  .replaceAll(".", "\\.")
  .replaceAll("*", "\\*")
  .replaceAll("+", "\\+")
  .replaceAll("?", "\\?")
  .replaceAll("^", "\\^")
  .replaceAll("$", "\\$")
  .replaceAll("{", "\\{")
  .replaceAll("}", "\\}")
  .replaceAll("(", "\\(")
  .replaceAll(")", "\\)")
  .replaceAll("|", "\\|")
  .replaceAll("[", "\\[")
  .replaceAll("]", "\\]");

const standardBooks = books.filter((b) => b[3] !== "apocrypha");
const bookPattern = standardBooks
  .map((b) => b[0])
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join("|");
const referenceRegex = new RegExp("\\b(" + bookPattern + ")\\s+(\\d+)(?::(\\d+))?(?:\\s*[-–]\\s*(\\d+))?", "gi");

const SYSTEM_PROMPT = [
  "You are The Journey Bible Guide, a careful Christian Bible-study assistant running locally in the user's browser.",
  "Help people understand Scripture, biblical themes, people, books, historical context, and practical application.",
  "Be warm, respectful, age-appropriate, and clear. Do not present yourself as God, a pastor, or an authority that replaces Scripture or trusted church leadership.",
  "Distinguish what the biblical text says from interpretation. When Christian traditions differ, say so rather than pretending there is only one interpretation.",
  "Never invent a Bible quote, chapter, verse, historical fact, or citation. Prefer paraphrase unless exact Scripture text is supplied in the context.",
  "Use the supplied Scripture context first. When it is incomplete, say you are answering from general biblical knowledge and encourage the user to open the referenced passage.",
  "For difficult or personal questions, give gentle Scripture-grounded guidance without promising outcomes.",
  "Keep answers focused unless the user asks for depth."
].join(" ");

function findReferences(question) {
  const found = [];
  const seen = new Set();
  for (const match of question.matchAll(referenceRegex)) {
    const book = match[1];
    const chapter = match[2];
    const verse = match[3];
    const ref = verse ? book + " " + chapter + ":" + verse : book + " " + chapter;
    const key = ref.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      found.push({ book, chapter, verse, ref });
    }
  }
  return found.slice(0, 3);
}

async function fetchPassage(ref) {
  try {
    const response = await fetch("https://bible-api.com/" + encodeURIComponent(ref) + "?translation=kjv");
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.text) return null;
    return { reference: data.reference || ref, text: data.text.trim() };
  } catch {
    return null;
  }
}

function rankLocalContext(question) {
  const words = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 4);
  const candidates = [];
  const push = (title, body, ref = "") => {
    const hay = (title + " " + body + " " + ref).toLowerCase();
    const score = words.reduce((n, word) => n + (hay.includes(word) ? 1 : 0), 0);
    if (score > 0) candidates.push({ score, title, body, ref });
  };

  dailyVerses.forEach((v) => push(v.ref, v.text, v.ref));
  teachings.forEach((v) => push(v[0], v[1], v[2]));
  parables.forEach((v) => push(v[0], v[1], v[2]));
  studyBooks.forEach((v) => push(v[0], v[1]));
  Object.entries(lexicon).forEach(([key, v]) => push(key, v.meaning, v.refs.join(", ")));
  Object.entries(crossRefs).forEach(([ref, refs]) => push(ref, refs.join(", "), ref));

  return candidates.sort((a, b) => b.score - a.score).slice(0, 8);
}

function buildContext(question, passages, verse) {
  const local = rankLocalContext(question);
  const chunks = [];
  if (verse?.ref && verse?.text) chunks.push("CURRENT DAILY VERSE\n" + verse.ref + "\n" + verse.text);
  passages.forEach((p) => chunks.push("RETRIEVED SCRIPTURE\n" + p.reference + "\n" + p.text));
  local.forEach((item) => chunks.push("BIBLE STUDY REFERENCE\n" + item.title + (item.ref ? " — " + item.ref : "") + "\n" + item.body));
  return chunks.join("\n\n").slice(0, 15000);
}

function formatError(error) {
  const message = String(error?.message || error || "");
  if (/webgpu/i.test(message)) return "This device/browser does not have the WebGPU support needed for the local AI model.";
  if (/network|fetch|cdn|module/i.test(message)) return "The local AI package could not be loaded. Check your connection and try again.";
  return "The local Bible AI could not start on this device. " + message.slice(0, 180);
}

export default function BibleAIView({ verse, go }) {
  const engineRef = useRef(null);
  const nativeSessionRef = useRef(null);
  const moduleRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Peace be with you. I’m the local Bible Guide for The Journey. Ask me about a verse, a Bible person, a difficult passage, a biblical theme, or how passages connect."
    }
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("ready");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("No API key • runs locally in your browser");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");
  const busy = status === "loading" || status === "thinking";

  const starterPrompts = useMemo(() => [
    "Explain John 3:16 in simple language.",
    "What does the Bible teach about anxiety?",
    "Who was Peter, and what can I learn from his story?",
    "Why did Jesus use parables?"
  ], []);

  const createNativeSession = async () => {
    const LanguageModel = window.LanguageModel;
    if (!LanguageModel) return false;
    try {
      const availability = await LanguageModel.availability({
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }]
      });
      if (availability === "unavailable") return false;
      setStatus("loading");
      setStatusText(availability === "downloading" ? "Chrome is preparing its on-device AI…" : "Starting Chrome's on-device AI…");
      const session = await LanguageModel.create({
        initialPrompts: [{ role: "system", content: SYSTEM_PROMPT }],
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }]
      });
      nativeSessionRef.current = session;
      setProvider("Chrome on-device AI");
      setStatus("ready");
      setStatusText("AI ready • no API key • your prompt stays on-device");
      return true;
    } catch {
      nativeSessionRef.current = null;
      return false;
    }
  };

  const createWebLLMSession = async () => {
    setStatus("loading");
    setProgress(0);
    setError("");
    setStatusText("Loading the local Bible AI engine…");
    try {
      if (!moduleRef.current) moduleRef.current = await import(MODEL_CDN);
      const { CreateMLCEngine, prebuiltAppConfig } = moduleRef.current;
      const engine = await CreateMLCEngine(MODEL_ID, {
        appConfig: prebuiltAppConfig,
        initProgressCallback: (report) => {
          const pct = Math.max(0, Math.min(100, Math.round((report.progress || 0) * 100)));
          setProgress(pct);
          setStatusText(report.text || ("Downloading local model… " + pct + "%"));
        }
      });
      engineRef.current = engine;
      setProvider("WebLLM • Qwen3 0.6B");
      setStatus("ready");
      setStatusText("AI ready • local browser model • no API key");
    } catch (err) {
      engineRef.current = null;
      setStatus("error");
      setError(formatError(err));
      setStatusText("Local AI unavailable");
    }
  };

  const initialize = async () => {
    setError("");
    if (nativeSessionRef.current || engineRef.current) return;
    const nativeReady = await createNativeSession();
    if (!nativeReady) await createWebLLMSession();
  };

  const send = async (text = input) => {
    const question = text.trim();
    if (!question || busy) return;
    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }, { role: "assistant", content: "Thinking…" }]);
    setStatus("thinking");

    try {
      if (!nativeSessionRef.current && !engineRef.current) await initialize();

      const refs = findReferences(question);
      const fetched = (await Promise.all(refs.map((r) => fetchPassage(r.ref)))).filter(Boolean);
      const context = buildContext(question, fetched, verse);

      const prompt = [
        "Answer the user's Bible-study question.",
        "SCRIPTURE AND STUDY CONTEXT:",
        context || "No specific passage was retrieved. Use general biblical knowledge, but do not invent exact quotations.",
        "",
        "USER QUESTION:",
        question
      ].join("\n");

      let reply = "";
      if (nativeSessionRef.current) {
        reply = await nativeSessionRef.current.prompt(prompt);
      } else if (engineRef.current) {
        const response = await engineRef.current.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt }
          ],
          max_tokens: 420,
          stream: false,
          extra_body: { enable_thinking: false }
        });
        reply = response.choices?.[0]?.message?.content || "";
      }

      if (!reply.trim()) throw new Error("The AI returned an empty response.");
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: reply.trim() }]);
      setStatus("ready");
      setStatusText((nativeSessionRef.current ? "Chrome on-device AI" : "WebLLM local AI") + " • no API key");
    } catch (err) {
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: "I couldn't finish that response." }]);
      setStatus("error");
      setError(formatError(err));
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "New study session started. Ask me anything about Scripture." }]);
    nativeSessionRef.current?.destroy?.();
    nativeSessionRef.current = null;
    engineRef.current?.resetChat?.();
    setStatus("ready");
    setError("");
  };

  return <div className="page">
    <div className="ai-hero">
      <div>
        <div className="eyebrow">LOCAL BIBLE AI</div>
        <h1>Bible Guide</h1>
        <p>A private, keyless Bible-study companion. It uses on-device AI when available, then falls back to WebLLM with a small local model. Bible passages you reference are retrieved as context before the answer is generated.</p>
        <div className="ai-status-row">
          <span className={"ai-status " + (status === "error" ? "error" : status === "thinking" ? "busy" : "ready")}>{status === "thinking" ? "Thinking" : status === "loading" ? "Loading" : status === "error" ? "Needs attention" : "Ready"}</span>
          <span>{provider || statusText}</span>
        </div>
        {progress > 0 && progress < 100 && <div className="ai-progress"><span style={{ width: progress + "%" }}/></div>}
        {error && <div className="ai-error">{error}<button className="text-btn" onClick={initialize}>Try again</button></div>}
        {!nativeSessionRef.current && !engineRef.current && <button className="primary-btn" disabled={busy} onClick={initialize}>Start local Bible AI →</button>}
      </div>
      <div className="ai-hero-art"><div className="ai-orbit">✝</div><div className="ai-pulse">AI</div></div>
    </div>

    <div className="ai-layout">
      <section className="panel-card">
        <div className="eyebrow">ASK SCRIPTURE</div>
        <h3>Your Bible question</h3>
        <div className="ai-starters">{starterPrompts.map((prompt) => <button key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}</div>
        <textarea className="ai-input" rows="5" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") send(); }} placeholder="Ask about Scripture, a Bible person, history, context, themes, or how two passages connect…"/>
        <div className="ai-input-foot"><span>Ctrl/Cmd + Enter to ask</span><div><button className="ghost-btn" onClick={clearChat}>New session</button><button className="primary-btn" disabled={busy || !input.trim()} onClick={() => send()}>Ask Bible Guide →</button></div></div>
      </section>

      <section className="panel-card ai-chat">
        <div className="ai-chat-head"><div><div className="eyebrow">CONVERSATION</div><h3>Scripture-grounded answers</h3></div><span className="muted">{messages.length - 1} messages</span></div>
        <div className="ai-messages">{messages.map((message, index) => <div className={"ai-message " + message.role} key={index}><div className="ai-avatar">{message.role === "assistant" ? "✦" : "You"}</div><div><strong>{message.role === "assistant" ? "Bible Guide" : "You"}</strong><p>{message.content}</p></div></div>)}</div>
      </section>
    </div>

    <div className="ai-note"><strong>How it works:</strong> the first run may download a browser model. WebLLM runs the language model in the browser using WebGPU, while supported Chrome devices can use Chrome's own on-device Prompt API. No OpenAI, Gemini, Claude, or other paid API key is used. Model: Qwen3 0.6B via WebLLM.</div>
    <div className="ai-actions"><button className="ghost-btn" onClick={() => go("bible")}>Open Bible reader</button><button className="ghost-btn" onClick={() => go("study")}>Open study tools</button></div>
  </div>;
}
