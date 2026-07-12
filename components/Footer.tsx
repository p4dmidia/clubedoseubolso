
import React from 'react';
import { Mail, Phone, MapPin, Share2, Globe, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <img src="/assets/logo.png" alt="Clube do Seu Bolso" className="h-16 w-auto" />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Hub de Serviços Digitais e Ecossistema de Afiliados. Conectando você a planos de saúde, economia de energia e crédito inteligente.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Compartilhar Clube do Seu Bolso" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#2980B9] transition-colors relative group">
                <Share2 className="w-5 h-5" />
                <span className="sr-only">Compartilhar</span>
              </a>
              <a href="https://instagram.com/clubedoseubolso" target="_blank" rel="noopener noreferrer" aria-label="Instagram do Clube do Seu Bolso" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#2980B9] transition-colors relative group">
                <Instagram className="w-5 h-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://clubedoseubolso.com.br" target="_blank" rel="noopener noreferrer" aria-label="Website do Clube do Seu Bolso" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#2980B9] transition-colors relative group">
                <Globe className="w-5 h-5" />
                <span className="sr-only">Website</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Serviços</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="/service/telemedicina" className="hover:text-[#2980B9] transition-colors">Telemedicina</a></li>
              <li><a href="/service/energia-assinatura" className="hover:text-[#2980B9] transition-colors">Energia por Assinatura</a></li>
              <li><a href="/service/estrategias-credito" className="hover:text-[#2980B9] transition-colors">Estratégias de Crédito</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Institucional</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-[#2980B9] transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-[#2980B9] transition-colors">Negócio Clube do Seu Bolso</a></li>
              <li><a href="/register?type=affiliate" className="hover:text-[#2980B9] transition-colors">Seja um Afiliado</a></li>
              <li><a href="/politica-de-privacidade" className="hover:text-[#2980B9] transition-colors">Política de Privacidade</a></li>
              <li><a href="/termos-de-uso" className="hover:text-[#2980B9] transition-colors">Termos de Uso</a></li>
            </ul>
          </div>
 
          <div>
            <h4 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Atendimento</h4>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#2980B9]" />
                contato@clubedoseubolso.com.br
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#2980B9]" />
                (71) 99977-2129
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#2980B9] shrink-0" />
                AVENIDA AFRANIO PEIXOTO, 7, CASA 7, PRAIA GRANDE<br />
                CEP: 40720690 - Salvador - BA
              </li>
            </ul>
            
            {/* WhatsApp Support Card */}
            <div className="mt-8 bg-[#2980B9] p-6 rounded-[2rem] shadow-xl shadow-blue-900/10 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full transition-transform group-hover:scale-150 duration-700"></div>
              
              <div className="relative z-10">
                <h5 className="text-white font-black text-lg mb-2">Central de Ajuda</h5>
                <p className="text-white/90 text-xs font-medium leading-relaxed mb-6">
                  Dúvidas sobre o sistema? Nossa equipe está pronta para te ajudar via WhatsApp.
                </p>
                <a 
                  href="https://api.whatsapp.com/send/?phone=5571999772129&text=Ol%C3%A1%2C+preciso+de+suporte%2C+pode+me+ajudar%3F&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white text-black text-center py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm animate-pulse-subtle"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Bar */}
        <div className="border-t border-slate-100 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-slate-500 text-xs">
            © 2026 Clube do Seu Bolso. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
