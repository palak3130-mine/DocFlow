"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import API from "../services/api";

export default function AdminDashboard() {

/* =========================
STATE
========================= */

const [activeTab, setActiveTab] = useState("dashboard");
const [tickets, setTickets] = useState([]);
const [selectedTicket, setSelectedTicket] = useState(null);
const [ticketDetail, setTicketDetail] = useState(null);
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const [loading, setLoading] = useState(false);

const ticketsPerPage = 5;

/* =========================
FETCH TICKETS
========================= */

const fetchTickets = async () => {
try {


  setLoading(true);

  const token = localStorage.getItem("token");

  const res = await API.get("tickets/admin/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setTickets(res.data);

} catch (error) {
  console.error("Error fetching tickets", error);
} finally {
  setLoading(false);
}


};

/* =========================
USE EFFECT
========================= */

useEffect(() => {

  if (activeTab === "tickets" || activeTab === "dashboard") {
    fetchTickets();
  }

  const interval = setInterval(() => {
    if (activeTab === "tickets" || activeTab === "dashboard") {
      fetchTickets();
    }
  }, 10000);

  return () => clearInterval(interval);

}, [activeTab]);

/* =========================
SEARCH + FILTER
========================= */

const filteredTickets = tickets.filter((ticket) => {
return (
ticket.title.toLowerCase().includes(search.toLowerCase()) &&
(statusFilter === "" || ticket.status === statusFilter)
);
});

const totalTickets = tickets.length;

const approvalTickets = tickets.filter(
  (t) => t.status === "approval"
).length;

const approvedTickets = tickets.filter(
  (t) => t.status === "approved"
).length;

const draftTickets = tickets.filter(
  (t) => t.status === "draft"
).length;

/* =========================
PAGINATION
========================= */

const indexOfLast = currentPage * ticketsPerPage;
const indexOfFirst = indexOfLast - ticketsPerPage;

const currentTickets = filteredTickets.slice(
indexOfFirst,
indexOfLast
);

const totalPages = Math.ceil(
filteredTickets.length / ticketsPerPage
);

/* =========================
APPROVE TICKET
========================= */

const approveTicket = async (id) => {
try {


  const token = localStorage.getItem("token");

  await API.post(
    `tickets/approve/${id}/`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  fetchTickets();

} catch (error) {
  console.error("Error approving ticket", error);
}


};

/* =========================
STATUS COLOR
========================= */

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

/* =========================
TICKET DETAIL
========================= */

const fetchTicketDetail = async (id) => {
try {


  const token = localStorage.getItem("token");

  const res = await API.get(`tickets/${id}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setSelectedTicket(id);
  setTicketDetail(res.data);

} catch (error) {
  console.error("Error fetching ticket detail", error);
}


};

const closeModal = () => {
setSelectedTicket(null);
setTicketDetail(null);
};

/* =========================
UI
========================= */

return ( <div className="flex min-h-screen">

  <Sidebar setActiveTab={setActiveTab} />

  <div className="flex-1 p-8 bg-gray-100">

    {/* ================= DASHBOARD ================= */}

    {activeTab === "dashboard" && (
      <div>

        <h1 className="text-3xl font-bold mb-6">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-4 gap-6">

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all duration-300">
            <h2 className="text-gray-600">Total Tickets</h2>
            <p className="text-2xl font-bold">
              {totalTickets}
            </p>
          </div>

          <div className="bg-yellow-100 p-6 rounded-lg shadow">
            <h2 className="text-gray-600">
              Pending Approval
            </h2>
            <p className="text-2xl font-bold">
              {approvalTickets}
            </p>
          </div>

          <div className="bg-green-100 p-6 rounded-lg shadow">
            <h2 className="text-gray-600">
              Approved
            </h2>
            <p className="text-2xl font-bold">
              {approvedTickets}
            </p>
          </div>

          <div className="bg-red-100 p-6 rounded-lg shadow">
            <h2 className="text-gray-600">
              Draft
            </h2>
            <p className="text-2xl font-bold">
              {draftTickets}
            </p>
          </div>

        </div>

      </div>
    )}

    {/* ================= TICKETS ================= */}

    {activeTab === "tickets" && (

      <div>

        <h1 className="text-2xl font-bold mb-6">
          All Tickets
        </h1>

        <div className="bg-white p-4 rounded shadow">

          {/* Search + Filter */}

          <div className="flex gap-4 mb-4">

            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 rounded w-1/3"
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

          {/* Loading */}

          {loading && (
            <div className="text-center p-6">
              Loading tickets...
            </div>
          )}

          {/* Table */}

          <table className="w-full">

            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>

            <tbody>

              {currentTickets.map((ticket) => (

                <tr
                  key={ticket.id}
                  className="border-b cursor-pointer hover:bg-gray-100 transition-all duration-200"
                  onClick={() => fetchTicketDetail(ticket.id)}
                >

                  <td className="p-2">{ticket.id}</td>

                  <td className="p-2">{ticket.title}</td>

                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-white text-sm ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>

                  <td className="p-2">

                    {ticket.status === "approval" && (
                      <button
                        onClick={() => approveTicket(ticket.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-all duration-200"
                      >
                        Approve
                      </button>
                    )}

                  </td>

                </tr>

              ))}

              {!loading && currentTickets.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center p-6">
                    No tickets found
                  </td>
                </tr>
              )}

            </tbody>

          </table>

          {/* Pagination */}

          <div className="flex justify-center mt-4 gap-2">

            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-all duration-200"
            >
              Prev
            </button>

            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-all duration-200"
            >
              Next
            </button>

          </div>

          {/* Modal */}

          {ticketDetail && (

            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

              <div className="bg-white w-2/3 p-6 rounded-lg shadow-lg transform transition-all duration-300 scale-100">

                <div className="flex justify-between items-center mb-4">

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
                  <strong>Title:</strong> {ticketDetail.ticket.title}
                </p>

                <p>
                  <strong>Status:</strong> {ticketDetail.ticket.status}
                </p>

                <p>
                  <strong>Created At:</strong> {ticketDetail.ticket.created_at}
                </p>

                <h3 className="mt-4 font-bold">Documents</h3>

                {ticketDetail.documents.map((doc) => (
                  <div key={doc.id} className="border p-2 rounded mt-2">
                    {doc.version}
                  </div>
                ))}

                <h3 className="mt-4 font-bold">Status History</h3>

                {ticketDetail.status_logs.map((log, index) => (
                  <div key={index} className="border p-2 rounded mt-2">
                    {log.old_status} → {log.new_status}
                  </div>
                ))}

              </div>

            </div>

          )}

        </div>

      </div>

    )}

  </div>

</div>


);
}
