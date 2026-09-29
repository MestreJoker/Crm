"use client"
import { useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faPlus, faUserPlus, faX } from '@fortawesome/free-solid-svg-icons';

import Header from "./Components/Header";
import ConteudoColunas from "./Widgets/ConteudoColunas";
import BarraLateral from "./Widgets/BarraLateral";
import Modal from "./Components/ModalNovoCard";
import BotaoAdicionar from "./Components/BotaoAdicionar";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden">
      <Header />

      <main className="flex flex-col-reverse lg:flex-row flex-1 overflow-hidden">
        <BarraLateral/>


        <section className="flex flex-col gap-3.5 lg:gap-4 2xl:gap-6 h-full w-full p-5 2xl:p-6 flex-1 overflow-y-auto scrollbar-thin">

          {/* Menu superior */}
          <div className="flex flex-row justify-between items-center gap-4 shrink-0 w-full overflow-hidden px-1 py-1.5 flex-wrap">
            <div className="hidden md:flex gap-3 lg:gap-4 items-center min-w-0">
              <div className="bg-primary p-2 2xl:p-3 w-fit rounded-lg 2xl:rounded-xl shadow-md shrink-0">
                <FontAwesomeIcon icon={faFilter} className="text-white text-sm lg:text-lg 2xl:text-xl" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-md lg:text-lg 2xl:text-2xl font-bold truncate text-black dark:text-white">Painel CRM Comercial</h3>
                <p className="text-[0.5rem] lg:text-[0.6rem] xl:text-[0.65rem] 2xl:text-[0.7rem] text-gray-500 truncate">
                  Acompanhe o funil de vendas e gerencie seus cards.
                </p>
              </div>
            </div>

            <div className="w-full md:w-fit flex gap-3 items-center justify-center">
              

              <div className="rounded-lg border-2 2xl:border-3 border-primary px-4 text-primary-foreground">
                <p className="text-xs 2xl:text-sm">Ganho:</p>
                <p className="-mt-1 2xl:-mt-1.5 text-sm lg:text-md 2xl:text-xl font-bold">R$12.000,00</p>
              </div>

            {/*
              <div onClick={() => setIsModalOpen(true)} className="shrink-0">
                <BotaoAdicionar textoBotao={"Novo Card"} py={"py-1.5 2xl:py-2"} px={"px-3 2xl:px-4"} tamanhoTexto={`text-sm 2xl:text-md`} />
              </div>
            */}
            </div>


          </div>


          {/* Container do Kanban */}
          <div className="flex-1 relative min-h-[600px] lg:min-h-[650px]">
            <ConteudoColunas />
          </div>
        </section>
      </main>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}