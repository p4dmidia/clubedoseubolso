import React, { useState } from 'react';
import {
    Users,
    Gift,
    CheckCircle2,
    Calendar,
    ShieldCheck,
    ArrowRight,
    Trophy,
    ShoppingBag,
    Star,
    Info,
    ChevronDown,
    Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ConsorcioLanding: React.FC = () => {
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    const rules = [
        {
            title: "Tipo 1: Livre Escolha",
            size: "12 Pessoas",
            desc: "Ideal para quem quer flexibilidade. Você escolhe qualquer item do nosso catálogo após a contemplação.",
            draw: "1 Sorteio Mensal",
            icon: <Gift className="w-6 h-6" />,
            link: "/shop?q=MASTER+PLUS"
        },
        {
            title: "Tipo 2: Colchão Premium",
            size: "18 Pessoas",
            desc: "Foco total na sua qualidade de sono. Grupo exclusivo para aquisição de nossos colchões magnéticos.",
            draw: "1 Sorteio Mensal",
            icon: <ShoppingBag className="w-6 h-6" />,
            link: "/shop?category_id=57"
        }
    ];

    const faqs = [
        {
            q: "Como funciona a contemplação?",
            a: "Para garantir total honestidade, usamos o nosso sistema automatizado de contemplação mensal, que define o ganhador do mês de forma segura e transparente para todos os participantes."
        },
        {
            q: "O que acontece quando eu for sorteado?",
            a: "No caso do consórcio MASTER você recebe um voucher do valor do contrato assinado e a CLUBE DO SEU BOLSO lhe enviará por WhatsApp todos os produtos disponíveis e você escolherá seus produtos ou site se preferir. Lembrando que você terá as despesas de frete para os produtos serem enviados. No caso do consórcio PLUS você pagará o frete e receberá o produto já escolhido no início do contrato."
        },
        {
            q: "Quais as formas de pagamento?",
            a: "Aceitamos Cartão de Crédito e PIX. O pagamento é recorrente para garantir sua permanência no grupo."
        }
    ];

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] aspect-square bg-slate-50 rounded-full -translate-y-1/2 z-0"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="bg-[#2980B9]/10 text-[#2980B9] text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-6 inline-block">
                        Oportunidade Clube do Seu Bolso
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-[#0B1221] leading-tight mb-8">
                        Realize seus sonhos com <br />
                        <span className="text-[#2980B9]">Consórcio Transparente</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
                        A forma mais inteligente de adquirir produtos premium com parcelas que cabem no seu bolso e total segurança Clube do Seu Bolso.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="#groups" className="bg-[#0B1221] text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-slate-200 hover:scale-105 transition-all flex items-center justify-center gap-3">
                            ESCOLHER MEU GRUPO
                            <ArrowRight className="w-5 h-5 text-[#2980B9]" />
                        </a>
                        <a href="#rules-desc" className="bg-white border-2 border-slate-100 text-[#0B1221] font-black py-4 px-10 rounded-2xl hover:border-[#2980B9] transition-all">
                            COMO FUNCIONA?
                        </a>
                    </div>
                </div>
            </section>

            {/* Rules Cards */}
            <section id="groups" className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-[#0B1221]">Nossos Grupos</h2>
                        <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">Escolha a modalidade que melhor se adapta a você</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {rules.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 hover:border-[#2980B9]/30 transition-all group">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#2980B9] mb-8 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-black text-[#0B1221] mb-4">{item.title}</h3>
                                <div className="flex gap-4 mb-6">
                                    <div className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-slate-500 border border-slate-100">
                                        {item.size}
                                    </div>
                                    <div className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-emerald-500 border border-emerald-50">
                                        {item.draw}
                                    </div>
                                </div>
                                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                    {item.desc}
                                </p>
                                <Link to={item.link} className="w-full bg-[#2980B9] text-[#0B1221] font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#0B1221] hover:text-white transition-all">
                                    VER VAGAS
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="rules-desc" className="py-24 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-8 md:p-16 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#2980B9] rounded-2xl flex items-center justify-center text-[#0B1221]">
                                <Info className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-black text-[#0B1221]">COMO FUNCIONA</h2>
                        </div>
                        
                        <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
                            <p>Ao escolher o grupo desejado conforme a empresa disponibiliza, cada cliente entra em um grupo onde tiver vaga de acordo sua aquisição.</p>
                            <p>O pagamento de cada parcela posterior, o cliente deverá pagar entre o dia 05 e 10 de cada mês; Pois nossos sorteios são feitos todo dia 11 de cada mês.</p>
                            <p>Cada cliente tem acesso ao resultado dentro de seu escritório virtual.</p>
                            <p>No caso do consorcio MASTER que é a livre escolha, o cliente contemplado poderá escolher os itens que melhor lhe agrada, pagando sempre o frete de cada item escolhido.</p>
                            <p>O cliente contemplado poderá escolher produtos que não estão no sait ainda, a CLUBE DO SEU BOLSO através de seu administrador lhe enviará por WhatsApp os produtos disponíveis.</p>
                            <p>No caso do consorcio PLUS segue a mesma regra quanto ao dia de pagamento e sorteio, a diferença aqui é que o cliente já escolhe no ato da aquisição o produto de sua preferência.</p>
                            <p>A nota fiscal será enviada pela CLUBE DO SEU BOLSO por e-mail a pessoa contemplada conforme cadastrado no sistema.</p>
                        </div>

                        <div className="mt-12 pt-12 border-t border-slate-100 flex justify-center">
                            <a href="#groups" className="bg-[#2980B9] text-[#0B1221] font-black py-4 px-12 rounded-2xl hover:bg-[#0B1221] hover:text-white transition-all text-center">
                                ESCOLHER MEU PRODUTO AGORA
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transparency Section */}
            <section id="how" className="py-24 bg-[#0B1221] text-white relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 items-center gap-20">
                        <div>
                            <span className="text-[#2980B9] font-black text-[10px] uppercase tracking-[0.3em] mb-4 block">Total Transparência</span>
                            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-8">
                                Sistema de Contemplação <span className="text-[#2980B9]">Clube do Seu Bolso Platinum</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                                No sistema Clube do Seu Bolso Platinum, o vencedor é definido de forma transparente e segura através do nosso sistema automatizado de contemplação mensal.
                            </p>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 text-[#2980B9]">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Número da Sorte</h4>
                                        <p className="text-slate-400 text-sm">Ao entrar, você recebe um número fixo que te acompanhará até ser contemplado.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 text-[#2980B9]">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Cálculo Verificável</h4>
                                        <p className="text-slate-400 text-sm">O sistema pega o resultado da loteria e aplica a fórmula (Número Loteria % Tamanho Grupo) + 1.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 relative">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2980B9] rounded-full blur-3xl opacity-20"></div>
                            <h4 className="text-[#2980B9] font-black uppercase text-xs tracking-widest mb-8">Simulação de Contemplação</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-slate-400 text-sm">Res. Sistema Clube do Seu Bolso</span>
                                    <span className="font-black text-xl">57.342</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-slate-400 text-sm">Tamanho do Grupo</span>
                                    <span className="font-black text-xl">12</span>
                                </div>
                                <div className="p-1 bg-[#2980B9]/20 rounded-2xl overflow-hidden">
                                    <div className="p-5 bg-[#2980B9] text-[#0B1221] rounded-xl text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Contemplado Projetado</p>
                                        <p className="text-2xl font-black">NÚMERO DA SORTE: 07</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-[#0B1221]">Dúvidas Frequentes</h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="border border-slate-100 rounded-3xl overflow-hidden">
                                <button
                                    onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                                    className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-bold text-[#0B1221]">{faq.q}</span>
                                    <ChevronDown className={`w-5 h-5 text-[#2980B9] transition-transform ${faqOpen === idx ? 'rotate-180' : ''}`} />
                                </button>
                                {faqOpen === idx && (
                                    <div className="p-6 pt-0 text-slate-500 font-medium">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="pb-32">
                <div className="container mx-auto px-4">
                    <div className="bg-[#2980B9] rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity"></div>
                        <h2 className="text-4xl md:text-5xl font-black text-[#0B1221] mb-8">Comece agora seu Planejamento</h2>
                        <p className="text-[#0B1221]/70 text-lg font-bold mb-12 max-w-xl mx-auto">
                            Garanta sua vaga em grupos exclusivos e aproveite a qualidade Clube do Seu Bolso Platinum da forma mais econômica.
                        </p>
                        <div className="flex justify-center">
                            <Link to="/shop?category_id=57" className="bg-[#0B1221] text-white font-black py-5 px-12 rounded-2xl shadow-2xl hover:scale-105 transition-all text-lg">
                                ESCOLHER MEU GRUPO
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ConsorcioLanding;
