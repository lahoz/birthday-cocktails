'use client';

import { useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Cocktail } from '@/lib/cocktail-data';
import { getThemeColors } from '@/lib/theme-colors';
import DrinkTooltip from './drink-tooltip';
import { Slider } from '@/components/ui/slider';

interface DrinkMapProps {
  drinks: Cocktail[];
  hoveredDrink: string | null;
  onHoverDrink: (drink: string | null) => void;
}

interface MapPoint extends Cocktail {
  cx: number;
  cy: number;
}

const VIEWBOX_WIDTH = 1480;
const VIEWBOX_HEIGHT = 760;
const PLOT_WIDTH = VIEWBOX_WIDTH;
const PLOT_HEIGHT = VIEWBOX_HEIGHT;

function mapValueToX(value: number) {
  return ((value + 1) / 2) * PLOT_WIDTH;
}

function mapValueToY(value: number) {
  return (1 - (value + 1) / 2) * PLOT_HEIGHT;
}

export default function DrinkMap({ drinks, hoveredDrink, onHoverDrink }: DrinkMapProps) {
  const { resolvedTheme } = useTheme();
  const colors = getThemeColors(resolvedTheme);
  const [selectedDrink, setSelectedDrink] = useState<Cocktail | null>(null);
  const [dotRadius, setDotRadius] = useState([72]);
  const [blurRadius, setBlurRadius] = useState([40]);
  const [baseLayerOpacity, setBaseLayerOpacity] = useState([15]);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const chartSurfaceRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo<MapPoint[]>(() => {
    return drinks.map((drink) => ({
      ...drink,
      cx: mapValueToX(drink.classicExperimental),
      cy: mapValueToY(drink.lightSpiritForward),
    }));
  }, [drinks]);

  const hoveredPoint = useMemo(
    () => chartData.find((drink) => drink.drink === hoveredDrink) ?? null,
    [chartData, hoveredDrink],
  );

  const baseOpacity = baseLayerOpacity[0] / 100;

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
                Bubble Controls
              </p>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Bubble Radius
                  </label>
                  <span className="text-xs text-primary">{dotRadius[0]} px</span>
                </div>
                <Slider
                  min={0}
                  max={160}
                  step={1}
                  value={dotRadius}
                  onValueChange={setDotRadius}
                />
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Bubble Blur
                  </label>
                  <span className="text-xs text-primary">{blurRadius[0]} px</span>
                </div>
                <Slider
                  min={0}
                  max={96}
                  step={1}
                  value={blurRadius}
                  onValueChange={setBlurRadius}
                />
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Base Layer Opacity
                  </label>
                  <span className="text-xs text-primary">{baseLayerOpacity[0]}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={baseLayerOpacity}
                  onValueChange={setBaseLayerOpacity}
                />
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Gradient Field
              </p>
              <div className="mt-2 rounded-[1.5rem] bg-white/60 p-2 dark:bg-white/8">
                <div
                  className="h-32 rounded-[1.25rem]"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at left center, ${colors.classic}, transparent 55%),
                      radial-gradient(circle at right center, ${colors.experimental}, transparent 55%),
                      radial-gradient(circle at center bottom, ${colors.light}, transparent 52%),
                      radial-gradient(circle at center top, ${colors.spiritForward}, transparent 52%)
                    `,
                  }}
                />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <section className="relative flex min-h-0 h-full flex-1 flex-col rounded-[1.5rem] border border-white/60 bg-white/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg text-primary">Gradient Drink Map</h3>
                <p className="text-xs text-muted-foreground">A four-way gradient field revealed through soft bubbles.</p>
              </div>
            </div>

            {hoveredPoint && tooltipPosition ? (
              <div
                className="pointer-events-none absolute z-20 w-60"
                style={{
                  left: tooltipPosition.x + 26,
                  top: tooltipPosition.y + 26,
                }}
              >
                <DrinkTooltip drink={hoveredPoint} />
              </div>
            ) : null}

            {selectedDrink ? (
              <div className="absolute right-5 top-5 z-20 w-80">
                <div className="glassmorphism glow-wine rounded-[1.5rem] p-6" key={selectedDrink.drink}>
                  <button
                    onClick={() => setSelectedDrink(null)}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                  <DrinkTooltip drink={selectedDrink} expanded />
                </div>
              </div>
            ) : null}

            <div
              ref={chartSurfaceRef}
              className="relative min-h-0 flex-1 rounded-[1.5rem] bg-white/18 px-6 pb-8 pt-6 dark:bg-white/4"
            >
              <div className="absolute inset-x-4 top-6 bottom-8 overflow-hidden rounded-[1.25rem]">
                <div className="absolute inset-0 bg-white/12 dark:bg-white/4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                    className="h-full w-full"
                    preserveAspectRatio="xMidYMid meet"
                  >
          <defs>
            <radialGradient id="classic-field" cx="0%" cy="50%" r="72%">
              <stop offset="0%" stopColor={colors.classic} />
              <stop offset="100%" stopColor={colors.classic} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="experimental-field" cx="100%" cy="50%" r="72%">
              <stop offset="0%" stopColor={colors.experimental} />
              <stop offset="100%" stopColor={colors.experimental} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="light-field" cx="50%" cy="100%" r="72%">
              <stop offset="0%" stopColor={colors.light} />
              <stop offset="100%" stopColor={colors.light} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="spirit-field" cx="50%" cy="0%" r="72%">
              <stop offset="0%" stopColor={colors.spiritForward} />
              <stop offset="100%" stopColor={colors.spiritForward} stopOpacity="0" />
            </radialGradient>

            <filter
              id="bubble-blur"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation={blurRadius[0]} />
            </filter>

            <clipPath id="map-plot-clip">
              <rect
                x={0}
                y={0}
                width={PLOT_WIDTH}
                height={PLOT_HEIGHT}
                rx="28"
              />
            </clipPath>

            <mask id="bubble-mask">
              <rect
                x={0}
                y={0}
                width={PLOT_WIDTH}
                height={PLOT_HEIGHT}
                fill="black"
              />
              <g filter="url(#bubble-blur)">
                {chartData.map((drink) => (
                  <circle
                    key={`mask-${drink.person}-${drink.drink}`}
                    cx={drink.cx}
                    cy={drink.cy}
                    r={dotRadius[0]}
                    fill="white"
                    opacity="0.95"
                  />
                ))}
              </g>
            </mask>
          </defs>

          <g clipPath="url(#map-plot-clip)">
            <g opacity={baseOpacity}>
              <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="url(#classic-field)" />
              <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="url(#experimental-field)" />
              <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="url(#light-field)" />
              <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="url(#spirit-field)" />
            </g>

            <g mask="url(#bubble-mask)">
              <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="url(#classic-field)" />
              <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="url(#experimental-field)" />
              <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="url(#light-field)" />
              <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="url(#spirit-field)" />
            </g>
          </g>

          <g>
            {chartData.map((drink) => {
              const isActive =
                hoveredDrink === drink.drink ||
                selectedDrink?.drink === drink.drink;

              return (
                <circle
                  key={`hit-${drink.person}-${drink.drink}`}
                  cx={drink.cx}
                  cy={drink.cy}
                  r={Math.max(dotRadius[0], 18)}
                  fill="transparent"
                  stroke={isActive ? 'rgba(255,255,255,0.9)' : 'transparent'}
                  strokeWidth={isActive ? 2 : 0}
                  onMouseEnter={() => onHoverDrink(drink.drink)}
                  onMouseMove={(event) => {
                    const bounds = chartSurfaceRef.current?.getBoundingClientRect();

                    if (!bounds) return;

                    setTooltipPosition({
                      x: event.clientX - bounds.left,
                      y: event.clientY - bounds.top,
                    });
                  }}
                  onMouseLeave={() => {
                    onHoverDrink(null);
                    setTooltipPosition(null);
                  }}
                  onClick={() => setSelectedDrink(drink)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </g>
              </svg>
                </div>
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/15" />
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-primary/15" />
              </div>
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-xs tracking-[0.08em] text-primary/75">
                Classic ← → Experimental
              </div>
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs tracking-[0.08em] text-primary/75">
                Light ← → Spirit-Forward
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
