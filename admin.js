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
// SAFE QUERY - if a Firestore query fails (e.g. missing composite index),
// fall back to fetching the collection and filtering in the browser
// ============================================
function safeQuery(col, query, filterFn) {
    return query.get().catch(err => {
        console.warn('Firestore query failed, using client-side filter:', err);
        return db.collection(col).get().then(snap => {
            const matched = [];
            snap.forEach(doc => {
                if (filterFn(doc.data())) matched.push(doc);
            });
            return {
                empty: matched.length === 0,
                forEach: cb => matched.forEach(cb)
            };
        });
    });
}

// Show a visible error message instead of a silent blank list
function showLoadError(elId, err) {
    console.error('Load failed for ' + elId + ':', err);
    const el = document.getElementById(elId);
    if (el) el.innerHTML = '<p style="color:#c62828;font-weight:600;">❌ ডাটা লোড করা যায়নি! ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।</p>';
}

// ============================================
// PER-CLASS SUBJECTS
// Each class has its own subject list (classSubjects collection).
// Adding a subject for a class makes it available for ALL students of that class.
// ============================================
const CLASS_OPTIONS = ['Play','Nursery','KG','1','2','3','4','5','6','7','8','9','10'];
const DEFAULT_SUBJECTS = [
    'বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ জ্ঞান',
    'পরিবেশ পরিচিতি ও সমাজ', 'বিজ্ঞান', 'ইসলাম শিক্ষা',
    'উর্দু শিক্ষা', 'আরবি শিক্ষা', 'তাজবীদ শিক্ষা',
    'কালিমা মাসায়েল', 'হাদিস শরীফ', 'আসমাউল হুসনা',
    'আদইয়ায়ে সালাত', 'আদইয়ায়ে মাসনুনা', 'কোরআন শরীফ',
    'তাজবীদ ও মাখরাজ', 'হিফজুল কুরআন'
];

function loadClassSubjects(cls, cb) {
    db.collection('classSubjects').doc(cls).get().then(doc => {
        let arr = (doc.exists && Array.isArray(doc.data().subjects)) ? doc.data().subjects : [];
        cb(arr);
    }).catch(e => { console.error(e); cb([]); });
}

function addClassSubject(cls, name, cb) {
    name = (name || '').trim();
    if (!name) return;
    const ref = db.collection('classSubjects').doc(cls);
    ref.get().then(doc => {
        let arr = (doc.exists && Array.isArray(doc.data().subjects)) ? doc.data().subjects.slice() : [];
        if (arr.includes(name)) {
            if (cb) cb('duplicate');
            return null;
        }
        arr.push(name);
        return ref.set({ subjects: arr, updatedAt: new Date().toISOString() }, { merge: true })
            .then(() => { if (cb) cb('ok', arr); });
    }).catch(e => { console.error(e); if (cb) cb('error'); });
}

function removeClassSubject(cls, name, cb) {
    const ref = db.collection('classSubjects').doc(cls);
    ref.get().then(doc => {
        let arr = (doc.exists && Array.isArray(doc.data().subjects)) ? doc.data().subjects.slice() : [];
        arr = arr.filter(s => s !== name);
        return ref.set({ subjects: arr, updatedAt: new Date().toISOString() }, { merge: true })
            .then(() => { if (cb) cb(arr); });
    }).catch(e => { console.error(e); if (cb) cb(null); });
}

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
    loadSubjectList();
}

