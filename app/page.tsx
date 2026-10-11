"use client";

// BrainBurst page. Put this file at app/page.tsx and questions.json next to it (app/questions.json).
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import raw from "./questions.json"; // <-- the link between page.tsx and the JSON file

/* ============================ Types ============================ */
interface BankItem { q: string; answer: string; wrong: string[]; topic?: string }
interface SubjectMeta { desc: string; color: string; letter: string }
interface TopicMeta { name: string; desc: string; color: string; letter: string }
interface QuizData {
  maxQuestions: number;
  tagline: string;
  classColors: string[];
  subjects: Record<string, SubjectMeta>;
  classes: Record<string, string[]>;
  topics: TopicMeta[];
  bank: Record<string, Record<string, BankItem[]>>;
}
interface Item { q: string; options: string[]; answer: string }
interface LastQuiz { cls: number; subject: string; n: number; topics: string[] | null }
type Screen = "welcome" | "home" | "topics" | "quiz";

const DATA = raw as unknown as QuizData;
const MAX_Q = DATA.maxQuestions || 50;
const ALL = "All Subjects";
const BADGE = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b"];
const PARTICLE_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#06b6d4"];

/* ======================= Small helpers ======================== */
const v = (o: Record<string, string | number>) => o as CSSProperties;
const R = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = <T,>(a: T[]): T => a[R(0, a.length - 1)];
const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = R(0, i);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵"];

/* ================== Maths question generators ================== */
// Each generator returns [question, correct, wrong1, wrong2, wrong3]
type Gen = () => string[];
interface NumOpts { dec?: number; neg?: boolean; pre?: string; suf?: string; extra?: number[] }

function numQ(q: string, ans: number, step: number, o: NumOpts = {}): string[] {
  const dec = o.dec || 0;
  const neg = !!o.neg;
  const pre = o.pre || "";
  const suf = o.suf || "";
  const fmt = (n: number) => pre + (dec ? n.toFixed(dec) : String(n)).replace("-", "−") + suf;
  const base = +ans.toFixed(dec);
  const seen = new Set<number>([base]);
  const wrong: number[] = [];
  (o.extra || []).forEach((w0) => {
    const w = +w0.toFixed(dec);
    if (!seen.has(w) && wrong.length < 3 && (neg || w >= 0)) { seen.add(w); wrong.push(w); }
  });
  for (let k = 0; wrong.length < 3 && k < 80; k++) {
    const w = +(base + R(1, 5) * step * (Math.random() < 0.5 ? -1 : 1)).toFixed(dec);
    if ((!neg && w < 0) || seen.has(w)) continue;
    seen.add(w); wrong.push(w);
  }
  for (let j = 6; wrong.length < 3; j++) {
    const w = +(base + j * step).toFixed(dec);
    if (!seen.has(w)) { seen.add(w); wrong.push(w); }
  }
  return [q, fmt(base), ...wrong.map(fmt)];
}

