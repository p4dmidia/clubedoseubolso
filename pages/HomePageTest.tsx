import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const HomePageTest: React.FC = () => {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="bg-white text-gray-800 font-sans antialiased selection:bg-[#2980B9]/20">
            {/* Embedded styles exactly from the HTML */}
            <style dangerouslySetInnerHTML={{ __html: `
                .bg-gelo { background-color: #F4F7F6; }
                .text-azul { color: #2980B9; }
                .bg-azul { background-color: #2980B9; }
                .text-verde { color: #27AE60; }
                .bg-verde { background-color: #27AE60; }
                .border-azul { border-color: #2980B9; }
                .hover\\:bg-verde-dark:hover { background-color: #1e8449; }
                .hover\\:bg-azul-dark:hover { background-color: #1f618d; }
                .transition-all { transition: all 0.3s ease; }
                
                /* Acordeão FAQ */
                .faq-item summary::-webkit-details-marker { display: none; }
                .faq-item summary { cursor: pointer; list-style: none; }
                .faq-item[open] summary { color: #2980B9; }
                .faq-item summary::after {
                    content: '+';
                    float: right;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #27AE60;
                    transition: transform 0.3s;
                }
                .faq-item[open] summary::after {
                    content: '-';
                    transform: rotate(180deg);
                }
            `}} />

            {/* ==================== HEADER ==================== */}
            <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-100">
                <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between py-3">
                    {/* Logo */}
                    <Link to="/home-test" className="flex items-center">
                        <img 
                            src="/assets/logo.png" 
                            alt="Clube do Seu Bolso" 
                            className="h-10 md:h-12 w-auto"
                            onError={(e) => {
                                // Fallback to standard text if image is not found in test environment
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                        <span className="text-xl font-extrabold text-gray-900 tracking-tight lg:ml-2">
                            Clube do <span className="text-[#2980B9]">Seu Bolso</span>
                        </span>
                    </Link>

                    {/* Menu Desktop */}
                    <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold text-gray-700">
                        <a href="#como-funciona" className="hover:text-azul transition-colors">Como Funciona</a>
                        <a href="#servicos" className="hover:text-azul transition-colors">Serviços</a>
                        <a href="#planos" className="hover:text-azul transition-colors">Planos</a>
                        <a href="#faq" className="hover:text-azul transition-colors">FAQ</a>
                    </nav>

                    {/* CTA Header */}
                    <Link 
                        to="/login" 
                        className="hidden lg:inline-block bg-verde text-white font-bold px-6 py-2.5 rounded-lg hover:bg-verde-dark transition-all shadow-md text-sm"
                    >
                        Área do Membro
                    </Link>

                    {/* Menu Mobile (Hamburger) */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                        className="lg:hidden flex flex-col space-y-1.5 p-2 focus:outline-none"
                    >
                        <span className="block w-6 h-0.5 bg-gray-600"></span>
                        <span className="block w-6 h-0.5 bg-gray-600"></span>
                        <span className="block w-6 h-0.5 bg-gray-600"></span>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 text-sm font-semibold">
                        <a 
                            href="#como-funciona" 
                            onClick={() => setIsMobileMenuOpen(false)} 
                            className="block py-2 hover:text-azul"
                        >
                            Como Funciona
                        </a>
                        <a 
                            href="#servicos" 
                            onClick={() => setIsMobileMenuOpen(false)} 
                            className="block py-2 hover:text-azul"
                        >
                            Serviços
                        </a>
                        <a 
                            href="#planos" 
                            onClick={() => setIsMobileMenuOpen(false)} 
                            className="block py-2 hover:text-azul"
                        >
                            Planos
                        </a>
                        <a 
                            href="#faq" 
                            onClick={() => setIsMobileMenuOpen(false)} 
                            className="block py-2 hover:text-azul"
                        >
                            FAQ
                        </a>
                        <Link 
                            to="/login" 
                            onClick={() => setIsMobileMenuOpen(false)} 
                            className="block bg-verde text-white font-bold text-center px-4 py-2.5 rounded-lg hover:bg-verde-dark"
                        >
                            Área do Membro
                        </Link>
                    </div>
                )}
            </header>

            {/* ==================== HERO SECTION ==================== */}
            <section id="hero" class="relative bg-gradient-to-br from-white via-white to-gelo overflow-hidden">
                <div className="container mx-auto px-4 lg:px-8 py-16 md:py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
                            Transforme seus gastos mensais em<br />
                            <span className="text-azul">uma fonte de renda extra</span><br />
                            e proteção para sua família.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                            O <strong>Clube do Seu Bolso</strong> é o único Hub de Sobrevivência Financeira que une Telemedicina, Recuperação de Crédito e Economia de Energia em um só lugar. 
                            <span className="text-verde font-semibold block mt-2">Economize no que é essencial e ganhe por indicar.</span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <a href="#planos" className="bg-verde text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-verde-dark transition-all shadow-xl shadow-green-200 text-center">
                                QUERO ME FILIAR AGORA
                            </a>
                            <a href="#como-funciona" className="border-2 border-azul text-azul font-semibold px-8 py-4 rounded-xl hover:bg-azul hover:text-white transition-all text-center">
                                Saiba Mais
                            </a>
                        </div>
                    </div>
                    <div className="flex-1">
                        {/* Imagem Hero - Família feliz - Usando Unsplash de alta qualidade para ficar Premium */}
                        <img 
                            src="https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?auto=format&fit=crop&q=80&w=800" 
                            alt="Família planejando orçamento e controle financeiro feliz" 
                            className="w-full h-auto rounded-2xl shadow-2xl object-cover aspect-[3/2]"
                        />
                    </div>
                </div>
            </section>

            {/* ==================== SEÇÃO A DOR ==================== */}
            <section className="bg-gelo py-16 md:py-20">
                <div className="container mx-auto px-4 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">Você sente que trabalha apenas para pagar boletos?</h2>
                    <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12 text-lg">
                        A inflação sobe, as contas de luz não param de crescer, o acesso à saúde está cada vez mais caro e o crédito sumiu. 
                        Nós entendemos. Por isso, criamos um ecossistema onde você deixa de ser apenas consumidor para se tornar beneficiário.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all">
                            <div className="w-16 h-16 mx-auto mb-5 bg-red-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Saúde cara</h3>
                            <p className="text-gray-600">Planos de saúde impossíveis e filas intermináveis no SUS. Sua família merece cuidado acessível.</p>
                        </div>
                        {/* Card 2 */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all">
                            <div className="w-16 h-16 mx-auto mb-5 bg-red-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Nome sujo / Sem crédito</h3>
                            <p className="text-gray-600">Restrições no CPF impedem compras e financiamentos. Sua vida financeira travada.</p>
                        </div>
                        {/* Card 3 */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all">
                            <div className="w-16 h-16 mx-auto mb-5 bg-red-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Conta de luz alta</h3>
                            <p className="text-gray-600">A energia elétrica pesa no orçamento todo mês. Todo aumento aperta ainda mais.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== SEÇÃO A SOLUÇÃO ==================== */}
            <section id="como-funciona" className="py-16 md:py-20">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1">
                            <span className="text-verde font-bold text-sm uppercase tracking-widest block mb-2">A Solução</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                O <span class="text-azul">Hub de Sobrevivência Financeira</span> que realmente funciona
                            </h2>
                            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                No <strong>Clube do Seu Bolso</strong>, você não paga para ter serviços — você economiza e ainda ganha dinheiro indicando quem precisa. 
                                Unimos <strong>Telemedicina</strong>, <strong>Recuperação de Crédito</strong> e <strong>Economia de Energia</strong> em uma única assinatura.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-verde rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
                                    <p className="text-gray-700"><strong>Economize até 18%</strong> na conta de luz sem instalar placas solares.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-verde rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
                                    <p className="text-gray-700"><strong>Recupere seu CPF</strong> e volte a ter crédito com consultoria especializada.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-verde rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
                                    <p className="text-gray-700"><strong>Telemedicina 24h</strong> para você e sua família com custo acessível.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-verde rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
                                    <p className="text-gray-700"><strong>Ganhe de 10 a 20%</strong> de comissão por cada indicação ativada.</p>
                                </div>
                            </div>
                            <a href="#planos" className="mt-8 inline-block bg-azul text-white font-bold px-8 py-4 rounded-xl hover:bg-azul-dark transition-all shadow-lg text-center">
                                Comece Agora
                            </a>
                        </div>
                        <div className="flex-1">
                            {/* Visual representation of the Hub using Unsplash for premium look */}
                            <img 
                                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800" 
                                alt="Ilustração do Hub de Sobrevivência Financeira" 
                                className="w-full h-auto rounded-2xl shadow-xl object-cover aspect-[4/3]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== SEÇÃO OS 3 PILARES ==================== */}
            <section id="servicos" className="bg-gelo py-16 md:py-20">
                <div className="container mx-auto px-4 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">Os 3 Pilares do Clube do Seu Bolso</h2>
                    <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12 text-lg">
                        Cada pilar foi desenhado para resolver uma dor real do brasileiro. Juntos, formam um escudo financeiro completo.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Pilar Saúde */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                            <img 
                                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600" 
                                alt="Imagem representando Telemedicina" 
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-10 h-10 bg-azul rounded-full flex items-center justify-center text-white text-xl">🩺</span>
                                    <h3 className="text-xl font-bold">Saúde (Telemedicina)</h3>
                                </div>
                                <ul className="space-y-2 text-gray-600 text-sm">
                                    <li className="flex items-start gap-2">✓ Consultas online 24h por dia</li>
                                    <li className="flex items-start gap-2">✓ Equipe médica multidisciplinar</li>
                                    <li className="flex items-start gap-2">✓ Sem filas e sem burocracia</li>
                                    <li className="flex items-start gap-2">✓ Atendimento para toda a família</li>
                                </ul>
                            </div>
                        </div>

                        {/* Pilar Crédito */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                            <img 
                                src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600" 
                                alt="Imagem representando recuperação de crédito" 
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-10 h-10 bg-verde rounded-full flex items-center justify-center text-white text-xl">💳</span>
                                    <h3 className="text-xl font-bold">Crédito (GD Finance)</h3>
                                </div>
                                <ul className="space-y-2 text-gray-600 text-sm">
                                    <li className="flex items-start gap-2">✓ Consultoria para limpar o nome</li>
                                    <li className="flex items-start gap-2">✓ Aumento de score de crédito</li>
                                    <li className="flex items-start gap-2">✓ Negociação com credores</li>
                                    <li className="flex items-start gap-2">✓ Acesso a novas linhas de crédito</li>
                                </ul>
                            </div>
                        </div>

                        {/* Pilar Energia */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                            <img 
                                src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=600" 
                                alt="Imagem representando economia de energia" 
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl">☀️</span>
                                    <h3 className="text-xl font-bold">Energia (Economia Real)</h3>
                                </div>
                                <ul className="space-y-2 text-gray-600 text-sm">
                                    <li className="flex items-start gap-2">✓ Redução de até 18% na conta de luz</li>
                                    <li className="flex items-start gap-2">✓ Sem instalação de painéis solares</li>
                                    <li className="flex items-start gap-2">✓ Tecnologia sustentável e acessível</li>
                                    <li className="flex items-start gap-2">✓ Economia imediata desde o primeiro mês</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== SEÇÃO MOTOR DE RENDA ==================== */}
            <section className="py-16 md:py-20 bg-gradient-to-r from-azul to-blue-700 text-white">
                <div className="container mx-auto px-4 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Motor de Renda Extra</h2>
                    <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-12">
                        No Clube do Seu Bolso, cada serviço que você usa gera pontos e comissões. Ao indicar amigos, você constrói uma renda recorrente.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                            <div className="text-4xl font-extrabold text-verde mb-2">10% a 20%</div>
                            <p className="text-lg font-semibold">Comissão Direta</p>
                            <p className="text-blue-100 mt-2 text-sm">Ganhe sobre cada ativação de novos membros.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                            <div className="text-4xl font-extrabold text-verde mb-2">Renda Indireta</div>
                            <p className="text-lg font-semibold">Rede de Afiliados</p>
                            <p className="text-blue-100 mt-2 text-sm">Receba sobre o crescimento da sua rede.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                            <div className="text-4xl font-extrabold text-verde mb-2">Sem Estoque</div>
                            <p className="text-lg font-semibold">Produtos Essenciais</p>
                            <p className="text-blue-100 mt-2 text-sm">Você vende serviços que todo brasileiro já consome.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== TABELA DE PREÇOS ==================== */}
            <section id="planos" className="py-16 md:py-20 bg-white">
                <div className="container mx-auto px-4 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">Escolha seu plano</h2>
                    <p className="text-center text-gray-600 max-w-xl mx-auto mb-12">Invista em você e sua família. Comece hoje mesmo.</p>
                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        {/* Assinatura Mensal */}
                        <div className="border-2 border-azul rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all relative flex flex-col justify-between">
                            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-verde text-white text-xs font-bold px-4 py-1 rounded-full">
                                MAIS VANTAGEM
                            </span>
                            <div>
                                <h3 className="text-2xl font-bold text-center mt-2">Assinatura Mensal</h3>
                                <p className="text-center text-gray-500 mt-2 text-sm">Acesso completo a todos os pilares</p>
                                <div className="text-center my-6">
                                    <span className="text-5xl font-extrabold text-azul">R$ 49,90</span>
                                    <span className="text-gray-500">/mês</span>
                                </div>
                                <ul className="space-y-3 text-gray-600 mb-8 text-sm">
                                    <li className="flex items-center gap-2">✓ Telemedicina 24h</li>
                                    <li className="flex items-center gap-2">✓ Consultoria de crédito</li>
                                    <li className="flex items-center gap-2">✓ Cashback em energia</li>
                                    <li className="flex items-center gap-2">✓ Comissões de indicação</li>
                                    <li className="flex items-center gap-2">✓ Suporte prioritário</li>
                                </ul>
                            </div>
                             <Link 
                                 to="/checkout?buy=d3b07384-d113-4171-bc03-9a7c936df312"
                                 className="block w-full bg-verde text-white font-bold text-center py-4 rounded-xl hover:bg-verde-dark transition-all shadow-md"
                             >
                                 QUERO ASSINAR
                             </Link>
                        </div>

                        {/* Ativação Única */}
                        <div className="border-2 border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-center">Ativação Única</h3>
                                <p className="text-center text-gray-500 mt-2 text-sm">Licença permanente de afiliado</p>
                                <div className="text-center my-6">
                                    <span className="text-5xl font-extrabold text-gray-800">R$ 197</span>
                                    <span className="text-gray-500">/único</span>
                                </div>
                                <ul className="space-y-3 text-gray-600 mb-8 text-sm">
                                    <li className="flex items-center gap-2">✓ Acesso à plataforma de afiliados</li>
                                    <li className="flex items-center gap-2">✓ Comissões ilimitadas</li>
                                    <li className="flex items-center gap-2">✓ Materiais de venda</li>
                                    <li className="flex items-center gap-2">✓ Suporte por e-mail</li>
                                    <li className="flex items-center gap-2">✓ Sem mensalidade</li>
                                </ul>
                            </div>
                             <Link 
                                 to="/checkout?buy=d3b07384-d113-4171-bc05-9a7c936df312"
                                 className="block w-full bg-gray-800 text-white font-bold text-center py-4 rounded-xl hover:bg-gray-900 transition-all shadow-md"
                             >
                                 QUERO ATIVAR
                             </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== FAQ (Acordeão) ==================== */}
            <section id="faq" className="bg-gelo py-16 md:py-20">
                <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">Dúvidas Frequentes</h2>
                    <p className="text-center text-gray-600 mb-10">Tire suas principais dúvidas antes de começar.</p>

                    <div className="space-y-4">
                        <details className="faq-item bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <summary className="font-semibold text-lg">Como funciona a Telemedicina?</summary>
                            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                                Ao assinar o plano, você recebe acesso a uma plataforma onde pode agendar consultas online com clínicos gerais, pediatras, ginecologistas e outras especialidades. O atendimento é feito por videochamada, sem filas e com custo zero para o plano mensal.
                            </p>
                        </details>
                        <details className="faq-item bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <summary className="font-semibold text-lg">Como posso recuperar meu crédito?</summary>
                            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                                Nossa consultoria financeira GD Finance analisa seu CPF, identifica pendências e negocia com credores para reduzir juros e multas. Você recebe um plano personalizado para limpar o nome e aumentar seu score.
                            </p>
                        </details>
                        <details className="faq-item bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <summary className="font-semibold text-lg">A economia de energia é garantida?</summary>
                            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                                Sim. Através de tecnologia de gestão de consumo, você reduz sua conta de luz em até 18% sem instalar painéis solares. O resultado aparece já na primeira fatura após a ativação.
                            </p>
                        </details>
                        <details className="faq-item bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <summary className="font-semibold text-lg">Quanto posso ganhar indicando?</summary>
                            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                                Você ganha de 10% a 20% sobre cada ativação de novos membros que vierem pelo seu link. Além disso, recebe bonificações sobre as vendas indiretas da sua rede. Não há limite de ganhos.
                            </p>
                        </details>
                        <details className="faq-item bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <summary className="font-semibold text-lg">Preciso ter conhecimento técnico para vender?</summary>
                            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                                Não. Disponibilizamos material de apoio, links de afiliado e uma central de suporte. Basta compartilhar seu link e os serviços se vendem sozinhos.
                            </p>
                        </details>
                    </div>
                </div>
            </section>

            {/* ==================== FOOTER ==================== */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="container mx-auto px-4 lg:px-8 grid md:grid-cols-4 gap-8">
                    <div>
                        {/* Logo brightness-0 invert fits background */}
                        <img 
                            src="/assets/logo.png" 
                            alt="Clube do Seu Bolso" 
                            className="h-10 w-auto brightness-0 invert mb-4"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                        <span className="text-white font-extrabold text-lg block mb-2">Clube do Seu Bolso</span>
                        <p className="text-sm text-gray-400">O Hub de Sobrevivência Financeira que transforma seus gastos em renda.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Links</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
                            <li><a href="#servicos" className="hover:text-white transition-colors">Serviços</a></li>
                            <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                            <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Ajuda</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Contato</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>suporte@clubedoseubolso.com.br</li>
                            <li>(11) 99999-8888</li>
                            <li>@clubedoseubolso</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
                    &copy; 2026 Clube do Seu Bolso. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
};

export default HomePageTest;
