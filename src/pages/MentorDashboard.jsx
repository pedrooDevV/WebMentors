import React, { useEffect, useRef, useState } from "react";

import {
  buscarMinhaAgendaApi,
  excluirAgendaApi,
  criarAgendaApi,
  buscarSolicitacoesMentorApi,
  aceitarSolicitacaoApi,
  recusarSolicitacaoApi,
  buscarMensagensApi,
  buscarConversasMentorApi,
  excluirMensagemApi,
} from "../services/api";

import {
  conectarChat,
  entrarNaConversa,
  enviarMensagem,
} from "../services/chatSocket";

export default function MentorDashboard({ user, showToast }) {
  // =========================================================
  // ESTADOS
  // =========================================================

  const [activeTab, setActiveTab] = useState("agenda");

  const [agendaSlots, setAgendaSlots] = useState([]);

  const [solicitacoes, setSolicitacoes] =
    useState([]);

  const [conversas, setConversas] =
    useState([]);

  const [conversaAtual, setConversaAtual] =
    useState(null);

  const [mensagensChat, setMensagensChat] =
    useState([]);

  const [textoMensagem, setTextoMensagem] =
    useState("");

  const [novoHorario, setNovoHorario] =
    useState({
      dataHora: "",
      valor: "",
    });

  const [loadingAgenda, setLoadingAgenda] =
    useState(false);

  const [loadingSolicitacoes, setLoadingSolicitacoes] =
    useState(false);

  const [loadingConversas, setLoadingConversas] =
    useState(false);

  const [loadingChat, setLoadingChat] =
    useState(false);

  const [criandoHorario, setCriandoHorario] =
    useState(false);

  const [excluindoId, setExcluindoId] =
    useState(null);

  const subscriptionChatRef =
    useRef(null);

  // =========================================================
  // AGENDA
  // =========================================================

  useEffect(() => {
    carregarAgenda();
  }, []);

  async function carregarAgenda() {
    try {
      setLoadingAgenda(true);

      const data =
        await buscarMinhaAgendaApi();

      setAgendaSlots(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error(
        "Erro ao buscar agenda:",
        error,
      );

      showToast?.(
        error.message ||
          "Erro ao carregar agenda",
      );
    } finally {
      setLoadingAgenda(false);
    }
  }

  // =========================================================
  // SOLICITAÇÕES + WEBSOCKET
  // =========================================================

  useEffect(() => {
    carregarSolicitacoes();

    carregarConversas();

    conectarChat((solicitacao) => {
      console.log(
        "📩 SOLICITAÇÃO RECEBIDA:",
        solicitacao,
      );

      setSolicitacoes((prev) => {
        const existe = prev.some(
          (item) =>
            item.id === solicitacao.id,
        );

        if (existe) {
          return prev.map((item) =>
            item.id === solicitacao.id
              ? solicitacao
              : item,
          );
        }

        return [
          solicitacao,
          ...prev,
        ];
      });

      if (
        solicitacao.status ===
        "PENDENTE"
      ) {
        showToast?.(
          `Nova solicitação de ${solicitacao.clienteNome}`,
        );
      }

      if (
        solicitacao.status ===
        "ACEITA"
      ) {
        carregarConversas();
      }
    });

    return () => {
      if (subscriptionChatRef.current) {
        subscriptionChatRef.current.unsubscribe();

        subscriptionChatRef.current =
          null;
      }
    };
  }, []);

  // =========================================================
  // SOLICITAÇÕES
  // =========================================================

  async function carregarSolicitacoes() {
    try {
      setLoadingSolicitacoes(true);

      const data =
        await buscarSolicitacoesMentorApi();

      setSolicitacoes(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error(
        "Erro ao buscar solicitações:",
        error,
      );
    } finally {
      setLoadingSolicitacoes(false);
    }
  }

  // =========================================================
  // CONVERSAS
  // =========================================================

  async function carregarConversas() {
    try {
      setLoadingConversas(true);

      const data =
        await buscarConversasMentorApi();

      setConversas(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error(
        "Erro ao buscar conversas:",
        error,
      );
    } finally {
      setLoadingConversas(false);
    }
  }

  // =========================================================
  // ACEITAR
  // =========================================================

  async function aceitarSolicitacao(
    solicitacao,
  ) {
    try {
      const resposta =
        await aceitarSolicitacaoApi(
          solicitacao.id,
        );

      setSolicitacoes((prev) =>
        prev.map((item) =>
          item.id === solicitacao.id
            ? resposta
            : item,
        ),
      );

      await carregarConversas();

      showToast?.(
        `Solicitação de ${solicitacao.clienteNome} aceita!`,
      );
    } catch (error) {
      console.error(
        "Erro ao aceitar solicitação:",
        error,
      );

      showToast?.(
        error.message ||
          "Erro ao aceitar solicitação",
      );
    }
  }

  // =========================================================
  // RECUSAR
  // =========================================================

  async function recusarSolicitacao(
    solicitacao,
  ) {
    const confirmou = window.confirm(
      `Deseja recusar a solicitação de ${solicitacao.clienteNome}?`,
    );

    if (!confirmou) {
      return;
    }

    try {
      const resposta =
        await recusarSolicitacaoApi(
          solicitacao.id,
        );

      setSolicitacoes((prev) =>
        prev.map((item) =>
          item.id === solicitacao.id
            ? resposta
            : item,
        ),
      );

      showToast?.(
        "Solicitação recusada.",
      );
    } catch (error) {
      console.error(
        "Erro ao recusar solicitação:",
        error,
      );

      showToast?.(
        error.message ||
          "Erro ao recusar solicitação",
      );
    }
  }

  // =========================================================
  // ABRIR CONVERSA
  // =========================================================

  async function abrirConversa(
    conversaId,
  ) {
    try {
      setLoadingChat(true);

      setTextoMensagem("");

      /*
       * A conversa selecionada é alterada
       * antes de carregar as mensagens.
       *
       * Assim o campo de envio fica
       * sempre vinculado ao cliente
       * que foi clicado.
       */
      setConversaAtual(conversaId);

      const mensagens =
        await buscarMensagensApi(
          conversaId,
        );

      setMensagensChat(
        Array.isArray(mensagens)
          ? mensagens
          : [],
      );

      if (subscriptionChatRef.current) {
        subscriptionChatRef.current.unsubscribe();

        subscriptionChatRef.current =
          null;
      }

      const subscription =
        entrarNaConversa(
          conversaId,
          (evento) => {
            /*
             * Evento de exclusão.
             */
            if (evento?.mensagemId) {
              setMensagensChat((prev) =>
                prev.filter(
                  (mensagem) =>
                    Number(
                      mensagem.id,
                    ) !==
                    Number(
                      evento.mensagemId,
                    ),
                ),
              );

              return;
            }

            /*
             * Mensagem nova.
             */
            setMensagensChat((prev) => {
              const existe =
                prev.some(
                  (mensagem) =>
                    Number(
                      mensagem.id,
                    ) ===
                    Number(
                      evento.id,
                    ),
                );

              if (existe) {
                return prev;
              }

              return [
                ...prev,
                evento,
              ];
            });
          },
        );

      subscriptionChatRef.current =
        subscription;

      setActiveTab("chat");
    } catch (error) {
      console.error(
        "Erro ao abrir conversa:",
        error,
      );

      showToast?.(
        error.message ||
          "Erro ao abrir conversa",
      );

      setConversaAtual(null);
    } finally {
      setLoadingChat(false);
    }
  }

  function fecharConversa() {
    if (subscriptionChatRef.current) {
      subscriptionChatRef.current.unsubscribe();

      subscriptionChatRef.current =
        null;
    }

    setConversaAtual(null);

    setMensagensChat([]);

    setTextoMensagem("");
  }

  // =========================================================
  // ENVIAR
  // =========================================================

  function enviarMensagemChat() {
    const texto =
      textoMensagem.trim();

    if (!texto) {
      return;
    }

    if (!conversaAtual) {
      return;
    }

    enviarMensagem(
      conversaAtual,
      texto,
    );

    setTextoMensagem("");
  }

  // =========================================================
  // EXCLUIR MENSAGEM
  // =========================================================

  async function excluirMensagem(
    mensagemId,
  ) {
    if (!conversaAtual) {
      return;
    }

    const confirmou = window.confirm(
      "Deseja realmente excluir esta mensagem?",
    );

    if (!confirmou) {
      return;
    }

    try {
      await excluirMensagemApi(
        conversaAtual,
        mensagemId,
      );

      setMensagensChat((prev) =>
        prev.filter(
          (mensagem) =>
            Number(mensagem.id) !==
            Number(mensagemId),
        ),
      );

      showToast?.(
        "Mensagem excluída com sucesso!",
      );
    } catch (error) {
      console.error(
        "Erro ao excluir mensagem:",
        error,
      );

      showToast?.(
        error.message ||
          "Erro ao excluir mensagem",
      );
    }
  }

  // =========================================================
  // CRIAR HORÁRIO
  // =========================================================

  async function handleCriarHorario(
    event,
  ) {
    event.preventDefault();

    if (
      !novoHorario.dataHora ||
      !novoHorario.valor
    ) {
      showToast?.(
        "Preencha data, horário e valor.",
      );

      return;
    }

    try {
      setCriandoHorario(true);

      const [
        date,
        time,
      ] =
        novoHorario.dataHora.split(
          "T",
        );

      const payload = {
        dtMentoria: date,
        hrMentoria: time,
        valor: Number(
          novoHorario.valor,
        ),
      };

      const novo =
        await criarAgendaApi(
          payload,
        );

      setAgendaSlots((prev) => [
        ...prev,
        novo,
      ]);

      setNovoHorario({
        dataHora: "",
        valor: "",
      });

      showToast?.(
        "Horário criado com sucesso!",
      );
    } catch (error) {
      console.error(
        "Erro ao criar horário:",
        error,
      );

      showToast?.(
        error.message ||
          "Erro ao criar horário",
      );
    } finally {
      setCriandoHorario(false);
    }
  }

  // =========================================================
  // EXCLUIR HORÁRIO
  // =========================================================

  async function handleExcluirAgenda(
    id,
  ) {
    const confirmou = window.confirm(
      "Deseja realmente excluir este horário?",
    );

    if (!confirmou) {
      return;
    }

    try {
      setExcluindoId(id);

      await excluirAgendaApi(id);

      setAgendaSlots((prev) =>
        prev.filter(
          (item) => item.id !== id,
        ),
      );

      showToast?.(
        "Horário excluído com sucesso!",
      );
    } catch (error) {
      console.error(
        "Erro ao excluir agenda:",
        error,
      );

      showToast?.(
        error.message ||
          "Erro ao excluir horário",
      );
    } finally {
      setExcluindoId(null);
    }
  }

  // =========================================================
  // FORMATADORES
  // =========================================================

  function formatarData(data) {
    if (!data) {
      return "";
    }

    const partes =
      data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function formatarValor(valor) {
    return Number(
      valor || 0,
    ).toFixed(2);
  }

  function formatarHora(data) {
    if (!data) {
      return "";
    }

    return new Date(
      data,
    ).toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }

  // =========================================================
  // CONTADORES
  // =========================================================

  const pendentes =
    solicitacoes.filter(
      (item) =>
        item.status ===
        "PENDENTE",
    );

  const conversasCount =
    conversas.length;

  const conversaAtualObj =
    conversas.find(
      (conversa) =>
        Number(
          conversa.id,
        ) ===
        Number(
          conversaAtual,
        ),
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* ================================================= */}
      {/* MENU */}
      {/* ================================================= */}

      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            PAINEL MENTOR
          </div>

          <nav className="space-y-1">
            {/* AGENDA */}

            <button
              onClick={() => {
                fecharConversa();

                setActiveTab(
                  "agenda",
                );
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab ===
                "agenda"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-calendar-alt w-5"></i>

              <span>
                Minha Agenda
              </span>
            </button>

            {/* SOLICITAÇÕES */}

            <button
              onClick={() => {
                fecharConversa();

                setActiveTab(
                  "solicitacoes",
                );

                carregarSolicitacoes();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab ===
                "solicitacoes"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-user-clock w-5"></i>

                <span>
                  Solicitações
                </span>
              </div>

              {pendentes.length >
                0 && (
                <span className="bg-red-500 text-white text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {
                    pendentes.length
                  }
                </span>
              )}
            </button>

            {/* CHAT */}

            <button
              onClick={() => {
                setActiveTab(
                  "chat",
                );

                carregarConversas();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "chat"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-comments w-5"></i>

                <span>Chat</span>
              </div>

              {conversasCount >
                0 && (
                <span className="bg-white text-emerald-700 text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {
                    conversasCount
                  }
                </span>
              )}
            </button>
          </nav>
        </div>
      </aside>

      {/* ================================================= */}
      {/* CONTEÚDO */}
      {/* ================================================= */}

      <main className="flex-1">
        {/* ================================================= */}
        {/* AGENDA */}
        {/* ================================================= */}

        {activeTab ===
          "agenda" && (
          <div className="space-y-6">
            {/* CRIAR HORÁRIO */}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-5">
                Criar novo horário
              </h2>

              <form
                onSubmit={
                  handleCriarHorario
                }
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Data e horário
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      novoHorario.dataHora
                    }
                    onChange={(e) =>
                      setNovoHorario(
                        (prev) => ({
                          ...prev,
                          dataHora:
                            e.target
                              .value,
                        }),
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Valor
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      novoHorario.valor
                    }
                    onChange={(e) =>
                      setNovoHorario(
                        (prev) => ({
                          ...prev,
                          valor:
                            e.target
                              .value,
                        }),
                      )
                    }
                    placeholder="90.00"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={
                      criandoHorario
                    }
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {criandoHorario
                      ? "Criando..."
                      : "Criar Horário"}
                  </button>
                </div>
              </form>
            </div>

            {/* LISTA DA AGENDA */}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Minha Agenda
                </h2>

                <button
                  onClick={
                    carregarAgenda
                  }
                  className="text-sm text-emerald-600 font-semibold hover:underline"
                >
                  Atualizar
                </button>
              </div>

              {loadingAgenda ? (
                <div className="p-6 text-center text-slate-500">
                  Carregando agenda...
                </div>
              ) : agendaSlots.length ===
                0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 text-slate-500">
                  Nenhum horário cadastrado.
                </div>
              ) : (
                <div className="space-y-3">
                  {agendaSlots.map(
                    (slot) => (
                      <div
                        key={
                          slot.id
                        }
                        className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900">
                            {formatarData(
                              slot.dtMentoria,
                            )}
                            {" às "}
                            {
                              slot.hrMentoria
                            }
                          </h4>

                          <p className="text-sm text-slate-500 mt-1">
                            Valor: R${" "}
                            {formatarValor(
                              slot.valor,
                            )}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            ID:{" "}
                            {
                              slot.id
                            }
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              slot.situacao ===
                              "DISPONIVEL"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {
                              slot.situacao
                            }
                          </span>

                          {slot.situacao ===
                            "DISPONIVEL" && (
                            <button
                              onClick={() =>
                                handleExcluirAgenda(
                                  slot.id,
                                )
                              }
                              disabled={
                                excluindoId ===
                                slot.id
                              }
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                            >
                              {excluindoId ===
                              slot.id
                                ? "Excluindo..."
                                : "Excluir"}
                            </button>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* SOLICITAÇÕES */}
        {/* ================================================= */}

        {activeTab ===
          "solicitacoes" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Solicitações de Chat
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Clientes que desejam conversar com você.
                </p>
              </div>

              <button
                onClick={
                  carregarSolicitacoes
                }
                className="text-sm text-emerald-600 font-semibold hover:underline"
              >
                Atualizar
              </button>
            </div>

            {loadingSolicitacoes ? (
              <div className="p-8 text-center text-slate-500">
                Carregando solicitações...
              </div>
            ) : pendentes.length ===
              0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 text-slate-500">
                Nenhuma solicitação pendente.
              </div>
            ) : (
              <div className="space-y-4">
                {pendentes.map(
                  (solicitacao) => (
                    <div
                      key={
                        solicitacao.id
                      }
                      className="border border-slate-200 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            {solicitacao.clienteNome
                              ?.split(
                                " ",
                              )
                              .slice(
                                0,
                                2,
                              )
                              .map(
                                (
                                  parte,
                                ) =>
                                  parte[0],
                              )
                              .join(
                                "",
                              )
                              .toUpperCase()}
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-900">
                              {
                                solicitacao.clienteNome
                              }
                            </h3>

                            <p className="text-sm text-slate-500">
                              Solicitação de conversa
                            </p>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                          PENDENTE
                        </span>
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button
                          onClick={() =>
                            aceitarSolicitacao(
                              solicitacao,
                            )
                          }
                          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                        >
                          <i className="fas fa-check mr-2"></i>
                          Aceitar
                        </button>

                        <button
                          onClick={() =>
                            recusarSolicitacao(
                              solicitacao,
                            )
                          }
                          className="px-5 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100"
                        >
                          <i className="fas fa-times mr-2"></i>
                          Recusar
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================= */}
        {/* CHAT */}
        {/* ================================================= */}

        {activeTab === "chat" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex h-[700px]">
              {/* LISTA DE CONVERSAS */}

              <div className="w-80 border-r border-slate-200 flex flex-col">
                <div className="p-5 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-800">
                    Conversas
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Converse com seus clientes
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loadingConversas ? (
                    <div className="p-6 text-center text-slate-500">
                      Carregando conversas...
                    </div>
                  ) : conversas.length ===
                    0 ? (
                    <div className="p-6 text-center text-slate-500">
                      <i className="fas fa-comments text-3xl mb-3 text-slate-300"></i>

                      <p>
                        Nenhuma conversa encontrada.
                      </p>
                    </div>
                  ) : (
                    conversas.map(
                      (conversa) => {
                        const ativa =
                          Number(
                            conversaAtual,
                          ) ===
                          Number(
                            conversa.id,
                          );

                        return (
                          <button
                            key={
                              conversa.id
                            }
                            type="button"
                            onClick={() =>
                              abrirConversa(
                                conversa.id,
                              )
                            }
                            className={`w-full text-left p-4 border-b border-slate-100 transition ${
                              ativa
                                ? "bg-blue-50 border-l-4 border-l-blue-600"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                                {conversa.clienteNome
                                  ?.split(
                                    " ",
                                  )
                                  .slice(
                                    0,
                                    2,
                                  )
                                  .map(
                                    (
                                      parte,
                                    ) =>
                                      parte[0],
                                  )
                                  .join(
                                    "",
                                  )
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-800 truncate">
                                  {
                                    conversa.clienteNome
                                  }
                                </p>

                                <p className="text-xs text-slate-500 mt-1">
                                  Clique para abrir a conversa
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      },
                    )
                  )}
                </div>
              </div>

              {/* ÁREA DA CONVERSA */}

              <div className="flex-1 flex flex-col min-w-0">
                {!conversaAtual ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <i className="fas fa-comments text-5xl mb-4"></i>

                      <h3 className="text-lg font-semibold text-slate-600">
                        Nenhuma conversa selecionada
                      </h3>

                      <p className="text-sm mt-2">
                        Escolha um cliente ao lado para abrir o chat.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* CABEÇALHO */}

                    <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {conversaAtualObj?.clienteNome
                            ?.split(
                              " ",
                            )
                            .slice(
                              0,
                              2,
                            )
                            .map(
                              (
                                parte,
                              ) =>
                                parte[0],
                            )
                            .join(
                              "",
                            )
                            .toUpperCase()}
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-800">
                            {
                              conversaAtualObj?.clienteNome ||
                              "Cliente"
                            }
                          </h3>

                          <p className="text-xs text-green-600">
                            Conversa ativa
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          fecharConversa
                        }
                        className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Fechar conversa"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>

                    {/* MENSAGENS */}

                    <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-[#f5f7f9]">
                      {loadingChat ? (
                        <div className="h-full flex items-center justify-center text-slate-500">
                          Carregando mensagens...
                        </div>
                      ) : mensagensChat.length ===
                        0 ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center text-slate-400">
                            <i className="fas fa-comment-dots text-4xl mb-3"></i>

                            <p>
                              Nenhuma mensagem ainda.
                            </p>

                            <p className="text-sm mt-1">
                              Envie a primeira mensagem!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {mensagensChat.map(
                            (mensagem) => {
                              const minhaMensagem =
                                Number(
                                  mensagem.remetenteId,
                                ) ===
                                Number(
                                  user?.id,
                                );

                              return (
                                <div
                                  key={
                                    mensagem.id
                                  }
                                  className={`flex ${
                                    minhaMensagem
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                                      minhaMensagem
                                        ? "bg-blue-600 text-white rounded-br-md"
                                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {
                                          mensagem.conteudo
                                        }
                                      </p>

                                      {minhaMensagem && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            excluirMensagem(
                                              mensagem.id,
                                            )
                                          }
                                          className="text-xs opacity-70 hover:opacity-100 flex-shrink-0"
                                          title="Excluir mensagem"
                                        >
                                          <i className="fas fa-trash"></i>
                                        </button>
                                      )}
                                    </div>

                                    <p
                                      className={`text-[10px] mt-1 ${
                                        minhaMensagem
                                          ? "text-blue-100"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      {mensagem.dataEnvio
                                        ? new Date(
                                            mensagem.dataEnvio,
                                          ).toLocaleTimeString(
                                            "pt-BR",
                                            {
                                              hour: "2-digit",
                                              minute:
                                                "2-digit",
                                            },
                                          )
                                        : ""}
                                    </p>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>

                    {/* ENVIAR MENSAGEM */}

                    <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={
                            textoMensagem
                          }
                          onChange={(e) =>
                            setTextoMensagem(
                              e.target
                                .value,
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key ===
                              "Enter"
                            ) {
                              e.preventDefault();

                              enviarMensagemChat();
                            }
                          }}
                          placeholder="Digite sua mensagem..."
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        <button
                          type="button"
                          onClick={
                            enviarMensagemChat
                          }
                          disabled={
                            !textoMensagem.trim()
                          }
                          className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mt-2">
                        Enter para enviar
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}