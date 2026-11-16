import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { WEEKDAY_LABELS, weeklyAvailability } from '@/lib/availability';

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function WeeklyAvailability({ settings, value, onChange }) {
  const weekly = weeklyAvailability({ weekly_availability: value });
  const [open, setOpen] = useState(null);
  const slots = settings?.slots || [];

  const toggle = (weekday, start) => {
    const next = weekly.map((day) => {
      if (day.weekday !== weekday) return day;
      const has = day.slots.includes(start);
      return {
        ...day,
        slots: has ? day.slots.filter((s) => s !== start) : [...day.slots, start],
      };
    });
    onChange(next);
  };

  return (
    <div className="mt-3 space-y-2">
      {ORDER.map((weekday) => {
        const day = weekly.find((d) => d.weekday === weekday);
        const count = day?.slots.length || 0;
        const isOpen = open === weekday;

        return (
          <div key={weekday} className="rounded-2xl border border-brand-pink/70 bg-white">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : weekday)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-[14px] font-semibold">{WEEKDAY_LABELS[weekday]}</span>
              <span className="flex items-center gap-2 text-[12.5px] text-brand-brownSoft">
                {count === 0 ? 'Fermé' : `${count} créneau${count > 1 ? 'x' : ''}`}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-brand-pink/60 px-4 py-2">
                {slots.map((s) => (
                  <div key={s.start} className="flex items-center justify-between py-1.5">
                    <span className="text-[13px]">{s.label}</span>
                    <Switch
                      checked={!!day?.slots.includes(s.start)}
                      onCheckedChange={() => toggle(weekday, s.start)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}