// ============================================
// QR FILTERS UPDATE
// ============================================
function updateQrFilters() {
    const exam = document.getElementById('qrExamGlobal').value;
    const monthGroup = document.getElementById('qrMonthGroup');
    const yearGroup = document.getElementById('qrYearGroup');
    
    if (exam === 'monthly') {
        monthGroup.style.display = 'block';
        yearGroup.style.display = 'block';
    } else {
        monthGroup.style.display = 'none';
        document.getElementById('qrMonth').value = '';
        yearGroup.style.display = 'block';
    }
    
    // Reload student list to update previews
    if (document.getElementById('qrClass').value) {
        loadQuickStudents();
    }
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
function loadShowcaseSettings() {
    db.collection('settings').doc('showcase').get().then(doc => {
        if (!doc.exists) return;
        const s = doc.data();
        if (s.exam) document.getElementById('showcaseExam').value = s.exam;
        if (s.month) document.getElementById('showcaseMonth').value = s.month;
        if (s.year) document.getElementById('showcaseYear').value = s.year;
        if (s.title) document.getElementById('showcaseTitle').value = s.title;
        updateShowcaseFilters();
    });
}

function updateShowcaseFilters() {
    const exam = document.getElementById('showcaseExam').value;
    const monthGroup = document.getElementById('showcaseMonthGroup');
    const yearGroup = document.getElementById('showcaseYearGroup');
    if (exam === 'monthly') {
        monthGroup.style.display = 'block';
        yearGroup.style.display = 'block';
    } else {
        monthGroup.style.display = 'none';
        document.getElementById('showcaseMonth').value = '';
        yearGroup.style.display = 'block';
    }
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
    }).catch(e => showLoadError('adminNoticeList', e));
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
    
    msg.textContent = '⏳ যাচাই করা হচ্ছে...'; msg.style.color = '#888';
    
    // Check for duplicates in same class
    db.collection('students').where('class', '==', data.class).get().then(snap => {
        let duplicate = null;
        let duplicateReason = '';
        
        snap.forEach(doc => {
            const existing = doc.data();
            
            // Check 1: Same Roll in same class
            if (existing.roll === data.roll) {
                duplicate = existing;
                duplicateReason = `এই ক্লাসে রোল "${data.roll}" নম্বর দিয়ে "${existing.nameBn || existing.name}" ইতিমধ্যে আছে!`;
                return;
            }
            
            // Check 2: Same Bengali name in same class
            if (data.nameBn && existing.nameBn && existing.nameBn.trim() === data.nameBn) {
                duplicate = existing;
                duplicateReason = `এই ক্লাসে "${data.nameBn}" নামে শিক্ষার্থী ইতিমধ্যে আছে (রোল: ${existing.roll})!`;
                return;
            }
            
            // Check 3: Same English name in same class
            if (data.name && existing.name && existing.name.toLowerCase().trim() === data.name.toLowerCase()) {
                duplicate = existing;
                duplicateReason = `এই ক্লাসে "${data.name}" নামে শিক্ষার্থী ইতিমধ্যে আছে (রোল: ${existing.roll})!`;
                return;
            }
            
            // Check 4: Same DOB + Father name (strong match)
            if (data.dob && data.fatherName && existing.dob === data.dob && 
                existing.fatherName && existing.fatherName.trim() === data.fatherName) {
                duplicate = existing;
                duplicateReason = `একই জন্ম তারিখ ও পিতার নামে "${existing.nameBn || existing.name}" (রোল: ${existing.roll}) ইতিমধ্যে আছে!`;
                return;
            }
            
            // Check 5: Same Phone number (if both provided)
            if (data.phone && existing.phone && existing.phone.trim() === data.phone && data.phone.length >= 10) {
                duplicate = existing;
                duplicateReason = `এই ফোন নম্বর "${data.phone}" দিয়ে "${existing.nameBn || existing.name}" (রোল: ${existing.roll}) ইতিমধ্যে আছে!`;
                return;
            }
        });
        
        if (duplicate) {
            msg.innerHTML = `⚠️ <strong>ডুপ্লিকেট!</strong><br>${duplicateReason}<br><small>যদি এটা ভিন্ন শিক্ষার্থী হয়, তাহলে "জোর করে যোগ করুন" বাটন চাপুন।</small>`;
            msg.style.color = '#c62828';
            msg.style.background = '#ffebee';
            msg.style.padding = '10px';
            msg.style.borderRadius = '6px';
            msg.style.borderLeft = '4px solid #c62828';
            
            // Add force button
            const forceBtn = document.createElement('button');
            forceBtn.className = 'btn btn-sm';
            forceBtn.style.background = '#ff9800';
            forceBtn.style.color = 'white';
            forceBtn.style.marginTop = '10px';
            forceBtn.textContent = '⚠️ জোর করে যোগ করুন';
            forceBtn.onclick = function() {
                forceAddStudent(data);
                forceBtn.remove();
            };
            msg.appendChild(forceBtn);
            return;
        }
        
        // No duplicate - add normally
        saveNewStudent(data, msg);
    }).catch(e => {
        console.error(e);
        msg.textContent = '❌ যাচাই সমস্যা!'; msg.style.color = '#c62828';
    });
}

function forceAddStudent(data) {
    const msg = document.getElementById('stuMsg');
    msg.textContent = 'যোগ হচ্ছে...';
    msg.style.background = '';
    msg.style.padding = '';
    msg.style.borderLeft = '';
    saveNewStudent(data, msg);
}

