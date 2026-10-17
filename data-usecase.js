"use strict";

/* =========================================================
   Modo «Diagramas de casos de uso»
   ========================================================= */

// Solo datos y funciones de dibujo: aquí no se toca el DOM ni el estado.
// index.html carga este archivo antes que app.js, que es quien lo usa.
//
// A diferencia de los otros tres bancos, estas preguntas son **autosuficientes**:
// llevan su propio enunciado, sus opciones, su respuesta y su explicación, en
// lugar de pedirle todo eso al glosario. La razón es que aquí no se pregunta por
// un símbolo suelto, sino por un diagrama completo: quién se comunica con qué,
// qué relación corresponde y por qué. La respuesta además no siempre es un nombre
// («U y R», «G, N y K»), sino un conjunto de actores o de casos de uso, que no
// cabe en `symbolFacts`.
//
// Para no tocar el glosario que comparten los otros modos, las dos relaciones que
// no existían allí —«include» y «extend»— viven aquí, en `useCaseFacts`. Todo lo
// demás (generalización, asociación con multiplicidades) reutiliza el glosario
// general tal cual está.
//
// Los diagramas de razonamiento van **neutros**, con letras (X, R, K…), por el
// mismo motivo que las cajas «Clase A/B» y las cabezas «Participante A/B»: el
// alumno tiene que leer la relación, no deducirla del nombre de los casos. Los
// diagramas de modelado sí llevan nombres reales, porque en ellos la respuesta es
// la relación y no el dominio.

/* ---------------------------------------------------------
   1. DIBUJOS
   --------------------------------------------------------- */

// Semialto de la elipse de un caso de uso.
const USE_CASE_ELLIPSE_RY = 18;

// La figura de un actor ocupa, desde el centro de la cabeza, unos 7 px hacia
// arriba (la cabeza) y 42 hacia abajo (las piernas), y 12 a cada lado (los
// brazos). Se recorta con esa elipse y no con un círculo alrededor de la cabeza:
// si no, la punta de la generalización se queda a la altura de la cintura y el
// triángulo acaba dibujado encima del torso del actor padre.
const USE_CASE_ACTOR_SHAPE = { offsetY: 17, rx: 13, ry: 26 };

// Ancho de la elipse de un caso de uso a partir de su nombre: el texto ocupa
// unos 6 px por carácter, más un margen para que no toque el borde.
function useCaseRadius(node) {
  return Math.max(34, Math.round((node.name.length * 6.2) / 2) + 10);
}

// Contorno con el que se recorta una línea al llegar a un nodo: el actor se
// recorta con la figura entera y el caso de uso con su elipse.
function useCaseShape(node) {
  if (node.type === "actor") {
    return {
      cx: node.x,
      cy: node.y + USE_CASE_ACTOR_SHAPE.offsetY,
      rx: USE_CASE_ACTOR_SHAPE.rx,
      ry: USE_CASE_ACTOR_SHAPE.ry
    };
  }

  return { cx: node.x, cy: node.y, rx: useCaseRadius(node), ry: USE_CASE_ELLIPSE_RY };
}

// Punto donde la línea que va de `node` hacia `toward` toca su borde. Es lo que
// hace que las asociaciones no se metan dentro de las elipses.
function useCaseTrimPoint(node, toward, shape) {
  const dx = toward.x - shape.cx;
  const dy = toward.y - shape.cy;
  const scale =
    1 / Math.sqrt((dx * dx) / (shape.rx * shape.rx) + (dy * dy) / (shape.ry * shape.ry));

  return { x: shape.cx + dx * scale, y: shape.cy + dy * scale };
}

