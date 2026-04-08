import React, { useState } from "react";
import axios from "axios";

export default function RegisterStep2({ userId, onComplete }) {
  const [form, setForm] = useState({ pan:"", aadhaar:"", cibil:"" });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(`/api/auth/register-step2/${userId}`, form);
      alert("Registration completed successfully!");
      onComplete(); // move to login page
    } catch (err) {
      alert(err.response.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="pan" placeholder="PAN" required onChange={handleChange}/>
      <input name="aadhaar" placeholder="Aadhaar" required onChange={handleChange}/>
      <input name="cibil" type="number" placeholder="CIBIL Score" required onChange={handleChange}/>
      <button type="submit">Finish</button>
    </form>
  );
}
