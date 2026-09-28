'use client'
import { faArrowLeft, faArrowRight, faEllipsisVertical, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import ModalExcluirCard from "./ModalExcluirCard";
import ModalDadosCard from "./ModalDadosCard";
import type { CardCRM } from "../types";
import { updateCard } from "../services/api";

interface PropsCard {
    id: number
    empresa: string
    nome: string
    preco: number
    prioridade: number
    etapa: number
    moveRight?: () => void
    onDelete?: (id: number) => void
    cardData?: CardCRM
    onStartNovoCiclo?: (card: CardCRM) => void
}

export default function Card(props: PropsCard) {
    const [isModalExcluirOpen, setIsModalExcluirOpen] = useState<boolean>(false)
    const [isModalDadosOpen, setIsModalDadosOpen] = useState<boolean>(false)

    const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Coerção defensiva: garante Number válido mesmo que `props.preco` venha como string formatada
    const precoNumerico = Number(String(props.preco).replace(/[^0-9.-]+/g, '')) || 0
    const precoFormatado = formatadorMoeda.format(precoNumerico);

    let txtPrioridade = "Baixa"
    let corPrioridade = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:border-[#709f88] dark:bg-[#1f2828] dark:text-[#709f88]"

    if (props.prioridade === 3) {
        txtPrioridade = "Alta"
        corPrioridade = "bg-red-50 text-red-700 border-red-200 dark:bg-[#1f1a1c] dark:border-[#382726] dark:text-[#d39391]"
    } else if (props.prioridade === 2) {
        txtPrioridade = "Média"
        corPrioridade = "bg-amber-50 text-amber-700 border-amber-200 dark:border-[#594e1d] dark:bg-[#2b2b1f] dark:text-[#c4b54e]"
    }

    // CORREÇÃO: Intercepta o clique do card principal garantindo que modais internos não abram duplicados
    const handleCardClick = () => {
        setIsModalDadosOpen(true);
    }

    // CORREÇÃO CRUCIAL: Interceptores com e.stopPropagation() para evitar efeito cascata/fantasma no clique
    const handleMoveRightClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (props.moveRight) props.moveRight();
    }

    const handleStartNovoCicloClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (props.onStartNovoCiclo && props.cardData) {
            props.onStartNovoCiclo(props.cardData);
        }
    }

    const handleTrashClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsModalExcluirOpen(true);
    }

    return (
        <>
            <div 
                onClick={handleCardClick}
                className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-gray-200/80 hover:scale-101 transition-all duration-300 flex flex-col gap-3 cursor-pointer group/card relative
                dark:bg-[#1d2124] dark:border-[#27292a] dark:hover:shadow-none dark:hover:border-[#27292a]"
            >
                {/* Linha Superior: Tags e Menu de Opções */}
                <div className="flex justify-between items-start gap-2 w-full">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${corPrioridade}`}>
                        {txtPrioridade}
                    </span>
                    <button 
                        onClick={(e) => e.stopPropagation()} 
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50 transition-colors
                        dark:hover:bg-transparent dark:hover:text-white dark:hover:scale-104 dark:hover:cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faEllipsisVertical} className="text-xs" />
                    </button>
                </div>

                {/* Corpo: Identificação do Lead */}
                <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm font-bold text-gray-800 tracking-tight leading-snug truncate group-hover/card:text-[#0F7A75] transition-colors
                    dark:text-white dark:group-hover/card:text-[#6a9a7d]">
                        {props.empresa || "Empresa não informada"}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium truncate">
                        {props.nome || "Contato pendente"}
                    </p>
                </div>

                {/* Separador sutil */}
                <div className="w-full h-[1px] bg-gray-50 dark:bg-[#212528]"></div>

                {/* Rodapé: Valor e Botões de Ação Condicionais */}
                <div className="flex justify-between items-center gap-2 mt-0.5">
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Valor Mensal</span>
                        <span className="text-xs font-black text-gray-700 dark:text-white">R$ {precoFormatado}</span>
                    </div>

                    {/* Bloco de Botões de Controle com Parada de Propagação */}
                    <div className="flex items-center gap-1.5 opacity-80 group-hover/card:opacity-100 transition-opacity">
                        {props.etapa === 6 ? (
                            <button
                                onClick={handleStartNovoCicloClick}
                                className="p-1 text-[10px] font-extrabold bg-[#e1f4e8] hover:bg-[#cbeed4] text-[#0c5b2a] border border-[#bce7cb] rounded-lg transition-all active:scale-95"
                            >
                                Iniciar Novo Ciclo
                            </button>
                        ) : (
                            props.moveRight && (
                                <button
                                    onClick={handleMoveRightClick}
                                    className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-[#ecfeff] text-gray-400 hover:text-[#0F7A75] border border-gray-100 hover:border-[#a7f0e8] rounded-lg transition-all active:scale-95
                                    dark:bg-transparent dark:border-gray-500 dark:hover:bg-[white] dark:hover:border-none dark:hover:text-[#1d2124] hover:cursor-pointer"
                                    title="Avançar etapa"
                                >
                                    <FontAwesomeIcon icon={faArrowRight} className="text-[11px]" />
                                </button>
                            )
                        )}

                        {/*
                        <button
                            onClick={handleTrashClick}
                            className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100 hover:border-red-100 rounded-lg transition-all active:scale-95"
                            title="Remover card"
                        >
                            <FontAwesomeIcon icon={faTrashCan} className="text-[11px]" />
                        </button>
                        */}
                    </div>
                </div>
            </div>

            {isModalExcluirOpen && (
                <ModalExcluirCard 
                    onClose={() => setIsModalExcluirOpen(false)} 
                    idCard={props.id} 
                    empresaCard={props.empresa} 
                    nomeCard={props.nome} 
                    onConfirmarExclusao={props.onDelete} 
                />
            )}

            {isModalDadosOpen && props.cardData && (
                <ModalDadosCard
                    onClose={() => setIsModalDadosOpen(false)}
                    cardData={props.cardData}
                    onUpdateCard={(updated) => {
                        if (props.onDelete) {
                            updateCard(updated.id, updated as any).catch(err =>
                                console.error("Erro ao atualizar card via API:", err)
                            )
                        }
                    }}
                />
            )}
        </>
    )
}