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
  difficulty: "normal", // elegida en el inicio: una de las claves de DIFFICULTIES
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
const sessionProgress = document.getElementById("sessionProgress");
const progressFill = document.getElementById("progressFill");
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

const introList = document.getElementById("introList");
const glossaryPanel = document.getElementById("glossaryPanel");
const glossaryToggle = document.getElementById("glossaryToggle");
const glossaryBackdrop = document.getElementById("glossaryBackdrop");
const glossaryList = document.getElementById("glossaryList");

/* ---------------------------------------------------------
   3. GLOSARIO LATERAL
   --------------------------------------------------------- */

// El panel no escribe texto nuevo: cada ficha es una entrada del glosario que ya
// existe, con su nombre, su figura neutra y su significado. El orden y las
// familias salen de `GLOSSARY_SECTIONS` (data.js).

// Estas dos relaciones solo existen dentro de un diagrama de casos de uso
// completo, así que su ficha va sin figura: no hay un dibujo suelto que enseñar.
const GLOSSARY_WITHOUT_FIGURE = ["include", "extend"];

// Una ficha del glosario. La resolución de la entrada reutiliza `questionFacts`
// con un objeto que solo trae el id, para que `useCaseFacts` y `symbolFacts` se
// consulten siempre por la misma regla y no haya una segunda copia de ella.
function buildGlossaryEntry(id) {
  const fact = questionFacts({ symbol: id });

  const item = document.createElement("li");
  item.className = "glossary-entry";

  const name = document.createElement("h4");
  name.className = "glossary-name";
  name.textContent = fact.name;
  item.appendChild(name);

  if (GLOSSARY_WITHOUT_FIGURE.indexOf(id) === -1) {
    const figure = document.createElement("div");
    figure.className = "glossary-figure";
    // Variante neutra («Clase A/B», «Participante A/B», sin multiplicidades): en
    // el glosario el símbolo se lee por su forma, no por un dominio.
    figure.innerHTML = symbolFigure(id, "practice", true);
    item.appendChild(figure);
  }

  const meaning = document.createElement("p");
  meaning.className = "glossary-meaning";
  meaning.textContent = fact.meaning;
  item.appendChild(meaning);

  return item;
}

function renderGlossary() {
  glossaryList.innerHTML = "";

  GLOSSARY_SECTIONS.forEach((section) => {
    const block = document.createElement("section");
    block.className = "glossary-section";

    const title = document.createElement("h3");
    title.className = "glossary-section-title";
    title.textContent = section.title;
    block.appendChild(title);

    const entries = document.createElement("ul");
    entries.className = "glossary-entries";
    section.symbols.forEach((id) => {
      entries.appendChild(buildGlossaryEntry(id));
    });
    block.appendChild(entries);

    glossaryList.appendChild(block);
  });
}

// El panel entra y sale, y arranca cerrado. No se guarda si estaba abierto:
// abrirlo es una decisión de esta visita, y recordarla añadiría una clave nueva a
// lo que ya vive en el navegador del alumno.
function setGlossaryOpen(isOpen) {
  glossaryPanel.classList.toggle("is-open", isOpen);
  glossaryBackdrop.classList.toggle("is-visible", isOpen);
  glossaryToggle.setAttribute("aria-expanded", String(isOpen));
  // Con el panel abierto el fondo no debe seguir desplazándose por detrás.
  document.body.classList.toggle("glossary-open", isOpen);
}

function toggleGlossary() {
  setGlossaryOpen(!glossaryPanel.classList.contains("is-open"));
}

/* ---------------------------------------------------------
   4. PUNTUACIONES (localStorage)
   --------------------------------------------------------- */

// Récord de cada dificultad, todos a cero.
function emptyRecords() {
  return { normal: 0, hard: 0, practiceBasic: 0, practiceComplete: 0, useCase: 0 };
}

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

