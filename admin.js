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
const auth = firebase.auth();

// ============================================
// AUTH - LOGIN / LOGOUT
// ============================================
function adminLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    const err = document.getElementById('loginError');

    if (!email || !pass) { err.textContent = 'ইমেইল ও পাসওয়ার্ড দিন!'; return; }

    err.textContent = 'লগইন হচ্ছে...';
    err.style.color = '#888';

    auth.signInWithEmailAndPassword(email, pass).then(() => {
        showAdminPanel();
    }).catch(e => {
        err.textContent = '❌ লগইন ব্যর্থ! ইমেইল বা পাসওয়ার্ড ভুল।';
        err.style.color = '#c62828';
    });
}

function adminLogout() {
    auth.signOut().then(() => {
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    });
}

auth.onAuthStateChanged(user => {
    if (user) showAdminPanel();
});

function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadSettingsForm();
    loadAdminNotices();
    loadAdminTeachers();
    loadAdminGallery();
    loadAdminMessages();
}

// ============================================
// TAB SWITCH
// ============================================
function showTab(tabId, btn) {
    document.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

// ============================================
// SETTINGS - SAVE & LOAD
// ============================================
function saveSettings() {
    const msg = document.getElementById('settingsMsg');
    msg.textContent = 'সেভ হচ্ছে...';
    msg.className = '';
    msg.style.color = '#888';

    const data = {
        nameBn: document.getElementById('setNameBn').value.trim(),
        nameEn: document.getElementById('setNameEn').value.trim(),
        location: document.getElementById('setLocation').value.trim(),
        logo: document.getElementById('setLogo').value.trim(),
        phone: document.getElementById('setPhone').value.trim(),
        email: document.getElementById('setEmail').value.trim(),
        address: document.getElementById('setAddress').value.trim(),
        heroTitle: document.getElementById('setHeroTitle').value.trim(),
        heroSubtitle: document.getElementById('setHeroSubtitle').value.trim(),
        heroSlogan: document.getElementById('setHeroSlogan').value.trim(),
        heroSloganEn: document.getElementById('setHeroSloganEn').value.trim(),
        heroBg: document.getElementById('setHeroBg').value.trim(),
        headerColor: document.getElementById('setHeaderColor').value.trim(),
        aboutText1: document.getElementById('setAbout1').value.trim(),
        aboutText2: document.getElementById('setAbout2').value.trim(),
        aboutText3: document.getElementById('setAbout3').value.trim(),
        statClasses: document.getElementById('setStatClasses').value.trim(),
        statPassRate: document.getElementById('setStatPassRate').value.trim(),
        footerText: document.getElementById('setFooterText').value.trim(),
        updatedAt: new Date().toISOString()
    };

    // Remove empty fields
    Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });

    db.collection('settings').doc('site').set(data, { merge: true }).then(() => {
        msg.textContent = '✅ সেটিংস সেভ হয়েছে! ওয়েবসাইট রিফ্রেশ করলেই পরিবর্তন দেখাবে।';
        msg.className = 'msg-success';
    }).catch(e => {
        msg.textContent = '❌ সমস্যা হয়েছে!';
        msg.className = 'msg-error';
    });
}

function loadSettingsForm() {
    db.collection('settings').doc('site').get().then(doc => {
        if (!doc.exists) return;
        const s = doc.data();
        if (s.nameBn) document.getElementById('setNameBn').value = s.nameBn;
        if (s.nameEn) document.getElementById('setNameEn').value = s.nameEn;
        if (s.location) document.getElementById('setLocation').value = s.location;
        if (s.logo) document.getElementById('setLogo').value = s.logo;
        if (s.phone) document.getElementById('setPhone').value = s.phone;
        if (s.email) document.getElementById('setEmail').value = s.email;
        if (s.address) document.getElementById('setAddress').value = s.address;
        if (s.heroTitle) document.getElementById('setHeroTitle').value = s.heroTitle;
        if (s.heroSubtitle) document.getElementById('setHeroSubtitle').value = s.heroSubtitle;
        if (s.heroSlogan) document.getElementById('setHeroSlogan').value = s.heroSlogan;
        if (s.heroSloganEn) document.getElementById('setHeroSloganEn').value = s.heroSloganEn;
        if (s.heroBg) document.getElementById('setHeroBg').value = s.heroBg;
        if (s.headerColor) document.getElementById('setHeaderColor').value = s.headerColor;
        if (s.aboutText1) document.getElementById('setAbout1').value = s.aboutText1;
        if (s.aboutText2) document.getElementById('setAbout2').value = s.aboutText2;
        if (s.aboutText3) document.getElementById('setAbout3').value = s.aboutText3;
        if (s.statClasses) document.getElementById('setStatClasses').value = s.statClasses;
        if (s.statPassRate) document.getElementById('setStatPassRate').value = s.statPassRate;
        if (s.footerText) document.getElementById('setFooterText').value = s.footerText;
    });
}

