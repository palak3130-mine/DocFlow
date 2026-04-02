"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "../../services/api";

export default function Login() {

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    try {

      const response = await API.post("auth/login/", {
        username: username,
        password: password,
      });

      console.log(response.data);

      localStorage.setItem("token", response.data.access);
      localStorage.setItem("role", response.data.role);

      router.push("/dashboard");

    } catch (error) {

      console.log(error.response?.data);
      alert("Login failed");

    }

  };

  return (
    <div className="h-screen flex justify-center items-center bg-slate-900">

      <div className="bg-slate-800 p-8 rounded-lg w-96 text-white">

        <h2 className="text-2xl mb-6 font-bold">
          Login
        </h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 p-2 rounded bg-slate-700"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-2 rounded bg-slate-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 p-2 rounded"
        >
          Login
        </button>

      </div>

    </div>
  );
}