# 1. استدعاء مكتبات الذكاء الاصطناعي والبيانات
import pandas as pd # مكتبة لقراءة الجداول وملفات الإكسيل (CSV)
import numpy as np # مكتبة للعمليات الحسابية المعقدة
from sklearn.model_selection import train_test_split # أداة لتقسيم البيانات (تدريب واختبار)
from sklearn.linear_model import LogisticRegression # خوارزمية الانحدار اللوجستي (عقل الذكاء الاصطناعي)
from sklearn.preprocessing import StandardScaler # أداة لتوحيد مقاسات الأرقام (عشان ما يتلخبط النموذج)
from sklearn.metrics import accuracy_score, classification_report # أدوات لحساب دقة النموذج بعد التدريب
from imblearn.over_sampling import SMOTE # تقنية ذكية جداً لحل مشكلة نقص بيانات الاحتيال
import joblib # أداة لحفظ النموذج بعد ما يخلص تدريب عشان نستخدمه في الموقع

# 2. قراءة البيانات (ملف العمليات البنكية)
print("⏳ جاري تحميل البيانات...")
try:
    # قراءة ملف البيانات الذي يحتوي على آلاف العمليات البنكية
    data = pd.read_csv('creditcard.csv')
except FileNotFoundError:
    # في حال لم يجد النظام الملف، يطبع رسالة خطأ ويوقف البرنامج
    print("❌ خطأ: ملف creditcard.csv غير موجود! الرجاء تحميله ووضعه في المجلد.")
    exit()

# 3. فصل البيانات (المدخلات عن المخرجات)
# X: هي جميع الأعمدة (البيانات) ما عدا عمود النتيجة (Class)
X = data.drop('Class', axis=1) 
# y: هي عمود النتيجة فقط (هل هي 0 آمنة أم 1 احتيال؟)
y = data['Class']            

# 4. حل مشكلة نقص البيانات باستخدام (SMOTE)
print("⚖️  جاري موازنة البيانات (SMOTE)...")
smote = SMOTE(random_state=42)
X_res, y_res = smote.fit_resample(X, y) # تطبيق التوازن وحفظ البيانات الجديدة في X_res و y_res

# 5. تقسيم البيانات لتدريب واختبار
# نقسم البيانات الموزونة: 80% لتدريب النموذج، و 20% لاختباره (test_size=0.2)
X_train, X_test, y_train, y_test = train_test_split(X_res, y_res, test_size=0.2, random_state=42)


# 6. تدرج البيانات (Scaling)
# الأرقام في البنوك تختلف (مبلغ 5 دولار ومبلغ 1000 دولار)، السكيلر يوحد حجمها عشان الخوارزمية تفهمها أسرع
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train) # توحيد بيانات التدريب
X_test_scaled = scaler.transform(X_test)       # توحيد بيانات الاختبار

# 7. بناء وتدريب نموذج الذكاء الاصطناعي
print("🧠 جاري تدريب النموذج...")
# استخدام خوارزمية الانحدار اللوجستي وإعطائها 1000 محاولة للتعلم (max_iter)
model = LogisticRegression(max_iter=1000)
# بدء عملية التعلم (fit) على بيانات التدريب الموزونة
model.fit(X_train_scaled, y_train)

# 8. اختبار الذكاء الاصطناعي وحساب دقته
# نعطي النموذج بيانات الاختبار (اللي ما شافها من قبل) ونخليه يتوقع النتيجة
y_pred = model.predict(X_test_scaled)
# نقارن توقعات النموذج بالنتيجة الحقيقية عشان نحسب الدقة بالمئة
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ تم التدريب بنجاح! دقة النموذج: {accuracy:.2%}")

# ==========================================
# 9. حفظ النموذج لاستخدامه في الموقع (app.py)
# ==========================================
# بعد ما صار النموذج ذكي وجاهز، نحفظه كملف (pkl) عشان نقدر نربطه بالموقع
joblib.dump(model, 'fraud_model.pkl')
joblib.dump(scaler, 'scaler.pkl') # نحفظ السكيلر بعد عشان نستخدمه للبيانات الجديدة
print("💾 تم حفظ ملفات النموذج (fraud_model.pkl, scaler.pkl) بنجاح.")