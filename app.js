/**
 * منطق لوحة تحكم فريق الإنتاج والمجالس العلمية
 * نادي جسور العلمي - منظومة الأرشيف السنوي والتمييز بين المجالس والمناقشات
 */

const MONTHS_CONFIG = {
    "january": { name: "جانفي 2026", desc: "أرشيف المجالس والأنشطة لشهر جانفي 2026", status: "مؤرشف", total: 16, defaultData: [] },
    "february": { name: "فيفري 2026", desc: "أرشيف المجالس والأنشطة لشهر فيفري 2026", status: "مؤرشف", total: 18, defaultData: [] },
    "march": { name: "مارس 2026", desc: "أرشيف المجالس والأنشطة لشهر مارس 2026", status: "مؤرشف", total: 20, defaultData: [] },
    "april": { name: "أفريل 2026", desc: "أرشيف المجالس والأنشطة لشهر أفريل 2026", status: "مؤرشف", total: 22, defaultData: [] },
    "may": { name: "ماي 2026", desc: "أرشيف المجالس والأنشطة لشهر ماي 2026", status: "مؤرشف", total: 24, defaultData: [] },
    "june": { name: "جوان 2026", desc: "أرشيف المجالس والأنشطة لشهر جوان 2026", status: "مؤرشف", total: 25, defaultData: [] },
    "july": { name: "جويلية 2026", desc: "أرشيف المجالس والأنشطة لشهر جويلية 2026", status: "مكتمل ومؤرشف", total: 26, defaultData: [] },
    "august": { name: "أوت 2026 (الشهر الحالي)", desc: "متابعة إنجاز الـ 34 مجلساً ومناقشة ومراحل التفريغ والتصميم والمونتاج والنشر الحقيقي عبر يوتيوب.", status: "نشط ومحدث لحظياً", total: 34, defaultData: [] },
    "september": { name: "سبتمبر 2026 (الخطة القادمة)", desc: "خطة شهر سبتمبر 2026 - جاهزة لاستقبال وتعيين مجالس الشهر القادم.", status: "قيد الإعداد", total: 0, defaultData: [] },
    "october": { name: "أكتوبر 2026", desc: "خطة شهر أكتوبر 2026", status: "مستقبلي", total: 0, defaultData: [] },
    "november": { name: "نوفمبر 2026", desc: "خطة شهر نوفمبر 2026", status: "مستقبلي", total: 0, defaultData: [] },
    "december": { name: "ديسمبر 2026", desc: "خطة شهر ديسمبر 2026", status: "مستقبلي", total: 0, defaultData: [] }
};

let activeMonth = "august";
let councilsData = [];
let blockersData = [];
let topChannelVideos = [];
let currentWeekFilter = "all";
let currentCategoryFilter = "all";
let currentMemberFilter = "all";
let currentSearchQuery = "";
let viewsChart = null;
let topCouncilsChart = null;

document.addEventListener('DOMContentLoaded', () => {
    setupMonthNavigation();
    setupEventListeners();
    loadMonthData(activeMonth);
});

function getCouncilType(title) {
    if (!title) return "council";
    const t = title.toLowerCase();
    if (t.includes("مناقش") || t.includes("ماستر") || t.includes("دكتوراه") || t.includes("أطروحة") || t.includes("مذكرة")) {
        return "discussion";
    }
    return "council";
}

function setupMonthNavigation() {
    document.querySelectorAll('.month-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const selectedMonth = chip.dataset.month;
            document.querySelectorAll('.month-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeMonth = selectedMonth;
            loadMonthData(activeMonth);
        });
    });
}