// Récords de las cinco dificultades, migrando los formatos anteriores: un solo
// número era el récord de Normal, y la clave antigua `practice` —la de la
// práctica única que había, con un banco mixto— pasa a `practiceComplete`, que
// es su sucesora más cercana. Los registros ya guardados con las cuatro claves
// mandan sobre ella, así que no se pierde ningún récord. `useCase` no existía
// antes: un registro guardado sin esa clave simplemente vale cero.
function loadRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return emptyRecords();
    }

    const parsed = JSON.parse(stored);
    if (parsed === null || typeof parsed !== "object") {
      return Number.isFinite(parsed) ? { ...emptyRecords(), normal: parsed } : emptyRecords();
    }

    return {
      normal: numberOrZero(parsed.normal),
      hard: numberOrZero(parsed.hard),
      practiceBasic: numberOrZero(parsed.practiceBasic),
      practiceComplete: numberOrZero(parsed.practiceComplete) || numberOrZero(parsed.practice),
      useCase: numberOrZero(parsed.useCase)
    };
  } catch (error) {
    return emptyRecords();
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

// Cuántas filas se muestran por grupo, como máximo.
const SCORES_PER_GROUP = 5;

// Las filas de una dificultad: los puntajes de esta página y, si no está entre
// ellos, el récord guardado de esa dificultad. Cada fila se identifica por el
// par dificultad + puntos, y como aquí solo se mezcla una dificultad, dos
// puntajes iguales de modos distintos nunca se fusionan: viven en otros grupos.
//
// El récord se pone el primero aunque no sea el mayor de la lista, y no solo por
// casualidad del orden: es la referencia de esa dificultad y tiene que abrir el
// grupo aunque mañana se juegue una partida peor.
function buildScoreRows(difficulty, records) {
  const best = numberOrZero(records[difficulty]);
  const scores = state.sessionScores
    .filter((entry) => entry.difficulty === difficulty)
    .map((entry) => entry.score);

  // El récord de visitas anteriores aparece aunque no se haya hecho hoy.
  if (best > 0 && scores.indexOf(best) === -1) {
    scores.push(best);
  }

  scores.sort((a, b) => b - a);

  const rows = scores.slice(0, SCORES_PER_GROUP).map((score) => {
    return { score: score, isRecord: best > 0 && score === best };
  });

  const recordIndex = rows.findIndex((row) => row.isRecord);
  if (recordIndex > 0) {
    rows.unshift(rows.splice(recordIndex, 1)[0]);
  }

  return rows;
}

// Los grupos, uno por dificultad que tenga algún puntaje, en el orden del combo.
// No se mezclan: los bancos no son comparables entre sí —«Práctica UML completo»
// son 30 preguntas y «Normal» son 11—, así que ordenar todos los puntos juntos
// daría un ranking que no significa nada.
function buildScoreGroups() {
  const records = loadRecords();

  return Object.keys(DIFFICULTIES)
    .map((difficulty) => {
      return {
        difficulty: difficulty,
        label: DIFFICULTIES[difficulty].label,
        rows: buildScoreRows(difficulty, records)
      };
    })
    .filter((group) => group.rows.length > 0);
}

function renderScores() {
  const groups = buildScoreGroups();
  scoresList.innerHTML = "";

  groups.forEach((group) => {
    const section = document.createElement("li");
    section.className = "score-group";

    // El nombre de la dificultad: la lista ya no se filtra, así que la fila tiene
    // que decir de dónde sale cada puntaje.
    const title = document.createElement("p");
    title.className = "score-group-title";
    title.textContent = group.label;
    section.appendChild(title);

    const rows = document.createElement("ul");
    rows.className = "score-rows";

    group.rows.forEach((row) => {
      const item = document.createElement("li");

      const points = document.createElement("span");
      points.className = "score-points";
      points.textContent = row.score + (row.score === 1 ? " punto" : " puntos");
      item.appendChild(points);

      if (row.isRecord) {
        const badge = document.createElement("span");
        badge.className = "record-badge";
        badge.textContent = "récord";
        item.appendChild(badge);
      }

      rows.appendChild(item);
    });

    section.appendChild(rows);
    scoresList.appendChild(section);
  });

  emptyScores.classList.toggle("is-hidden", groups.length > 0);
}

/* ---------------------------------------------------------
   5. PANTALLAS
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
   6. SESIÓN DE ESTUDIO
   --------------------------------------------------------- */

// Tipos de la dificultad difícil, en el orden en que se repiten.
const HARD_QUESTION_TYPES = ["inverse", "open", "case"];

// Tipos de la dificultad de práctica: los dos sentidos (escenario → UML y UML →
// escenario), cada uno con sus dos formatos de respuesta.
const PRACTICE_QUESTION_TYPES = ["context-open", "context-mc", "explain-open", "explain-mc"];

// Tipos del modo de diagramas de casos de uso: modelar la situación, nombrar la
// relación y razonar sobre el diagrama completo. La fila de DIFFICULTIES los
// declara como los demás, pero aquí cada pregunta lleva su tipo (`question.type`),
// porque las de nombre son abiertas y no valen para una posición cerrada.
const USE_CASE_QUESTION_TYPES = ["usecase-model", "usecase-name", "usecase-reason"];

// Ayuda que se muestra sobre las opciones (vacío en el tipo clásico).
const QUESTION_HINTS = {
  symbol: "",
  inverse: "Se te da el nombre: elige el símbolo que lo representa.",
  open: "Se muestra un símbolo: escribe su nombre.",
  case: "Elige la relación o el elemento más apropiado para el caso.",
  "context-open": "Lee el escenario y escribe el nombre de lo que representa en UML.",
  "context-mc": "Lee el escenario y elige el elemento o relación que representa.",
  "explain-open": "Mira el diagrama y escribe el nombre de lo que muestra.",
  "explain-mc": "Mira el diagrama y elige el escenario que representa.",
  "usecase-model": "Lee la situación y elige el diagrama que la modela.",
  "usecase-name": "Mira el diagrama y escribe el nombre de la relación.",
  "usecase-reason": "Mira el diagrama y elige la respuesta correcta."
};

// ¿La pregunta se responde escribiendo en el campo de texto?
function isOpenType(type) {
  return type === "open" || type === "usecase-name" || type.indexOf("-open") !== -1;
}

// ¿La pregunta se responde sobre el diagrama (y no sobre el escenario escrito)?
function isDiagramType(type) {
  return type === "explain-open" || type === "explain-mc";
}

// Las cinco dificultades del combo, una fila cada una: qué banco usa y en qué
// orden se repiten sus tipos de pregunta. El tamaño de la sesión es el del banco,
// así que no hace falta repetirlo aquí. Añadir una dificultad es añadir una fila.
//
// `label` es el nombre limpio de la dificultad: lo que pone el combo y lo que
// titula su grupo de puntajes. `desc` es lo que explica el modo en la lista de
// inicio; el número de preguntas no está escrito en ninguna parte porque se
// cuenta con el tamaño del banco.
const DIFFICULTIES = {
  normal: {
    label: "Normal",
    desc: "de UML básico: un símbolo y su nombre.",
    bank: questions,
    types: ["symbol"]
  },
  hard: {
    label: "Difícil",
    desc: "de UML intermedio, con comunicación y secuencia: eliges el símbolo, escribes el nombre o resuelves un caso.",
    bank: hardQuestions,
    types: HARD_QUESTION_TYPES
  },
  practiceBasic: {
    label: "Práctica UML básico",
    desc: "que razonan por qué una situación se representa de una forma y no de otra.",
    bank: practiceBasicQuestions,
    types: PRACTICE_QUESTION_TYPES
  },
  practiceComplete: {
    label: "Práctica UML completo",
    desc: "que amplían las anteriores con componentes y despliegue.",
    bank: practiceCompleteQuestions,
    types: PRACTICE_QUESTION_TYPES
  },
  useCase: {
    label: "Diagramas de casos de uso",
    desc: "sobre un diagrama entero: qué actores llegan a cada caso, qué relación corresponde y por qué.",
    bank: useCaseQuestions,
    types: USE_CASE_QUESTION_TYPES
  }
};

// El combo se pinta desde la tabla de dificultades para que sus opciones y los
// títulos de los grupos de puntajes no puedan separarse: los dos salen de `label`.
function renderDifficultySelect() {
  difficultySelect.innerHTML = "";

  Object.keys(DIFFICULTIES).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = DIFFICULTIES[key].label;
    difficultySelect.appendChild(option);
  });

  difficultySelect.value = state.difficulty;
}