function saveNewStudent(data, msg) {
    db.collection('students').add(data).then(() => {
        msg.innerHTML = '✅ শিক্ষার্থী যোগ হয়েছে!';
        msg.style.color = '#2e7d32';
        msg.style.background = '';
        msg.style.padding = '';
        msg.style.borderLeft = '';
        ['stuNameBn','stuName','stuRoll','stuFather','stuMother','stuPhone','stuAddress','stuPhoto'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('stuPhotoFile').value = '';
        document.getElementById('stuPhotoPreview').style.display = 'none';
        document.getElementById('stuPhotoStatus').textContent = '';
    }).catch(e => { 
        msg.textContent = '❌ সমস্যা!'; 
        msg.style.color = '#c62828'; 
    });
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
    }).catch(e => showLoadError('adminStudentList', e));
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
    
    // Load THIS CLASS's subjects first
    loadClassSubjects(cls, subjects => {
        // Store class subjects for the student boxes
        window.currentClassSubjects = subjects;
        window.currentClass = cls;
        
        // Load students
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
            
            let warnHtml = '';
            if (subjects.length === 0) {
                warnHtml = `<p style="color:#c62828;padding:10px;background:#ffebee;border-radius:6px;margin-bottom:15px;font-weight:600;">
                    ⚠️ এই ক্লাসের জন্য এখনো কোনো subject যোগ করা নেই।
                    <br><small style="font-weight:400;color:#555;">যেকোনো শিক্ষার্থীর নামে ক্লিক করে ভেতরের "Subject যোগ করুন" থেকে যোগ করুন — অথবা "📚 বিষয়সমূহ" tab থেকে এই ক্লাসের subject যোগ করুন।</small>
                </p>`;
            }
            
            let html = `<p style="color:#2e7d32;font-weight:600;padding:10px;background:#e8f5e9;border-radius:6px;margin-bottom:15px;">
                ✅ মোট ${students.length} জন শিক্ষার্থী | এই ক্লাসের ${subjects.length} টি subject<br>
                <small style="font-weight:400;color:#555;">💡 শিক্ষার্থীর নামে ক্লিক করুন নম্বর দিতে</small>
            </p>` + warnHtml;
            
            students.forEach(s => {
                html += `
                <div class="student-row-container" id="src-${s.id}">
                    <div class="student-row-header" onclick="toggleStudentBox('${s.id}','${(s.nameBn||s.name||'').replace(/'/g,"\\'")}','${s.roll}','${s.photo||''}')">
                        <div class="student-row-left">
                            <span class="student-row-roll">${s.roll}</span>
                            <span class="student-row-name">${s.nameBn || s.name}</span>
                        </div>
                        <div class="student-row-right">
                            <span id="preview-${s.id}" class="student-row-preview">লোড হচ্ছে...</span>
                            <span class="student-row-arrow" id="arrow-${s.id}">▼</span>
                        </div>
                    </div>
                    <div class="student-row-body" id="body-${s.id}" style="display:none;"></div>
                </div>`;
            });
            
            div.innerHTML = html;
            
            // Load preview for each student
            students.forEach(s => loadStudentMarksPreview(s.id, s.roll));
        });
    });
}

// Load preview - show which subjects already have marks
function loadStudentMarksPreview(stuId, roll) {
    const cls = window.currentClass;
    const previewEl = document.getElementById('preview-' + stuId);
    if (!previewEl) return;
    
    // Get current exam context if any saved result exists
    safeQuery('results', db.collection('results')
        .where('class', '==', cls)
        .where('roll', '==', roll),
        r => r.class === cls && r.roll === roll).then(snap => {
            if (snap.empty) {
                previewEl.textContent = '';
                return;
            }
            
            // Show summary of latest result
            let latestResult = null;
            let latestTime = 0;
            snap.forEach(doc => {
                const r = doc.data();
                const t = r.timestamp ? r.timestamp.seconds : 0;
                if (t > latestTime) {
                    latestTime = t;
                    latestResult = r;
                }
            });
            
            if (latestResult && latestResult.subjects) {
                const count = Object.keys(latestResult.subjects).length;
                let total = 0;
                for (let s in latestResult.subjects) total += parseInt(latestResult.subjects[s]) || 0;
                previewEl.innerHTML = `<span class="preview-badge">📝 ${count} বিষয় | মোট: ${total}</span>`;
            }
        });
}

// Toggle student box (expand/collapse)
function toggleStudentBox(stuId, stuName, roll, photo) {
    const body = document.getElementById('body-' + stuId);
    const arrow = document.getElementById('arrow-' + stuId);
    
    if (body.style.display === 'none') {
        // Expand - load existing marks and show form
        body.style.display = 'block';
        arrow.textContent = '▲';
        loadStudentBoxContent(stuId, stuName, roll, photo);
    } else {
        // Collapse
        body.style.display = 'none';
        arrow.textContent = '▼';
    }
}

