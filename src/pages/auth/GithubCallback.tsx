import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GithubCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/github`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, role: 'analyst' })
          });
          
          const data = await response.json();
          
          if (data.success) {
            localStorage.setItem('auth_token', data.data.accessToken);
            localStorage.setItem('demo_user', JSON.stringify(data.data.user));
            navigate('/');
          } else {
            navigate('/auth?error=github_auth_failed');
          }
        } catch (error) {
          navigate('/auth?error=github_auth_failed');
        }
      } else {
        navigate('/auth?error=no_code');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing GitHub sign in...</p>
      </div>
    </div>
  );
}