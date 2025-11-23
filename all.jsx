// =======================
// Button.jsx
// Reusable button component with loading and variant support
// =======================
import React from "react";

export const Button = ({ children, onClick, loading = false, variant = "primary" }) => {
  // Define button styles based on variant
  const styles = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded",
  };

  return (
    <button
      className={styles[variant]}
      onClick={onClick}
      disabled={loading} // Disable button while loading
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

// =======================
// AuthScreen.jsx
// User authentication screen (login/register placeholder)
// =======================
import React, { useState } from "react";
import { Button } from "./Button";

export const AuthScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      alert(`Logged in with email: ${email}`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
      />
      <Button onClick={handleLogin} loading={loading}>
        Login
      </Button>
    </div>
  );
};

// =======================
// SearchResults.jsx
// Displays search results for buses or routes
// =======================
import React from "react";

export const SearchResults = ({ results }) => {
  if (!results || results.length === 0) {
    return <p className="text-gray-500 mt-4">No results found.</p>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold mb-2">Search Results:</h3>
      <ul className="border rounded p-2">
        {results.map((item, index) => (
          <li key={index} className="p-2 border-b last:border-b-0">
            <span className="font-semibold">{item.name}
