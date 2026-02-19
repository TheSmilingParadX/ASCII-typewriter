"use strict";

// ── State ──────────────────────────────────────────
let text = "";

// ── DOM refs ───────────────────────────────────────
const output    = document.getElementById("output");
const cursor    = document.getElementById("cursor");
const charCount = document.getElementById("charCount");
const ripBtn    = document.getElementById("ripBtn");
const paper     = document.getElementById("paper");
const trashArea = document.getElementById("trashArea");
const ripFlash  = document.getElementById("ripFlash");
const paperShred= document.getElementById("paperShred");

// ── QWERTY Layout ──────────────────────────────────
const ROWS = [
  ["1","2","3","4","5","6","7","8","9","0","-","="],
  ["Q","W","E","R","T","Y","U","I","O","P","[","]","\\"],
  ["A","S","D","F","G","H","J","K","L",";","'"],
  ["Z","X","C","V","B","N","M",",",".","/"],
];

// Shift variants for number row
const SHIFT_MAP = {
  "1":"!","2":"@","3":"#","4":"$","5":"%",
  "6":"^","7":"&","8":"*","9":"(","0":")",
  "-":"_","=":"+","[":"{","]":"}","\\":"|",
  ";":":","'":"\"",",":"<",".":">","/":"?"
};

// ── ASCII Art Characters ────────────────────────────
const ASCII_CHARS = [
  // Lines & corners
  "─","│","┼","┌","┐","└","┘","├","┤","┬","┴",
  // Doubles
  "═","║","╔","╗","╚","╝","╠","╣","╦","╩","╬",
  // Diagonals / slashes
  "/","\\","_","|",
  // Shading blocks
  "░","▒","▓","█","▀","▄","▌","▐",
  // Misc symbols
  "*","#","@","~","^","<",">","±","×","÷",
  // Faces / classic
  ":",")","-","(","D","P","O","^","v",
  // Arrows
  "←","→","↑","↓","↔","↕","⇒","⇐","⇑","⇓",
  // Decorative
  "·","•","◦","◉","○","●","◆","◇","★","☆",
  "♠","♣","♥","♦","♪","♫","☺","☻","✦","✧"
];

// ── Build QWERTY keyboard ──────────────────────────
function buildQwerty() {
  const container = document.getElementById("qwerty");

  ROWS.forEach((row, ri) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "key-row";

    // slight indent for each row
    rowDiv.style.paddingLeft = `${ri * 18}px`;

    row.forEach(char => {
      const btn = document.createElement("button");
      btn.className = "key";

      const shifted = SHIFT_MAP[char];
      if (shifted) {
        btn.classList.add("key-num");
        btn.innerHTML = `<span class="key-top">${shifted}</span>${char}`;
        btn.dataset.char  = char;
        btn.dataset.shift = shifted;
      } else {
        btn.textContent = char;
        btn.dataset.char = char.toLowerCase();
      }

      btn.addEventListener("click", () => {
        typeChar(btn.dataset.char);
        animateKey(btn);
      });

      // Right-click / contextmenu → type shifted version
      if (shifted) {
        btn.addEventListener("contextmenu", e => {
          e.preventDefault();
          typeChar(btn.dataset.shift);
          animateKey(btn);
        });
        btn.title = `Left-click: ${char}  |  Right-click: ${shifted}`;
      }

      rowDiv.appendChild(btn);
    });

    container.appendChild(rowDiv);
  });
}

// ── Build ASCII Palette ────────────────────────────
function buildPalette() {
  const container = document.getElementById("paletteKeys");

  ASCII_CHARS.forEach(ch => {
    const btn = document.createElement("button");
    btn.className = "key ascii-key";
    btn.textContent = ch;
    btn.dataset.char = ch;
    btn.title = `Insert: ${ch}`;
    btn.addEventListener("click", () => {
      typeChar(ch);
      animateKey(btn);
    });
    container.appendChild(btn);
  });
}

// ── Build Utility row listeners ────────────────────
function bindUtilRow() {
  document.querySelectorAll(".util-row .key").forEach(btn => {
    btn.addEventListener("click", () => {
      const ch = btn.dataset.char;
      typeChar(ch === "\\n" ? "\n" : ch);
      animateKey(btn);
    });
  });
}

// ── Type a character ───────────────────────────────
function typeChar(ch) {
  text += ch;
  renderOutput();
  updateCount();
  playTypeSound();
}

// ── Render ─────────────────────────────────────────
function renderOutput() {
  output.textContent = text;
  // Scroll paper to bottom
  paper.scrollTop = paper.scrollHeight;
}

function updateCount() {
  charCount.textContent = `${text.length} char${text.length !== 1 ? "s" : ""}`;
}

