"use strict";

/* =========================================================
   Tutor de UML — lógica y datos
   ========================================================= */

/* ---------------------------------------------------------
   1. DATOS
   --------------------------------------------------------- */

// Dibujo de cada símbolo que no es de relación, en SVG (no necesita servidor).
// Los seis símbolos de relación se generan con `relationFigure` (más abajo).
const symbolShapes = {
  class: `
    <svg viewBox="0 0 200 100" role="img" aria-label="Símbolo de clase">
      <g stroke="#334155" stroke-width="2.5" fill="#ffffff" stroke-linejoin="round">
        <rect x="45" y="8" width="110" height="84"></rect>
        <line x1="45" y1="36" x2="155" y2="36"></line>
        <line x1="45" y1="62" x2="155" y2="62"></line>
      </g>
      <g fill="#334155" font-family="system-ui, sans-serif" text-anchor="middle">
        <text x="100" y="26" font-size="13">Persona</text>
        <text x="100" y="53" font-size="11">nombre: String</text>
        <text x="100" y="80" font-size="11">saludar()</text>
      </g>
    </svg>`,

  object: `
    <svg viewBox="0 0 200 100" role="img" aria-label="Símbolo de objeto">
      <rect x="45" y="28" width="110" height="44" fill="#ffffff" stroke="#334155" stroke-width="2.5"></rect>
      <text x="100" y="56" text-anchor="middle" font-size="14" font-family="system-ui, sans-serif"
            fill="#334155" text-decoration="underline">ana: Persona</text>
    </svg>`,

  package: `
    <svg viewBox="0 0 200 100" role="img" aria-label="Símbolo de paquete">
      <path d="M45,32 V20 H95 V32 H155 V85 H45 Z"
            fill="#ffffff" stroke="#334155" stroke-width="2.5" stroke-linejoin="round"></path>
      <text x="100" y="64" text-anchor="middle" font-size="13" font-family="system-ui, sans-serif" fill="#334155">modelos</text>
    </svg>`,

  component: `
    <svg viewBox="0 0 200 100" role="img" aria-label="Símbolo de componente">
      <g stroke="#334155" stroke-width="2.5" fill="#ffffff" stroke-linejoin="round">
        <rect x="50" y="25" width="105" height="50"></rect>
        <rect x="40" y="33" width="20" height="14"></rect>
        <rect x="40" y="55" width="20" height="14"></rect>
      </g>
    </svg>`,

  note: `
    <svg viewBox="0 0 200 100" role="img" aria-label="Símbolo de nota">
      <g stroke="#334155" stroke-width="2.5" fill="#ffffff" stroke-linejoin="round">
        <path d="M50,18 H135 L160,43 V85 H50 Z"></path>
        <path d="M135,18 V43 H160"></path>
      </g>
    </svg>`,

  actor: `
    <svg viewBox="0 0 200 100" role="img" aria-label="Símbolo de actor">
      <g stroke="#334155" stroke-width="2.5" fill="none" stroke-linecap="round">
        <circle cx="100" cy="24" r="14" fill="#ffffff"></circle>
        <line x1="100" y1="38" x2="100" y2="66"></line>
        <line x1="72" y1="50" x2="128" y2="50"></line>
        <line x1="100" y1="66" x2="78" y2="92"></line>
        <line x1="100" y1="66" x2="122" y2="92"></line>
      </g>
    </svg>`,

  node: `
    <svg viewBox="0 0 200 100" role="img" aria-label="Símbolo de nodo">
      <g stroke="#334155" stroke-width="2.5" stroke-linejoin="round">
        <polygon points="100,12 158,40 100,68 42,40" fill="#e2e8f0"></polygon>
        <polygon points="42,40 100,68 100,94 42,66" fill="#ffffff"></polygon>
        <polygon points="158,40 100,68 100,94 158,66" fill="#f1f5f9"></polygon>
      </g>
    </svg>`,

  interfaceLollipop: `
    <svg viewBox="0 0 200 100" role="img" aria-label="Símbolo de interfaz">
      <g stroke="#334155" stroke-width="2.5" fill="none">
        <line x1="35" y1="50" x2="122" y2="50"></line>
        <circle cx="140" cy="50" r="18" fill="#ffffff"></circle>
      </g>
    </svg>`,

  useCase: `
    <svg viewBox="0 0 200 100" role="img" aria-label="Símbolo de caso de uso">
      <ellipse cx="100" cy="50" rx="72" ry="32" fill="#ffffff" stroke="#334155" stroke-width="2.5"></ellipse>
      <text x="100" y="55" text-anchor="middle" font-size="13" font-family="system-ui, sans-serif" fill="#334155">Realizar pedido</text>
    </svg>`
};

