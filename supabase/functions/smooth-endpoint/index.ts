import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    
    // سحب مفتاح جيمناي من الـ Secrets
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("Gemini API Key is missing");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // جلب البيانات والإحصائيات
    const { data: statsData } = await supabase.rpc('get_book_activity_stats');
    const { data: booksMetadata } = await supabase.from("books").select("id, title, author, category, year");

    const booksContext = booksMetadata?.map((book: any) => {
      const stats = statsData?.find((s: any) => s.book_id === book.id);
      return `[${book.title} | ${book.category} | تحميلات: ${stats?.downloads || 0} | تقييم: ${stats?.rating || 0}]`;
    }).join("\n");

    const systemPrompt = `أنت "مساعد مكتبة IQ الذكي" لجامعة بني سويف. استخدم البيانات التالية للرد: \n${booksContext}\n أجب بالعربية الفصحى، نسق ردك بـ Markdown، واختر أفضل 3 كتب فقط.`;

    // تحويل الرسائل لتنسيق Gemini (Content-based)
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // نداء API جيمناي (Flash 1.5 - سريع ومجاني)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemPrompt }]}, ...contents],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      }),
    });

    const result = await response.json();
    const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، حدث خطأ في الاتصال بجيمناي.";

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});