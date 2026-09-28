import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface PropsBotaoAdicionar {
    textoBotao: string
    py: string
    px: string
    tamanhoTexto?: string
    outrosEstilos?: string
    onClick?: () => void
}

export default function BotaoAdicionar(props: PropsBotaoAdicionar){
    return(
        <button onClick={props.onClick} className={`${props.py} ${props.px} bg-teal rounded-lg font-bold text-white flex items-center gap-3
              hover:bg-[#16211F] hover:scale-102  hover:cursor-pointer transition-all duration-300 ${props.outrosEstilos}`}>
                <FontAwesomeIcon icon={faPlus} />
                <p className={`${props.tamanhoTexto}`}>{props.textoBotao}</p>
              </button>
    )
}