// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EventEditor from "./pages/EventEditor.jsx";
import PublicEvents from "./pages/PublicEvents.jsx";

// Public pages (new)
import EventDetails from "./pages/Public/EventDetails.jsx";
import EventForm from "./pages/Public/EventForm.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public */}
        <Route index element={<PublicEvents />} />
        <Route path="events" element={<PublicEvents />} />
        <Route path="event/:eventId" element={<EventDetails />} />
        <Route path="event/:eventId/register" element={<EventForm />} />

        {/* Admin (unchanged) */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/events/:id/edit" element={<EventEditor />} />

        {/* Old links → same editor, correct tab */}
        <Route
          path="admin/events/:id/questions"
          element={<Navigate to="../:id/edit?tab=questions" replace />}
        />
        <Route
          path="admin/events/:id/responses"
          element={<Navigate to="../:id/edit?tab=responses" replace />}
        />
      </Route>
    </Routes>
  );
}
