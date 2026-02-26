import React, { useState, useRef } from "react";
import * as mammoth from "mammoth";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", note: "Fast & free-tier friendly" },
  { id: "claude-sonnet-4-6",         label: "Claude Sonnet 4.6", note: "Recommended — balanced" },
  { id: "claude-opus-4-6",           label: "Claude Opus 4.6",   note: "Most capable" },
];

const PIPELINE_STAGES = [
  { id: "lesson_plan",    label: "Lesson Plan",       icon: "📋" },
  { id: "scheme_of_work", label: "Scheme of Work",    icon: "🗓️" },
  { id: "ppt_notes",      label: "PowerPoint Notes",  icon: "📊" },
  { id: "youtube_videos", label: "YouTube Resources", icon: "▶️" },
];

const KE_LEVELS = [
  "PP1 (Pre-Primary 1)", "PP2 (Pre-Primary 2)",
  "Grade 1 – Grade 3 (Lower Primary CBC)",
  "Grade 4 – Grade 6 (Upper Primary CBC)",
  "Grade 7 – Grade 9 (Junior Secondary CBC)",
  "Form 1 – Form 2 (Senior School / KCSE)",
  "Form 3 – Form 4 (KCSE Candidate Class)",
  "TVET / Polytechnic", "University / College",
  "Adult & Continuing Education", "Mixed Ability Group",
];

const CBC_STRANDS = [
  "Mathematics","English","Kiswahili","Science & Technology","Social Studies",
  "Creative Arts","Physical & Health Education","Religious Education",
  "Agriculture","Home Science","Other",
];

const KE_COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Nyeri","Meru","Machakos",
  "Kakamega","Kisii","Garissa","Wajir","Mandera","Embu","Kitui","Makueni",
  "Nyandarua","Laikipia","Trans Nzoia","Nandi","Baringo","Kericho","Bomet",
  "Kajiado","Narok","Migori","Homa Bay","Siaya","Bungoma","Busia","Vihiga",
  "Tana River","Lamu","Taita Taveta","Kwale","Kilifi","Kirinyaga","Murang'a",
  "Kiambu","West Pokot","Turkana","Isiolo","Samburu","Elgeyo Marakwet",
  "Marsabit","Mandera","Wajir",
];

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildPrompt(stageId, { topic, level, duration, weeks, templateText, subject, schoolName, schoolCounty }) {
  const ctx = `Topic: ${topic || "the provided notes/content"}
Student Level: ${level}
CBC Strand/Subject: ${subject}${schoolName ? `\nSchool: ${schoolName}${schoolCounty ? ", " + schoolCounty + " County" : ""}` : ""}`;

  const tmplNote = templateText
    ? `\n\nIMPORTANT — SCHOOL CUSTOM TEMPLATE: Follow the exact structure, headings, columns, and layout from the template below. Populate EVERY field, row, and column as defined by the template. Do not change the structure.\n\n--- SCHOOL TEMPLATE START ---\n${templateText}\n--- SCHOOL TEMPLATE END ---\n`
    : "";

  if (stageId === "lesson_plan") return `You are an expert Kenyan curriculum designer aligned with the CBC (Competency Based Curriculum) and KICD standards.
${ctx}
Lesson Duration: ${duration} minutes
${tmplNote}
${!templateText ? `Create a detailed CBC-aligned Lesson Plan including:
1. **Lesson Details** — School name, Subject, Strand, Sub-Strand, Topic, Class/Grade, Date, Time, Duration, Roll
2. **Core Competencies Addressed** (e.g. Communication, Critical Thinking, Creativity, Citizenship)
3. **Pertinent & Contemporary Issues (PCIs)** addressed in this lesson
4. **Values** (e.g. Responsibility, Respect, Unity)
5. **Learning Outcomes** — By the end of the lesson learners should be able to: (3–5 SMART outcomes starting with action verbs)
6. **Key Inquiry Question**
7. **Learning Resources / Materials** (list everything needed)
8. **Introduction / Lesson Beginning** (5–10 mins — engage prior knowledge, hook activity)
9. **Lesson Development** — Present as a table with columns: Time | Teacher Activity | Learner Activity | Learning Experiences
10. **Conclusion / Lesson Ending** (5 mins — summary, check for understanding, cleanup, assignment)
11. **Extended Activities** — For slow learners (support) and fast learners (extension)
12. **Formative Assessment** (how competencies are assessed during the lesson)
13. **Teacher's Self-Reflection** (fill-in-after section: What went well? What to improve?)

Format professionally. Use tables where appropriate. Use Kenyan educational language and context.` : "Fill the school-provided template above with appropriate CBC-aligned content for every single field."}`;

  if (stageId === "scheme_of_work") return `You are a senior KICD-aligned curriculum planner for Kenyan schools.
${ctx}
Duration: ${weeks} weeks
${tmplNote}
${!templateText ? `Create a complete Scheme of Work. Present the main content as a detailed table with these columns:

| Wk | Lsn | Strand/Sub-Strand | Topic/Sub-Topic | Specific Learning Outcomes | Key Inquiry Question | Learning Experiences | Learning Resources | Assessment | Remarks |

Fill ALL rows for all ${weeks} weeks (assume approximately 4–5 lessons per week, or as appropriate for the subject).

After the table include:
1. **Rationale** — CBC alignment and importance of the topic
2. **Prior Knowledge** required
3. **Pertinent & Contemporary Issues (PCIs)** threaded across the unit
4. **Core Competencies** developed
5. **End of Unit Assessment** plan (including project/portfolio tasks)
6. **Key Vocabulary** glossary
7. **Reference Materials** — KICD-approved textbooks, digital resources, Elimu TV channels

Format as a professional Kenyan SoW document.` : "Populate every column and row in the school-provided Scheme of Work template above with CBC-aligned content."}`;

  if (stageId === "ppt_notes") return `You are an expert instructional designer creating PowerPoint classroom materials for a Kenyan teacher.
${ctx}
${tmplNote}
IMPORTANT — CONTENT FIDELITY: If teacher notes or uploaded content have been provided, extract the EXACT key points, facts, definitions, formulas, examples, and data from that content. Every slide's bullet points must reflect the precise information in the submitted material — do not generalise or substitute with generic knowledge. Only fall back to general CBC knowledge if no content was provided.

Design 15–20 PowerPoint slides. For EACH slide provide:
- **Slide #** and **Title**
- **Type**: (Title / Concept / Activity / Assessment / Summary)
- **Key Points** — 3–5 precise, concise bullet points extracted directly from the submitted content (use exact terms, figures, and definitions from the material)
- **Teacher Speaker Notes** — 2–3 paragraphs explaining what to say, demonstrate, or do, referencing the specific content provided
- **Visual Suggestion** — specific diagram, photo, chart, or Kenyan map/image to include
- **Learner Activity** — question, discussion prompt, pair task, or quick poll tied to the actual content

Use Kenyan context throughout: local examples, KES currency, Kenyan geography, CBC learning outcomes, and culturally relevant scenarios. Reference KICD materials where applicable.`;

  if (stageId === "youtube_videos") return `You are an educational resource curator for Kenyan CBC teachers with access to web search.
${ctx}

IMPORTANT — REAL YOUTUBE LINKS: Use the web_search tool to find REAL, working YouTube video URLs for this exact topic. Search for: "${topic || "the topic"} Kenya CBC ${level}" and related queries. Only include videos you have actually found via search — include the real YouTube URL (https://www.youtube.com/watch?v=...) for every video listed.

Provide:
1. **🎬 Real YouTube Videos** (find 8–10 via web search):
   For each video include:
   - **Title** (exact title from YouTube)
   - **Link**: https://www.youtube.com/watch?v=... (real URL from search)
   - **Channel** name
   - **Why it's useful** — how it maps to this topic and CBC level
   - **When to use** — lesson hook / mid-lesson explainer / flipped homework / revision

2. **📺 Recommended Kenyan Channels** (search and verify these exist):
   - Elimu TV Kenya, KBC Education, KICD Official, Msomi Bora — include their real channel URLs
   - Include any other relevant Kenyan channels found via search
   - Language, grade suitability, production quality

3. **🔍 Top Search Queries** — 5 exact search strings the teacher can type into YouTube:
   - Kenya/CBC-specific variants
   - Note why each query is useful

4. **📡 CBC-Aligned Video Integration Strategies**:
   - Lesson hook (first 5 mins), flipped learning, mid-lesson explainer, learner analysis activity

5. **💾 Offline Strategies** — for schools with poor/no internet:
   - yt-dlp, 4K Video Downloader, USB/school server, KICD Kenya Education Cloud

Format as a ready-to-use practical guide with all real links clearly presented.`;
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function callAPI(modelId, messages, system, apiKey, tools) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  const body = { model: modelId, max_tokens: 4096, system, messages };
  if (tools) body.tools = tools;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();

  // If the model used tool_use (web search), handle multi-turn to get final text
  if (data.stop_reason === "tool_use") {
    const assistantMsg = { role: "assistant", content: data.content };
    const toolResults = data.content
      .filter(b => b.type === "tool_use")
      .map(b => ({ type: "tool_result", tool_use_id: b.id, content: JSON.stringify(b.input) }));
    const followUp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers,
      body: JSON.stringify({
        model: modelId, max_tokens: 4096, system,
        messages: [...messages, assistantMsg, { role: "user", content: toolResults }],
        tools,
      }),
    });
    const followData = await followUp.json();
    return followData.content.map(b => b.text || "").join("");
  }

  return data.content.map(b => b.text || "").join("");
}