// Un actor: figura de palo con cabeza, tronco, brazos y piernas, y el nombre
// debajo. `labelDx`, `labelDy` y `labelAnchor` desplazan la etiqueta, que hace
// falta cuando el actor tiene otro debajo y la línea de generalización ocuparía
// el sitio.
function useCaseActorFigure(node) {
  const x = node.x;
  const y = node.y;
  const labelX = x + (node.labelDx || 0);
  const labelY = y + (node.labelDy === undefined ? 56 : node.labelDy);
  const anchor = node.labelAnchor || "middle";

  return `
      <g stroke="#334155" stroke-width="2.5" fill="none" stroke-linecap="round">
        <circle cx="${x}" cy="${y}" r="7" fill="#ffffff"></circle>
        <line x1="${x}" y1="${y + 7}" x2="${x}" y2="${y + 25}"></line>
        <line x1="${x - 12}" y1="${y + 14}" x2="${x + 12}" y2="${y + 14}"></line>
        <line x1="${x}" y1="${y + 25}" x2="${x - 10}" y2="${y + 42}"></line>
        <line x1="${x}" y1="${y + 25}" x2="${x + 10}" y2="${y + 42}"></line>
      </g>
      <text x="${labelX}" y="${labelY}" text-anchor="${anchor}" font-size="11" fill="#334155"
            font-family="system-ui, sans-serif">${node.name}</text>`;
}

// Un caso de uso: elipse con el nombre dentro.
function useCaseEllipseFigure(node) {
  return `
      <ellipse cx="${node.x}" cy="${node.y}" rx="${useCaseRadius(node)}" ry="${USE_CASE_ELLIPSE_RY}"
               fill="#ffffff" stroke="#334155" stroke-width="2.5"></ellipse>
      <text x="${node.x}" y="${node.y + 4}" text-anchor="middle" font-size="11" fill="#334155"
            font-family="system-ui, sans-serif">${node.name}</text>`;
}

// ¿La etiqueta se solapa con la elipse de algún caso de uso? No importa cuál: si
// se monta sobre cualquiera, el texto queda ilegible.
function useCaseLabelHitsShape(point, nodes) {
  const halfWidth = 22;
  const halfHeight = 8;
  return nodes.some(function (node) {
    if (node.type !== "useCase") { return false; }
    const rx = useCaseRadius(node);
    const ry = USE_CASE_ELLIPSE_RY;
    // Se prueban los cuatro puntos medios de los lados de la caja del texto, que
    // es donde se detecta el solape en la práctica.
    const puntos = [
      [point.x - halfWidth, point.y],
      [point.x + halfWidth, point.y],
      [point.x, point.y - halfHeight],
      [point.x, point.y + halfHeight]
    ];
    return puntos.some(function (p) {
      const dx = (p[0] - node.x) / rx;
      const dy = (p[1] - node.y) / ry;
      return dx * dx + dy * dy < 1;
    });
  });
}

// Dónde poner la etiqueta de una relación: sobre la perpendicular a la línea,
// probando varias distancias y quedándose con el primer hueco que quepa en el
// lienzo y no caiga encima de ninguna elipse.
//
// Las distancias no son un capricho: 34 es lo justo para que el texto no tape la
// punta de flecha, que sobresale 6 px. Si ese hueco está ocupado —pasa con las
// relaciones diagonales, donde el lado de arriba cae contra la elipse de origen—
// se va más lejos hasta encontrar aire.
function useCaseLabelPosition(start, end, normalX, normalY, width, height, nodes) {
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const enDistancia = function (distance, sign) {
    return {
      x: middle.x + normalX * distance * sign,
      y: middle.y + normalY * distance * sign
    };
  };
  const dentroDelLienzo = function (point) {
    return point.x > 24 && point.x < width - 24 && point.y > 12 && point.y < height - 6;
  };

  // De las dos caras se prefiere la de arriba: es la que menos se cruza con el
  // resto del dibujo.
  const signos = normalY < 0 ? [1, -1] : [-1, 1];
  const distancias = [34, 50, 66];

  for (const distancia of distancias) {
    for (const signo of signos) {
      const point = enDistancia(distancia, signo);
      if (dentroDelLienzo(point) && !useCaseLabelHitsShape(point, nodes || [])) {
        return point;
      }
    }
  }

  // Sin hueco limpio (no debería pasar con las figuras actuales): al menos que
  // no se salga del lienzo.
  return enDistancia(34, signos[0]);
}

