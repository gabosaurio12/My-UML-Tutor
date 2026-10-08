"use strict";

/* =========================================================
   Tutor de UML — lógica y estado
   ========================================================= */

// Las explicaciones, los dibujos y los bancos de preguntas viven en data.js.
// Aquí solo la lógica: estado, pantallas, sesión, feedback y eventos.

/* ---------------------------------------------------------
   1. ESTADO DE LA APLICACIÓN
   --------------------------------------------------------- */

const state = {
  sessionQuestions: [], // preguntas de la sesión actual, en orden aleatorio
  currentIndex: 0, // número de la pregunta actual
  score: 0, // puntos de la sesión actual
  selectedOption: null, // opción (o texto) que ha marcado el usuario
  isAccepted: false, // si ya ha pulsado "Aceptar"
  difficulty: "normal", // elegida en el inicio: "normal" | "hard" | "practice"
  sessionScores: [] // puntajes de esta página: { score, difficulty } (solo en memoria)
};

/* ---------------------------------------------------------
   2. ELEMENTOS DE LA PÁGINA
   --------------------------------------------------------- */

const homeScreen = document.getElementById("homeScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const startButton = document.getElementById("startButton");
const difficultySelect = document.getElementById("difficultySelect");
const acceptButton = document.getElementById("acceptButton");
const nextButton = document.getElementById("nextButton");
const homeButton = document.getElementById("homeButton");

const questionCounter = document.getElementById("questionCounter");
const scoreValue = document.getElementById("scoreValue");
const symbolBox = document.getElementById("symbolBox");
const optionsList = document.getElementById("optionsList");
const questionHint = document.getElementById("questionHint");
const answerBox = document.getElementById("answerBox");
const answerInput = document.getElementById("answerInput");
const feedbackBox = document.getElementById("feedbackBox");
const feedbackTitle = document.getElementById("feedbackTitle");
const feedbackBody = document.getElementById("feedbackBody");

const scoresList = document.getElementById("scoresList");
const emptyScores = document.getElementById("emptyScores");
const finalScoreText = document.getElementById("finalScoreText");
const recordText = document.getElementById("recordText");

/* ---------------------------------------------------------
   3. PUNTUACIONES (localStorage)
   --------------------------------------------------------- */

// Récords de las tres dificultades. Los formatos anteriores (un solo número, o
// solo normal y hard) se completan con ceros en las dificultades que falten.
function loadRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return { normal: 0, hard: 0, practice: 0 };
    }

    const parsed = JSON.parse(stored);
    if (parsed !== null && typeof parsed === "object") {
      return {
        normal: Number.isFinite(parsed.normal) ? parsed.normal : 0,
        hard: Number.isFinite(parsed.hard) ? parsed.hard : 0,
        practice: Number.isFinite(parsed.practice) ? parsed.practice : 0
      };
    }
    return Number.isFinite(parsed)
      ? { normal: parsed, hard: 0, practice: 0 }
      : { normal: 0, hard: 0, practice: 0 };
  } catch (error) {
    return { normal: 0, hard: 0, practice: 0 };
  }
}

// Devuelve el récord de la dificultad seleccionada, o 0 si todavía no hay ninguno.
function loadBestScore() {
  return loadRecords()[state.difficulty];
}

// Guarda el récord de la dificultad actual. Solo se almacena el puntaje más alto.
function saveBestScore(score) {
  try {
    const records = loadRecords();
    records[state.difficulty] = score;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    // Si el navegador bloquea localStorage, la sesión sigue funcionando.
  }
}

// Filas de la lista: puntajes de esta página y, si procede, el récord guardado.
function buildScoreRows() {
  const best = loadBestScore();
  const rows = state.sessionScores
    .filter((entry) => entry.difficulty === state.difficulty)
    .map((entry) => entry.score)
    .sort((a, b) => b - a);

  // El récord de visitas anteriores aparece aunque no se haya hecho hoy.
  if (best > 0 && !rows.includes(best)) {
    rows.push(best);
  }

  // Solo la fila más alta lleva la insignia de récord.
  let recordMarked = false;
  return rows.slice(0, 5).map((score) => {
    const isRecord = best > 0 && !recordMarked && score === best;
    recordMarked = recordMarked || isRecord;
    return { score: score, isRecord: isRecord };
  });
}

