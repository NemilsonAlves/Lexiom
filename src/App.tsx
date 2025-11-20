import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { AdminApp } from "./components/AdminApp/AdminApp";
import { Toaster } from "sonner";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    void info;
    console.error("Erro na aplicação:", error);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 18 }}>Ocorreu um erro</h1>
          <p>Tente atualizar a página. Se persistir, contate o suporte.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const basename = import.meta.env.BASE_URL || "/";

  React.useEffect(() => {
    const rawAdminBase = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_ADMIN_API_URL || 'http://localhost:3001/api';
    const adminBase = (() => {
      const trimmed = rawAdminBase.replace(/\/+$/, '');
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    })();
    const report = (payload: Record<string, unknown>) => {
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`${adminBase}/errors`, blob);
        } else {
          void fetch(`${adminBase}/errors`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        }
      } catch { void 0; }
    };
    const onError = (e: ErrorEvent) => {
      report({ message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, stack: e.error?.stack || "", url: location.href, userAgent: navigator.userAgent });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      report({ message: String(e.reason), url: location.href, userAgent: navigator.userAgent });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <>
      <ErrorBoundary>
        <Router basename={basename}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/*" element={<Layout />} />
          </Routes>
        </Router>
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            color: "#2D3436",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
    </>
  );
}