// Una relación entre dos nodos del diagrama:
//   «association»     línea continua, sin nada en la punta.
//   «generalization»  línea continua con triángulo hueco en el padre.
//   «extend»/«include» línea discontinua con punta de flecha abierta.
// La etiqueta del estereotipo («extend», «include») solo se dibuja si la relación
// la pide: en las preguntas de nombre va oculta, que es justo lo que hay que
// adivinar, y en las de modelado se ve porque la opción es el modelo completo.
function useCaseEdge(byName, edge, width, height, nodes) {
  const from = byName[edge.from];
  const to = byName[edge.to];
  const start = useCaseTrimPoint(from, to, useCaseShape(from));
  const end = useCaseTrimPoint(to, from, useCaseShape(to));

  const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
  const unitX = (end.x - start.x) / length;
  const unitY = (end.y - start.y) / length;
  const normalX = -unitY;
  const normalY = unitX;

  const line =
    `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#334155"` +
    (edge.kind === "extend" || edge.kind === "include" ? ' stroke-dasharray="8 6"' : "") +
    ' stroke-width="2"></line>';

  if (edge.kind === "association") {
    return line;
  }

  if (edge.kind === "generalization") {
    const baseX = end.x - unitX * 20;
    const baseY = end.y - unitY * 20;
    const points =
      `${end.x},${end.y} ` +
      `${baseX + normalX * 7},${baseY + normalY * 7} ` +
      `${baseX - normalX * 7},${baseY - normalY * 7}`;

    return (
      line +
      `\n      <polygon points="${points}" fill="#ffffff" stroke="#334155" stroke-width="2.5"
              stroke-linejoin="round"></polygon>`
    );
  }

  const wingX = end.x - unitX * 15;
  const wingY = end.y - unitY * 15;
  const points =
    `${end.x},${end.y} ` +
    `${wingX + normalX * 6},${wingY + normalY * 6} ` +
    `${wingX - normalX * 6},${wingY - normalY * 6}`;

  if (!edge.stereotype) {
    return (
      `<line x1="${start.x}" y1="${start.y}" x2="${wingX}" y2="${wingY}" stroke="#334155"
             stroke-dasharray="8 6" stroke-width="2"></line>` +
      `\n      <polyline points="${points}" stroke="#334155" stroke-width="2.5" fill="none"
              stroke-linecap="round" stroke-linejoin="round"></polyline>`
    );
  }

  const label = useCaseLabelPosition(start, end, normalX, normalY, width, height, nodes);

  return (
    `<line x1="${start.x}" y1="${start.y}" x2="${wingX}" y2="${wingY}" stroke="#334155"
           stroke-dasharray="8 6" stroke-width="2"></line>` +
    `\n      <polyline points="${points}" stroke="#334155" stroke-width="2.5" fill="none"
            stroke-linecap="round" stroke-linejoin="round"></polyline>` +
    `\n      <text x="${label.x}" y="${label.y}" text-anchor="middle" font-size="10" fill="#334155"
            font-family="system-ui, sans-serif">${edge.stereotype}</text>`
  );
}

// Una multiplicidad, sobre su relación y cerca del actor. En este modo el «1» sí
// se dibuja cuando hace falta: es justamente lo que distingue «un alumno y al
// menos un profesor» de una asociación sin multiplicidades, y en el resto de modos
// no se dibuja porque allí no aporta nada.
function useCaseMultiplicity(byName, item) {
  const from = byName[item.from];
  const to = byName[item.to];
  const start = useCaseTrimPoint(from, to, useCaseShape(from));
  const end = useCaseTrimPoint(to, from, useCaseShape(to));

  const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
  const normalX = -(end.y - start.y) / length;
  const normalY = (end.x - start.x) / length;
  const middle = { x: start.x + (end.x - start.x) * 0.28, y: start.y + (end.y - start.y) * 0.28 };
  const first = { x: middle.x + normalX * 14, y: middle.y + normalY * 14 };
  const second = { x: middle.x - normalX * 14, y: middle.y - normalY * 14 };
  const position = first.y <= second.y ? first : second;

  return `
      <text x="${position.x}" y="${position.y}" text-anchor="middle" font-size="10" fill="#334155"
            font-family="system-ui, sans-serif">${item.text}</text>`;
}

