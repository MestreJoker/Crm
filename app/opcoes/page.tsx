'use client'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Header from "../Components/Header";
import BarraLateral from "../Widgets/BarraLateral";
import { faBell, faDisplay, faGear, faMoon, faShield, faSun } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";

export default function Opcoes(){
    const [temaAtual, setTemaAtual] = useState<number>(0)

    // Efeito para sincronizar e carregar o tema salvo no localStorage ao abrir a página
    useEffect(() => {
        const temaSalvo = localStorage.getItem("theme");
        const root = window.document.documentElement;
        
        if (temaSalvo === "dark" || root.classList.contains("dark")) {
            setTemaAtual(1); // 1 representa o index do modo Escuro
            root.classList.add("dark");
        } else {
            setTemaAtual(0); // 0 representa o index do modo Claro
            root.classList.remove("dark");
        }
    }, []);

    // Função responsável por alternar as classes na raiz HTML e salvar no navegador
    const alterarTema = (tema: number) => {
        if (tema !== temaAtual) {
            setTemaAtual(tema)
            const root = window.document.documentElement;

            if (tema === 1) { // Escuro selecionado
                root.classList.add("dark");
                localStorage.setItem("theme", "dark");
            } else {          // Claro selecionado
                root.classList.remove("dark");
                localStorage.setItem("theme", "light");
            }
        }
    };

    const configs = [
        {icone: <FontAwesomeIcon icon={faGear} className="mt-1.5 text-xl"/>, titulo: "Geral", texto: "Preferências básicas"},
        {icone: <FontAwesomeIcon icon={faBell} className="mt-1.5 text-xl"/>, titulo: "Notificações", texto: "Alertas e communications"},
        {icone: <FontAwesomeIcon icon={faShield} className="mt-1.5 text-xl"/>, titulo: "Segurança", texto: "Acesso e privacidade"}
    ]

    const temasCard = [
        {icone: <FontAwesomeIcon icon={faSun} className="text-lg"/>, tema: "Claro"},
        {icone: <FontAwesomeIcon icon={faMoon} className="text-lg"/>, tema: "Escuro"},
    ]

    return(
        <div className="h-screen flex flex-col">
            <Header />

            <main className="flex-1 flex overflow-hidden">
                <BarraLateral />

                <section className="flex-1 overflow-y-auto scrollbar-thin p-12">
                    <h2 className="text-3xl font-bold">Configurações</h2>
                    <p>Personalize sua experiência e preferences do sistema.</p>

                    <div className="rounded-lg p-4 border border-gray-300 shadow-md bg-white mt-10 flex gap-5
                    dark:bg-[#1b1d1f] dark:border-2 dark:border-[#27292a]">
                        <div className="w-1/5 flex flex-col">
                            {configs.map((item, index) => {
                                if (index == 0) {
                                    return (
                                        <div key={index} className="w-full p-3 rounded-lg flex gap-2 bg-primary-soft text-primary-foreground">
                                            {item.icone}
                                            <div>
                                                <p className="font-bold dark:text-white">{item.titulo}</p>
                                                <p className="-mt-0.5 text-gray-700 text-sm dark:text-[#96989f]">{item.texto}</p>
                                            </div>
                                        </div>
                                    )
                                }
                                return null;
                            })}
                        </div>
                        <div className="flex-1 flex">
                            <div className="rounded-lg border border-gray-300 shadow-md px-6 py-4 flex flex-col gap-6 w-full
                            dark:border-2 dark:border-[#27292a]">
                                {/*Topo da div de aparência */}
                                <div className="flex gap-3">
                                    <FontAwesomeIcon icon={faDisplay} className="text-xl text-primary"/>
                                    <div className="-mt-1">
                                        <p className="font-bold">Aparência</p>
                                        <p className="text-sm text-gray-500 -mt-0.5 dark:text-[#96989f]">Personalize o tema da interface do sistema</p>
                                    </div>
                                </div>

                                {/*Div de exibição*/}
                                <div className="rounded-lg border border-gray-300 p-6 flex items-center justify-between
                                dark:border-2 dark:border-[#27292a]">
                                    <div>
                                        <p className="font-bold">Modo de exibição</p>
                                        <p className="text-sm text-gray-500 -mt-0.5 dark:text-[#96989f]">Escolha entre o modo claro ou escuro</p>
                                    </div>

                                    <div className="flex gap-6">
                                        {temasCard.map((item, index) => {
                                            let estilo = "border-gray-200 dark:border-[#27292a]"
                                            let backgroundSelecionado = ""
                                            if (index == temaAtual) {
                                                estilo = "border-primary text-primary-foreground bg-primary-soft dark:bg-primary-soft"
                                                backgroundSelecionado = "bg-primary"
                                            }
                                            return(
                                                <div key={index} className={`rounded-lg p-4 flex items-center justify-between w-50 border-2 ${estilo}
                                                hover:cursor-pointer hover:scale-101 transition-all`}
                                                onClick={() => alterarTema(index)}>
                                                    <div className="flex gap-2">
                                                        <div>
                                                            {item.icone}
                                                        </div>
                                                        <p className="text-black dark:text-white">{item.tema}</p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border flex justify-center items-center p-0.5 ${estilo} dark:border-white`}>
                                                        <div className={`w-full h-full rounded-full ${backgroundSelecionado}`}></div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}