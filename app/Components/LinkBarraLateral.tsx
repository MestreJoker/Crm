interface PropsLinkBarraLateral {
    children: React.ReactNode
    texto: string
    isAtual: boolean
}

export default function LinkBarraLateral(props: PropsLinkBarraLateral){
    let backgroundAtual: string = ""
    if(props.isAtual){
        backgroundAtual = "bg-primary-soft text-primary-foreground dark:text-primary-foreground"
    }
    else{
        backgroundAtual = "text-gray-500 dark:text-[#bec9e1]"
    }

    return(

        <div className="flex flex-col items-center justify-center p-1.5 lg:p-2 lg:px-3 w-full flex-1 lg:flex-none">
            <div className={`w-full flex flex-col gap-1 items-center justify-center
                p-2 rounded-xl ${backgroundAtual} hover:bg-primary-soft hover:text-primary-foreground hover:scale-102 transition-all duration-300 hover:cursor-pointer
                dark:hover:bg-primary-soft dark:hover:text-primary-foreground`}>
                {props.children}
                <p className="text-[0.65rem] sm:text-xs lg:text-xs font-medium whitespace-nowrap tracking-tight">{props.texto}</p>
            </div>
        </div>
    )
}