import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { 
    Activity, 
    Shield, 
    Heart, 
    CreditCard, 
    TrendingUp, 
    Check, 
    ArrowRight, 
    Users, 
    Flame, 
    Zap, 
    PhoneCall, 
    MessageSquare, 
    ChevronDown, 
    HelpCircle, 
    Star, 
    ThumbsUp,
    Sparkles
} from 'lucide-react';

interface PlanDetail {
    id: string;
    slug: string;
    name: string;
    type: 'Individual' | 'Familiar';
    price: string;
    description: string;
    headline: string;
    subheadline: string;
    checkoutId: string;
    color: string;
    image: string;
    benefits: { title: string; desc: string }[];
    painPoints: { problem: string; solution: string }[];
    savingsCalculator: { label: string; marketCost: string; ourCost: string; diff: string };
    faqs: { q: string; a: string }[];
}

const PLAN_DETAILS: { [key: string]: PlanDetail } = {
    'individual-essencial': {
        id: '1',
        slug: 'individual-essencial',
        name: 'Individual Essencial',
        type: 'Individual',
        price: '17,90',
        description: 'O plano básico indispensável para quem busca atendimento médico ágil e direcionamento financeiro inicial.',
        headline: 'Sua Saúde Protegida e seu Bolso Seguro por menos de R$ 0,60 por dia!',
        subheadline: 'Chega de filas em hospitais públicos ou mensalidades absurdas. Tenha atendimento médico na tela do celular e comece a limpar o seu nome hoje mesmo.',
        checkoutId: 'd3b07384-d113-4171-bc01-9a7c936df312',
        color: '#2980B9',
        image: '/assets/plano_individual_essencial.jpg',
        benefits: [
            { title: 'Telemedicina Imediata 24h', desc: 'Fale com um Clínico Geral a qualquer hora do dia ou da noite, direto do seu celular, sem agendamento.' },
            { title: 'Estratégia de Crédito Base', desc: 'Aprenda os primeiros passos para renegociar suas dívidas e reabilitar seu score no mercado.' },
            { title: 'Economia com Medicamentos', desc: 'Descontos de até 60% em medicamentos nas principais redes de farmácia do país.' },
            { title: 'Prontuário Digital Unificado', desc: 'Seu histórico médico seguro e acessível em poucos cliques.' }
        ],
        painPoints: [
            { problem: 'Passar horas na fila do SUS para uma consulta simples.', solution: 'Consulta por chamada de vídeo em menos de 20 minutos de onde você estiver.' },
            { problem: 'Preços abusivos de consultas particulares e convênios tradicionais.', solution: 'Apenas R$ 17,90 por mês sem carência e sem taxas surpresa.' },
            { problem: 'Não saber por onde começar para limpar o nome ou aumentar o score.', solution: 'Direcionamento financeiro base integrado ao seu plano.' }
        ],
        savingsCalculator: {
            label: 'Consulta Particular Média + Remédios',
            marketCost: 'R$ 180,00',
            ourCost: 'R$ 17,90',
            diff: 'R$ 162,10'
        },
        faqs: [
            { q: 'Como funciona a Telemedicina?', a: 'Você baixa nosso app parceiro ou entra no link exclusivo, clica em "Consulta Imediata" e um médico geral te atende por videochamada em minutos. Rápido, seguro e com emissão de receitas e atestados digitais.' },
            { q: 'Existe período de carência?', a: 'Não! Assim que o seu pagamento for confirmado, você já pode realizar consultas de telemedicina no dia seguinte.' },
            { q: 'O plano de crédito realmente ajuda a aumentar o score?', a: 'Sim. Nós fornecemos um guia passo a passo estruturado baseado nas regras do Banco Central para te ajudar a reabilitar seu score e limpar pendências financeiras.' }
        ]
    },
    'individual-premium': {
        id: '2',
        slug: 'individual-premium',
        name: 'Individual Premium',
        type: 'Individual',
        price: '34,90',
        description: 'O combo supremo de saúde com especialistas e consultoria financeira VIP individualizada.',
        headline: 'O Combo Perfeito de Saúde Imediata e Evolução Financeira Acelerada!',
        subheadline: 'Tenha acesso a médicos especialistas a qualquer momento e receba um planejamento VIP para fazer o seu dinheiro render de verdade.',
        checkoutId: 'd3b07384-d113-4171-bc02-9a7c936df312',
        color: '#2980B9',
        image: '/assets/telemedicina_celular.jpg',
        benefits: [
            { title: 'Especialidades Médicas Inclusas', desc: 'Além do Clínico Geral imediato, agende consultas com Pediatras, Cardiologistas, Ginecologistas e mais.' },
            { title: 'Consultoria Financeira VIP', desc: 'Um plano personalizado para limpar seu nome, reestruturar dívidas e criar sua primeira carteira de investimentos.' },
            { title: 'Atendimento Prioritário', desc: 'Canal de suporte preferencial no WhatsApp com equipe dedicada para resolver suas demandas.' },
            { title: 'Tudo do Plano Essencial', desc: 'Descontos em medicamentos, receitas digitais ilimitadas e prontuário online completo.' }
        ],
        painPoints: [
            { problem: 'Aguardar meses para conseguir consulta com um médico especialista.', solution: 'Agendamento rápido de especialistas diretamente na nossa rede de telemedicina premium.' },
            { problem: 'Estar travado nas dívidas sem saber como organizar as contas ou começar a poupar.', solution: 'Consultoria financeira estratégica VIP desenhada especificamente para a sua realidade.' },
            { problem: 'Falta de suporte quando você mais precisa de ajuda com o plano.', solution: 'Acesso prioritário a consultores humanos via WhatsApp.' }
        ],
        savingsCalculator: {
            label: 'Consulta de Especialista + Consultoria Financeira Externa',
            marketCost: 'R$ 450,00',
            ourCost: 'R$ 34,90',
            diff: 'R$ 415,10'
        },
        faqs: [
            { q: 'Quais especialidades médicas estão inclusas?', a: 'Estão inclusos atendimentos com Ginecologia, Cardiologia, Pediatria, Dermatologia, Ortopedia, Psicologia, entre outros especialistas do corpo clínico parceiro.' },
            { q: 'Como é feita a Consultoria Financeira VIP?', a: 'Você terá acesso a diagnósticos personalizados elaborados por analistas financeiros. Analisaremos sua situação atual, dívidas e potencial de investimento para montar um plano de ação.' },
            { q: 'Posso migrar do Essencial para o Premium depois?', a: 'Com certeza! Você pode fazer o upgrade a qualquer momento no seu painel ou solicitando ao suporte.' }
        ]
    },
    'familiar-essencial': {
        id: '3',
        slug: 'familiar-essencial',
        name: 'Familiar Essencial',
        type: 'Familiar',
        price: '44,90',
        description: 'A tranquilidade de saber que toda a sua família está protegida por um valor que cabe no seu bolso.',
        headline: 'Proteja quem Você Ama e Economize na Conta de Luz e Saúde da sua Família!',
        subheadline: 'Telemedicina ilimitada para você, seu cônjuge e até 4 dependentes, com clube de descontos que faz o plano se pagar sozinho.',
        checkoutId: 'd3b07384-d113-4171-bc03-9a7c936df312',
        color: '#27AE60',
        image: '/assets/familia_feliz.jpg',
        benefits: [
            { title: 'Proteção para até 4 Dependentes', desc: 'Inclua cônjuge, filhos ou pais sem custo adicional. Todos com acesso individual à plataforma de saúde.' },
            { title: 'Telemedicina Familiar 24h', desc: 'Clínico Geral imediato por chamada de vídeo para toda a família, ideal para urgências noturnas.' },
            { title: 'Clube de Descontos Exclusivo', desc: 'Economize até 70% em exames de laboratório, farmácias, mercados e lojas parceiras.' },
            { title: 'Orientação Pediátrica Imediata', desc: 'Atendimento médico infantil a qualquer momento para garantir a paz de espírito dos pais.' }
        ],
        painPoints: [
            { problem: 'Filho pequeno com febre no meio da noite e desespero de correr para o pronto-socorro.', solution: 'Videochamada imediata com médico de plantão em minutos, sem sair do conforto de casa.' },
            { problem: 'Pagar mensalidades individuais absurdas de planos de saúde para cada membro da família.', solution: 'Plano único de R$ 44,90 para cobrir o casal e até 4 dependentes.' },
            { problem: 'Gastos altos com exames de imagem, exames de sangue e compras do dia a dia.', solution: 'Clube de descontos robusto integrado com redução de custos real.' }
        ],
        savingsCalculator: {
            label: 'Mensalidade de 4 Planos Individuais Tradicionais',
            marketCost: 'R$ 680,00',
            ourCost: 'R$ 44,90',
            diff: 'R$ 635,10'
        },
        faqs: [
            { q: 'Quem eu posso colocar como dependente?', a: 'Você pode colocar cônjuge/companheiro(a), filhos, enteados ou pais/sogros como dependentes no seu cadastro, limitando-se ao número contratado de até 4 pessoas.' },
            { q: 'As consultas são ilimitadas?', a: 'Sim! Não há limite de quantidade para as consultas com Clínico Geral na modalidade imediata para nenhum dos membros cadastrados.' },
            { q: 'Como uso o Clube de Descontos?', a: 'Basta apresentar a carteirinha digital do Clube do Seu Bolso nas farmácias parceiras (como Drogasil, Raia, Pague Menos) ou usar os cupons de desconto no e-commerce parceiro.' }
        ]
    },
    'familiar-premium': {
        id: '4',
        slug: 'familiar-premium',
        name: 'Familiar Premium',
        type: 'Familiar',
        price: '87,90',
        description: 'A cobertura mais robusta do Clube do Seu Bolso. Saúde, economia de energia doméstica e proteção de vida em um único lugar.',
        headline: 'O Ápice da Segurança Familiar, Economia de Energia Doméstica e Seguro de Vida!',
        subheadline: 'O plano mais completo para proteger sua família física e financeiramente. Inclui telemedicina premium com especialistas, energia por assinatura e seguro de vida.',
        checkoutId: 'd3b07384-d113-4171-bc04-9a7c936df312',
        color: '#27AE60',
        image: '/assets/economia_energia.jpg',
        benefits: [
            { title: 'Energia por Assinatura Integrada', desc: 'Desconto garantido de até 20% na sua conta de luz mensal com energia solar/renovável, sem obras ou investimentos.' },
            { title: 'Telemedicina Premium Completa', desc: 'Consultas com especialistas agendadas e clínico geral ilimitado para toda a família.' },
            { title: 'Seguro de Vida Básico Incluso', desc: 'Tranquilidade e segurança garantida para a estrutura familiar em momentos difíceis.' },
            { title: 'Suporte VIP e Clube de Vantagens', desc: 'Canal de atendimento direto VIP e maior rede de descontos em farmácias, laboratórios e lazer.' }
        ],
        painPoints: [
            { problem: 'Contas de energia cada vez mais caras pesando no orçamento doméstico mensal.', solution: 'Desconto direto na tarifa de energia sem precisar gastar R$ 1 com placas solares.' },
            { problem: 'Falta de proteção securitária para os filhos caso ocorra um imprevisto grave.', solution: 'Seguro de vida básico incluso que apoia financeiramente sua família.' },
            { problem: 'Desejo de ter o melhor suporte médico com agilidade e especialistas.', solution: 'Acesso imediato à nossa melhor rede médica corporativa por videochamada.' }
        ],
        savingsCalculator: {
            label: 'Plano de Saúde Familiar + Seguro de Vida + Conta de Luz Cheia',
            marketCost: 'R$ 950,00',
            ourCost: 'R$ 87,90',
            diff: 'R$ 862,10'
        },
        faqs: [
            { q: 'Como funciona a Energia por Assinatura?', a: 'Nós injetamos energia limpa e renovável gerada em usinas solares parceiras diretamente na rede da sua concessionária local. Você ganha desconto de até 20% na tarifa de consumo sem mudar nada na sua fiação, sem obras e sem custos.' },
            { q: 'Como funciona o Seguro de Vida?', a: 'É uma apólice básica de assistência e proteção familiar fornecida em parceria com seguradoras renomadas do mercado, com cobertura simplificada e acionamento direto via nosso suporte.' },
            { q: 'Quantas pessoas podem ser incluídas no Familiar Premium?', a: 'Você pode incluir seu cônjuge e dependentes diretos para usufruírem de toda a plataforma de saúde, telemedicina e clube de vantagens.' }
        ]
    }
};

