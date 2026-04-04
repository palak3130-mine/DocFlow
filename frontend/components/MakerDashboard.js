"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import API from "../services/api";

export default function MakerDashboard() {

  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [activeTab, setActiveTab] = useState("dashboard");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newVersionFile, setNewVersionFile] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchTickets();
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
      console.error(error);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {

      const res = await API.get(
        `categories/load-subcategories/?category=${categoryId}`
      );

      setSubcategories(res.data);

    } catch (error) {
      console.error(error);
    }
  };

  const fetchTickets = async () => {
    try {

      const token = localStorage.getItem("token");

      const res = await API.get("tickets/maker/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTickets(res.data);

    } catch (error) {
      console.error(error);
    }
  };

  const openTicket = async (id) => {

    try {

      const token = localStorage.getItem("token");

      const res = await API.get(`tickets/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSelectedTicket(res.data);

    } catch (error) {
      console.error(error);
    }
  };

  const closeModal = () => {
    setSelectedTicket(null);
  };

  const uploadNewVersion = async () => {

    if (!newVersionFile) {
      alert("Select file first");
      return;
    }

    try {

      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("ticket", selectedTicket.ticket.id);
      formData.append("file", newVersionFile);

      await API.post(
        "documents/upload/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("New version uploaded");

      openTicket(selectedTicket.ticket.id);

    } catch (error) {
      console.error(error);
    }
  };

  const createTicket = async () => {

    if (!title || !selectedCategory || !selectedSubcategory || !selectedFile) {
      alert("Fill all fields");
      return;
    }

    try {

      const token = localStorage.getItem("token");

      const ticketRes = await API.post(
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

      const ticketId = ticketRes.data.id;

      const formData = new FormData();

      formData.append("ticket", ticketId);
      formData.append("file", selectedFile);

      await API.post(
        "documents/upload/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("Ticket created");

      fetchTickets();

    } catch (error) {
      console.error(error);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    return (
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "" || ticket.status === statusFilter)
    );
  });

  const getStatusColor = (status) => {

    switch (status) {
      case "created":
        return "bg-gray-400";

      case "assigned":
        return "bg-blue-400";

      case "started":
        return "bg-indigo-400";

      case "draft":
        return "bg-red-400";

      case "approval":
        return "bg-yellow-400";

      case "approved":
        return "bg-green-500";

      case "locked":
        return "bg-black";

      default:
        return "bg-gray-400";
    }

  };

  return (

    <div className="flex min-h-screen">

      <Sidebar setActiveTab={setActiveTab} />

      <div className="flex-1 p-10 bg-gray-100">

        {/* Create Ticket */}

        {activeTab === "dashboard" && (

          <div>

            <h1 className="text-3xl font-bold mb-6">
              Create Ticket
            </h1>

            <div className="bg-white p-6 rounded shadow max-w-xl">

              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              />

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  fetchSubcategories(e.target.value);
                }}
                className="w-full border p-2 rounded mb-4"
              >

                <option>Select Category</option>

                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}

              </select>

              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              >

                <option>Select Subcategory</option>

                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}

              </select>

              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="mb-4"
              />

              <button
                onClick={createTicket}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Create Ticket
              </button>

            </div>

          </div>

        )}

        {/* Tickets */}

        {activeTab === "tickets" && (

          <div>

            <h1 className="text-3xl font-bold mb-6">
              My Tickets
            </h1>

            <div className="flex gap-4 mb-4">

              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border p-2 rounded"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="">All Status</option>
                <option value="created">Created</option>
                <option value="assigned">Assigned</option>
                <option value="started">Started</option>
                <option value="draft">Draft</option>
                <option value="approval">Approval</option>
                <option value="approved">Approved</option>
                <option value="locked">Locked</option>
              </select>

            </div>

            <div className="bg-white rounded shadow">

              {filteredTickets.map((ticket) => (

                <div
                  key={ticket.id}
                  onClick={() => openTicket(ticket.id)}
                  className="p-4 border-b cursor-pointer hover:bg-gray-100"
                >

                  <div className="flex justify-between">

                    <h3 className="font-semibold">
                      {ticket.title}
                    </h3>

                    <span className={`px-2 py-1 text-white rounded ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>

                  </div>

                </div>

              ))}

            </div>

            {/* Modal */}

            {selectedTicket && (

              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                <div className="bg-white w-2/3 p-6 rounded shadow-lg">

                  <div className="flex justify-between mb-4">

                    <h2 className="text-xl font-bold">
                      Ticket Details
                    </h2>

                    <button
                      onClick={closeModal}
                      className="text-red-500 font-bold"
                    >
                      Close
                    </button>

                  </div>

                  <p>
                    <strong>Title:</strong> {selectedTicket.ticket.title}
                  </p>

                  <p>
                    <strong>Status:</strong> {selectedTicket.ticket.status}
                  </p>

                  <h3 className="mt-4 font-bold">
                    Documents
                  </h3>

                  {selectedTicket.documents.map((doc) => (

                    <div key={doc.id} className="border p-2 rounded mt-2">

                      <a
                        href={doc.file}
                        target="_blank"
                        className="text-blue-500 underline"
                      >
                        {doc.version}
                      </a>

                    </div>

                  ))}

                  {selectedTicket.ticket.status === "draft" && (

                    <div className="mt-4">

                      <h3 className="font-bold">
                        Upload New Version
                      </h3>

                      <input
                        type="file"
                        onChange={(e) =>
                          setNewVersionFile(e.target.files[0])
                        }
                      />

                      <button
                        onClick={uploadNewVersion}
                        className="bg-green-500 text-white px-3 py-1 rounded ml-2"
                      >
                        Upload
                      </button>

                    </div>

                  )}

                </div>

              </div>

            )}

          </div>

        )}

      </div>

    </div>

  );
}