function renderScores() {
  const rows = buildScoreRows();
  scoresList.innerHTML = "";

  rows.forEach((row) => {
    const item = document.createElement("li");

    if (row.isRecord) {
      const badge = document.createElement("span");
      badge.className = "record-badge";
      badge.textContent = "récord";
      item.appendChild(badge);
    }

    const points = document.createElement("span");
    points.className = "score-points";
    points.textContent = row.score + (row.score === 1 ? " punto" : " puntos");
    item.appendChild(points);

    scoresList.appendChild(item);
  });

  emptyScores.classList.toggle("is-hidden", rows.length > 0);
}

/* ---------------------------------------------------------
   4. PANTALLAS
   --------------------------------------------------------- */

function showScreen(screen) {
  [homeScreen, quizScreen, resultScreen].forEach((item) => {
    item.classList.add("is-hidden");
  });
  screen.classList.remove("is-hidden");
}

function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/* ---------------------------------------------------------
   5. SESIÓN DE ESTUDIO
   --------------------------------------------------------- */

// Tipos de la dificultad difícil, en el orden en que se repiten.
const HARD_QUESTION_TYPES = ["inverse", "open", "case"];

// Tipos de la dificultad de práctica: los dos sentidos (escenario → UML y UML →
// escenario), cada uno con sus dos formatos de respuesta.
const PRACTICE_QUESTION_TYPES = ["context-open", "context-mc", "explain-open", "explain-mc"];

// Ayuda que se muestra sobre las opciones (vacío en el tipo clásico).
const QUESTION_HINTS = {
  symbol: "",
  inverse: "Se te da el nombre: elige el símbolo que lo representa.",
  open: "Se muestra un símbolo: escribe su nombre.",
  case: "Elige la relación o el elemento más apropiado para el caso.",
  "context-open": "Lee el escenario y escribe el nombre de lo que representa en UML.",
  "context-mc": "Lee el escenario y elige el elemento o relación que representa.",
  "explain-open": "Mira el diagrama y escribe el nombre de lo que muestra.",
  "explain-mc": "Mira el diagrama y elige el escenario que representa."
};

// ¿La pregunta se responde escribiendo en el campo de texto?
function isOpenType(type) {
  return type === "open" || type.indexOf("-open") !== -1;
}

// Tipo de la pregunta `index`: la clásica en Normal, en Difícil las tres
// alternadas (4 inversas, 3 abiertas y 3 de caso) y en Práctica los cuatro
// formatos alternados (3 escenario-abiertas, 3 escenario-opción, 2 explicar).
function questionType(index) {
  if (state.difficulty === "hard") {
    return HARD_QUESTION_TYPES[index % HARD_QUESTION_TYPES.length];
  }
  if (state.difficulty === "practice") {
    return PRACTICE_QUESTION_TYPES[index % PRACTICE_QUESTION_TYPES.length];
  }
  return "symbol";
}

// Banco de la dificultad elegida: la práctica usa sus escenarios propios.
function sessionBank() {
  return state.difficulty === "practice" ? practiceQuestions : questions;
}

function startSession() {
  state.sessionQuestions = shuffle(sessionBank());
  state.currentIndex = 0;
  state.score = 0;
  state.selectedOption = null;
  state.isAccepted = false;

  showScreen(quizScreen);
  renderQuestion();
}

function currentQuestion() {
  return state.sessionQuestions[state.currentIndex];
}

function renderQuestion() {
  const question = currentQuestion();
  const type = questionType(state.currentIndex);

  state.selectedOption = null;
  state.isAccepted = false;

  questionCounter.textContent =
    "Pregunta " + (state.currentIndex + 1) + " de " + state.sessionQuestions.length;
  scoreValue.textContent = "Puntos: " + state.score;

  feedbackBox.classList.add("is-hidden");
  acceptButton.classList.remove("is-hidden");
  acceptButton.disabled = true;
  nextButton.textContent =
    state.currentIndex === state.sessionQuestions.length - 1
      ? "Ver resultado"
      : "Siguiente";

  renderPrompt(question, type);
  renderHint(type);

  const open = isOpenType(type);
  answerBox.classList.toggle("is-hidden", !open);
  answerInput.value = "";
  answerInput.disabled = false;
  optionsList.classList.toggle("is-hidden", open);

  if (open) {
    optionsList.innerHTML = "";
  } else {
    renderOptions(question, type);
  }
}

