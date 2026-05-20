import React, { useState } from 'react';
import {
    Search,
    Trophy,
    Calendar,
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    Info,
    ArrowRight,
    Loader2,
    History,
    Video,
    ExternalLink,
    ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const ConsorcioTracking: React.FC = () => {
    const [cpf, setCpf] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCpf = cpf.replace(/\D/g, '');
        
        if (cleanCpf.length !== 11) {
            toast.error('Por favor, informe um CPF válido.');
            return;
        }

        setIsLoading(true);
        try {
            const { data: result, error } = await supabase.rpc('get_consortium_by_cpf', {
                p_cpf: cleanCpf
            });

            if (error) throw error;

            setData(result);
            setHasSearched(true);
            
            if (!result) {
                toast.error('Nenhuma participação encontrada para este CPF.');
            }
        } catch (error: any) {
            console.error('Error searching consortium:', error);
            toast.error('Erro ao realizar a busca. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCpf = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Header / Hero */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] aspect-square bg-slate-50 rounded-full -translate-y-[70%] z-0"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="bg-[#2980B9]/10 text-[#2980B9] text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-6 inline-block">
                        Área do Consorciado
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-[#0B1221] leading-tight mb-8">
                        Acompanhe seu <span className="text-[#2980B9]">Consórcio</span>
                    </h1>
                    
                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto mt-12">
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2980B9] transition-colors">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Digite seu CPF para consultar"
                                className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-6 pl-16 pr-32 text-lg font-bold outline-none focus:border-[#2980B9] shadow-xl shadow-slate-200/50 transition-all"
                                value={cpf}
                                onChange={(e) => setCpf(formatCpf(e.target.value))}
                                maxLength={14}
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="absolute right-3 top-3 bottom-3 bg-[#0B1221] text-white font-black px-6 rounded-2xl hover:bg-[#2980B9] hover:text-[#0B1221] transition-all flex items-center gap-2 group/btn disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        BUSCAR
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section className="container mx-auto px-4 max-w-6xl">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-[#2980B9] animate-spin" />
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Localizando sua participação...</p>
                    </div>
                ) : data ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Summary Header */}
                        <div className="bg-[#0B1221] text-white rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <Trophy className="w-48 h-48" />
                            </div>
                            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <p className="text-[#2980B9] font-black uppercase text-xs tracking-[0.2em] mb-4">Olá, {data.participant?.name ? data.participant.name.split(' ')[0] : 'Consorciado'}!</p>
                                    <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
                                        Seu Número da Sorte: <br />
                                        <span className="text-[#2980B9] text-6xl md:text-8xl">{data.participant?.lucky_number?.toString().padStart(2, '0') || '00'}</span>
                                    </h2>
                                    <div className="flex flex-wrap gap-4">
                                        <span className="px-5 py-2 bg-white/10 rounded-full text-[10px] font-black tracking-widest uppercase">
                                            {data.group?.name || 'Grupo Especial'}
                                        </span>
                                        <span className={`px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase ${data.participant?.regularity?.is_regular ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {data.participant?.regularity?.status_text || 'Situação não identificada'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                                        <Users className="w-6 h-6 text-[#2980B9] mb-4" />
                                        <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Grupo</p>
                                        <p className="text-xl font-black">{data.group?.current || 0} / {data.group?.max || 100}</p>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                                        <Calendar className="w-6 h-6 text-[#2980B9] mb-4" />
                                        <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Sorteios</p>
                                        <p className="text-xl font-black">Mensais</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transparency Alert */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 flex gap-6 items-start">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-emerald-900 mb-2 uppercase tracking-tight">Cálculo Auditável</h4>
                                <p className="text-emerald-700/70 text-sm font-medium leading-relaxed">
                                    O vencedor é definido com base no sorteio da Loteria Federal. A participação é totalmente transparente e você pode verificar o cálculo usando o número oficial sorteado pelo governo.
                                </p>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-xl font-black text-[#0B1221] flex items-center gap-3">
                                    <History className="w-6 h-6 text-[#2980B9]" />
                                    Últimos Sorteios do Grupo
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                {data.draws.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400">
                                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        <p className="font-bold uppercase tracking-widest text-xs">Nenhum sorteio realizado ainda</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            <tr>
                                                <th className="px-10 py-6">Data</th>
                                                <th className="px-10 py-6">Vencedor (Nº)</th>
                                                <th className="px-10 py-6 text-center">Transparência</th>
                                                <th className="px-10 py-6 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {data.draws.map((draw: any) => (
                                                <tr key={draw.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-10 py-8 font-black text-[#0B1221]">
                                                        {new Date(draw.draw_date).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[#2980B9] text-[#0B1221] flex items-center justify-center font-black">
                                                                {draw.winner_lucky_number?.toString().padStart(2, '0') || '??'}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                                Contemplado
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center justify-center gap-3">
                                                            {draw.video_url && (
                                                                <a href={draw.video_url} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-[#2980B9] hover:bg-[#2980B9]/10 transition-all">
                                                                    <Video className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                            {draw.official_result_url && (
                                                                <a href={draw.official_result_url} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-[#2980B9] hover:bg-[#2980B9]/10 transition-all">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                            ENTREGUE
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                ) : hasSearched ? (
                    <div className="py-32 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <AlertCircle className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-[#0B1221] mb-4">Participação Não Localizada</h3>
                        <p className="text-slate-500 max-w-md mx-auto font-medium">
                            Verifique se o CPF foi digitado corretamente. Se você acabou de comprar, pode levar alguns minutos para o sistema processar sua entrada no grupo.
                        </p>
                    </div>
                ) : (
                    <div className="py-32 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Info className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Informe seu CPF acima para ver sua situação</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ConsorcioTracking;
