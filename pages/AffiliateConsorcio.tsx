import React, { useState, useEffect } from 'react';
import {
    Trophy,
    Calendar,
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    Info,
    History,
    Star,
    Loader2,
    ShieldCheck,
    Video,
    ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import AffiliateLayout from '../components/AffiliateLayout';
import toast from 'react-hot-toast';

const AffiliateConsorcio: React.FC = () => {
    const { user } = useAuth();
    const [participations, setParticipations] = useState<any[]>([]);
    const [selectedParticipationIndex, setSelectedParticipationIndex] = useState(0);
    const [draws, setDraws] = useState<any[]>([]);
    const [cStatus, setCStatus] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchConsortiumData();
        }
    }, [user]);

    const fetchConsortiumData = async () => {
        setIsLoading(true);
        try {
            // Fetch participant info and group info
            const { data: partData, error: partError } = await supabase
                .from('consortium_participants')
                .select(`
                    *,
                    consortium_groups (*)
                `)
                .eq('user_id', user?.id)
                .order('joined_at', { ascending: false });

            if (partError) throw partError;
            setParticipations(partData || []);

            if (partData && partData.length > 0) {
                const currentPart = partData[selectedParticipationIndex];
                await fetchGroupDetails(currentPart);
            }

        } catch (error) {
            console.error('Error fetching consortium data:', error);
            toast.error('Erro ao carregar dados do consórcio.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGroupDetails = async (part: any) => {
        if (!part) return;
        
        try {
            // Fetch draws for this group
            const { data: drawData, error: drawError } = await supabase
                .from('consortium_draws')
                .select(`
                    id,
                    draw_date,
                    lottery_number,
                    video_url,
                    official_result_url,
                    winner:consortium_participants (
                        lucky_number,
                        user:user_profiles (email)
                    )
                `)
                .eq('group_id', part.group_id)
                .order('created_at', { ascending: false });

            if (drawError) throw drawError;
            setDraws(drawData || []);

            // Fetch regularity status
            const { data: statusData, error: statusError } = await supabase
                .rpc('check_consortium_regularity', { p_user_id: user?.id });
            
            if (!statusError && statusData && statusData.length > 0) {
                setCStatus(statusData[0]);
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
        }
    };

    useEffect(() => {
        if (participations.length > 0) {
            fetchGroupDetails(participations[selectedParticipationIndex]);
        }
    }, [selectedParticipationIndex]);

    if (isLoading) {
        return (
            <AffiliateLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-[#2980B9] animate-spin" />
                    <p className="font-bold text-slate-400">Carregando seu consórcio...</p>
                </div>
            </AffiliateLayout>
        );
    }

    if (participations.length === 0) {
        return (
            <AffiliateLayout>
                <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                        <Star className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0B1221] mb-4">Você ainda não participa de um consórcio</h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        Adquira uma cota em nossa loja para ter acesso exclusivo a grupos de compra programada e sorteios mensais.
                    </p>
                    <button
                        onClick={() => window.location.href = '/consorcio'}
                        className="bg-[#2980B9] text-[#0B1221] font-black py-4 px-10 rounded-2xl hover:bg-[#0B1221] hover:text-white transition-all shadow-xl shadow-[#2980B9]/10"
                    >
                        CONHECER PLANOS
                    </button>
                </div>
            </AffiliateLayout>
        );
    }

    const participation = participations[selectedParticipationIndex];
    const { consortium_groups: group } = participation;

    return (
        <AffiliateLayout>
            <div className="space-y-8 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-[#0B1221]">Meu Consórcio</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Gestão de cotas e sorteios ativos</p>
                    </div>

                    {participations.length > 1 && (
                        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Escolher Cota:</span>
                            <div className="flex gap-2">
                                {participations.map((p, idx) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedParticipationIndex(idx)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                            selectedParticipationIndex === idx 
                                                ? 'bg-[#2980B9] text-[#0B1221]' 
                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                    >
                                        Cota {idx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Group Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-[#0B1221] text-white rounded-[2.5rem] p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <Trophy className="w-40 h-40" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    {participation.status === 'contemplated' && (
                                        <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                                            <Trophy className="w-3 h-3" />
                                            CONTEMPLADO
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black tracking-widest">
                                        {group.type === 'colchao' ? 'MODALIDADE COLCHÃO' : 'MODALIDADE LIVRE ESCOLHA'}
                                    </span>
                                    <span className="px-3 py-1 bg-[#2980B9] text-[#0B1221] rounded-full text-[10px] font-black tracking-widest">
                                        GRUPO {group.name}
                                    </span>
                                </div>
                                <h2 className="text-4xl font-black mb-10">
                                    Seu Número da Sorte: <span className="text-[#2980B9]">{participation.lucky_number.toString().padStart(2, '0')}</span>
                                </h2>
                                <div className="grid sm:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Status da Cota</p>
                                        <div className={`flex items-center gap-2 ${cStatus?.is_regular ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {cStatus?.is_regular ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span className="font-bold">Em Dia</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="font-bold">{cStatus?.status_text || 'Irregular'}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Próximo Sorteio</p>
                                        <div className="flex items-center gap-2 text-white">
                                            <Calendar className="w-4 h-4 text-[#2980B9]" />
                                            <span className="font-bold">
                                                {group.next_draw_date ? (
                                                    new Date(group.next_draw_date).toLocaleDateString('pt-BR')
                                                ) : (
                                                    (() => {
                                                        const d = new Date();
                                                        if (d.getDate() >= 11) d.setMonth(d.getMonth() + 1);
                                                        return `11/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                                    })()
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Membros No Grupo</p>
                                        <div className="flex items-center gap-2 text-white">
                                            <Users className="w-4 h-4" />
                                            <span className="font-bold">{group.current_participants} / {group.max_participants}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transparency Card */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 flex gap-6 items-start">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-emerald-900 mb-2 uppercase tracking-tight">Sorteio 100% Transparente</h4>
                                <p className="text-emerald-700/70 text-sm font-medium leading-relaxed">
                                    Este consórcio utiliza o sistema de auditoria externa via Loteria Federal. O vencedor é calculado de forma matemática após o sorteio oficial do governo, garantindo que ninguém possa manipular o resultado.
                                </p>
                            </div>
                        </div>

                        {/* History */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-xl font-black text-[#0B1221] flex items-center gap-2">
                                    <History className="w-5 h-5 text-[#2980B9]" />
                                    Histórico de Sorteios
                                </h3>
                            </div>
                            <div className="p-0">
                                {draws.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400 bg-slate-50/30">
                                        <Clock className="w-10 h-10 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">Aguardando primeiro sorteio do grupo</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <tr>
                                                <th className="px-8 py-4">Mês</th>
                                                <th className="px-8 py-4">Data</th>
                                                <th className="px-8 py-4">Semente Federal</th>
                                                <th className="px-8 py-4">Vencedor (Nº)</th>
                                                <th className="px-8 py-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {draws.map((draw) => (
                                                <tr key={draw.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-6 font-black text-[#0B1221]">
                                                        {draw.month_number ? `${draw.month_number}º` : '-'}
                                                    </td>
                                                    <td className="px-8 py-6 font-bold text-slate-500">
                                                        {new Date(draw.draw_date).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-8 py-6 font-mono text-slate-500">
                                                        {draw.lottery_number}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center font-black text-xs">
                                                                {draw.winner?.lucky_number.toString().padStart(2, '0')}
                                                            </span>
                                                            <span className="text-sm font-medium text-slate-600">
                                                                ***{draw.winner?.user?.email?.split('@')[0].slice(-3)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {draw.video_url ? (
                                                                <a
                                                                    href={draw.video_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-[#0B1221] hover:bg-[#2980B9] transition-all text-[10px] font-black"
                                                                >
                                                                    <Video className="w-3 h-3" />
                                                                    VER VÍDEO
                                                                </a>
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-slate-300 uppercase italic">Vídeo Pendente</span>
                                                            )}
                                                            {draw.official_result_url ? (
                                                                <a
                                                                    href={draw.official_result_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-[#0B1221] hover:bg-[#2980B9] transition-all text-[10px] font-black"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    PROVA CAIXA
                                                                </a>
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-slate-300 uppercase italic">Link Pendente</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#2980B9]/5 rounded-full"></div>
                            <h4 className="text-lg font-black text-[#0B1221] mb-6">Regras do Grupo</h4>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <span className="text-[#2980B9] font-black text-lg leading-none">□</span>
                                    <p className="text-sm text-slate-500 font-medium">as parcelas vencem todo dia 05 mas você tem até o dia 10 de cada mês para ficar em dia</p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#2980B9] font-black text-lg leading-none">□</span>
                                    <p className="text-sm text-slate-500 font-medium">você precisa estar em dia para participar do sorteio</p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#2980B9] font-black text-lg leading-none">□</span>
                                    <p className="text-sm text-slate-500 font-medium">o sorteio e realizado usando sempre o último resultado da loteria federal sempre o resultado do 1°prêmio</p>
                                </li>
                            </ul>
                            <div className="mt-8 pt-8 border-t border-slate-50">
                                <Link to="/contact" className="text-sm font-bold text-[#2980B9] hover:underline flex items-center justify-center gap-2">
                                    <Info className="w-4 h-4" />
                                    SUPORTE AO CONSORCIADO
                                </Link>
                            </div>
                        </div>

                        <div className="bg-[#2980B9]/5 rounded-[2.5rem] p-8 border border-[#2980B9]/10">
                            <h4 className="text-lg font-black text-[#0B1221] mb-4">Seu Grupo</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-slate-500 text-sm font-bold">Participantes</span>
                                    <span className="text-[#0B1221] font-black">{group.max_participants}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-t border-[#2980B9]/10">
                                    <span className="text-slate-500 text-sm font-bold">Progresso</span>
                                    <span className="text-[#0B1221] font-black">Mês {group.current_month || 0} de {group.max_participants}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-t border-[#2980B9]/10">
                                    <span className="text-slate-500 text-sm font-bold">Status Grupo</span>
                                    <span className={`px-3 py-1 ${group.status === 'finished' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'} rounded-full text-[10px] font-black`}>
                                        {group.status === 'finished' ? 'FINALIZADO' : 'EM PROGRESSO'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AffiliateLayout>
    );
};

export default AffiliateConsorcio;