function loadStudentBoxContent(stuId, stuName, roll, photo) {
    const body = document.getElementById('body-' + stuId);
    const cls = window.currentClass;
    body.dataset.roll = roll;
    body.dataset.stuName = stuName || '';
    body.dataset.photo = photo || '';
    
    body.innerHTML = '<p style="color:#888;padding:10px;">লোড হচ্ছে...</p>';
    
    // Load existing marks (all exam types for this student)
    safeQuery('results', db.collection('results')
        .where('class', '==', cls)
        .where('roll', '==', roll),
        r => r.class === cls && r.roll === roll).then(snap => {
            const existingResults = [];
            snap.forEach(doc => {
                existingResults.push({ id: doc.id, ...doc.data() });
            });
            
           // Show current exam info (from global selector)
const globalExam = document.getElementById('qrExamGlobal').value;
const globalMonth = document.getElementById('qrMonth').value;
const globalYear = document.getElementById('qrYear').value;
const examLabel = {
    'monthly': 'মাসিক',
    '1st-semester': 'প্রথম সেমিস্টার',
    '2nd-semester': 'দ্বিতীয় সেমিস্টার',
    'yearly': 'বার্ষিক'
}[globalExam];
const period = [globalMonth, globalYear].filter(x => x).join(' ');

let html = `
    <div style="padding:15px;background:white;border-radius:8px;">
        <div style="margin-bottom:12px;padding:10px;background:#e8f5e9;border-radius:6px;border-left:4px solid #2d8a4e;">
            <strong style="color:#1a5632;">🎯 বর্তমান পরীক্ষা:</strong> ${examLabel} ${period ? '(' + period + ')' : ''}
            <br><small style="color:#666;">উপরের ড্রপডাউন থেকে পরীক্ষা পরিবর্তন করুন</small>
        </div>`;
            
            // Show existing marks summary
            if (existingResults.length > 0) {
                html += `<div id="existing-${stuId}" style="margin-bottom:12px;padding:10px;background:#fff8e1;border-radius:6px;border-left:4px solid #ffc107;">
                    <strong style="color:#856404;">📊 আগের রেকর্ড:</strong><br>`;
                existingResults.forEach(r => {
                    const examName = {
                        'monthly': 'মাসিক',
                        '1st-semester': '১ম সেমিস্টার',
                        '2nd-semester': '২য় সেমিস্টার',
                        'yearly': 'বার্ষিক'
                    }[r.exam] || r.exam;
                    let total = 0;
                    const subCount = Object.keys(r.subjects || {}).length;
                    for (let s in (r.subjects || {})) total += parseInt(r.subjects[s]) || 0;
                    const period = [r.month, r.year].filter(x => x).join(' ');
                    html += `<small style="display:block;color:#666;margin-top:3px;">• ${examName} ${period ? '('+period+')' : ''}: ${subCount} বিষয়, মোট ${total}</small>`;
                });
                html += `</div>`;
            }
            
            // Subject input boxes (THIS CLASS's subjects only)
            html += `<div class="form-row-3" id="subjects-${stuId}"></div>`;
            renderSubjectsForBox(stuId);
            
            // ➕ Add subject for this class (saves for ALL students of the class)
            html += `<div style="margin-top:12px;padding:10px;background:#f0f7f0;border-radius:6px;border:1px dashed #2d8a4e;">
                <strong style="color:#1a5632;">➕ এই ক্লাসে নতুন subject যোগ করুন</strong>
                <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                    <input type="text" id="newSub-${stuId}" placeholder="subject এর নাম লিখুন" style="flex:1;min-width:180px;padding:8px;border:2px solid #ddd;border-radius:6px;font-family:inherit;">
                    <button onclick="quickAddSubject('${stuId}')" class="btn btn-sm">যোগ করুন</button>
                </div>
                <small style="color:#666;">নতুন subject এই ক্লাসের <strong>সব শিক্ষার্থী</strong> এর মধ্যে যুক্ত হয়ে যাবে।</small>
            </div>`;
            
            html += `<button onclick="saveQuickResult('${stuId}','${(stuName||'').replace(/'/g,"\\'")}','${roll}','${photo||''}')" class="btn btn-sm" style="margin-top:10px;">💾 সেভ করুন</button>
                <span id="qrMsg-${stuId}" style="margin-left:10px;font-weight:600;"></span>
                </div>`;
            
            body.innerHTML = html;
            
            // Auto-load marks for default (monthly) exam
            loadPreviousMarks(stuId, roll);
        });
}

// Render the subject input fields for one student's box (from class subjects)
function renderSubjectsForBox(stuId) {
    const box = document.getElementById('subjects-' + stuId);
    if (!box) return;
    const subjects = window.currentClassSubjects || [];
    let html = '';
    subjects.forEach(sub => {
        html += `<div class="form-group"><label>${sub}</label><input type="number" class="qr-sub-${stuId}" data-sub="${sub}" min="0" max="100" placeholder="নম্বর"></div>`;
    });
    box.innerHTML = html || '<p style="color:#c62828;font-weight:600;">এই ক্লাসের জন্য কোনো subject নেই — নিচের বক্স থেকে যোগ করুন।</p>';
}

// Add a subject for the current class from inside a student box
function quickAddSubject(stuId) {
    const cls = window.currentClass;
    const input = document.getElementById('newSub-' + stuId);
    const msg = document.getElementById('qrMsg-' + stuId);
    const name = (input ? input.value : '').trim();
    if (!name) return;
    if (msg) { msg.textContent = '⏳ যোগ হচ্ছে...'; msg.style.color = '#888'; }
    addClassSubject(cls, name, (status, arr) => {
        if (status === 'duplicate') {
            if (msg) { msg.textContent = '⚠️ এই subject ইতিমধ্যে আছে!'; msg.style.color = '#c62828'; }
            return;
        }
        if (status === 'error') {
            if (msg) { msg.textContent = '❌ সমস্যা হয়েছে!'; msg.style.color = '#c62828'; }
            return;
        }
        // Saved for the whole class — refresh current boxes
        window.currentClassSubjects = arr;
        renderSubjectsForBox(stuId);
        const body = document.getElementById('body-' + stuId);
        if (body) loadPreviousMarks(stuId, body.dataset.roll);
        if (input) input.value = '';
        if (msg) { msg.textContent = '✅ Subject যোগ হয়েছে! (এই ক্লাসের সব শিক্ষার্থীর জন্য)'; msg.style.color = '#2e7d32'; }
    });
}

