import React, { useEffect, useRef } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer: React.FC = () => {
    const { 
        cart, 
        cartTotal, 
        isCartOpen, 
        setIsCartOpen, 
        updateQuantity, 
        removeFromCart 
    } = useCart();
    const navigate = useNavigate();
    const drawerRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora ou com a tecla ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsCartOpen(false);
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node) && isCartOpen) {
                // Verifica se o clique foi fora da gaveta no backdrop
                const target = e.target as HTMLElement;
                if (target.classList.contains('cart-backdrop')) {
                    setIsCartOpen(false);
                }
            }
        };

        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('mousedown', handleClickOutside);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCartOpen, setIsCartOpen]);

    const formatPrice = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleGoToCheckout = () => {
        setIsCartOpen(false);
        navigate('/checkout');
    };

    const handleGoToHome = () => {
        setIsCartOpen(false);
        navigate('/');
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 z-50 bg-[#0B1221]/60 backdrop-blur-sm transition-opacity duration-300 cart-backdrop ${
                    isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            />

            {/* Drawer */}
            <div 
                ref={drawerRef}
                className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
                    isCartOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="relative">
                            <span className="text-[#0B1221] font-black text-xl">Seu Carrinho</span>
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-4 bg-[#2980B9] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                            )}
                        </span>
                    </div>
                    <button 
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-[#0B1221] transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0B1221] text-lg">Seu carrinho está vazio</h3>
                                <p className="text-sm text-slate-400 font-medium mt-1">
                                    Navegue pelos nossos serviços e encontre a melhor opção para você.
                                </p>
                            </div>
                            <button
                                onClick={handleGoToHome}
                                className="bg-[#2980B9] hover:bg-[#2980B9]/90 text-white py-3 px-6 rounded-xl font-bold text-sm transition-all"
                            >
                                Ir para a Home
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item, idx) => {
                                const imageSrc = (item.image || (item as any).display_image || (item as any).image_url || '').split(',')[0].trim();
                                return (
                                    <div 
                                        key={`${item.id}-${JSON.stringify(item.selectedVariations)}`}
                                        className="flex gap-4 p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all"
                                    >
                                        {/* Image */}
                                        <div className="w-20 h-20 bg-white rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                            {imageSrc ? (
                                                <img 
                                                    src={imageSrc} 
                                                    alt={item.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ShoppingBag className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-grow flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[#0B1221] text-sm leading-tight line-clamp-2">
                                                    {item.name}
                                                </h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    {item.category}
                                                </p>
                                                {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {Object.entries(item.selectedVariations).map(([key, val]) => (
                                                            <span key={key} className="text-[9px] font-bold bg-[#2980B9]/10 text-[#2980B9] py-0.5 px-1.5 rounded uppercase">
                                                                {key}: {val}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                {/* Price */}
                                                <span className="font-black text-[#0B1221] text-sm">
                                                    {formatPrice(item.price)}
                                                </span>

                                                {/* Controls */}
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariations)}
                                                            className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-[#0B1221]"
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="px-2 text-xs font-bold text-[#0B1221] min-w-[20px] text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariations)}
                                                            className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-[#0B1221]"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <button 
                                                        onClick={() => removeFromCart(item.id, item.selectedVariations)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-500 text-sm">Subtotal</span>
                            <span className="font-black text-[#0B1221] text-xl">
                                {formatPrice(cartTotal)}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                onClick={handleGoToCheckout}
                                className="w-full bg-[#0B1221] hover:bg-[#2980B9] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-[#2980B9]/15"
                            >
                                Finalizar Compra
                            </button>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                            >
                                Continuar Comprando
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
