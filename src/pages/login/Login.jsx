import { APIWithoutAuth } from '@/api/apiClient';
import { ApiRoutes } from '@/api/apiRoutes';
import { FormSubmitErrorV1 } from '@/components/shared/submit-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localStorageKeys, LocalStorageUtil } from '@/utils/local-storage.util';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import logo from '../../orbit360_logo-new.png';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
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
    <div className="min-h-screen flex md:items-center justify-center relative overflow-y-auto md:overflow-hidden px-5 py-10 bg-blue-600 ">
      <div className="absolute -top-1 lg:-top-[5rem] -left-20 lg:-left-56 w-48 lg:w-[24rem] rotate-45 aspect-square rounded-[15%] pointer-events-none bg-blue-400/[0.1]" />
      <div className="absolute -top-4 lg:-top-[8rem] -left-16 lg:-left-56 w-56 lg:w-[33rem] rotate-45 aspect-square rounded-[15%] pointer-events-none bg-blue-400/[0.1]" />

      <div className="absolute -bottom-10 lg:-bottom-[5rem] -right-20 lg:-right-56 w-48 lg:w-[24rem] rotate-45 aspect-square rounded-[15%] pointer-events-none bg-blue-400/[0.1]" />
      <div className="absolute -bottom-10 lg:-bottom-[7rem] -right-20 lg:-right-56 w-56 lg:w-[33rem] rotate-45 aspect-square rounded-[15%] pointer-events-none bg-blue-400/[0.1]" />

      {/* Main card */}
      <div className="relative flex rounded-[2.5rem] shadow-2xl w-[98%] md:w-[75%] lg:w-[] min-h-[450px]">
        {/* Left panel */}
        <div className="rounded-[2.5rem] flex-1 flex flex-col gap-y-6 text-center lg:text-left lg:justify-center py-6 lg:py-10 px-7 lg:px-14 min-w-0 bg-white/85">
          <div className="w-40 mx-auto lg:mx-0">
            <img src={logo} />
          </div>
          <div className="mx-auto lg:mx-0">
            <h1 className="w-full lg:w-[22ch] text-center lg:text-left text-2xl lg:text-4xl font-bold text-blue-700 leading-tight mb-4 tracking-tight">
              Precision for payroll. Clarity for people.
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md">
              Welcome to Orbit360, your central hub for seamless HR and payroll management.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="absolute top-[45%] lg:-top-8 lg:-bottom-8 left-4 lg:left-auto right-4 lg:right-16 grid bg-white py-9 lg:w-[36%] rounded-[2.5rem]">
          <div className="w-40 mx-auto hidden lg:block">
            <img src={logo} />
          </div>

          <form className="w-[75%] mx-auto block" onSubmit={handleSubmit}>
            <div className="grid gap-y-4 text-center">
              <h2 className="text-2xl my-2 text-slate-900 tracking-tight">Sign in</h2>
              {/* Email field */}
              <div className="relative">
                <Label className="absolute -top-2.5 left-3 text-xs text-slate-500 bg-white px-1 font-medium z-10">
                  Email address
                </Label>
                <Input
                  type="email"
                  id="email"
                  className="w-full px-3.5 py-6 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors bg-white"
                />
              </div>

              {/* Password field */}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full px-3.5 py-6 pr-11 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors bg-white placeholder:text-slate-400"
                />
                <button
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Login button */}
              <Button
                disabled={loading}
                className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold tracking-wide"
              >
                {loading ? 'Logging In...' : 'Log In'}
              </Button>
            </div>
            {error ? (
              <div className="my-4">
                <FormSubmitErrorV1>{error}</FormSubmitErrorV1>
              </div>
            ) : null}
          </form>

          <p className="mt-auto text-center pt-6 text-xs text-slate-400 tracking-widest font-semibold">POWERED BY ISAAC-BERN</p>
        </div>
      </div>
    </div>
  );
};
