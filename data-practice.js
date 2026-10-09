/* =========================================================
   Banco de las dificultades de práctica — Práctica UML básico
   y Práctica UML completo
   ========================================================= */

// Solo datos y funciones de dibujo: aquí no se toca el DOM ni el estado.
// index.html carga este archivo antes que app.js, que es quien lo usa.
//
// Los dos bancos tienen la misma forma de pregunta: el símbolo y un escenario
// escrito para que el alumno razone el porqué (ciclo de vida, propiedad, «es
// un», contrato…) en vez de solo reconocer el dibujo.
//
// Cada escenario sigue el mismo patrón que los casos de Difícil (`symbolFacts`):
// una frase declarativa con la situación, sin pregunta y sin definir el símbolo.
// Así las tres opciones de las preguntas `explain` (diagrama → lenguaje natural)
// son intercambiables y la correcta no se distingue por su redacción. Por eso
// estos bancos no reutilizan ningún `case` de Difícil: cada dificultad tiene los
// suyos. Por la misma razón, *Práctica UML básico* y *Práctica UML completo*
// escriben sus propios escenarios, sin repetir ni una palabra entre ellos.
//
// Cada `scenario` sirve como enunciado de la pregunta `context` (lenguaje
// natural → UML) y como opción correcta de la pregunta `explain` (diagrama →
// lenguaje natural); de los escenarios de otros símbolos salen sus distractores.
// Las opciones con las que se elige el símbolo salen de `NAME_OPTIONS`.

// *Práctica UML básico*: los diez símbolos del banco de *Normal*, con un
// escenario distinto al de cualquier otra dificultad.
const practiceBasicQuestions = [
  {
    symbol: "class",
    scenario:
      "Todos los Invoice del sistema se guardan con los mismos campos (número, fecha, total) y " +
      "ofrecen las mismas operaciones (emitir, anular), sin que ningún valor esté fijado todavía."
  },
  {
    symbol: "object",
    scenario:
      "El Invoice concreto de marzo ya está creado, con número F-2024-0317, fecha 14 de marzo y " +
      "total $128,40."
  },
  {
    symbol: "composition",
    scenario:
      "Cada Samurai tiene sus tres Espadas y, si el Samurai desaparece del sistema, sus Espadas " +
      "desaparecen con él."
  },
  {
    symbol: "aggregation",
    scenario:
      "El Grupo de música se forma con Músicos que pueden tocar en otros grupos cuando este se " +
      "disuelve."
  },
  {
    symbol: "association",
    scenario:
      "El Profesor imparte varias Asignaturas y cada Alumno se apunta a varias; el centro guarda " +
      "esa matrícula durante años y ninguno de los dos existe por causa del otro."
  },
  {
    symbol: "dependency",
    scenario:
      "La clase FacturaImpresora usa los métodos de la clase Plantilla solo mientras arma el PDF, " +
      "sin guardarla como atributo."
  },
  {
    symbol: "package",
    scenario:
      "Las veinte clases del módulo de facturación se han amontonado en un único directorio con " +
      "nombre y nadie encuentra ya dónde empieza el módulo."
  },
  {
    symbol: "useCase",
    scenario:
      "Antes de abrir el centro de salud hay que dejar por escrito qué le pueden pedir los " +
      "pacientes: pedir cita, consultar analíticas y solicitar la baja."
  },
  {
    symbol: "generalization",
    scenario:
      "Figura es el tipo común de Figura2D (círculo, cuadrado) y Figura3D (cubo, esfera): todas " +
      "guardan coordenadas y saben dibujarse."
  },
  {
    symbol: "realization",
    scenario:
      "El contrato Enviable declara enviar() y la clase Recipient lo cumple sin heredar de " +
      "ninguna otra."
  }
];

