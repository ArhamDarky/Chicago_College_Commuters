import React, { useState } from 'react';
import BusView from './views/BusView';
import TrainView from './views/TrainView'; // (create this empty for now)

function App() {
  const [mode, setMode] = useState('bus'); // Default to Bus mode

  return (
    <div style={{ padding: '1rem' }}>
    <header className="mode-buttons">
        <button onClick={() => setMode('bus')}>Bus Mode</button>
        <button onClick={() => setMode('train')}>Train Mode</button>
    </header>


      {mode === 'bus' && <BusView />}
      {mode === 'train' && <TrainView />}
    </div>
  );
}

export default App;
