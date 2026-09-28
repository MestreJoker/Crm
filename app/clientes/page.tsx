"use client"
import { useState, useEffect, useMemo } from "react";
import Header from "../Components/Header";
import BarraLateral from "../Widgets/BarraLateral";
import ModalDadosCard from "../Components/ModalDadosCard";
import type { CardCRM } from "@/app/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { fetchCards } from "../services/api";
import { useWebSocket, type WebSocketMessage } from "../hooks/useWebSocket";

export default function ClientesPage() {
    const STORAGE_KEY = 'crm_clientes_v1'
    const [data, setData] = useState<CardCRM[]>([])
    const [query, setQuery] = useState('')
    const [selectedCard, setSelectedCard] = useState<CardCRM | null>(null)

    useEffect(() => {
        async function carregarDados() {
            try {
                const dados = await fetchCards()
                setData(dados)
                return
            } catch (erro) {
                console.warn("API indisponível, tentando localStorage...", erro)
            }

            const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
            if (raw) {
                try { setData(JSON.parse(raw)) } catch (e) { console.warn(e) }
            } else {
                fetch('/json/clientes.json').then(r => r.json()).then(d => setData(d)).catch(() => {})
            }
        }
        carregarDados()
    }, [])

    // WebSocket: recebe atualizações em tempo real
    useWebSocket((msg: WebSocketMessage) => {
        if (msg.type === 'CARD_CREATED') {
            const card = msg.data as CardCRM
            setData(prev => prev.some(c => c.id === card.id) ? prev : [...prev, card])
        } else if (msg.type === 'CARD_UPDATED') {
            const card = msg.data as CardCRM
            setData(prev => prev.map(c => c.id === card.id ? card : c))
        } else if (msg.type === 'CARD_DELETED') {
            const { id } = msg.data as { id: number }
            setData(prev => prev.map(c => c.id === id ? { ...c, deleted: 1 as const } : c))
        } else if (msg.type === 'CARD_LIST') {
            const cards = msg.data as CardCRM[]
            setData(cards)
        }
    })

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return data.filter(item => {
            if (item.deleted === 1) return false
            if (!q) return true
            const razao = String(item.cliente?.razaoSocial ?? '').toLowerCase()
            const nome = String(item.cliente?.nomeContato ?? '').toLowerCase()
            const doc = String(item.cliente?.documento ?? '').toLowerCase()
            return razao.includes(q) || nome.includes(q) || doc.includes(q)
        })
    }, [data, query])

    // Função auxiliar para renderizar as pílulas de status exatamente como no design moderno da imagem
    const renderBadgeEtapa = (etapa: number) => {
        switch (etapa) {
            case 1:
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 uppercase tracking-wider text-[0.68rem]">
                        1. Aguardando Contato
                    </span>
                )
            case 2:
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider text-[0.68rem]">
                        2. 1º Contato
                    </span>
                )
            case 3:
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider text-[0.68rem]">
                        3. Reunião
                    </span>
                )
            case 4:
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider text-[0.68rem]">
                        4. Negociação
                    </span>
                )
            case 5:
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wider text-[0.68rem]">
                        5. Proposta
                    </span>
                )
            case 6:
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider text-[0.68rem]">
                        6. Pós-Venda
                    </span>
                )
            default:
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider text-[0.68rem]">
                        Etapa {etapa}
                    </span>
                )
        }
    }

    return (
        <div className="h-screen w-screen flex flex-col relative overflow-hidden dark:bg-[#0f1112] dark:text-white">
            <Header />
            
            <main className="flex flex-col-reverse lg:flex-row flex-1 overflow-hidden">
                <BarraLateral />

                <section className="flex flex-col h-full w-full p-4 lg:p-8 flex-1 overflow-hidden">
                    
                    {/* Topo: Títulos alinhados e campo de busca minimalista à direita */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 pb-5 border-b border-gray-100 dark:border-[#27292a]">
                        <div>
                            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight dark:text-white">Base Cadastral de Clientes</h1>
                            <p className="text-xs lg:text-sm text-gray-500 mt-0.5 dark:text-[#96989f]">Listagem completa dos clientes persistidos no systema</p>
                        </div>
                        <div className="w-full sm:w-72">
                            <input 
                                value={query} 
                                onChange={(e) => setQuery(e.target.value)} 
                                placeholder="🔍︎ Buscar por empresa ou contato..." 
                                className="w-full px-3 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:bg-[#0f1112] dark:border-[#27292a] dark:placeholder:text-[#7f7f7f] dark:text-white" 
                            />
                        </div>
                    </div>

                    {/* Tabela dentro de container com overflow-x-auto nativo e largura mínima segura calculada */}
                    <div className="flex-1 overflow-auto mt-6 border border-gray-100 rounded-2xl shadow-sm bg-white [scrollbar-width:thin] dark:bg-[#141617] dark:border-[#27292a]">
                        <table className="min-w-full table-auto border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100 text-left text-[0.75rem] font-semibold uppercase tracking-wider sticky text-[#0F7A75] top-0 z-10 dark:bg-transparent dark:border-b dark:border-[#27292a] dark:text-[#7ee3cf]">
                                    <th className="py-4 px-5 whitespace-nowrap">Razão Social</th>
                                    <th className="py-4 px-4 whitespace-nowrap">Nome do Contato</th>
                                    <th className="py-4 px-4 whitespace-nowrap">Função</th>
                                    <th className="py-4 px-4 whitespace-nowrap">E-mail</th>
                                    <th className="py-4 px-4 whitespace-nowrap">Telefone</th>
                                    <th className="py-4 px-4 whitespace-nowrap">CPF/CNPJ</th>
                                    <th className="py-4 px-4 whitespace-nowrap">Endereço</th>
                                    <th className="py-4 px-5 text-center whitespace-nowrap">Etapa no Funil</th>
                                    <th className="py-4 px-4 whitespace-nowrap text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#27292a]">
                                {filtered.map((item) => {
                                    const cliente = item.cliente ?? {} as any
                                    const razao = cliente.razaoSocial || '—'
                                    const nome = cliente.nomeContato || '—'
                                    const funcao = cliente.funcaoContato || '—'
                                    const email = cliente.email || '—'
                                    const telefone = cliente.telefone || '—'
                                    const documento = cliente.documento || '—'
                                    const endereco = cliente.endereco || '—'

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors duration-150 group dark:hover:bg-[#0F7A75]/8">
                                            {/* Razão social destacada em negrito escuro igual ao modelo */}
                                            <td className="py-3.5 px-5 font-bold text-gray-900 text-sm whitespace-nowrap dark:text-white">{razao}</td>
                                            <td className="py-3.5 px-4 text-gray-600 text-sm font-medium whitespace-nowrap dark:text-[#c7c9cc]">{nome}</td>
                                            <td className="py-3.5 px-4 text-gray-500 text-sm whitespace-nowrap dark:text-[#9aa0a6]">{funcao}</td>
                                            {/* Substituído o break-all prejudicial por largura máxima estruturada com corte limpo */}
                                            <td className="py-3.5 px-4 text-gray-500 text-sm max-w-[220px] truncate dark:text-[#9aa0a6]" title={email}>{email}</td>
                                            <td className="py-3.5 px-4 text-gray-500 text-sm whitespace-nowrap dark:text-[#9aa0a6]">{telefone}</td>
                                            <td className="py-3.5 px-4 text-gray-500 text-sm whitespace-nowrap dark:text-[#9aa0a6]">{documento}</td>
                                            <td className="py-3.5 px-4 text-gray-400 text-xs max-w-xs truncate dark:text-[#8b8f93]" title={endereco}>{endereco}</td>
                                            {/* Coluna da Pílula / Badge de Status */}
                                            <td className="py-3.5 px-5 text-center whitespace-nowrap">
                                                {renderBadgeEtapa(item.etapa)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button 
                                                    onClick={() => setSelectedCard(item)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors dark:text-[#7ee3cf] dark:hover:bg-[#08302a]"
                                                    title="Ver Histórico / Detalhes"
                                                >
                                                    <FontAwesomeIcon icon={faClockRotateLeft} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* Estado Vazio */}
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <p className="text-sm font-medium text-gray-400 dark:text-[#9aa0a6]">Nenhum cliente correspondente encontrado na base de dados.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {selectedCard && (
                <ModalDadosCard 
                    cardData={selectedCard} 
                    onClose={() => setSelectedCard(null)} 
                />
            )}
        </div>
    )
}