import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { niveis } from '../../../shared/tokens';

// Marcador com símbolo + cor (não depende só da cor). Ponto novo ganha um anel que pulsa.
function icone(relato, selecionado) {
  const n = niveis[relato.nivel];
  const classes = ['marcador', relato.status === 'novo' ? 'marcador-novo' : '', selecionado ? 'marcador-sel' : '']
    .filter(Boolean)
    .join(' ');
  return L.divIcon({
    className: '',
    html: `<span class="${classes}" style="--cor:${n.cor}"><span>${n.simbolo}</span></span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function Enquadrar({ pontos, centro }) {
  const map = useMap();
  useEffect(() => {
    if (pontos.length > 1) map.fitBounds(pontos.map((p) => [p.lat, p.lng]), { padding: [40, 40], maxZoom: 16 });
    else if (pontos.length === 1) map.setView([pontos[0].lat, pontos[0].lng], 16);
    else if (centro) map.setView([centro.lat, centro.lng], 15);
  }, [pontos.length, centro?.lat]);
  return null;
}

export function Mapa({ relatos, selecionado, onSelecionar, centro, rotulo }) {
  const inicio = centro || { lat: -23.55, lng: -46.6 };
  return (
    <div className="mapa" role="region" aria-label={rotulo || 'Mapa dos pontos alagados. A mesma informação está na lista.'}>
      <MapContainer center={[inicio.lat, inicio.lng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Enquadrar pontos={relatos} centro={centro} />
        {relatos.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={icone(r, r.id === selecionado)}
            title={`${niveis[r.nivel].rotulo}: ${r.referencia || 'sem referência'}`}
            alt={`${niveis[r.nivel].rotulo}: ${r.referencia || 'sem referência'}`}
            keyboard
            eventHandlers={onSelecionar ? { click: () => onSelecionar(r.id) } : undefined}
          >
            <Tooltip>
              <strong>{niveis[r.nivel].rotulo}</strong> - {r.referencia || 'sem referência'}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
