"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import API from "../services/api";

export default function MakerDashboard() {

const [title, setTitle] = useState("");
const [categories, setCategories] = useState([]);
const [subcategories, setSubcategories] = useState([]);

const [selectedCategory, setSelectedCategory] = useState("");
const [selectedSubcategory, setSelectedSubcategory] = useState("");

/* =====================
Load Categories
===================== */

useEffect(() => {
fetchCategories();
}, []);

const fetchCategories = async () => {
try {


  const token = localStorage.getItem("token");

  const res = await API.get("categories/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setCategories(res.data);

} catch (error) {
  console.error("Error loading categories", error);
}


};

/* =====================
Load Subcategories
===================== */

const fetchSubcategories = async (categoryId) => {
try {


  const res = await API.get(
    `categories/load-subcategories/?category=${categoryId}`
  );

  setSubcategories(res.data);

} catch (error) {
  console.error("Error loading subcategories", error);
}


};

/* =====================
Create Ticket
===================== */

const createTicket = async () => {
try {


  const token = localStorage.getItem("token");

  await API.post(
    "tickets/create/",
    {
      title,
      category: selectedCategory,
      subcategory: selectedSubcategory
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  alert("Ticket Created Successfully");

  setTitle("");
  setSelectedCategory("");
  setSelectedSubcategory("");

} catch (error) {
  console.error("Error creating ticket", error);
}


};

return ( <div className="flex min-h-screen">


  <Sidebar />

  <div className="flex-1 p-10 bg-gray-100">

    <h1 className="text-3xl font-bold mb-6">
      Create Ticket
    </h1>

    <div className="bg-white p-6 rounded shadow w-1/2">

      <div className="mb-4">
        <label className="block mb-2">
          Title
        </label>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">
          Category
        </label>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            fetchSubcategories(e.target.value);
          }}
          className="w-full border p-2 rounded"
        >

          <option value="">
            Select Category
          </option>

          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}

        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2">
          Sub Category
        </label>

        <select
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
          className="w-full border p-2 rounded"
        >

          <option value="">
            Select Subcategory
          </option>

          {subcategories.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}

        </select>

      </div>

      <button
        onClick={createTicket}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Create Ticket
      </button>

    </div>

  </div>

</div>


);
}
