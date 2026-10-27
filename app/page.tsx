"use client";

// BrainBurst page. Put this file at app/page.tsx and questions.json next to it (app/questions.json).
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import raw from "./questions.json"; // <-- the link between page.tsx and the JSON file
import GradientBackground from "@/components/GradientBackground";

/* ============================ Types ============================ */
interface BankItem {
  q: string;
  answer: string;
  wrong: string[];
  topic?: string;
}
interface SubjectMeta {
  desc: string;
  color: string;
  letter: string;
}
interface TopicMeta {
  name: string;
  desc: string;
  color: string;
  letter: string;
}
interface QuizData {
  maxQuestions: number;
  tagline: string;
  classColors: string[];
  subjects: Record<string, SubjectMeta>;
  classes: Record<string, string[]>;
  topics: TopicMeta[];
  bank: Record<string, Record<string, BankItem[]>>;
}
interface Item {
  q: string;
  options: string[];
  answer: string;
}
interface LastQuiz {
  cls: number;
  subject: string;
  n: number;
  topics: string[] | null;
}
type Screen = "welcome" | "home" | "topics" | "quiz";

const DATA = raw as unknown as QuizData;
const MAX_Q = DATA.maxQuestions || 50;
const ALL = "All Subjects";

/* ======================= Small helpers ======================== */
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
interface NumOpts {
  dec?: number;
  neg?: boolean;
  pre?: string;
  suf?: string;
  extra?: number[];
}

function numQ(q: string, ans: number, step: number, o: NumOpts = {}): string[] {
  const dec = o.dec || 0;
  const neg = !!o.neg;
  const pre = o.pre || "";
  const suf = o.suf || "";
  const fmt = (n: number) =>
    pre + (dec ? n.toFixed(dec) : String(n)).replace("-", "−") + suf;
  const base = +ans.toFixed(dec);
  const seen = new Set<number>([base]);
  const wrong: number[] = [];
  (o.extra || []).forEach((w0) => {
    const w = +w0.toFixed(dec);
    if (!seen.has(w) && wrong.length < 3 && (neg || w >= 0)) {
      seen.add(w);
      wrong.push(w);
    }
  });
  for (let k = 0; wrong.length < 3 && k < 80; k++) {
    const w = +(base + R(1, 5) * step * (Math.random() < 0.5 ? -1 : 1)).toFixed(
      dec,
    );
    if ((!neg && w < 0) || seen.has(w)) continue;
    seen.add(w);
    wrong.push(w);
  }
  for (let j = 6; wrong.length < 3; j++) {
    const w = +(base + j * step).toFixed(dec);
    if (!seen.has(w)) {
      seen.add(w);
      wrong.push(w);
    }
  }
  return [q, fmt(base), ...wrong.map(fmt)];
}

