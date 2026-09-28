"use client"
import Link from "next/link";
import {usePathname} from "next/navigation";
import LinkBarraLateral from "@/app/Components/LinkBarraLateral";
import {
    faCalendar,
    faChartSimple,
    faCircleQuestion,
    faFilter,
    faGear,
    faUserGroup
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";


interface BarraLateralProps {
    linkAtual?: number
}

export default function BarraLateral({linkAtual}: BarraLateralProps) {
    const pathname = usePathname() || '/'
    const dadosLinkBarraLateral = [
        {
            icon: <FontAwesomeIcon icon={faFilter} className="w-full text-xl sm:text-2xl 2xl:text-3xl"/>,
            texto: "CRM",
            href: "/"
        },
        {
            icon: <FontAwesomeIcon icon={faUserGroup} className="w-full text-xl sm:text-2xl 2xl:text-3xl"/>,
            texto: "Clientes",
            href: "/clientes"
        },
        {
            icon: <FontAwesomeIcon icon={faCalendar} className="w-full text-xl sm:text-2xl 2xl:text-3xl"/>,
            texto: "Atividades",
            href: "/atividades"
        },
        {
            icon: <FontAwesomeIcon icon={faChartSimple} className="w-full text-xl sm:text-2xl 2xl:text-3xl"/>,
            texto: "Relatórios",
            href: "/relatorios"
        },
        {
            icon: <FontAwesomeIcon icon={faGear} className="w-full text-xl sm:text-2xl 2xl:text-3xl"/>,
            texto: "Opções",
            href: "/opcoes"
        }
    ]
    return (
        <aside id="barraLateral" className="w-full border-r-2 border-transparent lg:w-25 xl:w-30 2xl:w-40 bg-white flex flex-row lg:flex-col justify-between h-auto lg:h-full z-40 shadow-lg lg:shadow-none shrink-0
        dark:bg-transparent dark:border-[#27292a]">
            <div className="flex flex-row lg:flex-col w-full justify-around lg:justify-start lg:gap-1">
                {dadosLinkBarraLateral.map((item, index) => {
                    const isAtual = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

                    return (
                        <Link key={index} href={item.href} className="w-full">
                            <LinkBarraLateral texto={item.texto} isAtual={isAtual}>
                                {item.icon}
                            </LinkBarraLateral>
                        </Link>
                    )
                })}
            </div>


            <div className="hidden lg:flex items-end justify-center pb-6 flex-1 mt-4">
                <div className="flex items-center justify-center gap-2 text-gray-500 hover:text-teal
                cursor-pointer text-xslg:text-sm
                py-1 px-3 rounded-full hover:bg-[#e9f3e9] transition-all duration-450
                dark:hover:bg-teal dark:hover:text-white">
                    <FontAwesomeIcon icon={faCircleQuestion}/>
                    <p className="text-xs 2xl:text-base">Ajuda</p>
                </div>
            </div>
        </aside>
    )
}