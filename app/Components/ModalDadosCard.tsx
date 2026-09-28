"use client"
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { faCopy, faEnvelope, faFileLines, faLocationDot, faPhone, faUser, faX, faCheckCircle, faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CardCRM } from "../types";
import Timeline from "./Timeline";

interface ModalProps {
    onClose: () => void;
    cardData: CardCRM;
    onUpdateCard?: (updatedCard: CardCRM) => void; // Callback para sincronizar o estado global
}

export default function ModalDadosCard({ onClose, cardData, onUpdateCard }: ModalProps) {
    const [mounted, setMounted] = useState(false);
    const [tabAtiva, setTabAtiva] = useState<'dados' | 'historico'>('dados');

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const jaValidado = cardData.statusNegociacao === 'Validada';

    const abrirGerenciadorReuniao = () => {
        const callback = (cardData as any)._onTriggerAcaoManual
        if (typeof callback === 'function') {
            onClose()
            callback('ATUALIZAR_REUNIAO')
        }
    }

    const abrirGerenciadorNegociacao = () => {
        const callback = (cardData as any)._onTriggerAcaoManual
        if (typeof callback === 'function') {
            onClose()
            callback('VALIDAR_NEGOCIACAO')
        }
    }

    const abrirPosVenda = () => {
        const callback = (cardData as any)._onTriggerAcaoManual
        if (typeof callback === 'function') {
            onClose()
            callback('POS_VENDA_CICLO')
        }
    }

    const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const precoFormatado = formatadorMoeda.format(cardData.preco || 0);

    const dados = [
        {
            icone: <FontAwesomeIcon icon={faUser} />,
            titulo: "Nome do Contato Principal",
            texto: cardData.cliente?.nomeContato || "Não informado"
        },
        {
            icone: <FontAwesomeIcon icon={faEnvelope} />,
            titulo: "E-mail",
            texto: cardData.cliente?.email || "Não informado"
        },
        {
            icone: <FontAwesomeIcon icon={faLocationDot} />,
            titulo: "Endereço",
            texto: cardData.cliente?.endereco || "Não informado"
        },
        {
            icone: <FontAwesomeIcon icon={faPhone} />,
            titulo: "Telefone",
            texto: cardData.cliente?.telefone || "Não informado"
        },
        {
            icone: <FontAwesomeIcon icon={faFileLines} />,
            titulo: "CNPJ",
            texto: cardData.cliente?.documento || "Não informado"
        }
    ];

    const modalConteudo = (
        <div
            id="modal"
            className="fixed inset-0 z-50 w-screen h-screen backdrop-blur-[0.2rem] bg-[#00000075] flex justify-center items-center"
            onClick={onClose}
        >
            <div
                className="relative w-[96%] max-w-[800px] bg-white rounded-2xl shadow-2xl h-fit max-h-[90%] overflow-y-auto flex flex-col p-6 md:p-8 cursor-default dark:bg-[#1b1d1f] dark:border-2 dark:border-[#27292a] dark:text-white"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Topo */}
                <div>
                    <div className="flex justify-between">
                            <h4 className="text-xs text-gray-400 dark:text-[#96989f]">FICHA DO CARD</h4>
                        <span draggable={false} onDragStart={(e) => e.preventDefault()} className="hover:cursor-pointer">
                            <FontAwesomeIcon icon={faX} onClick={onClose} />
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold dark:text-white">{cardData.cliente?.razaoSocial || "Não informado"}</h2>
                        <div className="px-2 py-1 rounded-full text-[#0B5C58] bg-[#ECFDF5] text-sm font-bold">{cardData.tipoTag || "Serviço"}</div>
                    </div>
                </div>

                {/* Abas */}
                <div className="flex gap-4 border-b border-gray-100 mt-4 mb-6">
                    <button 
                        onClick={() => setTabAtiva('dados')}
                        className={`pb-2 px-1 text-sm font-bold transition-all ${tabAtiva === 'dados' ? 'text-[#0F7A75] border-b-2 border-[#0F7A75]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FontAwesomeIcon icon={faUser} className="mr-2" />
                        Dados do Cliente
                    </button>
                    <button 
                        onClick={() => setTabAtiva('historico')}
                        className={`pb-2 px-1 text-sm font-bold transition-all ${tabAtiva === 'historico' ? 'text-[#0F7A75] border-b-2 border-[#0F7A75]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FontAwesomeIcon icon={faClockRotateLeft} className="mr-2" />
                        Linha do Tempo
                    </button>
                </div>

                {tabAtiva === 'dados' ? (
                    <>
                        {/* Valores */}
                        <div className="min-[788px]:flex w-full rounded-lg border border-gray-200 bg-gray-50 p-5 justify-evenly dark:bg-[#172623] dark:border-[#27292a]">
                            <div className="text-center">
                                <p className="text-xs text-gray-500">VALOR ESTIMADO</p>
                                <p className="text-[#0F7A75] text-2xl font-bold">R$ {precoFormatado}</p>
                            </div>
                            <div className="text-center justify-evenly">
                                <p className="text-xs text-gray-500">PRIORIDADE</p>
                                {cardData.prioridade === 3 ? (
                                    <p className="text-sm font-bold px-2 py-1 rounded-full text-red-600 bg-red-100">🔴 Alta prioridade</p>
                                ) : cardData.prioridade === 2 ? (
                                    <p className="text-sm font-bold px-2 py-1 rounded-full text-amber-600 bg-amber-100">🟡 Média prioridade</p>
                                ) : (
                                    <p className="text-sm font-bold px-2 py-1 rounded-full text-[#0B5C58] bg-[#ECFDF5]">🟢 Baixa prioridade</p>
                                )}
                            </div>
                            <div className="text-center flex flex-col justify-evenly">
                                <p className="text-xs text-gray-500">RESPONSÁVEL</p>
                                <div className="flex gap-2 items-center">
                                    <p className="text-sm">{cardData.responsavelEmail || "Sem responsável"}</p>
                                    <FontAwesomeIcon 
                                        icon={faCopy} 
                                        style={{ color: "#0B5C58", }} 
                                        className="hover:cursor-pointer hover:scale-103" 
                                        onClick={() => {
                                            if (cardData.responsavelEmail) {
                                                navigator.clipboard.writeText(cardData.responsavelEmail);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dados específicos */}
                        <h5 className="text-lg font-bold mt-5 mb-3">Contato do Cliente</h5>
                        <div className="grid grid-flow-col min-[788px]:grid-rows-3 min-[788px]:grid-cols-2 gap-4">
                            {dados.map((item, index) => (
                                <div key={index} className="flex h-fit gap-2 shadow-md p-2 rounded-lg border border-gray-100 dark:border-[#27292a] dark:bg-transparent">
                                    <div className="text-gray-600">
                                        {item.icone}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-600 dark:text-white">{item.titulo}</p>
                                        <p className="dark:text-[#96989f]">{item.texto}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Requisitos e observações */}
                        <div className="flex flex-col gap-3 my-5">
                            {/* Requisitos */}
                            <div className="p-5 border border-gray-200 rounded-lg bg-[#f7faf8]">
                                <div className="flex gap-2 items-center">
                                    <FontAwesomeIcon icon={faFileLines} style={{color: "#0B5C58",}} />
                                    <p className="text-[#0B5C58] font-bold">Requisitos do projeto</p>
                                </div>
                                <p className="mt-1 text-sm">{cardData.requisitos || "Nenhum requisito informado"}</p>
                            </div>

                            {/* Observações */}
                            <div className="p-5 border border-[#f2d9a7] rounded-lg bg-[#fefbf7]">
                                <div className="flex gap-2 items-center">
                                    <FontAwesomeIcon icon={faFileLines} style={{color: "#c27521",}} />
                                    <p className="text-[#c27521] font-bold">Observações</p>
                                </div>
                                <p className="mt-1 text-sm">{cardData.observacoes || "Nenhuma observação informada"}</p>
                            </div>

                            {/* Rodapé Dinâmico com Botão de Validação */}
                            <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    {cardData.etapa === 3 && (
                                        <button
                                            onClick={abrirGerenciadorReuniao}
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg transition-all text-sm active:scale-95 shadow-sm"
                                        >
                                            Gerenciar Reunião
                                        </button>
                                    )}

                                    {cardData.etapa === 4 && (
                                        jaValidado ? (
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[#0B5C58] bg-[#ECFDF5] border border-[#a7f0e8] text-sm">
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                ✓ Negociação Validada
                                            </div>
                                        ) : (
                                            <button
                                                onClick={abrirGerenciadorNegociacao}
                                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg transition-all text-sm active:scale-95 shadow-sm"
                                            >
                                                Gerenciar Negociação
                                            </button>
                                        )
                                    )}

                                    {cardData.etapa === 6 && (
                                        <button
                                            onClick={abrirPosVenda}
                                            className="bg-[#0F7A75] hover:bg-[#0B5C58] text-white font-bold px-4 py-2 rounded-lg transition-all text-sm active:scale-95 shadow-sm"
                                        >
                                            Iniciar Pós-Venda
                                        </button>
                                    )}
                                </div>

                                <button 
                                    className="rounded-md p-2 border border-gray-400 text-gray-600 hover:cursor-pointer hover:scale-103 transition-all text-sm"
                                    onClick={onClose}
                                >
                                    Fechar Janela
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-4">
                        <Timeline card={cardData} />
                        <div className="flex justify-end mt-4">
                             <button 
                                className="rounded-md p-2 border border-gray-400 text-gray-600 hover:cursor-pointer hover:scale-103 transition-all text-sm"
                                onClick={onClose}
                            >
                                Fechar Janela
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return mounted ? createPortal(modalConteudo, document.body) : null;
}