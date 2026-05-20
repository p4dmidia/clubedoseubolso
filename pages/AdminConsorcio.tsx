import React, { useState, useEffect } from 'react';
import {
    Users,
    Trophy,
    Plus,
    Search,
    Filter,
    Calendar,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Target,
    Trash2,
    Eye,
    Edit3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import { ORGANIZATION_ID } from '../lib/config';

const AdminConsorcio: React.FC = () => {
    const [groups, setGroups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [lotteryNumber, setLotteryNumber] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [officialResultUrl, setOfficialResultUrl] = useState('');
    const [totalDraws, setTotalDraws] = useState(0);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [irregularMembers, setIrregularMembers] = useState<any[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [drawWinner, setDrawWinner] = useState<any>(null);
    const [drawHistory, setDrawHistory] = useState<any[]>([]);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [groupParticipants, setGroupParticipants] = useState<any[]>([]);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
    const [isEditDrawMode, setIsEditDrawMode] = useState(false);
    const [currentDrawId, setCurrentDrawId] = useState<string | null>(null);

    // New Group State
    const [newGroup, setNewGroup] = useState({
        name: '',
        type: 'livre_escolha',
        max_participants: 12,
        organization_id: ORGANIZATION_ID
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('consortium_groups')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGroups(data || []);

            // Fetch Total Draws (filtered by groups in this org)
            const { count: drawCount } = await supabase
                .from('consortium_draws')
                .select('*, consortium_groups!inner(*)', { count: 'exact', head: true })
                .eq('consortium_groups.organization_id', ORGANIZATION_ID);
            setTotalDraws(drawCount || 0);

            // Fetch Total Participants (filtered by groups in this org)
            const { count: participantCount } = await supabase
                .from('consortium_participants')
                .select('*, consortium_groups!inner(*)', { count: 'exact', head: true })
                .eq('consortium_groups.organization_id', ORGANIZATION_ID);
            setTotalParticipants(participantCount || 0);

            await fetchIrregularMembers();
            await fetchDrawHistory();

        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error('Erro ao buscar grupos.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchIrregularMembers = async () => {
        try {
            // Fetch all participants and check their regularity
            const { data, error: pError } = await supabase
                .from('consortium_participants')
                .select(`
                    id, 
                    user_id,
                    lucky_number,
                    consortium_groups!inner (name, organization_id),
                    user:user_profiles (email)
                `)
                .eq('consortium_groups.organization_id', ORGANIZATION_ID);

            if (pError) throw pError;

            const participantsData = data as any[];

            // This is slightly inefficient but works for now. 
            // Better to have a dedicated view or composite function.
            const results = await Promise.all(participantsData.map(async (p) => {
                const { data: st, error: stErr } = await supabase
                    .rpc('check_consortium_regularity', { p_user_id: p.user_id });
                
                if (!stErr && st && st.length > 0 && st[0].status_text === 'Irregular') {
                    return { ...p, status: st[0] };
                }
                return null;
            }));

            setIrregularMembers(results.filter(r => r !== null));
        } catch (error) {
            console.error('Error fetching irregular members:', error);
        }
    };

    const fetchDrawHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('consortium_draws')
                .select(`
                    *,
                    consortium_groups!inner(organization_id),
                    winner:consortium_participants(
                        lucky_number,
                        user:user_profiles(email)
                    )
                `)
                .eq('consortium_groups.organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDrawHistory(data || []);
        } catch (error) {
            console.error('Error fetching draw history:', error);
        }
    };

    const fetchParticipants = async (groupId: string) => {
        setIsLoadingParticipants(true);
        try {
            const { data, error } = await supabase
                .from('consortium_participants')
                .select(`
                    *,
                    user:user_profiles(email, full_name)
                `)
                .eq('group_id', groupId)
                .order('lucky_number');

            if (error) throw error;
            setGroupParticipants(data || []);
        } catch (error) {
            console.error('Error fetching participants:', error);
            toast.error('Erro ao buscar participantes.');
        } finally {
            setIsLoadingParticipants(false);
        }
    };

    const handleRemoveParticipant = async (participantId: string) => {
        if (!confirm('Tem certeza que deseja remover este participante do grupo?')) return;

        try {
            const { error } = await supabase
                .from('consortium_participants')
                .delete()
                .eq('id', participantId);

            if (error) throw error;

            toast.success('Participante removido com sucesso!');
            if (selectedGroup) {
                fetchParticipants(selectedGroup.id);
                fetchGroups();
            }
        } catch (error) {
            console.error('Error removing participant:', error);
            toast.error('Erro ao remover participante.');
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('ATENÇÃO: Isso excluirá o grupo e todos os participantes e sorteios associados de forma definitiva. Deseja continuar?')) return;

        try {
            const { error } = await supabase
                .from('consortium_groups')
                .delete()
                .eq('id', groupId);

            if (error) throw error;

            toast.success('Grupo excluído com sucesso!');
            fetchGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Erro ao excluir grupo.');
        }
    };

    const handleOpenEditDraw = async (draw: any, group: any) => {
        setSelectedGroup(group);
        setIsEditDrawMode(true);
        setCurrentDrawId(draw.id);
        setLotteryNumber(draw.lottery_number);
        setVideoUrl(draw.video_url || '');
        setOfficialResultUrl(draw.official_result_url || '');
        setDrawWinner(draw.winner || draw.participant);
        setIsDrawModalOpen(true);
    };


    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Calculate first draw date (Day 11)
            const nextDrawDate = new Date();
            if (nextDrawDate.getDate() >= 11) {
                nextDrawDate.setMonth(nextDrawDate.getMonth() + 1);
            }
            nextDrawDate.setDate(11);
            nextDrawDate.setHours(10, 0, 0, 0);

            const { error } = await supabase
                .from('consortium_groups')
                .insert([{
                    ...newGroup,
                    next_draw_date: nextDrawDate.toISOString()
                }]);

            if (error) throw error;
            toast.success('Grupo criado com sucesso!');
            setIsCreateModalOpen(false);
            fetchGroups();
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error('Erro ao criar grupo.');
        }
    };

    const handleDraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;

        if (isEditDrawMode && currentDrawId) {
            try {
                const { error } = await supabase
                    .from('consortium_draws')
                    .update({
                        video_url: videoUrl,
                        official_result_url: officialResultUrl
                    })
                    .eq('id', currentDrawId);

                if (error) throw error;
                toast.success('Links atualizados com sucesso!');
                setIsDrawModalOpen(false);
                fetchDrawHistory();
            } catch (error) {
                console.error('Error updating draw links:', error);
                toast.error('Erro ao atualizar links.');
            }
            return;
        }

        if (!lotteryNumber) return;

        try {
            // 1. Fetch active participants for this group
            const { data: participants, error: partError } = await supabase
                .from('consortium_participants')
                .select('*')
                .eq('group_id', selectedGroup.id)
                .eq('status', 'active')
                .order('lucky_number');

            if (partError) throw partError;
            if (!participants || participants.length === 0) {
                toast.error('Nenhum participante ativo disponível neste grupo.');
                return;
            }

            // 2. Filter by regularity (Paid this month)
            // Note: In a larger system, this would be a single query.
            // For 12-18 participants, we can check in parallel.
            const regularParticipants = (await Promise.all(participants.map(async (p) => {
                const { data: reg } = await supabase.rpc('check_consortium_regularity', { p_user_id: p.user_id });
                if (reg && reg[0]?.is_regular) return p;
                return null;
            }))).filter(p => p !== null);

            if (regularParticipants.length === 0) {
                toast.error('Nenhum participante está EM DIA (Pago) para participar do sorteio.');
                return;
            }

            // 3. Selection Logic (Circular Fallback)
            const lotterySeed = parseInt(lotteryNumber.replace(/\D/g, ''));
            const targetLuckyNumber = (lotterySeed % selectedGroup.max_participants) + 1;
            
            // Circular selection: start from target and find the first available regular participant
            let winner = null;
            for (let i = 0; i < selectedGroup.max_participants; i++) {
                const currentSlot = ((targetLuckyNumber - 1 + i) % selectedGroup.max_participants) + 1;
                winner = regularParticipants.find(p => p.lucky_number === currentSlot);
                if (winner) break;
            }

            if (!winner) {
                // Should not happen if regularParticipants.length > 0
                winner = regularParticipants[0];
            }

            // ROLETTA EFFECT
            setIsSpinning(true);
            setDrawWinner(null);
            
            setTimeout(async () => {
                try {
                    const nextMonth = selectedGroup.current_month + 1;
                    
                    // 4. Record Draw
                    const { error: drawError } = await supabase
                        .from('consortium_draws')
                        .insert([{
                            group_id: selectedGroup.id,
                            winner_id: winner.id,
                            lottery_number: lotteryNumber,
                            video_url: videoUrl,
                            official_result_url: officialResultUrl,
                            month_number: nextMonth,
                            details: `Mês ${nextMonth} - Sorteio Federal nº ${lotteryNumber}. Vencedor original: Nº ${targetLuckyNumber}. Ganhador contemplado: Nº ${winner.lucky_number}.`
                        }]);

                    if (drawError) throw drawError;

                    // 5. Update participant status
                    await supabase
                        .from('consortium_participants')
                        .update({ status: 'contemplated' })
                        .eq('id', winner.id);
                    
                    // 6. Update group progress and next draw date (Always day 11 of next month)
                    const nextDrawDate = new Date();
                    nextDrawDate.setMonth(nextDrawDate.getMonth() + 1);
                    nextDrawDate.setDate(11);
                    nextDrawDate.setHours(10, 0, 0, 0);

                    await supabase
                        .from('consortium_groups')
                        .update({ 
                            current_month: nextMonth,
                            next_draw_date: nextDrawDate.toISOString(),
                            status: nextMonth >= selectedGroup.max_participants ? 'finished' : selectedGroup.status
                        })
                        .eq('id', selectedGroup.id);

                    setDrawWinner(winner);
                    setIsSpinning(false);
                    toast.success(`Sorteio Mês ${nextMonth} Finalizado!`);
                    fetchGroups();
                    fetchDrawHistory();
                } catch (err) {
                    console.error(err);
                    setIsSpinning(false);
                    toast.error('Erro ao finalizar sorteio.');
                }
            }, 3000);

        } catch (error) {
            console.error('Error performing draw:', error);
            toast.error('Erro ao realizar sorteio.');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#0B1221]">Consórcios</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> SORTEIOS TODO DIA 11
                            </span>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Administração de grupos e sorteios</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full sm:w-auto bg-[#0B1221] text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                        <Plus className="w-5 h-5 text-[#2980B9]" />
                        NOVO GRUPO
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                                <Users className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Grupos Ativos</span>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-[#0B1221]">{groups.filter(g => g.status !== 'finished').length}</p>
                    </div>
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#2980B9]/10 rounded-2xl flex items-center justify-center text-[#2980B9]">
                                <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sorteios</span>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-[#0B1221]">{totalDraws}</p>
                    </div>
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Vagas</span>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-[#0B1221]">{totalParticipants}</p>
                    </div>
                    <div className="bg-red-50 p-6 md:p-8 rounded-[2rem] border border-red-100 shadow-sm relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-500/5 rounded-full"></div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                                <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span className="text-red-400 font-black uppercase tracking-widest text-[10px]">Irregulares</span>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-red-600">{irregularMembers.length}</p>
                    </div>
                </div>

                {/* Irregular Members List */}
                {irregularMembers.length > 0 && (
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-red-100 overflow-hidden shadow-sm">
                        <div className="p-6 md:p-8 border-b border-red-50 bg-red-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-lg md:text-xl font-black text-red-900 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Membros Irregulares
                            </h3>
                            <span className="w-fit bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Ação Requerida</span>
                        </div>

                        {/* Mobile Card View */}
                        <div className="block lg:hidden divide-y divide-slate-50">
                            {irregularMembers.map((member) => (
                                <div key={member.id} className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Membro</p>
                                            <p className="font-bold text-[#0B1221] break-all">{member.user?.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Nº Sorte</p>
                                            <span className="inline-flex w-8 h-8 rounded-full bg-slate-100 text-[#0B1221] items-center justify-center font-black text-xs">
                                                {member.lucky_number.toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Grupo</p>
                                        <p className="font-bold text-slate-600">{member.consortium_groups?.name}</p>
                                    </div>
                                    <button 
                                        onClick={() => toast.success(`Notificação enviada para ${member.user?.email}`)}
                                        className="w-full bg-[#0B1221] text-white text-xs font-black py-4 rounded-xl hover:bg-red-600 transition-all shadow-lg"
                                    >
                                        NOTIFICAR AGORA
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4">Membro</th>
                                        <th className="px-8 py-4">Grupo</th>
                                        <th className="px-8 py-4">Nº Sorte</th>
                                        <th className="px-8 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {irregularMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-red-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-[#0B1221]">{member.user?.email}</div>
                                            </td>
                                            <td className="px-8 py-6 font-medium text-slate-600">
                                                {member.consortium_groups?.name}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="w-8 h-8 rounded-full bg-slate-100 text-[#0B1221] flex items-center justify-center font-black text-xs">
                                                    {member.lucky_number.toString().padStart(2, '0')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button 
                                                    onClick={() => toast.success(`Notificação enviada para ${member.user?.email}`)}
                                                    className="bg-[#0B1221] text-white text-[10px] font-black px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
                                                >
                                                    NOTIFICAR
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Groups Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {isLoading ? (
                        <div className="col-span-full py-20 flex justify-center">
                            <Loader2 className="w-10 h-10 text-[#2980B9] animate-spin" />
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                <div className="p-6 md:p-8">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${group.type === 'colchao' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {group.type === 'colchao' ? 'Colchão (18)' : 'Livre (12)'}
                                                </span>
                                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                                                    ID: {group.id.slice(0, 8)}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-[#0B1221] break-words">{group.name}</h3>
                                                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                                {group.status === 'finished' ? (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Ciclo Finalizado
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => { 
                                                            setSelectedGroup(group); 
                                                            setIsDrawModalOpen(true); 
                                                            setIsEditDrawMode(false);
                                                            setLotteryNumber('');
                                                            setVideoUrl('');
                                                            setOfficialResultUrl('');
                                                            setDrawWinner(null);
                                                        }}
                                                        className="flex-1 sm:flex-none flex items-center gap-2 bg-[#2980B9] text-[#0B1221] px-4 py-3 rounded-xl hover:bg-[#0B1221] hover:text-white transition-all shadow-lg shadow-[#2980B9]/10 font-black text-xs uppercase tracking-tight"
                                                    >
                                                        <Trophy className="w-4 h-4" />
                                                        Realizar Mês {group.current_month + 1}
                                                    </button>
                                                )}
                                            
                                            <div className="relative flex items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedGroup(group);
                                                        fetchParticipants(group.id);
                                                        setIsParticipantsModalOpen(true);
                                                    }}
                                                    className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all text-slate-400"
                                                    title="Opções"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteGroup(group.id)}
                                                    className="bg-red-50 p-3 rounded-xl hover:bg-red-100 transition-all text-red-400"
                                                    title="Excluir Grupo"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>           </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] md:text-xs font-bold text-slate-400">Progresso do Grupo</span>
                                                <span className="text-xs md:text-sm font-black text-[#0B1221]">{group.current_participants} / {group.max_participants}</span>
                                            </div>
                                            <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div
                                                    className="h-full bg-[#2980B9] transition-all duration-1000"
                                                    style={{ width: `${(group.current_participants / group.max_participants) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Recent Draws in this group */}
                                        <div className="space-y-3 mb-6">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sorteios Realizados</p>
                                            <div className="space-y-2">
                                                {drawHistory.filter(d => d.group_id === group.id).map(draw => (
                                                    <div key={draw.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-[10px] text-[#0B1221] border border-slate-100 shadow-sm">
                                                                {draw.month_number}º
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-[#0B1221]">Mês {draw.month_number}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(draw.draw_date || draw.created_at).toLocaleDateString('pt-BR')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-emerald-600 tracking-tight">Venceu: {draw.winner?.lucky_number || draw.participant?.lucky_number}</p>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleOpenEditDraw(draw, group)}
                                                                className="p-2 bg-white rounded-xl text-slate-400 hover:text-blue-500 transition-all border border-slate-100 shadow-sm"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {drawHistory.filter(d => d.group_id === group.id).length === 0 && (
                                                    <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Nenhum sorteio ainda</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <Clock className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter">Ciclo Atual</span>
                                                </div>
                                                <p className="text-xs md:text-sm font-black text-[#0B1221] uppercase">Mês {group.current_month || 0} de {group.max_participants}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <Calendar className="w-3 h-3 text-[#2980B9]" />
                                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter">Próximo Sorteio</span>
                                                </div>
                                                <p className="text-xs md:text-sm font-bold text-[#0B1221]">
                                                    {group.next_draw_date ? (
                                                        new Date(group.next_draw_date).toLocaleDateString('pt-BR')
                                                    ) : (
                                                        (() => {
                                                            const d = new Date();
                                                            if (d.getDate() >= 11) d.setMonth(d.getMonth() + 1);
                                                            return `11/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                                        })()
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Create Group Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-[#0B1221]/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                            <div className="p-6 md:p-10 flex-1 flex flex-col">
                                <h2 className="text-2xl md:text-3xl font-black text-[#0B1221] mb-8 shrink-0">Novo Grupo</h2>
                                <form onSubmit={handleCreateGroup} className="space-y-6 flex-1 flex flex-col overflow-auto px-1">
                                    <div className="space-y-6 flex-1">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Grupo</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-slate-50 rounded-xl px-4 py-4 border border-slate-100 outline-none focus:ring-2 focus:ring-[#2980B9]/50 font-bold"
                                                placeholder="Ex: Grupo Premium 01"
                                                value={newGroup.name}
                                                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Modalidade</label>
                                                <select
                                                    className="w-full bg-slate-50 rounded-xl px-4 py-4 border border-slate-100 outline-none font-bold"
                                                    value={newGroup.type}
                                                    onChange={(e) => setNewGroup({ ...newGroup, type: e.target.value, max_participants: e.target.value === 'colchao' ? 18 : 12 })}
                                                >
                                                    <option value="livre_escolha">Livre Escolha</option>
                                                    <option value="colchao">Colchão</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Participantes</label>
                                                <input
                                                    type="number"
                                                    disabled
                                                    className="w-full bg-slate-100 rounded-xl px-4 py-4 border border-slate-100 outline-none text-slate-400 font-bold"
                                                    value={newGroup.max_participants}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-8 md:pt-4 mt-auto">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="flex-1 bg-slate-50 text-slate-400 font-black py-4 rounded-xl hover:bg-slate-100 transition-all text-sm md:text-base"
                                        >
                                            CANCELAR
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-[#2980B9] text-[#0B1221] font-black py-4 rounded-xl hover:bg-[#0B1221] hover:text-white transition-all text-sm md:text-base shadow-lg shadow-[#2980B9]/20"
                                        >
                                            CRIAR GRUPO
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Draw Modal */}
                {isDrawModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-[#0B1221]/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border-2 border-[#2980B9]/20 flex flex-col">
                            
                            {/* Botão X de Fechar (Sempre Visível) */}
                            <button 
                                onClick={() => { setIsDrawModalOpen(false); setDrawWinner(null); setIsEditDrawMode(false); }}
                                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-[#0B1221] rounded-xl transition-all z-20"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>

                            <div className="p-6 md:p-10 flex-1 flex flex-col min-h-0">
                                <div className={`w-12 h-12 md:w-16 md:h-16 ${isEditDrawMode ? 'bg-blue-50 text-blue-500' : 'bg-[#2980B9]/10 text-[#2980B9]'} rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shrink-0`}>
                                    {isEditDrawMode ? <Edit3 className="w-6 h-6 md:w-8 md:h-8" /> : <Target className="w-6 h-6 md:w-8 md:h-8" />}
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-[#0B1221] text-center mb-1 md:mb-2 shrink-0">
                                    {isEditDrawMode ? 'Editar Links do Sorteio' : 'Realizar Sorteio'}
                                </h2>
                                <p className="text-slate-400 text-center text-xs md:text-sm font-medium mb-6 md:mb-8 shrink-0">
                                    Grupo: <span className="text-[#0B1221] font-black">{selectedGroup?.name}</span> • 
                                    <span className="text-emerald-600 font-bold ml-1">Mês {selectedGroup?.current_month + 1} de {selectedGroup?.max_participants}</span>
                                </p>

                                <form onSubmit={handleDraw} className="flex-1 flex flex-col min-h-0">
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-6">
                                        {!isEditDrawMode && !drawWinner && (
                                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shrink-0">
                                                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="text-[9px] md:text-[10px] font-black uppercase">Transparência</span>
                                                </div>
                                                <p className="text-[10px] md:text-xs text-emerald-800 font-medium">
                                                    (Federal Loteria % {selectedGroup?.max_participants}) + 1
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Resultado Federal (1º Prêmio)</label>
                                            <input
                                                type="text"
                                                required
                                                disabled={isEditDrawMode || !!drawWinner}
                                                className={`w-full ${isEditDrawMode || drawWinner ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'} rounded-xl px-4 py-4 border border-slate-100 outline-none focus:ring-2 focus:ring-[#2980B9]/50 text-center text-xl md:text-2xl font-black`}
                                                placeholder="Ex: 57342"
                                                value={lotteryNumber}
                                                onChange={(e) => setLotteryNumber(e.target.value)}
                                            />
                                        </div>

                                        {/* Campos de Links: Visíveis se não houver ganhador OU se estivermos editando */}
                                        {(!drawWinner || isEditDrawMode) && (
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Link do Vídeo</label>
                                                    <input
                                                        type="url"
                                                        className="w-full bg-slate-50 rounded-xl px-4 py-4 border border-slate-100 outline-none focus:ring-2 focus:ring-[#2980B9]/50 text-xs md:text-sm"
                                                        placeholder="Drive, YouTube, etc"
                                                        value={videoUrl}
                                                        onChange={(e) => setVideoUrl(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Resultado Oficial</label>
                                                    <input
                                                        type="url"
                                                        className="w-full bg-slate-50 rounded-xl px-4 py-4 border border-slate-100 outline-none focus:ring-2 focus:ring-[#2980B9]/50 text-xs md:text-sm"
                                                        placeholder="Link do site da Caixa"
                                                        value={officialResultUrl}
                                                        onChange={(e) => setOfficialResultUrl(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {isSpinning && (
                                            <div className="py-8 flex flex-col items-center justify-center gap-4 animate-pulse">
                                                <div className="w-16 h-16 border-4 border-[#2980B9] border-t-transparent rounded-full animate-spin"></div>
                                                <p className="font-black text-[#0B1221] animate-bounce">SORTEANDO...</p>
                                            </div>
                                        )}

                                        {drawWinner && !isSpinning && (
                                            <div className="py-8 bg-amber-50 rounded-[2rem] border-2 border-amber-200 flex flex-col items-center justify-center gap-2 animate-in zoom-in duration-500 shadow-inner">
                                                <Trophy className="w-12 h-12 text-[#2980B9]" />
                                                <h4 className="font-black text-[#0B1221]">TEMOS UM GANHADOR!</h4>
                                                <p className="text-2xl font-black text-amber-600">NÚMERO {drawWinner.lucky_number.toString().padStart(2, '0')}</p>
                                                <p className="text-xs font-bold text-slate-500">{drawWinner.user?.email}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-4 shrink-0 pt-4 border-t border-slate-50">
                                        <button
                                            type="button"
                                            disabled={isSpinning}
                                            onClick={() => { setIsDrawModalOpen(false); setDrawWinner(null); setIsEditDrawMode(false); }}
                                            className={`flex-1 ${drawWinner ? 'bg-[#0B1221] text-white' : 'bg-slate-50 text-slate-400'} font-black py-4 rounded-xl hover:opacity-90 transition-all text-sm md:text-base disabled:opacity-50`}
                                        >
                                            {drawWinner ? 'CONCLUÍDO' : 'CANCELAR'}
                                        </button>
                                        {!drawWinner && (
                                            <button
                                                type="submit"
                                                disabled={isSpinning || (!isEditDrawMode && !lotteryNumber)}
                                                className={`flex-1 ${isEditDrawMode ? 'bg-blue-500' : 'bg-[#2980B9]'} text-[#0B1221] font-black py-4 rounded-xl hover:opacity-90 transition-all text-sm md:text-base shadow-lg disabled:opacity-50`}
                                            >
                                                {isSpinning ? 'PROCESSANDO...' : isEditDrawMode ? 'SALVAR LINKS' : 'FINALIZAR'}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Participants Modal */}
                {isParticipantsModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-[#0B1221]/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                            <div className="p-6 md:p-10 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-[#0B1221]">Participantes do Grupo</h2>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{selectedGroup?.name}</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsParticipantsModalOpen(false)}
                                        className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"
                                    >
                                        FECHAR
                                    </button>
                                </div>

                                <div className="flex-1 overflow-auto min-h-[300px] pr-2">
                                    {isLoadingParticipants ? (
                                        <div className="py-20 flex justify-center">
                                            <Loader2 className="w-10 h-10 text-[#2980B9] animate-spin" />
                                        </div>
                                    ) : groupParticipants.length === 0 ? (
                                        <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-3xl">
                                            Nenhum participante neste grupo
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {groupParticipants.map((participant) => (
                                                <div key={participant.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-[#0B1221]">
                                                            {participant.lucky_number.toString().padStart(2, '0')}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#0B1221]">{participant.user?.full_name || 'Usuário'}</p>
                                                            <p className="text-xs text-slate-400 font-medium">{participant.user?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${participant.status === 'contemplated' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {participant.status === 'contemplated' ? 'Contemplado' : 'Ativo'}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleRemoveParticipant(participant.id)}
                                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 md:p-10 border-t border-slate-50 shrink-0 mt-auto">
                                    <button
                                        onClick={() => setIsParticipantsModalOpen(false)}
                                        className="w-full bg-[#0B1221] text-white font-black py-4 rounded-xl hover:opacity-90 transition-all text-sm md:text-base shadow-lg"
                                    >
                                        FECHAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Draw History Section */}
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm mt-12">
                    <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-lg md:text-xl font-black text-[#0B1221] flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-[#2980B9]" />
                            Ganhadores (Sorteados)
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lista Oficial de Contemplados</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Data</th>
                                    <th className="px-8 py-4">Ganhador</th>
                                    <th className="px-8 py-4">Nº Sorte</th>
                                    <th className="px-8 py-4">Loteria Federal</th>
                                    <th className="px-8 py-4 text-right">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {drawHistory.length > 0 ? drawHistory.map((draw) => (
                                    <tr key={draw.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-6 font-bold text-slate-600">
                                            {new Date(draw.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-[#0B1221]">{draw.winner?.user?.email || 'N/A'}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">
                                                {draw.winner?.lucky_number.toString().padStart(2, '0') || '00'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-medium text-slate-500">
                                            nº {draw.lottery_number}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <a 
                                                href={draw.official_result_url || '#'} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[10px] font-black text-blue-500 uppercase hover:underline"
                                            >
                                                Ver Comprovante
                                            </a>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            Nenhum sorteio realizado ainda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminConsorcio;

