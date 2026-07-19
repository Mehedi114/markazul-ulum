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
// IMGBB API KEY - PHOTO UPLOAD
// ============================================
const IMGBB_API_KEY = "b2ca23b16c7cdc5b0e3f3d0420ba606f";

// ============================================
// AUTO CROP + UPLOAD TO IMGBB
// ============================================
async function uploadPhotoToImgBB(file, statusElId, hiddenInputId, previewId, cropType) {
    const statusEl = document.getElementById(statusElId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const preview = document.getElementById(previewId);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
        statusEl.textContent = '❌ ছবির সাইজ ১০MB এর কম হতে হবে!';
        statusEl.style.color = '#c62828';
        return;
    }
    
    statusEl.textContent = '⏳ ছবি প্রসেস হচ্ছে...';
    statusEl.style.color = '#1976d2';
    
    // Auto crop
    const croppedBlob = await cropImage(file, cropType);
    
    statusEl.textContent = '⏳ আপলোড হচ্ছে...';
    
    const formData = new FormData();
    formData.append('image', croppedBlob);
    
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST', body: formData
        });
        const data = await response.json();
        if (data.success) {
            hiddenInput.value = data.data.url;
            preview.src = data.data.url;
            preview.style.display = 'block';
            statusEl.textContent = '✅ ছবি আপলোড হয়েছে!';
            statusEl.style.color = '#2e7d32';
        } else {
            statusEl.textContent = '❌ আপলোড ব্যর্থ!';
            statusEl.style.color = '#c62828';
        }
    } catch (err) {
        statusEl.textContent = '❌ সমস্যা!';
        statusEl.style.color = '#c62828';
    }
}

// ============================================
// IMAGE CROP FUNCTION
// ============================================
function cropImage(file, type) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let targetWidth, targetHeight, sx, sy, sWidth, sHeight;
                
                if (type === 'cover') {
                    // Cover: 16:6 aspect ratio (1600x600)
                    targetWidth = 1600;
                    targetHeight = 600;
                    const targetRatio = targetWidth / targetHeight;
                    const imgRatio = img.width / img.height;
                    
                    if (imgRatio > targetRatio) {
                        sHeight = img.height;
                        sWidth = img.height * targetRatio;
                        sx = (img.width - sWidth) / 2;
                        sy = 0;
                    } else {
                        sWidth = img.width;
                        sHeight = img.width / targetRatio;
                        sx = 0;
                        sy = (img.height - sHeight) / 2;
                    }
                } else if (type === 'logo') {
                    // Logo: Square (300x300)
                    targetWidth = 300;
                    targetHeight = 300;
                    const size = Math.min(img.width, img.height);
                    sx = (img.width - size) / 2;
                    sy = (img.height - size) / 2;
                    sWidth = size;
                    sHeight = size;
                } else {
                    // Default: Square (500x500) for students, teachers, gallery
                    targetWidth = 500;
                    targetHeight = 500;
                    const size = Math.min(img.width, img.height);
                    sx = (img.width - size) / 2;
                    sy = (img.height - size) / 2;
                    sWidth = size;
                    sHeight = size;
                }
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
                
                canvas.toBlob(function(blob) {
                    resolve(blob);
                }, 'image/jpeg', 0.9);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function uploadStudentPhoto(input) { uploadPhotoToImgBB(input.files[0], 'stuPhotoStatus', 'stuPhoto', 'stuPhotoPreview', 'square'); }