const PlanLandingPage: React.FC = () => {
    const { user } = useAuth();
    const { planSlug } = useParams<{ planSlug: string }>();
    const navigate = useNavigate();
    const [activeFaq, setActiveFaq] = React.useState<number | null>(null);
    const [dbPlan, setDbPlan] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const fetchPlanFromDb = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_active', true);
                
                if (data && !error) {
                    const matched = data.find((p: any) => {
                        const slug = p.variations?.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return slug === planSlug;
                    });
                    if (matched) {
                        setDbPlan(matched);
                    }
                }
            } catch (err) {
                console.error("Error fetching plan:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlanFromDb();
    }, [planSlug]);

    // Encontra os detalhes do plano com base no slug da URL
    const staticDetail = PLAN_DETAILS[planSlug || ''] || {
        id: dbPlan?.id || 'custom',
        slug: planSlug || 'custom',
        name: dbPlan?.name || 'Plano Personalizado',
        type: dbPlan?.variations?.plan_type || 'Individual',
        price: dbPlan ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(dbPlan.price) : '0,00',
        description: dbPlan?.description || '',
        headline: dbPlan ? `Sua Saúde e Finanças protegidas com o ${dbPlan.name}!` : 'O plano sob medida para você.',
        subheadline: dbPlan?.description || 'Tenha mais segurança e tranquilidade com a estrutura do Clube do Seu Bolso.',
        checkoutId: dbPlan?.id || '',
        color: dbPlan?.variations?.plan_type === 'Familiar' ? '#27AE60' : '#2980B9',
        image: dbPlan?.variations?.plan_type === 'Familiar' ? '/assets/familia_feliz.jpg' : '/assets/plano_individual_essencial.jpg',
        benefits: [
            { title: 'Telemedicina Imediata 24h', desc: 'Fale com um Clínico Geral a qualquer hora do dia ou da noite, direto do seu celular, sem agendamento.' },
            { title: 'Consultoria Financeira Integrada', desc: 'Planejamento e suporte financeiro para você fazer o seu dinheiro render.' },
            { title: 'Clube de Vantagens e Descontos', desc: 'Economize em farmácias, mercados e parceiros nacionais.' }
        ],
        painPoints: [
            { problem: 'Passar horas na fila do SUS para uma consulta simples.', solution: 'Consulta por chamada de vídeo em menos de 20 minutos de onde você estiver.' },
            { problem: 'Preços abusivos de consultas particulares e convênios tradicionais.', solution: 'Mensalidades acessíveis sem carência e sem taxas surpresa.' }
        ],
        savingsCalculator: {
            label: 'Consulta Particular Média + Farmácia',
            marketCost: 'R$ 280,00',
            ourCost: 'R$ 0,00',
            diff: 'R$ 280,00'
        },
        faqs: [
            { q: 'Como funciona a Telemedicina?', a: 'Você clica em "Consulta Imediata" e um médico geral te atende por videochamada em minutos. Rápido, seguro e com emissão de receitas e atestados digitais.' },
            { q: 'Existe período de carência?', a: 'Não! Assim que o seu pagamento for confirmado, você já pode realizar consultas de telemedicina no dia seguinte.' }
        ]
    };

    const basePlan = {
        ...staticDetail,
        id: dbPlan ? dbPlan.id : staticDetail.id,
        checkoutId: dbPlan ? dbPlan.id : staticDetail.checkoutId,
        price: dbPlan ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(dbPlan.variations?.mensalidade || dbPlan.price) : staticDetail.price,
        description: dbPlan ? dbPlan.description : staticDetail.description,
        name: dbPlan ? dbPlan.name : staticDetail.name,
        type: dbPlan ? (dbPlan.variations?.plan_type || 'Individual') : staticDetail.type,
    };

    const marketPrice = basePlan.type === 'Familiar' ? 680 : 180;
    const ourPriceNum = dbPlan ? (dbPlan.variations?.mensalidade || dbPlan.price) : parseFloat(basePlan.price.replace('.', '').replace(',', '.'));
    const ourCostFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ourPriceNum);
    const diffFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(marketPrice - ourPriceNum);

    const plan = {
        ...basePlan,
        savingsCalculator: {
            label: basePlan.type === 'Familiar' ? 'Mensalidade de 4 Planos Individuais Tradicionais' : 'Consulta Particular Média + Remédios',
            marketCost: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(marketPrice),
            ourCost: ourCostFormatted,
            diff: diffFormatted
        }
    };

    const handleCTA = () => {
        if (user) {
            navigate(`/checkout?buy=${plan.checkoutId}`);
        } else {
            navigate(`/register?type=client&buy=${plan.checkoutId}`);
        }
    };

    return (
        <div className="bg-[#f7f9fe] text-[#0B1221] font-sans antialiased min-h-screen">
            {/* Header Hero Banner */}
            <section className="relative overflow-hidden bg-[#0B1221] pt-24 pb-20 md:pt-32 md:pb-28">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2980B9]/20 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#27AE60]/20 rounded-full blur-[80px]"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
                        <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-[#2980B9] uppercase tracking-widest">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                Plano {plan.type} • {plan.name}
                            </div>
                            
                            <h1 className="text-3xl md:text-5xl lg:text-5xl font-black text-white leading-tight">
                                {plan.headline}
                            </h1>
                            
                            <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                {plan.subheadline}
                            </p>

                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <button
                                    onClick={handleCTA}
                                    className="w-full sm:w-auto px-8 py-5 bg-[#2980B9] text-white hover:bg-[#1f6291] font-black text-sm rounded-2xl shadow-xl shadow-[#2980B9]/25 hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 uppercase tracking-wider"
                                >
                                    Adquirir Agora por R$ {plan.price}/mês
                                    <ArrowRight className="w-5 h-5 text-white" />
                                </button>
                                <a
                                    href="#features"
                                    className="w-full sm:w-auto px-8 py-5 border-2 border-white/20 text-white hover:bg-white/5 font-black text-sm rounded-2xl transition-all text-center uppercase tracking-wider"
                                >
                                    Conhecer Benefícios
                                </a>
                            </div>

                            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 pt-4 text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#2980B9]" /> SEM CARÊNCIA</span>
                                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> ATIVAÇÃO RÁPIDA</span>
                                <span className="flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-amber-500" /> SUPORTE HUMANIZADO</span>
                            </div>
                        </div>
                        <div className="lg:col-span-5 flex justify-center">
                            <div className="relative group">
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#2980B9] to-[#27AE60] rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <img 
                                    src={plan.image} 
                                    alt={plan.name} 
                                    className="relative rounded-[2.5rem] shadow-2xl w-full max-w-[450px] aspect-[4/3] lg:aspect-square object-cover border-4 border-white/10 transform hover:scale-[1.02] transition-transform duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pain Points vs Solution Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">Chega de Dificuldades</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1221]">Por que continuar sofrendo com serviços tradicionais?</h2>
                        <p className="text-slate-500 font-medium">Veja a diferença real de como resolvemos seus problemas diários de saúde e orçamento.</p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plan.painPoints.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2">
                                        <span className="bg-red-50 text-red-500 text-[10px] font-black uppercase px-2 py-0.5 rounded">Antes</span>
                                    </div>
                                    <p className="text-slate-600 text-sm font-semibold italic">"{item.problem}"</p>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-200/50 space-y-3">
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                                        <Zap className="w-3.5 h-3.5 fill-current" /> Com o Clube
                                    </div>
                                    <p className="text-[#0B1221] text-sm font-bold">{item.solution}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-20 bg-[#f7f9fe]" id="features">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">O que está incluso</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1221]">Tudo o que você recebe ao assinar hoje</h2>
                        <p className="text-slate-500 font-medium">Benefícios integrados para você focar no que realmente importa na sua vida.</p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        {plan.benefits.map((benefit, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(44,62,80,0.02)] hover:shadow-[0_8px_30px_rgba(44,62,80,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-[#cce5ff] text-[#2980B9] flex items-center justify-center shrink-0">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-[#0B1221]">{benefit.title}</h3>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{benefit.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Savings Calculator Comparison */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#0B1221] to-[#1a2436] rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2980B9]/20 rounded-full blur-2xl"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="text-center space-y-2">
                                <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">Comparativo de Economia</span>
                                <h3 className="text-2xl md:text-3xl font-extrabold text-white">Quanto você economiza de verdade?</h3>
                                <p className="text-slate-400 text-sm font-medium">Veja a diferença de custo mensal acumulado em comparação ao mercado.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{plan.savingsCalculator.label}</p>
                                    <p className="text-2xl font-black text-red-400 line-through">{plan.savingsCalculator.marketCost}</p>
                                </div>
                                <div className="text-center text-slate-400 font-extrabold text-lg py-2">
                                    VS
                                </div>
                                <div className="bg-[#2980B9]/20 border-2 border-[#2980B9] rounded-2xl p-6 text-center">
                                    <p className="text-[#2980B9] text-xs font-black uppercase tracking-wider mb-2">Sua Assinatura Clube</p>
                                    <p className="text-3xl font-black text-white">R$ {plan.price} <span className="text-xs text-slate-400 font-medium">/mês</span></p>
                                </div>
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                                <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">
                                    Você economiza cerca de <span className="text-white text-base font-black px-1.5 bg-emerald-600 rounded ml-1">{plan.savingsCalculator.diff}</span> todo mês!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-[#f7f9fe]">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">Quem já assina aprova</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1221]">Relatos de Clientes Satisfeitos</h2>
                        <p className="text-slate-500 font-medium">Mais de 10.000 famílias protegidas e gerando economia real todos os meses.</p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(44,62,80,0.02)] flex flex-col justify-between space-y-6">
                            <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                                "Eu precisava de uma consulta no meio da noite para meu filho pequeno e, em menos de 15 minutos de videochamada, fomos atendidos por um excelente médico de plantão. Recebi a receita digital no celular, comprei os remédios com desconto e não gastei nada além da assinatura mensal."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">
                                    MC
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-[#0B1221]">Mariana Costa</h4>
                                    <div className="flex text-amber-500 gap-0.5 mt-0.5">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(44,62,80,0.02)] flex flex-col justify-between space-y-6">
                            <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                                "O plano tem sido excelente. Além do suporte médico impecável, a consultoria financeira me ajudou a renegociar uma pendência que estava travando meu CPF. O investimento mensal é muito baixo pelo retorno que traz no dia a dia."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">
                                    RS
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-[#0B1221]">Rodrigo Soares</h4>
                                    <div className="flex text-amber-500 gap-0.5 mt-0.5">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQs */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">Faq</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1221]">Dúvidas Frequentes</h2>
                        <p className="text-slate-500 font-medium">Respondemos às principais perguntas sobre o plano {plan.name}.</p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {plan.faqs.map((faq, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                                <button
                                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                                    className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-100/50 transition-colors"
                                >
                                    <span className="font-bold text-sm text-[#0B1221]">{faq.q}</span>
                                    <ChevronDown className={`w-4 h-4 text-[#2980B9] transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                                </button>
                                {activeFaq === idx && (
                                    <div className="p-6 pt-0 text-slate-500 text-xs font-semibold leading-relaxed border-t border-slate-100/50 bg-slate-50/50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom Hero Final CTA */}
            <section className="py-24 bg-[#0B1221] text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2980B9]/30 rounded-full blur-[120px]"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 max-w-3xl space-y-6">
                    <h2 className="text-3xl md:text-5xl font-black">
                        Comece a proteger sua saúde e economizar ainda hoje!
                    </h2>
                    <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl mx-auto">
                        Assine o plano <strong className="text-white">{plan.name}</strong> agora por apenas <span className="text-[#2980B9] font-black text-xl">R$ {plan.price}/mês</span>. Cancele quando quiser, sem taxas escondidas.
                    </p>

                    <div className="pt-4">
                        <button
                            onClick={handleCTA}
                            className="w-full sm:w-auto px-12 py-5 bg-[#2980B9] text-white hover:bg-[#1f6291] font-black text-sm rounded-2xl shadow-xl shadow-[#2980B9]/20 hover:shadow-2xl transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-3 uppercase tracking-wider"
                        >
                            Quero Assinar o Plano Agora
                            <ArrowRight className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2">
                        🛡️ Garantia de Satisfação de 7 dias • Plataforma de Pagamento 100% Segura
                    </p>
                </div>
            </section>
        </div>
    );
};

export default PlanLandingPage;
