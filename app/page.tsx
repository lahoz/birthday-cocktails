'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import FlavorProfile from '@/components/flavor-profile';
import DrinkMap from '@/components/drink-map';
import RasterMode from '@/components/raster-mode';
import { COCKTAILS } from '@/lib/cocktail-data';

const PEOPLE = ['All', 'Agnes', 'Andy', 'Drew', 'Erika', 'Jasper', 'Marco', 'Matty', 'Sam'];

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState('All');
  const [activeMode, setActiveMode] = useState('gradient');
  const [activeGradientView, setActiveGradientView] = useState('profile');
  const [activeRasterView, setActiveRasterView] = useState<'flavor' | 'map'>('flavor');
  const [hoveredDrink, setHoveredDrink] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredDrinks = useMemo(() => {
    if (selectedPerson === 'All') return COCKTAILS;
    return COCKTAILS.filter((drink) => drink.person === selectedPerson);
  }, [selectedPerson]);

  const activeView = activeMode === 'gradient' ? activeGradientView : activeRasterView;
  const setActiveView = (value: string) => {
    if (activeMode === 'gradient') {
      setActiveGradientView(value);
      return;
    }

    setActiveRasterView(value as 'flavor' | 'map');
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/18"></div>
        <div className="absolute right-1/4 top-1/2 h-96 w-96 rounded-full bg-fuchsia-200/20 blur-3xl dark:bg-fuchsia-500/14"></div>
        <div className="absolute bottom-0 right-1/3 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl dark:bg-orange-500/12"></div>
      </div>

      <div className="relative z-10 flex h-screen w-full flex-col gap-4 p-4 overflow-y-auto">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-light tracking-[0.08em] text-primary">
            Sam&apos;s Birthday Party Drinks
          </h1>

          {/* Person Filter */}
          <div className="flex gap-2 flex-wrap items-center">
            {PEOPLE.map((person) => (
              <button
                key={person}
                onClick={() => setSelectedPerson(person)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                  selectedPerson === person
                    ? 'border-white/70 bg-white/75 text-primary shadow-[0_12px_30px_rgba(120,103,88,0.18)] dark:border-white/12 dark:bg-white/12 dark:shadow-[0_12px_30px_rgba(0,0,0,0.28)]'
                    : 'border-border bg-white/30 text-muted-foreground hover:bg-white/45 dark:bg-white/6 dark:hover:bg-white/10'
                }`}
              >
                {person}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 flex flex-col min-h-0">
            <Tabs
              value={activeMode}
              onValueChange={setActiveMode}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <TabsList className="w-fit border border-white/60 bg-white/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/12 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <TabsTrigger value="gradient">Gradient Mode</TabsTrigger>
                  <TabsTrigger value="raster">Raster Mode</TabsTrigger>
                </TabsList>

                <Tabs
                  value={activeView}
                  onValueChange={setActiveView}
                  className="contents"
                >
                  <TabsList className="w-fit border border-white/60 bg-white/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/12 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <TabsTrigger value={activeMode === 'gradient' ? 'profile' : 'flavor'}>
                      Flavor Profile
                    </TabsTrigger>
                    <TabsTrigger value="map">Drink Map</TabsTrigger>
                  </TabsList>
                </Tabs>

                <label className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/35 px-4 py-2 text-sm font-medium text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/12 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <span>{mounted && resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  <Switch
                    checked={mounted ? resolvedTheme === 'dark' : false}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    aria-label="Toggle dark mode"
                  />
                </label>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <TabsContent value="gradient" className="h-full m-0">
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex-1 min-h-0 overflow-hidden">
                      {activeGradientView === 'profile' ? (
                        <FlavorProfile drinks={filteredDrinks} />
                      ) : (
                        <DrinkMap
                          drinks={filteredDrinks}
                          hoveredDrink={hoveredDrink}
                          onHoverDrink={setHoveredDrink}
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="raster" className="h-full m-0">
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <RasterMode
                        drinks={filteredDrinks}
                        hoveredDrink={hoveredDrink}
                        onHoverDrink={setHoveredDrink}
                        activeView={activeRasterView}
                        onActiveViewChange={setActiveRasterView}
                        showViewTabs={false}
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
