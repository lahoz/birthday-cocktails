'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { Cocktail } from '@/lib/cocktail-data';
import { getThemeColors } from '@/lib/theme-colors';
import SmoothRadar from './smooth-radar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface FlavorProfileProps {
  drinks: Cocktail[];
}

const DIMENSIONS = [
  { key: 'spiritIntensity', label: 'Spirit Intensity' },
  { key: 'complexity', label: 'Complexity' },
  { key: 'fruitiness', label: 'Fruitiness' },
  { key: 'familiarity', label: 'Familiarity' },
  { key: 'richness', label: 'Richness' },
] as const;

export default function FlavorProfile({ drinks }: FlavorProfileProps) {
  const { resolvedTheme } = useTheme();
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [blendMode, setBlendMode] = useState('normal');
  const [blurAmount, setBlurAmount] = useState([12]);
  const [spikiness, setSpikiness] = useState([100]);
  const [colors, setColors] = useState(() => getThemeColors(undefined));

  useEffect(() => {
    setColors(getThemeColors(resolvedTheme));
  }, [resolvedTheme]);

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

  const updateColor = (key: keyof typeof colors, value: string) => {
    setColors((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="h-full glassmorphism rounded-[2rem] p-4 min-h-0 shadow-[0_20px_60px_rgba(214,194,166,0.18)]">
      <div className="flex h-full flex-col gap-4 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto rounded-[1.5rem] border border-white/60 bg-white/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="space-y-1">
              <h2 className="text-lg text-primary">Settings</h2>
            </div>

            <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Render Controls
              </p>

              <div className="mt-2 space-y-2">
                <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Blend Mode
                </label>
                <Select value={blendMode} onValueChange={setBlendMode}>
                  <SelectTrigger className="w-full rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/8">
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

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Blur
                  </label>
                  <span className="text-xs text-primary">{blurAmount[0]} px</span>
                </div>
                <Slider
                  min={0}
                  max={48}
                  step={1}
                  value={blurAmount}
                  onValueChange={setBlurAmount}
                />
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Spikiness
                  </label>
                  <span className="text-xs text-primary">{spikiness[0]}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={spikiness}
                  onValueChange={setSpikiness}
                />
              </div>

            </div>

            <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Color Controls
              </p>
              <div className="mt-2 space-y-2">
                <label className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2 py-1.5 dark:bg-white/6">
                  <span className="text-xs text-primary">Classic</span>
                  <span className="flex items-center gap-1">
                    <input
                      type="color"
                      value={colors.classic}
                      onChange={(event) => updateColor('classic', event.target.value)}
                      className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                      {colors.classic}
                    </span>
                  </span>
                </label>
                <label className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2 py-1.5 dark:bg-white/6">
                  <span className="text-xs text-primary">Experimental</span>
                  <span className="flex items-center gap-1">
                    <input
                      type="color"
                      value={colors.experimental}
                      onChange={(event) => updateColor('experimental', event.target.value)}
                      className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                      {colors.experimental}
                    </span>
                  </span>
                </label>
                <label className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2 py-1.5 dark:bg-white/6">
                  <span className="text-xs text-primary">Light</span>
                  <span className="flex items-center gap-1">
                    <input
                      type="color"
                      value={colors.light}
                      onChange={(event) => updateColor('light', event.target.value)}
                      className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                      {colors.light}
                    </span>
                  </span>
                </label>
                <label className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2 py-1.5 dark:bg-white/6">
                  <span className="text-xs text-primary">Spirit-Forward</span>
                  <span className="flex items-center gap-1">
                    <input
                      type="color"
                      value={colors.spiritForward}
                      onChange={(event) => updateColor('spiritForward', event.target.value)}
                      className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                      {colors.spiritForward}
                    </span>
                  </span>
                </label>
              </div>
            </div>

          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 h-full flex-1 flex-col rounded-[1.5rem] border border-white/60 bg-white/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg text-primary">Gradient Flavor Profile</h3>
                <p className="text-xs text-muted-foreground">A layered gradient star field with an average profile overlay.</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-primary/85">
                  <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2 py-1 dark:bg-white/8">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: colors.classic }}
                    />
                    <span>Classic</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2 py-1 dark:bg-white/8">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: colors.experimental }}
                    />
                    <span>Experimental</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2 py-1 dark:bg-white/8">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: colors.light }}
                    />
                    <span>Light</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2 py-1 dark:bg-white/8">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: colors.spiritForward }}
                    />
                    <span>Spirit-Forward</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2 py-1 dark:bg-white/8">
                    <span className="h-px w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                    <span>Average profile</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative min-h-0 flex-1 rounded-[1.5rem] bg-white/18 p-5 dark:bg-white/4 flex flex-col">
              <div className="absolute left-4 top-4 bottom-4 z-10 flex w-48 flex-col space-y-2 overflow-hidden">
                <div className="shrink-0 px-1">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Drink Count</p>
                  <p className="mt-1 text-3xl leading-none text-primary">{profiles.length}</p>
                </div>
                <div className="min-h-0 overflow-y-auto px-1">
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
              <SmoothRadar
                dimensions={dimensions}
                profiles={profiles}
                averageProfile={averageProfile}
                selectedProfileId={selectedProfile?.id ?? null}
                blendMode={blendMode}
                blurAmount={blurAmount[0]}
                spikiness={spikiness[0]}
                colors={colors}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