const G1: Gen[] = [
  () => { const a = R(1, 10), b = R(1, 10); return numQ(`${a} + ${b} = ?`, a + b, 1); },
  () => { const a = R(5, 20), b = R(1, a); return numQ(`${a} − ${b} = ?`, a - b, 1); },
  () => { const n = R(1, 98); return numQ(`Which number comes just after ${n}?`, n + 1, 1); },
  () => { const n = R(2, 99); return numQ(`Which number comes just before ${n}?`, n - 1, 1); },
  () => { const a = R(1, 50); let b = R(1, 50); while (b === a) b = R(1, 50); return [`Which number is bigger: ${a} or ${b}?`, String(Math.max(a, b)), String(Math.min(a, b)), "Both are equal", "Cannot say"]; },
  () => { const a = R(1, 50); let b = R(1, 50); while (b === a) b = R(1, 50); return [`Which number is smaller: ${a} or ${b}?`, String(Math.min(a, b)), String(Math.max(a, b)), "Both are equal", "Cannot say"]; },
  () => { const a = R(2, 9), b = R(1, 9); return numQ(`Riya has ${a} balloons. She gets ${b} more. How many balloons does she have now?`, a + b, 1); },
];
const G2: Gen[] = [
  () => { const a = R(10, 60), b = R(10, 39); return numQ(`${a} + ${b} = ?`, a + b, 2); },
  () => { const a = R(20, 99), b = R(10, a); return numQ(`${a} − ${b} = ?`, a - b, 2); },
  () => { const t = pick([2, 5, 10]), k = R(1, 10); return numQ(`${t} × ${k} = ?`, t * k, t); },
  () => { const n = R(10, 99), even = n % 2 === 0; return [`Is ${n} odd or even?`, even ? "Even" : "Odd", even ? "Odd" : "Even", "Neither", "Both"]; },
  () => { const a = R(1, 9), b = R(0, 9); return numQ(`${a} tens and ${b} ones make which number?`, a * 10 + b, 1); },
  () => { const n = R(5, 45); return numQ(`What is double of ${n}?`, n * 2, 2); },
  () => { const n = R(10, 98); return numQ(`Which number comes just after ${n}?`, n + 1, 1); },
];
const G3: Gen[] = [
  () => { const a = R(100, 600), b = R(100, 399); return numQ(`${a} + ${b} = ?`, a + b, 10); },
  () => { const a = R(300, 999), b = R(100, a - 50); return numQ(`${a} − ${b} = ?`, a - b, 10); },
  () => { const t = R(2, 10), k = R(2, 10); return numQ(`${t} × ${k} = ?`, t * k, t); },
  () => { const t = R(2, 10), k = R(2, 10); return numQ(`${t * k} ÷ ${t} = ?`, k, 1); },
  () => { let n = R(11, 99); while (n % 10 === 5) n = R(11, 99); return numQ(`Round ${n} to the nearest ten.`, Math.round(n / 10) * 10, 10); },
  () => { const a = R(2, 9), k = R(2, 9); return numQ(`A pencil costs ₹${a}. How much do ${k} pencils cost?`, a * k, a, { pre: "₹" }); },
];
const G4: Gen[] = [
  () => { const a = R(1000, 5999), b = R(1000, 3999); return numQ(`${a} + ${b} = ?`, a + b, 100); },
  () => { const a = R(3000, 9999), b = R(1000, a - 500); return numQ(`${a} − ${b} = ?`, a - b, 100); },
  () => { const a = R(11, 99), b = R(2, 9); return numQ(`${a} × ${b} = ?`, a * b, 10); },
  () => { const b = R(2, 9), q = R(11, 60); return numQ(`${b * q} ÷ ${b} = ?`, q, 2); },
  () => { const l = R(5, 30), w = R(3, l); return numQ(`What is the perimeter of a rectangle with length ${l} cm and width ${w} cm?`, 2 * (l + w), 2, { suf: " cm" }); },
  () => { const h = R(2, 9); return numQ(`How many minutes are there in ${h} hours?`, h * 60, 30); },
  () => { const m = R(2, 40); return numQ(`What is 1/2 of ${2 * m}?`, m, 2); },
];
const G5: Gen[] = [
  () => { const a = R(12, 40), b = R(11, 25); return numQ(`${a} × ${b} = ?`, a * b, 10); },
  () => { const b = R(3, 9), q = R(15, 110); return numQ(`${b * q} ÷ ${b} = ?`, q, 2); },
  () => { const l = R(6, 30), w = R(4, l); return numQ(`What is the area of a rectangle with length ${l} cm and width ${w} cm?`, l * w, 4, { suf: " cm²" }); },
  () => { const d = pick([2, 3, 4, 5, 10]), n = R(1, d - 1), m = d * R(2, 12); return numQ(`What is ${n}/${d} of ${m}?`, (n * m) / d, 2); },
  () => { const g = R(2, 9), [p, q] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7]]); return numQ(`What is the HCF of ${g * p} and ${g * q}?`, g, 1); },
  () => { const a = R(11, 59), b = R(11, 39); return numQ(`${(a / 10).toFixed(1)} + ${(b / 10).toFixed(1)} = ?`, (a + b) / 10, 0.1, { dec: 1 }); },
];
const G6: Gen[] = [
  () => { const a = R(2, 15), b = R(2, 15); return numQ(`${a} + (−${b}) = ?`, a - b, 1, { neg: true }); },
  () => { const a = R(2, 15), b = R(2, 15); return numQ(`(−${a}) + (−${b}) = ?`, -(a + b), 1, { neg: true, extra: [a + b] }); },
  () => { const [a, b] = pick([[4, 6], [6, 8], [3, 5], [4, 10], [6, 9], [8, 12], [5, 15], [9, 12], [10, 15]]); return numQ(`What is the LCM of ${a} and ${b}?`, (a * b) / gcd(a, b), 2); },
  () => { const g = R(2, 12), [p, q] = pick([[2, 3], [2, 5], [3, 4], [3, 5], [4, 5]]); return numQ(`What is the HCF of ${g * p} and ${g * q}?`, g, 1); },
  () => { const p = pick([10, 20, 25, 50]), n = pick([40, 80, 100, 120, 200, 400]), a = (p * n) / 100; return numQ(`What is ${p}% of ${n}?`, a, Math.max(2, Math.round(a / 5))); },
  () => { const g = R(2, 9), [p, q] = pick([[1, 2], [2, 3], [3, 4], [1, 3], [2, 5], [3, 5], [4, 5], [1, 4]]); return [`Simplify the ratio ${g * p} : ${g * q}.`, `${p} : ${q}`, `${q} : ${p}`, `${p + 1} : ${q}`, `${p} : ${q + 1}`]; },
  () => { const s = R(3, 15); return numQ(`What is the area of a square with side ${s} cm?`, s * s, s, { suf: " cm²" }); },
  () => { const x = R(2, 15), a = R(2, 20); return numQ(`If x + ${a} = ${x + a}, what is x?`, x, 1); },
  () => { const a = R(2, 9), x = R(2, 12); return numQ(`If ${a}x = ${a * x}, what is x?`, x, 1); },
];
const G7: Gen[] = [
  () => { const a = R(2, 12), b = R(2, 12); return numQ(`(−${a}) × ${b} = ?`, -(a * b), a, { neg: true, extra: [a * b] }); },
  () => { const a = R(2, 12), b = R(2, 12); return numQ(`(−${a}) × (−${b}) = ?`, a * b, a, { neg: true, extra: [-(a * b)] }); },
  () => { const b = R(2, 9), q = R(2, 12); return numQ(`(−${b * q}) ÷ ${b} = ?`, -q, 1, { neg: true, extra: [q] }); },
  () => { const x = R(2, 15), a = R(2, 9), b = R(1, 20); return numQ(`Solve: ${a}x + ${b} = ${a * x + b}`, x, 1); },
  () => { const c = pick([100, 200, 400, 500, 800, 1000]), p = pick([10, 20, 25, 50]); return numQ(`An article bought for ₹${c} is sold at a profit of ${p}%. What is the selling price?`, c + (c * p) / 100, c / 10, { pre: "₹" }); },
  () => { const b = 2 * R(2, 15), h = R(3, 20); return numQ(`What is the area of a triangle with base ${b} cm and height ${h} cm?`, (b * h) / 2, 2, { suf: " cm²" }); },
  () => { const b = R(2, 5), e = R(2, 4); return numQ(`What is the value of ${b}${SUP[e]}?`, Math.pow(b, e), b); },
  () => { const m = R(8, 40), d1 = R(1, 6), d2 = R(1, 6); return numQ(`Find the mean of ${m - d1}, ${m + d2} and ${m + d1 - d2}.`, m, 1); },
];
const MATHS_GEN: Record<number, Gen[]> = { 1: G1, 2: G2, 3: G3, 4: G4, 5: G5, 6: G6, 7: G7 };

