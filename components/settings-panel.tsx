'use client';

import type { ReactNode } from 'react';

interface SettingsPanelProps {
  children: ReactNode;
  title?: string;
}

export default function SettingsPanel({ children, title = 'Settings' }: SettingsPanelProps) {
  return (
    <aside className="order-2 w-full shrink-0 min-h-0 xl:order-1 xl:h-full xl:w-[15.5rem] 2xl:w-[16.5rem]">
      <div className="flex h-full min-h-0 max-h-full flex-col gap-3 overflow-y-auto rounded-[1.5rem] border border-white/60 bg-white/45 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[0.85rem] text-primary sm:text-[0.95rem]">{title}</h2>
        </div>
        {children}
      </div>
    </aside>
  );
}
