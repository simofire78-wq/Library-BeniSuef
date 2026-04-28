import os
import requests
import pdfplumber
import io
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from postgrest import SyncPostgrestClient

# 1. تحميل متغيرات البيئة
load_dotenv()

# استدعاء المتغيرات مع التأكد من صحة الرابط
SUPABASE_URL = f"{os.getenv('SUPABASE_URL')}/rest/v1"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# 2. إعداد العميل والموديل
headers = {
    "apikey": SUPABASE_KEY, 
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}
client = SyncPostgrestClient(SUPABASE_URL, headers=headers)

# استخدام موديل يدعم اللغة العربية بكفاءة
print("⏳ جاري تحميل موديل الذكاء الاصطناعي...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

def sync_knowledge_base():
    print("🚀 بدء المعالجة الاحترافية وتحسين جودة النصوص...")
    try:
        # جلب الكتب
        response = client.table("books").select("id, title, pdf_url").execute()
        books = response.data
        
        if not books:
            print("⚠️ لم يتم العثور على كتب في جدول books.")
            return

        for book in books:
            if not book.get('pdf_url'): continue
            print(f"📖 جاري معالجة: {book['title']}...")
            
            try:
                # تحميل الملف
                res = requests.get(book['pdf_url'], timeout=30)
                res.raise_for_status()
                
                pdf_content = io.BytesIO(res.content)
                
                with pdfplumber.open(pdf_content) as pdf:
                    for i, page in enumerate(pdf.pages):
                        # استخراج النص مع محاولة الحفاظ على الترتيب العربي
                        text = page.extract_text(layout=True) 
                        
                        if not text or len(text.strip()) < 150: 
                            continue
                        
                        # تنظيف النص من المسافات الزائدة والرموز المكسورة
                        clean_text = " ".join(text.split())
                        
                        # توليد المتجهات (Embeddings)
                        vector = model.encode(clean_text).tolist()
                        
                        # إدخال البيانات في الجدول الجديد
                        client.table("book_sections").insert({
                            "book_id": book['id'],
                            "content": clean_text,
                            "page_number": i + 1,
                            "embedding": vector
                        }).execute()
                        
                print(f"✅ تم الانتهاء من رفع محتوى: {book['title']}")
                
            except Exception as e:
                print(f"⚠️ خطأ أثناء معالجة كتاب {book['title']}: {e}")

    except Exception as e:
        print(f"❌ خطأ عام في الاتصال بسوبابيز: {e}")

if __name__ == "__main__":
    sync_knowledge_base()