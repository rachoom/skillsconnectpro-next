import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 📍 Fix for default Leaflet icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: (icon as any).src || icon,
    shadowUrl: (iconShadow as any).src || iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// 🗺️ THE EAST RAND COORDINATE LOOKUP
// Since we don't have real GPS data for every user yet, we estimate the center of their town.
const LOCATION_COORDS: Record<string, [number, number]> = {
  'brakpan': [-26.2352, 28.3700],
  'springs': [-26.2547, 28.4428],
  'tsakane': [-26.3579, 28.3855],
  'kwa thema': [-26.2946, 28.4116],
  'kwathema': [-26.2946, 28.4116],
  'benoni': [-26.1929, 28.3108],
  'duduza': [-26.3986, 28.4061],
  'daveyton': [-26.1437, 28.4239],
  'etwatwa': [-26.1264, 28.4554],
  'geluksdal': [-26.3314, 28.3970]
};

interface MapViewProps {
  artisans: any[];
}

export const MapView: React.FC<MapViewProps> = ({ artisans }) => {
  // Filter out artisans with unknown locations
  const validArtisans = artisans.filter(a => {
    const loc = a.location?.toLowerCase().trim();
    return LOCATION_COORDS[loc];
  });

  return (
    <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-brand-yellow/30 shadow-2xl relative z-0 animate-fade-in">
      <MapContainer 
        center={[-26.2946, 28.4116]} // Default center (KwaThema/Springs area)
        zoom={11} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* Dark Mode Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {validArtisans.map((artisan) => {
           const coords = LOCATION_COORDS[artisan.location.toLowerCase().trim()];
           
           return (
             <Marker key={artisan.id} position={coords}>
               <Popup className="custom-popup">
                 <div className="text-center">
                   <h3 className="font-bold text-black">{artisan.name}</h3>
                   <p className="text-xs text-gray-600 uppercase">{artisan.category}</p>
                   <p className="text-xs font-bold text-green-600 mt-1">Verified Pro</p>
                 </div>
               </Popup>
             </Marker>
           );
        })}
      </MapContainer>
      
      {/* Overlay Badge */}
      <div className="absolute top-4 right-4 z-[400] bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
        <span className="text-brand-yellow font-bold text-xs uppercase tracking-widest">
           Live Coverage: East Rand
        </span>
      </div>
    </div>
  );
};