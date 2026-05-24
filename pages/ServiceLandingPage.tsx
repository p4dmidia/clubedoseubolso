import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { 
    Activity, 
    Shield, 
    Check, 
    ArrowRight, 
    Zap, 
    MessageSquare, 
    ChevronDown, 
    Star, 
    Sparkles, 
    Clock, 
    TrendingUp,
    Heart,
    Percent,
    BadgeAlert,
    HelpCircle,
    UserCheck
} from 'lucide-react';

interface ServiceDetail {
    slug: string;
    categoryName: string;
    title: string;
    headline: string;
    subheadline: string;
    heroBg: string;
    primaryColor: string;
    image: string;
    benefits: { title: string; desc: string; icon: any }[];
    painPoints: { problem: string; solution: string }[];
    howItWorks: { step: string; title: string; desc: string }[];
    faqs: { q: string; a: string }[];
    whatsappText: string;
}

const SERVICE_DETAILS: { [key: string]: ServiceDetail } = {
    'telemedicina': {
        slug: 'telemedicina',
        categoryName: 'Saúde & Bem-Estar',
        title: 'Telemedicina 24h',
        headline: 'Médico na Tela do seu Celular a qualquer hora, sem filas ou burocracia!',
        subheadline: 'Consultas imediatas com Clínico Geral ou especialistas agendados no conforto da sua casa. Receitas médicas, atestados e exames digitais válidos em todo o Brasil.',
        heroBg: 'from-[#0B1221] to-[#1a2b44]',
        primaryColor: '#2980B9',
        image: '/assets/telemedicina_celular.jpg',
        benefits: [
            { title: 'Atendimento Imediato 24h', desc: 'Fale com um Clínico Geral em menos de 20 minutos por vídeo, sem precisar de agendamento.', icon: Clock },
            { title: 'Médicos Especialistas', desc: 'Agende consultas com pediatras, ginecologistas, cardiologistas, psicólogos e mais.', icon: Heart },
            { title: 'Receitas e Atestados Digitais', desc: 'Receba prescrições com assinatura digital ICP-Brasil aceitas em farmácias de todo o país.', icon: Shield },
            { title: 'Economia Incomparável', desc: 'Evite custos altos com consultas particulares e mensalidades abusivas de planos tradicionais.', icon: Percent }
        ],
        painPoints: [
            { problem: 'Passar horas ineficientes em salas de espera de pronto-socorro.', solution: 'Consulta 100% online e humanizada do sofá de casa.' },
            { problem: 'Aguardar semanas ou meses por uma consulta simples.', solution: 'Médicos de plantão prontos para te atender 24 horas por dia, 7 dias por semana.' },
            { problem: 'Gastar fortunas em exames e remédios sem acompanhamento.', solution: 'Acesso a descontos de até 70% em farmácias conveniadas de todo o Brasil.' }
        ],
        howItWorks: [
            { step: '01', title: 'Escolha seu Plano', desc: 'Selecione abaixo o plano ideal para você ou sua família e faça sua assinatura.' },
            { step: '02', title: 'Acesse o Painel', desc: 'Entre na nossa plataforma digital e inicie a chamada médica de vídeo imediatamente.' },
            { step: '03', title: 'Atendimento & Receita', desc: 'Converse com o médico e receba receitas, pedidos de exames ou atestado no seu WhatsApp.' }
        ],
        faqs: [
            { q: 'As receitas e atestados emitidos são válidos?', a: 'Sim. Todos os nossos médicos utilizam assinatura digital padrão ICP-Brasil, que é legalmente aceita em qualquer farmácia, laboratório ou empresa do território nacional.' },
            { q: 'Quem pode ser dependente nos planos familiares?', a: 'Cônjuge, companheiro(a), filhos, enteados ou pais podem ser adicionados como dependentes nos planos que contam com essa cobertura.' },
            { q: 'Preciso agendar a consulta com clínico geral?', a: 'Não! O clínico geral está disponível na modalidade de pronto-atendimento 24h. Basta clicar e iniciar o atendimento imediatamente.' }
        ],
        whatsappText: ''
    },
    'energia-assinatura': {
        slug: 'energia-assinatura',
        categoryName: 'Economia Inteligente',
        title: 'Energia por Assinatura',
        headline: 'Reduza sua Conta de Luz em até 20% sem gastar um centavo!',
        subheadline: 'Use energia solar limpa e renovável sem instalar placas solares ou fazer obras na sua casa ou empresa. 100% digital, sem taxa de adesão ou fidelidade.',
        heroBg: 'from-[#0B1221] to-[#0f3421]',
        primaryColor: '#27AE60',
        image: '/assets/economia_energia.jpg',
        benefits: [
            { title: 'Desconto de até 20%', desc: 'Economia real e garantida na sua fatura de luz mensal sem investimento inicial.', icon: Percent },
            { title: 'Zero Obras e Zero Placas', desc: 'Não precisa instalar nada no seu telhado. A energia é injetada diretamente pela concessionária local.', icon: Zap },
            { title: 'Sem Fidelidade ou Multas', desc: 'Cancele quando quiser se não estiver satisfeito. Sem pegadinhas no contrato.', icon: Shield },
            { title: 'Energia 100% Limpa', desc: 'Contribua diretamente para a redução das emissões de carbono consumindo energia renovável.', icon: Sparkles }
        ],
        painPoints: [
            { problem: 'Contas de luz cada vez mais caras pesando nas despesas mensais.', solution: 'Desconto automático de até 20% na tarifa de energia sem esforço.' },
            { problem: 'Ter que desembolsar R$ 15.000+ em placas solares para economizar.', solution: 'Adesão 100% digital e gratuita. Você só paga pela energia consumida com desconto.' },
            { problem: 'Burocracia insuportável para aprovação de projetos solares.', solution: 'Nós cuidamos de toda a conexão de forma digital. O desconto vem direto na fatura.' }
        ],
        howItWorks: [
            { step: '01', title: 'Envie sua Conta', desc: 'Fale conosco no WhatsApp e envie uma foto da sua última conta de energia para análise gratuita.' },
            { step: '02', title: 'Ativação Digital', desc: 'Nossa equipe conecta sua residência às nossas usinas parceiras sem alterar sua fiação ou relógio.' },
            { step: '03', title: 'Economize Sempre', desc: 'Continue recebendo energia pela mesma distribuidora, mas agora com o desconto garantido todo mês.' }
        ],
        faqs: [
            { q: 'Como é possível dar desconto sem instalar placas?', a: 'Nós geramos energia solar em larga escala em nossas fazendas solares e injetamos essa energia na distribuidora local. Por lei, isso gera créditos que são transferidos para a sua conta de luz, reduzindo o valor final que você paga.' },
            { q: 'Vou ficar sem luz se chover ou faltar sol?', a: 'Não! A sua energia continua sendo fornecida pela distribuidora física local (como Copel, Cemig, Enel, etc.). A segurança do abastecimento continua exatamente a mesma.' },
            { q: 'Existe custo para aderir ou cancelar?', a: 'Nenhum. A adesão é totalmente gratuita e não há taxa de cancelamento caso decida sair.' }
        ],
        whatsappText: 'Olá, gostaria de economizar até 20% na minha conta de luz com energia por assinatura. Como funciona?'
    },
    'estrategias-credito': {
        slug: 'estrategias-credito',
        categoryName: 'Saúde Financeira',
        title: 'Estratégias de Crédito',
        headline: 'Recupere seu Poder de Compra: Limpe seu Nome e Aumente seu Score!',
        subheadline: 'Chega de ter crédito negado. Conheça as estratégias legais e inteligentes para renegociar pendências, sair da lista de restrições e aumentar seu score de crédito rapidamente.',
        heroBg: 'from-[#0B1221] to-[#2c2010]',
        primaryColor: '#FFA000',
        image: '/assets/restauracao_credito.jpg',
        benefits: [
            { title: 'Limpeza de Restrições', desc: 'Passo a passo legal para tirar seus dados dos órgãos de proteção ao crédito antes do pagamento da dívida.', icon: UserCheck },
            { title: 'Aumento Acelerado de Score', desc: 'Técnicas validadas para fazer as instituições financeiras entenderem que você é um bom pagador.', icon: TrendingUp },
            { title: 'Negociação com Descontos', desc: 'Aprenda a negociar suas pendências com descontos de até 90% direto com os credores.', icon: Percent },
            { title: 'Blindagem Patrimonial', desc: 'Dicas fundamentais de educação financeira para nunca mais cair em armadilhas de juros altos.', icon: Shield }
        ],
        painPoints: [
            { problem: 'Ter financiamento de carro ou casa negado por causa de score baixo.', solution: 'Estratégias estruturadas para elevar sua pontuação no mercado rapidamente.' },
            { problem: 'Sofrer ligações de cobrança abusivas a qualquer hora do dia.', solution: 'Conheça seus direitos legais para cessar a importunação e negociar em paz.' },
            { problem: 'Achar que precisa pagar fortunas para empresas terceirizadas limparem seu nome.', solution: 'Faça você mesmo de forma segura, legal e sem intermediários duvidosos.' }
        ],
        howItWorks: [
            { step: '01', title: 'Fale com Especialista', desc: 'Clique no WhatsApp no final da página para iniciarmos um diagnóstico básico gratuito.' },
            { step: '02', title: 'Plano Personalizado', desc: 'Receba o direcionamento ideal com base na sua situação de restrições ou score.' },
            { step: '03', title: 'Crédito Destravado', desc: 'Aplique as técnicas recomendadas e veja seu nome limpo e seu poder de compra restabelecido.' }
        ],
        faqs: [
            { q: 'Isso é legal perante a lei?', a: 'Totalmente. Todas as técnicas recomendadas são baseadas no Código de Defesa do Consumidor e regulamentações do Banco Central.' },
            { q: 'Em quanto tempo vejo os resultados no meu score?', a: 'Normalmente nossos clientes começam a observar um aumento significativo na pontuação em um período de 30 a 60 dias seguindo as orientações de forma correta.' },
            { q: 'Preciso pagar alguma empresa para limpar meu nome por mim?', a: 'Não. Nós ensinamos como você mesmo pode fazer todo o processo diretamente com os credores de forma segura e oficial.' }
        ],
        whatsappText: 'Olá, gostaria de falar com um especialista sobre a estratégia de crédito para limpar meu nome e aumentar meu score. Como funciona?'
    }
};

