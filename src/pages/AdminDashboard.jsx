import React, { useState, useEffect } from "react";
import { registrarUsuarioApi } from "../services/api";
import { buscarEspecialidades } from "../services/api.js";
import { buscarUsuariosApi } from "../services/api";

export default function AdminDashboard({ showToast }) {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [usuariosApi, setUsuariosApi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [especialidades, setEspecialidades] = useState([]);
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    biografia: "",
    cargo: "",
    especialidadesIds: [],
    role: "CLIENTE",
  });

  const handleRegistrarUsuario = async (e) => {
    e.preventDefault();
    try {
      await registrarUsuarioApi(novoUsuario);
      showToast("Usuário cadastrado com sucesso no Spring Boot!");
      await carregarUsuarios();
      // Reseta o formulário
      setNovoUsuario({
        nome: "",
        email: "",
        senha: "",
        telefone: "",
        biografia: "",
        cargo: "",
        especialidadesIds: [],
        role: "CLIENTE",
      });
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const carregarUsuarios = async () => {
    try {
      const usuariosData = await buscarUsuariosApi();
      setUsuariosApi(usuariosData || []);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    async function carregarEspecialidades() {
      try {
        const data = await buscarEspecialidades();

        if (Array.isArray(data)) {
          setEspecialidades(data);
        } else if (data && Array.isArray(data.content)) {
          setEspecialidades(data.content);
        } else {
          setEspecialidades([]);
        }
      } catch (error) {
        console.error("Erro ao buscar especialidades:", error);
        setEspecialidades([]);
      }
    }

    carregarEspecialidades();
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            PAINEL ADMIN
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("usuarios")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "usuarios"
                  ? "bg-amber-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-users w-5"></i>
              <span>Usuários do Sistema</span>
            </button>
            <button
              onClick={() => setActiveTab("cadastrar")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "cadastrar"
                  ? "bg-amber-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-user-plus w-5"></i>
              <span>Cadastrar Usuário</span>
            </button>
          </nav>
        </div>
      </aside>

      <main className="flex-1">
        {activeTab === "usuarios" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">
              Usuários Registrados (`GET /users`)
            </h2>
            <div className="divide-y divide-slate-100">
              {usuariosApi.map((u) => (
                <div
                  key={u.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-800">{u.nome}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg uppercase">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "cadastrar" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Cadastrar Novo Usuário</h2>
            <form onSubmit={handleRegistrarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={novoUsuario.nome}
                  onChange={(e) =>
                    setNovoUsuario({ ...novoUsuario, nome: e.target.value })
                  }
                  className="w-full p-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={novoUsuario.email}
                  onChange={(e) =>
                    setNovoUsuario({ ...novoUsuario, email: e.target.value })
                  }
                  className="w-full p-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={novoUsuario.senha}
                  onChange={(e) =>
                    setNovoUsuario({ ...novoUsuario, senha: e.target.value })
                  }
                  className="w-full p-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  required
                  value={novoUsuario.telefone}
                  onChange={(e) =>
                    setNovoUsuario({
                      ...novoUsuario,
                      telefone: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Perfil (Role)
                </label>
                <select
                  value={novoUsuario.role}
                  onChange={(e) =>
                    setNovoUsuario({ ...novoUsuario, role: e.target.value })
                  }
                  className="w-full p-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="CLIENTE">CLIENTE</option>
                  <option value="MENTOR">MENTOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {novoUsuario.role === "MENTOR" && (
                <>
                  {/* CAMPO DE ESPECIALIDADES */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Especialidades
                    </label>
                    <div className="grid grid-cols-2 gap-2 border p-3 rounded-xl max-h-40 overflow-y-auto bg-slate-50">
                      {Array.isArray(especialidades) &&
                        especialidades.map((esp) => {
                          const id = esp.id || esp.idEspecialidade;
                          const nome = esp.nome || esp.descricao;
                          const listaAtual =
                            novoUsuario.especialidadesIds || [];
                          const isChecked = listaAtual.includes(id);

                          return (
                            <label
                              key={id}
                              className="flex items-center space-x-2 text-sm cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNovoUsuario({
                                      ...novoUsuario,
                                      especialidadesIds: [...listaAtual, id],
                                    });
                                  } else {
                                    setNovoUsuario({
                                      ...novoUsuario,
                                      especialidadesIds: listaAtual.filter(
                                        (item) => item !== id
                                      ),
                                    });
                                  }
                                }}
                                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                              />
                              <span className="text-slate-700">{nome}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* CAMPO DE BIOGRAFIA */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Biografia
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Resumo da experiência profissional do mentor..."
                      value={novoUsuario.biografia || ""}
                      onChange={(e) =>
                        setNovoUsuario({
                          ...novoUsuario,
                          biografia: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* CAMPO DE CARGO */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Desenvolvedor Senior, Tech Lead..."
                      value={novoUsuario.cargo || ""}
                      onChange={(e) =>
                        setNovoUsuario({
                          ...novoUsuario,
                          cargo: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition"
              >
                Cadastrar Usuário
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}