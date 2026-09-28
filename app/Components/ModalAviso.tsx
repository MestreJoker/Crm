"use client"
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faTriangleExclamation, faCircleXmark } from '@fortawesome/free-solid-svg-icons'

type TipoAviso = 'sucesso' | 'erro' | 'aviso'

interface ModalAvisoProps {
  isOpen: boolean
  onClose: () => void
  titulo: string
  mensagem: string
  tipo?: TipoAviso
}

export default function ModalAviso({ isOpen, onClose, titulo, mensagem, tipo = 'aviso' }: ModalAvisoProps) {
  if (!isOpen) return null

  // Mapeamento de cores, anéis e cores de botão dinâmicas por gravidade
  const map = {
    sucesso: { 
      bg: 'bg-emerald-50 text-emerald-600', 
      ring: 'ring-emerald-100', 
      icon: faCircleCheck,
      btn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20'
    },
    erro: { 
      bg: 'bg-red-50 text-red-600', 
      ring: 'ring-red-100', 
      icon: faCircleXmark,
      btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/20'
    },
    aviso: { 
      bg: 'bg-amber-50 text-amber-600', 
      ring: 'ring-amber-100', 
      icon: faTriangleExclamation,
      btn: 'bg-[#0F7A75] hover:opacity-90 focus:ring-emerald-500/20' // Mantém o verde padrão para avisos comuns de validação
    }
  } as const

  const cfg = map[tipo]

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-[0.2rem] bg-black/60 transition-all animate-in fade-in duration-100" 
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100/50 p-6 flex flex-col items-center animate-in zoom-in-95 duration-150 dark:bg-[#1b1d1f] dark:border-2 dark:border-[#27292a] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone Centralizado e Estilizado */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.ring} ring-4 mb-4 shrink-0 transition-all`}> 
          <FontAwesomeIcon icon={cfg.icon} className="text-xl" />
        </div>

        {/* Textos Informativos */}
        <h3 id="modal-titulo" className="text-lg font-bold text-gray-900 tracking-tight text-center dark:text-white">
          {titulo}
        </h3>
        <p className="mt-2 text-sm text-gray-500 text-center leading-relaxed px-2 dark:text-[#96989f]">
          {mensagem}
        </p>

        {/* Botão de Fechamento Integrado ao Grid */}
        <button
          onClick={onClose}
          className={`mt-6 w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-sm transition-all focus:outline-none focus:ring-4 active:scale-98 cursor-pointer text-center ${cfg.btn}`}
        >
          Entendi
        </button>
      </div>
    </div>
  )
}