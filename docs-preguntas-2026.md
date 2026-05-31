# Vota Informado — revisión de preguntas y modo progresivo (2026-05-31)

## Diagnóstico de la lógica actual

La app ya funciona con un modelo compatible con cuestionario progresivo:

- Cada pregunta tiene una respuesta de usuario `-2..+2`.
- Cada partido tiene una postura `-2..+2` en la misma pregunta.
- La afinidad por pregunta es `(4 - abs(userAnswer - partyStance)) / 4`.
- Luego se promedia por tema y se pondera por la importancia que el usuario asignó a ese tema.
- El resultado final solo usa preguntas respondidas; las no respondidas no penalizan ni cuentan.
- Actualmente el botón de resultados se activa con `>= 2 preguntas respondidas por tema`.

Conclusión: se pueden añadir más preguntas sin romper la lógica. Lo importante es ordenar/priorizar las preguntas y no cambiar la fórmula.

## Recomendación de producto

Cambiar de “cuestionario de 2 preguntas mínimas por bloque” a “cuestionario progresivo por fiabilidad”:

- **Modo rápido:** 2 preguntas prioritarias por bloque → 20 preguntas total. Resultado orientativo.
- **Modo recomendado:** 3-4 preguntas por bloque → 30-40 preguntas. Resultado más estable.
- **Modo completo:** todas las preguntas → máxima granularidad.

La app debería mostrar una etiqueta de fiabilidad:

- 20-29 preguntas: “orientativo”
- 30-39 preguntas: “fiable”
- 40+ preguntas: “muy fiable”

También conviene mostrar “temas con baja cobertura” cuando un usuario responde solo 2 preguntas en un bloque muy heterogéneo.

## Cambio técnico recomendado

Añadir metadata opcional a `Question`:

```ts
priority?: 1 | 2 | 3;
updatedAt?: string;
sourceNotes?: string[];
```

Uso:

- `priority: 1` → aparece primero y cuenta para modo rápido.
- `priority: 2` → preguntas recomendadas.
- `priority: 3` → preguntas de profundización / antiguas / nicho.

Render:

```ts
topic.questions
  .slice()
  .sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2))
```

No eliminaría las preguntas antiguas: las marcaría `priority: 2` o `3` y añadiría nuevas `priority: 1` donde haya temas más actuales.

## Preguntas prioritarias sugeridas por bloque

Escala igual que ahora: usuario responde de “totalmente en desacuerdo” a “totalmente de acuerdo”; partidos se mapean con `stance: -2..+2`.

### 1. Economía y Fiscalidad

**Prioritarias**

1. `economia-q6` — Fiscalidad de grandes patrimonios globales
   - Texto: “Las grandes fortunas deberían pagar un impuesto mínimo efectivo sobre su riqueza, coordinado internacionalmente, aunque reduzca la competencia fiscal entre territorios.”
   - Signo: `{ economic: -1, social: 0 }`
   - Discrimina: izquierda estatal/nacionalista vs derecha liberal; PP puede estar más matizado si se formula como coordinación internacional, Vox/Junts/UPN tenderían contra, Sumar/Podemos/Bildu/BNG/ERC a favor.

2. `economia-q7` — Disciplina fiscal vs gasto social
   - Texto: “España debe priorizar la reducción del déficit y la deuda pública aunque eso limite nuevas subidas de pensiones, salarios públicos o prestaciones.”
   - Signo: `{ economic: 1, social: 0 }`
   - Discrimina: PP/Junts/PNV/UPN más favorables; PSOE intermedio; Sumar/Podemos/Bildu/BNG/ERC más contrarios; Vox favorable si lo conecta a recorte de gasto político, menos si afecta pensiones/familias.

**Adicionales**

- Bajar IVA/IRPF de forma generalizada frente a ayudas focalizadas.
- Bonificaciones fiscales a propietarios que alquilen por debajo de mercado.
- Impuestos verdes/carbono frente a protección del poder adquisitivo.

### 2. Modelo Productivo y Empleo

**Prioritarias**

1. `empleo-q6` — Jornada laboral y productividad
   - Texto: “La reducción de jornada debe aprobarse por ley para todos los sectores, incluso aunque algunas empresas aleguen pérdida de competitividad.”
   - Signo: `{ economic: -1, social: 0 }`
   - Discrimina muy bien PSOE/Sumar/Podemos/Bildu/BNG/ERC vs PP/Vox/Junts/UPN; PNV/CC probablemente intermedios.