// Los seis símbolos de relación se dibujan entre dos cajas de clase, leyéndose
// de izquierda a derecha (y dentro de cada caja, de arriba abajo: nombre,
// atributo y método). En la dificultad "hard" las cajas son neutras —para no
// delatar la respuesta— y se añaden las multiplicidades; la «1» nunca se
// dibuja (UML la omite).
const NEUTRAL_CLASS_LEFT = {
  name: "Clase A",
  attribute: "dato: String",
  method: "operación()"
};

const NEUTRAL_CLASS_RIGHT = {
  name: "Clase B",
  attribute: "dato: String",
  method: "operación()"
};

// Configuración de cada figura: textos de la izquierda y de la derecha, glifo
// del conector y multiplicidades (null = no se dibujan).
const RELATION_FIGURES = {
  composition: {
    label: "Símbolo de composición",
    left: { name: "Orden", attribute: "total: Decimal", method: "calcular()" },
    right: { name: "Línea de pedido", attribute: "cantidad: Int", method: "añadir()" },
    connector: "composition",
    multiplicity: { left: null, right: "0..*" }
  },
  aggregation: {
    label: "Símbolo de agregación",
    left: { name: "Equipo", attribute: "nombre: String", method: "jugar()" },
    right: { name: "Jugador", attribute: "número: Int", method: "marcar()" },
    connector: "aggregation",
    multiplicity: { left: "0..1", right: "0..*" }
  },
  association: {
    label: "Símbolo de asociación",
    left: { name: "Persona", attribute: "carné: String", method: "conducir()" },
    right: { name: "Vehículo", attribute: "matrícula: String", method: "arrancar()" },
    connector: "association",
    multiplicity: { left: "0..*", right: null }
  },
  dependency: {
    label: "Símbolo de dependencia",
    left: { name: "Factura", attribute: "importe: Decimal", method: "emitir()" },
    right: { name: "Cliente", attribute: "cuit: String", method: "pagar()" },
    connector: "dependency",
    multiplicity: null
  },
  generalization: {
    label: "Símbolo de generalización",
    left: { name: "Perro", attribute: "raza: String", method: "ladrar()" },
    right: { name: "Animal", attribute: "edad: Int", method: "comer()" },
    connector: "generalization",
    multiplicity: null
  },
  realization: {
    label: "Símbolo de realización",
    left: { name: "Pagador", attribute: "banco: String", method: "cobrar()" },
    right: { name: "Cobrable", attribute: "monto: Decimal", method: "cobrar()" },
    connector: "realization",
    interfaceRight: true,
    multiplicity: null
  }
};

// Caja de clase con sus tres compartimentos, en orden de lectura.
function classFigure(x, box, nameStyle) {
  const centerX = x + 52.5;
  return `
      <g stroke="#334155" stroke-width="2.5" fill="none" stroke-linejoin="round">
        <rect x="${x}" y="24" width="105" height="66"></rect>
        <line x1="${x}" y1="46" x2="${x + 105}" y2="46"></line>
        <line x1="${x}" y1="68" x2="${x + 105}" y2="68"></line>
      </g>
      <g fill="#334155" font-family="system-ui, sans-serif" text-anchor="middle">
        <text x="${centerX}" y="39" font-size="11"${nameStyle}>${box.name}</text>
        <text x="${centerX}" y="61" font-size="9">${box.attribute}</text>
        <text x="${centerX}" y="83" font-size="9">${box.method}</text>
      </g>`;
}

// Línea y glifo del símbolo, entre las dos cajas (de x=109 a x=241).
function connectorFigure(kind) {
  const lineStyle =
    'stroke="#334155" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const line = (x1, x2, dashed) =>
    `<line x1="${x1}" y1="57" x2="${x2}" y2="57" ${lineStyle}` +
    (dashed ? ' stroke-dasharray="10 8"' : "") + "></line>";
  const diamond =
    '<polygon points="109,57 120,44 131,57 120,70" fill="' +
    (kind === "composition" ? "#334155" : "#ffffff") +
    '" stroke="#334155" stroke-width="2.5" stroke-linejoin="round"></polygon>';
  const triangle =
    '<polygon points="211,43 241,57 211,71" fill="#ffffff" stroke="#334155" ' +
    'stroke-width="2.5" stroke-linejoin="round"></polygon>';
  const arrow =
    '<polyline points="229,49 241,57 229,65" stroke="#334155" stroke-width="2.5" ' +
    'fill="none" stroke-linecap="round" stroke-linejoin="round"></polyline>';

  switch (kind) {
    case "composition":
    case "aggregation":
      return diamond + line(131, 241, false);
    case "association":
      return line(109, 241, false);
    case "dependency":
      return line(109, 241, true) + arrow;
    case "generalization":
      return line(109, 211, false) + triangle;
    case "realization":
      return line(109, 211, true) + triangle;
    default:
      return "";
  }
}

