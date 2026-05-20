import React from 'react';
import { ArrowRight, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const ConsorcioSection: React.FC = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="bg-[#FFFBEB] rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
          <div className="space-y-8 flex-1">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#2980B9]" />
              <span className="text-[#2980B9] font-bold text-sm tracking-widest uppercase">Planejamento Financeiro</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B1221] leading-tight">
              Realize seus sonhos com o Consórcio Clube do Seu Bolso
            </h2>
            <p className="text-slate-600 text-lg max-w-lg">
              Adquira nossos colchões magnéticos premium e outros itens de alto valor com parcelas que cabem no seu bolso, sem juros abusivos.
            </p>
            <Link
              to="/consorcio"
              className="bg-[#0B1221] hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-lg flex items-center gap-3 transition-all inline-flex w-fit"
            >
              SIMULAR CONSÓRCIO
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="flex-1 relative flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 bg-[#2980B9] rounded-3xl -rotate-6 blur-2xl opacity-10"></div>
              <img
                src="/assets/logo.png"
                alt="Logo Clube do Seu Bolso"
                className="relative w-full h-auto object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsorcioSection;
