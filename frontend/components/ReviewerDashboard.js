"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function ReviewerDashboard() {

  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex">

      <Sidebar setActiveTab={setActiveTab} />


      <div className="flex-1 p-10">

        <h1 className="text-3xl font-bold">
          Reviewer Dashboard
        </h1>

      </div>

    </div>
  );
}