"use client";

import { MapContainer, TileLayer, GeoJSON, Marker, useMap, LayersControl } from "react-leaflet";
import L, { LatLngExpression, GeoJSON as LeafletGeoJSON, GeoJSONOptions, Layer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const { BaseLayer } = LayersControl;

/* ===================== FIT GEOJSON ===================== */
interface FitGeoJSONProps {
  geojson: GeoJSON.FeatureCollection | null;
}

function FitGeoJSON({ geojson }: FitGeoJSONProps) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    const layer = L.geoJSON(geojson as any);
    if (layer.getBounds().isValid()) {
      map.fitBounds(layer.getBounds());
    }
  }, [geojson, map]);
  return null;
}

/* ===================== LEFT MAP ===================== */
interface LeftMapProps {
  geojson: GeoJSON.FeatureCollection | null;
  center?: [number, number];
}

export default function LeftMap({ geojson, center }: LeftMapProps) {
  /* ===================== TOOLTIP ===================== */
  const createTooltipContent = (properties: Record<string, any> | undefined) => {
    if (!properties) return "";
    let html = `<div class="tooltip-scrollable">`;
    for (const key in properties) {
      if (properties.hasOwnProperty(key)) {
        html += `<div class="tooltip-row"><span class="tooltip-key">${key}</span>: <span class="tooltip-value">${properties[key]}</span></div>`;
      }
    }
    html += `</div>`;
    return html;
  };

  /* ===================== MAP ===================== */
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MapContainer
        center={center || [36.75, 3.06]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Streets">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
            />
          </BaseLayer>
        </LayersControl>

        {geojson && (
          <>
           <GeoJSON
  data={geojson as any}
  style={(feature) => {
    if (!feature?.properties) return {}; // ✅ handle undefined
    const viabilite = feature.properties.VIABILITE ?? 0;
    return {
      color: viabilite > 50 ? "green" : "red",
      fillColor: viabilite > 50 ? "lightgreen" : "pink",
      fillOpacity: 0.3,
      weight: 2,
    };
  }}
  onEachFeature={(feature, layer) => {
    if (!feature?.properties) return; // ✅ handle undefined
    layer.bindTooltip(createTooltipContent(feature.properties), {
      direction: "auto",
      permanent: false,
      sticky: true,
      className: "custom-tooltip",
    });
  }}
/>

            <FitGeoJSON geojson={geojson} />
          </>
        )}

        {center && (
          <Marker
            position={center as LatLngExpression}
            icon={L.icon({
              iconUrl: "/marker-icon.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [0, -30],
            })}
          />
        )}
      </MapContainer>

      <style jsx>{`
        .custom-tooltip {
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          font-size: 12px;
          padding: 6px;
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          max-width: 250px;
        }
        .tooltip-scrollable {
          max-height: 150px;
          overflow-y: auto;
        }
        .tooltip-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .tooltip-key {
          font-weight: bold;
        }
        .tooltip-value {
          margin-left: 5px;
        }
      `}</style>
    </div>
  );
}