2. `empleo-q7` — Automatización e IA en el trabajo
   - Texto: “Las empresas que sustituyan empleo por automatización o inteligencia artificial deberían asumir cotizaciones o impuestos específicos para financiar formación y protección social.”
   - Signo: `{ economic: -1, social: 0 }`
   - Nuevo eje útil: Estado protector ante IA vs flexibilidad empresarial.

**Adicionales**

- Reforzar inspección laboral y sanciones por falsos autónomos/subcontratación abusiva.
- Facilitar despido/contratación a cambio de mayor protección por desempleo.
- Cuotas de empleo juvenil/senior en contratación pública.

### 3. Vivienda

Es el bloque más urgente: CIS mayo 2026 sitúa vivienda como primer problema con récord cercano al 49%.

**Prioritarias**

1. `vivienda-q6` — Compra especulativa / fondos / extranjeros no residentes
   - Texto: “En zonas tensionadas, se debe limitar o gravar fuertemente la compra de vivienda por fondos, empresas o compradores no residentes cuando no sea para residencia habitual.”
   - Signo: `{ economic: -1, social: 0 }`
   - Discrimina: Sumar/Podemos/Bildu/BNG muy a favor; PSOE a favor de gravar pero no prohibir; PP/Vox/Junts más contrarios; ERC probablemente a favor con matices.

2. `vivienda-q7` — Prioridad nacional / arraigo en vivienda pública
   - Texto: “El acceso a vivienda pública o ayudas al alquiler debe priorizar a nacionales o residentes con más años de arraigo frente a recién llegados.”
   - Signo: `{ economic: 0, social: -1 }`
   - Discrimina muchísimo: Vox muy a favor, PP parcialmente según territorio, PSOE/Sumar/Podemos contrarios, nacionalistas depende del enfoque territorial.

**Adicionales**

- Prórroga obligatoria de contratos de alquiler en zonas tensionadas.
- Impuesto a viviendas vacías y alquiler turístico.
- Construcción pública vs liberar suelo y reducir regulación urbanística.
- Permitir más densidad urbana a cambio de vivienda asequible.

### 4. Modelo Territorial

**Prioritarias**

1. `territorial-q6` — Condonación de deuda autonómica / FLA
   - Texto: “El Estado debe condonar parte de la deuda autonómica, especialmente la vinculada al FLA, aunque algunas comunidades lo consideren un agravio comparativo.”
   - Signo: `{ economic: -1, social: 0 }` o `{ economic: 0, social: 1 }` si se interpreta como solidaridad territorial.
   - Discrimina: PSOE/ERC favorables; PP/Vox contrarios; Junts puede apoyar si beneficia Cataluña pero exige más; PNV/EH Bildu según encaje foral; CC/BNG según beneficio territorial.

2. `territorial-q7` — Agencia tributaria catalana / IRPF
   - Texto: “Cataluña debería poder recaudar directamente el IRPF y otros grandes impuestos mediante una agencia tributaria propia.”
   - Signo: `{ economic: 0, social: 1 }`
   - Diferencia mejor que la financiación singular genérica: ERC/Junts muy a favor, PSOE más matizado, PP/Vox/UPN/CC probablemente en contra, PNV defiende asimetría propia pero puede ser prudente.

**Adicionales**

- Bilateralidad Estado-CCAA vs multilateralidad en Consejo de Política Fiscal.
- Transferencia de Rodalies/infraestructuras con financiación finalista.
- Igualdad de servicios básicos frente a autonomía fiscal.

### 5. Políticas Sociales e Igualdad

Aquí incluiría inmigración como subeje prioritario, porque está creciendo mucho como preocupación y separa bloques.

**Prioritarias**

1. `igualdad-q6` — Regularización extraordinaria de inmigrantes
   - Texto: “España debería aprobar regularizaciones extraordinarias para inmigrantes que acrediten arraigo laboral o familiar, aunque hayan llegado de forma irregular.”
   - Signo: `{ economic: 0, social: 1 }`
   - Discrimina: izquierda muy a favor; PP dividido/intermedio; Vox muy en contra; nacionalistas de izquierda a favor.

2. `igualdad-q7` — Reparto obligatorio de menores migrantes entre CCAA
   - Texto: “Las comunidades autónomas deben estar obligadas a acoger menores migrantes no acompañados cuando otras regiones estén saturadas.”
   - Signo: `{ economic: 0, social: 1 }`
   - Discrimina: Vox en contra fuerte; PP según territorio pero tensionado; PSOE/Sumar/Podemos/Bildu/BNG/ERC más a favor.

