"use client";
import { Client, IMessage } from "@stomp/stompjs";
import { useEffect, useRef } from "react";
import type { CardCRM } from "../types";
const API_BASE = process.env.NEXT_PUBLIC_API_WS || 'localhost:8080';

export interface WebSocketMessage {
  type: "CARD_CREATED" | "CARD_UPDATED" | "CARD_DELETED" | "CARD_LIST";
  data: CardCRM | { id: number } | CardCRM[];
}

export function useWebSocket(onMessage: (msg: WebSocketMessage) => void) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      brokerURL: "ws://" + API_BASE +"/ws",
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe("/topic/cards", (message: IMessage) => {
          try {
            const payload: WebSocketMessage = JSON.parse(message.body);
            onMessage(payload);
          } catch (err) {
            console.error("Falha ao processar mensagem WebSocket:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Erro STOMP:", frame.headers["message"]);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  return clientRef;
}
