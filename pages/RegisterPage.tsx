import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    CheckCircle2,
    Send,
    User,
    Lock,
    Mail,
    Phone,
    FileText,
    Download,
    Eye,
    EyeOff,
    Calendar,
    Gift
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { ORGANIZATION_ID } from '../lib/config';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const regTypeParam = searchParams.get('type');
    const buyProductId = searchParams.get('buy');

    const [regType, setRegType] = useState<'client' | 'affiliate'>(regTypeParam === 'client' ? 'client' : 'affiliate');
    const [formData, setFormData] = useState({
        nomeCompleto: '',
        cpf: '',
        email: '',
        whatsapp: '',
        dataNascimento: '',
        senha: '',
        confirmarSenha: '',
        aceiteContrato: false,
        aceiteLgpd: false
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sponsorCode, setSponsorCode] = useState<string | null>(null);
    const [sponsorName, setSponsorName] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        // Tenta capturar o código do patrocinador do cookie
        const ref = Cookies.get('classea_ref');
        if (ref) {
            console.log('Sponsor detected from cookie:', ref);
            setSponsorCode(ref);
            fetchSponsorName(ref);
        }
    }, []);

    const fetchSponsorName = async (code: string) => {
        try {
            const { data, error } = await supabase
                .from('affiliates')
                .select('full_name')
                .ilike('referral_code', code)
                .maybeSingle();
            
            if (data && data.full_name) {
                setSponsorName(data.full_name);
            } else {
                setSponsorName(null);
            }
        } catch (err) {
            console.error('Error fetching sponsor name:', err);
        }
    };

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            cpf: formatCPF(value)
        }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            whatsapp: formatPhone(value)
        }));
    };

    const handleSponsorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSponsorCode(val);
        if (val.trim().length >= 3) {
            fetchSponsorName(val.trim());
        } else {
            setSponsorName(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.senha !== formData.confirmarSenha) {
            setError('As senhas não coincidem.');
            return;
        }
        if (!formData.aceiteContrato) {
            setError('Você precisa aceitar os termos do contrato para prosseguir.');
            return;
        }
        if (!formData.aceiteLgpd) {
            setError('Você precisa consentir com a Política de Privacidade (LGPD) para prosseguir.');
            return;
        }
        if (!formData.cpf) {
            setError('Por favor, informe o seu CPF.');
            return;
        }

        setLoading(true);
        try {
            // Gera um login amigável a partir do email (ex: josesilva se jose.silva@email.com)
            const cleanLogin = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // 1. Verificar se o login já existe para evitar erro de trigger
            const { data: existingAff } = await supabase
                .from('affiliates')
                .select('id')
                .ilike('referral_code', cleanLogin)
                .eq('organization_id', ORGANIZATION_ID)
                .maybeSingle();
            
            let finalLogin = cleanLogin;
            if (existingAff) {
                const randomSuffix = Math.random().toString(36).substring(2, 6);
                finalLogin = `${cleanLogin}${randomSuffix}`;
            }

            // Pegar IP para log da LGPD
            let userIp = '0.0.0.0';
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                userIp = ipData.ip;
            } catch (e) {
                console.warn('Não foi possível obter o IP para LGPD');
            }

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.senha,
                options: {
                    data: {
                        nome: formData.nomeCompleto,
                        sobrenome: '',
                        login: finalLogin,
                        registration_type: regType === 'client' ? 'individual' : 'business',
                        role: regType === 'client' ? 'client' : 'affiliate',
                        sponsor_code: sponsorCode || null,
                        organization_id: ORGANIZATION_ID,
                        cpf: formData.cpf,
                        whatsapp: formData.whatsapp || null,
                        data_nascimento: formData.dataNascimento || null,
                        lgpd_accepted_at: new Date().toISOString(),
                        lgpd_ip: userIp,
                        lgpd_version: '1.0'
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (data?.user) {
                const newUser = data.user;
                console.log('User created successfully:', newUser.id);

                // Fallback de Segurança pós-cadastro
                setTimeout(async () => {
                    try {
                        console.log('Iniciando verificação de integridade pós-cadastro...');
                        
                        const { data: affCheck } = await supabase
                            .from('affiliates')
                            .select('id')
                            .eq('user_id', newUser.id)
                            .maybeSingle();
                            
                        if (!affCheck) {
                            console.warn('Trigger do banco falhou para Affiliates. Criando registro manualmente...');
                            
                            let sponsorId = null;
                            if (sponsorCode) {
                                const { data: sData } = await supabase
                                    .from('affiliates')
                                    .select('id')
                                    .ilike('referral_code', sponsorCode)
                                    .maybeSingle();
                                sponsorId = sData?.id || null;
                            }

                            const { error: insErr } = await supabase
                                .from('affiliates')
                                .insert({
                                    user_id: newUser.id,
                                    email: formData.email,
                                    full_name: formData.nomeCompleto.trim(),
                                    referral_code: finalLogin,
                                    whatsapp: formData.whatsapp,
                                    organization_id: ORGANIZATION_ID,
                                    sponsor_id: sponsorId,
                                    is_active: false,
                                    is_verified: true
                                });
                                
                            if (insErr) {
                                console.error('Erro ao criar afiliado manualmente:', insErr);
                            } else console.log('Registro de afiliado criado com sucesso via fallback.');
                        }

                        const { data: profCheck } = await supabase
                            .from('user_profiles')
                            .select('full_name, sponsor_id')
                            .eq('id', newUser.id)
                            .maybeSingle();

                        if (profCheck && (!profCheck.full_name || !profCheck.sponsor_id)) {
                            console.log('Atualizando perfil com dados faltantes...');
                            
                            let sponsorUserId = null;
                            if (sponsorCode) {
                                const { data: sUserData } = await supabase
                                    .from('affiliates')
                                    .select('user_id')
                                    .ilike('referral_code', sponsorCode)
                                    .maybeSingle();
                                sponsorUserId = sUserData?.user_id || null;
                            }

                            await supabase
                                .from('user_profiles')
                                .update({
                                    full_name: formData.nomeCompleto.trim(),
                                    sponsor_id: sponsorUserId,
                                    referrer_id: sponsorUserId,
                                    whatsapp: formData.whatsapp,
                                    login: finalLogin,
                                    lgpd_accepted_at: new Date().toISOString(),
                                    lgpd_version: '1.0'
                                })
                                .eq('id', newUser.id);
                        }

                    } catch (fallbackErr) {
                        console.error('Erro no fallback de cadastro:', fallbackErr);
                    }
                }, 2000);

                toast.success('Cadastro realizado com sucesso! Bem-vindo à Clube do Seu Bolso.', {
                    duration: 5000,
                    style: {
                        background: '#0B1221',
                        color: '#fff',
                        fontWeight: 'bold',
                        borderRadius: '1rem',
                        border: '1px solid rgba(251, 192, 45, 0.2)'
                    },
                    iconTheme: {
                        primary: '#2980B9',
                        secondary: '#0B1221',
                    },
                });

                setTimeout(() => {
                    if (regType === 'client' && buyProductId) {
                        navigate(`/checkout?buy=${buyProductId}`);
                    } else {
                        navigate('/login');
                    }
                }, 3000);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar cadastro.');
            toast.error(err.message || 'Erro ao realizar cadastro.');
            console.error('Erro no cadastro:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen font-sans">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#0B1221] py-16 lg:py-24">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#2980B9]/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block bg-[#2980B9]/20 text-[#2980B9] text-[10px] font-black tracking-[0.2em] uppercase px-4 py-2 rounded-full mb-6">
                        {regType === 'client' ? 'Cadastro do Cliente' : 'Seja um Parceiro Clube do Seu Bolso'}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                        {regType === 'client' ? (
                            <>
                                Ative seu Plano de Saúde <br />
                                <span className="text-[#2980B9]">e comece a usar agora</span>
                            </>
                        ) : (
                            <>
                                Crie sua conta e comece <br />
                                <span className="text-[#2980B9]">sua jornada de sucesso</span>
                            </>
                        )}
                    </h1>
                </div>
            </section>

            {/* Registration Form Section */}
            <section className="py-20 -mt-16 relative z-20 pb-32">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        {sponsorName && (
                            <div className="bg-[#2980B9]/10 border border-[#2980B9]/20 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3 animate-bounce-subtle">
                                <div className="w-8 h-8 bg-[#2980B9] rounded-full flex items-center justify-center text-[#0B1221]">
                                    <User className="w-4 h-4" />
                                </div>
                                <p className="text-[#0B1221] font-black text-xs uppercase tracking-widest">
                                    Você está sendo indicado(a) por <span className="text-[#2980B9] bg-[#0B1221] px-2 py-0.5 rounded ml-1">{sponsorName}</span>
                                </p>
                            </div>
                        )}
                        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 p-8 lg:p-12">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Seletor de Tipo de Cadastro */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Escolha o Tipo de Perfil</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setRegType('affiliate')}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                                regType === 'affiliate'
                                                    ? 'border-[#2980B9] bg-[#2980B9]/5'
                                                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                            }`}
                                        >
                                            <span className="block font-black text-sm text-[#0B1221]">Afiliado</span>
                                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Quero indicar e ter ganhos</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRegType('client')}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                                regType === 'client'
                                                    ? 'border-[#2980B9] bg-[#2980B9]/5'
                                                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                            }`}
                                        >
                                            <span className="block font-black text-sm text-[#0B1221]">Cliente</span>
                                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Apenas compras e planos</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <h3 className="text-2xl font-black text-[#0B1221] mb-2">
                                        {regType === 'client' ? 'Dados do Cliente' : 'Dados do Afiliado'}
                                    </h3>
                                    <p className="text-slate-400 text-sm font-medium">
                                        {regType === 'client' 
                                            ? 'Preencha seus dados para habilitar a contratação do seu plano.' 
                                            : 'Cadastre-se gratuitamente para receber seu link de indicação do EVA.'}
                                    </p>
                                    
                                    <div className={`mt-4 p-5 rounded-2xl border text-xs font-bold leading-relaxed ${
                                        regType === 'client'
                                            ? 'bg-sky-50 border-sky-100 text-sky-800'
                                            : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                    }`}>
                                        {regType === 'client' ? (
                                            <div className="space-y-1">
                                                <p className="uppercase text-[9px] tracking-widest text-[#2980B9] font-black">Informação do Plano</p>
                                                <p>✓ Consultas médicas ilimitadas por telemedicina.</p>
                                                <p>✓ Zero carência - comece a utilizar imediatamente após o pagamento.</p>
                                                <p>✓ Redirecionamento automático para a fatura após o preenchimento.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="uppercase text-[9px] tracking-widest text-emerald-600 font-black">Regra de Qualificação MMN</p>
                                                <p>✓ Cadastro 100% gratuito com acesso imediato ao Escritório Virtual.</p>
                                                <p>✓ Para receber comissões: Indique 1 novo cliente por mês **OU** pague R$ 17 (taxa EVA).</p>
                                                <p>✓ Ganhos de rede de alta profundidade com unificação automática.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Nome Completo */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                            <input
                                                type="text" name="nomeCompleto" required
                                                value={formData.nomeCompleto} onChange={handleChange}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all"
                                                placeholder="Ex: João Silva"
                                            />
                                        </div>
                                    </div>

                                    {/* CPF */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">CPF (Pessoa Física)</label>
                                        <div className="relative">
                                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                            <input
                                                type="text" name="cpf" required
                                                value={formData.cpf} onChange={handleCpfChange}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all"
                                                placeholder="000.000.000-00"
                                            />
                                        </div>
                                    </div>

                                    {/* E-mail */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                            <input
                                                type="email" name="email" required
                                                value={formData.email} onChange={handleChange}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all"
                                                placeholder="exemplo@email.com"
                                            />
                                        </div>
                                    </div>

                                    {/* WhatsApp / Celular */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">WhatsApp / Celular</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                            <input
                                                type="text" name="whatsapp" required
                                                value={formData.whatsapp} onChange={handlePhoneChange}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>

                                    {/* Data de Nascimento */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Data de Nascimento</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                            <input
                                                type="date" name="dataNascimento" required
                                                value={formData.dataNascimento} onChange={handleChange}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Senhas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Senha</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                                <input
                                                    type={showPassword ? "text" : "password"} name="senha" required
                                                    value={formData.senha} onChange={handleChange}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all"
                                                    placeholder="********"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2980B9]"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Confirmar Senha</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                                <input
                                                    type={showPassword ? "text" : "password"} name="confirmarSenha" required
                                                    value={formData.confirmarSenha} onChange={handleChange}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all"
                                                    placeholder="********"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cupom de Indicação */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Cupom de Indicação (Opcional)</label>
                                        <div className="relative">
                                            <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2980B9]" />
                                            <input
                                                type="text" name="sponsorCode"
                                                value={sponsorCode || ''} onChange={handleSponsorChange}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#05080F] outline-none focus:border-[#2980B9] transition-all uppercase"
                                                placeholder="CÓDIGO DE QUEM TE INDICOU"
                                            />
                                        </div>
                                        {sponsorName && (
                                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest pl-1 mt-1">
                                                Indicado por: {sponsorName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Contract Acceptance */}
                                <div className="bg-slate-50 rounded-[2rem] p-6 md:p-8 space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                            <FileText className="w-6 h-6 text-[#2980B9]" />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-black text-sm text-[#0B1221]">
                                                {regType === 'client' ? 'Termos de Uso e Regulamento' : 'Contrato de Afiliação'}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                                                {regType === 'client' 
                                                    ? 'Leia as regras gerais de uso do clube' 
                                                    : 'Leia as regras de bonificação e termos de uso'}
                                            </p>
                                            <button type="button" className="flex items-center gap-2 text-[#0B1221] text-[10px] font-black hover:text-[#2980B9] transition-colors bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-sm uppercase tracking-widest">
                                                <Download className="w-3.5 h-3.5" /> BAIXAR PDF
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setFormData(p => ({ ...p, aceiteContrato: !p.aceiteContrato }))}
                                        className="flex items-center gap-4 cursor-pointer group select-none"
                                    >
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.aceiteContrato ? 'bg-[#2980B9] border-[#2980B9]' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                                            {formData.aceiteContrato && <CheckCircle2 size={16} className="text-[#0B1221]" />}
                                        </div>
                                        <span className="text-[10px] font-black text-[#0B1221] uppercase tracking-widest">
                                            {regType === 'client' 
                                                ? 'Li e aceito o Regulamento e Termos do Clube' 
                                                : 'Li e aceito todas as regras do negócio'}
                                        </span>
                                    </div>
                                    <div
                                        onClick={() => setFormData(p => ({ ...p, aceiteLgpd: !p.aceiteLgpd }))}
                                        className="flex items-center gap-4 cursor-pointer group select-none"
                                    >
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.aceiteLgpd ? 'bg-[#2980B9] border-[#2980B9]' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                                            {formData.aceiteLgpd && <CheckCircle2 size={16} className="text-[#0B1221]" />}
                                        </div>
                                        <span className="text-[10px] font-black text-[#0B1221] uppercase tracking-widest leading-relaxed">
                                            Consinto com a Política de Privacidade e armazenamento de meus dados pessoais (LGPD).
                                        </span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-5 bg-[#0B1221] text-white rounded-2xl font-black text-sm shadow-2xl shadow-[#0B1221]/20 hover:bg-[#1a2436] transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? 'PROCESSANDO...' : 'CRIAR MINHA CONTA AGORA'}
                                    <Send className="w-5 h-5 text-[#2980B9]" />
                                </button>
                            </form>
                        </div>
                        <p className="mt-8 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                            Clube do Seu Bolso © 2026 - Todos os direitos reservados
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RegisterPage;
