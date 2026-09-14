import React, { useState } from 'react';
import { ShoppingCart, Menu, X, Activity, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from './CartContext';
import CartDrawer from './CartDrawer';

const Header: React.FC = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-100">
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
          <img src="/assets/logo.png" alt="Clube do Seu Bolso" className="h-10 md:h-12 w-auto" />
          <span className="text-xl font-extrabold text-gray-900 tracking-tight lg:ml-2">
            Clube do <span className="text-[#2980B9]">Seu Bolso</span>
          </span>
        </Link>

        {/* Menu Desktop */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold text-gray-700">
          <a href="/#como-funciona" className="hover:text-[#2980B9] transition-colors">Como Funciona</a>
          <a href="/#servicos" className="hover:text-[#2980B9] transition-colors">Serviços</a>
          <a href="/#planos" className="hover:text-[#2980B9] transition-colors">Planos</a>
          <a href="/#faq" className="hover:text-[#2980B9] transition-colors">FAQ</a>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Cart Icon */}
          {!isHome && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-700 hover:text-[#2980B9] transition-colors focus:outline-none"
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Telemedicina Mais Unidos Login */}
          <a
            href="https://app.maisunidos.com.br/Conta/Entrar"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-[#2980B9] font-bold px-3.5 py-2 rounded-lg hover:bg-[#2980B9] hover:text-white transition-all text-xs lg:text-sm group shadow-sm"
            title="Acessar Telemedicina Mais Unidos"
          >
            <Activity className="w-4 h-4 text-[#2980B9] group-hover:text-white transition-colors" />
            <span className="hidden xl:inline">Telemedicina Mais Unidos</span>
            <span className="xl:hidden">Telemedicina</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Member Login (Secondary) */}
          <Link 
            to="/login" 
            className="hidden lg:inline-block border border-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-all text-sm"
          >
            Área do Membro
          </Link>

          {/* Seja Afiliado (Secondary outline) */}
          <Link 
            to="/register?type=affiliate" 
            className="hidden lg:inline-block border border-[#2980B9] text-[#2980B9] font-bold px-4 py-2.5 rounded-lg hover:bg-[#2980B9]/5 transition-all text-sm"
          >
            Quero ser Afiliado
          </Link>

          {/* Seja Cliente (Primary) */}
          <Link 
            to="/register?type=client" 
            className="hidden lg:inline-block bg-[#27AE60] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#1e8449] transition-all shadow-md text-sm"
          >
            Seja Cliente
          </Link>

          {/* Menu Mobile Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:text-[#2980B9] transition-colors focus:outline-none"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 text-sm font-semibold shadow-inner">
          <a 
            href="/#como-funciona" 
            onClick={() => setIsMenuOpen(false)} 
            className="block py-2 hover:text-[#2980B9]"
          >
            Como Funciona
          </a>
          <a 
            href="/#servicos" 
            onClick={() => setIsMenuOpen(false)} 
            className="block py-2 hover:text-[#2980B9]"
          >
            Serviços
          </a>
          <a 
            href="/#planos" 
            onClick={() => setIsMenuOpen(false)} 
            className="block py-2 hover:text-[#2980B9]"
          >
            Planos
          </a>
          <a 
            href="/#faq" 
            onClick={() => setIsMenuOpen(false)} 
            className="block py-2 hover:text-[#2980B9]"
          >
            FAQ
          </a>
          
          <div className="pt-2 space-y-2">
            <a 
              href="https://app.maisunidos.com.br/Conta/Entrar" 
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)} 
              className="flex items-center justify-center gap-2 bg-sky-50 border border-sky-200 text-[#2980B9] font-bold text-center px-4 py-2.5 rounded-lg hover:bg-[#2980B9] hover:text-white transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Telemedicina Mais Unidos</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
            <Link 
              to="/login" 
              onClick={() => setIsMenuOpen(false)} 
              className="block border border-slate-300 text-slate-700 font-bold text-center px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-all"
            >
              Área do Membro
            </Link>
            <Link 
              to="/register?type=affiliate" 
              onClick={() => setIsMenuOpen(false)} 
              className="block border border-[#2980B9] text-[#2980B9] font-bold text-center px-4 py-2.5 rounded-lg hover:bg-[#2980B9]/5 transition-all"
            >
              Quero ser Afiliado
            </Link>
            <Link 
              to="/register?type=client" 
              onClick={() => setIsMenuOpen(false)} 
              className="block bg-[#27AE60] text-white font-bold text-center px-4 py-2.5 rounded-lg hover:bg-[#1e8449] transition-all"
            >
              Seja Cliente
            </Link>
          </div>
        </div>
      )}
      <CartDrawer />
    </header>
  );
};

export default Header;
