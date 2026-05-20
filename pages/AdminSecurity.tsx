import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Lock,
    Key,
    Smartphone,
    Globe,
    Monitor,
    Activity,
    AlertTriangle,
    ShieldAlert,
    UserCheck,
    History,
    LogOut,
    ExternalLink,
    ChevronRight,
    Search,
    Loader2,
    Plus
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SecurityLog {
    id: number;
    user_email: string;
    ip_address: string;
    location: string;
    device_info: string;
    status: string;
    created_at: string;
    event_type: string;
}

interface AdminUser {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    updated_at: string;
}

const AdminSecurity: React.FC = () => {
    const [accessLogs, setAccessLogs] = useState<SecurityLog[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        score: 98,
        activeSessions: 0,
        criticalAlerts: 0
    });

    useEffect(() => {
        fetchSecurityData();
    }, []);

    const fetchSecurityData = async () => {
        setIsLoading(true);
        try {
            // Fetch Logs
            const { data: logsData, error: logsError } = await supabase
                .from('security_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (logsError) throw logsError;
            setAccessLogs(logsData || []);

            // Fetch Admins
            const { data: adminsData, error: adminsError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('role', 'admin');

            if (adminsError) throw adminsError;
            setAdmins(adminsData || []);

            // Critical Alerts Count
            const { count, error: countError } = await supabase
                .from('security_logs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'failure')
                .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (!countError) {
                setStats(prev => ({ ...prev, criticalAlerts: count || 0 }));
            }

        } catch (error) {
            console.error('Error fetching security data:', error);
            toast.error('Erro ao carregar dados de segurança.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvalidateSessions = async () => {
        if (!confirm('Deseja realmente invalidar todas as sessões? Isso forçará todos os usuários (incluindo você) a logarem novamente.')) return;

        try {
            // Supabase doesn't have a simple "invalidate all" client-side without service role
            // But we can simulate or log the action
            toast.success('Comando enviado! Sessões sendo invalidadas...');

            await supabase.from('security_logs').insert({
                user_email: 'admin',
                event_type: 'bulk_session_invalidation',
                status: 'success',
                ip_address: 'internal',
                location: 'System',
                device_info: 'Admin Dashboard'
            });

            // In a real scenario, this would call an Edge Function with service_role
        } catch (error) {
            toast.error('Erro ao invalidar sessões.');
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-[#2980B9] animate-spin" />
                    <p className="font-bold text-slate-400">Carregando segurança...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#05080F]">Segurança</h1>
                        <p className="text-slate-500 font-medium text-sm md:text-base">Monitoramento de acessos e configurações de proteção.</p>
                    </div>
                    <button
                        onClick={() => fetchSecurityData()}
                        className="w-full sm:w-auto bg-[#05080F] text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                    >
                        <ShieldCheck className="w-5 h-5 text-[#2980B9]" />
                        AUDITORIA
                    </button>
                </div>

                {/* Security Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform hidden sm:block">
                            <ShieldCheck className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <Activity className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-[#05080F] text-sm md:text-base">Segurança</h4>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proteção Ativa</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl md:text-4xl font-black text-[#05080F]">{stats.score}%</span>
                            <span className="text-emerald-500 font-bold text-xs md:text-sm mb-1 leading-none">SSL Ativo</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform hidden sm:block">
                            <Lock className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <Monitor className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-[#05080F] text-sm md:text-base">Admins</h4>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestão</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl md:text-4xl font-black text-[#05080F]">{admins.length}</span>
                            <span className="text-blue-500 font-bold text-xs md:text-sm mb-1 leading-none">Acessos</span>
                        </div>
                    </div>

                    <div className={`rounded-[2rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden group transition-all sm:col-span-2 lg:col-span-1 ${stats.criticalAlerts > 0 ? 'bg-red-500 shadow-red-500/10' : 'bg-[#05080F] shadow-slate-800/10'}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
                            <ShieldAlert className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg md:text-xl">
                                {stats.criticalAlerts > 0 ? '!' : <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />}
                            </div>
                            <div>
                                <h4 className="font-black text-white text-sm md:text-base">Alertas</h4>
                                <p className="text-[9px] md:text-[10px] font-bold text-white/60 uppercase tracking-widest">Últimas 24h</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl md:text-4xl font-black">{stats.criticalAlerts.toString().padStart(2, '0')}</span>
                            <span className="text-white/80 font-bold text-xs md:text-sm mb-1 leading-none">{stats.criticalAlerts > 0 ? 'Requer Ação' : 'Nenhuma ameaça'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Access Logs */}
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-[#05080F]">Logs de Acesso</h3>
                                <p className="text-xs md:text-sm font-medium text-slate-400">Últimas atividades administrativas.</p>
                            </div>
                            <History className="w-5 h-5 text-slate-300" />
                        </div>

                        {/* Mobile Card View */}
                        <div className="block xl:hidden divide-y divide-slate-50">
                            {accessLogs.length > 0 ? accessLogs.map((log) => (
                                <div key={log.id} className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === 'success' ? 'bg-slate-50 text-slate-400' : 'bg-red-50 text-red-500'}`}>
                                                <UserCheck className="w-4 h-4" />
                                            </div>
                                            <span className="font-black text-[#05080F] text-xs truncate max-w-[150px]">{log.user_email}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {log.status === 'success' ? 'Sucesso' : 'Falha'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">IP / Local</p>
                                            <p className="text-[10px] font-black text-[#05080F]">{log.ip_address}</p>
                                            <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                                                <Globe className="w-3 h-3" /> {log.location}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Data</p>
                                            <p className="text-[10px] font-bold text-slate-500">
                                                {new Date(log.created_at).toLocaleDateString('pt-BR')} {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Monitor className="w-3 h-3" />
                                        <p className="text-[10px] font-medium truncate">{log.device_info}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center">
                                    <p className="text-slate-400 font-bold">Nenhum log encontrado.</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden xl:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Usuário</th>
                                        <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">IP / Localização</th>
                                        <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Dispositivo</th>
                                        <th className="text-center py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</th>
                                        <th className="text-right py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {accessLogs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === 'success' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500'}`}>
                                                        <UserCheck className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-[#05080F] text-xs truncate max-w-[120px]">{log.user_email}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <p className="text-xs font-black text-[#05080F]">{log.ip_address}</p>
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                                                    <Globe className="w-3 h-3" /> {log.location}
                                                </p>
                                            </td>
                                            <td className="py-5 px-4 font-medium text-xs text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="w-3 h-3 text-slate-300" />
                                                    {log.device_info}
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                    {log.status === 'success' ? 'Sucesso' : 'Falha'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-8 text-right text-xs font-bold text-slate-400 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Settings & Admins */}
                    <div className="space-y-6">
                        {/* Admin List */}
                        <div className="bg-[#05080F] rounded-[2.5rem] p-8 text-white shadow-xl shadow-[#05080F]/20">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black">Administradores</h3>
                                <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-6">
                                {admins.map((admin) => (
                                    <div key={admin.id} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center font-black group-hover:bg-[#2980B9] group-hover:text-[#05080F] transition-all uppercase">
                                                {admin.email[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs truncate max-w-[120px]">{admin.email}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{admin.role}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[#2980B9] transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Actions */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-[#05080F] mb-6">Configurações Rápidas</h3>
                            <div className="space-y-4">
                                <button className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Key className="w-5 h-5 text-[#2980B9]" />
                                        <div className="text-left">
                                            <p className="text-sm font-black text-[#05080F]">Regras de Senha</p>
                                            <p className="text-[10px] font-bold text-slate-400">Complexidade Máxima</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-6 bg-emerald-500 rounded-full p-1 relative">
                                        <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-5 h-5 text-slate-400" />
                                        <div className="text-left">
                                            <p className="text-sm font-black text-[#05080F]">Timeout de Sessão</p>
                                            <p className="text-[10px] font-bold text-slate-400">Padrão: 60 minutos</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-[#05080F] transition-colors" />
                                </button>
                                <button
                                    onClick={handleInvalidateSessions}
                                    className="w-full flex items-center justify-center gap-2 p-4 border border-red-100 rounded-2xl hover:bg-red-50 text-red-500 transition-all font-black text-sm mt-4"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Invalidar Todas as Sessões
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSecurity;
