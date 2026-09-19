import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = "http://webmentorsback-production.up.railway.app/LeoApi/ws";

let client = null;

export function conectarChat(onSolicitacao) {

  const token = localStorage.getItem("token");

  if (!token) {
    console.error("❌ Token não encontrado");
    return;
  }

  if (client?.active) {
    console.log("🟡 WebSocket já está ativo");
    return;
  }

  client = new Client({

    webSocketFactory: () => new SockJS(WS_URL),

    connectHeaders: {
      Authorization: `Bearer ${token}`
    },

    reconnectDelay: 5000,

    debug: (str) => {
      console.log("[STOMP]", str);
    },

    onConnect: () => {

      console.log("🟢 WEBSOCKET CONECTADO");

      // SOLICITAÇÕES
      client.subscribe(
        "/user/queue/solicitacoes",
        (message) => {

          console.log(
            "📩 SOLICITAÇÃO RECEBIDA:",
            message.body
          );

          const data =
            JSON.parse(message.body);

          onSolicitacao?.(data);
        }
      );
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

    onDisconnect: () => {
      console.log(
        "🔴 WEBSOCKET DESCONECTADO"
      );
    }
  });

  client.activate();
}


export function entrarNaConversa(
  conversaId,
  onMessage
) {

  if (!client?.connected) {

    console.error(
      "❌ WebSocket ainda não conectado"
    );

    return null;
  }

  const destino =
    `/topic/chat/${conversaId}`;

  console.log(
    "🟢 SUBSCREVENDO:",
    destino
  );

  const subscription =
    client.subscribe(
      destino,
      (message) => {

        console.log(
          "💬 MENSAGEM RECEBIDA EM TEMPO REAL:",
          message.body
        );

        const data =
          JSON.parse(message.body);

        onMessage?.(data);
      }
    );

  return subscription;
}


export function enviarMensagem(
  conversaId,
  conteudo
) {

  if (!client?.connected) {

    console.error(
      "❌ WebSocket não conectado"
    );

    return false;
  }

  console.log(
    "📤 ENVIANDO MENSAGEM",
    conversaId,
    conteudo
  );

  client.publish({

    destination:
      `/app/chat/${conversaId}`,

    body: JSON.stringify({
      conteudo
    })
  });

  return true;
}


export function desconectarChat() {

  if (client) {

    console.log(
      "🔴 DESCONECTANDO WEBSOCKET"
    );

    client.deactivate();

    client = null;
  }
}