const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
// Garante que o /LeoApi está no final da URL base
const API_URL = BASE_URL.endsWith("/LeoApi")
  ? BASE_URL
  : `${BASE_URL.replace(/\/$/, "")}/LeoApi`;

function getToken() {
  return localStorage.getItem("token");
}









export async function logoutApi() {
const token = getToken();

if (!token) {
return true;
}

const response = await fetch(`${API_URL}/logout`, {
method: "POST",
headers: {
Authorization: `Bearer ${token}`,
},

}
);

if (!response.ok) {
throw new Error("Erro ao realizar logout");
}

return true;
}



async function tratarResposta(response, mensagemPadrao) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensagem || data?.erro || data?.message || mensagemPadrao,
    );
  }

  return data;
}





// =========================================================
// CASES DE ESTUDO
// =========================================================

export async function criarCaseApi(payload) {
  const token = getToken();
  const response = await fetch(`${API_URL}/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return tratarResposta(response, "Erro ao publicar case");
}

export async function buscarTodosCasesApi() {
  const token = getToken();
  const response = await fetch(`${API_URL}/cases`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao carregar cases");
}

export async function buscarMeusCasesApi() {
  const token = getToken();
  const response = await fetch(`${API_URL}/meus-cases`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao carregar seus cases");
}

// =========================================================
// AUTENTICAÇÃO E USUÁRIOS
// =========================================================

export async function loginApi(dadosLogin) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dadosLogin),
  });

  return tratarResposta(response, "Erro na autenticação");
}

export async function registrarUsuarioApi(dadosUsuario) {
  const response = await fetch(`${API_URL}/registraMentoresEClientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosUsuario),
  });

  if (!response.ok) {
    throw new Error("Erro ao registrar usuário");
  }

  return response.status === 201;
}

export async function buscarEspecialidades() {
  const response = await fetch(`${API_URL}/especialidades`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return tratarResposta(response, "Erro ao buscar especialidades");
}

export async function buscarUsuariosApi() {
  const token = getToken();
  const response = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao buscar usuários");
}

// =========================================================
// MENTORES E AGENDA
// =========================================================

export async function buscarMentoresApi() {
  const response = await fetch(`${API_URL}/mentores`);
  return tratarResposta(response, "Erro ao buscar mentores");
}

export async function buscarMentorApi(id) {
  const response = await fetch(`${API_URL}/mentores/${id}`);
  return tratarResposta(response, "Erro ao buscar mentor");
}

export async function buscarAgendaMentorApi(mentorId) {
  const response = await fetch(`${API_URL}/mentores/${mentorId}/agenda`);
  return tratarResposta(response, "Erro ao buscar agenda do mentor");
}

export async function criarAgendaApi(dadosAgenda) {
  const token = getToken();
  const response = await fetch(`${API_URL}/criar-agenda`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dadosAgenda),
  });

  return tratarResposta(response, "Erro ao criar horário na agenda");
}

export async function buscarMinhaAgendaApi() {
  const token = getToken();
  const response = await fetch(`${API_URL}/minha-agenda`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao buscar agenda");
}

export async function excluirAgendaApi(id) {
  const token = getToken();
  const response = await fetch(`${API_URL}/agenda/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return tratarResposta(response, "Erro ao excluir horário");
  }

  return true;
}

// =========================================================
// AGENDAMENTOS
// =========================================================

export async function agendarHorarioApi(agendaId) {
  const token = getToken();
  const response = await fetch(`${API_URL}/agendamentos/${agendaId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao realizar agendamento");
}

export async function buscarMeusAgendamentosApi() {
  const token = getToken();
  const response = await fetch(`${API_URL}/meus-agendamentos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao buscar seus agendamentos");
}

// =========================================================
// CHAT E SOLICITAÇÕES
// =========================================================

export async function solicitarChatApi(mentorId) {
  const token = getToken();
  const response = await fetch(`${API_URL}/solicitacoes-chat/${mentorId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao solicitar conversa");
}

export async function buscarMinhasSolicitacoesChatApi() {
  const token = getToken();
  const response = await fetch(`${API_URL}/minhas-solicitacoes-chat`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao buscar solicitações");
}

export async function buscarSolicitacoesMentorApi() {
  const token = getToken();
  const response = await fetch(`${API_URL}/mentor/solicitacoes-chat`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao buscar solicitações do mentor");
}

export async function aceitarSolicitacaoApi(id) {
  const token = getToken();
  const response = await fetch(`${API_URL}/solicitacoes-chat/${id}/aceitar`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao aceitar solicitação");
}

export async function recusarSolicitacaoApi(id) {
  const token = getToken();
  const response = await fetch(`${API_URL}/solicitacoes-chat/${id}/recusar`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao recusar solicitação");
}

export async function buscarConversasMentorApi() {
  const token = getToken();
  const response = await fetch(`${API_URL}/mentor/conversas`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao buscar conversas");
}

export async function buscarMensagensApi(conversaId) {
  const token = getToken();
  const response = await fetch(`${API_URL}/conversas/${conversaId}/mensagens`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return tratarResposta(response, "Erro ao buscar mensagens");
}

export async function excluirMensagemApi(conversaId, mensagemId) {
  const token = getToken();
  const response = await fetch(
    `${API_URL}/conversas/${conversaId}/mensagens/${mensagemId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok) {
    return tratarResposta(response, "Erro ao excluir mensagem");
  }

  return true;
}
