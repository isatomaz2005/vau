// Bairros de São Paulo com pontos de alagamento recorrentes.
// Coordenadas aproximadas do centro do bairro (dados de demonstração).

export const bairros = [
  { slug: 'jardim-pantanal', nome: 'Jardim Pantanal', zona: 'Zona Leste', lat: -23.4958, lng: -46.4235 },
  { slug: 'jardim-romano', nome: 'Jardim Romano', zona: 'Zona Leste', lat: -23.4925, lng: -46.3935 },
  { slug: 'itaim-paulista', nome: 'Itaim Paulista', zona: 'Zona Leste', lat: -23.5013, lng: -46.3995 },
  { slug: 'vila-prudente', nome: 'Vila Prudente', zona: 'Zona Leste', lat: -23.5835, lng: -46.5803 },
  { slug: 'lapa-de-baixo', nome: 'Lapa de Baixo', zona: 'Zona Oeste', lat: -23.5172, lng: -46.7058 },
  { slug: 'jardim-ibirapuera', nome: 'Jardim Ibirapuera', zona: 'Zona Sul', lat: -23.6620, lng: -46.7600 },
];

export function bairroPorSlug(slug) {
  return bairros.find((b) => b.slug === slug);
}

// Distância em metros entre dois pontos (fórmula de haversine).
export function distancia(a, b) {
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bairroMaisProximo(ponto) {
  let melhor = null;
  for (const b of bairros) {
    const d = distancia(ponto, b);
    if (!melhor || d < melhor.d) melhor = { b, d };
  }
  // Fora de 5 km de qualquer bairro atendido: não chuta.
  return melhor && melhor.d < 5000 ? melhor.b : null;
}

export function formatarDistancia(m) {
  if (m == null) return null;
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

export function tempoRelativo(iso, agora = Date.now()) {
  const min = Math.round((agora - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

// "1 morador confirma" / "3 moradores confirmam"
export function confirmam(n) {
  return n === 1 ? '1 morador confirma' : `${n} moradores confirmam`;
}

export function dizemQueBaixou(n) {
  return n === 1 ? '1 diz que baixou' : `${n} dizem que baixou`;
}
