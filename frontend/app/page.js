"use client";

import { useRouter } from "next/navigation";

export default function Home() {

  const router = useRouter();

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-slate-900 text-white">

      <h1 className="text-5xl font-bold mb-6">
        DocFlow
      </h1>

      <p className="text-lg text-slate-300 mb-8">
        Enterprise Document Workflow System
      </p>

      <button
        onClick={() => router.push("/login")}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
      >
        Get Started
      </button>

    </div>
  );
}