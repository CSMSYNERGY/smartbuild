import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Embedded from "./pages/Embedded.jsx";
import "./App.css";

function Nav() {
  const location = useLocation();
  
  // Don't show nav on embedded page
  if (location.pathname === "/embedded") {
    return null;
  }
  
  return (
    <nav style={{ padding: "16px", borderBottom: "1px solid #ccc" }}>
      <Link to="/home" style={{ marginRight: "16px" }}>
        Home
      </Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <Nav />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/embedded" element={<Embedded />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
