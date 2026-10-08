// Banco de la dificultad de práctica: los mismos 10 símbolos de `questions` con
// un escenario propio cada uno, escrito para que el alumno razone el porqué
// (ciclo de vida, propiedad, «es un», contrato…) en vez de solo reconocer el
// dibujo.
//
// Cada escenario sigue el mismo patrón que los casos de Difícil (`symbolFacts`):
// una frase declarativa con la situación, sin pregunta y sin definir el símbolo.
// Así las tres opciones de las preguntas `explain` (diagrama → lenguaje natural)
// son intercambiables y la correcta no se distingue por su redacción. Por eso
// este banco no reutiliza ningún `case` de Difícil: cada dificultad tiene los
// suyos.
//
// Cada `scenario` sirve como enunciado de la pregunta `context` (lenguaje
// natural → UML) y como opción correcta de la pregunta `explain` (diagrama →
// lenguaje natural); de los escenarios de otros símbolos salen sus distractores.
// Las opciones con las que se elige el símbolo se heredan de `questions`, para
// no duplicar los nombres.
const practiceQuestions = [
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
      "«A-100», con precio 12,50 € y 3 unidades en stock en este momento."
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
  }
];