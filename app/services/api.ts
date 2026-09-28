const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface CreateCardPayload {
  cliente: {
    razaoSocial: string;
    nomeFantasia?: string;
    documento: string;
    nomeContato: string;
    funcaoContato?: string;
    email: string;
    telefone: string;
    endereco?: string;
  };
  preco: number;
  prioridade: number;
  etapa?: number;
  responsavelEmail: string;
  fonte: string;
  tipoTag: string;
  observacoes?: string;
  requisitos?: string;
  clienteId?: string;
}

export async function fetchCards() {
  const res = await fetch(`${API_BASE}/cards`);
  if (!res.ok) throw new Error('Failed to fetch cards');
  return res.json();
}

export async function createCard(payload: CreateCardPayload) {
  const res = await fetch(`${API_BASE}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create card');
  return res.json();
}

export async function updateCard(id: number, payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/cards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update card');
  return res.json();
}

export async function updateCardFull(id: number, payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/cards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update card');
  return res.json();
}

export async function moveCard(id: number, etapa: number) {
  const res = await fetch(`${API_BASE}/cards/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ etapa }),
  });
  if (!res.ok) throw new Error('Failed to move card');
  return res.json();
}

export async function deleteCard(id: number) {
  const res = await fetch(`${API_BASE}/cards/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete card');
}
