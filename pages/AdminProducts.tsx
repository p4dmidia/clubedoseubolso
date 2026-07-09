import React, { useState, useEffect } from 'react';
import {
    Package,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Layers,
    Tag,
    BarChart,
    X,
    Upload,
    Box,
    Loader2,
    Info,
    ChevronDown,
    Link2
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Product {
    id: string;
    name: string;
    description: string;
    category_id: number | null;
    price: number;
    stock_quantity: number;
    image_url: string;
    is_active: boolean;
    sales_count: number;
    created_at: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    origin_zip: string;
    variations?: {
        plan_type?: 'Individual' | 'Familiar';
        adesao?: number;
        mensalidade?: number;
        custo_plataforma?: number;
        comissao_adesao?: number;
        comissao_mensal?: number;
        slug?: string;
    };
    product_categories?: {
        name: string;
    };
}

const parsePrice = (val: string | number): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const clean = val.toString().replace(/[R$\s.]/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const slugify = (text: string): string => {
    let slug = text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    if (slug.startsWith('plano-')) {
        slug = slug.substring(6);
    }
    return slug;
};

const AdminProducts: React.FC = () => {
    const navigate = useNavigate();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todos');
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        plan_type: 'Individual',
        price_adesao: '',
        price_mensalidade: '',
        cost_platform: '',
        commission_adesao: '',
        commission_mensal: '',
        description: '',
        is_active: true,
    });

    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const itemsPerPage = 8;

    useEffect(() => {
        fetchProducts();
    }, []);

    const seedDefaultPlans = async () => {
        try {
            toast.loading('Configurando planos de telemedicina no banco de dados...', { id: 'seeding' });
            
            // 1. Encontra ou cria a categoria "Planos"
            let planosCategoryId: number | null = null;
            const { data: catData } = await supabase
                .from('product_categories')
                .select('id')
                .eq('name', 'Planos')
                .eq('organization_id', ORGANIZATION_ID)
                .maybeSingle();

            if (catData) {
                planosCategoryId = catData.id;
            } else {
                const { data: newCat } = await supabase
                    .from('product_categories')
                    .insert([{ name: 'Planos', organization_id: ORGANIZATION_ID }])
                    .select('id')
                    .single();
                if (newCat) planosCategoryId = newCat.id;
            }

            const defaultPlans = [
                {
                    name: 'Plano Individual Essencial',
                    price: 17.90,
                    description: 'O plano básico indispensável para quem busca atendimento médico ágil e direcionamento financeiro inicial.',
                    category_id: planosCategoryId,
                    stock_quantity: 999,
                    is_active: true,
                    organization_id: ORGANIZATION_ID,
                    image_url: 'https://placehold.co/600x600?text=Individual+Essencial',
                    weight: 0,
                    length: 0,
                    width: 0,
                    height: 0,
                    origin_zip: '82820-160',
                    variations: {
                        plan_type: 'Individual',
                        adesao: 17.90,
                        mensalidade: 17.90,
                        custo_plataforma: 2.90,
                        comissao_adesao: 7.00,
                        comissao_mensal: 5.00,
                        slug: 'individual-essencial'
                    }
                },
                {
                    name: 'Plano Individual Premium',
                    price: 34.90,
                    description: 'O combo supremo de saúde com especialistas e consultoria financeira VIP individualizada.',
                    category_id: planosCategoryId,
                    stock_quantity: 999,
                    is_active: true,
                    organization_id: ORGANIZATION_ID,
                    image_url: 'https://placehold.co/600x600?text=Individual+Premium',
                    weight: 0,
                    length: 0,
                    width: 0,
                    height: 0,
                    origin_zip: '82820-160',
                    variations: {
                        plan_type: 'Individual',
                        adesao: 34.90,
                        mensalidade: 34.90,
                        custo_plataforma: 9.90,
                        comissao_adesao: 10.00,
                        comissao_mensal: 7.00,
                        slug: 'individual-premium'
                    }
                },
                {
                    name: 'Plano Familiar Essencial',
                    price: 44.90,
                    description: 'A tranquilidade de saber que toda a sua família está protegida por um valor que cabe no seu bolso.',
                    category_id: planosCategoryId,
                    stock_quantity: 999,
                    is_active: true,
                    organization_id: ORGANIZATION_ID,
                    image_url: 'https://placehold.co/600x600?text=Familiar+Essencial',
                    weight: 0,
                    length: 0,
                    width: 0,
                    height: 0,
                    origin_zip: '82820-160',
                    variations: {
                        plan_type: 'Familiar',
                        adesao: 44.90,
                        mensalidade: 44.90,
                        custo_plataforma: 4.90,
                        comissao_adesao: 25.00,
                        comissao_mensal: 10.00,
                        slug: 'familiar-essencial'
                    }
                },
                {
                    name: 'Plano Familiar Premium',
                    price: 87.90,
                    description: 'A cobertura mais robusta do Clube do Seu Bolso. Saúde, economia de energia doméstica e proteção de vida em um único lugar.',
                    category_id: planosCategoryId,
                    stock_quantity: 999,
                    is_active: true,
                    organization_id: ORGANIZATION_ID,
                    image_url: 'https://placehold.co/600x600?text=Familiar+Premium',
                    weight: 0,
                    length: 0,
                    width: 0,
                    height: 0,
                    origin_zip: '82820-160',
                    variations: {
                        plan_type: 'Familiar',
                        adesao: 87.90,
                        mensalidade: 87.90,
                        custo_plataforma: 16.90,
                        comissao_adesao: 35.00,
                        comissao_mensal: 17.58,
                        slug: 'familiar-premium'
                    }
                }
            ];

            const { data, error } = await supabase
                .from('products')
                .insert(defaultPlans)
                .select();

            if (error) {
                throw error;
            } else {
                toast.success('Planos de assinatura configurados com sucesso!', { id: 'seeding' });
                // Refetch
                const { data: refetched } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_categories (name)
                    `)
                    .eq('organization_id', ORGANIZATION_ID)
                    .order('created_at', { ascending: false });

                const plansOnly = (refetched || []).filter((prod: any) => 
                    prod.product_categories?.name === 'Planos' || 
                    prod.variations?.plan_type !== undefined
                );
                setProducts(plansOnly);
            }
        } catch (e: any) {
            console.error("Error seeding plans:", e);
            toast.error('Erro ao configurar planos padrão: ' + e.message, { id: 'seeding' });
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_categories (name)
                `)
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) {
                toast.error('Erro ao carregar planos');
                console.error(error);
                return;
            }

            const plansOnly = (data || []).filter((prod: any) => 
                prod.product_categories?.name === 'Planos' || 
                prod.variations?.plan_type !== undefined
            );

            if (plansOnly.length === 0 && (data || []).length === 0) {
                await seedDefaultPlans();
            } else {
                setProducts(plansOnly);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenEdit = (prod: Product) => {
        setEditingProduct(prod);
        setFormData({
            name: prod.name,
            plan_type: prod.variations?.plan_type || 'Individual',
            price_adesao: prod.variations?.adesao?.toString() || '',
            price_mensalidade: prod.variations?.mensalidade?.toString() || prod.price?.toString() || '',
            cost_platform: prod.variations?.custo_plataforma?.toString() || '',
            commission_adesao: prod.variations?.comissao_adesao?.toString() || '',
            commission_mensal: prod.variations?.comissao_mensal?.toString() || '',
            description: prod.description || '',
            is_active: prod.is_active !== false,
        });
        const imgs = (prod.image_url || '').split(',').map(s => s.trim()).filter(Boolean);
        setExistingImages(imgs);
        setImagePreviews([]);
        setSelectedImages([]);
        setIsNewModalOpen(true);
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)
                .eq('organization_id', ORGANIZATION_ID);

            if (error) throw error;

            toast.success('Plano removido com sucesso!');
            fetchProducts();
        } catch (error) {
            toast.error('Erro ao excluir plano');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            plan_type: 'Individual',
            price_adesao: '',
            price_mensalidade: '',
            cost_platform: '',
            commission_adesao: '',
            commission_mensal: '',
            description: '',
            is_active: true,
        });
        setEditingProduct(null);
        setSelectedImages([]);
        setImagePreviews([]);
        setExistingImages([]);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let finalImageUrls = [...existingImages];

            if (selectedImages.length > 0) {
                for (const file of selectedImages) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const { error: uploadError, data } = await supabase.storage
                        .from('product-images')
                        .upload(`products/${fileName}`, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('product-images')
                        .getPublicUrl(data.path);

                    finalImageUrls.push(publicUrl);
                }
            }

            const imageUrl = finalImageUrls.join(',');

            // 1. Encontra ou cria a categoria "Planos"
            let planosCategoryId: number | null = null;
            const { data: catData } = await supabase
                .from('product_categories')
                .select('id')
                .eq('name', 'Planos')
                .eq('organization_id', ORGANIZATION_ID)
                .maybeSingle();

            if (catData) {
                planosCategoryId = catData.id;
            } else {
                const { data: newCat } = await supabase
                    .from('product_categories')
                    .insert([{ name: 'Planos', organization_id: ORGANIZATION_ID }])
                    .select('id')
                    .single();
                if (newCat) planosCategoryId = newCat.id;
            }

            const rawAdesao = parsePrice(formData.price_adesao);
            const rawMensalidade = parsePrice(formData.price_mensalidade);
            const rawPlatform = parsePrice(formData.cost_platform);
            const rawCommAdesao = parsePrice(formData.commission_adesao);
            const rawCommMensal = parsePrice(formData.commission_mensal);

            if (rawMensalidade <= 0) {
                toast.error('O valor da mensalidade deve ser maior que 0');
                setIsSaving(false);
                return;
            }

            const slug = slugify(formData.name);

            const productData = {
                name: formData.name,
                category_id: planosCategoryId,
                price: rawMensalidade,
                stock_quantity: 999, // ilimitado para planos
                description: formData.description,
                image_url: imageUrl || (formData.plan_type === 'Familiar' ? 'https://placehold.co/600x600?text=Familiar' : 'https://placehold.co/600x600?text=Individual'),
                is_active: formData.is_active,
                weight: 0,
                length: 0,
                width: 0,
                height: 0,
                origin_zip: '82820-160',
                variations: {
                    plan_type: formData.plan_type,
                    adesao: rawAdesao,
                    mensalidade: rawMensalidade,
                    custo_plataforma: rawPlatform,
                    comissao_adesao: rawCommAdesao,
                    comissao_mensal: rawCommMensal,
                    slug: slug
                },
                organization_id: ORGANIZATION_ID
            };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id)
                    .eq('organization_id', ORGANIZATION_ID);
                if (error) throw error;
                toast.success('Plano atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
                toast.success('Plano cadastrado com sucesso!');
            }

            setIsNewModalOpen(false);
            resetForm();
            fetchProducts();
        } catch (error: any) {
            toast.error(editingProduct ? 'Erro ao atualizar plano' : 'Erro ao cadastrar plano');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        const totalCount = existingImages.length + selectedImages.length + files.length;
        if (totalCount > 10) {
            toast.error('Você pode cadastrar no máximo 10 imagens por plano');
            return;
        }

        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        for (const file of files) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(`A imagem ${file.name} excede o limite de 2MB`);
                continue;
            }
            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        }

        setSelectedImages(prev => [...prev, ...validFiles]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            const previewToRemove = prev[index];
            if (previewToRemove) URL.revokeObjectURL(previewToRemove);
            return prev.filter((_, i) => i !== index);
        });
    };

    const filteredProducts = products.filter(prod => {
        const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase());
        const planType = prod.variations?.plan_type || 'Individual';
        const matchesType = filterType === 'Todos' || planType === filterType;

        return matchesSearch && matchesType;
    });

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentData = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#05080F] tracking-tight">
                            Planos de Assinatura
                        </h1>
                        <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest">
                            Configuração dos planos e comissões da plataforma
                        </p>
                    </div>

                    <button
                        onClick={() => { resetForm(); setIsNewModalOpen(true); }}
                        className="w-full xl:w-auto bg-[#05080F] text-white hover:bg-[#1a2436] font-black text-sm px-8 py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-[#05080F]/10 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus className="w-5 h-5" /> NOVO PLANO
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                        <div className="relative flex-grow max-w-xl">
                            <Search className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar planos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] text-sm transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tipo:</span>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-bold text-[#05080F] outline-none text-xs"
                                >
                                    <option value="Todos">Todos</option>
                                    <option value="Individual">Individual</option>
                                    <option value="Familiar">Familiar</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="text-left py-6 px-8 text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Plano</th>
                                        <th className="text-left py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Tipo</th>
                                        <th className="text-left py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Adesão</th>
                                        <th className="text-left py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Mensalidade</th>
                                        <th className="text-left py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Custo Plataforma</th>
                                        <th className="text-left py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Comissão Adesão</th>
                                        <th className="text-left py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Comissão Mensal</th>
                                        <th className="text-right py-6 px-8 text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? (
                                        [1, 2, 3, 4].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="py-6 px-8"><div className="h-14 w-full bg-slate-100 rounded-2xl"></div></td>
                                                <td className="py-6 px-4"><div className="h-6 w-16 bg-slate-100 rounded-full"></div></td>
                                                <td className="py-6 px-4"><div className="h-6 w-12 bg-slate-100 rounded-lg"></div></td>
                                                <td className="py-6 px-4"><div className="h-6 w-12 bg-slate-100 rounded-lg"></div></td>
                                                <td className="py-6 px-4"><div className="h-6 w-12 bg-slate-100 rounded-lg"></div></td>
                                                <td className="py-6 px-4"><div className="h-6 w-12 bg-slate-100 rounded-lg"></div></td>
                                                <td className="py-6 px-4"><div className="h-6 w-12 bg-slate-100 rounded-lg"></div></td>
                                                <td className="py-6 px-8"><div className="h-10 w-24 bg-slate-100 rounded-xl ml-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : currentData.map((prod) => {
                                        return (
                                            <tr key={prod.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-[#05080F] overflow-hidden shrink-0">
                                                            {prod.image_url ? (
                                                                <img src={prod.image_url.split(',')[0].trim()} alt={prod.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="w-6 h-6 text-[#2980B9]" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-black text-[#05080F] truncate">{prod.name}</p>
                                                                {prod.is_active === false && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                                                                        Oculto (Teste)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${prod.variations?.plan_type === 'Familiar' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {prod.variations?.plan_type || 'Individual'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4 font-black text-[#05080F]">
                                                    {formatCurrency(prod.variations?.adesao || 0)}
                                                </td>
                                                <td className="py-6 px-4 font-black text-[#2980B9]">
                                                    {formatCurrency(prod.variations?.mensalidade || prod.price || 0)}
                                                </td>
                                                <td className="py-6 px-4 font-bold text-slate-500">
                                                    {formatCurrency(prod.variations?.custo_plataforma || 0)}
                                                </td>
                                                <td className="py-6 px-4 font-black text-emerald-600">
                                                    {formatCurrency(prod.variations?.comissao_adesao || 0)}
                                                </td>
                                                <td className="py-6 px-4 font-black text-emerald-600">
                                                    {formatCurrency(prod.variations?.comissao_mensal || 0)}
                                                </td>
                                                <td className="py-6 px-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const link = `${window.location.origin}/checkout?buy=${prod.id}`;
                                                                navigator.clipboard.writeText(link);
                                                                toast.success('Link de checkout copiado!');
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                            title="Copiar Link de Checkout"
                                                        >
                                                            <Link2 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEdit(prod)}
                                                            className="p-2 text-slate-300 hover:text-[#2980B9] hover:bg-[#2980B9]/10 rounded-xl transition-all"
                                                            title="Editar"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(prod.id)}
                                                            className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isLoading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-pulse space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl shrink-0"></div>
                                        <div className="flex-grow space-y-2">
                                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="h-10 bg-slate-100 rounded-xl"></div>
                                </div>
                            ))
                        ) : currentData.length > 0 ? (
                            currentData.map((prod) => {
                                return (
                                    <div key={prod.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-[#05080F] overflow-hidden shrink-0">
                                                {prod.image_url ? (
                                                    <img src={prod.image_url.split(',')[0]} alt={prod.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-8 h-8 text-[#2980B9]" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-black text-[#05080F] text-lg truncate">{prod.name}</h3>
                                                    {prod.is_active === false && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                                                            Oculto (Teste)
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`inline-flex px-2 py-0.5 mt-1 rounded-full text-[9px] font-black uppercase ${prod.variations?.plan_type === 'Familiar' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {prod.variations?.plan_type || 'Individual'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 text-xs">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adesão</p>
                                                <p className="font-black text-[#05080F]">{formatCurrency(prod.variations?.adesao || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensalidade</p>
                                                <p className="font-black text-[#2980B9]">{formatCurrency(prod.variations?.mensalidade || prod.price || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comissão Adesão</p>
                                                <p className="font-bold text-emerald-600">{formatCurrency(prod.variations?.comissao_adesao || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comissão Mensal</p>
                                                <p className="font-bold text-emerald-600">{formatCurrency(prod.variations?.comissao_mensal || 0)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-50">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const link = `${window.location.origin}/checkout?buy=${prod.id}`;
                                                        navigator.clipboard.writeText(link);
                                                        toast.success('Link de checkout copiado!');
                                                    }}
                                                    className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                    title="Copiar Link de Checkout"
                                                >
                                                    <Link2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(prod)}
                                                    className="p-3 bg-slate-50 text-slate-400 hover:text-[#2980B9] hover:bg-[#2980B9]/10 rounded-xl transition-all"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(prod.id)}
                                                    className="p-3 bg-red-50 text-red-400 hover:text-red-500 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
                                <Search className="w-12 h-12 opacity-20 mx-auto" />
                                <p className="font-bold text-slate-400 mt-3">Nenhum plano encontrado.</p>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="p-8 flex justify-center flex-wrap gap-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 md:w-auto md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-[#05080F] text-white shadow-lg shadow-[#05080F]/10' : 'bg-white border border-slate-100 hover:bg-slate-50 text-[#05080F]'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isNewModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-8">
                    <div className="absolute inset-0 bg-[#05080F]/80 backdrop-blur-sm" onClick={() => setIsNewModalOpen(false)}></div>
                    <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-[3.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-6 md:p-10 border-b border-slate-50 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-[#05080F]">{editingProduct ? 'Editar Plano' : 'Novo Plano'}</h2>
                                <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] md:text-xs tracking-widest">{editingProduct ? 'Atualizar plano de assinatura' : 'Adicionar plano de assinatura'}</p>
                            </div>
                            <button type="button" onClick={() => setIsNewModalOpen(false)} className="p-3 md:p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            <form className="space-y-8" onSubmit={handleSaveProduct}>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome do Plano</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] text-sm"
                                                placeholder="Ex: Plano Individual Premium"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Tipo do Plano</label>
                                            <select
                                                required
                                                value={formData.plan_type}
                                                onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] text-sm"
                                            >
                                                <option value="Individual">Individual</option>
                                                <option value="Familiar">Familiar</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Valor Adesão (R$)</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.price_adesao}
                                                onChange={(e) => setFormData({ ...formData, price_adesao: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] text-sm"
                                                placeholder="R$ 0,00"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Valor Mensalidade (R$)</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.price_mensalidade}
                                                onChange={(e) => setFormData({ ...formData, price_mensalidade: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] text-sm"
                                                placeholder="R$ 0,00"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Custo Plataforma (R$)</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.cost_platform}
                                                onChange={(e) => setFormData({ ...formData, cost_platform: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] text-sm"
                                                placeholder="R$ 0,00"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Comissão Adesão (R$)</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.commission_adesao}
                                                onChange={(e) => setFormData({ ...formData, commission_adesao: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] text-sm"
                                                placeholder="R$ 0,00"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Comissão Mensal (R$)</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.commission_mensal}
                                                onChange={(e) => setFormData({ ...formData, commission_mensal: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] text-sm"
                                                placeholder="R$ 0,00"
                                            />
                                        </div>

                                        <div className="space-y-2 col-span-1 md:col-span-2 flex items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
                                            <label className="flex items-center gap-3.5 cursor-pointer w-full select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_active}
                                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                    className="w-5 h-5 rounded-lg border-slate-300 text-[#2980B9] focus:ring-[#2980B9] cursor-pointer"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase text-[#05080F] tracking-widest">Plano Ativo (Visível no Site)</span>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">Se desativado, o plano não aparece na Home Page ou na Loja, mas pode ser comprado usando o link direto do checkout.</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Descrição</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] min-h-[100px] text-sm"
                                            placeholder="Detalhes e benefícios inclusos no plano..."
                                        />
                                    </div>

                                    <div className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Galeria de Imagens</label>
                                                <p className="text-[9px] font-bold text-slate-400 opacity-70">Máximo de 10 fotos • Até 2MB cada</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${existingImages.length + selectedImages.length >= 10 ? 'bg-red-50 text-red-500' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                                {existingImages.length + selectedImages.length}/10
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {/* Existing Images */}
                                            {existingImages.map((url, idx) => (
                                                <div key={`existing-${idx}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
                                                    <img src={url} alt="Plano" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingImage(idx)}
                                                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-md transform hover:scale-110 active:scale-95"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-[#05080F]/40 backdrop-blur-[2px] rounded-md text-[7px] font-black text-white uppercase tracking-widest">Salva</div>
                                                </div>
                                            ))}

                                            {/* Local Previews */}
                                            {imagePreviews.map((blob, idx) => (
                                                <div key={`new-${idx}`} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-[#2980B9]/40 bg-[#2980B9]/5 shadow-sm">
                                                    <img src={blob} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewImage(idx)}
                                                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-md transform hover:scale-110 active:scale-95"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-[#2980B9] rounded-md text-[7px] font-black text-[#05080F] uppercase tracking-widest">Nova</div>
                                                </div>
                                            ))}

                                            {/* Add Button */}
                                            {existingImages.length + selectedImages.length < 10 && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:border-[#2980B9] hover:bg-white hover:shadow-xl hover:shadow-[#2980B9]/5 transition-all group bg-slate-50/50"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 group-hover:border-[#2980B9]/30 transition-colors">
                                                        <Upload className="w-4 h-4 text-slate-400 group-hover:text-[#2980B9] transition-colors" />
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-400 group-hover:text-[#05080F] uppercase tracking-widest">Adicionar</span>
                                                </button>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" multiple />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full py-5 bg-[#05080F] text-white rounded-2xl font-black text-sm shadow-xl hover:bg-[#1a2436] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProduct ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PLANO'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminProducts;
