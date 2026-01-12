import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthButton } from '../components/atoms/AuthButton/AuthButton';
import { useAuth } from '../lib/hooks/useAuth';

export default function Home() {
  const navigate = useNavigate();
  const { user, loading, signIn, signOut } = useAuth();

  useEffect(() => {
    // Check if user is already signed in
    if (!loading && user) {
      // Check if user is signed in
      const isSignedIn =
        user && (user.email || (user.providerData && user.providerData.length > 0));

      if (isSignedIn) {
        // User is signed in, redirect to admin page
        navigate('/admin', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden -m-6">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[1]">
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={`snowflake-${i}`}
            className="absolute -top-2.5 text-2xl text-white select-none pointer-events-none animate-[fall_linear_infinite] [text-shadow:0_0_5px_rgba(255,255,255,0.8)]"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              opacity: Math.random() * 0.5 + 0.5,
            }}
          >
            ❄
          </div>
        ))}
      </div>
      <div className="relative z-[2] text-center max-w-[600px] p-8 bg-[rgba(26,43,71,0.7)] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px] border border-white/10 max-[768px]:p-6">
        <h1 className="text-[3.5rem] font-bold text-white m-0 mb-4 [text-shadow:0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 max-[768px]:text-[2.5rem]">
          <span className="text-[4rem] animate-[float_3s_ease-in-out_infinite] max-[768px]:text-[3rem]">🍪</span>
          Cookie Voting
        </h1>
        <p className="text-xl text-[#cbd5e1] m-0 mb-8 max-[768px]:text-lg">Cast your vote for the best cookies!</p>
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center justify-center">
          <p className="text-base text-[#cbd5e1] m-0 mb-4">Administrators, sign in to manage events:</p>
          <AuthButton user={user} loading={loading} onSignIn={signIn} onSignOut={signOut} />
        </div>
      </div>
    </div>
  );
}
