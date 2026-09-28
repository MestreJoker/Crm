"use client"
import { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // Necessário para desacoplar a renderização do Card.tsx
import { faTrashCan, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ModalProps {
    onClose: () => void;
    idCard: number;
    empresaCard: string,
    nomeCard: string,
    onConfirmarExclusao?: (id: number) => void;
}

export default function ModalExcluirCard({ onClose, idCard, empresaCard, nomeCard, onConfirmarExclusao }: ModalProps) {
    // Estado necessário para garantir uma hidratação segura (evita incompatibilidades de SSR no Next.js)
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    function lidarComExclusao() {
        const STORAGE_KEY = 'crm_clientes_v1'
        const HIST_KEY = 'crm_historico_alteracoes_v1'

        // If a parent callback exists, prefer calling it so parent can update UI/state
        if (onConfirmarExclusao && idCard) {
            onConfirmarExclusao(idCard);
            onClose();
            return
        }

        // Otherwise perform soft-delete and record in history
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                const arr = JSON.parse(raw)
                const next = arr.map((c: any) => c.id === idCard ? { ...c, deleted: 1 } : c)
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

                // registra histórico de exclusão
                try {
                    const now = new Date().toISOString()
                    const rawHist = localStorage.getItem(HIST_KEY)
                    const histArr = rawHist ? JSON.parse(rawHist) : []
                    const maxHistId = histArr.length ? Math.max(...histArr.map((h: any) => h.id || 0)) : 100
                    const histId = maxHistId + 1
                    histArr.unshift({ id: histId, cliente_id: idCard, dataAlteracao: now, tipoAlteracao: 'Excluído', detalhes: 'Card enviado para a lixeira (Soft Delete)' })
                    localStorage.setItem(HIST_KEY, JSON.stringify(histArr))
                } catch (e) { }
            }
        } catch (e) {
            console.warn('Erro ao manipular localStorage durante exclusão', e)
        }

        onClose(); 
    }

    // Isola exatamente a sua mesma árvore visual e estrutural antiga
    const modalConteudo = (
        <div
            id="modal"
            className="fixed inset-0 z-50 w-screen h-screen backdrop-blur-[0.2rem] bg-[#00000075] flex justify-center items-center p-4 sm:p-6"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl h-fit flex flex-col p-6 md:p-8 cursor-default dark:bg-[#1b1d1f] dark:border-2 dark:border-[#27292a] dark:text-white"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botão Fechar */}
                <div className="absolute top-5 right-5 z-10">
                    <span draggable={false} onDragStart={(e) => e.preventDefault()}>
                        <FontAwesomeIcon
                            icon={faX}
                            className="text-gray-400 hover:scale-110 hover:text-gray-600 hover:cursor-pointer transition-all duration-300 p-1 text-sm"
                            onClick={onClose}
                        />
                    </span>
                </div>

                <div className="flex flex-col items-center text-center gap-4 mt-2">
                    {/* Ícone de Lixeira */}
                    <div className="p-4 rounded-full bg-red-50 w-16 h-16 flex items-center justify-center shrink-0 animate-bounce-short">
                        <span draggable={false} onDragStart={(e) => e.preventDefault()}>
                            <FontAwesomeIcon icon={faTrashCan} className="text-red-500 text-2xl md:text-3xl" />
                        </span>
                    </div>
                    
                    {/* Textos Informativos */}
                    <div className="flex flex-col gap-1.5">
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-white">Excluir Card?</h3>
                        <p className="text-sm text-gray-500 leading-relaxed dark:text-[#96989f]">
                            Tem certeza que deseja excluir este Card, referente à empresa <b className="text-black dark:text-white">{empresaCard}</b> (<b className="text-black dark:text-white">{nomeCard}</b>)? Esta ação é <b>permanente</b> e não poderá ser desfeita.
                        </p>
                    </div>
                </div>

                {/* Ações Inferiores*/}
                <div className="flex gap-3 justify-center w-full mt-8 pt-4 border-t border-gray-100">
                    <button
                        className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-zinc-600 font-semibold text-sm hover:bg-gray-50 active:scale-98 transition-all hover:cursor-pointer dark:border-[#27292a] dark:text-white
                        dark:hover:text-[#000000a5]"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    
                    <button
                        className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-md shadow-red-100 active:scale-98 transition-all hover:cursor-pointer hover:scale-103 dark:shadow-none"
                        onClick={lidarComExclusao}
                    >
                        Sim, excluir
                    </button>
                </div>

            </div>
        </div>
    );

    // Renderiza anexado diretamente à tag body global, contornando a árvore DnD do Card pai
    return mounted ? createPortal(modalConteudo, document.body) : null;
}