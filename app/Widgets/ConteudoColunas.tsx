"use client"
import { useState, useRef, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight, faTrashCan } from "@fortawesome/free-solid-svg-icons"
import Coluna from "../Components/Coluna";
import Card from "../Components/Card";
import ModalAcaoCard from "../Components/ModalAcaoCard";
import ModalExcluirCard from "../Components/ModalExcluirCard";
import ModalAviso from "../Components/ModalAviso";
import type { CardCRM } from "../types";
import { fetchCards, createCard, updateCard, moveCard as apiMoveCard, deleteCard as apiDeleteCard } from "../services/api";
import { useWebSocket, type WebSocketMessage } from "../hooks/useWebSocket";

export default function ConteudoColunas() {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [clientes, setClientes] = useState<CardCRM[]>([])
    const [modalOpen, setModalOpen] = useState(false)

    // Definição estrita dos tipos de modais de ação aceitos pelo fluxo
    const [modalTipo, setModalTipo] = useState<'NOVO_AGENDAMENTO' | 'ATUALIZAR_REUNIAO' | 'VALIDAR_NEGOCIACAO' | 'POS_VENDA_CICLO' | null>(null)
    const [modalCard, setModalCard] = useState<CardCRM | null>(null)
    const [pendingMove, setPendingMove] = useState<{ draggedId: number; srcCol: number; dstCol: number; destinationIndex: number; backupClientes: CardCRM[] } | null>(null)

    const [colunaOrigemArrasto, setColunaOrigemArrasto] = useState<number | null>(null)
    const [showArrows, setShowArrows] = useState(false)
    const [pendingTrashId, setPendingTrashId] = useState<number | null>(null)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

    // Controla se o card arrastado está em hover na lixeira
    const [isOverTrash, setIsOverTrash] = useState(false)

    // Refs para controle do scroll por clique e arraste do mouse no container
    const isMouseDownRef = useRef(false)
    const startXRef = useRef(0)
    const scrollLeftRef = useRef(0)
    const isDraggingCardRef = useRef(false)

    // Refs para o auto-scroll condicional (apenas celular)
    const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const mouseXRef = useRef(0)

    const STORAGE_KEY = 'crm_clientes_v1'
    const HIST_KEY = 'crm_historico_alteracoes_v1'

    const [avisoOpen, setAvisoOpen] = useState(false)
    const [avisoConfig, setAvisoConfig] = useState<{ titulo: string; mensagem: string; tipo: 'sucesso' | 'erro' | 'aviso' }>({ titulo: '', mensagem: '', tipo: 'aviso' })

    const titulosColuna: string[] = [
        "",
        "Contato",
        "Reunião",
        "Proposta",
        "Negociação",
        "Pós Venda",
    ]

    // Lógica de scroll do container arrastando com o mouse
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const handleMouseDown = (e: MouseEvent) => {
            if (isDraggingCardRef.current) return

            const target = e.target as HTMLElement
            if (target.closest('button') || target.closest('[data-rfd-drag-handle-context-id]')) return

            isMouseDownRef.current = true
            startXRef.current = e.pageX - container.offsetLeft
            scrollLeftRef.current = container.scrollLeft
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseDownRef.current || isDraggingCardRef.current) return
            e.preventDefault()
            const x = e.pageX - container.offsetLeft
            const walk = (x - startXRef.current) * 1.5
            container.scrollLeft = scrollLeftRef.current - walk
        }

        const handleMouseUpOrLeave = () => {
            isMouseDownRef.current = false
        }

        container.addEventListener('mousedown', handleMouseDown)
        container.addEventListener('mousemove', handleMouseMove)
        container.addEventListener('mouseup', handleMouseUpOrLeave)
        container.addEventListener('mouseleave', handleMouseUpOrLeave)

        return () => {
            container.removeEventListener('mousedown', handleMouseDown)
            container.removeEventListener('mousemove', handleMouseMove)
            container.removeEventListener('mouseup', handleMouseUpOrLeave)
            container.removeEventListener('mouseleave', handleMouseUpOrLeave)
        }
    }, [])

    // Rastreamento da posição horizontal do cursor para a regra opcional de celular
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            mouseXRef.current = e.clientX
        }
        window.addEventListener('mousemove', handleGlobalMouseMove)
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
    }, [])

    // Controle do Scroll Lateral do Kanban
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const checkOverflow = () => {
            const hasOverflow = container.scrollWidth > container.clientWidth
            setShowArrows(hasOverflow)
        }

        checkOverflow()
        const resizeObserver = new ResizeObserver(() => { checkOverflow() })
        resizeObserver.observe(container)
        window.addEventListener('resize', checkOverflow)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener('resize', checkOverflow)
        }
    }, [clientes])

    // Inicialização dos Dados via API + fallback localStorage/JSON
    useEffect(() => {
        async function carregarDados() {
            try {
                const dados = await fetchCards()
                setClientes(dados)
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dados)) } catch { }
                return
            } catch (erro) {
                console.warn("API indisponível, tentando localStorage...", erro)
            }

            const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
            if (stored) {
                try {
                    setClientes(JSON.parse(stored))
                    return
                } catch (e) {
                    console.warn('Erro ao ler localStorage, buscando fallback JSON...')
                }
            }

            try {
                const response = await fetch("/json/clientes.json")
                const dados = await response.json()
                setClientes(dados)
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dados)) } catch { }
            } catch (erro) {
                console.error("Erro ao buscar dados iniciais JSON:", erro)
            }
        }

        carregarDados()
    }, [])

    // WebSocket: recebe atualizações em tempo real do backend
    useWebSocket((msg: WebSocketMessage) => {
        if (msg.type === 'CARD_CREATED') {
            const card = msg.data as CardCRM
            setClientes(prev => prev.some(c => c.id === card.id) ? prev : [...prev, card])
        } else if (msg.type === 'CARD_UPDATED') {
            const card = msg.data as CardCRM
            setClientes(prev => prev.map(c => c.id === card.id ? card : c))
        } else if (msg.type === 'CARD_DELETED') {
            const { id } = msg.data as { id: number }
            setClientes(prev => prev.map(c => c.id === id ? { ...c, deleted: 1 as const } : c))
        } else if (msg.type === 'CARD_LIST') {
            const cards = msg.data as CardCRM[]
            setClientes(cards)
        }
    })

    const moverCardNaInterfaceImediatamente = (draggedId: number, targetEtapa: number, destinationIndex: number) => {
        const cardAlvo = clientes.find(c => c.id === draggedId);
        if (!cardAlvo) return;

        const outrosCards = clientes.filter(c => c.id !== draggedId);
        const cardsDaEtapaDestino = outrosCards.filter(c => c.etapa === targetEtapa);
        const cardsDasOutrasEtapas = outrosCards.filter(c => c.etapa !== targetEtapa);

        const indexCorrigido = Math.min(Math.max(0, destinationIndex), cardsDaEtapaDestino.length);
        cardsDaEtapaDestino.splice(indexCorrigido, 0, { ...cardAlvo, etapa: targetEtapa as any });

        const novaListaGeral = [...cardsDasOutrasEtapas, ...cardsDaEtapaDestino];
        setClientes(novaListaGeral);
    };

    const processarMovimentacaoFisica = (draggedId: number, srcCol: number, dstCol: number, destinationIndex: number) => {
        const draggedItem = clientes.find(p => p.id === draggedId)
        if (!draggedItem) return

        if (dstCol < srcCol) {
            setAvisoConfig({ titulo: 'Atenção', mensagem: 'Não é permitido retroceder cards de etapa.', tipo: 'aviso' })
            setAvisoOpen(true)
            return
        }

        if (dstCol > srcCol && dstCol !== srcCol + 1) {
            setAvisoConfig({ titulo: 'Movimento inválido', mensagem: 'Não é permitido pular etapas. Mova apenas para a etapa seguinte.', tipo: 'aviso' })
            setAvisoOpen(true)
            return
        }

        if (srcCol === 1 && dstCol === 2) {
            const c = draggedItem.cliente as any
            if (!c?.razaoSocial || !c?.nomeContato || !c?.email || !c?.telefone) {
                setAvisoConfig({ titulo: 'Dados incompletos', mensagem: 'Não é possível mover para "1º Contato": preencha Razão Social, Nome do Contato, E-mail e Telefone.', tipo: 'aviso' })
                setAvisoOpen(true)
                return
            }
        }

        if (srcCol === 2 && dstCol === 3) {
            if (!draggedItem.agendamentos || draggedItem.agendamentos.length < 1) {
                const backup = [...clientes]
                moverCardNaInterfaceImediatamente(draggedId, dstCol, destinationIndex)
                setPendingMove({ draggedId, srcCol, dstCol, destinationIndex, backupClientes: backup })
                setModalTipo('NOVO_AGENDAMENTO')
                setModalCard(draggedItem)
                setModalOpen(true)
                return
            }
        }

        if (srcCol === 3 && dstCol === 4) {
            const ag = draggedItem.agendamentos || []
            const last = ag.length ? ag[ag.length - 1] : null
            if (!last) {
                setAvisoConfig({ titulo: 'Sem agendamentos', mensagem: 'Não é possível entrar em "Negociação": não há agendamentos registrados.', tipo: 'aviso' })
                setAvisoOpen(true)
                return
            }
            if (last.status !== 'Realizada' || !draggedItem.cliente?.documento) {
                const backup = [...clientes]
                moverCardNaInterfaceImediatamente(draggedId, dstCol, destinationIndex)
                setPendingMove({ draggedId, srcCol, dstCol, destinationIndex, backupClientes: backup })
                setModalTipo('ATUALIZAR_REUNIAO')
                setModalCard(draggedItem)
                setModalOpen(true)
                return
            }
        }

        if (srcCol === 4 && dstCol === 5) {
            if (draggedItem.statusNegociacao !== 'Validada') {
                const backup = [...clientes]
                moverCardNaInterfaceImediatamente(draggedId, dstCol, destinationIndex)
                setPendingMove({ draggedId, srcCol, dstCol, destinationIndex, backupClientes: backup })
                setModalTipo('VALIDAR_NEGOCIACAO')
                setModalCard(draggedItem)
                setModalOpen(true)
                return
            }
        }

        setClientes(prev => {
            const cols: Record<number, CardCRM[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
            prev.forEach(item => {
                if (item.id === draggedId) return
                cols[item.etapa] = cols[item.etapa] || []
                cols[item.etapa].push(item)
            })

            const now = new Date().toISOString()
            const allHist = prev.flatMap(p => p.historico || [])
            const maxHistId = allHist.length ? Math.max(...allHist.map(h => h.id || 0)) : 100
            const histId = maxHistId + 1

            const tipo = `${srcCol}-${dstCol}`
            const detalhes = `Movido de '${titulosColuna[srcCol - 1]}' para '${titulosColuna[dstCol - 1]}'`
            const histEntry = { id: histId, dataAlteracao: now, tipoAlteracao: tipo, detalhes }

            const updatedDragged: CardCRM = {
                ...draggedItem,
                etapa: dstCol as CardCRM["etapa"],
                historico: [histEntry, ...(draggedItem.historico || [])]
            }

            cols[dstCol] = cols[dstCol] || []
            const indexAlvo = destinationIndex === 9999 ? cols[dstCol].length : destinationIndex
            cols[dstCol].splice(indexAlvo, 0, updatedDragged)

            const next = [...(cols[1] || []), ...(cols[2] || []), ...(cols[3] || []), ...(cols[4] || []), ...(cols[5] || []), ...(cols[6] || [])]

            try {
                const rawHist = localStorage.getItem(HIST_KEY)
                const histArr = rawHist ? JSON.parse(rawHist) : []
                histArr.unshift({ id: histId, cliente_id: draggedId, dataAlteracao: now, tipoAlteracao: tipo, detalhes })
                localStorage.setItem(HIST_KEY, JSON.stringify(histArr))
            } catch (e) { }

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
            } catch (e) { }
            return next
        })
        apiMoveCard(draggedId, dstCol).catch(err => console.error("Erro ao mover card via API:", err))
    }

    function moveCardTo(id: number, targetEtapa: number) {
        const current = clientes.find(c => c.id === id)
        if (!current) return
        processarMovimentacaoFisica(id, current.etapa, targetEtapa, 9999)
    }

    function deleteCard(id: number) {
        setClientes(prev => {
            const next = prev.map(c => c.id === id ? ({ ...c, deleted: 1 } as CardCRM) : c)
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
            } catch { }
            return next
        })
        apiDeleteCard(id).catch(err => console.error("Erro ao excluir card via API:", err))
    }

    const handleConfirmTrashDelete = (id: number) => {
        deleteCard(id)
        setIsDeleteConfirmOpen(false)
        setPendingTrashId(null)
    }

    const handleCancelTrashDelete = () => {
        setIsDeleteConfirmOpen(false)
        setPendingTrashId(null)
    }

    function handleForcarAcaoManual(card: CardCRM, tipo: 'ATUALIZAR_REUNIAO' | 'VALIDAR_NEGOCIACAO') {
        setPendingMove(null)
        setModalTipo(tipo)
        setModalCard(card)
        setModalOpen(true)
    }

    const scrollKanban = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 340;
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
        }
    }

    function onDragStart(start: any) {
        const srcCol = parseInt(start.source.droppableId.replace('col-', ''))
        setColunaOrigemArrasto(srcCol)

        isDraggingCardRef.current = true
        isMouseDownRef.current = false 

        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        const container = scrollContainerRef.current

        if (isMobile && container) {
            autoScrollIntervalRef.current = setInterval(() => {
                const rect = container.getBoundingClientRect()
                const x = mouseXRef.current
                const edgeThreshold = 70
                const speed = 15
                let scrolled = false

                if (x > rect.right - edgeThreshold) {
                    container.scrollLeft += speed
                    scrolled = true
                } else if (x < rect.left + edgeThreshold) {
                    container.scrollLeft -= speed
                    scrolled = true
                }

                if (scrolled) {
                    window.dispatchEvent(new Event('resize'))
                }
            }, 25)
        }
    }

    // Monitora e atualiza em tempo real se o item arrastado entrou na região da lixeira
    function onDragUpdate(update: any) {
        if (update.destination && update.destination.droppableId === 'trash-delete') {
            setIsOverTrash(true)
        } else {
            setIsOverTrash(false)
        }
    }

    function onDragEnd(result: DropResult) {
        setColunaOrigemArrasto(null)
        setIsOverTrash(false) // Reseta o estado prioritário

        isDraggingCardRef.current = false
        if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current)
            autoScrollIntervalRef.current = null
        }

        const { source, destination, draggableId } = result
        if (!destination) return

        if (destination.droppableId === 'trash-delete') {
            const draggedId = parseInt(draggableId.replace('card-', ''))
            setPendingTrashId(draggedId)
            setIsDeleteConfirmOpen(true)
            return
        }

        const srcCol = parseInt(source.droppableId.replace('col-', ''))
        const dstCol = parseInt(destination.droppableId.replace('col-', ''))
        const draggedId = parseInt(draggableId.replace('card-', ''))

        if (source.droppableId === destination.droppableId && source.index === destination.index) return

        processarMovimentacaoFisica(draggedId, srcCol, dstCol, destination.index)
    }

    const handleModalSave = (updatedCard: CardCRM, extra?: { newCard?: CardCRM }) => {
        setClientes((prevClientes) => {
            let listaAtualizada = prevClientes.map((c) => {
                if (c.id === updatedCard.id) {
                    return { ...updatedCard };
                }
                return c;
            });

            if (extra?.newCard) {
                listaAtualizada.push(extra.newCard);
            }

            try {
                localStorage.setItem('crm_clientes_v1', JSON.stringify(listaAtualizada));
            } catch { }
            return listaAtualizada;
        });

        updateCard(updatedCard.id, updatedCard as any).catch(err =>
            console.error("Erro ao atualizar card via API:", err)
        )

        if (extra?.newCard) {
            const payload = {
                cliente: {
                    razaoSocial: extra.newCard.cliente.razaoSocial,
                    nomeFantasia: extra.newCard.cliente.nomeFantasia,
                    documento: extra.newCard.cliente.documento,
                    nomeContato: extra.newCard.cliente.nomeContato,
                    funcaoContato: extra.newCard.cliente.funcaoContato || '',
                    email: extra.newCard.cliente.email,
                    telefone: extra.newCard.cliente.telefone,
                    endereco: extra.newCard.cliente.endereco,
                },
                preco: extra.newCard.preco,
                prioridade: extra.newCard.prioridade,
                etapa: extra.newCard.etapa,
                responsavelEmail: extra.newCard.responsavelEmail,
                fonte: extra.newCard.fonte,
                tipoTag: extra.newCard.tipoTag,
                observacoes: extra.newCard.observacoes,
                requisitos: extra.newCard.requisitos,
            }
            createCard(payload).then(cardCriado => {
                setClientes(prev => prev.map(c =>
                    c.id === extra.newCard!.id ? (cardCriado as CardCRM) : c
                ))
                try {
                    const raw = localStorage.getItem(STORAGE_KEY)
                    if (raw) {
                        const lista = JSON.parse(raw).map((c: any) =>
                            c.id === extra.newCard!.id ? cardCriado : c
                        )
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
                    }
                } catch { }
            }).catch(err => console.error("Erro ao criar card via API:", err))
        }

        setModalOpen(false);
        setModalTipo(null);
        setModalCard(null);
        setPendingMove(null);
        setColunaOrigemArrasto(null);
    };

    function handleModalClose() {
        if (pendingMove) {
            setClientes(pendingMove.backupClientes);
        }
        setPendingMove(null);
        setModalCard(null);
        setModalTipo(null);
        setModalOpen(false);
    }

    const colunas: React.JSX.Element[] = []

    for (let i = 1; i <= 6; i++) {
        let last: boolean = false
        let corTextos = ""
        let iBg = ""
        if (i == 6) { last = true; corTextos = "text-[#0c5b2a]"; iBg = "bg-[#e1f4e8] dark:bg-[#0c5b2a]" }
        else if (i == 3) { corTextos = "text-[#7d65e9]"; iBg = "bg-[#f2f1fd] dark:bg-[#7d65e9]" }
        else if (i == 2) { corTextos = "text-[#2e86f8]"; iBg = "bg-[#edf4fe] dark:bg-[#2e86f8]" }
        else if (i == 4) { corTextos = "text-[#c96b00]"; iBg = "bg-[#fff4e6] dark:bg-[#c96b00]" }
        else if (i == 5) { corTextos = "text-[#0f766e]"; iBg = "bg-[#ecfeff] dark:bg-[#0f766e]" }
        else if (i == 1) { corTextos = "text-[#4b5563]"; iBg = "bg-[#f8fafc] dark:bg-[#4b5563]" }
        else { corTextos = "text-[#6667f1]"; iBg = "bg-[#f0effd] dark:bg-[#6667f1]" }

        // Se o card estiver sobre a lixeira (isOverTrash), força o travamento total de drop e animações das colunas
        const estaBloqueadaParaRetrocesso = (colunaOrigemArrasto !== null && i < colunaOrigemArrasto) || isOverTrash;
        
        // Opacidade de auxílio visual original ou reage caso esteja sobre a lixeira
        const deveAplicarOpacidadeUX = (colunaOrigemArrasto !== null && i !== (colunaOrigemArrasto + 1)) || isOverTrash;

        const classeBgColuna = estaBloqueadaParaRetrocesso
            ? "bg-gray-100/70 border border-dashed border-gray-300 opacity-40 pointer-events-none transition-all duration-300"
            : iBg;

        const classeOpacidadeFiltroUX = deveAplicarOpacidadeUX && !estaBloqueadaParaRetrocesso
            ? "opacity-40 pointer-events-none transition-all duration-300"
            : "transition-all duration-300";

        const columnItems = clientes.filter(item => item.etapa == i && !item.deleted)
        const quantidade = columnItems.length

        colunas.push(
            <Droppable droppableId={`col-${i}`} key={`droppable-${i}`} isDropDisabled={estaBloqueadaParaRetrocesso}>
                {(provided, snapshot) => (
                    <div className={`min-w-[280px] 2xl:min-w-[310px] ${classeOpacidadeFiltroUX}`}>
                        {/* Note que injetamos o isDraggingOver modificado artificialmente caso a lixeira seja prioritária */}
                        <Coluna tituloColuna={titulosColuna[i - 1]} isLast={last} quantidadeCards={quantidade} corText={corTextos} corBg={classeBgColuna} etapa={i}
                            droppableProps={provided.droppableProps} droppableRef={provided.innerRef} isDraggingOver={isOverTrash ? false : snapshot.isDraggingOver}>

                            {columnItems.map((item, index) => {
                                const empresa = (item as any).cliente?.razaoSocial ?? (item as any).empresa ?? ''
                                const nomeContato = (item as any).cliente?.nomeContato ?? (item as any).nome ?? ''
                                return (
                                    <Draggable draggableId={`card-${item.id}`} index={index} key={item.id}>
                                        {(prov, snap) => (
                                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                                <Card id={item.id} empresa={empresa} nome={nomeContato} preco={item.preco} prioridade={item.prioridade} etapa={item.etapa}
                                                    moveRight={item.etapa < 6 ? () => moveCardTo(item.id, item.etapa + 1) : undefined} onDelete={(id: number) => deleteCard(id)} cardData={{ ...item, _onTriggerAcaoManual: (tipo: 'ATUALIZAR_REUNIAO' | 'VALIDAR_NEGOCIACAO') => handleForcarAcaoManual(item, tipo) } as any} onStartNovoCiclo={(c) => { setModalTipo('POS_VENDA_CICLO'); setModalCard(c); setModalOpen(true); }} />
                                            </div>
                                        )}
                                    </Draggable>
                                )
                            })}
                            {provided.placeholder}
                        </Coluna>
                    </div>
                )}
            </Droppable>
        )
    }

    return (
        <div className="relative w-full h-full group hover:cursor-grab active:cursor-grabbing flex flex-col gap-4">
            <DragDropContext onDragStart={onDragStart} onDragUpdate={onDragUpdate} onDragEnd={onDragEnd}>
                <div className={`w-full justify-center items-center h-16 shrink-0 transition-all duration-300 overflow-hidden flex ${colunaOrigemArrasto !== null ? 'opacity-100 pointer-events-auto animate-in fade-in slide-in-from-top-2' : 'opacity-0 pointer-events-none'} absolute top-0 -mt-21`}>
                    <Droppable droppableId="trash-delete">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex h-full w-full max-w-xl items-center justify-center gap-3 rounded-xl border-2 border-dashed border-red-300 bg-red-50 text-red-700 font-bold transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-red-100 border-red-500 scale-102 shadow-md text-red-800' : ''} hover:bg-red-200 hover:text-red-100`}
                            >
                                <FontAwesomeIcon icon={faTrashCan} className={`text-xl ${snapshot.isDraggingOver ? 'animate-bounce' : ''}`} />
                                <span className="text-sm tracking-wide">Solte o Card aqui para Excluir</span>
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>

                <div className="relative w-full flex-1 min-h-0">
                    {showArrows && (
                        <button
                            onClick={() => scrollKanban('left')}
                            className="flex absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white/90 shadow-md border border-gray-100 rounded-full w-10 h-10 items-center justify-center text-gray-600 hover:text-[#0F7A75] hover:bg-white active:scale-95 opacity-0 group-hover:opacity-100 transition-all duration-300"
                            aria-label="Rolar para esquerda"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="text-base" />
                        </button>
                    )}

                    <div
                        ref={scrollContainerRef}
                        className="flex gap-4 lg:gap-2 2xl:gap-4 overflow-x-auto h-full w-full pb-2 select-none scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {colunas}
                    </div>

                    {showArrows && (
                        <button
                            onClick={() => scrollKanban('right')}
                            className="flex absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white/90 shadow-md border border-gray-100 rounded-full w-10 h-10 items-center justify-center text-gray-600 hover:text-[#0F7A75] hover:bg-white active:scale-95 opacity-0 group-hover:opacity-100 transition-all duration-300"
                            aria-label="Rolar para direita"
                        >
                            <FontAwesomeIcon icon={faChevronRight} className="text-base" />
                        </button>
                    )}
                </div>
            </DragDropContext>

            {modalOpen && modalTipo && modalCard && (
                <ModalAcaoCard isOpen={modalOpen} tipoAcao={modalTipo} card={modalCard} onClose={handleModalClose} onSave={handleModalSave} />
            )}

            {isDeleteConfirmOpen && pendingTrashId !== null && (
                <ModalExcluirCard
                    onClose={handleCancelTrashDelete}
                    idCard={pendingTrashId}
                    empresaCard={clientes.find(c => c.id === pendingTrashId)?.cliente?.razaoSocial || 'Cliente'}
                    nomeCard={clientes.find(c => c.id === pendingTrashId)?.cliente?.nomeContato || 'Contato'}
                    onConfirmarExclusao={handleConfirmTrashDelete}
                />
            )}

            <ModalAviso isOpen={avisoOpen} onClose={() => { setAvisoOpen(false); setAvisoConfig({ titulo: '', message: '', tipo: 'aviso' } as any); }} titulo={avisoConfig.titulo} mensagem={avisoConfig.mensagem} tipo={avisoConfig.tipo} />
        </div>
    )
}