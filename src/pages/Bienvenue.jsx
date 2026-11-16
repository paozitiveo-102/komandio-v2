const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Loader2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import useCustomer from '@/lib/useCustomer';

export default function Bienvenue() {
  const { loading, user, customer, refresh } = useCustomer();
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && customer) {
      window.location.replace('/');
    }
    if (user && !firstName) {
      setFirstName((user.full_name || '').split(' ')[0] || '');
    }
  }, [loading, user, customer]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await db.entities.Customer.create({
        user_id: user.id,
        first_name: firstName.trim(),
        phone: phone.trim(),
        email: user.email,
        status: 'actif',
        channel_origin: 'app',
        loyalty_count: 0,
        loyalty_lifetime: 0,
      });
      await refresh();
      navigate(created?.id ? '/' : '/');
    } catch (err) {
      setError("On n'a pas pu enregistrer ton profil. Vérifie ton numéro et réessaie.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <Loader2 className="h-6 w-6 animate-spin text-brand-terra" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandLogo size={78} className="mx-auto" />
          <h1 className="mt-3 font-heading text-[25px] font-semibold">Encore deux petites choses</h1>
          <p className="mt-1.5 text-[15px] text-brand-brownSoft">
            Ton prénom et ton numéro, pour que l'équipe puisse te joindre à la livraison.
          </p>
        </div>

        <form onSubmit={submit} className="pao-card space-y-4 p-6">
          {error && (
            <div className="rounded-2xl bg-brand-pink/70 p-3 text-[13px] text-brand-terra">{error}</div>
          )}
          <div>
            <label className="pao-label">Ton prénom</label>
            <input
              className="pao-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ex : Fara"
              required
            />
          </div>
          <div>
            <label className="pao-label">Ton numéro de téléphone</label>
            <input
              className="pao-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="034 12 345 67"
              inputMode="tel"
              required
            />
          </div>
          <button type="submit" className="pao-btn h-12 w-full text-[15px]" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'On prépare ton profil…' : "C'est parti !"}
          </button>
          <p className="text-center text-[12px] leading-relaxed text-brand-brownSoft">
            Tu commandais déjà par Facebook ou par téléphone ? Dis-le nous à la première livraison :
            on reliera ton historique et ta carte gourmande.
          </p>
        </form>
      </div>
    </div>
  );
}