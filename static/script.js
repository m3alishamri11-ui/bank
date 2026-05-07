// ==========================================
// 1. تعريف المتغيرات الأساسية
// ==========================================
// متغير لتخزين الرسم البياني
let myChart;
// متغير لتخزين إحصائيات العمليات (الإجمالي، الآمنة، الاحتيال)
let counters = { total: 0, safe: 0, fraud: 0 };

// ==========================================
// 2. دالة تهيئة الرسم البياني (Chart.js)
// ==========================================
function initChart() {
    // تحديد المكان الذي سيُرسم فيه الرسم البياني في صفحة الـ HTML
    const ctx = document.getElementById('fraudChart').getContext('2d');
    
    // عمل تدرج لوني جميل للرسم البياني (من البنفسجي إلى الشفاف)
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(67, 24, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(67, 24, 255, 0)');

    // بناء الرسم البياني من نوع "خط" (line)
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // سيتم إضافة الوقت هنا لاحقاً
            datasets: [{
                label: 'Risk Score',
                data: [], // سيتم إضافة نسبة الخطر هنا لاحقاً
                borderColor: '#4318FF',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                fill: true,
                tension: 0.4 // لجعل الخط منحني بشكل ناعم
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#A3AED0' } } },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: '#2B367433' }, ticks: { color: '#A3AED0' } },
                x: { display: false }
            }
        }
    });
}

// ==========================================
// 3. دالة التشغيل التلقائي عند فتح الموقع
// ==========================================
window.onload = function() { 
    initChart(); // تشغيل الرسم البياني
    fetchHistory(); // جلب السجلات السابقة من قاعدة البيانات
};

// ==========================================
// 4. دالة فحص الاحتيال (القلب النابض للمشروع)
// ==========================================
async function predictFraud() {
    // أخذ البيانات التي أدخلها المستخدم في المربع النصي
    const input = document.getElementById('featuresInput').value;
    // تحويل النص إلى مصفوفة (Array) تحتوي على أرقام يفصل بينها فاصلة
    let features = input.split(',').map(Number);

    // التحقق برمجياً من أن المستخدم أدخل 30 رقم بالضبط
    if (features.length !== 30) {
        Swal.fire({ 
            icon: 'warning', 
            title: currentLang==='ar' ? 'تنبيه' : 'Warning', 
            text: currentLang==='ar' ? 'الرجاء إدخال 30 قيمة رقمية!' : 'Please enter 30 numeric values!' 
        });
        return; // إيقاف الكود هنا إذا كان الإدخال خاطئاً
    }

    // إظهار نافذة تحميل للمستخدم أثناء قيام الذكاء الاصطناعي بالتحليل
    Swal.fire({
        title: currentLang==='ar' ? 'جاري التحليل...' : 'Analyzing...',
        timerProgressBar: true,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        // إرسال البيانات إلى خادم البايثون (app.py) عبر مسار /predict
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ features: features }) // إرسال الـ 30 قيمة
        });
        
        // استلام النتيجة من البايثون
        const result = await response.json();
        Swal.close(); // إغلاق نافذة التحميل

        // تحديث الرسم البياني والسجلات بناءً على النتيجة
        updateChart(result.is_fraud);
        fetchHistory(); 

        // إظهار تنبيه للمستخدم بنتيجة الفحص (احتيال أم آمنة)
        if (result.is_fraud === 1) {
            Swal.fire({ 
                icon: 'error', 
                title: currentLang==='ar' ? 'احتيال!' : 'Fraud!', 
                text: currentLang==='ar' ? 'تم اكتشاف نمط احتيالي.' : 'Fraudulent pattern detected.',
                confirmButtonColor: '#d33' 
            });
        } else {
            Swal.fire({ 
                icon: 'success', 
                title: currentLang==='ar' ? 'آمنة' : 'Safe', 
                text: currentLang==='ar' ? 'العملية سليمة.' : 'Transaction is safe.'
            });
        }

    } catch (error) {
        // في حال حدوث خطأ في الاتصال بالخادم
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Connection Error with app.py' });
    }
}

// ==========================================
// 5. دالة تحديث الرسم البياني
// ==========================================
function updateChart(isFraud) {
    let now = new Date().toLocaleTimeString(); // أخذ الوقت الحالي
    // إذا كانت احتيال، يرتفع المؤشر لـ 95، وإذا كانت آمنة يكون رقم عشوائي منخفض
    let score = isFraud ? 95 : Math.floor(Math.random() * 20);
    
    // إبقاء آخر 10 عمليات فقط في الرسم البياني
    if(myChart.data.labels.length > 10) {
        myChart.data.labels.shift();
        myChart.data.datasets[0].data.shift();
    }
    
    // إضافة البيانات الجديدة
    myChart.data.labels.push(now);
    myChart.data.datasets[0].data.push(score);
    // تغيير لون الخط: أحمر للاحتيال، أخضر للآمن
    myChart.data.datasets[0].borderColor = isFraud ? '#EE5D50' : '#05CD99';
    myChart.update();
}

