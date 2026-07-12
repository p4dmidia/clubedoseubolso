import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, FileText } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb / Back button */}
        <div className="mb-8 text-left">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#2980B9] font-black text-xs uppercase tracking-widest transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para a Home
          </Link>
        </div>

        {/* Page Title & Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="w-16 h-16 bg-[#2980B9]/10 rounded-2xl flex items-center justify-center mx-auto text-[#2980B9] shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#0B1221] tracking-tight uppercase">Política de Privacidade</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Proteção de Dados e Conformidade LGPD</p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 p-8 md:p-16 border border-slate-100/80 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#2980B9]"></div>
          
          <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed text-sm md:text-base font-medium">
            <p className="bg-slate-50 border border-slate-100 p-6 rounded-2xl text-[#0B1221] font-bold text-xs uppercase tracking-wider leading-relaxed">
              O <strong className="text-[#2980B9]">Clube do Seu Bolso</strong> valoriza a sua privacidade. Esta política de privacidade explica como coletamos, usamos, compartilhamos e protegemos seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Ao utilizar nossa plataforma, você concorda com as práticas descritas nesta política.
            </p>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">1</span>
                COLETA DE DADOS PESSOAIS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p>Nós coletamos informações pessoais que você nos fornece diretamente ao interagir com a nossa plataforma. Esses dados podem incluir:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Dados de Identificação:</strong> Nome completo, CPF, e-mail, telefone, data de nascimento e gênero.</li>
                  <li><strong>Dados de Endereço:</strong> CEP, rua, número, complemento, bairro, cidade e estado (necessários para a emissão de faturas e ativação de serviços de telemedicina).</li>
                  <li><strong>Dados Financeiros:</strong> Informações sobre transações financeiras e pagamentos, processados de forma segura por nossos parceiros integrados (Asaas).</li>
                  <li><strong>Dados de Acesso:</strong> Credenciais de login (e-mail e senha criptografados), endereço IP e dados de navegação na plataforma.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">2</span>
                FINALIDADE DO TRATAMENTO DE DADOS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p>Os dados coletados são utilizados para finalidades específicas e legítimas, que incluem:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Prestação dos Serviços:</strong> Processamento de pedidos, ativação do seu plano de telemedicina contratado junto à rede parceira e liberação do acesso à plataforma.</li>
                  <li><strong>Processamento de Pagamento:</strong> Envio de dados necessários para o gateway de pagamento Asaas para viabilizar a cobrança por cartão de crédito, boleto ou Pix.</li>
                  <li><strong>Gestão de Afiliados:</strong> Controle da rede de indicações, cálculo e pagamento de comissões aos afiliados qualificados.</li>
                  <li><strong>Comunicação:</strong> Envio de notificações sobre transações (confirmação de pagamento), atualizações de serviços, suporte técnico e mensagens importantes de segurança via e-mail ou WhatsApp.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">3</span>
                COMPARTILHAMENTO DE DADOS COM TERCEIROS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p>Nós não vendemos ou alugamos seus dados pessoais. O compartilhamento ocorre apenas quando estritamente necessário para a prestação do serviço e cumprimento de obrigações legais, conforme detalhado:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Gateway de Pagamento (Asaas):</strong> Dados cadastrais e de transação são transmitidos ao Asaas para viabilizar as transações financeiras e emissão de cobranças de forma segura.</li>
                  <li><strong>Provedores de Telemedicina (ANAS / Mais Unidos):</strong> Compartilhamos dados cadastrais mínimos (nome, CPF, e-mail, telefone, endereço) para a correta ativação do plano médico e sincronização de cadastro do paciente.</li>
                  <li><strong>Parceiros de Tecnologia:</strong> Provedores de hospedagem (como Supabase) e ferramentas de envio de mensagens para garantir o funcionamento técnico e a comunicação da plataforma.</li>
                  <li><strong>Obrigações Legais:</strong> Podemos compartilhar dados para cumprir determinações judiciais, investigações policiais ou regulamentações de órgãos competentes.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">4</span>
                SEGURANÇA E ARMAZENAMENTO DOS DADOS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p>Implementamos medidas de segurança técnicas e organizacionais de padrão de mercado para proteger as suas informações contra acessos não autorizados, alteração, divulgação ou destruição. Seus dados são armazenados em servidores criptografados e o tráfego de dados é feito sob protocolos seguros de transferência (HTTPS/SSL).</p>
                <p>Suas senhas são criptografadas utilizando algoritmos de hash seguros (Bcrypt/Argon2) antes do salvamento no banco de dados, de modo que nenhum funcionário ou administrador do site tem acesso a elas em texto limpo.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">5</span>
                DIREITOS DOS TITULARES DE DADOS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p>Conforme previsto na LGPD, você, na qualidade de titular de dados pessoais, tem o direito de solicitar a qualquer momento:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Confirmação da existência de tratamento dos seus dados.</li>
                  <li>Acesso gratuito e fácil às informações que armazenamos sobre você.</li>
                  <li>Correção de dados incompletos, inexatos ou desatualizados (disponível diretamente no painel de configurações do usuário).</li>
                  <li>Eliminação ou anonimização de dados desnecessários ou tratados em desconformidade com a lei.</li>
                  <li>Revogação do consentimento para tratamento de dados futuros, ciente de que isso poderá inviabilizar a prestação de alguns serviços (como a telemedicina).</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">6</span>
                CONTATO E SOLICITAÇÕES
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p>Para exercer quaisquer dos seus direitos de titular de dados ou esclarecer dúvidas sobre esta Política de Privacidade, por favor entre em contato com nosso Encarregado de Proteção de Dados (DPO) através do canal de atendimento:</p>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-[#0B1221] text-xs">
                  E-mail: <a href="mailto:contato@clubedoseubolso.com.br" className="text-[#2980B9] hover:underline">contato@clubedoseubolso.com.br</a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
