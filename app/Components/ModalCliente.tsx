"use client"
import { useState } from "react";
import { faLayerGroup, faUserPlus, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BotaoAdicionar from "./BotaoAdicionar";

interface ModalProps {
    onClose: () => void;
    empresa: string;
    nome: string;
    email: string;
    preco: number;
    etapa: number;
    origem?: string
}

export default function ModalCliente({ onClose, empresa, nome, email, preco, etapa, origem }: ModalProps) {

    return (
        <div
            id="modal"
            className="fixed inset-0 z-50 w-screen h-screen backdrop-blur-[0.2rem] bg-[#0000009b] flex justify-center items-center p-4 sm:p-6"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl h-fit max-h-[90vh] flex flex-col p-5 md:p-7 overflow-y-auto
                [scrollbar-width:thin] [scrollbar-color:#e4e4e7_transparent]
                &::-webkit-scrollbar:w-1.5
                &::-webkit-scrollbar-track:bg-transparent
                &::-webkit-scrollbar-thumb:bg-zinc-200
                &::-webkit-scrollbar-thumb:rounded-full dark:bg-[#1b1d1f] dark:border-2 dark:border-[#27292a] dark:text-white">
                    
                {/* Botão Fechar */}
                <div className="absolute top-5 right-5 z-10">
                        <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:scale-110 hover:text-red-500 hover:cursor-pointer transition-all duration-300 p-1 text-sm md:text-base dark:text-white"
                    >
                        <FontAwesomeIcon icon={faX} />
                        <span className="sr-only">Fechar</span>
                    </button>
                </div>


            </div>
        </div>
    );
}