function uploadTeacherPhoto(input) { uploadPhotoToImgBB(input.files[0], 'tchPhotoStatus', 'tchPhoto', 'tchPhotoPreview', 'square'); }
function uploadGalleryPhoto(input) { uploadPhotoToImgBB(input.files[0], 'galPhotoStatus', 'galURL', 'galPhotoPreview', 'square'); }
function uploadEditStudentPhoto(input) { uploadPhotoToImgBB(input.files[0], 'editStuPhotoStatus', 'editStuPhoto', 'editStuPhotoPreview', 'square'); }
function uploadEditTeacherPhoto(input) { uploadPhotoToImgBB(input.files[0], 'editTchPhotoStatus', 'editTchPhoto', 'editTchPhotoPreview', 'square'); }
function uploadLogoPhoto(input) { uploadPhotoToImgBB(input.files[0], 'logoStatus', 'setLogo', 'logoPreview', 'logo'); }
function uploadCoverPhoto(input) { uploadPhotoToImgBB(input.files[0], 'coverStatus', 'setHeroBg', 'coverPreview', 'cover'); }
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
// UPDATE ADMIN RESULT FILTERS (Month/Year)
// ============================================
function updateAdminResultFilters() {
    const exam = document.getElementById('viewResExam').value;
    const monthSelect = document.getElementById('viewResMonth');
    const yearSelect = document.getElementById('viewResYear');
    
    if (exam === 'monthly') {
        monthSelect.style.display = 'inline-block';
        yearSelect.style.display = 'inline-block';
    } else if (exam === '1st-semester' || exam === '2nd-semester' || exam === 'yearly') {
        monthSelect.style.display = 'none';
        monthSelect.value = '';
        yearSelect.style.display = 'inline-block';
    } else {
        monthSelect.style.display = 'none';
        yearSelect.style.display = 'none';
        monthSelect.value = '';
        yearSelect.value = '';
    }
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
        
        // Show existing logo & cover preview
        if (s.logo) {
            const logoPrev = document.getElementById('logoPreview');
            if (logoPrev) { logoPrev.src = s.logo; logoPrev.style.display = 'block'; }
        }
        if (s.heroBg) {
            const coverPrev = document.getElementById('coverPreview');
            if (coverPrev) { coverPrev.src = s.heroBg; coverPrev.style.display = 'block'; }
        }
    });
}
// ============================================
// SHOWCASE
// ============================================
function saveShowcase() {
    const msg = document.getElementById('showcaseMsg');
    db.collection('settings').doc('showcase').set({
        exam: document.getElementById('showcaseExam').value,
        title: document.getElementById('showcaseTitle').value.trim(),
        updatedAt: new Date().toISOString()
    }).then(() => {
        msg.textContent = '✅ সেভ হয়েছে!'; msg.className = 'msg-success';
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
        document.getElementById('stuPhotoFile').value = '';
        document.getElementById('stuPhotoPreview').style.display = 'none';
        document.getElementById('stuPhotoStatus').textContent = '';
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.className = 'msg-error'; });
}

function loadAdminStudents() {
    const cls = document.getElementById('viewStuClass').value;
    const div = document.getElementById('adminStudentList');
    if (!cls) { div.innerHTML = ''; return; }
    div.innerHTML = '<p style="color:#888;">লোড হচ্ছে...</p>';
    db.collection('students').where('class', '==', cls).get().then(snap => {
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো শিক্ষার্থী নেই</p>'; return; }
        let students = [];
        snap.forEach(doc => {
            const s = doc.data();
            s.id = doc.id;
            students.push(s);
        });
        students.sort((a, b) => (parseInt(a.roll)||0) - (parseInt(b.roll)||0));
        let html = '<table class="data-table"><thead><tr><th>রোল</th><th>নাম</th><th>পিতা</th><th>ফোন</th><th>এডিট</th><th>মুছুন</th></tr></thead><tbody>';
        students.forEach(s => {
            html += `<tr>
                <td>${s.roll||''}</td>
                <td>${s.nameBn||s.name||''}</td>
                <td>${s.fatherName||'-'}</td>
                <td>${s.phone||'-'}</td>
                <td><button class="btn-edit" onclick="editStudent('${s.id}')">✏️</button></td>
                <td><button class="btn-delete" onclick="deleteDoc('students','${s.id}',loadAdminStudents)">🗑️</button></td>
            </tr>`;
        });
        div.innerHTML = html + '</tbody></table>';
    });
}

