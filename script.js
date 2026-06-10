const DATA_INICIO = new Date("2023-08-27T20:00:00");

const screens = {
  player: document.querySelector("#player-section"),
  timeline: document.querySelector("#timeline-section"),
  game: document.querySelector("#game-section"),
  surprise: document.querySelector("#surprise-section")
};

const player = {
  isPlaying: false,
  isShuffle: false,
  isRepeat: false,
  duration: 248,
  elapsed: 0,
  timer: null
};

const words = ["PARCEIRA", "LINDA", "INTELIGENTE"];
const maxAttempts = 6;
const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const messages = [
  "Quase lá. Seu coração já sabe essa.",
  "Boa tentativa. Agora vai com calma e carinho.",
  "Tem letra brilhando no caminho.",
  "Você está pertinho da resposta bonita.",
  "Respira. A palavra também está te procurando."
];

let currentWordIndex = 0;
let currentAttempt = 0;
let currentGuess = "";
let gameLocked = false;
let solvedWords = 0;

const playBtn = document.querySelector("#play-btn");
const shuffleBtn = document.querySelector("#shuffle-btn");
const repeatBtn = document.querySelector("#repeat-btn");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const currentTime = document.querySelector("#current-time");
const totalTime = document.querySelector("#total-time");
const storyBtn = document.querySelector("#story-btn");
const gameStartBtn = document.querySelector("#game-start-btn");
const counterValues = document.querySelectorAll("[data-unit]");
const wordGrid = document.querySelector("#word-grid");
const keyboard = document.querySelector("#keyboard");
const wordStep = document.querySelector("#word-step");
const attemptStep = document.querySelector("#attempt-step");
const gameMessage = document.querySelector("#game-message");
const giftBox = document.querySelector("#gift-box");
const giftStage = document.querySelector("#gift-stage");
const revealCard = document.querySelector("#reveal-card");

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("screen--active"));
  screens[name].classList.add("screen--active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function updatePlayerProgress() {
  progressFill.style.width = `${(player.elapsed / player.duration) * 100}%`;
  currentTime.textContent = formatTime(player.elapsed);
}

function togglePlayback() {
  player.isPlaying = !player.isPlaying;
  playBtn.setAttribute("aria-label", player.isPlaying ? "Pausar" : "Tocar");
  playBtn.innerHTML = player.isPlaying ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
  renderIcons();

  if (player.isPlaying) {
    player.timer = window.setInterval(() => {
      player.elapsed += 1;
      if (player.elapsed >= player.duration) {
        player.elapsed = player.isRepeat ? 0 : player.duration;
        if (!player.isRepeat) {
          player.isPlaying = false;
          window.clearInterval(player.timer);
          playBtn.innerHTML = '<i data-lucide="play"></i>';
          playBtn.setAttribute("aria-label", "Tocar");
          renderIcons();
        }
      }
      updatePlayerProgress();
    }, 1000);
    return;
  }

  window.clearInterval(player.timer);
}

function toggleMode(button, key, activeLabel, inactiveLabel) {
  player[key] = !player[key];
  button.classList.toggle("is-active", player[key]);
  button.setAttribute("aria-pressed", String(player[key]));
  button.setAttribute("aria-label", player[key] ? activeLabel : inactiveLabel);
}

function setProgress(event) {
  const rect = progressTrack.getBoundingClientRect();
  const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
  player.elapsed = Math.round(player.duration * ratio);
  updatePlayerProgress();
}

function addMonths(date, months) {
  const copy = new Date(date);
  const originalDay = copy.getDate();
  copy.setMonth(copy.getMonth() + months);

  if (copy.getDate() !== originalDay) {
    copy.setDate(0);
  }

  return copy;
}