// ============================================
// NOTICE - ADD, LOAD, DELETE
// ============================================
function addNotice() {
    const msg = document.getElementById('noticeMsg');
    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();
    const date = document.getElementById('noticeDate').value || new Date().toISOString().split('T')[0];

    if (!title) { msg.textContent = 'শিরোনাম দিন!'; msg.className = 'msg-error'; return; }

    db.collection('notices').add({
        title, content, date,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        msg.textContent = '✅ নোটিশ যোগ হয়েছে!';
        msg.className = 'msg-success';
        document.getElementById('noticeTitle').value = '';
        document.getElementById('noticeContent').value = '';
        loadAdminNotices();
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadAdminNotices() {
    db.collection('notices').orderBy('date', 'desc').get().then(snap => {
        const div = document.getElementById('adminNoticeList');
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো নোটিশ নেই</p>'; return; }

        let html = '<table class="data-table"><thead><tr><th>তারিখ</th><th>শিরোনাম</th><th>বিস্তারিত</th><th>মুছুন</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const n = doc.data();
            html += `<tr>
                <td>${n.date || ''}</td>
                <td>${n.title || ''}</td>
                <td>${(n.content || '').substring(0, 50)}...</td>
                <td><button class="btn-delete" onclick="deleteDoc('notices','${doc.id}',loadAdminNotices)">🗑️</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        div.innerHTML = html;
    });
}

// ============================================
// STUDENT - ADD, LOAD, DELETE
// ============================================
function addStudent() {
    const msg = document.getElementById('stuMsg');
    const data = {
        nameBn: document.getElementById('stuNameBn').value.trim(),
        name: document.getElementById('stuName').value.trim(),
        class: document.getElementById('stuClass').value,
        roll: document.getElementById('stuRoll').value.trim(),
        fatherName: document.getElementById('stuFather').value.trim(),
        motherName: document.getElementById('stuMother').value.trim(),
        dob: document.getElementById('stuDOB').value,
        phone: document.getElementById('stuPhone').value.trim(),
        address: document.getElementById('stuAddress').value.trim(),
        blood: document.getElementById('stuBlood').value,
        photo: document.getElementById('stuPhoto').value.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!data.nameBn && !data.name) { msg.textContent = 'নাম দিন!'; msg.className = 'msg-error'; return; }
    if (!data.roll) { msg.textContent = 'রোল দিন!'; msg.className = 'msg-error'; return; }

    msg.textContent = 'যোগ হচ্ছে...'; msg.style.color = '#888';

    db.collection('students').add(data).then(() => {
        msg.textContent = '✅ শিক্ষার্থী যোগ হয়েছে!';
        msg.className = 'msg-success';
        ['stuNameBn','stuName','stuRoll','stuFather','stuMother','stuPhone','stuAddress','stuPhoto'].forEach(id => {
            document.getElementById(id).value = '';
        });
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadAdminStudents() {
    const cls = document.getElementById('viewStuClass').value;
    const div = document.getElementById('adminStudentList');
    if (!cls) { div.innerHTML = ''; return; }

    div.innerHTML = '<p style="color:#888;">লোড হচ্ছে...</p>';

    db.collection('students').where('class', '==', cls).get().then(snap => {
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">এই ক্লাসে কোনো শিক্ষার্থী নেই</p>'; return; }

        let html = '<table class="data-table"><thead><tr><th>রোল</th><th>নাম</th><th>পিতা</th><th>ফোন</th><th>মুছুন</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const s = doc.data();
            html += `<tr>
                <td>${s.roll || ''}</td>
                <td>${s.nameBn || s.name || ''}</td>
                <td>${s.fatherName || '-'}</td>
                <td>${s.phone || '-'}</td>
                <td><button class="btn-delete" onclick="deleteDoc('students','${doc.id}',loadAdminStudents)">🗑️</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        div.innerHTML = html;
    });
}

// ============================================
// RESULT - ADD, LOAD, DELETE
// ============================================
function addResult() {
    const msg = document.getElementById('resMsg');
    const studentName = document.getElementById('resStudentName').value.trim();
    const roll = document.getElementById('resRoll').value.trim();

    if (!studentName || !roll) { msg.textContent = 'নাম ও রোল দিন!'; msg.className = 'msg-error'; return; }

    const subjectMap = {
        'বাংলা | Bangla': 'resBangla',
        'ইংরেজি | English': 'resEnglish',
        'গণিত | Math': 'resMath',
        'বিজ্ঞান | Science': 'resScience',
        'সমাজ | Social Studies': 'resSocial',
        'ইসলাম শিক্ষা | Islam': 'resIslam',
        'আরবি | Arabic': 'resArabic',
        'কুরআন | Quran': 'resQuran',
        'হাদীস | Hadith': 'resHadith',
        'ফিকহ | Fiqh': 'resFiqh',
        'উর্দু | Urdu': 'resUrdu',
        'ফারসি | Farsi': 'resFarsi',
        'ICT': 'resICT',
        'সাধারণ জ্ঞান | GK': 'resGK',
        'শারীরিক শিক্ষা | PE': 'resPE'
    };

    const subjects = {};
    for (let sub in subjectMap) {
        const val = document.getElementById(subjectMap[sub]).value;
        if (val !== '' && val !== null) subjects[sub] = parseInt(val);
    }

    if (Object.keys(subjects).length === 0) {
        msg.textContent = 'অন্তত একটি বিষয়ের নম্বর দিন!';
        msg.className = 'msg-error';
        return;
    }

    const data = {
        class: document.getElementById('resClass').value,
        exam: document.getElementById('resExam').value,
        studentName, roll, subjects,
        photo: document.getElementById('resPhoto').value.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    msg.textContent = 'যোগ হচ্ছে...'; msg.style.color = '#888';

    db.collection('results').add(data).then(() => {
        msg.textContent = '✅ ফলাফল যোগ হয়েছে!';
        msg.className = 'msg-success';
        ['resStudentName','resRoll','resBangla','resEnglish','resMath','resScience','resSocial','resIslam','resArabic','resQuran','resHadith','resFiqh','resUrdu','resFarsi','resICT','resGK','resPE','resPhoto'].forEach(id => {
            document.getElementById(id).value = '';
        });
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadAdminResults() {
    const cls = document.getElementById('viewResClass').value;
    const exam = document.getElementById('viewResExam').value;
    const div = document.getElementById('adminResultList');

    if (!cls || !exam) { div.innerHTML = '<p style="color:#888;">ক্লাস ও পরীক্ষা নির্বাচন করুন</p>'; return; }

    div.innerHTML = '<p style="color:#888;">লোড হচ্ছে...</p>';

    db.collection('results').where('class', '==', cls).where('exam', '==', exam).get().then(snap => {
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো ফলাফল নেই</p>'; return; }

        let html = '<table class="data-table"><thead><tr><th>রোল</th><th>নাম</th><th>মোট</th><th>মুছুন</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const r = doc.data();
            let total = 0;
            for (let s in (r.subjects || {})) total += parseInt(r.subjects[s]) || 0;
            html += `<tr>
                <td>${r.roll || ''}</td>
                <td>${r.studentName || ''}</td>
                <td>${total}</td>
                <td><button class="btn-delete" onclick="deleteDoc('results','${doc.id}',loadAdminResults)">🗑️</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        div.innerHTML = html;
    });
}

// ============================================
// TEACHER - ADD, LOAD, DELETE
// ============================================
function addTeacher() {
    const msg = document.getElementById('tchMsg');
    const data = {
        nameBn: document.getElementById('tchNameBn').value.trim(),
        name: document.getElementById('tchName').value.trim(),
        designation: document.getElementById('tchDesignation').value.trim(),
        subject: document.getElementById('tchSubject').value.trim(),
        phone: document.getElementById('tchPhone').value.trim(),
        photo: document.getElementById('tchPhoto').value.trim(),
        order: parseInt(document.getElementById('tchOrder').value) || 1,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!data.nameBn && !data.name) { msg.textContent = 'নাম দিন!'; msg.className = 'msg-error'; return; }

    db.collection('teachers').add(data).then(() => {
        msg.textContent = '✅ শিক্ষক যোগ হয়েছে!';
        msg.className = 'msg-success';
        ['tchNameBn','tchName','tchDesignation','tchSubject','tchPhone','tchPhoto'].forEach(id => {
            document.getElementById(id).value = '';
        });
        loadAdminTeachers();
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadAdminTeachers() {
    db.collection('teachers').orderBy('order', 'asc').get().then(snap => {
        const div = document.getElementById('adminTeacherList');
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো শিক্ষক নেই</p>'; return; }

        let html = '<table class="data-table"><thead><tr><th>ক্রম</th><th>নাম</th><th>পদবি</th><th>বিষয়</th><th>মুছুন</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const t = doc.data();
            html += `<tr>
                <td>${t.order || ''}</td>
                <td>${t.nameBn || t.name || ''}</td>
                <td>${t.designation || '-'}</td>
                <td>${t.subject || '-'}</td>
                <td><button class="btn-delete" onclick="deleteDoc('teachers','${doc.id}',loadAdminTeachers)">🗑️</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        div.innerHTML = html;
    });
}

// ============================================
// GALLERY - ADD, LOAD, DELETE
// ============================================
function addGallery() {
    const msg = document.getElementById('galMsg');
    const url = document.getElementById('galURL').value.trim();
    const caption = document.getElementById('galCaption').value.trim();

    if (!url) { msg.textContent = 'ছবির লিংক দিন!'; msg.className = 'msg-error'; return; }

    db.collection('gallery').add({
        url, caption,
        date: new Date().toISOString(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        msg.textContent = '✅ ফটো যোগ হয়েছে!';
        msg.className = 'msg-success';
        document.getElementById('galURL').value = '';
        document.getElementById('galCaption').value = '';
        loadAdminGallery();
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadAdminGallery() {
    db.collection('gallery').orderBy('date', 'desc').get().then(snap => {
        const div = document.getElementById('adminGalleryList');
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো ফটো নেই</p>'; return; }

        let html = '';
        snap.forEach(doc => {
            const g = doc.data();
            html += `
                <div class="admin-gallery-item">
                    <img src="${g.url}" onerror="this.src='https://via.placeholder.com/150?text=Error'">
                    <p>${g.caption || ''}</p>
                    <button class="del-btn" onclick="deleteDoc('gallery','${doc.id}',loadAdminGallery)">✕</button>
                </div>`;
        });
        div.innerHTML = html;
    });
}

// ============================================
// MESSAGES - LOAD, DELETE
// ============================================
function loadAdminMessages() {
    db.collection('messages').orderBy('date', 'desc').get().then(snap => {
        const div = document.getElementById('adminMessageList');
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো মেসেজ নেই</p>'; return; }

        let html = '';
        snap.forEach(doc => {
            const m = doc.data();
            const d = m.date ? new Date(m.date).toLocaleDateString('bn-BD') + ' ' + new Date(m.date).toLocaleTimeString('bn-BD') : '';
            html += `
                <div class="message-card">
                    <div class="msg-header">
                        <div><strong>${m.name || ''}</strong> <span style="color:#2d8a4e;">${m.phone || ''}</span></div>
                        <span class="msg-date">${d}</span>
                    </div>
                    <p style="margin:5px 0;">${m.text || ''}</p>
                    <button class="btn-delete" onclick="deleteDoc('messages','${doc.id}',loadAdminMessages)">🗑️ মুছুন</button>
                </div>`;
        });
        div.innerHTML = html;
    });
}

// ============================================
// DELETE DOCUMENT (UNIVERSAL)
// ============================================
function deleteDoc(collection, id, callback) {
    if (!confirm('মুছে ফেলতে চান? এটা ফেরত আনা যাবে না! | Are you sure?')) return;

    db.collection(collection).doc(id).delete().then(() => {
        if (callback) callback();
    }).catch(e => alert('মুছতে সমস্যা হয়েছে!'));
}