// Multiplicidad de un extremo, sobre la línea; null no dibuja nada.
function multiplicityFigure(text, side) {
  if (!text) {
    return "";
  }
  const x = side === "left" ? 137 : 207;
  const anchor = side === "left" ? "start" : "end";
  return `
      <text x="${x}" y="49" font-size="10" fill="#334155" font-family="system-ui, sans-serif"
            text-anchor="${anchor}">${text}</text>`;
}

// Figura de un símbolo de relación para la dificultad actual.
function relationFigure(config) {
  const hard = state.difficulty === "hard";
  const left = hard ? NEUTRAL_CLASS_LEFT : config.left;
  const right = hard ? NEUTRAL_CLASS_RIGHT : config.right;
  const interfaceRight = !hard && config.interfaceRight === true;
  const multiplicity = hard ? config.multiplicity : null;
  const rightBox = {
    name: interfaceRight ? "«" + right.name + "»" : right.name,
    attribute: right.attribute,
    method: right.method
  };

  return `
    <svg viewBox="0 0 350 116" class="relation-svg" role="img" aria-label="${config.label}">
      ${classFigure(4, left, "")}
      ${multiplicity ? multiplicityFigure(multiplicity.left, "left") : ""}
      ${connectorFigure(config.connector)}
      ${multiplicity ? multiplicityFigure(multiplicity.right, "right") : ""}
      ${classFigure(241, rightBox, interfaceRight ? ' font-style="italic"' : "")}
    </svg>`;
}

// Dibujo de un símbolo: las seis relaciones se generan con `relationFigure`
// y el resto sale de `symbolShapes`.
function symbolFigure(symbol) {
  const config = RELATION_FIGURES[symbol];
  return config ? relationFigure(config) : symbolShapes[symbol];
}

