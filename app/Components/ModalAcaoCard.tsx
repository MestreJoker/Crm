"use client"
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faX, faCalendarDays, faCheckDouble, faFileSignature } from '@fortawesome/free-solid-svg-icons'
import type { CardCRM, Agendamento, AgendamentoStatus } from '../types'
import BotaoAdicionar from './BotaoAdicionarArquivo'
import BotaoAdicionarArquivo from './BotaoAdicionarArquivo'

interface ModalAcaoCardProps {
  isOpen: boolean
  tipoAcao: 'NOVO_AGENDAMENTO' | 'ATUALIZAR_REUNIAO' | 'VALIDAR_NEGOCIACAO' | 'POS_VENDA_CICLO'
  card: CardCRM
  onClose: () => void
  onSave: (updatedCard: CardCRM, extra?: { newCard?: CardCRM }) => void
}

export default function ModalAcaoCard({ isOpen, tipoAcao, card, onClose, onSave }: ModalAcaoCardProps) {
  const [mounted, setMounted] = useState(false)

  // ========== NOVO_AGENDAMENTO ==========
  const [dataHora, setDataHora] = useState('')
  const [localLink, setLocalLink] = useState('')
  const [objetivosPrep, setObjetivosPrep] = useState('')

  // ========== ATUALIZAR_REUNIAO ==========
  const [statusReuniao, setStatusReuniao] = useState<AgendamentoStatus>('Realizada')
  const [cnpjDocumento, setCnpjDocumento] = useState(card.cliente?.documento || '')
  const [dataHoraNova, setDataHoraNova] = useState('')
  const [motivoReuniao, setMotivoReuniao] = useState('')
  const [feedbackReuniao, setFeedbackReuniao] = useState('')

  // ========== VALIDAR_NEGOCIACAO ==========
  const [statusNegociacao, setStatusNegociacao] = useState<'Em Andamento' | 'Proposta Apresentada' | 'Recusada' | 'Validada'>('Proposta Apresentada')
  const [motivoRecusa, setMotivoRecusa] = useState('')
  const [escopoFinal, setEscopoFinal] = useState('')

  // ========== POS_VENDA_CICLO ==========
  const [observacoesCiclo, setObservacoesCiclo] = useState('')

  // ========== CONTROLE GERAL ==========
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setErroValidacao(null)
      // Reset de estados ao abrir o modal com base na ação
      if (tipoAcao === 'NOVO_AGENDAMENTO') {
        setDataHora('')
        localLink || setLocalLink('')
        setObjetivosPrep('')
      } else if (tipoAcao === 'ATUALIZAR_REUNIAO') {
        setStatusReuniao('Realizada')
        setCnpjDocumento(card.cliente?.documento || '')
        setDataHoraNova('')
        setMotivoReuniao('')
        setFeedbackReuniao('')
      } else if (tipoAcao === 'VALIDAR_NEGOCIACAO') {
        setStatusNegociacao('Proposta Apresentada')
        setMotivoRecusa('')
        setEscopoFinal('')
      } else if (tipoAcao === 'POS_VENDA_CICLO') {
        setObservacoesCiclo('')
      }
    }
  }, [isOpen, tipoAcao, card])

  if (!isOpen) return null

  // ========== VALIDAÇÃO ==========
  const validarCampos = (): boolean => {
    setErroValidacao(null)

    if (tipoAcao === 'NOVO_AGENDAMENTO') {
      if (!dataHora.trim()) {
        setErroValidacao('Data e horário do compromisso é obrigatório.')
        return false
      }
      if (!localLink.trim()) {
        setErroValidacao('Local ou link da reunião é obrigatório.')
        return false
      }
      return true
    }

    if (tipoAcao === 'ATUALIZAR_REUNIAO') {
      if (statusReuniao === 'Realizada') {
        if (!cnpjDocumento.trim()) {
          setErroValidacao('CNPJ/CPF do cliente é obrigatório para reunião realizada.')
          return false
        }
      } else if (statusReuniao === 'Reagendada') {
        if (!dataHoraNova.trim()) {
          setErroValidacao('Nova data e hora é obrigatória para reagendamento.')
          return false
        }
        if (!motivoReuniao.trim()) {
          setErroValidacao('Motivo do reagendamento é obrigatório.')
          return false
        }
      } else if (statusReuniao === 'Cancelada') {
        if (!motivoReuniao.trim()) {
          setErroValidacao('Motivo do cancelamento é obrigatório.')
          return false
        }
      }
      return true
    }

    if (tipoAcao === 'VALIDAR_NEGOCIACAO') {
      if (statusNegociacao === 'Recusada') {
        if (!motivoRecusa.trim()) {
          setErroValidacao('Motivo da recusa é obrigatório.')
          return false
        }
      } else if (statusNegociacao === 'Validada') {
        if (!escopoFinal.trim()) {
          setErroValidacao('Resumo do escopo final é obrigatório para validação.')
          return false
        }
      }
      return true
    }

    return true
  }

  // ========== SUBMIT HANDLER ==========
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarCampos()) {
      return
    }

    let cardAtualizado = { ...card }

    if (tipoAcao === 'NOVO_AGENDAMENTO') {
      const novoAgendamento: Agendamento = {
        status: 'Agendada',
        dataHora: new Date(dataHora).toISOString(),
      }
      if (objetivosPrep) novoAgendamento.motivo = objetivosPrep

      cardAtualizado.agendamentos = [...(card.agendamentos || []), novoAgendamento]
      cardAtualizado.etapa = 3
      if (objetivosPrep) {
        cardAtualizado.observacoes = `${card.observacoes || ''}\n[Preparação Reunião]: ${objetivosPrep}`.trim()
      }
    }

    else if (tipoAcao === 'ATUALIZAR_REUNIAO') {
      const agendamentosExistentes = [...(card.agendamentos || [])]

      if (agendamentosExistentes.length > 0) {
        const ultimo = agendamentosExistentes[agendamentosExistentes.length - 1]
        ultimo.status = statusReuniao

        if (statusReuniao === 'Realizada') {
          if (feedbackReuniao) ultimo.feedback = feedbackReuniao
        } else if (statusReuniao === 'Reagendada') {
          ultimo.dataHora = new Date(dataHoraNova).toISOString()
          if (motivoReuniao) ultimo.motivo = motivoReuniao
        } else if (statusReuniao === 'Cancelada') {
          if (motivoReuniao) ultimo.motivo = motivoReuniao
        }
      }

      cardAtualizado.agendamentos = agendamentosExistentes
      cardAtualizado.cliente = {
        ...(card.cliente || {}),
        documento: cnpjDocumento
      } as any

      if (feedbackReuniao) {
        cardAtualizado.observacoes = `${card.observacoes || ''}\n[Feedback Reunião]: ${feedbackReuniao}`.trim()
      }

      cardAtualizado.etapa = statusReuniao === 'Realizada' ? 4 : 3
    }

    else if (tipoAcao === 'VALIDAR_NEGOCIACAO') {
      // Injeta diretamente na raiz o status para leitura no ConteudoColunas e no ModalDadosCard
      cardAtualizado.statusNegociacao = statusNegociacao

      if (statusNegociacao === 'Recusada') {
        cardAtualizado.motivoRecusaNegociacao = motivoRecusa

        const novoHistorico = {
          id: Math.floor(Math.random() * 100000),
          dataAlteracao: new Date().toISOString(),
          tipoAlteracao: 'negociacao_recusada',
          detalhes: `Negociação recusada. Motivo: ${motivoRecusa}`
        }
        cardAtualizado.historico = [novoHistorico, ...(card.historico || [])]
      } else if (statusNegociacao === 'Validada') {
        const novoHistorico = {
          id: Math.floor(Math.random() * 100000),
          dataAlteracao: new Date().toISOString(),
          tipoAlteracao: 'negociacao_validada',
          detalhes: `Negociação validada com sucesso. Escopo comercial finalizado: ${escopoFinal}`
        }
        cardAtualizado.historico = [novoHistorico, ...(card.historico || [])]
      }

      cardAtualizado.etapa = statusNegociacao === 'Recusada' ? 4 : 5
    }

    else if (tipoAcao === 'POS_VENDA_CICLO') {
      const novoHistorico = {
        id: Math.floor(Math.random() * 100000),
        dataAlteracao: new Date().toISOString(),
        tipoAlteracao: 'novo_ciclo_iniciado',
        detalhes: observacoesCiclo || 'Novo ciclo de vendas iniciado.'
      }
      cardAtualizado.historico = [novoHistorico, ...(card.historico || [])]
      cardAtualizado.etapa = 1
    }

    onSave(cardAtualizado)
  }

  // ========== RENDER DINÂMICO ==========
  const renderConteudo = () => {
    switch (tipoAcao) {
      case 'NOVO_AGENDAMENTO':
        return {
          titulo: 'Agendar Primeira Reunião',
          subtitulo: `Defina o compromisso de atendimento para a empresa ${card.cliente?.razaoSocial || ''}.`,
          icone: faCalendarDays,
          corIcone: 'bg-blue-50 text-blue-600 ring-blue-100',
          btnCor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20',
          campos: (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#96989f]">Data e Horário do Compromisso *</label>
                <input
                  type="datetime-local"
                  required
                  value={dataHora}
                  onChange={(e) => setDataHora(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#96989f]">Local ou Link da Reunião *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: meet.google.com/abc-defg-hij"
                  value={localLink}
                  onChange={(e) => setLocalLink(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#96989f]">Objetivos / Notas de Preparação</label>
                <textarea
                  placeholder="Do que se trata o projeto do cliente?"
                  value={objetivosPrep}
                  onChange={(e) => setObjetivosPrep(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm h-20 resize-none focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )
        }

      case 'ATUALIZAR_REUNIAO':
        return {
          titulo: 'Ata e Conclusão de Reunião',
          subtitulo: `Registre o resultado da reunião com ${card.cliente?.razaoSocial || ''}`,
          icone: faCheckDouble,
          corIcone: 'bg-purple-50 text-purple-600 ring-purple-100',
          btnCor: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500/20',
          campos: (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 dark:text-[#96989f]">Status da Reunião *</label>
                <select
                  value={statusReuniao}
                  onChange={(e) => setStatusReuniao(e.target.value as AgendamentoStatus)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:border-purple-500"
                >
                  <div className='text-black'>
                    <option value="Agendada">Agendada</option>
                    <option value="Realizada">Realizada (Com Sucesso)</option>
                    <option value="Reagendada">Reagendada por Solicitação do Cliente</option>
                    <option value="Cancelada">Cancelada / No-show</option>
                  </div>

                </select>
              </div>

              {statusReuniao === 'Realizada' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-[#96989f]">CNPJ / CPF do Cliente *</label>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0001-00"
                      value={cnpjDocumento}
                      onChange={(e) => setCnpjDocumento(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-[#96989f]">Anotações e Feedback Coletado</label>
                    <textarea
                      placeholder="Quais foram os pontos principais discutidos?"
                      value={feedbackReuniao}
                      onChange={(e) => setFeedbackReuniao(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm h-20 resize-none focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {statusReuniao === 'Reagendada' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Nova Data e Horário *</label>
                    <input
                      type="datetime-local"
                      required
                      value={dataHoraNova}
                      onChange={(e) => setDataHoraNova(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Motivo do Reagendamento *</label>
                    <textarea
                      required
                      placeholder="Por que o cliente pediu reagendamento?"
                      value={motivoReuniao}
                      onChange={(e) => setMotivoReuniao(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm h-16 resize-none focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {statusReuniao === 'Cancelada' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Motivo do Cancelamento *</label>
                  <textarea
                    required
                    placeholder="Por que a reunião foi cancelada?"
                    value={motivoReuniao}
                    onChange={(e) => setMotivoReuniao(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm h-16 resize-none focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </>
          )
        }

      case 'VALIDAR_NEGOCIACAO':
        return {
          titulo: 'Validar Fechamento da Negociação',
          subtitulo: 'Confirme os termos comerciais acertados para autorizar o avanço para o Pós-Venda.',
          icone: faFileSignature,
          corIcone: 'bg-amber-50 text-amber-600 ring-amber-100',
          btnCor: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/20',
          campos: (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 dark:text-[#96989f]">Status Atual da Negociação *</label>
                <select
                  value={statusNegociacao}
                  onChange={(e) => setStatusNegociacao(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:border-amber-500"
                >
                  <div className='text-black'>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Proposta Apresentada">Proposta Apresentada</option>
                    <option value="Recusada">Recusada</option>
                    <option value="Validada">Validada (Aprovar Negociação)</option>
                  </div>
                </select>
              </div>

              {statusNegociacao === 'Recusada' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Motivo da Perda / Recusa *</label>
                  <textarea
                    required
                    placeholder="Por que o cliente recusou ou a oportunidade foi perdida?"
                    value={motivoRecusa}
                    onChange={(e) => setMotivoRecusa(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm h-24 resize-none focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-xs text-red-500 font-semibold mt-1">⚠️ O card permanecerá retido na coluna Negociação.</p>
                </div>
              )}

              {statusNegociacao === 'Validada' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Resumo do Escopo Comercial Fechado *</label>
                    <textarea
                      required
                      placeholder="Descreva os detalhes finais da negociação e os itens acordados..."
                      value={escopoFinal}
                      onChange={(e) => setEscopoFinal(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm h-28 resize-none focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                  <p className="text-xs text-green-600 font-semibold mt-1">✅ Card será marcado como validado e poderá seguir para o Pós-Venda.</p>
                </>
              )}
            </>
          )
        }

      case 'POS_VENDA_CICLO':
        return {
          titulo: 'Iniciar Novo Ciclo de Vendas',
          subtitulo: 'Finalize este ciclo atual e reinicie o card na etapa de triagem.',
          icone: faCalendarDays,
          corIcone: 'bg-[#ECFDF5] text-[#0B5C58] ring-[#a7f0e8]',
          btnCor: 'bg-[#0F7A75] hover:bg-[#0B5C58] focus:ring-[#0F7A75]/20',
          campos: (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Observações do Ciclo Finalizado</label>
              <textarea
                placeholder="Registre as notas conclusivas sobre o ciclo de vendas que se encerra..."
                value={observacoesCiclo}
                onChange={(e) => setObservacoesCiclo(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-sm h-20 resize-none focus:outline-none focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">O card retornará para 'Aguardando 1º contato' mantendo o histórico preservado.</p>
            </div>
          )
        }

      default:
        return {
          titulo: 'Ação',
          subtitulo: 'Ação padrão',
          icone: faCheckDouble,
          corIcone: 'bg-gray-50 text-gray-600 ring-gray-100',
          btnCor: 'bg-gray-600 hover:bg-gray-700',
          campos: null
        }
    }
  }

  const cfg = renderConteudo()

  const modalConteudo = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-[0.2rem] bg-black/60 transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 flex flex-col relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto dark:bg-[#1b1d1f] dark:border-2 dark:border-[#27292a] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fechar botão X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-10"
        >
          <FontAwesomeIcon icon={faX} className="text-sm" />
        </button>

        {/* Topo com ícone dinâmico */}
        <div className="flex gap-4 items-center mb-5 border-b border-gray-100 dark:border-[#27292a] pb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ring-4 ${cfg.corIcone}`}>
            <FontAwesomeIcon icon={cfg.icone} className="text-lg" />
          </div>
          <div className="flex-1">
            <div className='flex justify-between pr-5'>
              <h3 className="text-base font-bold text-gray-900 tracking-tight dark:text-white">
                {cfg.titulo}
              </h3>
              <BotaoAdicionarArquivo />
            </div>

            <p className="text-xs text-gray-500 leading-snug mt-0.5 dark:text-[#96989f]">
              {cfg.subtitulo}
            </p>
          </div>
        </div>

        {/* Aviso de erro */}
        {erroValidacao && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-700">
            <p className="text-xs text-red-700 font-semibold dark:text-red-200">
              ⚠️ {erroValidacao}
            </p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {cfg.campos}
          </div>

          {/* Botões */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-[#27292a]">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 border border-gray-300 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all cursor-pointer text-center dark:border-[#27292a] dark:text-white
              dark:hover:text-black/60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`w-1/2 py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-sm transition-all text-center focus:outline-none focus:ring-4 cursor-pointer ${cfg.btnCor}`}
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return mounted ? createPortal(modalConteudo, document.body) : null
}