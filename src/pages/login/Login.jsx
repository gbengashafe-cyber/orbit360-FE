import { userService } from '@/api';
import { Input } from '@/components/ui/input';
import { LoginUtil } from '@/pages/login/local-storage.util';
import { useState } from 'react';

const LoginPage = () => {
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const email = e.target.email.value;
      const password = e.target.password.value;

      const response = await userService.login(email, password);
      LoginUtil.storeAccessToken(response.data.accessToken);

      window.location.href = '/dashboard';
    } catch (error) {
      setError(error?.response?.data?.message || 'Login failed. kindly contact the administrator for support');
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
                  <img
                    className="aspect-square h-full w-full object-cover"
                    alt="Orbit360 (Copy) logo"
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/d7dee9803_logo.png"
                  />
                </span>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Welcome to Orbit360</h1>
                <p className="text-slate-500 text-sm sm:text-base font-medium">Sign in to continue</p>
              </div>
              <div className="w-full">
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 font-medium text-[16px] group">
                    <div className=" transition-transform duration-200 -ml-4">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        ></path>
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        ></path>
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        ></path>
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        ></path>
                      </svg>
                    </div>
                    <span>Continue with Google</span>
                  </button>
                </div>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div data-orientation="horizontal" role="none" className="shrink-0 h-[1px] w-full bg-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">or</span>
                  </div>
                </div>
                <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
                        htmlFor="email"
                      >
                        Email
                      </label>
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
                          className="flex w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400"
                          id="email"
                          placeholder="you@mfb.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
                        htmlFor="password"
                      >
                        Password
                      </label>
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
                          className="lucide lucide-lock absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400"
                        >
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <Input
                          type="password"
                          className="flex w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400"
                          id="password"
                          autoComplete
                          placeholder="•••••••••••••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button
                      className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 px-3 py-2 w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200"
                      type="submit"
                    >
                      Sign in
                    </button>
                    {error ? <div className="bg-red-200 text-red-950 rounded-xl p-2">{error}</div> : null}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                      <button type="button" className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
                        Forgot password?
                      </button>
                      <button type="button" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        Need an account? <span className="font-medium text-slate-700">Sign up</span>
                      </button>
                    </div>
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
