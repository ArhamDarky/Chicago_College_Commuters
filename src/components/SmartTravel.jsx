import React, { useState } from 'react';

const SmartTravel = () => {
    const [destination, setDestination] = useState('');
    const [startTime, setStartTime] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Integrate geo location, Google Maps APIs,
        // CTA routes logic, and Metra GTFS data.
        console.log('Destination:', destination, 'Start Time:', startTime);
    };

    return (
        <div>
            <h1>Smart Travel</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Destination:</label>
                    <input 
                        type="text" 
                        value={destination}
                        onChange={e => setDestination(e.target.value)} 
                    />
                </div>
                <div>
                    <label>Start Time:</label>
                    <input 
                        type="time" 
                        value={startTime} 
                        onChange={e => setStartTime(e.target.value)} 
                    />
                </div>
                <button type="submit">Search Routes</button>
            </form>
        </div>
    );
};

export default SmartTravel;