const ServiceLandingPage: React.FC = () => {
    const { serviceSlug } = useParams<{ serviceSlug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeFaq, setActiveFaq] = React.useState<number | null>(null);
    const [plans, setPlans] = useState<any[]>([]);

    const handlePurchase = (planId: string) => {
        if (user) {
            navigate(`/checkout?buy=${planId}`);
        } else {
            navigate(`/register?type=client&buy=${planId}`);
        }
    };

    const service = SERVICE_DETAILS[serviceSlug || ''] || SERVICE_DETAILS['telemedicina'];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const fetchPlans = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_categories (name)
                    `)
                    .eq('is_active', true)
                    .order('price', { ascending: true });

                if (data && !error) {
                    const plansOnly = data.filter((prod: any) => 
                        prod.product_categories?.name === 'Planos' || 
                        prod.variations?.plan_type !== undefined
                    );
                    setPlans(plansOnly);
                }
            } catch (err) {
                console.error('Error fetching plans in service page:', err);
            }
        };

        if (service.slug === 'telemedicina') {
            fetchPlans();
        }
    }, [serviceSlug]);

    const whatsAppUrl = `https://api.whatsapp.com/send/?phone=5541996285667&text=${encodeURIComponent(service.whatsappText)}&type=phone_number&app_absent=0`;

    return (
        <div className="bg-[#f7f9fe] text-[#0B1221] font-sans antialiased min-h-screen">
            {/* Hero Section */}
            <section className={`relative overflow-hidden bg-gradient-to-br ${service.heroBg} pt-24 pb-20 md:pt-32 md:pb-28`}>
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2980B9]/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    {/* Back to Home Link */}
                    <div className="max-w-6xl mx-auto mb-6 text-left">
                        <a 
                            href="/#servicos" 
                            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors group"
                        >
                            <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
                            Voltar para a Home (Serviços)
                        </a>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
                        <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-slate-300 uppercase tracking-widest">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                {service.categoryName}
                            </div>
                            
                            <h1 className="text-3xl md:text-5xl lg:text-5xl font-black text-white leading-tight">
                                {service.headline}
                            </h1>
                            
                            <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                {service.subheadline}
                            </p>

                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                {service.slug === 'telemedicina' ? (
                                    <a
                                        href="#pricing-plans"
                                        className="w-full sm:w-auto px-8 py-5 bg-[#2980B9] text-white hover:bg-[#1f6291] font-black text-sm rounded-2xl shadow-xl shadow-[#2980B9]/25 hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 uppercase tracking-wider"
                                    >
                                        Ver Planos Disponíveis
                                        <ArrowRight className="w-5 h-5" />
                                    </a>
                                ) : (
                                    <a
                                        href={whatsAppUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto px-8 py-5 bg-emerald-600 text-white hover:bg-emerald-700 font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/25 hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 uppercase tracking-wider"
                                    >
                                        Falar com Consultor no WhatsApp
                                        <MessageSquare className="w-5 h-5 fill-current" />
                                    </a>
                                )}
                                <a
                                    href="#details"
                                    className="w-full sm:w-auto px-8 py-5 border-2 border-white/20 text-white hover:bg-white/5 font-black text-sm rounded-2xl transition-all text-center uppercase tracking-wider"
                                >
                                    Saiba Mais
                                </a>
                            </div>
                        </div>
                        <div className="lg:col-span-5 flex justify-center">
                            <div className="relative group">
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#2980B9] to-[#27AE60] rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <img 
                                    src={service.image} 
                                    alt={service.title} 
                                    className="relative rounded-[2.5rem] shadow-2xl w-full max-w-[450px] aspect-square object-cover border-4 border-white/10 transform hover:scale-[1.02] transition-transform duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pain Points vs Solution */}
            <section className="py-20 bg-white" id="details">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">Sua realidade</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1221]">Chega de passar por isso sozinho</h2>
                        <p className="text-slate-500 font-medium">Veja a diferença que nossa solução faz nas suas necessidades e despesas cotidianas.</p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {service.painPoints.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2">
                                        <span className="bg-red-50 text-red-500 text-[10px] font-black uppercase px-2 py-0.5 rounded">Situação Comum</span>
                                    </div>
                                    <p className="text-slate-600 text-sm font-semibold italic">"{item.problem}"</p>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-200/50 space-y-3">
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                                        <Check className="w-3.5 h-3.5" /> Solução Clube
                                    </div>
                                    <p className="text-[#0B1221] text-sm font-bold">{item.solution}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 bg-[#f7f9fe]">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">Vantagens Exclusivas</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1221]">Por que nos escolher?</h2>
                        <p className="text-slate-500 font-medium">Facilidade digital e benefícios integrados de alta qualidade.</p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        {service.benefits.map((benefit, idx) => {
                            const IconComponent = benefit.icon;
                            return (
                                <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(44,62,80,0.02)] flex items-start gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2980B9] flex items-center justify-center shrink-0">
                                        <IconComponent className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-[#0B1221]">{benefit.title}</h3>
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{benefit.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">Sem Complicação</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1221]">Passo a Passo Simples</h2>
                        <p className="text-slate-500 font-medium">Tudo o que você precisa fazer para começar a aproveitar.</p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {service.howItWorks.map((step, idx) => (
                            <div key={idx} className="relative group text-center space-y-4">
                                <div className="w-16 h-16 bg-[#2980B9]/10 text-[#2980B9] text-xl font-black rounded-full flex items-center justify-center mx-auto group-hover:bg-[#2980B9] group-hover:text-white transition-all duration-300">
                                    {step.step}
                                </div>
                                <h3 className="text-lg font-bold text-[#0B1221]">{step.title}</h3>
                                <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Service Specific CTA Section */}
            {service.slug === 'telemedicina' ? (
                <section className="py-20 bg-[#f7f9fe]" id="pricing-plans">
                    <div className="container mx-auto px-6">
                        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
                            <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">Nossos Planos</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1221]">Escolha o Plano Perfeito</h2>
                            <p className="text-slate-500 font-medium">Selecione uma de nossas opções e tenha acesso à melhor telemedicina do país.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto">
                            {(() => {
                                const defaultPlans = [
                                    {
                                        id: 'd3b07384-d113-4171-bc01-9a7c936df312',
                                        name: 'Plano Individual Essencial',
                                        price: 17.90,
                                        type: 'Individual',
                                        slug: 'individual-essencial',
                                        benefits: ['Telemedicina 24h', 'Estratégia de Crédito', 'Desconto em Farmácias']
                                    },
                                    {
                                        id: 'd3b07384-d113-4171-bc02-9a7c936df312',
                                        name: 'Plano Individual Premium',
                                        price: 34.90,
                                        type: 'Individual',
                                        slug: 'individual-premium',
                                        benefits: ['Tudo do Essencial', 'Especialidades Médicas', 'Clube de Benefícios VIP']
                                    },
                                    {
                                        id: 'd3b07384-d113-4171-bc03-9a7c936df312',
                                        name: 'Plano Familiar Essencial',
                                        price: 44.90,
                                        type: 'Familiar',
                                        slug: 'familiar-essencial',
                                        benefits: ['Até 4 Dependentes', 'Telemedicina Familiar', 'Clube de Benefícios & Descontos']
                                    },
                                    {
                                        id: 'd3b07384-d113-4171-bc04-9a7c936df312',
                                        name: 'Plano Familiar Premium',
                                        price: 87.90,
                                        type: 'Familiar',
                                        slug: 'familiar-premium',
                                        benefits: ['Acesso Ilimitado', 'Energia por Assinatura', 'Telemedicina Familiar', 'Seguro de Vida']
                                    }
                                ];

                                const getPlanBenefits = (name: string, type: string) => {
                                    const lower = name.toLowerCase();
                                    if (type === 'Familiar' || lower.includes('familiar')) {
                                        if (lower.includes('premium')) {
                                            return ['Acesso Ilimitado', 'Energia por Assinatura', 'Telemedicina Familiar', 'Seguro de Vida'];
                                        }
                                        return ['Até 4 Dependentes', 'Telemedicina Familiar', 'Clube de Benefícios & Descontos'];
                                    } else {
                                        if (lower.includes('premium')) {
                                            return ['Tudo do Essencial', 'Especialidades Médicas', 'Clube de Benefícios VIP'];
                                        }
                                        return ['Telemedicina 24h', 'Estratégia de Crédito', 'Desconto em Farmácias'];
                                    }
                                };

                                const activePlansList = plans.length > 0
                                    ? plans.map(p => ({
                                        id: p.id,
                                        name: p.name,
                                        price: p.variations?.mensalidade || p.price || 0,
                                        type: p.variations?.plan_type || 'Individual',
                                        slug: p.variations?.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                        benefits: getPlanBenefits(p.name, p.variations?.plan_type || 'Individual')
                                    }))
                                    : defaultPlans;

                                return activePlansList.map((plan, idx) => {
                                    const isPremium = plan.name.toLowerCase().includes('premium');
                                    const isFamiliar = plan.type === 'Familiar';
                                    const primaryColor = isFamiliar ? '#27AE60' : '#2980B9';
                                    
                                    return (
                                        <div 
                                            key={plan.id || idx}
                                            className={`bg-white p-8 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 ${isPremium ? 'border-2 relative md:scale-105 z-10 shadow-xl' : 'border border-slate-100 shadow-md'}`}
                                            style={isPremium ? { borderColor: primaryColor } : {}}
                                        >
                                            {isPremium && (
                                                <div 
                                                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest"
                                                    style={{ backgroundColor: primaryColor }}
                                                >
                                                    Mais Popular
                                                </div>
                                            )}
                                            <div>
                                                <div className="mb-6">
                                                    <span className="text-[#40484f] text-[10px] font-bold uppercase tracking-wider">{plan.type}</span>
                                                    <h3 className="text-xl font-bold text-[#0B1221] mt-1">
                                                        {plan.name.replace('Plano Individual ', '').replace('Plano Familiar ', '')}
                                                    </h3>
                                                    <div className="mt-4 flex items-baseline">
                                                        <span className="text-[#40484f] text-xs font-bold">R$</span>
                                                        <span 
                                                            className="text-3xl font-extrabold ml-1"
                                                            style={{ color: primaryColor }}
                                                        >
                                                            {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(plan.price)}
                                                        </span>
                                                        <span className="text-[#40484f] text-xs font-bold ml-1">/mês</span>
                                                    </div>
                                                </div>
                                                <ul className="space-y-4 mb-8">
                                                    {plan.benefits.map((b: string, bIdx: number) => (
                                                        <li key={bIdx} className="flex items-center gap-2 text-xs font-bold text-[#40484f] uppercase tracking-wider">
                                                            <Check className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                                                            <span>{b}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="space-y-3">
                                                <button 
                                                    onClick={() => handlePurchase(plan.id)}
                                                    className="w-full block py-4 text-center rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
                                                    style={isPremium 
                                                        ? { backgroundColor: primaryColor, color: 'white' } 
                                                        : { border: `2px solid ${primaryColor}`, color: primaryColor }
                                                    }
                                                >
                                                    {isPremium ? 'Assinar Agora' : 'Selecionar'}
                                                </button>
                                                <Link 
                                                    to={`/plan/${plan.slug}`}
                                                    className="w-full block py-2 text-center text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all"
                                                >
                                                    Saiba Mais
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </section>
            ) : (
                <section className="py-24 bg-[#0B1221] text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2980B9]/30 rounded-full blur-[120px]"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10 max-w-3xl space-y-6">
                        <h2 className="text-3xl md:text-5xl font-black">
                            {service.slug === 'energia-assinatura' 
                                ? 'Pronto para começar a economizar na sua conta de luz?'
                                : 'Pronto para limpar seu nome e destravar seu score de crédito?'
                            }
                        </h2>
                        <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl mx-auto">
                            {service.slug === 'energia-assinatura'
                                ? 'Clique no botão abaixo para nos enviar uma foto da sua fatura no WhatsApp. Faremos uma simulação gratuita do seu desconto em minutos.'
                                : 'Fale diretamente com um especialista para analisar o seu caso e receber um diagnóstico preliminar do seu score sem custos.'
                            }
                        </p>

                        <div className="pt-4">
                            <a
                                href={whatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-12 py-5 bg-emerald-600 text-white hover:bg-emerald-700 font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/25 hover:shadow-2xl transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-3 uppercase tracking-wider"
                            >
                                Falar no WhatsApp Agora
                                <MessageSquare className="w-5 h-5 fill-current" />
                            </a>
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2">
                            💬 Atendimento rápido e humanizado via WhatsApp
                        </p>
                    </div>
                </section>
            )}

            {/* FAQs */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
                        <span className="text-[#2980B9] text-xs font-black uppercase tracking-[0.2em]">Faq</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1221]">Dúvidas Frequentes</h2>
                        <p className="text-slate-500 font-medium">Respondemos às principais dúvidas sobre o nosso serviço de {service.title}.</p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {service.faqs.map((faq, idx) => (
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

            {/* Back to Home CTA */}
            <section className="py-12 bg-slate-50 border-t border-slate-100 text-center">
                <a 
                    href="/#servicos"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#0B1221] text-white hover:bg-slate-800 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md transform hover:-translate-y-0.5"
                >
                    <span>← Voltar para Serviços na Home</span>
                </a>
            </section>
        </div>
    );
};

export default ServiceLandingPage;