// Un diagrama de casos de uso a partir de su descripción:
//   nodes        actores ({ type: "actor" }) y casos de uso ({ type: "useCase" }).
//   edges        relaciones entre ellos, con su clase.
//   multiplicities, boundary, width y height, opcionales.
function useCaseFigure(spec) {
  const width = spec.width || 350;
  const height = spec.height || 180;

  const byName = {};
  spec.nodes.forEach((node) => {
    byName[node.name] = node;
  });

  const boundary = spec.boundary
    ? `
      <rect x="${spec.boundary.x}" y="${spec.boundary.y}" width="${spec.boundary.width}"
            height="${spec.boundary.height}" fill="none" stroke="#64748b" stroke-width="1.5"
            rx="2"></rect>`
    : "";

  const edges = (spec.edges || [])
    .map((edge) => useCaseEdge(byName, edge, width, height, spec.nodes))
    .join("\n      ");
  const multiplicities = (spec.multiplicities || [])
    .map((item) => useCaseMultiplicity(byName, item))
    .join("\n      ");
  const nodes = spec.nodes
    .map((node) =>
      node.type === "actor" ? useCaseActorFigure(node) : useCaseEllipseFigure(node)
    )
    .join("\n      ");

  return `
    <svg viewBox="0 0 ${width} ${height}" class="usecase-svg" role="img" aria-label="${spec.label}">
      ${boundary}
      ${edges}
      ${multiplicities}
      ${nodes}
    </svg>`;
}

/* ---------------------------------------------------------
   2. GLOSARIO PROPIO
   --------------------------------------------------------- */

// Las dos relaciones de casos de uso que no estaban en el glosario general. Se
// quedan aquí para no alterar `symbolFacts`, que comparten los otros tres modos.
// Cada entrada es un símbolo de esos, así que `questionFacts` de app.js las
// encuentra por el mismo camino.
const useCaseFacts = {
  include: {
    name: "Inclusión",
    syntax:
      "Línea discontinua con punta de flecha abierta y la etiqueta «include», que va " +
      "del caso que incluye al caso incluido.",
    meaning:
      "Comportamiento obligatorio y reutilizado: al ejecutarse el caso que incluye, " +
      "el caso incluido se ejecuta siempre, y puede ser llamado desde varios casos."
  },
  extend: {
    name: "Extensión",
    syntax:
      "Línea discontinua con punta de flecha abierta y la etiqueta «extend», que va " +
      "del caso que extiende al caso base.",
    meaning:
      "Comportamiento opcional: el caso que extiende aporta una parte que solo se " +
      "ejecuta cuando se cumple una condición, y el caso base no la ejecuta por sí solo."
  }
};

/* ---------------------------------------------------------
   3. DIAGRAMAS
   --------------------------------------------------------- */

