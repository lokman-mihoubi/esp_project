'use client';

import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvent,
} from 'react-leaflet';
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
  Button,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  ThreeDRotation,
  CropSquare,
  Layers,
  ZoomOutMap,
} from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

// ====================
// Types
// ====================
type Foncier = {
  id: number;
  location: string;
  geojson_data?: any;
};

type FoncierLayerProps = {
  geojson: any;
  onSelectFeature: (f: Foncier) => void;
};
// Add this helper component inside your file (above RapportComponent)
const MapInstanceSetter: React.FC<{ setMapInstance: (map: L.Map) => void }> = ({ setMapInstance }) => {
  const map = useMap();

  React.useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);

  return null;
};

type RapportComponentProps = {
  fonciers: Foncier[];
};

// ====================
// Helpers
// ====================
const generateTableFromProperties = (properties: Record<string, any>) => {
  return `
    <div style="max-height:150px; overflow-y:auto; font-size:12px;">
      <table style="border-collapse:collapse; width:100%;">
        ${Object.entries(properties)
          .map(
            ([key, value]) =>
              `<tr>
                 <td style="padding:4px; font-weight:bold;">${key}</td>
                 <td style="padding:4px;">${value}</td>
               </tr>`
          )
          .join('')}
      </table>
    </div>
  `;
};

// ====================
// SVG icons for each type
// ====================
const svgIcons: Record<string, string> = {
  logement: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#1976d2"><path d="M12 3l9 8h-3v9h-12v-9h-3l9-8z"/></svg>`,
  promotion: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#d32f2f"><path d="M12 17.27l5.18 3.73-1.64-6.03L20 9.24l-6.19-.53L12 3 10.19 8.71 4 9.24l4.46 5.73-1.64 6.03L12 17.27z"/></svg>`,
  investissement: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#388e3c"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3 9.24 3 10.91 3.81 12 5.08 13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  equipement: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#fbc02d"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
};

// ====================
// Create Leaflet icons
// ====================

const icons: Record<string, L.Icon | L.DivIcon> = Object.fromEntries(
  Object.entries(svgIcons).map(([key, svg]) => [
    key,
    L.divIcon({
      html: svg,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    }),
  ])
);


// ====================
// FoncierLayer Component
// ====================
const FoncierLayer: React.FC<FoncierLayerProps> = ({ geojson, onSelectFeature }) => {
  const map = useMap();

  React.useEffect(() => {
    const onEachFeature = (feature: any, layer: L.Layer) => {
      if (!feature.properties) return;

      const tableHtml = generateTableFromProperties(feature.properties);
      const type = feature.properties.type || 'logement';

      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates;
        const marker = L.marker([lat, lng], { icon: icons[type] });

        marker.bindPopup(tableHtml, { maxHeight: 700, maxWidth: 700 });
        
        marker.on('click', () =>
          onSelectFeature({
            id: feature.id || 0,
            location: feature.properties.location || 'N/A',
            geojson_data: feature,
          })
        );

        marker.addTo(map);
      } else if (layer instanceof L.Path) {
        layer.bindPopup(tableHtml, { maxHeight: 700, maxWidth: 700 });
        layer.on('click', () =>
          onSelectFeature({
            id: feature.id || 0,
            location: feature.properties.location || 'N/A',
            geojson_data: feature,
          })
        );
      }
    };

    if (geojson) {
      L.geoJSON(geojson, { onEachFeature }).addTo(map);
    }
  }, [geojson, map, onSelectFeature]);

  return null;
};

// ====================
// Double Click Zoom Handler
// ====================
const DoubleClickZoomHandler: React.FC = () => {
  const map = useMapEvent('dblclick', (e) => {
    map.flyTo(e.latlng, map.getZoom() + 2, { duration: 1.5 });
  });
  return null;
};

