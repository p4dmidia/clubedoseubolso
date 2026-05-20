import React, { useState, useEffect } from 'react';
import {
    Download,
    Copy,
    Check,
    Video,
    Image as ImageIcon,
    FileText,
    Search,
    PlayCircle,
    FileVideo,
    Share2,
    Library,
    ChevronRight,
    RefreshCcw,
    File as FileIcon
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Material {
    id: string;
    title: string;
    description: string;
    type: 'all' | 'video' | 'banner' | 'script' | 'pdf';
    thumbnail_url?: string;
    file_url?: string;
    content?: string; // For scripts
}

const AffiliateMaterials: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'video' | 'banner' | 'script' | 'pdf'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('marketing_materials')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching materials:', error);
                setMaterials([]);
            } else if (data && data.length > 0) {
                setMaterials(data as any);
            } else {
                setMaterials([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredMaterials = materials.filter(m => {
        const matchesTab = activeTab === 'all' || m.type === activeTab;
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Texto copiado!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDownload = async (url?: string, fileName?: string) => {
        if (!url || url.startsWith('#')) {
            toast.error('Link de material temporariamente indisponível.');
            return;
        }

        // Se for vídeo, apenas abre em nova aba para assistir
        if (url.includes('.mp4') || url.includes('youtube.com') || url.includes('vimeo.com')) {
            window.open(url, '_blank');
            return;
        }

        try {
            toast.loading('Iniciando download...', { id: 'download' });
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'material-clube-do-seu-bolso';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            toast.success('Download concluído!', { id: 'download' });
        } catch (err) {
            console.error('Download error:', err);
            // Fallback: abre em nova aba se o download forçado falhar (CORS etc)
            window.open(url, '_blank');
            toast.success('Abrindo material...', { id: 'download' });
        }
    };

    return (
        <AffiliateLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-[#0B1221]">Materiais de Apoio</h1>
                        <p className="text-slate-500 font-medium">Conteúdos oficiais Clube do Seu Bolso para sua divulgação.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar material..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-[#2980B9] transition-all font-bold"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl w-fit border border-slate-100">
                    {[
                        { id: 'all', label: 'Todos', icon: Library },
                        { id: 'video', label: 'Vídeos', icon: Video },
                        { id: 'banner', label: 'Imagens', icon: ImageIcon },
                        { id: 'pdf', label: 'PDFs', icon: FileIcon },
                        { id: 'script', label: 'Scripts', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#0B1221] text-[#2980B9] shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                    <button
                        onClick={fetchMaterials}
                        className="p-2.5 text-slate-400 hover:text-[#0B1221] transition-all"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-[2.5rem] h-80 animate-pulse border border-slate-50"></div>
                        ))
                    ) : filteredMaterials.length > 0 ? (
                        filteredMaterials.map(item => (
                            <div key={item.id} className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#2980B9]/10 transition-all duration-500 flex flex-col">
                                {/* Material Preview */}
                                <div className="aspect-video relative overflow-hidden bg-[#0B1221]">
                                    {item.thumbnail_url ? (
                                        <img
                                            src={item.thumbnail_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement?.classList.add('bg-[#0B1221]');
                                            }}
                                        />
                                    ) : item.type === 'script' ? (
                                        <div className="w-full h-full flex items-center justify-center p-8 bg-[#FFFBEB] group-hover:bg-[#FFF8E1] transition-colors">
                                            <FileText className="w-16 h-16 text-[#2980B9] opacity-10" />
                                            <div className="absolute inset-0 p-8 flex flex-col justify-center overflow-hidden">
                                                <p className="text-[10px] font-black text-[#2980B9] uppercase tracking-[0.2em] mb-3">Roteiro de Venda</p>
                                                <p className="text-xs text-[#0B1221] font-bold leading-relaxed line-clamp-4 italic">"{item.content}"</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {item.type === 'video' ? (
                                                <Video className="w-16 h-16 text-[#2980B9] opacity-20" />
                                            ) : item.type === 'pdf' ? (
                                                <FileIcon className="w-16 h-16 text-slate-200 opacity-20" />
                                            ) : (
                                                <ImageIcon className="w-16 h-16 text-slate-200 opacity-20" />
                                            )}
                                        </div>
                                    )}

                                    {/* Hover Overlay - only for non-scripts or things with thumbnails */}
                                    {(item.thumbnail_url || item.type !== 'script') && (
                                        <div className="absolute inset-0 bg-[#0B1221]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {item.type === 'video' ? (
                                                <PlayCircle className="w-16 h-16 text-white" />
                                            ) : item.type === 'pdf' ? (
                                                <FileIcon className="w-16 h-16 text-white" />
                                            ) : (
                                                <ImageIcon className="w-16 h-16 text-white" />
                                            )}
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[8px] font-black uppercase tracking-widest text-[#0B1221] shadow-sm">
                                            {item.type === 'script' ? 'Script' : item.type === 'banner' ? 'Imagem' : item.type === 'pdf' ? 'PDF' : 'Vídeo'}
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-8 space-y-3 flex-grow">
                                    <h3 className="text-lg font-black text-[#0B1221] leading-tight group-hover:text-[#2980B9] transition-colors">{item.title}</h3>
                                    <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>
                                </div>

                                {/* Actions */}
                                <div className="p-8 pt-0 mt-auto">
                                    {item.type === 'script' ? (
                                        <button
                                            onClick={() => handleCopy(item.id, item.content || '')}
                                            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${copiedId === item.id ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-[#0B1221] text-white hover:bg-[#2980B9] hover:text-[#0B1221]'
                                                }`}
                                        >
                                            {copiedId === item.id ? (
                                                <>
                                                    <Check className="w-4 h-4" /> TEXTO COPIADO!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" /> COPIAR SCRIPT
                                                </>
                                            )}
                                        </button>
                                    ) : item.type === 'video' ? (
                                        <button
                                            onClick={() => window.open(item.file_url, '_blank')}
                                            className="w-full py-4 bg-[#2980B9] text-[#0B1221] rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-[#0B1221] hover:text-white transition-all shadow-lg shadow-[#2980B9]/20"
                                        >
                                            <PlayCircle className="w-4 h-4" /> ASSISTIR AGORA
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleDownload(item.file_url, item.title)}
                                            className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-[#0B1221] hover:text-white hover:border-[#0B1221] transition-all"
                                        >
                                            <Download className="w-4 h-4" /> BAIXAR AGORA
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <Library className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhum material encontrado</p>
                        </div>
                    )}
                </div>

                {/* Share Tips */}
                <div className="bg-[#0B1221] rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-[#2980B9]/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-[#2980B9] rounded-2xl flex items-center justify-center text-[#0B1221]">
                                <Share2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black leading-tight">Dicas de Divulgação</h3>
                            <p className="text-slate-400 font-bold leading-relaxed">
                                Use o seu link de afiliado em cada postagem. Lembre-se: o segredo da venda na Clube do Seu Bolso é o benefício para a saúde.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                                    <span className="text-xs font-bold text-slate-300">Foque no alinhamento da coluna.</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                                    <span className="text-xs font-bold text-slate-300">Explique a tecnologia Bio-Mag.</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 space-y-6">
                            <FileVideo className="w-12 h-12 text-[#2980B9] mb-4" />
                            <h4 className="text-xl font-black">Quer materiais personalizados?</h4>
                            <p className="text-sm font-medium text-slate-400 leading-relaxed">Fale com o suporte no WhatsApp para solicitar artes exclusivas com sua foto ou logomarca.</p>
                            <button className="text-[#2980B9] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                                SOLICITAR AGORA <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AffiliateLayout>
    );
};

export default AffiliateMaterials;
