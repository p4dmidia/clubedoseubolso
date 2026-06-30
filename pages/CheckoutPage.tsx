
import React, { useState } from 'react';
import {
    ShieldCheck,
    ShoppingCart,
    CreditCard,
    Truck,
    Lock,
    CheckCircle2,
    AlertCircle,
    FileText,
    ArrowRight,
    ChevronLeft,
    Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/AuthContext';
import { ORGANIZATION_ID } from '../lib/config';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { cart, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user } = useAuth();
    const [acceptedConsorcio, setAcceptedConsorcio] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix'>('credit');
    const [isLoading, setIsLoading] = useState(false);
    const [pixData, setPixData] = useState<any>(null);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        address: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
    });

    const [isEditingProfile, setIsEditingProfile] = useState(true);

    React.useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                try {
                    const { data, error } = await supabase
                        .from('affiliates')
                        .select('full_name, email, whatsapp, cpf, cnpj, address, cep, street, number, complement, neighborhood, city, state')
                        .eq('user_id', user.id)
                        .single();

                    if (data) {
                        setCustomerInfo({
                            name: data.full_name || user.user_metadata?.full_name || user.user_metadata?.nome || '',
                            email: data.email || user.email || '',
                            phone: data.whatsapp || '',
                            cpf: data.cpf || data.cnpj || '',
                            address: data.address || '',
                            cep: data.cep || '',
                            street: data.street || '',
                            number: data.number || '',
                            complement: data.complement || '',
                            neighborhood: data.neighborhood || '',
                            city: data.city || '',
                            state: data.state || ''
                        });
                        // If we have at least name and email, consider it identified
                        if (data.full_name || data.email) {
                            setIsEditingProfile(false);
                        }
                    }
                } catch (error) {
                    console.error('Error auto-filling profile:', error);
                }
            };
            fetchProfile();
        }

        // Handle direct buy link
        const params = new URLSearchParams(window.location.search);
        const buyId = params.get('buy');
        const varsEncoded = params.get('vars');

        if (buyId) {
            const processDirectBuy = async () => {
                try {
                    // Fallback local products (specifically subscription plans)
                    const localPlans: { [key: string]: any } = {
                        'd3b07384-d113-4171-bc01-9a7c936df312': {
                            id: 'd3b07384-d113-4171-bc01-9a7c936df312',
                            name: 'Telemedicina Individual Essencial',
                            price: 17.90,
                            description: 'Plano de telemedicina individual essencial',
                            category: 'Telemedicina',
                            image_url: 'https://placehold.co/600x600?text=Telemedicina+Essencial',
                            stock_quantity: 999
                        },
                        'd3b07384-d113-4171-bc02-9a7c936df312': {
                            id: 'd3b07384-d113-4171-bc02-9a7c936df312',
                            name: 'Telemedicina Individual Premium',
                            price: 34.90,
                            description: 'Plano de telemedicina individual premium',
                            category: 'Telemedicina',
                            image_url: 'https://placehold.co/600x600?text=Telemedicina+Premium',
                            stock_quantity: 999
                        },
                        'd3b07384-d113-4171-bc03-9a7c936df312': {
                            id: 'd3b07384-d113-4171-bc03-9a7c936df312',
                            name: 'Telemedicina Familiar Essencial',
                            price: 44.90,
                            description: 'Plano de telemedicina familiar essencial',
                            category: 'Telemedicina',
                            image_url: 'https://placehold.co/600x600?text=Familiar+Essencial',
                            stock_quantity: 999
                        },
                        'd3b07384-d113-4171-bc04-9a7c936df312': {
                            id: 'd3b07384-d113-4171-bc04-9a7c936df312',
                            name: 'Telemedicina Familiar Premium',
                            price: 87.90,
                            description: 'Plano de telemedicina familiar premium',
                            category: 'Telemedicina',
                            image_url: 'https://placehold.co/600x600?text=Familiar+Premium',
                            stock_quantity: 999
                        },
                        'd3b07384-d113-4171-bc05-9a7c936df312': {
                            id: 'd3b07384-d113-4171-bc05-9a7c936df312',
                            name: 'Adesão Escritório Virtual',
                            price: 44.00,
                            description: 'Taxa de ativação do Escritório Virtual do Afiliado',
                            category: 'Sistema',
                            image_url: 'https://placehold.co/600x600?text=Adesao+EVA',
                            stock_quantity: 999
                        },
                        'd3b07384-d113-4171-bc06-9a7c936df312': {
                            id: 'd3b07384-d113-4171-bc06-9a7c936df312',
                            name: 'Manutenção Mensal EVA',
                            price: 17.00,
                            description: 'Taxa de manutenção mensal do Escritório Virtual do Afiliado',
                            category: 'Sistema',
                            image_url: 'https://placehold.co/600x600?text=Manutencao+EVA',
                            stock_quantity: 999
                        }
                    };

                    let product = localPlans[buyId];

                    if (!product) {
                        const { data: dbProduct, error } = await supabase
                            .from('products')
                            .select('*')
                            .eq('id', buyId)
                            .single();
                        
                        if (error || !dbProduct) return;
                        product = dbProduct;
                    }

                    let selectedVars = {};
                    if (varsEncoded) {
                        try {
                            // Decode from base64
                            selectedVars = JSON.parse(atob(varsEncoded));
                        } catch (e) {
                            console.error("Error parsing variations", e);
                        }
                    }

                    // Pre-fill fields needed for addToCart if they are different in DB vs CartItem
                    const images = (product.image_url || product.image || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                    const formattedProduct = {
                        ...product,
                        image: images[0] || 'https://placehold.co/600x600?text=Classe+A'
                    };

                    addToCart(formattedProduct, selectedVars);
                    
                    // Clear params from URL to prevent re-adding on refresh
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, '', newUrl);
                    
                    toast.success(`${product.name} adicionado para compra rápida!`, { icon: '🛒' });
                } catch (e) {
                    console.error('Error processing direct buy:', e);
                }
            };
            processDirectBuy();
        }
    }, [user]);

    const isConsorcioInCart = cart.some(item => item.category === 'Consórcio' || item.name.includes('CONSÓRCIO'));
    const subtotal = cartTotal;
    const shipping = 0;
    const total = subtotal + shipping;

    const handleConfirmOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.cpf) {
            toast.error('Por favor, preencha seus dados básicos e o CPF.');
            return;
        }

        // Full address validation is disabled because only digital subscriptions are sold



        const isConsorcioInCart = cart.some(item => item.category === 'Consórcio' || item.name.includes('CONSÓRCIO'));
        if (isConsorcioInCart && !acceptedConsorcio) {
            toast.error('Para prosseguir com a compra de Consórcio, você deve aceitar os termos de adesão.');
            return;
        }

        setIsLoading(true);
        let createdOrderId: string | null = null;

        try {
            // 1. Create order in Supabase
            const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            createdOrderId = orderId;
            const referralCode = Cookies.get('classea_ref');
            
                const fullAddressString = 'Assinatura Digital';

                const { error: orderError } = await supabase
                    .from('orders')
                    .insert([{
                        id: orderId,
                        organization_id: ORGANIZATION_ID,
                        user_id: user?.id,
                        referral_code: referralCode,
                        customer_name: customerInfo.name,
                        customer_email: customerInfo.email,
                        customer_phone: customerInfo.phone,
                        customer_cpf: customerInfo.cpf,
                        shipping_address: fullAddressString,
                        total_amount: total,
                        shipping_cost: shipping,
                        shipping_method: cart.every(item => item.category === 'Consórcio' || item.name.includes('CONSÓRCIO')) ? 'Isento - Digital' : 'Não informado',
                        status: 'Pendente',
                        payment_method: paymentMethod === 'credit' ? 'Cartão de Crédito' : 'Pix'
                    }]);

                if (orderError) throw orderError;

                // 1.5 Update user profile if logged in
                if (user) {
                    await supabase
                        .from('user_profiles')
                        .update({
                            full_name: customerInfo.name,
                            whatsapp: customerInfo.phone,
                            cpf: customerInfo.cpf
                        })
                        .eq('id', user.id);
                }

            // 2. Add items
            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(cart.map(item => ({
                    order_id: orderId,
                    organization_id: ORGANIZATION_ID,
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price
                })));

            if (itemsError) throw itemsError;

            // 3. Process Payment via Edge Function
            console.log('Invoking process-payment with:', { orderId, paymentMethod });
            const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('process-payment', {
                body: { orderId, paymentMethod, customerCpf: customerInfo.cpf, origin: window.location.origin }
            });

            if (paymentError) {
                console.error('Edge Function Error Details:', paymentError);
                console.error('Order ID:', orderId);
                
                let detailedMessage = '';
                
                // Tenta extrair a mensagem do corpo da resposta (data)
                if ((paymentError as any).context?.data) {
                    const errorData = (paymentError as any).context.data;
                    detailedMessage = errorData.error || errorData.message || (typeof errorData === 'string' ? errorData : '');
                }
                
                if (!detailedMessage && paymentError.message) {
                    detailedMessage = paymentError.message;
                }
                
                throw new Error(detailedMessage || 'Erro ao processar pagamento via Asaas.');
            }

            // Tratamento para nova estratégia de retorno 200 com erro no corpo
            if (paymentResult && paymentResult.error) {
                throw new Error(paymentResult.message || 'Erro ao processar pagamento.');
            }

            if (paymentMethod === 'pix') {
                if (!paymentResult.ticket_url) {
                    throw new Error('Erro ao gerar link do PIX. Tente novamente.');
                }
                
                clearCart();
                // Redirecionamento direto para a página de finalização do Mercado Pago (Ticket PIX)
                window.location.href = paymentResult.ticket_url;
                toast.success('Redirecionando para o pagamento...');
            } else {
                // Checkout Pro Redirect
                if (!paymentResult.init_point) {
                    throw new Error('Link de pagamento não gerado. Verifique os dados do cartão.');
                }
                clearCart();
                window.location.href = paymentResult.init_point;
            }

        } catch (error: any) {
            console.error('Checkout error:', error);
            if (createdOrderId) {
                try {
                    await supabase.from('order_items').delete().eq('order_id', createdOrderId);
                    await supabase.from('orders').delete().eq('id', createdOrderId);
                    console.log(`Cleaned up failed order ${createdOrderId}`);
                } catch (cleanupErr) {
                    console.error('Error cleaning up failed order:', cleanupErr);
                }
            }
            toast.error('Erro ao processar pedido: ' + (error.message || 'Tente novamente.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans pb-32">
            {/* Simple Header */}
            <header className="bg-white border-b border-slate-100 py-6">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-[#0B1221] transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        VOLTAR PARA HOME
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Checkout Seguro</p>
                            <p className="text-sm font-black text-[#0B1221]">CLUBE DO SEU BOLSO PLATINUM</p>
                        </div>
                        <ShieldCheck className="w-8 h-8 text-[#2980B9]" />
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">

                    {/* Left: Cart & Info */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Cart Summary */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-[#0B1221] mb-8 flex items-center gap-3">
                                <ShoppingCart className="w-6 h-6 text-[#2980B9]" />
                                Seu Carrinho
                            </h3>
                            <div className="space-y-6">
                                {cart.length > 0 ? cart.map((item, idx) => (
                                    <div key={`${item.id}-${JSON.stringify(item.selectedVariations)}`} className="flex justify-between items-center border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center text-slate-300">
                                                {(item.image || (item as any).display_image || (item as any).image_url) ? (
                                                    <img 
                                                        src={(item.image || (item as any).display_image || (item as any).image_url).split(',')[0].trim()} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <ShoppingCart className="w-8 h-8" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#0B1221] leading-tight line-clamp-1">{item.name}</h4>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{item.category}</p>
                                                {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                                                    <p className="text-[10px] font-bold text-[#2980B9] uppercase tracking-widest mt-1">
                                                        {Object.entries(item.selectedVariations).map(([key, val]) => {
                                                            const labelMap: any = { sizes: 'Tam', colors: 'Cor', numbering: 'Num', soles: 'Solado', tips: 'Bico' };
                                                            return `${labelMap[key] || key}: ${val}`;
                                                        }).join(' • ')}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-3">
                                                    <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.selectedVariations)}
                                                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-[#0B1221] transition-colors font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-black text-[#0B1221]">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariations)}
                                                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-[#0B1221] transition-colors font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.id, item.selectedVariations)}
                                                        className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-[#0B1221]">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-400 font-bold">Seu carrinho está vazio.</p>
                                        <Link to="/" className="text-[#2980B9] font-black text-xs uppercase mt-4 inline-block tracking-widest">Ir para a home</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-[#0B1221] flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-[#2980B9]" />
                                    Dados de Cadastro
                                </h3>
                                {user && !isEditingProfile && (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="text-[10px] font-black text-[#2980B9] uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-xl hover:bg-amber-100 transition-all"
                                    >
                                        Alterar Dados
                                    </button>
                                )}
                            </div>

                            {user && !isEditingProfile ? (
                                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#2980B9] border border-slate-100 shadow-sm">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Identificamos sua conta</p>
                                            <p className="text-lg font-black text-[#0B1221]">{customerInfo.name}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF / CNPJ</p>
                                            <p className="text-sm font-bold text-[#0B1221]">{customerInfo.cpf || 'Não informado'}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contato</p>
                                            <p className="text-sm font-bold text-[#0B1221]">{customerInfo.phone || customerInfo.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                            placeholder="Seu nome"
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail</label>
                                        <input
                                            type="email"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                            placeholder="seu@email.com"
                                            value={customerInfo.email}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Telefone / WhatsApp</label>
                                        <input
                                            type="tel"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                            placeholder="(00) 00000-0000"
                                            value={customerInfo.phone}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">CPF / CNPJ</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2980B9]"
                                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                            value={customerInfo.cpf}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, cpf: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Selection */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-[#0B1221] mb-8 flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-[#2980B9]" />
                                Pagamento
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPaymentMethod('credit')}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'credit' ? 'border-[#2980B9] bg-amber-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <CreditCard className={`w-8 h-8 ${paymentMethod === 'credit' ? 'text-[#2980B9]' : 'text-slate-300'}`} />
                                    <span className="text-xs font-black uppercase tracking-widest">Cartão de Crédito</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('pix')}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'pix' ? 'border-[#2980B9] bg-amber-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center font-black rounded-lg ${paymentMethod === 'pix' ? 'bg-[#2980B9] text-[#0B1221]' : 'bg-slate-100 text-slate-300'}`}>PIX</div>
                                    <span className="text-xs font-black uppercase tracking-widest">Pix</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary & Rules */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Totals */}
                        <div className="bg-[#0B1221] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-[#0B1221]/20 relative overflow-hidden">
                            <h3 className="text-xl font-black mb-8">Resumo do Pedido</h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-slate-400 text-sm font-medium">
                                    <span>Subtotal</span>
                                    <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                    <span className="font-black">TOTAL</span>
                                    <span className="text-2xl font-black text-[#2980B9]">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* CONSORCIO SPECIFIC RULE */}
                            {isConsorcioInCart && (
                                <div className="bg-white/5 border border-[#2980B9]/30 rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-[#2980B9] rounded-xl text-[#0B1221]">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-[#2980B9]">Regras do Consórcio</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                                Este pedido contém cota de consórcio. <Link to="/consorcio/termos" target="_blank" className="text-[#2980B9] hover:underline">Clique aqui para ler os termos</Link> e aceite abaixo para finalizar.
                                            </p>
                                        </div>
                                    </div>

                                    <label className="flex items-start gap-4 cursor-pointer group mt-4">
                                        <div
                                            onClick={() => setAcceptedConsorcio(!acceptedConsorcio)}
                                            className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${acceptedConsorcio ? 'bg-[#2980B9] border-[#2980B9]' : 'border-white/20'}`}
                                        >
                                            {acceptedConsorcio && <CheckCircle2 className="w-4 h-4 text-[#0B1221]" />}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest leading-relaxed">
                                            Declaro estar ciente das normas de contemplação por sorteio ou lance e aceito os termos do contrato de adesão.
                                        </span>
                                    </label>
                                </div>
                            )}

                            <button
                                onClick={handleConfirmOrder}
                                disabled={isLoading || (paymentMethod === 'pix' && pixData)}
                                className="w-full mt-10 py-5 bg-[#2980B9] text-[#0B1221] rounded-2xl font-black text-sm shadow-xl shadow-[#2980B9]/10 hover:shadow-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        PROCESSANDO...
                                    </>
                                ) : paymentMethod === 'pix' && pixData ? (
                                    'PAGAMENTO PENDENTE'
                                ) : (
                                    <>
                                        FINALIZAR PAGAMENTO
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Security Badges */}
                        <div className="flex flex-col gap-4 px-4">
                            <div className="flex items-center gap-3 text-slate-400">
                                <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Pagamento Criptografado</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400">
                                <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Garantia Clube do Seu Bolso</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
