import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashBoard from './pages/dashBoard.jsx';
import SignIn from './pages/signIn.jsx';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/dashboard" element={<DashBoard />} />

      </Routes>
    </Router>
  );
}

export default App;
