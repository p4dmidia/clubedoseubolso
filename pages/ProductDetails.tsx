import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ShoppingCart,
    Star,
    ShieldCheck,
    Truck,
    ArrowRight,
    Check,
    Loader2,
    Package
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import { supabase } from '../lib/supabase';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';
import { Copy, Link2 } from 'lucide-react';

const ProductDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const { user } = useAuth();
    const [referralCode, setReferralCode] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            const fetchReferral = async () => {
                const { data } = await supabase
                    .from('affiliates')
                    .select('referral_code')
                    .eq('user_id', user.id)
                    .single();
                if (data) setReferralCode(data.referral_code);
            };
            fetchReferral();
        }
    }, [user]);

    useEffect(() => {
        console.log("%c Clube do Seu Bolso Product Details Version: 4.5.3 ", "background: #2980B9; color: #0B1221; font-weight: bold; padding: 4px; border-radius: 4px;");
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_categories (
                        id,
                        name
                    )
                `)
                .eq('id', id)
                .eq('organization_id', ORGANIZATION_ID)
                .single();

            if (error) throw error;

            // Format data
            let categoryLabel = 'Geral';
            if (data.product_categories) {
                categoryLabel = data.product_categories.name;
            }

            const images = (data.image_url || data.image || '').split(',').map((s: string) => s.trim()).filter(Boolean);
            const formatted = {
                ...data,
                category: categoryLabel,
                image: images[0] || 'https://placehold.co/600x600?text=Classe+A',
                images: images.length > 0 ? images : ['https://placehold.co/600x600?text=Classe+A']
            };

            setProduct(formatted);
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Produto não encontrado.');
            navigate('/shop');
        } finally {
            setIsLoading(false);
        }
    };

    const [selectedVariations, setSelectedVariations] = useState<{ [key: string]: string }>({});

    const handleAddToCart = () => {
        if (!product) return;
        
        // Verifica se todas as variações disponíveis foram selecionadas
        const availableVariations = product.variations || {};
        const missing = Object.keys(availableVariations).filter(key => 
            availableVariations[key] && availableVariations[key].length > 0 && !selectedVariations[key]
        );

        if (missing.length > 0) {
            const labelMap: any = {
                sizes: 'Tamanho',
                colors: 'Cor',
                numbering: 'Numeração',
                soles: 'Solado',
                tips: 'Bico'
            };
            toast.error(`Por favor, selecione: ${missing.map(m => labelMap[m] || m).join(', ')}`);
            return;
        }

        addToCart(product, selectedVariations);
        toast.success(`${product.name} adicionado ao carrinho!`);
    };

    const handleCopyReferralLink = () => {
        if (!referralCode || !product) return;

        // Verifica se todas as variações disponíveis foram selecionadas
        const availableVariations = product.variations || {};
        const missing = Object.keys(availableVariations).filter(key => 
            availableVariations[key] && availableVariations[key].length > 0 && !selectedVariations[key]
        );

        if (missing.length > 0) {
            toast.error("Selecione as variações antes de copiar o link!");
            return;
        }

        const domain = window.location.origin;
        // Codifica as variações em base64 para o link
        const varsParam = Object.keys(selectedVariations).length > 0 
            ? `&vars=${btoa(JSON.stringify(selectedVariations))}`
            : '';
        
        const targetPath = `/p/${product.id}`;
        const link = `${domain}/ref/${referralCode}?to=${encodeURIComponent(targetPath)}`;

        navigator.clipboard.writeText(link);
        toast.success("Link de indicação direta copiado!");
    };

    const renderVariationSelector = (key: string, label: string, options: string[]) => {
        if (!options || options.length === 0) return null;
        return (
            <div className="space-y-3 mb-6" key={key}>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</p>
                <div className="flex flex-wrap gap-2">
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => setSelectedVariations(prev => ({ ...prev, [key]: opt }))}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                selectedVariations[key] === opt 
                                ? 'bg-[#2980B9] border-[#2980B9] text-[#0B1221]' 
                                : 'bg-white border-slate-100 text-slate-500 hover:border-[#2980B9]/30'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
                <Loader2 className="w-10 h-10 text-[#2980B9] animate-spin" />
                <p className="font-bold text-slate-400">Carregando produto...</p>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="bg-white min-h-screen pb-20">
            <div className="container mx-auto px-4 py-8">
                <Link to="/shop" className="inline-flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-[#0B1221] transition-colors mb-8">
                    <ChevronLeft className="w-4 h-4" />
                    VOLTAR PARA LOJA
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Image Gallery */}
                    <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
                        {/* Thumbnails - Sidebar on Desktop */}
                        {product.images.length > 1 && (
                            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[500px] lg:max-h-[600px] no-scrollbar shrink-0 order-2 md:order-1 py-1 px-1">
                                {product.images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        onMouseEnter={() => setActiveImageIndex(idx)}
                                        className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0 relative group p-0 ${
                                            activeImageIndex === idx 
                                            ? 'border-[#2980B9] shadow-lg shadow-[#2980B9]/10 scale-[1.02] z-10' 
                                            : 'border-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <img 
                                            src={img} 
                                            alt={`${product.name} thumbnail ${idx + 1}`} 
                                            className={`w-full h-full object-cover transition-opacity duration-300 ${activeImageIndex === idx ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                                            onError={(e: any) => {
                                                e.target.src = 'https://placehold.co/600x600?text=Classe+A';
                                            }}
                                        />
                                        {activeImageIndex === idx && (
                                            <div className="absolute inset-0 bg-[#2980B9]/10 ring-1 ring-inset ring-[#2980B9]/20"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Main Image Container */}
                        <div className="flex-grow aspect-square bg-[#F8FAFC] rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm group relative order-1 md:order-2">
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <img
                                    key={activeImageIndex}
                                    src={product.images[activeImageIndex]}
                                    alt={product.name}
                                    className="max-w-full max-h-full w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-all duration-700 animate-in fade-in zoom-in-95 ease-out"
                                    onError={(e: any) => {
                                        e.target.src = 'https://placehold.co/600x600?text=Classe+A';
                                    }}
                                />
                            </div>
                            
                            {/* Navigation Arrows for Mobile (Optional, but nice) */}
                            {product.images.length > 1 && (
                                <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveImageIndex(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
                                        }}
                                        className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-[#2980B9] pointer-events-auto transition-colors shadow-lg"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveImageIndex(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
                                        }}
                                        className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-[#2980B9] pointer-events-auto transition-colors shadow-lg rotate-180"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col">
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 bg-[#2980B9]/10 text-[#0B1221] text-[10px] font-black uppercase tracking-widest rounded-full">
                                    {product.category}
                                </span>
                                {(product.stock_quantity ?? 0) > 0 ? (
                                    <div className="flex text-emerald-500 gap-1 items-center font-bold text-xs">
                                        <Check className="w-4 h-4" />
                                        Em Estoque
                                    </div>
                                ) : (
                                    <div className="flex text-red-500 gap-1 items-center font-bold text-xs">
                                        <Package className="w-4 h-4" />
                                        Indisponível
                                    </div>
                                )}

                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-[#0B1221] leading-tight">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="flex text-[#2980B9]">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <span className="text-sm font-bold text-slate-400">(48 avaliações de clientes)</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-8 mb-8 border border-slate-100">
                            <div className="flex items-end gap-3 mb-2">
                                <span className="text-4xl font-black text-[#0B1221]">
                                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-slate-400 font-bold mb-1 line-through">
                                    R$ {(product.price * 1.2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div
                                className="text-slate-500 font-medium leading-relaxed mb-6 prose prose-slate max-w-none"
                                dangerouslySetInnerHTML={{ __html: product.description || 'Este produto premium oferece qualidade incomparável e durabilidade, ideal para quem busca o melhor custo-benefício e sofisticação em cada detalhe.' }}
                            />

                            {(product.weight || product.length || product.width || product.height) && (
                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                                    {product.weight > 0 && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso</span>
                                            <span className="text-sm font-bold text-[#0B1221]">{product.weight} kg</span>
                                        </div>
                                    )}
                                    {(product.length > 0 || product.width > 0 || product.height > 0) && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensões</span>
                                            <span className="text-sm font-bold text-[#0B1221]">
                                                {product.length || 0} x {product.width || 0} x {product.height || 0} cm
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Product Variations Selection */}
                        <div className="mb-8">
                            {product.variations?.sizes && renderVariationSelector('sizes', 'Tamanho', product.variations.sizes)}
                            {product.variations?.colors && renderVariationSelector('colors', 'Cor', product.variations.colors)}
                            {product.variations?.numbering && renderVariationSelector('numbering', 'Numeração', product.variations.numbering)}
                            {product.variations?.soles && renderVariationSelector('soles', 'Solado', product.variations.soles)}
                            {product.variations?.tips && renderVariationSelector('tips', 'Bico', product.variations.tips)}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-10">
                            <div className="flex items-center bg-slate-100 rounded-2xl p-1 w-fit">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-12 h-12 flex items-center justify-center font-bold text-lg hover:text-[#2980B9] transition-colors"
                                >
                                    -
                                </button>
                                <span className="w-12 text-center font-black text-[#0B1221]">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    disabled={quantity >= (product.stock_quantity ?? 0)}
                                    className="w-12 h-12 flex items-center justify-center font-bold text-lg hover:text-[#2980B9] transition-colors disabled:opacity-30"
                                >
                                    +
                                </button>

                            </div>
                             <button
                                onClick={handleAddToCart}
                                disabled={(product.stock_quantity ?? 0) <= 0}
                                className={`flex-grow font-black py-4 px-10 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                                    (product.stock_quantity ?? 0) > 0 
                                    ? 'bg-[#2980B9] hover:bg-[#f9b100] text-[#0B1221] shadow-[#2980B9]/10' 
                                    : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                                }`}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {(product.stock_quantity ?? 0) > 0 ? 'ADICIONAR AO CARRINHO' : 'ESGOTADO'}
                            </button>

                            {user && referralCode && (
                                <button
                                    onClick={handleCopyReferralLink}
                                    className="flex-grow font-black py-4 px-6 rounded-2xl border-2 border-[#0B1221] text-[#0B1221] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                    title="Copiar link de indicação direta para checkout"
                                >
                                    <Link2 className="w-4 h-4" />
                                    Indicação Rápida
                                </button>
                            )}
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#2980B9]">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrega Rápida</p>
                                    <p className="text-sm font-bold text-[#0B1221]">Todo Brasil</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#2980B9]">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compra Segura</p>
                                    <p className="text-sm font-bold text-[#0B1221]">Garantia Clube do Seu Bolso</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
