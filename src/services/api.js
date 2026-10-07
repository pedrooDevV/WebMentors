<<<<<<< HEAD
const API_URL = "http://localhost:8080/LeoApi";

export async function criarCaseApi(payload) {
  const token = localStorage.getItem("token"); // Ajuste para como você armazena o token
  const response = await fetch("/LeoApi/cases", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao publicar case");
  }

  return response.json();
}



export async function agendarMentoriaApi(agendaId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/agendamentos/${agendaId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensagem ||
        data?.message ||
        data?.erro ||
        "Erro ao agendar mentoria",
    );
  }

  return data;
}

// POST /LeoApi/login
export async function loginApi(dadosLogin) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosLogin),
  });

  const data = await response.json().catch(() => null);

  // Se o servidor retornou erro (ex: 401)
  if (!response.ok) {
    // Pega o campo 'mensagem' do JSON do Spring Boot
    const mensagemErro = data?.mensagem || data?.erro || "Erro na autenticação";
    throw new Error(mensagemErro);
  }

  return data;
}

// POST /LeoApi/registrar
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

// POST /LeoApi/buscarEspecialidade
export async function buscarEspecialidades(dadosEspecialidade) {
  const response = await fetch(`${API_URL}/especialidades`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosEspecialidade),
  });

  if (!response.ok) {
    throw new Error("Erro buscar especialidades");
  }

  return response.json();
}

export async function buscarUsuariosApi() {
  try {
    const response = await fetch("http://localhost:8080/LeoApi/users"); // Substitua pela sua URL/porta
    const usuarios = await response.json();

    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
  }
}

buscarUsuariosApi();

export async function criarAgendaApi(dadosAgenda) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/criar-agenda`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(dadosAgenda),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const mensagemErro =
      data?.mensagem || data?.erro || "Erro ao criar horário na agenda";

    throw new Error(mensagemErro);
  }

  return data;
}

export async function buscarMinhaAgendaApi() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/minha-agenda`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const mensagemErro =
      data?.mensagem || data?.erro || "Erro ao buscar agenda";

    throw new Error(mensagemErro);
  }

  return data;
}

export async function excluirAgendaApi(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/agenda/${id}`, {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    const mensagemErro =
      data?.mensagem || data?.erro || "Erro ao excluir horário";

    throw new Error(mensagemErro);
  }

  return true;
}
=======
const API_URL = `${import.meta.env.VITE_API_URL}/LeoApi`;
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82

function getToken() {
  return localStorage.getItem("token");
}

async function tratarResposta(response, mensagemPadrao) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
<<<<<<< HEAD
    throw new Error(
      data?.mensagem || data?.erro || data?.message || mensagemPadrao,
=======
    if (response.status === 403) {
      throw new Error("Acesso negado (403): Permissão insuficiente ou token inválido.");
    }
    throw new Error(
      data?.mensagem || data?.erro || data?.message || mensagemPadrao
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82
    );
  }

  return data;
}

<<<<<<< HEAD
export async function buscarMentoresApi() {
  const response = await fetch(`${API_URL}/mentores`);

=======
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
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82
  return tratarResposta(response, "Erro ao buscar mentores");
}

export async function buscarMentorApi(id) {
  const response = await fetch(`${API_URL}/mentores/${id}`);
<<<<<<< HEAD

  return tratarResposta(response, "Erro ao buscar mentor");
}

export async function buscarAgendaMentorApi(mentorId) {
  const response = await fetch(`${API_URL}/mentores/${mentorId}/agenda`);

  return tratarResposta(response, "Erro ao buscar agenda do mentor");
}

export async function agendarHorarioApi(agendaId) {
=======
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
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82
  const token = getToken();

  const response = await fetch(`${API_URL}/agendamentos/${agendaId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
<<<<<<< HEAD
    },
  });

  return tratarResposta(response, "Erro ao realizar agendamento");
=======
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
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82
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

