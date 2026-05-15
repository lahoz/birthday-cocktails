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
  const [activeModule, setActiveModule] = useState<'explore' | 'drinkmaker'>('explore');
  const [selectedPerson, setSelectedPerson] = useState('All');
  const [activeMode, setActiveMode] = useState('raster');
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
    <div className="min-h-dvh overflow-x-hidden bg-background xl:h-dvh xl:overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/18"></div>
        <div className="absolute right-1/4 top-1/2 h-96 w-96 rounded-full bg-fuchsia-200/20 blur-3xl dark:bg-fuchsia-500/14"></div>
        <div className="absolute bottom-0 right-1/3 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl dark:bg-orange-500/12"></div>
      </div>

      <Tabs
        value={activeMode}
        onValueChange={setActiveMode}
        className="relative z-10 mx-auto flex min-h-dvh w-full flex-col gap-3 px-2.5 py-2.5 sm:gap-3.5 sm:px-3.5 sm:py-3.5 lg:gap-4 lg:px-4 lg:py-4 xl:h-full xl:min-h-0 xl:px-5 xl:py-5"
      >
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
            <h1 className="text-[1.5rem] font-light tracking-[0.08em] text-primary sm:text-[1.8rem] lg:text-[2rem]">
              Sam&apos;s Birthday Party Drinks
            </h1>

            <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-[12px]">
              <button
                type="button"
                onClick={() => setActiveModule(activeModule === 'explore' ? 'drinkmaker' : 'explore')}
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
              >
                <span>
                  {activeModule === 'explore'
                    ? 'Make your own drink'
                    : 'Go to birthday collection'}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </nav>
          </div>

          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
            <div className="flex flex-wrap items-center gap-1.5">
              {activeModule === 'explore'
                ? PEOPLE.map((person) => (
                    <button
                      key={person}
                      onClick={() => setSelectedPerson(person)}
                      className={`rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-300 sm:px-3 sm:text-[12px] ${
                        selectedPerson === person
                          ? 'border-white/70 bg-white/75 text-primary shadow-[0_12px_30px_rgba(120,103,88,0.18)] dark:border-white/12 dark:bg-white/12 dark:shadow-[0_12px_30px_rgba(0,0,0,0.28)]'
                          : 'border-border bg-white/30 text-muted-foreground hover:bg-white/45 dark:bg-white/6 dark:hover:bg-white/10'
                      }`}
                    >
                      {person}
                    </button>
                  ))
                : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 xl:justify-end">
              <TabsList className="w-fit border border-white/60 bg-white/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/12 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <TabsTrigger value="gradient">Gradient Mode</TabsTrigger>
                <TabsTrigger value="raster">Raster Mode</TabsTrigger>
              </TabsList>

              {activeModule === 'explore' ? (
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
              ) : null}

              <label className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/35 px-2.5 py-1.5 text-[11px] font-medium text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/12 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-3 sm:text-[12px]">
                <span>{mounted && resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                <Switch
                  checked={mounted ? resolvedTheme === 'dark' : false}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  aria-label="Toggle dark mode"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="min-h-0 flex-1 overflow-visible lg:overflow-hidden">
            <TabsContent value="gradient" className="m-0 h-full">
              <div className="flex h-full min-h-0 flex-col">
                <div className="min-h-0 flex-1 overflow-hidden">
                  {activeModule === 'drinkmaker' ? (
                    <FlavorProfile drinks={COCKTAILS} drinkmakerOnly />
                  ) : activeGradientView === 'profile' ? (
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

            <TabsContent value="raster" className="m-0 h-full">
              <div className="flex h-full min-h-0 flex-col">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <RasterMode
                    drinks={activeModule === 'drinkmaker' ? COCKTAILS : filteredDrinks}
                    hoveredDrink={hoveredDrink}
                    onHoverDrink={setHoveredDrink}
                    activeView={activeRasterView}
                    onActiveViewChange={setActiveRasterView}
                    showViewTabs={false}
                    drinkmakerOnly={activeModule === 'drinkmaker'}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
