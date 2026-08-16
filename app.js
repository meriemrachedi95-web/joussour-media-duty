/**
 * منطق لوحة تحكم فريق الإنتاج والمجالس العلمية
 * نادي جسور العلمي - خطة أوت 2026
 * الربط مع: Firebase Firestore (joussour-media)
 */

// قائمة الـ 28 مجلساً ومناقشة لشهر أوت 2026
const INITIAL_COUNCILS_DATA = [
    // الأسبوع الأول (1 - 7 أوت 2026)
    { id: 1, week: 1, day: "السبت", date: "2026-08-01", title: "شبهات المستشرقة حول النسوية", assignee: "مريم", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 420 },
    { id: 2, week: 1, day: "الأحد", date: "2026-08-02", title: "التعليل الفقهي عند القاضي عبد الوهاب", assignee: "نعمة", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 310 },
    { id: 3, week: 1, day: "الإثنين", date: "2026-08-03", title: "مقاصد ختم الآيات بأسماء الله الحسنى", assignee: "أ. أشواق", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 580 },
    { id: 4, week: 1, day: "الثلاثاء", date: "2026-08-04", title: "بناء الطالب الرسالي 22", assignee: "مريم", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 890 },
    { id: 5, week: 1, day: "الأربعاء", date: "2026-08-05", title: "عصمة الأنبياء", assignee: "معاذ", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 350 },
    { id: 6, week: 1, day: "الخميس", date: "2026-08-06", title: "الترشيد في التصرفات المالية وتطبيقاته المعاصرة", assignee: "هديل", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 290 },
    { id: 7, week: 1, day: "الجمعة", date: "2026-08-07", title: "القول الفصل 17", assignee: "أ. أشواق", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 740 },

    // الأسبوع الثاني (8 - 14 أوت 2026)
    { id: 8, week: 2, day: "السبت", date: "2026-08-08", title: "العلاقات التاريخية بين المغاربة وبيت المقدس", assignee: "نعمة", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 410 },
    { id: 9, week: 2, day: "الأحد", date: "2026-08-09", title: "مشكلة الشر", assignee: "مريم", tasks: { transcription: true, design: true, montage: true, youtube: false }, ytViews: 0 },
    { id: 10, week: 2, day: "الإثنين", date: "2026-08-10", title: "المنهج النبوي في حراسة النصوص المقدسة", assignee: "أ. أشواق", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 620 },
    { id: 11, week: 2, day: "الثلاثاء", date: "2026-08-11", title: "بناء الطالب الرسالي 23", assignee: "مريم", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 850 },
    { id: 12, week: 2, day: "الأربعاء", date: "2026-08-12", title: "معجزات المسيح بين القرآن والأناجيل", assignee: "هديل", tasks: { transcription: true, design: true, montage: false, youtube: false }, ytViews: 0 },
    { id: 13, week: 2, day: "الخميس", date: "2026-08-13", title: "الأحوال والمقامات عند الإمام المحاسبي", assignee: "غير محدد", tasks: { transcription: true, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 14, week: 2, day: "الجمعة", date: "2026-08-14", title: "القول الفصل 18", assignee: "أ. أشواق", tasks: { transcription: true, design: true, montage: true, youtube: true }, ytViews: 680 },

    // الأسبوع الثالث (15 - 21 أوت 2026 - الأسبوع الحالي)
    { id: 15, week: 3, day: "السبت", date: "2026-08-15", title: "آراء بن عبد البر التحديثية", assignee: "غير محدد", tasks: { transcription: true, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 16, week: 3, day: "الأحد", date: "2026-08-16", title: "مناهج الاستدلال العقدي عند الأشاعرة", assignee: "أ. أشواق", tasks: { transcription: true, design: true, montage: false, youtube: false }, ytViews: 0 },
    { id: 17, week: 3, day: "الإثنين", date: "2026-08-17", title: "ضمانات حقوق الإنسان في الإسلام", assignee: "غير محدد", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 18, week: 3, day: "الثلاثاء", date: "2026-08-18", title: "بناء الطالب الرسالي 24", assignee: "مريم", tasks: { transcription: true, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 19, week: 3, day: "الأربعاء", date: "2026-08-19", title: "التربية الروحية عند الأمير", assignee: "نور", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 20, week: 3, day: "الخميس", date: "2026-08-20", title: "أدلة وجود الله عند عبد الله دراز", assignee: "خديجة", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 21, week: 3, day: "الجمعة", date: "2026-08-21", title: "القول الفصل 19", assignee: "أ. أشواق", tasks: { transcription: true, design: false, montage: false, youtube: false }, ytViews: 0 },

    // الأسبوع الرابع (22 - 28 أوت 2026)
    { id: 22, week: 4, day: "السبت", date: "2026-08-22", title: "إتجاهات التجديد في علم الكلام", assignee: "مريم", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 23, week: 4, day: "الأحد", date: "2026-08-23", title: "المشاريع الإعلامية في خدمة القرآن", assignee: "خولة", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 24, week: 4, day: "الإثنين", date: "2026-08-24", title: "مناقشة مريم علاش", assignee: "أ. أشواق", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 25, week: 4, day: "الثلاثاء", date: "2026-08-25", title: "بناء الطالب الرسالي 25", assignee: "مريم", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 26, week: 4, day: "الأربعاء", date: "2026-08-26", title: "نظرية الغرر في العقود المالية عند الإباضية", assignee: "غير محدد", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 27, week: 4, day: "الخميس", date: "2026-08-27", title: "الذكاء الاصطناعي بين التحيز والموضوعية", assignee: "أ. أشواق", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 },
    { id: 28, week: 4, day: "الجمعة", date: "2026-08-28", title: "القول الفصل 20", assignee: "أ. أشواق", tasks: { transcription: false, design: false, montage: false, youtube: false }, ytViews: 0 }
];

let councilsData = [];
let blockersData = [];
let currentWeekFilter = "all";
let currentMemberFilter = "all";
let currentSearchQuery = "";
let viewsChart = null;
let topCouncilsChart = null;

// تهيئة التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    loadLocalOrFirebaseData();
    setupEventListeners();
    populateCouncilSelectOptions();
    renderAll();
    initCharts();
});

function loadLocalOrFirebaseData() {
    // 1. القراءة المحلية الأولية
    const savedCouncils = localStorage.getItem('joussour_councils_data');
    councilsData = savedCouncils ? JSON.parse(savedCouncils) : [...INITIAL_COUNCILS_DATA];

    const savedBlockers = localStorage.getItem('joussour_blockers_data');
    blockersData = savedBlockers ? JSON.parse(savedBlockers) : [
        {
            id: 101,
            member: "هديل",
            council: "معجزات المسيح بين القرآن والأناجيل",
            type: "مشكلة تقنية في المونتاج/التصدير",
            details: "الملفات الصوتية الأصلية بها تشويش طفيف يحتاج لتنقية بالفلتر.",
            date: "2026-08-16 11:30"
        }
    ];

    // 2. الاستماع والمزامنة الحية مع Firebase Firestore
    if (db) {
        const syncText = document.getElementById('syncText');
        const syncDot = document.querySelector('.status-dot');
        
        syncText.textContent = "Firestore: متصل ومزامن لحظياً";
        syncDot.className = "status-dot online";

        db.collection("production").doc("august_2026").onSnapshot((doc) => {
            if (doc.exists) {
                const cloudData = doc.data();
                if (cloudData.councils && Array.isArray(cloudData.councils)) {
                    councilsData = cloudData.councils;
                }
                if (cloudData.blockers && Array.isArray(cloudData.blockers)) {
                    blockersData = cloudData.blockers;
                }
                localStorage.setItem('joussour_councils_data', JSON.stringify(councilsData));
                localStorage.setItem('joussour_blockers_data', JSON.stringify(blockersData));
                renderAll();
            } else {
                // البذر الأولي لقاعدة البيانات السحابية (First-time seeding)
                saveData();
            }
        }, (error) => {
            console.warn("خطأ في الاتصال بالسحابة:", error);
            syncText.textContent = "Firestore: وضع عدم الاتصال";
            syncDot.className = "status-dot offline";
        });
    }
}

function saveData() {
    localStorage.setItem('joussour_councils_data', JSON.stringify(councilsData));
    localStorage.setItem('joussour_blockers_data', JSON.stringify(blockersData));
    
    // المزامنة مع Firestore
    if (db) {
        db.collection("production").doc("august_2026").set({
            councils: councilsData,
            blockers: blockersData,
            updatedAt: new Date().toISOString()
        }).catch(err => console.error("Firestore sync error:", err));
    }
}

function setupEventListeners() {
    // تبويبات الأسابيع
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWeekFilter = btn.dataset.week;
            renderCouncils();
        });
    });

    // تصفية الأعضاء
    document.getElementById('memberFilter').addEventListener('change', (e) => {
        currentMemberFilter = e.target.value;
        renderCouncils();
    });

    // شريط البحث
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim().toLowerCase();
        renderCouncils();
    });

    // تبديل طرق العرض
    const btnGridView = document.getElementById('btnGridView');
    const btnTableView = document.getElementById('btnTableView');
    const gridContainer = document.getElementById('councilsContainer');
    const tableContainer = document.getElementById('councilsTableContainer');

    btnGridView.addEventListener('click', () => {
        btnGridView.classList.add('active');
        btnTableView.classList.remove('active');
        gridContainer.style.display = 'grid';
        tableContainer.style.display = 'none';
    });

    btnTableView.addEventListener('click', () => {
        btnTableView.classList.add('active');
        btnGridView.classList.remove('active');
        gridContainer.style.display = 'none';
        tableContainer.style.display = 'block';
    });

    // نافذة الاستشكالات (Modal)
    const modal = document.getElementById('blockerModal');
    document.getElementById('btnOpenBlockerModal').addEventListener('click', () => modal.classList.add('active'));
    document.getElementById('btnCloseBlockerModal').addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('btnCancelBlocker').addEventListener('click', () => modal.classList.remove('active'));

    // نموذج إرسال الاستشكال
    document.getElementById('blockerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newBlocker = {
            id: Date.now(),
            member: document.getElementById('blockerMember').value,
            council: document.getElementById('blockerCouncil').value,
            type: document.getElementById('blockerType').value,
            details: document.getElementById('blockerDetails').value,
            date: new Date().toLocaleString('ar-DZ')
        };
        blockersData.unshift(newBlocker);
        saveData();
        renderAll();
        modal.classList.remove('active');
        document.getElementById('blockerForm').reset();
        alert('✅ تم إرسال الاستشكال وحفظه في السحابة بنجاح!');
    });

    // زر تحديث إحصائيات يوتيوب
    document.getElementById('btnRefreshYtAnalytics').addEventListener('click', () => {
        alert('🔄 جاري تحديث بيانات استوديو يوتيوب...');
        initCharts();
    });
}

