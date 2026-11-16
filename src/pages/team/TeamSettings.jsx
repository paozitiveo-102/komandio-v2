const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { Check, Loader2 } from 'lucide-react';
import useSettings from '@/lib/useSettings';
import MapPicker from '@/components/MapPicker';
import ProductSettings from '@/components/team/ProductSettings';
import BaseLocationLink from '@/components/team/BaseLocationLink';
import WeeklyAvailability from '@/components/team/WeeklyAvailability';
import ClosedDates from '@/components/team/ClosedDates';
import { formatAriary } from '@/lib/format';
import { closedDates, weeklyAvailability } from '@/lib/availability';

export default function TeamSettings() {
  const { settings, record, ready, reload } = useSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ready) setForm(settings);
  }, [ready]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const setFee = (index, field, value) => {
    const fees = [...(form.fees || [])];
    fees[index] = { ...fees[index], [field]: Number(value) || 0 };
    set('fees', fees);
  };

  const setSlot = (index, field, value) => {
    const slots = [...(form.slots || [])];
    slots[index] = { ...slots[index], [field]: value };
    if (field === 'label') slots[index].label = value;
    set('slots', slots);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      base_label: form.base_label,
      base_lat: Number(form.base_lat),
      base_lng: Number(form.base_lng),
      fees: form.fees,
      zone_polygon: form.zone_polygon,
      max_distance_km: Number(form.max_distance_km),
      deadline_hour: Number(form.deadline_hour),
      deadline_minute: Number(form.deadline_minute || 0),
      booking_horizon_days: Number(form.booking_horizon_days),
      slots: (form.slots || []).map((s) => ({
        ...s,
        max_pao: s.max_pao === '' || s.max_pao == null ? null : Number(s.max_pao),
      })),
      mvola_number: form.mvola_number,
      min_pao: Number(form.min_pao),
      loyalty_target: Number(form.loyalty_target),
      loyalty_months: Number(form.loyalty_months),
      loyalty_reward: Number(form.loyalty_reward),
      weekly_availability: weeklyAvailability(form),
      closed_dates: closedDates(form),
      reminder_template: form.reminder_template,
    };
    if (record?.id) await db.entities.Setting.update(record.id, payload);
    else await db.entities.Setting.create(payload);
    await reload();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!ready) {
    return (
      <div className="flex justify-center pt-10">
        <Loader2 className="h-5 w-5 animate-spin text-brand-terra" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      <h1 className="font-heading text-[21px] font-semibold">Réglages</h1>

      <ProductSettings />

      <div className="pao-card p-4">
        <p className="font-heading text-[15px] font-semibold">Frais de livraison</p>
        <p className="mt-0.5 text-[12.5px] text-brand-brownSoft">
          Distance en voiture depuis {form.base_label}. « Jusqu'à » inclus.
        </p>
        <div className="mt-3 space-y-2">
          {(form.fees || []).map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-16 text-[12.5px] text-brand-brownSoft">jusqu'à</span>
              <input
                className="pao-input flex-1"
                value={f.max_km}
                onChange={(e) => setFee(i, 'max_km', e.target.value)}
                inputMode="decimal"
              />
              <span className="text-[12.5px] text-brand-brownSoft">km</span>
              <input
                className="pao-input flex-1"
                value={f.price}
                onChange={(e) => setFee(i, 'price', e.target.value)}
                inputMode="numeric"
              />
              <span className="text-[12.5px] text-brand-brownSoft">Ar</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-brand-brownSoft">
          Au-delà du dernier palier, on considère que l'adresse est hors zone.
        </p>
      </div>

      <div className="pao-card p-4">
        <p className="font-heading text-[15px] font-semibold">Zone de livraison</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-brand-brownSoft">
          Limites : Ambohidratrimo au nord, Ambohimangakely à l'est, Andoharanofotsy au sud,
          Fenoarivo (RN1) à l'ouest.
        </p>
        <div className="mt-3">
          <BaseLocationLink
            onLocated={(coords) => {
              set('base_lat', coords.lat);
              set('base_lng', coords.lng);
            }}
          />
        </div>
        <div className="mt-3">
          <MapPicker
            lat={form.base_lat}
            lng={form.base_lng}
            polygon={form.zone_polygon}
            base={{ lat: form.base_lat, lng: form.base_lng }}
            height={200}
          />
        </div>
        <div className="mt-3">
          <label className="pao-label">Distance maximale acceptée (km)</label>
          <input
            className="pao-input"
            value={form.max_distance_km}
            onChange={(e) => set('max_distance_km', e.target.value)}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="pao-card p-4">
        <p className="font-heading text-[15px] font-semibold">Délais</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="pao-label">Heure limite (0-23)</label>
            <input
              className="pao-input"
              value={form.deadline_hour}
              onChange={(e) => set('deadline_hour', e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="pao-label">Réservation (jours)</label>
            <input
              className="pao-input"
              value={form.booking_horizon_days}
              onChange={(e) => set('booking_horizon_days', e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="pao-label">Minimum de pao</label>
            <input
              className="pao-input"
              value={form.min_pao}
              onChange={(e) => set('min_pao', e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="pao-label">Numéro MVola</label>
            <input
              className="pao-input"
              value={form.mvola_number}
              onChange={(e) => set('mvola_number', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pao-card p-4">
        <p className="font-heading text-[15px] font-semibold">Créneaux</p>
        <div className="mt-3 space-y-2">
          {(form.slots || []).map((s, i) => (
            <div key={i} className="rounded-2xl border border-brand-pink/70 bg-white p-2.5">
              <div className="flex items-center gap-2">
                <input
                  className="pao-input flex-1"
                  value={s.label}
                  onChange={(e) => setSlot(i, 'label', e.target.value)}
                />
                <input
                  className="pao-input w-[86px]"
                  type="time"
                  value={s.start}
                  onChange={(e) => setSlot(i, 'start', e.target.value)}
                />
                <input
                  className="pao-input w-[86px]"
                  type="time"
                  value={s.end}
                  onChange={(e) => setSlot(i, 'end', e.target.value)}
                />
              </div>
              <label className="pao-label mt-2">
                Max. de pao par commande (vide = sans limite)
              </label>
              <input
                className="pao-input"
                placeholder="Sans limite"
                value={s.max_pao ?? ''}
                onChange={(e) => setSlot(i, 'max_pao', e.target.value)}
                inputMode="numeric"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pao-card p-4">
        <p className="font-heading text-[15px] font-semibold">Message de rappel J-2</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-brand-brownSoft">
          Sert au SMS et au message à copier. Variables : {'{prenom}'}, {'{pao}'}, {'{date}'},{' '}
          {'{heure_debut}'}, {'{heure_fin}'}.
        </p>
        <textarea
          className="pao-input mt-3 min-h-[120px]"
          value={form.reminder_template || ''}
          onChange={(e) => set('reminder_template', e.target.value)}
        />
      </div>

      <div className="pao-card p-4">
        <p className="font-heading text-[15px] font-semibold">Disponibilités</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-brand-brownSoft">
          Choisis les créneaux ouverts chaque jour. Un jour sans créneau n'apparaît pas dans le
          calendrier.
        </p>
        <WeeklyAvailability
          settings={form}
          value={form.weekly_availability}
          onChange={(value) => set('weekly_availability', value)}
        />
      </div>

      <div className="pao-card p-4">
        <p className="font-heading text-[15px] font-semibold">Dates fermées</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-brand-brownSoft">
          Ces jours-là, personne ne peut commander. Les commandes déjà prises ne sont jamais
          annulées.
        </p>
        <ClosedDates value={form.closed_dates} onChange={(value) => set('closed_dates', value)} />
      </div>

      <div className="pao-card p-4">
        <p className="font-heading text-[15px] font-semibold">Carte gourmande</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <label className="pao-label">Commandes</label>
            <input
              className="pao-input"
              value={form.loyalty_target}
              onChange={(e) => set('loyalty_target', e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="pao-label">Mois</label>
            <input
              className="pao-input"
              value={form.loyalty_months}
              onChange={(e) => set('loyalty_months', e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="pao-label">Pao offerts</label>
            <input
              className="pao-input"
              value={form.loyalty_reward}
              onChange={(e) => set('loyalty_reward', e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>
      </div>

      <p className="px-1 text-[12px] text-brand-brownSoft">
        Exemple : jusqu'à 2 km = {formatAriary(form.fees?.[0]?.price || 0)}
      </p>

      <div
        className="fixed inset-x-0 bottom-0 border-t border-brand-pink/70 bg-brand-cream/95 p-3 backdrop-blur"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <button onClick={save} disabled={saving} className="pao-btn h-12 w-full text-[15px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check size={16} /> : null}
            {saved ? 'Réglages enregistrés' : 'Enregistrer les réglages'}
          </button>
        </div>
      </div>
    </div>
  );
}