function diffFromStart(start, end) {
  let years = end.getFullYear() - start.getFullYear();
  let yearAnchor = new Date(start);
  yearAnchor.setFullYear(start.getFullYear() + years);

  if (yearAnchor > end) {
    years -= 1;
    yearAnchor.setFullYear(start.getFullYear() + years);
  }

  let months = (end.getFullYear() - yearAnchor.getFullYear()) * 12 + end.getMonth() - yearAnchor.getMonth();
  let monthAnchor = addMonths(yearAnchor, months);

  if (monthAnchor > end) {
    months -= 1;
    monthAnchor = addMonths(yearAnchor, months);
  }

  let remaining = end - monthAnchor;
  const days = Math.floor(remaining / 86400000);
  remaining -= days * 86400000;
  const hours = Math.floor(remaining / 3600000);
  remaining -= hours * 3600000;
  const minutes = Math.floor(remaining / 60000);
  remaining -= minutes * 60000;
  const seconds = Math.floor(remaining / 1000);

  return { years, months, days, hours, minutes, seconds };
}

function updateCounter() {
  const diff = diffFromStart(DATA_INICIO, new Date());

  counterValues.forEach((node) => {
    const unit = node.dataset.unit;
    const nextValue = String(diff[unit]);

    if (node.textContent !== nextValue) {
      node.classList.add("is-changing");
      window.setTimeout(() => {
        node.textContent = nextValue;
        node.classList.remove("is-changing");
      }, 150);
    }
  });
}

function createObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.22 });

  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
}

function activeWord() {
  return words[currentWordIndex];
}

function renderGrid() {
  const wordLength = activeWord().length;
  wordGrid.innerHTML = "";
  wordGrid.style.gridTemplateRows = `repeat(${maxAttempts}, auto)`;

  for (let row = 0; row < maxAttempts; row += 1) {
    const rowElement = document.createElement("div");
    rowElement.className = "word-row";
    rowElement.style.gridTemplateColumns = `repeat(${wordLength}, auto)`;

    for (let col = 0; col < wordLength; col += 1) {
      const cell = document.createElement("span");
      cell.className = "letter-cell";
      cell.setAttribute("role", "gridcell");
      cell.dataset.row = row;
      cell.dataset.col = col;
      rowElement.appendChild(cell);
    }

    wordGrid.appendChild(rowElement);
  }
}

function renderKeyboard() {
  keyboard.innerHTML = "";

  keyboardRows.forEach((row, rowIndex) => {
    const rowElement = document.createElement("div");
    rowElement.className = "key-row";

    if (rowIndex === 2) {
      rowElement.appendChild(createKey("ENTER", "key-wide"));
    }

    row.split("").forEach((letter) => rowElement.appendChild(createKey(letter)));

    if (rowIndex === 2) {
      rowElement.appendChild(createKey("⌫", "key-wide"));
    }

    keyboard.appendChild(rowElement);
  });
}

function createKey(label, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `key ${extraClass}`.trim();
  button.textContent = label;
  button.dataset.key = label;
  button.addEventListener("click", () => handleKey(label));
  return button;
}

function syncGuessToGrid() {
  const cells = [...wordGrid.querySelectorAll(`[data-row="${currentAttempt}"]`)];
  cells.forEach((cell, index) => {
    cell.textContent = currentGuess[index] || "";
    cell.classList.toggle("is-filled", Boolean(currentGuess[index]));
  });
}

function updateGameMeta() {
  wordStep.textContent = `Palavra ${currentWordIndex + 1} de ${words.length}`;
  attemptStep.textContent = `Tentativa ${currentAttempt + 1} de ${maxAttempts}`;
}

function handleKey(key) {
  if (gameLocked) {
    return;
  }

  if (key === "ENTER") {
    submitGuess();
    return;
  }

  if (key === "⌫" || key === "BACKSPACE") {
    currentGuess = currentGuess.slice(0, -1);
    syncGuessToGrid();
    return;
  }

  if (/^[A-Z]$/.test(key) && currentGuess.length < activeWord().length) {
    currentGuess += key;
    syncGuessToGrid();
  }
}

