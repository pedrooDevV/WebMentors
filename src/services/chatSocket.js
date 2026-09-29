import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL =
  "https://webmentorsback-production.up.railway.app/LeoApi/ws";

let client = null;
let connectPromise = null;
let resolveConnection = null;

let solicitacaoHandler = null;
let presenceHandler = null;

const conversationHandlers = new Map();
const conversationSubscriptions = new Map();

const presenceSubscriptionRef = {
  current: null,
};

function parseBody(body) {
  try {
    return JSON.parse(body);
  } catch (error) {
    console.error(
      "❌ Erro ao interpretar mensagem WebSocket:",
      error
    );

    return null;
  }
}

function assinarSolicitacoes() {
  if (!client?.connected) return;

  client.subscribe(
    "/user/queue/solicitacoes",
    (message) => {
      const data = parseBody(message.body);

      if (!data) return;

      console.log(
        "📩 SOLICITAÇÃO RECEBIDA:",
        data
      );

      solicitacaoHandler?.(data);
    }
  );
}

function assinarPresenca() {
  if (!client?.connected) return;

  if (presenceSubscriptionRef.current) {
    return;
  }

  presenceSubscriptionRef.current =
    client.subscribe(
      "/topic/presenca",
      (message) => {
        const data = parseBody(message.body);

        if (!data) return;

        console.log(
          "🟢 ALTERAÇÃO DE PRESENÇA:",
          data
        );

        presenceHandler?.(data);
      }
    );

  /*
   * Snapshot inicial da presença.
   */
  client.subscribe(
    "/user/queue/presenca",
    (message) => {
      const data = parseBody(message.body);

      if (!data) return;

      console.log(
        "📡 SNAPSHOT DE PRESENÇA:",
        data
      );

      presenceHandler?.({
        tipo: "SNAPSHOT",
        usuarios: data,
      });
    }
  );

  /*
   * Pede ao backend a lista atual
   * de usuários online.
   */
  client.publish({
    destination: "/app/presenca/atual",
    body: "{}",
  });
}

function assinarConversaInternamente(conversaId) {
  if (!client?.connected) return;

  const key = String(conversaId);

  if (conversationSubscriptions.has(key)) {
    return;
  }

  const destino =
    `/topic/chat/${key}`;

  console.log(
    "🟢 SUBSCREVENDO:",
    destino
  );

  const subscription =
    client.subscribe(
      destino,
      (message) => {
        console.log(
          "💬 MENSAGEM RECEBIDA:",
          message.body
        );

        const data =
          parseBody(message.body);

        if (!data) return;

        const handler =
          conversationHandlers.get(key);

        handler?.(data);
      }
    );

  conversationSubscriptions.set(
    key,
    subscription
  );
}

function reassinarTodasConversas() {
  if (!client?.connected) return;

  console.log(
    "🔄 REASSINANDO CONVERSAS..."
  );

  conversationSubscriptions.clear();

  for (
    const conversaId
    of conversationHandlers.keys()
  ) {
    assinarConversaInternamente(
      conversaId
    );
  }
}

export function conectarChat(
  onSolicitacao,
  onPresence
) {
  if (onSolicitacao) {
    solicitacaoHandler =
      onSolicitacao;
  }

  if (onPresence) {
    presenceHandler =
      onPresence;
  }

  if (client?.connected) {
    return Promise.resolve(client);
  }

  if (
    client?.active &&
    connectPromise
  ) {
    return connectPromise;
  }

  console.log(
    "🔌 INICIANDO WEBSOCKET..."
  );

  client = new Client({
    webSocketFactory: () =>
      new SockJS(WS_URL),

    connectHeaders: {
      Authorization:
        `Bearer ${localStorage.getItem("token")}`,
    },

    reconnectDelay: 5000,

    /*
     * Heartbeat:
     * ajuda o servidor a perceber
     * quando a conexão realmente morreu.
     */
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: (str) => {
      console.log(
        "[STOMP]",
        str
      );
    },

    onConnect: () => {
      console.log(
        "🟢 WEBSOCKET CONECTADO"
      );

      assinarSolicitacoes();

      assinarPresenca();

      reassinarTodasConversas();

      if (resolveConnection) {
        resolveConnection(client);
        resolveConnection = null;
      }
    },

    onStompError: (frame) => {
      console.error(
        "❌ STOMP ERROR:",
        frame
      );
    },

    onWebSocketError: (error) => {
      console.error(
        "❌ WEBSOCKET ERROR:",
        error
      );
    },

    onWebSocketClose: () => {
      console.warn(
        "⚠️ WEBSOCKET FECHADO"
      );

      conversationSubscriptions.clear();

      presenceSubscriptionRef.current =
        null;
    },

    onDisconnect: () => {
      console.log(
        "🔴 WEBSOCKET DESCONECTADO"
      );

      conversationSubscriptions.clear();

      presenceSubscriptionRef.current =
        null;
    },
  });

  connectPromise =
    new Promise((resolve) => {
      resolveConnection = resolve;
    });

  client.activate();

  return connectPromise;
}

export async function entrarNaConversa(
  conversaId,
  onMessage
) {
  if (
    conversaId === null ||
    conversaId === undefined ||
    !onMessage
  ) {
    return null;
  }

  const key = String(conversaId);

  /*
   * Registra o listener antes mesmo
   * do socket terminar de conectar.
   */
  conversationHandlers.set(
    key,
    onMessage
  );

  await conectarChat();

  assinarConversaInternamente(
    key
  );

  return {
    unsubscribe: () => {
      const handlerAtual =
        conversationHandlers.get(key);

      if (
        handlerAtual === onMessage
      ) {
        conversationHandlers.delete(
          key
        );

        const subscription =
          conversationSubscriptions.get(
            key
          );

        if (subscription) {
          subscription.unsubscribe?.();

          conversationSubscriptions.delete(
            key
          );
        }
      }
    },
  };
}

export async function enviarMensagem(conversaId, conteudo) {
  try {
    console.log("📤 ENVIAR MENSAGEM");
    console.log("📌 conversaId:", conversaId);
    console.log("📌 conteudo:", conteudo);

    await conectarChat();

    if (!client) {
      console.error("❌ Cliente STOMP inexistente");
      return false;
    }

    if (!client.connected) {
      console.error("❌ STOMP não conectado");
      return false;
    }

    const destination = `/app/chat/${conversaId}`;

    const body = JSON.stringify({
      conteudo,
    });

    console.log("📡 DESTINO:", destination);
    console.log("📦 BODY:", body);

    client.publish({
      destination,
      body,
    });

    console.log("✅ STOMP SEND executado");

    return true;
  } catch (error) {
    console.error(
      "❌ Erro ao publicar mensagem:",
      error
    );

    return false;
  }
}

export function desconectarChat() {
  if (!client) {
    return;
  }

  console.log(
    "🔴 DESCONECTANDO WEBSOCKET"
  );

  conversationSubscriptions.forEach(
    (subscription) => {
      subscription.unsubscribe?.();
    }
  );

  conversationSubscriptions.clear();
  conversationHandlers.clear();

  presenceSubscriptionRef.current =
    null;

  client.deactivate();

  client = null;
  connectPromise = null;
  resolveConnection = null;
  solicitacaoHandler = null;
  presenceHandler = null;
}