const G1: Gen[] = [
  () => {
    const a = R(1, 10),
      b = R(1, 10);
    return numQ(`${a} + ${b} = ?`, a + b, 1);
  },
  () => {
    const a = R(5, 20),
      b = R(1, a);
    return numQ(`${a} − ${b} = ?`, a - b, 1);
  },
  () => {
    const n = R(1, 98);
    return numQ(`Which number comes just after ${n}?`, n + 1, 1);
  },
  () => {
    const n = R(2, 99);
    return numQ(`Which number comes just before ${n}?`, n - 1, 1);
  },
  () => {
    const a = R(1, 50);
    let b = R(1, 50);
    while (b === a) b = R(1, 50);
    return [
      `Which number is bigger: ${a} or ${b}?`,
      String(Math.max(a, b)),
      String(Math.min(a, b)),
      "Both are equal",
      "Cannot say",
    ];
  },
  () => {
    const a = R(1, 50);
    let b = R(1, 50);
    while (b === a) b = R(1, 50);
    return [
      `Which number is smaller: ${a} or ${b}?`,
      String(Math.min(a, b)),
      String(Math.max(a, b)),
      "Both are equal",
      "Cannot say",
    ];
  },
  () => {
    const a = R(2, 9),
      b = R(1, 9);
    return numQ(
      `Riya has ${a} balloons. She gets ${b} more. How many balloons does she have now?`,
      a + b,
      1,
    );
  },
];
const G2: Gen[] = [
  () => {
    const a = R(10, 60),
      b = R(10, 39);
    return numQ(`${a} + ${b} = ?`, a + b, 2);
  },
  () => {
    const a = R(20, 99),
      b = R(10, a);
    return numQ(`${a} − ${b} = ?`, a - b, 2);
  },
  () => {
    const t = pick([2, 5, 10]),
      k = R(1, 10);
    return numQ(`${t} × ${k} = ?`, t * k, t);
  },
  () => {
    const n = R(10, 99),
      even = n % 2 === 0;
    return [
      `Is ${n} odd or even?`,
      even ? "Even" : "Odd",
      even ? "Odd" : "Even",
      "Neither",
      "Both",
    ];
  },
  () => {
    const a = R(1, 9),
      b = R(0, 9);
    return numQ(`${a} tens and ${b} ones make which number?`, a * 10 + b, 1);
  },
  () => {
    const n = R(5, 45);
    return numQ(`What is double of ${n}?`, n * 2, 2);
  },
  () => {
    const n = R(10, 98);
    return numQ(`Which number comes just after ${n}?`, n + 1, 1);
  },
];
const G3: Gen[] = [
  () => {
    const a = R(100, 600),
      b = R(100, 399);
    return numQ(`${a} + ${b} = ?`, a + b, 10);
  },
  () => {
    const a = R(300, 999),
      b = R(100, a - 50);
    return numQ(`${a} − ${b} = ?`, a - b, 10);
  },
  () => {
    const t = R(2, 10),
      k = R(2, 10);
    return numQ(`${t} × ${k} = ?`, t * k, t);
  },
  () => {
    const t = R(2, 10),
      k = R(2, 10);
    return numQ(`${t * k} ÷ ${t} = ?`, k, 1);
  },
  () => {
    let n = R(11, 99);
    while (n % 10 === 5) n = R(11, 99);
    return numQ(`Round ${n} to the nearest ten.`, Math.round(n / 10) * 10, 10);
  },
  () => {
    const a = R(2, 9),
      k = R(2, 9);
    return numQ(
      `A pencil costs ₹${a}. How much do ${k} pencils cost?`,
      a * k,
      a,
      { pre: "₹" },
    );
  },
];
const G4: Gen[] = [
  () => {
    const a = R(1000, 5999),
      b = R(1000, 3999);
    return numQ(`${a} + ${b} = ?`, a + b, 100);
  },
  () => {
    const a = R(3000, 9999),
      b = R(1000, a - 500);
    return numQ(`${a} − ${b} = ?`, a - b, 100);
  },
  () => {
    const a = R(11, 99),
      b = R(2, 9);
    return numQ(`${a} × ${b} = ?`, a * b, 10);
  },
  () => {
    const b = R(2, 9),
      q = R(11, 60);
    return numQ(`${b * q} ÷ ${b} = ?`, q, 2);
  },
  () => {
    const l = R(5, 30),
      w = R(3, l);
    return numQ(
      `What is the perimeter of a rectangle with length ${l} cm and width ${w} cm?`,
      2 * (l + w),
      2,
      { suf: " cm" },
    );
  },
  () => {
    const h = R(2, 9);
    return numQ(`How many minutes are there in ${h} hours?`, h * 60, 30);
  },
  () => {
    const m = R(2, 40);
    return numQ(`What is 1/2 of ${2 * m}?`, m, 2);
  },
];
const G5: Gen[] = [
  () => {
    const a = R(12, 40),
      b = R(11, 25);
    return numQ(`${a} × ${b} = ?`, a * b, 10);
  },
  () => {
    const b = R(3, 9),
      q = R(15, 110);
    return numQ(`${b * q} ÷ ${b} = ?`, q, 2);
  },
  () => {
    const l = R(6, 30),
      w = R(4, l);
    return numQ(
      `What is the area of a rectangle with length ${l} cm and width ${w} cm?`,
      l * w,
      4,
      { suf: " cm²" },
    );
  },
  () => {
    const d = pick([2, 3, 4, 5, 10]),
      n = R(1, d - 1),
      m = d * R(2, 12);
    return numQ(`What is ${n}/${d} of ${m}?`, (n * m) / d, 2);
  },
  () => {
    const g = R(2, 9),
      [p, q] = pick([
        [2, 3],
        [3, 4],
        [2, 5],
        [3, 5],
        [4, 5],
        [3, 7],
      ]);
    return numQ(`What is the HCF of ${g * p} and ${g * q}?`, g, 1);
  },
  () => {
    const a = R(11, 59),
      b = R(11, 39);
    return numQ(
      `${(a / 10).toFixed(1)} + ${(b / 10).toFixed(1)} = ?`,
      (a + b) / 10,
      0.1,
      { dec: 1 },
    );
  },
];
const G6: Gen[] = [
  () => {
    const a = R(2, 15),
      b = R(2, 15);
    return numQ(`${a} + (−${b}) = ?`, a - b, 1, { neg: true });
  },
  () => {
    const a = R(2, 15),
      b = R(2, 15);
    return numQ(`(−${a}) + (−${b}) = ?`, -(a + b), 1, {
      neg: true,
      extra: [a + b],
    });
  },
  () => {
    const [a, b] = pick([
      [4, 6],
      [6, 8],
      [3, 5],
      [4, 10],
      [6, 9],
      [8, 12],
      [5, 15],
      [9, 12],
      [10, 15],
    ]);
    return numQ(`What is the LCM of ${a} and ${b}?`, (a * b) / gcd(a, b), 2);
  },
  () => {
    const g = R(2, 12),
      [p, q] = pick([
        [2, 3],
        [2, 5],
        [3, 4],
        [3, 5],
        [4, 5],
      ]);
    return numQ(`What is the HCF of ${g * p} and ${g * q}?`, g, 1);
  },
  () => {
    const p = pick([10, 20, 25, 50]),
      n = pick([40, 80, 100, 120, 200, 400]),
      a = (p * n) / 100;
    return numQ(`What is ${p}% of ${n}?`, a, Math.max(2, Math.round(a / 5)));
  },
  () => {
    const g = R(2, 9),
      [p, q] = pick([
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 3],
        [2, 5],
        [3, 5],
        [4, 5],
        [1, 4],
      ]);
    return [
      `Simplify the ratio ${g * p} : ${g * q}.`,
      `${p} : ${q}`,
      `${q} : ${p}`,
      `${p + 1} : ${q}`,
      `${p} : ${q + 1}`,
    ];
  },
  () => {
    const s = R(3, 15);
    return numQ(`What is the area of a square with side ${s} cm?`, s * s, s, {
      suf: " cm²",
    });
  },
  () => {
    const x = R(2, 15),
      a = R(2, 20);
    return numQ(`If x + ${a} = ${x + a}, what is x?`, x, 1);
  },
  () => {
    const a = R(2, 9),
      x = R(2, 12);
    return numQ(`If ${a}x = ${a * x}, what is x?`, x, 1);
  },
];
const G7: Gen[] = [
  () => {
    const a = R(2, 12),
      b = R(2, 12);
    return numQ(`(−${a}) × ${b} = ?`, -(a * b), a, {
      neg: true,
      extra: [a * b],
    });
  },
  () => {
    const a = R(2, 12),
      b = R(2, 12);
    return numQ(`(−${a}) × (−${b}) = ?`, a * b, a, {
      neg: true,
      extra: [-(a * b)],
    });
  },
  () => {
    const b = R(2, 9),
      q = R(2, 12);
    return numQ(`(−${b * q}) ÷ ${b} = ?`, -q, 1, { neg: true, extra: [q] });
  },
  () => {
    const x = R(2, 15),
      a = R(2, 9),
      b = R(1, 20);
    return numQ(`Solve: ${a}x + ${b} = ${a * x + b}`, x, 1);
  },
  () => {
    const c = pick([100, 200, 400, 500, 800, 1000]),
      p = pick([10, 20, 25, 50]);
    return numQ(
      `An article bought for ₹${c} is sold at a profit of ${p}%. What is the selling price?`,
      c + (c * p) / 100,
      c / 10,
      { pre: "₹" },
    );
  },
  () => {
    const b = 2 * R(2, 15),
      h = R(3, 20);
    return numQ(
      `What is the area of a triangle with base ${b} cm and height ${h} cm?`,
      (b * h) / 2,
      2,
      { suf: " cm²" },
    );
  },
  () => {
    const b = R(2, 5),
      e = R(2, 4);
    return numQ(`What is the value of ${b}${SUP[e]}?`, Math.pow(b, e), b);
  },
  () => {
    const m = R(8, 40),
      d1 = R(1, 6),
      d2 = R(1, 6);
    return numQ(
      `Find the mean of ${m - d1}, ${m + d2} and ${m + d1 - d2}.`,
      m,
      1,
    );
  },
];
const MATHS_GEN: Record<number, Gen[]> = {
  1: G1,
  2: G2,
  3: G3,
  4: G4,
  5: G5,
  6: G6,
  7: G7,
};

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
const toItem = (q: string, answer: string, wrong: string[]): Item => ({
  q,
  answer,
  options: shuffle([answer, ...wrong]),
});

