import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to Our Platform</h1>
      <div className="space-x-4">
        <Link to="/login" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Login
        </Link>
        <Link to="/register" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Register
        </Link>
      </div>
    </div>
  );
}