// *Práctica UML completo*: los veinte símbolos del conjunto completo en treinta
// preguntas. Los diez primeros escenarios son los que ya estaban revisados; los
// veinte siguientes cubren los símbolos que faltaban y, en el caso de las
// relaciones y de los mensajes, un segundo escenario del mismo símbolo (el
// «gemelo», que nunca se usa como distractor del otro: `explainOptions` filtra
// por símbolo).
const practiceCompleteQuestions = [
  {
    symbol: "class",
    scenario:
      "Todos los usuarios del sistema deben tener los mismos atributos (nombre, email) y las " +
      "mismas operaciones (loguearse, cambiar la clave), sin que haya todavía valores concretos."
  },
  {
    symbol: "object",
    scenario:
      "Ya existe la clase Producto y ahora necesitas representar el producto concreto con código " +
      "«A-100», con precio $12,50 y 3 unidades en stock en este momento."
  },
  {
    symbol: "composition",
    scenario:
      "En un hotel, una Habitación se reserva solo dentro de una Estancia; si la Estancia se " +
      "elimina del sistema, la reserva de la habitación ya no tiene sentido y debe desaparecer " +
      "con ella."
  },
  {
    symbol: "aggregation",
    scenario:
      "Un Coche se compone de sus Ruedas, pero si el Coche se desguaza, las Ruedas pueden " +
      "aprovecharse en otro vehículo."
  },
  {
    symbol: "association",
    scenario:
      "Un Alumno se matricula en varios Cursos y el sistema debe recordar durante años qué alumno " +
      "está en qué curso, de modo que ambos sigan existiendo por separado."
  },
  {
    symbol: "dependency",
    scenario:
      "La clase Ticket usa los métodos de la clase Impresora solo mientras se genera el PDF del " +
      "ticket, sin guardar la impresora como atributo."
  },
  {
    symbol: "package",
    scenario:
      "El modelo tiene 150 clases y nadie encuentra las del dominio de notificaciones; quieres " +
      "agruparlas en un bloque con nombre para organizarlo, sin añadir código ni comportamiento."
  },
  {
    symbol: "component",
    scenario:
      "El módulo de cobros trabaja con Paypal, pero en Navidad quieren cambiar a Stripe sin tocar " +
      "el código del resto del sistema."
  },
  {
    symbol: "generalization",
    scenario:
      "Vehículo tiene los atributos (matrícula, marca) y el comportamiento (arrancar) que " +
      "comparten Coche y Moto, y cada uno añade los suyos."
  },
  {
    symbol: "realization",
    scenario:
      "La interfaz Registro define qué operaciones debe tener cualquier sistema que guarde datos, " +
      "y la clase FicheroPlano cumple ese contrato implementándolas, sin heredar de otra clase."
  },
  {
    symbol: "useCase",
    scenario:
      "El mostrador del banco ofrece sacar dinero, consultar el saldo y cambiar la contraseña, y " +
      "hay que dibujar cada una de esas acciones."
  },
  {
    symbol: "actor",
    scenario:
      "El sistema de reservas lo usan los huéspedes desde el móvil y la recepcionista desde el " +
      "mostrador, y cada uno hace cosas distintas."
  },
  {
    symbol: "interfaceLollipop",
    scenario:
      "El módulo de facturación declara qué operaciones ofrece y por eso delega en una bola que " +
      "cuelga de su línea."
  },
  {
    symbol: "lifeline",
    scenario:
      "El cliente se mantiene dibujado durante toda la conversación, desde que abre la tienda " +
      "hasta que recibe por fin la respuesta del servidor."
  },
  {
    symbol: "message",
    scenario:
      "La tienda pide a la pasarela que haga el cargo, y la flecha entre las dos va de la tienda a " +
      "la pasarela con la operación como etiqueta."
  },
  {
    symbol: "execution",
    scenario:
      "Sobre la línea del servidor se dibuja una barra fina que acota los diez segundos que tarda " +
      "en descifrar la tarjeta."
  },
  {
    symbol: "selfMessage",
    scenario:
      "La tienda, al ver que le faltan datos, se manda a sí misma una flecha que sale de su línea " +
      "y vuelve a entrar en ella."
  },
  {
    symbol: "node",
    scenario:
      "El servicio se aloja en un servidor de la nube con ocho núcleos, y el sistema entero " +
      "depende de ese recurso."
  },
  {
    symbol: "artifact",
    scenario:
      "El archivo aplicacion.war y el fichero config.properties son las piezas de software que " +
      "se despliegan dentro de los servidores."
  },
  {
    symbol: "communicationPath",
    scenario:
      "Entre el servidor de la aplicación y el de la base de datos se intercambian peticiones, y la " +
      "conexión va directa de uno al otro."
  },
  {
    symbol: "composition",
    scenario:
      "Un coche de Formula 1 lleva sus tres neumáticos dentro, y si el coche se retira de la " +
      "carrera los neumáticos se van con él."
  },
  {
    symbol: "aggregation",
    scenario:
      "El Club de lectura reúne Escritores que pueden seguir en otros clubes si este deja de " +
      "reunirse."
  },
  {
    symbol: "association",
    scenario:
      "Un Autor escribe varios Libros y cada Libro tiene un único autor; la editorial guarda esa " +
      "relación durante años sin que ninguno dependa del otro."
  },
  {
    symbol: "dependency",
    scenario:
      "La ventana de Detalle usa la clase Calculadora solo mientras muestra el precio final y no " +
      "la conserva como atributo."
  },
  {
    symbol: "generalization",
    scenario:
      "Shape es el tipo común de Circle y Square, que heredan las coordenadas y el método draw()."
  },
  {
    symbol: "realization",
    scenario:
      "El contrato Serializable declara serializar() y la clase Session la implementa sin heredar " +
      "de nada."
  },
  {
    symbol: "lifeline",
    scenario:
      "El Alumno y el Profesor aparecen en el mismo intercambio y los dos se mantienen " +
      "dibujados hasta que acaba la clase."
  },
  {
    symbol: "message",
    scenario:
      "El Profesor pide al Alumno que envíe la práctica y espera su respuesta antes de seguir con " +
      "la siguiente."
  },
  {
    symbol: "execution",
    scenario:
      "El servidor tarda medio segundo en responder y durante ese medio segundo sigue ocupado en " +
      "otra cosa."
  },
  {
    symbol: "selfMessage",
    scenario:
      "El jugador comprueba que le queda vida y vuelve a invocar su propio método de disparo " +
      "para no fallar."
  }
];