function editStudent(id) {
    db.collection('students').doc(id).get().then(doc => {
        if (!doc.exists) return;
        const s = doc.data();
        const classOpts = ['Play','Nursery','KG','1','2','3','4','5','6','7','8','9','10'];
        const classNames = {'Play':'প্লে','Nursery':'নার্সারি','KG':'কেজি','1':'ক্লাস ১','2':'ক্লাস ২','3':'ক্লাস ৩','4':'ক্লাস ৪','5':'ক্লাস ৫','6':'ক্লাস ৬','7':'ক্লাস ৭','8':'ক্লাস ৮','9':'ক্লাস ৯','10':'ক্লাস ১০'};
        let classOptions = '';
        classOpts.forEach(c => {
            classOptions += `<option value="${c}" ${s.class===c?'selected':''}>${classNames[c]}</option>`;
        });
        const bloods = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
        let bloodOptions = '<option value="">নির্বাচন</option>';
        bloods.forEach(b => {
            bloodOptions += `<option value="${b}" ${s.blood===b?'selected':''}>${b}</option>`;
        });
        document.getElementById('editModalTitle').textContent = '✏️ শিক্ষার্থী এডিট করুন';
        document.getElementById('editModalBody').innerHTML = `
            <div class="form-row">
                <div class="form-group"><label>নাম (বাংলা)</label><input type="text" id="editStuNameBn" value="${s.nameBn||''}"></div>
                <div class="form-group"><label>Name (English)</label><input type="text" id="editStuName" value="${s.name||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>ক্লাস</label><select id="editStuClass">${classOptions}</select></div>
                <div class="form-group"><label>রোল</label><input type="text" id="editStuRoll" value="${s.roll||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>পিতা</label><input type="text" id="editStuFather" value="${s.fatherName||''}"></div>
                <div class="form-group"><label>মাতা</label><input type="text" id="editStuMother" value="${s.motherName||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>জন্ম তারিখ</label><input type="date" id="editStuDOB" value="${s.dob||''}"></div>
                <div class="form-group"><label>ফোন</label><input type="text" id="editStuPhone" value="${s.phone||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>ঠিকানা</label><input type="text" id="editStuAddress" value="${s.address||''}"></div>
                <div class="form-group"><label>রক্ত</label><select id="editStuBlood">${bloodOptions}</select></div>
            </div>
            <div class="form-group">
                <label>📷 নতুন ছবি আপলোড (না দিলে আগেরটাই থাকবে)</label>
                <input type="file" id="editStuPhotoFile" accept="image/*" onchange="uploadEditStudentPhoto(this)" style="padding:10px;border:2px dashed #2d8a4e;border-radius:6px;background:#f0f7f0;cursor:pointer;width:100%;">
                <p id="editStuPhotoStatus" style="margin-top:5px;font-size:13px;"></p>
                <input type="hidden" id="editStuPhoto" value="${s.photo||''}">
                <img id="editStuPhotoPreview" src="${s.photo||''}" style="${s.photo?'display:block':'display:none'};max-width:120px;margin-top:10px;border-radius:8px;border:2px solid #2d8a4e;">
            </div>
            <button onclick="saveEditStudent('${id}')" class="btn" style="margin-top:10px;">💾 আপডেট করুন</button>
            <p id="editStuMsg"></p>
        `;
        document.getElementById('editModal').style.display = 'flex';
    });
}

function saveEditStudent(id) {
    const msg = document.getElementById('editStuMsg');
    const data = {
        nameBn: document.getElementById('editStuNameBn').value.trim(),
        name: document.getElementById('editStuName').value.trim(),
        class: document.getElementById('editStuClass').value,
        roll: document.getElementById('editStuRoll').value.trim(),
        fatherName: document.getElementById('editStuFather').value.trim(),
        motherName: document.getElementById('editStuMother').value.trim(),
        dob: document.getElementById('editStuDOB').value,
        phone: document.getElementById('editStuPhone').value.trim(),
        address: document.getElementById('editStuAddress').value.trim(),
        blood: document.getElementById('editStuBlood').value,
        photo: document.getElementById('editStuPhoto').value.trim()
    };
    msg.textContent = 'সেভ হচ্ছে...'; msg.style.color = '#888';
    db.collection('students').doc(id).update(data).then(() => {
        msg.textContent = '✅ আপডেট হয়েছে!'; msg.style.color = '#2e7d32';
        loadAdminStudents();
        setTimeout(() => closeEditModal(), 1500);
    }).catch(e => { msg.textContent = '❌ সমস্যা!'; msg.style.color = '#c62828'; });
}