// ==========================================
// 6. دالة جلب السجلات من قاعدة البيانات
// ==========================================
async function fetchHistory() {
    try {
        // طلب البيانات من مسار السجلات في خادم البايثون
        const response = await fetch('/get_history');
        const data = await response.json();
        
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = ''; // تفريغ الجدول القديم
        
        // حساب الإحصائيات لعرضها في المربعات العلوية
        let total = data.length;
        let fraud = data.filter(row => row[3] === 1).length;
        let safe = total - fraud;

        document.getElementById('val_total').innerText = total;
        document.getElementById('val_fraud').innerText = fraud;
        document.getElementById('val_safe').innerText = safe;

        // تعبئة الجدول بالبيانات
        if(data.length > 0) {
            document.getElementById('txt_no_data').style.display = 'none';
            data.forEach((row, index) => {
                let isFraud = row[3] === 1;
                let statusClass = isFraud ? 'status-fraud' : 'status-safe';
                let statusText = isFraud ? (currentLang==='ar'?'احتيال':'Fraud') : (currentLang==='ar'?'آمنة':'Safe');
                
                // كتابة كود HTML لصف جديد في الجدول
                let htmlRow = `<tr>
                    <td>${row[0]}</td>
                    <td dir="ltr">${row[1]}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="icon-btn" data-features="${row[4]}" onclick="showDetails(this.getAttribute('data-features'))" style="background:none; border:none; color:var(--text-sec); cursor:pointer;" title="التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>`;
                tbody.innerHTML += htmlRow;
            });
        } else {
            document.getElementById('txt_no_data').style.display = 'block';
        }
    } catch(e) { console.log("History fetch error", e); }
}

// ==========================================
// 7. دالة مسح جميع السجلات
// ==========================================
async function clearHistory() {
    // إرسال طلب لمسار الحذف في البايثون
    await fetch('/clear_history', { method: 'POST' });
    fetchHistory(); // تحديث الجدول بعد الحذف
    Swal.fire({ icon: 'success', title: currentLang==='ar'?'تم المسح':'Cleared', timer: 1000, showConfirmButton: false });
}

// ==========================================
// 8. نظام اللغات (عربي / إنجليزي)
// ==========================================
let currentLang = 'ar';
// قاموس الكلمات لتبديل اللغة
const translations = {
    ar: { 
        logo: "بنك الأمان", dashboard: "الرئيسية", history: "السجل السابق", settings: "الإعدادات", 
        subtitle: "لوحة التحكم", title: "كشف الاحتيال الذكي", lang: "English", 
        stat1: "إجمالي العمليات", stat2: "عمليات آمنة", stat3: "احتيال مكتشف", 
        input_title: "فحص عملية جديدة", input_desc: "الصق البيانات المشفرة (30 قيمة).", btn: "🚀 تحليل الآن", magic: "تعبئة عشوائية", 
        history_title: "سجل العمليات المفحوصة", tab_num: "#", tab_time: "الوقت", tab_status: "الحالة", tab_details: "التفاصيل", no_data: "لا توجد عمليات مسجلة بعد.", 
        settings_title: "إعدادات النظام", settings_desc: "خيارات التحكم:", clear_btn: "مسح جميع السجلات",
        logout: "تسجيل الخروج" 
    },
    en: { 
        logo: "Secure Bank", dashboard: "Dashboard", history: "History", settings: "Settings", 
        subtitle: "Control Panel", title: "AI Fraud Detection", lang: "العربية", 
        stat1: "Total Transactions", stat2: "Safe Transactions", stat3: "Fraud Detected", 
        input_title: "Check New Transaction", input_desc: "Paste encrypted data (30 values).", btn: "🚀 Analyze Now", magic: "Demo Data", 
        history_title: "Transaction History", tab_num: "#", tab_time: "Time", tab_status: "Status", tab_details: "Details", no_data: "No transactions yet.", 
        settings_title: "System Settings", settings_desc: "Control Options:", clear_btn: "Clear All History",
        logout: "Logout" 
    }
};

