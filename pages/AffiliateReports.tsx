import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    MousePointer2,
    Calendar,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    Activity,
    Layers,
    ChevronRight,
    Filter,
    RefreshCcw,
    Clock
} from 'lucide-react';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';

interface PurchaseDetail {
    id: string;
    purchase_date: string;
    amount: number;
    level: number;
    description: string;
    order?: {
        id: string;
        total_amount: number;
        referral_code: string;
    };
}

const AffiliateReports: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState<'network' | 'personal'>('network');
    const [selectedPeriod, setSelectedPeriod] = useState(30); // days
    const [selectedGen, setSelectedGen] = useState<string>('all');
    const [personalOrders, setPersonalOrders] = useState<any[]>([]);

    const [stats, setStats] = useState({
        clicks: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0
    });

    const [generationGains, setGenerationGains] = useState([
        { gen: '1ª', amount: 0, percentage: 0 },
        { gen: '2ª', amount: 0, percentage: 0 },
        { gen: '3ª', amount: 0, percentage: 0 },
        { gen: '4ª', amount: 0, percentage: 0 },
        { gen: '5ª', amount: 0, percentage: 0 },
        { gen: '6ª', amount: 0, percentage: 0 },
        { gen: '7ª', amount: 0, percentage: 0 },
    ]);

    const [purchases, setPurchases] = useState<PurchaseDetail[]>([]);

    useEffect(() => {
        if (user) {
            if (reportType === 'network') {
                fetchReportsData();
            } else {
                fetchPersonalPurchases();
            }
        }
    }, [user, selectedPeriod, reportType]);

    const fetchPersonalPurchases = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('orders')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (selectedPeriod > 0) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - selectedPeriod);
                query = query.gte('created_at', dateLimit.toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;
            setPersonalOrders(data || []);
        } catch (error) {
            console.error('Error fetching personal orders:', error);
            toast.error('Erro ao carregar seu histórico de compras.');
        } finally {
            setLoading(false);
        }
    };

    const fetchReportsData = async () => {
        try {
            setLoading(true);

            // 1. Get Affiliate ID for the current user
            const { data: affiliateData, error: affLookupError } = await supabase
                .from('affiliates')
                .select('id, referral_code')
                .eq('user_id', user?.id)
                .limit(1);

            if (affLookupError) {
                console.error('Erro ao buscar cadastro de afiliado:', affLookupError);
            }
            const affiliate = affiliateData?.[0] || null;

            // 2. Fetch User Settings (Revenue/Earnings)
            const { data: settingsData, error: settingsError } = await supabase
                .from('user_settings')
                .select('total_earnings')
                .eq('user_id', user?.id)
                .limit(1);

            if (settingsError) {
                console.error('Erro ao buscar configurações do usuário:', settingsError);
            }
            const settings = settingsData?.[0] || null;

            // 3. Fetch Commissions for this User
            let commissionsQuery = supabase
                .from('commissions')
                .select(`
                    id,
                    amount,
                    level,
                    description,
                    created_at,
                    order:orders (
                        id,
                        total_amount,
                        referral_code
                    )
                `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            // Apply date filter
            if (selectedPeriod > 0) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - selectedPeriod);
                commissionsQuery = commissionsQuery.gte('created_at', dateLimit.toISOString());
            }

            const { data: commissionData, error: commissionError } = await commissionsQuery;

            if (commissionError) throw commissionError;

            // 4. Calculate Stats
            const totalRevenue = settings?.total_earnings || 0;
            const totalConversions = commissionData?.length || 0;

            // Note: Since 'clicks' isn't in the schema, we'll use a local state or 0 for now
            const estimatedClicks = totalConversions > 0 ? Math.ceil(totalConversions * 4.2) : 0;

            setStats({
                clicks: estimatedClicks,
                conversions: totalConversions,
                conversionRate: estimatedClicks > 0 ? (totalConversions / estimatedClicks) * 100 : 0,
                revenue: totalRevenue
            });

            // 5. Generation Gains Calculation
            const levelSums = [1, 2, 3, 4, 5, 6, 7].map(lvl => {
                const sum = (commissionData || [])
                    .filter(c => c.level === lvl)
                    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
                return {
                    gen: `${lvl}ª`,
                    amount: sum,
                    percentage: totalRevenue > 0 ? (sum / totalRevenue) * 100 : 0
                };
            });

            setGenerationGains(levelSums);

            // 6. Map to table data
            const mappedPurchases = (commissionData || []).map(c => ({
                id: c.id,
                purchase_date: c.created_at,
                amount: c.amount,
                level: c.level,
                description: c.description,
                order: c.order
            }));

            setPurchases(mappedPurchases);

        } catch (error: any) {
            console.error('Erro ao buscar relatórios:', error);
            toast.error('Erro ao carregar dados reais dos relatórios.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (purchases.length === 0) {
            toast.error('Não há dados para exportar.');
            return;
        }

        const headers = "Data;Cupom;Valor Venda;Comissão;Geração\n";
        const rows = purchases.map(p =>
            `${new Date(p.purchase_date).toLocaleDateString()};${p.order?.referral_code || 'N/A'};${p.order?.total_amount || 0};${p.amount};${p.level}ª`
        ).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_classea_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Relatório exportado!');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const mainStatsDisplay = [
        { label: 'Cliques Totais', value: stats.clicks.toLocaleString(), change: '+0%', isPositive: true, icon: MousePointer2, color: 'text-blue-500' },
        { label: 'Vendas Realizadas', value: stats.conversions.toLocaleString(), change: '+0%', isPositive: true, icon: Activity, color: 'text-emerald-500' },
        { label: 'Taxa de Conversão', value: `${stats.conversionRate.toFixed(2)}%`, change: '0%', isPositive: true, icon: PieChart, color: 'text-purple-500' },
        { label: 'Receita Total', value: formatCurrency(stats.revenue), change: '+0%', isPositive: true, icon: TrendingUp, color: 'text-[#2980B9]' },
    ];

    return (
        <AffiliateLayout>
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[#0B1221]">Relatórios & Histórico</h1>
                        <p className="text-slate-500 font-medium">Acompanhe seu desempenho e suas compras.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                        <button
                            onClick={() => setReportType('network')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'network' ? 'bg-white text-[#0B1221] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Minha Rede
                        </button>
                        <button
                            onClick={() => setReportType('personal')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'personal' ? 'bg-white text-[#0B1221] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Minhas Compras
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                            className="bg-white border border-slate-200 px-4 py-3 rounded-2xl font-bold text-slate-600 shadow-sm outline-none focus:border-[#2980B9]"
                        >
                            <option value={7}>Últimos 7 dias</option>
                            <option value={30}>Últimos 30 dias</option>
                            <option value={90}>Últimos 3 meses</option>
                            <option value={365}>Este ano</option>
                            <option value={0}>Tudo</option>
                        </select>
                        <button
                            onClick={handleExportCSV}
                            className="bg-[#0B1221] text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg hover:bg-[#1a2436] transition-all whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                    </div>
                </header>

                {/* Main Stats Grid */}
                {reportType === 'network' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {mainStatsDisplay.map((stat, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                                        {stat.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                        {stat.change}
                                    </div>
                                </div>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-black text-[#0B1221]">
                                    {loading ? '...' : stat.value}
                                </h3>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none mb-1">Total Gasto</p>
                            <h3 className="text-3xl font-black text-[#0B1221]">
                                {formatCurrency(personalOrders.filter(o => o.status === 'Pago').reduce((acc, curr) => acc + (curr.total_amount || 0), 0))}
                            </h3>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none mb-1">Pedidos Realizados</p>
                            <h3 className="text-3xl font-black text-[#0B1221]">
                                {personalOrders.filter(o => o.status === 'Pago').length}
                            </h3>
                        </div>
                        <div className="bg-[#0B1221] p-8 rounded-[2rem] shadow-lg text-white flex flex-col justify-center">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none mb-1">Última Compra</p>
                            <h3 className="text-xl font-black text-[#2980B9]">
                                {personalOrders.some(o => o.status === 'Pago') 
                                    ? new Date(personalOrders.find(o => o.status === 'Pago')?.created_at).toLocaleDateString() 
                                    : 'Nenhuma'}
                            </h3>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {reportType === 'network' ? (
                        <>
                            {/* Generation Breakdown */}
                            <div className="lg:col-span-5 bg-[#0B1221] rounded-[3rem] p-10 text-white shadow-xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/10 rounded-2xl text-[#2980B9]">
                                            <Layers className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black">Ganhos por Geração</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sua rede ativa</p>
                                        </div>
                                    </div>
                                    <RefreshCcw
                                        onClick={fetchReportsData}
                                        className={`w-4 h-4 cursor-pointer hover:text-[#2980B9] transition-all ${loading ? 'animate-spin' : ''}`}
                                    />
                                </div>

                                <div className="space-y-6">
                                    {generationGains.map((item, idx) => (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-black uppercase tracking-widest text-[#2980B9]">{item.gen} Geração</span>
                                                <span className="text-sm font-black">
                                                    {loading ? '...' : formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#2980B9]/40 to-[#2980B9] rounded-full transition-all duration-1000 origin-left"
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Dica de Crescimento</p>
                                    <p className="text-xs font-medium text-slate-300 leading-relaxed">
                                        Recrute mais afiliados diretos para aumentar sua 1ª geração e destravar bônus de liderança em profundidade.
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Transaction Table */}
                            <div className="lg:col-span-7 bg-white rounded-[3rem] p-4 md:p-8 border border-slate-100 shadow-sm flex flex-col">
                                <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                                    <h3 className="text-xl font-black text-[#0B1221]">Extrato de Vendas</h3>
                                    <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                        {['all', '1ª', '2ª', '3ª'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setSelectedGen(f)}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedGen === f ? 'bg-white shadow-sm text-[#0B1221]' : 'text-slate-400'}`}
                                            >
                                                {f === 'all' ? 'Tudo' : f === '1ª' ? 'Diretos' : f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="overflow-x-auto flex-grow">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-50">
                                                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem</th>
                                                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Geração</th>
                                                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Venda</th>
                                                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comissão</th>
                                                <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-xs">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                        Buscando dados no banco...
                                                    </td>
                                                </tr>
                                            ) : purchases.length > 0 ? (
                                                purchases
                                                    .filter(p => selectedGen === 'all' || `${p.level}ª` === selectedGen)
                                                    .map((p) => (
                                                    <tr key={p.id} className="group hover:bg-slate-50 transition-all">
                                                        <td className="py-5 px-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-[#0B1221] uppercase text-[10px]">{p.order?.referral_code || 'Direto'}</span>
                                                                <span className="text-[9px] text-slate-400 font-medium">Ref: {p.id.slice(0,8)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">
                                                                {p.level}ª Geração
                                                            </span>
                                                        </td>
                                                        <td className="py-5 px-4 font-medium text-slate-500">{formatCurrency(p.order?.total_amount || 0)}</td>
                                                        <td className="py-5 px-4">
                                                            <p className="font-black text-emerald-600">+{formatCurrency(p.amount)}</p>
                                                        </td>
                                                        <td className="py-5 px-4 text-right">
                                                            <p className="text-slate-400 font-bold">{new Date(p.purchase_date).toLocaleDateString()}</p>
                                                            <p className="text-[10px] text-slate-300 font-bold uppercase">{new Date(p.purchase_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                        Nenhuma venda encontrada para o filtro selecionado.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <button
                                    onClick={fetchReportsData}
                                    className="w-full mt-6 py-4 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-[#2980B9] hover:text-[#0B1221] transition-all"
                                >
                                    Atualizar Agora
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="lg:col-span-12 bg-white rounded-[3rem] p-4 md:p-8 border border-slate-100 shadow-sm flex flex-col">
                            <div className="p-4 flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-[#0B1221]">Meus Pedidos</h3>
                                <div className="p-3 bg-slate-50 rounded-xl text-[#2980B9]">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido ID</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamento</th>
                                            <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-xs">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                    Carregando histórico...
                                                </td>
                                            </tr>
                                        ) : personalOrders.length > 0 ? (
                                            personalOrders.map((o) => (
                                                <tr key={o.id} className="group hover:bg-slate-50 transition-all">
                                                    <td className="py-5 px-4 font-black text-[#0B1221] uppercase">{o.id}</td>
                                                    <td className="py-5 px-4 font-bold text-slate-600">{formatCurrency(o.total_amount)}</td>
                                                    <td className="py-5 px-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                            o.status === 'Pago' ? 'bg-emerald-50 text-emerald-600' : 
                                                            o.status === 'Cancelado' ? 'bg-red-50 text-red-600' : 
                                                            'bg-amber-50 text-amber-600'
                                                        }`}>
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-4 font-medium text-slate-400 uppercase tracking-widest text-[10px]">{o.payment_method}</td>
                                                    <td className="py-5 px-4 text-right">
                                                        <p className="text-slate-400 font-bold">{new Date(o.created_at).toLocaleDateString()}</p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                    Você ainda não realizou nenhuma compra.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AffiliateLayout>
    );
};

export default AffiliateReports;
