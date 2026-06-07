import { CountryRegistryItem } from '../types';

export const countryRegistry: CountryRegistryItem[] = [
  {
    code: 'ES',
    name: 'España',
    defaultLocale: 'es-ES',
    supportedLocales: ['es-ES', 'ca-ES', 'eu-ES', 'gl-ES'],
    politicalSystem: 'Monarquía parlamentaria con Congreso de los Diputados y Senado.',
    status: 'active',
    displayName: {
      'es-ES': 'España',
      'ca-ES': 'Espanya',
      'eu-ES': 'Espainia',
      'gl-ES': 'España',
      'en-US': 'Spain',
    },
  },
  {
    code: 'US',
    name: 'Estados Unidos',
    defaultLocale: 'en-US',
    supportedLocales: ['en-US', 'es-US'],
    politicalSystem: 'República federal presidencialista con sistema mayoritariamente bipartidista y corrientes internas muy relevantes.',
    status: 'active',
    notes: 'Primer dataset operativo: partidos/corrientes nacionales y temas federales principales. Pendiente profundizar con más preguntas y localización completa es-US.',
    displayName: {
      'es-ES': 'Estados Unidos',
      'en-US': 'United States',
      'es-US': 'Estados Unidos',
    },
  },
  {
    code: 'FR', name: 'Francia', defaultLocale: 'es-ES', supportedLocales: ['es-ES'],
    politicalSystem: 'República semipresidencialista.', status: 'active',
    displayName: { 'es-ES': 'Francia', 'en-US': 'France' },
  },
  {
    code: 'DE', name: 'Alemania', defaultLocale: 'es-ES', supportedLocales: ['es-ES'],
    politicalSystem: 'República federal parlamentaria.', status: 'active',
    displayName: { 'es-ES': 'Alemania', 'en-US': 'Germany' },
  },
  {
    code: 'GB', name: 'Reino Unido', defaultLocale: 'es-ES', supportedLocales: ['es-ES'],
    politicalSystem: 'Monarquía parlamentaria.', status: 'active',
    displayName: { 'es-ES': 'Reino Unido', 'en-US': 'United Kingdom' },
  },
  {
    code: 'EU', name: 'Elecciones europeas', defaultLocale: 'es-ES', supportedLocales: ['es-ES'],
    politicalSystem: 'Elecciones al Parlamento Europeo.', status: 'active',
    displayName: { 'es-ES': 'Elecciones europeas', 'en-US': 'European elections' },
  },
];

export const activeCountryCode = 'ES';
export const activeLocale = 'es-ES';
