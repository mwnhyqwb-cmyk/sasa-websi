<!DOCTYPE html>  
<html lang="ar" dir="rtl">  
<head>  
    <meta charset="UTF-8">  
    <meta name="viewport" content="width=device-width, initial-scale=1.0">  
    <title>متجر صاصا التاريخ 🧙</title>  
    <style>  
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }  
        body { background-color: #f4f6f9; color: #333; line-height: 1.6; }  
        header { background: linear-gradient(135deg, #e50914, #1e3c72); color: white; padding: 30px 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }  
        .container { max-width: 900px; margin: 20px auto; padding: 0 20px; }  
          
        /* Layout Grid for Main Page Alignment */  
        .main-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }  
        @media(max-width: 768px) { .main-layout { grid-template-columns: 1fr; } }  
  
        /* Stats Dashboard */  
        .stats-container { display: flex; gap: 15px; margin-bottom: 25px; grid-column: 1 / -1; }  
        .stat-card { flex: 1; background: white; padding: 15px; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #ddd; }  
        .stat-number { font-size: 1.8rem; font-weight: bold; color: #1e3c72; }  
        .stat-label { font-size: 0.9rem; color: #666; }  
  
        /* Accordion & Items */  
        .category-btn { width: 100%; background: #1e3c72; color: white; border: none; padding: 15px; text-align: right; font-size: 1.2rem; font-weight: bold; border-radius: 8px; margin-bottom: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }  
        .category-content { display: none; margin-bottom: 20px; padding: 10px; background: #fff; border-radius: 8px; border: 1px solid #ddd; }  
        .service-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; }  
        .service-item:last-child { border-bottom: none; }  
          
        /* Status Badges */  
        .badge-closed { background: #e74c3c; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; }  
        .badge-open { background: #2ecc71; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; }  
        .badge-pending { background: #f39c12; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; }  
        .badge-approved { background: #2ecc71; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; }  
        .badge-rejected { background: #e74c3c; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; }  
  
        .btn-order { background: #e50914; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }  
        .btn-disabled { background: #ccc; cursor: not-allowed; }  
  
        /* Section Boxes */  
        .section-box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #ddd; }  
        .section-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; color: #1e3c72; border-bottom: 2px solid #1e3c72; padding-bottom: 5px; }  
  
        /* Order Tracking Card */  
        .order-track-card { background: #f9fbfd; border: 1px solid #d1e3f8; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }  
  
        /* Delivery Box (تسليم الاوردرات) */  
        .delivery-box { background: #e8f8f5; border: 2px dashed #1abc9c; padding: 15px; border-radius: 8px; margin-top: 10px; font-size: 0.95rem; color: #0e6251; }  
        .delivery-box-title { font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; font-size: 1.05rem; }  
  
        /* Admin Panel - Left Side */  
        .admin-container-left { display: flex; justify-content: flex-start; margin: 20px 0; grid-column: 1 / -1; }  
        .admin-trigger { background: #34495e; color: white; padding: 12px 25px; text-align: center; border-radius: 8px; cursor: pointer; font-weight: bold; display: inline-block; }  
          
        .admin-panel { display: none; background: #fff; padding: 20px; border-radius: 8px; border: 2px solid #34495e; margin-top: 10px; grid-column: 1 / -1; }  
        .admin-order-card { background: #f8f9fa; border: 1px solid #ccc; padding: 12px; border-radius: 6px; margin-bottom: 10px; }  
        .btn-accept { background: #2ecc71; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }  
        .btn-reject { background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }  
  
        /* Modal */  
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000; justify-content: center; align-items: center; }  
        .modal-box { background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 450px; }  
        .cash-info { background: #eef9ff; border: 1px solid #bce1ff; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 0.95rem; text-align: center; }  
        .cash-number { font-size: 1.2rem; font-weight: bold; color: #e50914; direction: ltr; display: inline-block; margin: 5px 0; background: #fff; padding: 4px 10px; border-radius: 5px; border: 1px dashed #e50914; }  
  
        /* Divider Style */  
        .services-divider-container {  
            display: flex;  
            align-items: center;  
            justify-content: center;  
            width: 100%;  
            margin: 35px 0 20px 0;  
            direction: rtl;  
            position: relative;  
            z-index: 10;  
            grid-column: 1 / -1;  
        }  
  
        .services-divider-line {  
            flex: 1;  
            height: 2px;  
            background: linear-gradient(90deg, transparent, #00d2ff, #3a7bd5, transparent);  
            border-radius: 2px;  
            box-shadow: 0 0 10px rgba(0, 210, 255, 0.7);  
        }  
  
        .services-divider-badge {  
            display: flex;  
            align-items: center;  
            gap: 10px;  
            padding: 10px 28px;  
            background: rgba(15, 23, 42, 0.85);  
            border: 1.5px solid rgba(0, 210, 255, 0.5);  
            border-radius: 50px;  
            box-shadow: 0 0 20px rgba(0, 210, 255, 0.35), inset 0 0 12px rgba(0, 210, 255, 0.15);  
            margin: 0 15px;  
            backdrop-filter: blur(8px);  
            -webkit-backdrop-filter: blur(8px);  
        }  
  
        .divider-text {  
            margin: 0;  
            font-size: 1.3rem;  
            font-weight: 800;  
            color: #ffffff;  
            text-shadow: 0 0 10px rgba(0, 210, 255, 0.9);  
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;  
        }  
  
        .divider-sparkle, .divider-heart {  
            font-size: 1.2rem;  
            display: inline-block;  
            animation: glowPulse 2s infinite ease-in-out alternate;  
        }  
  
        @keyframes glowPulse {  
            0% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(0, 210, 255, 0.5)); }  
            100% { transform: scale(1.2); filter: drop-shadow(0 0 8px rgba(0, 210, 255, 1)); }  
        }  
          
        .services-column { display: flex; flex-direction: column; }  
    </style>  
</head>  
<body>  
  
    <header>  
        <h1>متجر صاصا التاريخ 🧙</h1>  
    </header>  
  
    <div class="container">  
        <!-- Live Real Stats -->  
        <div class="stats-container" style="display: flex; gap: 15px; margin-bottom: 25px;">  
            <div class="stat-card">  
                <div class="stat-number" id="totalOrdersCount">0</div>  
                <div class="stat-label">👥 إجمالي مستخدمي المتجر (الطلبات الفعلية)</div>  
            </div>  
            <div class="stat-card">  
                <div class="stat-number" id="onlineUsersCount">1</div>  
                <div class="stat-label">🟢 المتواجدون الآن (الأجهزة النشطة)</div>  
            </div>  
        </div>  
  
        <!-- Main Layout Split: Right Side (Delivery Box & Tracking) / Left Side (Categories & Services) -->  
        <div class="main-layout">  
              
            <!-- Right Column: Dedicated to Delivery Box & User Orders Tracking -->  
            <div class="services-column">  
                <!-- Section: User Track Orders & Delivery Box on the Right -->  
                <div class="section-box" style="border: 2px solid #1abc9c;">  
                    <div class="section-title" style="color: #1abc9c; border-color: #1abc9c;">📦 صندوق تسليم الأوردرات الرئيسي</div>  
                    <div id="userOrdersList">  
                        <p style="color: #777; text-align: center;">لا توجد طلبات سابقة لديك حالياً.</p>  
                    </div>  
                </div>  
            </div>  
  
            <!-- Left Column: Categories and Services -->  
            <div class="services-column">  
                <!-- Category 1: Vodafone -->  
                <button class="category-btn" onclick="toggleCategory('vodaCategory')">  
                    <span>خدمات فودافون 💙✨</span> <span>▼</span>  
                </button>  
                <div class="category-content" id="vodaCategory">  
                    <div class="service-item">  
                        <div><strong>سحب بيانات فودافون</strong> - 50 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('سحب بيانات فودافون', 50)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>بيانات مميز فودافون</strong> - 90 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('بيانات مميز فودافون', 90)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>بحث قومي فودافون</strong> - 60 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('بحث قومي فودافون', 60)">طلب</button>  
                    </div>  
                </div>  
  
                <!-- Category 2: Etisalat -->  
                <button class="category-btn" onclick="toggleCategory('etiCategory')">  
                    <span>خدمات اتصالات 💙✨</span> <span>▼</span>  
                </button>  
                <div class="category-content" id="etiCategory">  
                    <div class="service-item">  
                        <div><strong>سحب بيانات اتصالات</strong> - 50 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('سحب بيانات اتصالات', 50)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>بيانات مميز اتصالات</strong> - 0 ج.م <span class="badge-closed">مغلق الان 🟥</span></div>  
                        <button class="btn-order btn-disabled" disabled>مغلق</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>بحث قومي اتصالات</strong> - 0 ج.م <span class="badge-closed">مغلق الان 🟥</span></div>  
                        <button class="btn-order btn-disabled" disabled>مغلق</button>  
                    </div>  
                </div>  
  
                <!-- Category 3: Orange -->  
                <button class="category-btn" onclick="toggleCategory('orangeCategory')">  
                    <span>خدمات اورنج 💙✨</span> <span>▼</span>  
                </button>  
                <div class="category-content" id="orangeCategory">  
                    <div class="service-item">  
                        <div><strong>سحب بيانات اورنج</strong> - 30 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('سحب بيانات اورنج', 30)">طلب</button>  
                    </div>  
                </div>  
  
                <!-- Category 4: WE -->  
                <button class="category-btn" onclick="toggleCategory('weCategory')">  
                    <span>خدمات وي 💙✨</span> <span>▼</span>  
                </button>  
                <div class="category-content" id="weCategory">  
                    <div class="service-item">  
                        <div><strong>بطاقه من الرقم القومي</strong> - 40 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('بطاقه من الرقم القومي', 40)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>بطاقه من الرقم 💳</strong> - 40 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('بطاقه من الرقم 💳', 40)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>بحث ارقام وي 🔍</strong> - 40 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('بحث ارقام وي 🔍', 40)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>بطاقه من رقم ارضي ☎️</strong> - 40 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('بطاقه من رقم ارضي ☎️', 40)">طلب</button>  
                    </div>  
                </div>  
  
                <!-- Category 5: Supply / Tamween -->  
                <button class="category-btn" onclick="toggleCategory('tamweenCategory')">  
                    <span>خدمات تموين 💙✨</span> <span>▼</span>  
                </button>  
                <div class="category-content" id="tamweenCategory">  
                    <div class="service-item">  
                        <div><strong>سحب تموين 🌾</strong> - 50 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('سحب تموين 🌾', 50)">طلب</button>  
                    </div>  
                </div>  
  
                <!-- Category 6: Civil Registry -->  
                <button class="category-btn" onclick="toggleCategory('civilCategory')">  
                    <span>خدمات سجل مدني 💙✨</span> <span>▼</span>  
                </button>  
                <div class="category-content" id="civilCategory">  
                    <div class="service-item">  
                        <div><strong>قيد عادي</strong> - 470 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('قيد عادي', 470)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>قيد مفصل</strong> - 670 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('قيد مفصل', 670)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>اسكرين بطاقه</strong> - 720 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('اسكرين بطاقه', 720)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>شهادة وفاه</strong> - 620 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('شهادة وفاه', 620)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>شهادة ميلاد</strong> - 370 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('شهادة ميلاد', 370)">طلب</button>  
                    </div>  
                    <div class="service-item">  
                        <div><strong>شهادة جواز/طلاق</strong> - 370 ج.م <span class="badge-open">متاح ✅</span></div>  
                        <button class="btn-order" onclick="openOrderModal('شهادة جواز/طلاق', 370)">طلب</button>  
                    </div>  
                </div>  
  
                <!-- Category 7: NTRA Service -->  
                <button class="category-btn" onclick="toggleCategory('ntraCategory')">  
                    <span>خدمه نترا 💙✨</span> <span>▼</span>  
                </button>  
                <div class="category-content" id="ntraCategory">  
                    <p style="color: #777; text-align: center; padding: 10px;">لا توجد خدمات مضافة حالياً.</p>  
                </div>  
            </div>  
  
        </div>  
  
        <!-- ================= فاصل خدمات الرشق أسفل جميع الأقسام ================= -->  
        <div class="services-divider-container">  
            <div class="services-divider-line"></div>  
            <div class="services-divider-badge">  
                <span class="divider-sparkle">✨</span>  
                <h2 class="divider-text">خدمات الرشق</h2>  
                <span class="divider-heart">💙</span>  
            </div>  
            <div class="services-divider-line"></div>  
        </div>  
  
        <!-- TikTok Services Category -->  
        <button class="category-btn" onclick="toggleCategory('tiktokCategory')" style="background: #111; border: 1px solid #333;">  
            <span style="display: flex; align-items: center; gap: 8px;">  
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#ff0050" style="vertical-align: middle;"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.242V2h-3.445v13.672a2.896 2.896 0 0 1-5.019 1.957 2.89 2.89 0 0 1 .499-3.743 2.89 2.89 0 0 1 2.147-.942c.22 0 .438.025.65.074V9.458a6.345 6.345 0 0 0-.65-.034c-3.498 0-6.335 2.837-6.335 6.335s2.837 6.335 6.335 6.335c3.498 0 6.335-2.837 6.335-6.335V8.583a8.214 8.214 0 0 0 4.887 1.621v-3.44c-.742 0-1.455-.13-2.115-.369l-.213-.089z"/></svg>  
                قسم تيك توك  
            </span>   
            <span>▼</span>  
        </button>  
        <div class="category-content" id="tiktokCategory">  
            <div class="service-item">  
                <div><strong>ليكات</strong> ♥️ <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('ليكات تيك توك ♥️', 50)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>متابعين حقيقين مصري</strong> ➕ <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('متابعين حقيقين مصري تيك توك ➕', 120)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>متابعين ثابت ضمان مدي الحياه</strong> ➕ <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('متابعين ثابت ضمان مدي الحياه تيك توك ➕', 150)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>اكسبلور</strong> 🦈 <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('اكسبلور تيك توك 🦈', 70)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>تعليقات</strong> ✍️ <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('تعليقات تيك توك ✍️', 60)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>مشهدات تيك توك 👀</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openViewsModal()">طلب</button>  
            </div>  
        </div>  
  
        <!-- Instagram Services Category (Updated with requested items) -->  
        <button class="category-btn" onclick="toggleCategory('instaCategory')" style="background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); border: 1px solid #d62976; color: white;">  
            <span style="display: flex; align-items: center; gap: 8px;">  
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="vertical-align: middle;"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>  
                قسم خدمات إنستجرام  
            </span>   
            <span>▼</span>  
        </button>  
        <div class="category-content" id="instaCategory">  
            <div class="service-item">  
                <div><strong>رشق مشاهدات 👁️</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('رشق مشاهدات إنستجرام 👁️', 35)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>رشق ليكات ❤️</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('رشق ليكات إنستجرام ❤️', 40)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>رشق متابعين ثابت ➕</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('رشق متابعين ثابت إنستجرام ➕', 120)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>رشق تعليقات 💬</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('رشق تعليقات إنستجرام 💬', 50)">طلب</button>  
            </div>  
        </div>  
  
        <!-- WhatsApp Channels in Growth Section -->  
        <button class="category-btn" onclick="toggleCategory('whatsappGrowthCategory')" style="background: #25d366; border: 1px solid #1ebe57; color: white; margin-top: 10px;">  
            <span style="display: flex; align-items: center; gap: 8px;">  
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="vertical-align: middle;"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>  
                رشق قنوات الواتساب (قسم الرشق)  
            </span>   
            <span>▼</span>  
        </button>  
        <div class="category-content" id="whatsappGrowthCategory">  
            <div class="service-item">  
                <div><strong>رشق قنوات الواتساب متابعين (5k متابع) 👥</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('رشق قنوات الواتساب متابعين 5k متابع 👥', 250)">طلب</button>  
            </div>  
        </div>  
  
  
        <!-- ================= فاصل خدمات الواتساب الأخرى في النهاية ================= -->  
        <div class="services-divider-container">  
            <div class="services-divider-line"></div>  
            <div class="services-divider-badge" style="border-color: rgba(37, 211, 102, 0.5); box-shadow: 0 0 20px rgba(37, 211, 102, 0.35);">  
                <span class="divider-sparkle">✨</span>  
                <h2 class="divider-text">قسم خدمات الـواتساب</h2>  
                <span class="divider-heart">💙</span>  
            </div>  
            <div class="services-divider-line"></div>  
        </div>  
  
        <!-- WhatsApp Services Category -->  
        <button class="category-btn" onclick="toggleCategory('whatsappCategory')" style="background: #25d366; border: 1px solid #1ebe57; color: white;">  
            <span style="display: flex; align-items: center; gap: 8px;">  
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="vertical-align: middle;"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>  
                قسم خدمات الواتساب (الإدارية والتقنية)  
            </span>   
            <span>▼</span>  
        </button>  
        <div class="category-content" id="whatsappCategory">  
            <div class="service-item">  
                <div><strong>فك حظر رقم واتساب 🔓</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('فك حظر رقم واتساب 🔓', 100)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>رقم واتساب وهمي مفعل (جاهز) 🌐</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('رقم واتساب وهمي مفعل 🌐', 45)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>زيادة مشاهدات حالة واتساب 👀</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('زيادة مشاهدات حالة واتساب 👀', 30)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>كراش واتساب 💥</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('كراش واتساب 💥', 30)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>استوري واتساب 📱</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('استوري واتساب 📱', 20)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>فك الارقام ✔️</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('فك الارقام ✔️', 150)">طلب</button>  
            </div>  
            <div class="service-item">  
                <div><strong>حظر الارقام 🚫</strong> <span class="badge-open">متاح ✅</span></div>  
                <button class="btn-order" onclick="openOrderModal('حظر الارقام 🚫', 100)">طلب</button>  
            </div>  
        </div>  
  
        <!-- Admin Control Trigger - Left Side -->  
        <div class="admin-container-left">  
            <div class="admin-trigger" onclick="accessAdminPanel()">⚙️ إعدادات لوحة تحكم الأدمن 🔐</div>  
        </div>  
          
        <div class="admin-panel" id="adminPanel">  
            <h3>🔑 لوحة تحكم الأدمن - إدارة الطلبات</h3>  
            <hr style="margin: 10px 0;">  
            <div id="adminOrdersList">  
                <p style="color: #777;">لا توجد طلبات معلقة حالياً.</p>  
            </div>  
        </div>  
    </div>  
  
    <!-- Standard Order Modal -->  
    <div class="modal" id="orderModal">  
        <div class="modal-content modal-box">  
            <h3 id="modalServiceName"></h3>  
            <p style="font-weight: bold; color: #e50914; margin-bottom: 10px; font-size: 1.1rem;">المبلغ المطلوب: <span id="modalServicePrice"></span> ج.م</p>  
              
            <div class="cash-info">  
                💸 <strong>خطوات الدفع والتأكيد:</strong><br>  
                1. قم بتحويل المبلغ عبر محفظة الكاش إلى الرقم:<br>  
                <span class="cash-number" id="cashNumberDisplay">01227252115</span><br>  
                2. خذ سكرين شوت (إيصال التحويل).<br>  
                3. ارفق الإسكرين مع أدخل بيانات الطلب بالأسفل.  
            </div>  
  
            <form onsubmit="submitRealOrder(event)">  
                <input type="text" id="custName" placeholder="اسمك بالكامل" required style="width: 100%; margin-bottom: 8px; padding: 8px;">  
                <input type="tel" id="custPhone" placeholder="رقم الواتساب الخاص بك" required style="width: 100%; margin-bottom: 8px; padding: 8px;">  
                <input type="text" id="custTarget" placeholder="الرقم المستهدف / يوزر الحساب أو الفيديو" required style="width: 100%; margin-bottom: 8px; padding: 8px;">  
                <label style="font-size: 0.85rem; display: block; margin-bottom: 4px;">إرفاق اسكرين شوت التحويل (الكاش):</label>  
                <input type="file" id="custReceipt" accept="image/*" required style="width: 100%; margin-bottom: 12px;">  
                <button type="submit" class="btn-order" style="width: 100%; padding: 10px;">تأكيد الطلب وإرسال الإسكرين 🚀</button>  
            </form>  
            <button onclick="closeModal()" style="width: 100%; margin-top: 8px; padding: 6px; background: #777; color: white; border: none; border-radius: 4px;">إلغاء</button>  
        </div>  
    </div>  
  
    <!-- Views Quantity Modal -->  
    <div class="modal" id="viewsModal">  
        <div class="modal-content modal-box">  
            <h3>👁️ اختر كمية مشاهدات تيك توك</h3>  
            <p style="font-size: 0.9rem; color: #555; margin-bottom: 15px;">اختر الباقة المناسبة لمشاهدات الفيديو:</p>  
              
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">  
                <button class="btn-order" style="text-align: right; padding: 12px; background: #1e3c72; display: flex; justify-content: space-between;" onclick="selectViewPackage(1000, 50)">  
                    <span>1000 مشاهدة 👀</span> <strong>50 ج.م</strong>  
                </button>  
                <button class="btn-order" style="text-align: right; padding: 12px; background: #1e3c72; display: flex; justify-content: space-between;" onclick="selectViewPackage(2000, 100)">  
                    <span>2000 مشاهدة 👀</span> <strong>100 ج.م</strong>  
                </button>  
                <button class="btn-order" style="text-align: right; padding: 12px; background: #1e3c72; display: flex; justify-content: space-between;" onclick="selectViewPackage(3000, 150)">  
                    <span>3000 مشاهدة 👀</span> <strong>150 ج.م</strong>  
                </button>  
                <button class="btn-order" style="text-align: right; padding: 12px; background: #1e3c72; display: flex; justify-content: space-between;" onclick="selectViewPackage(4000, 200)">  
                    <span>4000 مشاهدة 👀</span> <strong>200 ج.م</strong>  
                </button>  
            </div>  
              
            <button onclick="closeViewsModal()" style="width: 100%; padding: 8px; background: #777; color: white; border: none; border-radius: 4px;">إلغاء</button>  
        </div>  
    </div>  
  
    <script>  
        const CASH_NUMBER = "01227252115";   
  
        function initApp() {  
            renderUserOrders();  
            renderAdminOrders();  
              
            window.addEventListener('storage', () => {  
                renderUserOrders();  
                renderAdminOrders();  
            });  
        }  
  
        function toggleCategory(catId) {  
            const el = document.getElementById(catId);  
            el.style.display = el.style.display === 'block' ? 'none' : 'block';  
        }  
  
        function openOrderModal(serviceName, price) {  
            document.getElementById('modalServiceName').innerText = serviceName;  
            document.getElementById('modalServicePrice').innerText = price;  
            document.getElementById('orderModal').style.display = 'flex';  
        }  
  
        function openViewsModal() {  
            document.getElementById('viewsModal').style.display = 'flex';  
        }  
  
        function closeViewsModal() {  
            document.getElementById('viewsModal').style.display = 'none';  
        }  
  
        function selectViewPackage(count, price) {  
            closeViewsModal();  
            openOrderModal(`مشاهدات تيك توك (${count} مشاهدة)`, price);  
        }  
  
        function closeModal() {  
            document.getElementById('orderModal').style.display = 'none';  
        }  
  
        function submitRealOrder(e) {  
            e.preventDefault();  
              
            const serviceName = document.getElementById('modalServiceName').innerText;  
            const price = document.getElementById('modalServicePrice').innerText;  
            const custName = document.getElementById('custName').value;  
            const custPhone = document.getElementById('custPhone').value;  
            const custTarget = document.getElementById('custTarget').value;  
  
            const orders = JSON.parse(localStorage.getItem('all_store_orders') || '[]');  
              
            const newOrder = {  
                id: 'ORD-' + Date.now(),  
                serviceName: serviceName,  
                price: price,  
                custName: custName,  
                custPhone: custPhone,  
                custTarget: custTarget,  
                status: 'قيد المراجعة ⏳',  
                statusCode: 'pending',  
                deliveryResult: '',   
                date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })  
            };  
  
            orders.push(newOrder);  
            localStorage.setItem('all_store_orders', JSON.stringify(orders));  
  
            localStorage.setItem('real_total_orders', orders.length);  
            document.getElementById('totalOrdersCount').innerText = orders.length;  
  
            renderUserOrders();  
            renderAdminOrders();  
  
            alert('تم إرسال الطلب وإسكرين التحويل بنجاح! يمكنك متابعة حالة الطلب وصندوق التسليم في الواجهة الرئيسية.');  
            closeModal();  
        }  
  
        function renderUserOrders() {  
            const orders = JSON.parse(localStorage.getItem('all_store_orders') || '[]');  
            const container = document.getElementById('userOrdersList');  
            document.getElementById('totalOrdersCount').innerText = orders.length;  
  
            if (orders.length === 0) {  
                container.innerHTML = '<p style="color: #777; text-align: center;">لا توجد طلبات سابقة لديك حالياً.</p>';  
                return;  
            }  
  
            let html = '';  
            orders.slice().reverse().forEach(ord => {  
                let badgeClass = 'badge-pending';  
                if (ord.statusCode === 'approved') badgeClass = 'badge-approved';  
                if (ord.statusCode === 'rejected') badgeClass = 'badge-rejected';  
  
                let deliveryBoxHtml = '';  
                if (ord.statusCode === 'approved') {  
                    deliveryBoxHtml = `  
                        <div class="delivery-box">  
                            <div class="delivery-box-title">📦 صندوق تسليم الأوردرات 🚚</div>  
                            <div>${ord.deliveryResult || 'جاري تجهيز بيانات/نتيجة الأوردر من الإدارة...'}</div>  
                        </div>  
                    `;  
                } else if (ord.statusCode === 'rejected') {  
                    deliveryBoxHtml = `  
                        <div class="delivery-box" style="border-color: #e74c3c; background: #fdebd0; color: #900c3f;">  
                            <div class="delivery-box-title">❌ صندوق تسليم الأوردرات 🚚</div>  
                            <div>عذراً، تم رفض الطلب. يرجى مراجعة الدعم الفني.</div>  
                        </div>  
                    `;  
                }  
  
                html += `  
                    <div class="order-track-card" style="flex-direction: column; align-items: stretch;">  
                        <div style="display: flex; justify-content: space-between; align-items: center;">  
                            <div>  
                                <strong>${ord.serviceName}</strong> (${ord.price} ج.م)<br>  
                                <small style="color: #666;">المستهدف: ${ord.custTarget} | الساعة: ${ord.date}</small>  
                            </div>  
                            <div>  
                                <span class="${badgeClass}">${ord.status}</span>  
                            </div>  
                        </div>  
                        ${deliveryBoxHtml}  
                    </div>  
                `;  
            });  
            container.innerHTML = html;  
        }  
  
        function renderAdminOrders() {  
            const orders = JSON.parse(localStorage.getItem('all_store_orders') || '[]');  
            const container = document.getElementById('adminOrdersList');  
  
            if (orders.length === 0) {  
                container.innerHTML = '<p style="color: #777;">لا توجد طلبات معلقة حالياً.</p>';  
                return;  
            }  
  
            let html = '';  
            orders.forEach((ord, index) => {  
                html += `  
                    <div class="admin-order-card">  
                        <div><strong>رقم الطلب:</strong> ${ord.id}</div>  
                        <div><strong>الخدمة:</strong> ${ord.serviceName} (${ord.price} ج.م)</div>  
                        <div><strong>العميل:</strong> ${ord.custName} (${ord.custPhone})</div>  
                        <div><strong>الرقم المستهدف:</strong> ${ord.custTarget}</div>  
                        <div><strong>الحالة الحالية:</strong> ${ord.status}</div>  
                        <div style="margin-top: 8px;">  
                            <label style="font-size: 0.85rem; font-weight: bold;">نتيجة / محتوى صندوق تسليم الأوردر لهذا العميل:</label>  
                            <input type="text" id="deliveryInput-${index}" value="${ord.deliveryResult || ''}" placeholder="اكتب البيانات أو النتيجة هنا ليراها العميل..." style="width: 100%; padding: 6px; margin-top: 4px; margin-bottom: 8px;">  
                        </div>  
                        <div style="margin-top: 5px; display: flex; gap: 10px;">  
                            <button class="btn-accept" onclick="updateOrderStatus(${index}, 'approved')">موافقة وتحديث صندوق التسليم ✅</button>  
                            <button class="btn-reject" onclick="updateOrderStatus(${index}, 'rejected')">رفض الطلب ❌</button>  
                        </div>  
                    </div>  
                `;  
            });  
            container.innerHTML = html;  
        }  
  
        function updateOrderStatus(index, newStatusCode) {  
            let orders = JSON.parse(localStorage.getItem('all_store_orders') || '[]');  
            const deliveryInputValue = document.getElementById(`deliveryInput-${index}`).value;  
              
            if (newStatusCode === 'approved') {  
                orders[index].status = 'تم المقبول والتنفيذ ✅';  
                orders[index].statusCode = 'approved';  
                orders[index].deliveryResult = deliveryInputValue || 'تم تسليم الأوردر بنجاح!';  
            } else if (newStatusCode === 'rejected') {  
                orders[index].status = 'مرفوض ❌ (تواصل مع الدعم)';  
                orders[index].statusCode = 'rejected';  
                orders[index].deliveryResult = 'تم رفض الطلب.';  
            }  
  
            localStorage.setItem('all_store_orders', JSON.stringify(orders));  
            renderUserOrders();  
            renderAdminOrders();  
            alert('تم تحديث حالة الطلب وصندوق التسليم بنجاح وسيظهر للعميل فوراً.');  
        }  
  
        function accessAdminPanel() {  
            const pwd = prompt('أدخل كلمة مرور الأدمن:');  
            if (pwd === 'sasailmoseba1') {  
                document.getElementById('adminPanel').style.display = 'block';  
                renderAdminOrders();  
                alert('تمت المصادقة بنجاح كأدمن.');  
            } else {  
                alert('كلمة المرور غير صحيحة!');  
            }  
        }  
  
        window.onload = initApp;  
    </script>  
</body>  
</html>  
