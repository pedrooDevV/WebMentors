const API_URL = `${import.meta.env.VITE_API_URL}/LeoApi`;

function getToken() {
  return localStorage.getItem("token");
}

async function tratarResposta(response, mensagemPadrao) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Acesso negado (403): Permissão insuficiente ou token inválido.");
    }
    throw new Error(
      data?.mensagem || data?.erro || data?.message || mensagemPadrao
    );
  }

  return data;
}

// Autenticação
export async function loginApi(dadosLogin) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosLogin),
  });

  return tratarResposta(response, "Erro na autenticação");
}

// Usuários
export async function registrarUsuarioApi(dadosUsuario) {
  const token = getToken();

  const response = await fetch(`${API_URL}/registraMentoresEClientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dadosUsuario),
  });

  return tratarResposta(response, "Erro ao registrar usuário");
}

export async function buscarUsuariosApi() {
  const token = getToken();

  const response = await fetch(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao buscar usuários");
}

// Especialidades
export async function buscarEspecialidades() {
  const response = await fetch(`${API_URL}/especialidades`);
  return tratarResposta(response, "Erro ao buscar especialidades");
}

// Mentores
export async function buscarMentoresApi() {
  const response = await fetch(`${API_URL}/mentores`);
  return tratarResposta(response, "Erro ao buscar mentores");
}

export async function buscarMentorApi(id) {
  const response = await fetch(`${API_URL}/mentores/${id}`);
  return tratarResposta(response, "Erro ao buscar mentor");
}

// Agenda
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
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao buscar agenda");
}

export async function buscarAgendaMentorApi(mentorId) {
  const response = await fetch(`${API_URL}/mentores/${mentorId}/agenda`);
  return tratarResposta(response, "Erro ao buscar agenda do mentor");
}

export async function agendarMentoriaApi(agendaId) {
  const token = getToken();

  const response = await fetch(`${API_URL}/agendamentos/${agendaId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return tratarResposta(response, "Erro ao agendar mentoria");
}

export async function agendarHorarioApi(agendaId) {
  return agendarMentoriaApi(agendaId);
}

export async function excluirAgendaApi(id) {
  const token = getToken();

  const response = await fetch(`${API_URL}/agenda/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.mensagem || data?.erro || "Erro ao excluir horário"
    );
  }

  return true;
}

export async function buscarMeusAgendamentosApi() {
  const token = getToken();

  const response = await fetch(`${API_URL}/meus-agendamentos`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao buscar seus agendamentos");
}

// Chat e Solicitações
export async function solicitarChatApi(mentorId) {
  const token = getToken();

  const response = await fetch(`${API_URL}/solicitacoes-chat/${mentorId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao solicitar conversa");
}

export async function buscarMensagensApi(conversaId) {
  const token = getToken();

  const response = await fetch(`${API_URL}/conversas/${conversaId}/mensagens`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao buscar mensagens");
}

export async function buscarMinhasSolicitacoesChatApi() {
  const token = getToken();

  const response = await fetch(`${API_URL}/minhas-solicitacoes-chat`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao buscar solicitações");
}

export async function buscarSolicitacoesMentorApi() {
  const token = getToken();

  const response = await fetch(`${API_URL}/mentor/solicitacoes-chat`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao buscar solicitações");
}

export async function aceitarSolicitacaoApi(id) {
  const token = getToken();

  const response = await fetch(`${API_URL}/solicitacoes-chat/${id}/aceitar`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao aceitar solicitação");
}

export async function recusarSolicitacaoApi(id) {
  const token = getToken();

  const response = await fetch(`${API_URL}/solicitacoes-chat/${id}/recusar`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao recusar solicitação");
}

export async function buscarConversasMentorApi() {
  const token = getToken();

  const response = await fetch(`${API_URL}/mentor/conversas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(response, "Erro ao buscar conversas");
}

export async function excluirMensagemApi(conversaId, mensagemId) {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/conversas/${conversaId}/mensagens/${mensagemId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.mensagem || data?.message || data?.erro || "Erro ao excluir mensagem"
    );
  }

  return true;
}