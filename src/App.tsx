import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { AdminApp } from "./components/AdminApp/AdminApp";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/*" element={<Layout />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            color: '#2D3436',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
    </>
  );
}
