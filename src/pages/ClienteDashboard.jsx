import React, { useEffect, useRef, useState } from "react";

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
  desconectarChat,
} from "../services/chatSocket";

export default function ClienteDashboard({ user, showToast }) {
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
  const [mensagemRespondendo, setMensagemRespondendo] = useState(null);

  const [loadingMentores, setLoadingMentores] = useState(false);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [agendandoId, setAgendandoId] = useState(null);
  const [erro, setErro] = useState("");

  const mensagensEndRef = useRef(null);
  const conversaAtualRef = useRef(null);

  const [usuariosOnline, setUsuariosOnline] = useState(new Set());
  const [novoCase, setNovoCase] = useState({
  titulo: "",
  descricao: "",
  valorEstipulado: "",
  especialidades: [] // IMPORTANTE: precisa começar como array vazio
});
const [tagInput, setTagInput] = useState("");
const [enviandoCase, setEnviandoCase] = useState(false);

  function obterIdUsuario(obj) {
    if (!obj) return null;

    if (typeof obj === "number" || typeof obj === "string") {
      return String(obj).trim();
    }

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
  }

  function eMinhaMensagem(mensagem) {
    if (!mensagem || !user) return false;

    if (typeof mensagem.minhaMensagem === "boolean") {
      return mensagem.minhaMensagem;
    }

    if (typeof mensagem.isMine === "boolean") {
      return mensagem.isMine;
    }

    if (typeof mensagem.minha === "boolean") {
      return mensagem.minha;
    }

    const meuId = String(obterIdUsuario(user) || "").trim();

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
        "",
    ).trim();

    if (meuId && remetenteId && meuId === remetenteId) {
      return true;
    }

    const meuEmail = String(user.email || user.usuario?.email || "")
      .toLowerCase()
      .trim();

    const remetenteEmail = String(
      mensagem.emailRemetente ||
        mensagem.remetenteEmail ||
        mensagem.remetente?.email ||
        "",
    )
      .toLowerCase()
      .trim();

    if (meuEmail && remetenteEmail && meuEmail === remetenteEmail) {
      return true;
    }

    const meuNome = String(user.nome || user.name || user.usuario?.nome || "")
      .toLowerCase()
      .trim();

    const nomeRemetente = String(
      mensagem.nomeRemetente ||
        mensagem.remetenteNome ||
        mensagem.autor ||
        mensagem.remetente?.nome ||
        "",
    )
      .toLowerCase()
      .trim();

    if (meuNome && nomeRemetente && meuNome === nomeRemetente) {
      return true;
    }

    return false;
  }

  useEffect(() => {
    if (!conversaAtual) return;

    const timer = setTimeout(() => {
      mensagensEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [mensagensChat, conversaAtual]);

  useEffect(() => {
    conversaAtualRef.current = conversaAtual;
  }, [conversaAtual]);

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

  useEffect(() => {
    let ativo = true;

    async function iniciarWebSocket() {
      try {
        await conectarChat(
          (solicitacao) => {
            setChatSolicitacoes((prev) => {
              const existe = prev.some(
                (item) => Number(item.id) === Number(solicitacao.id),
              );

              if (existe) {
                return prev.map((item) =>
                  Number(item.id) === Number(solicitacao.id)
                    ? solicitacao
                    : item,
                );
              }

              return [solicitacao, ...prev];
            });

            if (solicitacao.status === "ACEITA") {
              showToast?.(
                `O mentor ${solicitacao.mentorNome} aceitou sua solicitação!`,
              );
            }

            if (solicitacao.status === "RECUSADA") {
              showToast?.(
                `O mentor ${solicitacao.mentorNome} recusou sua solicitação.`,
              );
            }
          },

          (presenca) => {
            if (presenca.tipo === "SNAPSHOT") {
              setUsuariosOnline(
                new Set(
                  Array.isArray(presenca.usuarios) ? presenca.usuarios : [],
                ),
              );

              return;
            }

            if (!presenca.usuario) {
              return;
            }

            setUsuariosOnline((prev) => {
              const novo = new Set(prev);

              if (presenca.online) {
                novo.add(presenca.usuario);
              } else {
                novo.delete(presenca.usuario);
              }

              return novo;
            });
          },
        );

        if (ativo) {
          await carregarSolicitacoesChat();
        }
      } catch (error) {
        console.error("Erro ao iniciar WebSocket:", error);
      }
    }

    iniciarWebSocket();

    return () => {
      ativo = false;
      desconectarChat();
    };
  }, []);

  useEffect(() => {
    const conversasAceitas = chatSolicitacoes.filter(
      (item) => item.status === "ACEITA" && item.conversaId,
    );

    conversasAceitas.forEach((conversa) => {
      entrarNaConversa(conversa.conversaId, (evento) => {
        if (evento?.mensagemId) {
          if (
            Number(conversaAtualRef.current) === Number(conversa.conversaId)
          ) {
            setMensagensChat((prev) =>
              prev.filter((m) => Number(m.id) !== Number(evento.mensagemId)),
            );
          }

          return;
        }

        if (!evento?.id) {
          return;
        }

        if (Number(conversaAtualRef.current) !== Number(conversa.conversaId)) {
          return;
        }

        setMensagensChat((prev) => {
          const existe = prev.some((m) => Number(m.id) === Number(evento.id));

          if (existe) {
            return prev;
          }

          return [...prev, evento];
        });
      });
    });
  }, [chatSolicitacoes]);

  async function carregarSolicitacoesChat() {
    try {
      const data = await buscarMinhasSolicitacoesChatApi();

      setChatSolicitacoes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    }
  }

  /*

* =========================================================
* ENCONTRAR SOLICITAÇÃO DO CLIENTE PARA UM MENTOR
* =========================================================
  */
  function obterSolicitacaoDoMentor(mentorId) {
    return chatSolicitacoes.find(
      (item) => Number(item.mentorId) === Number(mentorId),
    );
  }

  /*

* =========================================================
* VERIFICAR SE PODE SOLICITAR CHAT
* =========================================================
*
* Pode solicitar quando:
*
* * não existe solicitação
* * solicitação está RECUSADA
*
* Não pode quando:
*
* * PENDENTE
* * ACEITA
*

*/
  function podeSolicitarChat(mentorId) {
    const solicitacao = obterSolicitacaoDoMentor(mentorId);

    if (!solicitacao) {
      return true;
    }

    if (solicitacao.status === "RECUSADA") {
      return true;
    }

    return false;
  }

  /*

* =========================================================
* TEXTO DO BOTÃO DE SOLICITAÇÃO
* =========================================================
  */
  function textoBotaoChat(mentorId) {
    const solicitacao = obterSolicitacaoDoMentor(mentorId);

    if (!solicitacao) {
      return "Solicitar conversa prévia";
    }

    if (solicitacao.status === "PENDENTE") {
      return "Solicitação pendente";
    }

    if (solicitacao.status === "ACEITA") {
      return "Conversa já aceita";
    }

    if (solicitacao.status === "RECUSADA") {
      return "Solicitar novamente";
    }

    return "Solicitar conversa prévia";
  }

  /*

* =========================================================
* SOLICITAR CHAT
* =========================================================
  */
  async function solicitarChat(mentor) {
    const solicitacao = obterSolicitacaoDoMentor(mentor.id);

    /*



 * Segurança adicional no frontend.
 *
 * PENDENTE e ACEITA não podem
 * gerar uma nova solicitação.
 */
    if (solicitacao && solicitacao.status !== "RECUSADA") {
      if (solicitacao.status === "PENDENTE") {
        showToast?.(
          "Você já possui uma solicitação pendente para esse mentor.",
        );
      }

      if (solicitacao.status === "ACEITA") {
        showToast?.("Você já possui uma conversa com esse mentor.");
      }

      return;
    }

    try {
      await solicitarChatApi(mentor.id);

      /*
       * Atualiza imediatamente a lista.
       */
      await carregarSolicitacoesChat();

      if (solicitacao?.status === "RECUSADA") {
        showToast?.("Nova solicitação enviada ao mentor!");
      } else {
        showToast?.("Solicitação enviada ao mentor!");
      }
    } catch (error) {
      console.error("Erro ao solicitar chat:", error);

      showToast?.(error.message || "Erro ao enviar solicitação");
    }
  }

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

  async function agendarHorario(slot) {
    const confirmou = window.confirm(
      `Deseja agendar ${formatarData(slot.dtMentoria)} às ${slot.hrMentoria}?`,
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

  async function abrirConversa(conversaId) {
    try {
      setLoadingChat(true);

      setTextoMensagem("");

      setMensagemRespondendo(null);

      setConversaAtual(conversaId);

      const mensagens = await buscarMensagensApi(conversaId);

      setMensagensChat(Array.isArray(mensagens) ? mensagens : []);

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
    setConversaAtual(null);
    setMensagensChat([]);
    setTextoMensagem("");
    setMensagemRespondendo(null);
  }

  async function enviarMensagemChat(event) {
    event?.preventDefault();

    if (enviandoMensagem) {
      return;
    }

    const texto = textoMensagem.trim();

    if (!texto) {
      return;
    }

    if (conversaAtual === null || conversaAtual === undefined) {
      console.error("❌ Nenhuma conversa selecionada");

      showToast?.("Selecione uma conversa.");

      return;
    }

    let textoFinal = texto;

    if (mensagemRespondendo) {
      const conteudoLimpo = String(mensagemRespondendo.conteudo || "").replace(
        /\n/g,
        " ",
      );

      textoFinal = `» ${mensagemRespondendo.autor}: ${conteudoLimpo}\n${texto}`;
    }

    try {
      setEnviandoMensagem(true);

      console.log("📤 CLIENTE ENVIANDO MENSAGEM", {
        conversaId: conversaAtual,
        conteudo: textoFinal,
      });

      const sucesso = await enviarMensagem(conversaAtual, textoFinal);

      if (!sucesso) {
        throw new Error("O WebSocket não conseguiu publicar a mensagem.");
      }

      console.log("✅ CLIENTE: mensagem enviada");

      setTextoMensagem("");
      setMensagemRespondendo(null);
    } catch (error) {
      console.error("❌ CLIENTE: erro ao enviar:", error);

      showToast?.(error.message || "Erro ao enviar mensagem");
    } finally {
      setEnviandoMensagem(false);
    }
  }

  async function excluirMensagem(mensagemId) {
    if (!conversaAtual) {
      return;
    }

    const confirmou = window.confirm("Deseja realmente excluir esta mensagem?");

    if (!confirmou) {
      return;
    }

    try {
      await excluirMensagemApi(conversaAtual, mensagemId);

      setMensagensChat((prev) =>
        prev.filter((m) => Number(m.id) !== Number(mensagemId)),
      );

      showToast?.("Mensagem excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);

      showToast?.(error.message || "Erro ao excluir mensagem");
    }
  }

  function formatarData(data) {
    if (!data) return "";

    const partes = data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function formatarValor(valor) {
    return Number(valor || 0).toFixed(2);
  }

  function formatarMensagemHora(data) {
    if (!data) return "";

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
      return "";
    }

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

  const mentoresFiltrados = mentores.filter((mentor) => {
    const termo = searchQuery.toLowerCase().trim();

    if (!termo) {
      return true;
    }

    return (
      mentor.nome?.toLowerCase().includes(termo) ||
      mentor.cargo?.toLowerCase().includes(termo) ||
      mentor.biografia?.toLowerCase().includes(termo)
    );
  });

  const solicitacaoAtual = chatSolicitacoes.find(
    (item) => Number(item.conversaId) === Number(conversaAtual),
  );

  const chatsAceitos = chatSolicitacoes.filter(
    (item) => item.status === "ACEITA" && item.conversaId,
  );

  return (
    <div className="flex flex-col md:flex-row gap-8">
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

                setActiveTab("cases");

                setSelectedMentor(null);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "cases"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fas fa-search w-5"></i>

              <span>Criar um case</span>
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

      <main className="flex-1 min-w-0">
        {erro && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {erro}
          </div>
        )}

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
                    className="bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                        {gerarIniciais(mentor.nome)}
                      </div>

                      <h3 className="font-bold text-slate-900 text-lg">
                        {mentor.nome}
                      </h3>

                      <p className="text-xs text-slate-500 mb-4">
                        {mentor.cargo}
                      </p>

                      <p className="text-sm text-slate-600 mb-5">
                        {mentor.biografia}
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
                disabled={!podeSolicitarChat(selectedMentor.id)}
                onClick={() => solicitarChat(selectedMentor)}
                className={`mt-5 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  podeSolicitarChat(selectedMentor.id)
                    ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <i className="fas fa-comments mr-2"></i>

                {textoBotaoChat(selectedMentor.id)}
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

                      <div className="text-lg font-bold">{slot.hrMentoria}</div>

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
                  <div key={item.id} className="p-5 border rounded-xl">
                    <h4 className="font-bold text-slate-900">
                      {item.mentorNome}
                    </h4>

                    <p className="text-sm text-slate-500">{item.mentorCargo}</p>

                    <p className="text-sm text-slate-600 mt-2">
                      {formatarData(item.dtMentoria)} às {item.hrMentoria}
                    </p>

                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      R$ {formatarValor(item.valor)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "cases" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Criar Novo Case
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Publique seu problema para encontrar mentores com as
                especialidades certas.
              </p>
            </div>

            <form onSubmit={handleCriarCase} className="space-y-6">
              {/* Título do Case */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Título do Case *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Otimização de Performance em Banco de Dados"
                  value={novoCase.titulo}
                  onChange={(e) =>
                    setNovoCase({ ...novoCase, titulo: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Descrição Detalhada *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Descreva o problema em detalhes e os objetivos esperados..."
                  value={novoCase.descricao}
                  onChange={(e) =>
                    setNovoCase({ ...novoCase, descricao: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              {/* Valor Estipulado */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Valor Estipulado (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 font-medium text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0,00"
                    value={novoCase.valorEstipulado}
                    onChange={(e) =>
                      setNovoCase({
                        ...novoCase,
                        valorEstipulado: e.target.value,
                      })
                    }
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Especialidades Necessárias */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Especialidades que podem ajudar *
                </label>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Ex: React, Postgres, DevOps..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarEspecialidade();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={adicionarEspecialidade}
                    className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-all"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Tags de Especialidades Adicionadas */}
                <div className="flex flex-wrap gap-2 min-h-[36px]">
                  {novoCase.especialidades.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      Nenhuma especialidade adicionada ainda.
                    </span>
                  ) : (
                    novoCase.especialidades.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removerEspecialidade(tag)}
                          className="hover:text-red-600 focus:outline-none ml-0.5"
                        >
                          <i className="fas fa-times text-[10px]"></i>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("explorar")}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={enviandoCase}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {enviandoCase ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      <span>Publicar Case</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="bg-slate-100 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="flex h-[720px]">
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
                    chatsAceitos.map((sol) => (
                      <button
                        key={sol.id}
                        type="button"
                        onClick={() => abrirConversa(sol.conversaId)}
                        className={`w-full text-left px-4 py-3.5 transition-all hover:bg-slate-50 ${
                          Number(conversaAtual) === Number(sol.conversaId)
                            ? "bg-emerald-50/80 border-l-4 border-emerald-600"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            {gerarIniciais(sol.mentorNome)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 text-sm truncate">
                              {sol.mentorNome}
                            </p>

                            <p className="text-xs text-slate-400">
                              conversa ativa
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

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
                    <div className="h-[68px] flex-shrink-0 px-5 bg-white border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={fecharConversa}
                          className="md:hidden w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
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

                          <span className="text-[11px] text-slate-400">
                            conversa
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

                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 bg-[#e5ddd5]/30">
                      {loadingChat ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="bg-white rounded-2xl px-6 py-4 shadow-sm text-sm text-slate-500">
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

                            const nomeRemetente =
                              mensagem.nomeRemetente ||
                              mensagem.remetenteNome ||
                              mensagem.autor ||
                              mensagem.remetente?.nome ||
                              "Mentor";

                            const autorNome = minha ? "Você" : nomeRemetente;

                            return (
                              <div
                                key={mensagem.id}
                                className={`flex w-full ${
                                  minha ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`group max-w-[85%] md:max-w-[70%] px-4 py-2.5 ${
                                    minha
                                      ? "bg-emerald-600 text-white rounded-2xl rounded-tr-none"
                                      : "bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-200"
                                  }`}
                                >
                                  <span
                                    className={`text-[11px] font-bold block mb-1 ${
                                      minha
                                        ? "text-emerald-100 text-right"
                                        : "text-emerald-700"
                                    }`}
                                  >
                                    {autorNome}
                                  </span>

                                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                    {mensagem.conteudo}
                                  </p>

                                  <div
                                    className={`flex items-center justify-end gap-2 mt-1 ${
                                      minha
                                        ? "text-emerald-100"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    <span className="text-[10px]">
                                      {formatarMensagemHora(mensagem.dataEnvio)}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMensagemRespondendo({
                                          id: mensagem.id,
                                          conteudo: mensagem.conteudo,
                                          autor: autorNome,
                                        })
                                      }
                                      className="opacity-0 group-hover:opacity-100 text-[11px]"
                                    >
                                      <i className="fas fa-reply"></i>
                                    </button>

                                    {minha && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          excluirMensagem(mensagem.id)
                                        }
                                        className="opacity-0 group-hover:opacity-100 text-[11px]"
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

                    <form
                      onSubmit={enviarMensagemChat}
                      className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3"
                    >
                      <div className="max-w-3xl mx-auto flex flex-col gap-2">
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
                          <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 px-4 flex items-center">
                            <input
                              type="text"
                              value={textoMensagem}
                              onChange={(e) => setTextoMensagem(e.target.value)}
                              disabled={enviandoMensagem}
                              placeholder="Digite sua mensagem..."
                              className="w-full py-2.5 bg-transparent outline-none text-sm text-slate-800"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={enviandoMensagem || !textoMensagem.trim()}
                            className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 transition-all"
                          >
                            {enviandoMensagem ? (
                              <i className="fas fa-circle-notch fa-spin text-sm"></i>
                            ) : (
                              <i className="fas fa-paper-plane text-sm"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
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