// Load previous marks when exam is selected
function loadPreviousMarks(stuId, roll) {
    const cls = window.currentClass;
    const exam = document.getElementById('qrExamGlobal').value;
    const month = document.getElementById('qrMonth') ? document.getElementById('qrMonth').value : '';
    const year = document.getElementById('qrYear') ? document.getElementById('qrYear').value : '';
    
    // Clear all inputs first
    document.querySelectorAll('.qr-sub-' + stuId).forEach(inp => inp.value = '');
    
    // Find existing result for this exam+month+year
    safeQuery('results', db.collection('results')
        .where('class', '==', cls)
        .where('exam', '==', exam)
        .where('roll', '==', roll),
        r => r.class === cls && r.exam === exam && r.roll === roll).then(snap => {
            let existingResult = null;
            snap.forEach(doc => {
                const r = doc.data();
                const monthMatch = (!month && !r.month) || r.month === month;
                const yearMatch = (!year && !r.year) || r.year === year || r.year === parseInt(year).toString();
                if (monthMatch && yearMatch) {
                    existingResult = r;
                }
            });
            
            if (existingResult && existingResult.subjects) {
                // Fill inputs with existing marks
                document.querySelectorAll('.qr-sub-' + stuId).forEach(inp => {
                    const sub = inp.dataset.sub;
                    if (existingResult.subjects[sub] !== undefined) {
                        inp.value = existingResult.subjects[sub];
                        inp.style.background = '#fff8e1';
                        inp.style.borderColor = '#ffc107';
                    } else {
                        inp.style.background = '';
                        inp.style.borderColor = '';
                    }
                });
            } else {
                document.querySelectorAll('.qr-sub-' + stuId).forEach(inp => {
                    inp.style.background = '';
                    inp.style.borderColor = '';
                });
            }
        });
}

