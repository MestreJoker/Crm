"use client"
import { useState, useEffect, useMemo } from "react";
import Header from "../Components/Header";
import BarraLateral from "../Widgets/BarraLateral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faCalendarDays, faX } from "@fortawesome/free-solid-svg-icons";
import type { CardCRM } from "@/app/types";
import { fetchCards } from "../services/api";
import { useWebSocket, type WebSocketMessage } from "../hooks/useWebSocket";

interface AgendamentoInterno {
    id: string;
    data: string;
    razaoSocial: string;
    tipo: string;
    status: 'Realizada' | 'Cancelada' | 'Reagendada' | 'Agendada' | string;
    motivo?: string;
    feedback?: string;
}

export default function AtividadesPage() {
    const STORAGE_KEY = 'crm_clientes_v1'
    const [dataCards, setDataCards] = useState<CardCRM[]>([])
    
    // Controle do mês/ano exibido no calendário
    const [dataFoco, setDataFoco] = useState(() => new Date())
    
    // Controle do Modal de Detalhes do Dia
    const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)

    // Carrega dados da API na montagem, com fallback localStorage/JSON
    useEffect(() => {
        async function carregarDados() {
            try {
                const dados = await fetchCards()
                setDataCards(dados)
                return
            } catch (erro) {
                console.warn("API indisponível, tentando localStorage...", erro)
            }

            const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
            if (raw) {
                try {
                    setDataCards(JSON.parse(raw))
                    return
                } catch (e) {
                    console.warn("Erro ao ler localStorage:", e)
                }
            }

            fetch('/json/clientes.json')
                .then(r => r.json())
                .then(d => {
                    setDataCards(d)
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) } catch { }
                })
                .catch(() => {})
        }
        carregarDados()
    }, [])

    // WebSocket: recebe atualizações em tempo real
    useWebSocket((msg: WebSocketMessage) => {
        if (msg.type === 'CARD_CREATED') {
            const card = msg.data as CardCRM
            setDataCards(prev => prev.some(c => c.id === card.id) ? prev : [...prev, card])
        } else if (msg.type === 'CARD_UPDATED') {
            const card = msg.data as CardCRM
            setDataCards(prev => prev.map(c => c.id === card.id ? card : c))
        } else if (msg.type === 'CARD_DELETED') {
            const { id } = msg.data as { id: number }
            setDataCards(prev => prev.map(c => c.id === id ? { ...c, deleted: 1 as const } : c))
        } else if (msg.type === 'CARD_LIST') {
            const cards = msg.data as CardCRM[]
            setDataCards(cards)
        }
    })

    // 1. Extrair e consolidar todos os agendamentos considerando os novos estados e datas alternativas
    const todosAgendamentos = useMemo(() => {
        const lista: AgendamentoInterno[] = []
        dataCards.forEach((card) => {
            if (card.deleted === 1) return;
            const ags = Array.isArray(card.agendamentos) ? card.agendamentos : []
            const empresa = card.cliente?.razaoSocial || 'Empresa não identificada'
            
            ags.forEach((ag: any, index) => {
                // Se a reunião foi reagendada, prioriza a 'dataHoraNova' salva pelo modal
                const dataEfetiva = ag.status === 'Reagendada' && ag.dataHoraNova ? ag.dataHoraNova : ag.dataHora;
                
                if (!dataEfetiva) return;

                lista.push({
                    id: `${card.id}-ag-${index}`,
                    data: dataEfetiva,
                    razaoSocial: empresa,
                    tipo: card.etapa === 4 ? "Negociação" : "Reunião Comercial",
                    status: ag.status || 'Agendada',
                    motivo: ag.motivo,
                    feedback: ag.feedback
                })
            })
        })
        return lista
    }, [dataCards])

    // Agrupa atividades por string de data simples "YYYY-MM-DD" para facilitar o posicionamento na grade
    const hashAgendamentos = useMemo(() => {
        const hash: Record<string, AgendamentoInterno[]> = {}
        todosAgendamentos.forEach(ev => {
            try {
                const dataObj = new Date(ev.data)
                if (isNaN(dataObj.getTime())) return;
                const anoStr = dataObj.getFullYear()
                const mesStr = String(dataObj.getMonth() + 1).padStart(2, '0')
                const diaStr = String(dataObj.getDate()).padStart(2, '0')
                const chave = `${anoStr}-${mesStr}-${diaStr}`
                
                if (!hash[chave]) hash[chave] = []
                hash[chave].push(ev)
            } catch(e) {}
        })
        return hash
    }, [todosAgendamentos])

    const ano = dataFoco.getFullYear()
    const mes = dataFoco.getMonth()
    
    const nomeMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]

    const primeiroDiaDaSemana = new Date(ano, mes, 1).getDay()
    const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate()
    
    const diasAnteriorMes = new Date(ano, mes, 0).getDate()
    const diasGrade: { dia: number; mesAlvo: 'anterior' | 'atual' | 'proximo'; chaveData: string }[] = []

    // Preencher dias do mês anterior para completar a primeira semana
    for (let i = primeiroDiaDaSemana - 1; i >= 0; i--) {
        const d = diasAnteriorMes - i
        const mAnt = mes === 0 ? 11 : mes - 1
        const aAnt = mes === 0 ? ano - 1 : ano
        const chave = `${aAnt}-${String(mAnt + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        diasGrade.push({ dia: d, mesAlvo: 'anterior', chaveData: chave })
    }

    // Preencher dias do mês atual
    for (let d = 1; d <= totalDiasNoMes; d++) {
        const chave = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        diasGrade.push({ dia: d, mesAlvo: 'atual', chaveData: chave })
    }

    // Preencher dias do próximo mês para fechar a grade (múltiplo de 7, máximo 42 blocos)
    const resto = 42 - diasGrade.length
    for (let d = 1; d <= resto; d++) {
        const mProx = mes === 11 ? 0 : mes + 1
        const aProx = mes === 11 ? ano + 1 : ano
        const chave = `${aProx}-${String(mProx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        diasGrade.push({ dia: d, mesAlvo: 'proximo', chaveData: chave })
    }

    // Navegação de Meses
    const mudarMes = (direcao: 'prev' | 'next') => {
        setDataFoco(prev => {
            const n = new Date(prev)
            n.setMonth(direcao === 'prev' ? n.getMonth() - 1 : n.getMonth() + 1)
            return n
        })
    }

    // Filtra quais atividades pertencem ao dia aberto no modal de detalhes
    const atividadesDoDiaSelecionado = useMemo(() => {
        if (!diaSelecionado) return []
        return hashAgendamentos[diaSelecionado] || []
    }, [diaSelecionado, hashAgendamentos])

    // Função utilitária de estilização das bolinhas/badges com base nos novos estados do CRM
    const obterEstiloStatus = (status: string) => {
        switch (status) {
            case 'Realizada':
                return { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
            case 'Cancelada':
                return { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-50 text-red-700 border-red-200' }
            case 'Reagendada':
                return { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-50 text-purple-700 border-purple-200' }
            case 'Agendada':
            default:
                return { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-50 text-blue-700 border-blue-200' }
        }
    }

    return (
        <div className="h-screen w-screen flex flex-col relative overflow-hidden ">
            <Header />

            <main className="flex flex-col-reverse lg:flex-row flex-1 overflow-hidden">
                <BarraLateral/>

                <section className="flex flex-col items-center gap-4 lg:gap-5 h-full w-full p-4 lg:p-5 2xl:p-8 flex-1 overflow-y-auto scrollbar-thin">
                    
                    {/* Cabeçalho de Atividades */}
                    <div className="w-full max-w-[700px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 shrink-0">
                        <div className="flex gap-4 items-center">
                            <div className="bg-teal p-2.5 2xl:p-3 w-fit rounded-lg 2xl:rounded-xl shadow-md shrink-0">
                                <FontAwesomeIcon icon={faCalendarDays} className="text-white 2xl:text-xl" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xl 2xl:text-2xl font-bold">Agenda de Atividades</h3>
                                <p className="text-[0.6rem] 2xl:text-[0.7rem] text-gray-500">Monitore as reuniões, retornos e negociações em tempo real.</p>
                            </div>
                        </div>

                        {/* Controlador de Navegação de Mês */}
                        <div className="flex items-center bg-white border border-gray-100 rounded-xl p-1.5 shadow-sm self-end sm:self-auto">
                            <button onClick={() => mudarMes('prev')} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer">
                                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                            </button>
                            <span className="text-xs font-bold text-gray-700 px-3 min-w-[110px] text-center">
                                {nomeMeses[mes]} {ano}
                            </span>
                            <button onClick={() => mudarMes('next')} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer">
                                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                            </button>
                        </div>
                    </div>

                    {/* Grade Calendário */}
                    <div className="w-full lg:max-w-[550px] 2xl:max-w-[700px] mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-4 lg:p-6 flex flex-col shrink-0 dark:bg-[#1b1d1f] dark:border-[#27292a] dark:text-white">
                        {/* Dias da Semana */}
                        <div className="grid grid-cols-7 text-center border-b border-gray-100 pb-3 font-semibold text-xs text-gray-400 uppercase tracking-wider dark:text-[#96989f]">
                            <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                        </div>

                        {/* Células de Dias */}
                        <div className="grid grid-cols-7 gap-1.5 pt-3">
                            {diasGrade.map((item, index) => {
                                const listaAgs = hashAgendamentos[item.chaveData] || []
                                const temAtividades = listaAgs.length > 0
                                const isHoje = item.chaveData === new Date().toISOString().split('T')[0]

                                return (
                                    <div 
                                        key={index}
                                        onClick={() => temAtividades && setDiaSelecionado(item.chaveData)}
                                        className={`
                                            min-h-[65px] lg:min-h-[55px] 2xl:min-h-[65px] p-1.5 rounded-lg 2xl:rounded-xl border flex flex-col justify-between transition-all select-none relative
                                            ${item.mesAlvo === 'atual' ? 'bg-white border-gray-50 text-gray-800 dark:bg-transparent dark:border-[#27292a] dark:text-white' : 'bg-gray-50/50 border-gray-50/20 text-gray-300 dark:bg-transparent dark:border-transparent dark:text-[#6b6f74]'}
                                            ${temAtividades ? 'hover:bg-[#0F7A75]/5 hover:border-[#0F7A75]/20 hover:shadow-sm cursor-pointer dark:hover:bg-[#0F7A75]/10 dark:hover:border-[#0F7A75]/20' : 'cursor-default'}
                                            ${isHoje ? 'ring-2 ring-[#0F7A75] ring-offset-1 font-bold' : ''}
                                        `}
                                    >
                                        <span className={`text-[0.75rem] ${isHoje ? 'text-[#0F7A75] dark:text-[#7ee3cf]' : 'dark:text-[#c7c9cc]'}`}>
                                            {item.dia}
                                        </span>

                                        {/* Container de Sinalizadores Visuais das reuniões */}
                                        {temAtividades && (
                                            <div className="flex flex-wrap gap-1 max-h-[30px] overflow-hidden">
                                                {listaAgs.map((ev, eIdx) => {
                                                    const estilo = obterEstiloStatus(ev.status);
                                                    return (
                                                        <span 
                                                            key={eIdx} 
                                                            title={`${ev.razaoSocial} (${ev.status})`}
                                                            className={`w-2 h-2 rounded-full ${estilo.bg} animate-pulse`} 
                                                        />
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            </main>

            {/* Modal de Detalhes do Dia Selecionado */}
            {diaSelecionado && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDiaSelecionado(null)}>
                    <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-5 lg:p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150 dark:bg-[#1b1d1f] dark:border-[#27292a] dark:text-white" onClick={e => e.stopPropagation()}>
                        
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3 dark:border-[#27292a]">
                            <div className="flex gap-3 items-center text-gray-800 dark:text-white">
                                <FontAwesomeIcon icon={faCalendarDays} className="text-[#0F7A75]" />
                                <h4 className="font-bold text-base">
                                    Compromissos para {new Date(diaSelecionado + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </h4>
                            </div>
                            <button onClick={() => setDiaSelecionado(null)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer dark:text-white">
                                <FontAwesomeIcon icon={faX} className="text-xs" />
                            </button>
                        </div>

                        {/* Listagem das Atividades do Dia */}
                        <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1.5 scrollbar-thin">
                            {atividadesDoDiaSelecionado.map((ev, index) => {
                                const estilo = obterEstiloStatus(ev.status);
                                return (
                                    <div key={index} className="p-3 bg-white border rounded-xl flex gap-3 justify-between items-start hover:shadow-sm transition-all dark:bg-transparent dark:border-[#27292a] dark:text-white">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate dark:text-white">{ev.razaoSocial}</p>
                                            <p className="text-[0.65rem] text-gray-400 font-medium dark:text-gray-400">{ev.tipo}</p>
                                            
                                            {/* Exibição condicional de motivos ou feedbacks */}
                                            {ev.status === 'Cancelada' && ev.motivo && (
                                                <p className="text-[0.7rem] bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded-md mt-1 italic dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                                                    <strong>Motivo:</strong> {ev.motivo}
                                                </p>
                                            )}
                                            {ev.status === 'Reagendada' && ev.motivo && (
                                                <p className="text-[0.7rem] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-md mt-1 italic dark:bg-[#2a2136] dark:text-purple-300 dark:border-purple-700">
                                                    <strong>Motivo:</strong> {ev.motivo}
                                                </p>
                                            )}
                                            {ev.status === 'Realizada' && ev.feedback && (
                                                <p className="text-[0.7rem] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md mt-1 italic dark:bg-[#072017] dark:text-emerald-300 dark:border-emerald-700">
                                                    <strong>Feedback:</strong> {ev.feedback}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className="text-xs font-semibold text-gray-600 bg-white border border-gray-100 px-2 py-1 rounded-lg dark:text-white dark:bg-transparent dark:border-[#27292a]">
                                                {new Date(ev.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold border uppercase tracking-wide ${estilo.badge}`}>
                                                {ev.status}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="border-t border-gray-100 pt-3 flex justify-end dark:border-[#27292a]">
                            <button onClick={() => setDiaSelecionado(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm active:scale-95 transition-all cursor-pointer dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}