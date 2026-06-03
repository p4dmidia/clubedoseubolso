import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    User,
    Mail,
    Phone,
    MapPin,
    Star,
    Award,
    TrendingUp,
    ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ORGANIZATION_ID } from '../lib/config';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [categories, setCategories] = useState<{ [key: string]: string }>({});
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    
    // Lead Form State
    const [leadForm, setLeadForm] = useState({
        name: '',
        whatsapp: '',
        email: '',
        cityState: ''
    });

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

    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setLeadForm(prev => ({
            ...prev,
            whatsapp: formatPhone(value)
        }));
    };

    const handleLeadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadForm.name || !leadForm.email || !leadForm.whatsapp) {
            toast.error('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        toast.success('Dados salvos! Redirecionando para o cadastro...');
        
        // Pass lead parameters to Register page
        const queryParams = new URLSearchParams({
            type: 'affiliate',
            name: leadForm.name,
            email: leadForm.email,
            whatsapp: leadForm.whatsapp,
            cityState: leadForm.cityState
        }).toString();

        setTimeout(() => {
            navigate(`/register?${queryParams}`);
        }, 1500);
    };

    // FAQ list - New copywriting
    const faqs = [
        {
            q: "Preciso contratar um plano para me tornar afiliado?",
            a: "Não. O Clube do Seu Bolso também oferece a possibilidade de entrada como afiliado, permitindo que a pessoa conheça a proposta e atue com indicações conforme o modelo da plataforma."
        },
        {
            q: "Existe custo para atuar como afiliado?",
            a: "A inscrição é totalmente gratuita e sem taxas mensais de manutenção. No entanto, para começar a indicar e receber suas comissões, é obrigatório cadastrar-se na plataforma Asaas e preencher a sua Chave de Acesso no painel do afiliado."
        },
        {
            q: "Como funciona o ganho por indicação?",
            a: "O afiliado pode receber comissões recorrentes a partir de indicações elegíveis, de acordo com a estrutura e as regras comerciais da plataforma."
        },
        {
            q: "É necessário vender produtos físicos?",
            a: "Não. O modelo é baseado na divulgação de soluções e serviços com aplicação prática no dia a dia das pessoas, sem a necessidade de gerenciar estoques."
        },
        {
            q: "O Clube do Seu Bolso serve apenas para quem quer indicar?",
            a: "Não. A proposta do clube também está conectada a benefícios reais nas áreas de saúde (telemedicina), economia (energia por assinatura) e recuperação financeira."
        },
        {
            q: "Por que essa proposta tem boa aceitação?",
            a: "Porque reúne soluções relacionadas a necessidades permanentes da population: cuidar da saúde, aliviar o orçamento doméstico e buscar novas fontes de renda extra."
        },
        {
            q: "Posso começar de forma simples?",
            a: "Sim. O cadastro de afiliado é gratuito e sem taxas mensais de manutenção, permitindo que você inicie de forma simples, segura e receba direto em sua conta Asaas."
        }
    ];

    const medicalSpecialties = [
        "Clínico geral (24h)", "Cardiologia", "Cirurgia geral", "Cancerologia", 
        "Dermatologia", "Endocrinologia", "Fisioterapia", "Gastroenterologia", 
        "Geriatria", "Ginecologia", "Neurologia", "Nutrição", 
        "Ortopedia", "Pediatria", "Psicologia", "Psiquiatria", "Oncologia"
    ];

    // Default plans definitions with value anchoring & details from copy
    const defaultPlans = [
        {
            id: 'd3b07384-d113-4171-bc01-9a7c936df312',
            name: 'Plano Individual Essencial',
            price: 17.90,
            type: 'Individual',
            benefits: [
                'Atendimento Clínico Geral 24h online ilimitado',
                'Sem carência para atendimento de emergência',
                'Receitas e atestados digitais nacionais',
                'Acesso ao clube de benefícios e descontos'
            ],
            equivalentVal: 49.90,
            adesao: 17.90,
            slug: 'individual-essencial',
            description: 'O plano básico essencial para quem busca atendimento clínico geral ágil e de alta qualidade na palma da mão.'
        },
        {
            id: 'd3b07384-d113-4171-bc02-9a7c936df312',
            name: 'Plano Individual Premium',
            price: 34.90,
            type: 'Individual',
            benefits: [
                'Atendimento Clínico Geral 24h ilimitado',
                'Agendamento para 17 Especialidades Médicas',
                'Consultas completas por chamada de vídeo',
                'Acesso total ao Clube de Benefícios VIP'
            ],
            equivalentVal: 99.90,
            adesao: 34.90,
            slug: 'individual-premium',
            description: 'Cobertura individual premium de saúde com consultas gerais e agendamentos de especialistas.'
        },
        {
            id: 'd3b07384-d113-4171-bc03-9a7c936df312',
            name: 'Plano Familiar Essencial',
            price: 44.90,
            type: 'Familiar',
            benefits: [
                '01 titular + 05 dependentes de livre escolha',
                'Sem necessidade de comprovar parentesco',
                'Atendimento Clínico Geral 24h ilimitado',
                'Acesso geral ao Clube de Benefícios'
            ],
            equivalentVal: 149.90,
            adesao: 44.90,
            slug: 'familiar-essencial',
            description: 'A tranquilidade de saber que toda a sua família está protegida com atendimento médico de emergência 24h.'
        },
        {
            id: 'd3b07384-d113-4171-bc04-9a7c936df312',
            name: 'Plano Familiar Premium',
            price: 87.90,
            type: 'Familiar',
            benefits: [
                '01 titular + 05 dependentes de livre escolha',
                'Sem necessidade de comprovar parentesco',
                'Atendimento Clínico Geral 24h + 17 Especialidades Médicas',
                'Consultoria e Assessoria Financeira Premium'
            ],
            equivalentVal: 299.90,
            adesao: 87.90,
            slug: 'familiar-premium',
            description: 'A proteção de saúde e financeira mais robusta e completa para você e as pessoas que você ama.'
        }
    ];

    const getPlanBenefits = (name: string, type: string) => {
        const lower = name.toLowerCase();
        if (type === 'Familiar' || lower.includes('familiar')) {
            if (lower.includes('premium')) {
                return [
                    '01 titular + 05 dependentes de livre escolha',
                    'Sem necessidade de comprovar parentesco',
                    'Atendimento Clínico Geral 24h + 17 Especialidades Médicas',
                    'Consultoria e Assessoria Financeira Premium'
                ];
            }
            return [
                '01 titular + 05 dependentes de livre escolha',
                'Sem necessidade de comprovar parentesco',
                'Atendimento Clínico Geral 24h ilimitado',
                'Acesso geral ao Clube de Benefícios'
            ];
        } else {
            if (lower.includes('premium')) {
                return [
                    'Atendimento Clínico Geral 24h ilimitado',
                    'Agendamento para 17 Especialidades Médicas',
                    'Consultas completas por chamada de vídeo',
                    'Acesso total ao Clube de Benefícios VIP'
                ];
            }
            return [
                'Atendimento Clínico Geral 24h online ilimitado',
                'Sem carência para atendimento de emergência',
                'Receitas e atestados digitais nacionais',
                'Acesso ao clube de benefícios e descontos'
            ];
        }
    };

    const activePlansList = plans.length > 0
        ? plans.map(p => {
            const type = p.variations?.plan_type || (p.name.toLowerCase().includes('familiar') ? 'Familiar' : 'Individual');
            const isPremium = p.name.toLowerCase().includes('premium');
            let eqVal = 49.90;
            if (type === 'Individual' && isPremium) eqVal = 99.90;
            if (type === 'Familiar' && !isPremium) eqVal = 149.90;
            if (type === 'Familiar' && isPremium) eqVal = 299.90;

            return {
                id: p.id,
                name: p.name,
                price: p.variations?.mensalidade || p.price || 0,
                adesao: p.variations?.adesao || 0,
                type: type,
                slug: p.variations?.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description: p.description || '',
                equivalentVal: eqVal,
                benefits: getPlanBenefits(p.name, type)
            };
        })
        : defaultPlans;

    return (
        <div className="bg-white text-slate-800 font-sans overflow-x-hidden selection:bg-[#2980B9]/20">
            
            {/* BLOCO 1 — HERO PRINCIPAL */}
            <header className="relative pt-12 md:pt-20 pb-16 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
                <div className="absolute inset-0 -z-10 opacity-40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2980B9]/15 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[#27AE60]/8 rounded-full blur-[90px]"></div>
                </div>

                <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="space-y-6 lg:col-span-7">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2980B9]/10 text-[#2980B9] rounded-full text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Utilidade Real & Renda Extra</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl lg:text-[48px] font-black text-[#0B1221] leading-[1.15] tracking-tight">
                            Transforme economia do dia a dia em <span className="text-[#2980B9]">proteção para sua família</span> e oportunidade de renda.
                        </h1>
                        
                        <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed max-w-xl">
                            O Clube do Seu Bolso reúne telemedicina ambulatorial básica (consultas com clínico geral 24 horas, e ainda consultas agendadas com outras especialidades médicas), economia na conta de energia e soluções de recuperação de crédito em uma única plataforma. 
                            <span className="block mt-2 font-semibold text-slate-700">
                                E mais: você também pode se tornar afiliado, fazer indicações e receber comissões recorrentes por um modelo baseado em serviços que fazem sentido para a vida real das pessoas.
                            </span>
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-700 pt-2">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center text-[10px]">✓</span>
                                <span>Saúde básica acessível</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#27AE60]/10 text-[#27AE60] flex items-center justify-center text-[10px]">✓</span>
                                <span>Economia em despesas essenciais</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center text-[10px]">✓</span>
                                <span>Oportunidade real de renda</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link 
                                to="/register?type=affiliate" 
                                className="bg-[#27AE60] hover:bg-[#219653] text-white font-black text-xs px-8 py-4 rounded-xl shadow-lg shadow-[#27AE60]/20 hover:shadow-xl hover:shadow-[#27AE60]/30 transition-all transform hover:-translate-y-0.5 text-center uppercase tracking-wider"
                            >
                                QUERO SER AFILIADO AGORA
                            </Link>
                            <a 
                                href="#servicos" 
                                className="border-2 border-[#2980B9] text-[#2980B9] hover:bg-[#2980B9]/5 font-black text-xs px-8 py-4 rounded-xl transition-all transform hover:-translate-y-0.5 text-center uppercase tracking-wider"
                            >
                                ENTENDER COMO FUNCIONA
                            </a>
                        </div>

                        <p className="text-slate-500 text-xs italic font-medium pt-1">
                            Uma plataforma pensada para fortalecer os três pilares da vida real: saúde, família e trabalho.
                        </p>
                    </div>

                    {/* Right side: 2-minute video mockup */}
                    <div className="lg:col-span-5 flex justify-center lg:justify-end">
                        <div 
                            onClick={() => setShowVideoModal(true)}
                            className="relative w-full max-w-[450px] aspect-video rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white cursor-pointer group hover:scale-[1.02] transition-all duration-300"
                        >
                            <img 
                                src="/assets/familia_feliz.jpg" 
                                alt="Familia feliz e protegida" 
                                className="w-full h-full object-cover brightness-[0.8] group-hover:brightness-75 transition-all"
                            />
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3">
                                <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md border border-white flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all duration-300">
                                    <Play className="w-6 h-6 fill-current text-[#27AE60]" />
                                </div>
                                <div className="bg-[#0B1221]/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10">
                                    Assista ao Vídeo (2 min)
                                </div>
                            </div>

                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-[9px] font-black uppercase tracking-wider">
                                <span>Apresentação Oficial</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 2:14</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* BLOCO 2 — POSICIONAMENTO DA MARCA */}
            <section className="py-20 bg-slate-50 border-y border-slate-100">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-7 space-y-6">
                            <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.25em] block">
                                Posicionamento
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black text-[#0B1221] leading-tight">
                                Mais do que um plano. Um clube de soluções para o bolso da família brasileira.
                            </h2>
                            <p className="text-slate-600 text-base font-medium leading-relaxed">
                                O Clube do Seu Bolso foi criado para ajudar pessoas e famílias a reduzirem custos, terem acesso a serviços importantes e ainda contarem com a possibilidade de gerar renda por indicação. Aqui, você encontra soluções conectadas ao que realmente pesa no orçamento e na rotina do brasileiro.
                            </p>
                        </div>
                        <div className="lg:col-span-5">
                            <div className="bg-[#2980B9]/5 border border-[#2980B9]/15 rounded-[2rem] p-8 space-y-4 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#2980B9]/10 rounded-full blur-xl"></div>
                                <div className="text-slate-700 font-bold text-lg md:text-xl leading-relaxed italic relative z-10">
                                    "Não se trata apenas de ganhar por indicar. Trata-se de apresentar algo que faz sentido para a vida real das pessoas."
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BLOCO 3 — OS 3 PILARES DO CLUBE */}
            <section className="py-24 bg-white">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.25em] block">
                            Nossos Fundamentos
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0B1221]">
                            Os 3 pilares que sustentam o Clube do Seu Bolso
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Pilar 1 — Saúde */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-4 hover:-translate-y-1 transition-all duration-300 group cursor-pointer shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-[#0B1221]">Saúde</h3>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                Acesso à telemedicina ambulatorial básica para facilitar o cuidado com mais praticidade, agilidade e apoio no dia a dia.
                            </p>
                        </div>

                        {/* Pilar 2 — Família */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-4 hover:-translate-y-1 transition-all duration-300 group cursor-pointer shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-[#27AE60]/10 text-[#27AE60] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-[#0B1221]">Família</h3>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                Economia em despesas essenciais e soluções que ajudam a proteger o orçamento familiar com mais equilíbrio e segurança.
                            </p>
                        </div>

                        {/* Pilar 3 — Trabalho */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-4 hover:-translate-y-1 transition-all duration-300 group cursor-pointer shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-[#0B1221]">Trabalho</h3>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                Uma oportunidade de renda extra para quem deseja indicar uma solução útil e construir ganhos recorrentes com mais consistência.
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-12 max-w-2xl mx-auto">
                        <p className="text-slate-700 font-bold text-sm bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                            Quando saúde, economia e renda caminham juntas, a vida financeira se torna mais leve, mais organizada e mais sustentável.
                        </p>
                    </div>
                </div>
            </section>

            {/* BLOCO 4 — SERVIÇOS E BENEFÍCIOS */}
            <section className="py-24 bg-[#F8FAFC] scroll-mt-24" id="servicos">
                <div className="max-w-[1200px] mx-auto px-6 space-y-20">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.25em] block">
                            Nossos Serviços
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0B1221]">
                            Soluções que fazem sentido para o dia a dia
                        </h2>
                    </div>

                    {/* Serviço 1 — Telemedicina com os 4 planos */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-md space-y-12">
                        {/* Top Section: Text copy & details */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pb-8 border-b border-slate-100">
                            <div className="lg:col-span-7 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2980B9]/10 text-[#2980B9] rounded-full text-xs font-bold uppercase tracking-wider">
                                    <Heart className="w-3.5 h-3.5" />
                                    <span>Serviço 1</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-[#0B1221]">
                                    Telemedicina ambulatorial básica
                                </h3>
                                <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed">
                                    Atendimento por telemedicina para ampliar o acesso ao cuidado básico com mais praticidade, rapidez e suporte para você e sua família.
                                </p>
                                <div className="pt-2">
                                    <Link 
                                        to="/service/telemedicina" 
                                        className="inline-flex items-center gap-2 text-[#2980B9] hover:text-[#1f618d] font-black text-xs uppercase tracking-widest transition-all group"
                                    >
                                        <span>Acessar Serviço de Telemedicina</span>
                                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>

                            <div className="lg:col-span-5 space-y-6">
                                <div className="space-y-4">
                                    <h4 className="font-black text-[#0B1221] text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                                        Especialidades Médicas Disponíveis (Planos Premium)
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {medicalSpecialties.map((spec, i) => (
                                            <span 
                                                key={i} 
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                                                    spec.includes("24h") 
                                                        ? 'bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/20' 
                                                        : 'bg-slate-100 text-slate-600 hover:bg-[#2980B9]/10 hover:text-[#2980B9] transition-colors'
                                                }`}
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-sky-50 border border-sky-100 text-sky-900 rounded-2xl text-[11px] font-bold leading-relaxed space-y-1">
                                        <p className="font-extrabold uppercase text-[9px] tracking-wider text-[#2980B9]">Obs. Importante para Planos Familiares:</p>
                                        <p>✓ Conta com 01 titular + 05 dependentes de livre escolha.</p>
                                        <p>✓ Não precisa comprovar parentesco.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Plan Cards Grid in 4 columns */}
                        <div className="space-y-6 pt-8 scroll-mt-24" id="planos">
                            <div className="text-center">
                                <h4 className="text-xs text-slate-400 font-black uppercase tracking-widest">
                                    Escolha o plano ideal para suas necessidades
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {activePlansList.map((plan, idx) => {
                                    const isPremium = plan.name.toLowerCase().includes('premium');
                                    const isFamiliar = plan.type === 'Familiar';
                                    return (
                                        <div 
                                            key={plan.id || idx}
                                            onClick={() => navigate(user ? `/checkout?buy=${plan.id}` : `/register?type=client&buy=${plan.id}`)}
                                            className={`bg-white rounded-3xl p-6 border-2 flex flex-col justify-between hover:scale-[1.02] cursor-pointer transition-all duration-300 relative ${
                                                isPremium 
                                                    ? 'border-[#2980B9] shadow-md shadow-[#2980B9]/5 hover:shadow-lg' 
                                                    : 'border-slate-100 hover:border-slate-200'
                                            }`}
                                        >
                                            {isPremium && (
                                                <span className="absolute -top-3 left-6 bg-[#2980B9] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                                    Recomendado
                                                </span>
                                            )}

                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{plan.type}</span>
                                                    <h4 className="font-black text-base text-[#0B1221] leading-tight">{plan.name}</h4>
                                                </div>

                                                <p className="text-slate-600 text-[11px] font-medium leading-relaxed min-h-[44px]">
                                                    {plan.description}
                                                </p>

                                                <div className="pt-2 border-t border-slate-50 flex flex-col gap-0.5">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider line-through">
                                                        Equivalente: R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(plan.equivalentVal)}
                                                    </span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-[#2980B9] text-sm font-extrabold">R$</span>
                                                        <span className="text-3xl font-black text-[#2980B9]">
                                                            {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(plan.price)}
                                                        </span>
                                                        <span className="text-slate-600 text-xs font-bold">/mês</span>
                                                    </div>
                                                    <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest">
                                                        Adesão: R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(plan.adesao)}
                                                    </span>
                                                </div>

                                                <ul className="space-y-2 pt-2 text-[11px] text-slate-600 font-semibold border-t border-slate-50">
                                                    {plan.benefits.slice(0, 3).map((benefit, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <Check className="w-3.5 h-3.5 text-[#2980B9] shrink-0 mt-0.5" />
                                                            <span>{benefit}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="mt-6">
                                                <Link 
                                                    to={user ? `/checkout?buy=${plan.id}` : `/register?type=client&buy=${plan.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full block text-center py-3 bg-[#27AE60] hover:bg-[#219653] text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md shadow-[#27AE60]/10"
                                                >
                                                    ASSINAR AGORA
                                                </Link>
                                                <Link 
                                                    to={`/plan/${plan.slug}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full block text-center mt-2 py-1 text-slate-400 hover:text-[#2980B9] font-black text-[9px] uppercase tracking-widest transition-colors"
                                                >
                                                    Ver Detalhes do Plano
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Serviço 2 — Economia na conta de energia */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-md">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                            <div className="lg:col-span-6 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#27AE60]/10 text-[#27AE60] rounded-full text-xs font-bold uppercase tracking-wider">
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>Serviço 2</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-[#0B1221]">
                                    Economia na conta de energia
                                </h3>
                                <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed">
                                    Uma alternativa inteligente para reduzir um dos custos que mais pesam no orçamento mensal da família brasileira.
                                    <span className="block mt-2">
                                        Substitua sua conta de luz convencional por uma gestão inteligente, onde a economia é real, visível e discriminada mensalmente em sua fatura.
                                    </span>
                                    <span className="block mt-2">
                                        Através da compensação de créditos de energia limpa, garantimos uma **redução de 18%** (excluídos os impostos e taxas) nos custos de energia, permitindo que o capital economizado seja reinvestido no que realmente importa para o seu negócio ou família.
                                    </span>
                                </p>

                                <div className="pt-2">
                                    <Link 
                                        to="/service/energia-assinatura" 
                                        className="inline-flex items-center gap-2 text-[#27AE60] hover:text-[#1e8449] font-black text-xs uppercase tracking-widest transition-all group"
                                    >
                                        <span>Acessar Serviço de Economia de Energia</span>
                                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>

                            <div className="lg:col-span-6">
                                <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-inner">
                                    <h4 className="font-black text-[#0B1221] text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
                                        1.1 Benefícios Imediatos
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                                            <h5 className="font-extrabold text-xs text-[#0B1221]">Sem Fidelidade</h5>
                                            <p className="text-slate-500 text-[11px] font-medium leading-relaxed">Liberdade total com apenas 60 dias de aviso prévio para cancelamento.</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                                            <h5 className="font-extrabold text-xs text-[#0B1221]">Energia 100% Limpa</h5>
                                            <p className="text-slate-500 text-[11px] font-medium leading-relaxed">Sustentabilidade certificada proveniente de fontes renováveis.</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                                            <h5 className="font-extrabold text-xs text-[#27AE60]">Redução de Custos</h5>
                                            <p className="text-slate-500 text-[11px] font-medium leading-relaxed">Impacto positivo imediato e recorrente no seu fluxo de caixa.</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                                            <h5 className="font-extrabold text-xs text-[#0B1221]">Zero Investimento</h5>
                                            <p className="text-slate-500 text-[11px] font-medium leading-relaxed">Sem obras, sem instalação de placas e sem taxas de manutenção.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Serviço 3 — Recuperação de crédito */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-md">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                            <div className="lg:col-span-5 order-2 lg:order-1">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#2980B9]/5 rounded-[2rem] transform -rotate-3 scale-95 -z-10"></div>
                                    <img 
                                        src="/assets/restauracao_credito.jpg" 
                                        alt="Recuperação de Crédito" 
                                        className="rounded-[2rem] shadow-md w-full h-[250px] object-cover"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2980B9]/10 text-[#2980B9] rounded-full text-xs font-bold uppercase tracking-wider">
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>Serviço 3</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-[#0B1221]">
                                    Soluções de recuperação de crédito
                                </h3>
                                <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed">
                                    Serviços voltados à reorganização da vida financeira e ao fortalecimento do acesso ao crédito com mais estratégia e orientação personalizada. 
                                    Consiga reabilitar o seu CPF ou CNPJ de forma limpa e estruturada.
                                </p>

                                <div className="pt-2">
                                    <Link 
                                        to="/service/estrategias-credito" 
                                        className="inline-flex items-center gap-2 text-[#2980B9] hover:text-[#1f618d] font-black text-xs uppercase tracking-widest transition-all group"
                                    >
                                        <span>Acessar Serviço de Recuperação de Crédito</span>
                                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center max-w-2xl mx-auto">
                        <p className="text-[#0B1221] font-black text-base md:text-lg bg-emerald-50 text-emerald-950 px-6 py-5 rounded-3xl border border-emerald-100 shadow-sm leading-relaxed">
                            "Você não indica algo supérfluo. Você apresenta soluções que as pessoas realmente podem usar."
                        </p>
                    </div>
                </div>
            </section>

            {/* BLOCO 5 — COMO FUNCIONA */}
            <section className="py-24 bg-white" id="como-funciona">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.25em] block">
                            Passo a Passo
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0B1221]">
                            Como funciona o Clube do Seu Bolso
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line for desktop */}
                        <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-slate-100 -z-10"></div>
                        
                        {/* Passo 1 */}
                        <div className="space-y-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#0B1221] text-white flex items-center justify-center font-black text-lg mx-auto shadow-md relative z-10 border-4 border-white">
                                01
                            </div>
                            <h3 className="font-extrabold text-[#0B1221] text-base">Cadastre-se e Ative sua Conta Asaas</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                                Crie sua conta, cadastre-se no Asaas e insira a sua Chave de Acesso no painel. Esse passo é obrigatório para começar a indicar.
                            </p>
                        </div>

                        {/* Passo 2 */}
                        <div className="space-y-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#2980B9] text-white flex items-center justify-center font-black text-lg mx-auto shadow-md relative z-10 border-4 border-white">
                                02
                            </div>
                            <h3 className="font-extrabold text-[#0B1221] text-base">Conheça os serviços</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                                Entenda os benefícios disponíveis e como eles podem ajudar pessoas e famílias na prática.
                            </p>
                        </div>

                        {/* Passo 3 */}
                        <div className="space-y-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#0B1221] text-white flex items-center justify-center font-black text-lg mx-auto shadow-md relative z-10 border-4 border-white">
                                03
                            </div>
                            <h3 className="font-extrabold text-[#0B1221] text-base">Compartilhe com sua rede</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                                Indique uma solução útil para outras pessoas que também desejam economizar, cuidar melhor da família e melhorar sua vida financeira.
                            </p>
                        </div>

                        {/* Passo 4 */}
                        <div className="space-y-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#27AE60] text-white flex items-center justify-center font-black text-lg mx-auto shadow-md relative z-10 border-4 border-white">
                                04
                            </div>
                            <h3 className="font-extrabold text-[#0B1221] text-base">Receba comissões recorrentes</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                                Ao realizar indicações elegíveis, você pode receber comissões de forma recorrente, conforme as regras do programa.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* BLOCO 6 — AFILIAÇÃO COM ENTRADA ACESSÍVEL */}
            <section className="py-20 bg-slate-50 border-y border-slate-100">
                <div className="max-w-[1000px] mx-auto px-6">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#27AE60]/10 text-[#27AE60] rounded-full text-xs font-bold uppercase tracking-wider">
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Afiliação Simples</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-[#0B1221]">
                                Comece como afiliado de forma gratuita
                            </h3>
                            <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed">
                                No Clube do Seu Bolso, você pode iniciar como afiliado com inscrição 100% gratuita. Para receber suas comissões por indicações diretas e de sua rede de forma automática, basta cadastrar-se na plataforma Asaas e preencher a sua Chave de Acesso dentro do seu painel de configurações.
                            </p>
                        </div>

                        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <Link 
                                to="/register?type=affiliate" 
                                className="w-full text-center py-4 bg-[#27AE60] hover:bg-[#219653] text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-[#27AE60]/10"
                            >
                                QUERO COMEÇAR COMO AFILIADO
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* BLOCO 7 — DIFERENCIAL E POTENCIAL DE CRESCIMENTO */}
            <section className="py-24 bg-white">
                <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 space-y-6">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.25em] block">
                            Potencial do Mercado
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0B1221] leading-tight">
                            Por que o Clube do Seu Bolso tem alto potencial de crescimento
                        </h2>
                        <p className="text-slate-600 text-base font-medium leading-relaxed">
                            Porque une utilidade real com oportunidade. Em vez de depender apenas de apelo comercial, o afiliado apresenta soluções ligadas a dores permanentes do brasileiro.
                        </p>
                        
                        <div className="text-slate-700 font-bold text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            Quando o que você indica tem valor prático, a recomendação se torna mais natural, mais confiável e com maior potencial de expansão.
                        </div>
                    </div>

                    <div className="lg:col-span-5 grid grid-cols-1 gap-4">
                        <div className="flex gap-4 p-5 bg-[#2980B9]/5 rounded-2xl border border-[#2980B9]/10">
                            <span className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center shrink-0 font-bold">1</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-sm">Saúde básica é uma necessidade constante</h4>
                                <p className="text-slate-500 text-xs mt-1">Nunca deixa de ser prioridade para as famílias brasileiras.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-5 bg-[#27AE60]/5 rounded-2xl border border-[#27AE60]/10">
                            <span className="w-8 h-8 rounded-full bg-[#27AE60]/10 text-[#27AE60] flex items-center justify-center shrink-0 font-bold">2</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-sm">Economia doméstica é prioridade para milhões de famílias</h4>
                                <p className="text-slate-500 text-xs mt-1">Descontos reais na conta de luz são irresistíveis.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-5 bg-[#2980B9]/5 rounded-2xl border border-[#2980B9]/10">
                            <span className="w-8 h-8 rounded-full bg-[#2980B9]/10 text-[#2980B9] flex items-center justify-center shrink-0 font-bold">3</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-sm">Recuperação financeira tem alta demanda</h4>
                                <p className="text-slate-500 text-xs mt-1">Milhões de brasileiros buscam reabilitar seu crédito e score.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-5 bg-[#27AE60]/5 rounded-2xl border border-[#27AE60]/10">
                            <span className="w-8 h-8 rounded-full bg-[#27AE60]/10 text-[#27AE60] flex items-center justify-center shrink-0 font-bold">4</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-sm">Renda extra é uma busca crescente em todo o país</h4>
                                <p className="text-slate-500 text-xs mt-1">Ferramentas de indicação simplificam o ganho adicional.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BLOCO 8 — CREDIBILIDADE */}
            <section className="py-24 bg-slate-50 border-y border-slate-100">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#2980B9]/10 rounded-[2.5rem] transform rotate-3 scale-95 -z-10"></div>
                                <div className="bg-[#0B1221] text-white p-8 md:p-10 rounded-[2.5rem] shadow-xl text-center space-y-4">
                                    <Award className="w-12 h-12 text-[#27AE60] mx-auto" />
                                    <h3 className="text-xl font-black">Transparência e Foco</h3>
                                    <p className="text-slate-400 text-xs leading-relaxed font-medium">
                                        Comprometidos em oferecer serviços de utilidade real com regras comerciais claras e objetivas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7 space-y-6">
                            <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.25em] block">
                                Confiança
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black text-[#0B1221]">
                                Uma proposta feita para gerar confiança
                            </h2>
                            <p className="text-slate-600 text-base font-medium leading-relaxed">
                                O Clube do Seu Bolso foi estruturado para oferecer soluções conectadas à realidade do brasileiro, com transparência, clareza e foco em resultados sustentáveis.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#27AE60]/10 text-[#27AE60] flex items-center justify-center text-xs">✓</span>
                                    <span className="text-sm font-extrabold text-[#0B1221]">Atendimento humanizado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#27AE60]/10 text-[#27AE60] flex items-center justify-center text-xs">✓</span>
                                    <span className="text-sm font-extrabold text-[#0B1221]">Estrutura digital prática</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#27AE60]/10 text-[#27AE60] flex items-center justify-center text-xs">✓</span>
                                    <span className="text-sm font-extrabold text-[#0B1221]">Serviços com utilidade real</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#27AE60]/10 text-[#27AE60] flex items-center justify-center text-xs">✓</span>
                                    <span className="text-sm font-extrabold text-[#0B1221]">Programa com regras claras</span>
                                </div>
                            </div>
                            
                            <p className="text-slate-700 font-bold text-sm bg-white p-4 rounded-2xl border border-slate-200 inline-block">
                                💡 Modelo de afiliação pensado para escala nacional.
                            </p>

                            <div className="text-slate-600 text-sm font-semibold italic">
                                Aqui, o crescimento acontece quando o benefício faz sentido para quem usa e para quem indica.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO EXTRA: DEPOIMENTOS E PROVA SOCIAL (Mitigação de objeção) */}
            <section className="py-24 bg-white">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.25em] block">
                            Prova Social
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0B1221]">
                            O que dizem os membros do clube
                        </h2>
                        <p className="text-slate-500 text-sm md:text-base font-medium">
                            Histórias reais de pessoas que transformaram suas despesas e suas carreiras através da nossa plataforma.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Depoimento 1 */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6 relative hover:scale-[1.01] transition-transform shadow-sm">
                            <div className="flex gap-1 text-amber-500">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                            </div>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                                "O plano familiar foi a melhor escolha que fiz. Por R$ 44,90 consigo colocar meus filhos e meu marido sem burocracia nenhuma e o atendimento médico por vídeo é rápido e funciona super bem."
                            </p>
                            <div className="flex items-center gap-3 pt-2">
                                <div className="w-10 h-10 rounded-full bg-[#2980B9]/20 text-[#2980B9] flex items-center justify-center font-bold text-sm">
                                    AM
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-sm">Ana Maria Souza</h4>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliente Telemedicina</span>
                                </div>
                            </div>
                        </div>

                        {/* Depoimento 2 */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6 relative hover:scale-[1.01] transition-transform shadow-sm">
                            <div className="flex gap-1 text-amber-500">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                            </div>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                                "Eu estava bem cético sobre a redução da conta de energia por assinatura. Mas a redução de 18% realmente apareceu na minha fatura, sem precisar instalar nenhuma placa solar no meu apartamento."
                            </p>
                            <div className="flex items-center gap-3 pt-2">
                                <div className="w-10 h-10 rounded-full bg-[#27AE60]/20 text-[#27AE60] flex items-center justify-center font-bold text-sm">
                                    RS
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-sm">Ricardo Santos</h4>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliente Energia</span>
                                </div>
                            </div>
                        </div>

                        {/* Depoimento 3 */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6 relative hover:scale-[1.01] transition-transform shadow-sm">
                            <div className="flex gap-1 text-amber-500">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                            </div>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                                "Comecei indicando o plano para vizinhos e amigos. Como o serviço é muito útil e barato, as pessoas aceitam na hora. Hoje tiro uma renda recorrente incrível como afiliada do Clube!"
                            </p>
                            <div className="flex items-center gap-3 pt-2">
                                <div className="w-10 h-10 rounded-full bg-[#2980B9]/20 text-[#2980B9] flex items-center justify-center font-bold text-sm">
                                    CS
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-sm">Camila Silva</h4>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Afiliada Profissional</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BLOCO 10 — CHAMADA DE CONVERSÃO INTERMEDIÁRIA */}
            <section className="py-16 bg-[#0B1221] text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-[#2980B9]/10 rounded-full blur-3xl"></div>
                <div className="absolute left-0 bottom-0 w-60 h-60 bg-[#27AE60]/5 rounded-full blur-2xl"></div>
                
                <div className="max-w-[900px] mx-auto px-6 text-center space-y-6 relative z-10">
                    <h3 className="text-2xl md:text-3xl font-black">
                        Você pode divulgar algo que realmente ajuda as pessoas
                    </h3>
                    <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        O grande diferencial do Clube do Seu Bolso é que o afiliado não precisa convencer alguém a comprar algo desnecessário. Ele apresenta soluções que fazem sentido para o orçamento, para a saúde e para a organização da vida financeira.
                    </p>
                    <div className="pt-2">
                        <Link 
                            to="/register?type=affiliate" 
                            className="inline-block bg-[#27AE60] hover:bg-[#219653] text-white font-black text-xs px-8 py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 uppercase tracking-wider"
                        >
                            QUERO FAZER PARTE DISSO
                        </Link>
                    </div>
                </div>
            </section>

            {/* BLOCO 9 — OBJEÇÕES E FAQ */}
            <section className="py-24 bg-white" id="faq">
                <div className="max-w-[800px] mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.25em] block">
                            Dúvidas Frequentes
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0B1221]">
                            Perguntas e Respostas
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                                <button
                                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                                    className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-100/50 transition-colors focus:outline-none"
                                >
                                    <span className="font-extrabold text-sm md:text-base text-[#0B1221]">{faq.q}</span>
                                    <ChevronDown className={`w-5 h-5 text-[#2980B9] transition-transform shrink-0 ml-4 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                                </button>
                                {activeFaq === idx && (
                                    <div className="p-6 pt-0 text-slate-600 text-xs md:text-sm font-medium leading-relaxed border-t border-slate-100/30 bg-slate-50/50 animate-in fade-in duration-200">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BLOCO 11 — FECHAMENTO FINAL */}
            <section className="py-20 bg-slate-50 border-t border-slate-100 text-center">
                <div className="max-w-[800px] mx-auto px-6 space-y-6">
                    <h2 className="text-3xl md:text-4xl font-black text-[#0B1221] leading-tight">
                        Entre para um clube que une utilidade real, proteção familiar e oportunidade de renda.
                    </h2>
                    <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        Seja parte de uma plataforma pensada para ajudar pessoas a economizar, cuidar melhor da família e construir uma nova possibilidade de ganho com indicações.
                    </p>
                    
                    <div className="pt-4 flex flex-wrap justify-center gap-4">
                        <a 
                            href="#cadastro-lead" 
                            className="bg-[#27AE60] hover:bg-[#219653] text-white font-black text-xs px-8 py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 uppercase tracking-wider"
                        >
                            QUERO FAZER PARTE AGORA
                        </a>
                    </div>
                    
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider italic pt-2">
                        Clube do Seu Bolso: saúde, família e trabalho em uma proposta com potencial nacional.
                    </p>
                </div>
            </section>

            {/* BLOCO 12 — FORMULÁRIO / ÁREA DE CADASTRO */}
            <section className="py-24 bg-white border-t border-slate-100" id="cadastro-lead">
                <div className="max-w-[600px] mx-auto px-6">
                    <div className="bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-xl space-y-8">
                        <div className="text-center space-y-3">
                            <h3 className="text-2xl font-black text-[#0B1221]">
                                Comece sua jornada no Clube do Seu Bolso
                            </h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Cadastre-se para conhecer a plataforma e dar o primeiro passo em uma oportunidade baseada em soluções reais para o dia a dia.
                            </p>
                        </div>

                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                            {/* Nome */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Seu nome"
                                        value={leadForm.name}
                                        onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-semibold text-[#0B1221] outline-none focus:border-[#2980B9] transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* WhatsApp */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="(00) 00000-0000"
                                        value={leadForm.whatsapp}
                                        onChange={handlePhoneChange}
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-semibold text-[#0B1221] outline-none focus:border-[#2980B9] transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* E-mail */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="exemplo@email.com"
                                        value={leadForm.email}
                                        onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-semibold text-[#0B1221] outline-none focus:border-[#2980B9] transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Cidade / Estado */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Cidade / Estado</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                    <input 
                                        type="text" 
                                        placeholder="Ex: São Paulo - SP"
                                        value={leadForm.cityState}
                                        onChange={(e) => setLeadForm(prev => ({ ...prev, cityState: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-semibold text-[#0B1221] outline-none focus:border-[#2980B9] transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full mt-4 py-4 bg-[#27AE60] hover:bg-[#219653] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#27AE60]/10 flex items-center justify-center gap-2"
                            >
                                <span>QUERO ME CADASTRAR</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                Ao se cadastrar, você poderá conhecer melhor a proposta da plataforma e entender como funciona o modelo de afiliação.
                            </p>
                        </div>
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
