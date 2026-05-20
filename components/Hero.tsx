
import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white py-12 lg:py-24">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 items-center gap-12">
        <div className="space-y-6 max-w-xl">
          <span className="inline-block bg-[#2980B9]/10 text-[#2980B9] text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
            Premium Lifestyle
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#0B1221] leading-[1.1]">
            Mais do que estilo, <br />
            <span className="text-[#2980B9]">é qualidade de vida!</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            Descubra o equilíbrio perfeito entre conforto, saúde e elegância com nossos produtos premium selecionados para você.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link to="/shop" className="bg-[#2980B9] hover:bg-[#f9b100] text-[#0B1221] font-black py-4 px-8 rounded-lg shadow-lg shadow-[#2980B9]/20 transition-all text-center">
              Ver Coleção 2024
            </Link>
            <Link to="/shop" className="border-2 border-slate-200 hover:border-[#2980B9] text-[#0B1221] font-black py-4 px-8 rounded-lg transition-all text-center">
              Assinaturas
            </Link>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-4 bg-[#2980B9]/5 rounded-full blur-3xl group-hover:bg-[#2980B9]/10 transition-colors"></div>
          <img
            src="/assets/colchao.jpg"
            alt="Colchão Premium"
            className="relative w-full h-auto object-contain rounded-2xl drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)]"
          />
          {/* Tag on Mattress Simulation */}
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm border border-slate-200 px-4 py-1 text-[10px] uppercase font-bold tracking-tighter text-slate-400">
            Premium Lifestyle 2024
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
