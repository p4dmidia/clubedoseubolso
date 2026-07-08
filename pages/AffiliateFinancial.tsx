import React, { useState, useEffect } from 'react';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle,
    XCircle,
    DollarSign,
    CreditCard,
    PlusCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCcw,
    Send,
    Loader2
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Withdrawal {
    id: number;
    amount_requested: number;
    net_amount: number;
    status: string;
    pix_key: string;
    payment_method?: string;
    bank_name?: string;
    bank_agency?: string;
    bank_account?: string;
    bank_account_type?: string;
    bank_document?: string;
    proof_url?: string;
    created_at: string;
}

const AffiliateFinancial: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // PIX update modal (original)
    const [showPixModal, setShowPixModal] = useState(false);
    const [newPixKey, setNewPixKey] = useState('');

    // Withdrawal Request Modal (new)
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [withdrawalMethod, setWithdrawalMethod] = useState<'pix' | 'bank_transfer'>('pix');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [withdrawSource, setWithdrawSource] = useState<'available' | 'blocked'>('available');
    const [authorizeFee, setAuthorizeFee] = useState(false);
    const [activating, setActivating] = useState(false);

    // Financial Data States
    const [balance, setBalance] = useState({
        total: 0,
        available: 0,
        frozen: 0,
        withdrawn: 0
    });
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    
    // Bank & PIX profile details
    const [bankDetails, setBankDetails] = useState({
        pix_key: 'Não cadastrada',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        bank_account_type: '',
        bank_document: ''
    });

    useEffect(() => {
        if (user) {
            fetchFinancialData();
        }
    }, [user]);

    useEffect(() => {
        if (showWithdrawalModal) {
            if (balance.available >= 50) {
                setWithdrawSource('available');
            } else if (balance.frozen >= 50) {
                setWithdrawSource('blocked');
            }
            setAuthorizeFee(false);
        }
    }, [showWithdrawalModal, balance.available, balance.frozen]);

    const handleActivateWithBalance = async () => {
        if (balance.available + balance.frozen < 17) {
            toast.error('Saldo total insuficiente para ativação. Você precisa de no mínimo R$ 17,00.');
            return;
        }

        try {
            setActivating(true);
            const { error } = await supabase.rpc('activate_affiliate_with_balance', {
                p_user_id: user?.id
            });

            if (error) throw error;

            toast.success('Sua conta foi reativada com sucesso utilizando seu saldo!');
            fetchFinancialData();
        } catch (error: any) {
            console.error('Erro ao ativar com saldo:', error);
            toast.error(error.message || 'Erro ao processar ativação por saldo.');
        } finally {
            setActivating(false);
        }
    };

    const fetchFinancialData = async () => {
        try {
            setLoading(true);


            // 1. Fetch Balances & Bank info (user_settings)
            const { data: settingsData, error: settingsError } = await supabase
                .from('user_settings')
                .select('available_balance, frozen_balance, total_earnings, pix_key, bank_name, bank_agency, bank_account, bank_account_type, bank_document')
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID)
                .limit(1);

            if (settingsError) throw settingsError;
            
            const settings = settingsData?.[0] || null;

            if (!settings) {
                setLoading(false);
                return;
            }

            // 2. Fetch Withdrawal History
            const { data: withdrawData, error: withdrawError } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (withdrawError) throw withdrawError;

            // 3. Calculate Withdrawn amount
            const totalWithdrawn = (withdrawData || [])
                .filter(w => w.status === 'completed' || w.status === 'paid' || w.status === 'Pago')
                .reduce((acc, curr) => acc + Number(curr.amount_requested), 0);

            setBalance({
                total: Number(settings.total_earnings || 0),
                available: Number(settings.available_balance || 0),
                frozen: Number(settings.frozen_balance || 0),
                withdrawn: totalWithdrawn
            });

            // Buscar se o afiliado está ativo mensalmente
            const { data: activeRes } = await supabase.rpc('is_affiliate_active', { p_user_id: user?.id });
            setIsActive(activeRes ?? false);

            setWithdrawals(withdrawData || []);
            
            setBankDetails({
                pix_key: settings.pix_key || 'Não cadastrada',
                bank_name: settings.bank_name || '',
                bank_agency: settings.bank_agency || '',
                bank_account: settings.bank_account || '',
                bank_account_type: settings.bank_account_type || '',
                bank_document: settings.bank_document || ''
            });

            setNewPixKey(settings.pix_key || '');
            setWithdrawAmount(Number(settings.available_balance || 0).toFixed(2));

        } catch (error: any) {
            console.error('Erro ao buscar dados financeiros:', error);
            toast.error('Erro ao carregar dados financeiros.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePix = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPixKey.trim()) {
            toast.error('Informe uma chave PIX válida.');
            return;
        }

        try {
            setSubmitting(true);

            const { error } = await supabase
                .from('user_settings')
                .update({ pix_key: newPixKey.trim() })
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID);

            if (error) throw error;

            toast.success('Chave PIX atualizada com sucesso!');
            setBankDetails(prev => ({ ...prev, pix_key: newPixKey.trim() }));
            setShowPixModal(false);
            fetchFinancialData();
        } catch (error: any) {
            console.error('Erro ao atualizar PIX:', error);
            toast.error('Erro ao atualizar chave PIX.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const amount = Number(withdrawAmount);
        
        if (isNaN(amount) || amount < 50) {
            toast.error('O valor mínimo para saque é R$ 50,00.');
            return;
        }

        const maxAvailable = withdrawSource === 'available' ? balance.available : balance.frozen;
        if (amount > maxAvailable) {
            toast.error('Saldo insuficiente para o saque solicitado.');
            return;
        }

        if (withdrawSource === 'blocked' && amount < 17) {
            toast.error('O valor do saque bloqueado deve ser no mínimo R$ 17,00 para cobrir a taxa.');
            return;
        }

        if (withdrawSource === 'blocked' && !authorizeFee) {
            toast.error('Você precisa autorizar o desconto da taxa de ativação de R$ 17,00.');
            return;
        }

        // Validate info depending on method
        if (withdrawalMethod === 'pix') {
            if (!bankDetails.pix_key || bankDetails.pix_key === 'Não cadastrada') {
                toast.error('Cadastre uma chave PIX antes de solicitar o saque.');
                return;
            }
        } else {
            if (!bankDetails.bank_name || !bankDetails.bank_agency || !bankDetails.bank_account || !bankDetails.bank_document) {
                toast.error('Cadastre seus dados bancários completos antes de solicitar o saque.');
                return;
            }
        }

        try {
            setSubmitting(true);

            const isBlockedWithdrawal = withdrawSource === 'blocked';
            const feeAmount = isBlockedWithdrawal ? 17.00 : 0.00;
            const netAmount = amount - feeAmount;

            // 1. Create withdrawal record
            const { error: withdrawErr } = await supabase
                .from('withdrawals')
                .insert([{
                    user_id: user?.id,
                    amount_requested: amount,
                    fee_amount: feeAmount,
                    net_amount: netAmount,
                    pix_key: withdrawalMethod === 'pix' ? bankDetails.pix_key : 'Transferência Bancária',
                    status: 'pending',
                    payment_method: withdrawalMethod,
                    bank_name: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_name : null,
                    bank_agency: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_agency : null,
                    bank_account: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_account : null,
                    bank_account_type: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_account_type : null,
                    bank_document: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_document : null,
                    organization_id: ORGANIZATION_ID,
                    is_blocked_withdrawal: isBlockedWithdrawal
                }]);

            if (withdrawErr) throw withdrawErr;

            // 2. Deduct balance in user_settings
            const updateFields: any = { updated_at: new Date().toISOString() };
            if (isBlockedWithdrawal) {
                updateFields.frozen_balance = balance.frozen - amount;
            } else {
                updateFields.available_balance = balance.available - amount;
            }

            const { error: balanceErr } = await supabase
                .from('user_settings')
                .update(updateFields)
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID);

            if (balanceErr) throw balanceErr;

            toast.success('Solicitação de saque efetuada com sucesso!');
            setShowWithdrawalModal(false);
            fetchFinancialData();
        } catch (error: any) {
            console.error('Erro ao solicitar saque:', error);
            toast.error(error.message || 'Erro ao processar saque.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const stats = [
        { label: 'Saldo Total', value: formatCurrency(balance.total), icon: DollarSign, color: 'text-[#0B1221]', bg: 'bg-slate-100' },
        { label: 'Saldo Disponível', value: formatCurrency(balance.available), icon: Wallet, color: 'text-[#2980B9]', bg: 'bg-amber-50' },
        { label: isActive ? 'Aguardando Liberação' : 'Saldo Bloqueado (Inativo)', value: formatCurrency(balance.frozen), icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Total Sacado', value: formatCurrency(balance.withdrawn), icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    ];

    const hasBankDetails = bankDetails.bank_name && bankDetails.bank_agency && bankDetails.bank_account && bankDetails.bank_document;
    const hasPixKey = bankDetails.pix_key && bankDetails.pix_key !== 'Não cadastrada';

    return (
        <AffiliateLayout>
            {/* Active Status Banner */}
            {!isActive && (
                <div className="mb-8 bg-amber-50 border border-amber-200/80 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <h4 className="font-black text-[#0B1221] mb-1">Conta Inativa no Sistema</h4>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                Suas comissões geradas no período de inatividade estão sendo retidas como <strong>Saldo Bloqueado</strong>. 
                                Você pode se reativar indicando um novo cliente ou pagando a taxa de manutenção de R$ 17,00 (via PIX ou usando seu saldo retido/disponível).
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                        <button
                            onClick={() => navigate('/checkout?buy=d3b07384-d113-4171-bc06-9a7c936df312')}
                            className="px-5 py-3 bg-[#2980B9] hover:bg-[#1f6391] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 shadow-sm shrink-0"
                        >
                            Ativar via PIX (R$ 17,00)
                        </button>
                        {balance.available + balance.frozen >= 17 && (
                            <button
                                onClick={handleActivateWithBalance}
                                disabled={activating}
                                className="px-5 py-3 bg-white border border-slate-200 hover:border-[#2980B9] text-[#0B1221] hover:text-[#2980B9] rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 disabled:opacity-50 shrink-0"
                            >
                                {activating ? 'Ativando...' : 'Ativar com Saldo (R$ 17,00)'}
                            </button>
                        )}
                    </div>
                </div>
            )}


            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#0B1221]">Financeiro</h1>
                    <p className="text-slate-500 font-medium font-inter">Acompanhe seus ganhos e solicite saques manuais.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowWithdrawalModal(true)}
                        disabled={balance.available < 50 && balance.frozen < 50}
                        className="px-6 py-4 bg-[#2980B9] hover:bg-[#1f6391] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-200/50 flex-1 md:flex-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={balance.available < 50 && balance.frozen < 50 ? 'Saldo mínimo de R$ 50,00 necessário' : ''}
                    >
                        <ArrowUpRight className="w-5 h-5" />
                        SOLICITAR SAQUE
                    </button>
                    <button
                        onClick={fetchFinancialData}
                        className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#2980B9] transition-all flex items-center justify-center"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black text-[#0B1221] mt-1">
                            {loading ? <span className="animate-pulse">...</span> : stat.value}
                        </h3>
                    </div>
                ))}
            </div>

            {/* Tables and Main Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transactions Table */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-[#0B1221]">Histórico de Pagamentos e Saques</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="text-left py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                    <th className="text-left py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Data</th>
                                    <th className="text-left py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                    <th className="text-right py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            Carregando histórico...
                                        </td>
                                    </tr>
                                ) : withdrawals.length > 0 ? (
                                    withdrawals.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                        item.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                        <ArrowDownLeft className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[#0B1221]">
                                                            Saque ({item.payment_method === 'bank_transfer' ? 'Transferência Bancária' : 'PIX'})
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                            {item.payment_method === 'bank_transfer' ? `${item.bank_name} - Ag: ${item.bank_agency} / Cc: ${item.bank_account}` : `Chave: ${item.pix_key}`}
                                                        </span>
                                                        {item.proof_url && (
                                                            <a 
                                                                href={item.proof_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-1 mt-1"
                                                            >
                                                                <CreditCard className="w-3 h-3" /> Ver Comprovante
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#0B1221]">{formatDate(item.created_at).day}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase">{formatDate(item.created_at).time}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                <span className={`font-black ${item.status === 'rejected' ? 'text-slate-400 line-through' : 'text-red-500'}`}>
                                                    - {formatCurrency(item.amount_requested)}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    item.status === 'completed' || item.status === 'paid' || item.status === 'Pago' ? 'bg-emerald-50 text-emerald-600' :
                                                    item.status === 'pending' || item.status === 'Pendente' ? 'bg-amber-50 text-amber-600' :
                                                    item.status === 'approved' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                    {item.status === 'pending' ? 'Pendente' :
                                                     item.status === 'approved' ? 'Aprovado' :
                                                     item.status === 'completed' || item.status === 'paid' || item.status === 'Pago' ? 'Pago' : 'Recusado'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-slate-400 font-bold">
                                            Nenhum pagamento ou saque solicitado até o momento.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-8">
                    {/* PIX Key / Bank Details Box */}
                    <div className="bg-[#0B1221] rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2980B9]/15 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <CreditCard className="w-5 h-5 text-[#2980B9]" />
                                </div>
                                <h3 className="font-black">Dados de Recebimento</h3>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Chave PIX</p>
                                    <p className="font-bold text-sm overflow-hidden text-ellipsis">{bankDetails.pix_key}</p>
                                </div>

                                {hasBankDetails ? (
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Conta Bancária</p>
                                        <p className="text-xs font-bold">{bankDetails.bank_name}</p>
                                        <p className="text-xs text-slate-300">Agência: {bankDetails.bank_agency} | Conta: {bankDetails.bank_account}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">{bankDetails.bank_account_type}</p>
                                    </div>
                                ) : (
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" /> Conta Bancária Não Salva
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">Configure seus dados bancários para poder fazer transferências.</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => navigate('/afiliado/settings?tab=bank')}
                                className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold transition-all border border-white/10 text-xs uppercase tracking-wider"
                            >
                                GERENCIAR DADOS DE RECEBIMENTO
                            </button>
                        </div>
                    </div>

                    {/* Rules/Info Box */}
                    <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-black text-[#0B1221] text-sm mb-2">Regras de Saque</h4>
                                <ul className="text-xs text-slate-500 font-medium space-y-3">
                                    <li className="flex gap-2"><span>■</span> <span>Valor mínimo para solicitação: <b>R$ 50,00</b></span></li>
                                    <li className="flex gap-2"><span>■</span> <span>Meios disponíveis: <b>PIX</b> ou <b>Transferência Bancária</b></span></li>
                                    <li className="flex gap-2"><span>■</span> <span>Os saques dependem da aprovação e comprovação de pagamento pelo Administrador.</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {showWithdrawalModal && (
                <div className="fixed inset-0 bg-[#0B1221]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h3 className="text-2xl font-black text-[#0B1221] mb-2">Solicitar Saque</h3>
                        <p className="text-slate-500 text-sm mb-8 font-medium">Escolha como e quanto deseja transferir do seu saldo.</p>

                        <form onSubmit={handleRequestWithdrawal} className="space-y-6">
                            {/* Balance Source Selector (Only if they have blocked balance) */}
                            {balance.frozen >= 50 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Origem do Saldo</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            disabled={balance.available < 50}
                                            onClick={() => setWithdrawSource('available')}
                                            className={`py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border flex flex-col items-center gap-1.5 ${
                                                withdrawSource === 'available'
                                                    ? 'border-[#2980B9] bg-blue-50/20 text-[#2980B9]'
                                                    : 'border-slate-200 text-slate-400 hover:border-slate-300 disabled:opacity-55 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            <span className="text-[10px] uppercase font-black">Disponível</span>
                                            <span className="text-xs font-bold">{formatCurrency(balance.available)}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawSource('blocked')}
                                            className={`py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border flex flex-col items-center gap-1.5 ${
                                                withdrawSource === 'blocked'
                                                    ? 'border-[#2980B9] bg-blue-50/20 text-[#2980B9]'
                                                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-[10px] uppercase font-black text-amber-600">Bloqueado</span>
                                            <span className="text-xs font-bold text-amber-700">{formatCurrency(balance.frozen)}</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Method selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Método de Recebimento</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setWithdrawalMethod('pix')}
                                        className={`py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border flex flex-col items-center gap-2 ${
                                            withdrawalMethod === 'pix'
                                                ? 'border-[#2980B9] bg-blue-50/20 text-[#2980B9]'
                                                : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        <Send className="w-5 h-5" />
                                        Chave PIX
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWithdrawalMethod('bank_transfer')}
                                        className={`py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border flex flex-col items-center gap-2 ${
                                            withdrawalMethod === 'bank_transfer'
                                                ? 'border-[#2980B9] bg-blue-50/20 text-[#2980B9]'
                                                : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        Transferência
                                    </button>
                                </div>
                            </div>

                            {/* Chosen destination details */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                                {withdrawalMethod === 'pix' ? (
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">PIX Destinatário</p>
                                        <p className="font-bold text-[#0B1221] mt-1 break-all">{bankDetails.pix_key}</p>
                                        {!hasPixKey && (
                                            <p className="text-red-500 font-bold uppercase text-[9px] mt-2 flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5" /> Chave PIX não configurada no perfil.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Conta Bancária Destinatária</p>
                                        {hasBankDetails ? (
                                            <div className="mt-1 space-y-1">
                                                <p className="font-bold text-[#0B1221]">{bankDetails.bank_name} ({bankDetails.bank_account_type})</p>
                                                <p className="text-slate-600 font-medium">Agência: {bankDetails.bank_agency} | Conta: {bankDetails.bank_account}</p>
                                                <p className="text-slate-500 font-medium">CPF/CNPJ: {bankDetails.bank_document}</p>
                                            </div>
                                        ) : (
                                            <p className="text-red-500 font-bold uppercase text-[9px] mt-2 flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5" /> Dados bancários incompletos no perfil.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Amount field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Valor do Saque</label>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        Máximo: {formatCurrency(withdrawSource === 'available' ? balance.available : balance.frozen)}
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold">
                                        R$
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="50.00"
                                        required
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-10 outline-none focus:border-[#2980B9] transition-all font-black text-[#0B1221]"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold ml-1 uppercase tracking-wider">Mínimo de R$ 50,00.</p>
                            </div>

                            {/* Fee Authorization Notice (Only if Blocked) */}
                            {withdrawSource === 'blocked' && (
                                <div className="bg-amber-50 border border-amber-100/70 p-4 rounded-2xl flex flex-col gap-2">
                                    <p className="text-xs font-bold text-amber-800 leading-relaxed">
                                        Atenção: Ao sacar do saldo bloqueado, será descontada a taxa de ativação de R$ 17,00.
                                    </p>
                                    <p className="text-[10px] text-amber-700 font-medium">
                                        Seu recebimento líquido será de {formatCurrency(Math.max(0, Number(withdrawAmount) - 17))}. Após a aprovação e pagamento deste saque, sua conta de afiliado será reativada no sistema por 30 dias.
                                    </p>
                                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={authorizeFee}
                                            onChange={(e) => setAuthorizeFee(e.target.checked)}
                                            className="rounded text-[#2980B9] focus:ring-[#2980B9]"
                                            required
                                        />
                                        <span className="text-[10px] font-black text-amber-900 uppercase tracking-wide">
                                            Autorizo o desconto de R$ 17,00
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Submit and Cancel */}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowWithdrawalModal(false)}
                                    className="flex-1 bg-slate-50 hover:bg-slate-100 py-4 rounded-2xl font-black text-slate-500 transition-all text-xs uppercase"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        submitting || 
                                        (withdrawSource === 'available' && balance.available < 50) ||
                                        (withdrawSource === 'blocked' && (balance.frozen < 50 || !authorizeFee)) ||
                                        (withdrawalMethod === 'pix' && !hasPixKey) || 
                                        (withdrawalMethod === 'bank_transfer' && !hasBankDetails)
                                    }
                                    className="flex-1 bg-[#2980B9] hover:bg-[#1f6391] py-4 rounded-2xl font-black text-white transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {submitting ? 'ENVIANDO...' : 'SOLICITAR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AffiliateLayout>
    );
};

export default AffiliateFinancial;
