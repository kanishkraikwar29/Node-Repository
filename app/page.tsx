"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Level = "Beginner" | "Intermediate" | "Advanced";
// [level, question, correctAnswer, wrong1, wrong2, wrong3]
type Q = [Level, string, string, string, string, string];

const B: Level = "Beginner", I: Level = "Intermediate", A: Level = "Advanced";

// Class -> Subject -> Chapter -> questions. Add more entries freely.
const BASE: Record<string, Record<string, Record<string, Q[]>>> = {
  "Class 9": {
    Maths: {
      "Number Systems": [
        [B, "Which of these is a natural number?", "5", "0", "-3", "1/2"],
        [B, "What is √4?", "2", "4", "8", "16"],
        [I, "Which of these is irrational?", "√2", "0.5", "22/7", "3"],
        [I, "0.333... written as a fraction is?", "1/3", "3/10", "1/30", "33/100"],
        [A, "Rationalise 1/(√3+√2).", "√3 − √2", "√3 + √2", "1", "√6"],
        [A, "The decimal expansion of an irrational number is?", "Non-terminating, non-repeating", "Terminating", "Non-terminating, repeating", "Always finite"],
      ],
      Polynomials: [
        [B, "Degree of x² + 3x + 1?", "2", "1", "3", "0"],
        [B, "Which is a polynomial?", "x² + 2x", "x⁻¹ + 2", "√x + 1", "1/x"],
        [I, "Zero of p(x) = x − 5?", "5", "−5", "0", "1"],
        [I, "For p(x) = x² − 3x + 2, what is p(2)?", "0", "2", "−2", "4"],
        [A, "Factorise x² − 5x + 6.", "(x−2)(x−3)", "(x+2)(x+3)", "(x−1)(x−6)", "(x+1)(x−6)"],
        [A, "x³ + y³ equals?", "(x+y)(x² − xy + y²)", "(x+y)(x² + xy + y²)", "(x−y)(x² + xy + y²)", "(x+y)³"],
      ],
    },
    Science: {
      Motion: [
        [B, "SI unit of speed?", "m/s", "m", "kg", "N"],
        [B, "Distance is a ___ quantity.", "Scalar", "Vector", "Tensor", "Constant"],
        [I, "A car moves at 20 m/s for 5 s. Distance covered?", "100 m", "25 m", "4 m", "50 m"],
        [I, "Velocity goes 0 → 10 m/s in 5 s. Acceleration?", "2 m/s²", "5 m/s²", "50 m/s²", "0.5 m/s²"],
        [A, "u = 0, a = 2 m/s², s = 25 m. Final velocity?", "10 m/s", "5 m/s", "25 m/s", "50 m/s"],
        [A, "The slope of a velocity–time graph gives?", "Acceleration", "Distance", "Speed", "Displacement"],
      ],
      "Atoms and Molecules": [
        [B, "Chemical symbol of sodium?", "Na", "S", "So", "N"],
        [B, "Chemical formula of water?", "H₂O", "HO₂", "H₂O₂", "OH"],
        [I, "Atomic mass of carbon?", "12 u", "6 u", "14 u", "16 u"],
        [I, "Avogadro's number is approximately?", "6.022 × 10²³", "3 × 10⁸", "9.8", "1.6 × 10⁻¹⁹"],
        [A, "Moles in 36 g of water (18 g/mol)?", "2", "1", "18", "0.5"],
        [A, "Mass of 0.5 mol CO₂ (44 g/mol)?", "22 g", "44 g", "88 g", "11 g"],
      ],
    },
  },
  "Class 10": {
    Maths: {
      "Quadratic Equations": [
        [B, "Standard form of a quadratic equation?", "ax² + bx + c = 0", "ax + b = 0", "ax³ + b = 0", "a/x + b = 0"],
        [B, "Degree of a quadratic equation?", "2", "1", "3", "4"],
        [I, "Roots of x² − 5x + 6 = 0?", "2 and 3", "−2 and −3", "1 and 6", "−1 and 6"],
        [I, "Discriminant of x² + 4x + 4?", "0", "16", "4", "−16"],
        [A, "Sum of roots of 2x² − 8x + 6 = 0?", "4", "−4", "3", "6"],
        [A, "x² + kx + 9 has equal roots. k = ?", "±6", "±3", "9", "0"],
      ],
      "Arithmetic Progressions": [
        [B, "Next term: 2, 4, 6, 8, __", "10", "9", "12", "16"],
        [B, "Common difference of 5, 8, 11?", "3", "2", "5", "8"],
        [I, "10th term of 3, 7, 11, ...?", "39", "43", "35", "40"],
        [I, "nth term of an AP?", "a + (n−1)d", "a + nd", "a·rⁿ⁻¹", "a − nd"],
        [A, "Sum of first 10 natural numbers?", "55", "50", "45", "100"],
        [A, "Sum of first 20 terms of 2, 4, 6, ...?", "420", "400", "440", "210"],
      ],
    },
    Science: {
      "Light - Reflection and Refraction": [
        [B, "Speed of light in vacuum?", "3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10⁵ m/s", "340 m/s"],
        [B, "Mirror used in vehicle headlights?", "Concave", "Convex", "Plane", "Cylindrical"],
        [I, "Power of a lens with focal length 50 cm?", "+2 D", "+0.5 D", "+5 D", "+50 D"],
        [I, "Image formed by a plane mirror is?", "Virtual and erect", "Real and inverted", "Real and erect", "Virtual and inverted"],
        [A, "Mirror formula?", "1/v + 1/u = 1/f", "v + u = f", "1/v − 1/u = f", "uv = f"],
        [A, "Object at 2F of a convex lens gives image?", "At 2F, real, inverted, same size", "At F, real, magnified", "Beyond 2F, virtual", "At infinity"],
      ],
      Electricity: [
        [B, "SI unit of electric current?", "Ampere", "Volt", "Ohm", "Watt"],
        [B, "Ohm's law?", "V = IR", "V = I/R", "P = IR", "I = VR"],
        [I, "V = 10 V, I = 2 A. Resistance?", "5 Ω", "20 Ω", "0.2 Ω", "12 Ω"],
        [I, "2 Ω and 3 Ω in series give?", "5 Ω", "1.2 Ω", "6 Ω", "1 Ω"],
        [A, "Power at 220 V with 2 A current?", "440 W", "110 W", "222 W", "218 W"],
        [A, "Two 4 Ω resistors in parallel give?", "2 Ω", "8 Ω", "4 Ω", "1 Ω"],
      ],
    },
  },
};