// ====================
// Map Controls
// ====================
const MapControls: React.FC<{
  onToggleView: () => void;
  isSatellite: boolean;
  onZoomOut: () => void;
}> = ({ onToggleView, isSatellite, onZoomOut }) => {
  const map = useMap();
  const [is3D, setIs3D] = useState(false);

  const pan = (x: number, y: number) => {
    map.panBy([x, y], { duration: 0.3 });
  };

  const toggle3D = () => {
    setIs3D(!is3D);
    const container = map.getContainer();
    container.style.transition = 'transform 0.5s';
    container.style.transform = is3D ? 'none' : 'perspective(800px) rotateX(25deg)';
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Paper elevation={4} sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, borderRadius: 3 }}>
        <Tooltip title="North">
          <IconButton onClick={() => pan(0, -100)} color="primary"><ArrowUpward /></IconButton>
        </Tooltip>
        <Box display="flex" flexDirection="row" gap={1}>
          <Tooltip title="West">
            <IconButton onClick={() => pan(-100, 0)} color="primary"><ArrowBack /></IconButton>
          </Tooltip>
          <Tooltip title="East">
            <IconButton onClick={() => pan(100, 0)} color="primary"><ArrowForward /></IconButton>
          </Tooltip>
        </Box>
        <Tooltip title="South">
          <IconButton onClick={() => pan(0, 100)} color="primary"><ArrowDownward /></IconButton>
        </Tooltip>
        <Tooltip title={is3D ? '2D View' : '3D Tilt'}>
          <IconButton onClick={toggle3D} color="secondary">{is3D ? <CropSquare /> : <ThreeDRotation />}</IconButton>
        </Tooltip>
      </Paper>

      <Button variant="contained" startIcon={<Layers />} onClick={onToggleView} color={isSatellite ? 'secondary' : 'primary'} sx={{ borderRadius: 2 }}>
        {isSatellite ? 'Roadmap View' : 'Satellite View'}
      </Button>

      <Button variant="outlined" startIcon={<ZoomOutMap />} onClick={onZoomOut} sx={{ borderRadius: 2 }}>
        Dézoomer
      </Button>
    </Box>
  );
};

// ====================
// Chart Component
// ====================
const FoncierChart: React.FC<{ foncier: Foncier }> = ({ foncier }) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const properties = foncier.geojson_data?.properties || {};
  const chartData = Object.entries(properties)
    .filter(([_, val]) => typeof val === 'number')
    .map(([key, val]) => ({ name: key, value: val as number }));

  if (!chartData.length) return null;

  return chartType === 'bar' ? (
    <BarChart width={500} height={300} data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <RechartsTooltip />
      <Legend />
      <Bar dataKey="value" fill="#1976d2" />
    </BarChart>
  ) : (
    <LineChart width={500} height={300} data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <RechartsTooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke="#1976d2" />
    </LineChart>
  );
};

// ====================
// Main Component
// ====================
const RapportComponent: React.FC<RapportComponentProps> = ({ fonciers }) => {
  const [loading] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [selectedFoncier, setSelectedFoncier] = useState<Foncier | null>(null);

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };

  return (
    <Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: '1px solid #ddd'}}>
          <MapContainer
  center={[28.0, 3.0]}
  zoom={6}
  style={{ height: '700px', width: '100%' }}
  doubleClickZoom={false}
>
  <TileLayer
    url={
      isSatellite
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  />
  <DoubleClickZoomHandler />
  <MapControls
    onToggleView={() => setIsSatellite((prev) => !prev)}
    isSatellite={isSatellite}
    onZoomOut={handleZoomOut}
  />
  <MapInstanceSetter setMapInstance={setMapInstance} />
  {fonciers.map(
    (f) =>
      f.geojson_data && (
        <FoncierLayer
          key={f.id}
          geojson={f.geojson_data}
          onSelectFeature={setSelectedFoncier}
        />
      )
  )}
</MapContainer>

          </Box>

          {selectedFoncier && <FoncierChart foncier={selectedFoncier} />}
        </>
      )}
    </Box>
  );
};

export default RapportComponent;
