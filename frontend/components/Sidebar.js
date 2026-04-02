"use client";

import { LayoutDashboard, Ticket, Users, Settings } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="h-screen w-64 bg-slate-900 text-white p-5">

      <h1 className="text-2xl font-bold mb-8">
        DocFlow
      </h1>

      <nav className="space-y-4">

        <div className="flex items-center gap-3 hover:bg-slate-800 p-2 rounded cursor-pointer">
          <LayoutDashboard size={20} />
          Dashboard
        </div>

        <div className="flex items-center gap-3 hover:bg-slate-800 p-2 rounded cursor-pointer">
          <Ticket size={20} />
          Tickets
        </div>

        <div className="flex items-center gap-3 hover:bg-slate-800 p-2 rounded cursor-pointer">
          <Users size={20} />
          Users
        </div>

        <div className="flex items-center gap-3 hover:bg-slate-800 p-2 rounded cursor-pointer">
          <Settings size={20} />
          Settings
        </div>

      </nav>

    </div>
  );
}