import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

import Login from "./pages/Login.jsx";
import ClienteDashboard from "./pages/ClienteDashboard.jsx";
import MentorDashboard from "./pages/MentorDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import ClientePerfilDash from "./pages/ClientePerfilDash.jsx";
import MentorPerfilDash from "./pages/MentorPerfilDash.jsx";

import React, { useState, useRef, useEffect } from "react";
import { logoutApi } from "./services/api.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const [currentPage, setCurrentPage] = useState("dashboard");

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const toastTimerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    console.log("TOKEN:", token);
    console.log("USUARIO:", usuario);

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

  const showToast = (message, type = "success") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({
      message,
      type,
    });

    toastTimerRef.current = setTimeout(() => {
      setToast({
        message: "",
        type: "success",
      });
    }, 4000);
  };

  useEffect(() => {
    const handleExpired = () => {
      const tokenAtual = localStorage.getItem("token");

      // Se já fez logout, ignora respostas antigas
      if (!tokenAtual) {
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      setUser(null);
      setCurrentPage("dashboard");

      showToast("Sua sessão expirou. Faça login novamente.", "error");
    };

    window.addEventListener("sessionExpired", handleExpired);

    return () => {
      window.removeEventListener("sessionExpired", handleExpired);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      setUser(null);
      setCurrentPage("dashboard");
    }
  };

  const handleProfileClick = () => {
    setCurrentPage("perfil");
  };

  const handleBackToDashboard = () => {
    setCurrentPage("dashboard");
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return (
      <>
        <Login
          setUser={setUser}
          setIsBackendConnected={setIsBackendConnected}
          showToast={showToast}
        />

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
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {" "}
      <Header
        user={user}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
        isBackendConnected={isBackendConnected}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {currentPage === "dashboard" && (
          <>
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
          </>
        )}

        {currentPage === "perfil" && user.role === "CLIENTE" && (
          <ErrorBoundary>
            <ClientePerfilDash
              user={user}
              showToast={showToast}
              onBack={handleBackToDashboard}
            />
          </ErrorBoundary>
        )}

        {currentPage === "perfil" && user.role === "MENTOR" && (
          <ErrorBoundary>
            <MentorPerfilDash
              user={user}
              showToast={showToast}
              onBack={handleBackToDashboard}
            />
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