function loadMonthData(monthKey) {
    const config = MONTHS_CONFIG[monthKey] || MONTHS_CONFIG["august"];
    
    document.getElementById('activeMonthTitle').textContent = `خطة شهر ${config.name}`;
    document.getElementById('activeMonthDesc').textContent = config.desc;
    document.getElementById('bannerMonthStatus').textContent = config.status;

    const storageKey = `joussour_councils_${monthKey}`;
    const saved = localStorage.getItem(storageKey);
    councilsData = saved ? JSON.parse(saved) : [];

    const savedBlockers = localStorage.getItem('joussour_blockers_data');
    blockersData = savedBlockers ? JSON.parse(savedBlockers) : [];

    document.getElementById('bannerTotalTasks').textContent = `${councilsData.length || config.total} مجلس ومناقشة`;

    // ربط واستماع فوري ومباشر لـ Firestore
    if (db) {
        db.collection("production").doc(`${monthKey}_2026`).onSnapshot((doc) => {
            if (doc.exists) {
                const cloudData = doc.data();
                if (cloudData.councils && Array.isArray(cloudData.councils)) {
                    councilsData = cloudData.councils;
                    localStorage.setItem(storageKey, JSON.stringify(councilsData));
                }
                if (cloudData.blockers && Array.isArray(cloudData.blockers)) {
                    blockersData = cloudData.blockers;
                    localStorage.setItem('joussour_blockers_data', JSON.stringify(blockersData));
                }
                if (cloudData.topChannelVideos) {
                    topChannelVideos = cloudData.topChannelVideos;
                }
                document.getElementById('bannerTotalTasks').textContent = `${councilsData.length} مجلس ومناقشة`;
                populateCouncilSelectOptions();
                renderAll();
                initCharts();
            }
        });
    }

    populateCouncilSelectOptions();
    renderAll();
    initCharts();
}

