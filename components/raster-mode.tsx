'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Cocktail } from '@/lib/cocktail-data';
import { buildDrinkmakerDefaults, drinkmakerStateToProfile, type DrinkmakerState } from '@/lib/drinkmaker';
import { getThemeColors } from '@/lib/theme-colors';
import RasterGrid from './raster-grid';
import DrinkTooltip from './drink-tooltip';
import DrinkmakerCard from './drinkmaker-card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SettingsPanel from './settings-panel';

interface RasterModeProps {
  drinks: Cocktail[];
  hoveredDrink: string | null;
  onHoverDrink: (drink: string | null) => void;
  activeView?: 'flavor' | 'map';
  onActiveViewChange?: (view: 'flavor' | 'map') => void;
  showViewTabs?: boolean;
  drinkmakerOnly?: boolean;
}

interface DrinkProfile {
  id: string;
  name: string;
  person: string;
  mapX: number;
  mapY: number;
  values: number[];
}

type BlendMode = 'normal' | 'overlay' | 'multiply' | 'screen' | 'lighten';
const DIMENSIONS = [
  { key: 'spiritIntensity', label: 'Spirit Intensity' },
  { key: 'complexity', label: 'Complexity' },
  { key: 'fruitiness', label: 'Fruitiness' },
  { key: 'familiarity', label: 'Familiarity' },
  { key: 'richness', label: 'Richness' },
] as const;