// Diagramas de las preguntas de razonamiento (letras neutras) y de las de nombre.
const USE_CASE_FIGURE_SPECS = {
  // Actores con generalización: X alcanza A y B; Y hereda de X y además se asocia
  // directamente a B.
  actorInheritance: {
    label: "Diagrama de casos de uso con dos actores y generalización entre ellos",
    width: 350,
    height: 210,
    boundary: { x: 150, y: 10, width: 175, height: 150 },
    nodes: [
      { type: "actor", name: "X", x: 40, y: 28, labelDy: -18 },
      { type: "actor", name: "Y", x: 40, y: 140, labelDy: 56 },
      { type: "useCase", name: "A", x: 240, y: 55 },
      { type: "useCase", name: "B", x: 240, y: 130 }
    ],
    edges: [
      // La punta va al padre: la hereda Y desde X.
      { from: "Y", to: "X", kind: "generalization" },
      { from: "X", to: "A", kind: "association" },
      { from: "X", to: "B", kind: "association" },
      { from: "Y", to: "B", kind: "association" }
    ]
  },

  // G extiende a K y R se asocia a G: quien llega a G llega también a K. Cada
  // actor se asocia a los casos de su propia columna, para que ninguna
  // asociación atraviese otra elipse.
  extendReachesBase: {
    label: "Diagrama de casos de uso con una relación extend entre dos casos",
    width: 380,
    height: 210,
    boundary: { x: 85, y: 12, width: 210, height: 180 },
    nodes: [
      { type: "actor", name: "S", x: 25, y: 34, labelDy: -18 },
      { type: "actor", name: "R", x: 25, y: 150, labelDy: 56 },
      { type: "actor", name: "U", x: 355, y: 112, labelDy: 56 },
      { type: "useCase", name: "A", x: 140, y: 62 },
      { type: "useCase", name: "N", x: 250, y: 62 },
      { type: "useCase", name: "G", x: 140, y: 140 },
      { type: "useCase", name: "K", x: 250, y: 140 }
    ],
    edges: [
      { from: "R", to: "S", kind: "generalization" },
      { from: "G", to: "K", kind: "extend", stereotype: "«extend»" },
      { from: "S", to: "A", kind: "association" },
      { from: "R", to: "G", kind: "association" },
      { from: "U", to: "N", kind: "association" },
      { from: "U", to: "K", kind: "association" }
    ]
  },

  // R hereda de S: alcanza lo de S (N y G, en su columna) y además su propio caso
// (K, más abajo). Los tres casos van en la misma columna y en el mismo orden que
// los actores, para que ninguna asociación cruce a otra ni atraviese una elipse.
  actorOwnCases: {
    label: "Diagrama de casos de uso con un actor que hereda de otro",
    width: 340,
    height: 230,
    boundary: { x: 120, y: 12, width: 200, height: 200 },
    nodes: [
      { type: "actor", name: "S", x: 48, y: 34, labelDy: -18 },
      { type: "actor", name: "R", x: 48, y: 150, labelDy: 56 },
      { type: "useCase", name: "N", x: 230, y: 45 },
      { type: "useCase", name: "G", x: 230, y: 115 },
      { type: "useCase", name: "K", x: 230, y: 185 }
    ],
    edges: [
      { from: "R", to: "S", kind: "generalization" },
      { from: "S", to: "N", kind: "association" },
      { from: "S", to: "G", kind: "association" },
      { from: "R", to: "K", kind: "association" }
    ]
  },

  // Relación «extend» entre dos casos de un taller, con el estereotipo a la vista.
  extendNaming: {
    label: "Relación de extensión entre dos casos de uso",
    width: 360,
    height: 175,
    boundary: { x: 125, y: 12, width: 210, height: 155 },
    nodes: [
      { type: "actor", name: "Empleado", x: 48, y: 52 },
      { type: "useCase", name: "tramitar permiso", x: 225, y: 45 },
      { type: "useCase", name: "conceder permiso", x: 225, y: 118 }
    ],
    edges: [
      { from: "Empleado", to: "tramitar permiso", kind: "association" },
      { from: "conceder permiso", to: "tramitar permiso", kind: "extend", stereotype: "«extend»" }
    ]
  },

  // Relación «include» entre dos casos de un taller, con el estereotipo a la vista.
  // Los dos casos van en diagonal y bien separados: si se juntan, la etiqueta
  // «include» no tiene hueco libre entre ellos.
  includeNaming: {
    label: "Relación de inclusión entre dos casos de uso",
    width: 400,
    height: 185,
    boundary: { x: 118, y: 12, width: 250, height: 155 },
    nodes: [
      { type: "actor", name: "Cliente", x: 48, y: 92 },
      { type: "useCase", name: "devolver artículo", x: 195, y: 45 },
      { type: "useCase", name: "elegir transporte", x: 290, y: 130 }
    ],
    edges: [
      { from: "Cliente", to: "devolver artículo", kind: "association" },
      {
        from: "devolver artículo",
        to: "elegir transporte",
        kind: "include",
        stereotype: "«include»"
      }
    ]
  },

  // Generalización entre dos casos de uso: línea continua y triángulo hueco, sin
  // etiqueta, porque el triángulo ya la identifica.
  caseGeneralization: {
    label: "Generalización entre dos casos de uso",
    width: 330,
    height: 150,
    nodes: [
      { type: "useCase", name: "examen oral", x: 95, y: 45 },
      { type: "useCase", name: "examen", x: 235, y: 100 }
    ],
    edges: [{ from: "examen oral", to: "examen", kind: "generalization" }]
  }
};

