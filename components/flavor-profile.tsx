'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { Cocktail } from '@/lib/cocktail-data';
import { buildDrinkmakerDefaults, drinkmakerStateToProfile, type DrinkmakerState } from '@/lib/drinkmaker';
import { getThemeColors } from '@/lib/theme-colors';
import SmoothRadar from './smooth-radar';
import DrinkmakerCard from './drinkmaker-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import SettingsPanel from './settings-panel';

interface FlavorProfileProps {
  drinks: Cocktail[];
  drinkmakerOnly?: boolean;
}

const DIMENSIONS = [
  { key: 'spiritIntensity', label: 'Spirit Intensity' },
  { key: 'complexity', label: 'Complexity' },
  { key: 'fruitiness', label: 'Fruitiness' },
  { key: 'familiarity', label: 'Familiarity' },
  { key: 'richness', label: 'Richness' },
] as const;

export default function FlavorProfile({ drinks, drinkmakerOnly = false }: FlavorProfileProps) {
  const { resolvedTheme } = useTheme();
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [blendMode, setBlendMode] = useState('normal');
  const [blurAmount, setBlurAmount] = useState([12]);
  const [spikiness, setSpikiness] = useState([100]);
  const [averageStrokeWidth, setAverageStrokeWidth] = useState([3]);
  const [colors, setColors] = useState(() => getThemeColors(undefined));
  const [drinkmakerState, setDrinkmakerState] = useState<DrinkmakerState>(() => buildDrinkmakerDefaults(drinks));

  useEffect(() => {
    setColors(getThemeColors(resolvedTheme));
  }, [resolvedTheme]);

  useEffect(() => {
    setDrinkmakerState(buildDrinkmakerDefaults(drinks));
  }, [drinks]);

  const { dimensions, profiles, averageProfile } = useMemo(() => {
    if (drinks.length === 0) {
      return { dimensions: [], profiles: [], averageProfile: [] };
    }

    const profiles = drinks.map((drink) => ({
      id: `${drink.person}__${drink.drink}`,
      name: drink.drink,
      person: drink.person,
      mapX: drink.classicExperimental,
      mapY: drink.lightSpiritForward,
      values: DIMENSIONS.map(({ key }) => drink[key]),
    }));

    const averageProfile = DIMENSIONS.map(({ key }) => (
      drinks.reduce((sum, drink) => sum + drink[key], 0) / drinks.length
    ));

    return {
      dimensions: DIMENSIONS.map(({ label }) => label),
      profiles,
      averageProfile,
    };
  }, [drinks]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [activeProfileId, profiles],
  );

  const drinkmakerProfile = useMemo(
    () => drinkmakerStateToProfile(drinkmakerState),
    [drinkmakerState],
  );

  const updateColor = (key: keyof typeof colors, value: string) => {
    setColors((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="glassmorphism min-h-0 rounded-[2rem] p-3 shadow-[0_20px_60px_rgba(214,194,166,0.18)] sm:p-4 lg:h-full lg:p-5 xl:h-full">
      <div className="flex min-h-0 flex-col gap-4 xl:h-full xl:flex-row xl:gap-5">
        <SettingsPanel>
            {drinkmakerOnly ? (
              <DrinkmakerCard state={drinkmakerState} onChange={setDrinkmakerState} />
            ) : null}

            <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Render Controls
              </p>

              <div className="mt-3 space-y-2">
                <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Blend Mode
                </label>
                <Select value={blendMode} onValueChange={setBlendMode}>
                  <SelectTrigger className="h-8 w-full rounded-xl border-white/60 bg-white/70 text-[10px] dark:border-white/10 dark:bg-white/8 sm:text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/60 bg-white/92 dark:border-white/10 dark:bg-[#141b24]">
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="lighten">Lighten</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Blur
                  </label>
                  <span className="text-[10px] text-primary sm:text-[10px]">{blurAmount[0]} px</span>
                </div>
                <Slider
                  min={0}
                  max={48}
                  step={1}
                  value={blurAmount}
                  onValueChange={setBlurAmount}
                />
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Spikiness
                  </label>
                  <span className="text-[10px] text-primary sm:text-[10px]">{spikiness[0]}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={spikiness}
                  onValueChange={setSpikiness}
                />
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Stroke Size
                  </label>
                  <span className="text-[10px] text-primary sm:text-[10px]">{averageStrokeWidth[0]} px</span>
                </div>
                <Slider
                  min={1}
                  max={8}
                  step={0.5}
                  value={averageStrokeWidth}
                  onValueChange={setAverageStrokeWidth}
                />
              </div>

            </div>

            <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Color Controls
              </p>
              <div className="mt-3 space-y-3">
                <label className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2.5 py-1.5 dark:bg-white/6">
                  <span className="min-w-0 text-[10px] text-primary sm:text-[10px]">Classic</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={colors.classic}
                      onChange={(event) => updateColor('classic', event.target.value)}
                      className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="w-16 text-right font-mono text-[10px] text-muted-foreground">
                      {colors.classic}
                    </span>
                  </span>
                </label>
                <label className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2.5 py-1.5 dark:bg-white/6">
                  <span className="min-w-0 text-[10px] text-primary sm:text-[10px]">Experimental</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={colors.experimental}
                      onChange={(event) => updateColor('experimental', event.target.value)}
                      className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="w-16 text-right font-mono text-[10px] text-muted-foreground">
                      {colors.experimental}
                    </span>
                  </span>
                </label>
                <label className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2.5 py-1.5 dark:bg-white/6">
                  <span className="min-w-0 text-[10px] text-primary sm:text-[10px]">Light</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={colors.light}
                      onChange={(event) => updateColor('light', event.target.value)}
                      className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="w-16 text-right font-mono text-[10px] text-muted-foreground">
                      {colors.light}
                    </span>
                  </span>
                </label>
                <label className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2.5 py-1.5 dark:bg-white/6">
                  <span className="min-w-0 text-[10px] text-primary sm:text-[10px]">Spirit-Forward</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={colors.spiritForward}
                      onChange={(event) => updateColor('spiritForward', event.target.value)}
                      className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="w-16 text-right font-mono text-[10px] text-muted-foreground">
                      {colors.spiritForward}
                    </span>
                  </span>
                </label>
              </div>
            </div>
        </SettingsPanel>

        <div className="order-1 flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-[540px] flex-1 flex-col rounded-[1.5rem] border border-white/60 bg-white/35 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:min-h-[620px] sm:p-4 xl:h-full xl:min-h-0">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base text-primary sm:text-lg">Gradient Flavor Profile</h3>
                <p className="text-[13px] text-muted-foreground sm:text-sm">
                  {drinkmakerOnly
                    ? 'Live custom drink flower driven by your drink parameters.'
                    : 'A layered gradient star field with an average profile overlay.'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-primary/85">
                  <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 dark:bg-white/8">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: colors.classic }}
                    />
                    <span>Classic</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 dark:bg-white/8">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: colors.experimental }}
                    />
                    <span>Experimental</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 dark:bg-white/8">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: colors.light }}
                    />
                    <span>Light</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 dark:bg-white/8">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: colors.spiritForward }}
                    />
                    <span>Spirit-Forward</span>
                  </div>
                  {!drinkmakerOnly ? (
                    <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 dark:bg-white/8">
                      <span className="h-px w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                      <span>Average profile</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            {!drinkmakerOnly ? (
              <div className="mb-4 space-y-3 lg:hidden">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Drink Count</p>
                <p className="mt-1 text-3xl leading-none text-primary sm:text-4xl">{profiles.length}</p>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <div className="columns-1 gap-4 sm:columns-2">
                  {profiles.map((profile) => {
                    const isActive = selectedProfile?.id === profile.id;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onMouseEnter={() => setActiveProfileId(profile.id)}
                        onMouseLeave={() => setActiveProfileId(null)}
                        onFocus={() => setActiveProfileId(profile.id)}
                        onBlur={() => setActiveProfileId(null)}
                        className={`block w-full break-inside-avoid px-0 py-0.5 text-left text-[11px] leading-tight transition-colors ${
                          isActive ? 'text-primary' : 'text-primary/78 hover:text-primary'
                        }`}
                      >
                        <span className="truncate">{profile.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              </div>
            ) : null}
            <div className="relative min-h-0 flex-1 rounded-[1.5rem] bg-white/18 p-4 dark:bg-white/4 sm:p-6 lg:p-8">
              {!drinkmakerOnly ? (
                <div className="absolute left-5 top-5 z-10 hidden w-48 space-y-3 lg:block">
                <div className="px-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Drink Count</p>
                  <p className="mt-1 text-4xl leading-none text-primary">{profiles.length}</p>
                </div>
                <div className="max-h-[55%] overflow-y-auto px-1">
                  <div className="space-y-0.5">
                    {profiles.map((profile) => {
                      const isActive = selectedProfile?.id === profile.id;
                            return (
                              <button
                                key={profile.id}
                          type="button"
                          onMouseEnter={() => setActiveProfileId(profile.id)}
                          onMouseLeave={() => setActiveProfileId(null)}
                          onFocus={() => setActiveProfileId(profile.id)}
                          onBlur={() => setActiveProfileId(null)}
                                className={`block w-full px-0 py-0.5 text-left text-[11px] leading-tight transition-colors ${
                                  isActive
                                    ? 'text-primary'
                                    : 'text-primary/78 hover:text-primary'
                                }`}
                              >
                                <span className="truncate">{profile.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                </div>
              ) : null}
              <SmoothRadar
                dimensions={dimensions}
                profiles={drinkmakerOnly ? [] : profiles}
                averageProfile={averageProfile}
                previewProfile={drinkmakerOnly ? drinkmakerProfile : null}
                showAverageProfile={!drinkmakerOnly}
                selectedProfileId={drinkmakerOnly ? null : selectedProfile?.id ?? null}
                blendMode={blendMode}
                blurAmount={blurAmount[0]}
                spikiness={spikiness[0]}
                averageStrokeWidth={averageStrokeWidth[0]}
                colors={colors}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