function rawItems(
  cls: number,
  sub: string,
  n: number,
  topics: string[] | null,
): Item[] {
  if (sub === "Maths")
    return mathsItems(cls, n).map((x) => toItem(x[0], x[1], x.slice(2, 5)));
  let list = (DATA.bank[String(cls)] || {})[sub] || [];
  if (topics && topics.length)
    list = list.filter(
      (x) => x.topic !== undefined && topics.includes(x.topic),
    );
  return list.map((x) => toItem(x.q, x.answer, x.wrong));
}

function assemble(
  cls: number,
  subject: string,
  n: number,
  topics: string[] | null,
): Item[] {
  if (subject !== ALL)
    return shuffle(rawItems(cls, subject, n, topics)).slice(0, n);
  const lists = (DATA.classes[String(cls)] || []).map((s) =>
    shuffle(rawItems(cls, s, n, null)),
  );
  const out: Item[] = [];
  for (let i = 0; out.length < n && lists.some((l) => l.length); i++) {
    const l = lists[i % lists.length];
    const x = l.shift();
    if (x) out.push(x);
  }
  return shuffle(out);
}

/* =========================== Tailwind UI =========================== */

const BADGE_COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b"] as const;
const inputClass =
  "w-full rounded-2xl border-[1.5px] border-[#3a3a52] bg-[#101018] px-4 py-4 text-[17px] font-medium text-white outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/25 placeholder:text-[#77778a]";
