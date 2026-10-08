"use strict";

/* =========================================================
   Tutor de UML — datos y contenido
   ========================================================= */

// Solo datos y funciones de dibujo: aquí no se toca el DOM ni el estado.
// index.html carga este archivo antes que app.js, que es quien lo usa.

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
    right: { name: "Cobrable", method: "cobrar()" },
    connector: "realization",
    interfaceRight: true,
    multiplicity: null
  }
};

// Caja de clase con sus tres compartimentos, en orden de lectura. La interfaz
// se dibuja con solo nombre y operaciones: en UML especifica comportamiento y
// no lleva atributos, así que su caja tiene un compartimento menos.
function classFigure(x, box, nameStyle, isInterface) {
  const centerX = x + 52.5;

  if (isInterface) {
    return `
      <g stroke="#334155" stroke-width="2.5" fill="none" stroke-linejoin="round">
        <rect x="${x}" y="29" width="105" height="56"></rect>
        <line x1="${x}" y1="57" x2="${x + 105}" y2="57"></line>
      </g>
      <g fill="#334155" font-family="system-ui, sans-serif" text-anchor="middle">
        <text x="${centerX}" y="44" font-size="11"${nameStyle}>${box.name}</text>
        <text x="${centerX}" y="76" font-size="9">${box.method}</text>
      </g>`;
  }

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

// Figura de un símbolo de relación para la dificultad indicada. Con `neutral`
// las cajas van siempre como «Clase A»/«Clase B»: lo usa la dificultad difícil
// y los diagramas de práctica, para que el símbolo se reconozca por su conector
// y no por los nombres.
function relationFigure(config, difficulty, neutral) {
  const useNeutral = neutral === true || difficulty === "hard";
  const left = useNeutral ? NEUTRAL_CLASS_LEFT : config.left;
  const right = useNeutral ? NEUTRAL_CLASS_RIGHT : config.right;
  const interfaceRight = !useNeutral && config.interfaceRight === true;
  const multiplicity = difficulty === "hard" ? config.multiplicity : null;
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
      ${classFigure(241, rightBox, interfaceRight ? ' font-style="italic"' : "", interfaceRight)}
    </svg>`;
}

// Dibujo de un símbolo: las seis relaciones se generan con `relationFigure`
// y el resto sale de `symbolShapes`.
function symbolFigure(symbol, difficulty, neutral) {
  const config = RELATION_FIGURES[symbol];
  return config ? relationFigure(config, difficulty, neutral) : symbolShapes[symbol];
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

// Banco de la dificultad de práctica: los mismos 10 símbolos con contextos
// nuevos, escritos para que el alumno razone el porqué (ciclo de vida,
// propiedad, «es un», contrato…) en vez de solo reconocer el dibujo.
// Cada `context` sirve como enunciado de la pregunta `context` (lenguaje
// natural → UML) y como opción correcta de la pregunta `explain`
// (diagrama → lenguaje natural). Las opciones con las que se elige el símbolo
// se heredan de `questions`, para no duplicar los distractores.
const practiceQuestions = [
  {
    symbol: "class",
    context:
      "Todos los usuarios del sistema deben tener los mismos atributos (nombre, email) y las " +
      "mismas operaciones (loguearse, cambiar la clave), sin que haya todavía valores concretos. " +
      "¿Qué elemento define esa estructura común que comparten todas las instancias?"
  },
  {
    symbol: "object",
    context:
      "Ya existe la clase Producto y ahora necesitas representar el producto concreto con código " +
      "«A-100», con precio 12,50 € y 3 unidades en stock en este momento. ¿Qué elemento " +
      "representa ese ejemplar con sus valores?"
  },
  {
    symbol: "composition",
    context:
      "En un hotel, una Habitación se reserva solo dentro de una Estancia; si la Estancia se " +
      "elimina del sistema, la reserva de la habitación ya no tiene sentido y debe desaparecer " +
      "con ella. ¿Qué relación modela que la parte vive y muere con el todo?"
  },
  {
    symbol: "aggregation",
    context:
      "Un Coche se compone de sus Ruedas, pero si el Coche se desguaza, las Ruedas pueden " +
      "aprovecharse en otro vehículo. ¿Qué relación modela esa parte-todo en la que la parte " +
      "puede sobrevivir al todo?"
  },
  {
    symbol: "association",
    context:
      "Un Alumno se matricula en varios Cursos y el sistema debe recordar durante años qué alumno " +
      "está en qué curso, de modo que ambos sigan existiendo por separado. ¿Qué relación modela " +
      "ese vínculo estructural duradero entre dos clases?"
  },
  {
    symbol: "dependency",
    context:
      "La clase Ticket usa los métodos de la clase Impresora solo mientras se genera el PDF del " +
      "ticket, sin guardar la impresora como atributo. ¿Qué relación expresa que una clase " +
      "necesita a otra de forma temporal?"
  },
  {
    symbol: "package",
    context:
      "El modelo tiene 150 clases y nadie encuentra las del dominio de notificaciones; quieres " +
      "agruparlas en un bloque con nombre para organizarlo, sin añadir código ni comportamiento. " +
      "¿Qué elemento sirve para agrupar elementos relacionados en un contenedor?"
  },
  {
    symbol: "component",
    context:
      "El módulo de cobros trabaja con Paypal, pero en Navidad quieren cambiar a Stripe sin tocar " +
      "el código del resto del sistema. ¿Qué elemento modela una unidad que se puede reemplazar " +
      "por completo y que ofrece sus servicios como un contrato?"
  },
  {
    symbol: "generalization",
    context:
      "Vehículo tiene los atributos (matrícula, marca) y el comportamiento (arrancar) que " +
      "comparten Coche y Moto, y cada uno añade los suyos. ¿Qué relación expresa que Coche y Moto " +
      "SON un Vehículo y heredan lo común?"
  },
  {
    symbol: "realization",
    context:
      "La interfaz Registro define qué operaciones debe tener cualquier sistema que guarde datos, " +
      "y la clase FicheroPlano cumple ese contrato implementándolas, sin heredar de otra clase. " +
      "¿Qué relación expresa que una clase implementa la especificación de una interfaz?"
  }
];

// Clave donde se guarda el récord en localStorage.
const STORAGE_KEY = "uml-study-session";
