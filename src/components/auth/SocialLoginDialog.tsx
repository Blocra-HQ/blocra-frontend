import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api";


interface SocialLoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SocialLoginDialog({ open, onClose }: SocialLoginDialogProps) {
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Google client ID from backend
    const fetchGoogleConfig = async () => {
      try {
        const response: any = await apiClient.getGoogleConfig();
        if (response.success) {
          setGoogleClientId(response.data.googleClientId);
        }
      } catch (error) {
        console.error('Failed to fetch Google config:', error);
      }
    };

    if (open) {
      fetchGoogleConfig();
    }
  }, [open]);

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    try {
      if (provider === 'google') {
        // Initialize Google OAuth
        const googleAuth = (window as any).gapi?.auth2?.getAuthInstance();
        if (!googleAuth) {
          // Load Google API if not loaded
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/platform.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });

          await new Promise<void>((resolve) => {
            (window as any).gapi.load('auth2', async () => {
              const auth2 = await (window as any).gapi.auth2.init({
                client_id: googleClientId || '493459087329-esd7kq05bmm0v8k10h3glp1hrk91ipfj.apps.googleusercontent.com'
              });
              const googleUser = await auth2.signIn();
              const idToken = googleUser.getAuthResponse().id_token;

              // Send token to backend
              const { error } = await signInWithGoogle(idToken, 'analyst');

              if (error) {
                throw new Error(error);
              }

              toast({
                title: "Login successful",
                description: "You've been signed in with Google",
              });

              onClose();
              window.location.href = '/';
              resolve();
            });
          });
        } else {
          const googleUser = await googleAuth.signIn();
          const idToken = googleUser.getAuthResponse().id_token;

          // Send token to backend
          const { error } = await signInWithGoogle(idToken, 'analyst');

          if (error) {
            throw new Error(error);
          }

          toast({
            title: "Login successful",
            description: "You've been signed in with Google",
          });

          onClose();
          window.location.href = '/';
        }
      } else {
        // For Twitter and Email, use demo mode for now
        const email = `${provider}_demo@example.com`;
        const { error } = await signIn(email, 'demo_password');

        if (error) {
          throw error;
        }

        toast({
          title: "Login successful",
          description: "You've been signed in via " + provider,
        });

        onClose();
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Social Login</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="justify-start text-base font-normal"
          >
            <img
              src="https://authjs.dev/img/providers/google.svg"
              alt="Google"
              className="mr-2 h-4 w-4"
            />
            Continue with Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialLogin('twitter')}
            disabled={loading}
            className="justify-start text-base font-normal"
          >
            <img
              src="https://authjs.dev/img/providers/twitter.svg"
              alt="Twitter"
              className="mr-2 h-4 w-4"
            />
            Continue with Twitter
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialLogin('email')}
            disabled={loading}
            className="justify-start text-base font-normal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-4 w-4"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Continue with Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}