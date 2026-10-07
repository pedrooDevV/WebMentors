import React, { useState } from "react";
import { loginApi } from "../services/api.js";

export default function Login({
  setUser,
  setIsBackendConnected,
  showToast,
}) {
  const [loginForm, setLoginForm] = useState({
    nome: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await loginApi(loginForm);

      setIsBackendConnected(true);

      const usuario = {
        nome: data.nome || loginForm.nome,
        role: data.role,
        token: data.token,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      setUser(usuario);

      showToast(`Bem-vindo(a), ${usuario.nome}!`, "success");
    } catch (error) {
      setIsBackendConnected(false);
      showToast(error.message || "Erro ao realizar login.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
          <i className="fas fa-graduation-cap"></i>
        </div>

        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Mentoria<span className="text-emerald-600">.web</span>
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Usuário
              </label>

              <input
                type="text"
                required
                value={loginForm.nome}
                onChange={(e) =>
                  setLoginForm({
                    ...loginForm,
                    nome: e.target.value,
                  })
                }
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Senha
              </label>

              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({
                    ...loginForm,
                    password: e.target.value,
                  })
                }
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-semibold transition"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