// Diagramas que se ofrecen como opciones de las preguntas de modelado: cada
// pregunta trae tres, y solo uno modela bien la situación.
const USE_CASE_OPTION_FIGURE_SPECS = {
  extend: {
    label: "Un caso que extiende a otro",
    width: 340,
    height: 145,
    boundary: { x: 120, y: 8, width: 205, height: 125 },
    nodes: [
      { type: "actor", name: "Mecánico", x: 48, y: 68 },
      { type: "useCase", name: "reparar automóvil", x: 205, y: 38 },
      { type: "useCase", name: "cambiar unidad de freno", x: 205, y: 100 }
    ],
    edges: [
      { from: "Mecánico", to: "reparar automóvil", kind: "association" },
      {
        from: "cambiar unidad de freno",
        to: "reparar automóvil",
        kind: "extend",
        stereotype: "«extend»"
      }
    ]
  },

  include: {
    label: "Un caso que incluye a otro",
    width: 340,
    height: 145,
    boundary: { x: 120, y: 8, width: 205, height: 125 },
    nodes: [
      { type: "actor", name: "Empleado", x: 48, y: 68 },
      { type: "useCase", name: "registrar pedido", x: 190, y: 38 },
      { type: "useCase", name: "calcular tarifa de envío", x: 205, y: 100 }
    ],
    edges: [
      { from: "Empleado", to: "registrar pedido", kind: "association" },
      {
        from: "registrar pedido",
        to: "calcular tarifa de envío",
        kind: "include",
        stereotype: "«include»"
      }
    ]
  },

  association: {
    label: "Un caso de uso asociado a un actor",
    width: 340,
    height: 145,
    boundary: { x: 120, y: 8, width: 205, height: 125 },
    nodes: [
      { type: "actor", name: "Empleado", x: 48, y: 68 },
      { type: "useCase", name: "registrar pedido", x: 200, y: 38 },
      { type: "useCase", name: "calcular tarifa de envío", x: 205, y: 100 }
    ],
    edges: [
      { from: "Empleado", to: "registrar pedido", kind: "association" },
      { from: "registrar pedido", to: "calcular tarifa de envío", kind: "association" }
    ]
  },

  multiplicity: {
    label: "Un caso de uso con multiplicidades de uno y de uno o varios",
    width: 340,
    height: 175,
    boundary: { x: 150, y: 20, width: 180, height: 125 },
    nodes: [
      { type: "actor", name: "Alumno", x: 72, y: 38, labelDx: -16, labelDy: 4, labelAnchor: "end" },
      {
        type: "actor",
        name: "Profesor",
        x: 72,
        y: 118,
        labelDx: -16,
        labelDy: 4,
        labelAnchor: "end"
      },
      { type: "useCase", name: "impartir examen", x: 245, y: 75 }
    ],
    edges: [
      { from: "Alumno", to: "impartir examen", kind: "association" },
      { from: "Profesor", to: "impartir examen", kind: "association" }
    ],
    multiplicities: [
      { from: "Alumno", to: "impartir examen", text: "1" },
      { from: "Profesor", to: "impartir examen", text: "1..*" }
    ]
  },

  actorGeneralization: {
    label: "Un actor que hereda de otro sobre un mismo caso de uso",
    width: 340,
    height: 175,
    boundary: { x: 150, y: 20, width: 180, height: 125 },
    nodes: [
      {
        type: "actor",
        name: "Docente",
        x: 72,
        y: 28,
        labelDx: -16,
        labelDy: 4,
        labelAnchor: "end"
      },
      {
        type: "actor",
        name: "Profesor",
        x: 72,
        y: 118,
        labelDx: -16,
        labelDy: 4,
        labelAnchor: "end"
      },
      { type: "useCase", name: "impartir examen", x: 245, y: 75 }
    ],
    edges: [
      { from: "Profesor", to: "Docente", kind: "generalization" },
      { from: "Docente", to: "impartir examen", kind: "association" },
      { from: "Profesor", to: "impartir examen", kind: "association" }
    ]
  },

  generalizationBoth: {
    label: "Generalización a la vez en un actor y en un caso de uso",
    width: 400,
    height: 200,
    boundary: { x: 105, y: 12, width: 190, height: 170 },
    nodes: [
      { type: "actor", name: "Maestro", x: 45, y: 28, labelDy: -18 },
      { type: "actor", name: "Profesor", x: 45, y: 132, labelDy: 56 },
      { type: "actor", name: "Alumno", x: 355, y: 80, labelDy: 56 },
      { type: "useCase", name: "examen", x: 200, y: 50 },
      { type: "useCase", name: "examen oral", x: 200, y: 120 }
    ],
    edges: [
      { from: "Profesor", to: "Maestro", kind: "generalization" },
      { from: "examen oral", to: "examen", kind: "generalization" },
      { from: "Maestro", to: "examen", kind: "association" },
      { from: "Profesor", to: "examen oral", kind: "association" },
      { from: "Alumno", to: "examen", kind: "association" }
    ]
  },

  extendOnCase: {
    label: "Un caso que extiende a otro en vez de heredarlo",
    width: 400,
    height: 200,
    boundary: { x: 105, y: 12, width: 190, height: 170 },
    nodes: [
      { type: "actor", name: "Maestro", x: 45, y: 28, labelDy: -18 },
      { type: "actor", name: "Profesor", x: 45, y: 132, labelDy: 56 },
      { type: "actor", name: "Alumno", x: 355, y: 80, labelDy: 56 },
      { type: "useCase", name: "examen", x: 200, y: 50 },
      { type: "useCase", name: "examen oral", x: 200, y: 120 }
    ],
    edges: [
      { from: "Maestro", to: "examen", kind: "association" },
      { from: "Alumno", to: "examen", kind: "association" },
      {
        from: "examen oral",
        to: "examen",
        kind: "extend",
        stereotype: "«extend»"
      },
      { from: "Profesor", to: "examen oral", kind: "association" }
    ]
  },

  includeOral: {
    label: "Un caso que incluye a otro en vez de heredarlo",
    width: 400,
    height: 200,
    boundary: { x: 105, y: 12, width: 190, height: 170 },
    nodes: [
      { type: "actor", name: "Maestro", x: 45, y: 28, labelDy: -18 },
      { type: "actor", name: "Profesor", x: 45, y: 132, labelDy: 56 },
      { type: "actor", name: "Alumno", x: 355, y: 80, labelDy: 56 },
      { type: "useCase", name: "examen", x: 200, y: 50 },
      { type: "useCase", name: "examen oral", x: 200, y: 120 }
    ],
    edges: [
      { from: "Maestro", to: "examen", kind: "association" },
      { from: "Alumno", to: "examen", kind: "association" },
      { from: "Profesor", to: "examen", kind: "association" },
      {
        from: "examen oral",
        to: "examen",
        kind: "include",
        stereotype: "«include»"
      }
    ]
  }
};

