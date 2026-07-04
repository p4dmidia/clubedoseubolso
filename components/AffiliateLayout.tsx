import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Wallet,
    TrendingUp,
    ExternalLink,
    Library,
    LogOut,
    Star,
    Menu,
    X,
    Settings,
    ShieldAlert,
    CreditCard,
    Sparkles,
    CheckCircle,
    ShoppingBag,
    Info,
    HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { ORGANIZATION_ID } from '../lib/config';
import toast from 'react-hot-toast';

interface AffiliateLayoutProps {
    children: React.ReactNode;
}

const AffiliateLayout: React.FC<AffiliateLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { user, profile } = useAuth();
    const { clearCart } = useCart();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [affiliate, setAffiliate] = React.useState<any>(null);
    const [asaasWalletId, setAsaasWalletId] = React.useState<string | null>(null);
    const [loadingAff, setLoadingAff] = React.useState(true);
    const [isTutorialOpen, setIsTutorialOpen] = React.useState(false);

    React.useEffect(() => {
        if (!user) {
            setLoadingAff(false);
            return;
        }

        const fetchAffStatus = async () => {
            try {
                const { data } = await supabase
                    .from('affiliates')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('organization_id', ORGANIZATION_ID)
                    .maybeSingle();
                if (data) {
                    setAffiliate(data);
                }

                // Query asaas_wallet_id from user_settings
                const { data: settingsData } = await supabase
                    .from('user_settings')
                    .select('asaas_wallet_id')
                    .eq('user_id', user.id)
                    .eq('organization_id', ORGANIZATION_ID)
                    .maybeSingle();

                if (settingsData) {
                    setAsaasWalletId(settingsData.asaas_wallet_id || null);
                }
            } catch (err) {
                console.error('Error fetching affiliate status:', err);
            } finally {
                setLoadingAff(false);
            }
        };

        fetchAffStatus();
    }, [user]);

    const isSettingsPage = location.pathname === '/afiliado/settings';
    const isBlocked = (profile?.role === 'affiliate') && !asaasWalletId && !isSettingsPage;

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success('Sessão encerrada com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao sair do sistema.');
        }
    };

    const menuItems = [];
    if (profile?.role === 'affiliate' || profile?.role === 'admin_master' || profile?.role === 'admin_op') {
        menuItems.push(
            { label: 'Dashboard', icon: LayoutDashboard, path: '/afiliado/dashboard' },
            { label: 'Área do Cliente', icon: ShoppingBag, path: '/cliente/compras' },
            { label: 'Indicações', icon: Users, path: '/afiliado/referrals' },
            { label: 'Financeiro', icon: Wallet, path: '/afiliado/financial' },
            { label: 'Relatórios', icon: TrendingUp, path: '/afiliado/reports' },
            { label: 'Materiais', icon: Library, path: '/afiliado/materials' },
            { label: 'Configurações', icon: Settings, path: '/afiliado/settings' },
        );
    } else {
        menuItems.push(
            { label: 'Área do Cliente', icon: ShoppingBag, path: '/cliente/compras' },
            { label: 'Configurações', icon: Settings, path: '/afiliado/settings' },
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row overflow-x-hidden">
            {/* Mobile Header */}
            <header className="lg:hidden h-16 bg-[#0B1221] px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
                <Link to="/" onClick={() => setIsSidebarOpen(false)}>
                    <div className="bg-white px-3 py-1.5 rounded-xl flex items-center justify-center">
                        <img src="/assets/logo.png" alt="Clube do Seu Bolso" className="h-6 w-auto" />
                    </div>
                </Link>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-white hover:text-[#2980B9] transition-colors"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#0B1221]/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-72 bg-[#0B1221] flex flex-col p-6 text-white shrink-0 fixed h-full z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-auto
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="mb-12 px-2 flex items-center justify-between">
                    <Link to="/">
                        <div className="bg-white px-3 py-2.5 rounded-2xl flex items-center justify-center">
                            <img src="/assets/logo.png" alt="Clube do Seu Bolso" className="h-8 w-auto" />
                        </div>
                    </Link>
                </div>

                <nav className="flex-grow space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all group ${isActive
                                    ? 'bg-[#2980B9]/10 text-[#2980B9]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#2980B9]' : 'group-hover:text-[#2980B9]'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Usuário</p>
                        <p className="text-sm font-medium truncate mb-4">{user?.email}</p>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            SAIR DO SISTEMA
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto">
                {loadingAff ? (
                    <div className="min-h-[60vh] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2980B9]"></div>
                    </div>
                ) : isBlocked ? (
                    <div className="max-w-3xl mx-auto py-12 px-4">
                        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2980B9] to-[#27AE60]"></div>
                            
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 bg-amber-50 text-amber-500">
                                    <ShieldAlert className="w-10 h-10 animate-bounce" />
                                </div>
                                                        <h2 className="text-3xl font-black text-[#0B1221] mb-4">
                                    Receba suas comissões direto na sua conta!
                                </h2>
                                
                                <p className="text-slate-500 font-medium text-sm max-w-xl leading-relaxed mb-8">
                                    Seja bem-vindo ao Clube do Seu Bolso! Para que você possa receber suas comissões direto na sua conta de forma automática e segura, nós utilizamos a plataforma de pagamentos **Asaas**. Para começar a divulgar os produtos e ativar o seu link de indicações, basta criar uma conta gratuita no Asaas e depois conectar a sua carteira aqui.
                                </p>

                                <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-100/50 mb-10 text-left space-y-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cadastro 100% gratuito e rápido no Asaas</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-[#2980B9] shrink-0" />
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ativação imediata do seu link de indicações</span>
                                    </div>
                                </div>

                                <div className="w-full flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsTutorialOpen(true)}
                                        className="flex-1 bg-transparent border-2 border-slate-200 text-slate-700 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 text-center"
                                    >
                                        <Info className="w-5 h-5 text-[#2980B9]" />
                                        VER PASSO A PASSO
                                    </button>
                                    <Link
                                        to="/afiliado/settings?tab=bank"
                                        className="flex-1 bg-[#0B1221] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2980B9] transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-[#2980B9]/20 text-center"
                                    >
                                        <Settings className="w-5 h-5" />
                                        VINCULAR CONTA ASAAS
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    children
                )}
            </main>

            {isTutorialOpen && (
                <div className="fixed inset-0 bg-[#0B1221]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-8 pb-4 border-b border-slate-50 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-[#0B1221] text-left">Como obter o identificador da sua carteira Asaas</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-left">Siga o passo a passo para configurar seus recebimentos</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsTutorialOpen(false)}
                                className="p-2 text-slate-400 hover:text-[#0B1221] hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6 text-sm text-slate-600 font-medium leading-relaxed text-left">
                            
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                        1
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#0B1221] text-sm">Criar conta no Asaas</h4>
                                        <p className="mt-1 text-xs">
                                            Se você ainda não possui uma conta, acesse o site oficial do Asaas e crie sua conta gratuitamente. Ela será usada para gerenciar suas retiradas e comissões do Clube.
                                        </p>
                                        <a 
                                            href="https://www.asaas.com" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-black text-[#2980B9] hover:underline mt-2"
                                        >
                                            Ir para o Asaas <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                        2
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#0B1221] text-sm">Acessar a Integração da API</h4>
                                        <p className="mt-1 text-xs">
                                            Faça login no painel do Asaas. No menu lateral, acesse **Minha Conta** e depois clique na aba **Integrações** (ou acesse a seção de chaves de API).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#0B1221] text-sm">Copiar o identificador (Wallet ID) da carteira</h4>
                                        <p className="mt-1 text-xs">
                                            Nas configurações de integração, copie o identificador da sua carteira. O código é um identificador único de formato padrão (ex: `8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d`) contendo letras, números e traços.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                        4
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#0B1221] text-sm">Vincular a carteira no Clube do Seu Bolso</h4>
                                        <p className="mt-1 text-xs">
                                            Com o Wallet ID copiado, feche esta tela de tutorial, clique no botão **Vincular Conta Asaas** e cole a chave no campo **Identificador da Carteira Asaas (Wallet ID)**. Por fim, salve as configurações.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-sky-50 border border-sky-100 rounded-3xl p-6 flex gap-4 items-start">
                                <HelpCircle className="w-5 h-5 text-[#2980B9] shrink-0 mt-0.5" />
                                <div className="text-xs leading-relaxed text-[#0B1221]">
                                    <h5 className="font-black uppercase tracking-wider mb-1">Por que isso é necessário?</h5>
                                    <p className="text-slate-600 font-medium">
                                        Para a sua segurança e comodidade, todos os pagamentos de comissões são processados de forma automatizada pelo Asaas. Conectar a sua carteira garante que seus ganhos sejam transferidos de forma imediata e sem burocracia.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-amber-50/50 border border-amber-100/60 rounded-3xl p-6 flex gap-4 items-start">
                                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-xs leading-relaxed text-[#0B1221]">
                                    <h5 className="font-black uppercase tracking-wider mb-1">Regra de Ativação Mensal</h5>
                                    <p className="text-slate-600 font-medium">
                                        Para ter direito ao recebimento automático das comissões, você deve se manter ativo mensalmente. A ativação ocorre de duas maneiras:
                                    </p>
                                    <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-600 font-medium">
                                        <li>Indicar pelo menos 1 novo assinante (cliente) a cada 30 dias; ou</li>
                                        <li>Pagar a taxa de ativação de R$ 17,00 (descontada do seu saldo de comissões, conforme o Contrato de Afiliação).</li>
                                    </ul>
                                    <p className="text-slate-600 font-medium mt-2">
                                        Se inativo, as comissões geradas no período irão para a conta da GD Finance e constarão em seu painel como <strong>Saldo Bloqueado</strong>. Você poderá solicitar o resgate assim que se reativar, autorizando o desconto da taxa.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 pt-4 border-t border-slate-50 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsTutorialOpen(false)}
                                className="bg-[#0B1221] hover:bg-[#2980B9] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Entendi, Fechar Tutorial
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AffiliateLayout;
