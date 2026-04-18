import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("كلمة المرور ضعيفة، اختر 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    // هــــنـا بنستخدم السطر اللي سألت عنه
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تم تحديث كلمة المرور بنجاح! يمكنك الدخول الآن');
      navigate('/auth'); // يرجعه لصفحة تسجيل الدخول
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full translate-y-1/2" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-10 rounded-[2.5rem] shadow-2xl z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 mb-4">
            <Lock className="text-primary h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-white">تغيير كلمة المرور</h2>
          <p className="text-slate-400 text-sm mt-2">أدخل كلمة المرور الجديدة والقوية لحسابك</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <Input 
              type="password" 
              placeholder="كلمة المرور الجديدة"
              className="bg-white/[0.05] border-white/[0.1] h-12 rounded-xl text-white"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full h-12 bg-primary font-bold rounded-xl shadow-lg shadow-primary/20">
            {loading ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}