'use client';

import type { DrinkmakerState } from '@/lib/drinkmaker';
import { formatAxisValue } from '@/lib/drinkmaker';
import { Slider } from '@/components/ui/slider';

interface DrinkmakerCardProps {
  state: DrinkmakerState;
  onChange: (nextState: DrinkmakerState) => void;
}

const FLAVOR_FIELDS = [
  ['spiritIntensity', 'Spirit Intensity'],
  ['complexity', 'Complexity'],
  ['fruitiness', 'Fruitiness'],
  ['familiarity', 'Familiarity'],
  ['richness', 'Richness'],
] as const;

export default function DrinkmakerCard({ state, onChange }: DrinkmakerCardProps) {
  const updateField = <K extends keyof DrinkmakerState>(key: K, value: number) => {
    onChange({ ...state, [key]: value });
  };

  return (
    <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3.5 dark:border-white/10 dark:bg-white/5">
      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        Drink Parameters
      </p>

      <div className="mt-3 space-y-4">
        {FLAVOR_FIELDS.map(([key, label]) => (
          <div key={key} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </label>
              <span className="text-[10px] text-primary">{state[key]}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[state[key]]}
              onValueChange={(value) => updateField(key, value[0] ?? 0)}
            />
          </div>
        ))}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Classic vs Experimental
            </label>
            <span className="text-[10px] text-primary">
              {formatAxisValue(state.classicExperimental, 'Classic', 'Experimental')}
            </span>
          </div>
          <Slider
            min={-100}
            max={100}
            step={1}
            value={[state.classicExperimental]}
            onValueChange={(value) => updateField('classicExperimental', value[0] ?? 0)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Light vs Spirit-Forward
            </label>
            <span className="text-[10px] text-primary">
              {formatAxisValue(state.lightSpiritForward, 'Light', 'Spirit-Forward')}
            </span>
          </div>
          <Slider
            min={-100}
            max={100}
            step={1}
            value={[state.lightSpiritForward]}
            onValueChange={(value) => updateField('lightSpiritForward', value[0] ?? 0)}
          />
        </div>
      </div>
    </div>
  );
}
