import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    ArrowUpRight,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    ChevronLeft,
    ChevronRight,
    Network,
    List
} from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';
import { AffiliateNetwork } from '../components/AffiliateNetwork';
import { ORGANIZATION_ID } from '../lib/config';

interface Referral {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
    is_active: boolean;
    status: string;
    commission?: string;
    product?: string;
}

const AffiliateReferrals: React.FC = () => {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [affiliateId, setAffiliateId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'network'>('list');

    const isSalesType = profile?.registration_type === 'sales';

    useEffect(() => {
        if (isSalesType && viewMode === 'network') {
            setViewMode('list');
        }
    }, [isSalesType, viewMode]);

    const [stats, setStats] = useState([
        { label: 'Total de Indicações', value: '0', icon: Users, color: 'text-blue-500', key: 'total' },
        { label: 'Ativos', value: '0', icon: CheckCircle, color: 'text-emerald-500', key: 'active' },
        { label: 'Inativos', value: '0', icon: XCircle, color: 'text-red-500', key: 'inactive' },
        { label: 'Hoje', value: '0', icon: Clock, color: 'text-amber-500', key: 'today' },
    ]);

    useEffect(() => {
        if (user) {
            fetchReferrals();
        }
    }, [user]);

    const fetchReferrals = async () => {
        try {
            setLoading(true);

            // 1. Pegar o ID de afiliado do usuário logado
            const { data: affDataList, error: affError } = await supabase
                .from('affiliates')
                .select('id')
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID)
                .limit(1);

            if (affError) throw affError;
            
            const affData = affDataList?.[0] || null;
            
            if (!affData) {
                setReferrals([]);
                setLoading(false);
                return;
            }
            
            setAffiliateId(affData.id);

            // 2. Buscar indicações (downline)
            const { data, error } = await supabase
                .from('affiliates')
                .select('*')
                .eq('sponsor_id', affData.id)
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedReferrals = (data || []).map(ref => ({
                ...ref,
                status: ref.is_active ? 'Ativo' : 'Inativo',
                product: 'Nível Afiliado',
                commission: 'R$ 0,00'
            }));

            setReferrals(formattedReferrals);

            // 3. Calcular Estatísticas
            const activeCount = formattedReferrals.filter(r => r.is_active).length;
            const inactiveCount = formattedReferrals.length - activeCount;
            const today = new Date().toISOString().split('T')[0];
            const todayCount = formattedReferrals.filter(r => r.created_at.startsWith(today)).length;

            setStats([
                { label: 'Total de Indicações', value: formattedReferrals.length.toString(), icon: Users, color: 'text-blue-500', key: 'total' },
                { label: 'Ativos', value: activeCount.toString(), icon: CheckCircle, color: 'text-emerald-500', key: 'active' },
                { label: 'Inativos', value: inactiveCount.toString(), icon: XCircle, color: 'text-red-500', key: 'inactive' },
                { label: 'Hoje', value: todayCount.toString(), icon: Clock, color: 'text-amber-500', key: 'today' },
            ]);

        } catch (error: any) {
            console.error('Erro ao buscar indicações:', error);
            toast.error('Erro ao carregar dados das indicações.');
        } finally {
            setLoading(false);
        }
    };

    const filteredReferrals = referrals.filter(ref => {
        const matchesSearch = ref.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ref.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Todos' || ref.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExportCSV = () => {
        if (filteredReferrals.length === 0) {
            toast.error('Não há dados para exportar.');
            return;
        }

        const headers = ['Nome', 'E-mail', 'Data', 'Status'];
        const rows = filteredReferrals.map(ref => [
            ref.full_name,
            ref.email,
            new Date(ref.created_at).toLocaleDateString('pt-BR'),
            ref.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `indicacoes_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Arquivo CSV exportado com sucesso!');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <AffiliateLayout>
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#0B1221]">Minhas Indicações</h1>
                    <p className="text-slate-500 font-medium font-inter">Acompanhe sua rede de afiliados e indicações diretas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex gap-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-[#0B1221] text-white' : 'text-slate-400 hover:text-[#0B1221]'}`}
                        >
                            <List className="w-4 h-4" />
                            Lista
                        </button>
                        {!isSalesType && (
                            <button
                                onClick={() => setViewMode('network')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'network' ? 'bg-[#0B1221] text-white' : 'text-slate-400 hover:text-[#0B1221]'}`}
                            >
                                <Network className="w-4 h-4" />
                                Rede
                            </button>
                        )}
                    </div>
                    <button
                        onClick={fetchReferrals}
                        className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-[#2980B9] transition-all"
                    >
                        <Clock className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black text-[#0B1221] mt-1">
                            {loading ? <span className="animate-pulse">...</span> : stat.value}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 md:p-10 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-[#2980B9] transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-600 outline-none focus:border-[#2980B9] text-sm appearance-none cursor-pointer pr-10"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="Todos">Todos os Status</option>
                            <option value="Ativo">Ativos</option>
                            <option value="Inativo">Inativos</option>
                        </select>

                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-6 py-3 bg-[#0B1221] rounded-2xl font-bold text-white hover:bg-[#1a2436] transition-all text-sm shadow-lg shadow-blue-900/10 uppercase tracking-widest text-xs"
                        >
                            <Download className="w-4 h-4 text-[#2980B9]" />
                            Exportar
                        </button>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2980B9]"></div>
                                <p className="mt-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Carregando rede...</p>
                            </div>
                        ) : filteredReferrals.length > 0 ? (
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="text-left py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Afiliado Indicado
                                        </th>
                                        <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível / Cargo</th>
                                        <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Cadastro</th>
                                        <th className="text-center py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="text-right py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredReferrals.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-[#0B1221] text-[#2980B9] flex items-center justify-center font-black text-xs shadow-lg shadow-blue-900/10 uppercase">
                                                        {item.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[#0B1221]">{item.full_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{item.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Afiliado N1</span>
                                            </td>
                                            <td className="py-6 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#0B1221]">{formatDate(item.created_at).day}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{formatDate(item.created_at).time}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                    {item.status === 'Ativo' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <button className="p-2 text-slate-300 hover:text-[#0B1221] transition-all">
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-20 text-center">
                                <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">Nenhuma indicação encontrada nesta organização.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8">
                        <AffiliateNetwork rootAffiliateId={affiliateId || undefined} />
                    </div>
                )}

                <div className="p-8 border-t border-slate-50 flex justify-between items-center text-xs">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">
                        Total: {filteredReferrals.length} indicações
                    </p>
                    <div className="flex gap-2">
                        <button className="p-2 bg-slate-50 text-slate-300 rounded-xl cursor-not-allowed">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button className="p-2 bg-slate-50 text-slate-300 rounded-xl cursor-not-allowed">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </AffiliateLayout>
    );
};

export default AffiliateReferrals;
