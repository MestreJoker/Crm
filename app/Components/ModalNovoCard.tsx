"use client";
import { useState, useEffect } from "react";
import { faEnvelope, faLayerGroup, faListUl, faTag, faUserPlus, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BotaoAdicionar from "./BotaoAdicionar";
import ModalAviso from "./ModalAviso";
import { createCard } from "../services/api";
import type { CardCRM, DadosCliente, Agendamento, HistoricoMovimentacao } from "../types";

interface ModalProps {
    onClose: () => void;
    etapaCard?: number;
}

export default function Modal({ onClose, etapaCard }: ModalProps) {
    const STORAGE_KEY = 'crm_clientes_v1';
    const HIST_KEY = 'crm_historico_alteracoes_v1';
    const SUGGESTED_TAGS_KEY = 'crm_sugestoes_tags_v1';

    // --- Estado do Card ---
    const [valorInput, setValorInput] = useState<string>("");
    const [prioridadeInput, setPrioridadeInput] = useState<number>(2);
    const [responsavelEmail, setResponsavelEmail] = useState<string>("");
    const [fonte, setFonte] = useState<'Manual' | 'Automatico'>('Manual');
    const [observacoes, setObservacoes] = useState<string>("");
    const [requisitos, setRequisitos] = useState<string>("");
    const [avisoOpen, setAvisoOpen] = useState(false);
    const [avisoConfig, setAvisoConfig] = useState<{ titulo: string; mensagem: string; tipo: 'sucesso' | 'erro' | 'aviso' }>({ titulo: '', mensagem: '', tipo: 'aviso' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [listaTagsCard, setListaTagsCard] = useState<string[]>([]);
    const [inputTag, setInputTag] = useState<string>("");
    const [tagsSugeridas, setTagsSugeridas] = useState<string[]>(['Compra', 'Venda', 'Serviço', 'Prospecção']);
    const [razaoSocial, setRazaoSocial] = useState<string>("");
    const [nomeContato, setNomeContato] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [telefoneInput, setTelefoneInput] = useState<string>("");
    const [endereco, setEndereco] = useState<string>("");
    const [documento, setDocumento] = useState<string>("");

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const salvas = localStorage.getItem(SUGGESTED_TAGS_KEY);
            if (salvas) {
                try {
                    setTagsSugeridas(JSON.parse(salvas));
                } catch (e) {
                    console.warn("Erro ao ler histórico de tags sugeridas", e);
                }
            }
        }
    }, []);

    const adicionarTag = (tagNome: string) => {
        const limpa = tagNome.trim();
        if (!limpa) return;

        if (listaTagsCard.includes(limpa)) {
            setInputTag("");
            return;
        }

        const novaLista = [...listaTagsCard, limpa];
        setListaTagsCard(novaLista);
        setInputTag("");

        if (!tagsSugeridas.includes(limpa)) {
            const novasSugestoes = [...tagsSugeridas, limpa];
            setTagsSugeridas(novasSugestoes);
            localStorage.setItem(SUGGESTED_TAGS_KEY, JSON.stringify(novasSugestoes));
        }
    };

    const removerTag = (tagParaRemover: string) => {
        setListaTagsCard(listaTagsCard.filter(t => t !== tagParaRemover));
    };

    const lidarComKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            adicionarTag(inputTag);
        }
    };

    const lidarComMudancaPreco = (e: React.ChangeEvent<HTMLInputElement>) => {
        let valor = e.target.value.replace(/\D/g, "");
        if (valor === "") {
            setValorInput("");
            return;
        }
        const numero = parseFloat(valor) / 100;
        setValorInput(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numero));
    };

    const lidarComMudancaTelefone = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length > 6) {
            v = `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
        } else if (v.length > 2) {
            v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
        } else if (v.length > 0) {
            v = `(${v}`;
        }
        setTelefoneInput(v);
    };

    function criarCard() {
        if (isSubmitting) return;

        // --- Validação rigorosa de campos obrigatórios restantes ---
        if (!responsavelEmail.trim()) {
            setAvisoConfig({ titulo: 'Campo Obrigatório', mensagem: 'Por favor, informe o E-mail do Responsável Interno.', tipo: 'aviso' });
            setAvisoOpen(true);
            return;
        }
        if (!razaoSocial.trim()) {
            setAvisoConfig({ titulo: 'Campo Obrigatório', mensagem: 'Por favor, informe a Razão Social da empresa.', tipo: 'aviso' });
            setAvisoOpen(true);
            return;
        }
        if (!nomeContato.trim()) {
            setAvisoConfig({ titulo: 'Campo Obrigatório', mensagem: 'Por favor, informe o Nome do Contato Principal.', tipo: 'aviso' });
            setAvisoOpen(true);
            return;
        }
        if (!email.trim()) {
            setAvisoConfig({ titulo: 'Campo Obrigatório', mensagem: 'Por favor, informe o E-mail Corporativo do cliente.', tipo: 'aviso' });
            setAvisoOpen(true);
            return;
        }
        if (!telefoneInput.trim()) {
            setAvisoConfig({ titulo: 'Campo Obrigatório', mensagem: 'Por favor, informe o Telefone de contato.', tipo: 'aviso' });
            setAvisoOpen(true);
            return;
        }

        // Se passou em todas as validações, ativa o estado de submissão
        setIsSubmitting(true);

        const numPreco = valorInput ? parseFloat(valorInput.replace(/\./g, '').replace(',', '.')) : 0;
        const novaEtapa = etapaCard ?? 1;
        const novoId = Date.now();

        const infoCliente: DadosCliente = {
            razaoSocial: razaoSocial.trim(),
            nomeContato: nomeContato.trim(),
            funcaoContato: '',
            email: email.trim(),
            telefone: telefoneInput,
            endereco: endereco.trim(),
            documento: documento.trim(),
        };

        const allowedTags = ['Compra', 'Venda', 'Serviço'] as const;
        const tipoTagValue = (listaTagsCard.find(t => (allowedTags as readonly string[]).includes(t)) || 'Serviço') as CardCRM['tipoTag'];

        const novoCard: CardCRM = {
            id: novoId,
            cliente: infoCliente,
            preco: numPreco,
            prioridade: Number(prioridadeInput) as CardCRM['prioridade'],
            etapa: novaEtapa as CardCRM['etapa'],
            dataAbertura: new Date().toISOString(),
            responsavelEmail: responsavelEmail.trim(),
            fonte: fonte,
            tipoTag: tipoTagValue,
            observacoes: observacoes.trim() || undefined,
            requisitos: requisitos.trim(),
            agendamentos: [] as Agendamento[],
            historico: [],
            deleted: 0,
        };

        const historicoFormatado: HistoricoMovimentacao = {
            id: Date.now() + 1,
            dataAlteracao: new Date().toISOString(),
            tipoAlteracao: 'Criado',
            detalhes: 'Card criado manualmente no sistema.',
        };

        try {
            const antigas = localStorage.getItem(STORAGE_KEY);
            const lista = antigas ? JSON.parse(antigas) : [];
            lista.push(novoCard);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
        } catch (e) {
            console.warn("Erro ao salvar no localStorage:", e);
        }

        createCard({
            cliente: {
                razaoSocial: infoCliente.razaoSocial,
                nomeFantasia: infoCliente.nomeFantasia,
                documento: infoCliente.documento,
                nomeContato: infoCliente.nomeContato,
                funcaoContato: infoCliente.funcaoContato || '',
                email: infoCliente.email,
                telefone: infoCliente.telefone,
                endereco: infoCliente.endereco,
            },
            preco: numPreco,
            prioridade: Number(prioridadeInput),
            etapa: novaEtapa,
            responsavelEmail: responsavelEmail.trim(),
            fonte: fonte,
            tipoTag: tipoTagValue,
            observacoes: observacoes.trim() || undefined,
            requisitos: requisitos.trim(),
        }).catch(err => console.error("Erro ao criar card via API:", err));
        
        setAvisoConfig({ titulo: 'Sucesso', mensagem: 'Card criado com sucesso.', tipo: 'sucesso' });
        setAvisoOpen(true);
        
        setTimeout(() => {
            setIsSubmitting(false);
            onClose();
        }, 800);
    }

    return (
        <div id="modal" className="fixed inset-0 z-50 w-screen h-screen backdrop-blur-[0.2rem] bg-[#0000009b] flex justify-center items-center p-4 sm:p-6" onClick={onClose}>
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl h-fit max-h-[90vh] flex flex-col p-5 md:p-7 overflow-y-auto [scrollbar-width:thin] dark:bg-[#1b1d1f] dark:border-2 dark:border-[#27292a] dark:text-white" onClick={(e) => e.stopPropagation()}>
                
                <div className="absolute top-5 right-5 z-10">
                    <button type="button" onClick={onClose} className="text-gray-400 hover:scale-110 hover:text-red-500 transition-all p-1">
                        <FontAwesomeIcon icon={faX} />
                    </button>
                </div>

                <div className="flex items-center gap-3 border-b border-gray-100 pb-3 shrink-0 dark:border-[#27292a]">
                    <FontAwesomeIcon icon={faUserPlus} className="text-xl text-[#0F7A75]" />
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Adicionar Novo Card ao CRM</h2>
                </div>

                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-zinc-700 dark:text-white">
                    <div className="sm:col-span-2 bg-gray-50/60 p-3 rounded-xl border border-gray-100/80 flex items-center gap-2 mb-1 dark:bg-[#172623] dark:border-[#27292a]">
                        <FontAwesomeIcon icon={faLayerGroup} className="text-gray-400 text-sm" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Informações Comerciais</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Valor Estimado (R$)</label>
                        <input value={valorInput} onChange={lidarComMudancaPreco} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white dark:bg-[#0f1112] dark:border-[#27292a] dark:text-white" placeholder="0,00" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Grau de Prioridade</label>
                        <select value={prioridadeInput} onChange={(e) => setPrioridadeInput(Number(e.target.value))} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white dark:bg-[#0f1112] dark:border-[#27292a] dark:text-white">
                            <option value={1}>🟢 Baixa Prioridade</option>
                            <option value={2}>🟡 Média Prioridade</option>
                            <option value={3}>🔴 Alta Prioridade</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Canal de Origem <span className="text-red-500">*</span></label>
                        <select value={fonte} onChange={(e) => setFonte(e.target.value as any)} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white dark:bg-[#0f1112] dark:border-[#27292a] dark:text-white" required>
                            <option value="Manual">Entrada Manual</option>
                            <option value="Automatico">Captação Automática (API)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">E-mail do Responsável Interno <span className="text-red-500">*</span></label>
                        <input value={responsavelEmail} onChange={(e) => setResponsavelEmail(e.target.value)} type="email" className="w-full p-2 mt-1 border rounded border-gray-200 bg-white dark:bg-[#0f1112] dark:border-[#27292a] dark:text-white" placeholder="consultor@empresa.com" required />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            <FontAwesomeIcon icon={faTag} className="mr-1.5 text-gray-400 text-xs" />
                            Tags de Classificação
                        </label>
                        
                        <div className="w-full p-2 border border-gray-200 rounded-xl bg-white flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-[#0F7A75]/10 focus-within:border-[#0F7A75] transition-all">
                            {listaTagsCard.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-1.5 bg-[#ECFDF5] text-[#0B5C58] border border-[#a7f0e8] text-xs font-semibold px-2.5 py-1 rounded-lg transition-all">
                                    {tag}
                                    <button type="button" onClick={() => removerTag(tag)} className="text-[#0F7A75] hover:text-[#0B5C58] font-bold transition-colors">
                                        <FontAwesomeIcon icon={faX} className="w-2 h-2" />
                                    </button>
                                </span>
                            ))}
                            <input 
                                value={inputTag} 
                                onChange={(e) => setInputTag(e.target.value)}
                                onKeyDown={lidarComKeyDownTag}
                                className="flex-1 min-w-[140px] text-sm focus:outline-none bg-transparent py-0.5 placeholder:text-gray-400" 
                                placeholder="Digite e aperte Enter..." 
                            />
                        </div>

                        <div className="flex flex-wrap gap-1.5 items-center mt-1">
                            <span className="text-[0.7rem] text-gray-400 font-medium uppercase tracking-wide mr-1">Sugestões:</span>
                            {tagsSugeridas.filter(t => !listaTagsCard.includes(t)).map((sug) => (
                                <button
                                    key={sug}
                                    type="button"
                                    onClick={() => adicionarTag(sug)}
                                    className="text-xs text-gray-500 hover:text-gray-800 bg-gray-100/70 hover:bg-gray-200/80 border border-gray-200/40 px-2 py-0.5 rounded-md transition-colors cursor-pointer select-none"
                                >
                                    + {sug}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">Observações Preliminares <span className="text-gray-400 font-normal text-xs">(Opcional)</span></label>
                        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white [resize:none]" placeholder="Pontos importantes levantados na triagem..." />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">Requisitos do Projeto</label>
                        <textarea value={requisitos} onChange={(e) => setRequisitos(e.target.value)} rows={2} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white [resize:none]" placeholder="Demandas técnicas especificadas pelo card..." />
                    </div>

                    <div className="sm:col-span-2 bg-gray-50/60 p-3 rounded-xl border border-gray-100/80 flex items-center gap-2 mt-2 mb-1">
                        <FontAwesomeIcon icon={faListUl} className="text-gray-400 text-sm" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Ficha Cadastral do Cliente</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Razão Social <span className="text-red-500">*</span></label>
                        <input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white" placeholder="Empresa Exemplo LTDA" required />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Nome do Contato Principal <span className="text-red-500">*</span></label>
                        <input value={nomeContato} onChange={(e) => setNomeContato(e.target.value)} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white" placeholder="Diretor ou Comprador" required />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">E-mail Corporativo <span className="text-red-500">*</span></label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full p-2 mt-1 border rounded border-gray-200 bg-white" placeholder="contato@empresa.com" required />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Telefone <span className="text-red-500">*</span></label>
                        <input value={telefoneInput} onChange={lidarComMudancaTelefone} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white" placeholder="(11) 99999-9999" required />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Endereço Comercial</label>
                        <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white" placeholder="Endereço completo" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Documento (CPF/CNPJ)</label>
                        <input value={documento} onChange={(e) => setDocumento(e.target.value)} className="w-full p-2 mt-1 border rounded border-gray-200 bg-white" placeholder="Somente números" />
                    </div>
                </section>

                <div className="flex gap-3 justify-end mt-4 pt-3 border-t border-gray-100 shrink-0">
                    <button onClick={onClose} type="button" className="py-2 px-4 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer text-sm font-semibold">
                        Cancelar
                    </button>
                    <BotaoAdicionar 
                        textoBotao={isSubmitting ? "Salvando..." : "Criar Card"} 
                        py={"py-2"} 
                        px={"px-4"} 
                        tamanhoTexto="text-sm" 
                        onClick={criarCard} 
                    />
                </div>

                <ModalAviso 
                    isOpen={avisoOpen} 
                    onClose={() => { setAvisoOpen(false); }} 
                    titulo={avisoConfig.titulo} 
                    mensagem={avisoConfig.mensagem} 
                    tipo={avisoConfig.tipo} 
                />
            </div>
        </div>
    );
}