// ─── Markdown ─────────────────────────────────────────────────────────────────

function md(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="h3">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="h2">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="h1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="yt-link">$1 ↗</a>')
    .replace(/(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[^\s<"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="yt-link">▶ $1</a>')
    .replace(/(https?:\/\/youtu\.be\/[^\s<"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="yt-link">▶ $1</a>')
    .replace(/^\|(.+)\|$/gm, row => "<tr>" + row.split("|").filter(Boolean).map(c => `<td>${c.trim()}</td>`).join("") + "</tr>")
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, t => `<table>${t}</table>`)
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[htulop])(.+)$/gm, "<p>$1</p>");
}

// ─── File extractor ───────────────────────────────────────────────────────────

async function extractFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "docx") {
    const buf = await file.arrayBuffer();
    const r = await mammoth.extractRawText({ arrayBuffer: buf });
    return { kind: "text", content: r.value };
  }
  if (["txt","md"].includes(ext)) return { kind: "text", content: await file.text() };
  if (["png","jpg","jpeg","webp","gif"].includes(ext)) {
    return new Promise(res => {
      const fr = new FileReader();
      fr.onload = e => res({ kind: "image", content: e.target.result.split(",")[1], mime: `image/${ext==="jpg"?"jpeg":ext}` });
      fr.readAsDataURL(file);
    });
  }
  if (ext === "pdf") {
    return new Promise(res => {
      const fr = new FileReader();
      fr.onload = e => res({ kind: "pdf", content: e.target.result.split(",")[1], mime: "application/pdf" });
      fr.readAsDataURL(file);
    });
  }
  throw new Error(`Unsupported: .${ext}`);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0d1117;--sf:#161b22;--sf2:#1e2530;--sf3:#252d3a;
  --bd:#30363d;--bd2:#21262d;
  --tx:#e6edf3;--mt:#8b949e;--dm:#484f58;
  --gd:#f0a500;--gd2:rgba(240,165,0,.12);
  --gn:#3fb950;--pu:#8b5cf6;--rd:#f85149;--bl:#58a6ff;--te:#39d0d8;
  --nw:216px;
  --fd:'Playfair Display',Georgia,serif;
  --fb:'DM Sans',sans-serif;
  --fm:'DM Mono',monospace;
}
body{background:var(--bg);color:var(--tx);font-family:var(--fb);overflow:hidden}

/* Shell */
.shell{display:flex;height:100vh;overflow:hidden}

/* Nav */
.nav{
  width:var(--nw);flex-shrink:0;background:var(--sf);border-right:1px solid var(--bd2);
  display:flex;flex-direction:column;height:100vh;overflow:hidden;
  transition:width .28s cubic-bezier(.4,0,.2,1);
  scrollbar-width:thin;scrollbar-color:var(--bd2) transparent;
}
.nav.closed{width:52px}
.nav-logo{
  padding:12px 12px 10px;border-bottom:1px solid var(--bd2);
  display:flex;align-items:center;gap:10px;min-height:54px;flex-shrink:0;
}
.nav-logo-mark{
  width:32px;height:32px;border-radius:8px;flex-shrink:0;
  background:linear-gradient(135deg,var(--gd),#d97706);
  display:flex;align-items:center;justify-content:center;font-size:16px;
  cursor:pointer;transition:transform .15s;
}
.nav-logo-mark:hover{transform:scale(1.08)}
.nav-logo-text{flex:1;overflow:hidden;transition:opacity .2s}
.nav.closed .nav-logo-text{opacity:0;pointer-events:none}
.nav-logo-name{font-family:var(--fd);font-size:14px;font-weight:700;line-height:1.15;white-space:nowrap}
.nav-logo-sub{font-size:9.5px;color:var(--mt);letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
.nav-toggle{
  margin-left:auto;width:24px;height:24px;border-radius:6px;border:1px solid var(--bd2);
  background:transparent;color:var(--mt);cursor:pointer;display:flex;align-items:center;
  justify-content:center;font-size:12px;transition:all .15s;flex-shrink:0;
}
.nav-toggle:hover{background:var(--sf2);color:var(--tx);border-color:var(--bd)}
.nav.closed .nav-toggle{margin-left:0}
.nav-scroll{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:var(--bd2) transparent}
.nav-group-label{
  padding:14px 14px 5px;font-size:9.5px;font-weight:600;color:var(--dm);
  letter-spacing:.8px;text-transform:uppercase;white-space:nowrap;
  transition:opacity .2s;
}
.nav.closed .nav-group-label{opacity:0}
.nav-link{
  display:flex;align-items:center;gap:9px;padding:8px 12px;margin:1px 7px;
  border-radius:7px;border:1px solid transparent;background:transparent;color:var(--mt);
  font-family:var(--fb);font-size:12.5px;font-weight:500;cursor:pointer;
  text-align:left;transition:all .14s;width:calc(100% - 14px);white-space:nowrap;
  position:relative;
}
.nav-link:hover{background:var(--sf2);color:var(--tx)}
.nav-link.on{background:var(--gd2);color:var(--gd);border-color:rgba(240,165,0,.22)}
.nav-link-ic{font-size:14px;width:18px;text-align:center;flex-shrink:0}
.nav-link-label{overflow:hidden;transition:opacity .2s,max-width .28s;max-width:160px}
.nav.closed .nav-link-label{opacity:0;max-width:0}
/* Tooltip on collapsed */
.nav.closed .nav-link:hover::after{
  content:attr(data-tip);position:absolute;left:48px;top:50%;transform:translateY(-50%);
  background:#1e2530;border:1px solid var(--bd);color:var(--tx);
  font-size:11px;padding:4px 9px;border-radius:6px;white-space:nowrap;z-index:200;
  box-shadow:0 4px 12px rgba(0,0,0,.4);pointer-events:none;
}
.nav-badge{
  margin-left:auto;background:var(--gd);color:#000;font-size:9px;font-weight:700;
  padding:1px 5px;border-radius:9px;flex-shrink:0;
  transition:opacity .2s;
}
.nav.closed .nav-badge{opacity:0}
.nav-spin{margin-left:auto;font-size:11px;animation:sp 1s linear infinite;flex-shrink:0;transition:opacity .2s}
.nav.closed .nav-spin{opacity:0}
.nav-foot{flex-shrink:0;padding:10px;border-top:1px solid var(--bd2);overflow:hidden}
.nav-school{
  background:var(--sf2);border:1px solid var(--bd2);border-radius:7px;
  padding:8px 9px;font-size:11px;color:var(--mt);display:flex;align-items:center;gap:6px;
  white-space:nowrap;overflow:hidden;transition:opacity .2s;
}
.nav.closed .nav-school{opacity:0;pointer-events:none}

/* Page */
.page{flex:1;overflow:hidden;display:flex;flex-direction:column}
.phead{
  padding:0 22px;height:50px;flex-shrink:0;border-bottom:1px solid var(--bd2);
  display:flex;align-items:center;gap:10px;
  background:rgba(22,27,34,.95);backdrop-filter:blur(10px);
}
.phead-title{font-family:var(--fd);font-size:17px;font-weight:600}
.phead-sub{font-size:11px;color:var(--mt)}
.phead-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.dot{width:6px;height:6px;border-radius:50%;background:var(--gn);box-shadow:0 0 5px var(--gn)}

/* Layout */
.pbody{flex:1;overflow:hidden;display:flex}
.sidebar{width:306px;flex-shrink:0;border-right:1px solid var(--bd2);padding:14px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--bd2) transparent}
.output{flex:1;overflow-y:auto;padding:18px 22px;scrollbar-width:thin;scrollbar-color:var(--bd2) transparent;background:radial-gradient(ellipse at 80% 10%,rgba(240,165,0,.04) 0%,transparent 55%),radial-gradient(ellipse at 10% 90%,rgba(139,92,246,.04) 0%,transparent 55%)}
.settbody{flex:1;overflow-y:auto;padding:22px 26px;display:flex;flex-direction:column;gap:20px;scrollbar-width:thin;scrollbar-color:var(--bd2) transparent}
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.sgrid-full{grid-column:1/-1}

/* Card */
.card{background:var(--sf);border:1px solid var(--bd2);border-radius:11px;overflow:hidden}
.chead{padding:10px 14px;border-bottom:1px solid var(--bd2);display:flex;align-items:center;gap:7px}
.cic{width:24px;height:24px;border-radius:5px;flex-shrink:0;background:var(--gd2);display:flex;align-items:center;justify-content:center;font-size:12px}
.ctitle{font-size:10.5px;font-weight:600;color:var(--mt);text-transform:uppercase;letter-spacing:.7px}
.cbadge{margin-left:auto;background:rgba(63,185,80,.1);border:1px solid rgba(63,185,80,.25);color:var(--gn);font-size:9.5px;font-weight:600;padding:2px 7px;border-radius:9px}
.cbody{padding:13px 14px;display:flex;flex-direction:column;gap:10px}

/* Forms */
label{font-size:11px;font-weight:500;color:var(--mt);display:block;margin-bottom:4px;letter-spacing:.3px}
input,select,textarea{width:100%;background:var(--sf2);border:1px solid var(--bd);border-radius:7px;color:var(--tx);font-family:var(--fb);font-size:12.5px;padding:7px 10px;outline:none;transition:border-color .14s}
input:focus,select:focus,textarea:focus{border-color:var(--gd);box-shadow:0 0 0 3px rgba(240,165,0,.08)}
select option{background:var(--sf2)}
textarea{resize:vertical;min-height:75px;line-height:1.6}
.hint{font-size:10.5px;color:var(--dm);margin-top:3px;line-height:1.5}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:9px}

/* Toggle pill */
.tpill{display:flex;gap:4px;background:var(--sf2);padding:3px;border-radius:7px}
.tpbtn{flex:1;padding:5px 4px;border-radius:5px;border:none;background:transparent;color:var(--mt);font-size:11px;font-weight:500;cursor:pointer;transition:all .14s;font-family:var(--fb)}
.tpbtn.on{background:var(--sf);color:var(--tx);box-shadow:0 1px 3px rgba(0,0,0,.4)}

/* Stage toggles */
.sgrid2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.sbtn{padding:9px 8px;border-radius:7px;border:1px solid var(--bd);background:transparent;cursor:pointer;text-align:left;transition:all .14s;font-family:var(--fb)}
.sbtn.on{background:var(--gd2);border-color:rgba(240,165,0,.3)}
.sbtn-ic{font-size:16px;display:block;margin-bottom:2px}
.sbtn-lb{font-size:10.5px;font-weight:500;color:var(--mt)}
.sbtn.on .sbtn-lb{color:var(--tx)}

/* Input tabs */
.itabs{display:flex;gap:3px;background:var(--sf2);padding:3px;border-radius:7px}
.itab{flex:1;padding:5px 4px;border-radius:5px;border:none;background:transparent;color:var(--mt);font-size:10.5px;font-weight:500;cursor:pointer;transition:all .14s;font-family:var(--fb);text-align:center}
.itab.on{background:var(--sf);color:var(--tx);box-shadow:0 1px 3px rgba(0,0,0,.4)}

/* Upload */
.uzone{border:2px dashed var(--bd);border-radius:8px;padding:18px 10px;text-align:center;cursor:pointer;transition:all .18s;background:var(--sf2)}
.uzone:hover{border-color:var(--gd);background:rgba(240,165,0,.04)}
.uzone-ic{font-size:24px;margin-bottom:6px}
.uzone-tx{font-size:11.5px;color:var(--mt);line-height:1.5}
.uzone-ty{font-size:10px;color:var(--dm);margin-top:3px;font-family:var(--fm)}
.upill{background:rgba(63,185,80,.07);border:1px solid rgba(63,185,80,.2);border-radius:7px;padding:7px 9px;font-size:11.5px;color:var(--gn);display:flex;align-items:center;gap:7px}
.upill-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Buttons */
.run-btn{width:100%;padding:11px;border-radius:8px;border:none;background:linear-gradient(135deg,var(--gd),#d97706);color:#000;font-family:var(--fb);font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:6px}
.run-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 7px 22px rgba(240,165,0,.25)}
.run-btn:disabled{opacity:.5;cursor:not-allowed}
.abtn{padding:5px 11px;border-radius:6px;border:1px solid var(--bd);background:var(--sf2);color:var(--mt);font-size:11px;font-weight:500;cursor:pointer;transition:all .14s;font-family:var(--fb);display:flex;align-items:center;gap:4px}
.abtn:hover{border-color:var(--gd);color:var(--gd);background:rgba(240,165,0,.06)}
.abtn.danger:hover{border-color:var(--rd);color:var(--rd);background:rgba(248,81,73,.06)}
.save-btn{padding:8px 20px;border-radius:7px;border:none;background:linear-gradient(135deg,var(--gd),#d97706);color:#000;font-family:var(--fb);font-size:12.5px;font-weight:700;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:5px}
.save-btn:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(240,165,0,.25)}

/* Model cards */
.mcard{background:var(--sf2);border:1px solid var(--bd);border-radius:8px;padding:10px 12px;cursor:pointer;transition:all .14s;display:flex;align-items:center;gap:9px}
.mcard.on{border-color:var(--gd);background:var(--gd2)}
.radio{width:15px;height:15px;border-radius:50%;border:2px solid var(--bd);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .14s}
.mcard.on .radio{border-color:var(--gd)}
.rdot{width:7px;height:7px;border-radius:50%;background:var(--gd);transform:scale(0);transition:transform .14s}
.mcard.on .rdot{transform:scale(1)}
.minfo{flex:1}
.mlb{font-size:12.5px;font-weight:500;color:var(--tx)}
.mnt{font-size:10.5px;color:var(--mt);margin-top:1px}

/* Pipeline */
.pbadges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.pbadge{display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:10.5px;font-weight:500;border:1px solid var(--bd2);background:var(--sf);color:var(--mt);transition:all .18s}
.pbadge.running{border-color:var(--gd);color:var(--gd);background:rgba(240,165,0,.07)}
.pbadge.done{border-color:var(--gn);color:var(--gn);background:rgba(63,185,80,.07)}
.pbadge.error{border-color:var(--rd);color:var(--rd);background:rgba(248,81,73,.07)}
.progwrap{height:3px;background:var(--bd2);border-radius:2px;overflow:hidden;margin-bottom:14px}
.progfill{height:100%;background:linear-gradient(90deg,var(--gd),#d97706);transition:width .4s ease}

/* Result tabs */
.rtabs{display:flex;gap:3px;border-bottom:1px solid var(--bd);margin-bottom:16px;overflow-x:auto;scrollbar-width:none}
.rtab{padding:8px 14px;border:none;background:transparent;color:var(--mt);font-family:var(--fb);font-size:12px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;transition:all .14s;display:flex;align-items:center;gap:5px;margin-bottom:-1px}
.rtab:hover{color:var(--tx)}
.rtab.on{color:var(--gd);border-bottom-color:var(--gd)}
.rcard{background:var(--sf);border:1px solid var(--bd2);border-radius:12px;overflow:hidden}
.rchead{padding:13px 17px;border-bottom:1px solid var(--bd2);display:flex;align-items:center;justify-content:space-between}
.rctitle{font-family:var(--fd);font-size:17px;font-weight:600;display:flex;align-items:center;gap:8px}
.rcacts{display:flex;gap:6px}
.rcbody{padding:16px 20px;font-size:13px;line-height:1.85;color:var(--tx)}
.rcbody .h1{font-family:var(--fd);font-size:19px;font-weight:700;color:var(--gd);margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--bd2)}
.rcbody .h2{font-family:var(--fd);font-size:15px;font-weight:600;color:var(--tx);margin:14px 0 6px}
.rcbody .h3{font-size:13.5px;font-weight:600;color:var(--bl);margin:11px 0 5px}
.rcbody ul{padding-left:17px;margin:6px 0}
.rcbody li{margin:4px 0;line-height:1.7}
.rcbody strong{color:var(--tx)}
.rcbody em{color:var(--mt)}
.rcbody p{margin:6px 0}
.rcbody table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11.5px}
.rcbody td{border:1px solid var(--bd2);padding:5px 8px;vertical-align:top}
.rcbody tr:first-child td{background:var(--sf2);font-weight:600;color:var(--mt)}
.rcbody code{font-family:var(--fm);font-size:11px;background:var(--sf2);padding:2px 5px;border-radius:4px;color:var(--te)}
.rcbody .yt-link{color:var(--rd);text-decoration:none;font-weight:500;border-bottom:1px solid rgba(248,81,73,.3);transition:all .14s;word-break:break-all}
.rcbody .yt-link:hover{color:#ff6b6b;border-bottom-color:var(--rd)}

/* Skeleton */
.skelwrap{padding:18px 20px}
.skel{height:12px;background:linear-gradient(90deg,var(--sf2) 25%,var(--bd) 50%,var(--sf2) 75%);background-size:200% 100%;animation:shim 1.5s infinite;border-radius:4px;margin-bottom:8px}
@keyframes shim{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes sp{to{transform:rotate(360deg)}}

/* Landing page */
.landing{
  padding:0;overflow-y:auto;height:100%;
  scrollbar-width:thin;scrollbar-color:var(--bd2) transparent;
}
.landing-hero{
  padding:52px 48px 40px;
  background:
    radial-gradient(ellipse at 70% 0%,rgba(240,165,0,.09) 0%,transparent 60%),
    radial-gradient(ellipse at 20% 80%,rgba(139,92,246,.07) 0%,transparent 55%);
  border-bottom:1px solid var(--bd2);
  position:relative;overflow:hidden;
}
.landing-hero::before{
  content:'';position:absolute;inset:0;
  background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0a500' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events:none;
}
.landing-eyebrow{
  display:inline-flex;align-items:center;gap:6px;
  background:rgba(240,165,0,.1);border:1px solid rgba(240,165,0,.25);
  color:var(--gd);font-size:11px;font-weight:600;padding:4px 12px;
  border-radius:20px;letter-spacing:.5px;text-transform:uppercase;margin-bottom:20px;
}
.landing-headline{
  font-family:var(--fd);font-size:38px;font-weight:700;line-height:1.15;
  color:var(--tx);margin-bottom:14px;max-width:520px;
}
.landing-headline span{color:var(--gd)}
.landing-tagline{font-size:14px;color:var(--mt);max-width:460px;line-height:1.7;margin-bottom:28px}
.landing-cta-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.cta-primary{
  padding:11px 24px;border-radius:8px;border:none;
  background:linear-gradient(135deg,var(--gd),#d97706);
  color:#000;font-family:var(--fb);font-size:13px;font-weight:700;
  cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:7px;
}
.cta-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(240,165,0,.3)}
.cta-secondary{
  padding:10px 20px;border-radius:8px;border:1px solid var(--bd);
  background:transparent;color:var(--mt);font-family:var(--fb);font-size:13px;font-weight:500;
  cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;
}
.cta-secondary:hover{border-color:var(--gd);color:var(--gd);background:var(--gd2)}
.landing-hero-badge{
  position:absolute;top:24px;right:28px;
  background:rgba(63,185,80,.1);border:1px solid rgba(63,185,80,.25);
  color:var(--gn);font-size:10.5px;font-weight:600;padding:4px 11px;
  border-radius:20px;display:flex;align-items:center;gap:5px;
}
.landing-features{padding:32px 36px;display:grid;grid-template-columns:repeat(2,1fr);gap:14px;border-bottom:1px solid var(--bd2)}
.feat-card{
  background:var(--sf);border:1px solid var(--bd2);border-radius:11px;
  padding:18px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;
}
.feat-card:hover{border-color:rgba(240,165,0,.35);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.25)}
.feat-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,var(--card-c1),var(--card-c2));
  transform:scaleX(0);transform-origin:left;transition:transform .25s;
}
.feat-card:hover::before{transform:scaleX(1)}
.feat-icon{font-size:26px;margin-bottom:10px}
.feat-title{font-size:13px;font-weight:700;color:var(--tx);margin-bottom:5px}
.feat-desc{font-size:11.5px;color:var(--mt);line-height:1.6}
.feat-tag{
  display:inline-block;margin-top:9px;font-size:10px;font-weight:600;
  padding:2px 8px;border-radius:9px;
}
.landing-steps{padding:28px 36px;border-bottom:1px solid var(--bd2)}
.landing-section-label{font-size:10.5px;font-weight:600;color:var(--dm);text-transform:uppercase;letter-spacing:.8px;margin-bottom:16px}
.steps{display:flex;flex-direction:column;gap:0}
.step{display:flex;gap:14px;position:relative;padding-bottom:20px}
.step:last-child{padding-bottom:0}
.step-left{display:flex;flex-direction:column;align-items:center;flex-shrink:0}
.step-num{
  width:28px;height:28px;border-radius:50%;
  background:linear-gradient(135deg,var(--gd),#d97706);
  color:#000;font-size:12px;font-weight:700;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.step-line{flex:1;width:1px;background:var(--bd2);margin-top:4px;margin-bottom:-4px}
.step:last-child .step-line{display:none}
.step-body{padding-top:3px}
.step-title{font-size:12.5px;font-weight:600;color:var(--tx);margin-bottom:3px}
.step-desc{font-size:11.5px;color:var(--mt);line-height:1.55}
.landing-stats{padding:20px 36px 28px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.stat{text-align:center;background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:14px 10px}
.stat-num{font-family:var(--fd);font-size:26px;font-weight:700;color:var(--gd)}
.stat-label{font-size:10.5px;color:var(--mt);margin-top:3px;line-height:1.4}

/* Template card */
.tcard{background:var(--sf2);border:1px solid var(--bd2);border-radius:8px;padding:11px 13px;display:flex;align-items:flex-start;gap:9px}
.tic{font-size:20px;flex-shrink:0;margin-top:1px}
.tinfo{flex:1;overflow:hidden}
.tname{font-size:12.5px;font-weight:600;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tmeta{font-size:10.5px;color:var(--mt);margin-top:2px}
.tacts{display:flex;gap:5px;flex-shrink:0}
.tpreview{margin-top:5px;font-size:10px;color:var(--dm);line-height:1.5;max-height:48px;overflow:hidden;font-family:var(--fm)}

/* Misc */
.divider{height:1px;background:var(--bd2);margin:3px 0}
.errmsg{background:rgba(248,81,73,.07);border:1px solid rgba(248,81,73,.2);border-radius:7px;padding:8px 11px;font-size:11.5px;color:var(--rd)}
.infobox{background:rgba(240,165,0,.06);border:1px solid rgba(240,165,0,.18);border-radius:8px;padding:10px 13px;font-size:12px;color:var(--mt);line-height:1.6}
.toast{position:fixed;bottom:20px;right:20px;background:var(--sf);border:1px solid var(--gn);color:var(--gn);font-size:11.5px;font-weight:500;padding:9px 14px;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.4);animation:tin .22s ease;z-index:999}
@keyframes tin{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}

@media(max-width:820px){
  .sgrid{grid-template-columns:1fr}
  .landing-features{grid-template-columns:1fr}
  .landing-hero{padding:32px 22px 28px}
  .landing-headline{font-size:26px}
  .landing-stats{grid-template-columns:1fr}
}
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function EduAgent() {

  // ── Nav ──
  const [page, setPage] = useState("home");
  const [navOpen, setNavOpen] = useState(true);

  // ── Settings state ──
  const [selModel, setSelModel] = useState("claude-sonnet-4-6");
  const [customMid, setCustomMid] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCounty, setSchoolCounty] = useState("");
  const [schoolType, setSchoolType] = useState("Public (Government)");
  const [defDuration, setDefDuration] = useState("40");
  const [defWeeks, setDefWeeks] = useState("8");
  const [defLevel, setDefLevel] = useState("Grade 7 – Grade 9 (Junior Secondary CBC)");
  const [outLang, setOutLang] = useState("English");

  // ── Template state ──
  const [lpTempl, setLpTempl] = useState(null);
  const [sowTempl, setSowTempl] = useState(null);
  const lpRef = useRef(); const sowRef = useRef();

  // ── Generate state ──
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Grade 7 – Grade 9 (Junior Secondary CBC)");
  const [subject, setSubject] = useState("Mathematics");
  const [duration, setDuration] = useState("40");
  const [weeks, setWeeks] = useState("8");
  const [imode, setImode] = useState("text");
  const [itext, setItext] = useState("");
  const [cfile, setCfile] = useState(null);
  const cfileRef = useRef();

  const [stages, setStages] = useState(new Set(["lesson_plan","scheme_of_work","ppt_notes","youtube_videos"]));
  const [results, setResults] = useState({});
  const [prog, setProg] = useState({});
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [genErr, setGenErr] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  const toggleStage = (id) => setStages(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Template upload ──
  const onTemplUpload = async (e, which) => {
    const f = e.target.files[0]; if (!f) return;
    const ex = await extractFile(f);
    const content = ex.kind === "text" ? ex.content : `[Non-text file: ${f.name}. Please use .docx or .txt for templates.]`;
    if (which === "lp") setLpTempl({ name: f.name, content });
    else setSowTempl({ name: f.name, content });
    showToast(`✓ ${which === "lp" ? "Lesson Plan" : "Scheme of Work"} template loaded`);
    e.target.value = "";
  };

  // ── Content upload ──
  const onContentUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const ex = await extractFile(f);
    setCfile({ name: f.name, ...ex });
    setImode("file");
    e.target.value = "";
  };

  // ── Build API messages ──
  const buildMsgs = (stageId) => {
    const tmplText = stageId === "lesson_plan" ? lpTempl?.content
                   : stageId === "scheme_of_work" ? sowTempl?.content : null;
    const prompt = buildPrompt(stageId, { topic, level, duration, weeks, templateText: tmplText, subject, schoolName, schoolCounty });
    const uc = [];
    if (imode === "text" && itext.trim()) uc.push({ type: "text", text: `Teacher's notes:\n\n${itext}\n\n` });
    else if (imode === "file" && cfile) {
      if (cfile.kind === "text")  uc.push({ type: "text", text: `Content from "${cfile.name}":\n\n${cfile.content}\n\n` });
      else if (cfile.kind === "image") { uc.push({ type: "image", source: { type: "base64", media_type: cfile.mime, data: cfile.content } }); uc.push({ type: "text", text: `Image of notes: "${cfile.name}". Analyse and use.\n\n` }); }
      else if (cfile.kind === "pdf") { uc.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: cfile.content } }); uc.push({ type: "text", text: `PDF: "${cfile.name}". Use its content.\n\n` }); }
    }
    uc.push({ type: "text", text: prompt });
    return [{ role: "user", content: uc }];
  };

  // ── Run pipeline ──
  const run = async () => {
    if (!topic.trim() && !itext.trim() && !cfile) { setGenErr("Enter a topic or upload content first."); return; }
    setGenErr(""); setRunning(true); setResults({}); setProg({});
    const mdl = useCustom ? customMid : selModel;
    const stageList = PIPELINE_STAGES.filter(s => stages.has(s.id));
    if (stageList.length) setActiveTab(stageList[0].id);
    const sys = `You are an expert Kenyan educational content creator aligned with CBC and KICD standards. Create detailed, professional, ready-to-use teaching materials. Format using markdown. Use Kenyan context, language, and examples. ${outLang === "Kiswahili" ? "Respond in Kiswahili." : outLang === "English & Kiswahili (bilingual)" ? "Respond bilingually in English and Kiswahili." : "Respond in English."}`;
    for (const stage of stageList) {
      setProg(p => ({ ...p, [stage.id]: "running" }));
      try {
        const tools = stage.id === "youtube_videos"
          ? [{ type: "web_search_20250305", name: "web_search" }]
          : undefined;
        const res = await callAPI(mdl, buildMsgs(stage.id), sys, apiKey, tools);
        setResults(r => ({ ...r, [stage.id]: res }));
        setProg(p => ({ ...p, [stage.id]: "done" }));
      } catch (err) {
        setResults(r => ({ ...r, [stage.id]: `❌ Error: ${err.message}` }));
        setProg(p => ({ ...p, [stage.id]: "error" }));
      }
    }
    setRunning(false);
  };

  const hasResults = Object.keys(results).length > 0;
  const doneCount = Object.values(prog).filter(v => v === "done" || v === "error").length;

  // ─── NAV LINKS ───────────────────────────────────────────────────────────────

  const NAV_LINKS = [
    { id: "home",      icon: "🏠", label: "Home"      },
    { id: "generate",  icon: "⚡", label: "Generate"  },
    { id: "templates", icon: "📂", label: "Templates", badge: [lpTempl, sowTempl].filter(Boolean).length || null },
    { id: "settings",  icon: "⚙️", label: "Settings"  },
  ];

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">

        {/* ── Navigation ── */}
        <nav className={`nav ${navOpen ? "" : "closed"}`}>
          <div className="nav-logo">
            <div className="nav-logo-mark" onClick={() => setNavOpen(o => !o)} title={navOpen ? "Collapse sidebar" : "Expand sidebar"}>🎓</div>
            <div className="nav-logo-text">
              <div className="nav-logo-name">EduForge AI</div>
              <div className="nav-logo-sub">Curriculum Agent</div>
            </div>
            <button className="nav-toggle" onClick={() => setNavOpen(o => !o)} title={navOpen ? "Collapse" : "Expand"}>
              {navOpen ? "◀" : "▶"}
            </button>
          </div>

          <div className="nav-scroll">
            <div className="nav-group-label">Workspace</div>
            {NAV_LINKS.map(n => (
              <button
                key={n.id}
                className={`nav-link ${page === n.id ? "on" : ""}`}
                onClick={() => setPage(n.id)}
                data-tip={n.label}
              >
                <span className="nav-link-ic">{n.icon}</span>
                <span className="nav-link-label">{n.label}</span>
                {n.id === "generate" && running && <span className="nav-spin">⟳</span>}
                {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
              </button>
            ))}
          </div>

          <div className="nav-foot">
            <div className="nav-school">🏫 <span>{schoolName || "No school set"}</span></div>
          </div>
        </nav>

        {/* ── Page ── */}
        <div className="page">

          {/* ═══════════════════════════════════════════════════════════
              HOME / LANDING PAGE
          ═══════════════════════════════════════════════════════════ */}
          {page === "home" && <>
            <div className="phead">
              <div><div className="phead-title">EduForge AI</div><div className="phead-sub">Kenya CBC Curriculum Agent</div></div>
              <div className="phead-right"><div className="dot"/><span style={{fontSize:11.5,color:"var(--mt)"}}>CBC & KICD Aligned</span></div>
            </div>
            <div className="landing">
              {/* Hero */}
              <div className="landing-hero">
                <div className="landing-hero-badge"><div className="dot"/>CBC & KICD Aligned</div>
                <div className="landing-eyebrow">🇰🇪 Kenya Curriculum AI Agent</div>
                <div className="landing-headline">Build <span>lesson-ready</span> materials in seconds</div>
                <div className="landing-tagline">
                  Generate CBC-aligned lesson plans, schemes of work, PowerPoint notes and YouTube resource guides — tailored to your school, your level, your templates.
                </div>
                <div className="landing-cta-row">
                  <button className="cta-primary" onClick={() => setPage("generate")}>⚡ Start Generating →</button>
                  <button className="cta-secondary" onClick={() => setPage("templates")}>📂 Upload School Template</button>
                </div>
              </div>

              {/* Feature cards */}
              <div className="landing-features">
                {[
                  { icon:"📋", title:"Lesson Plans", desc:"Full CBC lesson plans with Strand, Sub-Strand, Core Competencies, PCIs, Values, Learning Experiences table and Teacher Reflection.", tag:"CBC Format", c1:"#f0a500", c2:"#d97706", tc:"rgba(240,165,0,.15)", tcl:"var(--gd)" },
                  { icon:"🗓️", title:"Schemes of Work", desc:"Complete multi-week SoW tables — Week, Lesson, SLOs, Key Inquiry, Activities, Resources and Assessment columns all filled.", tag:"KICD Standard", c1:"#10b981", c2:"#059669", tc:"rgba(16,185,129,.12)", tcl:"var(--gn)" },
                  { icon:"📊", title:"PowerPoint Notes", desc:"15–20 slides with speaker notes, visual suggestions and learner activities — Kenyan context and local examples throughout.", tag:"Slide-by-slide", c1:"#8b5cf6", c2:"#7c3aed", tc:"rgba(139,92,246,.12)", tcl:"var(--pu)" },
                  { icon:"▶️", title:"YouTube Resources", desc:"Curated search queries, Kenyan channels (Elimu TV, KBC Education), offline download tips and flipped learning strategies.", tag:"Kenyan channels", c1:"#ef4444", c2:"#dc2626", tc:"rgba(239,68,68,.12)", tcl:"var(--rd)" },
                ].map(f => (
                  <div key={f.title} className="feat-card" style={{"--card-c1":f.c1,"--card-c2":f.c2}} onClick={() => setPage("generate")}>
                    <div className="feat-icon">{f.icon}</div>
                    <div className="feat-title">{f.title}</div>
                    <div className="feat-desc">{f.desc}</div>
                    <span className="feat-tag" style={{background:f.tc,color:f.tcl}}>{f.tag}</span>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div className="landing-steps">
                <div className="landing-section-label">How it works</div>
                <div className="steps">
                  {[
                    { n:"1", title:"Enter your topic", desc:"Type a subject/topic or paste your notes. You can also upload a PDF, Word doc, or photo of handwritten notes." },
                    { n:"2", title:"Choose your pipeline", desc:"Select which materials to generate — any combination of Lesson Plan, Scheme of Work, PowerPoint Notes and YouTube Resources." },
                    { n:"3", title:"Optionally upload your template", desc:"Go to Templates and upload your school's official document format. The AI will follow it exactly." },
                    { n:"4", title:"Click Run Pipeline", desc:"The AI generates all selected materials simultaneously. Each appears in a tab you can copy or download." },
                  ].map(s => (
                    <div key={s.n} className="step">
                      <div className="step-left"><div className="step-num">{s.n}</div><div className="step-line"/></div>
                      <div className="step-body"><div className="step-title">{s.title}</div><div className="step-desc">{s.desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="landing-stats">
                {[
                  { num:"4", label:"Output types generated per run" },
                  { num:"CBC", label:"Kenya competency-based curriculum aligned" },
                  { num:"< 60s", label:"Average generation time per document" },
                ].map(s => (
                  <div key={s.num} className="stat">
                    <div className="stat-num">{s.num}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>}

          {/* ═══════════════════════════════════════════════════════════
              GENERATE PAGE
          ═══════════════════════════════════════════════════════════ */}
          {page === "generate" && <>
            <div className="phead">
              <div><div className="phead-title">Generate Materials</div><div className="phead-sub">CBC-aligned lesson plans, schemes of work & resources</div></div>
              <div className="phead-right">
                {running
                  ? <><span style={{animation:"sp 1s linear infinite",display:"inline-block",fontSize:13}}>⟳</span><span style={{fontSize:11.5,color:"var(--gd)"}}>Generating…</span></>
                  : <><div className="dot"/><span style={{fontSize:11.5,color:"var(--mt)"}}>Ready</span></>}
              </div>
            </div>

            <div className="pbody">
              {/* Config sidebar */}
              <div className="sidebar">

                {/* Lesson settings */}
                <div className="card">
                  <div className="chead"><div className="cic">📚</div><span className="ctitle">Lesson Settings</span></div>
                  <div className="cbody">
                    <div><label>Topic / Subject *</label><input type="text" placeholder="e.g. Photosynthesis, Linear Equations…" value={topic} onChange={e => setTopic(e.target.value)} /></div>
                    <div><label>CBC Strand / Subject</label><select value={subject} onChange={e => setSubject(e.target.value)}>{CBC_STRANDS.map(s => <option key={s}>{s}</option>)}</select></div>
                    <div><label>Student Level</label><select value={level} onChange={e => setLevel(e.target.value)}>{KE_LEVELS.map(l => <option key={l}>{l}</option>)}</select></div>
                    <div className="row2">
                      <div><label>Duration (mins)</label><input type="number" value={duration} min="20" max="240" onChange={e => setDuration(e.target.value)} /></div>
                      <div><label>SoW Weeks</label><input type="number" value={weeks} min="1" max="40" onChange={e => setWeeks(e.target.value)} /></div>
                    </div>
                  </div>
                </div>

                {/* Content input */}
                <div className="card">
                  <div className="chead"><div className="cic">📄</div><span className="ctitle">Content Input</span></div>
                  <div className="cbody">
                    <div className="itabs">
                      <button className={`itab ${imode==="text"?"on":""}`} onClick={() => setImode("text")}>✏️ Text</button>
                      <button className={`itab ${imode==="file"?"on":""}`} onClick={() => cfileRef.current?.click()}>📎 Upload</button>
                    </div>
                    {imode === "text" && <textarea rows={5} placeholder="Paste notes, syllabus extract, or any content here…" value={itext} onChange={e => setItext(e.target.value)} />}
                    {imode === "file" && !cfile && (
                      <div className="uzone" onClick={() => cfileRef.current?.click()}>
                        <div className="uzone-ic">📁</div>
                        <div className="uzone-tx">Click to upload notes</div>
                        <div className="uzone-ty">.pdf · .docx · .txt · .png · .jpg</div>
                      </div>
                    )}
                    {imode === "file" && cfile && (
                      <>
                        <div className="upill">{cfile.kind==="image"?"🖼️":cfile.kind==="pdf"?"📕":"📄"}<span className="upill-name">{cfile.name}</span></div>
                        <button className="abtn danger" style={{marginTop:6,width:"100%"}} onClick={() => { setCfile(null); setImode("text"); }}>🗑️ Remove</button>
                      </>
                    )}
                    <input ref={cfileRef} type="file" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp" style={{display:"none"}} onChange={onContentUpload} />
                  </div>
                </div>

                {/* Pipeline stages */}
                <div className="card">
                  <div className="chead"><div className="cic">⚡</div><span className="ctitle">Pipeline Stages</span></div>
                  <div className="cbody">
                    {(lpTempl || sowTempl) && (
                      <div className="infobox" style={{fontSize:11}}>
                        🗂️ Custom templates active: {[lpTempl && "Lesson Plan", sowTempl && "Scheme"].filter(Boolean).join(", ")}
                      </div>
                    )}
                    <div className="sgrid2">
                      {PIPELINE_STAGES.map(s => (
                        <button key={s.id} className={`sbtn ${stages.has(s.id)?"on":""}`} onClick={() => toggleStage(s.id)}>
                          <span className="sbtn-ic">{s.icon}</span>
                          <span className="sbtn-lb">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {genErr && <div className="errmsg">⚠️ {genErr}</div>}

                <button className="run-btn" onClick={run} disabled={running || stages.size === 0}>
                  {running ? <><span style={{animation:"sp 1s linear infinite",display:"inline-block"}}>⟳</span>Generating…</> : <><span>🚀</span>Run Pipeline</>}
                </button>
              </div>

              {/* Output area — results only */}
              <div className="output">
                {!hasResults && !running && (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:14,opacity:.45}}>
                    <div style={{fontSize:52}}>🚀</div>
                    <div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--tx)"}}>Ready to generate</div>
                    <div style={{fontSize:12,color:"var(--mt)",textAlign:"center",maxWidth:260,lineHeight:1.6}}>Fill in the lesson settings on the left and click <strong>Run Pipeline</strong></div>
                  </div>
                )}
                {(hasResults || running) && <>
                  <div className="pbadges">
                    {PIPELINE_STAGES.filter(s => stages.has(s.id)).map(s => (
                      <div key={s.id} className={`pbadge ${prog[s.id]||""}`}>
                        {s.icon}
                        {prog[s.id]==="running" && <span style={{animation:"sp 1s linear infinite",display:"inline-block"}}>⟳</span>}
                        {prog[s.id]==="done" && "✓"}{prog[s.id]==="error" && "✗"}
                        {s.label}
                      </div>
                    ))}
                  </div>
                  {running && <div className="progwrap"><div className="progfill" style={{width:`${stages.size ? (doneCount/stages.size)*100 : 0}%`}} /></div>}

                  {hasResults && <>
                    <div className="rtabs">
                      {PIPELINE_STAGES.filter(s => results[s.id]).map(s => (
                        <button key={s.id} className={`rtab ${activeTab===s.id?"on":""}`} onClick={() => setActiveTab(s.id)}>
                          {s.icon} {s.label}{results[s.id]?.startsWith("❌") && " ⚠️"}
                        </button>
                      ))}
                    </div>
                    {activeTab && results[activeTab] && (
                      <div className="rcard">
                        <div className="rchead">
                          <div className="rctitle">{PIPELINE_STAGES.find(s=>s.id===activeTab)?.icon} {PIPELINE_STAGES.find(s=>s.id===activeTab)?.label}</div>
                          <div className="rcacts">
                            <button className="abtn" onClick={() => { navigator.clipboard.writeText(results[activeTab]); showToast("✓ Copied"); }}>📋 Copy</button>
                            <button className="abtn" onClick={() => {
                              const s = PIPELINE_STAGES.find(s=>s.id===activeTab);
                              const b = new Blob([results[activeTab]],{type:"text/plain"});
                              const a = document.createElement("a"); a.href=URL.createObjectURL(b);
                              a.download=`${s.label.replace(/\s+/g,"_")}_${(topic||"output").replace(/\s+/g,"_")}.txt`; a.click();
                            }}>⬇️ Download</button>
                          </div>
                        </div>
                        <div className="rcbody" dangerouslySetInnerHTML={{__html: md(results[activeTab])}} />
                      </div>
                    )}
                  </>}

                  {running && Object.entries(prog).filter(([,v])=>v==="running").map(([id]) => (
                    <div key={id} className="rcard" style={{marginTop:12}}>
                      <div className="rchead"><div className="rctitle" style={{color:"var(--gd)",fontSize:14}}><span style={{animation:"sp 1s linear infinite",display:"inline-block"}}>⟳</span> Generating {PIPELINE_STAGES.find(s=>s.id===id)?.label}…</div></div>
                      <div className="skelwrap">{[80,65,55,75,60,50,70].map((w,i) => <div key={i} className="skel" style={{width:`${w}%`}} />)}</div>
                    </div>
                  ))}
                </>}
              </div>
            </div>
          </>}

          {/* ═══════════════════════════════════════════════════════════
              TEMPLATES PAGE
          ═══════════════════════════════════════════════════════════ */}
          {page === "templates" && <>
            <div className="phead">
              <div><div className="phead-title">My Templates</div><div className="phead-sub">Upload your school's lesson plan & scheme of work formats</div></div>
            </div>
            <div className="settbody">
              <div className="infobox">
                <strong style={{color:"var(--gd)"}}>🏫 How School Templates Work</strong><br/>
                Upload your school's official document template (.docx or .txt). The AI reads your exact column headers, row labels, and section structure, then populates every field — ensuring all generated documents match your school's required format perfectly. Without a template, the standard Kenya CBC/KICD format is used.
              </div>

              {/* Lesson Plan Template */}
              <div className="card">
                <div className="chead"><div className="cic">📋</div><span className="ctitle">Lesson Plan Template</span>{lpTempl && <span className="cbadge">✓ Active</span>}</div>
                <div className="cbody">
                  {lpTempl ? (
                    <div className="tcard">
                      <div className="tic">📋</div>
                      <div className="tinfo">
                        <div className="tname">{lpTempl.name}</div>
                        <div className="tmeta">{lpTempl.content.length.toLocaleString()} characters · Active</div>
                        <div className="tpreview">{lpTempl.content.slice(0,220)}…</div>
                      </div>
                      <div className="tacts">
                        <button className="abtn" onClick={() => lpRef.current?.click()}>🔄</button>
                        <button className="abtn danger" onClick={() => { setLpTempl(null); showToast("Lesson Plan template removed"); }}>🗑️</button>
                      </div>
                    </div>
                  ) : (
                    <div className="uzone" onClick={() => lpRef.current?.click()}>
                      <div className="uzone-ic">📋</div>
                      <div className="uzone-tx"><strong>Upload Lesson Plan Template</strong><br/>Your school's official format</div>
                      <div className="uzone-ty">.docx · .txt · .pdf</div>
                    </div>
                  )}
                  <input ref={lpRef} type="file" accept=".docx,.txt,.md,.pdf" style={{display:"none"}} onChange={e => onTemplUpload(e,"lp")} />
                  <div className="hint">💡 Use a Word (.docx) or plain text copy of your template. Include all headers, column names, and school-specific sections for best results.</div>
                </div>
              </div>

              {/* Scheme of Work Template */}
              <div className="card">
                <div className="chead"><div className="cic">🗓️</div><span className="ctitle">Scheme of Work Template</span>{sowTempl && <span className="cbadge">✓ Active</span>}</div>
                <div className="cbody">
                  {sowTempl ? (
                    <div className="tcard">
                      <div className="tic">🗓️</div>
                      <div className="tinfo">
                        <div className="tname">{sowTempl.name}</div>
                        <div className="tmeta">{sowTempl.content.length.toLocaleString()} characters · Active</div>
                        <div className="tpreview">{sowTempl.content.slice(0,220)}…</div>
                      </div>
                      <div className="tacts">
                        <button className="abtn" onClick={() => sowRef.current?.click()}>🔄</button>
                        <button className="abtn danger" onClick={() => { setSowTempl(null); showToast("Scheme of Work template removed"); }}>🗑️</button>
                      </div>
                    </div>
                  ) : (
                    <div className="uzone" onClick={() => sowRef.current?.click()}>
                      <div className="uzone-ic">🗓️</div>
                      <div className="uzone-tx"><strong>Upload Scheme of Work Template</strong><br/>Your school's column format</div>
                      <div className="uzone-ty">.docx · .txt · .pdf</div>
                    </div>
                  )}
                  <input ref={sowRef} type="file" accept=".docx,.txt,.md,.pdf" style={{display:"none"}} onChange={e => onTemplUpload(e,"sow")} />
                  <div className="hint">💡 Include all column headers (Wk, Strand, SLOs, Key Inquiry, Resources, Assessment, etc.) so every column is populated.</div>
                </div>
              </div>

              {/* Default fallback info */}
              <div className="card">
                <div className="chead"><div className="cic">📌</div><span className="ctitle">Default Format (No Template)</span></div>
                <div className="cbody">
                  <div style={{fontSize:12.5,color:"var(--mt)",lineHeight:1.75}}>
                    When no custom template is uploaded, the AI generates documents using the <strong style={{color:"var(--tx)"}}>standard Kenya CBC/KICD format</strong>:
                  </div>
                  <div className="row2" style={{marginTop:4}}>
                    <div style={{background:"var(--sf2)",border:"1px solid var(--bd2)",borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:11.5,fontWeight:600,color:"var(--tx)",marginBottom:6}}>📋 Lesson Plan</div>
                      <div style={{fontSize:11,color:"var(--mt)",lineHeight:1.65}}>Strand · Sub-Strand · Core Competencies · PCIs · Values · Inquiry Question · Learning Experiences Table · Self-Reflection</div>
                    </div>
                    <div style={{background:"var(--sf2)",border:"1px solid var(--bd2)",borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:11.5,fontWeight:600,color:"var(--tx)",marginBottom:6}}>🗓️ Scheme of Work</div>
                      <div style={{fontSize:11,color:"var(--mt)",lineHeight:1.65}}>Wk · Lesson · Strand/Sub-Strand · SLOs · Key Inquiry · Learning Experiences · Resources · Assessment · Remarks</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>}

          {/* ═══════════════════════════════════════════════════════════
              SETTINGS PAGE
          ═══════════════════════════════════════════════════════════ */}
          {page === "settings" && <>
            <div className="phead">
              <div><div className="phead-title">Settings</div><div className="phead-sub">Model, school profile & output preferences</div></div>
              <div className="phead-right">
                <button className="save-btn" onClick={() => showToast("✓ Settings saved")}>💾 Save</button>
              </div>
            </div>
            <div className="settbody">
              <div className="sgrid">

                {/* ── Model Selection ── */}
                <div className="card sgrid-full">
                  <div className="chead"><div className="cic">🤖</div><span className="ctitle">AI Model</span></div>
                  <div className="cbody">
                    <div className="tpill">
                      <button className={`tpbtn ${!useCustom?"on":""}`} onClick={() => setUseCustom(false)}>Preset Models</button>
                      <button className={`tpbtn ${useCustom?"on":""}`} onClick={() => setUseCustom(true)}>Custom Model ID</button>
                    </div>

                    {!useCustom ? (
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {PRESET_MODELS.map(m => (
                          <div key={m.id} className={`mcard ${selModel===m.id?"on":""}`} onClick={() => setSelModel(m.id)}>
                            <div className="radio"><div className="rdot"/></div>
                            <div className="minfo"><div className="mlb">{m.label}</div><div className="mnt">{m.note}</div></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <label>Custom Model ID</label>
                        <input type="text" placeholder="e.g. claude-haiku-4-5-20251001" value={customMid} onChange={e => setCustomMid(e.target.value)} style={{fontFamily:"var(--fm)",fontSize:12}} />
                        <div className="hint">Enter any valid Anthropic model string. See docs.anthropic.com for available models.</div>
                      </div>
                    )}

                    <div className="divider" />

                    <div>
                      <label>API Key <span style={{color:"var(--dm)"}}>— optional</span></label>
                      <input type="password" placeholder="sk-ant-api…" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{fontFamily:"var(--fm)",fontSize:12}} />
                      <div className="hint">Leave blank to use Claude.ai's built-in access. Provide your own key for higher rate limits or external deployment.</div>
                    </div>
                  </div>
                </div>

                {/* ── School Profile ── */}
                <div className="card">
                  <div className="chead"><div className="cic">🏫</div><span className="ctitle">School Profile</span></div>
                  <div className="cbody">
                    <div><label>School Name</label><input type="text" placeholder="e.g. Moi High School Kabarak" value={schoolName} onChange={e => setSchoolName(e.target.value)} /></div>
                    <div>
                      <label>County</label>
                      <select value={schoolCounty} onChange={e => setSchoolCounty(e.target.value)}>
                        <option value="">Select county…</option>
                        {KE_COUNTIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>School Type</label>
                      <select value={schoolType} onChange={e => setSchoolType(e.target.value)}>
                        {["Public (Government)","Private / Independent","Mission / Faith-Based","Special Needs","TVET Institution"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="hint">School details are embedded into all generated document headers.</div>
                  </div>
                </div>

                {/* ── Output Preferences ── */}
                <div className="card">
                  <div className="chead"><div className="cic">🎛️</div><span className="ctitle">Output Preferences</span></div>
                  <div className="cbody">
                    <div>
                      <label>Default Lesson Duration (mins)</label>
                      <input type="number" value={defDuration} min={20} max={240} onChange={e => setDefDuration(e.target.value)} />
                      <div className="hint">Standard Kenya lesson = 35–40 mins</div>
                    </div>
                    <div>
                      <label>Default Scheme Duration (weeks)</label>
                      <input type="number" value={defWeeks} min={1} max={40} onChange={e => setDefWeeks(e.target.value)} />
                    </div>
                    <div>
                      <label>Default Student Level</label>
                      <select value={defLevel} onChange={e => setDefLevel(e.target.value)}>{KE_LEVELS.map(l => <option key={l}>{l}</option>)}</select>
                    </div>
                    <div>
                      <label>Output Language</label>
                      <select value={outLang} onChange={e => setOutLang(e.target.value)}>
                        {["English","Kiswahili","English & Kiswahili (bilingual)"].map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Template Quick-Access ── */}
                <div className="card sgrid-full">
                  <div className="chead">
                    <div className="cic">📂</div><span className="ctitle">Template Status</span>
                    <button className="abtn" style={{marginLeft:"auto"}} onClick={() => setPage("templates")}>Manage Templates →</button>
                  </div>
                  <div className="cbody">
                    <div className="row2">
                      <div className="tcard">
                        <div className="tic">📋</div>
                        <div className="tinfo"><div className="tname">Lesson Plan Template</div><div className="tmeta">{lpTempl ? `✓ ${lpTempl.name}` : "Using default CBC format"}</div></div>
                      </div>
                      <div className="tcard">
                        <div className="tic">🗓️</div>
                        <div className="tinfo"><div className="tname">Scheme of Work Template</div><div className="tmeta">{sowTempl ? `✓ ${sowTempl.name}` : "Using default KICD format"}</div></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>}

        </div>{/* /page */}
      </div>{/* /shell */}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
