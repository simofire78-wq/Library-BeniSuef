import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content; // سؤال المستخدم الأخير

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. تحويل سؤال المستخدم لـ Vector (استدعاء HuggingFace)
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
      {
        headers: { Authorization: `Bearer ${Deno.env.get("HUGGINGFACE_ACCESS_TOKEN")}` },
        method: "POST",
        body: JSON.stringify({ inputs: lastMessage }),
      }
    );
    const query_embedding = await hfResponse.json();

    // 2. البحث الدلالي في محتوى الكتب (RAG)
    const { data: bookChunks } = await supabase.rpc('match_book_chunks', {
      query_embedding: query_embedding,
      match_threshold: 0.4,
      match_count: 3
    });

    // 3. جلب الإحصائيات والبيانات الوصفية (كودك القديم)
    const { data: allBooks } = await supabase.from("books").select("id, title, author, category");
    const { data: stats } = await supabase.rpc('get_book_activity_stats');

    // 4. بناء السياق المختلط (إحصائيات + نصوص من جوه الكتب)
    const libraryStats = allBooks?.map(b => {
      const s = stats?.find((item: any) => item.book_id === b.id);
      return `- ${b.title} | تحميلاته: ${s?.downloads || 0} | تقييمه: ${s?.average_rating || 0}`;
    }).join("\n");

    const bookContentContext = bookChunks?.map((c: any) => 
      `[من كتاب: ${c.book_title}]: ${c.content}`
    ).join("\n\n");

    const systemPrompt = `أنت خبير دعم قرار ومساعد ذكي لقسم علوم المعلومات.
    لديك مصدرين للمعلومات:
    1. إحصائيات عامة عن الكتب (للتوصيات):
    ${libraryStats}

    2. مقتطفات دقيقة من داخل محتوى الكتب (للإجابة على الأسئلة العلمية):
    ${bookContentContext}

    قواعد الرد:
    - إذا سأل المستخدم عن معلومة علمية، ابحث في "مقتطفات المحتوى" وأجب بدقة مع ذكر اسم الكتاب.
    - إذا سأل عن ترشيح، استخدم "الإحصائيات" لترشيح الكتب الأعلى تقييماً أو تحميلاً.
    - إذا كان المحتوى المسترجع رموزاً غير مفهومة، اعتذر بلباقة ووجهه للعناوين المتاحة.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.3,
      }),
    });

    const result = await response.json();
    return new Response(JSON.stringify({ reply: result.choices[0].message.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});