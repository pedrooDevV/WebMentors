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

  const [activeTab, setActiveTab] = useState("explorar");
  const [searchQuery, setSearchQuery] = useState("");
  const [mentores, setMentores] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [agendaSlots, setAgendaSlots] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [chatSolicitacoes, setChatSolicitacoes] = useState([]);
  const [conversaAtual, setConversaAtual] = useState(null);
  const [mensagensChat, setMensagensChat] = useState([]);
  const [textoMensagem, setTextoMensagem] = useState("");
  
  // Estado para resposta de mensagem
  const [mensagemRespondendo, setMensagemRespondendo] = useState(null);

  const [loadingMentores, setLoadingMentores] = useState(false);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [agendandoId, setAgendandoId] = useState(null);
  const [erro, setErro] = useState("");

  // =========================================================
  // REFS
  // =========================================================

  const subscriptionSolicitacaoRef = useRef(null);
  const subscriptionChatRef = useRef(null);
  const mensagensEndRef = useRef(null);

  // =========================================================
  // HELPER PARA IDENTIFICAR MINHA MENSAGEM (CORRIGIDO)
  // =========================================================

  function eMinhaMensagem(mensagem) {
    if (!mensagem || !user) return false;

    // 1. Flags diretas enviadas pelo backend
    if (typeof mensagem.minhaMensagem === "boolean") return mensagem.minhaMensagem;
    if (typeof mensagem.isMine === "boolean") return mensagem.isMine;
    if (typeof mensagem.minha === "boolean") return mensagem.minha;

    // Extrai IDs (suporta números, strings e objetos aninhados)
    const obterId = (obj) => {
      if (!obj) return null;
      if (typeof obj === "number" || typeof obj === "string") return String(obj).trim();
      return (
        obj.id ||
        obj.usuarioId ||
        obj.idUsuario ||
        obj.clienteId ||
        obj.mentorId ||
        obj.codigo ||
        obj.sub ||
        obj.usuario?.id ||
        obj.user?.id ||
        null
      );
    };

    const meuId = String(obterId(user) || "").trim();
    const remetenteId = String(
      mensagem.remetenteId ||
        mensagem.idRemetente ||
        mensagem.senderId ||
        mensagem.usuarioId ||
        mensagem.clienteId ||
        mensagem.mentorId ||
        mensagem.autorId ||
        mensagem.remetente?.id ||
        mensagem.usuario?.id ||
        ""
    ).trim();

    // 2. Comparação por ID
    if (meuId && remetenteId && meuId === remetenteId) {
      return true;
    }

    // 3. Comparação por Email
    const meuEmail = String(user.email || user.usuario?.email || "").toLowerCase().trim();
    const remetenteEmail = String(
      mensagem.emailRemetente || mensagem.remetenteEmail || mensagem.remetente?.email || ""
    ).toLowerCase().trim();

    if (meuEmail && remetenteEmail && meuEmail === remetenteEmail) {
      return true;
    }

    // 4. Comparação por Nome (Fallback)
    const meuNome = String(user.nome || user.name || user.usuario?.nome || "").toLowerCase().trim();
    const nomeRemetente = String(
      mensagem.nomeRemetente ||
        mensagem.remetenteNome ||
        mensagem.autor ||
        mensagem.remetente?.nome ||
        ""
    ).toLowerCase().trim();

    if (meuNome && nomeRemetente && meuNome === nomeRemetente) {
      return true;
    }

    // 5. Comparação por Perfil/Role
    const tipoRemetente = String(
      mensagem.tipoRemetente || mensagem.remetenteTipo || mensagem.role || ""
    ).toUpperCase();

    if (tipoRemetente === "CLIENTE") {
      return true;
    }

    return false;
  }

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    if (!conversaAtual) return;
    setTimeout(() => {
      mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [mensagensChat, conversaAtual]);

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
      const data = await buscarMentoresApi();
      setMentores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar mentores:", error);
      setErro(error.message || "Erro ao carregar mentores");
    } finally {
      setLoadingMentores(false);
    }
  }

  // =========================================================
  // WEBSOCKET
  // =========================================================

  useEffect(() => {
    carregarSolicitacoesChat();

    const subscription = conectarChat((solicitacao) => {
      setChatSolicitacoes((prev) => {
        const existe = prev.some(
          (item) => Number(item.id) === Number(solicitacao.id)
        );
        if (existe) {
          return prev.map((item) =>
            Number(item.id) === Number(solicitacao.id) ? solicitacao : item
          );
        }
        return [solicitacao, ...prev];
      });

      if (solicitacao.status === "ACEITA") {
        showToast?.(`O mentor ${solicitacao.mentorNome} aceitou sua solicitação!`);
      }
      if (solicitacao.status === "RECUSADA") {
        showToast?.(`O mentor ${solicitacao.mentorNome} recusou sua solicitação.`);
      }
    });

    subscriptionSolicitacaoRef.current = subscription;

    return () => {
      if (subscriptionSolicitacaoRef.current) {
        subscriptionSolicitacaoRef.current.unsubscribe?.();
        subscriptionSolicitacaoRef.current = null;
      }
      if (subscriptionChatRef.current) {
        subscriptionChatRef.current.unsubscribe?.();
        subscriptionChatRef.current = null;
      }
    };
  }, []);

  // =========================================================
  // SOLICITAÇÕES
  // =========================================================

  async function carregarSolicitacoesChat() {
    try {
      const data = await buscarMinhasSolicitacoesChatApi();
      setChatSolicitacoes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    }
  }

  async function solicitarChat(mentor) {
    try {
      await solicitarChatApi(mentor.id);
      showToast?.("Solicitação enviada ao mentor!");
      await carregarSolicitacoesChat();
    } catch (error) {
      console.error("Erro ao solicitar chat:", error);
      showToast?.(error.message || "Erro ao enviar solicitação");
    }
  }

  // =========================================================
  // ABRIR MENTOR
  // =========================================================

  async function abrirMentor(mentor) {
    try {
      setSelectedMentor(mentor);
      setAgendaSlots([]);
      setLoadingAgenda(true);
      setErro("");
      const agenda = await buscarAgendaMentorApi(mentor.id);
      setAgendaSlots(Array.isArray(agenda) ? agenda : []);
    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
      setErro(error.message || "Erro ao carregar agenda");
    } finally {
      setLoadingAgenda(false);
    }
  }

  // =========================================================
  // AGENDAR
  // =========================================================

  async function agendarHorario(slot) {
    const confirmou = window.confirm(
      `Deseja agendar ${formatarData(slot.dtMentoria)} às ${slot.hrMentoria}?`
    );
    if (!confirmou) return;

    try {
      setAgendandoId(slot.id);
      const novoAgendamento = await agendarHorarioApi(slot.id);
      setAgendaSlots((prev) => prev.filter((item) => item.id !== slot.id));
      setAgendamentos((prev) => [...prev, novoAgendamento]);
      showToast?.("Agendamento realizado com sucesso!");
      setActiveTab("agendamentos");
      await carregarMeusAgendamentos();
    } catch (error) {
      console.error("Erro ao agendar:", error);
      showToast?.(error.message || "Erro ao realizar agendamento");
    } finally {
      setAgendandoId(null);
    }
  }

  // =========================================================
  // AGENDAMENTOS
  // =========================================================

  async function carregarMeusAgendamentos() {
    try {
      setLoadingAgendamentos(true);
      setErro("");
      const data = await buscarMeusAgendamentosApi();
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      setErro(error.message || "Erro ao carregar agendamentos");
    } finally {
      setLoadingAgendamentos(false);
    }
  }

  useEffect(() => {
    if (activeTab === "agendamentos") {
      carregarMeusAgendamentos();
    }
  }, [activeTab]);

  // =========================================================
  // ABRIR CONVERSA
  // =========================================================

  async function abrirConversa(conversaId) {
    try {
      setLoadingChat(true);
      setTextoMensagem("");
      setMensagemRespondendo(null);

      if (subscriptionChatRef.current) {
        subscriptionChatRef.current.unsubscribe?.();
        subscriptionChatRef.current = null;
      }

      setConversaAtual(conversaId);
      const mensagens = await buscarMensagensApi(conversaId);
      setMensagensChat(Array.isArray(mensagens) ? mensagens : []);

      const subscription = entrarNaConversa(conversaId, (evento) => {
        if (evento?.mensagemId) {
          setMensagensChat((prev) =>
            prev.filter((m) => Number(m.id) !== Number(evento.mensagemId))
          );
          return;
        }

        if (!evento?.id) return;

        setMensagensChat((prev) => {
          const existe = prev.some((m) => Number(m.id) === Number(evento.id));
          if (existe) return prev;
          return [...prev, evento];
        });
      });

      subscriptionChatRef.current = subscription;
      setActiveTab("chat");
    } catch (error) {
      console.error("Erro ao abrir conversa:", error);
      showToast?.(error.message || "Erro ao abrir conversa");
      setConversaAtual(null);
    } finally {
      setLoadingChat(false);
    }
  }

  function fecharConversa() {
    if (subscriptionChatRef.current) {
      subscriptionChatRef.current.unsubscribe?.();
      subscriptionChatRef.current = null;
    }
    setConversaAtual(null);
    setMensagensChat([]);
    setTextoMensagem("");
    setMensagemRespondendo(null);
  }

  // =========================================================
  // ENVIAR MENSAGEM
  // =========================================================

  function enviarMensagemChat() {
    const texto = textoMensagem.trim();
    if (!texto || !conversaAtual) return;

    let textoFinal = texto;
    if (mensagemRespondendo) {
      const conteudoLimpo = mensagemRespondendo.conteudo.replace(/\n/g, " ");
      textoFinal = `» ${mensagemRespondendo.autor}: ${conteudoLimpo}\n${texto}`;
    }

    enviarMensagem(conversaAtual, textoFinal);
    setTextoMensagem("");
    setMensagemRespondendo(null);
  }

  // =========================================================
  // EXCLUIR MENSAGEM
  // =========================================================

  async function excluirMensagem(mensagemId) {
    if (!conversaAtual) return;
    const confirmou = window.confirm("Deseja realmente excluir esta mensagem?");
    if (!confirmou) return;

    try {
      await excluirMensagemApi(conversaAtual, mensagemId);
      setMensagensChat((prev) =>
        prev.filter((m) => Number(m.id) !== Number(mensagemId))
      );
      showToast?.("Mensagem excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
      showToast?.(error.message || "Erro ao excluir mensagem");
    }
  }

  // =========================================================
  // FORMATADORES
  // =========================================================

  function formatarData(data) {
    if (!data) return "";
    const partes = data.split("-");
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function formatarValor(valor) {
    return Number(valor || 0).toFixed(2);
  }

  function formatarMensagemHora(data) {
    if (!data) return "";
    const dataObj = new Date(data);
    if (Number.isNaN(dataObj.getTime())) return "";
    return dataObj.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function gerarIniciais(nome) {
    if (!nome) return "?";
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }

  // =========================================================
  // FILTRO E VARIÁVEIS DE CHAT
  // =========================================================

  const mentoresFiltrados = mentores.filter((mentor) => {
    const termo = searchQuery.toLowerCase().trim();
    if (!termo) return true;
    return (
      mentor.nome?.toLowerCase().includes(termo) ||
      mentor.cargo?.toLowerCase().includes(termo) ||
      mentor.biografia?.toLowerCase().includes(termo)
    );
  });

  const solicitacaoAtual = chatSolicitacoes.find(
    (item) => Number(item.conversaId) === Number(conversaAtual)
  );

  const chatsAceitos = chatSolicitacoes.filter(
    (item) => item.status === "ACEITA" && item.conversaId
  );

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* MENU */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            PAINEL CLIENTE
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => {
                fecharConversa();
                setActiveTab("explorar");
                setSelectedMentor(null);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "explorar"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-search w-5"></i>
              <span>Buscar Mentores</span>
            </button>

            <button
              onClick={() => {
                fecharConversa();
                setActiveTab("agendamentos");
                setSelectedMentor(null);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "agendamentos"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-calendar-check w-5"></i>
              <span>Meus Agendamentos</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("chat");
                setSelectedMentor(null);
                carregarSolicitacoesChat();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "chat"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-comments w-5"></i>
                <span>Chat com Mentor</span>
              </div>
              {chatsAceitos.length > 0 && (
                <span className="bg-white text-emerald-700 text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center font-bold">
                  {chatsAceitos.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 min-w-0">
        {erro && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {erro}
          </div>
        )}

        {/* EXPLORAR */}
        {activeTab === "explorar" && !selectedMentor && (
          <div>
            <input
              type="text"
              placeholder="Buscar mentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white mb-6 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {loadingMentores ? (
              <div className="bg-white rounded-2xl border p-8 text-center text-slate-500">
                Carregando mentores...
              </div>
            ) : mentoresFiltrados.length === 0 ? (
              <div className="bg-white rounded-2xl border p-8 text-center text-slate-500">
                Nenhum mentor encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mentoresFiltrados.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                        {gerarIniciais(mentor.nome)}
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {mentor.nome}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                        {mentor.cargo || "Mentor profissional"}
                      </p>
                      <p className="text-sm text-slate-600 mb-5">
                        {mentor.biografia || "Mentor disponível para orientação."}
                      </p>
                    </div>
                    <button
                      onClick={() => abrirMentor(mentor)}
                      className="px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
                    >
                      Ver Perfil e Agenda
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PERFIL DO MENTOR */}
        {activeTab === "explorar" && selectedMentor && (
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <button
              onClick={() => setSelectedMentor(null)}
              className="mb-6 text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              ← Voltar
            </button>
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                  {gerarIniciais(selectedMentor.nome)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedMentor.nome}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedMentor.cargo}
                  </p>
                </div>
              </div>
              <p className="text-slate-600 mt-5">{selectedMentor.biografia}</p>
              <button
                onClick={() => solicitarChat(selectedMentor)}
                className="mt-5 px-5 py-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-all"
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
              ) : agendaSlots.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-50 border text-sm text-slate-500">
                  Este mentor não possui horários disponíveis no momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agendaSlots.map((slot) => (
                    <button
                      key={slot.id}
                      disabled={agendandoId === slot.id}
                      onClick={() => agendarHorario(slot)}
                      className="p-4 border border-emerald-200 rounded-xl bg-emerald-50 text-emerald-800 text-left hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                    >
                      <div className="font-bold">
                        {formatarData(slot.dtMentoria)}
                      </div>
                      <div className="text-lg font-bold">
                        {slot.hrMentoria}
                      </div>
                      <div className="text-sm mt-1">
                        R$ {formatarValor(slot.valor)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AGENDAMENTOS */}
        {activeTab === "agendamentos" && (
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800">
                Meus Agendamentos
              </h2>
              <button
                onClick={carregarMeusAgendamentos}
                className="text-sm text-emerald-600 font-semibold hover:underline"
              >
                Atualizar
              </button>
            </div>

            {loadingAgendamentos ? (
              <div className="p-6 text-center text-slate-500">
                Carregando agendamentos...
              </div>
            ) : agendamentos.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-50 text-center text-slate-500">
                Você ainda não possui agendamentos.
              </div>
            ) : (
              <div className="space-y-3">
                {agendamentos.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 border rounded-xl flex flex-col md:flex-row md:justify-between md:items-center gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {item.mentorNome}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {item.mentorCargo}
                      </p>
                      <p className="text-sm text-slate-600 mt-2">
                        {formatarData(item.dtMentoria)} às {item.hrMentoria}
                      </p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        R$ {formatarValor(item.valor)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.situacao === "AGENDADA"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.situacao}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT REFORMULADO */}
        {activeTab === "chat" && (
          <div className="bg-slate-100 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="flex h-[720px]">
              {/* LISTA DE CONVERSAS */}
              <div
                className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col ${
                  conversaAtual ? "hidden md:flex" : "flex"
                }`}
              >
                <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <i className="fas fa-comments text-emerald-600"></i>
                    Conversas
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seus mentores disponíveis
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {chatsAceitos.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">
                        Nenhuma conversa
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Solicitações aceitas aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    chatsAceitos.map((sol) => {
                      const ativa =
                        Number(conversaAtual) === Number(sol.conversaId);

                      return (
                        <button
                          key={sol.id}
                          type="button"
                          onClick={() => abrirConversa(sol.conversaId)}
                          className={`w-full text-left px-4 py-3.5 transition-all hover:bg-slate-50 ${
                            ativa
                              ? "bg-emerald-50/80 border-l-4 border-emerald-600"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                              {gerarIniciais(sol.mentorNome)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 text-sm truncate">
                                {sol.mentorNome}
                              </p>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                Clique para conversar
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* PAINEL MENSAGENS */}
              <div
                className={`flex-1 min-w-0 flex flex-col bg-[#f0f2f5] ${
                  conversaAtual ? "flex" : "hidden md:flex"
                }`}
              >
                {!conversaAtual ? (
                  <div className="flex-1 flex items-center justify-center bg-slate-50/50">
                    <div className="text-center text-slate-400 p-6">
                      <i className="fas fa-paper-plane text-4xl text-emerald-500 mb-3"></i>
                      <h3 className="text-lg font-bold text-slate-700">
                        Seu Chat de Mentoria
                      </h3>
                      <p className="text-xs mt-1 text-slate-400">
                        Selecione uma conversa ao lado para conversar.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* CABEÇALHO DA CONVERSA */}
                    <div className="h-[68px] flex-shrink-0 px-5 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={fecharConversa}
                          className="md:hidden w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                        >
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          {gerarIniciais(solicitacaoAtual?.mentorNome)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">
                            {solicitacaoAtual?.mentorNome || "Mentor"}
                          </h3>
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            online agora
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={fecharConversa}
                        className="hidden md:flex w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 items-center justify-center"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>

                    {/* CORPO DE MENSAGENS */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 bg-[#e5ddd5]/30">
                      {loadingChat ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="bg-white rounded-2xl px-6 py-4 shadow-sm text-sm text-slate-500 flex items-center gap-3">
                            <i className="fas fa-circle-notch fa-spin text-emerald-600"></i>
                            Carregando mensagens...
                          </div>
                        </div>
                      ) : mensagensChat.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="bg-white rounded-2xl px-6 py-5 text-center shadow-xs border border-slate-100 max-w-xs">
                            <p className="text-sm font-bold text-slate-700">
                              Nenhuma mensagem ainda
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Envie a primeira mensagem para começar.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-3xl mx-auto space-y-3">
                          {mensagensChat.map((mensagem) => {
                            const minha = eMinhaMensagem(mensagem);

                            const nomeRemetenteMensagem =
                              mensagem.nomeRemetente ||
                              mensagem.remetenteNome ||
                              mensagem.autor ||
                              mensagem.remetente?.nome;

                            const autorNome = minha
                              ? "Você"
                              : nomeRemetenteMensagem ||
                                solicitacaoAtual?.mentorNome ||
                                "Mentor";

                            return (
                              <div
                                key={mensagem.id}
                                className={`flex w-full ${
                                  minha ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`group relative max-w-[85%] md:max-w-[70%] px-4 py-2.5 transition-all ${
                                    minha
                                      ? "bg-emerald-600 text-white rounded-2xl rounded-tr-none shadow-md"
                                      : "bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm"
                                  }`}
                                >
                                  {/* NOME DO REMETENTE */}
                                  <span
                                    className={`text-[11px] font-bold block mb-1 ${
                                      minha
                                        ? "text-emerald-100 text-right"
                                        : "text-emerald-700 text-left"
                                    }`}
                                  >
                                    {autorNome}
                                  </span>

                                  {/* MENSAGEM COM SUPORTE A CITAÇÃO */}
                                  {mensagem.conteudo?.startsWith("» ") ? (
                                    <div>
                                      <div
                                        className={`text-xs p-2 rounded-lg mb-1.5 border-l-4 ${
                                          minha
                                            ? "bg-emerald-700/60 border-emerald-200 text-emerald-50"
                                            : "bg-slate-100 border-emerald-500 text-slate-600"
                                        }`}
                                      >
                                        <span className="font-semibold block opacity-90 text-[11px]">
                                          {mensagem.conteudo
                                            .split("\n")[0]
                                            .substring(2)}
                                        </span>
                                      </div>
                                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                        {mensagem.conteudo
                                          .split("\n")
                                          .slice(1)
                                          .join("\n")}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                      {mensagem.conteudo}
                                    </p>
                                  )}

                                  {/* RODA PÉ DA MENSAGEM */}
                                  <div
                                    className={`flex items-center justify-end gap-2 mt-1 ${
                                      minha
                                        ? "text-emerald-100"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    <span className="text-[10px] opacity-80 whitespace-nowrap font-medium">
                                      {formatarMensagemHora(
                                        mensagem.dataEnvio
                                      )}
                                    </span>

                                    {/* BOTÃO RESPONDER */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMensagemRespondendo({
                                          id: mensagem.id,
                                          conteudo: mensagem.conteudo,
                                          autor: autorNome,
                                        })
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-300 text-[11px] p-0.5"
                                      title="Responder"
                                    >
                                      <i className="fas fa-reply"></i>
                                    </button>

                                    {/* BOTÃO EXCLUIR */}
                                    {minha && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          excluirMensagem(mensagem.id)
                                        }
                                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300 text-[11px] p-0.5"
                                        title="Excluir"
                                      >
                                        <i className="fas fa-trash-alt"></i>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={mensagensEndRef} />
                        </div>
                      )}
                    </div>

                    {/* ÁREA DE DIGITAÇÃO COM BARRA DE RESPOSTA */}
                    <div className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3 z-10">
                      <div className="max-w-3xl mx-auto flex flex-col gap-2">
                        {/* BARRA PREVIA DA RESPOSTA */}
                        {mensagemRespondendo && (
                          <div className="flex items-center justify-between bg-emerald-50 border-l-4 border-emerald-600 p-2.5 rounded-r-xl text-xs">
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="font-bold text-emerald-800 block">
                                Respondendo a {mensagemRespondendo.autor}
                              </span>
                              <p className="text-slate-600 truncate">
                                {mensagemRespondendo.conteudo}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setMensagemRespondendo(null)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 px-4 py-0.5 flex items-center focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                            <input
                              type="text"
                              value={textoMensagem}
                              onChange={(e) => setTextoMensagem(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
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
                            onClick={enviarMensagemChat}
                            disabled={!textoMensagem.trim()}
                            className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-sm flex-shrink-0"
                          >
                            <i className="fas fa-paper-plane text-sm"></i>
                          </button>
                        </div>
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