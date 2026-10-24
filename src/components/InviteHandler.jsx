import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function InviteHandler() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (code) {
      localStorage.setItem('referralCode', code);
    }
    // Redirect to landing page to show signup modal
    navigate('/?ref=true', { replace: true });
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
      Processing invite...
    </div>
  );
}
