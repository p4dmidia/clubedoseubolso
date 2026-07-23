import React, { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Search,
    Filter,
    Calendar,
    ChevronRight,
    Loader2,
    Eye,
    CheckCircle2,
    Truck,
    Package,
    XCircle,
    User,
    CreditCard,
    ArrowUpRight,
    Clock,
    DollarSign,
    X
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';

interface Order {
    id: string;
    customer_name: string;
    total_amount: number;
    status: 'Pendente' | 'Pago' | 'Enviado' | 'Entregue' | 'Cancelado' | 'pending' | 'shipped' | 'completed' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'failed';
    created_at: string;
    items_count: number;
    payment_method: string;
}

const AdminOrders: React.FC = () => {
    const { profile } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;

    // Estados para visualização de detalhes do pedido
    const [viewingOrder, setViewingOrder] = useState<any | null>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Erro ao carregar assinaturas.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewOrderDetails = async (order: any) => {
        setViewingOrder(order);
        setIsLoadingItems(true);
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', order.id);

            if (error) throw error;
            setOrderItems(data || []);
        } catch (error) {
            console.error('Error fetching order items:', error);
            toast.error('Erro ao carregar itens do pedido.');
        } finally {
            setIsLoadingItems(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: Order['status'], paymentStatus?: Order['payment_status']) => {
        try {
            const updateData: any = { 
                status: newStatus,
                updated_at: new Date().toISOString()
            };
            
            if (paymentStatus) {
                updateData.payment_status = paymentStatus;
                if (paymentStatus === 'paid') {
                    updateData.payment_status_detail = 'Accreditated Manual';
                }
            }

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;

            // Disparar sincronização com telemedicina se o status for Pago ou Cancelado
            if (newStatus === 'Pago' || newStatus === 'completed' || newStatus === 'Cancelado' || newStatus === 'cancelled') {
                supabase.functions.invoke('telemedicine-sync', {
                    body: { orderId }
                }).then(({ data, error: syncError }) => {
                    if (syncError) {
                        console.error('Erro ao sincronizar com telemedicina:', syncError);
                    } else {
                        console.log('Sincronização com telemedicina concluída:', data);
                    }
                }).catch(err => {
                    console.error('Erro ao invocar telemedicina:', err);
                });
            }

            if (newStatus === 'Cancelado' || newStatus === 'cancelled') {
                toast.success('Assinatura cancelada e plano revogado na telemedicina!');
            } else {
                toast.success(`Assinatura atualizada para ${newStatus === 'Pago' || newStatus === 'completed' ? 'Ativa' : newStatus}!`);
            }
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Erro ao atualizar status.');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            if (statusFilter === 'pending') {
                matchesStatus = order.status === 'pending' || order.status === 'Pendente';
            } else if (statusFilter === 'completed') {
                matchesStatus = order.status === 'completed' || order.status === 'Pago' || order.status === 'Entregue';
            } else if (statusFilter === 'cancelled') {
                matchesStatus = order.status === 'cancelled' || order.status === 'Cancelado';
            }
        }
        
        return matchesSearch && matchesStatus;
    });

    // Pagination calculations
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const paginatedOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending' || o.status === 'Pendente').length,
        active: orders.filter(o => o.status === 'completed' || o.status === 'Pago' || o.status === 'Entregue').length,
        revenue: orders.filter(o => o.status === 'completed' || o.status === 'Pago' || o.status === 'Entregue').reduce((acc, curr) => acc + curr.total_amount, 0),
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-[#2980B9] animate-spin" />
                    <p className="font-bold text-slate-400">Carregando assinaturas...</p>
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
                        <h1 className="text-2xl md:text-3xl font-black text-[#05080F]">Gestão de Assinaturas</h1>
                        <p className="text-slate-500 font-medium text-sm md:text-base">Acompanhe os planos de assinatura e status de pagamento em tempo real.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Assinaturas', value: stats.total, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Ativas', value: stats.active, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Receita Total', value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center mb-4`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{card.label}</p>
                            <h3 className="text-xl font-black text-[#05080F]">{card.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Filters & Table */}
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-50">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                            <h3 className="text-lg md:text-xl font-black text-[#05080F]">Fila de Assinaturas</h3>

                            <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
                                <div className="relative flex-1 sm:min-w-[320px]">
                                    <input
                                        type="text"
                                        placeholder="Buscar por cliente ou ID da assinatura..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-10 outline-none text-[10px] md:text-xs font-medium focus:border-[#2980B9] transition-all"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                </div>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar">
                                    {(['all', 'pending', 'completed', 'cancelled'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setStatusFilter(f)}
                                            className={`whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white shadow-sm text-[#05080F]' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {f === 'all' ? 'Ver Todas' : f === 'pending' ? 'Pendentes' : f === 'completed' ? 'Ativas' : 'Canceladas'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="text-left py-6 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">ID / Cliente</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Data</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Pagamento</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Valor Total</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                                    <th className="text-right py-6 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-slate-50/30 transition-all">
                                        <td className="py-6 px-6">
                                            <div>
                                                <p className="font-black text-[#05080F] text-sm">{order.customer_name || 'Cliente'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">#{order.id.replace(/^#/, '').slice(0, 8)}</p>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <p className="text-slate-500 font-bold text-xs">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase ${order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {order.payment_status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                    {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                                                </span>
                                                <p className="text-[10px] font-medium text-slate-400">{order.payment_method}</p>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <p className="font-black text-[#05080F]">R$ {order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{order.items_count} Itens</p>
                                        </td>
                                        <td className="py-6 px-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                order.status === 'completed' || order.status === 'Pago' || order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-600' :
                                                order.status === 'Cancelado' || order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    order.status === 'completed' || order.status === 'Pago' || order.status === 'Entregue' ? 'bg-emerald-500' :
                                                    order.status === 'Cancelado' || order.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                                                }`}></div>
                                                {order.status === 'pending' || order.status === 'Pendente' ? 'Pendente' :
                                                 order.status === 'completed' || order.status === 'Pago' || order.status === 'Entregue' ? 'Ativa' : 'Cancelada'}
                                            </span>
                                        </td>
                                        <td className="py-6 px-6 text-right">
                                            <div className="flex flex-col gap-2">
                                                {profile?.role !== 'admin_op' ? (
                                                    <>
                                                        {(order.status === 'Pendente' || order.status === 'pending') && (
                                                            <>
                                                                <button 
                                                                    onClick={() => updateOrderStatus(order.id, 'Pago', 'paid')}
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 transition-all"
                                                                    title="Marcar como Pago"
                                                                >
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    ATIVER PLANO
                                                                </button>
                                                                <button 
                                                                    onClick={() => updateOrderStatus(order.id, 'Cancelado')}
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase hover:bg-red-100 transition-all"
                                                                    title="Cancelar Pedido"
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    CANCELAR
                                                                </button>
                                                            </>
                                                        )}
                                                        {(order.status === 'Pago' || order.status === 'completed') && (
                                                            <button 
                                                                onClick={() => {
                                                                    if (window.confirm(`Deseja realmente revogar o plano de ${order.customer_name || 'este cliente'}? Isso inativará o acesso dele na plataforma de telemedicina.`)) {
                                                                        updateOrderStatus(order.id, 'Cancelado');
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase hover:bg-red-100 transition-all"
                                                                title="Revogar Acesso / Cancelar Plano"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                REVOGAR PLANO
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Visualização</span>
                                                )}
                                                <button 
                                                    onClick={() => handleViewOrderDetails(order)}
                                                    className="flex items-center justify-center p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-[#05080F] hover:bg-slate-200 transition-all"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                                <ShoppingBag className="w-12 h-12 opacity-20" />
                                                <p className="font-bold">Nenhuma assinatura encontrada.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Control */}
                    {totalPages > 1 && (
                        <div className="p-6 md:p-8 bg-slate-50/30 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Página {currentPage} de {totalPages} — {filteredOrders.length} Assinaturas
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white disabled:opacity-30 transition-all hover:bg-slate-50"
                                >
                                    Anterior
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-[#2980B9] text-white' : 'hover:bg-slate-50 text-slate-400'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white disabled:opacity-30 transition-all hover:bg-slate-50"
                                >
                                    Próximo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {viewingOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#05080F]/80 backdrop-blur-md" onClick={() => { setViewingOrder(null); setOrderItems([]); }}></div>
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        
                        {/* Botão de Fechar X */}
                        <button 
                            onClick={() => { setViewingOrder(null); setOrderItems([]); }} 
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Cabeçalho */}
                        <div className="p-8 pb-4 border-b border-slate-50 flex items-center gap-4 shrink-0">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                <ShoppingBag className="w-6 h-6 text-[#2980B9]" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-0.5 block">Assinatura / Pedido</span>
                                <h3 className="text-xl font-black text-[#05080F]">#{viewingOrder.id.replace(/^#/, '').slice(0, 8)}</h3>
                            </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="p-8 space-y-6 overflow-y-auto flex-grow bg-slate-50/30">
                            {/* Dados do Cliente */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Informações do Cliente</h4>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome</p>
                                            <p className="text-[#05080F]">{viewingOrder.customer_name || 'Não informado'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF</p>
                                            <p className="text-[#05080F]">{viewingOrder.customer_cpf || 'Não informado'}</p>
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</p>
                                            <p className="text-[#05080F] break-all">{viewingOrder.customer_email || 'Não informado'}</p>
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p>
                                            <p className="text-[#05080F]">{viewingOrder.customer_phone || 'Não informado'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Informações de Pagamento */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Detalhes do Pagamento</h4>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</p>
                                            <div className="flex items-center gap-1.5 text-[#05080F] mt-1">
                                                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                                {viewingOrder.payment_method || 'Pix'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</p>
                                            <div className="flex items-center gap-1.5 text-[#05080F] mt-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {new Date(viewingOrder.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Assinatura</p>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-wider mt-1.5 ${
                                                viewingOrder.status === 'Pago' || viewingOrder.status === 'completed' || viewingOrder.status === 'Entregue'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : viewingOrder.status === 'Cancelado' || viewingOrder.status === 'cancelled'
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {viewingOrder.status === 'pending' || viewingOrder.status === 'Pendente' ? 'Pendente' :
                                                 viewingOrder.status === 'completed' || viewingOrder.status === 'Pago' || viewingOrder.status === 'Entregue' ? 'Ativa' : 'Cancelada'}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</p>
                                            <p className="text-base font-black text-[#2980B9] mt-1">R$ {viewingOrder.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Itens do Pedido */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Itens Adquiridos</h4>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    {isLoadingItems ? (
                                        <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs font-bold">
                                            <Loader2 className="w-4 h-4 animate-spin text-[#2980B9]" /> Carregando itens...
                                        </div>
                                    ) : orderItems.length > 0 ? (
                                        <div className="divide-y divide-slate-50">
                                            {orderItems.map((item, idx) => (
                                                <div key={item.id || idx} className="py-3 flex justify-between items-center text-xs font-bold first:pt-0 last:pb-0">
                                                    <div>
                                                        <p className="text-[#05080F]">{item.product_name}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Qtd: {item.quantity}</p>
                                                    </div>
                                                    <p className="text-[#05080F]">R$ {(item.unit_price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs font-bold text-slate-400 text-center py-4">Nenhum item encontrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Rodapé */}
                        <div className="p-8 border-t border-slate-50 shrink-0">
                            <button
                                type="button"
                                onClick={() => { setViewingOrder(null); setOrderItems([]); }}
                                className="w-full py-4 bg-[#05080F] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-[#2980B9] hover:text-[#05080F] transition-all shadow-xl shadow-[#05080F]/10"
                            >
                                FECHAR DETALHES
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminOrders;
