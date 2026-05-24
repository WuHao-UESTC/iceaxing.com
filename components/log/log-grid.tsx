'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/lib/i18n/navigation';
import type { LogDoc } from '@/lib/sanity/types';

interface Props {
  logs: LogDoc[];
  categoryColorMap: Record<string, string>;
  legendContent: string;
  legendSite: string;
  legendOther: string;
}

export function LogGrid({
  logs,
  categoryColorMap,
  legendContent,
  legendSite,
  legendOther,
}: Props) {
  const years = [
    ...new Set(logs.map((log) => log.date.slice(0, 4))),
  ].sort((a, b) => b.localeCompare(a));

  const [selectedYear, setSelectedYear] = useState(years[0] || '');

  // Resync selectedYear if years change (e.g. ISR revalidation)
  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const filteredLogs = selectedYear
    ? logs.filter((log) => log.date.startsWith(selectedYear))
    : logs;

  const dateMap = new Map<string, LogDoc>();
  for (const log of filteredLogs) {
    dateMap.set(log.date, log);
  }

  // Build the 52-week grid centered on the selected year
  let yearDate: Date;
  if (selectedYear) {
    yearDate = new Date(Number(selectedYear), 11, 31); // Dec 31 of selected year
  } else {
    yearDate = new Date();
  }

  // Find the Sunday of the week containing Dec 31, then go back 52 weeks
  const endSunday = new Date(yearDate);
  endSunday.setDate(endSunday.getDate() - endSunday.getDay()); // Previous Sunday
  const startDate = new Date(endSunday);
  startDate.setDate(startDate.getDate() - 52 * 7 + 1);

  const weeks: { date: string; dayOfWeek: number }[][] = [];
  for (let w = 0; w < 52; w++) {
    const week: { date: string; dayOfWeek: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const dStr = String(date.getDate()).padStart(2, '0');
      week.push({
        date: `${y}-${m}-${dStr}`,
        dayOfWeek: d,
      });
    }
    weeks.push(week);
  }

  return (
    <>
      {years.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                year === selectedYear
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1" style={{ minWidth: '780px' }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => {
                const log = dateMap.get(day.date);
                return log ? (
                  <Link
                    key={day.date}
                    href={`/log/${log.slug}`}
                    title={`${log.title}\n${log.description || ''}`}
                    className={`w-3.5 h-3.5 rounded-sm ${
                      categoryColorMap[log.category] || categoryColorMap.content
                    } transition-colors`}
                  />
                ) : (
                  <div
                    key={day.date}
                    className="w-3.5 h-3.5 rounded-sm bg-zinc-100"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-6 text-sm text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-amber-400" /> {legendContent}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-yellow-500" /> {legendSite}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-orange-400" /> {legendOther}
        </span>
      </div>
    </>
  );
}
