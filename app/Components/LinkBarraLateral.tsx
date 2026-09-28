interface PropsLinkBarraLateral {
    children: React.ReactNode
    texto: string
    isAtual: boolean
}

export default function LinkBarraLateral(props: PropsLinkBarraLateral){
    let backgroundAtual: string = ""
    if(props.isAtual){
        backgroundAtual = "bg-[#e9f3e9] text-[#0F7A75] dark:bg-[#1c322c] dark:text-white"
    }
    else{
        backgroundAtual = "text-gray-500 dark:text-[#bec9e1]"
    }

    return(

        <div className="flex flex-col items-center justify-center p-1.5 lg:p-2 lg:px-3 w-full flex-1 lg:flex-none">
            <div className={`w-full flex flex-col gap-1 items-center justify-center
                p-2 rounded-xl ${backgroundAtual} hover:bg-[#e9f3e9] hover:text-[#0F7A75] hover:scale-102 transition-all duration-300 hover:cursor-pointer
                dark:hover:bg-teal dark:hover:text-white`}>
                {props.children}
                <p className="text-[0.65rem] sm:text-xs lg:text-xs font-medium whitespace-nowrap tracking-tight">{props.texto}</p>
            </div>
        </div>
    )
}