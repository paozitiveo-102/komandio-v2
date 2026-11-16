import { Check } from 'lucide-react';
import { ORDER_STATUS, TIMELINE } from '@/lib/orderStatus';

export default function OrderTimeline({ status }) {
  if (status === 'annulee') {
    return (
      <div className="rounded-[22px] bg-stone-100 p-4 text-[14px] text-stone-600">
        Cette commande a été annulée. Si tu as une question, écris-nous, on trouve toujours une
        solution.
      </div>
    );
  }
  const current = TIMELINE.indexOf(status);

  return (
    <div className="space-y-0">
      {TIMELINE.map((key, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                  done
                    ? 'border-brand-terra bg-brand-terra text-white'
                    : 'border-brand-pink bg-white text-brand-pink'
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </div>
              {i < TIMELINE.length - 1 && (
                <div className={`h-8 w-0.5 ${done ? 'bg-brand-terra/40' : 'bg-brand-pink'}`} />
              )}
            </div>
            <p
              className={`pt-1 text-[14px] ${
                active ? 'font-bold text-brand-terra' : done ? 'text-brand-brown' : 'text-brand-brownSoft/60'
              }`}
            >
              {ORDER_STATUS[key].label}
            </p>
          </div>
        );
      })}
    </div>
  );
}