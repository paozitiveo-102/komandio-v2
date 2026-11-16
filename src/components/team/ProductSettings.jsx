const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { Check, Loader2, Plus } from 'lucide-react';
import BunIllustration from '@/components/BunIllustration';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatAriary } from '@/lib/format';

const asList = (res) => res?.items || (Array.isArray(res) ? res : []);

const ILLUSTRATIONS = [
  { value: 'classique', label: 'Classique' },
  { value: 'porc', label: 'Porc' },
  { value: 'poulet', label: 'Poulet' },
  { value: 'marin', label: 'Marin' },
  { value: 'veggie', label: 'Veggie' },
];

export default function ProductSettings() {
  const [drafts, setDrafts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    db.entities.Product
      .list('sort_order', 50)
      .then((res) => setDrafts(asList(res)))
      .catch(() => setDrafts([]));
  }, []);

  const patch = (id, field, value) =>
    setDrafts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(
      drafts.map((p) =>
        db.entities.Product.update(p.id, {
          name: p.name,
          description: p.description || '',
          price: Number(p.price) || 0,
          available: !!p.available,
          image_url: p.image_url || '',
          illustration: p.illustration,
        })
      )
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addFlavor = async () => {
    const created = await db.entities.Product.create({
      name: 'Nouvelle saveur',
      description: '',
      price: 2000,
      available: true,
      illustration: 'classique',
      sort_order: drafts.length + 1,
    });
    setDrafts((prev) => [...prev, created]);
  };

  return (
    <div className="pao-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-[15px] font-semibold">Saveurs & prix</p>
        <button onClick={addFlavor} className="inline-flex items-center gap-1 text-[12px] font-bold text-brand-terra">
          <Plus size={13} /> Ajouter
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {drafts.map((p) => (
          <div key={p.id} className="rounded-2xl border border-brand-pink/70 p-3">
            <div className="flex items-center gap-2">
              <BunIllustration variant={p.illustration} size={42} />
              <input
                className="pao-input flex-1"
                value={p.name}
                onChange={(e) => patch(p.id, 'name', e.target.value)}
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="pao-label">Prix (Ar)</label>
                <input
                  className="pao-input"
                  value={p.price}
                  onChange={(e) => patch(p.id, 'price', e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="pao-label">Illustration</label>
                <Select
                  value={p.illustration || 'classique'}
                  onValueChange={(value) => patch(p.id, 'illustration', value)}
                >
                  <SelectTrigger className="pao-input h-[50px] text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ILLUSTRATIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <input
              className="pao-input mt-2"
              placeholder="Lien d'une photo (optionnel)"
              value={p.image_url || ''}
              onChange={(e) => patch(p.id, 'image_url', e.target.value)}
            />
            <label className="mt-2 flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={p.available !== false}
                onChange={(e) => patch(p.id, 'available', e.target.checked)}
                className="h-4 w-4 accent-[#A34A35]"
              />
              Disponible · {formatAriary(p.price)}
            </label>
          </div>
        ))}
      </div>

      <button onClick={saveAll} disabled={saving} className="pao-btn mt-3 h-11 w-full text-[14px]">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check size={16} /> : null}
        {saved ? 'Saveurs enregistrées' : 'Enregistrer les saveurs'}
      </button>
    </div>
  );
}