// La lista de modos del inicio, con el nombre y su descripción. El recuento sale
// del banco, así que añadir una dificultad no obliga a recontar nada a mano.
function renderIntroList() {
  introList.innerHTML = "";

  Object.keys(DIFFICULTIES).forEach((key) => {
    const mode = DIFFICULTIES[key];
    const count = mode.bank.length;

    const item = document.createElement("li");

    const name = document.createElement("strong");
    name.textContent = mode.label;
    item.appendChild(name);

    const text = document.createElement("span");
    text.textContent =
      count + " " + (count === 1 ? "pregunta " : "preguntas ") + mode.desc;
    item.appendChild(text);

    introList.appendChild(item);
  });
}

// Tipo de la pregunta `index`: la tabla de dificultades decide cuál se repite.
// Normal solo tiene la clásica; Difícil alterna inversa, abierta y caso (5/5/5
// en quince preguntas) y las dos prácticas los cuatro formatos (3/3/2/2 en diez,
// 8/8/7/7 en treinta).
//
// Los bancos de siempre se apoyan en que todas sus preguntas valen para
// cualquier tipo, y por eso el orden puede decidirlo la posición. El de
// diagramas de casos de uso no cumple eso: sus preguntas de nombre son abiertas
// y no tienen opciones, así que si ocuparan la posición de una cerrada no habría
// nada que elegir. Por eso su tipo viaja con la pregunta y la posición no manda.
function questionType(index) {
  const question = state.sessionQuestions[index];
  if (question && question.selfContained) {
    return question.type;
  }

  const types = DIFFICULTIES[state.difficulty].types;
  return types[index % types.length];
}