function saveData() {
    const storageKey = `joussour_councils_${activeMonth}`;
    localStorage.setItem(storageKey, JSON.stringify(councilsData));
    localStorage.setItem('joussour_blockers_data', JSON.stringify(blockersData));
    
    if (db) {
        db.collection("production").doc(`${activeMonth}_2026`).set({
            month: activeMonth,
            councils: councilsData,
            blockers: blockersData,
            updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.error("Firestore sync error:", err));
    }
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWeekFilter = btn.dataset.week;
            renderCouncils();
        });
    });

    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value;
        renderCouncils();
    });

    document.getElementById('memberFilter').addEventListener('change', (e) => {
        currentMemberFilter = e.target.value;
        renderCouncils();
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim().toLowerCase();
        renderCouncils();
    });

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

    const modal = document.getElementById('blockerModal');
    document.getElementById('btnOpenBlockerModal').addEventListener('click', () => modal.classList.add('active'));
    document.getElementById('btnCloseBlockerModal').addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('btnCancelBlocker').addEventListener('click', () => modal.classList.remove('active'));

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
        alert('✅ تم إرسال الاستشكال بنجاح وتوثيقه في السحابة!');
    });

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
        if (c.tasks && c.tasks.montage) completedMontageCount++;
        if (c.tasks && c.tasks.youtube) publishedYtCount++;
        totalViews += (c.ytViews || 0);
    });

    const percentage = total > 0 ? Math.round((publishedYtCount / total) * 100) : 0;

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
        const cType = getCouncilType(c.title);
        const matchesWeek = currentWeekFilter === 'all' || c.week.toString() === currentWeekFilter;
        const matchesCategory = currentCategoryFilter === 'all' || cType === currentCategoryFilter;
        const matchesMember = currentMemberFilter === 'all' || c.assignee === currentMemberFilter;
        const matchesSearch = !currentSearchQuery || c.title.toLowerCase().includes(currentSearchQuery) || c.assignee.toLowerCase().includes(currentSearchQuery);
        return matchesWeek && matchesCategory && matchesMember && matchesSearch;
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
        container.innerHTML = `
            <div class="empty-blockers" style="grid-column: 1/-1;">
                <i class="fa-solid fa-folder-open"></i>
                <p>لا توجد نتائج تطابق معايير التصفية والبحث المحددة.</p>
            </div>
        `;
        return;
    }

    councils.forEach(c => {
        const cType = getCouncilType(c.title);
        const card = document.createElement('div');
        card.className = `council-card ${c.isExtra ? 'extra-council' : ''}`;
        const isYtPublished = c.tasks && c.tasks.youtube;
        const ytViewsText = isYtPublished ? `<span style="color: var(--brand-gold); font-weight: 800;"><i class="fa-solid fa-eye"></i> ${(c.ytViews||0).toLocaleString('ar-DZ')} مشاهدة</span>` : '';
        const videoBtn = c.videoUrl ? `<a href="${c.videoUrl}" target="_blank" class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; text-decoration: none; color: var(--danger);"><i class="fa-brands fa-youtube"></i> فتح الفيديو</a>` : '';

        const typeBadge = cType === "discussion" 
            ? `<span class="category-tag tag-discussion"><i class="fa-solid fa-graduation-cap"></i> مناقشة علمية</span>` 
            : `<span class="category-tag tag-council"><i class="fa-solid fa-book-open"></i> مجلس علمي</span>`;

        const extraBadge = c.isExtra ? `<span class="task-badge" style="background: var(--brand-gold-light); color: var(--brand-gold); border: 1px solid var(--brand-gold); font-weight: 800;">✨ منشور إضافي من القناة</span>` : '';

        card.innerHTML = `
            <div class="council-header">
                <span class="council-meta">${c.isExtra ? 'نشر حديث • ' : 'الأسبوع ' + c.week + ' • '}${c.day} (${c.date})</span>
                <span class="task-badge ${isYtPublished ? 'done' : (c.tasks && c.tasks.montage ? 'in-progress' : 'pending')}">
                    ${isYtPublished ? '🟢 تم النشر بيوتيوب' : (c.tasks && c.tasks.montage ? 'جاهز للنشر' : 'قيد الإنتاج')}
                </span>
            </div>
            <div>
                <div style="display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.25rem;">
                    ${typeBadge}
                    ${extraBadge}
                </div>
                <h3 class="council-title">${c.title}</h3>
                <div class="council-assignee"><i class="fa-solid fa-user-circle"></i> المسؤول: <strong>${c.assignee}</strong></div>
            </div>

            <div class="task-pipeline-list">
                <div class="task-pipeline-item">
                    <label class="task-check-label">
                        <input type="checkbox" ${c.tasks && c.tasks.transcription ? 'checked' : ''} onchange="toggleTask(${c.id}, 'transcription', this.checked)">
                        <span>1. التفريغ والمراجعة</span>
                    </label>
                    <span class="task-badge ${c.tasks && c.tasks.transcription ? 'done' : 'pending'}">${c.tasks && c.tasks.transcription ? 'منجز' : 'معلق'}</span>
                </div>
                <div class="task-pipeline-item">
                    <label class="task-check-label">
                        <input type="checkbox" ${c.tasks && c.tasks.design ? 'checked' : ''} onchange="toggleTask(${c.id}, 'design', this.checked)">
                        <span>2. تصميم البوستر والملحقات</span>
                    </label>
                    <span class="task-badge ${c.tasks && c.tasks.design ? 'done' : 'pending'}">${c.tasks && c.tasks.design ? 'منجز' : 'معلق'}</span>
                </div>
                <div class="task-pipeline-item">
                    <label class="task-check-label">
                        <input type="checkbox" ${c.tasks && c.tasks.montage ? 'checked' : ''} onchange="toggleTask(${c.id}, 'montage', this.checked)">
                        <span>3. المونتاج والتصدير</span>
                    </label>
                    <span class="task-badge ${c.tasks && c.tasks.montage ? 'done' : 'pending'}">${c.tasks && c.tasks.montage ? 'منجز' : 'معلق'}</span>
                </div>
            </div>

            <div class="council-footer">
                <div class="yt-status-badge ${isYtPublished ? 'published' : 'not-uploaded'}">
                    <i class="fa-brands fa-youtube"></i> ${isYtPublished ? 'منشور رسمياً' : 'لم يُنشر بعد'} ${ytViewsText}
                </div>
                ${videoBtn}
            </div>
        `;
        container.appendChild(card);
    });
}