// ============================================
// QUICK RESULT
// ============================================
function loadQuickStudents() {
    const cls = document.getElementById('qrClass').value;
    const div = document.getElementById('quickStudentList');
    if (!cls) { div.innerHTML = ''; return; }
    div.innerHTML = '<p style="color:#888;padding:15px;">লোড হচ্ছে...</p>';
    db.collection('students').where('class', '==', cls).get().then(snap => {
        if (snap.empty) {
            div.innerHTML = '<p style="color:#c62828;padding:15px;font-weight:600;">⚠️ এই ক্লাসে কোনো শিক্ষার্থী নেই।</p>';
            return;
        }
        let students = [];
        snap.forEach(doc => {
            const s = doc.data();
            s.id = doc.id;
            students.push(s);
        });
        students.sort((a, b) => (parseInt(a.roll)||0) - (parseInt(b.roll)||0));
        let html = `<p style="color:#2e7d32;font-weight:600;padding:10px;background:#e8f5e9;border-radius:6px;margin-bottom:15px;">✅ মোট ${students.length} জন শিক্ষার্থী</p>`;
        students.forEach(s => {
            html += `
            <div class="quick-result-box" id="qr-${s.id}">
                <h4>📝 ${s.nameBn || s.name} | রোল: ${s.roll}</h4>
                <div style="margin:10px 0;padding:10px;background:white;border-radius:6px;">
                    <label style="font-weight:600;color:#1a5632;margin-right:10px;">🎯 পরীক্ষা:</label>
                    <select id="qrExam-${s.id}" style="padding:8px 12px;border:2px solid #2d8a4e;border-radius:5px;font-family:inherit;font-weight:600;">
                        <option value="monthly">মাসিক</option>
                        <option value="1st-semester">প্রথম সেমিস্টার</option>
                        <option value="2nd-semester">দ্বিতীয় সেমিস্টার</option>
                        <option value="yearly">বার্ষিক</option>
                    </select>
                </div>
                <div class="form-row-3">
                    <div class="form-group"><label>বাংলা</label><input type="number" class="qr-sub" data-sub="বাংলা" min="0" max="100"></div>
                    <div class="form-group"><label>ইংরেজি</label><input type="number" class="qr-sub" data-sub="ইংরেজি" min="0" max="100"></div>
                    <div class="form-group"><label>গণিত</label><input type="number" class="qr-sub" data-sub="গণিত" min="0" max="100"></div>
                    <div class="form-group"><label>বিজ্ঞান</label><input type="number" class="qr-sub" data-sub="বিজ্ঞান" min="0" max="100"></div>
                    <div class="form-group"><label>সমাজ</label><input type="number" class="qr-sub" data-sub="সমাজ" min="0" max="100"></div>
                    <div class="form-group"><label>ইসলাম শিক্ষা</label><input type="number" class="qr-sub" data-sub="ইসলাম শিক্ষা" min="0" max="100"></div>
                    <div class="form-group"><label>আরবি</label><input type="number" class="qr-sub" data-sub="আরবি" min="0" max="100"></div>
                    <div class="form-group"><label>কুরআন</label><input type="number" class="qr-sub" data-sub="কুরআন" min="0" max="100"></div>
                    <div class="form-group"><label>হাদীস</label><input type="number" class="qr-sub" data-sub="হাদীস" min="0" max="100"></div>
                    <div class="form-group"><label>ফিকহ</label><input type="number" class="qr-sub" data-sub="ফিকহ" min="0" max="100"></div>
                    <div class="form-group"><label>উর্দু</label><input type="number" class="qr-sub" data-sub="উর্দু" min="0" max="100"></div>
                    <div class="form-group"><label>ICT</label><input type="number" class="qr-sub" data-sub="ICT" min="0" max="100"></div>
                </div>
                <button onclick="saveQuickResult('${s.id}','${(s.nameBn||s.name||'').replace(/'/g,"\\'")}','${s.roll}','${s.photo||''}')" class="btn btn-sm">💾 সেভ করুন</button>
                <span id="qrMsg-${s.id}" style="margin-left:10px;font-weight:600;"></span>
            </div>`;
        });
        div.innerHTML = html;
    });
}