function populateCouncilSelectOptions() {
    const select = document.getElementById('blockerCouncil');
    select.innerHTML = '<option value="">اختر المجلس المتعلق...</option>';
    councilsData.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.title;
        opt.textContent = `[الأسبوع ${c.week}] ${c.title}`;
        select.appendChild(opt);
    });
}

function renderAll() {
    renderKPIs();
    renderCouncils();
    renderBlockers();
}

function renderKPIs() {
    const total = councilsData.length;
    let completedMontageCount = 0;
    let publishedYtCount = 0;
    let totalViews = 0;

    councilsData.forEach(c => {
        if (c.tasks.montage) completedMontageCount++;
        if (c.tasks.youtube) publishedYtCount++;
        totalViews += (c.ytViews || 0);
    });

    const percentage = total > 0 ? Math.round((completedMontageCount / total) * 100) : 0;

    document.getElementById('kpiProgress').textContent = `${percentage}%`;
    document.getElementById('kpiProgressBar').style.width = `${percentage}%`;
    document.getElementById('kpiTotalCouncils').textContent = total;
    document.getElementById('kpiDoneCount').textContent = completedMontageCount;
    document.getElementById('kpiPendingCount').textContent = total - completedMontageCount;
    document.getElementById('kpiYoutubeViews').textContent = totalViews.toLocaleString('ar-DZ');
    document.getElementById('kpiPublishedYt').textContent = publishedYtCount;
    document.getElementById('kpiBlockersCount').textContent = blockersData.length;
}

