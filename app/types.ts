/**
 * Tipos e interfaces centrais do domínio CRM.
 * Gerado com restrições fortes de tipagem para evoluções futuras.
 */

/**
 * Sub-status de agendamento para etapas de Reunião e Negociação.
 * Implementado como união discriminada para garantir propriedades obrigatórias
 * dependendo do `status` (ex.: `dataHoraNova` é exigida quando `status` = 'Reagendada').
 */
export type AgendamentoStatus = 'Agendada' | 'Reagendada' | 'Cancelada' | 'Realizada';

/**
 * Estrutura de um agendamento/reunião com campos opcionais para motivo e feedback.
 * - `motivo` é usado quando o agendamento foi cancelado ou reagendado.
 * - `feedback` é usado quando a reunião foi realizada para registrar resultado/observações.
 */
export type Agendamento =
  | {
      status: 'Agendada';
      /** Data e hora do agendamento em formato ISO 8601 */
      dataHora: string;
      motivo?: string;
      feedback?: string;
    }
  | {
      status: 'Reagendada';
      /** Data e hora original do agendamento (ISO 8601) */
      dataHora: string;
      /** Nova data/hora (ISO 8601) */
      dataHoraNova: string;
      motivo?: string;
      feedback?: string;
    }
  | {
      status: 'Cancelada';
      /** Data e hora original do agendamento (ISO 8601) */
      dataHora: string;
      motivo?: string;
      feedback?: string;
    }
  | {
      status: 'Realizada';
      /** Data e hora em que a reunião/negociação foi realizada (ISO 8601) */
      dataHora: string;
      feedback?: string;
      motivo?: string;
    };

/**
 * Dados cadastrais completos do cliente exigidos pela diretoria.
 */
export interface DadosCliente {
  /** Razão social do cliente (empresa) */
  razaoSocial: string;
  /** Nome fantasia, quando aplicável */
  nomeFantasia?: string;
  /** CPF ou CNPJ do cliente (validação externa esperada) */
  documento: string;
  /** Nome do contato principal */
  nomeContato: string;
  /** Cargo / função do contato */
  funcaoContato: string;
  /** E-mail de contato */
  email: string;
  /** Telefone ou WhatsApp de contato */
  telefone: string;
  /** Endereço completo (opcional) */
  endereco?: string;
}

/**
 * Registro granular de movimentações e alterações do card.
 */
export interface HistoricoMovimentacao {
  /** Identificador único do registro de histórico */
  id: number;
  /** Data/hora da alteração em formato ISO 8601 */
  dataAlteracao: string;
  /** Tipo da alteração (ex.: "1-2", "Criado", "StatusMudou") */
  tipoAlteracao: string;
  /** Texto livre com detalhes adicionais sobre a alteração */
  detalhes: string;
}

/**
 * Representação principal de um Card no funil CRM.
 */
export interface CardCRM {
  /** Identificador único do card */
  id: number;

  /**
   * Dados cadastrais completos do cliente associados a este card.
   * Use `DadosCliente` para garantir todos os campos obrigatórios.
   */
  cliente: DadosCliente;

  /** Valor monetário da oportunidade (em centavos ou na unidade definida pelo sistema) */
  preco: number;

  /** Prioridade: 1 = Baixa, 2 = Média, 3 = Alta */
  prioridade: 1 | 2 | 3;

  /** Etapa do funil: valores fixos de 1 a 6 */
  etapa: 1 | 2 | 3 | 4 | 5 | 6;

  /** Data de abertura/criação do card (ISO 8601) */
  dataAbertura: string;

  /** E-mail do usuário responsável pelo card */
  responsavelEmail: string;

  /** Fonte de criação do card */
  fonte: 'Manual' | 'Automatico';

  /** Tag principal que classifica o tipo do card */
  tipoTag: 'Compra' | 'Venda' | 'Serviço';

  /** Observações livres e complementares (opcional) */
  observacoes?: string;

  /** Requisitos ou especificações técnicas/comerciais (opcional) */
  requisitos?: string;

  /**
   * Histórico completo de agendamentos/ reuniões relacionados a este card.
   * Use o tipo `Agendamento` que restringe o campo `status` e inclui
   * `motivo?` e `feedback?` quando aplicável.
   */
  agendamentos: Agendamento[];

  /**
   * Logs locais de alterações para este card específico. Mantém histórico
   * granular de transições e ações sobre o card.
   */
  historico: HistoricoMovimentacao[];

  /**
   * Estado da negociação para este card. Usado para controles de validação
   * no fluxo de Proposta/Negociação.
   */
  statusNegociacao?: 'Em Andamento' | 'Proposta Apresentada' | 'Recusada' | 'Validada';

  /** Motivo textual quando a negociação foi recusada. */
  motivoRecusaNegociacao?: string;

  /** Data de aceite da proposta (ISO 8601) — preenchida quando aplicável */
  dataAceiteProposta?: string;

  /** Soft delete: 0 = ativo, 1 = removido (lixeira) */
  deleted: 0 | 1;

  /** Identificador único do cliente (opcional, para vincular múltiplos cards ao mesmo cliente) */
  clienteId?: string;
}

export {};
