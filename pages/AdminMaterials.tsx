import React, { useState, useEffect } from 'react';
import {
    Library,
    Plus,
    Edit,
    Trash2,
    X,
    Loader2,
    Video,
    Image as ImageIcon,
    FileText,
    Search,
    ExternalLink,
    Download,
    Save,
    Upload,
    File as FileIcon
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Material {
    id: string;
    title: string;
    description: string;
    type: 'video' | 'banner' | 'script' | 'pdf';
    thumbnail_url?: string;
    file_url?: string;
    content?: string;
    created_at: string;
}

const AdminMaterials: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'video' | 'banner' | 'script'>('all');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [contentFile, setContentFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ thumb?: number; content?: number }>({});

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'banner' as 'video' | 'banner' | 'script' | 'pdf',
        thumbnail_url: '',
        file_url: '',
        content: ''
    });

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('marketing_materials')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMaterials(data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
            toast.error('Erro ao carregar materiais.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (material?: Material) => {
        setThumbnailFile(null);
        setContentFile(null);
        setUploadProgress({});
        if (material) {
            setEditingMaterial(material);
            setFormData({
                title: material.title,
                description: material.description,
                type: material.type,
                thumbnail_url: material.thumbnail_url || '',
                file_url: material.file_url || '',
                content: material.content || ''
            });
        } else {
            setEditingMaterial(null);
            setFormData({
                title: '',
                description: '',
                type: 'banner',
                thumbnail_url: '',
                file_url: '',
                content: ''
            });
        }
        setIsModalOpen(true);
    };

    const uploadFile = async (file: File, bucket: string, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${ORGANIZATION_ID}/${path}/${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let finalThumbnailUrl = formData.thumbnail_url;
            let finalFileUrl = formData.file_url;

            // 1. Upload Thumbnail if exists
            if (thumbnailFile) {
                toast.loading('Enviando miniatura...', { id: 'upload-thumb' });
                finalThumbnailUrl = await uploadFile(thumbnailFile, 'marketing-materials', 'thumbnails');
                toast.success('Miniatura enviada!', { id: 'upload-thumb' });
            }

            // 2. Upload Content File if exists
            if (contentFile) {
                toast.loading('Enviando arquivo...', { id: 'upload-content' });
                finalFileUrl = await uploadFile(contentFile, 'marketing-materials', 'assets');
                toast.success('Arquivo enviado!', { id: 'upload-content' });
            }

            const payload = {
                ...formData,
                thumbnail_url: finalThumbnailUrl,
                file_url: finalFileUrl,
                organization_id: ORGANIZATION_ID,
                updated_at: new Date().toISOString()
            };

            if (editingMaterial) {
                const { error } = await supabase
                    .from('marketing_materials')
                    .update(payload)
                    .eq('id', editingMaterial.id)
                    .eq('organization_id', ORGANIZATION_ID);
                if (error) throw error;
                toast.success('Material atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('marketing_materials')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Material criado com sucesso!');
            }

            setIsModalOpen(false);
            fetchMaterials();
        } catch (error) {
            console.error('Error saving material:', error);
            toast.error('Erro ao salvar material.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este material?')) return;

        try {
            const { error } = await supabase
                .from('marketing_materials')
                .delete()
                .eq('id', id)
                .eq('organization_id', ORGANIZATION_ID);
            
            if (error) throw error;
            toast.success('Material excluído!');
            fetchMaterials();
        } catch (error) {
            console.error('Error deleting material:', error);
            toast.error('Erro ao excluir material.');
        }
    };

    const filteredMaterials = materials.filter(m => {
        const matchesTab = activeTab === 'all' || m.type === activeTab;
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             m.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-[#05080F]">Materiais de Apoio</h1>
                        <p className="text-slate-500 font-medium">Gerencie os conteúdos disponíveis para seus afiliados.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-[#05080F] text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-[#05080F]/10 hover:bg-[#2980B9] hover:text-[#05080F] transition-all whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Material
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto">
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
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id ? 'bg-[#05080F] text-[#2980B9] shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar material..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-[#2980B9] transition-all font-bold"
                        />
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-[2.5rem] h-80 animate-pulse border border-slate-50"></div>
                        ))
                    ) : filteredMaterials.length > 0 ? (
                        filteredMaterials.map(item => (
                            <div key={item.id} className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
                                {/* Preview */}
                                <div className="aspect-video relative overflow-hidden bg-slate-50 border-b border-slate-50">
                                    {item.type !== 'script' ? (
                                        item.thumbnail_url ? (
                                            <img
                                                src={item.thumbnail_url}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement?.classList.add('bg-[#05080F]');
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#05080F] flex items-center justify-center">
                                                {item.type === 'video' ? (
                                                    <Video className="w-12 h-12 text-[#2980B9] opacity-20" />
                                                ) : (
                                                    <ImageIcon className="w-12 h-12 text-slate-200 opacity-20" />
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#FFFBEB] p-8">
                                            <FileText className="w-12 h-12 text-[#2980B9] opacity-20" />
                                            <div className="absolute inset-0 p-6 flex flex-col justify-center">
                                                <p className="text-[10px] font-black text-[#2980B9] uppercase tracking-widest mb-2">Preview do Script</p>
                                                <p className="text-xs text-slate-400 font-bold italic line-clamp-3">"{item.content}"</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[8px] font-black uppercase tracking-widest text-[#05080F]">
                                            {item.type === 'script' ? 'Roteiro' : item.type === 'banner' ? 'Imagem' : item.type === 'pdf' ? 'PDF' : 'Vídeo'}
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-8 flex-grow">
                                    <h3 className="text-lg font-black text-[#05080F] mb-2 leading-tight">{item.title}</h3>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
                                </div>

                                {/* Actions */}
                                <div className="p-8 pt-0 flex gap-3 mt-auto">
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className="flex-grow py-4 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-[#2980B9] hover:text-[#05080F] transition-all"
                                    >
                                        <Edit className="w-4 h-4" /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-100">
                            <Library className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-[#05080F] mb-1">Nenhum material encontrado</h3>
                            <p className="text-slate-400 font-medium">Comece adicionando novos conteúdos para sua rede.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#05080F]/90 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
                            <div className="p-8 md:p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#2980B9] tracking-widest mb-1">Conteúdo</p>
                                    <h2 className="text-2xl font-black text-[#05080F]">
                                        {editingMaterial ? 'Editar Material' : 'Novo Material'}
                                    </h2>
                                </div>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-white text-slate-400 rounded-2xl hover:text-[#05080F] transition-all shadow-sm">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 md:p-10 space-y-6 overflow-y-auto">
                                {/* Type Selector */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'banner', label: 'Imagem', icon: ImageIcon },
                                        { id: 'video', label: 'Vídeo', icon: Video },
                                        { id: 'pdf', label: 'PDF', icon: FileIcon },
                                        { id: 'script', label: 'Script', icon: FileText }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: t.id as any })}
                                            className={`p-4 rounded-[1.5rem] border flex flex-col items-center gap-2 transition-all ${
                                                formData.type === t.id 
                                                ? 'bg-[#05080F] border-[#05080F] text-[#2980B9] shadow-lg shadow-[#05080F]/10' 
                                                : 'border-slate-100 text-slate-400 hover:border-[#2980B9]'
                                            }`}
                                        >
                                            <t.icon className="w-5 h-5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Título do Material</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all"
                                            placeholder="Ex: Catálogo Clube do Seu Bolso 2026"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Descrição Curta</label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all h-24 resize-none"
                                            placeholder="Descreva brevemente o uso deste material..."
                                        />
                                    </div>

                                    {formData.type === 'script' ? (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Conteúdo do Script</label>
                                            <textarea
                                                required
                                                value={formData.content}
                                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all h-40"
                                                placeholder="Digite o texto que o afiliado poderá copiar..."
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Miniatura (Thumbnail)</label>
                                                <div className="flex flex-col gap-3">
                                                    {formData.thumbnail_url && !thumbnailFile && (
                                                        <img src={formData.thumbnail_url} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-100" />
                                                    )}
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-4 flex flex-col items-center justify-center gap-2 group-hover:border-[#2980B9] transition-all">
                                                            <Upload className="w-5 h-5 text-slate-400" />
                                                            <span className="text-[10px] font-bold text-slate-500">
                                                                {thumbnailFile ? thumbnailFile.name : 'Selecionar Imagem do Computador'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-px bg-slate-100 flex-grow"></div>
                                                        <span className="text-[8px] font-black text-slate-300 uppercase">ou use link externo</span>
                                                        <div className="h-px bg-slate-100 flex-grow"></div>
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={formData.thumbnail_url}
                                                        onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all text-xs"
                                                        placeholder="https://exemplo.com/imagem.png"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-4">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
                                                    Arquivo do Material ({formData.type === 'banner' ? 'Imagem' : formData.type === 'video' ? 'Vídeo' : 'PDF'})
                                                </label>
                                                <div className="flex flex-col gap-3">
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            accept={
                                                                formData.type === 'banner' ? 'image/*' : 
                                                                formData.type === 'video' ? 'video/*' : 
                                                                'application/pdf'
                                                            }
                                                            required={!formData.file_url}
                                                            onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className="w-full bg-[#FFFBEB] border-2 border-dashed border-[#2980B9]/30 rounded-2xl py-8 flex flex-col items-center justify-center gap-3 group-hover:border-[#2980B9] transition-all">
                                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                                {formData.type === 'banner' ? <ImageIcon className="w-6 h-6 text-[#2980B9]" /> : 
                                                                 formData.type === 'video' ? <Video className="w-6 h-6 text-[#2980B9]" /> : 
                                                                 <FileIcon className="w-6 h-6 text-[#2980B9]" />}
                                                            </div>
                                                            <span className="text-xs font-black text-[#05080F]">
                                                                {contentFile ? contentFile.name : `Prcurar ${formData.type === 'banner' ? 'Imagem' : formData.type === 'video' ? 'Vídeo' : 'PDF'} no seu Computador`}
                                                            </span>
                                                            <p className="text-[8px] font-bold text-slate-400">Clique para selecionar o arquivo</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-px bg-slate-100 flex-grow"></div>
                                                        <span className="text-[8px] font-black text-slate-300 uppercase">ou use link externo</span>
                                                        <div className="h-px bg-slate-100 flex-grow"></div>
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={formData.file_url}
                                                        onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all text-xs"
                                                        placeholder="Link para o arquivo ou YouTube/Vimeo"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 md:p-10 bg-slate-50/50 border-t border-slate-50">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full py-5 bg-[#05080F] text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-[#05080F]/10 hover:bg-[#2980B9] hover:text-[#05080F] transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Salvando Conteúdo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            <span>{editingMaterial ? 'Salvar Alterações' : 'Publicar Material'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminMaterials;
