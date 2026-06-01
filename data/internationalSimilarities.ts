import { Party } from '../types';

// Comparaciones iniciales orientativas. No se usan todavía para calcular afinidad;
// son la base del futuro modo "si te gusta X aquí, mira Y fuera".
export const internationalSimilarities = {
  ES: {
    [Party.PP]: [
      { countryCode: 'US', party: 'Republican Party - establishment/moderate wing', score: 68, rationale: 'Coinciden en baja fiscalidad, orden público y centro-derecha institucional; difieren en europeísmo y sistema político.' },
      { countryCode: 'US', party: 'Democratic Party - conservative/Blue Dog wing', score: 42, rationale: 'Puede coincidir en institucionalismo y pragmatismo, pero diverge en valores sociales y fiscalidad.' },
    ],
    [Party.PSOE]: [
      { countryCode: 'US', party: 'Democratic Party - mainstream/liberal wing', score: 76, rationale: 'Socialdemocracia moderada, políticas sociales, clima y enfoque institucional comparable.' },
    ],
    [Party.VOX]: [
      { countryCode: 'US', party: 'Republican Party - MAGA/national-conservative wing', score: 82, rationale: 'Alta coincidencia en nacional-conservadurismo, inmigración restrictiva, cultura política y ley y orden.' },
    ],
    [Party.SUMAR]: [
      { countryCode: 'US', party: 'Democratic Party - progressive wing', score: 80, rationale: 'Coinciden en redistribución, derechos sociales, clima y agenda progresista.' },
      { countryCode: 'US', party: 'Green Party', score: 66, rationale: 'Coincidencia fuerte en ecologismo e izquierda, aunque con diferencias de viabilidad electoral y sistema.' },
    ],
    [Party.PODEMOS]: [
      { countryCode: 'US', party: 'Democratic Socialists of America / left-progressive Democrats', score: 78, rationale: 'Coinciden en izquierda transformadora, crítica a élites económicas y expansión de derechos sociales.' },
    ],
  },
} as const;
