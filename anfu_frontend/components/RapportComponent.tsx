'use client';

import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  useMap,
} from 'react-leaflet';

import {
  Box,
  Paper,
  IconButton,
  Button,
} from '@mui/material';

import {
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  Layers,
  ZoomOutMap,
} from '@mui/icons-material';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { Foncier } from '@/types';



/* =================================================
   Types
================================================= */

type Props = {
  fonciers: Foncier[];
};



/* =================================================
   Load + Merge ALL geojson files
================================================= */

async function loadAllGeojsons(fonciers: Foncier[]) {
  const features: any[] = [];

  await Promise.all(
    fonciers.map(async (f) => {
      if (!f.geojson_file || typeof f.geojson_file !== 'string') return;

      try {
        const res = await fetch(f.geojson_file);
        const geo = await res.json();

        /* attach foncier info into properties */
        geo.features.forEach((feat: any) => {
          feat.properties = {
            ...feat.properties,
            id: f.id,
            code: f.code,
            commune: f.commune,
            description: f.description,
          };
        });

        features.push(...geo.features);
      } catch (e) {
        console.error('GeoJSON load error:', f.code);
      }
    })
  );

  return {
    type: 'FeatureCollection',
    features,
  };
}



/* =================================================
   Map instance setter
================================================= */

const MapSetter = ({
  setMap,
}: {
  setMap: (map: L.Map) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    setMap(map);
  }, []);

  return null;
};



/* =================================================
   Single merged layer (FAST)
================================================= */

const MergedLayer = ({
  geojson,
  onSelect,
}: {
  geojson: any;
  onSelect: (props: any) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!geojson) return;

    const layer = L.geoJSON(geojson, {
      onEachFeature: (feature, l) => {
        const p = feature.properties;

        l.bindPopup(`
          <b>${p.code}</b><br/>
          ${p.commune}
        `);

        l.on('click', () => onSelect(p));
      },
    });

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [geojson]);

  return null;
};



/* =================================================
   Controls
================================================= */

const Controls = ({
  map,
  toggle,
  satellite,
}: {
  map: L.Map | null;
  toggle: () => void;
  satellite: boolean;
}) => {
  const pan = (x: number, y: number) => map?.panBy([x, y]);

  return (
    <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
      <Paper sx={{ p: 1 }}>
        <IconButton onClick={() => pan(0, -100)}>
          <ArrowUpward />
        </IconButton>
        <IconButton onClick={() => pan(0, 100)}>
          <ArrowDownward />
        </IconButton>
        <IconButton onClick={() => pan(-100, 0)}>
          <ArrowBack />
        </IconButton>
        <IconButton onClick={() => pan(100, 0)}>
          <ArrowForward />
        </IconButton>
      </Paper>

      <Button startIcon={<Layers />} onClick={toggle}>
        {satellite ? 'Road' : 'Satellite'}
      </Button>

      <Button startIcon={<ZoomOutMap />} onClick={() => map?.zoomOut()}>
        Dézoomer
      </Button>
    </Box>
  );
};



/* =================================================
   MAIN COMPONENT (ALL FONCIERS)
================================================= */

export default function RapportComponent({ fonciers }: Props) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [mergedGeojson, setMergedGeojson] = useState<any>(null);
  const [satellite, setSatellite] = useState(false);
  const [selected, setSelected] = useState<any>(null);



  /* =========================================
     AUTO LOAD ALL GEOJSONS
  ========================================= */

  useEffect(() => {
    loadAllGeojsons(fonciers).then(setMergedGeojson);
  }, [fonciers]);



  return (
    <Box>
      <Box sx={{ height: 700, position: 'relative' }}>
        <MapContainer center={[28, 3]} zoom={6} style={{ height: '100%' }}>
          <TileLayer
            url={
              satellite
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />

          <MapSetter setMap={setMap} />

          {mergedGeojson && (
            <MergedLayer
              geojson={mergedGeojson}
              onSelect={setSelected}
            />
          )}
        </MapContainer>

        <Controls
          map={map}
          satellite={satellite}
          toggle={() => setSatellite(!satellite)}
        />
      </Box>



      {/* Selected info */}
      {selected && (
        <Box mt={2} p={2} border="1px solid #ddd">
          <b>{selected.code}</b> — {selected.commune}
        </Box>
      )}
    </Box>
  );
}