// Descripción de cada símbolo: fuente única de verdad de las explicaciones.
// `syntax` explica cómo se dibuja y `meaning`, qué modela (UML 2.5).
const symbolFacts = {
  class: {
    name: "Clase",
    syntax: "Rectángulo con tres compartimentos: nombre, atributos y métodos.",
    meaning: "Define un tipo de objeto: qué datos guarda y qué comportamiento ofrece.",
    case: "Quieres describir el molde de una Persona con sus atributos y métodos, " +
      "antes de crear ninguna instancia."
  },
  object: {
    name: "Objeto",
    syntax: "Rectángulo de un solo compartimento con el nombre subrayado, como «ana: Persona».",
    meaning: "Es una instancia concreta de una clase, con sus valores de datos en un momento dado.",
    case: "Representas a la usuaria Ana con sus valores de ahora (31 años): " +
      "una instancia concreta, no el molde."
  },
  composition: {
    name: "Composición",
    syntax: "Línea con un rombo relleno en el extremo del todo.",
    meaning:
      "Relación parte-todo fuerte: la parte pertenece a un solo todo y, si el todo se elimina, " +
      "sus partes se eliminan con él.",
    case: "Una Orden no puede existir sin sus Líneas de pedido: si se elimina la Orden, " +
      "sus Líneas desaparecen con ella."
  },
  aggregation: {
    name: "Agregación",
    syntax: "Línea con un rombo hueco en el extremo del todo.",
    meaning:
      "Relación parte-todo débil: la parte puede existir sin el todo y compartirse entre varios " +
      "todos o no pertenecer a ninguno.",
    case: "Un Equipo se forma con Jugadores que pueden jugar en varios equipos a la vez " +
      "o seguir existiendo si el equipo se disuelve."
  },
  association: {
    name: "Asociación",
    syntax: "Línea continua que une dos clases.",
    meaning:
      "Relación estructural y duradera entre las instancias de las dos clases; puede llevar " +
      "multiplicidades en sus extremos.",
    case: "Las Personas conducen Vehículos de forma estable; la relación puede llevar " +
      "multiplicidades en sus extremos."
  },
  dependency: {
    name: "Dependencia",
    syntax: "Línea discontinua con flecha abierta, del elemento que depende al que provee.",
    meaning:
      "Un elemento necesita a otro para definirse o implementarse; si el proveedor cambia, " +
      "el cliente puede tener que cambiar también.",
    case: "La Factura necesita al Cliente para definirse: si cambian los datos del Cliente, " +
      "la Factura tendrá que cambiar también."
  },
  generalization: {
    name: "Generalización",
    syntax: "Línea continua con triángulo hueco en la punta, hacia el elemento padre.",
    meaning:
      "Relación «es un»: la subclase hereda los atributos y el comportamiento de la superclase.",
    case: "Perro hereda los atributos y el comportamiento de Animal porque es un tipo de Animal."
  },
  realization: {
    name: "Realización",
    syntax: "Línea discontinua con triángulo hueco en la punta, hacia el elemento que se realiza.",
    meaning:
      "Un elemento implementa la especificación definida por otro, por ejemplo cuando una clase " +
      "implementa una interfaz.",
    case: "La clase Pagador implementa por completo la especificación definida " +
      "en la interfaz «Cobrable»."
  },
  package: {
    name: "Paquete",
    syntax: "Carpeta con pestaña en la esquina superior izquierda y el nombre en su interior.",
    meaning: "Agrupa elementos relacionados del modelo para organizarlo en conjuntos manejables.",
    case: "Quieres reunir todas las clases del dominio de ventas en un contenedor " +
      "para dejar el modelo manejable."
  },
  component: {
    name: "Componente",
    syntax: "Rectángulo con dos rectángulos pequeños en el borde izquierdo.",
    meaning: "Unidad modular reemplazable del sistema que ofrece sus servicios mediante interfaces.",
    case: "El procesador de pagos se puede reemplazar por completo sin tocar el resto " +
      "del sistema y ofrece sus servicios al exterior."
  },
  note: {
    name: "Nota",
    syntax: "Rectángulo con la esquina superior derecha doblada.",
    meaning: "Comentario en lenguaje natural que aclara un diagrama; no es un elemento del modelo."
  },
  actor: {
    name: "Actor",
    syntax: "Figura de palo con cabeza, tronco, brazos y piernas.",
    meaning: "Rol de un usuario u otro sistema que interactúa con el sistema que se modela."
  },
  node: {
    name: "Nodo",
    syntax: "Cubo dibujado en tres dimensiones.",
    meaning: "Recurso físico o virtual, como un servidor, donde se despliegan los artefactos."
  },
  interfaceLollipop: {
    name: "Interfaz",
    syntax: "Círculo al final de la línea que sale de un elemento.",
    meaning: "Contrato de operaciones que un elemento ofrece a otros, sin describir su implementación."
  },
  useCase: {
    name: "Caso de uso",
    syntax: "Elipse con el nombre de la acción en su interior.",
    meaning: "Objetivo concreto que un actor alcanza interactuando con el sistema."
  }
};

// Índice nombre → símbolo, para pintar el dibujo de una opción (preguntas inversas).
const symbolIdByName = {};
Object.keys(symbolFacts).forEach((id) => {
  symbolIdByName[symbolFacts[id].name] = id;
});

// Las 10 preguntas de la sesión: el símbolo que se muestra y sus tres opciones.
// La respuesta correcta sale del glosario (`symbolFacts`), nunca se escribe a mano.
const questions = [
  { symbol: "class", options: ["Clase", "Objeto", "Actor"] },
  { symbol: "object", options: ["Objeto", "Clase", "Interfaz"] },
  { symbol: "composition", options: ["Composición", "Agregación", "Nota"] },
  { symbol: "aggregation", options: ["Agregación", "Composición", "Nodo"] },
  { symbol: "association", options: ["Asociación", "Dependencia", "Caso de uso"] },
  { symbol: "dependency", options: ["Dependencia", "Asociación", "Nota"] },
  { symbol: "package", options: ["Paquete", "Componente", "Actor"] },
  { symbol: "component", options: ["Componente", "Paquete", "Interfaz"] },
  { symbol: "generalization", options: ["Generalización", "Realización", "Nodo"] },
  { symbol: "realization", options: ["Realización", "Generalización", "Caso de uso"] }
];

// Clave donde se guarda el récord en localStorage.
const STORAGE_KEY = "uml-study-session";

/* ---------------------------------------------------------
   2. ESTADO DE LA APLICACIÓN
   --------------------------------------------------------- */