/* ---------------------------------------------------------
   DIBUJOS
   --------------------------------------------------------- */

// Figuras que sustituyen a las de `data.js` en los diagramas de Práctica, y solo
// cuando las de por defecto no dan información suficiente para elegir el
// escenario correcto. Hoy solo hace falta una: el glifo del componente es un
// rectángulo sin texto, y a secas no permite distinguirlo de una clase, un
// objeto o un paquete. La interfaz que ofrece (`«Cobrable»`) es justo lo que lo
// define y lo que el escenario del componente describe.
//
// Regla: el contexto extra es visual, nunca textual. Ponerle un nombre a la caja
// («Cobros») repetiría la opción correcta y la delataría, así que la caja va sin
// nombre, igual que en `data.js`.
const PRACTICE_FIGURES = {
  component: `
    <svg viewBox="0 0 260 100" class="relation-svg" role="img"
         aria-label="Componente que ofrece sus servicios mediante una interfaz">
      <g stroke="#334155" stroke-width="2.5" fill="#ffffff" stroke-linejoin="round">
        <rect x="40" y="25" width="105" height="50"></rect>
        <rect x="30" y="33" width="20" height="14"></rect>
        <rect x="30" y="55" width="20" height="14"></rect>
      </g>
      <line x1="145" y1="50" x2="197" y2="50" stroke="#334155" stroke-width="2.5"></line>
      <circle cx="215" cy="50" r="18" fill="#ffffff" stroke="#334155" stroke-width="2.5"></circle>
      <text x="215" y="88" text-anchor="middle" font-size="10" fill="#334155"
            font-family="system-ui, sans-serif">«Cobrable»</text>
    </svg>`
};

// Figura de un símbolo en Práctica: la propia si la hay, y si no la de `data.js`
// con las cajas o las cabezas neutras (el alumno tiene que leer el conector y el
// significado, no los nombres).
function practiceFigure(symbol) {
  return PRACTICE_FIGURES[symbol] || symbolFigure(symbol, "practice", true);
}