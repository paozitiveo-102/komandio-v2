const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { lazy, Suspense, useRef, useState } from 'react';

import { Loader2, MapPin, Search } from 'lucide-react';
import { formatAriary } from '@/lib/format';
import { quoteDelivery, reverseGeocode, searchAddress } from '@/lib/geo';

const MapPicker = lazy(() => import('@/components/MapPicker'));

export default function AddressForm({
  settings,
  userId,
  customerId,
  initial,
  onSaved,
  onCancel,
  showGeolocation = true,
}) {
  const [label, setLabel] = useState(initial?.label || 'Maison');
  const [details, setDetails] = useState(initial?.details || '');
  const [pos, setPos] = useState(initial?.lat ? { lat: initial.lat, lng: initial.lng } : null);
  const [quote, setQuote] = useState(
    initial?.lat ? { km: initial.distance_km, fee: initial.fee, deliverable: true } : null
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [approx, setApprox] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const autoText = useRef('');
  const seq = useRef(0);

  const fillAddress = async (lat, lng) => {
    const mine = ++seq.current;
    const text = await reverseGeocode(lat, lng);
    if (!text || mine !== seq.current) return;
    setDetails((current) => {
      if (current.trim() && current !== autoText.current) return current;
      autoText.current = text;
      return text;
    });
  };

  const evaluate = async (lat, lng, opts = {}) => {
    setPos({ lat, lng });
    setZoom(opts.zoom || null);
    setApprox(!!opts.approx);
    setBusy(true);
    fillAddress(lat, lng);
    try {
      const q = await quoteDelivery({ lat, lng, settings });
      setQuote(q);
    } finally {
      setBusy(false);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    setGeoError(false);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        evaluate(p.coords.latitude, p.coords.longitude, {
          zoom: 17,
          approx: p.coords.accuracy > 100,
        });
      },
      () => {
        setLocating(false);
        setGeoError(true);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const runSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    try {
      const found = await searchAddress(query);
      setResults(found);
    } finally {
      setBusy(false);
    }
  };

  const choose = (r) => {
    setDetails(r.label.split(',').slice(0, 3).join(', '));
    setResults([]);
    evaluate(r.lat, r.lng);
  };

  const save = async () => {
    if (!pos || !details.trim()) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      customer_id: customerId || '',
      label: label || 'Adresse',
      details,
      lat: pos.lat,
      lng: pos.lng,
      distance_km: quote?.km || 0,
      fee: quote?.fee || 0,
    };
    const saved = initial?.id
      ? await db.entities.Address.update(initial.id, payload)
      : await db.entities.Address.create({ ...payload, is_default: false });
    setSaving(false);
    onSaved?.(saved || { ...initial, ...payload });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {['Maison', 'Travail', 'Chez maman'].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLabel(l)}
            className={`rounded-2xl px-2 py-2.5 text-[13px] font-semibold transition ${
              label === l
                ? 'bg-brand-terra text-white'
                : 'border border-brand-pink bg-white text-brand-brown'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <form onSubmit={runSearch} className="flex gap-2">
        <input
          className="pao-input flex-1"
          placeholder="Cherche ton quartier (ex : Andravoahangy)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="pao-btn h-12 w-12 shrink-0 px-0" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={18} />}
        </button>
      </form>

      {results.length > 0 && (
        <div className="pao-card divide-y divide-brand-pink/60 overflow-hidden p-0">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => choose(r)}
              className="flex w-full items-start gap-2 px-4 py-3 text-left text-[13px] hover:bg-brand-cream"
            >
              <MapPin size={15} className="mt-0.5 shrink-0 text-brand-terra" />
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      )}

      {showGeolocation && (
        <div>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="pao-btn-soft h-12 w-full text-[14px]"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin size={16} />}
            {locating ? 'On te cherche sur la carte…' : 'Utiliser ma position'}
          </button>
          <p className="mt-1.5 text-center text-[11.5px] text-brand-brownSoft">
            On utilise ta position seulement pour trouver ton adresse.
          </p>
        </div>
      )}

      <Suspense
        fallback={
          <div className="h-[220px] rounded-[22px] border border-brand-pink bg-brand-pinkSoft/60" />
        }
      >
        <MapPicker
          lat={pos?.lat}
          lng={pos?.lng}
          onPick={evaluate}
          zoom={zoom}
          polygon={settings?.zone_polygon}
          base={{ lat: settings?.base_lat, lng: settings?.base_lng }}
        />
      </Suspense>
      <p className="text-center text-[12px] text-brand-brownSoft">
        Touche la carte pour placer le point exact de ta maison.
      </p>

      {approx && (
        <p className="text-center text-[12px] text-brand-brownSoft">
          Position approximative : déplace le point sur la carte si besoin.
        </p>
      )}

      {geoError && (
        <p className="rounded-2xl bg-brand-blueSoft/50 px-4 py-3 text-center text-[12.5px] text-brand-brown">
          Pas de souci ! Touche la carte pour placer ton point, ou cherche ton quartier.
        </p>
      )}

      <div>
        <label className="pao-label">Ton adresse et un repère</label>
        <input
          className="pao-input"
          placeholder="Ex : lot II M 45 bis, en face de la pharmacie"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <p className="mt-1.5 text-[12px] text-brand-brownSoft">
          Vérifie l'adresse et ajoute un repère (couleur du portail, pharmacie en face…)
        </p>
      </div>

      {quote && (
        <div
          className={`rounded-2xl px-4 py-3 text-[13px] ${
            quote.deliverable === false
              ? 'bg-brand-pink/70 text-brand-terra'
              : 'bg-brand-blueSoft/50 text-brand-brown'
          }`}
        >
          {quote.deliverable === false
            ? "Oups, on ne livre pas encore jusque-là. Tu peux commander pour une adresse plus proche !"
            : `À ${quote.km} km d'Itaosy · livraison ${formatAriary(quote.fee)}`}
        </div>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="pao-btn-soft h-12 flex-1 text-[15px]">
            Annuler
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!pos || !details.trim() || saving || quote?.deliverable === false}
          className="pao-btn h-12 flex-1 text-[15px]"
        >
          {saving ? 'On enregistre…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}