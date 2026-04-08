import React, { useState } from "react";
import axios from "axios";

export default function RegisterStep1({ onSuccess }) {
  const [form, setForm] = useState({ name:"", email:"", password:"", dob:"", username:"" });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth/register-step1", form);
      onSuccess(res.data); // backend returns userId
    } catch (err) {
      alert(err.response.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required onChange={handleChange}/>
      <input name="email" type="email" placeholder="Email" required onChange={handleChange}/>
      <input name="password" type="password" placeholder="Password" required onChange={handleChange}/>
      <input name="dob" type="date" required onChange={handleChange}/>
      <input name="username" placeholder="Username" required onChange={handleChange}/>
      <button type="submit">Next</button>
    </form>
  );
}
