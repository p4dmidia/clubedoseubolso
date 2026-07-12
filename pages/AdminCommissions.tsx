import React, { useState, useEffect } from 'react';
import {
    Percent,
    Coins,
    Info,
    Save,
    RefreshCcw,
    Layers,
    ChevronRight,
    TrendingUp,
    Settings2,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ORGANIZATION_ID } from '../lib/config';

interface CommissionLevel {
    level: number;
    value: number;
}

interface CommissionConfig {
    key: string;
    type: 'percent' | 'money';
    active_generations: number;
    levels: CommissionLevel[];
}

const AdminCommissions: React.FC = () => {
    const [mmnType, setMmnType] = useState<'percent' | 'money'>('percent');
    const [mmnGens, setMmnGens] = useState(7);
    const [mmnLevels, setMmnLevels] = useState<CommissionLevel[]>([
        { level: 1, value: 0 },
        { level: 2, value: 0 },
        { level: 3, value: 0 },
        { level: 4, value: 0 },
        { level: 5, value: 0 },
        { level: 6, value: 0 },
        { level: 7, value: 0 },
    ]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('commission_configs')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID);

            if (error) throw error;

            if (data && data.length > 0) {
                const config = data.find(c => c.key === 'planos') || data.find(c => c.key === 'geral');

                if (config) {
                    setMmnType(config.type);
                    setMmnGens(config.active_generations);
                    setMmnLevels(config.levels);
                }
            }
        } catch (error) {
            console.error('Error fetching configs:', error);
            toast.error('Erro ao carregar configurações de comissões.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Delete old configs if they still exist
            await supabase
                .from('commission_configs')
                .delete()
                .in('key', ['plan_adesao', 'plan_mensal'])
                .eq('organization_id', ORGANIZATION_ID);

            const configs = [
                {
                    key: 'geral',
                    type: mmnType,
                    active_generations: mmnGens,
                    levels: mmnLevels,
                    organization_id: ORGANIZATION_ID,
                    updated_at: new Date().toISOString()
                },
                {
                    key: 'planos',
                    type: mmnType,
                    active_generations: mmnGens,
                    levels: mmnLevels,
                    organization_id: ORGANIZATION_ID,
                    updated_at: new Date().toISOString()
                }
            ];

            const { error } = await supabase
                .from('commission_configs')
                .upsert(configs);

            if (error) throw error;

            toast.success('Regras de comissão atualizadas com sucesso!');
        } catch (error) {
            console.error('Error saving configs:', error);
            toast.error('Erro ao salvar as configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateLevelValue = (level: number, newValue: number) => {
        const val = isNaN(newValue) ? 0 : newValue;
        setMmnLevels(prev => prev.map(l => l.level === level ? { ...l, value: val } : l));
    };

    const renderLevelInputs = (count: number, levels: CommissionLevel[], typeVal: 'percent' | 'money') => {
        return levels.slice(0, count).map((lvl) => (
            <div key={lvl.level} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-[#2980B9] transition-all">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-[#05080F] shadow-sm text-xs">
                    {lvl.level}º
                </div>
                <div className="flex-grow">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Geração {lvl.level}</p>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            value={lvl.value}
                            onChange={(e) => updateLevelValue(lvl.level, parseFloat(e.target.value))}
                            className="bg-transparent text-sm font-black text-[#05080F] outline-none w-full"
                        />
                        <span className="absolute right-0 top-0 text-slate-300 font-bold">{typeVal === 'percent' ? '%' : 'R$'}</span>
                    </div>
                </div>
            </div>
        ));
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-[#2980B9] animate-spin" />
                    <p className="font-bold text-slate-400">Carregando configurações...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#05080F]">Regras de Bonificação</h1>
                        <p className="text-sm md:text-base text-slate-500 font-medium">Configure a distribuição das comissões da rede por gerações.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => fetchConfigs()}
                            className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 px-4 md:px-6 py-3 rounded-2xl flex items-center gap-2 font-bold text-slate-600 hover:shadow-md transition-all text-sm md:text-base"
                        >
                            <RefreshCcw className="w-4 h-4 text-slate-400" />
                            Recarregar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none justify-center bg-[#05080F] text-white px-6 md:px-8 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-xl shadow-[#05080F]/10 hover:bg-[#1a2436] transition-all disabled:opacity-50 text-sm md:text-base"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#2980B9]" />}
                            Salvar Alterações
                        </button>
                    </div>
                </div>

                {/* Main Info Card */}
                <div className="bg-[#05080F] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#2980B9]/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center backdrop-blur-md shrink-0">
                            <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-[#2980B9]" />
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-xl md:text-2xl font-black mb-1 md:mb-2">Segurança de Matriz Unilever</h2>
                            <p className="text-sm md:text-base text-slate-400 max-w-2xl font-medium">As porcentagens/valores configurados serão aplicados sobre o pool de comissão correspondente de cada plano ou produto.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="text-center px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total da Rede</p>
                                <p className="text-2xl font-black text-[#2980B9] truncate min-w-[120px]">
                                    {mmnLevels.slice(0, mmnGens).reduce((acc, curr) => acc + (curr.value || 0), 0).toFixed(1)}
                                    {mmnType === 'percent' ? '%' : 'R$'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuration Container */}
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm p-6 md:p-10 max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 md:p-4 bg-emerald-50 rounded-xl md:rounded-2xl text-emerald-600">
                                <Layers className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-[#05080F]">Comissão de Rede</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuração Única de Indicação</p>
                            </div>
                        </div>

                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 w-full sm:w-auto">
                            <button
                                onClick={() => setMmnType('percent')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${mmnType === 'percent' ? 'bg-white shadow-sm text-[#05080F]' : 'text-slate-400'}`}
                            >
                                PORCENTAGEM (%)
                            </button>
                            <button
                                onClick={() => setMmnType('money')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${mmnType === 'money' ? 'bg-white shadow-sm text-[#05080F]' : 'text-slate-400'}`}
                            >
                                VALOR FIXO (R$)
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gerações Ativas: <span className="text-[#05080F]">{mmnGens}</span></label>
                                <span className="text-[10px] font-black text-[#2980B9] uppercase tracking-widest">Profundidade da Rede</span>
                            </div>
                            <input
                                type="range" min="1" max="7"
                                value={mmnGens}
                                onChange={(e) => setMmnGens(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#2980B9]"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                            {renderLevelInputs(mmnGens, mmnLevels, mmnType)}
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h4 className="font-black text-[#05080F]">Informação Importante</h4>
                        <p className="text-slate-500 text-xs md:text-sm font-medium">As novas regras de comissão entram em vigor imediatamente para todos os novos pedidos pagos na plataforma.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full md:w-auto px-10 py-4 bg-[#2980B9] text-[#05080F] rounded-2xl font-black text-sm md:text-base shadow-xl shadow-[#2980B9]/10 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        ATUALIZAR REGRAS DE REDE
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminCommissions;
