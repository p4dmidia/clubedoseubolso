import React, { useState, useEffect } from 'react';
import {
    Users,
    Wallet,
    TrendingUp,
    Copy,
    CheckCircle,
    ChevronRight,
    ArrowUpRight,
    Clock,
    ExternalLink,
    Award,
    ShoppingCart,
    UserPlus,
    AlertCircle,
    Lock
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import { useNavigate, Link } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';

const AffiliateDashboard: React.FC = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [affiliateData, setAffiliateData] = useState<any>(null);
    const [walletData, setWalletData] = useState<any>(null);
    const [activeReferralsCount, setActiveReferralsCount] = useState(0);
    const [recentClientsCount, setRecentClientsCount] = useState(0);
    const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
    const [recentCommissions, setRecentCommissions] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;

            try {
                setLoading(true);

                // 1. Buscar dados do Afiliado (tentando restringir por organization_id se possível)
                const { data: affData, error: affErr } = await supabase
                    .from('affiliates')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('organization_id', ORGANIZATION_ID)
                    .limit(1);

                if (affErr) {
                    console.error('DEBUG: Erro ao buscar dados do afiliado:', affErr);
                    throw affErr;
                }
                
                const aff = affData?.[0] || null;
                if (!aff) {
                    // Se não encontrar o afiliado, tenta criar AUTOMATICAMENTE (Self-Healing)
                    console.warn('Afiliado não encontrado. Tentando auto-vínculo...');
                    const success = await handleAutoLink();
                    if (success) {
                        // Recarrega os dados após o vínculo automático
                        return fetchDashboardData();
                    }
                    setAffiliateData(null);
                } else {
                    setAffiliateData(aff);

                    // 2. Buscar dados Financeiros
                    const { data: walletDataList, error: walletErr } = await supabase
                        .from('user_settings')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('organization_id', ORGANIZATION_ID)
                        .limit(1);

                    if (!walletErr && walletDataList && walletDataList.length > 0) setWalletData(walletDataList[0]);

                    // Buscar se o afiliado está ativo mensalmente
                    const { data: activeRes } = await supabase
                        .rpc('is_affiliate_active', { p_user_id: user.id });
                    setIsActive(activeRes ?? false);

                    // 3. Buscar status do Consórcio (removido - apenas assinaturas)

                    // 4. Buscar indicações ativas (contagem)
                    const { count: activeCount } = await supabase
                        .from('affiliates')
                        .select('*', { count: 'exact', head: true })
                        .eq('sponsor_id', aff.id)
                        .eq('organization_id', ORGANIZATION_ID)
                        .eq('is_active', true);
                    
                    setActiveReferralsCount(activeCount || 0);

                    // Buscar indicações de clientes nos últimos 30 dias para a regra de ativação
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                    const { count: clientsCount } = await supabase
                        .from('user_profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('sponsor_id', user.id)
                        .eq('role', 'client')
                        .gte('created_at', thirtyDaysAgo);
                    
                    setRecentClientsCount(clientsCount || 0);

                    // 5. Buscar últimas indicações
                    const { data: recent } = await supabase
                        .from('affiliates')
                        .select('id, full_name, created_at, is_active')
                        .eq('sponsor_id', aff.id)
                        .eq('organization_id', ORGANIZATION_ID)
                        .order('created_at', { ascending: false })
                        .limit(5);
                    
                    setRecentReferrals(recent || []);

                    // 6. Buscar comissões recentes
                    const { data: comms } = await supabase
                        .from('commissions')
                        .select(`
                            id,
                            amount,
                            level,
                            created_at,
                            description
                        `)
                        .eq('user_id', user.id)
                        .eq('organization_id', ORGANIZATION_ID)
                        .order('created_at', { ascending: false })
                        .limit(5);
                    
                    setRecentCommissions(comms || []);
                }

            } catch (err: any) {
                console.error('Erro ao carregar dados do dashboard:', err);
                toast.error('Não foi possível carregar alguns dados.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const userLogin = affiliateData?.referral_code || "...";
    const domain = window.location.origin;
    const affiliateLink = `${domain}/ref/${userLogin.toLowerCase()}`;

    const handleCopyLink = () => {
        if (userLogin === "...") return;
        navigator.clipboard.writeText(affiliateLink);
        setCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenStore = () => {
        window.open('/', '_blank');
    };

    const handleSupportWhatsApp = () => {
        const message = encodeURIComponent('Olá, preciso de suporte com minha conta de afiliado, não está vinculada.');
        window.open(`https://wa.me/5571999772129?text=${message}`, '_blank');
    };

    const handleAutoLink = async () => {
        if (!user) return false;
        try {
            // 1. Buscar o patrocinador do perfil do usuário
            let sponsorAffId = null;
            
            // Tenta pegar o perfil atualizado
            const { data: currentProfile } = await supabase
                .from('user_profiles')
                .select('full_name, sponsor_id, login')
                .eq('id', user.id)
                .maybeSingle();

            if (currentProfile?.sponsor_id) {
                const { data: sAff } = await supabase
                    .from('affiliates')
                    .select('id')
                    .eq('user_id', currentProfile.sponsor_id)
                    .eq('organization_id', ORGANIZATION_ID)
                    .maybeSingle();
                sponsorAffId = sAff?.id || null;
            }

            // Se não houver patrocinador no perfil, tenta o root
            if (!sponsorAffId) {
                const { data: rootAff } = await supabase
                    .from('affiliates')
                    .select('id')
                    .eq('organization_id', ORGANIZATION_ID)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle();
                sponsorAffId = rootAff?.id || null;
            }

            const login = currentProfile?.login || user.email?.split('@')[0] || 'afiliado';
            const randomSuffix = Math.random().toString(36).substring(2, 6);

            const { error: insErr } = await supabase
                .from('affiliates')
                .insert({
                    user_id: user.id,
                    email: user.email,
                    full_name: currentProfile?.full_name || profile?.full_name || 'Afiliado',
                    referral_code: `${login}_${randomSuffix}`.toLowerCase(),
                    organization_id: ORGANIZATION_ID,
                    sponsor_id: sponsorAffId,
                    is_active: true,
                    is_verified: true
                });

            if (insErr) throw insErr;
            console.log('Auto-vínculo realizado com sucesso.');
            return true;
        } catch (err: any) {
            console.error('Erro no auto-vínculo:', err);
            return false;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const isAccountActive = !!walletData?.asaas_wallet_id;

    const stats = [
        {
            label: 'Saldo Disponível',
            value: formatCurrency(walletData?.available_balance || 0),
            description: 'Saldo liberado para saque',
            icon: Wallet,
            color: 'text-[#2980B9]'
        },
        {
            label: 'Saldo Bloqueado',
            value: formatCurrency(walletData?.frozen_balance || 0),
            description: 'Acumulado enquanto inativo',
            icon: Lock,
            color: 'text-amber-500',
            badge: walletData?.frozen_balance > 0 ? { text: 'Bloqueado', active: false } : null
        },
        {
            label: 'Ativação Mensal',
            value: isActive ? 'Ativo' : 'Inativo',
            description: isActive 
                ? 'Elegível para receber comissões' 
                : 'Regularize com indicação ou taxa',
            icon: Award,
            color: isActive ? 'text-emerald-500' : 'text-rose-500',
            badge: { text: isActive ? 'Ativo' : 'Inativo', active: isActive }
        },
        {
            label: 'Total Ganhos',
            value: formatCurrency(walletData?.total_earnings || 0),
            description: 'Histórico total acumulado',
            icon: TrendingUp,
            color: 'text-emerald-500'
        },
        {
            label: 'Indicações Ativas',
            value: activeReferralsCount.toString(),
            description: 'Afiliados ativos na sua rede',
            icon: Users,
            color: 'text-blue-500'
        },
        {
            label: 'Conta Asaas',
            value: walletData?.asaas_wallet_id ? 'Configurada' : 'Pendente',
            description: walletData?.asaas_wallet_id 
                ? 'Carteira vinculada com sucesso' 
                : 'Vincule sua conta para indicar',
            icon: Clock,
            color: walletData?.asaas_wallet_id ? 'text-emerald-500' : 'text-rose-500',
            badge: { text: walletData?.asaas_wallet_id ? 'Pronto' : 'Pendente', active: !!walletData?.asaas_wallet_id }
        },
    ];

    if (loading) {
        return (
            <AffiliateLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2980B9]"></div>
                </div>
            </AffiliateLayout>
        );
    }

    if (!affiliateData) {
        return (
            <AffiliateLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#0B1221]">Conta não vinculada</h2>
                        <p className="text-slate-500 mt-2 max-w-md">Seu perfil de afiliado não foi encontrado nesta loja. Se você acredita que isso é um erro, por favor entre em contato com o suporte.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-[#2980B9] text-[#0B1221] px-8 py-3 rounded-2xl font-black hover:bg-[#ffc947] transition-all uppercase text-xs tracking-widest shadow-lg shadow-amber-200"
                        >
                            Tentar Novamente
                        </button>
                        <button 
                            onClick={handleSupportWhatsApp}
                            className="bg-[#0B1221] text-white px-8 py-3 rounded-2xl font-black hover:bg-slate-800 transition-all uppercase text-xs tracking-widest"
                        >
                            Falar com Suporte
                        </button>
                    </div>
                </div>
            </AffiliateLayout>
        );
    }

    return (
        <AffiliateLayout>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#0B1221]">Olá, {affiliateData?.full_name?.split(' ')[0] || 'Afiliado'}!</h1>
                    <p className="text-slate-500 font-medium font-inter">Bora ver como estão seus resultados hoje?</p>
                </div>
                <button
                    onClick={handleOpenStore}
                    className="bg-white border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-2 font-bold text-[#0B1221] shadow-sm hover:shadow-md transition-all uppercase text-xs tracking-widest"
                >
                    <ExternalLink className="w-4 h-4 text-[#2980B9]" />
                    Ver Loja Clube do Seu Bolso
                </button>
            </header>

            {!isActive && (
                <div className="mb-8 bg-amber-50 border border-amber-200/80 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <h4 className="font-black text-[#0B1221] mb-1">Atenção: Sua conta de afiliado está Inativa</h4>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                Para liberar suas comissões acumuladas e receber seus ganhos futuros automaticamente, você precisa se manter ativo mensalmente.
                                Você pode se ativar indicando um novo cliente nos últimos 30 dias ou efetuando o pagamento da mensalidade de R$ 17,00 na aba <Link to="/afiliado/financial" className="text-[#2980B9] font-black underline hover:text-[#1f6391]">Financeiro</Link>.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/checkout?buy=d3b07384-d113-4171-bc06-9a7c936df312')}
                        className="px-5 py-3 bg-[#2980B9] hover:bg-[#1f6391] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 shadow-sm shrink-0"
                    >
                        Ativar via PIX (R$ 17,00)
                    </button>
                </div>
            )}


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all group overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-0 group-hover:scale-100"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl bg-slate-50 ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                {stat.badge && (
                                    <div className={`flex items-center text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                                        stat.badge.active 
                                            ? 'text-emerald-500 bg-emerald-50' 
                                            : 'text-rose-500 bg-rose-50'
                                    }`}>
                                        <ArrowUpRight className={`w-3 h-3 mr-1 ${!stat.badge.active && 'transform rotate-90'}`} />
                                        {stat.badge.text}
                                    </div>
                                )}
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                            <h3 className="text-2xl font-black text-[#0B1221]">{stat.value}</h3>
                            <p className="text-slate-400 text-xs font-semibold mt-1">{stat.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#0B1221] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-[#2980B9]/10 blur-3xl rounded-full"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                    <ShoppingCart className="w-6 h-6 text-[#2980B9]" />
                                </div>
                                <h2 className="text-2xl font-black mb-1">Link da Loja</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">Compartilhe e ganhe comissões.</p>
                                <div className="space-y-4">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-300 text-xs font-medium break-all font-mono leading-relaxed">
                                        {affiliateLink}
                                    </div>
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full bg-[#2980B9] text-[#0B1221] py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#ffc947] transition-all shadow-xl shadow-amber-500/10"
                                    >
                                        COPIAR LINK DA LOJA
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] p-10 text-[#0B1221] relative overflow-hidden shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                                    <UserPlus className="w-6 h-6 text-blue-500" />
                                </div>
                                <h2 className="text-2xl font-black mb-1">Rede de Afiliados</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">Expanda sua rede de parceiros.</p>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-500 text-xs font-medium break-all font-mono leading-relaxed">
                                        {affiliateLink}?to=register
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${affiliateLink}?to=register`);
                                            toast.success('Link de parceiro copiado!');
                                        }}
                                        className="w-full bg-blue-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/10"
                                    >
                                        COPIAR LINK DE PARCEIRO
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-[#0B1221]">Comissões Recentes</h3>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Histórico de rendimentos</p>
                            </div>
                            <button onClick={() => navigate('/financial')} className="text-[#2980B9] font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1">
                                Ver extrato <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 text-left">
                                        <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Descrição / Data</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Nível</th>
                                        <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Rendimento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentCommissions.length > 0 ? (
                                        recentCommissions.map((comm) => (
                                            <tr key={comm.id} className="group hover:bg-slate-50/30 transition-all">
                                                <td className="py-6 px-10">
                                                    <div className="font-black text-[#0B1221] text-sm">{comm.description}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{new Date(comm.created_at).toLocaleDateString('pt-BR')} às {new Date(comm.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-black text-[10px] tracking-widest">
                                                        NÍVEL {comm.level}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-10 text-right font-black text-emerald-500 text-base">
                                                    {formatCurrency(comm.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="py-20 text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <TrendingUp className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <p className="font-bold text-slate-400">Nenhuma comissão registrada ainda.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#2980B9]"></div>
                        <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 mx-auto mb-6 p-1 border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center">
                             <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${affiliateData?.full_name || 'A'}`} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                        </div>
                        <h3 className="text-2xl font-black text-[#0B1221]">{affiliateData?.full_name || 'Afiliado'}</h3>
                        <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">{affiliateData?.referral_code}</p>
                        
                        <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                <p className="text-xl font-black text-[#0B1221]">{activeReferralsCount}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo</p>
                                <p className="text-xl font-black text-emerald-500 truncate">{formatCurrency(walletData?.available_balance || 0)}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/network')}
                            className="w-full mt-10 bg-[#0B1221] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            MINHA REDE
                        </button>
                    </div>

                    <div className="bg-[#2980B9] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-xl shadow-blue-200/50 group">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-2xl font-black mb-1 relative z-10 text-white">Central de Ajuda</h3>
                        <p className="text-white/80 font-medium text-sm mb-8 relative z-10 leading-relaxed">Dúvidas sobre o sistema? Nossa equipe está pronta para te ajudar via WhatsApp.</p>
                        <button onClick={handleSupportWhatsApp} className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-black transition-all shadow-lg relative z-10">
                            FALAR NO WHATSAPP
                        </button>
                    </div>
                </div>
            </div>
        </AffiliateLayout>
    );
};

export default AffiliateDashboard;
