import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import Login from "./pages/Login.jsx";
import ClienteDashboard from "./pages/ClienteDashboard.jsx";
import MentorDashboard from "./pages/MentorDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const toastTimerRef = useRef(null);

  // Recupera o usuário depois de atualizar a página
  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    if (token && usuario) {
      try {
        setUser(JSON.parse(usuario));
      } catch (error) {
        console.error("Erro ao recuperar usuário:", error);

        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    console.log("TOKEN:", token);
    console.log("USUARIO:", usuario);

    if (token && usuario) {
      setUser(JSON.parse(usuario));
    }

    setLoading(false);
  }, []);

  const showToast = (message, type = "success") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ message, type });

    toastTimerRef.current = setTimeout(() => {
      setToast({
        message: "",
        type: "success",
      });
    }, 4000);
  };

  // Enquanto recupera o usuário do localStorage
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se não estiver logado
  if (!user) {
    return (
      <Login
        setUser={setUser}
        setIsBackendConnected={setIsBackendConnected}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        user={user}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          setUser(null);
        }}
        isBackendConnected={isBackendConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {user.role === "CLIENTE" && (
          <ErrorBoundary>
            <ClienteDashboard user={user} showToast={showToast} />
          </ErrorBoundary>
        )}

        {user.role === "MENTOR" && (
          <ErrorBoundary>
            <MentorDashboard user={user} showToast={showToast} />
          </ErrorBoundary>
        )}

        {user.role === "ADMIN" && (
          <ErrorBoundary>
            <AdminDashboard user={user} showToast={showToast} />
          </ErrorBoundary>
        )}
      </main>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast({
            message: "",
            type: "",
          })
        }
      />
    </div>
  );
}
