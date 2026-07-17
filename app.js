// ============================================
// FIREBASE CONFIG
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyD8G1jKXc7OVC0UCEGZL5I82mWwZIuZlHY",
    authDomain: "markazul-ulum.firebaseapp.com",
    projectId: "markazul-ulum",
    storageBucket: "markazul-ulum.firebasestorage.app",
    messagingSenderId: "111421907909",
    appId: "1:111421907909:web:1717f42fab2626b2a061ac"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================
// NAV TOGGLE
// ============================================
function toggleNav() {
    document.getElementById('navMenu').classList.toggle('show');
}
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('navMenu').classList.remove('show');
    });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const t = document.querySelector(this.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ============================================
// LOAD SITE SETTINGS
// ============================================
function loadSiteSettings() {
    db.collection('settings').doc('site').get().then(doc => {
        if (!doc.exists) return;
        const s = doc.data();

        if (s.nameBn) document.getElementById('siteNameBn').textContent = s.nameBn;
        if (s.nameEn) document.getElementById('siteNameEn').textContent = s.nameEn;
        if (s.location) document.getElementById('siteLocation').textContent = s.location;
        if (s.logo) {
            document.getElementById('siteLogo').src = s.logo;
            document.getElementById('siteLogo2').src = s.logo;
        }
        if (s.phone) {
            document.getElementById('topPhone').textContent = s.phone;
            document.getElementById('contactPhone').textContent = s.phone;
        }
        if (s.email) {
            document.getElementById('topEmail').textContent = s.email;
            document.getElementById('contactEmail').textContent = s.email;
        }
        if (s.address) document.getElementById('contactAddress').textContent = s.address;
        if (s.heroTitle) document.getElementById('heroTitle').textContent = s.heroTitle;
        if (s.heroSubtitle) document.getElementById('heroSubtitle').textContent = s.heroSubtitle;
        if (s.heroSlogan) document.getElementById('heroSlogan').textContent = s.heroSlogan;
        if (s.heroSloganEn) document.getElementById('heroSloganEn').textContent = s.heroSloganEn;
        if (s.aboutText1) document.getElementById('aboutText1').textContent = s.aboutText1;
        if (s.aboutText2) document.getElementById('aboutText2').textContent = s.aboutText2;
        if (s.aboutText3) document.getElementById('aboutText3').textContent = s.aboutText3;
        if (s.footerText) document.getElementById('footerText').textContent = s.footerText;
        if (s.statClasses) document.getElementById('statClasses').textContent = s.statClasses;
        if (s.statPassRate) document.getElementById('statPassRate').textContent = s.statPassRate;

        // Header color
        if (s.headerColor) {
            document.getElementById('siteHeader').style.background = s.headerColor;
        }
        // Hero background
        if (s.heroBg) {
            document.querySelector('.hero').style.background =
                `linear-gradient(rgba(13,40,24,0.85),rgba(26,86,50,0.9)),url('${s.heroBg}') center/cover`;
        }
    }).catch(err => console.log('Settings not found, using defaults'));
}

// ============================================
// LOAD NOTICES
// ============================================
function loadNotices() {
    db.collection('notices').orderBy('date', 'desc').limit(15).get().then(snap => {
        const list = document.getElementById('noticeList');
        const marquee = document.getElementById('marqueeNotice');

        if (snap.empty) {
            list.innerHTML = '<p style="text-align:center;color:#888;padding:30px;">কোনো নোটিশ নেই | No notices yet</p>';
            marquee.textContent = 'বর্তমানে কোনো নতুন বিজ্ঞপ্তি নেই।';
            return;
        }

        let html = '', mText = '';
        snap.forEach(doc => {
            const n = doc.data();
            html += `
                <div class="notice-item">
                    <span class="notice-date">📅 ${n.date || ''}</span>
                    <h3>${n.title || ''}</h3>
                    <p>${n.content || ''}</p>
                </div>`;
            mText += ` ◆ ${n.title}`;
        });
        list.innerHTML = html;
        marquee.textContent = mText;
    }).catch(err => {
        console.error(err);
        document.getElementById('noticeList').innerHTML = '<p style="text-align:center;color:red;">লোড করতে সমস্যা হয়েছে</p>';
    });
}

// ============================================
// SEARCH STUDENTS
// ============================================
function searchStudents() {
    const cls = document.getElementById('searchClass').value;
    const name = document.getElementById('searchName').value.trim();
    const roll = document.getElementById('searchRoll').value.trim();
    const div = document.getElementById('studentResults');

    if (!cls && !name && !roll) {
        div.innerHTML = '<p style="text-align:center;color:#c62828;padding:20px;">অন্তত একটি তথ্য দিন | Provide at least one field</p>';
        return;
    }

    div.innerHTML = '<div class="loading">খুঁজছি... | Searching...</div>';

    let query = db.collection('students');
    if (cls) query = query.where('class', '==', cls);

    query.get().then(snap => {
        let students = [];
        snap.forEach(doc => {
            const s = doc.data();
            s.id = doc.id;
            if (name && !(s.name || '').toLowerCase().includes(name.toLowerCase()) &&
                !(s.nameBn || '').includes(name)) return;
            if (roll && s.roll !== roll) return;
            students.push(s);
        });

        if (students.length === 0) {
            div.innerHTML = '<p style="text-align:center;color:#c62828;padding:20px;">কোনো শিক্ষার্থী পাওয়া যায়নি | No student found</p>';
            return;
        }

        let html = '';
        students.forEach(s => {
            html += `
                <div class="student-card">
                    <div class="student-card-header">
                        <img src="${s.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.nameBn || s.name || 'S') + '&background=2d8a4e&color=fff&size=100'}" 
                             onerror="this.src='https://ui-avatars.com/api/?name=S&background=2d8a4e&color=fff'">
                        <h3>${s.nameBn || s.name || ''}</h3>
                        <p class="en-name">${s.name || ''}</p>
                    </div>
                    <div class="student-card-body">
                        <div class="info-row"><span class="info-label">ক্লাস | Class</span><span>${s.class || ''}</span></div>
                        <div class="info-row"><span class="info-label">রোল | Roll</span><span>${s.roll || ''}</span></div>
                        <div class="info-row"><span class="info-label">পিতা | Father</span><span>${s.fatherName || '-'}</span></div>
                        <div class="info-row"><span class="info-label">মাতা | Mother</span><span>${s.motherName || '-'}</span></div>
                        <div class="info-row"><span class="info-label">জন্ম | DOB</span><span>${s.dob || '-'}</span></div>
                        <div class="info-row"><span class="info-label">ফোন | Phone</span><span>${s.phone || '-'}</span></div>
                        <div class="info-row"><span class="info-label">ঠিকানা | Address</span><span>${s.address || '-'}</span></div>
                        <div class="info-row"><span class="info-label">রক্ত | Blood</span><span>${s.blood || '-'}</span></div>
                    </div>
                </div>`;
        });
        div.innerHTML = html;
    }).catch(err => {
        console.error(err);
        div.innerHTML = '<p style="color:red;text-align:center;">সমস্যা হয়েছে</p>';
    });
}

// ============================================
// SEARCH RESULTS
// ============================================
function getGrade(m) {
    if (m >= 80) return { g: 'A+', c: 'grade-a-plus' };
    if (m >= 70) return { g: 'A', c: 'grade-a' };
    if (m >= 60) return { g: 'A-', c: 'grade-a' };
    if (m >= 50) return { g: 'B', c: 'grade-b' };
    if (m >= 40) return { g: 'C', c: 'grade-c' };
    if (m >= 33) return { g: 'D', c: 'grade-c' };
    return { g: 'F', c: 'grade-f' };
}

function searchResults() {
    const cls = document.getElementById('resultClass').value;
    const exam = document.getElementById('resultExam').value;
    const roll = document.getElementById('resultRoll').value.trim();
    const div = document.getElementById('resultDisplay');

    if (!cls || !exam || !roll) {
        div.innerHTML = '<p style="text-align:center;color:#c62828;padding:20px;">সব তথ্য দিন | Fill all fields</p>';
        return;
    }

    div.innerHTML = '<div class="loading">খুঁজছি...</div>';

    db.collection('results')
        .where('class', '==', cls)
        .where('exam', '==', exam)
        .where('roll', '==', roll)
        .get().then(snap => {
            if (snap.empty) {
                div.innerHTML = '<p style="text-align:center;color:#c62828;padding:20px;">ফলাফল পাওয়া যায়নি | Result not found</p>';
                return;
            }

            const r = snap.docs[0].data();
            const subjects = r.subjects || {};
            const examNames = {
                '1st-term': 'প্রথম সাময়িক | 1st Term',
                'mid-term': 'অর্ধবার্ষিক | Mid Term',
                'final': 'বার্ষিক | Final',
                'test': 'টেস্ট | Test'
            };

            let total = 0, count = 0, rows = '';
            for (let sub in subjects) {
                const m = parseInt(subjects[sub]) || 0;
                total += m;
                count++;
                const gr = getGrade(m);
                rows += `<tr><td>${sub}</td><td>${m}</td><td class="${gr.c}">${gr.g}</td></tr>`;
            }

            const avg = count > 0 ? (total / count).toFixed(1) : 0;
            const gpa = avg >= 80 ? '5.00' : avg >= 70 ? '4.00' : avg >= 60 ? '3.50' : avg >= 50 ? '3.00' : avg >= 40 ? '2.00' : avg >= 33 ? '1.00' : '0.00';

            div.innerHTML = `
                <div class="result-card">
                    <div class="result-header">
                        <h3>${r.studentName || 'শিক্ষার্থী'}</h3>
                        <p>ক্লাস: ${cls} | রোল: ${roll} | ${examNames[exam] || exam}</p>
                    </div>
                    <table class="result-table">
                        <thead><tr><th>বিষয় | Subject</th><th>নম্বর | Marks</th><th>গ্রেড | Grade</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="result-summary">
                        <p>মোট | Total: <span>${total}</span> | গড় | Avg: <span>${avg}</span> | GPA: <span>${gpa}</span></p>
                    </div>
                </div>`;
        }).catch(err => {
            console.error(err);
            div.innerHTML = '<p style="color:red;text-align:center;">সমস্যা হয়েছে</p>';
        });
}

// ============================================
// LOAD TOPPERS
// ============================================
function loadToppers() {
    const cls = document.getElementById('topperClass').value;
    const exam = document.getElementById('topperExam').value;
    const div = document.getElementById('topperDisplay');

    if (!cls || !exam) { div.innerHTML = ''; return; }

    div.innerHTML = '<div class="loading">লোড হচ্ছে...</div>';

    db.collection('results')
        .where('class', '==', cls)
        .where('exam', '==', exam)
        .get().then(snap => {
            if (snap.empty) {
                div.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">ফলাফল পাওয়া যায়নি | No results</p>';
                return;
            }

            let results = [];
            snap.forEach(doc => {
                const r = doc.data();
                let total = 0;
                for (let s in (r.subjects || {})) total += parseInt(r.subjects[s]) || 0;
                results.push({ ...r, total });
            });

            results.sort((a, b) => b.total - a.total);
            const top3 = results.slice(0, 3);
            const cls_arr = ['gold', 'silver', 'bronze'];
            const pos = ['১ম | 1st', '২য় | 2nd', '৩য় | 3rd'];
            const nums = ['১', '২', '৩'];

            let html = '';
            top3.forEach((t, i) => {
                html += `
                    <div class="topper-card ${cls_arr[i]}">
                        <div class="topper-badge">${nums[i]}</div>
                        <img src="${t.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(t.studentName || 'S') + '&background=2d8a4e&color=fff&size=90'}" 
                             onerror="this.src='https://ui-avatars.com/api/?name=${nums[i]}&background=2d8a4e&color=fff'">
                        <h3>${t.studentName || 'শিক্ষার্থী'}</h3>
                        <p class="topper-roll">রোল | Roll: ${t.roll}</p>
                        <p class="topper-marks">${t.total} নম্বর</p>
                        <p class="topper-pos">${pos[i]}</p>
                    </div>`;
            });
            div.innerHTML = html;
        }).catch(err => {
            console.error(err);
            div.innerHTML = '<p style="color:red;text-align:center;">সমস্যা হয়েছে</p>';
        });
}

// ============================================
// LOAD TEACHERS
// ============================================
function loadTeachers() {
    db.collection('teachers').orderBy('order', 'asc').get().then(snap => {
        const grid = document.getElementById('teacherList');
        if (snap.empty) {
            grid.innerHTML = '<p style="text-align:center;color:#888;padding:30px;">শিক্ষকদের তথ্য শীঘ্রই আসছে | Coming soon</p>';
            return;
        }
        let html = '';
        snap.forEach(doc => {
            const t = doc.data();
            html += `
                <div class="teacher-card">
                    <img src="${t.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(t.nameBn || t.name || 'T') + '&background=2d8a4e&color=fff&size=110'}" 
                         onerror="this.src='https://ui-avatars.com/api/?name=T&background=2d8a4e&color=fff'">
                    <h3>${t.nameBn || t.name || ''}</h3>
                    <p class="en-name">${t.name || ''}</p>
                    <p class="designation">${t.designation || ''}</p>
                    <p class="subject">${t.subject || ''}</p>
                    ${t.phone ? '<p class="phone"><i class="fas fa-phone"></i> ' + t.phone + '</p>' : ''}
                </div>`;
        });
        grid.innerHTML = html;
        document.getElementById('statTeachers').textContent = snap.size;
    }).catch(err => console.error(err));
}

// ============================================
// LOAD GALLERY
// ============================================
function loadGallery() {
    db.collection('gallery').orderBy('date', 'desc').limit(20).get().then(snap => {
        const grid = document.getElementById('galleryGrid');
        if (snap.empty) {
            grid.innerHTML = '<p style="text-align:center;color:#888;padding:30px;">ফটো শীঘ্রই আসছে | Photos coming soon</p>';
            return;
        }
        let html = '';
        snap.forEach(doc => {
            const g = doc.data();
            html += `
                <div class="gallery-item" onclick="openModal('${g.url}','${(g.caption || '').replace(/'/g, "\\'")}')">
                    <img src="${g.url}" alt="${g.caption || ''}" onerror="this.parentElement.style.display='none'">
                    <p>${g.caption || ''}</p>
                </div>`;
        });
        grid.innerHTML = html;
    }).catch(err => console.error(err));
}

// Image Modal
function openModal(url, caption) {
    const modal = document.getElementById('imageModal');
    document.getElementById('modalImg').src = url;
    document.getElementById('modalCaption').textContent = caption;
    modal.style.display = 'flex';
}

// ============================================
// STUDENT COUNT
// ============================================
function loadStudentCount() {
    db.collection('students').get().then(snap => {
        document.getElementById('statStudents').textContent = snap.size;
    }).catch(err => console.error(err));
}

// ============================================
// SEND MESSAGE
// ============================================
function sendMessage() {
    const name = document.getElementById('msgName').value.trim();
    const phone = document.getElementById('msgPhone').value.trim();
    const text = document.getElementById('msgText').value.trim();
    const status = document.getElementById('msgStatus');

    if (!name || !text) {
        status.textContent = 'নাম ও মেসেজ লিখুন | Enter name & message';
        status.style.color = '#c62828';
        return;
    }

    status.textContent = 'পাঠানো হচ্ছে...';
    status.style.color = '#888';

    db.collection('messages').add({
        name, phone, text,
        date: new Date().toISOString(),
        read: false
    }).then(() => {
        status.textContent = '✅ মেসেজ পাঠানো হয়েছে! | Message sent!';
        status.style.color = '#2e7d32';
        document.getElementById('msgName').value = '';
        document.getElementById('msgPhone').value = '';
        document.getElementById('msgText').value = '';
    }).catch(err => {
        status.textContent = '❌ সমস্যা হয়েছে | Error';
        status.style.color = '#c62828';
    });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadSiteSettings();
    loadNotices();
    loadTeachers();
    loadGallery();
    loadStudentCount();
});
