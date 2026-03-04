import { APIWithoutAuth } from '@/api/apiClient';
import { ApiRoutes } from '@/api/apiRoutes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localStorageKeys, LocalStorageUtil } from '@/utils/local-storage.util';
import { LucideEye, LucideEyeClosed, LucideLock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

const LoginPage = () => {
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const email = e.target.email.value;
      const password = e.target.password.value;

      const response = await APIWithoutAuth.post(ApiRoutes.Login, { email, password });

      LocalStorageUtil.save(response.data.data.expiresAt * 1000, localStorageKeys.ACCESS_TOKEN_EXPIRES_AT);
      LocalStorageUtil.save(response.data.data.accessToken, localStorageKeys.ACCESS_TOKEN);

      navigate('/dashboard', { replace: true });
    } catch (error) {
      setError(error?.response?.data?.message || error?.message || 'Login failed. kindly contact the administrator for support');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-card-foreground relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>
          <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
            <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
                <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg ring-4 ring-white/50 group-hover:shadow-xl transition-all duration-300">
                  <img className="aspect-square h-full w-full object-cover" alt="Orbit360 logo" src="/orbit360_logo.png" />
                </span>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Welcome to Orbit360</h1>
                <p className="text-slate-500 text-sm sm:text-base font-medium">Sign in to continue</p>
              </div>
              <div className="w-full">
                <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
                        htmlFor="email"
                      >
                        Email
                      </Label>
                      <div className="relative">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-mail absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                        <Input
                          type="email"
                          autoComplete="email"
                          className="flex w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400"
                          id="email"
                          placeholder="you@mfb.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
                        htmlFor="password"
                      >
                        Password
                      </Label>
                      <div className="relative flex items-center">
                        <LucideLock className="absolute left-3 max-w-4 text-slate-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          className="flex w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400"
                          id="password"
                          placeholder="•••••••••••••••••"
                          required
                          autoComplete="current-password"
                        />
                        <Button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="text-slate-400 absolute right-3 max-w-4 bg-transparent shadow-none hover:bg-transparent"
                          onClick={() => {
                            setShowPassword(!showPassword);
                          }}
                        >
                          {showPassword ? <LucideEye className="" /> : <LucideEyeClosed />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button
                      className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 px-3 py-2 w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign in'}
                    </Button>
                    {error ? <div className="bg-red-200 text-red-950 rounded-xl p-2">{error}</div> : null}

                    {/* <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                      <button type="button" className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
                        Forgot password?
                      </button>
                      <button type="button" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        Need an account? <span className="font-medium text-slate-700">Sign up</span>
                      </button>
                    </div> */}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-slate-400 sm:hidden"></div>
      </div>
    </div>
  );
};

export default LoginPage;
