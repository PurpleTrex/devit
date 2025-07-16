'use client';

import { useState } from 'react';

export default function AdminTest() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing admin login...');
      
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'DevIT_Admin_2025!'
        }),
      });

      console.log('Response:', response);
      const data = await response.json();
      console.log('Data:', data);
      
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setResult('Error: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin API Test</h1>
      
      <button 
        onClick={testLogin}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Admin Login'}
      </button>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {result}
        </pre>
      )}
    </div>
  );
}
