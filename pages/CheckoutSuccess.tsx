import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck,
  QrCode,
  Loader2,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const CheckoutSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form states for conclusion of registration
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(true);
  const [hasInitializedPasswordFields, setHasInitializedPasswordFields] = useState(false);

  const [formInfo, setFormInfo] = useState({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    birthDate: '',
    sex: ''
  });

  // Determinar o ID do pedido
  const effectiveOrderId = orderId;

  const isOrderOwner = !!(currentUser && order && currentUser.email?.toLowerCase() === order.customer_email?.toLowerCase());

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  
  const isSequentialOrRepeated = (str: string) => {
    const sequences = ['12345678', '87654321', '10111213', 'abcdefgh'];
    if (sequences.some(seq => str.toLowerCase().includes(seq))) return true;
    if (/^(.)\1+$/.test(str)) return true;
    return false;
  };
  const isPasswordEasy = isSequentialOrRepeated(password);

  const isPasswordStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && !isPasswordEasy;

  useEffect(() => {
    if (order && !hasInitializedPasswordFields) {
      if (currentUser && currentUser.email?.toLowerCase() === order.customer_email?.toLowerCase()) {
        setShowPasswordFields(false);
      } else {
        setShowPasswordFields(true);
      }
      setHasInitializedPasswordFields(true);
    }
  }, [order, currentUser, hasInitializedPasswordFields]);

  useEffect(() => {
    if (!effectiveOrderId) {
        setLoading(false);
        return;
    }

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', effectiveOrderId)
          .single();

        if (error) throw error;
        
        // Merge with session state if available for better experience
        const state = location.state as any;
        if (state && data) {
          data.pix_qr_code = state.qrCode || data.pix_qr_code;
          data.pix_qr_code_base64 = state.qrCodeBase64 || data.pix_qr_code_base64;
          data.pix_copy_paste = state.copyPaste || data.pix_copy_paste;
        }
        
        setOrder(data);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError('Não foi possível carregar os detalhes do pedido.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const { data } = await supabase
            .from('user_profiles')
            .select('role, cep, address, street, number, complement, neighborhood, city, state, birth_date, sex')
            .eq('id', user.id)
            .maybeSingle();
          if (data) {
            setUserRole(data.role);
            setFormInfo(prev => ({
              ...prev,
              cep: data.cep || prev.cep || '',
              street: data.street || data.address || prev.street || '',
              number: data.number || prev.number || '',
              complement: data.complement || prev.complement || '',
              neighborhood: data.neighborhood || prev.neighborhood || '',
              city: data.city || prev.city || '',
              state: data.state || prev.state || '',
              birthDate: data.birth_date || prev.birthDate || '',
              sex: data.sex || prev.sex || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchOrder();
    fetchUserProfile();

    // Inscrição Realtime para mudanças no status do pedido
    const subscription = supabase
      .channel(`order_status_${effectiveOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${effectiveOrderId}`
        },
        (payload) => {
          console.log('Order updated in realtime:', payload.new);
          setOrder(payload.new);
          if (payload.new.status === 'Pago') {
            toast.success('Pagamento confirmado com sucesso!', {
              icon: '🚀',
              duration: 5000
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [effectiveOrderId]);

  const handleCepChange = async (val: string) => {
    setFormInfo(prev => ({ ...prev, cep: val }));
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      const loadingToast = toast.loading('Buscando CEP...');
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        toast.dismiss(loadingToast);
        if (!data.erro) {
          setFormInfo(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }));
          toast.success('Endereço preenchido!');
        } else {
          toast.error('CEP não encontrado.');
        }
      } catch (e) {
        toast.dismiss(loadingToast);
        console.error('Error fetching CEP:', e);
      }
    }
  };

  const handleRegisterComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInfo.cep || !formInfo.street || !formInfo.number || !formInfo.neighborhood || !formInfo.city || !formInfo.state || !formInfo.birthDate || !formInfo.sex) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (!termsAccepted) {
      toast.error('Você precisa aceitar os termos de uso para continuar.');
      return;
    }

    // Se precisar de senha, valida senhas para criar a conta do cliente
    if (showPasswordFields) {
      if (!password || !confirmPassword) {
        toast.error('Por favor, defina uma senha para sua conta.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem.');
        return;
      }
      if (!hasMinLength) {
        toast.error('A senha deve ter pelo menos 8 caracteres.');
        return;
      }
      if (!hasUpperCase) {
        toast.error('A senha deve conter pelo menos uma letra maiúscula.');
        return;
      }
      if (!hasLowerCase) {
        toast.error('A senha deve conter pelo menos uma letra minúscula.');
        return;
      }
      if (!hasNumber) {
        toast.error('A senha deve conter pelo menos um número.');
        return;
      }
      if (!hasSpecialChar) {
        toast.error('A senha deve conter pelo menos um caractere especial (ex: @, #, $, !).');
        return;
      }
      if (isPasswordEasy) {
        toast.error('A senha é muito simples ou fácil de adivinhar. Por favor, escolha outra.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let activeUserId = isOrderOwner ? currentUser?.id : null;

      // Check if there is an active session right now for the order email
      if (!activeUserId) {
        const { data: { user: sessionUser } } = await supabase.auth.getUser();
        if (sessionUser && sessionUser.email?.toLowerCase() === order.customer_email?.toLowerCase()) {
          activeUserId = sessionUser.id;
          setCurrentUser(sessionUser);
        }
      }

      // Se ainda não tiver activeUserId, verificar se o perfil já foi criado (ex: erro em tentativa anterior)
      if (!activeUserId) {
        let existingProfile = null;
        const { data: byEmail } = await supabase
          .from('user_profiles')
          .select('id, email')
          .eq('email', order.customer_email)
          .maybeSingle();
        existingProfile = byEmail;

        if (!existingProfile && order.customer_cpf) {
          const cleanCpf = order.customer_cpf.replace(/\D/g, '');
          const { data: byCpf } = await supabase
            .from('user_profiles')
            .select('id, email')
            .or(`cpf.eq.${order.customer_cpf},cpf.eq.${cleanCpf}`)
            .maybeSingle();
          existingProfile = byCpf;
        }

        if (existingProfile) {
          console.log('Perfil já existente no banco de dados:', existingProfile.id);
          activeUserId = existingProfile.id;
          
          // Se já estiver logado (ou logou na tentativa anterior), tenta atualizar a senha para a nova fornecida
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user.id === activeUserId) {
              console.log('Sessão ativa detectada. Atualizando senha no Supabase...');
              await supabase.auth.updateUser({ password: password });
            } else {
              // Tenta fazer login para restabelecer a sessão com a senha atual
              const { data: signInData } = await supabase.auth.signInWithPassword({
                email: existingProfile.email || order.customer_email,
                password: password
              });
              if (signInData?.user) {
                setCurrentUser(signInData.user);
              }
            }
          } catch (err) {
            console.warn('Erro ao atualizar ou restabelecer sessão:', err);
          }
        }
      }

      if (!activeUserId) {
        // Obter IP para LGPD
        let userIp = '0.0.0.0';
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipRes.json();
          userIp = ipData.ip;
        } catch (e) {
          console.warn('Não foi possível obter o IP para LGPD');
        }

        // 1. Criar conta (signUp)
        const cleanLogin = order.customer_email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const finalLogin = `${cleanLogin}${randomSuffix}`;

        console.log('Signing up user on checkout success page...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: order.customer_email,
          password: password,
          options: {
            data: {
              nome: order.customer_name,
              sobrenome: '',
              login: finalLogin,
              registration_type: 'individual',
              role: 'client',
              sponsor_code: order.referral_code || null,
              organization_id: order.organization_id,
              cpf: order.customer_cpf.replace(/\D/g, ''),
              whatsapp: order.customer_phone || null,
              data_nascimento: formInfo.birthDate,
              lgpd_accepted_at: new Date().toISOString(),
              lgpd_ip: userIp,
              lgpd_version: '1.0'
            }
          }
        });

        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes('already registered') || signUpError.message?.toLowerCase().includes('already exists') || (signUpError as any).code === 'user_already_exists') {
            console.log('User already exists. Attempting sign in to proceed...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: order.customer_email,
              password: password
            });

            if (signInError) {
              throw new Error('Este e-mail já está cadastrado. Por favor, digite a senha correta da sua conta para continuar.');
            }

            activeUserId = signInData.user?.id;
            if (signInData.user) {
              setCurrentUser(signInData.user);
            }
          } else if (signUpError.message?.toLowerCase().includes('database error saving new user')) {
            throw new Error('Este CPF já está cadastrado em outra conta de usuário. Por favor, utilize um CPF diferente ou faça login com a conta existente.');
          } else {
            throw signUpError;
          }
        } else {
          if (!signUpData?.user) throw new Error('Não foi possível criar o usuário no sistema.');
          activeUserId = signUpData.user.id;
          setCurrentUser(signUpData.user);
          console.log('User created successfully:', activeUserId);
        }

        // Associar o usuário ao pedido
        if (activeUserId) {
          const { error: orderLinkError } = await supabase
            .from('orders')
            .update({
              user_id: activeUserId
            })
            .eq('id', order.id);

          if (orderLinkError) {
            console.error('Error linking user to order:', orderLinkError);
          }
        }
      }

      // 2. Atualizar user_profiles no clube do seu bolso com os dados cadastrais
      let profileUpdated = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
              cep: formInfo.cep,
              address: formInfo.street,
              street: formInfo.street,
              number: formInfo.number,
              complement: formInfo.complement,
              neighborhood: formInfo.neighborhood,
              city: formInfo.city,
              state: formInfo.state,
              birth_date: formInfo.birthDate,
              sex: formInfo.sex
            })
            .eq('id', activeUserId);

          if (!profileError) {
            profileUpdated = true;
            break;
          }
          console.warn(`Attempt ${attempt} to update user profile failed, retrying...`, profileError);
        } catch (e) {
          console.warn(`Attempt ${attempt} error:`, e);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!profileUpdated) {
        throw new Error('Falha ao atualizar o perfil do usuário. Entre em contato com o suporte.');
      }

      // 3. Atualizar affiliates se for afiliado
      if (userRole === 'affiliate') {
        await supabase
          .from('affiliates')
          .update({
            cep: formInfo.cep,
            address: formInfo.street,
            street: formInfo.street,
            number: formInfo.number,
            complement: formInfo.complement,
            neighborhood: formInfo.neighborhood,
            city: formInfo.city,
            state: formInfo.state,
            birth_date: formInfo.birthDate,
            sex: formInfo.sex
          })
          .eq('user_id', activeUserId);
      }

      // 4. Formatar o shipping_address do pedido
      const formattedAddress = `${formInfo.street}, ${formInfo.number}${formInfo.complement ? ' - ' + formInfo.complement : ''} - ${formInfo.neighborhood}, ${formInfo.city} - ${formInfo.state}, CEP: ${formInfo.cep}`;
      
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          shipping_address: formattedAddress
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 5. Invocar a Edge Function telemedicine-sync (passando a senha cadastrada se houver)
      const { data: syncRes, error: syncErr } = await supabase.functions.invoke('telemedicine-sync', {
        body: { 
          orderId: order.id,
          password: password || undefined
        }
      });

      if (syncErr) throw syncErr;
      if (syncRes?.error) throw new Error(syncRes.message || 'Erro ao integrar com a telemedicina.');

      toast.success('Cadastro integrado com sucesso!');
      
      // Atualizar o estado local do pedido para refletir a conclusão
      setOrder((prev: any) => ({ ...prev, shipping_address: formattedAddress }));
      
      // Redirecionar após pequeno delay para o Mais Unidos
      setTimeout(() => {
        window.location.href = 'https://app.maisunidos.com.br/Conta/Entrar';
      }, 1500);

    } catch (err: any) {
      console.error('Error completing registration:', err);
      toast.error('Falha ao salvar cadastro: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#2980B9] animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-black text-[#0B1221] mb-2">Ops! Algo deu errado</h2>
        <p className="text-slate-500 mb-8">{error || 'Pedido não encontrado.'}</p>
        <Link to="/shop" className="bg-[#0B1221] text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest">
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  const isPaid = order.status === 'Pago' || order.payment_status === 'paid';
  const isRegistrationComplete = order.shipping_address && order.shipping_address !== 'Assinatura Digital';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Premium Header Decoration */}
      <div className="h-64 bg-[#0B1221] w-full absolute top-0 left-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2980B9_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <div className="container mx-auto px-4 pt-16 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Main Success/Pending Card */}
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-[#0B1221]/10 overflow-hidden border border-slate-100 mb-8">
            <div className="p-8 md:p-12 text-center pb-6">
              <div className="mb-6 flex justify-center">
                {isPaid ? (
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center relative">
                    <Clock className="w-12 h-12 text-[#2980B9] animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-[#2980B9] border-t-transparent animate-spin"></div>
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-[#0B1221] mb-3">
                {isPaid ? 'Pagamento Aprovado!' : 'Aguardando Pagamento'}
              </h1>
              <p className="text-slate-500 text-base font-medium max-w-md mx-auto">
                {isPaid 
                  ? (isRegistrationComplete 
                      ? 'Seu cadastro de telemedicina já está totalmente concluído e ativo. Você pode acessar a plataforma abaixo.'
                      : 'Parabéns! Seu pagamento foi confirmado. Para acessar o sistema de telemedicina do Mais Unidos, por favor conclua o cadastro abaixo.')
                  : 'Sua reserva foi garantida! Agora, basta concluir o pagamento para liberar seu acesso à telemedicina.'}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <span className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
                  Pedido: #{order.id.replace(/^#/, '')}
                </span>
                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  isPaid ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  Status: {order.status}
                </span>
              </div>
            </div>

            {/* Asaas Payment Link Section (if Pending and has payment_preference_id and not PIX) */}
            {!isPaid && !order.payment_method?.toLowerCase().includes('pix') && order.payment_preference_id && (
              <div className="bg-slate-50 border-t border-slate-100 p-8 md:p-12">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 text-center max-w-xl mx-auto space-y-6">
                  <div className="w-16 h-16 bg-[#2980B9]/10 rounded-2xl flex items-center justify-center mx-auto text-[#2980B9]">
                    <CreditCard className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0B1221] uppercase tracking-wide">Pagamento Pendente</h3>
                    <p className="text-slate-500 text-sm font-medium mt-2">
                      Para concluir o seu pedido, por favor clique no botão abaixo para abrir a página de pagamento seguro do Asaas.
                    </p>
                  </div>
                  <a 
                    href={order.payment_preference_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#2980B9] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-center shadow-xl shadow-[#2980B9]/15 flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-2xl transition-all"
                  >
                    Ir Para o Pagamento (Asaas)
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-[10px] font-bold text-slate-400">
                    Após efetuar o pagamento, esta tela será atualizada automaticamente em alguns instantes.
                  </p>
                </div>
              </div>
            )}

            {/* PIX Section (Only if Pending and PIX) */}
            {!isPaid && order.payment_method?.toLowerCase().includes('pix') && (
              <div className="bg-slate-50 border-t border-slate-100 p-8 md:p-12">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    {order.pix_qr_code_base64 ? (
                      <div className="flex-shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                        <img 
                          src={`data:image/jpeg;base64,${order.pix_qr_code_base64}`} 
                          alt="QR Code PIX" 
                          className="w-48 h-48"
                        />
                        <div className="mt-3 text-center">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Escaneie o QR Code</span>
                        </div>
                      </div>
                    ) : (
                       <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 border border-dashed border-slate-300">
                         <QrCode className="w-12 h-12" />
                       </div>
                    )}

                    <div className="flex-grow space-y-6">
                      <div>
                        <h3 className="text-sm font-black text-[#0B1221] uppercase tracking-widest mb-2">Copia e Cola</h3>
                        <div className="flex gap-2">
                          <input 
                            readOnly 
                            value={order.pix_copy_paste || ''} 
                            className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-mono flex-grow outline-none truncate"
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(order.pix_copy_paste || '');
                              toast.success('Chave PIX copiada!');
                            }}
                            className="bg-[#0B1221] text-white p-4 rounded-xl hover:bg-[#1a2436] transition-all"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-black text-[#2980B9]">!</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                            Após o pagamento, o sistema identificará automaticamente em até 2 minutos e esta tela se atualizará.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* IF REGISTRATION COMPLETED */}
            {isPaid && isRegistrationComplete && (
              <div className="p-8 md:p-12 border-t border-slate-100 text-center bg-slate-50/50">
                <div className="max-w-md mx-auto py-8">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-100 shadow-sm">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-[#0B1221] mb-2 uppercase tracking-wide">Cadastro Confirmado</h3>
                  <p className="text-slate-500 text-sm font-medium mb-8">
                    Seus dados de endereço e aceites legais foram salvos e sincronizados com a telemedicina do Mais Unidos. Clique abaixo para entrar na plataforma.
                  </p>
                  <a 
                    href="https://app.maisunidos.com.br/Conta/Entrar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#2980B9] text-[#0B1221] py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-center shadow-xl shadow-[#2980B9]/15 flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-2xl transition-all"
                  >
                    Acessar Telemedicina Mais Unidos
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* IF PAID BUT REGISTRATION PENDING (SHOW FORM) */}
            {isPaid && !isRegistrationComplete && (
              <div className="border-t border-slate-100 bg-slate-50/30 p-8 md:p-12">
                <h3 className="text-xl font-black text-[#0B1221] mb-6 flex items-center gap-3 uppercase tracking-wider text-left">
                  <MapPin className="w-6 h-6 text-[#2980B9]" />
                  Conclusão do Cadastro
                </h3>

                <form onSubmit={handleRegisterComplete} className="space-y-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">CEP *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={9}
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 pl-12 text-sm font-bold outline-none focus:border-[#2980B9] transition-all"
                          placeholder="00000-000"
                          value={formInfo.cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                        />
                        <MapPin className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Endereço / Logradouro *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2980B9] transition-all"
                        placeholder="Nome da rua, avenida, etc."
                        value={formInfo.street}
                        onChange={(e) => setFormInfo({ ...formInfo, street: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Número *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2980B9] transition-all"
                        placeholder="123"
                        value={formInfo.number}
                        onChange={(e) => setFormInfo({ ...formInfo, number: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Complemento</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2980B9] transition-all"
                        placeholder="Apto 42, Bloco B"
                        value={formInfo.complement}
                        onChange={(e) => setFormInfo({ ...formInfo, complement: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Bairro *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2980B9] transition-all"
                        placeholder="Nome do bairro"
                        value={formInfo.neighborhood}
                        onChange={(e) => setFormInfo({ ...formInfo, neighborhood: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Cidade *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2980B9] transition-all"
                        placeholder="Sua cidade"
                        value={formInfo.city}
                        onChange={(e) => setFormInfo({ ...formInfo, city: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Estado *</label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold uppercase outline-none focus:border-[#2980B9] transition-all"
                        placeholder="SP"
                        value={formInfo.state}
                        onChange={(e) => setFormInfo({ ...formInfo, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100 my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Data de Nascimento *</label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 pl-12 text-sm font-bold outline-none focus:border-[#2980B9] transition-all"
                          value={formInfo.birthDate}
                          onChange={(e) => setFormInfo({ ...formInfo, birthDate: e.target.value })}
                        />
                        <Calendar className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Sexo *</label>
                      <div className="relative">
                        <select
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 pl-12 text-sm font-bold outline-none focus:border-[#2980B9] transition-all appearance-none cursor-pointer"
                          value={formInfo.sex}
                          onChange={(e) => setFormInfo({ ...formInfo, sex: e.target.value })}
                        >
                          <option value="">Selecione...</option>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </select>
                        <User className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {showPasswordFields && (
                    <>
                      <hr className="border-slate-100 my-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Escolha uma Senha Forte *</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              className="w-full bg-white border border-slate-200 rounded-xl p-4 pl-12 text-sm font-bold outline-none focus:border-[#2980B9] transition-all"
                              placeholder="Digite sua senha"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                            <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {password && (
                            <div className="mt-2 pl-1 space-y-1 text-[10px] font-bold tracking-wide transition-all duration-300">
                              {[
                                { label: 'Mínimo de 8 caracteres', ok: hasMinLength },
                                { label: 'Pelo menos uma letra maiúscula', ok: hasUpperCase },
                                { label: 'Pelo menos uma letra minúscula', ok: hasLowerCase },
                                { label: 'Pelo menos um número', ok: hasNumber },
                                { label: 'Pelo menos um caractere especial (ex: @, #, $, !)', ok: hasSpecialChar },
                                { label: 'Sem sequências muito simples (ex: 12345678)', ok: !isPasswordEasy }
                              ].map((rule, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${rule.ok ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                  <span className={rule.ok ? 'text-green-600' : 'text-slate-400'}>{rule.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
 
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Confirme sua Senha *</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              className="w-full bg-white border border-slate-200 rounded-xl p-4 pl-12 text-sm font-bold outline-none focus:border-[#2980B9] transition-all"
                              placeholder="Repita sua senha"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="bg-amber-50/50 border border-[#2980B9]/20 rounded-3xl p-6 mt-6">
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <input
                        type="checkbox"
                        required
                        className="w-5 h-5 rounded border-slate-300 text-[#2980B9] focus:ring-[#2980B9] mt-0.5"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <span className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-wider">
                        Declaro que li e concordo com os <a href="https://app.maisunidos.com.br/TermosDeAdesao" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#2980B9] hover:underline">Termos de Uso e Política de Privacidade</a> da plataforma.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-[#2980B9] text-[#0B1221] rounded-2xl font-black text-sm shadow-xl shadow-[#2980B9]/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sincronizando cadastro...
                      </>
                    ) : (
                      <>
                        Concluir Cadastro e Acessar
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* General bottom links when registration is complete or waiting */}
            {isRegistrationComplete && (
              <div className="p-8 md:p-12 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 text-left">
                  <h4 className="font-black text-[#0B1221] uppercase tracking-widest text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2980B9]" />
                    Informações úteis
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                      <div className="w-2 h-2 bg-[#2980B9] rounded-full"></div>
                      Um recibo foi enviado para seu e-mail
                    </li>
                    <li className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                      <div className="w-2 h-2 bg-[#2980B9] rounded-full"></div>
                      Acompanhe o status no seu painel
                    </li>
                    <li className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                      <div className="w-2 h-2 bg-[#2980B9] rounded-full"></div>
                      Suporte VIP liberado para seu pedido
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3 justify-center">
                  {userRole === 'client' ? (
                    <Link 
                      to="/login" 
                      className="w-full bg-[#2980B9] text-[#0B1221] py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-center shadow-xl shadow-[#2980B9]/10 flex items-center justify-center gap-2 hover:-translate-y-1 transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Fazer Login no Painel
                    </Link>
                  ) : (
                    <Link 
                      to="/dashboard" 
                      className="w-full bg-[#0B1221] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-center shadow-xl shadow-[#0B1221]/10 flex items-center justify-center gap-2 hover:-translate-y-1 transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Ir para o Virtual Office
                    </Link>
                  )}
                  <Link 
                    to="/shop" 
                    className="w-full bg-white text-[#0B1221] py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-center border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                  >
                    Continuar Comprando
                    <ArrowRight className="w-4 h-4 text-[#2980B9]" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              Clube do Seu Bolso Premium Lifestyle • Checkout Seguro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
