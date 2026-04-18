import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, BookOpen, LogIn, UserPlus, KeyRound, ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function UserAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // دالة مساعدة لتحديد الرابط الصحيح بناءً على البيئة (Local vs Production)
  const getRedirectUrl = (path: string) => {
    const baseUrl = window.location.hostname === 'localhost' 
      ? window.location.origin 
      : 'https://library-beni-suef.vercel.app';
    return `${baseUrl}${path}`;
  };

  // منطق تسجيل الدخول بـ Google
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getRedirectUrl('/') }, // سيعود للرئيسية بعد النجاح
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // منطق استعادة كلمة المرور (معدل وفق المستجدات)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        // سيتم توجيه المستخدم لصفحة إعادة التعيين التي أنشأناها
        redirectTo: getRedirectUrl('/reset-password'),
      });
      if (error) throw error;
      toast.success('تم إرسال رابط التعيين إلى بريدك الإلكتروني');
      setMode('login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // منطق الدخول والاشتراك
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: getRedirectUrl('/'),
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        toast.success('تم! تحقق من بريدك الإلكتروني لتفعيل الحساب');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success('مرحباً بك مجدداً');
        navigate(returnTo);
      }
    } catch (err: any) {
      toast.error(err.message.includes('Invalid login') ? 'البيانات غير صحيحة' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617] relative overflow-hidden">
      {/* دوائر خلفية جمالية */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <motion.div whileHover={{ scale: 1.1 }} className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {mode === 'login' ? 'تسجيل الدخول' : mode === 'signup' ? 'حساب جديد' : 'استعادة الحساب'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">بصيرة المعلومات — جامعة بني سويف</p>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={mode === 'forgot' ? handleForgotPassword : handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <Label className="text-slate-300 mr-1">الاسم الكامل</Label>
                  <Input className="bg-white/[0.05] border-white/[0.1] text-white h-12 rounded-xl" placeholder="إسلام ربيع" value={name} onChange={(e) => setName(e.target.value)} required />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label className="text-slate-300 mr-1">البريد الإلكتروني</Label>
              <Input type="email" dir="ltr" className="bg-white/[0.05] border-white/[0.1] text-white h-12 rounded-xl text-right" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-300 mr-1">كلمة المرور</Label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline transition-all">نسيت كلمة السر؟</button>
                  )}
                </div>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} className="bg-white/[0.05] border-white/[0.1] text-white h-12 rounded-xl pl-12" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base transition-all shadow-lg" disabled={loading}>
              {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 
                <span className="flex items-center gap-2">
                  {mode === 'login' ? <LogIn size={18}/> : mode === 'signup' ? <UserPlus size={18}/> : <KeyRound size={18}/>}
                  {mode === 'login' ? 'دخول' : mode === 'signup' ? 'إنشاء حساب' : 'إرسال الرابط'}
                </span>
              }
            </Button>
          </form>

          {mode !== 'forgot' && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.08]" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-[#0b1224] px-4 text-slate-500 font-bold tracking-widest">أو عبر</span></div>
              </div>

              <Button variant="outline" className="w-full h-12 rounded-xl border-white/[0.08] bg-white/[0.02] text-white hover:bg-white/[0.05]" onClick={handleGoogleLogin}>
                <svg className="h-5 w-5 ml-2" viewBox="0 0 24 24">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                حساب جوجل
              </Button>
            </>
          )}

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                if (mode === 'forgot') setMode('login');
                else setMode(mode === 'login' ? 'signup' : 'login');
              }}
              className="text-slate-400 text-sm hover:text-white transition-colors"
            >
              {mode === 'login' ? 'لا تملك حساباً؟ سجل الآن' : mode === 'forgot' ? 'العودة لتسجيل الدخول' : 'لديك حساب؟ سجل دخولك'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}