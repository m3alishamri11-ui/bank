# 1. استدعاء المكتبات البرمجية (الأدوات)
import pandas as pd # لقراءة الجداول (ملف البيانات)
from sklearn.model_selection import train_test_split # أداة لتقسيم البيانات (تدريب واختبار)
from sklearn.linear_model import LogisticRegression # خوارزمية الذكاء الاصطناعي (الانحدار اللوجستي)
from sklearn.metrics import classification_report # أداة لإنشاء تقرير مفصل عن دقة النموذج
from sklearn.preprocessing import StandardScaler # أداة لتوحيد مقاسات الأرقام
from imblearn.over_sampling import SMOTE # تقنية موازنة البيانات (لزيادة بيانات الاحتيال الوهمية)

# 2. قراءة البيانات وفصلها
# تحميل ملف البيانات الذي يحتوي على العمليات البنكية
data = pd.read_csv("creditcard.csv")

# فصل البيانات: X هي المدخلات (المتغيرات)، و y هي النتيجة (احتيال 1 أو آمن 0)
X = data.drop('Class', axis=1)
y = data['Class']

# 3. توحيد مقاسات البيانات (Scaling)
# الخوارزميات تفهم الأرقام المتقاربة بشكل أفضل، السكيلر يوحد حجم الأرقام
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 4. موازنة البيانات (SMOTE) - نقطة قوتكم
# توليد عينات اصطناعية لعمليات الاحتيال لكي تتساوى مع العمليات الآمنة ويتدرب النموذج بدون تحيز
smote = SMOTE(random_state=42)
X_resampled, y_resampled = smote.fit_resample(X_scaled, y)

# 5. تقسيم البيانات لتدريب واختبار
# تقسيم البيانات الموزونة: 80% لتدريب الذكاء الاصطناعي، و 20% لاختبار ذكائه
X_train, X_test, y_train, y_test = train_test_split(
    X_resampled, y_resampled,
    test_size=0.2, # يعني 20% للاختبار
    random_state=42
)

# ==========================================
# 6. بناء النموذج وتدريبه
# ==========================================
# استدعاء خوارزمية الانحدار اللوجستي وإعطائها 2000 محاولة للتعلم (عشان يكون دقيق جداً)
model = LogisticRegression(max_iter=2000)
# بدء عملية التدريب (التعلم) على البيانات المخصصة للتدريب
model.fit(X_train, y_train)

# 7. اختبار النموذج
# ==========================================
# نطلب من النموذج يتوقع نتيجة بيانات الاختبار اللي خبيناها عنه
y_pred = model.predict(X_test)

# ==========================================
# 8. تقييم النموذج (النتائج) - مهم للمناقشة
# ==========================================
# طباعة تقرير شامل يوضح الدقة (Precision) والاستدعاء (Recall)
print(classification_report(y_test, y_pred))

# استدعاء أداة مصفوفة الارتباك
from sklearn.metrics import confusion_matrix

# حساب مصفوفة الارتباك وطباعتها
cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:")
print(cm)

# ==========================================
# 9. حفظ النموذج
# ==========================================
import joblib # أداة لحفظ الملفات

# حفظ النموذج والسكيلر كملفات جاهزة لاستخدامها لاحقاً في الموقع (app.py)
joblib.dump(model, "fraud_model.pkl")
joblib.dump(scaler, "scaler.pkl")

# طباعة رسالة تفيد بنجاح الحفظ
print("Model saved successfully!")