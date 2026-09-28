'use client'
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"
import Modal from "./ModalNovoCard"
import BotaoAdicionar from "./BotaoAdicionar"

interface PropsColuna {
    tituloColuna: string,
    isLast: boolean,
    children: React.ReactNode,
    quantidadeCards: number,
    corText: string,
    corBg: string,
    etapa: number
    onDropCard?: (id: number, targetEtapa: number) => void
    // props injected by DnD wrapper (optional)
    droppableProps?: any,
    droppableRef?: any,
    isDraggingOver?: boolean
}

export default function Coluna(props: PropsColuna) {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    let conteudoTopo = <></>
    let corLast = "bg-[#fdfdfe]"
    let corBotao = "border-[#938efc] bg-[#f8f8fe] text-[#938efc]"

    if (props.isLast) {
        corLast = "bg-[#00adbd0e]"
        corBotao = "border-[#143f25] text-[#143f25] hover:bg-[#e1f4e8]"
    }
    if (props.etapa == 1){
        conteudoTopo = <div onClick={() => setIsModalOpen(true)} className="shrink-0">
                    <BotaoAdicionar textoBotao={"Novo Contato"} py={"py-1"} px={"px-3 2xl:px-4"} tamanhoTexto={`text-xs 2xl:text-sm`} outrosEstilos="w-full justify-center"/>
                </div>
    }
    else {
        conteudoTopo = <h4 className={`text-xs lg:text-sm 2xl:text-base font-bold ${props.corText}`}>{props.tituloColuna}</h4>
    }
    return (
        <>
            <div className={`flex-1 xl:w-[270px] 2xl:w-[310px] rounded-lg shadow-md border border-gray-200 p-4 flex flex-col h-full ${corLast} shrink-0
            dark:bg-transparent dark:border-[#27292a] dark:border-2`}>
                {/* Topo */}
                <div className="flex justify-between mb-3 shrink-0">
                    {conteudoTopo}
                    <p className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${props.corText} ${props.corBg} dark:text-white`}>{props.quantidadeCards}</p>
                </div>

                <hr className={`${props.corText} shrink-0`} />

                {/* Lista Internas dos Cards: */}
                <div
                    id="cards"
                    ref={props.droppableRef}
                    {...props.droppableProps}
                    className={`flex-1 overflow-y-auto flex flex-col gap-3 py-3 pr-1.5
                [scrollbar-width:thin] [scrollbar-color:#e4e4e7_transparent]
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-zinc-200
                [&::-webkit-scrollbar-thumb]:rounded-full
                hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300
                transition-colors duration-300 ${props.isDraggingOver ? 'ring-2 ring-dashed ring-[#0F7A75]/30' : ''}`}
                >
                    {props.children}
                </div>

                
                {/* Botão inferior *
                <div className="pt-2 shrink-0">
                    <button className={`p-2 lg:p-2.5 rounded-xl border flex justify-center w-full font-bold
                    transition-all hover:cursor-pointer hover:scale-102 duration-300 ${corBotao}
                    flex items-center gap-2 text-xs lg:text-sm`}
                        onClick={() => setIsModalOpen(true)}>
                            <FontAwesomeIcon icon={faPlus} />
                            Adicionar card
                    </button>
                </div>
                */}
            </div>
            
            {isModalOpen && (
                    <Modal onClose={() => setIsModalOpen(false)} etapaCard={props.etapa} />
            )}
        </>
    )
}