// Banco de la dificultad elegida: cada una tiene el suyo, y los dos bancos de
// práctica no comparten ni un texto con los demás.
function sessionBank() {
  return DIFFICULTIES[state.difficulty].bank;
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

  // La regla de avance: una línea por pregunta ya contestada, con su marca de
  // cota en la posición actual.
  const total = state.sessionQuestions.length;
  const done = state.currentIndex + 1;
  progressFill.style.width = (done / total) * 100 + "%";
  sessionProgress.setAttribute("aria-valuemax", String(total));
  sessionProgress.setAttribute("aria-valuenow", String(done));

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
  if (question.selfContained) {
    renderSelfContainedPrompt(question, type);
    return;
  }

  const fact = symbolFacts[question.symbol];

  if (type === "inverse") {
    appendPrompt("question-name", fact.name);
  } else if (type === "case" || type === "context-open" || type === "context-mc") {
    appendPrompt("scenario", type === "case" ? fact.case : question.scenario);
  } else {
    // Solo las prácticas muestran un diagrama (tipos `explain`), y therein sale
    // del banco de práctica, con el contexto visual que le haga falta al
    // escenario. En las demás dificultades se muestra el símbolo tal cual.
    symbolBox.innerHTML = isDiagramType(type)
      ? practiceFigure(question.symbol)
      : symbolFigure(question.symbol, state.difficulty);
  }
}

function appendPrompt(className, text) {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  paragraph.textContent = text;
  symbolBox.innerHTML = "";
  symbolBox.appendChild(paragraph);
}

// Enunciado de una pregunta que lo trae todo consigo (el modo de diagramas de
// casos de uso): o la situación escrita, o el diagrama, y en el caso de
// razonamiento el diagrama seguido de lo que se pregunta.
function renderSelfContainedPrompt(question, type) {
  if (type === "usecase-model") {
    appendPrompt("scenario", question.scenario);
    return;
  }

  symbolBox.innerHTML = USE_CASE_FIGURES[question.figure];

  if (type === "usecase-reason") {
    const paragraph = document.createElement("p");
    paragraph.className = "scenario";
    paragraph.textContent = question.prompt;
    symbolBox.appendChild(paragraph);
  }
}

function renderHint(type) {
  questionHint.textContent = QUESTION_HINTS[type];
  questionHint.classList.toggle("is-hidden", !QUESTION_HINTS[type]);
}

// Opciones de la pregunta que va de UML al escenario: el escenario de la propia
// pregunta más dos del banco de práctica en curso, con el mismo patrón
// declarativo, para que la correcta no se distinga por cómo está redactada.
// Los tres símbolos son distintos: el banco completo tiene símbolos con dos
// escenarios (los gemelos), así que sin este filtro dos opciones podrían ser del
// mismo símbolo y quedar equivalentes entre sí.
function explainOptions(question) {
  const picked = [];
  const used = [question.symbol];
  const candidates = shuffle(sessionBank().filter((item) => item.symbol !== question.symbol));

  for (let i = 0; i < candidates.length && picked.length < 2; i++) {
    if (used.indexOf(candidates[i].symbol) >= 0) {
      continue;
    }
    picked.push(candidates[i].scenario);
    used.push(candidates[i].symbol);
  }

  return shuffle(picked.concat([question.scenario]));
}

// Los tres nombres de un símbolo: salen del mapa común a los cuatro bancos, así
// un símbolo que se pregunta en varias dificultades no repite sus distractores.
function symbolOptions(symbol) {
  return NAME_OPTIONS[symbol];
}

