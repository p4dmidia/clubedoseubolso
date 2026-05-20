import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Heart, 
    Users, 
    Activity, 
    Leaf, 
    Wallet, 
    ArrowRight, 
    Check, 
    X, 
    Shield, 
    Clock, 
    AlertCircle,
    CheckCircle2,
    Play,
    Zap,
    DollarSign,
    TrendingDown,
    CreditCard,
    ChevronDown,
    HelpCircle,
    Sparkles,
    FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ORGANIZATION_ID } from '../lib/config';
import { useAuth } from '../components/AuthContext';

const HomePage: React.FC = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState<{ [key: string]: string }>({});
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [planType, setPlanType] = useState<'Individual' | 'Familiar'>('Individual');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: catData } = await supabase
                    .from('product_categories')
                    .select('id, name')
                    .eq('organization_id', ORGANIZATION_ID);
                
                if (catData) {
                    const catMap: { [key: string]: string } = {};
                    catData.forEach(c => {
                        catMap[c.name] = c.id.toString();
                    });
                    setCategories(catMap);
                }

                const { data: plansData } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_categories (name)
                    `)
                    .eq('is_active', true)
                    .order('price', { ascending: true });

                if (plansData) {
                    const plansOnly = plansData.filter((prod: any) => 
                        prod.product_categories?.name === 'Planos' || 
                        prod.variations?.plan_type !== undefined
                    );
                    setPlans(plansOnly);
                }
            } catch (err) {
                console.error('Error loading initial home data:', err);
            }
        };

        fetchInitialData();
    }, []);

    // Helper URLs for service landing pages
    const telemedCategoryUrl = '/service/telemedicina';
    const energiaCategoryUrl = '/service/energia-assinatura';
    const creditoCategoryUrl = '/service/estrategias-credito';

    // FAQ list
    const faqs = [
        {
            q: "O que é o Clube do Seu Bolso?",
            a: "O Clube do Seu Bolso é um Hub de Sobrevivência Financeira que reúne em um único lugar serviços essenciais como Telemedicina 24h, Recuperação de Crédito/Score e Economia de Energia. Nosso foco é proteger sua família, reduzir seus custos fixos mensais e oferecer um motor de renda recorrente através de nosso ecossistema de afiliados."
        },
        {
            q: "Como funciona a Telemedicina no Clube?",
            a: "Com o nosso plano de Telemedicina, você e sua família têm atendimento médico por chamada de vídeo 24h por dia, 7 dias por semana, direto no seu celular. Não há filas, sem carência para o clínico geral, e você ainda conta com consultas agendadas de especialidades médicas e receitas ou atestados digitais válidos em todo o país."
        },
        {
            q: "Preciso instalar placas solares para ter desconto na energia?",
            a: "Não! A nossa tecnologia de energia por assinatura conecta você a usinas de geração de energia limpa (solar e renovável) parceiras. Nós injetamos essa energia diretamente na concessionária da sua região e você obtém um desconto garantido de até 18% na sua conta de luz, de forma 100% digital, sem obras e sem precisar gastar com placas solares."
        },
        {
            q: "O que é a consultoria de Recuperação de Crédito?",
            a: "Realizada em parceria com a GD Finance, oferecemos um diagnóstico detalhado das restrições do seu CPF/CNPJ, assessoria na renegociação amigável de dívidas e orientações para reabilitar e blindar o seu score junto aos órgãos de proteção ao crédito, recuperando seu acesso ao mercado."
        },
        {
            q: "Como funciona o sistema de afiliados (Economize + Ganhe)?",
            a: "O Clube opera sob um modelo onde cada serviço consumido gera pontuações e comissões. Ao se filiar e indicar novos membros ou empresas para economizarem também, você recebe comissões diretas de 10% a 20% sobre cada ativação, além de comissões indiretas pelo crescimento da sua rede de afiliados, sem necessidade de carregar estoque."
        },
        {
            q: "Existe carência ou contrato de fidelidade nos planos?",
            a: "Os planos de Telemedicina e Serviços não possuem fidelidade ou multa rescisória, permitindo o cancelamento a qualquer momento diretamente pela área de membros ou suporte. A liberação das consultas com clínico geral de urgência ocorre em até 24h úteis após a confirmação do pagamento."
        }
    ];

    return (
        <div className="bg-white text-[#181c20] font-sans overflow-x-hidden selection:bg-[#2980B9]/20">
            {/* 2. Hero Section (Dobra 1) */}
            <header className="relative pt-24 md:pt-[140px] pb-20 overflow-hidden bg-white">
                <div className="absolute inset-0 -z-10 opacity-30">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#2980B9]/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#27AE60]/5 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2980B9]/10 text-[#2980B9] rounded-full text-xs font-bold uppercase tracking-wider">
                            <Shield className="w-4 h-4" />
                            <span>Hub de Sobrevivência Financeira</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold text-[#0B1221] leading-[1.15] tracking-tight">
                            Transforme seus gastos mensais em uma <span className="text-[#2980B9]">fonte de renda extra</span> e proteção para sua família.
                        </h1>
                        
                        <p className="text-[#40484f] text-base md:text-lg font-normal leading-relaxed max-w-xl">
                            O Clube do Seu Bolso é o único Hub de Sobrevivência Financeira que une Telemedicina, Recuperação de Crédito e Economia de Energia em um só lugar. Economize no que é essencial e ganhe por indicar.
                        </p>
                        
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link 
                                to="/register?type=affiliate" 
                                className="bg-[#27AE60] hover:bg-[#219653] text-white font-bold text-sm px-8 py-4.5 rounded-xl shadow-lg shadow-[#27AE60]/15 hover:shadow-xl hover:shadow-[#27AE60]/25 transition-all transform hover:-translate-y-0.5 text-center uppercase tracking-wider"
                            >
                                QUERO ME FILIAR AGORA
                            </Link>
                            <a 
                                href="#services" 
                                className="border-2 border-[#2980B9] text-[#2980B9] hover:bg-[#2980B9]/5 font-bold text-sm px-8 py-4.5 rounded-xl transition-all transform hover:-translate-y-0.5 text-center uppercase tracking-wider"
                            >
                                Conhecer Serviços
                            </a>
                        </div>
                    </div>

                    {/* Right side: 2-minute video mockup */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div 
                            onClick={() => setShowVideoModal(true)}
                            className="relative w-full max-w-[500px] aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white cursor-pointer group hover:scale-[1.02] transition-all duration-300"
                        >
                            {/* Background Image of video */}
                            <img 
                                src="/assets/familia_feliz.jpg" 
                                alt="Familia feliz e aliviada financeiramente" 
                                className="w-full h-full object-cover brightness-[0.85] group-hover:brightness-75 transition-all"
                            />
                            
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all duration-300">
                                    {/* Emerald Green Icon ONLY for action trigger */}
                                    <Play className="w-8 h-8 fill-current text-[#27AE60]" />
                                </div>
                                <div className="bg-[#0B1221]/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase border border-white/10">
                                    Assista ao Vídeo (2 min)
                                </div>
                            </div>

                            {/* Decorative Badge */}
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
                                <span>Apresentação Oficial</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 2:14</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 3. A Dor Section (Empatia e Conexão) */}
            <section className="py-24 bg-[#F4F7F6]">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <span className="text-[#2980B9] text-xs font-bold uppercase tracking-[0.25em] block">
                            Realidade Brasileira
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0B1221]">
                            Você sente que trabalha apenas para pagar boletos?
                        </h2>
                        <p className="text-[#40484f] text-base md:text-lg font-normal leading-relaxed">
                            A inflação sobe, as contas de luz não param de crescer, o acesso à saúde está cada vez mais caro e o crédito no mercado sumiu. Nós entendemos. Por isso, criamos um ecossistema onde você deixa de ser apenas um consumidor para se tornar um beneficiário.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Dor 1 - Contas Altas */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-4 hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0B1221]">Contas Incontroláveis</h3>
                            <p className="text-[#40484f] text-sm font-normal leading-relaxed">
                                A fatura de energia e os insumos básicos abocanham a maior parte do orçamento familiar mês após mês.
                            </p>
                        </div>

                        {/* Dor 2 - Crédito Sumido */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-4 hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0B1221]">Crédito Bloqueado</h3>
                            <p className="text-[#40484f] text-sm font-normal leading-relaxed">
                                Nome negativado ou score baixo bloqueiam cartões, financiamentos e qualquer fôlego financeiro no mercado.
                            </p>
                        </div>

                        {/* Dor 3 - Saúde Inacessível */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-4 hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0B1221]">Saúde Inviável</h3>
                            <p className="text-[#40484f] text-sm font-normal leading-relaxed">
                                Planos de saúde tradicionais custam fortunas, restando apenas filas intermináveis e descaso médico.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. A Solução (Apresentação do Hub) */}
            <section className="py-24 bg-white" id="como-funciona">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#2980B9]/5 rounded-[2.5rem] transform rotate-3 scale-95 -z-10"></div>
                            <img 
                                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800" 
                                alt="Controle financeiro, planilhas e calculadoras" 
                                className="rounded-[2.5rem] shadow-xl w-full h-[400px] object-cover"
                            />
                        </div>

                        <div className="space-y-6">
                            <span className="text-[#2980B9] text-xs font-bold uppercase tracking-[0.25em] block">
                                O Conceito
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1221]">
                                O único Hub de Sobrevivência Financeira do país.
                            </h2>
                            <p className="text-[#40484f] text-base md:text-lg font-normal leading-relaxed">
                                Nós estruturamos um conceito inovador de <strong>Sobrevivência Financeira</strong>. Em vez de contratar múltiplos planos isolados que pesam no orçamento, integramos os serviços vitais para qualquer família brasileira em uma única plataforma simples e acessível.
                            </p>
                            
                            <div className="space-y-4 pt-2">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center shrink-0">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0B1221]">Economia Instantânea</h4>
                                        <p className="text-[#40484f] text-sm font-normal">Corte imediato de custos sem alterar seu padrão de vida.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center shrink-0">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0B1221]">Proteção Ativa</h4>
                                        <p className="text-[#40484f] text-sm font-normal">Saúde médica garantida 24 horas por dia sem carência.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center shrink-0">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0B1221]">Monetização Inteligente</h4>
                                        <p className="text-[#40484f] text-sm font-normal">Indique serviços necessários que todo mundo já consome e receba comissões.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Os 3 Pilares (Detalhamento Técnico) */}
            <section className="py-24 bg-[#F4F7F6]" id="servicos">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-bold uppercase tracking-[0.25em] block">
                            Detalhamento Técnico
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0B1221]">
                            Como atuamos nos pilares essenciais
                        </h2>
                        <p className="text-[#40484f] font-normal text-sm md:text-base">
                            Utilizamos soluções digitais inteligentes focadas em fornecer saúde de qualidade, restauração de nome e redução de custos energéticos.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Pilar 1: Saúde (Telemedicina) */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group overflow-hidden">
                            <div>
                                <div className="h-48 overflow-hidden relative">
                                    <img src="/assets/telemedicina_celular.jpg" alt="Saúde Telemedicina" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow text-[#2980B9] flex items-center justify-center">
                                        <Heart className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="p-8 space-y-3">
                                    <h3 className="text-xl font-bold text-[#0B1221]">Saúde (Telemedicina)</h3>
                                    <p className="text-[#40484f] text-sm font-normal leading-relaxed">
                                        Proteção 24h para você e sua família. Consultas online sem filas e com custo reduzido. Cuidado humano na palma da sua mão.
                                    </p>
                                </div>
                            </div>
                            <div className="px-8 pb-8">
                                <Link 
                                    to={telemedCategoryUrl} 
                                    className="text-[#2980B9] font-bold text-xs uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                                >
                                    <span>SAIBA MAIS</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Pilar 2: Crédito (GD Finance) */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group overflow-hidden">
                            <div>
                                <div className="h-48 overflow-hidden relative">
                                    <img src="/assets/restauracao_credito.jpg" alt="Restauração de Crédito" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow text-[#2980B9] flex items-center justify-center">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="p-8 space-y-3">
                                    <h3 className="text-xl font-bold text-[#0B1221]">Crédito (GD Finance)</h3>
                                    <p className="text-[#40484f] text-sm font-normal leading-relaxed">
                                        Limpe seu nome e restaure seu score. Consultoria especializada para você voltar a ter fôlego financeiro e acesso ao mercado.
                                    </p>
                                </div>
                            </div>
                            <div className="px-8 pb-8">
                                <Link 
                                    to={creditoCategoryUrl} 
                                    className="text-[#2980B9] font-bold text-xs uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                                >
                                    <span>VER DETALHES</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Pilar 3: Energia (Economia Real) */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group overflow-hidden">
                            <div>
                                <div className="h-48 overflow-hidden relative">
                                    <img src="/assets/economia_energia.jpg" alt="Economia de Energia" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow text-[#27AE60] flex items-center justify-center">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="p-8 space-y-3">
                                    <h3 className="text-xl font-bold text-[#0B1221]">Energia (Economia Real)</h3>
                                    <p className="text-[#40484f] text-sm font-normal leading-relaxed">
                                        Reduza sua conta de luz em até 18% sem precisar investir em placas solares. Tecnologia e sustentabilidade gerando economia imediata.
                                    </p>
                                </div>
                            </div>
                            <div className="px-8 pb-8">
                                <Link 
                                    to={energiaCategoryUrl} 
                                    className="text-[#27AE60] font-bold text-xs uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                                >
                                    <span>SIMULAR DESCONTO</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Motor de Renda (Ganho Financeiro) */}
            <section className="py-24 bg-white">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        {/* Text and context */}
                        <div className="lg:col-span-7 space-y-6">
                            <span className="text-[#2980B9] text-xs font-bold uppercase tracking-[0.25em] block">
                                Ganho Financeiro
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1221]">
                                Não é apenas economia. É um novo modelo de negócio.
                            </h2>
                            <p className="text-[#40484f] text-base md:text-lg font-normal leading-relaxed">
                                No Clube do Seu Bolso, cada serviço que você usa gera pontos e comissões. Ao indicar amigos para economizarem também, você constrói uma renda recorrente sólida, sem dores de cabeça tradicionais de vendas de mercadorias físicas.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                                    <div className="text-[#27AE60] mb-2"><DollarSign className="w-6 h-6" /></div>
                                    <h4 className="font-bold text-sm text-[#0B1221] mb-1">Indicação Direta</h4>
                                    <p className="text-[#40484f] text-xs font-normal">Ganhe de 10% a 20% sobre cada ativação.</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                                    <div className="text-[#27AE60] mb-2"><Users className="w-6 h-6" /></div>
                                    <h4 className="font-bold text-sm text-[#0B1221] mb-1">Renda Indireta</h4>
                                    <p className="text-[#40484f] text-xs font-normal">Receba sobre o crescimento da sua rede de afiliados.</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                                    <div className="text-[#27AE60] mb-2"><Check className="w-6 h-6" /></div>
                                    <h4 className="font-bold text-sm text-[#0B1221] mb-1">Sem Estoque</h4>
                                    <p className="text-[#40484f] text-xs font-normal">Venda serviços essenciais que todos já consomem.</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual details box */}
                        <div className="lg:col-span-5">
                            <div className="bg-[#0B1221] text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#2980B9]/20 rounded-full blur-2xl"></div>
                                <div className="relative z-10 space-y-6">
                                    <span className="text-[#2980B9] text-xs font-bold uppercase tracking-[0.2em] block">
                                        Benefício Afiliado
                                    </span>
                                    <h3 className="text-xl font-bold text-white">Comece como afiliado parceiro do Clube</h3>
                                    
                                    <ul className="space-y-4 text-slate-300 text-sm">
                                        <li className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-[#27AE60]/20 text-[#27AE60] flex items-center justify-center shrink-0">✔</span>
                                            <span>Taxa de adesão baixa (apenas R$ 44)</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-[#27AE60]/20 text-[#27AE60] flex items-center justify-center shrink-0">✔</span>
                                            <span>Escritório Virtual completo para gestão</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-[#27AE60]/20 text-[#27AE60] flex items-center justify-center shrink-0">✔</span>
                                            <span>Materiais de marketing de alto padrão prontos</span>
                                        </li>
                                    </ul>

                                    <div className="pt-4">
                                        <Link 
                                            to="/register?type=affiliate" 
                                            className="w-full block bg-[#27AE60] hover:bg-[#219653] text-white font-bold text-center py-4 rounded-xl shadow-lg transition-all"
                                        >
                                            QUERO SER AFILIADO
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Planos Section (O Fechamento) */}
            <section className="py-24 bg-[#F4F7F6]" id="planos">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
                        <span className="text-[#2980B9] text-xs font-bold uppercase tracking-[0.25em] block">
                            Nossos Planos
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0B1221]">
                            Escolha o plano ideal para suas necessidades.
                        </h2>
                        <p className="text-[#40484f] text-sm md:text-base font-normal">
                            Planos de saúde e consultoria financeira acessíveis para você ou para toda a sua família.
                        </p>
                    </div>

                    {/* Toggle Selector */}
                    <div className="flex justify-center mb-12">
                        <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 items-center border border-slate-300/30">
                            <button
                                onClick={() => setPlanType('Individual')}
                                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${planType === 'Individual' ? 'bg-[#05080F] text-white shadow-md' : 'text-slate-500 hover:text-[#05080F]'}`}
                            >
                                Planos Individuais
                            </button>
                            <button
                                onClick={() => setPlanType('Familiar')}
                                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${planType === 'Familiar' ? 'bg-[#05080F] text-white shadow-md' : 'text-slate-500 hover:text-[#05080F]'}`}
                            >
                                Planos Familiares
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                        {(() => {
                            const defaultPlans = [
                                {
                                    id: 'd3b07384-d113-4171-bc01-9a7c936df312',
                                    name: 'Plano Individual Essencial',
                                    price: 17.90,
                                    type: 'Individual',
                                    benefits: ['Atendimento Clínico 24h Ilimitado', 'Clube de Benefícios Geral', 'Estratégia de Crédito Inicial'],
                                    adesao: 17.90,
                                    slug: 'individual-essencial',
                                    description: 'O plano básico indispensável para quem busca atendimento médico ágil e direcionamento financeiro inicial.'
                                },
                                {
                                    id: 'd3b07384-d113-4171-bc02-9a7c936df312',
                                    name: 'Plano Individual Premium',
                                    price: 34.90,
                                    type: 'Individual',
                                    benefits: ['Atendimento Clínico 24h Ilimitado', 'Especialidades Médicas por Agendamento', 'Clube de Benefícios VIP', 'Consultoria Financeira Individualizada'],
                                    adesao: 34.90,
                                    slug: 'individual-premium',
                                    description: 'O combo supremo de saúde com especialistas e consultoria financeira VIP individualizada.'
                                },
                                {
                                    id: 'd3b07384-d113-4171-bc03-9a7c936df312',
                                    name: 'Plano Familiar Essencial',
                                    price: 44.90,
                                    type: 'Familiar',
                                    benefits: ['Atendimento Clínico 24h Ilimitado', 'Até 4 dependentes inclusos', 'Clube de Benefícios & Descontos', 'Consultoria Financeira Inicial'],
                                    adesao: 44.90,
                                    slug: 'familiar-essencial',
                                    description: 'A tranquilidade de saber que toda a sua família está protegida por um valor que cabe no seu bolso.'
                                },
                                {
                                    id: 'd3b07384-d113-4171-bc04-9a7c936df312',
                                    name: 'Plano Familiar Premium',
                                    price: 87.90,
                                    type: 'Familiar',
                                    benefits: ['Atendimento Clínico 24h Ilimitado', 'Especialidades Médicas por Agendamento', 'Até 4 dependentes inclusos', 'Economia de Energia por Assinatura', 'Consultoria Financeira Completa'],
                                    adesao: 87.90,
                                    slug: 'familiar-premium',
                                    description: 'A cobertura mais robusta do Clube do Seu Bolso. Saúde, economia de energia doméstica e proteção de vida em um único lugar.'
                                }
                            ];

                            const getPlanBenefits = (name: string, type: string) => {
                                const lower = name.toLowerCase();
                                if (type === 'Familiar' || lower.includes('familiar')) {
                                    if (lower.includes('premium')) {
                                        return [
                                            'Atendimento Clínico 24h Ilimitado',
                                            'Especialidades Médicas por Agendamento',
                                            'Até 4 dependentes inclusos',
                                            'Economia de Energia por Assinatura',
                                            'Consultoria Financeira Completa'
                                        ];
                                    }
                                    return [
                                        'Atendimento Clínico 24h Ilimitado',
                                        'Até 4 dependentes inclusos',
                                        'Clube de Benefícios & Descontos',
                                        'Consultoria Financeira Inicial'
                                    ];
                                } else {
                                    if (lower.includes('premium')) {
                                        return [
                                            'Atendimento Clínico 24h Ilimitado',
                                            'Especialidades Médicas por Agendamento',
                                            'Clube de Benefícios VIP',
                                            'Consultoria Financeira Individualizada'
                                        ];
                                    }
                                    return [
                                        'Atendimento Clínico 24h Ilimitado',
                                        'Clube de Benefícios Geral',
                                        'Estratégia de Crédito Inicial'
                                    ];
                                }
                            };

                            const activePlansList = plans.length > 0
                                ? plans.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    price: p.variations?.mensalidade || p.price || 0,
                                    adesao: p.variations?.adesao || 0,
                                    type: p.variations?.plan_type || 'Individual',
                                    slug: p.variations?.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                    description: p.description || '',
                                    benefits: getPlanBenefits(p.name, p.variations?.plan_type || 'Individual')
                                }))
                                : defaultPlans;

                            const displayedPlans = activePlansList.filter(p => p.type === planType);

                            return displayedPlans.map((plan, idx) => {
                                const isPremium = plan.name.toLowerCase().includes('premium');
                                return (
                                    <div 
                                        key={plan.id || idx}
                                        className={`bg-white rounded-3xl p-8 md:p-10 border-2 ${isPremium ? 'border-[#2980B9] shadow-xl relative' : 'border-slate-100 shadow-md'} flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300`}
                                    >
                                        {isPremium && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2980B9] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                RECOMENDADO
                                            </div>
                                        )}
                                        
                                        <div>
                                            <div className="mb-6 space-y-2">
                                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{plan.type}</span>
                                                <h3 className="text-2xl font-bold text-[#0B1221]">{plan.name}</h3>
                                                <p className="text-[#40484f] text-xs leading-relaxed font-normal min-h-[40px]">
                                                    {plan.description}
                                                </p>
                                                <div className="pt-2 flex flex-col gap-1">
                                                    <div className="flex items-baseline">
                                                        <span className="text-[#40484f] text-sm font-bold">R$</span>
                                                        <span className="text-4xl font-bold text-[#2980B9] ml-1">
                                                            {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(plan.price)}
                                                        </span>
                                                        <span className="text-[#40484f] text-sm font-bold ml-1">/mês</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Adesão: R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(plan.adesao)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-100 pt-6 mb-8">
                                                <ul className="space-y-4 text-sm text-[#40484f]">
                                                    {plan.benefits.map((b: string, bIdx: number) => (
                                                        <li key={bIdx} className="flex items-center gap-3">
                                                            <Check className="w-5 h-5 text-[#2980B9] shrink-0" />
                                                            <span>{b}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Link 
                                                to={user ? `/checkout?buy=${plan.id}` : `/register?type=client&buy=${plan.id}`}
                                                className="w-full block text-center py-4 bg-[#27AE60] hover:bg-[#219653] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-[#27AE60]/10"
                                            >
                                                ASSINAR AGORA
                                            </Link>
                                            <Link 
                                                to={`/plan/${plan.slug}`}
                                                className="w-full block text-center py-2 text-slate-400 hover:text-[#2980B9] font-bold text-xs uppercase tracking-widest transition-all"
                                            >
                                                Ver Detalhes do Plano
                                            </Link>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </section>

            {/* 8. FAQ Section (Quebra de Objeções) */}
            <section className="py-24 bg-white" id="faq">
                <div className="max-w-[800px] mx-auto px-6">
                    <div className="text-center mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-bold uppercase tracking-[0.25em] block">
                            Faq
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0B1221]">
                            Dúvidas Frequentes
                        </h2>
                        <p className="text-[#40484f] font-normal text-sm md:text-base">
                            Respondemos a todas as dúvidas fundamentais para que você decida com total clareza.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-[#F4F7F6] rounded-2xl border border-slate-100 overflow-hidden">
                                <button
                                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                                    className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-100/50 transition-colors"
                                >
                                    <span className="font-bold text-sm md:text-base text-[#0B1221]">{faq.q}</span>
                                    <ChevronDown className={`w-5 h-5 text-[#2980B9] transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                                </button>
                                {activeFaq === idx && (
                                    <div className="p-6 pt-0 text-slate-600 text-xs md:text-sm font-normal leading-relaxed border-t border-slate-100/30 bg-slate-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Modal Explainer */}
            {showVideoModal && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-[800px] aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        {/* Close button */}
                        <button 
                            onClick={() => setShowVideoModal(false)}
                            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        {/* Explainer video iframe */}
                        <iframe 
                            src="https://www.youtube.com/embed/co1iO_4Vp4M?autoplay=1" 
                            title="Clube do Seu Bolso Explainer Video" 
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