function mathsItems(cls: number, n: number): string[][] {
  const gens = MATHS_GEN[cls] || G1;
  const seen = new Set<string>();
  const out: string[][] = [];
  for (let t = 0; out.length < n && t < n * 60; t++) {
    const x = gens[t % gens.length]();
    if (seen.has(x[0])) continue;
    seen.add(x[0]);
    out.push(x);
  }
  return out;
}

/* ===================== Build a quiz from the data ===================== */
const toItem = (q: string, answer: string, wrong: string[]): Item => ({ q, answer, options: shuffle([answer, ...wrong]) });

function rawItems(cls: number, sub: string, n: number, topics: string[] | null): Item[] {
  if (sub === "Maths") return mathsItems(cls, n).map((x) => toItem(x[0], x[1], x.slice(2, 5)));
  let list = (DATA.bank[String(cls)] || {})[sub] || [];
  if (topics && topics.length) list = list.filter((x) => x.topic !== undefined && topics.includes(x.topic));
  return list.map((x) => toItem(x.q, x.answer, x.wrong));
}

function assemble(cls: number, subject: string, n: number, topics: string[] | null): Item[] {
  if (subject !== ALL) return shuffle(rawItems(cls, subject, n, topics)).slice(0, n);
  const lists = (DATA.classes[String(cls)] || []).map((s) => shuffle(rawItems(cls, s, n, null)));
  const out: Item[] = [];
  for (let i = 0; out.length < n && lists.some((l) => l.length); i++) {
    const l = lists[i % lists.length];
    const x = l.shift();
    if (x) out.push(x);
  }
  return shuffle(out);
}

