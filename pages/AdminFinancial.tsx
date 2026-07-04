import React, { useState, useEffect } from 'react';
import {
    Wallet,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Calendar,
    Send,
    ShieldCheck,
    Coins,
    Banknote,
    Loader2,
    TrendingUp,
    Download,
    AlertCircle,
    FileText,
    Upload,
    ExternalLink,
    CreditCard,
    X,
    RefreshCcw,
    ArrowUpDown
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';

interface WithdrawalRequest {
    id: string;
    user_id: string;
    amount_requested: number;
    fee_amount: number;
    net_amount: number;
    pix_key: string;
    payment_method?: string;
    bank_name?: string;
    bank_agency?: string;
    bank_account?: string;
    bank_account_type?: string;
    bank_document?: string;
    created_at: string;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    proof_url?: string;
    is_blocked_withdrawal?: boolean;
    affiliate?: {
        full_name: string;
    };
}

interface PendingPayout {
    user_id: string;
    full_name: string;
    pix_key: string;
    available_balance: number;
}

const AdminFinancial: React.FC = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'payouts' | 'audit'>('payouts');
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [auditOrders, setAuditOrders] = useState<any[]>([]);
    const [loadingAudit, setLoadingAudit] = useState(false);
    const [affiliatesMap, setAffiliatesMap] = useState<Record<string, string>>({});
    const [selectedAuditOrder, setSelectedAuditOrder] = useState<any | null>(null);
    const [auditCurrentPage, setAuditCurrentPage] = useState(1);

    const fetchAuditData = async () => {
        setLoadingAudit(true);
        try {
            const { data: affData, error: affErr } = await supabase
                .from('affiliates')
                .select('user_id, full_name')
                .eq('organization_id', ORGANIZATION_ID);
            
            if (affErr) throw affErr;

            const map: Record<string, string> = {};
            affData?.forEach(a => {
                if (a.user_id) map[a.user_id] = a.full_name;
            });
            setAffiliatesMap(map);

            const { data: orderData, error: orderErr } = await supabase
                .from('orders')
                .select('id, created_at, customer_name, total_amount, status, split_details, referral_code')
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (orderErr) throw orderErr;
            setAuditOrders(orderData || []);
            setAuditCurrentPage(1);
        } catch (err) {
            console.error('Error fetching audit data:', err);
            toast.error('Erro ao carregar dados de auditoria.');
        } finally {
            setLoadingAudit(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'audit') {
            fetchAuditData();
        }
    }, [activeTab]);

    const itemsPerAuditPage = 8;
    const totalAuditPages = Math.ceil(auditOrders.length / itemsPerAuditPage);
    const indexOfLastAuditItem = auditCurrentPage * itemsPerAuditPage;
    const indexOfFirstAuditItem = indexOfLastAuditItem - itemsPerAuditPage;
    const paginatedAuditOrders = auditOrders.slice(indexOfFirstAuditItem, indexOfLastAuditItem);
    
    // Modal controls
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    // Payment selections
    const [selectedPayout, setSelectedPayout] = useState<PendingPayout | null>(null);
    const [selectedRequestToPay, setSelectedRequestToPay] = useState<WithdrawalRequest | null>(null);
    
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Withdrawal/Payment History
            const { data, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    affiliate:affiliates(full_name)
                `)
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);

            // 2. Fetch Affiliates with Balance (Pending Payouts for top panel)
            const { data: balanceData, error: balanceError } = await supabase
                .from('user_settings')
                .select('user_id, available_balance, pix_key')
                .eq('organization_id', ORGANIZATION_ID)
                .gt('available_balance', 0);

            if (balanceError) throw balanceError;

            const userIds = balanceData?.map(b => b.user_id) || [];
            let affiliatesData: any[] = [];
            if (userIds.length > 0) {
                const { data: affData, error: affError } = await supabase
                    .from('affiliates')
                    .select('user_id, full_name')
                    .in('user_id', userIds);
                if (!affError && affData) {
                    affiliatesData = affData;
                }
            }

            const formattedPayouts = balanceData?.map((b: any) => {
                const aff = affiliatesData.find(a => a.user_id === b.user_id);
                return {
                    user_id: b.user_id,
                    full_name: aff?.full_name || 'Usuário',
                    pix_key: b.pix_key || 'Não cadastrada',
                    available_balance: b.available_balance
                };
            }) || [];

            setPendingPayouts(formattedPayouts);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Erro ao carregar dados financeiros.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesFilter = filter === 'all' || req.status === filter;
        const name = req.affiliate?.full_name || 'Usuário Desconhecido';
        const matchesSearch = 
            name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            req.pix_key.includes(searchTerm) || 
            (req.bank_name && req.bank_name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
        try {
            // 1. Fetch current withdrawal details to check status and handle estorno if rejected
            const { data: wData, error: fetchErr } = await supabase
                .from('withdrawals')
                .select('user_id, amount_requested, status, is_blocked_withdrawal')
                .eq('id', id)
                .single();

            if (fetchErr) throw fetchErr;
            if (!wData) throw new Error('Pedido de saque não encontrado.');

            if (wData.status === 'rejected' || wData.status === 'paid') {
                toast.error('Este saque já foi processado e concluído.');
                return;
            }

            // 2. Update Status
            const { error: updateErr } = await supabase
                .from('withdrawals')
                .update({ status: newStatus })
                .eq('id', id)
                .eq('organization_id', ORGANIZATION_ID);

            if (updateErr) throw updateErr;

            // 3. Estorno Logic (return balance if rejected)
            if (newStatus === 'rejected') {
                // Fetch settings for the user
                const { data: settingsData, error: settingsErr } = await supabase
                    .from('user_settings')
                    .select('available_balance, frozen_balance')
                    .eq('user_id', wData.user_id)
                    .eq('organization_id', ORGANIZATION_ID)
                    .single();

                if (settingsErr) throw settingsErr;

                const updateFields: any = { updated_at: new Date().toISOString() };
                if (wData.is_blocked_withdrawal) {
                    updateFields.frozen_balance = Number(settingsData?.frozen_balance || 0) + Number(wData.amount_requested);
                } else {
                    updateFields.available_balance = Number(settingsData?.available_balance || 0) + Number(wData.amount_requested);
                }

                const { error: balanceErr } = await supabase
                    .from('user_settings')
                    .update(updateFields)
                    .eq('user_id', wData.user_id)
                    .eq('organization_id', ORGANIZATION_ID);

                if (balanceErr) throw balanceErr;

                toast.success('Saque rejeitado e saldo estornado para o afiliado!');
            } else {
                toast.success('Saque aprovado com sucesso!');
            }

            fetchRequests();
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error(error.message || 'Erro ao processar alteração.');
        }
    };

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proofFile) {
            toast.error('Selecione o comprovante.');
            return;
        }

        if (!selectedPayout && !selectedRequestToPay) {
            toast.error('Nenhum pagamento selecionado.');
            return;
        }

        setProcessingPayment(true);
        try {
            // 1. Upload Proof
            const userId = selectedPayout ? selectedPayout.user_id : selectedRequestToPay!.user_id;
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
            const filePath = `payouts/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(filePath, proofFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(filePath);

            if (selectedPayout) {
                // Bulk payment directly from user_settings (Top panel)
                // 2. Create Withdrawal Record (Status: Paid)
                const { error: drawError } = await supabase
                    .from('withdrawals')
                    .insert([{
                        user_id: selectedPayout.user_id,
                        amount_requested: selectedPayout.available_balance,
                        net_amount: selectedPayout.available_balance,
                        pix_key: selectedPayout.pix_key,
                        status: 'paid',
                        processed_at: new Date().toISOString(),
                        proof_url: publicUrl,
                        payment_method: 'pix',
                        organization_id: ORGANIZATION_ID
                    }]);

                if (drawError) throw drawError;

                // 3. Deduct from Balance to 0
                const { error: balanceError } = await supabase
                    .from('user_settings')
                    .update({ 
                        available_balance: 0,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', selectedPayout.user_id)
                    .eq('organization_id', ORGANIZATION_ID);

                if (balanceError) throw balanceError;

            } else if (selectedRequestToPay) {
                // Payment for specific withdrawal request (already deducted from balance)
                // 2. Update Withdrawal Record (Status: Paid)
                const { error: drawError } = await supabase
                    .from('withdrawals')
                    .update({
                        status: 'paid',
                        processed_at: new Date().toISOString(),
                        proof_url: publicUrl
                    })
                    .eq('id', selectedRequestToPay.id)
                    .eq('organization_id', ORGANIZATION_ID);

                if (drawError) throw drawError;

                // 3. If it was a blocked withdrawal, activate the affiliate for 30 days
                if (selectedRequestToPay.is_blocked_withdrawal) {
                    const activeUntil = new Date();
                    activeUntil.setDate(activeUntil.getDate() + 30);
                    
                    const { error: activateErr } = await supabase
                        .from('user_settings')
                        .update({ active_until: activeUntil.toISOString() })
                        .eq('user_id', selectedRequestToPay.user_id)
                        .eq('organization_id', ORGANIZATION_ID);

                    if (activateErr) throw activateErr;
                    toast.success('Afiliado ativado mensalmente com sucesso (Taxa paga)!');
                }
            }

            toast.success('Pagamento registrado com sucesso!');
            setIsPaymentModalOpen(false);
            setSelectedPayout(null);
            setSelectedRequestToPay(null);
            setProofFile(null);
            fetchRequests();

        } catch (error: any) {
            console.error('Error processing payment:', error);
            toast.error(error.message || 'Erro ao registrar pagamento.');
        } finally {
            setProcessingPayment(false);
        }
    };

    // Stats calculations
    const totalPendente = requests
        .filter(r => r.status === 'pending' || r.status === 'approved')
        .reduce((acc, curr) => acc + curr.amount_requested, 0);

    const paidThisMonth = requests
        .filter(r => {
            if (r.status !== 'paid') return false;
            const date = new Date(r.created_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((acc, curr) => acc + curr.amount_requested, 0);

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-[#2980B9] animate-spin" />
                    <p className="font-bold text-slate-400">Carregando dados financeiros...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#05080F]">Gestão Financeira</h1>
                        <p className="text-slate-500 font-medium text-sm md:text-base">Controle de saques, aprovações e processamento de pagamentos.</p>
                    </div>
                </div>

                {/* Tabs */}
                {(profile?.role === 'admin_master' || profile?.role === 'admin') && (
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/50">
                        <button
                            onClick={() => setActiveTab('payouts')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'payouts' ? 'bg-[#05080F] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Wallet className="w-4 h-4" />
                            Saques e Payouts
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'audit' ? 'bg-[#05080F] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Coins className="w-4 h-4" />
                            Auditoria GD Finance (Rastro)
                        </button>
                    </div>
                )}

                {activeTab === 'payouts' && (
                    <>
                        {/* Dashboard Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-[#05080F] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2980B9]/10 blur-3xl rounded-full"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6 backdrop-blur-md">
                                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-[#2980B9]" />
                            </div>
                            <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest leading-none mb-2">Total Pendente</p>
                            <h3 className="text-2xl md:text-3xl font-black text-[#2980B9]">
                                R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                        </div>
                        <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest leading-none mb-2">Pago este Mês</p>
                        <h3 className="text-2xl md:text-3xl font-black text-[#05080F]">
                            R$ {paidThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>

                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col justify-center sm:col-span-2 lg:col-span-1">
                        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-4">Próximo Fechamento</p>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-[#05080F]">Dia 15</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Pagamento Agendado</p>
                            </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed mb-1">
                            O sistema processa os pagamentos manuais via PIX e TED.
                        </p>
                    </div>
                </div>

                {/* Pending Payouts (Dashboard Dia 15) */}
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-10 border-b border-slate-50">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg md:text-xl font-black text-[#05080F]">Pagamentos Pendentes (Dashboard Dia 15)</h3>
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {pendingPayouts.length} Afiliados a Pagar
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="text-left py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Afiliado / Chave PIX</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Saldo Acumulado</th>
                                    <th className="text-right py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pendingPayouts.length > 0 ? pendingPayouts.map((p) => (
                                    <tr key={p.user_id} className="hover:bg-slate-50/30 transition-all">
                                        <td className="py-6 px-10">
                                            <div>
                                                <p className="font-black text-[#05080F] text-sm">{p.full_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                                    <Send className="w-3 h-3 text-[#2980B9]" /> {p.pix_key}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <p className="text-lg font-black text-emerald-600">
                                                R$ {p.available_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </td>
                                        <td className="py-6 px-10 text-right">
                                            {profile?.role !== 'admin_op' ? (
                                                <button 
                                                    onClick={() => { setSelectedPayout(p); setSelectedRequestToPay(null); setIsPaymentModalOpen(true); }}
                                                    className="bg-[#05080F] text-white text-[10px] font-black px-6 py-3 rounded-xl hover:bg-[#2980B9] hover:text-[#05080F] transition-all shadow-lg"
                                                >
                                                    REGISTRAR PAGAMENTO
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visualização</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            Nenhum saldo pendente de pagamento.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Filters & Table */}
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-10 border-b border-slate-50">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                            <h3 className="text-lg md:text-xl font-black text-[#05080F]">Histórico de Pagamentos Efetuados / Saques</h3>

                            <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
                                <div className="relative flex-1 sm:min-w-[280px]">
                                    <input
                                        type="text"
                                        placeholder="Buscar por afiliado, banco ou PIX..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-10 outline-none text-[10px] md:text-xs font-medium focus:border-[#2980B9] transition-all"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                </div>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar">
                                    {(['all', 'pending', 'approved', 'paid', 'rejected'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white shadow-sm text-[#05080F]' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {f === 'all' ? 'Ver Todos' : f === 'pending' ? 'Pendentes' : f === 'approved' ? 'Aprovados' : f === 'paid' ? 'Pagos' : 'Recusados'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block lg:hidden divide-y divide-slate-50">
                        {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                            <div key={req.id} className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Afiliado</p>
                                        <p className="font-black text-[#05080F] text-sm">{req.affiliate?.full_name || 'Usuário Desconhecido'}</p>
                                        {req.is_blocked_withdrawal && (
                                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                                Saldo Bloqueado (Mensalidade)
                                            </span>
                                        )}
                                        {req.payment_method === 'bank_transfer' ? (
                                            <div className="text-[10px] font-bold text-slate-400 mt-1 space-y-0.5">
                                                <p className="flex items-center gap-1 text-blue-600">
                                                    <CreditCard className="w-3 h-3" /> {req.bank_name} ({req.bank_account_type})
                                                </p>
                                                <p>Ag: {req.bank_agency} | Cc: {req.bank_account}</p>
                                                <p>CPF/CNPJ: {req.bank_document}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                                <Send className="w-3 h-3 text-[#2980B9]" /> PIX: {req.pix_key}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${req.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                        req.status === 'approved' ? 'bg-blue-50 text-blue-600' :
                                            req.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                        {req.status === 'pending' ? 'Aguardando' :
                                            req.status === 'approved' ? 'Aprovado' :
                                                req.status === 'paid' ? 'Pago' : 'Recusado'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Data</p>
                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                            {new Date(req.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Valor</p>
                                        <p className="font-black text-[#05080F]">R$ {req.amount_requested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        {req.is_blocked_withdrawal && (
                                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                                Líquido: R$ {req.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (-R$ 17)
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {profile?.role !== 'admin_op' ? (
                                    <>
                                        {req.status === 'pending' && (
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => handleAction(req.id, 'rejected')}
                                                    className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                                                >
                                                    REJEITAR
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'approved')}
                                                    className="flex-3 py-3 bg-[#05080F] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2980B9] hover:text-[#05080F] transition-all border border-[#05080F]"
                                                >
                                                    APROVAR SAQUE
                                                </button>
                                            </div>
                                        )}
                                        {req.status === 'approved' && (
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => handleAction(req.id, 'rejected')}
                                                    className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                                                >
                                                    REJEITAR
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequestToPay(req);
                                                        setSelectedPayout(null);
                                                        setIsPaymentModalOpen(true);
                                                    }}
                                                    className="flex-3 py-3 bg-[#2980B9] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1f6391] transition-all border border-[#2980B9]"
                                                >
                                                    REGISTRAR PAGAMENTO
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    (req.status === 'pending' || req.status === 'approved') && (
                                        <div className="pt-2 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 py-3 rounded-xl border border-slate-100">
                                            Visualização Apenas
                                        </div>
                                    )
                                )}
                                {req.proof_url && (
                                    <div className="pt-2">
                                        <a 
                                            href={req.proof_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full text-center block py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                                        >
                                            VER COMPROVANTE
                                        </a>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="py-20 text-center">
                                <div className="flex flex-col items-center gap-4 text-slate-400">
                                    <Wallet className="w-12 h-12 opacity-20" />
                                    <p className="font-bold">Nenhum pedido encontrado.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="text-left py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Afiliado / Detalhes de Destino</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Data Solicitada</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Valor</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                                    <th className="text-right py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                                    <tr key={req.id} className="group hover:bg-slate-50/30 transition-all">
                                        <td className="py-6 px-10">
                                            <div>
                                                <p className="font-black text-[#05080F] text-sm">{req.affiliate?.full_name || 'Usuário Desconhecido'}</p>
                                                {req.is_blocked_withdrawal && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                                        Saldo Bloqueado (Mensalidade)
                                                    </span>
                                                )}
                                                {req.payment_method === 'bank_transfer' ? (
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 space-y-0.5">
                                                        <p className="flex items-center gap-1 text-blue-600">
                                                            <CreditCard className="w-3 h-3" /> {req.bank_name} ({req.bank_account_type})
                                                        </p>
                                                        <p>Ag: {req.bank_agency} | Cc: {req.bank_account}</p>
                                                        <p>CPF/CNPJ: {req.bank_document}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                                        <Send className="w-3 h-3 text-[#2980B9]" /> PIX: {req.pix_key}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                                                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                                {new Date(req.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <p className="font-black text-[#05080F]">R$ {req.amount_requested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            {req.is_blocked_withdrawal && (
                                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                                    Líquido: R$ {req.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (-R$ 17)
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-6 px-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${req.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                                req.status === 'approved' ? 'bg-blue-50 text-blue-600' :
                                                    req.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'paid' ? 'bg-emerald-500' :
                                                    req.status === 'approved' ? 'bg-blue-300' :
                                                        req.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                                                    }`}></div>
                                                {req.status === 'pending' ? 'Aguardando' :
                                                    req.status === 'approved' ? 'Aprovado' :
                                                        req.status === 'paid' ? 'Pago' : 'Recusado'}
                                            </span>
                                        </td>
                                        <td className="py-6 px-10 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {profile?.role !== 'admin_op' ? (
                                                    <>
                                                        {req.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(req.id, 'rejected')}
                                                                    className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                                >
                                                                    Rejeitar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(req.id, 'approved')}
                                                                    className="px-3 py-1.5 bg-[#05080F] text-white hover:bg-[#2980B9] hover:text-[#05080F] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                                >
                                                                    Aprovar
                                                                </button>
                                                            </>
                                                        )}
                                                        {req.status === 'approved' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(req.id, 'rejected')}
                                                                    className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                                >
                                                                    Rejeitar
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRequestToPay(req);
                                                                        setSelectedPayout(null);
                                                                        setIsPaymentModalOpen(true);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-[#2980B9] text-white hover:bg-[#1f6391] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                                >
                                                                    Pagar
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    (req.status === 'pending' || req.status === 'approved') && (
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visualização</span>
                                                    )
                                                )}
                                                {req.proof_url && (
                                                    <a 
                                                        href={req.proof_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                        title="Ver Comprovante"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        Comprovante
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                                <Wallet className="w-12 h-12 opacity-20" />
                                                <p className="font-bold">Nenhum pedido de saque encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </>
            )}

                {activeTab === 'audit' && (profile?.role === 'admin_master' || profile?.role === 'admin') && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Audit Header Info */}
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-[#05080F]">Auditoria de Comissões e Splits (GD Finance)</h3>
                                <p className="text-slate-500 font-medium text-sm">Rastreie o destino de cada centavo das compras efetuadas na plataforma.</p>
                            </div>
                            <button
                                onClick={fetchAuditData}
                                disabled={loadingAudit}
                                className="flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                            >
                                <RefreshCcw className={`w-4 h-4 ${loadingAudit && 'animate-spin'}`} />
                                Atualizar
                            </button>
                        </div>

                        {/* Audit Table */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="text-left py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido / Data</th>
                                            <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                                            <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</th>
                                            <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">Repassado Rede</th>
                                            <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-amber-600">Retido GD Finance</th>
                                            <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-blue-600">Líquido Plataforma</th>
                                            <th className="text-right py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loadingAudit ? (
                                            <tr>
                                                <td colSpan={7} className="py-20 text-center">
                                                    <Loader2 className="w-8 h-8 text-[#2980B9] animate-spin mx-auto mb-4" />
                                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando transações...</p>
                                                </td>
                                            </tr>
                                        ) : paginatedAuditOrders.length > 0 ? (
                                            paginatedAuditOrders.map((order) => {
                                                const splits = Array.isArray(order.split_details) ? order.split_details : [];
                                                const totalSplits = splits.reduce((acc: number, curr: any) => acc + (parseFloat(curr.amount) || 0), 0);
                                                
                                                const redeAmount = splits
                                                    .filter((s: any) => s.status === 'split_sent')
                                                    .reduce((acc: number, curr: any) => acc + (parseFloat(curr.amount) || 0), 0);
                                                    
                                                const gdFinanceAmount = splits
                                                    .filter((s: any) => s.status === 'held_in_gd_finance' || s.status === 'no_wallet_configured' || s.status === 'no_wallet')
                                                    .reduce((acc: number, curr: any) => acc + (parseFloat(curr.amount) || 0), 0);
                                                    
                                                const platformAmount = Math.max(0, parseFloat(order.total_amount) - totalSplits);

                                                return (
                                                    <tr key={order.id} className="hover:bg-slate-50/20 transition-all">
                                                        <td className="py-5 px-8">
                                                            <p className="font-black text-sm text-[#05080F]">{order.id}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1">
                                                                {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <p className="font-bold text-sm text-[#05080F]">{order.customer_name}</p>
                                                            {order.referral_code && (
                                                                <span className="inline-flex mt-1 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                                                    Ref: {order.referral_code}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-5 px-4 font-black text-[#05080F]">
                                                            R$ {parseFloat(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-5 px-4 font-black text-emerald-600">
                                                            R$ {redeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-5 px-4 font-black text-amber-600">
                                                            R$ {gdFinanceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-5 px-4 font-black text-blue-600">
                                                            R$ {platformAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-5 px-8 text-right">
                                                            <button
                                                                onClick={() => setSelectedAuditOrder({ ...order, redeAmount, gdFinanceAmount, platformAmount })}
                                                                className="px-4 py-2 bg-slate-50 border border-slate-200/50 hover:bg-[#05080F] hover:text-white hover:border-[#05080F] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto"
                                                            >
                                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                                Rastro
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                                    Nenhuma transação encontrada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Audit Pagination */}
                            {totalAuditPages > 1 && (
                                <div className="p-8 md:p-10 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <p className="text-xs md:text-sm text-slate-400 font-bold order-2 sm:order-1">
                                        Mostrando <span className="text-[#05080F]">{indexOfFirstAuditItem + 1}</span>-
                                        <span className="text-[#05080F]">{Math.min(indexOfLastAuditItem, auditOrders.length)}</span> de 
                                        <span className="text-[#05080F]">{auditOrders.length}</span> resultados
                                    </p>
                                    <div className="flex items-center gap-2 order-1 sm:order-2">
                                        <button
                                            onClick={() => setAuditCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={auditCurrentPage === 1}
                                            className="w-11 h-11 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#05080F] transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                                        >
                                            <ArrowUpDown className="w-4 h-4 rotate-90" />
                                        </button>
                                        {[...Array(totalAuditPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setAuditCurrentPage(i + 1)}
                                                className={`w-11 h-11 rounded-2xl text-[10px] md:text-sm font-black transition-all ${auditCurrentPage === i + 1 ? 'bg-[#05080F] text-white shadow-xl shadow-[#05080F]/10' : 'bg-white border border-slate-50 hover:bg-slate-50 text-slate-400'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setAuditCurrentPage(prev => Math.min(totalAuditPages, prev + 1))}
                                            disabled={auditCurrentPage === totalAuditPages}
                                            className="w-11 h-11 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#05080F] transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                                        >
                                            <ArrowUpDown className="w-4 h-4 -rotate-90" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Money Trail Modal */}
                {selectedAuditOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-[#05080F]/80 backdrop-blur-md" onClick={() => setSelectedAuditOrder(null)}></div>
                        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                            <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Auditoria GD Finance</p>
                                    <h2 className="text-xl md:text-2xl font-black text-[#05080F]">Rastro do Dinheiro</h2>
                                </div>
                                <button onClick={() => setSelectedAuditOrder(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Identificador da Venda</p>
                                        <h4 className="text-lg font-black text-[#05080F]">{selectedAuditOrder.id}</h4>
                                        <p className="text-[10px] font-bold text-slate-500">Cliente: {selectedAuditOrder.customer_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Valor Pago</p>
                                        <h3 className="text-2xl font-black text-[#05080F]">
                                            R$ {parseFloat(selectedAuditOrder.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h3>
                                    </div>
                                </div>

                                <div className="relative pl-8 border-l border-slate-100 ml-4 space-y-8">
                                    <div className="relative">
                                        <div className="absolute -left-[45px] top-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-[#05080F]">Entrada de Recurso</h4>
                                            <p className="text-slate-500 font-medium text-xs mt-1">
                                                Valor de <b>R$ {parseFloat(selectedAuditOrder.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b> pago por <b>{selectedAuditOrder.customer_name}</b>.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -left-[45px] top-0 w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-[#05080F]">Retido pela Plataforma (Clube do Seu Bolso)</h4>
                                            <p className="text-slate-500 font-medium text-xs mt-1">
                                                O Clube do Seu Bolso retém o valor líquido de <b>R$ {selectedAuditOrder.platformAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b> em sua carteira principal Asaas.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -left-[45px] top-0 w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                            <Coins className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-black text-sm text-[#05080F]">Divisão de Comissões da Rede</h4>
                                                <p className="text-slate-500 font-medium text-xs mt-1">
                                                    Divisão multinível calculada para cada geração de indicação:
                                                </p>
                                            </div>

                                            <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                                {Array.isArray(selectedAuditOrder.split_details) && selectedAuditOrder.split_details.length > 0 ? (
                                                    selectedAuditOrder.split_details.map((split: any, idx: number) => {
                                                        const name = split.user_id ? (affiliatesMap[split.user_id] || `Afiliado ID: ${split.user_id.substring(0, 8)}...`) : 'Sem Patrocinador/Topo da Rede';
                                                        const isSent = split.status === 'split_sent';
                                                        return (
                                                            <div key={idx} className="flex justify-between items-start gap-4 text-xs">
                                                                <div>
                                                                    <p className="font-bold text-[#05080F]">{split.level}ª Geração: {name}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide flex items-center gap-1">
                                                                        {isSent ? (
                                                                            <span className="text-emerald-600">✓ Pago via Split Asaas</span>
                                                                        ) : (
                                                                            <span className="text-amber-600">⚠ Desviado para GD Finance ({split.status === 'held_in_gd_finance' ? 'Afiliado Inativo' : 'Carteira Não Configurada'})</span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`font-black ${isSent ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                        R$ {parseFloat(split.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-slate-400 font-bold text-center text-xs py-4">Sem indicações vinculadas a este pedido.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:p-10 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50">
                                <button
                                    onClick={() => setSelectedAuditOrder(null)}
                                    className="px-8 py-4 bg-[#05080F] hover:bg-[#2980B9] hover:text-[#05080F] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                                >
                                    FECHAR AUDITORIA
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Registration Modal */}
                {isPaymentModalOpen && (selectedPayout || selectedRequestToPay) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#05080F]/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 p-8 md:p-10">
                            <h2 className="text-2xl font-black text-[#05080F] mb-2">Registrar Pagamento</h2>
                            <p className="text-slate-500 text-sm mb-8 font-medium">
                                Confirme o envio do pagamento para <span className="text-[#05080F] font-bold">
                                    {selectedPayout ? selectedPayout.full_name : (selectedRequestToPay?.affiliate?.full_name || 'Afiliado')}
                                </span>.
                            </p>

                            <div className="bg-slate-50 rounded-2xl p-6 mb-8 space-y-4">
                                {selectedPayout ? (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chave PIX</p>
                                            <p className="font-bold text-[#05080F]">{selectedPayout.pix_key}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor do Pagamento</p>
                                            <p className="text-2xl font-black text-emerald-600">
                                                R$ {selectedPayout.available_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destino de Pagamento</p>
                                            {selectedRequestToPay?.payment_method === 'bank_transfer' ? (
                                                <div className="font-bold text-[#05080F] text-xs space-y-1">
                                                    <p className="text-blue-600 font-black">{selectedRequestToPay.bank_name} ({selectedRequestToPay.bank_account_type})</p>
                                                    <p>Agência: {selectedRequestToPay.bank_agency} | Conta: {selectedRequestToPay.bank_account}</p>
                                                    <p>Titular CPF/CNPJ: {selectedRequestToPay.bank_document}</p>
                                                </div>
                                            ) : (
                                                <p className="font-bold text-[#05080F]">{selectedRequestToPay?.pix_key}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Solicitado</p>
                                            <p className="text-2xl font-black text-emerald-600">
                                                R$ {selectedRequestToPay?.amount_requested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <form onSubmit={handleConfirmPayment} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Anexar Comprovante (IMG/PDF)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            required
                                            accept="image/*,.pdf"
                                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="proof-upload"
                                        />
                                        <label
                                            htmlFor="proof-upload"
                                            className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#2980B9] hover:bg-slate-50 transition-all group"
                                        >
                                            {proofFile ? (
                                                <>
                                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                                                    <span className="text-xs font-bold text-slate-600">{proofFile.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-slate-300 group-hover:text-[#2980B9] transition-colors" />
                                                    <span className="text-xs font-bold text-slate-400">Clique para selecionar arquivo</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { 
                                            setIsPaymentModalOpen(false); 
                                            setSelectedPayout(null); 
                                            setSelectedRequestToPay(null); 
                                            setProofFile(null); 
                                        }}
                                        className="flex-1 bg-slate-50 text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all text-xs"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processingPayment}
                                        className="flex-1 bg-[#05080F] text-white font-black py-4 rounded-2xl hover:bg-[#2980B9] hover:text-[#05080F] transition-all text-xs shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {processingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                        {processingPayment ? 'PROCESSANDO...' : 'CONFIRMAR PAGAMENTO'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminFinancial;
