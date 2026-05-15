import type { Cocktail } from '@/lib/cocktail-data';

export interface DrinkmakerState {
  spiritIntensity: number;
  complexity: number;
  fruitiness: number;
  familiarity: number;
  richness: number;
  classicExperimental: number;
  lightSpiritForward: number;
}

export interface DrinkmakerProfile {
  id: string;
  name: string;
  person: string;
  mapX: number;
  mapY: number;
  values: number[];
}

export const DRINKMAKER_DEFAULTS: DrinkmakerState = {
  spiritIntensity: 50,
  complexity: 50,
  fruitiness: 50,
  familiarity: 50,
  richness: 50,
  classicExperimental: 0,
  lightSpiritForward: 0,
};

export function buildDrinkmakerDefaults(drinks: Cocktail[]): DrinkmakerState {
  if (drinks.length === 0) {
    return DRINKMAKER_DEFAULTS;
  }

  const average = <K extends keyof Cocktail>(key: K) =>
    drinks.reduce((sum, drink) => sum + Number(drink[key]), 0) / drinks.length;

  return {
    spiritIntensity: Math.round(average('spiritIntensity') * 100),
    complexity: Math.round(average('complexity') * 100),
    fruitiness: Math.round(average('fruitiness') * 100),
    familiarity: Math.round(average('familiarity') * 100),
    richness: Math.round(average('richness') * 100),
    classicExperimental: Math.round(average('classicExperimental') * 100),
    lightSpiritForward: Math.round(average('lightSpiritForward') * 100),
  };
}

export function drinkmakerStateToProfile(state: DrinkmakerState): DrinkmakerProfile {
  return {
    id: '__drinkmaker__',
    name: 'Drinkmaker',
    person: 'Custom',
    mapX: state.classicExperimental / 100,
    mapY: state.lightSpiritForward / 100,
    values: [
      state.spiritIntensity / 100,
      state.complexity / 100,
      state.fruitiness / 100,
      state.familiarity / 100,
      state.richness / 100,
    ],
  };
}

export function formatAxisValue(
  value: number,
  negativeLabel: string,
  positiveLabel: string,
) {
  if (value === 0) {
    return 'Center';
  }

  const label = value < 0 ? negativeLabel : positiveLabel;
  return `${label} ${Math.abs(value)}%`;
}
