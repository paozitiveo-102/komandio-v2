const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { Gift as GiftIcon } from 'lucide-react';
import { formatDay } from '@/lib/format';

const asList = (res) => res?.items || (Array.isArray(res) ? res : []);

export default function TeamGifts() {
  const [gifts, setGifts] = useState([]);
  const [edits, setEdits] = useState({});

  const load = () => {
    db.entities.Gift
      .list('-earned_date', 100)
      .then((res) => setGifts(asList(res)))
      .catch(() => setGifts([]));
  };

  useEffect(() => {
    load();
    db.entities.Gift.updateMany({ team_seen: false }, { $set: { team_seen: true } }).catch(() => {});
  }, []);

  const patch = (id, field, value) => {
    setEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const save = async (g) => {
    const values = edits[g.id] || {};
    await db.entities.Gift.update(g.id, {
      flavors: values.flavors ?? g.flavors ?? '',
      delivery_date: values.delivery_date ?? g.delivery_date ?? '',
      status: values.status ?? g.status,
    });
    load();
  };

  return (
    <div>
      <h1 className="font-heading text-[21px] font-semibold">Cadeaux à livrer</h1>
      <p className="mt-0.5 text-[13px] text-brand-brownSoft">
        5 pao offerts après 10 commandes livrées et payées. Choix des saveurs et du jour par l'équipe.
      </p>

      <div className="mt-3 space-y-3">
        {gifts.map((g) => (
          <div key={g.id} className="pao-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-[15px] font-semibold">{g.customer_name}</p>
                <p className="text-[12.5px] text-brand-brownSoft">{g.customer_phone}</p>
                <p className="mt-0.5 text-[12px] text-brand-brownSoft">
                  Gagné le {g.earned_date ? formatDay(g.earned_date) : '—'}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${
                  g.status === 'livre'
                    ? 'bg-brand-leaf/25 text-brand-leafDeep'
                    : 'bg-brand-honey/25 text-brand-honeyDeep'
                }`}
              >
                {g.status === 'livre' ? 'Livré' : 'En préparation'}
              </span>
            </div>

            {g.address_details && (
              <p className="mt-2 text-[12.5px] text-brand-brownSoft">{g.address_details}</p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="pao-label">Saveurs</label>
                <input
                  className="pao-input"
                  placeholder="Ex : 3 classique, 2 veggie"
                  defaultValue={g.flavors || ''}
                  onChange={(e) => patch(g.id, 'flavors', e.target.value)}
                />
              </div>
              <div>
                <label className="pao-label">Jour</label>
                <input
                  type="date"
                  className="pao-input"
                  defaultValue={g.delivery_date || ''}
                  onChange={(e) => patch(g.id, 'delivery_date', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={() => save(g)} className="pao-btn h-10 px-4 text-[13px]">
                Enregistrer
              </button>
              {g.status !== 'livre' && (
                <button
                  onClick={async () => {
                    await db.entities.Gift.update(g.id, { status: 'livre' });
                    load();
                  }}
                  className="pao-btn-soft h-10 px-4 text-[13px]"
                >
                  <GiftIcon size={14} /> Marquer livré
                </button>
              )}
            </div>
          </div>
        ))}

        {gifts.length === 0 && (
          <div className="rounded-2xl bg-white p-5 text-center text-[13px] text-brand-brownSoft">
            Aucun cadeau pour le moment. Les cartes gourmandes se remplissent !
          </div>
        )}
      </div>
    </div>
  );
}