function submitGuess() {
  const target = activeWord();

  if (currentGuess.length !== target.length) {
    gameMessage.textContent = `Essa palavra tem ${target.length} letras.`;
    return;
  }

  paintAttempt(currentGuess, target);

  if (currentGuess === target) {
    solvedWords += 1;
    gameLocked = true;
    gameMessage.textContent = solvedWords === words.length
      ? "Você acertou tudo. O presente está liberado."
      : "Acertou. Eu disse que você brilhava.";

    window.setTimeout(() => {
      if (solvedWords === words.length) {
        showScreen("surprise");
        return;
      }

      currentWordIndex += 1;
      resetWord();
    }, 1100);
    return;
  }

  currentAttempt += 1;
  currentGuess = "";

  if (currentAttempt >= maxAttempts) {
    gameLocked = true;
    gameMessage.textContent = `A palavra era ${target}. Vamos para a próxima com carinho.`;
    window.setTimeout(() => {
      solvedWords += 1;
      if (currentWordIndex === words.length - 1) {
        showScreen("surprise");
        return;
      }
      currentWordIndex += 1;
      resetWord();
    }, 1400);
    return;
  }

  gameMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
  updateGameMeta();
}

function paintAttempt(guess, target) {
  const targetLetters = target.split("");
  const cells = [...wordGrid.querySelectorAll(`[data-row="${currentAttempt}"]`)];
  const result = Array(guess.length).fill("absent");
  const remaining = {};

  targetLetters.forEach((letter, index) => {
    if (guess[index] === letter) {
      result[index] = "correct";
      return;
    }
    remaining[letter] = (remaining[letter] || 0) + 1;
  });

  guess.split("").forEach((letter, index) => {
    if (result[index] === "correct") {
      return;
    }

    if (remaining[letter]) {
      result[index] = "present";
      remaining[letter] -= 1;
    }
  });

  cells.forEach((cell, index) => {
    const state = result[index];
    cell.classList.add(state);
    updateKeyState(guess[index], state);
  });
}

function updateKeyState(letter, state) {
  const key = keyboard.querySelector(`[data-key="${letter}"]`);
  const rank = { absent: 1, present: 2, correct: 3 };
  const current = key.dataset.rank ? Number(key.dataset.rank) : 0;

  if (rank[state] > current) {
    key.classList.remove("absent", "present", "correct");
    key.classList.add(state);
    key.dataset.rank = rank[state];
  }
}

function resetWord() {
  currentAttempt = 0;
  currentGuess = "";
  gameLocked = false;
  renderGrid();
  renderKeyboard();
  updateGameMeta();
  gameMessage.textContent = "Nova palavra desbloqueada. Vai com tudo.";
}

function openGift() {
  giftBox.classList.add("is-open");
  giftBox.disabled = true;

  if (window.confetti) {
    window.confetti({ particleCount: 130, spread: 72, origin: { y: 0.62 }, colors: ["#6f1d35", "#c98b92", "#fff8f1", "#e9c46a"] });
    window.setTimeout(() => window.confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } }), 260);
    window.setTimeout(() => window.confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } }), 320);
  }

  window.setTimeout(() => {
    giftStage.style.display = "none";
    revealCard.classList.add("is-visible");
    revealCard.setAttribute("aria-hidden", "false");
  }, 780);
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function bindEvents() {
  playBtn.addEventListener("click", togglePlayback);
  shuffleBtn.addEventListener("click", () => toggleMode(shuffleBtn, "isShuffle", "Aleatório ativado", "Ativar aleatório"));
  repeatBtn.addEventListener("click", () => toggleMode(repeatBtn, "isRepeat", "Repetição ativada", "Ativar repetição"));
  progressTrack.addEventListener("click", setProgress);
  storyBtn.addEventListener("click", () => showScreen("timeline"));
  gameStartBtn.addEventListener("click", () => showScreen("game"));
  giftBox.addEventListener("click", openGift);

  document.addEventListener("keydown", (event) => {
    const key = event.key.toUpperCase();
    if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
      handleKey(key);
    }
  });
}

function init() {
  totalTime.textContent = formatTime(player.duration);
  updatePlayerProgress();
  updateCounter();
  window.setInterval(updateCounter, 1000);
  createObserver();
  renderGrid();
  renderKeyboard();
  updateGameMeta();
  bindEvents();
  renderIcons();
}

window.addEventListener("DOMContentLoaded", init);
