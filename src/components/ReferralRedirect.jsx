import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export default function ReferralRedirect() {
    const { code } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!code) {
            navigate('/', { replace: true });
            return;
        }

        fetch(`${BASE_URL}/api/referral/resolve/${encodeURIComponent(code)}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                const url = data?.data?.url;
                if (url) {
                    window.location.href = url;
                } else {
                    navigate('/', { replace: true });
                }
            })
            .catch(() => navigate('/', { replace: true }));
    }, [code, navigate]);

    return (
        <div className="min-h-screen bg-[#021a1a] flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Redirecting you to the event...</p>
            </div>
        </div>
    );
}