const state = {
  sessionQuestions: [], // preguntas de la sesión actual, en orden aleatorio
  currentIndex: 0, // número de la pregunta actual
  score: 0, // puntos de la sesión actual
  selectedOption: null, // opción (o texto) que ha marcado el usuario
  isAccepted: false, // si ya ha pulsado "Aceptar"
  difficulty: "normal", // dificultad elegida en el inicio: "normal" | "hard"
  sessionScores: [] // puntajes de esta página: { score, difficulty } (solo en memoria)
};

/* ---------------------------------------------------------
   3. ELEMENTOS DE LA PÁGINA
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
   4. PUNTUACIONES (localStorage)
   --------------------------------------------------------- */

// Devuelve el récord de cada dificultad. El formato antiguo (un solo número)
// se migra como récord de la dificultad "normal".
function loadRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return { normal: 0, hard: 0 };
    }

    const parsed = JSON.parse(stored);
    if (parsed !== null && typeof parsed === "object") {
      return {
        normal: Number.isFinite(parsed.normal) ? parsed.normal : 0,
        hard: Number.isFinite(parsed.hard) ? parsed.hard : 0
      };
    }
    return Number.isFinite(parsed) ? { normal: parsed, hard: 0 } : { normal: 0, hard: 0 };
  } catch (error) {
    return { normal: 0, hard: 0 };
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

// Ayuda que se muestra sobre las opciones (vacío en el tipo clásico).
const QUESTION_HINTS = {
  symbol: "",
  inverse: "Se te da el nombre: elige el símbolo que lo representa.",
  open: "Se muestra un símbolo: escribe su nombre.",
  case: "Elige la relación o el elemento más apropiado para el caso."
};

// Tipo de la pregunta `index`: la clásica en Normal y, en Difícil, las tres
// anteriores alternadas (4 inversas, 3 abiertas y 3 de caso en sesiones de 10).
function questionType(index) {
  if (state.difficulty !== "hard") {
    return "symbol";
  }
  return HARD_QUESTION_TYPES[index % HARD_QUESTION_TYPES.length];
}

function startSession() {
  state.sessionQuestions = shuffle(questions);
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

  answerBox.classList.toggle("is-hidden", type !== "open");
  answerInput.value = "";
  answerInput.disabled = false;
  optionsList.classList.toggle("is-hidden", type === "open");
  renderOptions(question, type);
}

// Enunciado: el símbolo (clásico y abierto), el nombre (inversa) o el caso.
function renderPrompt(question, type) {
  const fact = symbolFacts[question.symbol];

  if (type === "inverse") {
    appendPrompt("question-name", fact.name);
  } else if (type === "case") {
    appendPrompt("scenario", fact.case);
  } else {
    symbolBox.innerHTML = symbolFigure(question.symbol);
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

// Tres opciones: texto (clásico y caso) o el dibujo de cada símbolo (inversa).
function renderOptions(question, type) {
  optionsList.innerHTML = "";
  shuffle(question.options).forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.option = option;

    if (type === "inverse") {
      button.className = "option-button option-button--symbol";
      button.innerHTML = symbolFigure(symbolIdByName[option]);
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
  if (questionType(state.currentIndex) === "open") {
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

// Respuesta escrita a mano: se ignoran mayúsculas y espacios sobrantes
// («  Composición » cuenta como «composición»).
function normalizeAnswer(text) {
  return text.trim().toLowerCase();
}

// Construye los trozos de la explicación a partir del glosario `symbolFacts`.
// Solo se explica el símbolo correcto; si el usuario falla, el párrafo inicial
// pone su respuesta delante de la correcta.
function buildFeedback(question, chosenOption) {
  const correctFact = symbolFacts[question.symbol];
  const isCorrect =
    normalizeAnswer(chosenOption) === normalizeAnswer(correctFact.name);

  return {
    isCorrect: isCorrect,
    verdict: isCorrect ? "¡Correcto!" : "¡Incorrecto!",
    lead: isCorrect
      ? null
      : "Tu respuesta: «" +
        chosenOption.trim() +
        "». La respuesta correcta es «" +
        correctFact.name +
        "».",
    syntax: correctFact.syntax,
    meaning: correctFact.meaning
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
  const correctName = symbolFacts[question.symbol].name;

  optionsList.querySelectorAll(".option-button").forEach((button) => {
    button.disabled = true;
    button.classList.remove("is-selected");
    if (button.dataset.option === correctName) {
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

difficultySelect.addEventListener("change", () => {
  state.difficulty = difficultySelect.value;
  renderScores();
});

answerInput.addEventListener("input", () => {
  acceptButton.disabled = answerInput.value.trim() === "";
});

renderScores();