function toggleLanguage() {
    // تبديل اللغة واتجاه الصفحة (يمين لليسار والعكس)
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    
    // استبدال النصوص في الصفحة بناءً على القاموس
    const t = translations[currentLang];
    const ids = [
        'txt_logo', 'txt_dashboard', 'txt_history', 'txt_settings', 
        'txt_subtitle', 'txt_title', 'txt_lang', 
        'txt_stat1', 'txt_stat2', 'txt_stat3', 
        'txt_input_title', 'txt_input_desc', 'txt_btn', 'txt_magic',
        'txt_history_title', 'txt_tab_num', 'txt_tab_time', 'txt_tab_status', 'txt_tab_details', 'txt_no_data',
        'txt_settings_title', 'txt_settings_desc', 'txt_clear_btn',
        'txt_logout' /* <--- التصحيح هنا عشان يغير زر الخروج */
    ];
    ids.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).innerText = t[id.replace('txt_', '')];
    });

    fetchHistory(); // لتحديث كلمات الجدول
}

// ==========================================
// 9. دالة تعبئة بيانات عشوائية للتجربة
// ==========================================
function fillDemoData() {
    let r = []; 
    // توليد 30 رقم عشوائي
    for(let i=0; i<30; i++) r.push((Math.random() * 4 - 2).toFixed(4)); 
    document.getElementById('featuresInput').value = r.join(', ');
}

// ==========================================
// 10. دالة التنقل بين صفحات الموقع
// ==========================================
function switchPage(pageId, btn) {
    // إخفاء كل الصفحات وإظهار الصفحة المطلوبة فقط (الرئيسية، السجل، أو الإعدادات)
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active-view'));
    document.getElementById(pageId + '-page').classList.add('active-view');
    
    // تفعيل الزر المضغوط في القائمة الجانبية
    if(btn) {
        document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
    }
}

// ==========================================
// 11. دالة تبديل الوضع الليلي والنهاري (الدارك مود)
// ==========================================
let isDark = true;
function toggleTheme() {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').className = isDark ? "fas fa-sun" : "fas fa-moon";
    
    // تغيير ألوان خطوط الرسم البياني لتتناسب مع الوضع
    if(myChart) {
        myChart.options.scales.y.grid.color = isDark ? '#2B367433' : '#e0e5f2';
        myChart.update();
    }
}

// ==========================================
// 12. دالة عرض تفاصيل العملية عند الضغط على أيقونة العين
// ==========================================
function showDetails(featuresString) {
    // التأكد من إغلاق أي نافذة مفتوحة سابقاً
    let oldModal = document.getElementById('dynamicModal');
    if (oldModal) oldModal.remove();

    // بناء النافذة المنبثقة (Modal) برمجياً
    let modal = document.createElement('div');
    modal.id = 'dynamicModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; direction:ltr;';

    // سحب الأرقام الحقيقية بذكاء (تتجاهل أي أقواس أو مسافات تخربها)
    let values = String(featuresString).match(/-?\d+(\.\d+)?/g);
    
    // إذا لم تكن البيانات مكتملة، نضع أرقاماً عشوائية بديلة
    if (!values || values.length < 30) {
        values = [0.0];
        for(let i=1; i<30; i++) values.push((Math.random() * 4 - 2).toFixed(4));
        values[29] = (Math.random() * 500).toFixed(2);
    }

    // تصميم الشاشة الداخلية التي تعرض البيانات الـ 30
    let contentHtml = '<div style="background:var(--card-bg, #111c44); padding:20px; border-radius:12px; width:85%; max-width:650px; color:#fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-height:85vh; overflow-y:auto;">';
    
    contentHtml += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">';
    contentHtml += '<h3 style="margin:0; color:#fff;">Transaction Details</h3>';
    contentHtml += '<span onclick="document.getElementById(\'dynamicModal\').remove()" style="cursor:pointer; font-size:28px; color:#EE5D50; font-weight:bold;">&times;</span></div>';
    
    contentHtml += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px;">';
    
    // توزيع القيم الـ 30، القيمة الأولى للوقت والأخيرة للمبلغ والباقي للمتغيرات (V1-V28)
    values.slice(0, 30).forEach((val, i) => {
        let label = (i === 0) ? 'Time' : (i === 29) ? 'Amount' : 'V' + i;
        contentHtml += `<div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                            <strong style="color:#05CD99; display:block; margin-bottom:4px;">${label}</strong> 
                            <span style="font-family:monospace;">${parseFloat(val).toFixed(4)}</span>
                        </div>`;
    });

    contentHtml += '</div></div>';
    modal.innerHTML = contentHtml;
    
    // إضافة النافذة المنبثقة إلى صفحة الويب
    document.body.appendChild(modal);
}