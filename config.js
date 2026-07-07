/**
 * PharmReady-AlmaghwryBy-Fadel - Configuration & API Wrapper (Updated)
 * 
 * Instructions:
 * 1. Deploy the code from google-script.js as a Google Apps Script Web App.
 * 2. Paste the Web App URL in the API_URL variable below.
 * 3. If API_URL is left empty or as placeholder, the system will run in "Demo Mode" 
 *    using browser LocalStorage, allowing you to test everything immediately without Google Sheets!
 */

const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbwYcSrLslXgn6SXyukWpGeDDUU7TT9HJwHk0G-u0s78x55KXRlQX5RT5CSmaFiJHzID/exec";
const API_URL = localStorage.getItem("maghawry_api_url") || DEFAULT_API_URL;

// Check if we are running in Demo Mode (checks if placeholder is still present)
const isDemoMode = !API_URL || API_URL.includes("YOUR_GOOGLE_APPS_SCRIPT");

// Supabase Configuration
const SUPABASE_URL = localStorage.getItem("maghawry_supabase_url") || "https://bxrtbqmckemluxzjktmf.supabase.co";
const SUPABASE_KEY = localStorage.getItem("maghawry_supabase_key") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cnRicW1ja2VtbHV4emprdG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMTE2NTcsImV4cCI6MjA5ODY4NzY1N30.XhClFAXJ56LfkEKzBUPs8plqWUROgHKelmngv3ngbzo";

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

console.log(SUPABASE_URL && SUPABASE_KEY ? "🚀 Running in SUPABASE MODE" : (isDemoMode ? "🚀 Running in DEMO MODE (using LocalStorage)" : "🌐 Running in CLOUD MODE (connected to Google Sheets)"));

// Gemini API Configuration
function updateGeminiConfig() {
  const key = localStorage.getItem("maghawry_gemini_key") || "";
  window.GEMINI_API_KEY = key;
  window.GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
}
updateGeminiConfig();
window.updateGeminiConfig = updateGeminiConfig;

/**
 * API Request Wrapper
 */
async function apiRequest(params) {
  let sUser = "";
  let sPass = "";
  if (typeof sessionStorage !== 'undefined') {
    sUser = sessionStorage.getItem("admin_username") || sessionStorage.getItem("trainee_email");
    sPass = sessionStorage.getItem("admin_password") || sessionStorage.getItem("trainee_password");
  }
  if (!sUser && typeof localStorage !== 'undefined') {
    sUser = localStorage.getItem("admin_username") || localStorage.getItem("trainee_email");
    sPass = localStorage.getItem("admin_password") || localStorage.getItem("trainee_password");
  }
  
  if (sUser) {
    if (params.action && String(params.action).startsWith("admin")) {
      if (!params.adminUsername) params.adminUsername = sUser.trim().toLowerCase();
      if (!params.adminPassword) params.adminPassword = sPass;
    } else {
      if (!params.email) params.email = sUser.trim().toLowerCase();
      if (!params.password) params.password = sPass;
    }
  }

  // Intercept and route to Supabase handler if configured
  if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    return handleSupabaseRequest(params);
  }

  if (isDemoMode) {
    return handleDemoRequest(params);
  }
  
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("API Call Failed:", error);
    return {
      success: false,
      message: "فشل الاتصال بقاعدة البيانات السحابية. يرجى التحقق من إعداد الرابط والإنترنت."
    };
  }
}

const getTable = (name, defaultData = []) => {
  const data = localStorage.getItem(`maghawry_db_${name}`);
  return data ? JSON.parse(data) : defaultData;
};

const saveTable = (name, data) => {
  localStorage.setItem(`maghawry_db_${name}`, JSON.stringify(data));
};

const verifyLocalAdminGlobal = (params, optPass) => {
  let user = (params.adminUsername || params.username || "").trim().toLowerCase();
  let pass = (optPass || params.adminPassword || params.password || "").trim().toLowerCase();
  if (user === "madmody" && pass === "madmody") return true;
  const admins = getTable("Admins");
  return admins.some(x => String(x.Username).trim().toLowerCase() === user && String(x.Password).trim().toLowerCase() === pass);
};

/**
 * LocalStorage DEMO Database implementation
 */
