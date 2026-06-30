import React, { useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ActivityIndicator,
  SafeAreaView, Platform,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface Props {
  visible: boolean;
  initial?: LatLng;
  onConfirm: (coords: LatLng) => void;
  onClose: () => void;
}

function buildHtml(initial?: LatLng): string {
  const lat = initial?.latitude ?? 9.082;
  const lng = initial?.longitude ?? 8.6753;
  const zoom = initial ? 15 : 6;
  const hasPin = !!initial;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #map { width: 100%; height: 100%; }
  #hint {
    position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
    z-index: 1000; background: rgba(22,163,74,0.92); color: #fff;
    font-size: 13px; padding: 6px 14px; border-radius: 20px;
    font-family: -apple-system, sans-serif; white-space: nowrap;
    pointer-events: none;
  }
  #coords {
    position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
    z-index: 1000; background: rgba(255,255,255,0.95); color: #374151;
    font-size: 11px; padding: 4px 12px; border-radius: 20px;
    font-family: monospace; display: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  #locateBtn {
    position: absolute; bottom: 120px; right: 12px; z-index: 1000;
    background: #fff; border: none; border-radius: 50%; width: 42px; height: 42px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
  }
  #confirmBtn {
    position: absolute; bottom: 16px; left: 16px; right: 16px; z-index: 1000;
    background: #16a34a; color: #fff; border: none; border-radius: 12px;
    padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer;
    font-family: -apple-system, sans-serif;
    box-shadow: 0 4px 12px rgba(22,163,74,0.4);
    opacity: 0.45; pointer-events: none;
  }
  #confirmBtn.active { opacity: 1; pointer-events: auto; }
</style>
</head>
<body>
<div id="map"></div>
<div id="hint">Tap to drop a pin</div>
<div id="coords"></div>
<button id="locateBtn" onclick="locateMe()">📍</button>
<button id="confirmBtn" id="confirmBtn" onclick="confirm()">Confirm Location</button>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], ${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  var marker = null;
  var pinIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  function placeMarker(lat, lng) {
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
    marker.on('dragend', function(e) {
      var p = e.target.getLatLng();
      updateCoords(p.lat, p.lng);
    });
    updateCoords(lat, lng);
  }

  function updateCoords(lat, lng) {
    var coordEl = document.getElementById('coords');
    coordEl.style.display = 'block';
    coordEl.textContent = lat.toFixed(6) + ', ' + lng.toFixed(6);
    var btn = document.getElementById('confirmBtn');
    btn.classList.add('active');
    document.getElementById('hint').style.display = 'none';
  }

  map.on('click', function(e) { placeMarker(e.latlng.lat, e.latlng.lng); });

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function(pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      map.setView([lat, lng], 16);
      placeMarker(lat, lng);
    });
  }

  function confirm() {
    if (!marker) return;
    var p = marker.getLatLng();
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'confirm', latitude: p.lat, longitude: p.lng
    }));
  }

  ${hasPin ? `placeMarker(${lat}, ${lng});` : ''}
</script>
</body>
</html>`;
}

export default function MapPinPicker({ visible, initial, onConfirm, onClose }: Props) {
  const [ready, setReady] = useState(false);

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'confirm') {
        onConfirm({ latitude: msg.latitude, longitude: msg.longitude });
      }
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={() => setReady(true)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
        }}>
          <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontWeight: '700', fontSize: 16, color: '#111827' }}>
            Pin Property Location
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="map-outline" size={14} color="#16a34a" />
            <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '500' }}>OpenStreetMap</Text>
          </View>
        </View>

        {ready ? (
          <WebView
            source={{ html: buildHtml(initial) }}
            style={{ flex: 1 }}
            onMessage={handleMessage}
            javaScriptEnabled
            geolocationEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0 }}>
                <ActivityIndicator size="large" color="#16a34a" />
              </View>
            )}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
