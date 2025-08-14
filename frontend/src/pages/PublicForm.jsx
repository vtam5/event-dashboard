// frontend/src/pages/Public/PublicForm.jsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEvent } from "../../services/eventService";
import { listQuestions } from "../../services/questionService";
import { createResponse } from "../../services/responseService";

export default function PublicForm() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  // Load event and questions
  useEffect(() => {
    getEvent(id)
      .then(setEvent)
      .catch((err) => setError(err.message));

    listQuestions(id)
      .then(setQuestions)
      .catch((err) => setError(err.message));
  }, [id]);

  const handleChange = (qid, value) => {
    setFormData((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Ensure homeNumber and other required fields are not null
      const payload = {
        ...formData,
        homeNumber: formData.homeNumber || "",
      };
      await createResponse(id, payload);
      alert("Form submitted successfully!");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!event) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit}>
      <h1>{event.title}</h1>

      {questions.map((q) => (
        <div key={q.questionId}>
          <label>
            {q.questionText} {q.isRequired && "*"}
          </label>
          <input
            type="text"
            value={formData[q.questionId] || ""}
            onChange={(e) => handleChange(q.questionId, e.target.value)}
            required={q.isRequired}
          />
        </div>
      ))}

      <button type="submit">Submit</button>
    </form>
  );
}
