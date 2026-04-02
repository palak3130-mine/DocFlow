"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminDashboard from "../../components/AdminDashboard";
import ReviewerDashboard from "../../components/ReviewerDashboard";
import MakerDashboard from "../../components/MakerDashboard";

export default function Dashboard() {

  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {

    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
    } else {
      setRole(userRole);
    }

  }, []);

  if (!role) return null;

  if (role === "admin") return <AdminDashboard />;
  if (role === "reviewer") return <ReviewerDashboard />;
  if (role === "maker") return <MakerDashboard />;

  return <div>Invalid Role</div>;
}