/* =========================== Styles =========================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Poppins:wght@400;500;600&display=swap');
.bb,.bb *{box-sizing:border-box}
.bb{margin:0;background:#000;color:#fff;font-family:'Poppins',system-ui,sans-serif;min-height:100vh;overflow-x:hidden}
.bb h1,.bb h2,.bb h3,.bb p,.bb nav,.bb label{margin:0;padding:0}
.bb button,.bb input{font-family:inherit}
.bb .screen{position:fixed;inset:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center}
.bb .particles{position:fixed;inset:0;pointer-events:none;z-index:0}
.bb .dot{position:absolute;border-radius:50%;opacity:.6;animation:bb-rise linear infinite}
@keyframes bb-rise{from{transform:translateY(105vh) scale(.5)}to{transform:translateY(-10vh) scale(1.2)}}
.bb .orb{position:fixed;border-radius:50%;filter:blur(100px);opacity:.25;animation:bb-float 10s ease-in-out infinite;pointer-events:none}
@keyframes bb-float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-50px) scale(1.2)}}

.bb .welcome{justify-content:center;text-align:center;padding:24px;z-index:2;transition:transform .8s cubic-bezier(.7,0,.3,1),opacity .8s}
.bb .welcome.leave{transform:scale(2.4);opacity:0;pointer-events:none}
.bb .rings{position:absolute;top:50%;left:50%;width:0;height:0;z-index:-1}
.bb .ring{position:absolute;border:2px solid;border-radius:50%;transform:translate(-50%,-50%);opacity:0;animation:bb-burst 4s ease-out infinite}
@keyframes bb-burst{0%{width:40px;height:40px;opacity:.9}100%{width:900px;height:900px;opacity:0}}
.bb .logo{font-family:'Orbitron',sans-serif;font-weight:900;font-size:clamp(40px,10vw,84px);letter-spacing:3px;display:flex;flex-wrap:wrap;justify-content:center}
.bb .logo span{display:inline-block;background:linear-gradient(180deg,#fff,#ec4899 55%,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0;animation:bb-drop .8s cubic-bezier(.3,1.6,.5,1) forwards,bb-bob 3s ease-in-out infinite}
@keyframes bb-drop{from{opacity:0;transform:translateY(-120px) rotate(-25deg) scale(.4)}to{opacity:1;transform:none}}
@keyframes bb-bob{0%,100%{translate:0 0}50%{translate:0 -8px}}
.bb .tag{color:#a1a1b5;margin:14px 0 34px;font-size:18px;opacity:0;animation:bb-fade 1s ease 1.3s forwards}
@keyframes bb-fade{to{opacity:1}}
.bb .card{width:100%;max-width:420px;padding:26px;border-radius:22px;background:rgba(18,18,28,.8);backdrop-filter:blur(12px);border:1px solid #2e2e42;opacity:0;animation:bb-up .8s ease 1.6s forwards,bb-glow 4s ease-in-out 2.4s infinite}
@keyframes bb-up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@keyframes bb-glow{0%,100%{box-shadow:0 0 20px rgba(139,92,246,.35)}50%{box-shadow:0 0 40px rgba(236,72,153,.55)}}
.bb label{display:block;text-align:left;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a78bfa;font-weight:600;margin-bottom:8px}
.bb input{width:100%;padding:15px 16px;border-radius:14px;border:1.5px solid #3a3a52;background:#101018;color:#fff;font:500 17px 'Poppins',sans-serif;outline:none;transition:.25s}
.bb input:focus{border-color:#8b5cf6;box-shadow:0 0 0 4px rgba(139,92,246,.28)}
.bb input.err{animation:bb-shake .45s;border-color:#ef4444}
@keyframes bb-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-9px)}40%,80%{transform:translateX(9px)}}
.bb .btn{margin-top:16px;width:100%;padding:15px;border:0;border-radius:14px;color:#fff;font:600 16px 'Poppins',sans-serif;letter-spacing:.5px;cursor:pointer;background:linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b);background-size:200% 200%;animation:bb-grad 4s ease infinite,bb-pulse 2s ease-in-out infinite;transition:transform .2s}
.bb .btn:hover{transform:translateY(-3px) scale(1.03)}
.bb .btn:active{transform:scale(.96)}
@keyframes bb-grad{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}
@keyframes bb-pulse{0%,100%{box-shadow:0 0 0 0 rgba(236,72,153,.5)}50%{box-shadow:0 0 0 14px rgba(236,72,153,0)}}
.bb .btn:disabled{opacity:.45;cursor:not-allowed;transform:none;animation:bb-grad 4s ease infinite}

.bb .flash{position:fixed;inset:0;background:radial-gradient(circle,#fff,#ec4899 40%,transparent 70%);opacity:0;pointer-events:none;z-index:50;animation:bb-flash .9s ease}
@keyframes bb-flash{0%{opacity:0;transform:scale(.2)}35%{opacity:.95}100%{opacity:0;transform:scale(3)}}

.bb .page{padding:0 20px 50px;z-index:2}
.bb nav{width:100%;max-width:1000px;display:flex;justify-content:space-between;align-items:center;padding:20px 0}
.bb .nlogo{font-family:'Orbitron',sans-serif;font-weight:900;font-size:24px;background:linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent}
.bb .chip{display:flex;align-items:center;gap:10px;padding:6px 8px 6px 16px;border:1px solid #2e2e42;border-radius:99px;background:#12121c;font-size:14px}
.bb .chip b{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#8b5cf6,#ec4899)}
.bb .chip button{background:none;border:0;color:#a1a1b5;cursor:pointer;font:inherit;font-size:12px;text-decoration:underline}
.bb .hero{text-align:center;margin:40px 0 30px;max-width:700px}
.bb .hero h1{font-family:'Orbitron',sans-serif;font-size:clamp(28px,6vw,52px);line-height:1.2}
.bb .hero h1 em{font-style:normal;background:linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b,#06b6d4,#8b5cf6);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:bb-grad 5s linear infinite}
.bb .hero p{color:#a1a1b5;margin-top:14px;font-size:17px}
.bb .stats{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin:10px 0 34px}
.bb .stat{padding:14px 26px;border-radius:16px;background:#12121c;border:1px solid #2e2e42;text-align:center}
.bb .stat strong{display:block;font-family:'Orbitron',sans-serif;font-size:26px;color:#f59e0b}
.bb .stat span{font-size:12px;color:#a1a1b5;letter-spacing:1px;text-transform:uppercase}
.bb .picklabel{width:100%;max-width:1000px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a78bfa;font-weight:600;margin:6px 0 12px}
.bb .classes{width:100%;max-width:1000px;display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px;margin-bottom:30px}
.bb .cls{font:600 16px 'Poppins',sans-serif;color:#fff;padding:16px 10px;border-radius:16px;border:1.5px solid #2e2e42;background:#12121c;cursor:pointer;transition:transform .25s,border-color .25s,box-shadow .25s,background .25s}
.bb .cls:hover{transform:translateY(-5px);border-color:var(--c);box-shadow:0 10px 24px color-mix(in srgb,var(--c) 40%,transparent)}
.bb .cls.sel{background:var(--c);color:#000;border-color:var(--c);transform:scale(1.06);box-shadow:0 0 24px color-mix(in srgb,var(--c) 70%,transparent)}
.bb .cls small{display:block;font-size:11px;font-weight:500;opacity:.7;letter-spacing:1px;text-transform:uppercase}
.bb .qbox{width:100%;max-width:420px;margin:30px auto 0;padding:22px;border-radius:20px;background:rgba(18,18,28,.85);border:1px solid #2e2e42;text-align:left;animation:bb-up .5s ease both}
.bb .qbox input[type=number]{-moz-appearance:textfield;appearance:textfield}
.bb .qbox input::-webkit-outer-spin-button,.bb .qbox input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.bb .qhint{color:#a1a1b5;font-size:13px;margin-top:8px}
.bb .qerr{color:#f87171;font-size:14px;font-weight:500;margin-top:8px;min-height:20px}
.bb .grid{width:100%;max-width:1000px;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
.bb .topic{padding:24px;border-radius:20px;background:#12121c;border:1px solid #2e2e42;cursor:pointer;position:relative;overflow:hidden;transition:transform .3s,border-color .3s,box-shadow .3s;font:inherit;color:#fff;text-align:left;display:block;width:100%}
.bb .topic::before{content:"";position:absolute;inset:0;background:var(--c);opacity:0;transition:.3s}
.bb .topic:hover{transform:translateY(-8px) rotate(-1deg);border-color:var(--c);box-shadow:0 14px 34px color-mix(in srgb,var(--c) 45%,transparent)}
.bb .topic:hover::before{opacity:.12}
.bb .topic *{position:relative}
.bb .topic:focus-visible{outline:2px solid #fff;outline-offset:3px}
.bb .topic.sel{border-color:var(--c);box-shadow:0 0 0 2px var(--c),0 14px 34px color-mix(in srgb,var(--c) 45%,transparent)}
.bb .topic.sel::before{opacity:.18}
.bb .topic.sel::after{content:"\\2713";position:absolute;top:14px;right:14px;width:26px;height:26px;border-radius:50%;background:var(--c);color:#000;display:grid;place-items:center;font-weight:700;animation:bb-pop .35s cubic-bezier(.3,1.8,.5,1)}
@keyframes bb-pop{from{transform:scale(0)}to{transform:scale(1)}}
.bb .ico{width:50px;height:50px;border-radius:14px;display:grid;place-items:center;font:900 22px 'Orbitron',sans-serif;background:var(--c);color:#000;margin-bottom:14px;transition:transform .4s}
.bb .topic:hover .ico{transform:rotate(360deg) scale(1.1)}
.bb .topic h3{font-size:18px}
.bb .topic p{color:#a1a1b5;font-size:13px;margin-top:4px}
.bb .reveal{opacity:0;transform:translateY(34px);animation:bb-up .7s ease forwards;animation-delay:calc(var(--i)*.1s + .3s)}
.bb .back{background:#12121c;color:#fff;border:1px solid #2e2e42;border-radius:99px;padding:8px 18px;font:500 14px 'Poppins',sans-serif;cursor:pointer;transition:.25s}
.bb .back:hover{border-color:#8b5cf6;transform:translateX(-3px)}
.bb .pill{font:600 14px 'Poppins',sans-serif;color:#fff;padding:10px 22px;border-radius:99px;border:1.5px solid #14b8a6;background:#12121c;cursor:pointer;transition:.25s}
.bb .pill:hover{background:#14b8a6;color:#000;transform:translateY(-2px)}
.bb .tinfo{color:#a1a1b5;font-size:14px;margin:12px 0 22px;text-align:center}
.bb .qwrap{width:100%;max-width:640px;padding-top:24px}
.bb .qcard{padding:26px;border-radius:22px;background:rgba(18,18,28,.88);border:1px solid #2e2e42;animation:bb-up .5s ease both}
.bb .qtop{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;font-size:14px;color:#a1a1b5}
.bb .bar{height:8px;background:#1f1f2b;border-radius:99px;overflow:hidden;margin-bottom:14px}
.bb .bar i{display:block;height:100%;background:linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b);transition:width .5s}
.bb .qtext{font-size:21px;font-weight:600;line-height:1.45;margin:10px 0 18px}
.bb .notice{color:#fbbf24;font-size:13px;margin-bottom:8px}
.bb .opts{display:grid;gap:11px}
.bb .opt{display:flex;align-items:center;gap:12px;text-align:left;padding:13px;background:#101018;color:#fff;border:1.5px solid #3a3a52;border-radius:14px;font:500 15px 'Poppins',sans-serif;cursor:pointer;transition:transform .2s,border-color .2s,background .3s;animation:bb-up .45s ease backwards}
.bb .opt:not(:disabled):hover{transform:translateX(8px);border-color:#8b5cf6}
.bb .opt b{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;color:#000}
.bb .opt.right{background:#14532d;border-color:#22c55e;animation:bb-pop .5s ease}
.bb .opt.wrong{background:#7f1d1d;border-color:#ef4444;animation:bb-shake .45s ease}
.bb .opt.dim{opacity:.5}
.bb .sring{width:160px;height:160px;border-radius:50%;margin:22px auto 10px;display:grid;place-items:center;animation:bb-scoreIn .8s ease both}
.bb .sring>div{width:128px;height:128px;border-radius:50%;background:#0b0b12;display:grid;place-items:center;align-content:center}
.bb .sring strong{font:800 28px 'Orbitron',sans-serif}
.bb .sring span{color:#a1a1b5;font-size:14px}
@keyframes bb-scoreIn{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
.bb .cta{max-width:340px;margin:40px auto 0;display:block}
`;

/* ======================= Count-up number ======================= */
function CountUp({ end }: { end: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 1400, 1);
      setVal(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end]);
  return <>{val}</>;
}