<<<<<<< HEAD
export async function solicitarChatApi(mentorId) {
  const token = localStorage.getItem("token");
=======
// Chat e Solicitações
export async function solicitarChatApi(mentorId) {
  const token = getToken();
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82

  const response = await fetch(`${API_URL}/solicitacoes-chat/${mentorId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

<<<<<<< HEAD
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensagem ||
        data?.message ||
        data?.erro ||
        "Erro ao solicitar conversa",
    );
  }

  return data;
}

export async function buscarMensagensApi(conversaId) {
  const token = localStorage.getItem("token");
=======
  return tratarResposta(response, "Erro ao solicitar conversa");
}

export async function buscarMensagensApi(conversaId) {
  const token = getToken();
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82

  const response = await fetch(`${API_URL}/conversas/${conversaId}/mensagens`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

<<<<<<< HEAD
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensagem || data?.message || "Erro ao buscar mensagens",
    );
  }

  return data;
}

export async function buscarMinhasSolicitacoesChatApi() {
  const token = localStorage.getItem("token");
=======
  return tratarResposta(response, "Erro ao buscar mensagens");
}

export async function buscarMinhasSolicitacoesChatApi() {
  const token = getToken();
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82

  const response = await fetch(`${API_URL}/minhas-solicitacoes-chat`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

<<<<<<< HEAD
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensagem || data?.message || "Erro ao buscar solicitações",
    );
  }

  return data;
}

export async function buscarSolicitacoesMentorApi() {
  const token = localStorage.getItem("token");
=======
  return tratarResposta(response, "Erro ao buscar solicitações");
}

export async function buscarSolicitacoesMentorApi() {
  const token = getToken();
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82

  const response = await fetch(`${API_URL}/mentor/solicitacoes-chat`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

<<<<<<< HEAD
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensagem || data?.message || "Erro ao buscar solicitações",
    );
  }

  return data;
}

export async function aceitarSolicitacaoApi(id) {
  const token = localStorage.getItem("token");
=======
  return tratarResposta(response, "Erro ao buscar solicitações");
}

export async function aceitarSolicitacaoApi(id) {
  const token = getToken();
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82

  const response = await fetch(`${API_URL}/solicitacoes-chat/${id}/aceitar`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

<<<<<<< HEAD
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensagem || data?.message || "Erro ao aceitar solicitação",
    );
  }

  return data;
}

export async function recusarSolicitacaoApi(id) {
  const token = localStorage.getItem("token");
=======
  return tratarResposta(response, "Erro ao aceitar solicitação");
}

export async function recusarSolicitacaoApi(id) {
  const token = getToken();
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82

  const response = await fetch(`${API_URL}/solicitacoes-chat/${id}/recusar`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

<<<<<<< HEAD
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensagem || data?.message || "Erro ao recusar solicitação",
    );
  }

  return data;
}

export async function buscarConversasMentorApi() {
  const token = localStorage.getItem("token");
=======
  return tratarResposta(response, "Erro ao recusar solicitação");
}

export async function buscarConversasMentorApi() {
  const token = getToken();
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82

  const response = await fetch(`${API_URL}/mentor/conversas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

<<<<<<< HEAD
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensagem ||
        data?.message ||
        data?.erro ||
        "Erro ao buscar conversas",
    );
  }

  return data;
}

export async function excluirMensagemApi(conversaId, mensagemId) {
  const token = localStorage.getItem("token");
=======
  return tratarResposta(response, "Erro ao buscar conversas");
}

export async function excluirMensagemApi(conversaId, mensagemId) {
  const token = getToken();
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82

  const response = await fetch(
    `${API_URL}/conversas/${conversaId}/mensagens/${mensagemId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
<<<<<<< HEAD
    },
=======
    }
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
<<<<<<< HEAD

    throw new Error(
      data?.mensagem ||
        data?.message ||
        data?.erro ||
        "Erro ao excluir mensagem",
=======
    throw new Error(
      data?.mensagem || data?.message || data?.erro || "Erro ao excluir mensagem"
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82
    );
  }

  return true;
<<<<<<< HEAD
}
=======
}
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82
