'use client';

import { Cocktail } from '@/lib/cocktail-data';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface DrinkTooltipProps {
  drink: Cocktail;
  expanded?: boolean;
}

export default function DrinkTooltip({ drink, expanded = false }: DrinkTooltipProps) {
  const flavorScores = [
    { name: 'Spirit', value: drink.spiritIntensity },
    { name: 'Complex', value: drink.complexity },
    { name: 'Fruity', value: drink.fruitiness },
    { name: 'Familiar', value: drink.familiarity },
    { name: 'Rich', value: drink.richness },
  ];

  const radarData = flavorScores.map(({ name, value }) => ({
    name: name.substring(0, 3),
    value: Math.round(value * 100) / 100,
  }));

  const classicExperimentalLabel =
    drink.classicExperimental < 0 ? 'Classic' : 'Experimental';
  const classicExperimentalValue = Math.abs(drink.classicExperimental);
  const lightSpiritLabel =
    drink.lightSpiritForward < 0 ? 'Light' : 'Spirit-Forward';
  const lightSpiritValue = Math.abs(drink.lightSpiritForward);

  if (expanded) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-light text-primary mb-1">{drink.drink}</h3>
          <p className="text-sm text-muted-foreground">{drink.person}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Ingredients
          </p>
          <div className="flex flex-wrap gap-1">
            {drink.ingredients.map((ing, i) => (
              <span
                key={i}
                className="text-xs bg-muted/50 border border-border rounded px-2 py-1 text-accent"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Flavor Scores
          </p>
          <div className="space-y-1">
            {flavorScores.map((score) => (
              <div key={score.name} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{score.name}</span>
                <div className="flex-1 mx-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${score.value * 100}%` }}
                  />
                </div>
                <span className="text-xs text-primary font-mono">{(score.value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-48">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Mini Radar
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#d4af37" strokeOpacity={0.2} />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#8a8a9e', fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: '#8a8a9e', fontSize: 8 }} domain={[0, 1]} />
              <Radar dataKey="value" stroke="#d4af37" fill="#d4af37" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-[0_12px_32px_rgba(120,103,88,0.14)] dark:bg-[#131922] dark:shadow-[0_18px_36px_rgba(0,0,0,0.34)]">
      <p className="font-light text-foreground mb-1">{drink.drink}</p>
      <p className="text-xs text-muted-foreground mb-2">{drink.person}</p>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Classic/Experimental:</span>
          <span className="text-primary">
            {classicExperimentalLabel} {(classicExperimentalValue * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Light/Spirit-Forward:</span>
          <span className="text-primary">
            {lightSpiritLabel} {(lightSpiritValue * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
