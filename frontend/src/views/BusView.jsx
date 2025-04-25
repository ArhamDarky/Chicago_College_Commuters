import { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Bus icon
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2283/2283984.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35]
});

// Dynamic arrow icon
const getArrowIcon = (heading) => {
  return new L.DivIcon({
    className: '',
    html: `<div style="transform: rotate(${heading}deg); font-size: 20px;">⬆️</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

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
  const [manualLocation, setManualLocation] = useState({ lat: '', lon: '' });

  const backend = 'http://127.0.0.1:8000';

  useEffect(() => {
    axios.get(`${backend}/cta/bus/routes`)
      .then(res => {
        const data = res.data?.['bustime-response']?.routes;
        if (Array.isArray(data)) {
          setRoutes(data);
        } else {
          console.warn('Unexpected format:', res.data);
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
      axios.get(`${backend}/cta/bus/stops?rt=${selectedRoute}&direction=${direction}`)
        .then(res => setStops(res.data['bustime-response'].stops || []))
        .catch(err => setStops([]));

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
    setManualLocation({ lat: '', lon: '' });
  };

  const userPosition = manualLocation.lat && manualLocation.lon
    ? [parseFloat(manualLocation.lat), parseFloat(manualLocation.lon)]
    : [41.8781, -87.6298]; // fallback to downtown Chicago

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>🚌 CTA Bus Tracker Pro</h1>

      <div>
        <label>Choose a Route:</label>
        <select onChange={(e) => setSelectedRoute(e.target.value)} value={selectedRoute}>
          <option value="">--Select--</option>
          {routes.map((r) => (
            <option key={r.rt} value={r.rt}>{r.rt} - {r.rtn}</option>
          ))}
        </select>
        <button onClick={resetApp} style={{ marginLeft: '1rem' }}>Reset</button>
      </div>

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
              <button onClick={getPredictions} style={{ marginLeft: '1rem' }}>Get Predictions</button>
            </>
          ) : (
            <div style={{ color: 'gray' }}>
              ⚠️ No stop data available for this route and direction.
            </div>
          )}
        </div>
      )}

      {/* Manual location input */}
      <div style={{ marginTop: '2rem' }}>
        <h4>📍 Enter Your Location</h4>
        <input
          type="text"
          placeholder="Latitude"
          value={manualLocation.lat}
          onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="text"
          placeholder="Longitude"
          value={manualLocation.lon}
          onChange={(e) => setManualLocation({ ...manualLocation, lon: e.target.value })}
        />
      </div>

      {/* Predictions */}
      {predictions.length > 0 ? (
        <div style={{ marginTop: '2rem' }}>
          <h3>🕒 Upcoming Buses</h3>
          <ul>
            {predictions.map((p, i) => (
              <li key={i}>
                Route {p.rt} to {p.rtdir} – Arriving at {p.prdtm.split(' ')[1]}
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

      {/* Map */}
      {vehicles.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>🗺️ Live Bus Map</h3>
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
            {manualLocation.lat && manualLocation.lon && (
              <Marker position={userPosition} icon={busIcon}>
                <Popup>📍 Your Location</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      )}
    </div>
  );
}

export default BusView;
