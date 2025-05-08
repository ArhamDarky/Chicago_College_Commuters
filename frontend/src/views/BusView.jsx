import { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom bus icon
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2283/2283984.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35]
});

// Rotating arrow icon based on heading
const getArrowIcon = (heading) => {
  return new L.DivIcon({
    className: '',
    html: `<div style="transform: rotate(${heading}deg); font-size: 20px;">⬆️</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Format prediction time to AM/PM
const formatTime = (timestamp) => {
  const [_, time] = timestamp.split(' ');
  const [hour, minute] = time.split(':');
  const h = parseInt(hour);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const formattedHour = h % 12 === 0 ? 12 : h % 12;
  return `${formattedHour}:${minute} ${suffix}`;
};

// Fit map to include user and buses
function FitBounds({ buses, userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!map || buses.length === 0 || !userLocation) return;

    const bounds = L.latLngBounds([
      ...buses.map(bus => [parseFloat(bus.lat), parseFloat(bus.lon)]),
      [parseFloat(userLocation.lat), parseFloat(userLocation.lon)]
    ]);

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [buses, userLocation, map]);

  return null;
}

function BusView() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [directions, setDirections] = useState([]);
  const [direction, setDirection] = useState('');
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [predictionAttempted, setPredictionAttempted] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [stopsLoaded, setStopsLoaded] = useState(false);

  const backend = 'http://127.0.0.1:8000';

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        setUserLocation({ lat: 41.8781, lon: -87.6298 }); // fallback
      }
    );
  }, []);

  useEffect(() => {
    axios.get(`${backend}/cta/bus/routes`)
      .then(res => {
        const data = res.data?.['bustime-response']?.routes;
        if (Array.isArray(data)) {
          setRoutes(data);
        } else {
          setRoutes([]);
        }
      })
      .catch(err => {
        console.error('Error fetching routes:', err);
        setRoutes([]);
      });
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      axios.get(`${backend}/cta/bus/directions?rt=${selectedRoute}`)
        .then(res => {
          setDirections(res.data['bustime-response'].directions || []);
          setDirection('');
          setStops([]);
          setSelectedStop('');
          setPredictions([]);
          setPredictionAttempted(false);
          setVehicles([]);
        })
        .catch(err => {
          console.error('Error fetching directions:', err);
          setDirections([]);
        });
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (selectedRoute && direction) {
      setStopsLoaded(false);

      axios.get(`${backend}/cta/bus/stops?rt=${selectedRoute}&direction=${direction}`)
        .then(res => {
          setStops(res.data['bustime-response'].stops || []);
          setStopsLoaded(true);
        })
        .catch(err => {
          setStops([]);
          setStopsLoaded(true);
        });

      axios.get(`${backend}/cta/bus/vehicles?rt=${selectedRoute}`)
        .then(res => setVehicles(res.data['bustime-response'].vehicle || []))
        .catch(err => setVehicles([]));

      setSelectedStop('');
      setPredictions([]);
      setPredictionAttempted(false);
    }
  }, [selectedRoute, direction]);

  const getPredictions = () => {
    if (selectedStop) {
      axios.get(`${backend}/cta/bus/predictions?stop_id=${selectedStop}&rt=${selectedRoute}`)
        .then(res => {
          setPredictions(res.data['bustime-response'].prd || []);
          setPredictionAttempted(true);
        })
        .catch(err => console.error('Error fetching predictions:', err));
    }
  };

  const resetApp = () => {
    setSelectedRoute('');
    setDirections([]);
    setDirection('');
    setStops([]);
    setSelectedStop('');
    setPredictions([]);
    setVehicles([]);
    setPredictionAttempted(false);
    setUserLocation(null);
    setStopsLoaded(false);
  };

  const userPosition = userLocation
    ? [parseFloat(userLocation.lat), parseFloat(userLocation.lon)]
    : [41.8781, -87.6298];

  return (
    <div style={{ padding: '2rem' }}>
      {/* Centered Mode Buttons */}
      <h1>🚌 CTA Bus Tracker Pro</h1>

      {/* Route + Reset Button in Same Row */}
      <div className="form-row">
        <div>
          <label>Choose a Route:</label>
          <select onChange={(e) => setSelectedRoute(e.target.value)} value={selectedRoute}>
            <option value="">--Select--</option>
            {routes.map((r) => (
              <option key={r.rt} value={r.rt}>{r.rt} - {r.rtn}</option>
            ))}
          </select>
        </div>
        <button onClick={resetApp} className="reset-btn">Reset</button>
      </div>

      {/* Direction Dropdown */}
      {directions.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <label>Direction:</label>
          <select onChange={(e) => setDirection(e.target.value)} value={direction}>
            <option value="">--Select Direction--</option>
            {directions.map((d, idx) => (
              <option key={idx} value={d.dir}>{d.dir}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stop + Get Predictions */}
      {direction && (
        <div style={{ marginTop: '1rem' }}>
          {stops.length > 0 ? (
            <>
              <label>Choose a Stop:</label>
              <select onChange={(e) => setSelectedStop(e.target.value)} value={selectedStop}>
                <option value="">--Select--</option>
                {stops.map((s) => (
                  <option key={s.stpid} value={s.stpid}>{s.stpnm}</option>
                ))}
              </select>
              <button onClick={getPredictions} className="get-predictions">
                    Get Predictions
              </button>

            </>
          ) : (
            stopsLoaded && (
              <div style={{ color: 'gray' }}>
                ⚠️ No stop data available for this route and direction.
              </div>
            )
          )}
        </div>
      )}

      {/* Predictions */}
      {predictions.length > 0 ? (
        <div style={{ marginTop: '2rem' }}>
          <h3>🕒 Upcoming Buses</h3>
          <ul>
            {predictions.map((p, i) => (
              <li key={i}>
                Route {p.rt} to {p.rtdir} – Arriving at {formatTime(p.prdtm)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        predictionAttempted && selectedStop && (
          <div style={{ marginTop: '2rem', color: 'gray' }}>
            ❌ No active buses at this stop right now.
          </div>
        )
      )}

      {/* Map View */}
      {vehicles.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🗺️ Live Bus Map</h3>
          <div className="map-container">
            <MapContainer
              center={userPosition}
              zoom={14}
              scrollWheelZoom={true}
              style={{ height: '450px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {vehicles.map((bus, idx) => (
                <Marker
                  key={idx}
                  position={[parseFloat(bus.lat), parseFloat(bus.lon)]}
                  icon={getArrowIcon(bus.hdg)}
                >
                  <Popup>
                    🚌 Bus {bus.vid}<br />
                    To: {bus.des}
                  </Popup>
                </Marker>
              ))}
              {userLocation && (
                <Marker position={userPosition} icon={busIcon}>
                  <Popup>📍 Your Location</Popup>
                </Marker>
              )}
              <FitBounds buses={vehicles} userLocation={userLocation} />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusView;
