import { Banknote, Smartphone } from 'lucide-react';
import { formatAriary } from '@/lib/format';

export default function CheckoutPayment({ method, onMethod, mvolaRef, onRef, settings, total }) {
  return (
    <div>
      <h2 className="mb-3 font-heading text-[19px] font-semibold">Comment tu paies ?</h2>

      <button
        onClick={() => onMethod('cash')}
        className={`flex w-full items-center gap-3 rounded-[22px] border p-4 text-left transition ${
          method === 'cash' ? 'border-brand-terra bg-white' : 'border-brand-pink/70 bg-white/70'
        }`}
      >
        <Banknote size={22} className="text-brand-terra" />
        <div>
          <p className="font-heading text-[15px] font-semibold">Cash à la livraison</p>
          <p className="text-[12.5px] text-brand-brownSoft">Tu paies quand on te remet tes pao.</p>
        </div>
      </button>

      <button
        onClick={() => onMethod('mvola')}
        className={`mt-2.5 flex w-full items-center gap-3 rounded-[22px] border p-4 text-left transition ${
          method === 'mvola' ? 'border-brand-terra bg-white' : 'border-brand-pink/70 bg-white/70'
        }`}
      >
        <Smartphone size={22} className="text-brand-terra" />
        <div>
          <p className="font-heading text-[15px] font-semibold">MVola</p>
          <p className="text-[12.5px] text-brand-brownSoft">Envoie le montant avant la livraison.</p>
        </div>
      </button>

      {method === 'mvola' && (
        <div className="mt-3 rounded-[22px] bg-brand-pink/50 p-4">
          <p className="text-[13px] text-brand-brown">
            Envoie <strong>{formatAriary(total)}</strong> au{" "}
            <strong>{settings?.mvola_number || '034 45 692 52'}</strong> (Pao-zitiveo).
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-brand-brownSoft">
            Envoie le montant, note la référence, et on s'occupe du reste.
          </p>
          <label className="pao-label mt-3">Ta référence de transaction</label>
          <input
            className="pao-input"
            placeholder="Ex : 1234567890"
            value={mvolaRef}
            onChange={(e) => onRef(e.target.value)}
            inputMode="numeric"
          />
        </div>
      )}
    </div>
  );
}