// Las opciones de la pregunta actual: nombres del glosario (clásico, inversa,
// caso y escenario), escenarios (explicar) o el dibujo de cada símbolo (inversa).
function renderOptions(question, type) {
  if (question.selfContained) {
    renderSelfContainedOptions(question, type);
    return;
  }

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

// Opciones de una pregunta que lo trae todo consigo: en las de modelado cada
// opción es un diagrama (como las del tipo inverso, pero de casos de uso), y en
// las de razonamiento es la respuesta escrita. El tipo de nombre es el único
// abierto de este modo, así que no llega hasta aquí.
function renderSelfContainedOptions(question, type) {
  optionsList.innerHTML = "";

  shuffle(question.options).forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.option = option;

    if (type === "usecase-model") {
      button.className = "option-button option-button--symbol";
      button.innerHTML = USE_CASE_OPTION_FIGURES[option];
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

// ¿La respuesta correcta de la pregunta actual es el escenario y no el nombre
// del símbolo? Solo ocurre en las preguntas `explain-mc` de las prácticas.
function isScenarioAnswer() {
  return questionType(state.currentIndex) === "explain-mc";
}

// Respuesta correcta de la pregunta actual. Sale del glosario, salvo en las de
// práctica que piden el escenario del diagrama: ahí es el `scenario` de la pregunta.
function correctAnswer(question) {
  if (question.selfContained) {
    return question.answer;
  }

  return isScenarioAnswer() ? question.scenario : symbolFacts[question.symbol].name;
}

// Glosario de una pregunta: el del modo de casos de uso primero, y el general
// detrás. Así las dos relaciones propias («include», «extend») tienen su
// descripción sin tocar `symbolFacts`, que comparten los otros modos, y el resto
// de símbolos se resuelven por el camino de siempre.
function questionFacts(question) {
  return useCaseFacts[question.symbol] || symbolFacts[question.symbol];
}

// Construye los trozos de la explicación a partir del glosario `symbolFacts`.
// Solo se explica el símbolo correcto; si el usuario falla, el párrafo inicial
// pone la respuesta correcta por delante y, si la correcta era un escenario,
// se añade el nombre del símbolo: si no, nunca se diría qué se estaba dibujando.
function buildFeedback(question, chosenOption) {
  const correct = correctAnswer(question);
  const isCorrect = normalizeAnswer(chosenOption) === normalizeAnswer(correct);

  if (question.selfContained) {
    const fact = questionFacts(question);
    return {
      isCorrect: isCorrect,
      verdict: isCorrect ? "¡Correcto!" : "¡Incorrecto!",
      lead: isCorrect ? null : "La respuesta correcta es «" + correct + "».",
      name: null,
      reason: question.reason || null,
      syntax: fact.syntax,
      meaning: fact.meaning
    };
  }

  const fact = symbolFacts[question.symbol];

  return {
    isCorrect: isCorrect,
    verdict: isCorrect ? "¡Correcto!" : "¡Incorrecto!",
    lead: isCorrect ? null : "La respuesta correcta es «" + correct + "».",
    name: !isCorrect && isScenarioAnswer() ? fact.name : null,
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
  if (feedback.name) {
    feedbackBody.appendChild(createFeedbackBlock("Símbolo:", [feedback.name]));
  }
  // El razonamiento solo lo llevan las preguntas de diagrama de casos de uso:
  // sin él no se entendería por qué un conjunto de actores es la respuesta.
  if (feedback.reason) {
    feedbackBody.appendChild(createFeedbackBlock("Por qué:", [feedback.reason]));
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
   7. EVENTOS DE LA PÁGINA
   --------------------------------------------------------- */

startButton.addEventListener("click", startSession);
acceptButton.addEventListener("click", acceptAnswer);
nextButton.addEventListener("click", nextQuestion);
homeButton.addEventListener("click", () => {
  renderScores();
  showScreen(homeScreen);
});

// La lista de puntajes ya no depende de la dificultad elegida —sale entera, con
// su grupo—, así que cambiar el combo solo cambia el modo de la sesión.
difficultySelect.addEventListener("change", () => {
  state.difficulty = difficultySelect.value;
});

answerInput.addEventListener("input", () => {
  acceptButton.disabled = answerInput.value.trim() === "";
});

glossaryToggle.addEventListener("click", toggleGlossary);
glossaryBackdrop.addEventListener("click", () => setGlossaryOpen(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && glossaryPanel.classList.contains("is-open")) {
    setGlossaryOpen(false);
    glossaryToggle.focus();
  }
});

// Arranque: el combo y la lista de intro se pintan desde `DIFFICULTIES`, el
// glosario desde los glosarios de datos y los grupos de puntajes, sus récords.
renderDifficultySelect();
renderIntroList();
renderGlossary();
setGlossaryOpen(false);
renderScores();