// Enunciado: el símbolo (clásico, abierto y explicar), el nombre (inversa), el
// caso de Difícil o el escenario de Práctica.
function renderPrompt(question, type) {
  const fact = symbolFacts[question.symbol];

  if (type === "inverse") {
    appendPrompt("question-name", fact.name);
  } else if (type === "case" || type === "context-open" || type === "context-mc") {
    appendPrompt("scenario", type === "case" ? fact.case : question.scenario);
  } else {
    // En Práctica el diagrama va con cajas neutras: el alumno tiene que leer el
    // conector y el significado, no los nombres de las clases. Normal y Difícil
    // conservan los suyos.
    symbolBox.innerHTML = symbolFigure(
      question.symbol,
      state.difficulty,
      state.difficulty === "practice"
    );
  }
}

function appendPrompt(className, text) {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  paragraph.textContent = text;
  symbolBox.innerHTML = "";
  symbolBox.appendChild(paragraph);
}

function renderHint(type) {
  questionHint.textContent = QUESTION_HINTS[type];
  questionHint.classList.toggle("is-hidden", !QUESTION_HINTS[type]);
}

// Opciones de la pregunta que va de UML al escenario: el escenario de la propia
// pregunta más dos de otros símbolos del banco de práctica, con el mismo patrón
// declarativo, para que la correcta no se distinga por cómo está redactada.
function explainOptions(question) {
  const distractors = shuffle(
    practiceQuestions
      .filter((item) => item.symbol !== question.symbol)
      .map((item) => item.scenario)
  );

  return shuffle([question.scenario, distractors[0], distractors[1]]);
}

// Los tres nombres de un símbolo: se toman del banco principal, así las
// preguntas de práctica reutilizan los mismos distractores.
function symbolOptions(symbol) {
  return questions.find((question) => question.symbol === symbol).options;
}

// Las opciones de la pregunta actual: nombres del glosario (clásico, inversa,
// caso y escenario), escenarios (explicar) o el dibujo de cada símbolo (inversa).
function renderOptions(question, type) {
  const options =
    type === "explain-mc" ? explainOptions(question) : symbolOptions(question.symbol);

  optionsList.innerHTML = "";
  shuffle(options).forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.option = option;

    if (type === "inverse") {
      button.className = "option-button option-button--symbol";
      button.innerHTML = symbolFigure(symbolIdByName[option], state.difficulty);
    } else {
      button.className = "option-button";
      button.textContent = option;
    }

    button.addEventListener("click", () => selectOption(button, option));
    optionsList.appendChild(button);
  });
}

function selectOption(button, option) {
  if (state.isAccepted) {
    return;
  }

  state.selectedOption = option;
  optionsList.querySelectorAll(".option-button").forEach((item) => {
    item.classList.toggle("is-selected", item === button);
  });
  acceptButton.disabled = false;
}

function acceptAnswer() {
  if (state.isAccepted) {
    return;
  }

  // Pregunta abierta: la respuesta llega del campo de texto al aceptar.
  if (isOpenType(questionType(state.currentIndex))) {
    if (answerInput.value.trim() === "") {
      return;
    }
    state.selectedOption = answerInput.value;
    answerInput.disabled = true;
  }

  if (state.selectedOption === null) {
    return;
  }

  const question = currentQuestion();
  const feedback = buildFeedback(question, state.selectedOption);
  state.isAccepted = true;

  if (feedback.isCorrect) {
    state.score += 1;
  }
  scoreValue.textContent = "Puntos: " + state.score;

  markOptions(question);
  renderFeedback(feedback);
  acceptButton.classList.add("is-hidden");
}

