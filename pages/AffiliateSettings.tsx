import React, { useState, useEffect, useRef } from 'react';
import {
    User,
    Mail,
    Phone,
    Lock,
    Save,
    Camera,
    Loader2,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Shield,
    History,
    Activity,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { ORGANIZATION_ID } from '../lib/config';
import toast from 'react-hot-toast';

interface OrderItem {
    id: string;
    product_name: string;
    unit_price: number;
}

interface BillingOrder {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    payment_method?: string;
    order_items?: OrderItem[];
}

const AffiliateSettings: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'bank' | 'subscription'>('profile');

    const isClientOnly = profile?.role === 'client';

    const handleDeleteAccount = async () => {
        if (window.confirm("ATENÇÃO: Deletar sua conta é uma ação irreversível. Seus dados pessoais serão permanentemente apagados conforme a LGPD. Deseja continuar?")) {
            setIsDeleting(true);
            try {
                const { error } = await supabase.rpc('delete_user_lgpd');
                if (error) throw error;
                
                toast.success("Sua conta e dados pessoais foram apagados com sucesso.");
                await signOut();
                navigate('/');
            } catch (err: any) {
                console.error(err);
                toast.error("Erro ao apagar conta. Tente novamente ou contate o suporte.");
            } finally {
                setIsDeleting(false);
            }
        }
    };
    
    // Personal Profile Data
    const [profileData, setProfileData] = useState({
        full_name: '',
        email: '',
        whatsapp: '',
        cpf: '',
        cep: '',
        address: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        avatar_url: ''
    });

    // Payout and Bank settings
    const [bankData, setBankData] = useState({
        pix_key: '',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        bank_account_type: 'Corrente',
        bank_document: '',
        asaas_wallet_id: '',
        auto_renew_subscription: true
    });

    // Password Change
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Billing History for EVA Subscription
    const [billingHistory, setBillingHistory] = useState<BillingOrder[]>([]);
    const [loadingBilling, setLoadingBilling] = useState(false);

    const [recentClientsCount, setRecentClientsCount] = useState(0);
    const [maintenanceExpiresAt, setMaintenanceExpiresAt] = useState<string | null>(null);
    const [isDelinquent, setIsDelinquent] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchBillingHistory();
        }
    }, [user]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'bank' || tab === 'subscription' || tab === 'profile') {
            setActiveTab(tab as 'profile' | 'bank' | 'subscription');
        }
    }, [location.search]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch from affiliates table
            const { data: affData, error } = await supabase
                .from('affiliates')
                .select('*')
                .eq('user_id', user?.id)
                .limit(1);

            if (error) throw error;
            const data = affData?.[0] || null;

            if (data) {
                setProfileData({
                    full_name: data.full_name || user?.user_metadata?.nome || '',
                    email: data.email || user?.email || '',
                    whatsapp: data.whatsapp || user?.user_metadata?.whatsapp || '',
                    cpf: data.cpf || user?.user_metadata?.cpf || '',
                    cep: data.cep || '',
                    address: data.address || '',
                    street: data.street || '',
                    number: data.number || '',
                    complement: data.complement || '',
                    neighborhood: data.neighborhood || '',
                    city: data.city || '',
                    state: data.state || '',
                    avatar_url: data.avatar_url || ''
                });
                setMaintenanceExpiresAt(data.maintenance_expires_at);
                setIsDelinquent(data.is_delinquent || false);
            } else {
                setProfileData(prev => ({
                    ...prev,
                    email: user?.email || '',
                    full_name: user?.user_metadata?.nome ? `${user.user_metadata.nome} ${user.user_metadata.sobrenome || ''}` : '',
                    whatsapp: user?.user_metadata?.whatsapp || '',
                    cpf: user?.user_metadata?.cpf || ''
                }));
            }

            // Fetch client referrals from user_profiles for the last 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { count: clientsCount } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('sponsor_id', user?.id)
                .eq('role', 'client')
                .gte('created_at', thirtyDaysAgo);
            
            setRecentClientsCount(clientsCount || 0);

            // 2. Fetch from user_settings (Bank data & subscription preferences)
            const { data: settingsData, error: settingsError } = await supabase
                .from('user_settings')
                .select('pix_key, bank_name, bank_agency, bank_account, bank_account_type, bank_document, asaas_wallet_id, auto_renew_subscription')
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID)
                .limit(1);

            if (settingsError) {
                console.error('Error fetching settings:', settingsError);
            } else if (settingsData && settingsData.length > 0) {
                const s = settingsData[0];
                setBankData({
                    pix_key: s.pix_key || '',
                    bank_name: s.bank_name || '',
                    bank_agency: s.bank_agency || '',
                    bank_account: s.bank_account || '',
                    bank_account_type: s.bank_account_type || 'Corrente',
                    bank_document: s.bank_document || '',
                    asaas_wallet_id: s.asaas_wallet_id || '',
                    auto_renew_subscription: s.auto_renew_subscription !== false
                });
            }
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            toast.error('Erro ao carregar seu perfil.');
        } finally {
            setLoading(false);
        }
    };

    const fetchBillingHistory = async () => {
        try {
            setLoadingBilling(true);
            
            // Query orders containing EVA products
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    total_amount,
                    status,
                    created_at,
                    payment_method,
                    order_items:order_items(id, product_name, unit_price)
                `)
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filter orders that have EVA products in their items
            const filteredOrders = (data || []).filter(order => {
                const items = order.order_items || [];
                return items.some((item: any) => 
                    item.product_name.toLowerCase().includes('eva') || 
                    item.product_name.toLowerCase().includes('escritório virtual')
                );
            });

            setBillingHistory(filteredOrders as unknown as BillingOrder[]);
        } catch (error) {
            console.error('Error fetching billing history:', error);
        } finally {
            setLoadingBilling(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setSaving(true);

            if (profileData.email !== user.email) {
                const { error: authErr } = await supabase.auth.updateUser({
                    email: profileData.email
                });
                if (authErr) throw authErr;
                toast.success('Confirme a mudança no seu novo e-mail!', { icon: '📧' });
            }

            const { error: profileErr } = await supabase
                .from('user_profiles')
                .update({
                    full_name: profileData.full_name,
                    email: profileData.email,
                    whatsapp: profileData.whatsapp,
                    cpf: profileData.cpf,
                    cep: profileData.cep,
                    street: profileData.street,
                    number: profileData.number,
                    complement: profileData.complement,
                    neighborhood: profileData.neighborhood,
                    city: profileData.city,
                    state: profileData.state,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (profileErr) throw profileErr;

            const { error: affErr } = await supabase
                .from('affiliates')
                .update({
                    full_name: profileData.full_name,
                    email: profileData.email,
                    whatsapp: profileData.whatsapp,
                    cpf: profileData.cpf,
                    cep: profileData.cep,
                    street: profileData.street,
                    number: profileData.number,
                    complement: profileData.complement,
                    neighborhood: profileData.neighborhood,
                    city: profileData.city,
                    state: profileData.state,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (affErr) throw affErr;

            toast.success('Perfil pessoal atualizado com sucesso!');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    const handleBankUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const walletId = bankData.asaas_wallet_id.trim();
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

        if (walletId && !uuidRegex.test(walletId)) {
            toast.error('A Chave de Acesso Asaas (Wallet ID) informada é inválida. Ela deve ter o formato padrão (ex: 8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d) com 36 caracteres.');
            return;
        }

        try {
            setSaving(true);

            const { error } = await supabase
                .from('user_settings')
                .update({
                    pix_key: bankData.pix_key.trim(),
                    bank_name: bankData.bank_name.trim(),
                    bank_agency: bankData.bank_agency.trim(),
                    bank_account: bankData.bank_account.trim(),
                    bank_account_type: bankData.bank_account_type,
                    bank_document: bankData.bank_document.trim(),
                    asaas_wallet_id: bankData.asaas_wallet_id.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .eq('organization_id', ORGANIZATION_ID);

            if (error) throw error;

            toast.success('Dados bancários e PIX atualizados!');
        } catch (error: any) {
            console.error('Error updating bank data:', error);
            toast.error(error.message || 'Erro ao salvar dados bancários.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAutoRenew = async (value: boolean) => {
        if (!user) return;
        
        try {
            setBankData(prev => ({ ...prev, auto_renew_subscription: value }));

            const { error } = await supabase
                .from('user_settings')
                .update({
                    auto_renew_subscription: value,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .eq('organization_id', ORGANIZATION_ID);

            if (error) throw error;

            toast.success(value ? 'Renovação automática ativada!' : 'Renovação automática desativada.');
        } catch (error: any) {
            console.error('Error toggling auto renew:', error);
            toast.error('Erro ao atualizar renovação automática.');
            // Revert state
            setBankData(prev => ({ ...prev, auto_renew_subscription: !value }));
        }
    };

    const handleCepLookup = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                setProfileData(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                    cep: cleanCep
                }));
            }
        } catch (error) {
            console.error('Error fetching CEP:', error);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('As senhas não coincidem!');
            return;
        }

        if (passwords.newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            setSaving(true);
            const { error } = await supabase.auth.updateUser({
                password: passwords.newPassword
            });

            if (error) throw error;

            toast.success('Senha atualizada com sucesso!');
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error('Error updating password:', error);
            toast.error(error.message || 'Erro ao atualizar senha.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user?.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('affiliates')
                .update({ avatar_url: publicUrl })
                .eq('user_id', user?.id);

            if (updateError) throw updateError;

            setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
            toast.success('Foto de perfil atualizada!');
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Erro ao enviar imagem.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <AffiliateLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-[#2980B9] animate-spin" />
                </div>
            </AffiliateLayout>
        );
    }

    return (
        <AffiliateLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => {
                            if (isClientOnly) {
                                navigate('/cliente/compras');
                            } else {
                                navigate('/afiliado/dashboard');
                            }
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#0B1221] hover:shadow-md transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-[#0B1221]">Minhas Configurações</h1>
                        <p className="text-slate-500 font-medium">
                            {isClientOnly 
                                ? 'Gerencie suas informações pessoais de cadastro.' 
                                : 'Gerencie suas informações pessoais e dados de recebimento.'}
                        </p>
                    </div>
                </div>

                {/* Tab buttons */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-grow py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'profile'
                                ? 'bg-white text-[#0B1221] shadow-sm'
                                : 'text-slate-500 hover:text-[#0B1221]'
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Dados Pessoais
                    </button>
                    {!isClientOnly && (
                        <>
                            <button
                                onClick={() => setActiveTab('bank')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                    activeTab === 'bank'
                                        ? 'bg-white text-[#0B1221] shadow-sm'
                                        : 'text-slate-500 hover:text-[#0B1221]'
                                }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                Dados de Recebimento
                            </button>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Picture / Summary Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 text-center sticky top-8">
                            <div className="relative inline-block mb-6 group">
                                <div className="w-40 h-40 rounded-full bg-slate-100 border-4 border-white shadow-xl mx-auto overflow-hidden flex items-center justify-center bg-cover bg-center"
                                     style={{ backgroundImage: profileData.avatar_url ? `url(${profileData.avatar_url})` : 'none' }}>
                                    {!profileData.avatar_url && (
                                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${profileData.full_name}`} alt="Avatar" className="w-full h-full object-cover" />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-[#0B1221]/60 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute bottom-1 right-1 bg-[#2980B9] w-12 h-12 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all group-hover:rotate-6 animate-pulse"
                                >
                                    <Camera className="w-6 h-6" />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    className="hidden" 
                                    accept="image/*"
                                />
                            </div>
                            <h3 className="text-xl font-black text-[#0B1221]">{profileData.full_name || 'Afiliado'}</h3>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Escritório Virtual (EVA)</p>
                            
                            <div className="mt-8 space-y-3">
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 text-left">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Afiliação</p>
                                        <p className="text-sm font-black text-[#0B1221]">Conta Verificada</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Dynamic Form Area based on Active Tab */}
                    <div className="lg:col-span-2 space-y-8 animate-in fade-in duration-300">
                        {activeTab === 'profile' && (
                            <>
                                {/* Personal Info Form */}
                                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-10">
                                    <h3 className="text-xl font-black text-[#0B1221] mb-8 flex items-center gap-2">
                                        <User className="w-5 h-5 text-[#2980B9]" />
                                        Informações Pessoais
                                    </h3>

                                    <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2980B9] transition-colors">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={profileData.full_name}
                                                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                    placeholder="Seu nome completo"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                    placeholder="seu@email.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2980B9] transition-colors">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={profileData.whatsapp}
                                                    onChange={(e) => setProfileData({ ...profileData, whatsapp: e.target.value })}
                                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                    placeholder="(00) 00000-0000"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                                            <input
                                                type="text"
                                                value={profileData.cpf}
                                                onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                placeholder="000.000.000-00"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                                            <input
                                                type="text"
                                                value={profileData.cep}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setProfileData({ ...profileData, cep: val });
                                                    if (val.replace(/\D/g, '').length === 8) {
                                                        handleCepLookup(val);
                                                    }
                                                }}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                placeholder="00000-000"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Rua / Logradouro</label>
                                            <input
                                                type="text"
                                                value={profileData.street}
                                                onChange={(e) => setProfileData({ ...profileData, street: e.target.value })}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                placeholder="Nome da rua"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                                                <input
                                                    type="text"
                                                    value={profileData.number}
                                                    onChange={(e) => setProfileData({ ...profileData, number: e.target.value })}
                                                    className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                    placeholder="123"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Complemento</label>
                                                <input
                                                    type="text"
                                                    value={profileData.complement}
                                                    onChange={(e) => setProfileData({ ...profileData, complement: e.target.value })}
                                                    className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                    placeholder="Apto, Bloco, etc."
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                                            <input
                                                type="text"
                                                value={profileData.neighborhood}
                                                onChange={(e) => setProfileData({ ...profileData, neighborhood: e.target.value })}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                placeholder="Seu bairro"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                                                <input
                                                    type="text"
                                                    value={profileData.city}
                                                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                                    className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                    placeholder="Cidade"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">UF</label>
                                                <input
                                                    type="text"
                                                    maxLength={2}
                                                    value={profileData.state}
                                                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value.toUpperCase() })}
                                                    className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221] uppercase"
                                                    placeholder="SP"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 pt-4">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="w-full md:w-auto px-10 py-4 bg-[#0B1221] text-white rounded-2xl font-black text-sm hover:bg-[#1a2436] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0B1221]/10 disabled:opacity-70"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                SALVAR ALTERAÇÕES
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Security Form */}
                                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-10">
                                    <h3 className="text-xl font-black text-[#0B1221] mb-8 flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-emerald-500" />
                                        Segurança & Senha
                                    </h3>

                                    <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                                            <input
                                                type="password"
                                                value={passwords.newPassword}
                                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                                            <input
                                                type="password"
                                                value={passwords.confirmPassword}
                                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-2 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-xl text-emerald-500 shadow-sm mt-0.5 animate-bounce">
                                                <AlertCircle className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                                                <b>Dica de segurança:</b> Use uma senha com pelo menos 8 caracteres, incluindo letras, números e símbolos especiais para maior proteção.
                                            </p>
                                        </div>

                                        <div className="md:col-span-2 pt-4">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="w-full md:w-auto px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-70"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                                ATUALIZAR SENHA
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Seção LGPD de exclusão de dados (Discreta) */}
                                <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 md:p-10 text-left mt-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Privacidade e Dados Pessoais</h4>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-4">
                                        Seus dados pessoais são protegidos pela Lei Geral de Proteção de Dados (LGPD). Caso queira solicitar a exclusão definitiva do seu perfil e todas as informações armazenadas, clique no link abaixo.
                                    </p>
                                    <button 
                                        type="button"
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest underline cursor-pointer"
                                    >
                                        {isDeleting ? "Excluindo Conta..." : "Solicitar exclusão permanente da conta"}
                                    </button>
                                </div>
                            </>
                        )}

                        {activeTab === 'bank' && (
                            /* Payout Info Form */
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-10">
                                <h3 className="text-xl font-black text-[#0B1221] mb-8 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-[#2980B9]" />
                                    Dados de Recebimento (PIX / Banco)
                                </h3>

                                <form onSubmit={handleBankUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Chave PIX Principal</label>
                                        <input
                                            type="text"
                                            value={bankData.pix_key}
                                            onChange={(e) => setBankData({ ...bankData, pix_key: e.target.value })}
                                            className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                            placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Banco</label>
                                        <input
                                            type="text"
                                            value={bankData.bank_name}
                                            onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                                            className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                            placeholder="Ex: Banco do Brasil, Nubank, Itaú"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Conta</label>
                                        <select
                                            value={bankData.bank_account_type}
                                            onChange={(e) => setBankData({ ...bankData, bank_account_type: e.target.value })}
                                            className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                        >
                                            <option value="Corrente">Conta Corrente</option>
                                            <option value="Poupança">Conta Poupança</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 md:col-span-2">
                                        <div className="space-y-2 col-span-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Agência</label>
                                            <input
                                                type="text"
                                                value={bankData.bank_agency}
                                                onChange={(e) => setBankData({ ...bankData, bank_agency: e.target.value })}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                placeholder="0001"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Número da Conta</label>
                                            <input
                                                type="text"
                                                value={bankData.bank_account}
                                                onChange={(e) => setBankData({ ...bankData, bank_account: e.target.value })}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                                placeholder="12345-6"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">CPF ou CNPJ do Titular</label>
                                        <input
                                            type="text"
                                            value={bankData.bank_document}
                                            onChange={(e) => setBankData({ ...bankData, bank_document: e.target.value })}
                                            className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                            placeholder="CPF ou CNPJ"
                                        />
                                    </div>

                                    {/* Campo Asaas Wallet ID */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Chave de Acesso Asaas (Wallet ID) *</label>
                                        <input
                                            type="text"
                                            value={bankData.asaas_wallet_id}
                                            onChange={(e) => setBankData({ ...bankData, asaas_wallet_id: e.target.value })}
                                            className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2980B9] focus:border-transparent outline-none transition-all font-bold text-[#0B1221]"
                                            placeholder="Ex: 8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-400 font-bold ml-1 uppercase tracking-wider">
                                            Obrigatório. Cadastre-se na plataforma Asaas, obtenha a Chave de Acesso da sua carteira (Wallet ID) e preencha aqui para ativar seu link de indicações e receber suas comissões.
                                        </p>
                                    </div>

                                    <div className="md:col-span-2 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-xl text-[#2980B9] shadow-sm mt-0.5">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs font-medium text-blue-800 leading-relaxed">
                                            <b>Atenção:</b> Os dados de recebimento devem pertencer ao titular da conta para evitar problemas no processamento dos saques.
                                        </p>
                                    </div>

                                    <div className="md:col-span-2 pt-4">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="w-full md:w-auto px-10 py-4 bg-[#2980B9] text-white rounded-2xl font-black text-sm hover:bg-[#1a5b85] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-70"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            SALVAR DADOS DE RECEBIMENTO
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AffiliateLayout>
    );
};

export default AffiliateSettings;