const EXTRA: Record<string, Record<string, Record<string, Q[]>>> = {
  "Class 8": {
    Maths: {
      "Squares and Square Roots": [
        [B, "What is the square of 7?", "49", "14", "56", "77"],
        [B, "What is √81?", "9", "8", "11", "7"],
        [I, "Which of these is a perfect square?", "144", "150", "200", "99"],
        [I, "What is √(16 × 25)?", "20", "40", "10", "400"],
        [A, "Smallest number to multiply 12 by to get a perfect square?", "3", "2", "4", "6"],
        [A, "Sum of the first 5 odd numbers?", "25", "15", "20", "30"],
      ],
      Mensuration: [
        [B, "Area of a rectangle 5 cm by 4 cm?", "20 cm²", "9 cm²", "18 cm²", "40 cm²"],
        [B, "Area of a square with side 6 cm?", "36 cm²", "24 cm²", "12 cm²", "6 cm²"],
        [I, "Area of a triangle with base 10 cm and height 6 cm?", "30 cm²", "60 cm²", "16 cm²", "20 cm²"],
        [I, "Area of a circle of radius 7 cm (π = 22/7)?", "154 cm²", "44 cm²", "49 cm²", "308 cm²"],
        [A, "Volume of a cube with side 3 cm?", "27 cm³", "9 cm³", "18 cm³", "54 cm³"],
        [A, "Volume of a cylinder, r = 7 cm, h = 10 cm (π = 22/7)?", "1540 cm³", "154 cm³", "440 cm³", "3080 cm³"],
      ],
    },
    Science: {
      "Force and Pressure": [
        [B, "SI unit of force?", "Newton", "Joule", "Pascal", "Watt"],
        [B, "A push or a pull is called?", "Force", "Energy", "Work", "Heat"],
        [I, "Pressure equals?", "Force / Area", "Force × Area", "Area / Force", "Mass / Volume"],
        [I, "SI unit of pressure?", "Pascal", "Newton", "Joule", "Watt"],
        [A, "A force of 100 N acts on 2 m². Pressure?", "50 Pa", "200 Pa", "98 Pa", "100 Pa"],
        [A, "Why do sharp knives cut easily?", "Small area gives large pressure", "Large area gives large pressure", "They weigh less", "Friction increases"],
      ],
      "Cell Structure and Functions": [
        [B, "Basic unit of life?", "Cell", "Tissue", "Organ", "Atom"],
        [B, "Who discovered the cell?", "Robert Hooke", "Isaac Newton", "Charles Darwin", "Gregor Mendel"],
        [I, "Powerhouse of the cell?", "Mitochondria", "Nucleus", "Ribosome", "Golgi body"],
        [I, "Control centre of the cell?", "Nucleus", "Vacuole", "Cell wall", "Plastid"],
        [A, "Site of photosynthesis in plant cells?", "Chloroplast", "Mitochondria", "Ribosome", "Lysosome"],
        [A, "Present in plant cells but not animal cells?", "Cell wall", "Nucleus", "Cytoplasm", "Cell membrane"],
      ],
    },
  },
  "Class 9": {
    Science: {
      Gravitation: [
        [B, "Acceleration due to gravity on Earth?", "9.8 m/s²", "8.9 m/s²", "10.8 m/s²", "98 m/s²"],
        [B, "Force that pulls objects toward the Earth?", "Gravity", "Friction", "Magnetism", "Tension"],
        [I, "Weight of a 10 kg mass (g = 10 m/s²)?", "100 N", "10 N", "1 N", "1000 N"],
        [I, "Value of g on the Moon compared to Earth?", "About one-sixth", "Equal", "Double", "One-tenth"],
        [A, "Distance between two masses doubles. Gravitational force becomes?", "One-fourth", "Half", "Double", "Four times"],
        [A, "Universal gravitational constant G is approximately?", "6.67 × 10⁻¹¹ N m²/kg²", "9.8 N m²/kg²", "6.67 × 10¹¹ N m²/kg²", "3 × 10⁸ N m²/kg²"],
      ],
    },
    "Social Science": {
      "The French Revolution": [
        [B, "The French Revolution began in?", "1789", "1815", "1757", "1857"],
        [B, "The storming of which fortress marked its start?", "Bastille", "Versailles", "Louvre", "Tuileries"],
        [I, "Slogan of the French Revolution?", "Liberty, Equality, Fraternity", "Peace, Land, Bread", "Unity, Faith, Discipline", "Truth, Duty, Honour"],
        [I, "Who was the king of France at the time?", "Louis XVI", "Louis XIV", "Napoleon", "Louis XVIII"],
        [A, "Which estate paid most of the taxes?", "Third Estate", "First Estate", "Second Estate", "None of them"],
        [A, "Which body did the Third Estate form in 1789?", "National Assembly", "Senate", "Parliament", "Directory"],
      ],
      "Physical Features of India": [
        [B, "Highest peak located in India?", "Kanchenjunga", "Mount Everest", "K2", "Nanda Devi"],
        [B, "Which ocean lies south of India?", "Indian Ocean", "Pacific Ocean", "Atlantic Ocean", "Arctic Ocean"],
        [I, "The Deccan Plateau is part of the?", "Peninsular Plateau", "Northern Plains", "Himalayas", "Coastal Plains"],
        [I, "Another name for the Western Ghats?", "Sahyadri", "Purvachal", "Shivalik", "Aravalli"],
        [A, "Which is among the oldest fold mountain ranges of India?", "Aravalli", "Himalayas", "Shivalik", "Purvanchal"],
        [A, "The Lakshadweep islands are made of?", "Coral", "Volcanic rock", "Granite", "Sand dunes"],
      ],
    },
  },
  "Class 10": {
    Science: {
      "Acids, Bases and Salts": [
        [B, "pH of a neutral solution?", "7", "0", "1", "14"],
        [B, "Acids turn blue litmus paper?", "Red", "Green", "Yellow", "Colourless"],
        [I, "Chemical formula of baking soda?", "NaHCO₃", "Na₂CO₃", "NaOH", "NaCl"],
        [I, "Which one is a strong acid?", "HCl", "CH₃COOH", "H₂CO₃", "Citric acid"],
        [A, "Chemical formula of Plaster of Paris?", "CaSO₄·½H₂O", "CaSO₄·2H₂O", "CaCO₃", "CaO"],
        [A, "Acid + base gives?", "Salt and water", "Salt and hydrogen", "Only water", "Salt and oxygen"],
      ],
    },
    "Social Science": {
      "Nationalism in India": [
        [B, "Who led the Non-Cooperation Movement?", "Mahatma Gandhi", "Jawaharlal Nehru", "Subhas Chandra Bose", "Sardar Patel"],
        [B, "Jallianwala Bagh massacre took place in?", "1919", "1920", "1930", "1857"],
        [I, "Year of the Dandi March?", "1930", "1919", "1942", "1920"],
        [I, "The Salt March ended at?", "Dandi", "Champaran", "Bardoli", "Kheda"],
        [A, "Quit India Movement was launched in?", "1942", "1930", "1920", "1947"],
        [A, "Chauri Chaura incident led Gandhi to?", "Withdraw the Non-Cooperation Movement", "Start Civil Disobedience", "Launch Quit India", "Leave the Congress"],
      ],
      "Resources and Development": [
        [B, "Black soil is best suited for?", "Cotton", "Tea", "Coffee", "Jute"],
        [B, "Alluvial soil is mainly found in?", "Northern Plains", "Deccan Plateau", "Thar Desert", "Western Ghats"],
        [I, "Which method helps prevent soil erosion?", "Contour ploughing", "Overgrazing", "Deforestation", "Mining"],
        [I, "Resources classified by origin are?", "Biotic and abiotic", "Individual and community", "Actual and potential", "Local and global"],
        [A, "Laterite soil forms under?", "High temperature and heavy rainfall", "Cold, dry conditions", "River deltas", "Volcanic eruptions"],
        [A, "Agenda 21 was adopted at?", "Rio de Janeiro Earth Summit, 1992", "Kyoto, 1997", "Stockholm, 1972", "Paris, 2015"],
      ],
    },
  },
  "Class 11": {
    Physics: {
      "Units and Measurements": [
        [B, "SI unit of length?", "Metre", "Foot", "Centimetre", "Kilogram"],
        [B, "Number of fundamental SI base units?", "7", "5", "6", "9"],
        [I, "Dimensions of velocity?", "[LT⁻¹]", "[LT⁻²]", "[L²T⁻¹]", "[MLT⁻¹]"],
        [I, "Significant figures in 0.0450?", "3", "2", "4", "5"],
        [A, "Dimensional formula of force?", "[MLT⁻²]", "[ML²T⁻²]", "[MLT⁻¹]", "[ML⁻¹T⁻²]"],
        [A, "Dimensional formula of work?", "[ML²T⁻²]", "[MLT⁻²]", "[ML²T⁻¹]", "[M²LT⁻²]"],
      ],
      "Laws of Motion": [
        [B, "Newton's first law is also called the law of?", "Inertia", "Gravity", "Momentum", "Action"],
        [B, "SI unit of momentum?", "kg m/s", "N", "kg m/s²", "J"],
        [I, "m = 5 kg, a = 4 m/s². Force?", "20 N", "9 N", "1.25 N", "0.8 N"],
        [I, "Action and reaction forces are?", "Equal and opposite", "Equal and in the same direction", "Unequal and opposite", "Zero"],
        [A, "Impulse equals?", "Change in momentum", "Change in energy", "Force × distance", "Mass × velocity"],
        [A, "A 10 N force acts on a 2 kg mass. Acceleration?", "5 m/s²", "20 m/s²", "0.2 m/s²", "8 m/s²"],
      ],
    },
    Chemistry: {
      "Some Basic Concepts of Chemistry": [
        [B, "Number of atoms in one H₂O molecule?", "3", "2", "4", "1"],
        [B, "Law of conservation of mass says mass is?", "Neither created nor destroyed", "Always created", "Always lost", "Doubled"],
        [I, "Molar mass of NaCl (Na 23, Cl 35.5)?", "58.5 g/mol", "23 g/mol", "35.5 g/mol", "82.5 g/mol"],
        [I, "Volume of 1 mole of gas at STP?", "22.4 L", "11.2 L", "24 L", "1 L"],
        [A, "Molarity is moles of solute per?", "Litre of solution", "Kg of solvent", "Litre of solvent", "100 g of solution"],
        [A, "Empirical formula of C₆H₁₂O₆?", "CH₂O", "C₂H₄O₂", "CHO", "C₃H₆O₃"],
      ],
      "Structure of Atom": [
        [B, "Who discovered the electron?", "J.J. Thomson", "Rutherford", "Bohr", "Chadwick"],
        [B, "Charge on a proton?", "Positive", "Negative", "Neutral", "Variable"],
        [I, "Who discovered the neutron?", "James Chadwick", "Goldstein", "J.J. Thomson", "Millikan"],
        [I, "Atomic number equals the number of?", "Protons", "Neutrons", "Protons plus neutrons", "Valence electrons"],
        [A, "Maximum electrons in the n = 3 shell?", "18", "8", "9", "32"],
        [A, "Which quantum number gives orbital shape?", "Azimuthal (l)", "Principal (n)", "Magnetic (m)", "Spin (s)"],
      ],
    },
    Maths: {
      Sets: [
        [B, "A set with no elements is called?", "Empty set", "Universal set", "Singleton set", "Finite set"],
        [B, "{1, 2} ∪ {2, 3} = ?", "{1, 2, 3}", "{2}", "{1, 3}", "{1, 2}"],
        [I, "If n(A) = 3, number of subsets of A?", "8", "6", "9", "3"],
        [I, "A = {1,2,3}, B = {2,3,4}. A ∩ B = ?", "{2, 3}", "{1, 4}", "{1, 2, 3, 4}", "{2, 3, 4}"],
        [A, "n(A)=10, n(B)=8, n(A∩B)=3. n(A∪B) = ?", "15", "18", "21", "11"],
        [A, "Number of proper subsets of a 4-element set?", "15", "16", "14", "8"],
      ],
      "Trigonometric Functions": [
        [B, "sin 30° = ?", "1/2", "√3/2", "1", "0"],
        [B, "sin 90° = ?", "1", "0", "1/2", "−1"],
        [I, "sin²θ + cos²θ = ?", "1", "0", "2", "sin θ"],
        [I, "180° in radians?", "π", "π/2", "2π", "π/4"],
        [A, "sin(A + B) = ?", "sinA cosB + cosA sinB", "sinA cosB − cosA sinB", "cosA cosB − sinA sinB", "sinA sinB + cosA cosB"],
        [A, "cos 2θ = ?", "1 − 2sin²θ", "2 sinθ cosθ", "1 + 2sin²θ", "sin²θ − cos²θ"],
      ],
    },
  },
  "Class 12": {
    Physics: {
      "Electric Charges and Fields": [
        [B, "SI unit of charge?", "Coulomb", "Ampere", "Volt", "Farad"],
        [B, "Like charges ___ each other.", "Repel", "Attract", "Neutralise", "Ignore"],
        [I, "Charge of an electron?", "−1.6 × 10⁻¹⁹ C", "+1.6 × 10⁻¹⁹ C", "−9.1 × 10⁻³¹ C", "1 C"],
        [I, "Coulomb force varies as?", "1/r²", "1/r", "r", "r²"],
        [A, "Distance between two charges doubles. Force becomes?", "One-fourth", "Half", "Double", "One-eighth"],
        [A, "SI unit of electric field?", "N/C", "N·C", "C/m", "J/C"],
      ],
      "Current Electricity": [
        [B, "SI unit of resistance?", "Ohm", "Ampere", "Volt", "Siemens"],
        [B, "An ammeter measures?", "Current", "Voltage", "Resistance", "Power"],
        [I, "SI unit of resistivity?", "Ω·m", "Ω/m", "Ω", "S·m"],
        [I, "In parallel, 1/R_total equals?", "Sum of 1/R values", "Sum of R values", "Product of R values", "Difference of R values"],
        [A, "Drift velocity of electrons in a conductor is of the order of?", "mm/s", "m/s", "km/s", "10⁸ m/s"],
        [A, "Kirchhoff's junction rule is based on conservation of?", "Charge", "Energy", "Momentum", "Mass"],
      ],
    },
    Chemistry: {
      Solutions: [
        [B, "A solute dissolves in a?", "Solvent", "Catalyst", "Precipitate", "Gas"],
        [B, "A solution has at least how many components?", "Two", "One", "Three", "Four"],
        [I, "Molality is moles of solute per?", "kg of solvent", "Litre of solution", "kg of solution", "Litre of solvent"],
        [I, "Raoult's law deals with?", "Vapour pressure", "Density", "Colour", "pH"],
        [A, "Colligative properties depend on?", "Number of solute particles", "Nature of the solute", "Size of solute particles", "Colour of the solution"],
        [A, "Osmotic pressure formula?", "π = CRT", "π = C/RT", "π = RT/C", "π = CR/T"],
      ],
      Electrochemistry: [
        [B, "Which device converts chemical energy to electrical energy?", "Galvanic cell", "Electrolytic cell", "Transformer", "Capacitor"],
        [B, "At the anode, ___ occurs.", "Oxidation", "Reduction", "Neutralisation", "Evaporation"],
        [I, "SI unit of conductivity?", "S/m", "Ω·m", "S", "Ω"],
        [I, "Value of Faraday's constant?", "96500 C/mol", "9650 C/mol", "6.02 × 10²³ C/mol", "22.4 C/mol"],
        [A, "The Nernst equation relates cell potential to?", "Ion concentration", "Mass of electrodes", "Size of the cell", "Colour of the solution"],
        [A, "Standard hydrogen electrode potential?", "0 V", "1 V", "−1 V", "0.76 V"],
      ],
    },
    Maths: {
      Matrices: [
        [B, "A matrix with equal rows and columns?", "Square matrix", "Row matrix", "Column matrix", "Null matrix"],
        [B, "Order of a matrix with 2 rows and 3 columns?", "2 × 3", "3 × 2", "2 × 2", "6"],
        [I, "Diagonal elements of an identity matrix?", "1", "0", "2", "−1"],
        [I, "Transpose of a 2 × 3 matrix has order?", "3 × 2", "2 × 3", "3 × 3", "2 × 2"],
        [A, "Determinant of [[1, 2], [3, 4]]?", "−2", "2", "10", "−10"],
        [A, "A is 3 × 2, B is 2 × 4. Order of AB?", "3 × 4", "2 × 2", "3 × 2", "4 × 3"],
      ],
      "Continuity and Differentiability": [
        [B, "d/dx (x²) = ?", "2x", "x", "x²", "2"],
        [B, "Derivative of a constant?", "0", "1", "The constant", "x"],
        [I, "d/dx (sin x) = ?", "cos x", "−cos x", "−sin x", "tan x"],
        [I, "d/dx (eˣ) = ?", "eˣ", "x·eˣ⁻¹", "e", "1/x"],
        [A, "d/dx (log x) = ?", "1/x", "x", "eˣ", "−1/x"],
        [A, "d/dx (x sin x) = ?", "sin x + x cos x", "cos x", "x cos x", "sin x − x cos x"],
      ],
    },
  },
};

