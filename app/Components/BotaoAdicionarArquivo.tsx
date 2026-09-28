import { faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function BotaoAdicionarArquivo(){
    return(
        // 1. Adicionamos "group" e "relative" para controlar o balãozinho
        <button 
            type="button"
            className="absolute group ml-67 -mt-2 rounded-xl px-2 py-1 border border-gray-600 text-gray-700
                       hover:cursor-pointer hover:border-teal hover:text-teal hover:scale-102 transition-all
                       dark:border-[#96989f] dark:text-[#96989f] dark:hover:bg-[#96989f]"
        >
            <FontAwesomeIcon icon={faPaperclip} className="text-sm"/>

            {/* 2. O labelzinho (Tooltip) que aparece no hover (agora abaixo do botão) */}
            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 
                             scale-90 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100
                             whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-md z-50">
                Adicionar arquivo
            </span>
        </button>
    )
}