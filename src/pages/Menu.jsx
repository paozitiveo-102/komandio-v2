const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ArrowRight } from 'lucide-react';
import BunIllustration from '@/components/BunIllustration';
import QtyStepper from '@/components/QtyStepper';
import { readCart, setQty, totalPao } from '@/lib/cart';
import { formatAriary } from '@/lib/format';
import useSettings from '@/lib/useSettings';
import { Image } from '@/components/ui/image';

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const { settings } = useSettings();

  useEffect(() => {
    setCart(readCart());
    const onCart = () => setCart(readCart());
    window.addEventListener('pao-cart', onCart);
    db.entities.Product
      .filter({ available: true }, { sort: 'sort_order', limit: 30 })
      .then((res) => setProducts(res?.items || (Array.isArray(res) ? res : [])))
      .catch(() => setProducts([]));
    return () => window.removeEventListener('pao-cart', onCart);
  }, []);

  const count = totalPao(cart);
  const minPao = settings?.min_pao || 5;
  const subtotal = products.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);
  const missing = Math.max(0, minPao - count);

  const change = (id, qty) => setCart(setQty(id, qty));

  return (
    <div className="pt-4">
      <h1 className="font-heading text-[24px] font-semibold">Choisis tes saveurs</h1>
      <p className="mt-1 text-[14px] text-brand-brownSoft">
        Tous les pao sont à {formatAriary(products[0]?.price ?? 2000)} l'unité.
      </p>

      <div className="mt-4 space-y-3">
        {products.map((p) => (
          <div key={p.id} className="pao-card flex items-center gap-3 p-3.5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-pink/40">
              {p.image_url ? (
                <Image src={p.image_url} alt={p.name} className="h-20 w-20" fittingType="fill" />
              ) : (
                <BunIllustration variant={p.illustration} size={78} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[16px] font-semibold leading-tight">{p.name}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-brand-brownSoft">{p.description}</p>
              <p className="mt-1 font-heading text-[15px] font-semibold text-brand-terra">
                {formatAriary(p.price)}
              </p>
            </div>
            <QtyStepper value={cart[p.id] || 0} onChange={(q) => change(p.id, q)} />
          </div>
        ))}

        {products.length === 0 && (
          <div className="pao-card p-6 text-center text-[14px] text-brand-brownSoft">
            La carte se prépare… reviens dans un instant.
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[72px] z-30 px-5">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[26px] border border-brand-pink/70 bg-white/95 p-3.5 shadow-[0_16px_40px_-22px_rgba(74,46,37,0.6)] backdrop-blur">
            {missing > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] leading-snug text-brand-terra">
                  Il te manque <strong>{missing} pao</strong> pour être livrée. Ajoute une saveur ou
                  commande avec une copine !
                </p>
                <Link to="/menu" className="pao-btn-soft h-10 shrink-0 px-3 text-[13px]">
                  Voir
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-heading text-[15px] font-semibold">{count} pao</p>
                  <p className="text-[13px] text-brand-brownSoft">{formatAriary(subtotal)}</p>
                </div>
                <Link to="/commande" className="pao-btn h-12 px-5 text-[15px]">
                  Continuer <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}