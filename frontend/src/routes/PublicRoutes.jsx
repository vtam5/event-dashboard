// src/routes/PublicRoutes.jsx
import { Routes, Route } from "react-router-dom"
import PublicEvents from "../pages/PublicEvents.jsx"
import PublicForm from "../pages/PublicForm.jsx"

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="events" element={<PublicEvents />} />
      <Route path="event/:id" element={<PublicForm />} />
    </Routes>
  )
}
