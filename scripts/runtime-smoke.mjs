import { chromium } from "playwright";
import { spawn } from "node:child_process";

const port=4173;
const server=spawn("npm",["run","preview","--","--host","127.0.0.1","--port",String(port)],{stdio:["ignore","pipe","pipe"]});
let output="";
server.stdout.on("data",d=>{output+=d.toString();});
server.stderr.on("data",d=>{output+=d.toString();});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
  let ready=false;
  for(let i=0;i<50;i++){
    try{
      const response=await fetch("http://127.0.0.1:"+port);
      if(response.ok){ready=true;break;}
    }catch{}
    await sleep(200);
  }
  if(!ready) throw new Error("Vite preview did not start.\n"+output);

  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",msg=>{if(msg.type()==="error")errors.push(msg.text());});
  await page.goto("http://127.0.0.1:"+port+"/", {waitUntil:"domcontentloaded"});
  await page.waitForTimeout(1200);
  const bodyText=await page.locator("body").innerText();
  const rootHtml=await page.locator("#root").innerHTML();
  if(!rootHtml.trim()) throw new Error("React root is empty.");
  if(!bodyText.trim()) throw new Error("Rendered page has no visible text.");
  if(errors.length) throw new Error("Browser errors:\\n"+errors.join("\\n"));
  console.log("Runtime smoke test passed.");
  console.log("Visible text characters:",bodyText.trim().length);
  await browser.close();
}finally{
  server.kill("SIGTERM");
}