'use client';

import { useState } from 'react';
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
  legendContent,
  legendSite,
  legendOther,
}: Props) {
  const currentYear = String(new Date().getFullYear());
  const years = [
    ...new Set([currentYear, ...logs.map((log) => log.date.slice(0, 4))]),
  ].sort((a, b) => b.localeCompare(a));

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const activeYear = years.includes(selectedYear) ? selectedYear : currentYear;

  const filteredLogs = activeYear
    ? logs.filter((log) => log.date.startsWith(activeYear))
    : logs;

  const dateMap = new Map<string, LogDoc>();
  for (const log of filteredLogs) {
    dateMap.set(log.date, log);
  }

  const yearNumber = activeYear ? Number(activeYear) : new Date().getFullYear();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const months = Array.from({ length: 12 }, (_, month) => {
    const firstDay = new Date(yearNumber, month, 1).getDay();
    const daysInMonth = new Date(yearNumber, month + 1, 0).getDate();
    const cells = [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: daysInMonth }, (_, dayIndex) => {
        const day = dayIndex + 1;
        return {
          date: `${yearNumber}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          day,
        };
      }),
    ];

    return { month, cells };
  });

  return (
    <>
      <div className="log-year-header">
        <h2>{activeYear}</h2>
        <div className="log-year-switcher" aria-label="Year selector">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={year === activeYear ? 'is-active' : ''}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="log-calendar">
        {months.map(({ month, cells }) => (
          <section key={month} className="log-month" aria-label={`${monthNames[month]} ${yearNumber}`}>
            <h2>{monthNames[month]}</h2>
            <div className="log-weekdays" aria-hidden="true">
              {weekDays.map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="log-days">
              {cells.map((cell, index) => {
                if (!cell) {
                  return <span key={`empty-${index}`} className="log-day is-empty" />;
                }

                const log = dateMap.get(cell.date);
                return log ? (
                  <Link
                    key={cell.date}
                    href={`/log/${log.slug}`}
                    title={`${log.title}\n${log.description || ''}`}
                    aria-label={`${cell.date}: ${log.title}`}
                    className={`log-day has-log is-${log.category}`}
                  >
                    {cell.day}
                  </Link>
                ) : (
                  <span key={cell.date} className="log-day">
                    {cell.day}
                  </span>
                );
              })}
            </div>
          </section>
          ))}
      </div>

      <div className="log-legend">
        <span>
          <span className="bg-[var(--color-gold)]" /> {legendContent}
        </span>
        <span>
          <span className="bg-[var(--color-blue-soft)]" /> {legendSite}
        </span>
        <span>
          <span className="bg-[var(--color-copper)]" /> {legendOther}
        </span>
      </div>
    </>
  );
}
