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

  const [activeTab, setActiveTab] = useState("agenda");
  const [agendaSlots, setAgendaSlots] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [conversas, setConversas] = useState([]);
  const [conversaAtual, setConversaAtual] = useState(null);
  const [mensagensChat, setMensagensChat] = useState([]);
  const [textoMensagem, setTextoMensagem] = useState("");
  
  // Estado para resposta de mensagem
  const [mensagemRespondendo, setMensagemRespondendo] = useState(null);

  const [novoHorario, setNovoHorario] = useState({
    dataHora: "",
    valor: "",
  });

  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false);
  const [loadingConversas, setLoadingConversas] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [criandoHorario, setCriandoHorario] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);

  // =========================================================
  // REFS
  // =========================================================

  const subscriptionSolicitacaoRef = useRef(null);
  const subscriptionChatRef = useRef(null);
  const mensagensEndRef = useRef(null);

  // =========================================================
  // HELPER PARA IDENTIFICAR MINHA MENSAGEM
  // =========================================================

  function eMinhaMensagem(mensagem) {
    if (!mensagem || !user) return false;
    const meuId = String(user.id || user.usuarioId || user.idUsuario || "");
    const remetenteId = String(
      mensagem.remetenteId ||
        mensagem.idRemetente ||
        mensagem.senderId ||
        mensagem.usuarioId ||
        mensagem.remetente?.id ||
        ""
    );

    if (meuId && remetenteId) {
      return meuId === remetenteId;
    }

    if (typeof mensagem.minhaMensagem === "boolean") {
      return mensagem.minhaMensagem;
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
  // AGENDA
  // =========================================================

  useEffect(() => {
    carregarAgenda();
  }, []);

  async function carregarAgenda() {
    try {
      setLoadingAgenda(true);
      const data = await buscarMinhaAgendaApi();
      setAgendaSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
      showToast?.(error.message || "Erro ao carregar agenda");
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

    const subscription = conectarChat((solicitacao) => {
      setSolicitacoes((prev) => {
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

      if (solicitacao.status === "PENDENTE") {
        showToast?.(`Nova solicitação de ${solicitacao.clienteNome}`);
      }
      if (solicitacao.status === "ACEITA") {
        carregarConversas();
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

  async function carregarSolicitacoes() {
    try {
      setLoadingSolicitacoes(true);
      const data = await buscarSolicitacoesMentorApi();
      setSolicitacoes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
    } finally {
      setLoadingSolicitacoes(false);
    }
  }

  async function carregarConversas() {
    try {
      setLoadingConversas(true);
      const data = await buscarConversasMentorApi();
      setConversas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
    } finally {
      setLoadingConversas(false);
    }
  }

  async function aceitarSolicitacao(solicitacao) {
    try {
      const resposta = await aceitarSolicitacaoApi(solicitacao.id);
      setSolicitacoes((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(solicitacao.id) ? resposta : item
        )
      );
      await carregarConversas();
      showToast?.(`Solicitação de ${solicitacao.clienteNome} aceita!`);
    } catch (error) {
      console.error("Erro ao aceitar solicitação:", error);
      showToast?.(error.message || "Erro ao aceitar solicitação");
    }
  }

  async function recusarSolicitacao(solicitacao) {
    const confirmou = window.confirm(
      `Deseja recusar a solicitação de ${solicitacao.clienteNome}?`
    );
    if (!confirmou) return;

    try {
      const resposta = await recusarSolicitacaoApi(solicitacao.id);
      setSolicitacoes((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(solicitacao.id) ? resposta : item
        )
      );
      showToast?.("Solicitação recusada.");
    } catch (error) {
      console.error("Erro ao recusar solicitação:", error);
      showToast?.(error.message || "Erro ao recusar solicitação");
    }
  }

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
  // ENVIAR MENSAGEM COM SUPORTE A RESPOSTA
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
  // AGENDA - AÇÕES
  // =========================================================

  async function handleCriarHorario(event) {
    event.preventDefault();

    if (!novoHorario.dataHora || !novoHorario.valor) {
      showToast?.("Preencha data, horário e valor.");
      return;
    }

    try {
      setCriandoHorario(true);
      const [date, time] = novoHorario.dataHora.split("T");

      const payload = {
        dtMentoria: date,
        hrMentoria: time,
        valor: Number(novoHorario.valor),
      };

      const novo = await criarAgendaApi(payload);
      setAgendaSlots((prev) => [...prev, novo]);
      setNovoHorario({ dataHora: "", valor: "" });
      showToast?.("Horário criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar horário:", error);
      showToast?.(error.message || "Erro ao criar horário");
    } finally {
      setCriandoHorario(false);
    }
  }

  async function handleExcluirAgenda(id) {
    const confirmou = window.confirm("Deseja realmente excluir este horário?");
    if (!confirmou) return;

    try {
      setExcluindoId(id);
      await excluirAgendaApi(id);
      setAgendaSlots((prev) => prev.filter((item) => item.id !== id));
      showToast?.("Horário excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir agenda:", error);
      showToast?.(error.message || "Erro ao excluir horário");
    } finally {
      setExcluindoId(null);
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

  const pendentes = solicitacoes.filter((item) => item.status === "PENDENTE");
  const conversaAtualObj = conversas.find(
    (c) => Number(c.id) === Number(conversaAtual)
  );

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* MENU */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            PAINEL MENTOR
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => {
                fecharConversa();
                setActiveTab("agenda");
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "agenda"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-calendar-alt w-5"></i>
              <span>Minha Agenda</span>
            </button>

            <button
              onClick={() => {
                fecharConversa();
                setActiveTab("solicitacoes");
                carregarSolicitacoes();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "solicitacoes"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-user-clock w-5"></i>
                <span>Solicitações</span>
              </div>
              {pendentes.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center font-bold">
                  {pendentes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("chat");
                carregarConversas();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "chat"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-comments w-5"></i>
                <span>Chat</span>
              </div>
              {conversas.length > 0 && (
                <span className="bg-white text-emerald-700 text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center font-bold">
                  {conversas.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 min-w-0">
        {/* AGENDA */}
        {activeTab === "agenda" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-5">
                Criar novo horário
              </h2>
              <form
                onSubmit={handleCriarHorario}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Data e horário
                  </label>
                  <input
                    type="datetime-local"
                    value={novoHorario.dataHora}
                    onChange={(e) =>
                      setNovoHorario((prev) => ({
                        ...prev,
                        dataHora: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
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
                    value={novoHorario.valor}
                    onChange={(e) =>
                      setNovoHorario((prev) => ({
                        ...prev,
                        valor: e.target.value,
                      }))
                    }
                    placeholder="90.00"
                    className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={criandoHorario}
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {criandoHorario ? "Criando..." : "Criar Horário"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Minha Agenda
                </h2>
                <button
                  onClick={carregarAgenda}
                  className="text-sm text-emerald-600 font-semibold hover:underline"
                >
                  Atualizar
                </button>
              </div>

              {loadingAgenda ? (
                <div className="p-6 text-center text-slate-500">
                  Carregando agenda...
                </div>
              ) : agendaSlots.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 text-slate-500">
                  Nenhum horário cadastrado.
                </div>
              ) : (
                <div className="space-y-3">
                  {agendaSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {formatarData(slot.dtMentoria)} às {slot.hrMentoria}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          Valor: R$ {formatarValor(slot.valor)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            slot.situacao === "DISPONIVEL"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {slot.situacao}
                        </span>
                        {slot.situacao === "DISPONIVEL" && (
                          <button
                            onClick={() => handleExcluirAgenda(slot.id)}
                            disabled={excluindoId === slot.id}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all disabled:opacity-50"
                          >
                            {excluindoId === slot.id ? "Excluindo..." : "Excluir"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SOLICITAÇÕES */}
        {activeTab === "solicitacoes" && (
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Solicitações de Chat
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Clientes que querem conversar com você.
                </p>
              </div>
              <button
                onClick={carregarSolicitacoes}
                className="text-sm text-emerald-600 font-semibold hover:underline"
              >
                Atualizar
              </button>
            </div>

            {loadingSolicitacoes ? (
              <div className="p-8 text-center text-slate-500">
                Carregando solicitações...
              </div>
            ) : pendentes.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 text-slate-500">
                Nenhuma solicitação pendente.
              </div>
            ) : (
              <div className="space-y-4">
                {pendentes.map((sol) => (
                  <div key={sol.id} className="border rounded-xl p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          {gerarIniciais(sol.clienteNome)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {sol.clienteNome}
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
                        onClick={() => aceitarSolicitacao(sol)}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
                      >
                        <i className="fas fa-check mr-2"></i>
                        Aceitar
                      </button>
                      <button
                        onClick={() => recusarSolicitacao(sol)}
                        className="px-5 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all"
                      >
                        <i className="fas fa-times mr-2"></i>
                        Recusar
                      </button>
                    </div>
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
                    Seus clientes atendidos
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {loadingConversas ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      Carregando conversas...
                    </div>
                  ) : conversas.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">
                        Nenhuma conversa
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Suas conversas aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    conversas.map((c) => {
                      const ativa = Number(conversaAtual) === Number(c.id);

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => abrirConversa(c.id)}
                          className={`w-full text-left px-4 py-3.5 transition-all hover:bg-slate-50 ${
                            ativa
                              ? "bg-emerald-50/80 border-l-4 border-emerald-600"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                              {gerarIniciais(c.clienteNome)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 text-sm truncate">
                                {c.clienteNome}
                              </p>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                Clique para abrir
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
                      <i className="fas fa-comments text-4xl text-emerald-500 mb-3"></i>
                      <h3 className="text-lg font-bold text-slate-700">
                        Atendimento ao Cliente
                      </h3>
                      <p className="text-xs mt-1 text-slate-400">
                        Escolha um cliente da lista para responder.
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
                          {gerarIniciais(conversaAtualObj?.clienteNome)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">
                            {conversaAtualObj?.clienteNome || "Cliente"}
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
                              Envie uma mensagem para começar.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-3xl mx-auto space-y-3">
                          {mensagensChat.map((mensagem) => {
                            const minha = eMinhaMensagem(mensagem);
                            const autorNome = minha
                              ? "Você"
                              : conversaAtualObj?.clienteNome || "Cliente";

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