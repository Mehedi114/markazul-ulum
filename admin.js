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
// AUTH
// ============================================
function adminLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    const err = document.getElementById('loginError');
    if (!email || !pass) { err.textContent = 'ইমেইল ও পাসওয়ার্ড দিন!'; return; }
    err.textContent = 'লগইন হচ্ছে...'; err.style.color = '#888';
    auth.signInWithEmailAndPassword(email, pass).then(() => showAdminPanel())
        .catch(e => { err.textContent = '❌ লগইন ব্যর্থ!'; err.style.color = '#c62828'; });
}

function adminLogout() {
    auth.signOut().then(() => {
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    });
}

auth.onAuthStateChanged(user => { if (user) showAdminPanel(); });

function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadSettingsForm();
    loadShowcaseSettings();
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
// SETTINGS
// ============================================
function saveSettings() {
    const msg = document.getElementById('settingsMsg');
    msg.textContent = 'সেভ হচ্ছে...'; msg.style.color = '#888';
    const data = {};
    const fields = ['setNameBn:nameBn','setNameEn:nameEn','setLocation:location','setLogo:logo',
        'setPhone:phone','setEmail:email','setAddress:address','setHeroTitle:heroTitle',
        'setHeroSubtitle:heroSubtitle','setHeroSlogan:heroSlogan','setHeroSloganEn:heroSloganEn',
        'setHeroBg:heroBg','setHeaderColor:headerColor','setStatClasses:statClasses',
        'setStatPassRate:statPassRate','setFooterText:footerText'];
    fields.forEach(f => {
        const [id, key] = f.split(':');
        const val = document.getElementById(id).value.trim();
        if (val) data[key] = val;
    });
    ['setAbout1:aboutText1','setAbout2:aboutText2','setAbout3:aboutText3'].forEach(f => {
        const [id, key] = f.split(':');
        const val = document.getElementById(id).value.trim();
        if (val) data[key] = val;
    });
    data.updatedAt = new Date().toISOString();
    db.collection('settings').doc('site').set(data, { merge: true }).then(() => {
        msg.textContent = '✅ সেভ হয়েছে!'; msg.className = 'msg-success';
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadSettingsForm() {
    db.collection('settings').doc('site').get().then(doc => {
        if (!doc.exists) return;
        const s = doc.data();
        const map = {setNameBn:'nameBn',setNameEn:'nameEn',setLocation:'location',setLogo:'logo',
            setPhone:'phone',setEmail:'email',setAddress:'address',setHeroTitle:'heroTitle',
            setHeroSubtitle:'heroSubtitle',setHeroSlogan:'heroSlogan',setHeroSloganEn:'heroSloganEn',
            setHeroBg:'heroBg',setHeaderColor:'headerColor',setAbout1:'aboutText1',setAbout2:'aboutText2',
            setAbout3:'aboutText3',setStatClasses:'statClasses',setStatPassRate:'statPassRate',
            setFooterText:'footerText'};
        for (let id in map) { if (s[map[id]]) document.getElementById(id).value = s[map[id]]; }
    });
}

// ============================================
// SHOWCASE SETTINGS
// ============================================
function saveShowcase() {
    const msg = document.getElementById('showcaseMsg');
    db.collection('settings').doc('showcase').set({
        exam: document.getElementById('showcaseExam').value,
        title: document.getElementById('showcaseTitle').value.trim(),
        updatedAt: new Date().toISOString()
    }).then(() => {
        msg.textContent = '✅ শোকেস সেটিংস সেভ হয়েছে!'; msg.className = 'msg-success';
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadShowcaseSettings() {
    db.collection('settings').doc('showcase').get().then(doc => {
        if (!doc.exists) return;
        const s = doc.data();
        if (s.exam) document.getElementById('showcaseExam').value = s.exam;
        if (s.title) document.getElementById('showcaseTitle').value = s.title;
    });
}

// ============================================
// NOTICE
// ============================================
function addNotice() {
    const msg = document.getElementById('noticeMsg');
    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();
    const date = document.getElementById('noticeDate').value || new Date().toISOString().split('T')[0];
    if (!title) { msg.textContent = 'শিরোনাম দিন!'; msg.className = 'msg-error'; return; }
    db.collection('notices').add({ title, content, date, timestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
        msg.textContent = '✅ নোটিশ যোগ হয়েছে!'; msg.className = 'msg-success';
        document.getElementById('noticeTitle').value = ''; document.getElementById('noticeContent').value = '';
        loadAdminNotices();
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadAdminNotices() {
    db.collection('notices').orderBy('date', 'desc').get().then(snap => {
        const div = document.getElementById('adminNoticeList');
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো নোটিশ নেই</p>'; return; }
        let html = '<table class="data-table"><thead><tr><th>তারিখ</th><th>শিরোনাম</th><th>মুছুন</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const n = doc.data();
            html += `<tr><td>${n.date||''}</td><td>${n.title||''}</td><td><button class="btn-delete" onclick="deleteDoc('notices','${doc.id}',loadAdminNotices)">🗑️</button></td></tr>`;
        });
        div.innerHTML = html + '</tbody></table>';
    });
}

// ============================================
// STUDENT
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
        msg.textContent = '✅ শিক্ষার্থী যোগ হয়েছে!'; msg.className = 'msg-success';
        ['stuNameBn','stuName','stuRoll','stuFather','stuMother','stuPhone','stuAddress','stuPhoto'].forEach(id => document.getElementById(id).value = '');
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadAdminStudents() {
    const cls = document.getElementById('viewStuClass').value;
    const div = document.getElementById('adminStudentList');
    if (!cls) { div.innerHTML = ''; return; }
    div.innerHTML = '<p style="color:#888;">লোড হচ্ছে...</p>';
    db.collection('students').where('class', '==', cls).get().then(snap => {
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো শিক্ষার্থী নেই</p>'; return; }
        let html = '<table class="data-table"><thead><tr><th>রোল</th><th>নাম</th><th>পিতা</th><th>ফোন</th><th>মুছুন</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const s = doc.data();
            html += `<tr><td>${s.roll||''}</td><td>${s.nameBn||s.name||''}</td><td>${s.fatherName||'-'}</td><td>${s.phone||'-'}</td><td><button class="btn-delete" onclick="deleteDoc('students','${doc.id}',loadAdminStudents)">🗑️</button></td></tr>`;
        });
        div.innerHTML = html + '</tbody></table>';
    });
}

// ============================================
// ★★★ QUICK RESULT - Student list থেকে দ্রুত ★★★
// ============================================
function loadQuickStudents() {
    const cls = document.getElementById('qrClass').value;
    const div = document.getElementById('quickStudentList');
    if (!cls) { div.innerHTML = ''; return; }

    div.innerHTML = '<p style="color:#888;">শিক্ষার্থী তালিকা লোড হচ্ছে...</p>';

    db.collection('students').where('class', '==', cls).get().then(snap => {
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">এই ক্লাসে কোনো শিক্ষার্থী নেই। আগে শিক্ষার্থী যোগ করুন।</p>'; return; }

        let html = '';
        snap.forEach(doc => {
            const s = doc.data();
            html += `
            <div class="quick-result-box" id="qr-${doc.id}">
                <h4>📝 ${s.nameBn || s.name} | রোল: ${s.roll}</h4>
                <div class="form-row-3">
                    <div class="form-group"><label>বাংলা</label><input type="number" class="qr-sub" data-sub="বাংলা" min="0" max="100"></div>
                    <div class="form-group"><label>ইংরেজি</label><input type="number" class="qr-sub" data-sub="ইংরেজি" min="0" max="100"></div>
                    <div class="form-group"><label>গণিত</label><input type="number" class="qr-sub" data-sub="গণিত" min="0" max="100"></div>
                    <div class="form-group"><label>বিজ্ঞান</label><input type="number" class="qr-sub" data-sub="বিজ্ঞান" min="0" max="100"></div>
                    <div class="form-group"><label>সমাজ</label><input type="number" class="qr-sub" data-sub="সমাজ" min="0" max="100"></div>
                    <div class="form-group"><label>ইসলাম</label><input type="number" class="qr-sub" data-sub="ইসলাম শিক্ষা" min="0" max="100"></div>
                    <div class="form-group"><label>আরবি</label><input type="number" class="qr-sub" data-sub="আরবি" min="0" max="100"></div>
                    <div class="form-group"><label>কুরআন</label><input type="number" class="qr-sub" data-sub="কুরআন" min="0" max="100"></div>
                    <div class="form-group"><label>হাদীস</label><input type="number" class="qr-sub" data-sub="হাদীস" min="0" max="100"></div>
                </div>
                <button onclick="saveQuickResult('${doc.id}','${(s.nameBn||s.name||'').replace(/'/g,"\\'")}','${s.roll}','${s.photo||''}')" class="btn btn-sm">💾 সেভ করুন</button>
                <span id="qrMsg-${doc.id}" style="margin-left:10px;font-weight:600;"></span>
            </div>`;
        });

        div.innerHTML = html;
    });
}

function saveQuickResult(stuId, stuName, roll, photo) {
    const cls = document.getElementById('qrClass').value;
    const exam = document.getElementById('qrExam').value;
    const msg = document.getElementById('qrMsg-' + stuId);
    const box = document.getElementById('qr-' + stuId);
    const inputs = box.querySelectorAll('.qr-sub');

    const subjects = {};
    inputs.forEach(inp => {
        if (inp.value !== '') subjects[inp.dataset.sub] = parseInt(inp.value);
    });

    if (Object.keys(subjects).length === 0) {
        msg.textContent = '❌ নম্বর দিন!'; msg.style.color = '#c62828'; return;
    }

    msg.textContent = 'সেভ হচ্ছে...'; msg.style.color = '#888';

    // Check if result already exists, if yes update, else create
    db.collection('results')
        .where('class', '==', cls).where('exam', '==', exam).where('roll', '==', roll)
        .get().then(snap => {
            const data = { class: cls, exam, studentName: stuName, roll, subjects, photo, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
            if (snap.empty) {
                return db.collection('results').add(data);
            } else {
                return db.collection('results').doc(snap.docs[0].id).update({ subjects, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            }
        }).then(() => {
            msg.textContent = '✅ সেভ হয়েছে!'; msg.style.color = '#2e7d32';
        }).catch(e => {
            msg.textContent = '❌ সমস্যা!'; msg.style.color = '#c62828';
        });
}

// ============================================
// FULL RESULT
// ============================================
function addResult() {
    const msg = document.getElementById('resMsg');
    const studentName = document.getElementById('resStudentName').value.trim();
    const roll = document.getElementById('resRoll').value.trim();
    if (!studentName || !roll) { msg.textContent = 'নাম ও রোল দিন!'; msg.className = 'msg-error'; return; }

    const subjectMap = {
        'বাংলা':'resBangla','ইংরেজি':'resEnglish','গণিত':'resMath','বিজ্ঞান':'resScience',
        'সমাজ':'resSocial','ইসলাম শিক্ষা':'resIslam','আরবি':'resArabic','কুরআন':'resQuran',
        'হাদীস':'resHadith','ফিকহ':'resFiqh','উর্দু':'resUrdu','ফারসি':'resFarsi',
        'ICT':'resICT','সাধারণ জ্ঞান':'resGK','শারীরিক শিক্ষা':'resPE'
    };
    const subjects = {};
    for (let sub in subjectMap) {
        const val = document.getElementById(subjectMap[sub]).value;
        if (val !== '') subjects[sub] = parseInt(val);
    }
    if (Object.keys(subjects).length === 0) { msg.textContent = 'নম্বর দিন!'; msg.className = 'msg-error'; return; }

    const data = {
        class: document.getElementById('resClass').value,
        exam: document.getElementById('resExam').value,
        studentName, roll, subjects,
        photo: document.getElementById('resPhoto').value.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    msg.textContent = 'যোগ হচ্ছে...'; msg.style.color = '#888';
    db.collection('results').add(data).then(() => {
        msg.textContent = '✅ ফলাফল যোগ হয়েছে!'; msg.className = 'msg-success';
        ['resStudentName','resRoll','resBangla','resEnglish','resMath','resScience','resSocial','resIslam','resArabic','resQuran','resHadith','resFiqh','resUrdu','resFarsi','resICT','resGK','resPE','resPhoto'].forEach(id => document.getElementById(id).value = '');
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
            const r = doc.data(); let total = 0;
            for (let s in (r.subjects||{})) total += parseInt(r.subjects[s])||0;
            html += `<tr><td>${r.roll||''}</td><td>${r.studentName||''}</td><td>${total}</td><td><button class="btn-delete" onclick="deleteDoc('results','${doc.id}',loadAdminResults)">🗑️</button></td></tr>`;
        });
        div.innerHTML = html + '</tbody></table>';
    });
}

// ============================================
// TEACHER - ADD, EDIT, DELETE
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
        msg.textContent = '✅ শিক্ষক যোগ হয়েছে!'; msg.className = 'msg-success';
        ['tchNameBn','tchName','tchDesignation','tchSubject','tchPhone','tchPhoto'].forEach(id => document.getElementById(id).value = '');
        loadAdminTeachers();
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadAdminTeachers() {
    db.collection('teachers').orderBy('order', 'asc').get().then(snap => {
        const div = document.getElementById('adminTeacherList');
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো শিক্ষক নেই</p>'; return; }
        let html = '<table class="data-table"><thead><tr><th>ক্রম</th><th>নাম</th><th>পদবি</th><th>বিষয়</th><th>এডিট</th><th>মুছুন</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const t = doc.data();
            html += `<tr>
                <td>${t.order||''}</td>
                <td>${t.nameBn||t.name||''}</td>
                <td>${t.designation||'-'}</td>
                <td>${t.subject||'-'}</td>
                <td><button class="btn-edit" onclick="editTeacher('${doc.id}')">✏️</button></td>
                <td><button class="btn-delete" onclick="deleteDoc('teachers','${doc.id}',loadAdminTeachers)">🗑️</button></td>
            </tr>`;
        });
        div.innerHTML = html + '</tbody></table>';
    });
}

// ============================================
// TEACHER EDIT MODAL
// ============================================
function editTeacher(id) {
    db.collection('teachers').doc(id).get().then(doc => {
        if (!doc.exists) return;
        const t = doc.data();
        document.getElementById('editModalTitle').textContent = '✏️ শিক্ষক এডিট করুন';
        document.getElementById('editModalBody').innerHTML = `
            <div class="form-row">
                <div class="form-group"><label>নাম (বাংলা)</label><input type="text" id="editTchNameBn" value="${t.nameBn||''}"></div>
                <div class="form-group"><label>Name (English)</label><input type="text" id="editTchName" value="${t.name||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>পদবি</label><input type="text" id="editTchDesignation" value="${t.designation||''}"></div>
                <div class="form-group"><label>বিষয়</label><input type="text" id="editTchSubject" value="${t.subject||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>ফোন</label><input type="text" id="editTchPhone" value="${t.phone||''}"></div>
                <div class="form-group"><label>ক্রম</label><input type="number" id="editTchOrder" value="${t.order||1}" min="1"></div>
            </div>
            <div class="form-group"><label>ছবির লিংক</label><input type="text" id="editTchPhoto" value="${t.photo||''}"></div>
            <button onclick="saveEditTeacher('${id}')" class="btn" style="margin-top:10px;">💾 আপডেট করুন</button>
            <p id="editTchMsg"></p>
        `;
        document.getElementById('editModal').style.display = 'flex';
    });
}

function saveEditTeacher(id) {
    const msg = document.getElementById('editTchMsg');
    const data = {
        nameBn: document.getElementById('editTchNameBn').value.trim(),
        name: document.getElementById('editTchName').value.trim(),
        designation: document.getElementById('editTchDesignation').value.trim(),
        subject: document.getElementById('editTchSubject').value.trim(),
        phone: document.getElementById('editTchPhone').value.trim(),
        photo: document.getElementById('editTchPhoto').value.trim(),
        order: parseInt(document.getElementById('editTchOrder').value) || 1
    };
    db.collection('teachers').doc(id).update(data).then(() => {
        msg.textContent = '✅ আপডেট হয়েছে!'; msg.style.color = '#2e7d32';
        loadAdminTeachers();
        setTimeout(() => closeEditModal(), 1500);
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.style.color = '#c62828'; });
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// ============================================
// GALLERY
// ============================================
function addGallery() {
    const msg = document.getElementById('galMsg');
    const url = document.getElementById('galURL').value.trim();
    const caption = document.getElementById('galCaption').value.trim();
    if (!url) { msg.textContent = 'লিংক দিন!'; msg.className = 'msg-error'; return; }
    db.collection('gallery').add({ url, caption, date: new Date().toISOString(), timestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
        msg.textContent = '✅ ফটো যোগ হয়েছে!'; msg.className = 'msg-success';
        document.getElementById('galURL').value = ''; document.getElementById('galCaption').value = '';
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
            html += `<div class="admin-gallery-item">
                <img src="${g.url}" onerror="this.src='https://via.placeholder.com/150?text=Error'">
                <p>${g.caption||''}</p>
                <button class="del-btn" onclick="deleteDoc('gallery','${doc.id}',loadAdminGallery)">✕</button>
            </div>`;
        });
        div.innerHTML = html;
    });
}

// ============================================
// MESSAGES
// ============================================
function loadAdminMessages() {
    db.collection('messages').orderBy('date', 'desc').get().then(snap => {
        const div = document.getElementById('adminMessageList');
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো মেসেজ নেই</p>'; return; }
        let html = '';
        snap.forEach(doc => {
            const m = doc.data();
            const d = m.date ? new Date(m.date).toLocaleDateString('bn-BD') : '';
            html += `<div class="message-card">
                <div class="msg-header"><div><strong>${m.name||''}</strong> <span style="color:#2d8a4e;">${m.phone||''}</span></div><span class="msg-date">${d}</span></div>
                <p style="margin:5px 0;">${m.text||''}</p>
                <button class="btn-delete" onclick="deleteDoc('messages','${doc.id}',loadAdminMessages)">🗑️ মুছুন</button>
            </div>`;
        });
        div.innerHTML = html;
    });
}

// ============================================
// DELETE
// ============================================
function deleteDoc(col, id, cb) {
    if (!confirm('মুছে ফেলতে চান?')) return;
    db.collection(col).doc(id).delete().then(() => { if (cb) cb(); }).catch(e => alert('সমস্যা!'));
}