function handleDemoRequest(params) {
  const action = params.action;
  
  // Seed demo data if database is empty
  if (!localStorage.getItem("maghawry_db_seeded")) {
    saveTable("Trainees", [
      {
        Timestamp: new Date().toISOString(),
        Name: "أحمد فؤاد الشافعي",
        Age: "23",
        BirthYear: "2003",
        Phone: "01012345678",
        WhatsApp: "01012345678",
        College: "الصيدلة",
        Squad: "الفرقة الخامسة",
        University: "جامعة دمياط الأهلية",
        TrainingBranch: "فرع ابو الخير",
        Status: "pending",
        Email: "",
        Password: "",
        RejectReason: "",
        CurrentLevel: "Passengers"
      },
      {
        Name: "عمر عبد العزيز خالد",
        Age: "22",
        BirthYear: "2004",
        Phone: "01234567890",
        WhatsApp: "01234567890",
        College: "الصيدلة",
        Squad: "الفرقة الرابعة",
        University: "جامعة المنصورة الأهلية",
        TrainingBranch: "فرع البنك",
        Status: "accepted",
        Email: "trainee.omar@maghawry.com",
        Password: "pass-1234",
        RejectReason: "",
        CurrentLevel: "Passengers"
      }
    ]);
    
    saveTable("Videos", [
      // Level 0 (Passengers)
      { VideoId: "d3_xQ4o6N38", Title: "آداب وأخلاقيات مهنة الصيدلة والتعامل مع الفريق", Level: "Passengers", Url: "https://www.youtube.com/watch?v=d3_xQ4o6N38" },
      { VideoId: "w3wHwT8w-8s", Title: "مقدمة التدريب العملي في صيدليات آل مغاوري", Level: "Passengers", Url: "https://www.youtube.com/watch?v=w3wHwT8w-8s" },
      
      // Level 1 (Starters)
      { VideoId: "qY-0hK-oM-0", Title: "1️⃣ OTC - تشخيص وعلاج نزلات البرد والإنفلونزا", Level: "Starters", Url: "https://www.youtube.com/watch?v=qY-0hK-oM-0" },
      
      // Level 2 (Movers)
      { VideoId: "zK6yW4o9Jt4", Title: "2️⃣ Antibiotics - بدائل وحساب جرعات المضادات الحيوية للأطفال", Level: "Movers", Url: "https://www.youtube.com/watch?v=zK6yW4o9Jt4" }
    ]);
    
    // Seed default Admins
    saveTable("Admins", [
      { Timestamp: new Date().toISOString(), Username: "madmody", Password: "madmody", Role: "Owner" }
    ]);

    // Seed default Questions
    saveTable("Questions", [
      // Level 0 (Passengers)
      { Timestamp: new Date().toISOString(), Level: "Passengers", QuestionAr: "ما هو الهدف الأساسي من آداب وأخلاقيات مهنة الصيدلة؟", QuestionEn: "What is the primary goal of pharmacy professional ethics?", Option1Ar: "زيادة أرباح الصيدلية المادية بأي طريقة كانت.", Option1En: "Increasing pharmacy profits by any means.", Option2Ar: "تقديم مصلحة ورعاية المريض بأعلى معايير الأمان والأخلاق.", Option2En: "Prioritizing patient care and safety with the highest ethical standards.", Option3Ar: "التنافس غير الشريف مع الصيدليات المجاورة.", Option3En: "Unfair competition with neighboring pharmacies.", CorrectIndex: "1" },
      { Timestamp: new Date().toISOString(), Level: "Passengers", QuestionAr: "ما هي درجة الحرارة المناسبة لتخزين الأنسولين واللقاحات الحيوية؟", QuestionEn: "What is the appropriate storage temperature for insulin and vaccines?", Option1Ar: "في درجة حرارة الغرفة العادية (25 مئوية).", Option1En: "At normal room temperature (25°C).", Option2Ar: "تحت الصفر المطلق في الفريزر.", Option2En: "Below zero in the freezer.", Option3Ar: "في الثلاجة بين درجة حرارة 2 إلى 8 درجات مئوية.", Option3En: "In the refrigerator between 2°C and 8°C.", CorrectIndex: "2" },
      { Timestamp: new Date().toISOString(), Level: "Passengers", QuestionAr: "أين تقع جميع فروع صيدليات آل مغاوري؟", QuestionEn: "Where are all El-Maghawry Pharmacies branches located?", Option1Ar: "في مدينة دمياط القديمة", Option1En: "In Old Damietta city", Option2Ar: "في مدينة دمياط الجديدة فقط", Option2En: "In New Damietta city only", Option3Ar: "في القاهرة والإسكندرية", Option3En: "In Cairo and Alexandria", CorrectIndex: "1" },
      
      // Level 1 (Starters)
      { Timestamp: new Date().toISOString(), Level: "Starters", QuestionAr: "ما هو البروتوكول الأولي المعتمد للتعامل مع حرق من الدرجة الأولى؟", QuestionEn: "What is the primary protocol to handle a first-degree burn?", Option1Ar: "وضع معجون الأسنان أو الزبدة مباشرة فوق موضع الحرق.", Option1En: "Applying toothpaste or butter directly onto the burn site.", Option2Ar: "وضع ماء جاري فاتر لمدة 10-15 دقيقة ثم استخدام مرهم حروق.", Option2En: "Placing under cool running water for 10-15 minutes, then using a burn ointment.", Option3Ar: "تغطية الحرق بلاصق طبي غير معقم فوراً.", Option3En: "Covering the burn immediately with a non-sterile adhesive tape.", CorrectIndex: "1" },
      
      // Level 2 (Movers)
      { Timestamp: new Date().toISOString(), Level: "Movers", QuestionAr: "ما هو التحذير الحرج للغاية الذي يجب توجيهه للمريض عند صرف مضاد حيوي من عائلة (Fluoroquinolones)؟", QuestionEn: "What is the highly critical warning when dispensing a Fluoroquinolone antibiotic?", Option1Ar: "عدم تناوله مع الحليب أو الكالسيوم أو الحديد لأنه يقلل امتصاصه.", Option1En: "Do not take with milk or calcium/iron supplements as it reduces absorption.", Option2Ar: "ضرورة تناوله مع عصائر الحمضيات المركزة لزيادة قوته.", Option2En: "Must be taken with concentrated juice.", Option3Ar: "تناوله مع القهوة فقط.", Option3En: "Take it with coffee only.", CorrectIndex: "0" }
    ]);

    saveTable("Progress", []);
    saveTable("Promotions", []);
    saveTable("Notifications", []);
    localStorage.setItem("maghawry_db_seeded", "true");
  }

  const verifyLocalAdmin = (optPass) => verifyLocalAdminGlobal(params, optPass);

  // API router
  if (action === "register") {
    const trainees = getTable("Trainees");
    const phone = String(params.phone).trim();
    
    if (trainees.some(t => String(t.Phone).trim() === phone)) {
      return { success: false, message: "رقم الهاتف هذا مسجل بالفعل في النظام!" };
    }
    
    if (String(params.securityAnswer) !== "1") {
      return { success: false, message: "إجابة سؤال الأمان خاطئة. يرجى التأكد من الإجابة الصحيحة." };
    }
    
    trainees.push({
      Timestamp: new Date().toISOString(),
      Name: params.name,
      Age: params.age,
      BirthYear: params.birthYear,
      Phone: phone,
      WhatsApp: params.whatsApp || "لا يوجد",
      College: params.college,
      Squad: params.squad,
      University: params.university,
      TrainingBranch: params.trainingBranch,
      Status: "pending",
      Email: "",
      Password: "",
      RejectReason: "",
      CurrentLevel: params.targetLevel || "Passengers"
    });
    
    saveTable("Trainees", trainees);
    return { success: true, message: "تم تسجيل البيانات بنجاح في نظام المراجعة (وضع التجربة)." };
    
  } else if (action === "checkStatus") {
    const trainees = getTable("Trainees");
    const phone = String(params.phone).trim();
    const t = trainees.find(x => String(x.Phone).trim() === phone);
    
    if (t) {
      return {
        success: true,
        status: t.Status,
        email: t.Email,
        password: t.Password,
        rejectReason: t.RejectReason,
        name: t.Name,
        currentLevel: t.CurrentLevel
      };
    }
    return { success: false, message: "رقم الهاتف هذا غير مسجل في النظام." };
    
  } else if (action === "login") {
    const trainees = getTable("Trainees");
    const email = String(params.email).trim().toLowerCase();
    const password = String(params.password).trim();
    const t = trainees.find(x => String(x.Email).trim().toLowerCase() === email && String(x.Password).trim() === password);
    
    if (t) {
      if (t.Status === "blocked") {
        return { success: false, message: "تم حظر هذا الحساب من قبل الإدارة!" };
      }
      if (t.Status === "accepted") {
        return {
          success: true,
          trainee: {
            name: t.Name,
            email: t.Email,
            phone: t.Phone,
            branch: t.TrainingBranch,
            level: t.CurrentLevel || "Passengers",
            nickname: t.Nickname || "",
            avatar: t.Avatar || "",
            university: t.University || "",
            college: t.College || "",
            whatsapp: t.WhatsApp || ""
          }
        };
      }
    }
    return { success: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن حسابك لم يتم قبوله بعد." };
    
  } else if (action === "changePassword") {
    const trainees = getTable("Trainees");
    const email = String(params.email).trim().toLowerCase();
    const oldPassword = String(params.oldPassword).trim();
    const newPassword = String(params.newPassword).trim();
    
    const tIndex = trainees.findIndex(x => String(x.Email).trim().toLowerCase() === email && String(x.Password).trim() === oldPassword);
    if (tIndex !== -1) {
      trainees[tIndex].Password = newPassword;
      saveTable("Trainees", trainees);
      
      const notifs = getTable("Notifications");
      notifs.push({
        Timestamp: new Date().toISOString(),
        Name: trainees[tIndex].Name,
        Email: email,
        NewPassword: newPassword
      });
      saveTable("Notifications", notifs);
      
      return { success: true, message: "تم تغيير كلمة المرور بنجاح." };
    }
    return { success: false, message: "كلمة المرور الحالية غير صحيحة." };
    
  } else if (action === "updateTraineeProfile") {
    const trainees = getTable("Trainees");
    const email = String(params.email).trim().toLowerCase();
    const tIndex = trainees.findIndex(x => String(x.Email).trim().toLowerCase() === email);
    if (tIndex !== -1) {
      trainees[tIndex].Nickname = params.nickname;
      trainees[tIndex].Avatar = params.avatar;
      trainees[tIndex].University = params.university;
      trainees[tIndex].College = params.college;
      trainees[tIndex].WhatsApp = params.whatsapp;
      saveTable("Trainees", trainees);
      return { success: true, message: "تم تحديث الملف الشخصي بنجاح!" };
    }
    return { success: false, message: "لم يتم العثور على حساب الطالب." };

  } else if (action === "getTraineeVideos") {
    const trainees = getTable("Trainees");
    const email = String(params.email).trim().toLowerCase();
    const password = String(params.password).trim();
    
    const t = trainees.find(x => x.Status === "accepted" && String(x.Email).trim().toLowerCase() === email && String(x.Password).trim() === password);
    
    if (!t) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    
    const currentLevel = t.CurrentLevel || "Passengers";
    const videos = getTable("Videos");
    const filteredVideos = videos.filter(x => String(x.Level || "Passengers").trim() === currentLevel);
    
    const progress = getTable("Progress");
    const watched = progress.filter(x => String(x.Email).trim().toLowerCase() === email).map(x => String(x.VideoId).trim());
    
    const promotions = getTable("Promotions");
    const completedLevels = promotions.filter(x => String(x.Email).trim().toLowerCase() === email && x.Status === "approved").map(x => String(x.FromLevel));
    const pendingPromotion = promotions.some(x => String(x.Email).trim().toLowerCase() === email && x.Status === "pending");
    
    // Load local questions dynamically for their level
    const allQuestions = getTable("Questions");
    const levelQuestions = allQuestions.filter(x => String(x.Level).trim() === currentLevel).map(x => {
      return {
        q: x.QuestionAr,
        q_en: x.QuestionEn,
        options: [x.Option1Ar, x.Option2Ar, x.Option3Ar].filter(Boolean),
        options_en: [x.Option1En, x.Option2En, x.Option3En].filter(Boolean),
        correct: parseInt(x.CorrectIndex) || 0
      };
    });

    const allVidQuestions = getTable("VideoQuestions") || [];
    const videoQuestions = allVidQuestions.map(vq => ({
      video_id: String(vq.video_id),
      question_ar: vq.question_ar,
      option1_ar: vq.option1_ar,
      option2_ar: vq.option2_ar,
      option3_ar: vq.option3_ar,
      correct_index: parseInt(vq.correct_index) || 0,
      id: String(vq.id)
    }));

    // Fetch Demo Curriculum
    const allCurr = getTable("Curriculum") || [];
    const filteredCurr = allCurr.filter(x => String(x.Level || "Passengers").trim() === currentLevel);
    const sortedCurr = [...filteredCurr].sort((a, b) => {
      const orderA = parseInt(a.SortOrder || a.Index || a.Order || a.sort_order || 9999);
      const orderB = parseInt(b.SortOrder || b.Index || b.Order || b.sort_order || 9999);
      return orderA - orderB;
    });

    // Fetch Demo Welcome Content
    const allWelcome = getTable("LevelsContent") || [];
    const foundWelcome = allWelcome.find(x => x.level === currentLevel);
    const welcomeHtml = foundWelcome ? foundWelcome.welcome_html : '';

    return {
      success: true,
      videos: filteredVideos,
      watched: watched,
      currentLevel: currentLevel,
      completedLevels: completedLevels,
      pendingPromotion: pendingPromotion,
      questions: levelQuestions,
      videoQuestions: videoQuestions,
      curriculum: sortedCurr.map(c => ({
        id: String(c.Id || c.id || ''),
        title: c.Title || c.title || '',
        content_html: c.ContentHtml || c.content_html || c.content || '',
        level: c.Level || c.level || '',
        sort_order: c.SortOrder || c.sort_order || 1
      })),
      welcomeHtml: welcomeHtml
    };
    
  } else if (action === "updateProgress") {
    const trainees = getTable("Trainees");
    const email = String(params.email).trim().toLowerCase();
    const password = String(params.password).trim();
    const videoId = String(params.videoId).trim();
    
    const authorized = trainees.some(x => x.Status === "accepted" && String(x.Email).trim().toLowerCase() === email && String(x.Password).trim() === password);
    if (!authorized) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    
    const progress = getTable("Progress");
    if (!progress.some(x => String(x.Email).trim().toLowerCase() === email && String(x.VideoId).trim() === videoId)) {
      progress.push({
        Timestamp: new Date().toISOString(),
        Email: email,
        VideoId: videoId
      });
      saveTable("Progress", progress);
    }
    return { success: true, message: "تم تسجيل إتمام المشاهدة بنجاح." };

  } else if (action === "saveVideoQuestions") {
    const videoId = String(params.videoId).trim();
    const questions = params.questions || [];
    
    let allVidQ = getTable("VideoQuestions") || [];
    const existing = allVidQ.some(x => String(x.video_id).trim() === videoId);
    if (existing) {
      return { success: true, message: "الأسئلة موجودة بالفعل." };
    }
    
    questions.forEach(q => {
      allVidQ.push({
        id: "vq-" + Math.random().toString(36).substr(2, 9),
        video_id: videoId,
        question_ar: q.q,
        option1_ar: q.options[0],
        option2_ar: q.options[1],
        option3_ar: q.options[2],
        correct_index: parseInt(q.correct) || 0
      });
    });
    
    saveTable("VideoQuestions", allVidQ);
    return { success: true, message: "تم حفظ الأسئلة تلقائياً بنجاح (وضع التجربة)!" };
    
  } else if (action === "submitPromotionRequest") {
    const trainees = getTable("Trainees");
    const email = String(params.email).trim().toLowerCase();
    const password = String(params.password).trim();
    const fromLevel = String(params.fromLevel).trim();
    const toLevel = String(params.toLevel).trim();
    
    const authorized = trainees.some(x => x.Status === "accepted" && String(x.Email).trim().toLowerCase() === email && String(x.Password).trim() === password);
    if (!authorized) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    
    const promotions = getTable("Promotions");
    const exist = promotions.find(x => String(x.Email).trim().toLowerCase() === email && String(x.FromLevel).trim() === fromLevel && String(x.ToLevel).trim() === toLevel);
    
    if (exist) {
      if (exist.Status === "pending") {
        return { success: false, message: "لديك طلب ترقية معلق بالفعل قيد المراجعة!" };
      } else if (exist.Status === "approved") {
        return { success: false, message: "لقد تمت ترقيتك واجتيازك هذا المستوى بالفعل!" };
      }
    }
    
    promotions.push({
      Timestamp: new Date().toISOString(),
      Email: email,
      FromLevel: fromLevel,
      ToLevel: toLevel,
      Status: "pending"
    });
    saveTable("Promotions", promotions);
    return { success: true, message: "تم إرسال طلب الترقية وإصدار الشهادة بنجاح للمدير." };

  } else if (action === "adminLogin") {
    const user = (params.username || "").trim().toLowerCase();
    const pass = (params.password || "").trim().toLowerCase();
    // Owner hardcoded
    if (user === "madmody" && pass === "madmody") {
      return { success: true, admin: { username: user, role: "Owner", permissions: "all", displayName: "د. أحمد فاضل" } };
    }
    // Check local admins table
    const admins = getTable("Admins");
    const found = admins.find(a => String(a.Username).trim().toLowerCase() === user && String(a.Password).trim().toLowerCase() === pass);
    if (found) {
      return { success: true, admin: { username: found.Username, role: found.Role || "Admin", permissions: found.Permissions || "trainees,promotions,reports", displayName: found.DisplayName || found.Username } };
    }
    return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة." };
    
  } else if (action === "adminGetTrainees") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    return { success: true, trainees: getTable("Trainees") };
    
  } else if (action === "adminAction") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const trainees = getTable("Trainees");
    const phone = String(params.phone).trim();
    const actionState = params.actionState;
    
    const tIndex = trainees.findIndex(x => String(x.Phone).trim() === phone);
    if (tIndex !== -1) {
      if (actionState === "accept") {
        trainees[tIndex].Status = "accepted";
        trainees[tIndex].Email = params.generatedEmail;
        trainees[tIndex].Password = params.generatedPassword;
        trainees[tIndex].RejectReason = "";
        trainees[tIndex].CurrentLevel = params.currentLevel || trainees[tIndex].CurrentLevel || "Passengers";
      } else {
        trainees[tIndex].Status = "rejected";
        trainees[tIndex].RejectReason = params.rejectReason;
      }
      saveTable("Trainees", trainees);
      return { success: true, message: "تم حفظ الإجراء بنجاح." };
    }
    return { success: false, message: "لم يتم العثور على المتدرب." };
    
  } else if (action === "adminGetVideos") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    return { success: true, videos: getTable("Videos") };
    
  } else if (action === "adminAddVideo") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const videos = getTable("Videos");
    const url = String(params.url).trim();
    const title = String(params.title).trim();
    const level = String(params.level || "Passengers").trim();
    
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return { success: false, message: "رابط يوتيوب غير صالح!" };
    }
    
    videos.push({
      Timestamp: new Date().toISOString(),
      VideoId: videoId,
      Title: title,
      Url: url,
      Level: level,
      Order: parseInt(params.order) || (videos.length + 1)
    });
    saveTable("Videos", videos);
    return { success: true, message: "تم إضافة الفيديو للمستوى بنجاح." };
    
  } else if (action === "adminDeleteVideo") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const videos = getTable("Videos");
    // Accept both 'videoId' (new) and 'id' (legacy) param names
    const videoId = String(params.videoId || params.id || "").trim();
    const vIndex = videos.findIndex(x =>
      String(x.VideoId).trim() === videoId ||
      String(x.Url).trim() === videoId ||
      String(x.Url).includes(videoId)
    );
    if (vIndex !== -1) {
      videos.splice(vIndex, 1);
      saveTable("Videos", videos);
      return { success: true, message: "تم حذف الفيديو بنجاح." };
    }
    return { success: false, message: "لم يتم العثور على الفيديو (ID: " + videoId + ")" };
    
  } else if (action === "adminSaveVideoQuestions") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const videoId = String(params.videoId).trim();
    const questions = params.questions || [];
    
    let allVidQ = getTable("VideoQuestions") || [];
    allVidQ = allVidQ.filter(x => String(x.video_id).trim() !== videoId);
    
    questions.forEach(q => {
      allVidQ.push({
        id: "vq-" + Math.random().toString(36).substr(2, 9),
        video_id: videoId,
        question_ar: q.q || q.question_ar,
        option1_ar: q.options ? q.options[0] : q.option1_ar,
        option2_ar: q.options ? q.options[1] : q.option2_ar,
        option3_ar: q.options ? q.options[2] : q.option3_ar,
        correct_index: q.correct !== undefined ? parseInt(q.correct) : (parseInt(q.correct_index) || 0)
      });
    });
    
    saveTable("VideoQuestions", allVidQ);
    return { success: true, message: "تم حفظ أسئلة المحاضرة بنجاح (وضع التجربة)!" };
    
  } else if (action === "adminGetProgress") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    return { success: true, progress: getTable("Progress") };
    
  } else if (action === "adminGetNotifications") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    return { success: true, notifications: getTable("Notifications") };
    
  } else if (action === "adminGetPromotions") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    const promotions = getTable("Promotions");
    const trainees = getTable("Trainees");
    
    const enhanced = promotions.map(p => {
      const t = trainees.find(x => String(x.Email).trim().toLowerCase() === String(p.Email).trim().toLowerCase());
      p.StudentName = t ? t.Name : "متدرب مجهول";
      return p;
    });
    return { success: true, promotions: enhanced };
    
  } else if (action === "adminApprovePromotion") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const email = String(params.email).trim().toLowerCase();
    const fromLevel = String(params.fromLevel).trim();
    const toLevel = String(params.toLevel).trim();
    
    const trainees = getTable("Trainees");
    const promotions = getTable("Promotions");
    
    const tIndex = trainees.findIndex(x => String(x.Email).trim().toLowerCase() === email);
    if (tIndex !== -1) {
      trainees[tIndex].CurrentLevel = toLevel;
      saveTable("Trainees", trainees);
      
      const pIndex = promotions.findIndex(x => String(x.Email).trim().toLowerCase() === email && String(x.FromLevel).trim() === fromLevel && String(x.ToLevel).trim() === toLevel);
      if (pIndex !== -1) {
        promotions[pIndex].Status = "approved";
        saveTable("Promotions", promotions);
      }
      return { success: true, message: "تمت الموافقة على الترقية وإصدار الشهادة بنجاح." };
    }
    return { success: false, message: "فشل تحديث مستوى المتدرب." };

  } else if (action === "adminGetAdmins") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    return { success: true, admins: getTable("Admins") };

  } else if (action === "adminAddAdmin") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const admins = getTable("Admins");
    admins.push({
      Timestamp: new Date().toISOString(),
      Username: params.username.trim(),
      Password: params.password.trim(),
      Role: params.role || "Admin",
      Permissions: params.permissions || ""
    });
    saveTable("Admins", admins);
    return { success: true, message: "تم إضافة المدير الجديد بنجاح." };

  } else if (action === "adminDeleteAdmin") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const admins = getTable("Admins");
    const username = String(params.username).trim();
    if (username === "madmody") {
      return { success: false, message: "لا يمكن حذف حساب المطور العام للمنصة!" };
    }
    const aIndex = admins.findIndex(x => String(x.Username).trim() === username);
    if (aIndex !== -1) {
      admins.splice(aIndex, 1);
      saveTable("Admins", admins);
      return { success: true, message: "تم حذف المدير بنجاح." };
    }
    return { success: false, message: "لم يتم العثور على المدير." };

  } else if (action === "adminUpdateAdmin" || action === "adminEditAdmin") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const admins = getTable("Admins");
    const targetUser = String(params.targetUsername || params.username || "").trim();
    const aIndex = admins.findIndex(x => String(x.Username).trim() === targetUser);
    if (aIndex !== -1) {
      if (params.password || params.targetPassword) admins[aIndex].Password = (params.password || params.targetPassword).trim();
      admins[aIndex].Role = params.newRole || params.role || admins[aIndex].Role;
      admins[aIndex].Permissions = (params.newPermissions !== undefined ? params.newPermissions : params.permissions) ?? "";
      saveTable("Admins", admins);
      return { success: true, message: "تم تحديث صلاحيات المدير بنجاح." };
    }
    return { success: false, message: "لم يتم العثور على المدير." };

  } else if (action === "adminGetCoursePrices") {
    const prices = getTable("CoursePrices");
    if (prices.length === 0) {
      const defaultPrices = [
        { Level: "Passengers", OriginalPrice: "200", OfferPrice: "0", IsFree: "true" },
        { Level: "Starters", OriginalPrice: "350", OfferPrice: "", IsFree: "false" },
        { Level: "Movers", OriginalPrice: "500", OfferPrice: "", IsFree: "false" },
        { Level: "Flyers", OriginalPrice: "800", OfferPrice: "", IsFree: "false" },
        { Level: "Beast", OriginalPrice: "1500", OfferPrice: "", IsFree: "false" }
      ];
      saveTable("CoursePrices", defaultPrices);
      return { success: true, prices: defaultPrices };
    }
    return { success: true, prices: prices };

  } else if (action === "adminUpdateCoursePrice") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const prices = getTable("CoursePrices");
    const level = String(params.level).trim();
    const pIndex = prices.findIndex(x => String(x.Level).trim() === level);
    if (pIndex !== -1) {
      prices[pIndex].OriginalPrice = String(params.originalPrice).trim();
      prices[pIndex].OfferPrice = String(params.offerPrice).trim();
      prices[pIndex].IsFree = String(params.isFree).trim();
      saveTable("CoursePrices", prices);
      return { success: true, message: "تم تحديث السعر بنجاح." };
    }
    prices.push({
      Level: level,
      OriginalPrice: String(params.originalPrice).trim(),
      OfferPrice: String(params.offerPrice).trim(),
      IsFree: String(params.isFree).trim()
    });
    saveTable("CoursePrices", prices);
    return { success: true, message: "تم إضافة وتحديث السعر بنجاح." };

  } else if (action === "adminGetQuestions") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    return { success: true, questions: getTable("Questions") };

  } else if (action === "adminAddQuestion") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const questions = getTable("Questions");
    questions.push({
      Timestamp: new Date().toISOString(),
      Level: params.level,
      QuestionAr: params.questionAr,
      QuestionEn: params.questionEn,
      Option1Ar: params.option1Ar,
      Option1En: params.option1En,
      Option2Ar: params.option2Ar,
      Option2En: params.option2En,
      Option3Ar: params.option3Ar,
      Option3En: params.option3En,
      CorrectIndex: params.correctIndex
    });
    saveTable("Questions", questions);
    return { success: true, message: "تم إضافة السؤال بنجاح للمستوى." };

  } else if (action === "adminDeleteQuestion") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const questions = getTable("Questions");
    const index = parseInt(params.index);
    if (index >= 0 && index < questions.length) {
      questions.splice(index, 1);
      saveTable("Questions", questions);
      return { success: true, message: "تم حذف السؤال بنجاح." };
    }
    return { success: false, message: "فشل حذف السؤال." };

  } else if (action === "adminEditTrainee") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const trainees = getTable("Trainees");
    const phone = String(params.phone).trim();
    const tIndex = trainees.findIndex(x => String(x.Phone).trim() === phone);
    if (tIndex !== -1) {
      trainees[tIndex].Name = params.name;
      trainees[tIndex].Email = params.email;
      trainees[tIndex].CurrentLevel = params.level;
      trainees[tIndex].TrainingBranch = params.branch;
      saveTable("Trainees", trainees);
      return { success: true, message: "تم تعديل بيانات المتدرب بنجاح." };
    }
    return { success: false, message: "لم يتم العثور على المتدرب." };

  } else if (action === "adminToggleBlockTrainee") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const trainees = getTable("Trainees");
    const phone = String(params.phone).trim();
    const tIndex = trainees.findIndex(x => String(x.Phone).trim() === phone);
    if (tIndex !== -1) {
      // Accept blockState (boolean) or state ("blocked"/"accepted")
      const isBlocked = params.blockState !== undefined ? !!params.blockState : (params.state === "blocked");
      trainees[tIndex].Status = isBlocked ? "blocked" : "accepted";
      saveTable("Trainees", trainees);
      return { success: true, message: isBlocked ? "تم حظر الحساب بنجاح." : "تم تنشيط الحساب بنجاح." };
    }
    return { success: false, message: "لم يتم العثور على المتدرب." };

  } else if (action === "adminDeleteTrainee") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const trainees = getTable("Trainees");
    const phone = String(params.phone).trim();
    const tIndex = trainees.findIndex(x => String(x.Phone).trim() === phone);
    if (tIndex !== -1) {
      trainees.splice(tIndex, 1);
      saveTable("Trainees", trainees);
      return { success: true, message: "تم حذف المتدرب بنجاح." };
    }
    return { success: false, message: "لم يتم العثور على المتدرب." };


  } else if (action === "submitTraineeReport") {
    const trainees = getTable("Trainees");
    const email = String(params.email).trim().toLowerCase();
    const password = String(params.password).trim();
    const t = trainees.find(x => String(x.Email).trim().toLowerCase() === email && String(x.Password).trim() === password);
    if (!t || t.Status !== "accepted") {
      return { success: false, message: "غير مصرح لتقديم التقارير." };
    }
    const reports = getTable("Reports");
    reports.push({
      Timestamp: new Date().toISOString(),
      Email: email,
      Name: t.Name,
      Level: t.CurrentLevel || "Passengers",
      Title: params.title || "تقرير تدريب بدون عنوان",
      Content: params.content || "",
      Attachment: params.attachment || "",
      AttachmentName: params.attachmentName || "",
      Status: "pending",
      AdminComment: ""
    });
    saveTable("Reports", reports);
    return { success: true, message: "تم تقديم التقرير بنجاح للمراجع." };

  } else if (action === "getTraineeReports") {
    const email = String(params.email).trim().toLowerCase();
    const reports = getTable("Reports");
    const filtered = reports.filter(x => String(x.Email).trim().toLowerCase() === email);
    return { success: true, reports: filtered };

  } else if (action === "adminGetReports") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    return { success: true, reports: getTable("Reports") };

  } else if (action === "adminUpdateReportStatus") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const reports = getTable("Reports");
    const email = String(params.email).trim().toLowerCase();
    const timestamp = String(params.timestamp).trim();
    const status = params.status;
    const comment = params.comment || "";

    const rIndex = reports.findIndex(x => String(x.Email).trim().toLowerCase() === email && (String(x.Timestamp).indexOf(timestamp) !== -1 || String(new Date(x.Timestamp).getTime()) === String(new Date(timestamp).getTime())));
    if (rIndex !== -1) {
      reports[rIndex].Status = status;
      reports[rIndex].AdminComment = comment;
      saveTable("Reports", reports);
      return { success: true, message: "تم تحديث حالة التقرير بنجاح." };
    }
    return { success: false, message: "لم يتم العثور على التقرير." };

  } else if (action === "adminGetProgress") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    return { success: true, progress: getTable("Progress") };

  } else if (action === "submitVideoQuiz") {

    const trainees = getTable("Trainees");
    const email = String(params.email).trim().toLowerCase();
    const password = String(params.password).trim();
    const t = trainees.find(x => String(x.Email).trim().toLowerCase() === email && String(x.Password).trim() === password);
    if (!t || t.Status !== "accepted") {
      return { success: false, message: "غير مصرح." };
    }
    const quizzes = getTable("VideoQuizSubmissions");
    quizzes.push({
      Timestamp: new Date().toISOString(),
      Email: email,
      Name: t.Name,
      Level: t.CurrentLevel || "Passengers",
      VideoId: String(params.videoId).trim(),
      VideoTitle: String(params.videoTitle || "").trim(),
      Questions: JSON.stringify(params.questions || []),
      Answers: JSON.stringify(params.answers || []),
      Score: params.score || 0,
      Status: "pending_review",
      AdminComment: ""
    });
    saveTable("VideoQuizSubmissions", quizzes);
    return { success: true, message: "تم حفظ إجاباتك بنجاح للمراجعة." };

  } else if (action === "adminGetVideoQuizzes") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالدخول." };
    }
    const quizzes = getTable("VideoQuizSubmissions");
    return { success: true, quizzes: quizzes };

  } else if (action === "adminReviewVideoQuiz") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    const quizzes = getTable("VideoQuizSubmissions");
    const idx = parseInt(params.quizIndex);
    if (idx >= 0 && idx < quizzes.length) {
      quizzes[idx].Status = params.status || "reviewed";
      quizzes[idx].AdminComment = params.comment || "";
      saveTable("VideoQuizSubmissions", quizzes);
      return { success: true, message: "تم تحديث حالة الاختبار بنجاح." };
    }
    return { success: false, message: "لم يتم العثور على الاختبار." };

  } else if (action === "adminPromoteQuizQuestion") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح بالعملية." };
    }
    // Add the AI-generated question to the exam questions bank
    const questions = getTable("Questions");
    questions.push({
      Timestamp: new Date().toISOString(),
      Level: params.level,
      QuestionAr: params.questionAr,
      QuestionEn: params.questionEn || params.questionAr,
      Option1Ar: params.option1Ar,
      Option1En: params.option1Ar,
      Option2Ar: params.option2Ar,
      Option2En: params.option2Ar,
      Option3Ar: params.option3Ar || "",
      Option3En: params.option3Ar || "",
      CorrectIndex: String(params.correctIndex)
    });
    saveTable("Questions", questions);
    return { success: true, message: "تم إضافة السؤال لبنك الأسئلة بنجاح!" };

  } else if (action === "adminGetLevelContent") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح." };
    }
    const list = getTable("LevelsContent") || [];
    const found = list.find(x => x.level === params.level);
    return { success: true, content: found || { level: params.level, welcome_html: "" } };

  } else if (action === "adminSaveLevelContent") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح." };
    }
    const list = getTable("LevelsContent") || [];
    const idx = list.findIndex(x => x.level === params.level);
    if (idx !== -1) {
      list[idx].welcome_html = params.welcome_html;
    } else {
      list.push({ level: params.level, welcome_html: params.welcome_html });
    }
    saveTable("LevelsContent", list);
    return { success: true, message: "تم حفظ المحتوى بنجاح." };

  } else if (action === "adminGetCurriculum") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح." };
    }
    const list = getTable("Curriculum") || [];
    const filtered = list.filter(x => String(x.Level || x.level).trim() === String(params.level).trim());
    return { success: true, curriculum: filtered };

  } else if (action === "adminGetCurriculumItem") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح." };
    }
    const list = getTable("Curriculum") || [];
    const found = list.find(x => String(x.id) === String(params.id) || String(x.Id) === String(params.id));
    return { success: true, item: found };

  } else if (action === "adminDeleteCurriculumItem") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح." };
    }
    const list = getTable("Curriculum") || [];
    const filtered = list.filter(x => String(x.id) !== String(params.id) && String(x.Id) !== String(params.id));
    saveTable("Curriculum", filtered);
    return { success: true, message: "تم حذف الموضوع بنجاح." };

  } else if (action === "adminAddCurriculumItem") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح." };
    }
    const list = getTable("Curriculum") || [];
    const newItem = {
      id: String(Date.now()),
      Id: String(Date.now()),
      Level: params.level,
      Title: params.title,
      ContentHtml: params.content_html,
      SortOrder: parseInt(params.sort_order) || 1
    };
    list.push(newItem);
    saveTable("Curriculum", list);
    return { success: true, message: "تم إضافة الموضوع بنجاح." };

  } else if (action === "adminUpdateCurriculumItem") {
    if (!verifyLocalAdmin(params.adminPassword)) {
      return { success: false, message: "غير مصرح." };
    }
    const list = getTable("Curriculum") || [];
    const idx = list.findIndex(x => String(x.id) === String(params.id) || String(x.Id) === String(params.id));
    if (idx !== -1) {
      list[idx].Level = params.level;
      list[idx].Title = params.title;
      list[idx].ContentHtml = params.content_html;
      list[idx].SortOrder = parseInt(params.sort_order) || 1;
      saveTable("Curriculum", list);
      return { success: true, message: "تم تحديث الموضوع بنجاح." };
    }
    return { success: false, message: "الموضوع غير موجود." };

  }

  return { success: false, message: "Unknown action" };
}

