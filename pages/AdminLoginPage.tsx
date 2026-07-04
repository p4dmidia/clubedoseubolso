
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { recordSecurityLog } from '../lib/security';

const AdminLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // MFA States
    const [isMfaRequired, setIsMfaRequired] = useState(false);
    const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
    const mfaChallengeId = React.useRef<string | null>(null);
    const [otpCode, setOtpCode] = useState('');
    const [tempUserEmail, setTempUserEmail] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Authenticate with Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            // 2. Check assurance level for MFA
            const { data: assuranceData, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (assuranceError) throw assuranceError;

            if (assuranceData.nextLevel === 'aal2' && assuranceData.currentLevel === 'aal1') {
                const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
                if (factorsError) throw factorsError;

                const activeFactor = factorsData.totp.find(f => f.status === 'verified');
                if (activeFactor) {
                    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                        factorId: activeFactor.id
                    });
                    if (challengeError) throw challengeError;

                    setMfaFactorId(activeFactor.id);
                    mfaChallengeId.current = challengeData.id;
                    setTempUserEmail(email);
                    setIsMfaRequired(true);
                    setIsLoading(false);
                    return;
                }
            }

            // 3. Check Role in user_profiles
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw new Error('Falha ao verificar permissões de acesso.');

            if (profile?.role !== 'admin_master' && profile?.role !== 'admin_op') {
                // Not an admin - Force Logout
                await supabase.auth.signOut();
                recordSecurityLog(email, 'login_failure', 'failure');
                toast.error('Acesso negado. Esta área é restrita a administradores.');
                setIsLoading(false);
                return;
            }

            // 4. Success
            recordSecurityLog(email, 'login_success', 'success');
            toast.success('Autenticação realizada com sucesso!');
            navigate('/admin/dashboard');

        } catch (error: any) {
            recordSecurityLog(email, 'login_failure', 'failure');
            console.error('Admin Login Error:', error);
            toast.error(error.message || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mfaFactorId || !mfaChallengeId.current || !otpCode.trim()) {
            toast.error('Por favor, digite o código de 6 dígitos.');
            return;
        }

        setIsLoading(true);
        try {
            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaFactorId,
                challengeId: mfaChallengeId.current,
                code: otpCode.trim()
            });

            if (verifyError) throw verifyError;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não encontrado.');

            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError) throw new Error('Falha ao verificar permissões de acesso.');

            if (profile?.role !== 'admin_master' && profile?.role !== 'admin_op') {
                await supabase.auth.signOut();
                recordSecurityLog(tempUserEmail, 'login_failure', 'failure');
                toast.error('Acesso negado. Esta área é restrita a administradores.');
                setIsMfaRequired(false);
                setIsLoading(false);
                return;
            }

            recordSecurityLog(tempUserEmail, 'login_success', 'success');
            toast.success('Autenticação realizada com sucesso!');
            navigate('/admin/dashboard');
        } catch (error: any) {
            console.error('MFA Verification Error:', error);
            toast.error(error.message || 'Código inválido. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-6 font-['Inter',_sans-serif]">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#2980B9]/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[440px] relative z-10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-8">
                {/* Logo/Icon Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] mb-6 backdrop-blur-xl group">
                        <ShieldAlert className="w-10 h-10 text-[#2980B9] transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Clube do Seu Bolso</h1>
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-px w-8 bg-white/10"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Ambiente Restrito</span>
                        <div className="h-px w-8 bg-white/10"></div>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                    {/* Glowing border effect */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#2980B9]/50 to-transparent opacity-50"></div>                    {isMfaRequired ? (
                        <form onSubmit={handleVerifyMfa} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Segurança (MFA)</label>
                                <div className="relative group/input">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-[#2980B9] transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-slate-600 outline-none focus:border-[#2980B9]/50 focus:bg-white/10 transition-all font-black text-lg tracking-[0.5em] text-center"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold ml-1 uppercase tracking-wider">
                                    Abra seu aplicativo autenticador e insira o código de 6 dígitos.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#2980B9] hover:bg-[#ffcd54] text-[#05080F] py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 group shadow-xl shadow-[#2980B9]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-4 border-[#05080F]/20 border-t-[#05080F] rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        CONFIRMAR E ACESSAR
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    setIsMfaRequired(false);
                                    setOtpCode('');
                                }}
                                className="w-full bg-transparent hover:bg-white/5 text-slate-400 py-3 rounded-2xl font-bold transition-all text-xs uppercase tracking-wider"
                            >
                                Voltar para o Login
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Administrativo</label>
                                <div className="relative group/input">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-[#2980B9] transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@classea.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-slate-600 outline-none focus:border-[#2980B9]/50 focus:bg-white/10 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                                </div>
                                <div className="relative group/input">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-[#2980B9] transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-14 text-white placeholder:text-slate-600 outline-none focus:border-[#2980B9]/50 focus:bg-white/10 transition-all font-medium"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#2980B9] hover:bg-[#ffcd54] text-[#05080F] py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 group shadow-xl shadow-[#2980B9]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-4 border-[#05080F]/20 border-t-[#05080F] rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        AUTENTICAR ACESSO
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                    {/* Footer Warning */}
                    <div className="mt-8 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                        <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                            Conexão segura e criptografada (SSL). Tentativas de acesso não autorizado serão registradas.
                        </p>
                    </div>
                </div>

                {/* Return Note (Optional/Hidden) */}
                <div className="mt-10 text-center">
                    <p className="text-slate-600 text-xs font-medium">
                        © 2026 CLUBE DO SEU BOLSO - Sistema de Gestão Interna
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
