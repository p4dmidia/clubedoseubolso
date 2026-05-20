import React from 'react';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ConsorcioTerms: React.FC = () => {
    return (
        <div className="bg-slate-50 min-h-screen font-sans pb-32">
            {/* Header Content for Terms (Simplified version of main header if needed, but since it's wrapped in AppLayout it gets the default header) */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb / Back Link */}
                    <div className="mb-8">
                        <Link to="/checkout" className="inline-flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-[#0B1221] transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            VOLTAR PARA O CHECKOUT
                        </Link>
                    </div>

                    {/* Main Content Box */}
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100">

                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 bg-[#2980B9]/10 rounded-2xl text-[#2980B9]">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-[#0B1221]">Contrato de Adesão e Regras do Consórcio</h1>
                                <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Clube do Seu Bolso Platinum</p>
                            </div>
                        </div>

                        <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-[#0B1221] prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-[#0B1221] prose-strong:font-black prose-li:text-slate-600">

                            <p className="text-lg font-medium text-slate-700 mb-8 border-l-4 border-[#2980B9] pl-4">
                                Este documento estabelece as condições gerais para participação nos grupos de consórcio administrados pela Clube do Seu Bolso Platinum. Leia com atenção antes de confirmar sua adesão.
                            </p>

                            <h3 className="text-xl mt-10 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="bg-[#0B1221] text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">1</span>
                                Do Objeto e Formação do Grupo
                            </h3>
                            <p>
                                1.1. O presente instrumento tem por objeto a formação de grupo de consórcio, constituído de pessoas físicas ou jurídicas, com a finalidade de propiciar a seus integrantes, de forma isonômica, a aquisição de bens móveis (produtos Clube do Seu Bolso) ou serviços, por meio de autofinanciamento.
                            </p>
                            <p>
                                1.2. O grupo será formado e administrado pela Clube do Seu Bolso Platinum, doravante denominada ADMINISTRADORA, que atuará como gestora dos recursos arrecadados.
                            </p>
                            <p>
                                1.3. O valor do crédito, o número de participantes (vagas), o prazo de duração (meses) e a taxa de administração variam conforme o plano escolhido no momento da adesão.
                            </p>

                            <h3 className="text-xl mt-10 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="bg-[#0B1221] text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">2</span>
                                Das Contribuições Mensais
                            </h3>
                            <p>
                                2.1. O CONSORCIADO obriga-se a pagar mensalmente as prestações estipuladas no momento da adesão, que englobam: fundo comum, taxa de administração e fundo de reserva (se aplicável).
                            </p>
                            <p>
                                2.2. O atraso no pagamento sujeitará o CONSORCIADO à perda do direito de participar dos sorteios e lances da respectiva assembleia, além de cobrança de multa e juros moratórios.
                            </p>

                            <h3 className="text-xl mt-10 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="bg-[#0B1221] text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">3</span>
                                Da Contemplação (Sorteios e Lances)
                            </h3>
                            <p>
                                3.1. A contemplação é a atribuição ao CONSORCIADO do crédito para a aquisição do bem ou serviço. Ela ocorrerá exclusivamente por meio de <strong>Sorteio</strong> ou <strong>Lance</strong>.
                            </p>
                            <p>
                                3.2. <strong>Sorteio:</strong> Todo CONSORCIADO em dia com suas obrigações financeiras concorre em igualdade de condições aos sorteios realizados nas assembleias mensais. O sorteio baseia-se nos resultados da Loteria Federal, conforme regra específica detalhada aos participantes.
                            </p>
                            <p>
                                3.3. <strong>Lance:</strong> É a oferta de valor antecipado pelo CONSORCIADO. O critério de desempate e escolha do lance vencedor será o maior percentual de amortização do saldo devedor.
                            </p>
                            <p>
                                3.4. A contemplação por lance somente será validada após a confirmação do efetivo pagamento do valor ofertado no prazo estipulado após a assembleia.
                            </p>

                            <h3 className="text-xl mt-10 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="bg-[#0B1221] text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">4</span>
                                Utilização do Crédito e Aquisição do Bem
                            </h3>
                            <p>
                                4.1. O CONSORCIADO contemplado terá o direito de utilizar o crédito para a compra de produtos disponíveis na plataforma Clube do Seu Bolso Platinum, limitados ao valor correspondente ao plano adquirido.
                            </p>
                            <p>
                                4.2. A liberação do crédito está condicionada à aprovação de garantias exigidas pela ADMINISTRADORA, visando assegurar os recebimentos futuros e proteger os interesses dos demais consorciados do grupo.
                            </p>

                            <h3 className="text-xl mt-10 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="bg-[#0B1221] text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">5</span>
                                Cancelamento e Desistência
                            </h3>
                            <p>
                                5.1. O CONSORCIADO poderá solicitar exclusão do grupo a qualquer momento, desde que não tenha sido contemplado e não tenha utilizado o crédito.
                            </p>
                            <p>
                                5.2. O participante excluído concorrerá a sorteios mensais específicos para devolução dos valores pagos ao fundo comum, deduzida multa rescisória por quebra de contrato, não havendo devolução imediata dos valores.
                            </p>

                            <h3 className="text-xl mt-10 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="bg-[#0B1221] text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">6</span>
                                Disposições Finais
                            </h3>
                            <p>
                                6.1. Ao prosseguir com a compra contendo um ou mais produtos da categoria "Consórcio", o cliente atesta que leu, compreendeu e está plenamente de acordo com todas as regras aqui dispostas.
                            </p>
                            <p>
                                6.2. Casos omissos neste resumo de regras seguirão a legislação brasileira vigente aplicável ao Sistema de Consórcios (Lei nº 11.795/2008 e circulares do Banco Central do Brasil).
                            </p>

                        </div>

                        {/* Agreement Confirmation Box (Visual only, actual functionality is in Checkout) */}
                        <div className="mt-12 bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#2980B9]/20 rounded-xl flex items-center justify-center text-[#2980B9] flex-shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#0B1221]">Aceite Final</p>
                                <p className="text-xs text-slate-500 mt-1">O aceite oficial deste termo ocorre na etapa final de pagamento (Checkout), ao marcar a caixa de seleção correspondente.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsorcioTerms;
