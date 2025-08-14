// src/routes/AdminRoutes.jsx
import { Routes, Route } from "react-router-dom"
import AdminDashboard from "../pages/AdminDashboard.jsx"
import EventEditor from "../pages/EventEditor.jsx"

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="events/:id" element={<EventEditor />} />
    </Routes>
  )
}
