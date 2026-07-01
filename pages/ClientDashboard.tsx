import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { 
  ShoppingBag, 
  CreditCard, 
  FileText, 
  Download, 
  Compass, 
  Activity, 
  ChevronRight, 
  Info, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

const ClientDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'compras' | 'assinaturas' | 'documentos' | 'servicos' | 'pagamentos'>('compras');
  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        setLoadingOrders(true);
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total_amount,
            status,
            payment_method,
            shipping_method,
            order_items:order_items(id, product_id, product_name, unit_price, quantity)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching customer orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    const fetchSubscriptions = async () => {
      if (!user) return;
      try {
        setLoadingSubscriptions(true);
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            payment_method,
            order_items:order_items(
              id,
              product_id,
              product_name,
              unit_price,
              quantity
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const telemedicinePlanIds = [
          'd3b07384-d113-4171-bc01-9a7c936df312', // Individual Essencial
          'd3b07384-d113-4171-bc02-9a7c936df312', // Individual Premium
          'd3b07384-d113-4171-bc03-9a7c936df312', // Familiar Essencial
          'd3b07384-d113-4171-bc04-9a7c936df312', // Familiar Premium
        ];

        const activePlans = (data || []).reduce((acc: any[], order: any) => {
          const telemedItems = (order.order_items || []).filter((item: any) => {
            const nameLower = (item.product_name || '').toLowerCase();
            return (
              telemedicinePlanIds.includes(item.product_id) ||
              nameLower.includes('telemedicina')
            );
          });

          if (telemedItems.length > 0) {
            telemedItems.forEach((item: any) => {
              acc.push({
                id: `${order.id}-${item.id}`,
                orderId: order.id,
                planName: item.product_name,
                price: item.unit_price,
                quantity: item.quantity,
                status: order.status,
                joinedAt: order.created_at,
                paymentMethod: order.payment_method
              });
            });
          }
          return acc;
        }, []);

        setSubscriptions(activePlans);
      } catch (err) {
        console.error('Error fetching customer subscriptions:', err);
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    fetchOrders();
    fetchSubscriptions();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDownloadMock = (docName: string) => {
    const content = `CLUBE DO SEU BOLSO\n\nDocumento: ${docName}\n\nEste documento representa a cópia digitalizada e autenticada do seu ${docName}.\nEmitido para: ${profile?.full_name || 'Cliente'} (${user?.email})\nData de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n\nEm conformidade com as regras do Clube do Seu Bolso e os regulamentos vigentes no Brasil.\n\nCódigo de Autenticação: CSB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Download de "${docName}" iniciado!`);
  };

  return (
    <AffiliateLayout>
      <div className="max-w-4xl mx-auto pb-20">
        
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-black text-[#0B1221]">Área do Cliente</h1>
          <p className="text-slate-500 font-medium font-inter">
            Bem-vindo(a), {profile?.full_name || 'Cliente'}! Gerencie suas compras, planos e serviços.
          </p>
        </header>

        {/* Tab Sub-Navigation */}
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200">
          <button
            onClick={() => setActiveSubTab('compras')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'compras'
                ? 'bg-white text-[#0B1221] shadow-sm'
                : 'text-slate-500 hover:text-[#0B1221]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Compras
          </button>
          <button
            onClick={() => setActiveSubTab('assinaturas')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'assinaturas'
                ? 'bg-white text-[#0B1221] shadow-sm'
                : 'text-slate-500 hover:text-[#0B1221]'
            }`}
          >
            <Activity className="w-4 h-4" />
            Assinaturas
          </button>
          <button
            onClick={() => setActiveSubTab('pagamentos')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'pagamentos'
                ? 'bg-white text-[#0B1221] shadow-sm'
                : 'text-slate-500 hover:text-[#0B1221]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Pagamentos
          </button>
          <button
            onClick={() => setActiveSubTab('servicos')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'servicos'
                ? 'bg-white text-[#0B1221] shadow-sm'
                : 'text-slate-500 hover:text-[#0B1221]'
            }`}
          >
            <Compass className="w-4 h-4" />
            Serviços
          </button>
          <button
            onClick={() => setActiveSubTab('documentos')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'documentos'
                ? 'bg-white text-[#0B1221] shadow-sm'
                : 'text-slate-500 hover:text-[#0B1221]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentos
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* 1. COMPRAS TAB */}
          {activeSubTab === 'compras' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 md:p-10 border-b border-slate-50">
                <h3 className="text-xl font-black text-[#0B1221]">Histórico de Compras e Extrato Financeiro</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                  Pedidos e transações registrados em seu nome
                </p>
              </div>

              {loadingOrders ? (
                <div className="py-20 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#2980B9] mx-auto mb-4"></div>
                  <p className="text-slate-400 font-bold text-xs uppercase">Carregando compras...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 text-left">
                        <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">Pedido / Data</th>
                        <th className="py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Itens Adquiridos</th>
                        <th className="py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Pagamento</th>
                        <th className="py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Valor Total</th>
                        <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders.map((order) => {
                        const statusLower = order.status.toLowerCase();
                        const isPaid = statusLower === 'pago' || statusLower === 'paid' || statusLower === 'completed' || statusLower === 'aprovado';
                        const isPending = statusLower === 'pendente' || statusLower === 'pending' || statusLower === 'aguardando';
                        
                        return (
                          <tr key={order.id} className="group hover:bg-slate-50/30 transition-colors">
                            <td className="py-6 px-8">
                              <span className="font-bold text-[#0B1221] block text-sm">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-1 uppercase">
                                {formatDate(order.created_at)}
                              </span>
                            </td>
                            <td className="py-6 px-4">
                              {order.order_items && order.order_items.length > 0 ? (
                                <div className="space-y-1">
                                  {order.order_items.map((item: any) => (
                                    <div key={item.id} className="text-xs font-semibold text-slate-700">
                                      {item.product_name} <span className="text-slate-400 text-[10px]">x{item.quantity || 1}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Itens não detalhados</span>
                              )}
                            </td>
                            <td className="py-6 px-4">
                              <span className="text-xs font-bold text-slate-700 block">
                                {order.payment_method || 'Mercado Pago'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                                {order.shipping_method || 'Digital'}
                              </span>
                            </td>
                            <td className="py-6 px-4 text-right font-black text-slate-800 text-sm">
                              {formatCurrency(order.total_amount)}
                            </td>
                            <td className="py-6 px-8 text-right">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                isPending ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                'bg-red-50 text-red-600 border border-red-100'
                              }`}>
                                {isPaid ? <CheckCircle2 className="w-3 h-3" /> :
                                 isPending ? <Clock className="w-3 h-3" /> :
                                 <XCircle className="w-3 h-3" />}
                                {isPaid ? 'Pago' : isPending ? 'Pendente' : 'Cancelado'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500 mb-2">Você ainda não realizou compras.</p>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto mb-6">
                    Aproveite as condições de membro e adquira serviços e produtos em nossa loja.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[#0B1221] hover:bg-[#2980B9] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Ir para a Loja
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. ASSINATURAS TAB */}
          {activeSubTab === 'assinaturas' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 md:p-10 border-b border-slate-50">
                <h3 className="text-xl font-black text-[#0B1221]">Gestão de Assinaturas e Planos</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                  Planos e assinaturas ativas vinculadas à sua conta
                </p>
              </div>

              {loadingSubscriptions ? (
                <div className="py-20 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#2980B9] mx-auto mb-4"></div>
                  <p className="text-slate-400 font-bold text-xs uppercase">Carregando assinaturas...</p>
                </div>
              ) : subscriptions.length > 0 ? (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subscriptions.map((sub) => {
                    const statusLower = (sub.status || '').toLowerCase();
                    const isActive = statusLower === 'pago' || statusLower === 'paid' || statusLower === 'completed' || statusLower === 'aprovado';
                    const isPending = statusLower === 'pendente' || statusLower === 'pending' || statusLower === 'aguardando';

                    return (
                      <div key={sub.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-[#2980B9]/5 rounded-full -mr-5 -mt-5 transition-transform group-hover:scale-110"></div>
                        
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                              Plano de Telemedicina
                            </span>
                            <h4 className="text-base font-black text-[#0B1221] mt-2">
                              {sub.planName}
                            </h4>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            isPending ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {isActive ? 'Ativo' : isPending ? 'Pendente' : 'Cancelado'}
                          </span>
                        </div>

                        <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Valor do Plano:</span>
                            <span className="font-black text-[#0B1221]">
                              {formatCurrency(sub.price)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Data de Início:</span>
                            <span className="font-black text-slate-700">{formatDate(sub.joinedAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Meio de Pagamento:</span>
                            <span className="font-black text-slate-700 capitalize">{sub.paymentMethod || 'Não informado'}</span>
                          </div>
                        </div>

                        {isActive && (
                          <div className="mt-6 flex flex-col gap-2">
                            <a
                              href="https://app.maisunidos.com.br/Conta/Entrar"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-[#0B1221] hover:bg-[#2980B9] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center"
                            >
                              Acessar Telemedicina
                              <ExternalLink className="w-4 h-4 text-white" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Activity className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500 mb-2">Sem assinaturas ativas.</p>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto mb-6">
                    Você ainda não possui nenhuma assinatura ativa ou plano recorrente contratado.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[#0B1221] hover:bg-[#2980B9] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Ver Assinaturas Disponíveis
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. PAGAMENTOS TAB */}
          {activeSubTab === 'pagamentos' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-10">
              <h3 className="text-xl font-black text-[#0B1221] mb-2">Gestão de Meios de Pagamento</h3>
              <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
                Toda a transacionalidade do Clube do Seu Bolso é conduzida através de métodos blindados, garantindo a sua confidencialidade de dados.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-4 shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-[#0B1221] mb-2">Processamento de Cartões</h4>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">
                    Não armazenamos dados críticos do seu cartão de crédito (como número ou código CVV) em nossos servidores.
                    Os pagamentos são intermediados por gateways autorizados de altíssimo nível (Mercado Pago), cumprindo o padrão internacional PCI-DSS.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-[#0B1221] mb-2">Pix e Boletos</h4>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">
                    As compras e renovações geradas via Pix ou boleto possuem confirmação automática via webhook do gateway,
                    liberando sua cota, saldo ou benefícios imediatamente após o pagamento.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 items-start">
                <div className="p-2 bg-white rounded-xl text-amber-600 shadow-sm shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-[#0B1221] text-xs uppercase tracking-wider mb-1">Como atualizar seu cartão ou meio principal?</h4>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                    Para trocar seu cartão de crédito cadastrado ou escolher outro meio de pagamento, basta prosseguir com a renovação da sua mensalidade ou compra de um produto na loja. No momento da finalização do pedido, você terá a opção de inserir novos dados de faturamento com total segurança.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. SERVICOS TAB */}
          {activeSubTab === 'servicos' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-10">
              <h3 className="text-xl font-black text-[#0B1221] mb-2">Acesso aos Serviços do Clube</h3>
              <p className="text-slate-500 font-medium text-sm mb-8">
                Explore os serviços e benefícios integrados disponíveis para o seu perfil.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Servico 1 */}
                <div className="border border-slate-100 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all bg-slate-50/50">
                  <div>
                    <h4 className="text-base font-black text-[#0B1221] mb-2">Loja Oficial</h4>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-4">Membro do Clube</p>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6">
                      Acesse a loja e usufrua de cupons e vantagens especiais para membros na aquisição de planos.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-[#0B1221] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#2980B9] transition-all"
                  >
                    Acessar Loja
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Servico 2 */}
                <div className="border border-slate-100 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all bg-slate-50/50">
                  <div>
                    <h4 className="text-base font-black text-[#0B1221] mb-2">Suporte e Dúvidas</h4>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-4">Ajuda ao Cliente</p>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6">
                      Tem alguma dúvida sobre suas mensalidades, assinaturas ou regulamentos? Chame nosso suporte.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/5541996285667"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border border-slate-200 text-[#0B1221] py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-center"
                  >
                    WhatsApp
                    <ExternalLink className="w-4 h-4 text-[#2980B9]" />
                  </a>
                </div>

                {/* Servico 3 */}
                {profile?.role === 'client' && (
                  <div className="border border-slate-100 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all bg-[#0B1221] text-white">
                    <div>
                      <h4 className="text-base font-black mb-2 text-white">Quero Indicar</h4>
                      <p className="text-[#2980B9] text-[10px] font-bold uppercase tracking-wider mb-4">Programa de Afiliados</p>
                      <p className="text-slate-300 text-xs leading-relaxed mb-6">
                        Deseja rentabilizar sua rede indicando novos parceiros e ganhando comissões? Mude para Afiliado.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/plan/afiliado')}
                      className="w-full bg-[#2980B9] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#ffc947] hover:text-[#0B1221] transition-all"
                    >
                      Seja um Afiliado
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. DOCUMENTOS TAB */}
          {activeSubTab === 'documentos' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-10">
              <h3 className="text-xl font-black text-[#0B1221] mb-2">Download de Documentos e Contratos</h3>
              <p className="text-slate-500 font-medium text-sm mb-8">
                Baixe cópias digitais autenticadas de contratos e termos de adesão do Clube.
              </p>

              <div className="divide-y divide-slate-100">
                {/* Documento 1 */}
                <div className="py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#2980B9] transition-colors border border-slate-100 shadow-sm shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0B1221]">Contrato de Adesão ao Clube do Seu Bolso</h4>
                      <p className="text-slate-400 text-xs font-medium mt-1">Regras de fidelização, prazos e direitos gerais do usuário</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadMock('Contrato de Adesão ao Clube do Seu Bolso')}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-50 border border-slate-100 hover:bg-[#2980B9] hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Baixar (142 KB)
                  </button>
                </div>


                {/* Documento 3 */}
                <div className="py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#2980B9] transition-colors border border-slate-100 shadow-sm shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0B1221]">Termos de Uso e Política de Privacidade (LGPD)</h4>
                      <p className="text-slate-400 text-xs font-medium mt-1">Conformidade legal sobre tratamento e exclusão de dados pessoais</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadMock('Termos de Uso e Política de Privacidade (LGPD)')}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-50 border border-slate-100 hover:bg-[#2980B9] hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Baixar (76 KB)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </AffiliateLayout>
  );
};

export default ClientDashboard;
