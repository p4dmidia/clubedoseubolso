import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

const ReferralHandler: React.FC = () => {
    const { referralCode } = useParams<{ referralCode: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Captura o código de indicação
        if (referralCode) {
            const cleanCode = referralCode.toLowerCase();
            Cookies.set('classea_ref', cleanCode, {
                expires: 30,
                path: '/',
                sameSite: 'lax'
            });
        }

        // Tenta pegar o "to" de várias formas para garantir robustez
        let redirectTo = searchParams.get('to');
        
        if (!redirectTo) {
            const manualParams = new URLSearchParams(window.location.search);
            redirectTo = manualParams.get('to');
        }

        if (!redirectTo) {
            const match = location.search.match(/[?&]to=([^&]+)/);
            if (match) redirectTo = decodeURIComponent(match[1]);
        }

        const finalTarget = redirectTo || '/';
        const targetPath = finalTarget.startsWith('/') ? finalTarget : `/${finalTarget}`;
        
        // Redirecionamento instantâneo
        navigate(targetPath, { replace: true });
    }, [referralCode, searchParams, navigate, location.search]);

    // Retorna null para não mostrar nada durante o redirecionamento ultra-rápido
    return null;
};

export default ReferralHandler;
