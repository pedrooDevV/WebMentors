import React, { useState } from "react";
import { atualizarPerfilApi } from "../services/api.js";

export default function ClientePerfilDash({ user, showToast, onBack }) {
  const [formData, setFormData] = useState({
    nome: user?.nome || "",
    email: user?.email || "",
    telefone: user?.telefone || "",
    senha: "",
  });

  const photoStorageKey = `fotoPerfil:${user?.id ?? user?.nome ?? "usuario"}`;

  const [fotoPerfil, setFotoPerfil] = useState("");
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoTemporaria, setFotoTemporaria] = useState("");

  useEffect(() => {
    setFotoPerfil(localStorage.getItem(photoStorageKey) || "");
  }, [photoStorageKey]);

  const handleSelecionarFoto = (e) => {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      showToast?.("Selecione um arquivo de imagem.", "error");
      e.target.value = "";
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      showToast?.("A imagem deve ter no máximo 2 MB.", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFotoTemporaria(reader.result);
      }
    };

    reader.onerror = () => {
      showToast?.("Não foi possível carregar a imagem.", "error");
    };

    reader.readAsDataURL(arquivo);
  };

  const handleSalvarFoto = () => {
    if (!fotoTemporaria) {
      showToast?.("Selecione uma foto antes de salvar.", "error");
      return;
    }

    try {
      localStorage.setItem(photoStorageKey, fotoTemporaria);

      setFotoPerfil(fotoTemporaria);
      setShowFotoModal(false);
      setFotoTemporaria("");

      showToast?.("Foto de perfil atualizada!", "success");
    } catch (error) {
      showToast?.("Não foi possível salvar a foto.", "error");
    }
  };

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nome: formData.nome,
        telefone: formData.telefone,
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
      showToast("Perfil atualizado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
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
          <button
            type="button"
            onContextMenu={(e) => {
              e.preventDefault();
              setFotoTemporaria(fotoPerfil);
              setShowFotoModal(true);
            }}
            title="Clique com o botão direito para alterar sua foto"
            className="w-16 h-16 rounded-full overflow-hidden bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold shrink-0 cursor-pointer hover:ring-4 hover:ring-emerald-100 transition"
          >
            {fotoPerfil ? (
              <img
                src={fotoPerfil}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : formData.nome ? (
              formData.nome.charAt(0).toUpperCase()
            ) : (
              "C"
            )}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Meu Perfil</h1>
            <p className="text-sm text-slate-500">
              Gerencie suas informações pessoais
            </p>
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
                placeholder="Seu nome"
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

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm"
                placeholder="Deixe em branco para manter a atual"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