// ── Animate key press ──────────────────────────────
function animateKey(btn) {
  btn.classList.add("pressed");
  setTimeout(() => btn.classList.remove("pressed"), 120);
}

// ── Typing sound (Web Audio API) ──────────────────
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTypeSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Randomise pitch slightly for a real typewriter feel
    const baseFreq = 200 + Math.random() * 100;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, ctx.currentTime + 0.04);

    osc.type = "sawtooth";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (_) {}
}

function playRipSound() {
  try {
    const ctx = getAudioCtx();
    // White noise burst
    const bufSize = ctx.sampleRate * 0.35;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5);

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    // A band-pass to make it sound papery
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 1800;
    bpf.Q.value = 0.5;

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

// ── Rip the paper ──────────────────────────────────
ripBtn.addEventListener("click", () => {
  if (text === "" && paper.querySelectorAll(".shred-piece").length === 0) {
    // Nothing to rip — shake the button
    ripBtn.style.animation = "none";
    ripBtn.offsetHeight; // reflow
    ripBtn.style.animation = "";
    return;
  }

  playRipSound();

  // Flash
  ripFlash.classList.add("flash");
  setTimeout(() => ripFlash.classList.remove("flash"), 150);

  // Grab current text for shreds
  const content = text || " ";

  // Animate paper flying away
  paper.classList.add("ripping");

  // Show trash area
  trashArea.style.opacity = "1";

  // Create shred pieces from the text
  paperShred.innerHTML = "";
  const words = content.replace(/\n/g," ").trim().split(/\s+/).filter(Boolean);
  const sample = words.sort(() => Math.random() - 0.5).slice(0, 12);

  sample.forEach((word, i) => {
    const piece = document.createElement("div");
    piece.className = "shred-piece";
    piece.textContent = word.slice(0, 8);

    const angle = (Math.random() - 0.5) * 40;
    const tx    = (Math.random() - 0.5) * 160;
    const delay = 200 + i * 40;

    piece.style.transform = `rotate(${angle}deg)`;
    piece.style.transition = `opacity 0.3s ${delay}ms, transform 0.5s ${delay}ms`;

    paperShred.appendChild(piece);

    setTimeout(() => {
      piece.style.opacity = "1";
    }, delay);

    // Fly into trash
    setTimeout(() => {
      piece.style.transform = `translate(${tx}px, 120px) rotate(${angle + 90}deg) scale(0.3)`;
      piece.style.opacity = "0";
    }, delay + 200);
  });

  // Trash shake
  trashArea.classList.add("animating");
  setTimeout(() => trashArea.classList.remove("animating"), 800);

  // Reset after animation
  setTimeout(() => {
    paper.classList.remove("ripping");
    text = "";
    renderOutput();
    updateCount();
    paperShred.innerHTML = "";
    trashArea.style.opacity = "0";
  }, 700);
});

// ── Physical keyboard support ──────────────────────
document.addEventListener("keydown", e => {
  // Prevent browser shortcuts we don't want
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Backspace") { e.preventDefault(); return; } // no delete
  if (e.key === "Delete")    { e.preventDefault(); return; }

  if (e.key === "Enter") {
    e.preventDefault();
    typeChar("\n");
    highlightPhysicalKey("⏎ RETURN");
    return;
  }
  if (e.key === "Tab") {
    e.preventDefault();
    typeChar("    ");
    return;
  }
  if (e.key === " ") {
    e.preventDefault();
    typeChar(" ");
    return;
  }

  // Printable single chars
  if (e.key.length === 1) {
    typeChar(e.key);
    // Try to light up the corresponding on-screen key
    highlightPhysicalKey(e.key);
  }
});

function highlightPhysicalKey(char) {
  // Find button whose data-char matches (case-insensitive)
  const btns = document.querySelectorAll(".key");
  btns.forEach(btn => {
    if (
      btn.dataset.char === char.toLowerCase() ||
      btn.dataset.char === char ||
      btn.dataset.shift === char ||
      btn.textContent.trim() === char
    ) {
      animateKey(btn);
    }
  });
}

// ── Grain canvas ───────────────────────────────────
(function initGrain() {
  const canvas = document.getElementById("grain");
  const ctx    = canvas.getContext("2d");

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  let frame = 0;
  function draw() {
    frame++;
    if (frame % 3 !== 0) { requestAnimationFrame(draw); return; } // every 3 frames

    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      data[i] = data[i+1] = data[i+2] = v;
      data[i+3] = 18;
    }

    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();

// ── Init ───────────────────────────────────────────
buildQwerty();
buildPalette();
bindUtilRow();
updateCount();