/* ---------------------------------------------------------
   4. DIBUJOS CONSTRUIDOS
   --------------------------------------------------------- */

// Lo que la app usa: cada especificación ya pasada por el generador. Las
// especificaciones se guardan aparte porque son la fuente — de ellas salen los
// SVG, y así se pueden revisar las coordenadas sin mirar el dibujo.
function drawAll(specs) {
  const drawings = {};
  Object.keys(specs).forEach(function (name) {
    drawings[name] = useCaseFigure(specs[name]);
  });
  return drawings;
}

const USE_CASE_FIGURES = drawAll(USE_CASE_FIGURE_SPECS);
const USE_CASE_OPTION_FIGURES = drawAll(USE_CASE_OPTION_FIGURE_SPECS);

/* ---------------------------------------------------------
   5. BANCO DE PREGUNTAS
   --------------------------------------------------------- */

// Diez preguntas que se reparten en tres tipos por posición (`i % 3` en app.js),
// de modo que salen cuatro de modelado, tres de nombre y tres de razonamiento.
//
//   usecase-model   situación escrita → elegir el diagrama que la modela.
//   usecase-name    diagrama → escribir el nombre de la relación.
//   usecase-reason  diagrama completo → elegir la respuesta, con su razonamiento.
//
// Todas llevan `selfContained: true`, que es lo que hace que app.js las resuelva
// con sus propios datos en vez de con el glosario general.
const useCaseQuestions = [
  {
    // 0 · modelado de «extend»: la parte opcional va en su propio caso.
    selfContained: true,
    type: "usecase-model",
    symbol: "extend",
    scenario:
      "En un taller, el mecánico repara el automóvil y, durante esa reparación, puede " +
      "llegar a hacer falta cambiar la unidad de freno.",
    options: ["extend", "include", "association"],
    answer: "extend"
  },
  {
    // 1 · nombre de la relación «extend».
    selfContained: true,
    type: "usecase-name",
    symbol: "extend",
    figure: "extendNaming",
    answer: "Extensión"
  },
  {
    // 2 · razonamiento: la herencia de actores se suma a la asociación directa.
    selfContained: true,
    type: "usecase-reason",
    symbol: "generalization",
    figure: "actorInheritance",
    prompt: "¿Qué actores se comunican con el caso de uso B?",
    options: ["X e Y", "Solo X", "Solo Y"],
    answer: "X e Y",
    reason:
      "Y hereda de X, así que alcanza todo lo que alcanza X: los dos casos. Además Y " +
      "tiene su propia asociación con B. X se asocia a B directamente, así que los " +
      "dos actores se comunican con B por vías distintas."
  },
  {
    // 3 · modelado de «include»: el comportamiento obligatorio va en su propio caso.
    selfContained: true,
    type: "usecase-model",
    symbol: "include",
    scenario:
      "Al registrar un pedido, el sistema tiene que calcular la tarifa de envío y " +
      "guardar la copia en el archivo. Las dos operaciones hacen falta en todos los " +
      "pedidos, también al devolverlos.",
    options: ["include", "extend", "association"],
    answer: "include"
  },
  {
    // 4 · nombre de la relación «include».
    selfContained: true,
    type: "usecase-name",
    symbol: "include",
    figure: "includeNaming",
    answer: "Inclusión"
  },
  {
    // 5 · razonamiento: asociación directa, no alcance. El que llega al caso que
    // extiende por G no se comunica directamente con el base, y la herencia de
    // actores va del hijo al padre, no al revés.
    selfContained: true,
    type: "usecase-reason",
    symbol: "extend",
    figure: "extendReachesBase",
    prompt: "¿Qué actores se comunican directamente con el caso de uso K?",
    options: ["U y R", "U, R y S", "Solo U"],
    answer: "Solo U",
    reason:
      "U se asocia directamente a K. R no: se asocia a G, y que G extiende a K no " +
      "convierte esa extensión en una asociación directa con K. " +
      "S no: R hereda de S, y la herencia va de R hacia S, nunca al revés, " +
      "así que S no hereda los casos de R."
  },
  {
    // 6 · modelado con multiplicidades: el «1» y el «1..*» son el enunciado.
    selfContained: true,
    type: "usecase-model",
    symbol: "association",
    scenario:
      "Para impartir un examen hace falta un alumno y al menos un profesor.",
    options: ["multiplicity", "actorGeneralization", "association"],
    answer: "multiplicity"
  },
  {
    // 7 · nombre de la generalización entre casos de uso.
    selfContained: true,
    type: "usecase-name",
    symbol: "generalization",
    figure: "caseGeneralization",
    answer: "Generalización"
  },
  {
    // 8 · razonamiento: los casos propios del actor más los que hereda.
    selfContained: true,
    type: "usecase-reason",
    symbol: "generalization",
    figure: "actorOwnCases",
    prompt: "¿Con qué casos de uso se comunica el actor R?",
    options: ["K, N y G", "Solo K", "K y G"],
    answer: "K, N y G",
    reason:
      "R se asocia directamente a K. Como R hereda de S, alcanza también N y G, que " +
      "son los de S. Los tres, los suyos y los heredados."
  },
  {
    // 9 · modelado con generalización a la vez en el actor y en el caso de uso.
    selfContained: true,
    type: "usecase-model",
    symbol: "generalization",
    scenario:
      "En un examen deben estar un alumno y un maestro. Si el examen es oral, un " +
      "profesor actúa como segundo examinador.",
    options: ["generalizationBoth", "extendOnCase", "includeOral"],
    answer: "generalizationBoth"
  }
];