const FLAVOR_LABELS = [
  { label: 'Spirit Intensity', x: '50%', y: '6%' },
  { label: 'Complexity', x: '100%', y: '33%' },
  { label: 'Fruitiness', x: '85%', y: '88%' },
  { label: 'Familiarity', x: '15%', y: '88%' },
  { label: 'Richness', x: '0%', y: '33%' },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function quantize(value: number, steps: number) {
  if (steps <= 1) return value;
  const clamped = clamp(value);
  return Math.round(clamped * (steps - 1)) / (steps - 1);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => clamp(value / 255, 0, 1);
  const color = {
    r: Math.round(toHex(r) * 255),
    g: Math.round(toHex(g) * 255),
    b: Math.round(toHex(b) * 255),
  };

  return `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
}

function mixColors(a: string, b: string, weight: number) {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  const t = clamp(weight);

  return rgbToHex(
    left.r + (right.r - left.r) * t,
    left.g + (right.g - left.g) * t,
    left.b + (right.b - left.b) * t,
  );
}

function mixRgb(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, weight: number) {
  const t = clamp(weight);
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function blendChannel(base: number, top: number, mode: BlendMode) {
  const b = clamp(base);
  const t = clamp(top);

  switch (mode) {
    case 'multiply':
      return b * t;
    case 'screen':
      return 1 - (1 - b) * (1 - t);
    case 'lighten':
      return Math.max(b, t);
    case 'overlay':
      return b < 0.5 ? 2 * b * t : 1 - 2 * (1 - b) * (1 - t);
    case 'normal':
    default:
      return t;
  }
}

function compositeColors(
  base: { r: number; g: number; b: number },
  topHex: string,
  alpha: number,
  mode: BlendMode,
) {
  const top = hexToRgb(topHex);
  const topNormalized = {
    r: top.r / 255,
    g: top.g / 255,
    b: top.b / 255,
  };
  const baseNormalized = {
    r: base.r / 255,
    g: base.g / 255,
    b: base.b / 255,
  };

  return {
    r: (baseNormalized.r * (1 - alpha) + blendChannel(baseNormalized.r, topNormalized.r, mode) * alpha) * 255,
    g: (baseNormalized.g * (1 - alpha) + blendChannel(baseNormalized.g, topNormalized.g, mode) * alpha) * 255,
    b: (baseNormalized.b * (1 - alpha) + blendChannel(baseNormalized.b, topNormalized.b, mode) * alpha) * 255,
  };
}

function buildBlobPoints(values: number[], spikiness: number) {
  const pointCount = values.length;
  const angleSlice = (Math.PI * 2) / pointCount;
  const spikeT = clamp(spikiness / 100);
  const midpointMultiplier = 0.98 - 0.48 * spikeT;

  return values.flatMap((value, index) => {
    const nextValue = values[(index + 1) % pointCount];
    return [
      { angle: index * angleSlice, radius: value },
      {
        angle: index * angleSlice + angleSlice / 2,
        radius: ((value + nextValue) / 2) * midpointMultiplier,
      },
    ];
  });
}

function normalizeAngle(value: number) {
  let angle = value;
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}

function interpolateBlobRadius(points: Array<{ angle: number; radius: number }>, angle: number) {
  const normalizedAngle = normalizeAngle(angle);
  const extended = [...points, { ...points[0], angle: points[0].angle + Math.PI * 2 }];

  for (let index = 0; index < extended.length - 1; index += 1) {
    const current = extended[index];
    const next = extended[index + 1];
    if (normalizedAngle >= current.angle && normalizedAngle <= next.angle) {
      const span = next.angle - current.angle || 1;
      const t = (normalizedAngle - current.angle) / span;
      return current.radius + (next.radius - current.radius) * t;
    }
  }

  return points[0].radius;
}

function getFlavorGradientStops(
  profile: DrinkProfile,
  colors: ReturnType<typeof getThemeColors>,
) {
  return {
    start: profile.mapX < 0 ? colors.classic : colors.experimental,
    end: profile.mapY < 0 ? colors.light : colors.spiritForward,
  };
}

function getMapFieldColor(
  normalizedX: number,
  normalizedY: number,
  colors: ReturnType<typeof getThemeColors>,
) {
  const horizontalColor = normalizedX < 0 ? colors.classic : colors.experimental;
  const verticalColor = normalizedY < 0 ? colors.light : colors.spiritForward;
  const horizontalStrength = Math.abs(normalizedX);
  const verticalStrength = Math.abs(normalizedY);
  const totalStrength = horizontalStrength + verticalStrength;

  if (totalStrength === 0) {
    return mixColors(horizontalColor, verticalColor, 0.5);
  }

  return mixColors(horizontalColor, verticalColor, verticalStrength / totalStrength);
}

export default function RasterMode({
  drinks,
  hoveredDrink,
  onHoverDrink,
  activeView,
  onActiveViewChange,
  showViewTabs = true,
  drinkmakerOnly = false,
}: RasterModeProps) {
  const { resolvedTheme } = useTheme();
  const [internalActiveRasterView, setInternalActiveRasterView] = useState<'flavor' | 'map'>('flavor');
  const [gridSize, setGridSize] = useState([16]);
  const [gridSpacing, setGridSpacing] = useState([40]);
  const [gradientSteps, setGradientSteps] = useState([6]);
  const [roundedCells, setRoundedCells] = useState('square');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [flavorBlurAmount, setFlavorBlurAmount] = useState([12]);
  const [spikiness, setSpikiness] = useState([100]);
  const [blendMode, setBlendMode] = useState<BlendMode>('normal');
  const [colors, setColors] = useState(() => getThemeColors(undefined));
  const [drinkmakerState, setDrinkmakerState] = useState<DrinkmakerState>(() => buildDrinkmakerDefaults(drinks));
  const [bubbleRadius, setBubbleRadius] = useState([72]);
  const [bubbleBlur, setBubbleBlur] = useState([40]);
  const [baseLayerOpacity, setBaseLayerOpacity] = useState([15]);
  const [mapTooltip, setMapTooltip] = useState<{
    drink: Cocktail;
    x: number;
    y: number;
  } | null>(null);
  const rasterMapSurfaceRef = useRef<HTMLDivElement>(null);
  const activeRasterView = drinkmakerOnly ? 'flavor' : activeView ?? internalActiveRasterView;
  const setActiveRasterView = (view: 'flavor' | 'map') => {
    if (activeView === undefined) {
      setInternalActiveRasterView(view);
    }
    onActiveViewChange?.(view);
  };

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

    const nextProfiles = drinks.map((drink) => ({
      id: `${drink.person}__${drink.drink}`,
      name: drink.drink,
      person: drink.person,
      mapX: drink.classicExperimental,
      mapY: drink.lightSpiritForward,
      values: DIMENSIONS.map(({ key }) => drink[key]),
    }));

    const nextAverageProfile = DIMENSIONS.map(({ key }) => (
      drinks.reduce((sum, drink) => sum + drink[key], 0) / drinks.length
    ));

    return {
      dimensions: DIMENSIONS.map(({ label }) => label),
      profiles: nextProfiles,
      averageProfile: nextAverageProfile,
    };
  }, [drinks]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [activeProfileId, profiles],
  );

  const visibleProfiles = useMemo(
    () => (drinkmakerOnly ? [] : selectedProfile ? [selectedProfile] : profiles),
    [drinkmakerOnly, profiles, selectedProfile],
  );

  const drinkmakerProfile = useMemo(
    () => drinkmakerStateToProfile(drinkmakerState),
    [drinkmakerState],
  );

  const flavorModel = useMemo(() => {
    const densityBoost = clamp(5 / Math.max(1, visibleProfiles.length), 1, 2.8);

    return visibleProfiles.map((profile, index) => ({
      profile,
      points: buildBlobPoints(profile.values, spikiness[0]),
      colors: getFlavorGradientStops(profile, colors),
      xOffset: Math.sin(index * 1.7) * 2,
      yOffset: Math.cos(index * 1.3) * 2,
      scale: selectedProfile ? 1.05 : 1.02,
      opacity: (selectedProfile ? 0.62 : 0.34) * densityBoost,
    }));
  }, [colors, selectedProfile, spikiness, visibleProfiles]);

  const previewFlavorModel = useMemo(() => ({
    points: buildBlobPoints(drinkmakerProfile.values, spikiness[0]),
    colors: getFlavorGradientStops(drinkmakerProfile, colors),
    scale: 1.03,
    opacity: 0.7,
  }), [colors, drinkmakerProfile, spikiness]);

  const updateColor = (key: keyof typeof colors, value: string) => {
    setColors((current) => ({ ...current, [key]: value }));
  };

  const flavorSampler = useMemo(() => {
    return ({
      x,
      y,
      width,
      height,
    }: {
      height: number;
      normalizedX: number;
      normalizedY: number;
      width: number;
      x: number;
      y: number;
    }) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const radiusScale = Math.min(width, height) / 2 - 64;
      const dxBase = x - centerX;
      const dyBase = y - centerY;
      const sigma = 0.035 + flavorBlurAmount[0] / 460;

      let accum = { r: 255, g: 255, b: 255 };
      let layeredAlpha = 0;
      let alphaEnergy = 0;

      flavorModel.forEach((entry) => {
        const dx = dxBase - entry.xOffset;
        const dy = dyBase - entry.yOffset;
        const normalizedRadius = Math.hypot(dx, dy) / (radiusScale * entry.scale);
        const angle = normalizeAngle(Math.atan2(dy, dx) + Math.PI / 2);
        const targetRadius = interpolateBlobRadius(entry.points, angle);
        const signedDistance = targetRadius - normalizedRadius;
        const strength = signedDistance >= 0
          ? 1
          : Math.exp(-((Math.abs(signedDistance) ** 2) / (2 * sigma * sigma)));
        const alpha = clamp(strength * entry.opacity);

        if (alpha < 0.02) return;

        const projection = clamp(
          ((dx / (radiusScale * entry.scale)) * 0.5) +
          ((dy / (radiusScale * entry.scale)) * -0.5) +
          0.5,
        );
        const color = mixColors(
          entry.colors.start,
          entry.colors.end,
          quantize(projection, gradientSteps[0]),
        );
        accum = compositeColors(accum, color, alpha, blendMode);
        layeredAlpha = 1 - (1 - layeredAlpha) * (1 - alpha);
        alphaEnergy += alpha;
      });

      const previewNormalizedRadius = Math.hypot(dxBase, dyBase) / (radiusScale * previewFlavorModel.scale);
      const previewAngle = normalizeAngle(Math.atan2(dyBase, dxBase) + Math.PI / 2);
      const previewTargetRadius = interpolateBlobRadius(previewFlavorModel.points, previewAngle);
      const previewSignedDistance = previewTargetRadius - previewNormalizedRadius;
      const previewStrength = previewSignedDistance >= 0
        ? 1
        : Math.exp(-((Math.abs(previewSignedDistance) ** 2) / (2 * sigma * sigma)));
      const previewAlpha = clamp(previewStrength * previewFlavorModel.opacity);

      if (previewAlpha >= 0.02) {
        const previewProjection = clamp(
          ((dxBase / (radiusScale * previewFlavorModel.scale)) * 0.5) +
          ((dyBase / (radiusScale * previewFlavorModel.scale)) * -0.5) +
          0.5,
        );
        const previewColor = mixColors(
          previewFlavorModel.colors.start,
          previewFlavorModel.colors.end,
          quantize(previewProjection, gradientSteps[0]),
        );
        accum = compositeColors(accum, previewColor, previewAlpha, blendMode);
        layeredAlpha = 1 - (1 - layeredAlpha) * (1 - previewAlpha);
        alphaEnergy += previewAlpha * 1.3;
      }

      const overlapBoost = clamp(layeredAlpha + alphaEnergy * 0.3);

      return {
        fill: rgbToHex(accum.r, accum.g, accum.b),
        opacity: quantize(clamp(overlapBoost * 1.2), gradientSteps[0]),
      };
    };
  }, [blendMode, flavorBlurAmount, flavorModel, gradientSteps, previewFlavorModel]);

  const mapPoints = useMemo(
    () => drinks.map((drink) => ({
      cocktail: drink,
      x: drink.classicExperimental,
      y: drink.lightSpiritForward,
    })),
    [drinks],
  );

  const mapSampler = useMemo(() => {
    const densityBoost = clamp(6 / Math.max(1, mapPoints.length), 1, 2.6);

    return ({
      x,
      y,
      width,
      height,
      normalizedX,
      normalizedY,
    }: {
      height: number;
      normalizedX: number;
      normalizedY: number;
      width: number;
      x: number;
      y: number;
    }) => {
      const steppedX = quantize((normalizedX + 1) / 2, gradientSteps[0]) * 2 - 1;
      const steppedY = quantize((normalizedY + 1) / 2, gradientSteps[0]) * 2 - 1;
      const gradientColor = getMapFieldColor(steppedX, steppedY, colors);
      const bubbleRadiusPx = bubbleRadius[0];
      const bubbleSigmaPx = Math.max(1, bubbleBlur[0]);

      let reveal = 0;

      mapPoints.forEach((point) => {
        const px = ((point.x + 1) / 2) * width;
        const py = ((1 - (point.y + 1) / 2)) * height;
        const distance = Math.hypot(x - px, y - py);

        if (distance <= bubbleRadiusPx) {
          reveal += densityBoost;
          return;
        }

        const edgeDistance = distance - bubbleRadiusPx;
        reveal += Math.exp(-((edgeDistance ** 2) / (2 * bubbleSigmaPx * bubbleSigmaPx))) * densityBoost;
      });

      const opacity = clamp(baseLayerOpacity[0] / 100 + clamp(reveal * 0.9) * (1 - baseLayerOpacity[0] / 100));

      return {
        fill: gradientColor,
        opacity: quantize(opacity, gradientSteps[0]),
      };
    };
  }, [baseLayerOpacity, bubbleBlur, bubbleRadius, colors, gradientSteps, mapPoints]);

  const activeHoveredDrink = hoveredDrink
    ? drinks.find((drink) => drink.drink === hoveredDrink) ?? null
    : null;

  return (
    <div className="glassmorphism min-h-0 rounded-[2rem] p-3 shadow-[0_20px_60px_rgba(214,194,166,0.18)] sm:p-4 lg:h-full lg:p-5 xl:h-full">
      <div className="flex min-h-0 flex-col gap-4 xl:h-full xl:flex-row xl:gap-5">
        <SettingsPanel>
            {drinkmakerOnly ? (
              <DrinkmakerCard state={drinkmakerState} onChange={setDrinkmakerState} />
            ) : null}

            <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Raster Controls
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Grid Size
                  </label>
                  <span className="text-[10px] text-primary sm:text-[10px]">{gridSize[0]} px</span>
                </div>
                <Slider min={8} max={36} step={1} value={gridSize} onValueChange={setGridSize} />
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Grid Spacing
                  </label>
                  <span className="text-[10px] text-primary sm:text-[10px]">{gridSpacing[0]}%</span>
                </div>
                <Slider min={0} max={60} step={1} value={gridSpacing} onValueChange={setGridSpacing} />
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Gradient Steps
                  </label>
                  <span className="text-[10px] text-primary sm:text-[10px]">{gradientSteps[0]}</span>
                </div>
                <Slider min={2} max={16} step={2} value={gradientSteps} onValueChange={setGradientSteps} />
              </div>
              <div className="mt-5 space-y-2">
                <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Cell Shape
                </label>
                <Select value={roundedCells} onValueChange={setRoundedCells}>
                  <SelectTrigger className="h-8 w-full rounded-xl border-white/60 bg-white/70 text-[10px] dark:border-white/10 dark:bg-white/8 sm:text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/60 bg-white/92 dark:border-white/10 dark:bg-[#141b24]">
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeRasterView === 'flavor' ? (
              <>
                <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3.5 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Flavor Controls
                  </p>
                  <div className="mt-3 space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      Blend Mode
                    </label>
                    <Select value={blendMode} onValueChange={(value) => setBlendMode(value as BlendMode)}>
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
                        Blob Blur
                      </label>
                      <span className="text-[10px] text-primary sm:text-[10px]">{flavorBlurAmount[0]} px</span>
                    </div>
                    <Slider min={0} max={48} step={1} value={flavorBlurAmount} onValueChange={setFlavorBlurAmount} />
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        Spikiness
                      </label>
                      <span className="text-[10px] text-primary sm:text-[10px]">{spikiness[0]}%</span>
                    </div>
                    <Slider min={0} max={100} step={1} value={spikiness} onValueChange={setSpikiness} />
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3.5 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Shared Colors
                  </p>
                  <div className="mt-3 space-y-3">
                    {([
                      ['classic', 'Classic'],
                      ['experimental', 'Experimental'],
                      ['light', 'Light'],
                      ['spiritForward', 'Spirit-Forward'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2.5 py-1.5 dark:bg-white/6">
                        <span className="min-w-0 text-[10px] text-primary sm:text-[10px]">{label}</span>
                        <span className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={colors[key]}
                            onChange={(event) => updateColor(key, event.target.value)}
                            className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                          />
                          <span className="w-16 text-right font-mono text-[10px] text-muted-foreground">{colors[key]}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3.5 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Map Controls
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        Bubble Radius
                      </label>
                      <span className="text-[10px] text-primary sm:text-[10px]">{bubbleRadius[0]} px</span>
                    </div>
                    <Slider min={0} max={160} step={1} value={bubbleRadius} onValueChange={setBubbleRadius} />
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        Bubble Blur
                      </label>
                      <span className="text-[10px] text-primary sm:text-[10px]">{bubbleBlur[0]} px</span>
                    </div>
                    <Slider min={0} max={96} step={1} value={bubbleBlur} onValueChange={setBubbleBlur} />
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        Base Layer Opacity
                      </label>
                      <span className="text-[10px] text-primary sm:text-[10px]">{baseLayerOpacity[0]}%</span>
                    </div>
                    <Slider min={0} max={100} step={1} value={baseLayerOpacity} onValueChange={setBaseLayerOpacity} />
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/50 bg-white/55 p-3.5 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Shared Colors
                  </p>
                  <div className="mt-3 space-y-3">
                    {([
                      ['classic', 'Classic'],
                      ['experimental', 'Experimental'],
                      ['light', 'Light'],
                      ['spiritForward', 'Spirit-Forward'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 px-2.5 py-1.5 dark:bg-white/6">
                        <span className="min-w-0 text-[10px] text-primary sm:text-[10px]">{label}</span>
                        <span className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={colors[key]}
                            onChange={(event) => updateColor(key, event.target.value)}
                            className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                          />
                          <span className="w-16 text-right font-mono text-[10px] text-muted-foreground">{colors[key]}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
        </SettingsPanel>

        <div className="order-1 flex min-h-0 flex-1 flex-col">
          <Tabs
            value={activeRasterView}
            onValueChange={(value) => setActiveRasterView(value as 'flavor' | 'map')}
            className="flex min-h-0 flex-1 flex-col"
          >
            {showViewTabs && !drinkmakerOnly ? (
              <TabsList className="mb-4 w-fit border border-white/60 bg-white/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/12 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <TabsTrigger value="flavor">Flavor Profile</TabsTrigger>
                <TabsTrigger value="map">Drink Map</TabsTrigger>
              </TabsList>
            ) : null}

            <div className="min-h-0 flex-1">
              <TabsContent value="flavor" className="m-0 h-full">
                <section className="flex min-h-[540px] flex-1 flex-col rounded-[1.5rem] border border-white/60 bg-white/35 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:min-h-[620px] sm:p-4 xl:h-full xl:min-h-0">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base text-primary sm:text-lg">Raster Flavor Profile</h3>
                      <p className="text-[13px] text-muted-foreground sm:text-sm">
                        {drinkmakerOnly
                          ? 'Live custom drink flower sampled into soft square cells.'
                          : 'Low-resolution blob field sampled into soft square cells.'}
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
                  <div className="relative min-h-0 flex-1 rounded-[1.5rem] bg-white/18 p-3.5 dark:bg-white/4 sm:p-5 lg:p-6">
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
                    <div className={`mx-auto flex h-full w-full items-center justify-center ${drinkmakerOnly ? '' : 'lg:px-[8.5rem] xl:px-[9.5rem]'}`}>
                      <div className="relative aspect-square w-full max-w-[432px] sm:max-w-[486px] lg:max-w-[450px] xl:max-w-[486px]">
                        {FLAVOR_LABELS.map((item) => (
                          <div
                            key={item.label}
                            className="pointer-events-none absolute text-xs tracking-[0.08em] text-primary/75"
                            style={{ left: item.x, top: item.y, transform: 'translate(-50%, -50%)' }}
                          >
                            {item.label}
                          </div>
                        ))}
                        <RasterGrid
                          className="h-full w-full rounded-[1.25rem]"
                          cellSize={gridSize[0]}
                          cellSpacing={gridSpacing[0] / 100}
                          roundedCells={roundedCells === 'rounded'}
                          sampler={flavorSampler}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {!drinkmakerOnly ? (
                <TabsContent value="map" className="m-0 h-full">
                <section className="relative flex min-h-[520px] flex-1 flex-col rounded-[1.5rem] border border-white/60 bg-white/35 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:min-h-[600px] sm:p-4 xl:h-full xl:min-h-0">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base text-primary sm:text-lg">Raster Drink Map</h3>
                      <p className="text-[13px] text-muted-foreground sm:text-sm">A four-way gradient field revealed through soft raster bubbles.</p>
                    </div>
                  </div>

                  {mapTooltip ? (
                    <div
                      className="pointer-events-none absolute z-20 w-60"
                      style={{ left: mapTooltip.x + 26, top: mapTooltip.y + 26 }}
                    >
                      <DrinkTooltip drink={mapTooltip.drink} />
                    </div>
                  ) : null}

                  <div
                    ref={rasterMapSurfaceRef}
                    className="relative min-h-0 flex-1 rounded-[1.5rem] bg-white/18 px-4 pb-10 pt-6 dark:bg-white/4 sm:px-8 sm:pb-12 sm:pt-10 lg:px-10"
                  >
                    <div className="absolute inset-x-2 top-6 bottom-10 flex items-center justify-center sm:inset-x-8 sm:top-10 sm:bottom-12 lg:inset-x-10">
                      <div className="relative w-full max-h-full max-w-full overflow-hidden rounded-[1.25rem] aspect-[1180/760] sm:w-[94%] lg:w-[88%]">
                        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/15" />
                        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-primary/15" />
                        <RasterGrid
                          className="h-full w-full"
                          cellSize={gridSize[0]}
                          cellSpacing={gridSpacing[0] / 100}
                          roundedCells={roundedCells === 'rounded'}
                          sampler={mapSampler}
                          onPointerLeave={() => {
                            onHoverDrink(null);
                            setMapTooltip(null);
                          }}
                          onPointerMove={({ clientX, clientY, normalizedX, normalizedY }) => {
                            let nearestDrink: Cocktail | null = null;
                            let nearestDistance = Number.POSITIVE_INFINITY;

                            mapPoints.forEach((point) => {
                              const dx = normalizedX - point.x;
                              const dy = normalizedY - point.y;
                              const distance = Math.hypot(dx, dy);

                              if (distance <= 0.42 && distance < nearestDistance) {
                                nearestDistance = distance;
                                nearestDrink = point.cocktail;
                              }
                            });

                            if (nearestDrink) {
                              const hoveredMatch: Cocktail = nearestDrink;
                              const bounds = rasterMapSurfaceRef.current?.getBoundingClientRect();

                              onHoverDrink(hoveredMatch.drink);
                              setMapTooltip(
                                bounds
                                  ? {
                                      drink: hoveredMatch,
                                      x: clientX - bounds.left,
                                      y: clientY - bounds.top,
                                    }
                                  : null,
                              );
                            } else {
                              onHoverDrink(null);
                              setMapTooltip(null);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.08em] text-primary/75 sm:bottom-3 sm:text-xs">
                      Classic ← → Experimental
                    </div>
                    <div className="pointer-events-none absolute -left-[3%] top-1/2 -translate-y-1/2 -rotate-90 text-[11px] tracking-[0.08em] text-primary/75 sm:-left-[1%] sm:text-xs">
                      Light ← → Spirit-Forward
                    </div>
                  </div>
                </section>
                </TabsContent>
              ) : null}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
