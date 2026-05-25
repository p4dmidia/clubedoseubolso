import { supabase } from './supabase';

interface IpInfo {
    ip: string;
    location: string;
    device: string;
}

export const fetchIpInfo = async (): Promise<IpInfo> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    try {
        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('API failed');
        const data = await response.json();
        return {
            ip: data.ip || 'Desconhecido',
            location: `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`.trim() || 'Desconhecido',
            device: navigator.userAgent
        };
    } catch (e) {
        clearTimeout(timeoutId);
        return {
            ip: 'Desconhecido',
            location: 'Desconhecido',
            device: navigator.userAgent
        };
    }
};

export const recordSecurityLog = async (
    email: string,
    eventType: 'login_success' | 'login_failure' | 'password_change' | 'logout' | 'bulk_session_invalidation',
    status: 'success' | 'failure' | 'warning'
) => {
    try {
        const info = await fetchIpInfo();
        const { error } = await supabase.from('security_logs').insert({
            user_email: email || 'unknown',
            ip_address: info.ip,
            location: info.location,
            device_info: info.device.substring(0, 150), // prevent overflow if User Agent is extremely long
            event_type: eventType,
            status: status
        });
        if (error) console.error('Error inserting security log:', error);
    } catch (err) {
        console.error('Failed to record security log:', err);
    }
};
