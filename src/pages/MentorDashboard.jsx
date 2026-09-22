import React, {
  useEffect,
  useRef,
  useState,
} from "react";

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

export default function MentorDashboard({
  user,
  showToast,
}) {
  // =========================================================
  // ESTADOS
  // =========================================================

  const [activeTab, setActiveTab] =
    useState("agenda");

  const [agendaSlots, setAgendaSlots] =
    useState([]);

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

  // =========================================================
  // REFS
  // =========================================================

  const subscriptionSolicitacaoRef =
    useRef(null);

  const subscriptionChatRef =
    useRef(null);

  const mensagensEndRef =
    useRef(null);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    if (!conversaAtual) {
      return;
    }

    setTimeout(() => {
      mensagensEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  }, [
    mensagensChat,
    conversaAtual,
  ]);

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
        Array.isArray(data)
          ? data
          : [],
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

    const subscription =
      conectarChat(
        (solicitacao) => {
          console.log(
            "📩 SOLICITAÇÃO RECEBIDA:",
            solicitacao,
          );

          setSolicitacoes(
            (prev) => {
              const existe =
                prev.some(
                  (item) =>
                    Number(item.id) ===
                    Number(
                      solicitacao.id,
                    ),
                );

              if (existe) {
                return prev.map(
                  (item) =>
                    Number(item.id) ===
                    Number(
                      solicitacao.id,
                    )
                      ? solicitacao
                      : item,
                );
              }

              return [
                solicitacao,
                ...prev,
              ];
            },
          );

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
        },
      );

    subscriptionSolicitacaoRef.current =
      subscription;

    return () => {
      if (
        subscriptionSolicitacaoRef.current
      ) {
        subscriptionSolicitacaoRef.current.unsubscribe?.();

        subscriptionSolicitacaoRef.current =
          null;
      }

      if (
        subscriptionChatRef.current
      ) {
        subscriptionChatRef.current.unsubscribe?.();

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
      setLoadingSolicitacoes(
        true,
      );

      const data =
        await buscarSolicitacoesMentorApi();

      setSolicitacoes(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error) {
      console.error(
        "Erro ao buscar solicitações:",
        error,
      );
    } finally {
      setLoadingSolicitacoes(
        false,
      );
    }
  }

  // =========================================================
  // CONVERSAS
  // =========================================================

  async function carregarConversas() {
    try {
      setLoadingConversas(
        true,
      );

      const data =
        await buscarConversasMentorApi();

      setConversas(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error) {
      console.error(
        "Erro ao buscar conversas:",
        error,
      );
    } finally {
      setLoadingConversas(
        false,
      );
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

      setSolicitacoes(
        (prev) =>
          prev.map(
            (item) =>
              Number(item.id) ===
              Number(
                solicitacao.id,
              )
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
    const confirmou =
      window.confirm(
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

      setSolicitacoes(
        (prev) =>
          prev.map(
            (item) =>
              Number(item.id) ===
              Number(
                solicitacao.id,
              )
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

      if (
        subscriptionChatRef.current
      ) {
        subscriptionChatRef.current.unsubscribe?.();

        subscriptionChatRef.current =
          null;
      }

      setConversaAtual(
        conversaId,
      );

      const mensagens =
        await buscarMensagensApi(
          conversaId,
        );

      setMensagensChat(
        Array.isArray(mensagens)
          ? mensagens
          : [],
      );

      const subscription =
        entrarNaConversa(
          conversaId,
          (evento) => {
            // =============================================
            // EXCLUSÃO
            // =============================================

            if (
              evento?.mensagemId
            ) {
              setMensagensChat(
                (prev) =>
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

            // =============================================
            // NOVA MENSAGEM
            // =============================================

            if (
              !evento?.id
            ) {
              return;
            }

            setMensagensChat(
              (prev) => {
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
              },
            );
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

  // =========================================================
  // FECHAR CONVERSA
  // =========================================================

  function fecharConversa() {
    if (
      subscriptionChatRef.current
    ) {
      subscriptionChatRef.current.unsubscribe?.();

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

    const confirmou =
      window.confirm(
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

      setMensagensChat(
        (prev) =>
          prev.filter(
            (mensagem) =>
              Number(
                mensagem.id,
              ) !==
              Number(
                mensagemId,
              ),
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

      setAgendaSlots(
        (prev) => [
          ...prev,
          novo,
        ],
      );

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
    const confirmou =
      window.confirm(
        "Deseja realmente excluir este horário?",
      );

    if (!confirmou) {
      return;
    }

    try {
      setExcluindoId(id);

      await excluirAgendaApi(id);

      setAgendaSlots(
        (prev) =>
          prev.filter(
            (item) =>
              item.id !== id,
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

  function formatarData(
    data,
  ) {
    if (!data) {
      return "";
    }

    const partes =
      data.split("-");

    if (
      partes.length !== 3
    ) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function formatarValor(
    valor,
  ) {
    return Number(
      valor || 0,
    ).toFixed(2);
  }

  function formatarMensagemHora(
    data,
  ) {
    if (!data) {
      return "";
    }

    const dataObj =
      new Date(data);

    if (
      Number.isNaN(
        dataObj.getTime(),
      )
    ) {
      return "";
    }

    return dataObj.toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }

  function gerarIniciais(
    nome,
  ) {
    if (!nome) {
      return "?";
    }

    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (parte) =>
          parte[0],
      )
      .join("")
      .toUpperCase();
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

            <button
              onClick={() => {
                fecharConversa();

                setActiveTab(
                  "agenda",
                );
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab ===
                "agenda"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-calendar-alt w-5"></i>

              <span>
                Minha Agenda
              </span>
            </button>

            <button
              onClick={() => {
                fecharConversa();

                setActiveTab(
                  "solicitacoes",
                );

                carregarSolicitacoes();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab ===
                "solicitacoes"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
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
                <span className="bg-red-500 text-white text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center font-bold shadow-sm">
                  {
                    pendentes.length
                  }
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab(
                  "chat",
                );

                carregarConversas();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab ===
                "chat"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-comments w-5"></i>

                <span>
                  Chat
                </span>
              </div>

              {conversasCount >
                0 && (
                <span className="bg-white text-emerald-700 text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center font-bold shadow-sm">
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

      <main className="flex-1 min-w-0">

        {/* ================================================= */}
        {/* AGENDA */}
        {/* ================================================= */}

        {activeTab ===
          "agenda" && (
          <div className="space-y-6">

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
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="flex items-end">

                  <button
                    type="submit"
                    disabled={
                      criandoHorario
                    }
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {criandoHorario
                      ? "Criando..."
                      : "Criar Horário"}
                  </button>

                </div>

              </form>

            </div>

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
                        className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-slate-300 transition-colors"
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
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
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
                      className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors"
                    >

                      <div className="flex items-center justify-between gap-4">

                        <div className="flex items-center gap-4">

                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                            {gerarIniciais(
                              solicitacao.clienteNome,
                            )}
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
                          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
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
                          className="px-5 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100 active:scale-95 transition-all"
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
        {/* CHAT - REDESENHADO COM ANIMAÇÕES */}
        {/* ================================================= */}

        {activeTab ===
          "chat" && (
          <div className="bg-slate-100 rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all">

            <div className="flex h-[720px]">

              {/* ================================================= */}
              {/* LISTA DE CONVERSAS */}
              {/* ================================================= */}

              <div
                className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
                  conversaAtual
                    ? "hidden md:flex"
                    : "flex"
                }`}
              >

                <div className="p-4 border-b border-slate-100 bg-slate-50/70 backdrop-blur-sm">

                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <i className="fas fa-comments text-emerald-600"></i>
                    Conversas
                  </h2>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Seus clientes atendidos
                  </p>

                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">

                  {loadingConversas ? (

                    <div className="p-6 text-center text-slate-500 text-sm">
                      Carregando conversas...
                    </div>

                  ) : conversas.length ===
                    0 ? (

                    <div className="p-8 text-center text-slate-400">

                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <i className="fas fa-comments text-2xl text-slate-300"></i>
                      </div>

                      <p className="font-semibold text-slate-600">
                        Nenhuma conversa
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Suas conversas aparecerão aqui.
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
                            className={`w-full text-left px-4 py-3.5 transition-all duration-200 hover:bg-slate-50 ${
                              ativa
                                ? "bg-emerald-50/80 border-l-4 border-emerald-600"
                                : ""
                            }`}
                          >

                            <div className="flex items-center gap-3">

                              <div className="relative">
                                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                                  {gerarIniciais(
                                    conversa.clienteNome,
                                  )}
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                              </div>

                              <div className="min-w-0 flex-1">

                                <div className="flex items-center justify-between gap-1">

                                  <p className="font-semibold text-slate-800 text-sm truncate">
                                    {
                                      conversa.clienteNome
                                    }
                                  </p>

                                  {ativa && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                  )}

                                </div>

                                <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                                  <span>Clique para abrir conversa</span>
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

              {/* ================================================= */}
              {/* ÁREA DA CONVERSA */}
              {/* ================================================= */}

              <div
                className={`flex-1 min-w-0 flex flex-col bg-[#f0f2f5] ${
                  conversaAtual
                    ? "flex"
                    : "hidden md:flex"
                }`}
              >

                {!conversaAtual ? (

                  <div className="flex-1 flex items-center justify-center bg-slate-50/50">

                    <div className="text-center text-slate-400 p-6 max-w-sm">

                      <div className="w-20 h-20 rounded-3xl bg-emerald-50 shadow-inner mx-auto mb-5 flex items-center justify-center text-emerald-500 animate-bounce duration-1000">
                        <i className="fas fa-comments text-3xl"></i>
                      </div>

                      <h3 className="text-lg font-bold text-slate-700">
                        Atendimento ao Cliente
                      </h3>

                      <p className="text-xs mt-2 text-slate-400 leading-relaxed">
                        Escolha um cliente da lista para responder dúvidas e enviar orientações.
                      </p>

                    </div>

                  </div>

                ) : (

                  <>

                    {/* CABEÇALHO */}

                    <div className="h-[68px] flex-shrink-0 px-5 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs z-10">

                      <div className="flex items-center gap-3">

                        <button
                          type="button"
                          onClick={
                            fecharConversa
                          }
                          className="md:hidden w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <i className="fas fa-arrow-left"></i>
                        </button>

                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-xs">
                            {gerarIniciais(
                              conversaAtualObj?.clienteNome,
                            )}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>

                        <div>

                          <h3 className="font-bold text-slate-800 text-sm">
                            {
                              conversaAtualObj?.clienteNome ||
                              "Cliente"
                            }
                          </h3>

                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[11px] text-emerald-600 font-medium">
                              online agora
                            </span>
                          </div>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={
                          fecharConversa
                        }
                        className="hidden md:flex w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 items-center justify-center transition-all"
                        title="Fechar conversa"
                      >
                        <i className="fas fa-times"></i>
                      </button>

                    </div>

                    {/* MENSAGENS */}

                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 bg-[#e5ddd5]/30 bg-repeat">

                      {loadingChat ? (

                        <div className="h-full flex items-center justify-center">

                          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-sm text-sm text-slate-500 flex items-center gap-3">
                            <i className="fas fa-circle-notch fa-spin text-emerald-600 text-base"></i>
                            Carregando mensagens...
                          </div>

                        </div>

                      ) : mensagensChat.length ===
                        0 ? (

                        <div className="h-full flex items-center justify-center">

                          <div className="bg-white/95 rounded-2xl px-6 py-5 text-center shadow-xs border border-slate-100 max-w-xs">

                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                              <i className="fas fa-lock text-sm"></i>
                            </div>

                            <p className="text-sm font-bold text-slate-700">
                              Conversa Segura
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              Envie uma mensagem abaixo para iniciar seu atendimento.
                            </p>

                          </div>

                        </div>

                      ) : (

                        <div className="max-w-3xl mx-auto space-y-3">

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
                                  className={`flex w-full ${
                                    minhaMensagem
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >

                                  <div
                                    className={`group relative max-w-[82%] md:max-w-[68%] px-4 py-2.5 transition-all duration-200 transform hover:scale-[1.005] ${
                                      minhaMensagem
                                        ? "bg-emerald-600 text-white rounded-2xl rounded-tr-xs shadow-md shadow-emerald-900/10"
                                        : "bg-white text-slate-800 rounded-2xl rounded-tl-xs border border-slate-100 shadow-sm"
                                    }`}
                                  >

                                    <div className="flex flex-col gap-1">

                                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                        {
                                          mensagem.conteudo
                                        }
                                      </p>

                                      <div
                                        className={`flex items-center justify-end gap-1.5 mt-0.5 ${
                                          minhaMensagem
                                            ? "text-emerald-100"
                                            : "text-slate-400"
                                        }`}
                                      >

                                        <span className="text-[10px] opacity-80 whitespace-nowrap font-medium">
                                          {formatarMensagemHora(
                                            mensagem.dataEnvio,
                                          )}
                                        </span>

                                        {minhaMensagem && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              excluirMensagem(
                                                mensagem.id,
                                              )
                                            }
                                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300 text-[11px] ml-1 p-0.5"
                                            title="Excluir mensagem"
                                          >
                                            <i className="fas fa-trash-alt"></i>
                                          </button>
                                        )}

                                      </div>

                                    </div>

                                  </div>

                                </div>
                              );
                            },
                          )}

                          <div
                            ref={
                              mensagensEndRef
                            }
                          />

                        </div>

                      )}

                    </div>

                    {/* INPUT DE MENSAGEM */}

                    <div className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3 z-10">

                      <div className="max-w-3xl mx-auto flex items-center gap-2">

                        <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200/80 px-4 py-0.5 flex items-center focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">

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
                            onKeyDown={(
                              e,
                            ) => {
                              if (
                                e.key ===
                                "Enter"
                              ) {
                                e.preventDefault();

                                enviarMensagemChat();
                              }
                            }}
                            placeholder="Digite sua mensagem..."
                            className="w-full py-2.5 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                          />

                        </div>

                        <button
                          type="button"
                          onClick={
                            enviarMensagemChat
                          }
                          disabled={
                            !textoMensagem.trim()
                          }
                          className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shadow-sm shadow-emerald-600/30 flex-shrink-0"
                          title="Enviar mensagem"
                        >
                          <i className="fas fa-paper-plane text-sm"></i>
                        </button>

                      </div>

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