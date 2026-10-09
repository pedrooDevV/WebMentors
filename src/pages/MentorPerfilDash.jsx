import React, { useState, useEffect, useRef } from "react";

import {
  buscarEspecialidades,
  atualizarPerfilApi,
  buscarFotoPerfilApi,
  atualizarFotoPerfilApi,
} from "../services/api.js";

export default function MentorPerfilDash({
  user,
  showToast,
  onBack,
}) {
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
  const [carregandoEspecialidades, setCarregandoEspecialidades] =
    useState(true);

  const [fotoPerfil, setFotoPerfil] = useState(
    user?.fotoPerfil || ""
  );
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoTemporaria, setFotoTemporaria] = useState("");
  const [arquivoFoto, setArquivoFoto] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const fotoPopupRef = useRef(null);

  // Carrega especialidades e foto de perfil
  useEffect(() => {
    async function carregarEspecialidades() {
      try {
        const dados = await buscarEspecialidades();

        setListaEspecialidades(
          Array.isArray(dados) ? dados : []
        );
      } catch (error) {
        console.error("Erro ao carregar especialidades:", error);

        showToast(
          "Não foi possível carregar as especialidades.",
          "error"
        );
      } finally {
        setCarregandoEspecialidades(false);
      }
    }

    async function carregarFotoPerfil() {
      try {
        const dados = await buscarFotoPerfilApi();

        setFotoPerfil(
          dados?.fotoUrl || dados?.fotoPerfil || ""
        );
      } catch (error) {
        console.error("Erro ao carregar foto:", error);
      }
    }

    carregarEspecialidades();
    carregarFotoPerfil();
  }, []);

  // Fecha o popup quando clicar fora dele
  useEffect(() => {
    if (!showFotoModal) return;

    const handleClickOutside = (event) => {
      if (
        fotoPopupRef.current &&
        !fotoPopupRef.current.contains(event.target) &&
        !enviandoFoto
      ) {
        setShowFotoModal(false);
        setFotoTemporaria("");
        setArquivoFoto(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape" && !enviandoFoto) {
        setShowFotoModal(false);
        setFotoTemporaria("");
        setArquivoFoto(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showFotoModal, enviandoFoto]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEspecialidadeToggle = (esp) => {
    const nomeEsp =
      typeof esp === "string"
        ? esp
        : esp.nome || esp.descricao;

    setFormData((prev) => {
      const existe = prev.especialidades.includes(nomeEsp);

      return {
        ...prev,
        especialidades: existe
          ? prev.especialidades.filter(
              (item) => item !== nomeEsp
            )
          : [...prev.especialidades, nomeEsp],
      };
    });
  };

  // Abre o popup com o botão direito
  const abrirModalFoto = (e) => {
    e.preventDefault();

    setArquivoFoto(null);
    setFotoTemporaria(fotoPerfil || "");
    setShowFotoModal(true);
  };

  // Seleciona uma imagem e gera a prévia
  const handleSelecionarFoto = (e) => {
    const input = e.target;
    const arquivo = input.files?.[0];

    if (!arquivo) return;

    input.value = "";

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      showToast(
        "Selecione uma imagem PNG, JPEG ou WebP.",
        "error"
      );
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      showToast(
        "A imagem deve ter no máximo 2 MB.",
        "error"
      );
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
      showToast("Não foi possível carregar a imagem.", "error");
    };

    reader.readAsDataURL(arquivo);
  };

  const fecharModalFoto = () => {
    if (enviandoFoto) return;

    setShowFotoModal(false);
    setFotoTemporaria("");
    setArquivoFoto(null);
  };

  // Envia a foto para o endpoint Java
  const handleSalvarFoto = async () => {
    if (!arquivoFoto) {
      showToast("Selecione uma foto antes de salvar.", "error");
      return;
    }

    setEnviandoFoto(true);

    try {
      const dados = await atualizarFotoPerfilApi(arquivoFoto);

      const novaFoto = dados?.fotoUrl || dados?.fotoPerfil;

      if (!novaFoto) {
        throw new Error(
          "O servidor não retornou a URL da imagem."
        );
      }

      setFotoPerfil(novaFoto);

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

      showToast(
        "Foto de perfil atualizada com sucesso!",
        "success"
      );
    } catch (error) {
      console.error("Erro ao atualizar a foto:", error);

      showToast(
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
        cargo: formData.cargo,
        biografia: formData.biografia,
        especialidades: formData.especialidades,
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

      setFormData((prev) => ({
        ...prev,
        senha: "",
      }));

      showToast(
        "Perfil de mentor atualizado com sucesso!",
        "success"
      );
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);

      showToast(
        error.message || "Erro ao atualizar perfil.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium text-sm"
      >
        ← Voltar para o Painel
      </button>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
        {/* Cabeçalho e foto com popup */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div
            ref={fotoPopupRef}
            className="relative shrink-0"
          >
            <button
              type="button"
              onContextMenu={abrirModalFoto}
              title="Clique com o botão direito para alterar a foto"
              aria-label="Alterar foto de perfil"
              className="w-16 h-16 rounded-full overflow-hidden bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold cursor-pointer hover:ring-4 hover:ring-emerald-100 transition"
            >
              {fotoPerfil ? (
                <img
                  src={fotoPerfil}
                  alt="Foto do mentor"
                  className="w-full h-full object-cover"
                />
              ) : (
                formData.nome
                  ? formData.nome.charAt(0).toUpperCase()
                  : "M"
              )}
            </button>

            {showFotoModal && (
              <div
                role="dialog"
                aria-label="Alterar foto de perfil"
                className="absolute left-0 top-full z-[9999] mt-3 w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Foto de perfil
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Escolha uma imagem para sua conta.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fecharModalFoto}
                    disabled={enviandoFoto}
                    aria-label="Fechar"
                    className="text-slate-400 hover:text-slate-700 transition text-lg disabled:opacity-50"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>

                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-emerald-50 border border-slate-200 flex items-center justify-center text-2xl font-bold text-emerald-700">
                    {fotoTemporaria ? (
                      <img
                        src={fotoTemporaria}
                        alt="Prévia da foto"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      formData.nome
                        ? formData.nome.charAt(0).toUpperCase()
                        : "M"
                    )}
                  </div>
                </div>

                <label
                  htmlFor="foto-mentor"
                  className="block text-xs font-semibold text-slate-600 mb-2"
                >
                  Selecionar imagem
                </label>

                <input
                  id="foto-mentor"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSelecionarFoto}
                  disabled={enviandoFoto}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  PNG, JPEG ou WebP · Máximo de 2 MB
                </p>

                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    onClick={fecharModalFoto}
                    disabled={enviandoFoto}
                    className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleSalvarFoto}
                    disabled={!arquivoFoto || enviandoFoto}
                    className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {enviandoFoto ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Perfil do Mentor
            </h1>
            <p className="text-sm text-slate-500">
              Configure suas informações, cargo e especialidades.
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Clique com o botão direito na foto para alterá-la.
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
                placeholder="Ex.: Desenvolvedor Sênior, Tech Lead..."
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
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Especialidades
            </label>

            {carregandoEspecialidades ? (
              <div className="p-4 text-center text-sm text-slate-400">
                Carregando especialidades...
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listaEspecialidades.map((esp, index) => {
                  const nomeEsp =
                    typeof esp === "string"
                      ? esp
                      : esp.nome || esp.descricao;

                  const selecionado =
                    formData.especialidades.includes(nomeEsp);

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
                        onChange={() =>
                          handleEspecialidadeToggle(esp)
                        }
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
    </div>
  );
}