// Merge EXTRA into BASE
const DATA: Record<string, Record<string, Record<string, Q[]>>> = (() => {
  const out: Record<string, Record<string, Record<string, Q[]>>> = {};
  for (const src of [BASE, EXTRA])
    for (const c of Object.keys(src)) {
      out[c] = out[c] ?? {};
      for (const s of Object.keys(src[c])) out[c][s] = { ...(out[c][s] ?? {}), ...src[c][s] };
    }
  return out;
})();

const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_COLOR: Record<Level, string> = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" };
const BADGE = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b"];
const ALL = "All Chapters";
const CLASSES = Object.keys(DATA).sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));

const shuffle = <T,>(a: T[]) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

type Item = { q: string; options: string[]; answer: string };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Poppins:wght@400;500;600;700&display=swap');
.st-root{font-family:'Poppins',system-ui,-apple-system,sans-serif}
.st-root button,.st-root input{font-family:inherit}
@keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-40px) scale(1.15)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes dropIn{from{opacity:0;transform:translateY(-10px) scaleY(.92)}to{opacity:1;transform:translateY(0) scaleY(1)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.04)}100%{transform:scale(1)}}
@keyframes glow{0%,100%{box-shadow:0 0 18px rgba(139,92,246,.35)}50%{box-shadow:0 0 34px rgba(236,72,153,.55)}}
@keyframes fall{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
@keyframes scoreIn{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
.st-title{font-family:'Orbitron','Poppins',sans-serif;background:linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b,#06b6d4,#8b5cf6);background-size:300% 300%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gradientShift 6s ease infinite}
.st-card{animation:fadeUp .6s ease backwards,glow 4s ease-in-out infinite}
.st-field{animation:fadeUp .5s ease backwards}
.st-label{display:block;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#a78bfa}
.st-input{width:100%;padding:13px 14px;margin-top:8px;background:#14141c;color:#fff;border:1.5px solid #3a3a4d;border-radius:12px;font-size:15px;font-weight:500;transition:border-color .25s,box-shadow .25s}
.st-input:focus{outline:none;border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.3)}
.st-input[type=number]{-moz-appearance:textfield;appearance:textfield}
.st-input[type=number]::-webkit-outer-spin-button,.st-input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.st-select{width:100%;text-align:left;padding:13px 14px;margin-top:8px;background:linear-gradient(#14141c,#14141c) padding-box,linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b) border-box;border:1.5px solid transparent;border-radius:12px;color:#fff;font-size:15px;font-weight:500;cursor:pointer;transition:box-shadow .25s,transform .2s}
.st-select:hover{box-shadow:0 0 18px rgba(139,92,246,.4);transform:translateY(-1px)}
.st-select.open{box-shadow:0 0 22px rgba(236,72,153,.45)}
.st-menu{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:60;max-height:240px;overflow-y:auto;padding:6px;background:rgba(14,14,22,.97);backdrop-filter:blur(14px);border:1px solid #3a3a4d;border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.7);transform-origin:top;animation:dropIn .2s ease}
.st-item{padding:10px 12px;border-radius:9px;font-size:14.5px;font-weight:500;cursor:pointer;color:#d1d5db;transition:background .15s,color .15s,padding .15s}
.st-item:hover{background:linear-gradient(90deg,rgba(139,92,246,.35),rgba(236,72,153,.25));color:#fff;padding-left:18px}
.st-item.on{background:linear-gradient(90deg,#8b5cf6,#ec4899);color:#fff;font-weight:600}
.st-menu::-webkit-scrollbar{width:6px}.st-menu::-webkit-scrollbar-thumb{background:#4b4b63;border-radius:9px}
.st-btn{background:linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b);background-size:200% 200%;animation:gradientShift 4s ease infinite;transition:transform .2s,box-shadow .2s;letter-spacing:.5px}
.st-btn:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 10px 25px rgba(236,72,153,.4)}
.st-btn:active{transform:scale(.97)}
.st-opt{transition:transform .2s,border-color .2s,background .3s;animation:fadeUp .5s ease backwards}
.st-opt:not(:disabled):hover{transform:translateX(8px);border-color:#8b5cf6}
.st-right{animation:pop .5s ease}
.st-wrong{animation:shake .45s ease}
`;

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className={`st-select ${open ? "open" : ""}`} onClick={() => setOpen(!open)}>
        {value}
      </button>
      {open && (
        <div className="st-menu">
          {options.map((o) => (
            <div key={o} className={`st-item ${o === value ? "on" : ""}`} onClick={() => { onChange(o); setOpen(false); }}>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  const [cls, setCls] = useState(CLASSES[0]);
  const subjects = Object.keys(DATA[cls]);
  const [subject, setSubject] = useState(subjects[0]);
  const chapters = Object.keys(DATA[cls][subject] ?? {});
  const [chapter, setChapter] = useState(ALL);
  const [level, setLevel] = useState<Level>("Beginner");
  const [count, setCount] = useState(5);

  const [quiz, setQuiz] = useState<Item[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  const pool = useMemo(() => {
    const ch = DATA[cls][subject] ?? {};
    const sel = chapter === ALL ? Object.values(ch).flat() : ch[chapter] ?? [];
    return sel.filter((x) => x[0] === level);
  }, [cls, subject, chapter, level]);

  const onClass = (c: string) => { setCls(c); setSubject(Object.keys(DATA[c])[0]); setChapter(ALL); };
  const onSubject = (s: string) => { setSubject(s); setChapter(ALL); };

  const start = () => {
    if (pool.length === 0) return setError("No questions for this selection yet.");
    const n = Math.max(1, Math.min(count, pool.length));
    setError(n < count ? `Only ${pool.length} question(s) available. Starting with ${n}.` : "");
    setQuiz(shuffle(pool).slice(0, n).map((x) => ({
      q: x[1], answer: x[2], options: shuffle([x[2], x[3], x[4], x[5]]),
    })));
    setIdx(0); setPicked(null); setScore(0);
  };

  const choose = (o: string) => {
    if (picked || !quiz) return;
    setPicked(o);
    if (o === quiz[idx].answer) setScore((s) => s + 1);
  };

  const done = !!quiz && idx >= quiz.length;
  const pct = quiz ? Math.round((score / quiz.length) * 100) : 0;

  const card: React.CSSProperties = { background: "rgba(17,17,24,.85)", backdropFilter: "blur(10px)", border: "1px solid #2e2e3e", borderRadius: 20, padding: 28 };
  const btn: React.CSSProperties = { padding: "14px 22px", color: "#fff", border: "none", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 15 };

  const orbs = [
    { c: "#8b5cf6", t: "8%", l: "6%", s: 260, d: 9 },
    { c: "#ec4899", t: "55%", l: "78%", s: 300, d: 11 },
    { c: "#06b6d4", t: "75%", l: "10%", s: 220, d: 13 },
    { c: "#f59e0b", t: "15%", l: "70%", s: 160, d: 10 },
  ];

  return (
    <main className="st-root" style={{ minHeight: "100vh", background: "#000", color: "#fff", display: "flex", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>

      {orbs.map((o, i) => (
        <div key={i} style={{ position: "absolute", top: o.t, left: o.l, width: o.s, height: o.s, borderRadius: "50%", background: o.c, filter: "blur(90px)", opacity: 0.22, animation: `float ${o.d}s ease-in-out infinite`, pointerEvents: "none" }} />
      ))}

      {done && pct >= 50 && Array.from({ length: 36 }).map((_, i) => (
        <span key={i} style={{ position: "fixed", top: 0, left: `${(i * 2.8) % 100}%`, width: 9, height: 14, background: BADGE[i % 4], borderRadius: 2, animation: `fall ${2.5 + (i % 5) * 0.5}s linear ${(i % 7) * 0.2}s infinite`, zIndex: 5, pointerEvents: "none" }} />
      ))}

      <div style={{ width: "100%", maxWidth: 640, position: "relative", zIndex: 2 }}>
        <h1 className="st-title" style={{ fontSize: 38, fontWeight: 800, margin: "18px 0 8px", textAlign: "center", letterSpacing: 2 }}>
          BrainBurst
        </h1>
        <p style={{ textAlign: "center", color: "#9ca3af", marginBottom: 24, fontWeight: 400, animation: "fadeUp .8s ease backwards" }}>
          Pick your class, chapter and level, then test yourself.
        </p>

        {!quiz && (
          <div className="st-card" style={{ ...card, display: "grid", gap: 18 }}>
            <div className="st-field" style={{ animationDelay: "0s" }}>
              <span className="st-label">Class</span>
              <Select value={cls} options={CLASSES} onChange={onClass} />
            </div>
            <div className="st-field" style={{ animationDelay: ".08s" }}>
              <span className="st-label">Subject</span>
              <Select value={subject} options={subjects} onChange={onSubject} />
            </div>
            <div className="st-field" style={{ animationDelay: ".16s" }}>
              <span className="st-label">Chapter</span>
              <Select value={chapter} options={[ALL, ...chapters]} onChange={setChapter} />
            </div>

            <div className="st-field" style={{ animationDelay: ".24s" }}>
              <span className="st-label">Level</span>
              <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                {LEVELS.map((l) => {
                  const on = l === level;
                  return (
                    <button key={l} onClick={() => setLevel(l)} style={{ flex: 1, minWidth: 110, padding: 12, borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 14, color: on ? "#000" : "#fff", background: on ? LEVEL_COLOR[l] : "#14141c", border: `1.5px solid ${LEVEL_COLOR[l]}`, transition: "all .25s", transform: on ? "scale(1.05)" : "scale(1)", boxShadow: on ? `0 0 20px ${LEVEL_COLOR[l]}88` : "none" }}>
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="st-field" style={{ animationDelay: ".32s" }}>
              <span className="st-label">Number of questions <span style={{ color: "#6b7280", textTransform: "none", letterSpacing: 0 }}>(available: {pool.length})</span></span>
              <input className="st-input" type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} />
            </div>

            {error && <p style={{ color: "#f87171", margin: 0, fontSize: 14 }}>{error}</p>}
            <button className="st-btn" style={btn} onClick={start}>Generate Quiz</button>
          </div>
        )}

        {quiz && !done && (
          <div key={idx} className="st-card" style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ color: "#9ca3af", fontSize: 14 }}>{cls} · {subject}</span>
              <span style={{ background: LEVEL_COLOR[level], color: "#000", padding: "3px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{level}</span>
            </div>
            <div style={{ height: 8, background: "#1f1f2b", borderRadius: 99, margin: "14px 0", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((idx + (picked ? 1 : 0)) / quiz.length) * 100}%`, background: "linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b)", transition: "width .6s ease" }} />
            </div>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: 14 }}>Question {idx + 1} of {quiz.length} · Score {score}</p>
            {error && <p style={{ color: "#fbbf24", fontSize: 13, margin: "6px 0 0" }}>{error}</p>}
            <h2 style={{ fontSize: 21, fontWeight: 600, margin: "14px 0 18px", lineHeight: 1.45 }}>{quiz[idx].q}</h2>

            <div style={{ display: "grid", gap: 11 }}>
              {quiz[idx].options.map((o, k) => {
                const right = o === quiz[idx].answer;
                const isPicked = o === picked;
                const bg = !picked ? "#14141c" : right ? "#14532d" : isPicked ? "#7f1d1d" : "#14141c";
                const bd = !picked ? "#3a3a4d" : right ? "#22c55e" : isPicked ? "#ef4444" : "#3a3a4d";
                return (
                  <button key={o} disabled={!!picked} onClick={() => choose(o)}
                    className={`st-opt ${picked && right ? "st-right" : ""} ${picked && isPicked && !right ? "st-wrong" : ""}`}
                    style={{ animationDelay: `${k * 0.08}s`, display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: 13, background: bg, color: "#fff", border: `1.5px solid ${bd}`, borderRadius: 12, cursor: picked ? "default" : "pointer", fontSize: 15, fontWeight: 500, opacity: picked && !right && !isPicked ? 0.5 : 1 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: BADGE[k], display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>
                      {picked && right ? "✓" : picked && isPicked ? "✗" : String.fromCharCode(65 + k)}
                    </span>
                    {o}
                  </button>
                );
              })}
            </div>

            {picked && (
              <button className="st-btn" style={{ ...btn, marginTop: 20, width: "100%" }} onClick={() => { setIdx(idx + 1); setPicked(null); }}>
                {idx + 1 === quiz.length ? "See Result" : "Next"}
              </button>
            )}
          </div>
        )}

        {done && quiz && (
          <div className="st-card" style={{ ...card, textAlign: "center" }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{pct >= 80 ? "Excellent!" : pct >= 50 ? "Good job!" : "Keep practicing!"}</h2>
            <div style={{ width: 160, height: 160, borderRadius: "50%", margin: "22px auto", display: "grid", placeItems: "center", background: `conic-gradient(#8b5cf6 0, #ec4899 ${pct * 1.8}deg, #f59e0b ${pct * 3.6}deg, #1f1f2b ${pct * 3.6}deg)`, animation: "scoreIn .8s ease both" }}>
              <div style={{ width: 128, height: 128, borderRadius: "50%", background: "#0b0b12", display: "grid", placeItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Orbitron','Poppins',sans-serif", fontSize: 30, fontWeight: 800 }}>{score}/{quiz.length}</div>
                  <div style={{ color: "#9ca3af", fontSize: 14 }}>{pct}%</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="st-btn" style={btn} onClick={start}>Retry</button>
              <button style={{ ...btn, background: "#1f1f2b", border: "1px solid #3a3a4d" }} onClick={() => setQuiz(null)}>New Quiz</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}