interface Particle { left: number; size: number; color: string; dur: number; delay: number }

/* ============================ Page ============================ */
export default function BrainBurst() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [leaving, setLeaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const [nameInput, setNameInput] = useState("");
  const [nameErr, setNameErr] = useState(false);
  const [name, setName] = useState("");

  const [cls, setCls] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [count, setCount] = useState("");
  const [countErr, setCountErr] = useState("");

  const [tSel, setTSel] = useState<string[]>([]);
  const [tCount, setTCount] = useState(0);

  const [Q, setQ] = useState<Item[]>([]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [last, setLast] = useState<LastQuiz | null>(null);
  const qRef = useRef<HTMLInputElement>(null);

  const classKeys = Object.keys(DATA.classes);
  const subjectCount = new Set(Object.values(DATA.classes).flat()).size;

  // floating particles (created after mount so server and browser agree)
  useEffect(() => {
    setParticles(
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        size: 4 + Math.random() * 8,
        color: PARTICLE_COLORS[i % 4],
        dur: 8 + Math.random() * 12,
        delay: Math.random() * 15,
      }))
    );
    // remembered name: skip the welcome screen
    try {
      const saved = localStorage.getItem("bb_name");
      if (saved) { setName(saved); setScreen("home"); }
    } catch { /* ignore */ }
  }, []);

  /* ---------- welcome ---------- */
  const enter = () => {
    const n = nameInput.trim();
    if (!n) { setNameErr(false); requestAnimationFrame(() => setNameErr(true)); return; }
    const pretty = n.charAt(0).toUpperCase() + n.slice(1);
    setName(pretty);
    try { localStorage.setItem("bb_name", pretty); } catch { /* ignore */ }
    setFlash(true);
    setLeaving(true);
    setTimeout(() => { setScreen("home"); setLeaving(false); }, 700);
    setTimeout(() => setFlash(false), 950);
  };

  const changeName = () => {
    try { localStorage.removeItem("bb_name"); } catch { /* ignore */ }
    setNameInput("");
    setCls(null); setSubject(null); setCount(""); setCountErr("");
    setScreen("welcome");
  };

  /* ---------- home ---------- */
  const subjectList = cls ? [...(DATA.classes[cls] || []), ALL] : [];

  const pickClass = (c: string) => { setCls(c); setSubject(null); setCountErr(""); };
  const pickSubject = (s: string) => {
    setSubject(s);
    setCountErr("");
    setTimeout(() => qRef.current?.focus(), 50);
  };

  const checkCount = (showEmpty: boolean): number | null => {
    const rawV = count.trim();
    setCountErr("");
    if (rawV === "") { if (showEmpty) setCountErr("Please enter the number of questions."); return null; }
    const n = Number(rawV);
    if (!Number.isInteger(n) || n < 1) { setCountErr(`Enter a whole number from 1 to ${MAX_Q}.`); return null; }
    if (n > MAX_Q) { setCountErr(`Error: the maximum is ${MAX_Q} questions. You entered ${n}.`); return null; }
    return n;
  };

  const onCount = (val: string) => {
    setCount(val);
    const rawV = val.trim();
    if (rawV === "") { setCountErr(""); return; }
    const n = Number(rawV);
    if (!Number.isInteger(n) || n < 1) setCountErr(`Enter a whole number from 1 to ${MAX_Q}.`);
    else if (n > MAX_Q) setCountErr(`Error: the maximum is ${MAX_Q} questions. You entered ${n}.`);
    else setCountErr("");
  };

  const startQuiz = (c: number, s: string, n: number, topics: string[] | null) => {
    const items = assemble(c, s, n, topics);
    setLast({ cls: c, subject: s, n, topics });
    if (items.length === 0) {
      alert("No questions are available for this choice yet.");
      setScreen("home");
      return;
    }
    setQ(items); setQi(0); setScore(0); setPicked(null);
    setNotice(items.length < n ? `Only ${items.length} question${items.length === 1 ? " is" : "s are"} available for this choice, so your quiz has ${items.length}.` : "");
    setScreen("quiz");
  };

  const onStart = () => {
    if (!cls || !subject) return;
    const n = checkCount(true);
    if (n === null) { qRef.current?.focus(); return; }
    const c = Number(cls);
    if (subject === "Social Studies" && c >= 6) {
      setTCount(n); setTSel([]); setScreen("topics");
      return;
    }
    startQuiz(c, subject, n, null);
  };

  /* ---------- topics ---------- */
  const toggleTopic = (t: string) => setTSel((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  const allTopics = DATA.topics.map((t) => t.name);
  const toggleAll = () => setTSel((p) => (p.length === allTopics.length ? [] : allTopics));

  /* ---------- quiz ---------- */
  const answer = (o: string) => {
    if (picked !== null) return;
    setPicked(o);
    if (o === Q[qi].answer) setScore((s) => s + 1);
  };
  const next = () => { setQi((i) => i + 1); setPicked(null); };

  const done = screen === "quiz" && Q.length > 0 && qi >= Q.length;
  const pct = Q.length ? Math.round((score / Q.length) * 100) : 0;
  const cur = Q[qi];

  /* ============================ Render ============================ */
  return (
    <div className="bb">
      <style>{CSS}</style>

      <div className="orb" style={{ background: "#8b5cf6", width: 300, height: 300, top: "5%", left: "5%" }} />
      <div className="orb" style={{ background: "#ec4899", width: 340, height: 340, top: "55%", right: "5%", animationDelay: "-3s" }} />
      <div className="orb" style={{ background: "#06b6d4", width: 240, height: 240, bottom: "5%", left: "15%", animationDelay: "-6s" }} />
      <div className="particles">
        {particles.map((p, i) => (
          <div key={i} className="dot" style={{ left: `${p.left}%`, width: p.size, height: p.size, background: p.color, animationDuration: `${p.dur}s`, animationDelay: `-${p.delay}s` }} />
        ))}
      </div>
      {flash && <div className="flash" />}

      {/* ---------------- Screen 1: name ---------------- */}
      {screen === "welcome" && (
        <section className={`screen welcome${leaving ? " leave" : ""}`}>
          <div className="rings">
            <div className="ring" style={{ borderColor: "#8b5cf6" }} />
            <div className="ring" style={{ borderColor: "#ec4899", animationDelay: "1.3s" }} />
            <div className="ring" style={{ borderColor: "#f59e0b", animationDelay: "2.6s" }} />
          </div>
          <div className="logo">
            {"BrainBurst".split("").map((ch, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.09}s, ${i * 0.09 + 0.9}s` }}>{ch}</span>
            ))}
          </div>
          <p className="tag">{DATA.tagline}</p>
          <div className="card">
            <label htmlFor="bbname">What&apos;s your name?</label>
            <input
              id="bbname"
              type="text"
              maxLength={20}
              placeholder="Type your name"
              autoComplete="off"
              className={nameErr ? "err" : ""}
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setNameErr(false); }}
              onKeyDown={(e) => e.key === "Enter" && enter()}
            />
            <button className="btn" onClick={enter}>Let&apos;s Burst</button>
          </div>
        </section>
      )}

      {/* ---------------- Screen 2: home ---------------- */}
      {screen === "home" && (
        <section className="screen page">
          <nav>
            <div className="nlogo">BrainBurst</div>
            <div className="chip">
              <span>{name}</span>
              <b>{name.charAt(0)}</b>
              <button onClick={changeName}>change</button>
            </div>
          </nav>

          <div className="hero reveal" style={v({ "--i": 0 })}>
            <h1>Hey <em>{name}</em>,<br />ready to burst your brain?</h1>
            <p>Pick a subject, choose your level and start a quick quiz.</p>
          </div>

          <div className="stats reveal" style={v({ "--i": 1 })}>
            <div className="stat"><strong><CountUp end={classKeys.length} /></strong><span>Classes</span></div>
            <div className="stat"><strong><CountUp end={subjectCount} /></strong><span>Subjects</span></div>
            <div className="stat"><strong><CountUp end={3} /></strong><span>Levels</span></div>
          </div>

          <div className="picklabel reveal" style={v({ "--i": 2 })}>1. Choose your class</div>
          <div className="classes reveal" style={v({ "--i": 3 })}>
            {classKeys.map((c, i) => (
              <button key={c} type="button" className={`cls${cls === c ? " sel" : ""}`} style={v({ "--c": DATA.classColors[i % DATA.classColors.length] })} onClick={() => pickClass(c)}>
                <small>Class</small>{c}
              </button>
            ))}
          </div>

          <div className="picklabel reveal" style={v({ "--i": 4 })}>
            {cls ? `2. Choose a subject for Class ${cls}` : "2. Choose a subject"}
          </div>
          <div className="grid" key={cls ?? "none"}>
            {subjectList.map((s, i) => {
              const m = DATA.subjects[s];
              if (!m) return null;
              return (
                <button key={s} type="button" className={`topic${subject === s ? " sel" : ""}`}
                  style={v({ "--c": m.color, opacity: 0, animation: `bb-up .5s ease ${i * 0.08}s forwards` })}
                  onClick={() => pickSubject(s)}>
                  <div className="ico">{m.letter}</div>
                  <h3>{s}</h3>
                  <p>{m.desc}</p>
                </button>
              );
            })}
          </div>

          {subject && (
            <div className="qbox">
              <label htmlFor="qcount">How many {subject} questions?</label>
              <input
                id="qcount"
                ref={qRef}
                type="number"
                min={1}
                max={MAX_Q}
                step={1}
                placeholder={`Enter 1 to ${MAX_Q}`}
                autoComplete="off"
                className={countErr ? "err" : ""}
                value={count}
                onChange={(e) => onCount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onStart()}
              />
              <div className="qhint">Maximum {MAX_Q} questions.</div>
              <div className="qerr">{countErr}</div>
            </div>
          )}

          <button className="btn cta reveal" style={v({ "--i": 8 })} disabled={!subject} onClick={onStart}>
            {subject ? `Start Class ${cls} ${subject} Quiz` : "Select a subject to start"}
          </button>
        </section>
      )}

      {/* ------------- Topic page (Social Studies, Class 6+) ------------- */}
      {screen === "topics" && cls && (
        <section className="screen page">
          <nav>
            <div className="nlogo">BrainBurst</div>
            <button className="back" onClick={() => setScreen("home")}>Back</button>
          </nav>
          <div className="hero">
            <h1><em>Class {cls}</em><br />Social Studies Topics</h1>
            <p>Choose the topics for your <b>{tCount}</b>-question quiz.</p>
          </div>
          <button className="pill" onClick={toggleAll}>
            {tSel.length === allTopics.length ? "Clear All Topics" : "Select All Topics"}
          </button>
          <div className="tinfo">{tSel.length} of {allTopics.length} topics selected</div>
          <div className="grid">
            {DATA.topics.map((t, i) => {
              const n = ((DATA.bank[cls] || {})["Social Studies"] || []).filter((x) => x.topic === t.name).length;
              return (
                <button key={t.name} type="button" className={`topic${tSel.includes(t.name) ? " sel" : ""}`}
                  style={v({ "--c": t.color, opacity: 0, animation: `bb-up .5s ease ${i * 0.1}s forwards` })}
                  onClick={() => toggleTopic(t.name)}>
                  <div className="ico">{t.letter}</div>
                  <h3>{t.name}</h3>
                  <p>{t.desc}</p>
                  <p style={{ marginTop: 8, color: "#fff" }}>{n} questions</p>
                </button>
              );
            })}
          </div>
          <button className="btn cta" disabled={tSel.length === 0}
            onClick={() => tSel.length && startQuiz(Number(cls), "Social Studies", tCount, tSel)}>
            {tSel.length === 0 ? "Select at least one topic" : `Start Quiz with ${tSel.length} topic${tSel.length === 1 ? "" : "s"}`}
          </button>
        </section>
      )}

      {/* ---------------- Quiz page ---------------- */}
      {screen === "quiz" && last && (
        <section className="screen page">
          <div className="qwrap">
            {!done && cur && (
              <div className="qcard" key={qi}>
                <div className="qtop">
                  <span>Class {last.cls} · {last.subject}</span>
                  <button className="back" onClick={() => setScreen("home")}>Quit</button>
                </div>
                <div className="bar"><i style={{ width: `${(qi / Q.length) * 100}%` }} /></div>
                <div className="qtop"><span>Question {qi + 1} of {Q.length}</span><span>Score {score}</span></div>
                {notice && <div className="notice">{notice}</div>}
                <div className="qtext">{cur.q}</div>
                <div className="opts">
                  {cur.options.map((o, k) => {
                    const isRight = o === cur.answer;
                    const isPicked = o === picked;
                    let cn = "opt";
                    let mark = "ABCD"[k];
                    if (picked !== null) {
                      if (isRight) { cn += " right"; mark = "✓"; }
                      else if (isPicked) { cn += " wrong"; mark = "✗"; }
                      else cn += " dim";
                    }
                    return (
                      <button key={o} className={cn} disabled={picked !== null} style={{ animationDelay: `${k * 0.08}s` }} onClick={() => answer(o)}>
                        <b style={{ background: BADGE[k] }}>{mark}</b>{o}
                      </button>
                    );
                  })}
                </div>
                {picked !== null && (
                  <button className="btn" onClick={next}>{qi + 1 === Q.length ? "See Result" : "Next"}</button>
                )}
              </div>
            )}

            {done && (
              <div className="qcard" style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: 26, fontWeight: 700 }}>{pct >= 80 ? "Excellent!" : pct >= 50 ? "Good job!" : "Keep practising!"}</h2>
                <div className="sring" style={{ background: `conic-gradient(#8b5cf6 0,#ec4899 ${pct * 1.8}deg,#f59e0b ${pct * 3.6}deg,#1f1f2b ${pct * 3.6}deg)` }}>
                  <div><strong>{score}/{Q.length}</strong><span>{pct}%</span></div>
                </div>
                <button className="btn" onClick={() => startQuiz(last.cls, last.subject, last.n, last.topics)}>Try Again</button>
                <button className="btn" style={{ background: "#1f1f2b", border: "1px solid #3a3a52", animation: "none" }} onClick={() => setScreen("home")}>Back to Home</button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}