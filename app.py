# 1. استدعاء المكتبات البرمجية الأساسية (Imports)
# استدعاء أدوات Flask لإنشاء الموقع والتعامل مع الصفحات والجلسات
from flask import Flask, render_template, request, jsonify, redirect, url_for, session 
import joblib       # أداة لفتح وقراءة ملفات الذكاء الاصطناعي (النموذج المدرب)
import numpy as np  # أداة للتعامل مع المصفوفات والأرقام (يحتاجها الذكاء الاصطناعي)
import sqlite3      # أداة لإنشاء والتعامل مع قاعدة البيانات
import datetime     # أداة لمعرفة الوقت والتاريخ الحالي

# 2. إعداد الخادم وحماية الموقع
# الإعلان عن بدء تشغيل تطبيق Flask
app = Flask(__name__)

# إنشاء "مفتاح سري" لتشفير جلسات المستخدمين (عشان ماحد يدخل لوحة التحكم بدون تسجيل دخول)
app.secret_key = 'smart_fraud_detection_secret_key_123' 


# 3. تحميل عقل الذكاء الاصطناعي
# تحميل نموذج اكتشاف الاحتيال المدرب
model = joblib.load('fraud_model.pkl')
# تحميل أداة التقييس (Scaler) لضبط الأرقام وتوحيدها قبل إدخالها للنموذج
scaler = joblib.load('scaler.pkl')

# 4. دالة بناء قاعدة البيانات
def init_db():
    # فتح اتصال بملف قاعدة البيانات)
    conn = sqlite3.connect('fraud_detection.db')
    c = conn.cursor()
    # إنشاء جدول "history" لحفظ سجل العمليات إذا لم يكن موجوداً مسبقاً
    # يحتوي على: (الرقم التسلسلي، الوقت، الحالة كنص، النتيجة كرقم 0 أو 1)
    c.execute('''CREATE TABLE IF NOT EXISTS history 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  timestamp TEXT, 
                  status TEXT, 
                  is_fraud INTEGER)''')
    conn.commit() # تأكيد الحفظ
    conn.close()  # إغلاق الاتصال بقاعدة البيانات

# استدعاء الدالة لتجهيز قاعدة البيانات أول ما يشتغل السيرفر
init_db() 

# 5. مسار الصفحة الرئيسية (صفحة تسجيل الدخول)
@app.route('/', methods=['GET'])
def home():
    # فتح صفحة تسجيل الدخول (login.html)
    return render_template('login.html')

# 6. مسار التحقق من تسجيل الدخول (Login Logic)
@app.route('/login', methods=['POST'])
def login():
    # استلام اسم المستخدم وكلمة المرور من واجهة الموقع
    username = request.form.get('username')
    password = request.form.get('password')
    
    # التحقق: إذا كان اليوزر admin والباسورد 1234
    if username == 'admin' and password == '1234':
        session['user'] = username # فتح جلسة آمنة للمستخدم
        return redirect(url_for('dashboard')) # تحويله إلى لوحة التحكم
    else:
        # إذا كانت البيانات خاطئة: سحب الوقت الحالي
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # طباعة تنبيه أمني في الشاشة السوداء (VS Code) عن محاولة الدخول الفاشلة
        print(f"\n🚨 [SECURITY ALERT] Failed login attempt detected!")
        print(f"   -> Username tried: '{username}'")
        print(f"   -> Time: {now}\n")
        
        # إعادة المستخدم لصفحة الدخول مع رسالة خطأ
        return render_template('login.html', error="Invalid Username or Password. Please try again.")

# 7. مسار تسجيل الخروج (Logout)
@app.route('/logout')
def logout():
    # مسح بيانات الجلسة (إلغاء تسجيل الدخول)
    session.pop('user', None) 
    # إعادته للصفحة الرئيسية (تسجيل الدخول)
    return redirect(url_for('home'))    

# 8. مسار لوحة التحكم (Dashboard)
@app.route('/dashboard')
def dashboard():
    # حماية برمجية: إذا المستخدم مو مسجل دخوله، اطرده لصفحة تسجيل الدخول
    if 'user' not in session:
        return redirect(url_for('home'))
    # إذا مسجل دخوله، افتح له واجهة الموقع الأساسية (index.html)
    return render_template('index.html')

# 9.  : دالة فحص الاحتيال (Predict)
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # استلام البيانات الـ 30 التي أدخلها المستخدم من الواجهة (بصيغة JSON)
        data = request.get_json()
        features = data['features']
        
        # تحويل الأرقام إلى مصفوفة وتغيير شكلها ليناسب الذكاء الاصطناعي
        features_array = np.array(features).reshape(1, -1)
        # تمرير الأرقام لأداة الـ Scaler لتوحيد مقاساتها
        features_scaled = scaler.transform(features_array)
        
        # إدخال البيانات المجهزة لنموذج الذكاء الاصطناعي ليفحصها ويعطينا النتيجة
        prediction = model.predict(features_scaled)[0] 
        is_fraud = int(prediction) # تحويل النتيجة إلى رقم صحيح (0 أو 1)
        
        # ترجمة النتيجة الرقمية إلى نص (Fraud أو Safe) ليتم حفظها في القاعدة
        status = "Fraud" if is_fraud == 1 else "Safe"
        
        # فتح قاعدة البيانات لحفظ نتيجة الفحص
        conn = sqlite3.connect('fraud_detection.db')
        c = conn.cursor()
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") # جلب وقت الفحص
        # إدخال الوقت، والنص، والرقم في جدول السجلات
        c.execute("INSERT INTO history (timestamp, status, is_fraud) VALUES (?, ?, ?)", 
        (now, status, is_fraud))
        conn.commit() # تأكيد الحفظ
        conn.close()

        # إرسال النتيجة النهائية كاستجابة 
        # (JSON) لواجهة الموقع لعرض التنبيه للمستخدم
        return jsonify({'prediction': status, 'is_fraud': is_fraud})

    except Exception as e:
        # في حال حدوث أي خطأ برمجي، يتم إرجاع رسالة الخطأ
        return jsonify({'error': str(e)})

# 10. دالة مسح السجلات (Clear History)
@app.route('/clear_history', methods=['POST'])
def clear_history():
    # فتح قاعدة البيانات
    conn = sqlite3.connect('fraud_detection.db')
    c = conn.cursor()
    # حذف جميع البيانات الموجودة في جدول history
    c.execute("DELETE FROM history")
    conn.commit()
    conn.close()
    return jsonify({'status': 'cleared'}) # الرد بنجاح عملية المسح

# 11. دالة جلب السجلات لعرضها في الموقع (Get History)
@app.route('/get_history', methods=['GET'])
def get_history():
    # فتح قاعدة البيانات
    conn = sqlite3.connect('fraud_detection.db')
    c = conn.cursor()
    # استخراج كل السجلات من الأحدث للأقدم 
    c.execute("SELECT * FROM history ORDER BY id DESC") 
    rows = c.fetchall() # جلب جميع الصفوف
    conn.close()
    return jsonify(rows) # إرسال البيانات للواجهة لعرضها في الجدول


# 12. أمر تشغيل السيرفر الرئيسي
if __name__ == '__main__':
    # تشغيل تطبيق Flask في وضع التطوير (debug=True) ليتم تحديثه تلقائياً عند أي تعديل
    app.run(debug=True)