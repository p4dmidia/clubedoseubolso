import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ORGANIZATION_ID } from '../lib/config';
import { recordSecurityLog } from '../lib/security';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        senha: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        let loginIdentifier = formData.email.trim();

        try {
            // Se não for um e-mail (não tem @), tenta buscar o e-mail pelo login/username
            if (!loginIdentifier.includes('@')) {
                const { data: profileData, error: lookupError } = await supabase
                    .from('user_profiles')
                    .select('email')
                    .ilike('login', loginIdentifier)
                    .eq('organization_id', ORGANIZATION_ID)
                    .maybeSingle();

                if (lookupError || !profileData || !profileData.email) {
                    throw new Error('Usuário não encontrado. Verifique seu login ou e-mail.');
                }

                loginIdentifier = profileData.email.trim();
            }

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: loginIdentifier,
                password: formData.senha,
            });

            if (signInError) throw signInError;

            if (data?.session) {
                // Pre-verify organization_id to avoid "Success -> Rejected" UX
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('organization_id')
                    .eq('id', data.session.user.id)
                    .single();

                if (profileError || !profile || profile.organization_id !== ORGANIZATION_ID) {
                    await supabase.auth.signOut();
                    throw new Error('E-mail ou senha não encontrados.');
                }

                // Gravar log de sucesso de login
                recordSecurityLog(loginIdentifier, 'login_success', 'success');

                toast.success('Login realizado com sucesso!', {
                    style: {
                        background: '#0B1221',
                        color: '#fff',
                        borderRadius: '1rem',
                        border: '1px solid rgba(41, 128, 185, 0.2)'
                    },
                });
                
                // Fetch user profile to redirect correctly
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();
                    
                if (profileData?.role === 'admin_master' || profileData?.role === 'admin_op') {
                    navigate('/admin/dashboard');
                } else if (profileData?.role === 'affiliate') {
                    navigate('/afiliado/dashboard');
                } else {
                    const params = new URLSearchParams(window.location.search);
                    const upgrade = params.get('upgrade');
                    if (upgrade === 'true') {
                        navigate('/cliente/compras?upgrade=true');
                    } else {
                        navigate('/cliente/compras');
                    }
                }
            }
        } catch (err: any) {
            // Gravar log de falha de login
            recordSecurityLog(loginIdentifier, 'login_failure', 'failure');

            let message = 'Erro ao realizar login. Verifique suas credenciais.';
            if (err.message === 'Invalid login credentials') {
                // Se a pessoa digitou um username que puxou um email, podemos avisar que a senha daquele email está errada
                if (!formData.email.includes('@') && loginIdentifier.includes('@')) {
                    const parts = loginIdentifier.split('@');
                    const maskedEmail = `${parts[0].substring(0, 3)}***@${parts[1]}`;
                    message = `Senha incorreta para o e-mail vinculado (${maskedEmail})`;
                } else {
                    message = 'E-mail ou senha incorretos.';
                }
            } else if (err.message) {
                message = err.message;
            }

            setError(message);
            toast.error(message);
            console.error('Erro no login:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-20 px-4">
            <div className="max-w-md w-full">
                {/* Header/Logo Area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-6">
                        <img src="/assets/logo.png" alt="Clube do Seu Bolso" className="h-24 w-auto drop-shadow-sm" />
                    </div>
                    <h1 className="text-3xl font-black text-[#0B1221]">Bem-vindo de volta!</h1>
                    <p className="text-slate-500 mt-2">Acesse sua conta para gerenciar seus negócios.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 p-10 border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">E-mail ou Usuário</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="seu@email.com"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 outline-none focus:border-[#2980B9] focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Senha</label>
                                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-[#2980B9] hover:underline">Esqueceu a senha?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="senha"
                                    value={formData.senha}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 pr-12 outline-none focus:border-[#2980B9] focus:bg-white transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2980B9] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
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
                            className={`w-full bg-[#0B1221] hover:bg-[#1a2436] text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#0B1221]/20 group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'ENTRANDO...' : 'ENTRAR NO SISTEMA'}
                            <LogIn className="w-5 h-5 text-[#2980B9] group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    {/* Registration Redirect Area */}
                    <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500 text-sm">Ainda não faz parte do time?</p>
                        <Link to="/register" className="mt-4 inline-flex items-center gap-2 text-[#0B1221] font-black hover:text-[#2980B9] transition-colors group">
                            CADASTRAR-SE AGORA
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Support Footer */}
                <p className="text-center mt-8 text-xs text-slate-400 uppercase tracking-widest font-bold">
                    Problemas com acesso? <a href="#" className="text-[#2980B9]">Suporte Clube do Seu Bolso</a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