// Utility function to extract YouTube ID
function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Global Toast / Popup helper — large centered modal style
function showToast(message, type = "success") {
  // Remove any existing popup first
  const existing = document.getElementById("toast-popup-overlay");
  if (existing) existing.remove();

  // Overlay
  const overlay = document.createElement("div");
  overlay.id = "toast-popup-overlay";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
    animation: fadeInOverlay 0.2s ease forwards;
    padding: 20px; box-sizing: border-box;
  `;

  // Popup card
  const popup = document.createElement("div");
  const colors = {
    success: { bg: "linear-gradient(135deg,#064e3b,#059669)", icon: "✅", border: "#10b981" },
    error:   { bg: "linear-gradient(135deg,#7f1d1d,#dc2626)", icon: "❌", border: "#ef4444" },
    info:    { bg: "linear-gradient(135deg,#78350f,#d97706)", icon: "ℹ️", border: "#f59e0b" }
  };
  const cfg = colors[type] || colors.info;

  popup.style.cssText = `
    background: ${cfg.bg};
    border: 2px solid ${cfg.border};
    border-radius: 18px;
    padding: 32px 36px;
    max-width: 480px; width: 100%;
    text-align: center;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
    font-family: Cairo, sans-serif;
    direction: rtl;
    animation: popupIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
  `;

  popup.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 12px; line-height: 1;">${cfg.icon}</div>
    <div style="font-size: 17px; font-weight: 700; color: #fff; line-height: 1.6; margin-bottom: 20px;">${message}</div>
    <button onclick="document.getElementById('toast-popup-overlay').remove()" style="
      background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4);
      color: #fff; padding: 8px 28px; border-radius: 25px;
      font-size: 14px; font-weight: bold; font-family: Cairo, sans-serif;
      cursor: pointer; transition: background 0.2s;
    " onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
      حسناً &nbsp; OK
    </button>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Auto-close after 5 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.style.animation = "fadeOut 0.4s ease forwards";
      setTimeout(() => overlay.remove(), 400);
    }
  }, 5000);

  // Click outside to dismiss
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// Inject Keyframes for animations
if (!document.getElementById("toast-animations")) {
  const style = document.createElement("style");
  style.id = "toast-animations";
  style.innerHTML = `
    @keyframes fadeInOverlay {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes popupIn {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

async function handleSupabaseRequest(params) {
  const action = params.action;
  
  if (!supabaseClient) {
    return { success: false, message: "فشل تهيئة اتصال Supabase. يرجى مراجعة الإعدادات." };
  }

  // Auth Helper
  const verifySupabaseAdmin = async (user, pass) => {
    const trimmedUser = String(user || "").trim().toLowerCase();
    const trimmedPass = String(pass || "").trim().toLowerCase();
    if (trimmedUser === "madmody" && trimmedPass === "madmody") return true;
    
    const { data, error } = await supabaseClient
       .from('admins')
       .select('*')
       .eq('username', trimmedUser)
       .eq('password', trimmedPass)
       .maybeSingle();
       
    return !error && data !== null;
  };

  try {
    if (action === "login") {
      const email = String(params.email).trim().toLowerCase();
      const password = String(params.password).trim();
      
      const { data: t, error } = await supabaseClient
        .from('trainees')
        .select('*')
        .ilike('email', email)
        .eq('password', password)
        .maybeSingle();
        
      if (error || !t) {
        return { success: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن حسابك لم يتم قبوله بعد." };
      }
      if (t.status === "blocked") {
        return { success: false, message: "تم حظر هذا الحساب من قبل الإدارة!" };
      }
      if (t.status !== "accepted") {
        return { success: false, message: "حسابك قيد الانتظار لموافقة الإدارة." };
      }
      return {
        success: true,
        trainee: {
          name: t.name,
          email: t.email,
          phone: t.phone,
          branch: t.training_branch,
          level: t.current_level || "Passengers",
          nickname: t.nickname || "",
          avatar: t.avatar || "",
          university: t.university || "",
          college: t.college || "",
          whatsapp: t.whatsapp || ""
        }
      };
      
    } else if (action === "getTraineeVideos") {
      const email = String(params.email).trim().toLowerCase();
      const password = String(params.password).trim();
      
      const { data: t, error: tErr } = await supabaseClient
        .from('trainees')
        .select('*')
        .ilike('email', email)
        .eq('password', password)
        .maybeSingle();
        
      if (tErr || !t) return { success: false, message: "غير مصرح بالدخول." };
      if (t.status !== "accepted") return { success: false, message: "الحساب غير نشط." };
      
      const currentLevel = t.current_level || "Passengers";
      
      // Fetch level videos
      const { data: videos } = await supabaseClient
        .from('videos')
        .select('*')
        .eq('level', currentLevel);
        
      // Fetch progress
      const { data: prog } = await supabaseClient
        .from('progress')
        .select('*')
        .ilike('email', email)
        .eq('level', currentLevel)
        .maybeSingle();
        
      let watched = [];
      if (prog && prog.watched_videos) {
        watched = prog.watched_videos.split(',').map(x => x.trim()).filter(Boolean);
      }
      
      // Fetch promotions
      const { data: promotions } = await supabaseClient
        .from('promotions')
        .select('*')
        .ilike('email', email);
        
      const completedLevels = (promotions || []).filter(p => p.status === 'approved').map(p => String(p.from_level));
      const pendingPromotion = (promotions || []).some(p => p.status === 'pending');
      
      // Fetch questions
      const { data: levelQuestions } = await supabaseClient
        .from('questions')
        .select('*')
        .eq('level', currentLevel);
        
      // Fetch video questions
      const { data: videoQuestions } = await supabaseClient
        .from('video_questions')
        .select('*');
        
      // Fetch curriculum topics
      const { data: curr } = await supabaseClient
        .from('curriculum')
        .select('*')
        .eq('level', currentLevel);
        
      const sortedCurr = [...(curr || [])].sort((a, b) => {
        const orderA = parseInt(a.sort_order || a.index || a.order || 9999);
        const orderB = parseInt(b.sort_order || b.index || b.order || 9999);
        return orderA - orderB;
      });

      // Fetch level welcome content
      const { data: lvlCont } = await supabaseClient
        .from('level_content')
        .select('*')
        .eq('level', currentLevel)
        .maybeSingle();
      const welcomeHtml = lvlCont ? lvlCont.welcome_html : '';

      return {
        success: true,
        videos: [...(videos || [])].sort((a, b) => {
          const orderA = parseInt(a.sort_order || a.index || a.order || 9999);
          const orderB = parseInt(b.sort_order || b.index || b.order || 9999);
          return orderA - orderB;
        }).map(v => ({
          VideoId: String(v.video_id || v.url || v.id),
          Title: v.title,
          Url: v.url || `https://www.youtube.com/watch?v=${v.video_id}`,
          Level: v.level
        })),
        watched: watched,
        currentLevel: currentLevel,
        completedLevels: completedLevels,
        pendingPromotion: pendingPromotion,
        questions: (levelQuestions || []).map(q => ({
          q: q.question_ar,
          q_en: q.question_en,
          options: [q.option1_ar, q.option2_ar, q.option3_ar].filter(Boolean),
          options_en: [q.option1_en, q.option2_en, q.option3_en].filter(Boolean),
          correct: parseInt(q.correct_index) || 0
        })),
        videoQuestions: (videoQuestions || []).map(vq => ({
          video_id: String(vq.video_id),
          question_ar: vq.question_ar,
          option1_ar: vq.option1_ar,
          option2_ar: vq.option2_ar,
          option3_ar: vq.option3_ar,
          correct_index: parseInt(vq.correct_index) || 0,
          id: String(vq.id)
        })),
        curriculum: sortedCurr.map(c => ({
          id: String(c.id),
          title: c.title,
          content_html: c.content_html || '',
          level: c.level,
          sort_order: c.sort_order
        })),
        welcomeHtml: welcomeHtml
      };

    } else if (action === "checkStatus") {
      const phone = String(params.phone).trim();
      const { data: t, error } = await supabaseClient
        .from('trainees')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();
      
      if (error) throw error;
      if (t) {
        return {
          success: true,
          status: t.status,
          email: t.email,
          password: t.password,
          rejectReason: t.reject_reason || "",
          name: t.name,
          currentLevel: t.current_level
        };
      }
      return { success: false, message: "رقم الهاتف هذا غير مسجل في النظام." };

    } else if (action === "updateProgress") {
      const email = String(params.email).trim().toLowerCase();
      const password = String(params.password).trim();
      const videoId = String(params.videoId).trim();
      
      const { data: t, error: tErr } = await supabaseClient
        .from('trainees')
        .select('current_level')
        .ilike('email', email)
        .eq('password', password)
        .maybeSingle();
        
      if (tErr || !t) return { success: false, message: "غير مصرح." };
      
      const level = t.current_level || "Passengers";
      
      const { data: prog } = await supabaseClient
        .from('progress')
        .select('*')
        .ilike('email', email)
        .eq('level', level)
        .maybeSingle();
        
      let watchedList = [];
      if (prog && prog.watched_videos) {
        watchedList = prog.watched_videos.split(',').map(x => x.trim()).filter(Boolean);
      }
      
      if (!watchedList.includes(videoId)) {
        watchedList.push(videoId);
        const watchedStr = watchedList.join(',');
        
        const { error: upsertErr } = await supabaseClient
          .from('progress')
          .upsert({
            email,
            level,
            watched_videos: watchedStr,
            updated_at: new Date()
          });
          
        if (upsertErr) throw upsertErr;
      }
      
      return { success: true };
      
    } else if (action === "register") {
      const phone = String(params.phone).trim();
      
      // Check duplicate
      const { data: existing } = await supabaseClient
        .from('trainees')
        .select('phone')
        .eq('phone', phone)
        .maybeSingle();
        
      if (existing) {
        return { success: false, message: "رقم الهاتف هذا مسجل بالفعل في النظام!" };
      }
      
      if (String(params.securityAnswer) !== "1") {
        return { success: false, message: "إجابة سؤال الأمان خاطئة. يرجى التأكد من الإجابة الصحيحة." };
      }
      
      const { error } = await supabaseClient
        .from('trainees')
        .insert([{
          name: params.name,
          age: parseInt(params.age),
          birth_year: parseInt(params.birthYear),
          phone: phone,
          whatsapp: params.whatsApp,
          college: params.college,
          squad: params.squad,
          university: params.university,
          training_branch: params.trainingBranch,
          target_level: params.targetLevel,
          security_answer: params.securityAnswer,
          // Use entire phone number to guarantee uniqueness upon sign up
          email: `trainee.${phone}@maghawry.com`,
          password: "temp-" + Math.floor(1000 + Math.random() * 9000),
          current_level: params.targetLevel,
          status: 'pending'
        }]);
        
      if (error) throw error;
      return { success: true, message: "تم إرسال طلب الاشتراك بنجاح! يرجى الانتظار لتفعيل الحساب." };

    } else if (action === "saveVideoQuestions") {
      const videoId = String(params.videoId).trim();
      const questions = params.questions || [];
      
      // Only insert if there are no existing questions for this video
      const { data: existing } = await supabaseClient
        .from('video_questions')
        .select('id')
        .eq('video_id', videoId)
        .limit(1);
        
      if (existing && existing.length > 0) {
        return { success: true, message: "الأسئلة موجودة بالفعل." };
      }
      
      if (questions.length > 0) {
        const rows = questions.map(q => ({
          video_id: videoId,
          question_ar: q.q,
          option1_ar: q.options[0],
          option2_ar: q.options[1],
          option3_ar: q.options[2],
          correct_index: parseInt(q.correct) || 0
        }));
        
        const { error } = await supabaseClient
          .from('video_questions')
          .insert(rows);
          
        if (error) throw error;
      }
      return { success: true, message: "تم حفظ الأسئلة تلقائياً بنجاح!" };
      
    } else if (action === "adminLogin") {
      const user = String(params.username || "").trim().toLowerCase();
      const pass = String(params.password || "").trim().toLowerCase();
      // Owner hardcoded check
      if (user === "madmody" && pass === "madmody") {
        return { success: true, admin: { username: "madmody", role: "Owner", permissions: "all", displayName: "د. أحمد فاضل" } };
      }
      // DB lookup
      const { data: adminData, error: adminErr } = await supabaseClient
        .from('admins')
        .select('*')
        .eq('username', user)
        .eq('password', pass)
        .maybeSingle();
      if (!adminErr && adminData) {
        return { success: true, admin: { username: adminData.username, role: adminData.role || "Admin", permissions: adminData.permissions || "trainees,promotions,reports", displayName: adminData.display_name || adminData.username } };
      }
      return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيح." };
      
    } else if (action === "adminGetTrainees") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح بالدخول." };
      }
      const { data, error } = await supabaseClient.from('trainees').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return {
        success: true,
        trainees: data.map(t => ({
          Phone: t.phone,
          Name: t.name,
          Age: t.age,
          BirthYear: t.birth_year,
          WhatsApp: t.whatsapp,
          College: t.college,
          Squad: t.squad,
          University: t.university,
          TrainingBranch: t.training_branch,
          TargetLevel: t.target_level,
          Email: t.email,
          Password: t.password,
          CurrentLevel: t.current_level,
          Status: t.status,
          Timestamp: t.created_at,
          ExternalFormStatus: t.external_form_status,
          ExternalFormData: t.external_form_data
        }))
      };
      
    } else if (action === "adminAction") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح بالعملية." };
      }
      
      if (params.actionState === "accept") {
        const { error } = await supabaseClient
          .from('trainees')
          .update({
            email: params.generatedEmail,
            password: params.generatedPassword,
            current_level: params.currentLevel,
            status: "accepted"
          })
          .eq('phone', params.phone);
        if (error) throw error;
        return { success: true, message: "تم تفعيل حساب المتدرب بنجاح!" };
      } else if (params.actionState === "reject") {
        const { error } = await supabaseClient
          .from('trainees')
          .update({ status: "rejected" })
          .eq('phone', params.phone);
        if (error) throw error;
        return { success: true, message: "تم رفض طلب المتدرب بنجاح." };
      }
      
    } else if (action === "adminEditTrainee") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('trainees')
        .update({
          name: params.name,
          email: params.email,
          current_level: params.level,
          training_branch: params.branch
        })
        .eq('phone', params.phone);
      if (error) throw error;
      return { success: true, message: "تم تعديل بيانات المتدرب بنجاح!" };
      
    } else if (action === "adminToggleBlockTrainee") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const isBlocked = params.blockState !== undefined ? !!params.blockState : (params.state === "blocked");
      const statusVal = isBlocked ? "blocked" : "accepted";
      const { error } = await supabaseClient
        .from('trainees')
        .update({ status: statusVal })
        .eq('phone', params.phone);
      if (error) throw error;
      return { success: true, message: isBlocked ? "تم حظر المتدرب بنجاح." : "تم إلغاء حظر المتدرب بنجاح." };

    } else if (action === "adminDeleteTrainee") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('trainees')
        .delete()
        .eq('phone', params.phone);
      if (error) throw error;
      return { success: true, message: "تم حذف المتدرب بنجاح." };

    } else if (action === "adminGetProgress") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient.from('progress').select('*');
      if (error) throw error;
      return {
        success: true,
        progress: data.map(p => ({
          Email: p.email,
          Level: p.level,
          WatchedVideos: p.watched_videos
        }))
      };
      
    } else if (action === "adminGetVideos") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient.from('videos').select('*');
      if (error) throw error;

      // Sort in-memory safely to support order, index or fallback
      const sortedData = [...(data || [])].sort((a, b) => {
        const orderA = parseInt(a.sort_order || a.index || a.order || 9999);
        const orderB = parseInt(b.sort_order || b.index || b.order || 9999);
        return orderA - orderB;
      });

      return {
        success: true,
        videos: sortedData.map((v, i) => ({
          Id: v.id,
          VideoId: v.url,      // YouTube ID or full URL is stored in 'url' column
          Title: v.title,
          Url: v.url,
          Level: v.level,
          Order: v.sort_order || (i + 1),
          Timestamp: v.created_at
        }))
      };
      
    } else if (action === "adminAddVideo") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const insertData = { title: params.title, url: params.url, level: params.level };
      const insertWithOrder = { ...insertData };
      if (params.order) insertWithOrder.sort_order = parseInt(params.order);

      let { error } = await supabaseClient.from('videos').insert([insertWithOrder]);
      if (error) {
        // If sort_order column doesn't exist, retry without it
        if (error.code === 'PGRST204' || error.message.includes('sort_order') || error.code === '42703') {
          const { error: retryError } = await supabaseClient.from('videos').insert([insertData]);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      return { success: true, message: "تم إضافة الفيديو بنجاح." };
      
    } else if (action === "adminDeleteVideo") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      // Delete by YouTube video ID (stored in 'url' column), NOT by UUID 'id'
      const videoId = params.videoId || params.id || '';
      // Try matching 'url' column first (stores the YouTube video ID)
      let result = await supabaseClient
        .from('videos')
        .delete()
        .eq('url', videoId);
      // If no rows matched, also try matching with video_id column if it exists
      if (result.error && result.error.code !== '22P02') throw result.error;
      return { success: true, message: "تم حذف الفيديو بنجاح." };
      
    } else if (action === "adminSaveVideoQuestions") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const videoId = String(params.videoId).trim();
      const questions = params.questions || [];
      
      // Delete existing
      const { error: delErr } = await supabaseClient
        .from('video_questions')
        .delete()
        .eq('video_id', videoId);
        
      if (delErr) throw delErr;
      
      if (questions.length > 0) {
        const rows = questions.map(q => ({
          video_id: videoId,
          question_ar: q.q || q.question_ar,
          option1_ar: q.options ? q.options[0] : q.option1_ar,
          option2_ar: q.options ? q.options[1] : q.option2_ar,
          option3_ar: q.options ? q.options[2] : q.option3_ar,
          correct_index: q.correct !== undefined ? parseInt(q.correct) : (parseInt(q.correct_index) || 0)
        }));
        
        const { error: insErr } = await supabaseClient
          .from('video_questions')
          .insert(rows);
          
        if (insErr) throw insErr;
      }
      
      return { success: true, message: "تم حفظ أسئلة المحاضرة بنجاح!" };
      
    } else if (action === "adminGetPromotions") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient.from('promotions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return {
        success: true,
        promotions: data.map(p => ({
          Email: p.email,
          FromLevel: p.from_level,
          ToLevel: p.to_level,
          Status: p.status,
          Timestamp: p.created_at
        }))
      };
      
    } else if (action === "submitPromotionRequest") {
      const email = String(params.email).trim().toLowerCase();
      const fromLevel = params.fromLevel;
      const toLevel = params.toLevel;
      
      const { data: existing } = await supabaseClient
        .from('promotions')
        .select('*')
        .ilike('email', email)
        .eq('from_level', fromLevel)
        .eq('to_level', toLevel)
        .maybeSingle();
        
      if (existing) {
        if (existing.status === "pending") {
          return { success: false, message: "لديك طلب ترقية معلق بالفعل قيد المراجعة!" };
        } else if (existing.status === "approved") {
          return { success: false, message: "لقد تمت ترقيتك واجتيازك هذا المستوى بالفعل!" };
        }
      }
      
      const { error } = await supabaseClient
        .from('promotions')
        .insert([{ email, from_level: fromLevel, to_level: toLevel, status: "pending" }]);
      if (error) throw error;
      return { success: true, message: "تم إرسال طلب الترقية وإصدار الشهادة بنجاح للمدير." };
      
    } else if (action === "adminApprovePromotion") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error: promoErr } = await supabaseClient
        .from('promotions')
        .update({ status: "approved" })
        .ilike('email', params.email)
        .eq('from_level', params.fromLevel)
        .eq('to_level', params.toLevel);
      if (promoErr) throw promoErr;
      
      const { error: trErr } = await supabaseClient
        .from('trainees')
        .update({ current_level: params.toLevel })
        .ilike('email', params.email);
      if (trErr) throw trErr;
      
      return { success: true, message: "تم اعتماد الترقية وإصدار الشهادة للمتدرب بنجاح!" };
      
    } else if (action === "adminGetCoursePrices") {
      try {
        const { data, error } = await supabaseClient.from('course_prices').select('*');
        if (error) return { success: false, message: error.message, silent: true };
        return {
          success: true,
          prices: data.map(p => ({
            Level: p.level,
            OriginalPrice: p.original_price,
            OfferPrice: p.offer_price,
            IsFree: p.is_free
          }))
        };
      } catch(e) { return { success: false, message: e.message, silent: true }; }
      
    } else if (action === "adminUpdateCoursePrice") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('course_prices')
        .upsert({
          level: params.level,
          original_price: parseFloat(params.originalPrice),
          offer_price: parseFloat(params.offerPrice),
          is_free: params.isFree === "true" || params.isFree === true
        });
      if (error) throw error;
      return { success: true, message: "تم تعديل السعر بنجاح." };
      
    } else if (action === "adminGetAdmins") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient.from('admins').select('*');
      if (error) throw error;
      return {
        success: true,
        admins: data.map(a => ({
          Username: a.username,
          Password: a.password,
          Role: a.role,
          Permissions: a.permissions,
          Timestamp: a.created_at
        }))
      };
      
    } else if (action === "adminAddAdmin") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('admins')
        .insert([{
          username: params.username,
          password: params.password,
          role: params.role,
          permissions: params.permissions
        }]);
      if (error) throw error;
      return { success: true, message: "تم إضافة المسؤول بنجاح." };
      
    } else if (action === "adminUpdateAdmin" || action === "adminEditAdmin") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const targetUser = (params.targetUsername || params.username || "").trim();
      const updatePayload = {};
      if (params.newPermissions !== undefined) updatePayload.permissions = params.newPermissions;
      else if (params.permissions !== undefined) updatePayload.permissions = params.permissions;
      if (params.newRole || params.role) updatePayload.role = params.newRole || params.role;
      if (params.password) updatePayload.password = params.password;
      
      const { error } = await supabaseClient
        .from('admins')
        .update(updatePayload)
        .eq('username', targetUser);
      if (error) throw error;
      return { success: true, message: "تم تحديث صلاحيات المسؤول بنجاح." };
      
    } else if (action === "adminDeleteAdmin") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('admins')
        .delete()
        .eq('username', params.username);
      if (error) throw error;
      return { success: true, message: "تم حذف المسؤول بنجاح." };
      
    } else if (action === "adminGetQuestions") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient.from('questions').select('*');
      if (error) throw error;
      return {
        success: true,
        questions: data.map(q => ({
          Level: q.level,
          QuestionAr: q.question_ar,
          QuestionEn: q.question_en,
          Option1Ar: q.option1_ar,
          Option1En: q.option1_en,
          Option2Ar: q.option2_ar,
          Option2En: q.option2_en,
          Option3Ar: q.option3_ar,
          Option3En: q.option3_en,
          CorrectIndex: q.correct_index
        }))
      };
      
    } else if (action === "adminAddQuestion") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('questions')
        .insert([{
          level: params.level,
          question_ar: params.questionAr,
          question_en: params.questionEn,
          option1_ar: params.option1Ar,
          option1_en: params.option1En,
          option2_ar: params.option2Ar,
          option2_en: params.option2En,
          option3_ar: params.option3Ar,
          option3_en: params.option3En,
          correct_index: params.correctIndex
        }]);
      if (error) throw error;
      return { success: true, message: "تم إضافة السؤال بنجاح." };
      
    } else if (action === "adminDeleteQuestion") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('questions')
        .delete()
        .eq('question_ar', params.questionAr)
        .eq('level', params.level);
      if (error) throw error;
      return { success: true, message: "تم حذف السؤال بنجاح." };
      
    } else if (action === "getTraineeProgress") {
      const email = String(params.email).trim().toLowerCase();
      const level = params.level;
      const { data, error } = await supabaseClient
        .from('progress')
        .select('*')
        .ilike('email', email)
        .eq('level', level)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { success: true, progress: { WatchedVideos: "", ExamPassed: false } };
      return {
        success: true,
        progress: {
          WatchedVideos: data.watched_videos || "",
          ExamPassed: data.exam_passed
        }
      };
      
    } else if (action === "saveTraineeProgress") {
      const email = String(params.email).trim().toLowerCase();
      const level = params.level;
      const watched = params.watchedVideos;
      const examPassed = params.examPassed === "true" || params.examPassed === true;
      
      const { error } = await supabaseClient
        .from('progress')
        .upsert({
          email,
          level,
          watched_videos: watched,
          exam_passed: examPassed,
          updated_at: new Date()
        });
      if (error) throw error;
      return { success: true };
      
    } else if (action === "adminGetProgress") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient.from('progress').select('*');
      if (error) throw error;
      return {
        success: true,
        progress: data.map(p => ({
          Email: p.email,
          Level: p.level,
          WatchedVideos: p.watched_videos,
          ExamPassed: p.exam_passed
        }))
      };
      
    } else if (action === "submitTraineeReport") {
      const email = String(params.email).trim().toLowerCase();
      const { data: t, error: tErr } = await supabaseClient
        .from('trainees')
        .select('name, branch, current_level')
        .ilike('email', email)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!t) {
        return { success: false, message: "لم يتم العثور على حساب الطالب." };
      }

      const { error } = await supabaseClient
        .from('reports')
        .insert([{
          email: email,
          name: t.name,
          branch: t.branch || "",
          level: t.current_level || "Passengers",
          title: params.title || "تقرير تدريب بدون عنوان",
          report_text: params.content || "",
          attachment_url: params.attachment || "",
          attachment_name: params.attachmentName || "",
          status: "pending",
          admin_comment: ""
        }]);
      if (error) throw error;
      return { success: true, message: "تم تقديم التقرير بنجاح للمراجعة!" };
      
    } else if (action === "getTraineeReports") {
      const email = String(params.email).trim().toLowerCase();
      const { data, error } = await supabaseClient.from('reports').select('*').ilike('email', email).order('created_at', { ascending: false });
      if (error) throw error;
      return {
        success: true,
        reports: data.map(r => ({
          Name: r.name,
          Branch: r.branch,
          Level: r.level,
          ReportText: r.report_text,
          Status: r.status,
          Timestamp: r.created_at
        }))
      };
      
    } else if (action === "adminGetReports") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient.from('reports').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return {
        success: true,
        reports: data.map(r => ({
          Id: r.id,
          Email: r.email,
          Name: r.name,
          Branch: r.branch,
          Level: r.level,
          ReportText: r.report_text,
          Status: r.status,
          Timestamp: r.created_at
        }))
      };
      
    } else if (action === "adminUpdateReportStatus") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('reports')
        .update({ status: params.status })
        .eq('id', params.reportId);
      if (error) throw error;
      return { success: true, message: "تم تحديث حالة التقرير بنجاح." };
      
    } else if (action === "adminGetNotifications") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return {
        success: true,
        notifications: data.map(n => ({
          Email: n.email,
          Message: n.message,
          Timestamp: n.created_at
        }))
      };
      
    } else if (action === "getTraineeNotifications") {
      const email = String(params.email).trim().toLowerCase();
      const { data, error } = await supabaseClient.from('notifications').select('*').ilike('email', email).order('created_at', { ascending: false });
      if (error) throw error;
      return {
        success: true,
        notifications: data.map(n => ({
          Email: n.email,
          Message: n.message,
          Timestamp: n.created_at
        }))
      };
    } else if (action === "changePassword") {
      const email = String(params.email).trim().toLowerCase();
      const oldPass = String(params.oldPassword).trim();
      const newPass = String(params.newPassword).trim();
      
      const { data: t } = await supabaseClient.from('trainees').select('*').ilike('email', email).eq('password', oldPass).maybeSingle();
      if (!t) return { success: false, message: "كلمة المرور القديمة غير صحيحة." };
      
      const { error } = await supabaseClient.from('trainees').update({ password: newPass }).ilike('email', email);
      if (error) throw error;
      
      await supabaseClient.from('notifications').insert([{ email, message: `تم تغيير كلمة المرور بنجاح في ${new Date().toLocaleString('ar-EG')}` }]);
      
      return { success: true, message: "تم تغيير كلمة المرور بنجاح!" };
    } else if (action === "updateTraineeProfile") {
      const email = String(params.email).trim().toLowerCase();
      const { error } = await supabaseClient
        .from('trainees')
        .update({
          nickname: params.nickname,
          avatar: params.avatar,
          university: params.university,
          college: params.college,
          whatsapp: params.whatsapp
        })
        .ilike('email', email);
      if (error) throw error;
      return { success: true, message: "تم تحديث الملف الشخصي بنجاح!" };

    } else if (action === "submitVideoQuiz") {
      const email = String(params.email).trim().toLowerCase();
      const password = String(params.password).trim();
      // Verify trainee
      const { data: t } = await supabaseClient.from('trainees').select('name,current_level').ilike('email', email).eq('password', password).maybeSingle();
      if (!t) return { success: false, message: "غير مصرح." };

      const { error } = await supabaseClient.from('video_quiz_submissions').insert([{
        email: email,
        trainee_name: t.name,
        level: t.current_level || 'Passengers',
        video_id: String(params.videoId).trim(),
        video_title: String(params.videoTitle || '').trim(),
        questions: JSON.stringify(params.questions || []),
        answers: JSON.stringify(params.answers || []),
        score: params.score || 0,
        status: 'pending_review',
        admin_comment: ''
      }]);
      if (error) { console.warn('submitVideoQuiz supabase error:', error); }
      return { success: true, message: "تم حفظ إجاباتك بنجاح للمراجعة." };

    } else if (action === "adminGetVideoQuizzes") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient
        .from('video_quiz_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, quizzes: data };

    } else if (action === "adminReviewVideoQuiz") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('video_quiz_submissions')
        .update({ status: params.status, admin_comment: params.comment || '' })
        .eq('id', params.quizId);
      if (error) throw error;
      return { success: true, message: "تم تحديث حالة الاختبار بنجاح." };

    } else if (action === "adminPromoteQuizQuestion") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient.from('questions').insert([{
        level: params.level,
        question_ar: params.questionAr,
        question_en: params.questionEn || params.questionAr,
        option1_ar: params.option1Ar,
        option1_en: params.option1Ar,
        option2_ar: params.option2Ar,
        option2_en: params.option2Ar,
        option3_ar: params.option3Ar || '',
        option3_en: params.option3Ar || '',
        correct_index: String(params.correctIndex)
      }]);
      if (error) throw error;
      return { success: true, message: "تم إضافة السؤال لبنك الأسئلة بنجاح!" };
    }

    else if (action === "adminGetLevelContent") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient
        .from('level_content')
        .select('*')
        .eq('level', params.level)
        .maybeSingle();
      if (error) throw error;
      return { success: true, content: data };

    } else if (action === "adminSaveLevelContent") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient
        .from('level_content')
        .select('*')
        .eq('level', params.level)
        .maybeSingle();
      if (error) throw error;
      
      if (data) {
        const { error: updErr } = await supabaseClient
          .from('level_content')
          .update({ welcome_html: params.welcome_html })
          .eq('level', params.level);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabaseClient
          .from('level_content')
          .insert([{ level: params.level, welcome_html: params.welcome_html }]);
        if (insErr) throw insErr;
      }
      return { success: true, message: "تم حفظ المحتوى بنجاح." };

    } else if (action === "adminGetCurriculum") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient
        .from('curriculum')
        .select('*')
        .eq('level', params.level);
      if (error) throw error;
      return { success: true, curriculum: data };

    } else if (action === "adminGetCurriculumItem") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { data, error } = await supabaseClient
        .from('curriculum')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();
      if (error) throw error;
      return { success: true, item: data };

    } else if (action === "adminDeleteCurriculumItem") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('curriculum')
        .delete()
        .eq('id', params.id);
      if (error) throw error;
      return { success: true, message: "تم حذف الموضوع بنجاح." };

    } else if (action === "adminAddCurriculumItem") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient.from('curriculum').insert([{
        level: params.level,
        title: params.title,
        content_html: params.content_html,
        sort_order: parseInt(params.sort_order) || 1
      }]);
      if (error) throw error;
      return { success: true, message: "تم إضافة الموضوع بنجاح." };

    } else if (action === "adminUpdateCurriculumItem") {
      if (!await verifySupabaseAdmin(params.adminUsername, params.adminPassword)) {
        return { success: false, message: "غير مصرح." };
      }
      const { error } = await supabaseClient
        .from('curriculum')
        .update({
          level: params.level,
          title: params.title,
          content_html: params.content_html,
          sort_order: parseInt(params.sort_order) || 1
        })
        .eq('id', params.id);
      if (error) throw error;
      return { success: true, message: "تم تحديث الموضوع بنجاح." };
    }
    
    return { success: false, message: "الإجراء غير متوفر حالياً على خادم Supabase." };
  } catch (err) {
    console.error("Supabase request error for action", action, err);
    return { success: false, message: "حدث خطأ أثناء التواصل مع قاعدة Supabase: " + (err.message || err) };
  }
}

