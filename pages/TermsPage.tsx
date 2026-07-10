import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, CheckCircle } from 'lucide-react';

const TermsPage: React.FC = () => {
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
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#0B1221] tracking-tight uppercase">Termos de Adesão</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Termo de Adesão ao Sistema Mais Unidos</p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 p-8 md:p-16 border border-slate-100/80 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#2980B9]"></div>
          
          <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed text-sm md:text-base font-medium">
            <p className="bg-slate-50 border border-slate-100 p-6 rounded-2xl text-[#0B1221] font-bold text-xs uppercase tracking-wider leading-relaxed">
              A empresa <strong className="text-[#2980B9]">ANAS- ASSOCIAÇÃO NACIONAL DE ASSISTÊNCIA AO CIDADÃO</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 13.349.864/0001-65, com sede na Av. Afrânio Peixoto nº 07, Praia Grande, Salvador- BA, CEP 40.720-690, doravante denominada “MAIS UNIDOS”, empresa jurídica de direito privado, expõe abaixo as cláusulas e condições de adesão dos produtos oferecidos. Leia com atenção e se concorda contrate e assinale digitalmente.
            </p>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">1</span>
                DO OBJETO DO TERMO
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>1.1.</strong> O objeto do presente termo consiste no acesso ao MAIS UNIDOS ao TITULAR e às demais pessoas identificadas por ele (no caso de benefício familiar), aqui denominadas “BENEFICIÁRIOS”, o qual é um meio de acesso aos serviços de telemedicina.</p>
                <p><strong>1.2.</strong> O presente contrato tem por objeto a adesão, pelo Titular e/ou seu(s) Dependente(s), ao Plano de Telemedicina MAIS UNIDOS conforme especificado no Termo de Adesão assinado pelo Titular.</p>
                <p><strong>1.3.</strong> A adesão será sempre efetivada pelo Titular por meio de uma das seguintes modalidades:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>1.4.</strong> Aceite digital ao presente contrato no primeiro acesso ao SITE ou APP.</li>
                  <li><strong>1.5.</strong> Poderá ocorrer o contato por telefone, mediante confirmação de dados, e leitura e aceite das condições previstas no presente contrato.</li>
                </ul>
                <p className="bg-amber-50 text-amber-800 border border-amber-100 p-4 rounded-xl font-bold text-xs uppercase tracking-wide mt-4">
                  <strong>⚠️ IMPORTANTE:</strong> O SISTEMA MAIS UNIDOS não é um plano de saúde e não oferece garantia de cobertura financeira de riscos de assistência médica, hospitalar ou odontológica, nem assegura benefícios em todos os serviços obrigatoriamente garantidos por planos de saúde, ficando as despesas decorrentes do seu uso às expensas exclusivas do titular, esclarecendo-se que todas as consultas e exames na rede credenciada serão pagos pelo “TITULAR” e/ou pelas “BENEFICIÁRIOS” diretamente à credenciada, assegurando-se apenas os descontos a seguir mencionados.
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">2</span>
                DO ACESSO A TELEMEDICINA E DOS DESCONTOS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>2.1.</strong> Ficam assegurados ao TITULAR e seus BENEFICIÁRIOS (quando contratado o plano familiar) acesso ao serviço de TELEMEDICINA.</p>
                <p><strong>2.2.</strong> A concessão de eventual política de descontos em outros serviços extensíveis por mera liberalidade, fica condicionada a adimplência das mensalidades e apresentação de algum documento que contenha foto e CPF, no momento do atendimento. Não poderá haver débitos anteriores, caso haja deverá ser regularizado com anterioridade.</p>
                <p><strong>2.3.</strong> Descontos nos serviços de atendimentos presenciais nas clinicas indicadas da MAIS UNIDOS disponível no APP.</p>
                <p><strong>2.4.</strong> Os preços concedidos pela rede credenciada e parceiros poderão ser diferentes de acordo com as modalidades de produtos oferecidos pelas credenciadas e parceiros, observando suas respectivas políticas de privacidade.</p>
                <p><strong>2.5.</strong> Os serviços e a rede credenciada que integram a MAIS UNIDOS poderão sofrer alterações, sendo retirados de circulação ou substituídos a qualquer momento, podendo o titular cancelar sua adesão em virtude de tais alterações, sem prejuízo do adimplemento, pelo titular, das obrigações previstas neste contrato que estejam pendentes.</p>
                <p><strong>2.6.</strong> O sistema MAIS UNIDOS não se responsabiliza pela qualidade dos serviços prestados e nem pelos horários e/ou disponibilidade das “CREDENCIADAS”.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">3</span>
                DESCRIÇÃO E CONDIÇÕES DO SERVIÇO DE TELECONSULTA
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>3.1.</strong> O serviço de Teleconsulta oferece atendimento médico remoto, por meio de chamada de vídeo, acessível por dispositivos móveis ou computador. Este atendimento será realizado sem custos adicionais para consultas de pronto atendimento virtual ou consultas encaminhadas pela plataforma para especialidades médicas, mediante agendamento para atendimento na plataforma.</p>
                <p><strong>3.2.</strong> O cliente, ao optar por um atendimento imediato ou agendado, será atendido por um médico clínico geral, que avaliará o seu caso. Caso necessário, o médico poderá encaminhar ou agendar uma consulta com o especialista apropriado e prescrever outros procedimentos.</p>
                <p><strong>3.3.</strong> As consultas com clinico geral são ilimitadas, podendo serem realizadas 24 horas por dia, sete dias por semana. Ao término da consulta, o paciente receberá a prescrição realizada pelo médico, que pode incluir a recomendação de medicamentos, solicitação de exames ou atestado médico digital, caso seja necessário. Observação: Este serviço é exclusivamente para atendimento remoto.</p>
                <p><strong>3.4.</strong> Limite de Uso: As consultas com Nutricionista, Psicólogo e Neurologista, são limitadas a uma vez (1x) por mês. Para mais consultas o contratante poderá conseguir por contratação adicional. Neste caso deverá entrar em contato com a MAIS UNIDOS para verificar o valor e disponibilidade.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">4</span>
                BENEFÍCIOS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>4.1.</strong> Telemedicina, com atendimento Clínico Geral 24h, e 7 dias por semana. Além de diversas áreas médicas para atendimento por encaminhamento na plataforma, sem custo adicional. As áreas de especialidades, assim como o número delas, estão sujeitas a alteração conforme disponibilidade medica.</p>
                <p><strong>4.2.</strong> Não estarão inclusas consultas presenciais, mas os assinantes do serviço terão descontos nos serviços presenciais prestados pela MAIS UNIDOS.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">5</span>
                EXCLUSÕES
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>5.1.</strong> Não estão previstos custos para exames solicitados durante a teleconsulta;</p>
                <p><strong>5.2.</strong> A realização de exames médicos não está contemplada durante a consulta. Caso exames sejam solicitados, os custos serão de responsabilidade do titular ou beneficiário.</p>
                <p><strong>5.3.</strong> As consultas serão realizadas de acordo com o fluxo de atendimento da plataforma.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">6</span>
                INCLUSÃO DEPENDENTES
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>6.1.</strong> O Titular poderá inserir por meio do aplicativo MAIS UNIDOS até 05 (cinco) dependentes para atendimento em telemedicina, para os planos familiares.</p>
                <p><strong>6.2.</strong> O Titular representará o(s) Dependente(s) perante este contrato e assumirá total responsabilidade pelas informações e autorizações que vier a fornecer.</p>
                <p><strong>6.3.</strong> A adesão ao SISTEMA MAIS UNIDOS é efetivada pelo “TITULAR” por meio de preenchimento do formulário existente no site www.clubedoseubolso.com.br, onde serão indicados o(a)(s) BENEFICIÁRIO(A)(S) (no caso de plano familiar), e por ele digitalmente aceito.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">7</span>
                DA SUBSTITUIÇÃO DO TITULAR OU DEPENDENTES
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>7.1.</strong> A morte do “TITULAR” ou de quaisquer “BENEFICIÁRIOS” no período de vigência contratual dará direito à substituição mediante termo formal a ser assinado por quaisquer “BENEFICIÁRIOS” no caso do falecimento do “TITULAR” e por este em caso de morte de quaisquer das pessoas “BENEFICIÁRIOS”.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">8</span>
                DO PLANO CONTRATADO E SUAS COBERTURAS
              </h2>
              <div className="space-y-4 pl-11 text-slate-600 text-sm">
                <p><strong>8.1.</strong> No sistema MAIS UNIDOS você escolhe o plano que melhor atende suas necessidades. A escolha é realizada na contratação em nosso site ou APP, conforme segue abaixo:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-[#0B1221] text-xs uppercase tracking-wider mb-2 text-[#2980B9]">Plano Individual Essencial</h4>
                    <p className="text-[11px] leading-relaxed">Plano para uso individual e contempla consulta médica com clinico geral 24 horas.</p>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-[#0B1221] text-xs uppercase tracking-wider mb-2 text-[#2980B9]">Plano Individual Premium</h4>
                    <p className="text-[11px] leading-relaxed">Plano para uso individual e contempla consulta médica com clinico geral 24 horas e ainda conta com 17 especialidades médicas, com agendamento direto na plataforma.</p>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-[#0B1221] text-xs uppercase tracking-wider mb-2 text-[#2980B9]">Plano Familiar Essencial</h4>
                    <p className="text-[11px] leading-relaxed">Plano para uso familiar e contempla consulta médica com clinico geral 24 horas para 01 titular + 05 dependentes de livre escolha - sem comprovação de parentesco.</p>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-[#0B1221] text-xs uppercase tracking-wider mb-2 text-[#2980B9]">Plano Familiar Premium</h4>
                    <p className="text-[11px] leading-relaxed">Plano para uso familiar e contempla consulta médica com clinico geral 24 horas e 17 especialidades médicas agendadas para 01 titular + 05 dependentes de livre escolha - sem comprovação de parentesco.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">9</span>
                DA MENSALIDADE, REAJUSTE E MORA
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>9.1.</strong> Caberá ao TITULAR o pagamento mensal, descrito no formulário pré-preenchido em cartão de crédito, PIX recorrente ou boleto bancário recorrente em transação a ser realizada no momento do aceite deste instrumento.</p>
                <p><strong>9.2.</strong> Poderá ocorrer reajuste do valor da mensalidade a cada doze meses de vigência do contrato, mediante aplicação do índice IGPM acumulado no respectivo período, ou outro índice oficial que venha substituí-lo, ou no caso de alteração da ordem econômica que atinja diretamente a prestação deste serviço.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">10</span>
                DA VIGÊNCIA E RENOVAÇÃO DO CONTRATO
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>10.1.</strong> A vigência do presente contrato é sempre de 1 (um) ano contado da data do aceite deste termo e as renovações serão automáticas, por períodos iguais e sucessivos também de 1 (um) ano, mediante o mesmo molde de pagamento anterior reajustado na forma prevista neste instrumento até o dia de seu vencimento, sob pena de se tê-lo como vencido e não renovado, independentemente de qualquer aviso.</p>
                <p><strong>10.2.</strong> Caso haja mudança do número do cartão de crédito utilizado, o TITULAR, responsável pelo pagamento, deverá atualizar junto ao administrativo MAIS UNIDOS para evitar a suspensão dos benefícios.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">11</span>
                DOS ANEXOS DESCRITIVOS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>11.1.</strong> Todos os serviços e seguros disponibilizados conforme plano contrato será fornecido o ANEXO DESCRITIVO, contendo suas informações de coberturas e formas de utilização, como também ficara à disposição do Titular as condições gerais referente aos seguros contratados. Desta forma, deixando claro toda e qualquer informação dos serviços e seguros ofertados.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">12</span>
                PREÇO E CONDIÇÕES DE PAGAMENTO
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>12.1.</strong> Pela adesão caberá ao Titular pagar a ANAS- ASSOCIAÇÃO NACIONAL DE ASSISTÊNCIA AO CIDADÃO (MAIS UNIDOS).</p>
                <p><strong>12.2.</strong> A Mensalidade, conforme valor previsto em política vigente no momento da adesão.</p>
                <p><strong>12.3.</strong> O pagamento da Taxa de Adesão e da Mensalidade deverá ser efetuado pelo Titular na forma prevista conforme escolha no momento da adesão, disponível no momento da contratação.</p>
                <p><strong>12.4.</strong> Os valores da Taxa de Adesão e da Mensalidade poderão ser reajustados no mês de aniversário do contrato, a cada ano, de acordo com a variação positiva do IPCA e podendo haver revisão em caso de aumento de custos operacionais, tributários ou de parceiros.</p>
                <p><strong>12.5.</strong> A falta de pagamento tempestivo da Taxa de Adesão e/ou Mensalidade sujeitará o Titular:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>12.6.</strong> Ao pagamento das penalidades previstas no termo, a contar da data de vencimento até o efetivo pagamento; e</li>
                  <li><strong>12.7.</strong> Se, por prazo superior a 3 (três) dias, a ANAS poderá, a seu exclusivo critério, (I) realizar a cobrança extrajudicial ou judicial do débito, (II) suspender o acesso do Titular e seu(s) Dependente(s) aos benefícios até a regularização da situação, assim como (III) cancelar a cobertura de eventual seguro contratado, nos termos da apólice.</li>
                  <li><strong>12.8.</strong> Se, por prazo superior a 30 (trinta) dias, a ANAS se reserva o direito de tomar as medidas cabíveis, inclusive, mediante o envio de notificação prévia de inclusão do nome do devedor nos serviços de proteção ao crédito.</li>
                </ul>
                <p><strong>12.9.</strong> O Titular declara ciência de que o valor da Mensalidade foi definido através da composição de algumas premissas, as quais poderão sofrer modificações ao longo do prazo deste Contrato in virtude de alterações regulatórias, tributárias ou de mercado.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">13</span>
                RESPONSABILIDADE DA MAIS UNIDOS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>13.1.</strong> A ANAS- ASSOCIAÇÃO NACIONAL DE ASSISTÊNCIA AO CIDADÃO isenta-se de responsabilidade pelo uso de informações cadastrais inexatas ou inverídicas prestadas pelo Titular.</p>
                <p><strong>13.2.</strong> O Titular se responsabiliza pela correção e completude do endereço fornecido, bem como pela comunicação da alteração de qualquer dado pessoal.</p>
                <p><strong>13.3.</strong> Na hipótese do fornecimento de endereço incompleto ou incorreto, ou do não cumprimento da obrigação de informar eventual alteração ocorrida, fica o Titular ciente, desde já, que todos os materiais/correspondências enviados para o endereço fornecido serão considerados como efetivamente recebidos e que a interrupção dos pagamentos configurará inadimplência injustificada.</p>
                <p><strong>13.4.</strong> Na hipótese do fornecimento de informações erradas ou incompletas de endereços eletrônicos, contatos telefônicos, Whatsapp e quaisquer outros dados pessoais solicitados no ato do cadastro, a ANAS não se responsabilizará por eventuais falhas no atendimento ou entrega de serviços em decorrência de dados incorretos ou incompletos fornecidos pelo usuário.</p>
                <p><strong>13.5.</strong> A ANAS- ASSOCIAÇÃO NACIONAL DE ASSISTÊNCIA AO CIDADÃO esclarece que não é companhia de seguro, tampouco operadora de plano de saúde, de modo que a responsabilidade pelo fornecimento dos produtos e pela prestação dos serviços cabe à rede credenciada.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">14</span>
                VIGÊNCIA E RESCISÃO
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>14.1.</strong> Este contrato tem validade a partir da data de sua assinatura e vigorará pelo prazo previsto 12 meses, com renovação automática por prazo indeterminado ao término do referido período em caso de ausência de manifestação de qualquer das partes em sentido contrário.</p>
                <p><strong>14.2.</strong> Em qualquer momento, o Titular poderá solicitar a rescisão del presente contrato pela Central de Relacionamento da ANAS- ASSOCIAÇÃO NACIONAL DE ASSISTÊNCIA AO CIDADÃO, desde que seja comunicado com 30 dias de antecedência.</p>
                <p><strong>14.3.</strong> O titular fica ciente que o seu desligamento do plano de benefícios não o exime da obrigação de pagar integralmente as taxas e mensalidades já vencidas, isentando-se apenas de taxas e parcelas vincendas.</p>
                <p><strong>14.4.</strong> Após a solicitação da rescisão do contrato, o titular e respectivo(s) Dependente(s) serão automaticamente excluídos da base de dados e não poderão mais fazer uso do plano de benefícios.</p>
                <p><strong>14.5.</strong> A ANAS se reserva o direito de tomar as medidas cabíveis na hipótese de utilização indevida dos benefícios, após a solicitação da rescisão do contrato, pelo Titular ou por seu(s) Dependente(s).</p>
                <p><strong>14.6.</strong> O desligamento do Titular e de seu(s) Dependente(s) ficará condicionado ao pagamento do previsto neste termo. Caso o valor já pago pelo Titular ultrapasse as 06 (seis) mensalidades exigidas, não haverá incidência de qualquer cobrança.</p>
                <p><strong>14.7.</strong> Caso não haja o pagamento mínimo de 06 (seis) mensalidades, conforme estabelecido neste termo, o presente contrato não será considerado rescindido para todos os fins e o Titular ficará obrigado ao pagamento do saldo remanescente, equivalente à diferença entre o valor efetivamente pago e o valor de 06 (seis) mensalidades, no prazo de 30 (trinta) dias.</p>
                <p><strong>14.8.</strong> Em nenhuma hipótese haverá devolução de parcelas já pagas, face aos custos de disponibilidade dos serviços.</p>
                <p><strong>14.9.</strong> A retirada do pagamento das mensalidades do débito, no pix automático ou cartão de crédito, quando não autorizada, não desobriga o Titular quanto ao pagamento dos valores devidos. O meio de pagamento pode mudar conforme política interna.</p>
                <p><strong>14.10.</strong> Em caso de pagamento do débito por fatura de cartão de crédito ou Pix automático, após a solicitação de rescisão deste contrato, a cobrança de mensalidades já lançadas e/ou faturadas pelas operadoras de cartão de crédito não será reembolsada.</p>
                <p><strong>14.11.</strong> Em caso de falecimento do Titular, o(s) Dependente(s) obriga(m)-se dentro de 30 (trinta) dias do evento, a comunicar o fato a ANAS, requerendo a rescisão contratual. Caso não adote(m) tal procedimento, o contrato continuará ativo e gerando cobranças automáticas sob responsabilidade dos dependentes.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">15</span>
                DAS DISPOSIÇÕES GERAIS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p className="bg-slate-50 border border-slate-150 p-4 rounded-xl font-black text-[10px] uppercase text-[#0B1221] tracking-wider leading-relaxed">
                  AO ACEITAR O PRESENTE CONTRATO, O TITULAR DECLARA EXPRESSAMENTE QUE ESTÁ CIENTE E CONCORDA COM OS TERMOS E CONDIÇÕES GERAIS DE USO DA PLATAFORMA CLUBE DO SEU BOLSO, INCLUSIVE COM O PRESENTE TERMO DE ADESÃO.
                </p>
                <p><strong>15.1.</strong> Objeto: Adesão, pelo Titular e/ou seu(s) Dependente(s), ao Plano de TELEMEDICINA MAIS UNIDOS, administrado pela ANAS, com sede na cidade de SALVADOR-BAHIA, comercializado na função de administrador de serviços vinculados ao referido plano.</p>
                <p><strong>15.2.</strong> Tabelas de Preços especiais junto à Rede Credenciada;</p>
                <p><strong>15.3.</strong> Benefícios Adicionais.</p>
                <p><strong>15.4.</strong> Taxa de Adesão: Conforme política vigente no momento da adesão.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">16</span>
                ESCLARECIMENTOS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>16.1.</strong> O valor pago no ato da contratação refere-se exclusivamente à Taxa de Adesão, de natureza administrativa, não sendo considerado como pagamento da primeira mensalidade do plano contratado.</p>
                <p><strong>16.2.</strong> Mensalidade: Conforme condições vigentes no momento da contratação.</p>
                <p><strong>16.3.</strong> Atualização da Mensalidade: Conforme prevê o termo, o valor da Mensalidade será atualizado no mês de aniversário do Contrato, a cada ano, de acordo com a variação positiva do IPCA e podendo haver revisão em caso de aumento de custos operacionais, tributários ou de parceiros.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">17</span>
                FORMA DE PAGAMENTO
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>17.1.</strong> Taxa de Adesão: Parcela única ou com a primeira mensalidade de acordo com a forma de pagamento escolhida pelo Titular.</p>
                <p><strong>17.2.</strong> Pagamento das mensalidades: O Titular autoriza o débito das mensalidades recorrentes através de Pix automático ou cartão de crédito.</p>
                <p><strong>17.3.</strong> Pagamento com lançamento na fatura de cartão de crédito ou Pix automático: O titular autoriza a instituição financeira e/ou a administradora do cartão de crédito a debitar o valor referente à mensalidade do produto contratado, sob a rubrica da ANAS- ASSOCIAÇÃO NACIONAL DE ASSISTÊNCIA AO CIDADÃO (MAIS UNIDOS).</p>
                <p><strong>17.4.</strong> Pagamento à vista: Do valor total relativo aos 12 (doze) meses de vigência do contrato via cartão de crédito ou PIX.</p>
                <p><strong>17.5.</strong> Os valores dos serviços têm como base a tabela de honorários dos órgãos de classe, de acordo com os benefícios contratados com a ANAS.</p>
                <p><strong>17.6.</strong> Quaisquer pagamentos por serviços prestados junto à rede credenciada são de inteira responsabilidade do Titular, sendo efetuados diretamente ao estabelecimento.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">18</span>
                CONDIÇÕES COMERCIAIS
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>18.1.</strong> Penalidades por Atraso do Pagamento: Juros de mora de 1% (um por cento) ao mês, pro rata die, entre a data do vencimento e a data do efetivo pagamento. Correção monetária de acordo com a variação positiva do IPCA. Multa de 2% (dois por cento) sobre o débito atualizado.</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">19</span>
                COMUNICAÇÃO ENTRE AS PARTES
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>19.1.</strong> Através de e-mail (conforme cadastro), push via APP ou mensagens de WhatsApp.</p>
                <p><strong>19.2.</strong> A alteração, decretação de nulidade ou anulabilidade de uma ou de algumas cláusulas do presente contrato, não implica na invalidade ou inexigibilidade das demais que não serão afetadas.</p>
                <p><strong>19.3.</strong> Serão responsáveis pelo cumprimento desse contrato, ambos os contratantes ou seus sucessores.</p>
                <p><strong>19.4.</strong> A responsabilidade da telemedicina fica a cargo da ANAS- ASSOCIAÇÃO NACIONAL DE ASSISTÊNCIA AO CIDADÃO (MAIS UNIDOS).</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">20</span>
                ANEXOS E DESCRITIVOS (COMO USAR A TELEMEDICINA)
              </h2>
              <div className="space-y-4 pl-11 text-slate-600 text-sm">
                <p className="bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed space-y-4">
                  <span><strong>COMO REALIZAR CONSULTAS:</strong></span>
                  <br /><br />
                  Após a contratação, acesse seu APP, clique no botão <strong>Telemedicina</strong>. Para realizar o atendimento, clique no botão <strong>CONSULTA</strong>. Quando acessar, terá a opção de adicionar documentos ou imagens (como resultado de exames, encaminhamentos, etc.) que serão úteis para o profissional durante a consulta. Formatos aceitos: JPG, PNG, PDF. 
                  <br /><br />
                  Clique no botão <strong>Selecionar Arquivo</strong>. Após a inclusão (caso haja), basta clicar no botão <strong>Criar ATENDIMENTO</strong>, ativar câmera e microfone (liberar no navegador/app) e clicar no botão <strong>Continuar</strong>. O atendimento se iniciará e você ficará na fila de espera, mostrando sua posição. Quando chegar sua vez, a atendente fará a triagem (perguntas necessárias) para encaminhar ao médico clínico geral.
                  <br /><br />
                  Se no atendimento o médico achar necessário emitir algum documento como Receitas, Solicitação de Exames ou Atestado Médico, este será disponibilizado via SMS e também ficará disponível dentro da plataforma de Telemedicina no menu <strong>ATENDIMENTOS</strong>.
                </p>
                
                <p className="bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed">
                  <span><strong>ESPECIALIDADES MÉDICAS (CONSULTAS AGENDADAS):</strong></span>
                  <br /><br />
                  Caso necessite atendimento para uma especialidade médica, o paciente deverá passar primeiro pela consulta com o médico clínico geral e solicitar a especialidade. O médico fornecerá o encaminhamento autorizando a especialidade solicitada. Com este encaminhamento, o paciente deverá acionar a central via WhatsApp (botão disponível dentro da plataforma de telemedicina) e solicitar o agendamento.
                  <br /><br />
                  A central definirá o melhor dia e horário com o paciente via WhatsApp. O agendamento será confirmado e o paciente será atendido em até 10 dias úteis. No botão <strong>AGENDAMENTOS</strong>, constará o link de acesso da consulta. Acesse o link com 10 minutos de antecedência.
                  <br /><br />
                  <strong>⚠️ FALTAR À CONSULTA:</strong> Caso não possa comparecer à consulta com o especialista, o usuário deve avisar com antecedência mínima de 24 horas. Se faltar sem avisar no prazo, perderá o direito à consulta agendada e terá uma carência de 60 (sessenta) dias para remarcar ou marcar nova consulta, independente da especialidade.
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-lg md:text-xl font-black text-[#0B1221] uppercase tracking-wide flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-[#2980B9]">21</span>
                FORO
              </h2>
              <div className="space-y-3 pl-11 text-slate-600 text-sm">
                <p><strong>21.1.</strong> Fica eleito o foro da comarca de Salvador-Bahia como o competente para dirimir quaisquer questões dele resultantes, ressalvados os casos previstos em lei.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
