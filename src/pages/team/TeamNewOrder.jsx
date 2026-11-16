const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Loader2, Search, UserPlus } from 'lucide-react';
import QtyStepper from '@/components/QtyStepper';
import AddressForm from '@/components/AddressForm';
import useSettings from '@/lib/useSettings';
import { formatAriary, formatDay, formatRef, isBeforeDeadline } from '@/lib/format';
import { firstOpenDate, isClosed, maxPaoFor, selectableRange, slotHint, slotsForDate } from '@/lib/availability';
import DeliveryCalendar from '@/components/DeliveryCalendar';

const asList = (res) => res?.items || (Array.isArray(res) ? res : []);

export default function TeamNewOrder() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [phone, setPhone] = useState('');
  const [found, setFound] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [channel, setChannel] = useState('appel');
  const [cart, setCart] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [method, setMethod] = useState('cash');
  const [mvolaRef, setMvolaRef] = useState('');
  const [exception, setException] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [slotOverride, setSlotOverride] = useState(null);
  const [feeOverride, setFeeOverride] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.entities.Customer.list('-created_date', 300).then((res) => setCustomers(asList(res))).catch(() => {});
    db.entities.Product
      .list('sort_order', 30)
      .then((res) => setProducts(asList(res)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!settings?.slots || date) return;
    const first = firstOpenDate(settings);
    setDate(first);
    if (!slot) setSlot(slotsForDate(settings, first)[0] || null);
  }, [settings]);

  const pickDate = (iso) => {
    setDate(iso);
    setSlotOverride(null);
    setSlot((current) => {
      if (!current) return null;
      const available = exception ? settings.slots || [] : slotsForDate(settings, iso);
      return available.some((s) => s.label === current.label) ? current : null;
    });
  };

  const selectSlot = (s) => {
    const max = maxPaoFor(s);
    if (max !== null && paoCount > max) {
      const ok = window.confirm(
        `Cette commande dépasse la limite de ce créneau (${max} pao). Confirmer quand même ?`
      );
      if (!ok) return;
      setSlotOverride({ label: s.label, pao: paoCount });
    } else {
      setSlotOverride(null);
    }
    setSlot(s);
  };

  const search = () => {
    const q = phone.replace(/\s/g, '');
    const match = customers.find((c) => (c.phone || '').replace(/\s/g, '').includes(q) && q.length > 3);
    setFound(match || null);
    if (match) {
      setFirstName(match.first_name);
      db.entities.Address
        .filter({ customer_id: match.id }, { limit: 20 })
        .then((res) => {
          const list = asList(res);
          setAddresses(list);
          setAddress(list[0] || null);
        })
        .catch(() => setAddresses([]));
    }
  };

  const paoCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const items = products.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] }));
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const baseFee = feeOverride !== '' ? Number(feeOverride) : address?.fee || 0;
  const total = subtotal + baseFee;

  const minPao = settings.min_pao || 5;
  const { first: firstDate } = selectableRange(settings);
  const dateIsClosed = date ? isClosed(settings, date) : false;
  const dateTooEarly = date ? date < firstDate : false;
  const daySlots = slotsForDate(settings, date);
  const slotOptions = exception ? settings.slots || [] : daySlots;
  const slotInvalid = !!slot && !slotOptions.some((s) => s.label === slot.label);
  const availabilityWarning = !date
    ? ''
    : [
        dateIsClosed ? `Le ${formatDay(date)} est un jour fermé.` : '',
        dateTooEarly ? "C'est avant la première date possible (délai de 21 h)." : '',
        !dateIsClosed && daySlots.length === 0
          ? `Aucun créneau n'est ouvert le ${formatDay(date)}.`
          : '',
        slotInvalid ? "Ce créneau n'est pas ouvert ce jour-là." : '',
      ]
        .filter(Boolean)
        .join(' ');

  const submit = async () => {
    setError('');
    if (!phone.trim() || !firstName.trim()) {
      setError("Il manque le prénom et le numéro de la cliente.");
      return;
    }
    if (!items.length) {
      setError('Ajoute au moins une saveur.');
      return;
    }
    if (!address) {
      setError("Choisis l'adresse de livraison.");
      return;
    }
    if (!date || !slot) {
      setError('Choisis un jour et un créneau.');
      return;
    }
    const slotMax = maxPaoFor(slot);
    const slotBlocked = slotMax !== null && paoCount > slotMax;
    if (slotBlocked && !exception) {
      const already = slotOverride?.label === slot.label && slotOverride?.pao === paoCount;
      if (!already) {
        const ok = window.confirm(
          `Cette commande dépasse la limite de ce créneau (${slotMax} pao). Confirmer quand même ?`
        );
        if (!ok) return;
        setSlotOverride({ label: slot.label, pao: paoCount });
      }
    }
    if (!exception && (dateIsClosed || dateTooEarly || !daySlots.length || slotInvalid)) {
      setError(
        "Ce jour ou ce créneau n'est pas disponible. Coche l'exception pour forcer, ou choisis une autre date."
      );
      return;
    }
    if (paoCount < minPao && !exception) {
      setError(`Il faut au moins ${minPao} pao. Coche l'exception pour passer outre.`);
      return;
    }
    const exceptionNotes = [
      paoCount < minPao ? 'moins de pao que le minimum' : '',
      isBeforeDeadline(settings.deadline_hour, settings.deadline_minute) ? '' : 'délai de 21 h passé',
      dateIsClosed ? 'jour fermé' : '',
      dateTooEarly ? 'date plus proche que le délai' : '',
      !dateIsClosed && !daySlots.length ? 'jour sans créneau ouvert' : '',
      slotInvalid ? 'créneau non ouvert ce jour-là' : '',
      slotBlocked ? `dépassement de la limite du créneau (${slotMax} pao)` : '',
    ].filter(Boolean);

    if (exception) {
      const ok = window.confirm(
        `Exception : ${exceptionNotes.join(' · ') || 'commande hors règles'}. Tu confirmes cette commande exceptionnelle ?`
      );
      if (!ok) return;
    }
    setSaving(true);
    try {
      let customer = found;
      if (!customer) {
        customer = await db.entities.Customer.create({
          first_name: firstName.trim(),
          phone: phone.trim(),
          status: 'actif',
          channel_origin: channel,
          user_id: '',
          loyalty_count: 0,
          loyalty_lifetime: 0,
        });
      }
      const order = await db.entities.Order.create({
        reference: formatRef(),
        customer_id: customer.id,
        customer_user_id: customer.user_id || '',
        customer_name: customer.first_name,
        customer_phone: customer.phone,
        channel,
        items: items.map((i) => ({ product_id: i.id, name: i.name, qty: i.qty, unit_price: i.price })),
        pao_count: paoCount,
        subtotal,
        delivery_fee: baseFee,
        total,
        address_label: address.label,
        address_details: address.details,
        lat: address.lat,
        lng: address.lng,
        distance_km: address.distance_km,
        delivery_date: date,
        slot_label: slot?.label,
        payment_method: method,
        payment_status: method === 'cash' ? 'a_la_livraison' : 'a_verifier',
        mvola_ref: mvolaRef,
        status: 'recue',
        team_seen: true,
        fee_override: feeOverride !== '' || exception,
        exception_reason:
          exception || slotBlocked
            ? exceptionReason.trim() ||
              exceptionNotes.join(' · ') ||
              'Exception accordée par l’équipe'
            : '',
      });
      navigate(`/equipe/commandes/${order.id}`);
    } catch (err) {
      setError("La commande n'a pas pu être enregistrée. Réessaie dans un instant.");
      setSaving(false);
    }
  };

  return (
    <div className="pb-10">
      <h1 className="font-heading text-[21px] font-semibold">Nouvelle commande</h1>
      <p className="mt-0.5 text-[13px] text-brand-brownSoft">Pour les commandes reçues par Facebook ou par téléphone.</p>

      <div className="pao-card mt-3 p-4">
        <label className="pao-label">Numéro de téléphone</label>
        <div className="flex gap-2">
          <input
            className="pao-input flex-1"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="034 12 345 67"
            inputMode="tel"
          />
          <button onClick={search} className="pao-btn h-12 px-4 text-[13px]">
            <Search size={16} />
          </button>
        </div>
        {found ? (
          <p className="mt-2 text-[13px] text-brand-leaf">
            Cliente retrouvée : <strong>{found.first_name}</strong>
          </p>
        ) : (
          <div className="mt-2">
            <p className="flex items-center gap-1.5 text-[12.5px] text-brand-brownSoft">
              <UserPlus size={13} /> Pas encore de profil ? Crée-le ici :
            </p>
            <input
              className="pao-input mt-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom de la cliente"
            />
          </div>
        )}
      </div>

      <div className="pao-card mt-3 p-4">
        <label className="pao-label">Canal de la commande</label>
        <div className="flex gap-2">
          {[
            { k: 'appel', l: 'Appel' },
            { k: 'facebook', l: 'Facebook' },
            { k: 'app', l: 'App' },
          ].map((c) => (
            <button
              key={c.k}
              onClick={() => setChannel(c.k)}
              className={`flex-1 rounded-2xl py-2.5 text-[13px] font-semibold ${
                channel === c.k ? 'bg-brand-terra text-white' : 'border border-brand-pink bg-white'
              }`}
            >
              {c.l}
            </button>
          ))}
        </div>
      </div>

      <div className="pao-card mt-3 p-4">
        <label className="pao-label">Saveurs</label>
        <div className="space-y-2.5">
          {products.filter((p) => p.available).map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-semibold">{p.name}</p>
                <p className="text-[12px] text-brand-brownSoft">{formatAriary(p.price)}</p>
              </div>
              <QtyStepper
                value={cart[p.id] || 0}
                onChange={(q) => setCart({ ...cart, [p.id]: q })}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] font-bold text-brand-terra">{paoCount} pao · {formatAriary(subtotal)}</p>
      </div>

      <div className="pao-card mt-3 p-4">
        <div className="flex items-center justify-between">
          <label className="pao-label mb-0">Adresse de livraison</label>
          <button onClick={() => setShowAddressForm(true)} className="text-[12px] font-bold text-brand-terra">
            + Nouvelle
          </button>
        </div>
        {showAddressForm ? (
          <div className="mt-3">
            <AddressForm
              settings={settings}
              userId={found?.user_id || ''}
              customerId={found?.id || ''}
              showGeolocation={false}
              onSaved={(a) => {
                setAddresses((prev) => [...prev, a]);
                setAddress(a);
                setShowAddressForm(false);
              }}
              onCancel={() => setShowAddressForm(false)}
            />
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {addresses.map((a) => (
              <button
                key={a.id}
                onClick={() => setAddress(a)}
                className={`w-full rounded-2xl border p-3 text-left text-[13px] ${
                  address?.id === a.id ? 'border-brand-terra bg-white' : 'border-brand-pink/70'
                }`}
              >
                <span className="font-semibold">{a.label}</span> · {a.fee ? formatAriary(a.fee) : '—'}
                <span className="block text-[12px] text-brand-brownSoft">{a.details}</span>
              </button>
            ))}
            {addresses.length === 0 && (
              <p className="text-[12.5px] text-brand-brownSoft">
                Aucune adresse enregistrée pour cette cliente. Ajoute-la avec « + Nouvelle ».
              </p>
            )}
          </div>
        )}
      </div>

      <div className="pao-card mt-3 p-4">
        <label className="pao-label">Jour et créneau</label>
        <DeliveryCalendar
          settings={settings}
          value={date}
          onChange={pickDate}
          allowAny={exception}
        />
        <p className="mt-2 text-center text-[12px] text-brand-brownSoft">
          Les dates grisées ne sont pas disponibles.
        </p>

        {date && availabilityWarning && (
          <div className="mt-2 rounded-2xl bg-brand-pink/70 px-3 py-2.5 text-[12.5px] leading-relaxed text-brand-terra">
            {availabilityWarning}{' '}
            {exception
              ? 'Commande en exception : vérifie bien avant d’enregistrer.'
              : "Coche l'exception pour forcer cette date."}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {slotOptions.map((s) => {
            const max = maxPaoFor(s);
            const over = max !== null && paoCount > max;
            return (
              <button
                key={s.label}
                onClick={() => selectSlot(s)}
                className={`rounded-2xl px-2 py-2.5 text-[12.5px] font-semibold ${
                  slot?.label === s.label
                    ? 'bg-brand-terra text-white'
                    : over
                      ? 'border border-brand-honey bg-brand-honey/15'
                      : 'border border-brand-pink bg-white'
                }`}
              >
                {s.label}
                {over && (
                  <span className="mt-0.5 block text-[10px] font-normal opacity-80">
                    max {max} pao
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {!slotOptions.length && (
          <p className="mt-2 text-[12.5px] text-brand-brownSoft">
            Aucun créneau ouvert ce jour-là. Coche l'exception si tu veux quand même livrer.
          </p>
        )}
        {date && !exception && daySlots.length > 0 && (
          <p className="mt-2 text-[12px] text-brand-brownSoft">{slotHint(settings, date)}</p>
        )}
      </div>

      <div className="pao-card mt-3 p-4">
        <label className="pao-label">Paiement</label>
        <div className="flex gap-2">
          {[
            { k: 'cash', l: 'Cash' },
            { k: 'mvola', l: 'MVola' },
          ].map((m) => (
            <button
              key={m.k}
              onClick={() => setMethod(m.k)}
              className={`flex-1 rounded-2xl py-2.5 text-[13px] font-semibold ${
                method === m.k ? 'bg-brand-terra text-white' : 'border border-brand-pink bg-white'
              }`}
            >
              {m.l}
            </button>
          ))}
        </div>
        {method === 'mvola' && (
          <input
            className="pao-input mt-2"
            placeholder="Référence MVola"
            value={mvolaRef}
            onChange={(e) => setMvolaRef(e.target.value)}
          />
        )}
        <label className="pao-label mt-3">Frais de livraison (si différent)</label>
        <input
          className="pao-input"
          placeholder={address?.fee ? String(address.fee) : '3 000'}
          value={feeOverride}
          onChange={(e) => setFeeOverride(e.target.value)}
          inputMode="numeric"
        />
      </div>

      <div className="mt-3 rounded-2xl bg-white p-4">
        <label className="flex items-start gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={exception}
            onChange={(e) => setException(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#A34A35]"
          />
          <span>
            <strong>Exception</strong> : autoriser aujourd'hui, un jour fermé, un créneau non
            ouvert, moins de {minPao} pao ou une adresse hors zone. À confirmer au moment
            d'enregistrer.
          </span>
        </label>
        {exception && (
          <input
            className="pao-input mt-2"
            placeholder="Raison de l'exception (facultatif)"
            value={exceptionReason}
            onChange={(e) => setExceptionReason(e.target.value)}
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-brand-pink/60 p-4">
        <span className="font-heading text-[15px] font-semibold">Total</span>
        <span className="font-heading text-[19px] font-semibold text-brand-terra">{formatAriary(total)}</span>
      </div>

      {error && <div className="mt-3 rounded-2xl bg-brand-pink/70 p-3 text-[13px] text-brand-terra">{error}</div>}

      <button onClick={submit} disabled={saving} className="pao-btn mt-4 h-14 w-full text-[16px]">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saving ? 'On enregistre…' : 'Enregistrer la commande'}
      </button>
    </div>
  );
}