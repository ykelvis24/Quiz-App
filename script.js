const startBtn = document.getElementById("startBtn");
const settingsScreen = document.getElementById("settingsScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const highScoreValue = document.getElementById("highScoreValue");

const questionText = document.getElementById("questionText");
const answersContainer = document.getElementById("answersContainer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const timerDisplay = document.getElementById("timerDisplay");
const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");

const finalScore = document.getElementById("finalScore");
const storedHighScoreEl = document.getElementById("storedHighScore");
const playAgainBtn = document.getElementById("playAgainBtn");
const backToSettingsBtn = document.getElementById("backToSettingsBtn");
const themeToggle = document.getElementById("themeToggle");

const correctSfx = document.getElementById("correctSfx");
const wrongSfx = document.getElementById("wrongSfx");

const QUESTIONS_PER_ROUND = 10;
const TIME_PER_QUESTION = 30;
let questions = [];
let currentIndex = 0;
let score = 0;
let timer = null;
let timeLeft = TIME_PER_QUESTION;

let storedHighScore = Number(localStorage.getItem("quiz_highscore") || 0);
highScoreValue.textContent = storedHighScore;

function decodeHtmlEntities(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

startBtn.addEventListener("click", async () => {
  await loadQuestions();
  startRound();
});

async function loadQuestions() {
  const difficulty = difficultySelect.value;
  const category = categorySelect.value;
  const url = `https://the-trivia-api.com/api/questions?limit=${QUESTIONS_PER_ROUND}&difficulty=${encodeURIComponent(
    difficulty
  )}&categories=${encodeURIComponent(category)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    questions = data.map((q) => ({
      question: decodeHtmlEntities(q.question),
      correct: decodeHtmlEntities(q.correctAnswer),
      answers: shuffle(
        q.incorrectAnswers
          .concat(q.correctAnswer)
          .map((a) => decodeHtmlEntities(a))
      ),
    }));
  } catch (e) {
    alert(
      "Failed to load questions. Check your internet connection and try again."
    );
    console.error(e);
  }
}

function startRound() {
  currentIndex = 0;
  score = 0;
  settingsScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  resetStateForQuestion();

  const q = questions[currentIndex];
  if (!q) {
    endRound();
    return;
  }

  questionText.textContent = `${q.question}`;
  answersContainer.innerHTML = "";
  q.answers.forEach((ans) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.type = "button";
    btn.textContent = ans;
    btn.addEventListener("click", () => selectAnswer(btn, ans));
    answersContainer.appendChild(btn);
  });

  updateProgress();
  startTimer();
}

function resetStateForQuestion() {
  clearInterval(timer);
  timeLeft = TIME_PER_QUESTION;
  timerDisplay.textContent = `${timeLeft}s`;
  nextBtn.classList.add("hidden");
}

function startTimer() {
  timerDisplay.textContent = `${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeOut();
    }
  }, 1000);
}

function handleTimeOut() {
  const q = questions[currentIndex];
  Array.from(answersContainer.children).forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === q.correct) {
      btn.classList.add("correct");
    }
  });
  wrongSfx?.play();
  setTimeout(() => {
    currentIndex++;
    if (currentIndex < QUESTIONS_PER_ROUND) renderQuestion();
    else endRound();
  }, 1200);
}

function selectAnswer(button, selected) {
  clearInterval(timer);
  const q = questions[currentIndex];
  Array.from(answersContainer.children).forEach((b) => (b.disabled = true));

  if (selected === q.correct) {
    button.classList.add("correct");
    score++;
    correctSfx?.play();
  } else {
    button.classList.add("wrong");
    Array.from(answersContainer.children).forEach((b) => {
      if (b.textContent === q.correct) b.classList.add("correct");
    });
    wrongSfx?.play();
  }

  nextBtn.classList.remove("hidden");
  setTimeout(() => {
    currentIndex++;
    if (currentIndex < QUESTIONS_PER_ROUND) renderQuestion();
    else endRound();
  }, 900);
}

skipBtn.addEventListener("click", () => {
  clearInterval(timer);
  const q = questions[currentIndex];
  Array.from(answersContainer.children).forEach((b) => {
    b.disabled = true;
    if (b.textContent === q.correct) b.classList.add("correct");
  });
  wrongSfx?.play();
  setTimeout(() => {
    currentIndex++;
    if (currentIndex < QUESTIONS_PER_ROUND) renderQuestion();
    else endRound();
  }, 900);
});

function updateProgress() {
  const pct = (currentIndex / QUESTIONS_PER_ROUND) * 100;
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `${currentIndex + 1} / ${QUESTIONS_PER_ROUND}`;
}

function endRound() {
  clearInterval(timer);
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  finalScore.textContent = score;
  if (score > storedHighScore) {
    storedHighScore = score;
    localStorage.setItem("quiz_highscore", storedHighScore);
    resultMessage = "New high score! Nicely done.";
  } else {
    resultMessage = "Good round — try to beat your high score!";
  }
  document.getElementById("resultMessage").textContent = resultMessage;
  storedHighScoreEl.textContent = storedHighScore;
  highScoreValue.textContent = storedHighScore;
}

playAgainBtn.addEventListener("click", async () => {
  await loadQuestions();
  startRound();
});
backToSettingsBtn.addEventListener("click", () => {
  resultScreen.classList.add("hidden");
  settingsScreen.classList.remove("hidden");
});

themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  themeToggle.textContent = document.documentElement.classList.contains("dark")
    ? "Light Theme"
    : "Dark Theme";
});

document.addEventListener("keydown", (e) => {
  if (quizScreen.classList.contains("hidden")) return;
  const key = e.key;
  if (["1", "2", "3", "4"].includes(key)) {
    const idx = Number(key) - 1;
    const btns = Array.from(answersContainer.children);
    if (btns[idx] && !btns[idx].disabled) {
      btns[idx].click();
    }
  }
});