const buttonClass =
  "mt-4 w-full rounded-2xl bg-[linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b)] bg-[length:200%_200%] px-4 py-4 text-base font-semibold tracking-wide text-white shadow-[0_0_24px_rgba(139,92,246,.22)] transition hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40";
const panelClass =
  "rounded-[22px] border border-[#2e2e42] bg-[rgba(18,18,28,.84)] p-6 shadow-[0_0_28px_rgba(139,92,246,.12)] backdrop-blur-xl";
const muted = "text-[#a1a1b5]";

function CountUp({ end }: { end: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1400, 1);
      setValue(Math.round(end * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end]);
  return <>{value}</>;
}

export default function BrainBurst() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [leaving, setLeaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState(false);
  const [name, setName] = useState("");
  const [cls, setCls] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [count, setCount] = useState("");
  const [countError, setCountError] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicCount, setTopicCount] = useState(0);
  const [questions, setQuestions] = useState<Item[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [lastQuiz, setLastQuiz] = useState<LastQuiz | null>(null);
  const questionCountRef = useRef<HTMLInputElement>(null);

  const classKeys = Object.keys(DATA.classes);
  const subjectCount = new Set(Object.values(DATA.classes).flat()).size;
  const subjectList = cls ? [...(DATA.classes[cls] ?? []), ALL] : [];
  const allTopics = DATA.topics.map((topic) => topic.name);
  const currentQuestion = questions[questionIndex];
  const finished =
    screen === "quiz" &&
    questions.length > 0 &&
    questionIndex >= questions.length;
  const percentage = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;

  const enter = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setNameError(true);
      return;
    }
    const formattedName =
      trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);
    setName(formattedName);
    try {
      localStorage.setItem("bb_name", formattedName);
    } catch {
      /* Storage can be unavailable. */
    }
    setFlash(true);
    setLeaving(true);
    window.setTimeout(() => {
      setScreen("home");
      setLeaving(false);
    }, 700);
    window.setTimeout(() => setFlash(false), 950);
  };

  const changeName = () => {
    try {
      localStorage.removeItem("bb_name");
    } catch {
      /* Storage can be unavailable. */
    }
    setNameInput("");
    setCls(null);
    setSubject(null);
    setCount("");
    setCountError("");
    setScreen("welcome");
  };

  const pickClass = (value: string) => {
    setCls(value);
    setSubject(null);
    setCountError("");
  };

  const pickSubject = (value: string) => {
    setSubject(value);
    setCountError("");
    window.setTimeout(() => questionCountRef.current?.focus(), 50);
  };

  const validateCount = (showEmpty: boolean): number | null => {
    const rawCount = count.trim();
    setCountError("");
    if (!rawCount) {
      if (showEmpty) setCountError("Please enter the number of questions.");
      return null;
    }
    const amount = Number(rawCount);
    if (!Number.isInteger(amount) || amount < 1) {
      setCountError(`Enter a whole number from 1 to ${MAX_Q}.`);
      return null;
    }
    if (amount > MAX_Q) {
      setCountError(
        `Error: the maximum is ${MAX_Q} questions. You entered ${amount}.`,
      );
      return null;
    }
    return amount;
  };

  const updateCount = (value: string) => {
    setCount(value);
    if (!value.trim()) {
      setCountError("");
      return;
    }
    const amount = Number(value);
    if (!Number.isInteger(amount) || amount < 1)
      setCountError(`Enter a whole number from 1 to ${MAX_Q}.`);
    else if (amount > MAX_Q)
      setCountError(
        `Error: the maximum is ${MAX_Q} questions. You entered ${amount}.`,
      );
    else setCountError("");
  };

  const startQuiz = (
    classNumber: number,
    chosenSubject: string,
    amount: number,
    topics: string[] | null,
  ) => {
    const items = assemble(classNumber, chosenSubject, amount, topics);
    setLastQuiz({
      cls: classNumber,
      subject: chosenSubject,
      n: amount,
      topics,
    });
    if (items.length === 0) {
      window.alert("No questions are available for this choice yet.");
      setScreen("home");
      return;
    }
    setQuestions(items);
    setQuestionIndex(0);
    setScore(0);
    setPicked(null);
    setNotice(
      items.length < amount
        ? `Only ${items.length} question${items.length === 1 ? " is" : "s are"} available for this choice, so your quiz has ${items.length}.`
        : "",
    );
    setScreen("quiz");
  };

  const handleStart = () => {
    if (!cls || !subject) return;
    const amount = validateCount(true);
    if (amount === null) {
      questionCountRef.current?.focus();
      return;
    }
    const classNumber = Number(cls);
    if (subject === "Social Studies" && classNumber >= 6) {
      setTopicCount(amount);
      setSelectedTopics([]);
      setScreen("topics");
      return;
    }
    startQuiz(classNumber, subject, amount, null);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((previous) =>
      previous.includes(topic)
        ? previous.filter((item) => item !== topic)
        : [...previous, topic],
    );
  };

  const toggleAllTopics = () => {
    setSelectedTopics((previous) =>
      previous.length === allTopics.length ? [] : allTopics,
    );
  };

  const answerQuestion = (option: string) => {
    if (picked !== null || !currentQuestion) return;
    setPicked(option);
    if (option === currentQuestion.answer) setScore((previous) => previous + 1);
  };

  const nextQuestion = () => {
    setQuestionIndex((previous) => previous + 1);
    setPicked(null);
  };

  const titleGradient =
    "bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400 bg-clip-text text-transparent";
  const screenClass =
    "relative z-10 flex min-h-screen w-full flex-col items-center overflow-y-auto px-5 pb-12";
  const backButton =
    "rounded-full border border-[#2e2e42] bg-[#12121c] px-5 py-2 text-sm font-medium text-white transition hover:-translate-x-1 hover:border-violet-500";
  const topicGrid =
    "grid w-full max-w-5xl grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black font-[Poppins,system-ui,sans-serif] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Poppins:wght@400;500;600&display=swap');
        @keyframes bb-drop { from { opacity:0; transform:translateY(-120px) rotate(-25deg) scale(.4) } to { opacity:1; transform:none } }
        @keyframes bb-bob { 0%,100% { translate:0 0 } 50% { translate:0 -8px } }
        @keyframes bb-fade { to { opacity:1 } }
        @keyframes bb-up { from { opacity:0; transform:translateY(34px) } to { opacity:1; transform:none } }
        @keyframes bb-glow { 0%,100% { box-shadow:0 0 20px rgba(139,92,246,.35) } 50% { box-shadow:0 0 40px rgba(236,72,153,.55) } }
        @keyframes bb-grad { 0%,100% { background-position:0 50% } 50% { background-position:100% 50% } }
        @keyframes bb-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(236,72,153,.5) } 50% { box-shadow:0 0 0 14px rgba(236,72,153,0) } }
        @keyframes bb-shake { 0%,100% { transform:translateX(0) } 20%,60% { transform:translateX(-9px) } 40%,80% { transform:translateX(9px) } }
        @keyframes bb-pop { from { transform:scale(0) } to { transform:scale(1) } }
        @keyframes bb-score-in { from { transform:scale(.3); opacity:0 } to { transform:scale(1); opacity:1 } }
        @keyframes bb-flash { 0% { opacity:0; transform:scale(.2) } 35% { opacity:.95 } 100% { opacity:0; transform:scale(3) } }
        .bb-logo { font-family:Orbitron,sans-serif; font-weight:900; letter-spacing:3px }
        .bb-title { font-family:Orbitron,sans-serif }
        .bb-animated-gradient { background-size:300% 100%; animation:bb-grad 5s linear infinite }
        .bb-btn-gradient { background-size:200% 200%; animation:bb-grad 4s ease infinite,bb-pulse 2s ease-in-out infinite }
        .bb-option { animation:bb-up .45s ease backwards }
        @media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; } }
      `}</style>

      {/* Keep the existing shader background component unchanged. */}
      <GradientBackground />

      {flash && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 animate-[bb-flash_.9s_ease] bg-[radial-gradient(circle,#fff,#ec4899_40%,transparent_70%)]"
        />
      )}

      {screen === "welcome" && (
        <section
          className={`${screenClass} justify-center text-center transition duration-700 ${leaving ? "scale-[2.4] opacity-0" : "scale-100 opacity-100"}`}
        >
          <h1 className="bb-logo flex flex-wrap justify-center text-[clamp(40px,10vw,84px)]">
            {"BrainBurst".split("").map((character, index) => (
              <span
                key={`${character}-${index}`}
                className="inline-block opacity-0 [animation:bb-drop_.8s_cubic-bezier(.3,1.6,.5,1)_forwards,bb-bob_3s_ease-in-out_infinite]"
                style={{
                  animationDelay: `${index * 0.09}s, ${index * 0.09 + 0.9}s`,
                  background:
                    "linear-gradient(180deg,#fff,#575555 55%,#575555)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {character}
              </span>
            ))}
          </h1>
          <p className="mb-9 mt-4 text-lg text-[#a1a1b5] opacity-0 [animation:bb-fade_1s_ease_1.3s_forwards]">
            {DATA.tagline}
          </p>
          <div
            className={`${panelClass} w-full max-w-[420px] flex flex-col gap-8 opacity-0 [animation:bb-up_.8s_ease_1.6s_forwards,bb-glow_4s_ease-in-out_2.4s_infinite]`}
          >
            <label
              htmlFor="bbname"
              className="mb-2 block text-left text-xs font-semibold uppercase tracking-[2px] text-violet-300"
            >
              What&apos;s your name?
            </label>
            <input
              id="bbname"
              type="text"
              maxLength={20}
              placeholder="Type your name"
              autoComplete="off"
              className={`${inputClass} ${nameError ? "animate-[bb-shake_.45s] border-red-500" : ""}`}
              value={nameInput}
              onChange={(event) => {
                setNameInput(event.target.value);
                setNameError(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") enter();
              }}
            />
            <button
              type="button"
              onClick={enter}
              className="group relative flex h-[3.4em] w-full items-center justify-center overflow-hidden rounded-[0.9em] border-0 bg-[#a370f0] py-[0.35em] pl-[1.2em] pr-[3.3em] text-[17px] font-medium tracking-[0.05em] text-white shadow-[inset_0_0_1.6em_-0.6em_#714da6] transition-transform active:scale-[0.98]"
            >
              Let&apos;s Burst
              <span className="absolute right-[0.3em] flex h-[2.8em] w-[2.8em] items-center justify-center rounded-[0.7em] bg-white shadow-[0.1em_0.1em_0.6em_0.2em_#7b52b9] transition-all duration-300 group-hover:w-[calc(100%-0.6em)]">
                <svg
                  className="h-[1.1em] w-[1.1em] shrink-0 text-[#7b52b9] transition-transform duration-300 group-hover:translate-x-[0.1em]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>
          </div>
        </section>
      )}

      {screen === "home" && (
        <section className={screenClass}>
          <nav className="flex w-full max-w-5xl items-center justify-between py-5">
            <div className={`bb-logo text-2xl ${titleGradient}`}>
              BrainBurst
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#2e2e42] bg-[#12121c] py-1.5 pl-4 pr-2 text-sm">
              <span>{name}</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-neutral-500 to-pink-500 font-bold">
                {name.charAt(0)}
              </span>
              <button
                type="button"
                onClick={changeName}
                className="text-xs text-[#a1a1b5] underline"
              >
                change
              </button>
            </div>
          </nav>

          <header className="my-8 max-w-3xl text-center">
            <h1 className="bb-title text-[clamp(28px,6vw,52px)] leading-tight">
              Hey{" "}
              <span className={`bb-animated-gradient ${titleGradient}`}>
                {name}
              </span>
              ,<br />
              ready to burst your brain?
            </h1>
            <p className={`mt-3 text-[17px] ${muted}`}>
              Pick a subject, choose your level and start a quick quiz.
            </p>
          </header>

          <div className="mb-9 flex flex-wrap justify-center gap-3.5">
            {[
              { value: classKeys.length, label: "Classes" },
              { value: subjectCount, label: "Subjects" },
              { value: 3, label: "Levels" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="min-w-28 rounded-2xl border border-[#2e2e42] bg-[#12121c] px-7 py-3.5 text-center"
              >
                <strong className="bb-title block text-2xl text-amber-400">
                  <CountUp end={stat.value} />
                </strong>
                <span className="text-xs uppercase tracking-wider text-[#a1a1b5]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-3 w-full max-w-5xl text-xs font-semibold uppercase tracking-[2px] text-violet-300">
            1. Choose your class
          </div>
          <div className="mb-8 grid w-full max-w-5xl grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-3">
            {classKeys.map((classKey, index) => {
              const color =
                DATA.classColors[index % DATA.classColors.length] ?? "#8b5cf6";
              const selected = cls === classKey;
              return (
                <button
                  key={classKey}
                  type="button"
                  onClick={() => pickClass(classKey)}
                  className={`rounded-2xl border-[1.5px] px-2.5 py-4 text-base font-semibold transition hover:-translate-y-1.5 ${selected ? "scale-[1.04] text-black shadow-lg" : "border-[#2e2e42] bg-[#12121c] text-white"}`}
                  style={{
                    borderColor: color,
                    backgroundColor: selected ? color : undefined,
                    boxShadow: selected ? `0 0 24px ${color}80` : undefined,
                  }}
                >
                  <small className="block text-[11px] uppercase tracking-wider opacity-70">
                    Class
                  </small>
                  {classKey}
                </button>
              );
            })}
          </div>

          <div className="mb-3 w-full max-w-5xl text-xs font-semibold uppercase tracking-[2px] text-violet-300">
            {cls
              ? `2. Choose a subject for Class ${cls}`
              : "2. Choose a subject"}
          </div>
          <div key={cls ?? "none"} className={topicGrid}>
            {subjectList.map((subjectName, index) => {
              const meta = DATA.subjects[subjectName];
              if (!meta) return null;
              const selected = subject === subjectName;
              return (
                <button
                  key={subjectName}
                  type="button"
                  onClick={() => pickSubject(subjectName)}
                  className={`group relative w-full overflow-hidden rounded-[20px] border bg-[#12121c] p-6 text-left transition duration-300 hover:-translate-y-2 hover:-rotate-1 ${selected ? "ring-2" : "border-[#2e2e42]"}`}
                  style={
                    {
                      borderColor: selected ? meta.color : undefined,
                      "--topic-color": meta.color,
                      animation: `bb-up .5s ease ${index * 0.08}s both`,
                      ...(selected
                        ? {
                            boxShadow: `0 0 0 2px ${meta.color},0 14px 34px ${meta.color}55`,
                          }
                        : {}),
                    } as CSSProperties
                  }
                >
                  <span
                    className="mb-3.5 grid h-[50px] w-[50px] place-items-center rounded-[14px] text-[22px] font-black text-black transition duration-500 group-hover:rotate-180"
                    style={{
                      backgroundColor: meta.color,
                      fontFamily: "Orbitron,sans-serif",
                    }}
                  >
                    {meta.letter}
                  </span>
                  <h3 className="text-lg font-semibold">{subjectName}</h3>
                  <p className="mt-1 text-[13px] text-[#a1a1b5]">{meta.desc}</p>
                  {selected && (
                    <span
                      className="absolute right-3.5 top-3.5 grid h-7 w-7 place-items-center rounded-full text-sm font-bold text-black"
                      style={{ backgroundColor: meta.color }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {subject && (
            <div className={`${panelClass} mt-8 w-full max-w-[420px]`}>
              <label
                htmlFor="qcount"
                className="mb-2 block text-left text-xs font-semibold uppercase tracking-[2px] text-violet-300"
              >
                How many {subject} questions?
              </label>
              <input
                id="qcount"
                ref={questionCountRef}
                type="number"
                min={1}
                max={MAX_Q}
                step={1}
                placeholder={`Enter 1 to ${MAX_Q}`}
                autoComplete="off"
                className={`${inputClass} ${countError ? "border-red-500" : ""}`}
                value={count}
                onChange={(event) => updateCount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleStart();
                }}
              />
              <p className={`mt-2 text-[13px] ${muted}`}>
                Maximum {MAX_Q} questions.
              </p>
              <p
                role="alert"
                className="mt-2 min-h-5 text-sm font-medium text-red-400"
              >
                {countError}
              </p>
            </div>
          )}
          <button
            type="button"
            className={`${buttonClass} bb-btn-gradient mt-10 max-w-[340px]`}
            disabled={!subject}
            onClick={handleStart}
          >
            {subject
              ? `Start Class ${cls} ${subject} Quiz`
              : "Select a subject to start"}
          </button>
        </section>
      )}

      {screen === "topics" && cls && (
        <section className={screenClass}>
          <nav className="flex w-full max-w-5xl items-center justify-between py-5">
            <div className={`bb-logo text-2xl ${titleGradient}`}>
              BrainBurst
            </div>
            <button
              type="button"
              className={backButton}
              onClick={() => setScreen("home")}
            >
              Back
            </button>
          </nav>
          <header className="my-8 text-center">
            <h1 className="bb-title text-4xl">
              <span className={titleGradient}>Class {cls}</span>
              <br />
              Social Studies Topics
            </h1>
            <p className={`mt-3 ${muted}`}>
              Choose the topics for your{" "}
              <b className="text-white">{topicCount}</b>-question quiz.
            </p>
          </header>
          <button
            type="button"
            className="rounded-full border-[1.5px] border-teal-500 bg-[#12121c] px-6 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-teal-500 hover:text-black"
            onClick={toggleAllTopics}
          >
            {selectedTopics.length === allTopics.length
              ? "Clear All Topics"
              : "Select All Topics"}
          </button>
          <p className={`my-3 text-sm ${muted}`}>
            {selectedTopics.length} of {allTopics.length} topics selected
          </p>
          <div className={topicGrid}>
            {DATA.topics.map((topic, index) => {
              const amount = (
                (DATA.bank[cls] ?? {})["Social Studies"] ?? []
              ).filter((item) => item.topic === topic.name).length;
              const selected = selectedTopics.includes(topic.name);
              return (
                <button
                  key={topic.name}
                  type="button"
                  onClick={() => toggleTopic(topic.name)}
                  className={`group relative w-full overflow-hidden rounded-[20px] border bg-[#12121c] p-6 text-left transition duration-300 hover:-translate-y-2 hover:-rotate-1 ${selected ? "ring-2" : "border-[#2e2e42]"}`}
                  style={{
                    borderColor: selected ? topic.color : undefined,
                    animation: `bb-up .5s ease ${index * 0.1}s both`,
                    ...(selected
                      ? {
                          boxShadow: `0 0 0 2px ${topic.color},0 14px 34px ${topic.color}55`,
                        }
                      : {}),
                  }}
                >
                  <span
                    className="mb-3.5 grid h-[50px] w-[50px] place-items-center rounded-[14px] text-[22px] font-black text-black transition duration-500 group-hover:rotate-180"
                    style={{
                      backgroundColor: topic.color,
                      fontFamily: "Orbitron,sans-serif",
                    }}
                  >
                    {topic.letter}
                  </span>
                  <h3 className="text-lg font-semibold">{topic.name}</h3>
                  <p className="mt-1 text-[13px] text-[#a1a1b5]">
                    {topic.desc}
                  </p>
                  <p className="mt-2 text-sm text-white">{amount} questions</p>
                  {selected && (
                    <span
                      className="absolute right-3.5 top-3.5 grid h-7 w-7 place-items-center rounded-full text-sm font-bold text-black"
                      style={{ backgroundColor: topic.color }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={`${buttonClass} bb-btn-gradient mt-10 max-w-[340px]`}
            disabled={selectedTopics.length === 0}
            onClick={() => {
              if (selectedTopics.length)
                startQuiz(
                  Number(cls),
                  "Social Studies",
                  topicCount,
                  selectedTopics,
                );
            }}
          >
            {selectedTopics.length === 0
              ? "Select at least one topic"
              : `Start Quiz with ${selectedTopics.length} topic${selectedTopics.length === 1 ? "" : "s"}`}
          </button>
        </section>
      )}

      {screen === "quiz" && lastQuiz && (
        <section className={screenClass}>
          <div className="w-full max-w-[640px] pt-6">
            {!finished && currentQuestion && (
              <article
                key={questionIndex}
                className={`${panelClass} animate-[bb-up_.5s_ease_both]`}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[#a1a1b5]">
                  <span>
                    Class {lastQuiz.cls} · {lastQuiz.subject}
                  </span>
                  <button
                    type="button"
                    className={backButton}
                    onClick={() => setScreen("home")}
                  >
                    Quit
                  </button>
                </div>
                <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#1f1f2b]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400 transition-all duration-500"
                    style={{
                      width: `${(questionIndex / questions.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="mb-3 flex items-center justify-between gap-3 text-sm text-[#a1a1b5]">
                  <span>
                    Question {questionIndex + 1} of {questions.length}
                  </span>
                  <span>Score {score}</span>
                </div>
                {notice && (
                  <p className="mb-2 text-[13px] text-amber-300">{notice}</p>
                )}
                <h2 className="my-4 text-[21px] font-semibold leading-relaxed">
                  {currentQuestion.q}
                </h2>
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const correct = option === currentQuestion.answer;
                    const isPicked = option === picked;
                    const stateClass =
                      picked === null
                        ? "border-[#3a3a52] bg-[#101018] hover:translate-x-2 hover:border-violet-500"
                        : correct
                          ? "border-green-500 bg-green-950"
                          : isPicked
                            ? "border-red-500 bg-red-950 animate-[bb-shake_.45s]"
                            : "border-[#3a3a52] bg-[#101018] opacity-50";
                    const marker =
                      picked !== null && correct
                        ? "✓"
                        : picked !== null && isPicked
                          ? "✗"
                          : "ABCD"[index];
                    return (
                      <button
                        key={`${option}-${index}`}
                        type="button"
                        disabled={picked !== null}
                        onClick={() => answerQuestion(option)}
                        className={`bb-option flex items-center gap-3 rounded-[14px] border-[1.5px] p-3 text-left text-[15px] font-medium transition ${stateClass}`}
                        style={{ animationDelay: `${index * 0.08}s` }}
                      >
                        <b
                          className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg text-black"
                          style={{
                            backgroundColor:
                              BADGE_COLORS[index % BADGE_COLORS.length],
                          }}
                        >
                          {marker}
                        </b>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
                {picked !== null && (
                  <button
                    type="button"
                    className={`${buttonClass} bb-btn-gradient`}
                    onClick={nextQuestion}
                  >
                    {questionIndex + 1 === questions.length
                      ? "See Result"
                      : "Next"}
                  </button>
                )}
              </article>
            )}

            {finished && (
              <article className={`${panelClass} text-center`}>
                <h2 className="text-[26px] font-bold">
                  {percentage >= 80
                    ? "Excellent!"
                    : percentage >= 50
                      ? "Good job!"
                      : "Keep practising!"}
                </h2>
                <div
                  className="mx-auto my-6 grid h-40 w-40 place-items-center rounded-full [animation:bb-score-in_.8s_ease_both]"
                  style={{
                    background: `conic-gradient(#8b5cf6 0,#ec4899 ${percentage * 1.8}deg,#f59e0b ${percentage * 3.6}deg,#1f1f2b ${percentage * 3.6}deg)`,
                  }}
                >
                  <div className="grid h-32 w-32 content-center rounded-full bg-[#0b0b12]">
                    <strong className="bb-title text-[28px]">
                      {score}/{questions.length}
                    </strong>
                    <span className="text-sm text-[#a1a1b5]">
                      {percentage}%
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`${buttonClass} bb-btn-gradient`}
                  onClick={() =>
                    startQuiz(
                      lastQuiz.cls,
                      lastQuiz.subject,
                      lastQuiz.n,
                      lastQuiz.topics,
                    )
                  }
                >
                  Try Again
                </button>
                <button
                  type="button"
                  className="mt-3 w-full rounded-2xl border border-[#3a3a52] bg-[#1f1f2b] px-4 py-4 font-semibold text-white transition hover:border-violet-500"
                  onClick={() => setScreen("home")}
                >
                  Back to Home
                </button>
              </article>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
