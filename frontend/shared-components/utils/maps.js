import theme from "../theme";

export const mapOptions = {
  mapTypeControl: false,
  fullscreenControl: false,
  streetViewControl: false,
};

export const mapOverlayStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }]
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#cccccc' }]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#dadada' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }]
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: theme.palette.background.default }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: theme.palette.background.default }]
  }
];

export const MAP_VIEW = {
  IP_SCORE: 'score',
  NEGATIVE_IP_SCORE: 'negativeScore',
  IP_MAGNITUDE: 'magnitude',
  NEGATIVE_IP_MAGNITUDE: 'negativeMagnitude',
  IP_LIKELIHOOD: 'likelihood',
  NEGATIVE_IP_LIKELIHOOD: 'negativeLikelihood',
  IMPACTS: 'impacts',
  INDICATORS: 'indicators',
  VENTURES: 'ventures',
};

export const calculateCenter = (markers) => {
  const sum = markers.reduce((acc, marker) => {
    return {
      lat: acc.lat + marker.lat,
      lng: acc.lng + marker.lng,
    };
  }, { lat: 0, lng: 0 });

  return {
    lat: sum.lat / markers.length || 0,
    lng: sum.lng / markers.length || 0,
  };
};

export const zoomAndCenterMap = (mapRef, maxZoom, positions, setCenter) => {
  if (mapRef && positions.length > 0) {
    const newCenter = calculateCenter(positions);
    setCenter(newCenter);

    setTimeout(() => {
      const bounds = new window.google.maps.LatLngBounds();
      positions.forEach(position => {
        bounds.extend(new window.google.maps.LatLng(position.lat, position.lng));
      });
      mapRef.fitBounds(bounds, { top: 0, right: 0, bottom: 40, left: 0 });
      if (mapRef.getZoom() > maxZoom) {
        mapRef.setZoom(maxZoom);
      }
    }, 100);
  }
}