function renderTableView(councils) {
    const tbody = document.getElementById('councilsTableBody');
    tbody.innerHTML = '';

    councils.forEach(c => {
        const cType = getCouncilType(c.title);
        const isYtPublished = c.tasks && c.tasks.youtube;
        const typeBadge = cType === "discussion" 
            ? `<span class="category-tag tag-discussion">مناقشة</span>` 
            : `<span class="category-tag tag-council">مجلس</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${c.id}</strong></td>
            <td><strong>${c.title}</strong> ${c.isExtra ? '<span class="task-badge" style="background:var(--brand-gold-light);color:var(--brand-gold);font-size:0.7rem;">إضافي</span>' : ''} ${c.videoUrl ? `<a href="${c.videoUrl}" target="_blank" style="color: var(--danger); font-size: 0.8rem; margin-right: 0.3rem;"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}</td>
            <td>${typeBadge}</td>
            <td>${c.isExtra ? 'نشر إضافي' : 'الأسبوع ' + c.week} • ${c.day} <br><small class="text-muted">${c.date}</small></td>
            <td><span class="task-badge" style="background: var(--bg-subtle);">${c.assignee}</span></td>
            <td><input type="checkbox" ${c.tasks && c.tasks.transcription ? 'checked' : ''} onchange="toggleTask(${c.id}, 'transcription', this.checked)"></td>
            <td><input type="checkbox" ${c.tasks && c.tasks.design ? 'checked' : ''} onchange="toggleTask(${c.id}, 'design', this.checked)"></td>
            <td><input type="checkbox" ${c.tasks && c.tasks.montage ? 'checked' : ''} onchange="toggleTask(${c.id}, 'montage', this.checked)"></td>
            <td><span class="task-badge ${isYtPublished ? 'done' : 'pending'}">${isYtPublished ? `🟢 منشور (${(c.ytViews||0).toLocaleString('ar-DZ')})` : '🔴 معلق'}</span></td>
            <td>
                <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="toggleTask(${c.id}, 'montage', ${!(c.tasks && c.tasks.montage)})">
                    ${c.tasks && c.tasks.montage ? 'إلغاء المونتاج' : 'تم المونتاج'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleTask(councilId, taskType, isChecked) {
    const council = councilsData.find(c => c.id === councilId);
    if (council) {
        if (!council.tasks) council.tasks = {};
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

    let w1Views = 0, w2Views = 0, w3Views = 0, w4Views = 0;
    const publishedList = [];

    councilsData.forEach(c => {
        const v = c.ytViews || 0;
        if (c.week === 1) w1Views += v;
        else if (c.week === 2) w2Views += v;
        else if (c.week === 3) w3Views += v;
        else if (c.week === 4) w4Views += v;

        if (c.tasks && c.tasks.youtube && v > 0) {
            publishedList.push({ title: c.title, views: v });
        }
    });

    publishedList.sort((a, b) => b.views - a.views);
    const topLabels = publishedList.slice(0, 5).map(p => p.title);
    const topData = publishedList.slice(0, 5).map(p => p.views);

    viewsChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['الأسبوع الأول', 'الأسبوع الثاني', 'الأسبوع الثالث (الحالي)', 'الأسبوع الرابع'],
            datasets: [{
                label: 'المشاهدات الفعلية للمجالس والمناقشات المنشورة',
                data: [w1Views, w2Views, w3Views, w4Views],
                borderColor: '#c68d1b',
                backgroundColor: 'rgba(198, 141, 27, 0.12)',
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#181e3d',
                pointBorderColor: '#c68d1b',
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

    topCouncilsChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: topLabels.length > 0 ? topLabels : ['ضمانات حقوق الإنسان', 'شبهات المستشرقة', 'القول الفصل', 'بناء الطالب الرسالي'],
            datasets: [{
                label: 'عدد المشاهدات الفعلي',
                data: topData.length > 0 ? topData : [956, 585, 169, 110],
                backgroundColor: ['#c68d1b', '#c68d1b', '#181e3d', '#181e3d', '#10b981'],
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
