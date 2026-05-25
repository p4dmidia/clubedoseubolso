import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    UserPlus,
    CheckCircle,
    XCircle,
    AlertCircle,
    Mail,
    Phone,
    Calendar,
    ArrowUpDown,
    Download,
    X,
    Loader2,
    Lock,
    Network,
    Eye,
    Pencil,
    Shield,
    Clock
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AdminLayout from '../components/AdminLayout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { AffiliateNetwork } from '../components/AffiliateNetwork';

const AdminAffiliates: React.FC = () => {
    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [filterPlan, setFilterPlan] = useState('Todos');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [totalStats, setTotalStats] = useState({ total: 0, pending: 0, newThisMonth: 0 });
    const [viewingNetworkId, setViewingNetworkId] = useState<string | null>(null);
    const [viewingNetworkName, setViewingNetworkName] = useState<string>('');
    const [viewingAffiliate, setViewingAffiliate] = useState<any | null>(null);
    const [editingAffiliate, setEditingAffiliate] = useState<any | null>(null);
    const [deletingAffiliate, setDeletingAffiliate] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [originalEmail, setOriginalEmail] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        cpf: '',
        cnpj: '',
        login: '',
        sponsor_code: ''
    });

    const itemsPerPage = 8;

    useEffect(() => {
        fetchAffiliates();
    }, []);

    const fetchAffiliates = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Affiliates scoped to ORGANIZATION_ID
            let query = supabase
                .from('affiliates')
                .select('*', { count: 'exact' })
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            const { data: affData, error: affError } = await query;

            if (affError) throw affError;

            // 2. Fetch User Settings for all relevant user_ids
            const userIds = affData.map(aff => aff.user_id).filter(id => id);
            const { data: settingsData, error: settingsError } = await supabase
                .from('user_settings')
                .select('user_id, total_earnings')
                .in('user_id', userIds);

            if (settingsError) throw settingsError;

            let profilesData: any[] = [];
            if (userIds.length > 0) {
                const { data, error: profilesError } = await supabase
                    .from('user_profiles')
                    .select('id, registration_type, role, cnpj')
                    .in('id', userIds);

                if (profilesError) {
                    // Fallback if cnpj column is missing (PGRST204)
                    if (profilesError.message?.includes('cnpj') || profilesError.code === 'PGRST204') {
                        const { data: retryData, error: retryError } = await supabase
                            .from('user_profiles')
                            .select('id, registration_type, role')
                            .in('id', userIds);
                        if (retryError) throw retryError;
                        profilesData = retryData || [];
                    } else {
                        throw profilesError;
                    }
                } else {
                    profilesData = data || [];
                }
            }

            // Create lookup maps
            const settingsMap = new Map();
            settingsData?.forEach(s => settingsMap.set(s.user_id, s));

            const profilesMap = new Map();
            profilesData?.forEach(p => profilesMap.set(p.id, p));

            const formattedAffs = affData.map(aff => {
                const settings = settingsMap.get(aff.user_id);
                return {
                    id: aff.id,
                    name: aff.full_name || 'Sem Nome',
                    email: aff.email,
                    phone: aff.whatsapp || 'Não informado',
                    plan: aff.position_slot ? `Slot ${aff.position_slot}` : 'Membro',
                    status: aff.is_active ? (aff.is_verified ? 'Ativo' : 'Pendente') : 'Bloqueado',
                    referrals: 0,
                    earnings: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                        .format(settings?.total_earnings || 0),
                    joined: new Date(aff.created_at).toLocaleDateString('pt-BR'),
                    raw_status: aff.is_active,
                    raw_verified: aff.is_verified,
                    user_id: aff.user_id,
                    created_at: aff.created_at,
                    cpf: aff.cpf || '',
                    cnpj: aff.cnpj || profilesMap.get(aff.user_id)?.cnpj || '',
                    registration_type: profilesMap.get(aff.user_id)?.registration_type || 'business',
                    role: profilesMap.get(aff.user_id)?.role || 'affiliate'
                };
            });

            setAffiliates(formattedAffs);

            const now = new Date();
            const startOfMonthValue = new Date(now.getFullYear(), now.getMonth(), 1);

            const newCount = affData.filter(d => d.created_at && new Date(d.created_at) >= startOfMonthValue).length;
            const pendingCount = affData.filter(d => d.is_active && !d.is_verified).length;

            setTotalStats({
                total: affData.length,
                pending: pendingCount,
                newThisMonth: newCount
            });

        } catch (error) {
            console.error('Error fetching affiliates:', error);
            toast.error('Erro ao carregar afiliados');
        } finally {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const handleCreateAffiliate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createFormData.email.trim() || !createFormData.password.trim() || !createFormData.name.trim()) {
            toast.error('Por favor, preencha Nome, E-mail e Senha.');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase.rpc('admin_create_user', {
                p_email: createFormData.email.trim(),
                p_password: createFormData.password.trim(),
                p_role: 'affiliate',
                p_full_name: createFormData.name.trim(),
                p_whatsapp: createFormData.phone.trim() || null,
                p_cpf: createFormData.cpf.trim() || null,
                p_cnpj: createFormData.cnpj.trim() || null,
                p_login: createFormData.login.trim() || null,
                p_sponsor_code: createFormData.sponsor_code.trim() || null
            });

            if (error) throw error;

            toast.success('Afiliado criado com sucesso!');
            setIsCreateModalOpen(false);
            setCreateFormData({
                name: '',
                email: '',
                password: '',
                phone: '',
                cpf: '',
                cnpj: '',
                login: '',
                sponsor_code: ''
            });
            fetchAffiliates();
        } catch (error: any) {
            console.error('Error creating affiliate:', error);
            toast.error(error.message || 'Erro ao criar afiliado');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateAffiliate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAffiliate) return;

        setIsSaving(true);
        try {
            const { error: affError } = await supabase
                .from('affiliates')
                .update({
                    full_name: editingAffiliate.name,
                    email: editingAffiliate.email,
                    whatsapp: editingAffiliate.phone,
                    is_active: editingAffiliate.raw_status,
                    is_verified: editingAffiliate.raw_verified,
                    cpf: editingAffiliate.cpf?.trim() || null,
                    cnpj: editingAffiliate.cnpj?.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingAffiliate.id)
                .eq('organization_id', ORGANIZATION_ID);

            if (affError) throw affError;

            // 2. Update user_profiles to stay in sync
            if (editingAffiliate.user_id) {
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .update({
                        full_name: editingAffiliate.name,
                        email: editingAffiliate.email,
                        whatsapp: editingAffiliate.phone,
                        registration_type: editingAffiliate.registration_type,
                        cpf: editingAffiliate.cpf?.trim() || null,
                        cnpj: editingAffiliate.cnpj?.trim() || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingAffiliate.user_id);
                
                if (profileError) {
                    console.warn('Error updating user_profiles:', profileError);
                }
            }

            // 3. Update Auth User if email or password changed
            const updateAuthData: any = {};
            if (newPassword.trim()) updateAuthData.password = newPassword.trim();
            if (editingAffiliate.email !== originalEmail) updateAuthData.email = editingAffiliate.email;

            if (Object.keys(updateAuthData).length > 0 && editingAffiliate.user_id) {
                const { error: authError } = await supabase.rpc('admin_update_user_auth', {
                    p_user_id: editingAffiliate.user_id,
                    p_email: updateAuthData.email || null,
                    p_password: updateAuthData.password || null
                });
                if (authError) {
                    if (authError.message.includes('already registered')) {
                        throw new Error('Este e-mail já está sendo usado por outro usuário.');
                    }
                    throw authError;
                }
            }

            toast.success('Afiliado atualizado com sucesso!');
            setEditingAffiliate(null);
            setNewPassword('');
            fetchAffiliates();
        } catch (error: any) {
            console.error('Error updating affiliate:', error);
            toast.error(error.message || 'Erro ao atualizar dados');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAffiliate = async () => {
        if (!deletingAffiliate) return;
        if (!deletingAffiliate.user_id) {
            toast.error('ID de usuário não encontrado para este registro.');
            return;
        }

        setIsSaving(true);
        try {
            // Chamamos o RPC que deleta o usuário do auth e todas as tabelas via CASCADE
            const { error } = await supabase.rpc('admin_delete_user', { 
                p_user_id: deletingAffiliate.user_id 
            });

            if (error) throw error;

            toast.success('Afiliado e usuário removidos com sucesso!');
            setDeletingAffiliate(null);
            fetchAffiliates();
        } catch (error: any) {
            console.error('Error deleting affiliate:', error);
            toast.error(error.message || 'Erro ao remover afiliado totalmente');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPDF = () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF();
            const tableColumn = ["ID", "Nome", "Email", "Plano", "Status", "Cadastrado em"];
            const tableRows = affiliates.map(aff => [
                aff.id,
                aff.name,
                aff.email,
                aff.plan,
                aff.status,
                aff.joined
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
            });

            doc.text("Relatório de Afiliados - Clube do Seu Bolso", 14, 15);
            doc.save(`afiliados_classe_a_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF exportado com sucesso!');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error('Erro ao gerar PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const filteredAffiliates = affiliates.filter(aff => {
        const matchesSearch = aff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            aff.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'Todos' || aff.status === filterStatus;
        const matchesPlan = filterPlan === 'Todos' || aff.plan.includes(filterPlan);
        return matchesSearch && matchesStatus && matchesPlan;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAffiliates.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAffiliates.length / itemsPerPage);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ativo': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Pendente': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Bloqueado': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black text-[#05080F] tracking-tight">
                            Gestão de Afiliados
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Controle total sobre a rede de parceiros e consultores.</p>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-[#05080F] text-white rounded-2xl font-bold hover:bg-slate-800 transition-all text-sm shadow-xl shadow-slate-200"
                        >
                            <UserPlus className="w-4 h-4 text-[#2980B9]" />
                            Novo Afiliado
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm shadow-sm"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#2980B9]" />}
                            PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-[#05080F] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2980B9]/10 blur-3xl rounded-full group-hover:bg-[#2980B9]/20 transition-all duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                <Users className="w-6 h-6 text-[#2980B9]" />
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Total de Afiliados</p>
                            <h3 className="text-3xl font-black text-[#2980B9]">{totalStats.total.toString().padStart(2, '0')}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
                            <Clock className="w-6 h-6 text-amber-500" />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Aguardando Verificação</p>
                        <h3 className="text-3xl font-black text-[#05080F]">{totalStats.pending.toString().padStart(2, '0')}</h3>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                            <UserPlus className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Novos este Mês</p>
                        <h3 className="text-3xl font-black text-[#05080F]">+{totalStats.newThisMonth.toString().padStart(2, '0')}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between relative z-20">
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:border-[#2980B9] transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                            className={`flex-grow lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 border rounded-2xl font-bold transition-all text-sm ${isFiltersOpen ? 'bg-[#2980B9]/10 border-[#2980B9] text-[#05080F]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter className="w-4 h-4 text-[#2980B9]" />
                            Filtros Avançados
                        </button>
                    </div>

                    {isFiltersOpen && (
                        <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 z-30">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Status do Cadastro</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Todos', 'Ativo', 'Pendente', 'Bloqueado'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => {
                                                    setFilterStatus(status);
                                                    setCurrentPage(1);
                                                }}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-[#2980B9] text-[#05080F]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Plano / Slot</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold text-[#05080F] outline-none focus:border-[#2980B9]"
                                        value={filterPlan}
                                        onChange={(e) => {
                                            setFilterPlan(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option>Todos</option>
                                        <option>Membro</option>
                                        <option>Slot 1</option>
                                        <option>Slot 2</option>
                                        <option>Slot 3</option>
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setFilterStatus('Todos');
                                            setFilterPlan('Todos');
                                            setSearchTerm('');
                                            setIsFiltersOpen(false);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full bg-[#05080F] text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest hover:bg-[#2980B9] hover:text-[#05080F] transition-all"
                                    >
                                        Limpar e Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="text-left py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">Afiliado</th>
                                    <th className="text-left py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">Status</th>
                                    <th className="text-left py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none text-center">Ganhos Acumulados</th>
                                    <th className="text-left py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">Plano</th>
                                    <th className="text-left py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">Membro Desde</th>
                                    <th className="text-right py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="py-6 px-10"><div className="h-12 w-48 bg-slate-100 rounded-2xl"></div></td>
                                            <td className="py-6 px-6"><div className="h-8 w-24 bg-slate-100 rounded-full"></div></td>
                                            <td className="py-6 px-6"><div className="h-10 w-24 bg-slate-100 rounded-2xl mx-auto"></div></td>
                                            <td className="py-6 px-6"><div className="h-10 w-24 bg-slate-100 rounded-2xl"></div></td>
                                            <td className="py-6 px-6"><div className="h-10 w-24 bg-slate-100 rounded-2xl"></div></td>
                                            <td className="py-6 px-10"><div className="h-10 w-20 bg-slate-100 rounded-2xl ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((aff) => (
                                        <tr key={aff.id} className="group hover:bg-slate-50/30 transition-all">
                                            <td className="py-8 px-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-white">
                                                        <span className="text-slate-500 font-black text-sm uppercase">{aff.name.slice(0, 2)}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-[#05080F] text-sm md:text-base truncate">{aff.name}</h4>
                                                        <p className="text-[10px] md:text-xs font-bold text-slate-400 truncate">{aff.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-8 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider border ${getStatusColor(aff.status)}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${aff.status === 'Ativo' ? 'bg-emerald-500' : aff.status === 'Pendente' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                                    {aff.status}
                                                </span>
                                            </td>
                                            <td className="py-8 px-6 text-center">
                                                <span className="font-black text-[#05080F] text-xs md:text-sm bg-slate-50 px-4 py-2 rounded-xl">{aff.earnings}</span>
                                            </td>
                                            <td className="py-8 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Shield className={`w-4 h-4 ${aff.plan.includes('Slot') ? 'text-[#2980B9]' : 'text-slate-300'}`} />
                                                    <span className="text-[10px] md:text-xs font-black text-slate-600">{aff.plan}</span>
                                                </div>
                                            </td>
                                            <td className="py-8 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-300" />
                                                    <span className="text-[10px] md:text-xs font-bold text-slate-500">{aff.joined}</span>
                                                </div>
                                            </td>
                                            <td className="py-8 px-10 text-right shrink-0">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setViewingNetworkId(aff.id);
                                                            setViewingNetworkName(aff.name);
                                                        }}
                                                        className="p-2.5 text-slate-300 hover:text-[#05080F] hover:bg-white hover:shadow-sm rounded-xl transition-all"
                                                        title="Ver Rede"
                                                    >
                                                        <Network className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setViewingAffiliate(aff)}
                                                        className="p-2.5 text-slate-300 hover:text-[#05080F] hover:bg-white hover:shadow-sm rounded-xl transition-all"
                                                        title="Detalhes"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingAffiliate(aff);
                                                            setOriginalEmail(aff.email);
                                                            setNewPassword('');
                                                        }}
                                                        className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingAffiliate(aff)}
                                                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <Search className="w-12 h-12 opacity-30" />
                                                <p className="font-bold text-sm tracking-widest uppercase">Nenhum afiliado encontrado</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="p-8 md:p-10 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <p className="text-xs md:text-sm text-slate-400 font-bold order-2 sm:order-1">
                                Mostrando <span className="text-[#05080F]">{indexOfFirstItem + 1}</span>-
                                <span className="text-[#05080F]">{Math.min(indexOfLastItem, filteredAffiliates.length)}</span> de 
                                <span className="text-[#05080F]">{filteredAffiliates.length}</span> resultados
                            </p>
                            <div className="flex items-center gap-2 order-1 sm:order-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="w-11 h-11 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#05080F] transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                                >
                                    <ArrowUpDown className="w-4 h-4 rotate-90" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-11 h-11 rounded-2xl text-[10px] md:text-sm font-black transition-all ${currentPage === i + 1 ? 'bg-[#05080F] text-white shadow-xl shadow-[#05080F]/10' : 'bg-white border border-slate-50 hover:bg-slate-50 text-slate-400'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-11 h-11 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#05080F] transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                                >
                                    <ArrowUpDown className="w-4 h-4 -rotate-90" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {viewingNetworkId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-12 mx-auto">
                    <div className="absolute inset-0 bg-[#05080F]/80 backdrop-blur-md" onClick={() => setViewingNetworkId(null)}></div>
                    <div className="bg-white w-full h-full md:h-auto md:max-w-6xl md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Rede de Indicações</p>
                                <h2 className="text-2xl md:text-3xl font-black text-[#05080F]">{viewingNetworkName}</h2>
                            </div>
                            <button
                                onClick={() => setViewingNetworkId(null)}
                                className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 md:p-10 bg-slate-50/30">
                            <AffiliateNetwork rootAffiliateId={viewingNetworkId} />
                        </div>
                    </div>
                </div>
            )}

            {viewingAffiliate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#05080F]/80 backdrop-blur-md" onClick={() => setViewingAffiliate(null)}></div>
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center relative">
                            <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] mx-auto flex items-center justify-center mb-6 border-4 border-white shadow-xl">
                                <Users className="w-10 h-10 text-[#2980B9]" />
                            </div>
                            <h3 className="text-2xl font-black text-[#05080F] mb-1">{viewingAffiliate.name}</h3>
                            <p className="text-sm font-bold text-slate-400">{viewingAffiliate.email}</p>
                            <span className={`mt-4 inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(viewingAffiliate.status)}`}>
                                {viewingAffiliate.status}
                            </span>
                        </div>
                        <div className="bg-slate-50/50 p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-[#05080F]">
                                        <Phone className="w-3.5 h-3.5 text-emerald-500" /> {viewingAffiliate.phone}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro desde</p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-[#05080F]">
                                        <Calendar className="w-3.5 h-3.5 text-[#2980B9]" /> {viewingAffiliate.joined}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-[#05080F]">
                                        <Shield className="w-3.5 h-3.5 text-blue-500" /> {viewingAffiliate.registration_type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-[#05080F]">
                                        <Lock className="w-3.5 h-3.5 text-slate-400" /> {viewingAffiliate.cpf || viewingAffiliate.cnpj || 'Não inf.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-10">
                            <button
                                onClick={() => setViewingAffiliate(null)}
                                className="w-full py-4 bg-[#05080F] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-[#2980B9] hover:text-[#05080F] transition-all shadow-xl shadow-[#05080F]/10"
                            >
                                FECHAR DETALHES
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingAffiliate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#05080F]/80 backdrop-blur-md" onClick={() => setEditingAffiliate(null)}></div>
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
                        <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-[#05080F]">Editar Afiliado</h3>
                            <button onClick={() => setEditingAffiliate(null)} className="p-3 text-slate-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleUpdateAffiliate} className="p-8 md:p-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={editingAffiliate.name}
                                        onChange={e => setEditingAffiliate({ ...editingAffiliate, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={editingAffiliate.email}
                                        onChange={e => setEditingAffiliate({ ...editingAffiliate, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={editingAffiliate.phone}
                                        onChange={e => setEditingAffiliate({ ...editingAffiliate, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Tipo de Cadastro</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9] appearance-none"
                                        value={editingAffiliate.registration_type}
                                        onChange={e => setEditingAffiliate({ ...editingAffiliate, registration_type: e.target.value })}
                                    >
                                        <option value="individual">Pessoa Física (CPF)</option>
                                        <option value="business">Pessoa Jurídica (CNPJ)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
                                        {editingAffiliate.registration_type === 'individual' ? 'CPF' : 'CNPJ'}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={editingAffiliate.registration_type === 'individual' ? editingAffiliate.cpf : editingAffiliate.cnpj}
                                        onChange={e => {
                                            if (editingAffiliate.registration_type === 'individual') {
                                                setEditingAffiliate({ ...editingAffiliate, cpf: e.target.value });
                                            } else {
                                                setEditingAffiliate({ ...editingAffiliate, cnpj: e.target.value });
                                            }
                                        }}
                                        placeholder={editingAffiliate.registration_type === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Status</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingAffiliate({ ...editingAffiliate, raw_status: true })}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${editingAffiliate.raw_status ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}
                                        >
                                            ATIVO
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingAffiliate({ ...editingAffiliate, raw_status: false })}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${!editingAffiliate.raw_status ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-400'}`}
                                        >
                                            BLOQUEADO
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Verificação</label>
                                    <button
                                        type="button"
                                        onClick={() => setEditingAffiliate({ ...editingAffiliate, raw_verified: !editingAffiliate.raw_verified })}
                                        className={`w-full py-3 rounded-xl text-[10px] font-black transition-all ${editingAffiliate.raw_verified ? 'bg-blue-500 text-white' : 'bg-amber-50 text-amber-500'}`}
                                    >
                                        {editingAffiliate.raw_verified ? 'VERIFICADO' : 'PENDENTE'}
                                    </button>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nova Senha (deixe em branco para manter)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingAffiliate(null)}
                                    className="flex-1 py-4 border border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-[#05080F] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2980B9] hover:text-[#05080F] transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-[#2980B9]" />}
                                    SALVAR ALTERAÇÕES
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deletingAffiliate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#05080F]/80 backdrop-blur-md" onClick={() => setDeletingAffiliate(null)}></div>
                    <div className="bg-white w-full max-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center space-y-4">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] mx-auto flex items-center justify-center">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-[#05080F]">Remover Afiliado?</h3>
                            <p className="text-sm font-bold text-slate-400 leading-relaxed">
                                Esta ação não pode ser desfeita. O afiliado <span className="text-red-500">{deletingAffiliate.name}</span> perderá acesso total à plataforma.
                            </p>
                        </div>
                        <div className="p-10 pt-0 flex gap-4">
                            <button
                                onClick={() => setDeletingAffiliate(null)}
                                className="flex-1 py-4 border border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase"
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={handleDeleteAffiliate}
                                disabled={isSaving}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                            >
                                {isSaving ? '...' : 'REMOVER'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#05080F]/80 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Painel Administrativo</p>
                                <h2 className="text-xl md:text-2xl font-black text-[#05080F]">Novo Afiliado</h2>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAffiliate} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={createFormData.name}
                                        onChange={e => setCreateFormData({ ...createFormData, name: e.target.value })}
                                        placeholder="Nome do Afiliado"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={createFormData.email}
                                        onChange={e => setCreateFormData({ ...createFormData, email: e.target.value })}
                                        placeholder="email@afiliado.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Senha de Acesso</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={createFormData.password}
                                        onChange={e => setCreateFormData({ ...createFormData, password: e.target.value })}
                                        placeholder="Senha temporária"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={createFormData.phone}
                                        onChange={e => setCreateFormData({ ...createFormData, phone: e.target.value })}
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">CPF</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={createFormData.cpf}
                                        onChange={e => setCreateFormData({ ...createFormData, cpf: e.target.value })}
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">CNPJ (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={createFormData.cnpj}
                                        onChange={e => setCreateFormData({ ...createFormData, cnpj: e.target.value })}
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Login (Referral Code)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={createFormData.login}
                                        onChange={e => setCreateFormData({ ...createFormData, login: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                        placeholder="ex: joaodasilva"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Indicador / Patrocinador (Código)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                        value={createFormData.sponsor_code}
                                        onChange={e => setCreateFormData({ ...createFormData, sponsor_code: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                        placeholder="ex: patrocinador"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-4 border border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-[#05080F] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2980B9] hover:text-[#05080F] transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 text-[#2980B9]" />}
                                    CADASTRAR AFILIADO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminAffiliates;
