// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import { fetchEvents } from './api';

function App() {
  const [events, setEvents] = useState([]);
  const [error, setError]   = useState(null);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!events.length) return <div>Loading…</div>;

  return (
    <div className="App">
      <h1>Upcoming Events</h1>
      <ul>
        {events.map(e => (
          <li key={e.eventId}>
            <strong>{e.name}</strong> — {e.date} {e.time}  
            ({e.participantCount} participants)
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