**Adicionales**

- Verificación de edad y acceso de menores a redes sociales.
- Leyes de igualdad/LGTBI frente a objeción por libertad educativa/familiar.
- Prestaciones por hijo a cargo universales vs ayudas focalizadas por renta.

### 6. Educación y Cultura

**Prioritarias**

1. `educacion-q6` — Móviles/redes sociales en menores
   - Texto: “Debe prohibirse o restringirse severamente el uso de móviles y redes sociales por menores de 16 años, con verificación de edad obligatoria.”
   - Signo: `{ economic: 0, social: -1 }` si se interpreta como paternalismo/regulación; ojo, puede cruzar bloques.
   - Discrimina menos en izquierda-derecha clásica, pero es actual y útil para detectar autoritarismo/regulación vs libertad digital.

2. `educacion-q7` — Currículo común y memoria democrática
   - Texto: “El Estado debe fijar contenidos comunes más estrictos en Historia, Lengua y Educación Cívica para evitar diferencias ideológicas o territoriales entre comunidades.”
   - Signo: `{ economic: 0, social: -1 }`
   - Discrimina centralismo/conservadurismo vs autonomía territorial/progresismo.

**Adicionales**

- Cheque escolar/libertad de elección frente a planificación pública.
- Evaluación externa común al final de etapas educativas.
- Cultura: ayudas públicas condicionadas a rentabilidad/impacto social.

### 7. Sanidad

**Prioritarias**

1. `sanidad-q6` — Listas de espera y derivaciones privadas
   - Texto: “Para reducir listas de espera, la sanidad pública debería derivar más pacientes a centros privados si sale más rápido, aunque aumente el peso de empresas sanitarias.”
   - Signo: `{ economic: 1, social: 0 }`
   - Discrimina mejor que “gestión pública vs privada”: PP/CC/UPN más favorables, izquierda en contra, PSOE intermedio según CCAA.

2. `sanidad-q7` — Transparencia estatal de listas de espera
   - Texto: “El Estado debe imponer criterios únicos y auditorías externas para medir listas de espera sanitarias, aunque limite la autonomía de las comunidades.”
   - Signo: `{ economic: 0, social: 1 }` o centralizador.
   - Discrimina centralismo/transparencia vs autonomía CCAA; puede captar voto regeneracionista.

**Adicionales**

- MUFACE: mantener con más financiación vs integración progresiva en SNS.
- Salud mental universal como prestación prioritaria.
- Copago según renta para fármacos/servicios no esenciales.

### 8. Transición Ecológica y Energía

**Prioritarias**

1. `ecologia-q6` — Renovables y territorio
   - Texto: “Los grandes proyectos de renovables deberían poder aprobarse con tramitación preferente aunque generen rechazo local o impacto paisajístico.”
   - Signo: `{ economic: 1, social: 0 }` si prima desarrollo/infraestructura; también mide ecologismo local.
   - Discrimina: PSOE/PP pueden apoyar con matices; ecologistas/nacionalistas rurales más críticos; Vox puede apoyar menos por oposición climática, pero sí por soberanía energética.

2. `ecologia-q7` — Coste social de la transición verde
   - Texto: “Si las políticas climáticas encarecen energía, transporte o alimentos, deberían ralentizarse para proteger a hogares y sector agrario.”
   - Signo: `{ economic: 1, social: -1 }`
   - Discrimina: Vox/PP más a favor; izquierda verde en contra o con compensaciones; PSOE intermedio.

**Adicionales**

- Agua: desalación/reutilización vs trasvases.
- Zonas de bajas emisiones y restricciones al coche.
- Protección del lobo/fauna frente a ganadería extensiva.

### 9. Política Exterior y Defensa

**Prioritarias**

1. `exterior-q6` — 2% defensa vs gasto social
   - Texto: “España debe alcanzar y mantener el 2% del PIB en defensa aunque eso reduzca margen para otras políticas públicas.”
   - Signo: `{ economic: 1, social: -1 }`
   - Ya existe `exterior-q1`, pero esta formulación fuerza trade-off presupuestario y aumenta valor discriminante.

