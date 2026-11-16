const LAT = '(-?\\d{1,3}(?:\\.\\d+)?)';
const LNG = '(-?\\d{1,3}(?:\\.\\d+)?)';

function valid(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/**
 * Extrait les coordonnées d'un lien Google Maps (ou d'une paire « lat, lng »).
 * Retourne { lat, lng } ou null si le lien n'en contient pas.
 */
export function parseGoogleMapsLink(input) {
  if (!input) return null;
  let text = String(input).trim();
  if (!text) return null;
  try {
    text = decodeURIComponent(text);
  } catch {
    /* on garde le texte brut */
  }

  const patterns = [
    // ...!3d-18.9413!4d47.4645 (données de lieu)
    new RegExp(`!3d${LAT}!4d${LNG}`),
    // .../@-18.9413,47.4645,17z
    new RegExp(`@${LAT},${LNG}`),
    // ?q= / ll= / sll= / daddr= / center= / query= / destination=
    new RegExp(`[?&](?:q|ll|sll|daddr|center|query|destination)=${LAT},\\s*${LNG}`, 'i'),
    // /place/-18.9413,47.4645 ou /search/-18.9413,+47.4645
    new RegExp(`/(?:place|search|dir)/${LAT},\\s*\\+?${LNG}`, 'i'),
    // paire simple « -18.9413, 47.4645 »
    new RegExp(`${LAT}\\s*,\\s*\\+?${LNG}`),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (valid(lat, lng)) return { lat, lng };
    }
  }
  return null;
}