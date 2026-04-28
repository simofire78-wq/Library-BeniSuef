import { Bot, Maximize2 } from 'lucide-react';

export default function Chatbot() {
  return (
    /* أزلنا max-w-4xl وخليناها max-w-full عشان يأخذ عرض الشاشة المتاح */
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-[95%] mx-auto border border-gray-800 rounded-xl bg-[#121212] shadow-2xl overflow-hidden relative mb-4">
      
      {/* Header - شريط علوي أنحف لتوفير مساحة */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-[#1e1e1e] z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-1.5 rounded-full border border-blue-500/20">
            <Bot className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-base text-gray-100">منصة دعم القرار الذكية</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">نظام مدمج متكامل</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
           <Maximize2 className="h-4 w-4" />
           <span className="text-[10px]">عرض كامل الشاشة</span>
        </div>
      </div>

      {/* الـ iframe المطور بحجم أكبر */}
      <div className="flex-1 w-full bg-[#0a0a0a]">
        <iframe 
          src="https://venerable-dusk-7b7f64.netlify.app/" 
          className="w-full h-full border-none"
          title="نظام الشات والتحليلات"
          allow="clipboard-write; microphone"
          /* هيدر إضافي لضمان السلاسة */
          loading="lazy"
        />
      </div>
      
    </div>
  );
}