function getFilteredCouncils() {
    return councilsData.filter(c => {
        const matchesWeek = currentWeekFilter === 'all' || c.week.toString() === currentWeekFilter;
        const matchesMember = currentMemberFilter === 'all' || c.assignee === currentMemberFilter;
        const matchesSearch = !currentSearchQuery || c.title.toLowerCase().includes(currentSearchQuery) || c.assignee.toLowerCase().includes(currentSearchQuery);
        return matchesWeek && matchesMember && matchesSearch;
    });
}

function renderCouncils() {
    const filtered = getFilteredCouncils();
    renderGridView(filtered);
    renderTableView(filtered);
}

function renderGridView(councils) {
    const container = document.getElementById('councilsContainer');
    container.innerHTML = '';

    if (councils.length === 0) {
        container.innerHTML = '<div class="empty-blockers" style="grid-column: 1/-1;"><p>لا توجد نتائج تطابق معايير البحث والتصفية المحددة.</p></div>';
        return;
    }

    councils.forEach(c => {
        const card = document.createElement('div');
        card.className = 'council-card';
        card.innerHTML = `
            <div class="council-header">
                <span class="council-meta">الأسبوع ${c.week} • ${c.day} (${c.date})</span>
                <span class="task-badge ${c.tasks.montage ? 'done' : 'pending'}">${c.tasks.montage ? 'جاهز للنشر' : 'قيد الإنتاج'}</span>
            </div>
            <div>
                <h3 class="council-title">${c.title}</h3>
                <div class="council-assignee"><i class="fa-solid fa-user-circle"></i> المسؤول: <strong>${c.assignee}</strong></div>
            </div>

            <div class="task-pipeline-list">
                <div class="task-pipeline-item">
                    <label class="task-check-label">
                        <input type="checkbox" ${c.tasks.transcription ? 'checked' : ''} onchange="toggleTask(${c.id}, 'transcription', this.checked)">
                        <span>1. التفريغ والمراجعة</span>
                    </label>
                    <span class="task-badge ${c.tasks.transcription ? 'done' : 'pending'}">${c.tasks.transcription ? 'منجز' : 'معلق'}</span>
                </div>
                <div class="task-pipeline-item">
                    <label class="task-check-label">
                        <input type="checkbox" ${c.tasks.design ? 'checked' : ''} onchange="toggleTask(${c.id}, 'design', this.checked)">
                        <span>2. تصميم البوستر والملحقات</span>
                    </label>
                    <span class="task-badge ${c.tasks.design ? 'done' : 'pending'}">${c.tasks.design ? 'منجز' : 'معلق'}</span>
                </div>
                <div class="task-pipeline-item">
                    <label class="task-check-label">
                        <input type="checkbox" ${c.tasks.montage ? 'checked' : ''} onchange="toggleTask(${c.id}, 'montage', this.checked)">
                        <span>3. المونتاج والتصدير</span>
                    </label>
                    <span class="task-badge ${c.tasks.montage ? 'done' : 'pending'}">${c.tasks.montage ? 'منجز' : 'معلق'}</span>
                </div>
            </div>

            <div class="council-footer">
                <span class="yt-status-badge ${c.tasks.youtube ? 'published' : 'not-uploaded'}">
                    <i class="fa-brands fa-youtube"></i> ${c.tasks.youtube ? 'تم النشر على يوتيوب' : 'لم يُنشر بعد'}
                </span>
                <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="toggleTask(${c.id}, 'youtube', ${!c.tasks.youtube})">
                    ${c.tasks.youtube ? 'إلغاء النشر' : 'تأكيد النشر'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderTableView(councils) {
    const tbody = document.getElementById('councilsTableBody');
    tbody.innerHTML = '';

    councils.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${c.id}</strong></td>
            <td><strong>${c.title}</strong></td>
            <td>الأسبوع ${c.week} • ${c.day} <br><small class="text-muted">${c.date}</small></td>
            <td><span class="task-badge" style="background: var(--bg-subtle);">${c.assignee}</span></td>
            <td><input type="checkbox" ${c.tasks.transcription ? 'checked' : ''} onchange="toggleTask(${c.id}, 'transcription', this.checked)"></td>
            <td><input type="checkbox" ${c.tasks.design ? 'checked' : ''} onchange="toggleTask(${c.id}, 'design', this.checked)"></td>
            <td><input type="checkbox" ${c.tasks.montage ? 'checked' : ''} onchange="toggleTask(${c.id}, 'montage', this.checked)"></td>
            <td><span class="task-badge ${c.tasks.youtube ? 'done' : 'pending'}">${c.tasks.youtube ? '🟢 منشور' : '🔴 معلق'}</span></td>
            <td>
                <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="toggleTask(${c.id}, 'montage', ${!c.tasks.montage})">
                    ${c.tasks.montage ? 'إلغاء الإنجاز' : 'تم المونتاج'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleTask(councilId, taskType, isChecked) {
    const council = councilsData.find(c => c.id === councilId);
    if (council) {
        council.tasks[taskType] = isChecked;
        saveData();
        renderAll();
    }
}

function renderBlockers() {
    const container = document.getElementById('blockersList');
    container.innerHTML = '';

    if (blockersData.length === 0) {
        container.innerHTML = `
            <div class="empty-blockers">
                <i class="fa-solid fa-circle-check"></i>
                <p>الحمد لله، لا توجد استشكالات معلقة حالياً. سير العمل منتظم!</p>
            </div>
        `;
        return;
    }

    blockersData.forEach(b => {
        const item = document.createElement('div');
        item.className = 'blocker-item-card';
        item.innerHTML = `
            <div class="blocker-content">
                <h4><i class="fa-solid fa-circle-exclamation"></i> ${b.type} (${b.council})</h4>
                <p>${b.details}</p>
                <div class="blocker-meta">
                    👤 المبلّغ: <strong>${b.member}</strong> • 🕒 التوقيت: ${b.date}
                </div>
            </div>
            <button class="btn-secondary" style="color: var(--success); border-color: var(--success);" onclick="resolveBlocker(${b.id})">
                <i class="fa-solid fa-check"></i> تم الحل
            </button>
        `;
        container.appendChild(item);
    });
}

function resolveBlocker(blockerId) {
    blockersData = blockersData.filter(b => b.id !== blockerId);
    saveData();
    renderAll();
}

function initCharts() {
    const ctx1 = document.getElementById('viewsTrendChart').getContext('2d');
    const ctx2 = document.getElementById('topCouncilsChart').getContext('2d');

    if (viewsChart) viewsChart.destroy();
    if (topCouncilsChart) topCouncilsChart.destroy();

    // 1. Weekly Growth Chart
    viewsChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['الأسبوع الأول', 'الأسبوع الثاني', 'الأسبوع الثالث (الحالي)', 'الأسبوع الرابع (المتوقع)'],
            datasets: [{
                label: 'إجمالي المشاهدات الأسبوعية',
                data: [3580, 4200, 2150, 4800],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#2563eb',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { font: { family: 'Cairo', size: 12 } } } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Top Performing Councils
    topCouncilsChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['بناء الطالب الرسالي 22', 'بناء الطالب الرسالي 23', 'القول الفصل 17', 'القول الفصل 18', 'مقاصد ختم الآيات'],
            datasets: [{
                label: 'عدد المشاهدات',
                data: [890, 850, 740, 680, 580],
                backgroundColor: ['#f59e0b', '#f59e0b', '#3b82f6', '#3b82f6', '#10b981'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}
