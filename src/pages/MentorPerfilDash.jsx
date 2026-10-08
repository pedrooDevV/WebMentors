import React, { useState, useEffect } from "react";
import { buscarEspecialidades, atualizarPerfilApi } from "../services/api.js";

export default function MentorPerfilDash({ user, showToast, onBack }) {
  const [formData, setFormData] = useState({
    nome: user?.nome || "",
    email: user?.email || "",
    telefone: user?.telefone || "",
    cargo: user?.cargo || "",
    biografia: user?.biografia || "",
    especialidades: user?.especialidades || [],
    senha: "",
  });

  const [listaEspecialidades, setListaEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carregandoEspecialidades, setCarregandoEspecialidades] = useState(true);

  useEffect(() => {
    async function carregarEspecialidades() {
      try {
        const dados = await buscarEspecialidades();
        setListaEspecialidades(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error("Erro ao carregar especialidades:", error);
        showToast("Não foi possível carregar as especialidades", "error");
      } finally {
        setCarregandoEspecialidades(false);
      }
    }

    carregarEspecialidades();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEspecialidadeToggle = (esp) => {
    const nomeEsp = typeof esp === "string" ? esp : esp.nome || esp.descricao;

    setFormData((prev) => {
      const existe = prev.especialidades.includes(nomeEsp);
      if (existe) {
        return {
          ...prev,
          especialidades: prev.especialidades.filter((item) => item !== nomeEsp),
        };
      } else {
        return {
          ...prev,
          especialidades: [...prev.especialidades, nomeEsp],
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nome: formData.nome,
        telefone: formData.telefone,
        cargo: formData.cargo,
        biografia: formData.biografia,
        especialidades: formData.especialidades,
      };

      if (formData.senha.trim()) {
        payload.senha = formData.senha;
      }

      const usuarioAtualizado = await atualizarPerfilApi(payload);

      const novoUsuario = {
        ...user,
        ...(usuarioAtualizado || payload),
      };

      localStorage.setItem("usuario", JSON.stringify(novoUsuario));
      showToast("Perfil de mentor atualizado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao atualizar perfil do mentor:", error);
      showToast(error.message || "Erro ao atualizar perfil", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium text-sm"
      >
        ← Voltar para o Painel
      </button>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
            {formData.nome ? formData.nome.charAt(0).toUpperCase() : "M"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Perfil do Mentor</h1>
            <p className="text-sm text-slate-500">Configure suas informações, cargo e especialidades</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Cargo
              </label>
              <input
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                placeholder="Ex: Desenvolvedor Senior, Tech Lead..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Especialidades
            </label>
            {carregandoEspecialidades ? (
              <div className="p-4 text-center text-sm text-slate-400">Carregando especialidades...</div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listaEspecialidades.map((esp, index) => {
                  const nomeEsp = typeof esp === "string" ? esp : esp.nome || esp.descricao;
                  const selecionado = formData.especialidades.includes(nomeEsp);

                  return (
                    <label
                      key={esp.id || index}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm cursor-pointer transition-all ${
                        selecionado
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-medium"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => handleEspecialidadeToggle(esp)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{nomeEsp}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Biografia
            </label>
            <textarea
              name="biografia"
              value={formData.biografia}
              onChange={handleChange}
              rows={4}
              placeholder="Resumo da sua experiência profissional..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Deixe em branco para manter a atual"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}