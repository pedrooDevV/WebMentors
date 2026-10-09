import React, { useState, useEffect } from "react";

import {
  atualizarPerfilApi,
  buscarFotoPerfilApi,
  atualizarFotoPerfilApi,
} from "../services/api.js";

export default function ClientePerfilDash({
  user,
  showToast,
  onBack,
}) {
  const [formData, setFormData] = useState({
    nome: user?.nome || "",
    email: user?.email || "",
    telefone: user?.telefone || "",
    senha: "",
  });

  const [loading, setLoading] = useState(false);

  // Estados da foto de perfil
  const [fotoPerfil, setFotoPerfil] = useState(
    user?.fotoPerfil || ""
  );

  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoTemporaria, setFotoTemporaria] = useState("");
  const [arquivoFoto, setArquivoFoto] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  // Busca a foto salva no backend
  useEffect(() => {
    async function carregarFotoPerfil() {
      try {
        const dados = await buscarFotoPerfilApi();

        const foto = dados?.fotoUrl || dados?.fotoPerfil || "";

        setFotoPerfil(foto);
      } catch (error) {
        console.error(
          "Erro ao carregar foto de perfil:",
          error
        );
      }
    }

    carregarFotoPerfil();
  }, []);

  // Atualiza os campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Abre o modal com o botão direito
  const abrirModalFoto = (e) => {
    e.preventDefault();

    setArquivoFoto(null);
    setFotoTemporaria(fotoPerfil || "");
    setShowFotoModal(true);
  };

  // Seleciona e valida a imagem
  const handleSelecionarFoto = (e) => {
    const arquivo = e.target.files?.[0];

    if (!arquivo) {
      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      showToast?.(
        "Selecione uma imagem PNG, JPEG ou WebP.",
        "error"
      );

      e.target.value = "";
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      showToast?.(
        "A imagem deve ter no máximo 2 MB.",
        "error"
      );

      e.target.value = "";
      return;
    }

    setArquivoFoto(arquivo);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFotoTemporaria(reader.result);
      }
    };

    reader.onerror = () => {
      showToast?.(
        "Não foi possível carregar a imagem.",
        "error"
      );
    };

    reader.readAsDataURL(arquivo);
  };

  // Fecha o modal
  const fecharModalFoto = () => {
    if (enviandoFoto) {
      return;
    }

    setShowFotoModal(false);
    setFotoTemporaria("");
    setArquivoFoto(null);
  };

  // Envia a imagem para o backend Java
  const handleSalvarFoto = async () => {
    if (!arquivoFoto) {
      showToast?.(
        "Selecione uma nova foto antes de salvar.",
        "error"
      );

      return;
    }

    setEnviandoFoto(true);

    try {
      const dados = await atualizarFotoPerfilApi(arquivoFoto);

      const novaFoto =
        dados?.fotoUrl || dados?.fotoPerfil;

      if (!novaFoto) {
        throw new Error(
          "O servidor não retornou a URL da imagem."
        );
      }

      setFotoPerfil(novaFoto);

      // Atualiza os dados locais do usuário
      const usuarioSalvo = JSON.parse(
        localStorage.getItem("usuario") || "{}"
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify({
          ...usuarioSalvo,
          fotoPerfil: novaFoto,
        })
      );

      setShowFotoModal(false);
      setFotoTemporaria("");
      setArquivoFoto(null);

      showToast?.(
        "Foto de perfil atualizada com sucesso!",
        "success"
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar foto de perfil:",
        error
      );

      showToast?.(
        error.message || "Erro ao atualizar a foto.",
        "error"
      );
    } finally {
      setEnviandoFoto(false);
    }
  };

  // Salva os dados do perfil
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

      const usuarioAtualizado =
        await atualizarPerfilApi(payload);

      const usuarioSalvo = JSON.parse(
        localStorage.getItem("usuario") || "{}"
      );

      const novoUsuario = {
        ...usuarioSalvo,
        ...user,
        ...(usuarioAtualizado || payload),
        fotoPerfil,
      };

      localStorage.setItem(
        "usuario",
        JSON.stringify(novoUsuario)
      );

      showToast?.(
        "Perfil de cliente atualizado com sucesso!",
        "success"
      );

      setFormData((prev) => ({
        ...prev,
        senha: "",
      }));
    } catch (error) {
      console.error(
        "Erro ao atualizar perfil do cliente:",
        error
      );

      showToast?.(
        error.message || "Erro ao atualizar perfil.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Botão voltar */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium text-sm"
      >
        ← Voltar para o Painel
      </button>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">

        {/* Cabeçalho e foto de perfil */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">

          <button
            type="button"
            onContextMenu={abrirModalFoto}
            title="Clique com o botão direito para alterar a foto"
            aria-label="Alterar foto de perfil"
            className="w-16 h-16 shrink-0 rounded-full overflow-hidden bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold cursor-pointer hover:ring-4 hover:ring-emerald-200 transition"
          >
            {fotoPerfil ? (
              <img
                src={fotoPerfil}
                alt="Foto de perfil do cliente"
                className="w-full h-full object-cover"
              />
            ) : (
              formData.nome
                ? formData.nome.charAt(0).toUpperCase()
                : "C"
            )}
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Meu Perfil
            </h1>

            <p className="text-sm text-slate-500">
              Gerencie suas informações pessoais e sua conta.
            </p>

            <p className="text-xs text-emerald-600 mt-1">
              Clique com o botão direito na foto para alterá-la.
            </p>
          </div>
        </div>

        {/* Formulário de perfil */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
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
                name="email"
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
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm"
              />
            </div>
          </div>

          {/* Nova senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Nova Senha
            </label>

            <input
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              autoComplete="new-password"
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

      {/* Modal para alterar a foto */}
      {showFotoModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={fecharModalFoto}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-foto-cliente"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2
                  id="titulo-modal-foto-cliente"
                  className="text-xl font-bold text-slate-900"
                >
                  Alterar foto de perfil
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Escolha uma imagem para seu perfil.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModalFoto}
                disabled={enviandoFoto}
                aria-label="Fechar modal"
                className="text-2xl text-slate-400 hover:text-slate-700 disabled:opacity-50"
              >
                &times;
              </button>
            </div>

            {/* Pré-visualização */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-emerald-100 text-4xl font-bold text-emerald-700 shadow-lg">
                {fotoTemporaria ? (
                  <img
                    src={fotoTemporaria}
                    alt="Prévia da foto selecionada"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  formData.nome
                    ? formData.nome.charAt(0).toUpperCase()
                    : "C"
                )}
              </div>
            </div>

            <label
              htmlFor="arquivo-foto-perfil-cliente"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Selecione uma imagem
            </label>

            <input
              id="arquivo-foto-perfil-cliente"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleSelecionarFoto}
              disabled={enviandoFoto}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Formatos aceitos: PNG, JPEG e WebP. Máximo de 2 MB.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={fecharModalFoto}
                disabled={enviandoFoto}
                className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSalvarFoto}
                disabled={!arquivoFoto || enviandoFoto}
                className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {enviandoFoto ? "Enviando..." : "Salvar foto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}