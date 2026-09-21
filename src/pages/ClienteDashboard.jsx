import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  buscarMentoresApi,
  buscarAgendaMentorApi,
  agendarHorarioApi,
  buscarMeusAgendamentosApi,
  solicitarChatApi,
  buscarMinhasSolicitacoesChatApi,
  buscarMensagensApi,
  excluirMensagemApi,
} from "../services/api";

import {
  conectarChat,
  entrarNaConversa,
  enviarMensagem,
} from "../services/chatSocket";

export default function ClienteDashboard({
  user,
  showToast,
}) {
  // =========================================================
  // ESTADOS
  // =========================================================

  const [activeTab, setActiveTab] =
    useState("explorar");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [mentores, setMentores] =
    useState([]);

  const [selectedMentor, setSelectedMentor] =
    useState(null);

  const [agendaSlots, setAgendaSlots] =
    useState([]);

  const [agendamentos, setAgendamentos] =
    useState([]);

  const [chatSolicitacoes, setChatSolicitacoes] =
    useState([]);

  const [conversaAtual, setConversaAtual] =
    useState(null);

  const [mensagensChat, setMensagensChat] =
    useState([]);

  const [textoMensagem, setTextoMensagem] =
    useState("");

  const [loadingMentores, setLoadingMentores] =
    useState(false);

  const [loadingAgenda, setLoadingAgenda] =
    useState(false);

  const [loadingAgendamentos, setLoadingAgendamentos] =
    useState(false);

  const [loadingChat, setLoadingChat] =
    useState(false);

  const [agendandoId, setAgendandoId] =
    useState(null);

  const [erro, setErro] =
    useState("");

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
  // MENTORES
  // =========================================================

  useEffect(() => {
    carregarMentores();
  }, []);

  async function carregarMentores() {
    try {
      setLoadingMentores(true);
      setErro("");

      const data =
        await buscarMentoresApi();

      setMentores(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error) {
      console.error(
        "Erro ao buscar mentores:",
        error,
      );

      setErro(
        error.message ||
          "Erro ao carregar mentores",
      );
    } finally {
      setLoadingMentores(false);
    }
  }

  // =========================================================
  // WEBSOCKET
  // =========================================================

  useEffect(() => {
    carregarSolicitacoesChat();

    const subscription =
      conectarChat(
        (solicitacao) => {
          console.log(
            "📩 SOLICITAÇÃO RECEBIDA:",
            solicitacao,
          );

          setChatSolicitacoes(
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
            "ACEITA"
          ) {
            showToast?.(
              `O mentor ${solicitacao.mentorNome} aceitou sua solicitação!`,
            );
          }

          if (
            solicitacao.status ===
            "RECUSADA"
          ) {
            showToast?.(
              `O mentor ${solicitacao.mentorNome} recusou sua solicitação.`,
            );
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

  async function carregarSolicitacoesChat() {
    try {
      const data =
        await buscarMinhasSolicitacoesChatApi();

      setChatSolicitacoes(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error) {
      console.error(
        "Erro ao carregar solicitações:",
        error,
      );
    }
  }

  async function solicitarChat(
    mentor,
  ) {
    try {
      await solicitarChatApi(
        mentor.id,
      );

      showToast?.(
        "Solicitação enviada ao mentor!",
      );

      await carregarSolicitacoesChat();
    } catch (error) {
      console.error(
        "Erro ao solicitar chat:",
        error,
      );

      showToast?.(
        error.message ||
          "Erro ao enviar solicitação",
      );
    }
  }

  // =========================================================
  // ABRIR MENTOR
  // =========================================================

  async function abrirMentor(
    mentor,
  ) {
    try {
      setSelectedMentor(mentor);
      setAgendaSlots([]);
      setLoadingAgenda(true);
      setErro("");

      const agenda =
        await buscarAgendaMentorApi(
          mentor.id,
        );

      setAgendaSlots(
        Array.isArray(agenda)
          ? agenda
          : [],
      );
    } catch (error) {
      console.error(
        "Erro ao buscar agenda:",
        error,
      );

      setErro(
        error.message ||
          "Erro ao carregar agenda",
      );
    } finally {
      setLoadingAgenda(false);
    }
  }

  // =========================================================
  // AGENDAR
  // =========================================================

  async function agendarHorario(
    slot,
  ) {
    const confirmou =
      window.confirm(
        `Deseja agendar ${formatarData(
          slot.dtMentoria,
        )} às ${
          slot.hrMentoria
        }?`,
      );

    if (!confirmou) {
      return;
    }

    try {
      setAgendandoId(slot.id);

      const novoAgendamento =
        await agendarHorarioApi(
          slot.id,
        );

      setAgendaSlots(
        (prev) =>
          prev.filter(
            (item) =>
              item.id !==
              slot.id,
          ),
      );

      setAgendamentos(
        (prev) => [
          ...prev,
          novoAgendamento,
        ],
      );

      showToast?.(
        "Agendamento realizado com sucesso!",
      );

      setActiveTab(
        "agendamentos",
      );

      await carregarMeusAgendamentos();
    } catch (error) {
      console.error(
        "Erro ao agendar:",
        error,
      );

      showToast?.(
        error.message ||
          "Erro ao realizar agendamento",
      );
    } finally {
      setAgendandoId(null);
    }
  }

  // =========================================================
  // AGENDAMENTOS
  // =========================================================

  async function carregarMeusAgendamentos() {
    try {
      setLoadingAgendamentos(
        true,
      );

      setErro("");

      const data =
        await buscarMeusAgendamentosApi();

      setAgendamentos(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error) {
      console.error(
        "Erro ao buscar agendamentos:",
        error,
      );

      setErro(
        error.message ||
          "Erro ao carregar agendamentos",
      );
    } finally {
      setLoadingAgendamentos(
        false,
      );
    }
  }

  useEffect(() => {
    if (
      activeTab ===
      "agendamentos"
    ) {
      carregarMeusAgendamentos();
    }
  }, [activeTab]);

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
            // MENSAGEM NOVA
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
  // FILTRO
  // =========================================================

  const mentoresFiltrados =
    mentores.filter(
      (mentor) => {
        const termo =
          searchQuery
            .toLowerCase()
            .trim();

        if (!termo) {
          return true;
        }

        return (
          mentor.nome
            ?.toLowerCase()
            .includes(termo) ||
          mentor.cargo
            ?.toLowerCase()
            .includes(termo) ||
          mentor.biografia
            ?.toLowerCase()
            .includes(termo)
        );
      },
    );

  // =========================================================
  // CHAT ATUAL
  // =========================================================

  const solicitacaoAtual =
    chatSolicitacoes.find(
      (item) =>
        Number(
          item.conversaId,
        ) ===
        Number(
          conversaAtual,
        ),
    );

  const chatsAceitos =
    chatSolicitacoes.filter(
      (item) =>
        item.status ===
          "ACEITA" &&
        item.conversaId,
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
            PAINEL CLIENTE
          </div>

          <nav className="space-y-1">

            <button
              onClick={() => {
                fecharConversa();
                setActiveTab(
                  "explorar",
                );
                setSelectedMentor(
                  null,
                );
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab ===
                "explorar"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-search w-5"></i>
              <span>
                Buscar Mentores
              </span>
            </button>

            <button
              onClick={() => {
                fecharConversa();

                setActiveTab(
                  "agendamentos",
                );

                setSelectedMentor(
                  null,
                );
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab ===
                "agendamentos"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-calendar-check w-5"></i>

              <span>
                Meus Agendamentos
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab(
                  "chat",
                );

                setSelectedMentor(
                  null,
                );

                carregarSolicitacoesChat();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab ===
                "chat"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-comments w-5"></i>

                <span>
                  Chat com Mentor
                </span>
              </div>

              {chatsAceitos.length >
                0 && (
                <span className="bg-white text-emerald-700 text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {
                    chatsAceitos.length
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

        {erro && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {erro}
          </div>
        )}

        {/* ================================================= */}
        {/* EXPLORAR */}
        {/* ================================================= */}

        {activeTab ===
          "explorar" &&
          !selectedMentor && (
            <div>

              <input
                type="text"
                placeholder="Buscar mentor..."
                value={
                  searchQuery
                }
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value,
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white mb-6 outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {loadingMentores ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                  Carregando mentores...
                </div>
              ) : mentoresFiltrados.length ===
                0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                  Nenhum mentor encontrado.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {mentoresFiltrados.map(
                    (mentor) => (
                      <div
                        key={
                          mentor.id
                        }
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
                      >

                        <div>

                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                            {gerarIniciais(
                              mentor.nome,
                            )}
                          </div>

                          <h3 className="font-bold text-slate-900 text-lg">
                            {
                              mentor.nome
                            }
                          </h3>

                          <p className="text-xs text-slate-500 mb-4">
                            {
                              mentor.cargo ||
                              "Mentor profissional"
                            }
                          </p>

                          <p className="text-sm text-slate-600 mb-5">
                            {
                              mentor.biografia ||
                              "Mentor disponível para compartilhar conhecimento e experiência."
                            }
                          </p>

                        </div>

                        <button
                          onClick={() =>
                            abrirMentor(
                              mentor,
                            )
                          }
                          className="px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                        >
                          Ver Perfil e Agenda
                        </button>

                      </div>
                    ),
                  )}

                </div>
              )}
            </div>
          )}

        {/* ================================================= */}
        {/* PERFIL */}
        {/* ================================================= */}

        {activeTab ===
          "explorar" &&
          selectedMentor && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

              <button
                onClick={() =>
                  setSelectedMentor(
                    null,
                  )
                }
                className="mb-6 text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Voltar
              </button>

              <div className="mb-8">

                <div className="flex items-center gap-4">

                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                    {gerarIniciais(
                      selectedMentor.nome,
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {
                        selectedMentor.nome
                      }
                    </h2>

                    <p className="text-sm text-slate-500">
                      {
                        selectedMentor.cargo
                      }
                    </p>
                  </div>

                </div>

                <p className="text-slate-600 mt-5">
                  {
                    selectedMentor.biografia
                  }
                </p>

                <button
                  onClick={() =>
                    solicitarChat(
                      selectedMentor,
                    )
                  }
                  className="mt-5 px-5 py-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition"
                >
                  <i className="fas fa-comments mr-2"></i>
                  Solicitar conversa prévia
                </button>

              </div>

              <div className="border-t pt-6">

                <h3 className="font-bold text-slate-800 text-lg mb-4">
                  Horários Disponíveis
                </h3>

                {loadingAgenda ? (
                  <div className="p-6 text-center text-slate-500">
                    Carregando horários...
                  </div>
                ) : agendaSlots.length ===
                  0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500">
                    Este mentor não possui horários disponíveis no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                    {agendaSlots.map(
                      (slot) => (
                        <button
                          key={
                            slot.id
                          }
                          disabled={
                            agendandoId ===
                            slot.id
                          }
                          onClick={() =>
                            agendarHorario(
                              slot,
                            )
                          }
                          className="p-4 border border-emerald-200 rounded-xl bg-emerald-50 text-emerald-800 text-left hover:bg-emerald-600 hover:text-white transition disabled:opacity-50"
                        >

                          <div className="font-bold">
                            {formatarData(
                              slot.dtMentoria,
                            )}
                          </div>

                          <div className="text-lg font-bold">
                            {
                              slot.hrMentoria
                            }
                          </div>

                          <div className="text-sm mt-1">
                            R${" "}
                            {formatarValor(
                              slot.valor,
                            )}
                          </div>

                        </button>
                      ),
                    )}

                  </div>
                )}

              </div>
            </div>
          )}

        {/* ================================================= */}
        {/* AGENDAMENTOS */}
        {/* ================================================= */}

        {activeTab ===
          "agendamentos" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-xl font-bold text-slate-800">
                Meus Agendamentos
              </h2>

              <button
                onClick={
                  carregarMeusAgendamentos
                }
                className="text-sm text-emerald-600 font-semibold hover:underline"
              >
                Atualizar
              </button>

            </div>

            {loadingAgendamentos ? (
              <div className="p-6 text-center text-slate-500">
                Carregando agendamentos...
              </div>
            ) : agendamentos.length ===
              0 ? (
              <div className="p-8 rounded-xl bg-slate-50 text-center text-slate-500">
                Você ainda não possui agendamentos.
              </div>
            ) : (
              <div className="space-y-3">

                {agendamentos.map(
                  (agendamento) => (
                    <div
                      key={
                        agendamento.id
                      }
                      className="p-5 border rounded-xl flex flex-col md:flex-row md:justify-between md:items-center gap-4"
                    >

                      <div>

                        <h4 className="font-bold text-slate-900">
                          {
                            agendamento.mentorNome
                          }
                        </h4>

                        <p className="text-sm text-slate-500">
                          {
                            agendamento.mentorCargo
                          }
                        </p>

                        <p className="text-sm text-slate-600 mt-2">
                          {formatarData(
                            agendamento.dtMentoria,
                          )}
                          {" às "}
                          {
                            agendamento.hrMentoria
                          }
                        </p>

                        <p className="text-sm font-semibold text-slate-700 mt-1">
                          R${" "}
                          {formatarValor(
                            agendamento.valor,
                          )}
                        </p>

                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          agendamento.situacao ===
                          "AGENDADA"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {
                          agendamento.situacao
                        }
                      </span>

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

        {activeTab ===
          "chat" && (
          <div className="bg-[#efeae2] rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

            <div className="flex h-[700px]">

              {/* ================================================= */}
              {/* LISTA */}
              {/* ================================================= */}

              <div
                className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col ${
                  conversaAtual
                    ? "hidden md:flex"
                    : "flex"
                }`}
              >

                <div className="p-5 border-b border-slate-200 bg-white">

                  <h2 className="text-lg font-bold text-slate-800">
                    Conversas
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Seus mentores
                  </p>

                </div>

                <div className="flex-1 overflow-y-auto">

                  {chatsAceitos.length ===
                  0 ? (
                    <div className="p-8 text-center text-slate-400">

                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <i className="fas fa-comments text-2xl text-slate-300"></i>
                      </div>

                      <p className="font-medium">
                        Nenhuma conversa
                      </p>

                      <p className="text-xs mt-1">
                        Suas conversas aparecerão aqui.
                      </p>

                    </div>
                  ) : (
                    chatsAceitos.map(
                      (solicitacao) => {

                        const ativa =
                          Number(
                            conversaAtual,
                          ) ===
                          Number(
                            solicitacao.conversaId,
                          );

                        return (
                          <button
                            key={
                              solicitacao.id
                            }
                            type="button"
                            onClick={() =>
                              abrirConversa(
                                solicitacao.conversaId,
                              )
                            }
                            className={`w-full text-left px-4 py-3 border-b border-slate-100 transition ${
                              ativa
                                ? "bg-slate-100"
                                : "hover:bg-slate-50"
                            }`}
                          >

                            <div className="flex items-center gap-3">

                              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                                {gerarIniciais(
                                  solicitacao.mentorNome,
                                )}
                              </div>

                              <div className="min-w-0 flex-1">

                                <div className="flex items-center justify-between gap-2">

                                  <p className="font-semibold text-slate-800 truncate">
                                    {
                                      solicitacao.mentorNome
                                    }
                                  </p>

                                  {ativa && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  )}

                                </div>

                                <p className="text-xs text-slate-500 truncate mt-1">
                                  Clique para conversar
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
              {/* CONVERSA */}
              {/* ================================================= */}

              <div
                className={`flex-1 min-w-0 flex flex-col ${
                  conversaAtual
                    ? "flex"
                    : "hidden md:flex"
                }`}
              >

                {!conversaAtual ? (

                  <div className="flex-1 flex items-center justify-center bg-[#efeae2]">

                    <div className="text-center text-slate-500">

                      <div className="w-20 h-20 rounded-full bg-white shadow-sm mx-auto mb-5 flex items-center justify-center">
                        <i className="fas fa-comments text-3xl text-slate-300"></i>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-600">
                        Seu WhatsApp
                      </h3>

                      <p className="text-sm mt-2 text-slate-500">
                        Escolha uma conversa para começar.
                      </p>

                    </div>

                  </div>

                ) : (

                  <>

                    {/* CABEÇALHO */}

                    <div className="h-[72px] flex-shrink-0 px-4 bg-[#f0f2f5] border-b border-slate-200 flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <button
                          type="button"
                          onClick={
                            fecharConversa
                          }
                          className="md:hidden w-9 h-9 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-600"
                        >
                          <i className="fas fa-arrow-left"></i>
                        </button>

                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          {gerarIniciais(
                            solicitacaoAtual?.mentorNome,
                          )}
                        </div>

                        <div>

                          <h3 className="font-semibold text-slate-800">
                            {
                              solicitacaoAtual?.mentorNome ||
                              "Mentor"
                            }
                          </h3>

                          <p className="text-xs text-emerald-600">
                            online
                          </p>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={
                          fecharConversa
                        }
                        className="hidden md:flex w-9 h-9 rounded-full hover:bg-slate-200 text-slate-500 items-center justify-center"
                        title="Fechar conversa"
                      >
                        <i className="fas fa-times"></i>
                      </button>

                    </div>

                    {/* MENSAGENS */}

                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 bg-[#efeae2]">

                      {loadingChat ? (

                        <div className="h-full flex items-center justify-center">

                          <div className="bg-white rounded-xl px-5 py-3 shadow-sm text-sm text-slate-500">
                            Carregando mensagens...
                          </div>

                        </div>

                      ) : mensagensChat.length ===
                        0 ? (

                        <div className="h-full flex items-center justify-center">

                          <div className="bg-white/90 rounded-xl px-5 py-4 text-center shadow-sm">

                            <i className="fas fa-lock text-slate-300 mb-2"></i>

                            <p className="text-sm font-medium text-slate-600">
                              Nenhuma mensagem ainda.
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              Envie uma mensagem para começar.
                            </p>

                          </div>

                        </div>

                      ) : (

                        <div className="max-w-4xl mx-auto space-y-2">

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
                                    className={`group relative max-w-[80%] md:max-w-[65%] px-3 py-2 shadow-sm ${
                                      minhaMensagem
                                        ? "bg-[#d9fdd3] rounded-tl-xl rounded-bl-xl rounded-br-md"
                                        : "bg-white rounded-tr-xl rounded-br-xl rounded-bl-md"
                                    }`}
                                  >

                                    <div className="flex items-end gap-2">

                                      <p className="text-[14px] leading-5 text-slate-800 whitespace-pre-wrap break-words">
                                        {
                                          mensagem.conteudo
                                        }
                                      </p>

                                      <div className="flex items-center gap-1 flex-shrink-0">

                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
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
                                            className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-500 text-[10px]"
                                            title="Excluir mensagem"
                                          >
                                            <i className="fas fa-trash"></i>
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

                    {/* INPUT */}

                    <div className="flex-shrink-0 bg-[#f0f2f5] px-3 py-3">

                      <div className="max-w-4xl mx-auto flex items-center gap-2">

                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 px-4 py-1 flex items-center">

                          <input
                            type="text"
                            value={
                              textoMensagem
                            }
                            onChange={(
                              e,
                            ) =>
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
                            placeholder="Digite uma mensagem"
                            className="w-full py-2.5 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
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
                          className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
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