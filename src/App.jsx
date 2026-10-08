import React, { useState, useRef, useEffect } from "react";

import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

import Login from "./pages/Login.jsx";
import ClienteDashboard from "./pages/ClienteDashboard.jsx";
import MentorDashboard from "./pages/MentorDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import ClientePerfilDash from "./pages/ClientePerfilDash.jsx";
import MentorPerfilDash from "./pages/MentorPerfilDash.jsx";

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

  // Recupera o usuário após atualizar a página.
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

  // Exibe mensagens de sucesso ou erro.
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

      toastTimerRef.current = null;
    }, 4000);
  };

  // Limpa o temporizador ao desmontar o componente.
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Trata a expiração da sessão.
  useEffect(() => {
    const handleExpired = () => {
      const tokenAtual = localStorage.getItem("token");

      // Ignora eventos antigos se o usuário já fez logout.
      if (!tokenAtual) {
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      setUser(null);
      setCurrentPage("dashboard");

      showToast(
        "Sua sessão expirou. Faça login novamente.",
        "error"
      );
    };

    window.addEventListener("sessionExpired", handleExpired);

    return () => {
      window.removeEventListener("sessionExpired", handleExpired);
    };
  }, []);

  // Realiza logout e limpa os dados locais.
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

  // Abre o perfil correspondente à função do usuário.
  const handleProfileClick = () => {
    if (user?.role === "CLIENTE" || user?.role === "MENTOR") {
      setCurrentPage("perfil");
    }
  };

  // Retorna ao dashboard principal.
  const handleBackToDashboard = () => {
    setCurrentPage("dashboard");
  };

  // Aguarda a recuperação da sessão.
  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {!user ? (
        <Login
          setUser={setUser}
          setIsBackendConnected={setIsBackendConnected}
          showToast={showToast}
        />
      ) : (
        <>
          <Header
            user={user}
            onLogout={handleLogout}
            onProfileClick={handleProfileClick}
            isBackendConnected={isBackendConnected}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            {/* Dashboard principal */}
            {currentPage === "dashboard" && (
              <>
                {user.role === "CLIENTE" && (
                  <ErrorBoundary>
                    <ClienteDashboard
                      user={user}
                      showToast={showToast}
                    />
                  </ErrorBoundary>
                )}

                {user.role === "MENTOR" && (
                  <ErrorBoundary>
                    <MentorDashboard
                      user={user}
                      showToast={showToast}
                    />
                  </ErrorBoundary>
                )}

                {user.role === "ADMIN" && (
                  <ErrorBoundary>
                    <AdminDashboard
                      user={user}
                      showToast={showToast}
                    />
                  </ErrorBoundary>
                )}
              </>
            )}

            {/* Perfil do cliente */}
            {currentPage === "perfil" && user.role === "CLIENTE" && (
              <ErrorBoundary>
                <ClientePerfilDash
                  user={user}
                  showToast={showToast}
                  onBack={handleBackToDashboard}
                />
              </ErrorBoundary>
            )}

            {/* Perfil do mentor */}
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
        </>
      )}

      {/* O Toast permanece disponível na tela de login,
          durante o cadastro e nos dashboards. */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => {
          if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
            toastTimerRef.current = null;
          }

          setToast({
            message: "",
            type: "success",
          });
        }}
      />
    </div>
  );
}