const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ChevronRight, LogOut, Plus, Star, Trash2 } from 'lucide-react';
import useCustomer from '@/lib/useCustomer';
import useSettings from '@/lib/useSettings';
import AddressForm from '@/components/AddressForm';
import DeleteAccountCard from '@/components/account/DeleteAccountCard';
import { formatAriary } from '@/lib/format';
import { computeProgress } from '@/lib/loyalty';

export default function Compte() {
  const { loading, user, customer, isTeam, refresh } = useCustomer();
  const { settings } = useSettings();
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const loadAddresses = () => {
    if (!customer?.id) return;
    db.entities.Address
      .filter({ customer_id: customer.id }, { limit: 20 })
      .then((res) => setAddresses(res?.items || (Array.isArray(res) ? res : [])))
      .catch(() => setAddresses([]));
  };

  const removeAddress = async (address) => {
    if (!window.confirm(`Effacer « ${address.label} » de tes adresses ?`)) return;
    setDeletingId(address.id);
    try {
      await db.entities.Address.delete(address.id);
      setAddresses((prev) => prev.filter((item) => item.id !== address.id));
    } catch {
      window.alert("On n'a pas pu effacer cette adresse. Réessaie dans un instant.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadAddresses();
    if (!customer?.id) return;
    db.entities.Order
      .filter({ customer_id: customer.id }, { limit: 200 })
      .then((res) => setOrders(res?.items || (Array.isArray(res) ? res : [])))
      .catch(() => setOrders([]));
  }, [customer?.id]);

  if (loading) return null;

  if (!customer) {
    return (
      <div className="pao-card mt-8 p-6 text-center">
        <h2 className="font-heading text-[19px] font-semibold">Ton espace t'attend</h2>
        <p className="mt-1 text-[14px] text-brand-brownSoft">
          Connecte-toi pour retrouver ta carte gourmande et tes adresses.
        </p>
        <Link to="/login" className="pao-btn mt-4 h-12 w-full text-[15px]">
          Se connecter
        </Link>
      </div>
    );
  }

  const progress = computeProgress(orders, customer, settings);

  return (
    <div className="pt-4">
      <h1 className="font-heading text-[24px] font-semibold">Salut {customer.first_name} !</h1>
      <p className="mt-0.5 text-[14px] text-brand-brownSoft">{customer.phone}</p>

      <div className="mt-4 rounded-[26px] bg-brand-pink/70 p-5">
        <div className="flex items-center justify-between">
          <p className="font-heading text-[15px] font-semibold">Ta carte gourmande</p>
          <span className="text-[13px] font-bold text-brand-terra">
            {progress.count} / {progress.target}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: progress.target }).map((_, i) => (
            <span
              key={i}
              className={`h-7 w-7 rounded-full border-2 ${
                i < progress.count ? 'border-brand-terra bg-brand-terra' : 'border-brand-pink bg-white'
              }`}
            />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-brand-brown/80">
          <Star size={14} className="text-brand-terra" />
          {progress.reward} pao offerts à la clé
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="font-heading text-[17px] font-semibold">Mes adresses</h2>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-terra"
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {showForm || editing ? (
        <div className="mt-3">
          <AddressForm
            settings={settings}
            userId={user.id}
            customerId={customer.id}
            initial={editing}
            onSaved={() => {
              setShowForm(false);
              setEditing(null);
              loadAddresses();
            }}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          {addresses.map((a) => (
            <div key={a.id} className="pao-card flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-heading text-[15px] font-semibold">{a.label}</p>
                <p className="text-[12.5px] text-brand-brownSoft">{a.details}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-brand-terra">
                  {a.fee ? formatAriary(a.fee) : '—'} · {a.distance_km || 0} km
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => setEditing(a)} className="text-[13px] font-bold text-brand-terra">
                  Modifier
                </button>
                <button
                  onClick={() => removeAddress(a)}
                  disabled={deletingId === a.id}
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-brownSoft disabled:opacity-50"
                >
                  <Trash2 size={13} /> Effacer
                </button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && (
            <p className="text-[13px] text-brand-brownSoft">
              Ajoute ton adresse pour que la livraison soit encore plus rapide.
            </p>
          )}
        </div>
      )}

      {isTeam && (
        <Link
          to="/equipe"
          className="pao-card mt-5 flex items-center justify-between p-4"
        >
          <span className="font-heading text-[15px] font-semibold">Espace équipe</span>
          <ChevronRight size={18} className="text-brand-brownSoft" />
        </Link>
      )}

      <button
        onClick={() => db.auth.logout('/login')}
        className="pao-btn-soft mt-5 h-12 w-full text-[15px]"
      >
        <LogOut size={16} /> Se déconnecter
      </button>

      <DeleteAccountCard user={user} customer={customer} />
    </div>
  );
}