function saveQuickResult(stuId, stuName, roll, photo) {
    const cls = document.getElementById('qrClass').value;
    const exam = document.getElementById('qrExam-' + stuId).value;
    const fullMark = parseInt(document.getElementById('qrFullMark').value) || 100;
    const month = document.getElementById('qrMonth').value;
    const year = document.getElementById('qrYear').value;
    const msg = document.getElementById('qrMsg-' + stuId);
    const box = document.getElementById('qr-' + stuId);
    const inputs = box.querySelectorAll('.qr-sub');
    const newSubjects = {};
    inputs.forEach(inp => {
        if (inp.value !== '') newSubjects[inp.dataset.sub] = parseInt(inp.value);
    });
    if (Object.keys(newSubjects).length === 0) {
        msg.textContent = '❌ নম্বর দিন!'; msg.style.color = '#c62828'; return;
    }
    msg.textContent = '⏳ সেভ হচ্ছে...'; msg.style.color = '#888';
    
    // Check if result exists for this class + exam + roll + month + year
    let query = db.collection('results')
        .where('class', '==', cls)
        .where('exam', '==', exam)
        .where('roll', '==', roll);
    
    query.get().then(snap => {
        // Filter by month/year in code (Firebase can't do 5 where clauses)
        let existingDoc = null;
        snap.forEach(doc => {
            const r = doc.data();
            const monthMatch = (!month && !r.month) || r.month === month;
            const yearMatch = (!year && !r.year) || r.year === year || r.year === parseInt(year).toString();
            if (monthMatch && yearMatch) {
                existingDoc = doc;
            }
        });
        
        if (!existingDoc) {
            // New result - create fresh
            const data = { 
                class: cls, exam, studentName: stuName, roll, 
                subjects: newSubjects, fullMark, month, year, photo, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp() 
            };
            return db.collection('results').add(data);
        } else {
            // Merge existing subjects with new ones
            const existingData = existingDoc.data();
            const mergedSubjects = { ...(existingData.subjects || {}), ...newSubjects };
            return db.collection('results').doc(existingDoc.id).update({
                subjects: mergedSubjects,
                studentName: stuName,
                photo: photo || existingData.photo,
                fullMark,
                month, year,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }).then(() => {
        msg.textContent = '✅ সেভ হয়েছে!'; msg.style.color = '#2e7d32';
        // Clear the inputs after save
        inputs.forEach(inp => inp.value = '');
        setTimeout(() => { msg.textContent = ''; }, 3000);
    }).catch(e => {
        console.error(e);
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
    fullMark: parseInt(document.getElementById('resFullMark').value) || 100,
    month: document.getElementById('resMonth').value,
    year: document.getElementById('resYear').value,
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
    const month = document.getElementById('viewResMonth').value;
    const year = document.getElementById('viewResYear').value;
    const div = document.getElementById('adminResultList');
    if (!cls || !exam) { div.innerHTML = '<p style="color:#888;">ক্লাস ও পরীক্ষা নির্বাচন করুন</p>'; return; }
    div.innerHTML = '<p style="color:#888;">লোড হচ্ছে...</p>';
    db.collection('results').where('class', '==', cls).where('exam', '==', exam).get().then(snap => {
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো ফলাফল নেই</p>'; return; }
        
        // Filter by month/year
        let filtered = [];
        snap.forEach(doc => {
            const r = doc.data();
            if (month && r.month !== month) return;
            if (year && r.year !== year && r.year !== parseInt(year).toString()) return;
            filtered.push({ id: doc.id, ...r });
        });
        
        if (filtered.length === 0) { div.innerHTML = '<p style="color:#888;">এই সময়ের কোনো ফলাফল নেই</p>'; return; }
        
        let html = '<table class="data-table"><thead><tr><th>রোল</th><th>নাম</th><th>মাস</th><th>বছর</th><th>মোট</th><th>মুছুন</th></tr></thead><tbody>';
        filtered.forEach(r => {
            let total = 0;
            for (let s in (r.subjects||{})) total += parseInt(r.subjects[s])||0;
            html += `<tr>
                <td>${r.roll||''}</td>
                <td>${r.studentName||''}</td>
                <td>${r.month||'-'}</td>
                <td>${r.year||'-'}</td>
                <td>${total}</td>
                <td><button class="btn-delete" onclick="deleteDoc('results','${r.id}',loadAdminResults)">🗑️</button></td>
            </tr>`;
        });
        div.innerHTML = html + '</tbody></table>';
    });
}
// ============================================
// TEACHER
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
        document.getElementById('tchPhotoFile').value = '';
        document.getElementById('tchPhotoPreview').style.display = 'none';
        document.getElementById('tchPhotoStatus').textContent = '';
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
            <div class="form-group">
                <label>📷 নতুন ছবি আপলোড (না দিলে আগেরটাই থাকবে)</label>
                <input type="file" id="editTchPhotoFile" accept="image/*" onchange="uploadEditTeacherPhoto(this)" style="padding:10px;border:2px dashed #2d8a4e;border-radius:6px;background:#f0f7f0;cursor:pointer;width:100%;">
                <p id="editTchPhotoStatus" style="margin-top:5px;font-size:13px;"></p>
                <input type="hidden" id="editTchPhoto" value="${t.photo||''}">
                <img id="editTchPhotoPreview" src="${t.photo||''}" style="${t.photo?'display:block':'display:none'};max-width:120px;margin-top:10px;border-radius:8px;border:2px solid #2d8a4e;">
            </div>
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
    if (!url) { msg.textContent = 'ছবি আপলোড করুন!'; msg.className = 'msg-error'; return; }
    db.collection('gallery').add({ url, caption, date: new Date().toISOString(), timestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
        msg.textContent = '✅ ফটো যোগ হয়েছে!'; msg.className = 'msg-success';
        document.getElementById('galURL').value = '';
        document.getElementById('galCaption').value = '';
        document.getElementById('galPhotoFile').value = '';
        document.getElementById('galPhotoPreview').style.display = 'none';
        document.getElementById('galPhotoStatus').textContent = '';
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

// ============================================
// DOWNLOAD RESULT SHEET (Print → Save as PDF)
// ============================================
function downloadResultSheet() {
    const cls = document.getElementById('viewResClass').value;
    const exam = document.getElementById('viewResExam').value;
    const filterMonth = document.getElementById('viewResMonth').value;
    const filterYear = document.getElementById('viewResYear').value;
    
    if (!cls || !exam) {
        alert('ক্লাস ও পরীক্ষা নির্বাচন করুন!');
        return;
    }
    
    // Check month/year required
    if (exam === 'monthly' && (!filterMonth || !filterYear)) {
        alert('মাসিক পরীক্ষার জন্য মাস ও বছর নির্বাচন করুন!');
        return;
    }
    if ((exam === '1st-semester' || exam === '2nd-semester' || exam === 'yearly') && !filterYear) {
        alert('বছর নির্বাচন করুন!');
        return;
    }
    
    const examNames = {
        'monthly': 'মাসিক পরীক্ষা',
        '1st-semester': 'প্রথম সেমিস্টার',
        '2nd-semester': 'দ্বিতীয় সেমিস্টার',
        'yearly': 'বার্ষিক পরীক্ষা'
    };
    
   db.collection('results').where('class', '==', cls).where('exam', '==', exam).get().then(snap => {
    if (snap.empty) {
        alert('কোনো ফলাফল পাওয়া যায়নি!');
        return;
    }
    
    let results = [];
    let allSubjects = new Set();
    let month = filterMonth, year = filterYear, fullMark = 100;
    
    snap.forEach(doc => {
        const r = doc.data();
        // Filter by month/year
        if (filterMonth && r.month !== filterMonth) return;
        if (filterYear && r.year !== filterYear && r.year !== parseInt(filterYear).toString()) return;
        
        if (r.fullMark) fullMark = r.fullMark;
        let total = 0;
        for (let s in (r.subjects||{})) {
            total += parseInt(r.subjects[s]) || 0;
            allSubjects.add(s);
        }
        results.push({ ...r, total });
    });
    
    if (results.length === 0) {
        alert('এই মাস/বছরের কোনো ফলাফল নেই!');
        return;
    }
        
        results.sort((a, b) => b.total - a.total);
        const subjectList = Array.from(allSubjects);
        results.forEach((r, i) => r.rank = i + 1);
        
        const classNames = {'Play':'প্লে','Nursery':'নার্সারি','KG':'কেজি','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯','10':'১০'};
        
        let title = `ক্লাস ${classNames[cls]||cls} - ${examNames[exam]||exam}`;
        if (month && year) title += ` (${month} ${year})`;
        else if (year) title += ` (${year})`;
        
        // Build HTML rows
        let rows = '';
        results.forEach(r => {
            let subjectCells = '';
            subjectList.forEach(s => {
                subjectCells += `<td>${r.subjects[s] !== undefined ? r.subjects[s] : '-'}</td>`;
            });
            const avg = (r.total / subjectList.length).toFixed(1);
            const percent = (avg / fullMark) * 100;
            let grade = 'F';
            if (percent >= 80) grade = 'A+';
            else if (percent >= 70) grade = 'A';
            else if (percent >= 60) grade = 'A-';
            else if (percent >= 50) grade = 'B';
            else if (percent >= 40) grade = 'C';
            else if (percent >= 33) grade = 'D';
            
            rows += `<tr>
                <td>${r.rank}</td>
                <td>${r.roll}</td>
                <td style="text-align:left;">${r.studentName}</td>
                ${subjectCells}
                <td><strong>${r.total}</strong></td>
                <td>${avg}</td>
                <td><strong>${grade}</strong></td>
            </tr>`;
        });
        
        let subjectHeaders = '';
        subjectList.forEach(s => {
            subjectHeaders += `<th>${s}</th>`;
        });
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>ফলাফল - ${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
<style>
    body { font-family: 'Noto Sans Bengali', sans-serif; padding: 20px; color: #000; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { color: #1a5632; margin: 0; font-size: 22px; }
    .header p { margin: 3px 0; font-size: 14px; }
    .header h2 { color: #333; font-size: 16px; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th, td { border: 1px solid #333; padding: 6px 4px; text-align: center; }
    th { background: #1a5632; color: white; font-weight: 600; }
    tr:nth-child(even) { background: #f5f5f5; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 13px; }
    .signature { margin-top: 40px; }
    @media print {
        body { padding: 10px; }
        .no-print { display: none; }
    }
    .print-btn {
        background: #1a5632; color: white; padding: 10px 25px; border: none;
        border-radius: 5px; font-size: 14px; cursor: pointer; margin: 10px 5px;
        font-family: inherit;
    }
</style>
</head>
<body>
<div class="no-print" style="text-align:center;margin-bottom:20px;">
    <button class="print-btn" onclick="window.print()">🖨️ প্রিন্ট / PDF সেভ করুন</button>
    <button class="print-btn" style="background:#666;" onclick="window.close()">✕ বন্ধ করুন</button>
    <p style="font-size:12px;color:#666;">💡 প্রিন্ট window এ "Save as PDF" সিলেক্ট করলে PDF হিসেবে সেভ হবে</p>
</div>
<div class="header">
    <h1>মারকাজুল উলুম ক্যাডেট স্কুল ও মাদ্রাসা</h1>
    <p>পারেরহাট | Parerhat</p>
    <h2>${title}</h2>
    <p>পূর্ণ নম্বর: ${fullMark}</p>
</div>
<table>
    <thead>
        <tr>
            <th>র‍্যাঙ্ক</th>
            <th>রোল</th>
            <th>নাম</th>
            ${subjectHeaders}
            <th>মোট</th>
            <th>গড়</th>
            <th>গ্রেড</th>
        </tr>
    </thead>
    <tbody>
        ${rows}
    </tbody>
</table>
<div class="footer">
    <div>
        <p>মোট শিক্ষার্থী: ${results.length}</p>
        <p>প্রিন্টের তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
    </div>
    <div style="display:flex;gap:60px;">
    <div class="signature">
        <p>_____________________</p>
        <p>প্রধান শিক্ষকের স্বাক্ষর</p>
    </div>
    <div class="signature">
        <p>_____________________</p>
        <p>প্রধান পরিচালকের স্বাক্ষর</p>
    </div>
</div>
</div>
</body>
</html>
        `);
        printWindow.document.close();
    }).catch(err => {
        console.error(err);
        alert('সমস্যা হয়েছে!');
    });
}