function saveQuickResult(stuId, stuName, roll, photo) {
    const cls = window.currentClass;
    const exam = document.getElementById('qrExamGlobal').value;
    const fullMark = parseInt(document.getElementById('qrFullMark').value) || 100;
    const month = document.getElementById('qrMonth') ? document.getElementById('qrMonth').value : '';
    const year = document.getElementById('qrYear') ? document.getElementById('qrYear').value : '';
    const msg = document.getElementById('qrMsg-' + stuId);
    const inputs = document.querySelectorAll('.qr-sub-' + stuId);
    const newSubjects = {};
    inputs.forEach(inp => {
        if (inp.value !== '') newSubjects[inp.dataset.sub] = parseInt(inp.value);
    });
    if (Object.keys(newSubjects).length === 0) {
        msg.textContent = '❌ নম্বর দিন!'; msg.style.color = '#c62828'; return;
    }
    msg.textContent = '⏳ সেভ হচ্ছে...'; msg.style.color = '#888';
    
    safeQuery('results', db.collection('results')
        .where('class', '==', cls)
        .where('exam', '==', exam)
        .where('roll', '==', roll),
        r => r.class === cls && r.exam === exam && r.roll === roll).then(snap => {
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
                const data = { 
                    class: cls, exam, studentName: stuName, roll, 
                    subjects: newSubjects, fullMark, month, year, photo, 
                    timestamp: firebase.firestore.FieldValue.serverTimestamp() 
                };
                return db.collection('results').add(data);
            } else {
                const existingData = existingDoc.data();
                const mergedSubjects = { ...(existingData.subjects || {}), ...newSubjects };
                return db.collection('results').doc(existingDoc.id).update({
                    subjects: mergedSubjects,
                    studentName: stuName,
                    photo: photo || existingData.photo,
                    fullMark, month, year,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }).then(() => {
            msg.textContent = '✅ সেভ হয়েছে!'; msg.style.color = '#2e7d32';
            // Update preview
            loadStudentMarksPreview(stuId, roll);
            // Reload marks to show updated
            loadPreviousMarks(stuId, roll);
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
    const monthEl = document.getElementById('resMonth');
    const yearEl = document.getElementById('resYear');
    const data = {
    class: document.getElementById('resClass').value,
    exam: document.getElementById('resExam').value,
    studentName, roll, subjects,
    fullMark: parseInt(document.getElementById('resFullMark').value) || 100,
    month: monthEl ? monthEl.value : '',
    year: yearEl ? yearEl.value : '',
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
    safeQuery('results', db.collection('results').where('class', '==', cls).where('exam', '==', exam),
        r => r.class === cls && r.exam === exam).then(snap => {
        if (snap.empty) { div.innerHTML = '<p style="color:#888;">কোনো ফলাফল নেই</p>'; return; }
        
        let filtered = [];
        snap.forEach(doc => {
            const r = doc.data();
            if (month && r.month !== month) return;
            if (year && r.year !== year && r.year !== parseInt(year).toString()) return;
            filtered.push({ id: doc.id, ...r });
        });
        
        if (filtered.length === 0) { div.innerHTML = '<p style="color:#888;">এই সময়ের কোনো ফলাফল নেই</p>'; return; }
        
        // Sort by roll
        filtered.sort((a, b) => (parseInt(a.roll)||0) - (parseInt(b.roll)||0));
        
        let html = '<table class="data-table"><thead><tr><th>রোল</th><th>নাম</th><th>মাস</th><th>বছর</th><th>মোট</th><th>এডিট</th><th>মুছুন</th></tr></thead><tbody>';
        filtered.forEach(r => {
            let total = 0;
            for (let s in (r.subjects||{})) total += parseInt(r.subjects[s])||0;
            html += `<tr>
                <td>${r.roll||''}</td>
                <td>${r.studentName||''}</td>
                <td>${r.month||'-'}</td>
                <td>${r.year||'-'}</td>
                <td><strong>${total}</strong></td>
                <td><button class="btn-edit" onclick="editResult('${r.id}')">✏️</button></td>
                <td><button class="btn-delete" onclick="deleteDoc('results','${r.id}',loadAdminResults)">🗑️</button></td>
            </tr>`;
        });
        div.innerHTML = html + '</tbody></table>';
    }).catch(e => showLoadError('adminResultList', e));
}

// ============================================
// EDIT RESULT
// ============================================
function editResult(id) {
    db.collection('results').doc(id).get().then(doc => {
        if (!doc.exists) return;
        const r = doc.data();
        
        // Load THIS CLASS's subjects list
        loadClassSubjects(r.class || '', classSubjects => {
            const allSubjects = classSubjects.slice();
            
            // Include subjects already in result (even if not in class subjects list)
            for (let s in (r.subjects || {})) {
                if (!allSubjects.includes(s)) allSubjects.push(s);
            }
            
            let subjectFields = '';
            allSubjects.forEach(sub => {
                const val = r.subjects && r.subjects[sub] !== undefined ? r.subjects[sub] : '';
                subjectFields += `<div class="form-group">
                    <label>${sub}</label>
                    <input type="number" class="edit-res-sub" data-sub="${sub}" value="${val}" min="0" max="100">
                </div>`;
            });
            
            document.getElementById('editModalTitle').textContent = '✏️ ফলাফল এডিট করুন';
            document.getElementById('editModalBody').innerHTML = `
                <p style="background:#e8f5e9;padding:10px;border-radius:6px;margin-bottom:15px;">
                    <strong>${r.studentName}</strong> | রোল: ${r.roll} | ক্লাস: ${r.class}<br>
                    <small>${r.month || ''} ${r.year || ''} | পূর্ণ নম্বর: ${r.fullMark || 100}</small>
                </p>
                <h4 style="color:#1a5632;margin-bottom:10px;">📝 বিষয়ভিত্তিক নম্বর</h4>
                <div class="form-row-3">${subjectFields}</div>
                <button onclick="saveEditResult('${id}')" class="btn" style="margin-top:15px;">💾 আপডেট করুন</button>
                <p id="editResMsg"></p>
            `;
            document.getElementById('editModal').style.display = 'flex';
        });
    });
}

function saveEditResult(id) {
    const msg = document.getElementById('editResMsg');
    const inputs = document.querySelectorAll('.edit-res-sub');
    const subjects = {};
    inputs.forEach(inp => {
        if (inp.value !== '') subjects[inp.dataset.sub] = parseInt(inp.value);
    });
    
    if (Object.keys(subjects).length === 0) {
        msg.textContent = '❌ অন্তত একটি বিষয়ের নম্বর দিন!';
        msg.style.color = '#c62828';
        return;
    }
    
    msg.textContent = '⏳ সেভ হচ্ছে...';
    msg.style.color = '#888';
    
    db.collection('results').doc(id).update({
        subjects,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        msg.textContent = '✅ আপডেট হয়েছে!';
        msg.style.color = '#2e7d32';
        loadAdminResults();
        setTimeout(() => closeEditModal(), 1500);
    }).catch(e => {
        msg.textContent = '❌ সমস্যা!';
        msg.style.color = '#c62828';
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
    }).catch(e => showLoadError('adminTeacherList', e));
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
    }).catch(e => showLoadError('adminGalleryList', e));
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
    }).catch(e => showLoadError('adminMessageList', e));
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
    
   safeQuery('results', db.collection('results').where('class', '==', cls).where('exam', '==', exam),
    r => r.class === cls && r.exam === exam).then(snap => {
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


// ============================================
// SUBJECT MANAGEMENT
// ============================================
function addSubject() {
    const msg = document.getElementById('subjectMsg');
    const cls = document.getElementById('subjClass').value;
    const name = document.getElementById('newSubjectName').value.trim();
    
    if (!cls) { 
        msg.textContent = '❌ আগে ক্লাস সিলেক্ট করুন!'; 
        msg.style.color = '#c62828'; 
        return; 
    }
    if (!name) { 
        msg.textContent = '❌ বিষয়ের নাম দিন!'; 
        msg.style.color = '#c62828'; 
        return; 
    }
    
    addClassSubject(cls, name, (status) => {
        if (status === 'duplicate') {
            msg.textContent = '⚠️ এই বিষয় ইতিমধ্যে এই ক্লাসে আছে!';
            msg.style.color = '#c62828';
            return;
        }
        if (status === 'error') {
            msg.textContent = '❌ সমস্যা হয়েছে!';
            msg.style.color = '#c62828';
            return;
        }
        msg.textContent = '✅ বিষয় যোগ হয়েছে! (এই ক্লাসের সব শিক্ষার্থীর জন্য)';
        msg.style.color = '#2e7d32';
        document.getElementById('newSubjectName').value = '';
        loadSubjectList();
    });
}

function addDefaultSubjects() {
    const msg = document.getElementById('subjectMsg');
    const cls = document.getElementById('subjClass').value;
    if (!cls) {
        msg.textContent = '❌ আগে ক্লাস সিলেক্ট করুন!';
        msg.style.color = '#c62828';
        return;
    }
    const classNames = {'Play':'প্লে','Nursery':'নার্সারি','KG':'কেজি','1':'ক্লাস ১','2':'ক্লাস ২','3':'ক্লাস ৩','4':'ক্লাস ৪','5':'ক্লাস ৫','6':'ক্লাস ৬','7':'ক্লাস ৭','8':'ক্লাস ৮','9':'ক্লাস ৯','10':'ক্লাস ১০'};
    if (!confirm(`"${classNames[cls] || cls}" ক্লাসে সব ডিফল্ট বিষয় যোগ করবেন? (ইতিমধ্যে থাকলে এড়িয়ে যাবে)`)) return;
    
    msg.textContent = '⏳ যোগ হচ্ছে...';
    msg.style.color = '#888';
    
    loadClassSubjects(cls, existing => {
        const missing = DEFAULT_SUBJECTS.filter(n => !existing.includes(n));
        if (missing.length === 0) {
            msg.textContent = '✅ সব ডিফল্ট বিষয় ইতিমধ্যে এই ক্লাসে আছে!';
            msg.style.color = '#2e7d32';
            return;
        }
        const ref = db.collection('classSubjects').doc(cls);
        const merged = existing.concat(missing);
        ref.set({ subjects: merged, updatedAt: new Date().toISOString() }, { merge: true }).then(() => {
            msg.textContent = `✅ ${missing.length} টি নতুন বিষয় যোগ হয়েছে!`;
            msg.style.color = '#2e7d32';
            loadSubjectList();
        }).catch(e => {
            console.error(e);
            msg.textContent = '❌ সমস্যা হয়েছে!';
            msg.style.color = '#c62828';
        });
    });
}

function removeSubject(cls, name) {
    if (!confirm(`"${name}" বিষয়টি মুছে ফেলবেন?`)) return;
    removeClassSubject(cls, name, () => loadSubjectList());
}

function loadSubjectList() {
    const cls = document.getElementById('subjClass').value;
    const div = document.getElementById('subjectList');
    if (!cls) { 
        div.innerHTML = '<p style="color:#888;">উপরে ক্লাস সিলেক্ট করুন।</p>'; 
        return; 
    }
    div.innerHTML = '<p style="color:#888;">লোড হচ্ছে...</p>';
    loadClassSubjects(cls, subjects => {
        if (subjects.length === 0) { 
            div.innerHTML = '<p style="color:#888;">এই ক্লাসের জন্য এখনো কোনো বিষয় যোগ করা নেই। উপরের বাটন থেকে বিষয় যোগ করুন।</p>'; 
            return; 
        }
        let html = '<table class="data-table"><thead><tr><th>ক্রম</th><th>বিষয়ের নাম</th><th>মুছুন</th></tr></thead><tbody>';
        subjects.forEach((name, i) => {
            const safe = String(name).replace(/'/g, "\\'");
            html += `<tr>
                <td>${i + 1}</td>
                <td>${name}</td>
                <td><button class="btn-delete" onclick="removeSubject('${cls}','${safe}')">🗑️</button></td>
            </tr>`;
        });
        div.innerHTML = html + '</tbody></table>';
        div.innerHTML += '<p style="color:#666;font-size:12px;margin-top:8px;">💡 এই তালিকা "⚡ দ্রুত ফলাফল" tab এ এই ক্লাসের সব শিক্ষার্থীর কাছে যুক্ত হবে।</p>';
    });
}

// Load subjects when admin panel opens


// ============================================
// SHOWCASE FUNCTIONS (Fixed)
// ============================================
function saveShowcase() {
    const msg = document.getElementById('showcaseMsg');
    const exam = document.getElementById('showcaseExam').value;
    const monthEl = document.getElementById('showcaseMonth');
    const yearEl = document.getElementById('showcaseYear');
    const titleEl = document.getElementById('showcaseTitle');
    
    const data = {
        exam: exam || 'yearly',
        month: monthEl ? monthEl.value : '',
        year: yearEl ? yearEl.value : '',
        title: titleEl ? titleEl.value.trim() : '',
        updatedAt: new Date().toISOString()
    };
    
    msg.textContent = '⏳ সেভ হচ্ছে...';
    msg.style.color = '#888';
    
    db.collection('settings').doc('showcase').set(data).then(() => {
        msg.textContent = '✅ সেভ হয়েছে!';
        msg.style.color = '#2e7d32';
    }).catch(e => {
        console.error('Save error:', e);
        msg.textContent = '❌ সমস্যা: ' + e.message;
        msg.style.color = '#c62828';
    });
}

function loadShowcaseSettings() {
    db.collection('settings').doc('showcase').get().then(doc => {
        if (!doc.exists) return;
        const s = doc.data();
        if (s.exam) document.getElementById('showcaseExam').value = s.exam;
        if (s.month && document.getElementById('showcaseMonth')) document.getElementById('showcaseMonth').value = s.month;
        if (s.year && document.getElementById('showcaseYear')) document.getElementById('showcaseYear').value = s.year;
        if (s.title) document.getElementById('showcaseTitle').value = s.title;
        if (typeof updateShowcaseFilters === 'function') updateShowcaseFilters();
    });
}

function updateShowcaseFilters() {
    const exam = document.getElementById('showcaseExam').value;
    const monthGroup = document.getElementById('showcaseMonthGroup');
    const yearGroup = document.getElementById('showcaseYearGroup');
    if (!monthGroup || !yearGroup) return;
    if (exam === 'monthly') {
        monthGroup.style.display = 'block';
        yearGroup.style.display = 'block';
    } else {
        monthGroup.style.display = 'none';
        document.getElementById('showcaseMonth').value = '';
        yearGroup.style.display = 'block';
    }
}

// ============================================
// QUICK ADD STUDENT (from Quick Result page)
// ============================================
function showQuickAddStudent() {
    const cls = document.getElementById('qrClass').value;
    if (!cls) {
        alert('আগে ক্লাস সিলেক্ট করুন!');
        return;
    }
    document.getElementById('quickAddStudentBox').style.display = 'block';
    document.getElementById('qasNameBn').focus();
}

function quickAddStudent() {
    const msg = document.getElementById('qasMsg');
    const cls = document.getElementById('qrClass').value;
    const nameBn = document.getElementById('qasNameBn').value.trim();
    const name = document.getElementById('qasName').value.trim();
    const roll = document.getElementById('qasRoll').value.trim();
    const father = document.getElementById('qasFather').value.trim();
    
    if (!nameBn && !name) {
        msg.textContent = '❌ নাম দিন!';
        msg.style.color = '#c62828';
        return;
    }
    if (!roll) {
        msg.textContent = '❌ রোল দিন!';
        msg.style.color = '#c62828';
        return;
    }
    
    msg.textContent = '⏳ যাচাই হচ্ছে...';
    msg.style.color = '#888';
    
    // Duplicate check
    db.collection('students').where('class', '==', cls).get().then(snap => {
        let isDuplicate = false;
        snap.forEach(doc => {
            const s = doc.data();
            if (s.roll === roll) {
                isDuplicate = true;
                msg.textContent = `⚠️ রোল ${roll} ইতিমধ্যে আছে (${s.nameBn || s.name})!`;
                msg.style.color = '#c62828';
            }
        });
        
        if (isDuplicate) return;
        
        // Add student
        db.collection('students').add({
            nameBn, name, class: cls, roll,
            fatherName: father,
            motherName: '', dob: '', phone: '', address: '', blood: '', photo: '',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            msg.textContent = '✅ শিক্ষার্থী যোগ হয়েছে!';
            msg.style.color = '#2e7d32';
            document.getElementById('qasNameBn').value = '';
            document.getElementById('qasName').value = '';
            document.getElementById('qasRoll').value = '';
            document.getElementById('qasFather').value = '';
            
            // Reload student list
            setTimeout(() => {
                document.getElementById('quickAddStudentBox').style.display = 'none';
                msg.textContent = '';
                loadQuickStudents();
            }, 1000);
        }).catch(e => {
            msg.textContent = '❌ সমস্যা!';
            msg.style.color = '#c62828';
        });
    });
}
