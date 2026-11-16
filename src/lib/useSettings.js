const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { BASE_POINT } from '@/lib/geo';
import { DEFAULT_WEEKLY_AVAILABILITY } from '@/lib/availability';
import { DEFAULT_REMINDER_TEMPLATE } from '@/lib/reminders';

export const DEFAULT_SETTINGS = {
  base_label: 'Jovenna Ambonisoa, Itaosy',
  base_lat: BASE_POINT.lat,
  base_lng: BASE_POINT.lng,
  fees: [
    { max_km: 2, price: 3000 },
    { max_km: 4, price: 4000 },
    { max_km: 6, price: 5000 },
    { max_km: 10, price: 6000 },
    { max_km: 999, price: 8000 },
  ],
  zone_polygon: [
    { lat: -18.81, lng: 47.44 },
    { lat: -18.84, lng: 47.56 },
    { lat: -18.93, lng: 47.6 },
    { lat: -18.99, lng: 47.49 },
    { lat: -18.975, lng: 47.4 },
    { lat: -18.855, lng: 47.33 },
  ],
  max_distance_km: 18,
  deadline_hour: 21,
  deadline_minute: 0,
  booking_horizon_days: 60,
  slots: [
    { label: '7 h 30 – 9 h 00', start: '07:30', end: '09:00', max_pao: 15 },
    { label: '9 h 00 – 10 h 30', start: '09:00', end: '10:30', max_pao: 15 },
    { label: '10 h 30 – 12 h 00', start: '10:30', end: '12:00', max_pao: null },
    { label: '12 h 00 – 13 h 30', start: '12:00', end: '13:30', max_pao: null },
    { label: '13 h 30 – 15 h 00', start: '13:30', end: '15:00', max_pao: null },
    { label: '15 h 00 – 16 h 30', start: '15:00', end: '16:30', max_pao: null },
  ],
  weekly_availability: DEFAULT_WEEKLY_AVAILABILITY,
  closed_dates: [],
  reminder_template: DEFAULT_REMINDER_TEMPLATE,
  mvola_number: '034 45 692 52',
  min_pao: 5,
  loyalty_target: 10,
  loyalty_months: 2,
  loyalty_reward: 5,
};

export default function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [record, setRecord] = useState(null);
  const [ready, setReady] = useState(false);

  const load = async () => {
    try {
      const res = await db.entities.Setting.list('-created_date', 1);
      const list = Array.isArray(res) ? res : res?.items || [];
      if (list[0]) {
        setRecord(list[0]);
        setSettings({ ...DEFAULT_SETTINGS, ...list[0] });
      }
    } catch {
      /* on garde les valeurs par défaut */
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { settings, record, ready, reload: load, setSettings };
}