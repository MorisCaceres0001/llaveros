import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import KeychainCustomizer from './components/KeychainCustomizer';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  return (
    <Router basename="/llaveros">
      <Routes>
        <Route path="/" element={<KeychainCustomizer />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
