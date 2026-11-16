import { useState } from 'react';
import { Check, AlertCircle, MapPin } from 'lucide-react';
import { parseGoogleMapsLink } from '@/lib/googleMaps';

export default function BaseLocationLink({ onLocated }) {
  const [link, setLink] = useState('');
  const [msg, setMsg] = useState(null);

  const apply = () => {
    const coords = parseGoogleMapsLink(link);
    if (!coords) {
      setMsg({
        type: 'err',
        text: "Ce lien ne contient pas de coordonnées. Ouvre-le dans ton navigateur, copie l'adresse complète (elle contient « @ » ou « ?q= »), ou place le point sur la carte.",
      });
      return;
    }
    onLocated(coords);
    setMsg({
      type: 'ok',
      text: `Point de départ placé : ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    });
  };

  return (
    <div>
      <label className="pao-label">Lien Google Maps du point de départ</label>
      <div className="flex gap-2">
        <input
          className="pao-input flex-1"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setMsg(null);
          }}
          placeholder="Colle ici le lien de ta position"
          inputMode="url"
        />
        <button
          type="button"
          onClick={apply}
          disabled={!link.trim()}
          className="pao-btn-soft h-[50px] shrink-0 px-4 text-[14px]"
        >
          <MapPin size={16} /> Placer
        </button>
      </div>
      {msg && (
        <p
          className={`mt-2 flex items-start gap-1.5 text-[12.5px] leading-relaxed ${
            msg.type === 'ok' ? 'text-brand-terra' : 'text-destructive'
          }`}
        >
          {msg.type === 'ok' ? (
            <Check size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
          )}
          <span>{msg.text}</span>
        </p>
      )}
    </div>
  );
}