// Quita los signos diacríticos («ó» → «o») para comparar sin tildes.
function stripDiacritics(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Respuesta escrita a mano: se ignoran mayúsculas, tildes y espacios sobrantes
// («  COMPOSICIÓN » cuenta como «composición»).
function normalizeAnswer(text) {
  return stripDiacritics(text.trim().toLowerCase());
}

// Respuesta correcta de la pregunta actual. Sale del glosario, salvo en las de
// práctica que piden el escenario del diagrama: ahí es el `scenario` de la pregunta.
function correctAnswer(question) {
  return questionType(state.currentIndex) === "explain-mc"
    ? question.scenario
    : symbolFacts[question.symbol].name;
}

// Construye los trozos de la explicación a partir del glosario `symbolFacts`.
// Solo se explica el símbolo correcto; si el usuario falla, el párrafo inicial
// pone su respuesta delante de la correcta.
function buildFeedback(question, chosenOption) {
  const fact = symbolFacts[question.symbol];
  const correct = correctAnswer(question);
  const isCorrect = normalizeAnswer(chosenOption) === normalizeAnswer(correct);

  return {
    isCorrect: isCorrect,
    verdict: isCorrect ? "¡Correcto!" : "¡Incorrecto!",
    lead: isCorrect
      ? null
      : "Tu respuesta: «" +
        chosenOption.trim() +
        "». La respuesta correcta es «" +
        correct +
        "».",
    syntax: fact.syntax,
    meaning: fact.meaning
  };
}

// Pinta la explicación en la caja de feedback.
function renderFeedback(feedback) {
  feedbackTitle.textContent = feedback.verdict;
  feedbackBox.classList.toggle("is-correct", feedback.isCorrect);
  feedbackBox.classList.toggle("is-wrong", !feedback.isCorrect);
  feedbackBox.classList.remove("is-hidden");

  feedbackBody.innerHTML = "";
  if (feedback.lead) {
    const lead = document.createElement("p");
    lead.className = "feedback-lead";
    lead.textContent = feedback.lead;
    feedbackBody.appendChild(lead);
  }
  feedbackBody.appendChild(createFeedbackBlock("Cómo se dibuja:", [feedback.syntax]));
  feedbackBody.appendChild(createFeedbackBlock("Qué modela:", [feedback.meaning]));
}

// Un párrafo: etiqueta en negrita y una o varias líneas debajo.
function createFeedbackBlock(label, lines) {
  const block = document.createElement("p");
  block.className = "feedback-block";

  const labelElement = document.createElement("span");
  labelElement.className = "feedback-label";
  labelElement.textContent = label;
  block.appendChild(labelElement);

  lines.forEach((line, index) => {
    if (index > 0) {
      block.appendChild(document.createElement("br"));
    } else {
      block.appendChild(document.createTextNode(" "));
    }
    block.appendChild(document.createTextNode(line));
  });

  return block;
}

// Verde para la respuesta correcta, rojo para la elegida si es incorrecta.
function markOptions(question) {
  const correct = correctAnswer(question);

  optionsList.querySelectorAll(".option-button").forEach((button) => {
    button.disabled = true;
    button.classList.remove("is-selected");
    if (button.dataset.option === correct) {
      button.classList.add("is-correct");
    } else if (button.dataset.option === state.selectedOption) {
      button.classList.add("is-wrong");
    }
  });
}

function nextQuestion() {
  // Evita avanzar dos veces si se pulsa el botón muy rápido.
  if (quizScreen.classList.contains("is-hidden")) {
    return;
  }

  state.currentIndex += 1;

  if (state.currentIndex >= state.sessionQuestions.length) {
    endSession();
  } else {
    renderQuestion();
  }
}

function endSession() {
  const previousBest = loadBestScore();
  const isRecord = state.score > previousBest;

  if (isRecord) {
    saveBestScore(state.score);
  }
  state.sessionScores.push({ score: state.score, difficulty: state.difficulty });

  finalScoreText.textContent =
    "Has acertado " +
    state.score +
    " de " +
    state.sessionQuestions.length +
    " preguntas.";

  const best = loadBestScore();
  if (best > 0) {
    recordText.textContent = isRecord
      ? "¡Nuevo récord! Has superado tu mejor puntuación."
      : "Tu récord es de " + best + (best === 1 ? " punto." : " puntos.");
  } else {
    recordText.textContent = "Todavía no tienes récord. ¡Sigue practicando!";
  }

  showScreen(resultScreen);
}

/* ---------------------------------------------------------
   6. EVENTOS DE LA PÁGINA
   --------------------------------------------------------- */

startButton.addEventListener("click", startSession);
acceptButton.addEventListener("click", acceptAnswer);
nextButton.addEventListener("click", nextQuestion);
homeButton.addEventListener("click", () => {
  renderScores();
  showScreen(homeScreen);
});

difficultySelect.addEventListener("change", () => {
  state.difficulty = difficultySelect.value;
  renderScores();
});

answerInput.addEventListener("input", () => {
  acceptButton.disabled = answerInput.value.trim() === "";
});

renderScores();
