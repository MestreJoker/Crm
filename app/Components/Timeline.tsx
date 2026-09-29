"use client";
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCircle, 
    faArrowRight, 
    faPlus, 
    faCheck, 
    faXmark, 
    faCalendarCheck, 
    faRotateLeft,
    faFlagCheckered
} from '@fortawesome/free-solid-svg-icons';
import { CardCRM, HistoricoMovimentacao, Agendamento } from '../types';

interface TimelineProps {
    card: CardCRM;
}

export default function Timeline({ card }: TimelineProps) {
    // Combine history and appointments into a single timeline
    const timelineEvents = [
        ...(card.historico || []).map(h => ({
            date: h.dataAlteracao,
            type: h.tipoAlteracao,
            details: h.detalhes,
            isHistory: true,
            id: `h-${h.id}`
        })),
        ...(card.agendamentos || []).map((a, idx) => ({
            date: a.dataHora,
            type: `agendamento_${a.status.toLowerCase()}`,
            details: `Agendamento: ${a.status}${a.motivo ? ` - ${a.motivo}` : ''}${a.feedback ? ` | Feedback: ${a.feedback}` : ''}`,
            isHistory: false,
            id: `a-${idx}`
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getIcon = (type: string) => {
        if (type === 'novo_ciclo_iniciado') return faRotateLeft;
        if (type === 'negociacao_validada') return faCheck;
        if (type === 'negociacao_recusada') return faXmark;
        if (type.startsWith('agendamento')) return faCalendarCheck;
        if (type.includes('-')) return faArrowRight; // Etapa change "1-2"
        if (type === 'Criado') return faPlus;
        return faCircle;
    };

    const getIconColor = (type: string) => {
        if (type === 'novo_ciclo_iniciado') return 'text-blue-500';
        if (type === 'negociacao_validada') return 'text-emerald-500';
        if (type === 'negociacao_recusada') return 'text-red-500';
        if (type.startsWith('agendamento')) return 'text-purple-500';
        if (type === 'Criado') return 'text-primary';
        return 'text-gray-400';
    };

    const formatDate = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (e) {
            return isoString;
        }
    };

    return (
        <div className="mt-6">
            <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faFlagCheckered} className="text-gray-400" />
                Histórico de Vida do Cliente
            </h5>
            <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-8">
                {timelineEvents.map((event, index) => {
                    const isNewCycle = event.type === 'novo_ciclo_iniciado';
                    
                    return (
                        <div key={event.id} className="relative">
                            {/* Dot on the line */}
                            <span className={`absolute -left-[1.95rem] top-1 w-4 h-4 rounded-full bg-white border-2 ${getIconColor(event.type).replace('text', 'border')} z-10 flex items-center justify-center`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${getIconColor(event.type).replace('text', 'bg')}`}></div>
                            </span>

                            <div className={`p-4 rounded-xl border ${isNewCycle ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'} shadow-sm transition-all hover:shadow-md`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {formatDate(event.date)}
                                    </span>
                                    <FontAwesomeIcon 
                                        icon={getIcon(event.type)} 
                                        className={`${getIconColor(event.type)} text-sm`} 
                                    />
                                </div>
                                
                                <h6 className={`font-bold text-sm ${isNewCycle ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {isNewCycle ? '🔄 NOVO CICLO DE VIDA INICIADO' : event.type.replace(/_/g, ' ').toUpperCase()}
                                </h6>
                                
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                    {event.details}
                                </p>
                            </div>

                            {/* Cycle Separator Line */}
                            {isNewCycle && index < timelineEvents.length - 1 && (
                                <div className="mt-8 mb-4 flex items-center gap-2">
                                    <div className="h-px bg-blue-200 flex-1"></div>
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                        Ciclo Anterior
                                    </span>
                                    <div className="h-px bg-blue-200 flex-1"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {timelineEvents.length === 0 && (
                    <p className="text-sm text-gray-400 italic">Nenhum histórico registrado para este card.</p>
                )}
            </div>
        </div>
    );
}
