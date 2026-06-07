# Vota Informado: Analizador de Afinidad Política

**Vota Informado** es una aplicación web interactiva para entender panoramas políticos y descubrir afinidad con partidos y familias políticas. Incluye España, Estados Unidos, Francia, Alemania, Reino Unido y elecciones europeas.

## ✨ Características Principales

*   **Cuestionario Ponderado:** El usuario no solo responde a preguntas, sino que también indica qué temas le importan más, lo que pondera el resultado final.
*   **Explorador político:** Permite consultar partidos, familias, ejes ideológicos y posiciones por tema sin completar el cuestionario.
*   **Soporte multipaís:** Cada ámbito mantiene sus propias preguntas, partidos, respuestas y progreso local.
*   **Resultados Detallados:** Muestra un ranking de afinidad con cada partido, expresado en porcentajes.
*   **Brújula Ideológica:** Sitúa al usuario y a los partidos en un espectro de dos ejes (Económico y Social) para una comparación visual.
*   **Gráfico Radar por Temas:** Permite comparar la afinidad con varios partidos en cada uno de los 10 temas del cuestionario.
*   **Análisis con IA (Gemini):**
    *   Genera una explicación personalizada que detalla el porqué de los resultados de afinidad.
    *   Analiza la intención de voto, comparando las respuestas del usuario con el ideario de un partido específico.
    *   Ofrece un chat interactivo para preguntar dudas sobre el panorama político español.
*   **Transparencia Total:** Permite revisar y cambiar respuestas en cualquier momento, ver las posturas de los partidos en cada pregunta y consultar un resumen de su ideología.

---

## ⚙️ ¿Cómo Funciona por Detrás? Metodología

La aplicación se basa en una metodología transparente y basada en datos para garantizar la objetividad.

### 1. Fuentes de Datos y Posturas de los Partidos

Las posturas de los partidos políticos (`partyStances`) que se encuentran en el archivo `data/politicalData.ts` no son arbitrarias. Se han definido utilizando un proceso de análisis riguroso:

*   **Recopilación de Información:** Se han procesado más de 175 fuentes de alta calidad, incluyendo:
    *   Programas electorales oficiales.
    *   Registros de votaciones y actividad parlamentaria.
    *   Declaraciones públicas de líderes y portavoces.
    *   Documentos estratégicos de los partidos.
    *   Análisis de medios de comunicación verificados.
*   **Síntesis con IA:** Se utilizaron modelos avanzados de IA (como los de Deep Research) para sintetizar esta gran cantidad de información y asignar a cada partido una postura cuantificable en una escala de 5 puntos (`-2` a `+2`) para cada pregunta del cuestionario.
*   **Justificación:** Cada postura va acompañada de una `justification` (justificación) que resume el porqué de esa posición, texto que es visible para el usuario en la aplicación.

### 2. Cálculo de la Afinidad (El Ranking)

El cálculo del porcentaje de afinidad que ves en los resultados se realiza en el componente `App.tsx` y sigue 5 pasos:

1.  **Distancia Ideológica por Pregunta:** Para cada pregunta que respondes, comparamos tu respuesta (ej. `+2`) con la del partido (ej. `-1`). La distancia es el valor absoluto de la diferencia (`|2 - (-1)| = 3`). La distancia máxima posible es 4 (de `-2` a `+2`).
2.  **Conversión a Afinidad:** Esta distancia se convierte a un porcentaje de afinidad para esa pregunta con la fórmula: `(4 - distancia) / 4`.
    *   Coincidencia perfecta (distancia 0) = 100% de afinidad.
    *   Oposición total (distancia 4) = 0% de afinidad.
3.  **Afinidad Media por Tema:** Se agrupan las afinidades de todas las preguntas respondidas dentro de un mismo tema (ej. "Vivienda") y se calcula la afinidad media con cada partido para ese tema.
4.  **Ponderación por Importancia:** Aquí entran en juego los deslizadores de importancia que ajustaste al principio. La afinidad media de cada tema se multiplica por un peso (de 1 a 5) según la importancia que le diste. Los temas que más te importan influyen más en el resultado final.
5.  **Puntuación Final:** Se calcula una media ponderada de todas las puntuaciones de los temas para obtener la puntuación de afinidad final con cada partido, que se muestra como un porcentaje.

### 3. Brújula Ideológica

*   **Posición de los Partidos:** La posición de los partidos en la brújula es fija. Se ha determinado analizando su ideología general en los dos ejes principales del debate político.
*   **Tu Posición:** Tu punto en la brújula se calcula dinámicamente. Cada pregunta está etiquetada con un `ideologicalSign` en el archivo `politicalData.ts` que indica si es relevante para el eje económico (`economic: +1` o `-1`) o social (`social: +1` o `-1`). Tu posición final es la media de tus respuestas ponderada por estos signos.

### 4. Integración con Gemini (IA de Google)

El archivo `services/geminiService.ts` gestiona todas las llamadas a la API de Gemini.

*   **Análisis de Resultados:** Se envía a Gemini un *prompt* que contiene tus resultados de afinidad y un resumen de tus respuestas (de forma anónima). Se le instruye para que actúe como un analista político neutral y explique los resultados.
*   **Análisis de Intención de Voto:** Se le envía a Gemini un *prompt* con tus respuestas y las posturas del partido que has seleccionado. Se le pide que identifique los puntos de máximo acuerdo y de mayor divergencia.
*   **Chat con la IA:** El chat utiliza un *prompt* que le da a Gemini el rol de un asistente experto. Se le proporciona todo el contexto de las posturas de los partidos (`partyTopicSummaries`) para que base sus respuestas en los datos de la aplicación, enriqueciéndolos con su conocimiento general.

---

## 💻 Pila Tecnológica

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **Gráficos:** Recharts
*   **Inteligencia Artificial:** Google Gemini API (`@google/genai`)

---

## 📂 Estructura de Archivos Clave

*   `index.html`: El punto de entrada de la aplicación.
*   `index.tsx`: Monta la aplicación de React en el DOM.
*   `App.tsx`: El componente principal que contiene toda la lógica de la aplicación, la gestión del estado y la renderización de las diferentes vistas.
*   `data/politicalData.ts`: **El corazón de la aplicación**. Contiene toda la información sobre los partidos, los temas, las preguntas y las posturas de cada partido.
*   `services/geminiService.ts`: Centraliza la comunicación con la API de Gemini, construyendo los *prompts* y manejando las respuestas.
*   `types.ts`: Define todas las interfaces de TypeScript para garantizar la consistencia de los datos en toda la aplicación.
*   `components/IconComponents.tsx`: Almacena los componentes de los iconos SVG para un uso limpio y reutilizable.
