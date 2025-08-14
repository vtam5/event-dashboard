// src/App.jsx
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EventEditor from "./pages/EventEditor.jsx";
import PublicEvents from "./pages/PublicEvents.jsx";
import React from 'react';

// Public pages
import EventDetails from "./pages/Public/EventDetails.jsx";
import EventForm from "./pages/Public/EventForm.jsx";

// Helper component to redirect old admin links to the editor with a tab
function RedirectToEditorTab({ tab }) {
  const { id } = useParams();
  return <Navigate to={`/admin/events/${id}/edit?tab=${tab}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public list */}
        <Route index element={<PublicEvents />} />
        <Route path="events" element={<PublicEvents />} />

        {/* Public detail + register (singular + plural aliases) */}
        <Route path="event/:eventId" element={<EventDetails />} />
        <Route path="event/:eventId/register" element={<EventForm />} />

        {/* Aliases using plural (useful if links or bookmarks use /events/...) */}
        <Route path="events/:eventId" element={<EventDetails />} />
        <Route path="events/:eventId/register" element={<EventForm />} />

        {/* NEW: public edit route(s) for token-based editing */}
        {/* This matches the edit link from savedResponse.link() -> /events/:eventId/edit?rid=...&token=... */}
        <Route path="events/:eventId/edit" element={<EventForm />} />
        {/* If anything in your UI used the singular form, keep this too */}
        <Route path="event/:eventId/edit" element={<EventForm />} />

        {/* Admin */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/events/:id/edit" element={<EventEditor />} />

        {/* Old admin links → redirect to editor tab (with real :id) */}
        <Route
          path="admin/events/:id/questions"
          element={<RedirectToEditorTab tab="questions" />}
        />
        <Route
          path="admin/events/:id/responses"
          element={<RedirectToEditorTab tab="responses" />}
        />
      </Route>
    </Routes>
  );
}
