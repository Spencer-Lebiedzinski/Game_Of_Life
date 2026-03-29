import { useAuth0 } from '@auth0/auth0-react';

const THEMES_PREVIEW = ['bg-emerald-300', 'bg-sky-300', 'bg-purple-400', 'bg-pink-300'];

export default function LoginScreen() {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleSignIn = () => {
    loginWithRedirect();
  };

  const handleCreateAccount = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="text-7xl mb-6">🎮</div>
        <h1 className="text-4xl font-bold text-white mb-2">Game of Life</h1>
        <p className="text-gray-400 mb-10">
          Your gamified student life dashboard.
          <br />Level up every day.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: '📚', label: 'School' },
            { icon: '💪', label: 'Fitness' },
            { icon: '💰', label: 'Finance' },
            { icon: '🤝', label: 'Social' },
            { icon: '🧠', label: 'Wellness' },
            { icon: '✨', label: 'AI Quests' },
          ].map((f) => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full"
            >
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCreateAccount}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-gray-900 text-base transition-all hover:scale-105 hover:opacity-90 shadow-lg disabled:opacity-50 bg-gradient-to-r from-emerald-300 to-teal-400"
          >
            {isLoading ? 'Loading...' : 'Create Account →'}
          </button>

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-[1.02] hover:border-white/30 disabled:opacity-50 border border-white/15 bg-white/5"
          >
            Sign In
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          New users can create an account with Google on the next screen.
        </p>
      </div>
    </div>
  );
}