2. `exterior-q7` — Palestina/Israel y sanciones comerciales
   - Texto: “España debe suspender comercio de armas y promover sanciones económicas contra Israel mientras continúe la ocupación y la guerra en Palestina.”
   - Signo: `{ economic: 0, social: 1 }`
   - Actual y discriminante: izquierda/nacionalistas de izquierda a favor; PP/Vox más en contra; PSOE a favor de reconocimiento pero más institucional; PNV/Junts matices.

**Adicionales**

- Ucrania: ayuda militar sostenida aunque aumente gasto.
- Marruecos/Sáhara: priorizar relaciones estratégicas con Marruecos aunque suponga aceptar su plan de autonomía.
- UE: mutualizar deuda y defensa europeas.

### 10. Modelo de Estado y Calidad Democrática

**Prioritarias**

1. `democracia-q6` — Regeneración y dimisiones por imputación
   - Texto: “Los cargos públicos deberían dimitir al ser imputados por corrupción o delitos graves, aunque aún no exista condena.”
   - Signo: `{ economic: 0, social: 0 }`; no encaja en brújula clásica, pero es muy relevante.
   - Discrimina menos por ideología declarada, pero capta tolerancia institucional. Puede mapear partidos por exigencia discursiva, con cuidado para no sesgar.

2. `democracia-q7` — Independencia de Fiscalía y nombramientos
   - Texto: “El Fiscal General del Estado y los órganos reguladores deberían elegirse por mayorías reforzadas e incompatibilidades estrictas para reducir la influencia del Gobierno.”
   - Signo: `{ economic: 0, social: -1 }` si se asocia a liberal-institucional; realmente es eje institucional.
   - Discrimina: PP/Vox suelen insistir más; PSOE menos cuando gobierna; Sumar puede apoyar regeneración pero no la narrativa de lawfare; nacionalistas según contexto.

**Adicionales**

- Leyes anti-bulos vs libertad de expresión.
- Limitación de indultos y aforamientos.
- Primarias obligatorias/listas desbloqueadas.

## Preguntas existentes que mantendría como prioridad 1

- Vivienda: regulación alquiler, pisos turísticos, alquiler de temporada.
- Territorial: financiación singular, autodeterminación.
- Igualdad: control fronteras/acogida.
- Sanidad: gestión pública/privada, ampliación salud mental/bucodental.
- Exterior: defensa 2%, sanciones a Israel.
- Democracia: CGPJ, bulos, corrupción.

## Preguntas existentes que bajaría a prioridad 2/3

No eliminarlas; solo relegarlas:

- Tauromaquia: útil culturalmente, pero menor prioridad nacional salvo nicho.
- Caza: relevante ruralmente, pero menos central que agua/agricultura/energía.
- “Ley solo sí es sí” tal como está formulada: suena retrospectiva; reformularía a consentimiento/penas/agresiones sexuales.
- “Derogación reforma laboral” puede estar algo desactualizada frente a jornada, productividad e IA.
- “Supresión concierto vasco/navarro” es potente pero muy maximalista; mantener como profundización.

## Fuentes consultadas / señales de actualidad

- Barómetro CIS mayo 2026 citado por RTVE/El Periódico/Infobae: vivienda como principal problema, inmigración y sanidad al alza.
- Información sobre agenda legislativa de IA y plataformas: RTVE, Antena 3, El Independiente, El Español, La Nueva España.
- Vivienda 2026: ABC, laSexta, Público, Demócrata, prensa regional sobre Plan Estatal de Vivienda 2026-2030.
- Inmigración/prioridad nacional/MENAS: El País, Onda Cero, ABC, elDiario.es, Heraldo.
- Financiación autonómica/FLA/IRPF Cataluña: EFE, El Economista, El Mundo, El País, La Vanguardia.
- Defensa 2% PIB/OTAN: ABC, El Mundo, 20 Minutos.
- Sanidad/listas/MUFACE/privada: El Español, 20 Minutos, elDiario.es, prensa autonómica.
- Regeneración/corrupción/CGPJ/Fiscalía: prensa nacional diversa; tratar con especial cuidado por sesgo editorial.

## Recomendación final

La mejora con más impacto no es añadir 50 preguntas nuevas, sino:

1. Añadir 1-2 preguntas nuevas prioritarias por bloque.
2. Marcar todas las preguntas con `priority`.
3. Mostrar primero las 2 prioritarias de cada tema.
4. Permitir seguir contestando para mejorar fiabilidad.
5. Versionar dataset y añadir fuentes/metodología visible.

Esto preserva la lógica actual y hace el producto mucho más usable.
