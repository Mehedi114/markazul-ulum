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
    initQuestionBuilder();
    loadQuestionBuilderDrafts();
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
    if (tabId === 'tabQuestionBuilder') {
        setTimeout(() => {
            initQuestionBuilder();
            checkQuestionBuilderOverflow();
        }, 80);
    }
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
        syncQuestionBuilderDefaultsFromSettings();
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
    
    // Load subjects first
    db.collection('subjects').orderBy('order', 'asc').get().then(subSnap => {
        const subjects = [];
        subSnap.forEach(doc => subjects.push(doc.data().name));
        
        if (subjects.length === 0) {
            div.innerHTML = '<p style="color:#c62828;padding:15px;font-weight:600;">⚠️ কোনো বিষয় যোগ করা নেই। "📚 বিষয়সমূহ" tab থেকে বিষয় যোগ করুন।</p>';
            return;
        }
        
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
            
            // Store subjects globally for later use
            window.currentSubjects = subjects;
            window.currentClass = cls;
            
            let html = `<p style="color:#2e7d32;font-weight:600;padding:10px;background:#e8f5e9;border-radius:6px;margin-bottom:15px;">
                ✅ মোট ${students.length} জন শিক্ষার্থী | ${subjects.length} টি বিষয়<br>
                <small style="font-weight:400;color:#555;">💡 শিক্ষার্থীর নামে ক্লিক করুন নম্বর দিতে</small>
            </p>`;
            
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
    const subjects = window.currentSubjects || [];
    const cls = window.currentClass;
    
    body.innerHTML = '<p style="color:#888;padding:10px;">লোড হচ্ছে...</p>';
    
    // Load existing marks (all exam types for this student)
    db.collection('results')
        .where('class', '==', cls)
        .where('roll', '==', roll)
        .get().then(snap => {
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
            
            // Subject input boxes
            html += `<div class="form-row-3" id="subjects-${stuId}">`;
            subjects.forEach(sub => {
                html += `<div class="form-group"><label>${sub}</label><input type="number" class="qr-sub-${stuId}" data-sub="${sub}" min="0" max="100" placeholder="নম্বর"></div>`;
            });
            html += `</div>`;
            
            html += `<button onclick="saveQuickResult('${stuId}','${(stuName||'').replace(/'/g,"\\'")}','${roll}','${photo||''}')" class="btn btn-sm" style="margin-top:10px;">💾 সেভ করুন</button>
                <span id="qrMsg-${stuId}" style="margin-left:10px;font-weight:600;"></span>
                </div>`;
            
            body.innerHTML = html;
            
            // Auto-load marks for default (monthly) exam
            loadPreviousMarks(stuId, roll);
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
        
        // Load subjects list
        db.collection('subjects').orderBy('order', 'asc').get().then(subSnap => {
            const allSubjects = [];
            subSnap.forEach(sd => allSubjects.push(sd.data().name));
            
            // Include subjects already in result (even if not in subjects list)
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
    const classNames = {
        'Play':'প্লে','Nursery':'নার্সারি','KG':'কেজি','1':'১','2':'২','3':'৩','4':'৪',
        '5':'৫','6':'৬','7':'৭','8':'৮','9':'৯','10':'১০'
    };
    const gradeScale = [
        { range: '80-100', grade: 'A+', gpa: '5.00' },
        { range: '70-79', grade: 'A', gpa: '4.00' },
        { range: '60-69', grade: 'A-', gpa: '3.50' },
        { range: '50-59', grade: 'B', gpa: '3.00' },
        { range: '40-49', grade: 'C', gpa: '2.00' },
        { range: '33-39', grade: 'D', gpa: '1.00' },
        { range: '00-32', grade: 'F', gpa: '0.00' }
    ];
    
    const getOverallGrade = (average, fullMark) => {
        const percent = (average / (fullMark || 100)) * 100;
        if (percent >= 80) return { grade: 'A+', gpa: '5.00' };
        if (percent >= 70) return { grade: 'A', gpa: '4.00' };
        if (percent >= 60) return { grade: 'A-', gpa: '3.50' };
        if (percent >= 50) return { grade: 'B', gpa: '3.00' };
        if (percent >= 40) return { grade: 'C', gpa: '2.00' };
        if (percent >= 33) return { grade: 'D', gpa: '1.00' };
        return { grade: 'F', gpa: '0.00' };
    };
    
    const siteNameBn = (document.getElementById('setNameBn')?.value || '').trim() || 'মারকাজুল উলুম ক্যাডেট স্কুল ও মাদ্রাসা';
    const siteNameEn = (document.getElementById('setNameEn')?.value || '').trim();
    const siteLocation = (document.getElementById('setLocation')?.value || '').trim() || 'পারেরহাট | Parerhat';
    const siteLogo = (document.getElementById('setLogo')?.value || '').trim();
    
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
            if (filterMonth && r.month !== filterMonth) return;
            if (filterYear && r.year !== filterYear && r.year !== parseInt(filterYear).toString()) return;
            
            if (r.fullMark) fullMark = parseInt(r.fullMark) || 100;
            let total = 0;
            for (let s in (r.subjects || {})) {
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
        
        results.forEach((r, i) => {
            r.rank = i + 1;
            r.average = subjectList.length ? (r.total / subjectList.length) : 0;
            const gradeInfo = getOverallGrade(r.average, fullMark);
            r.gradeLetter = gradeInfo.grade;
            r.gpa = gradeInfo.gpa;
        });
        
        const passCount = results.filter(r => r.gradeLetter !== 'F').length;
        const failCount = results.length - passCount;
        const passRate = results.length ? ((passCount / results.length) * 100).toFixed(2) : '0.00';
        
        let title = `ক্লাস ${classNames[cls] || cls} - ${examNames[exam] || exam}`;
        if (month && year) title += ` (${month} ${year})`;
        else if (year) title += ` (${year})`;
        
        const gradeRows = gradeScale.map(g => `
            <tr>
                <td>${g.range}</td>
                <td>${g.grade}</td>
                <td>${g.gpa}</td>
            </tr>`).join('');
        
        const subjectHeaders = subjectList.map(s => `<th>${s}</th>`).join('');
        const rows = results.map(r => {
            const subjectCells = subjectList.map(s => `<td>${r.subjects && r.subjects[s] !== undefined ? r.subjects[s] : '-'}</td>`).join('');
            return `
            <tr>
                <td><strong>${r.rank}</strong></td>
                <td>${r.roll || ''}</td>
                <td class="name-cell">${r.studentName || ''}</td>
                ${subjectCells}
                <td><strong>${r.total}</strong></td>
                <td>${r.average.toFixed(1)}</td>
                <td><strong>${r.gradeLetter}</strong></td>
                <td>${r.gpa}</td>
                <td class="blank-cell"></td>
                <td class="blank-cell"></td>
            </tr>`;
        }).join('');
        
        const htmlContent = `
<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ফলাফল - ${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
        margin: 0;
        background: white;
        color: #111;
        font-family: 'Noto Sans Bengali', sans-serif;
        padding: 16px;
    }
    .sheet {
        background: white;
        border: 2px solid #1a5632;
        border-radius: 12px;
        padding: 18px;
    }
    .sheet-header {
        display: flex;
        gap: 16px;
        align-items: stretch;
        justify-content: space-between;
        margin-bottom: 14px;
    }
    .institution-box {
        flex: 1;
        border: 1.5px solid #cfe1d6;
        border-radius: 10px;
        padding: 14px 16px;
        min-height: 140px;
        display: flex;
        gap: 14px;
        align-items: center;
        background: linear-gradient(180deg, #f8fffb 0%, #ffffff 100%);
    }
    .logo-box {
        width: 82px;
        height: 82px;
        border: 1px solid #d7e7dd;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: #fff;
        flex-shrink: 0;
    }
    .logo-box img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
    .header-text {
        flex: 1;
        text-align: center;
    }
    .header-text h1 {
        margin: 0;
        font-size: 30px;
        color: #1a5632;
        font-weight: 800;
        line-height: 1.2;
    }
    .header-text .en {
        margin-top: 4px;
        font-size: 14px;
        color: #445;
    }
    .header-text .loc {
        margin-top: 4px;
        font-size: 13px;
        color: #444;
    }
    .header-text h2 {
        margin: 10px 0 4px;
        font-size: 20px;
        color: #222;
    }
    .header-text .class-line {
        font-size: 15px;
        color: #444;
        font-weight: 600;
    }
    .grade-box {
        width: 250px;
        border: 2px solid #8aa395;
        border-radius: 10px;
        padding: 10px;
        background: #fcfffd;
        flex-shrink: 0;
    }
    .grade-box h3 {
        margin: 0 0 8px;
        text-align: center;
        font-size: 15px;
        color: #1a5632;
    }
    .grade-box table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
    }
    .grade-box th, .grade-box td {
        border: 1px solid #666;
        padding: 4px 6px;
        text-align: center;
    }
    .grade-box th {
        background: #edf5ef;
        color: #1a5632;
    }
    .meta-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 14px;
    }
    .meta-card {
        border: 1.5px solid #bfd5c6;
        border-radius: 8px;
        padding: 8px 10px;
        text-align: center;
        background: #fbfffc;
        min-height: 62px;
    }
    .meta-card .label {
        display: block;
        font-size: 12px;
        color: #555;
        margin-bottom: 5px;
    }
    .meta-card .value {
        display: block;
        font-size: 16px;
        color: #111;
        font-weight: 800;
    }
    .note-line {
        margin: 0 0 12px;
        font-size: 12px;
        color: #666;
        text-align: right;
    }
    .table-wrap {
        overflow-x: auto;
        border: 1px solid #d9e3dd;
        border-radius: 10px;
    }
    table.result-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        min-width: 1100px;
    }
    .result-table th,
    .result-table td {
        border: 1px solid #444;
        padding: 6px 5px;
        text-align: center;
        vertical-align: middle;
    }
    .result-table th {
        background: #1a5632;
        color: white;
        font-weight: 700;
    }
    .result-table tr:nth-child(even) td {
        background: #f8fbf8;
    }
    .name-cell {
        text-align: left !important;
        min-width: 150px;
        font-weight: 600;
    }
    .blank-cell {
        min-width: 72px;
        background-image: linear-gradient(to right, rgba(0,0,0,0.08) 33%, rgba(255,255,255,0) 0%);
        background-position: bottom;
        background-size: 7px 1px;
        background-repeat: repeat-x;
    }
    .bottom-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 18px;
        margin-top: 18px;
    }
    .seal-area {
        width: 180px;
        text-align: center;
    }
    .seal-circle {
        width: 120px;
        height: 120px;
        margin: 0 auto 8px;
        border: 2px dashed #70867b;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 14px;
        font-size: 13px;
        color: #4b5d54;
        font-weight: 700;
    }
    .signature-row {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        align-items: end;
    }
    .signature-box {
        text-align: center;
    }
    .signature-line {
        border-top: 1.5px solid #222;
        margin-top: 36px;
        padding-top: 7px;
        font-size: 13px;
        font-weight: 600;
    }
    .footer-note {
        margin-top: 10px;
        font-size: 11px;
        color: #666;
        text-align: center;
    }
    @media (max-width: 900px) {
        .sheet-header,
        .bottom-row {
            flex-direction: column;
        }
        .grade-box,
        .seal-area {
            width: 100%;
        }
        .signature-row,
        .meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
</style>
</head>
<body>
<div class="sheet">
    <div class="sheet-header">
        <div class="institution-box">
            ${siteLogo ? `<div class="logo-box"><img src="${siteLogo}" alt="Logo"></div>` : ''}
            <div class="header-text">
                <h1>${siteNameBn}</h1>
                ${siteNameEn ? `<div class="en">${siteNameEn}</div>` : ''}
                <div class="loc">${siteLocation}</div>
                <h2>${examNames[exam] || exam} ফলাফলপত্র</h2>
                <div class="class-line">শ্রেণি: ক্লাস ${classNames[cls] || cls}${month && year ? ` | ${month} ${year}` : (year ? ` | ${year}` : '')}</div>
            </div>
        </div>
        <div class="grade-box">
            <h3>গ্রেড নির্ণয় তালিকা</h3>
            <table>
                <thead>
                    <tr>
                        <th>নম্বর</th>
                        <th>গ্রেড</th>
                        <th>GPA</th>
                    </tr>
                </thead>
                <tbody>
                    ${gradeRows}
                </tbody>
            </table>
        </div>
    </div>

    <div class="meta-grid">
        <div class="meta-card"><span class="label">মোট পরীক্ষার্থী</span><span class="value">${results.length}</span></div>
        <div class="meta-card"><span class="label">মোট পাশ</span><span class="value">${passCount}</span></div>
        <div class="meta-card"><span class="label">মোট ফেল</span><span class="value">${failCount}</span></div>
        <div class="meta-card"><span class="label">পাসের হার</span><span class="value">${passRate}%</span></div>
        <div class="meta-card"><span class="label">বিষয়ের সংখ্যা</span><span class="value">${subjectList.length}</span></div>
        <div class="meta-card"><span class="label">পূর্ণ নম্বর</span><span class="value">${fullMark}</span></div>
        <div class="meta-card"><span class="label">প্রিন্টের তারিখ</span><span class="value">${new Date().toLocaleDateString('bn-BD')}</span></div>
    </div>

    <p class="note-line">নোট: "উপস্থিতি" এবং "কার্য দিবস" ঘরগুলো প্রয়োজনে পরে হাতে পূরণ করা যাবে।</p>

    <div class="table-wrap">
        <table class="result-table">
            <thead>
                <tr>
                    <th>অবস্থান</th>
                    <th>রোল</th>
                    <th>শিক্ষার্থীর নাম</th>
                    ${subjectHeaders}
                    <th>মোট নম্বর</th>
                    <th>গড় নম্বর</th>
                    <th>গ্রেড লেটার</th>
                    <th>GPA</th>
                    <th>উপস্থিতি</th>
                    <th>কার্য দিবস</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </div>

    <div class="bottom-row">
        <div class="seal-area">
            <div class="seal-circle">মাদ্রাসার সীল</div>
            <div style="font-size:12px;color:#444;font-weight:600;">Official Seal</div>
        </div>
        <div class="signature-row">
            <div class="signature-box"><div class="signature-line">শ্রেণি শিক্ষকের স্বাক্ষর</div></div>
            <div class="signature-box"><div class="signature-line">প্রধান শিক্ষকের স্বাক্ষর</div></div>
            <div class="signature-box"><div class="signature-line">পরিচালকের স্বাক্ষর</div></div>
        </div>
    </div>

    <div class="footer-note">এই ফলাফল শিটটি সিস্টেম থেকে প্রস্তুতকৃত। প্রয়োজন হলে প্রতিষ্ঠান কর্তৃপক্ষ অতিরিক্ত তথ্য হাতে পূরণ করতে পারবেন।</div>
</div>
</body>
</html>`;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Popup block হয়েছে। Live preview-তে এটা নাও কাজ করতে পারে, কিন্তু push করার পর normal hosting-এ কাজ করবে।');
            return;
        }
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
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
    const name = document.getElementById('newSubjectName').value.trim();
    const order = parseInt(document.getElementById('newSubjectOrder').value) || 1;
    
    if (!name) { 
        msg.textContent = '❌ বিষয়ের নাম দিন!'; 
        msg.style.color = '#c62828'; 
        return; 
    }
    
    // Check duplicate
    db.collection('subjects').where('name', '==', name).get().then(snap => {
        if (!snap.empty) {
            msg.textContent = '⚠️ এই বিষয় ইতিমধ্যে আছে!';
            msg.style.color = '#c62828';
            return;
        }
        
        db.collection('subjects').add({
            name, order,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            msg.textContent = '✅ বিষয় যোগ হয়েছে!';
            msg.style.color = '#2e7d32';
            document.getElementById('newSubjectName').value = '';
            loadSubjectList();
        });
    });
}

function addDefaultSubjects() {
    const defaultSubjects = [
        'বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ জ্ঞান',
        'পরিবেশ পরিচিতি ও সমাজ', 'বিজ্ঞান', 'ইসলাম শিক্ষা',
        'উর্দু শিক্ষা', 'আরবি শিক্ষা', 'তাজবীদ শিক্ষা',
        'কালিমা মাসায়েল', 'হাদিস শরীফ', 'আসমাউল হুসনা',
        'আদইয়ায়ে সালাত', 'আদইয়ায়ে মাসনুনা', 'কোরআন শরীফ',
        'তাজবীদ ও মাখরাজ', 'হিফজুল কুরআন'
    ];
    
    const msg = document.getElementById('subjectMsg');
    if (!confirm('সব ডিফল্ট বিষয় যোগ করবেন? (ইতিমধ্যে থাকলে এড়িয়ে যাবে)')) return;
    
    msg.textContent = '⏳ যোগ হচ্ছে...';
    msg.style.color = '#888';
    
    db.collection('subjects').get().then(snap => {
        const existing = [];
        snap.forEach(doc => existing.push(doc.data().name));
        
        let added = 0;
        let promises = [];
        
        defaultSubjects.forEach((name, i) => {
            if (!existing.includes(name)) {
                promises.push(
                    db.collection('subjects').add({
                        name,
                        order: i + 1,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    })
                );
                added++;
            }
        });
        
        Promise.all(promises).then(() => {
            msg.textContent = `✅ ${added} টি নতুন বিষয় যোগ হয়েছে!`;
            msg.style.color = '#2e7d32';
            loadSubjectList();
        });
    });
}

function loadSubjectList() {
    db.collection('subjects').orderBy('order', 'asc').get().then(snap => {
        const div = document.getElementById('subjectList');
        if (snap.empty) { 
            div.innerHTML = '<p style="color:#888;">কোনো বিষয় নেই। উপরের বাটন থেকে "ডিফল্ট সব বিষয় যোগ করুন" ক্লিক করুন।</p>'; 
            return; 
        }
        
        let html = '<table class="data-table"><thead><tr><th>ক্রম</th><th>বিষয়ের নাম</th><th>মুছুন</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const s = doc.data();
            html += `<tr>
                <td>${s.order || ''}</td>
                <td>${s.name}</td>
                <td><button class="btn-delete" onclick="deleteDoc('subjects','${doc.id}',loadSubjectList)">🗑️</button></td>
            </tr>`;
        });
        div.innerHTML = html + '</tbody></table>';
    }).catch(e => showLoadError('subjectList', e));
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


// ============================================
// QUESTION BUILDER
// ============================================
let qbActiveEditable = null;
let qbSavedRange = null;
let qbBuilderInitialized = false;
let qbFieldListenersAttached = false;

function qbEscapeHtml(value) {
    return (value || '').toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function qbToBanglaDigits(value) {
    return (value || '').toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
}

function syncQuestionBuilderDefaultsFromSettings(force = false) {
    const instEl = document.getElementById('qbInstitution');
    if (!instEl) return;
    const siteName = (document.getElementById('setNameBn')?.value || '').trim() || 'মারকাজুল উলুম ক্যাডেট স্কুল ও মাদ্রাসা';
    if (force || !instEl.value.trim()) instEl.value = siteName;
    const examTitle = document.getElementById('qbExamTitle');
    if (examTitle && !examTitle.value.trim()) examTitle.value = 'মাসিক মূল্যায়ন পরীক্ষা-' + qbToBanglaDigits(new Date().getFullYear());
    const cls = document.getElementById('qbClassName');
    if (cls && !cls.value.trim()) cls.value = 'প্রথম';
    const leftSub = document.getElementById('qbLeftSubject');
    if (leftSub && !leftSub.value.trim()) leftSub.value = 'বাংলা';
    const rightSub = document.getElementById('qbRightSubject');
    if (rightSub && !rightSub.value.trim()) rightSub.value = 'সাধারণ জ্ঞান';
    const duration = document.getElementById('qbDuration');
    if (duration && !duration.value.trim()) duration.value = '১.০০ ঘণ্টা';
    const total = document.getElementById('qbTotalMarks');
    if (total && !total.value.trim()) total.value = '৫০';
}

function isQuestionBuilderAutoSyncEnabled() {
    return !!document.getElementById('qbAutoSync')?.checked;
}

function attachQuestionBuilderFieldListeners() {
    if (qbFieldListenersAttached) return;
    qbFieldListenersAttached = true;
    ['qbInstitution','qbExamTitle','qbClassName','qbLeftSubject','qbRightSubject','qbDuration','qbTotalMarks','qbInstructions'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => {
            if (isQuestionBuilderAutoSyncEnabled()) refreshQuestionBuilderHeaders(true);
        });
    });
    const autoSync = document.getElementById('qbAutoSync');
    if (autoSync) {
        autoSync.addEventListener('change', () => {
            if (autoSync.checked) refreshQuestionBuilderHeaders(true);
        });
    }
}

function initQuestionBuilder() {
    const pages = document.getElementById('qbPages');
    if (!pages) return;
    syncQuestionBuilderDefaultsFromSettings();
    attachQuestionBuilderFieldListeners();
    if (!qbBuilderInitialized) {
        qbBuilderInitialized = true;
        renderQuestionBuilderSymbolButtons();
        document.querySelectorAll('.qb-tool-btn').forEach(btn => {
            btn.addEventListener('mousedown', e => e.preventDefault());
        });
    }
    if (!pages.querySelector('.qb-sheet-page')) {
        addQuestionBuilderPage();
        applyQuestionBuilderHeaderToAll();
    }
    updateQuestionBuilderActiveStatus();
}

function getQuestionBuilderSettings() {
    return {
        institution: (document.getElementById('qbInstitution')?.value || '').trim(),
        examTitle: (document.getElementById('qbExamTitle')?.value || '').trim(),
        className: (document.getElementById('qbClassName')?.value || '').trim(),
        leftSubject: (document.getElementById('qbLeftSubject')?.value || '').trim(),
        rightSubject: (document.getElementById('qbRightSubject')?.value || '').trim(),
        duration: (document.getElementById('qbDuration')?.value || '').trim(),
        totalMarks: (document.getElementById('qbTotalMarks')?.value || '').trim(),
        instructions: (document.getElementById('qbInstructions')?.value || '').trim(),
        autoSync: !!document.getElementById('qbAutoSync')?.checked
    };
}

function setQuestionBuilderSettings(data = {}) {
    const map = {
        qbInstitution: 'institution',
        qbExamTitle: 'examTitle',
        qbClassName: 'className',
        qbLeftSubject: 'leftSubject',
        qbRightSubject: 'rightSubject',
        qbDuration: 'duration',
        qbTotalMarks: 'totalMarks',
        qbInstructions: 'instructions'
    };
    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = data[map[id]] || '';
    });
    const autoSync = document.getElementById('qbAutoSync');
    if (autoSync) autoSync.checked = data.autoSync !== false;
    syncQuestionBuilderDefaultsFromSettings();
}

function getQuestionBuilderHeaderHtml(side = 'left') {
    const settings = getQuestionBuilderSettings();
    const subject = side === 'right'
        ? (settings.rightSubject || settings.leftSubject || 'বিষয়')
        : (settings.leftSubject || 'বিষয়');
    const note = settings.instructions ? `<div class="qb-header-note">${qbEscapeHtml(settings.instructions)}</div>` : '';
    return `
        <div class="qb-header-main">${qbEscapeHtml(settings.institution || 'মারকাজুল উলুম ক্যাডেট স্কুল ও মাদ্রাসা')}</div>
        <div class="qb-header-title">${qbEscapeHtml(settings.examTitle || 'মাসিক মূল্যায়ন পরীক্ষা')}</div>
        <div class="qb-header-sub">শ্রেণি: ${qbEscapeHtml(settings.className || 'প্রথম')}</div>
        <div class="qb-header-sub">বিষয়: ${qbEscapeHtml(subject)}</div>
        <div class="qb-header-meta"><span>সময়: ${qbEscapeHtml(settings.duration || '১.০০ ঘণ্টা')}</span><span>পূর্ণমান: ${qbEscapeHtml(settings.totalMarks || '৫০')}</span></div>
        ${note}`;
}

function getDefaultQuestionBuilderContent() {
    return '<p><strong>১।</strong> এখানে প্রশ্ন লিখুন... <span class="qb-mark-box">[১]</span></p><p>ক) </p><p>খ) </p>';
}

function createQuestionBuilderPageMarkup(pageId, pageNumber, pageData = {}) {
    const leftHeader = pageData.leftHeaderHtml || getQuestionBuilderHeaderHtml('left');
    const rightHeader = pageData.rightHeaderHtml || getQuestionBuilderHeaderHtml('right');
    const leftContent = pageData.leftContentHtml || getDefaultQuestionBuilderContent();
    const rightContent = pageData.rightContentHtml || getDefaultQuestionBuilderContent();
    return `
        <div class="qb-sheet-page" data-page-id="${pageId}">
            <div class="qb-screen-bar">
                <div>
                    <div class="qb-page-label">পৃষ্ঠা ${pageNumber}</div>
                    <div class="qb-page-note">A4 landscape | একই page-এ দুইটি editable paper</div>
                </div>
                <div class="qb-page-actions">
                    <button onclick="focusQuestionBuilderSide('left','${pageId}')" class="btn btn-sm">⬅️ বাম</button>
                    <button onclick="focusQuestionBuilderSide('right','${pageId}')" class="btn btn-sm">➡️ ডান</button>
                    <button onclick="duplicateQuestionBuilderPage('${pageId}')" class="btn btn-sm">📄 কপি</button>
                    <button onclick="addQuestionBuilderPage('${pageId}')" class="btn btn-sm">➕ নিচে Page</button>
                    <button onclick="removeQuestionBuilderPage('${pageId}')" class="btn btn-sm btn-logout">🗑️ মুছুন</button>
                </div>
            </div>
            <div class="qb-paper-sheet">
                <div class="qb-paper-column" data-side="left">
                    <div class="qb-column-head">
                        <span class="qb-column-title">বাম Paper / Column</span>
                        <button onclick="focusQuestionBuilderSide('left','${pageId}')" class="qb-tool-btn" type="button">এখানে লিখুন</button>
                    </div>
                    <div class="qb-paper-header qb-editable" contenteditable="true" data-placeholder="হেডার লিখুন" onclick="setQuestionBuilderActive(this)" onfocus="setQuestionBuilderActive(this)" onmouseup="saveQuestionBuilderSelection()" onkeyup="saveQuestionBuilderSelection();checkQuestionBuilderOverflow()">${leftHeader}</div>
                    <div class="qb-paper-editor qb-editable" contenteditable="true" data-placeholder="এখানে প্রশ্ন লিখুন..." onclick="setQuestionBuilderActive(this)" onfocus="setQuestionBuilderActive(this)" onmouseup="saveQuestionBuilderSelection()" onkeyup="saveQuestionBuilderSelection();checkQuestionBuilderOverflow()" oninput="saveQuestionBuilderSelection();checkQuestionBuilderOverflow()">${leftContent}</div>
                    <div class="qb-column-status">এই column ভরে গেলে ডান পাশে বা নতুন page-এ লিখুন।</div>
                </div>
                <div class="qb-paper-column" data-side="right">
                    <div class="qb-column-head">
                        <span class="qb-column-title">ডান Paper / Column</span>
                        <button onclick="focusQuestionBuilderSide('right','${pageId}')" class="qb-tool-btn" type="button">এখানে লিখুন</button>
                    </div>
                    <div class="qb-paper-header qb-editable" contenteditable="true" data-placeholder="হেডার লিখুন" onclick="setQuestionBuilderActive(this)" onfocus="setQuestionBuilderActive(this)" onmouseup="saveQuestionBuilderSelection()" onkeyup="saveQuestionBuilderSelection();checkQuestionBuilderOverflow()">${rightHeader}</div>
                    <div class="qb-paper-editor qb-editable" contenteditable="true" data-placeholder="এখানে প্রশ্ন লিখুন..." onclick="setQuestionBuilderActive(this)" onfocus="setQuestionBuilderActive(this)" onmouseup="saveQuestionBuilderSelection()" onkeyup="saveQuestionBuilderSelection();checkQuestionBuilderOverflow()" oninput="saveQuestionBuilderSelection();checkQuestionBuilderOverflow()">${rightContent}</div>
                    <div class="qb-column-status">এই column ভরে গেলে নতুন page add করুন।</div>
                </div>
            </div>
        </div>`;
}

function getQuestionBuilderAreaLabel(el) {
    if (!el) return 'এখনো কোনো লেখার জায়গা select করা হয়নি';
    const page = el.closest('.qb-sheet-page');
    const pageIndex = page ? Array.from(document.querySelectorAll('#qbPages .qb-sheet-page')).indexOf(page) + 1 : 1;
    const col = el.closest('.qb-paper-column');
    const side = col?.dataset.side === 'right' ? 'ডান' : 'বাম';
    const part = el.classList.contains('qb-paper-header') ? 'header' : 'মূল প্রশ্ন';
    return `পৃষ্ঠা ${qbToBanglaDigits(pageIndex)} | ${side} column | ${part}`;
}

function updateQuestionBuilderActiveStatus(el = qbActiveEditable) {
    const badge = document.getElementById('qbActiveStatus');
    if (!badge) return;
    badge.textContent = '✍️ ' + getQuestionBuilderAreaLabel(el);
}

function setQuestionBuilderActive(el) {
    document.querySelectorAll('.qb-editable.qb-active').forEach(item => item.classList.remove('qb-active'));
    qbActiveEditable = el;
    if (el) el.classList.add('qb-active');
    updateQuestionBuilderActiveStatus(el);
    setTimeout(saveQuestionBuilderSelection, 0);
}

function saveQuestionBuilderSelection() {
    if (!qbActiveEditable) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (qbActiveEditable.contains(range.commonAncestorContainer) || qbActiveEditable === range.commonAncestorContainer) {
        qbSavedRange = range.cloneRange();
    }
}

function restoreQuestionBuilderSelection() {
    if (!qbSavedRange) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(qbSavedRange);
    return true;
}

function focusQuestionBuilderEditor() {
    if (!qbActiveEditable) {
        const firstEditor = document.querySelector('#qbPages .qb-paper-editor');
        if (!firstEditor) return false;
        setQuestionBuilderActive(firstEditor);
    }
    qbActiveEditable.focus();
    if (!restoreQuestionBuilderSelection()) {
        const range = document.createRange();
        range.selectNodeContents(qbActiveEditable);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        qbSavedRange = range;
    }
    return true;
}

function focusQuestionBuilderSide(side = 'left', pageId = null) {
    const pages = Array.from(document.querySelectorAll('#qbPages .qb-sheet-page'));
    if (!pages.length) return;
    let page = pageId ? document.querySelector(`#qbPages .qb-sheet-page[data-page-id="${pageId}"]`) : null;
    if (!page) {
        page = qbActiveEditable?.closest('.qb-sheet-page') || pages[0];
    }
    const target = page.querySelector(`.qb-paper-column[data-side="${side}"] .qb-paper-editor`) || page.querySelector('.qb-paper-editor');
    if (!target) return;
    setQuestionBuilderActive(target);
    target.focus();
    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    qbSavedRange = range;
}

function execQuestionCommand(command, value = null) {
    if (!focusQuestionBuilderEditor()) {
        alert('আগে যে জায়গায় লিখতে চান সেখানে click করুন।');
        return;
    }
    document.execCommand(command, false, value);
    saveQuestionBuilderSelection();
    checkQuestionBuilderOverflow();
}

function insertQuestionHtml(html) {
    if (!focusQuestionBuilderEditor()) {
        alert('আগে যে জায়গায় লিখতে চান সেখানে click করুন।');
        return;
    }
    document.execCommand('insertHTML', false, html);
    saveQuestionBuilderSelection();
    checkQuestionBuilderOverflow();
}

function insertQuestionText(text) {
    if (!focusQuestionBuilderEditor()) {
        alert('আগে যে জায়গায় লিখতে চান সেখানে click করুন।');
        return;
    }
    document.execCommand('insertText', false, text);
    saveQuestionBuilderSelection();
}

function insertQuestionSnippet(type) {
    const map = {
        qnum: '<p><strong>১।</strong> প্রশ্ন লিখুন... <span class="qb-mark-box">[১]</span></p>',
        subparts: '<p>ক) </p><p>খ) </p><p>গ) </p><p>ঘ) </p>',
        mcq: '<div class="qb-mcq-block"><p><strong>১।</strong> সঠিক উত্তর নির্বাচন কর। <span class="qb-mark-box">[১]</span></p><div class="qb-choice">ক) </div><div class="qb-choice">খ) </div><div class="qb-choice">গ) </div><div class="qb-choice">ঘ) </div></div><p></p>',
        marks: '<span class="qb-mark-box">[৫]</span>&nbsp;',
        answer: '<p><strong>উত্তরঃ</strong></p><div class="qb-dotted-line"></div><div class="qb-dotted-line"></div><div class="qb-dotted-line"></div><p></p>',
        dotted: '<div class="qb-dotted-line"></div>',
        fraction: '<span class="qb-fraction"><span class="qb-fr-top">লব</span><span class="qb-fr-bottom">হর</span></span>&nbsp;',
        root: '√( )',
        power: 'x<sup>2</sup>',
        subscript: 'x<sub>1</sub>',
        table2: '<table class="qb-mini-table"><tbody><tr><td></td><td></td></tr><tr><td></td><td></td></tr></tbody></table><p></p>',
        writtenBlock: '<p><strong>১।</strong> সংক্ষিপ্ত প্রশ্নের উত্তর দাও। <span class="qb-mark-box">[৫]</span></p><p>ক) </p><div class="qb-dotted-line"></div><p>খ) </p><div class="qb-dotted-line"></div><p></p>',
        math: '<p><strong>১।</strong> সমাধান কর: x<sup>2</sup> + 2x + 1 = 0 <span class="qb-mark-box">[৫]</span></p><p>∴ x = </p><div class="qb-dotted-line"></div><p></p>',
        passage: '<p><strong>নিচের অনুচ্ছেদটি পড়ো এবং প্রশ্নগুলোর উত্তর দাও:</strong></p><p>............................................................</p><p><strong>১।</strong> </p><p><strong>২।</strong> </p>'
    };
    insertQuestionHtml(map[type] || '');
}

function renderQuestionBuilderSymbolButtons() {
    const box = document.getElementById('qbSymbolGrid');
    if (!box || box.dataset.loaded === '1') return;
    const symbols = ['+', '−', '×', '÷', '=', '≠', '≈', '≤', '≥', '±', '√', 'π', 'θ', '∞', '∑', '∫', '∠', '°', '%', '∴', '∵', '→', '⇒', '⇔', 'α', 'β', 'γ', 'Δ'];
    box.innerHTML = symbols.map(sym => `<button type="button" class="qb-tool-btn" onclick="insertQuestionText('${sym.replace(/'/g, "\'")}')">${sym}</button>`).join('');
    box.dataset.loaded = '1';
    box.querySelectorAll('.qb-tool-btn').forEach(btn => btn.addEventListener('mousedown', e => e.preventDefault()));
}

function addQuestionBuilderPage(afterPageId = null, pageData = null) {
    const container = document.getElementById('qbPages');
    if (!container) return;
    const pageId = 'qbpage-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const holder = document.createElement('div');
    holder.innerHTML = createQuestionBuilderPageMarkup(pageId, container.querySelectorAll('.qb-sheet-page').length + 1, pageData || {});
    const pageEl = holder.firstElementChild;
    if (afterPageId) {
        const current = container.querySelector(`[data-page-id="${afterPageId}"]`);
        if (current && current.nextSibling) container.insertBefore(pageEl, current.nextSibling);
        else container.appendChild(pageEl);
    } else {
        container.appendChild(pageEl);
    }
    renumberQuestionBuilderPages();
    focusQuestionBuilderSide('left', pageId);
    setTimeout(checkQuestionBuilderOverflow, 50);
}

function getQuestionBuilderPageData(pageEl) {
    return {
        leftHeaderHtml: pageEl.querySelector('.qb-paper-column[data-side="left"] .qb-paper-header')?.innerHTML || '',
        leftContentHtml: pageEl.querySelector('.qb-paper-column[data-side="left"] .qb-paper-editor')?.innerHTML || '',
        rightHeaderHtml: pageEl.querySelector('.qb-paper-column[data-side="right"] .qb-paper-header')?.innerHTML || '',
        rightContentHtml: pageEl.querySelector('.qb-paper-column[data-side="right"] .qb-paper-editor')?.innerHTML || ''
    };
}

function duplicateQuestionBuilderPage(pageId) {
    const page = document.querySelector(`#qbPages .qb-sheet-page[data-page-id="${pageId}"]`);
    if (!page) return;
    addQuestionBuilderPage(pageId, getQuestionBuilderPageData(page));
}

function removeQuestionBuilderPage(pageId) {
    const pages = document.querySelectorAll('#qbPages .qb-sheet-page');
    if (pages.length <= 1) {
        if (!confirm('একটাই page আছে। এটা clear করে নতুন draft শুরু করবেন?')) return;
        newQuestionBuilderDraft(false);
        return;
    }
    if (!confirm('এই page টি মুছে ফেলতে চান?')) return;
    const page = document.querySelector(`#qbPages .qb-sheet-page[data-page-id="${pageId}"]`);
    if (page) page.remove();
    renumberQuestionBuilderPages();
}

function renumberQuestionBuilderPages() {
    document.querySelectorAll('#qbPages .qb-sheet-page').forEach((page, index) => {
        const label = page.querySelector('.qb-page-label');
        if (label) label.textContent = 'পৃষ্ঠা ' + qbToBanglaDigits(index + 1);
    });
    checkQuestionBuilderOverflow();
    updateQuestionBuilderActiveStatus();
}

function refreshQuestionBuilderHeaders(force = false) {
    if (!force && !isQuestionBuilderAutoSyncEnabled()) return;
    document.querySelectorAll('#qbPages .qb-paper-column[data-side="left"] .qb-paper-header').forEach(el => {
        el.innerHTML = getQuestionBuilderHeaderHtml('left');
    });
    document.querySelectorAll('#qbPages .qb-paper-column[data-side="right"] .qb-paper-header').forEach(el => {
        el.innerHTML = getQuestionBuilderHeaderHtml('right');
    });
    checkQuestionBuilderOverflow();
}

function applyQuestionBuilderHeaderToAll() {
    initQuestionBuilder();
    refreshQuestionBuilderHeaders(true);
    const msg = document.getElementById('qbMsg');
    if (msg) {
        msg.textContent = '✅ সব page-এ নতুন header বসানো হয়েছে।';
        msg.className = 'msg-success';
    }
}

function checkQuestionBuilderOverflow() {
    document.querySelectorAll('#qbPages .qb-paper-column').forEach(column => {
        const editor = column.querySelector('.qb-paper-editor');
        const status = column.querySelector('.qb-column-status');
        if (!editor || !status) return;
        const overflowed = editor.scrollHeight > editor.clientHeight + 8;
        editor.classList.toggle('qb-overflow', overflowed);
        status.textContent = overflowed
            ? '⚠️ এই column প্রায় ভরে গেছে। এখন next column বা নতুন page-এ চালিয়ে নিন।'
            : 'এই column ভরে গেলে next column বা নতুন page-এ লিখুন।';
        status.style.color = overflowed ? '#c62828' : '#708070';
    });
}

function collectQuestionBuilderData() {
    const settings = getQuestionBuilderSettings();
    const pages = Array.from(document.querySelectorAll('#qbPages .qb-sheet-page')).map(getQuestionBuilderPageData);
    return {
        ...settings,
        pages,
        pageCount: pages.length,
        updatedAt: new Date().toISOString(),
        paperName: [settings.examTitle, settings.className].filter(Boolean).join(' | ') || 'Question Paper Draft'
    };
}

function renderQuestionBuilderDrafts(drafts) {
    const div = document.getElementById('qbDraftList');
    if (!div) return;
    if (!drafts.length) {
        div.innerHTML = '<p style="color:#888; margin-top:12px;">এখনো কোনো draft save করা হয়নি।</p>';
        return;
    }
    let html = '<div class="qb-draft-list">';
    drafts.forEach(d => {
        const updated = d.updatedAt ? new Date(d.updatedAt).toLocaleString('bn-BD') : '-';
        html += `
            <div class="qb-draft-card">
                <h4>${qbEscapeHtml(d.paperName || d.examTitle || 'Question Draft')}</h4>
                <p>শ্রেণি: ${qbEscapeHtml(d.className || '-')}</p>
                <p>বিষয়: ${qbEscapeHtml(d.leftSubject || '-')} | ${qbEscapeHtml(d.rightSubject || '-')}</p>
                <p>পৃষ্ঠা: ${qbEscapeHtml(d.pageCount || 1)}</p>
                <p>আপডেট: ${qbEscapeHtml(updated)}</p>
                <div class="qb-draft-actions" style="margin-top:10px;">
                    <button onclick="loadQuestionBuilderDraft('${d.id}')" class="btn btn-sm">✏️ ওপেন</button>
                    <button onclick="deleteQuestionBuilderDraft('${d.id}')" class="btn btn-sm btn-logout">🗑️ ডিলিট</button>
                </div>
            </div>`;
    });
    div.innerHTML = html + '</div>';
}

function loadQuestionBuilderDrafts() {
    const div = document.getElementById('qbDraftList');
    if (!div) return;
    div.innerHTML = '<p style="color:#888; margin-top:12px;">লোড হচ্ছে...</p>';
    db.collection('questionPapers').orderBy('updatedAt', 'desc').limit(20).get().then(snap => {
        const drafts = [];
        snap.forEach(doc => drafts.push({ id: doc.id, ...doc.data() }));
        renderQuestionBuilderDrafts(drafts);
    }).catch(err => {
        console.error(err);
        div.innerHTML = '<p style="color:#c62828; margin-top:12px;">Draft list লোড করা যায়নি।</p>';
    });
}

function saveQuestionBuilderDraft() {
    initQuestionBuilder();
    const msg = document.getElementById('qbMsg');
    const draftIdEl = document.getElementById('qbCurrentDraftId');
    const data = collectQuestionBuilderData();
    if (!data.examTitle) {
        msg.textContent = '❌ অন্তত পরীক্ষার নাম দিন।';
        msg.className = 'msg-error';
        return;
    }
    msg.textContent = '⏳ Draft save হচ্ছে...';
    msg.className = '';
    const payload = { ...data };
    const currentId = draftIdEl ? draftIdEl.value : '';
    const request = currentId
        ? db.collection('questionPapers').doc(currentId).set(payload, { merge: true }).then(() => currentId)
        : db.collection('questionPapers').add({ ...payload, createdAt: payload.updatedAt }).then(ref => ref.id);

    request.then(id => {
        if (draftIdEl) draftIdEl.value = id;
        msg.textContent = '✅ Draft সেভ হয়েছে!';
        msg.className = 'msg-success';
        loadQuestionBuilderDrafts();
    }).catch(err => {
        console.error(err);
        msg.textContent = '❌ Draft সেভ করা যায়নি।';
        msg.className = 'msg-error';
    });
}

function buildQuestionBuilderFromDraft(data = {}) {
    const container = document.getElementById('qbPages');
    if (!container) return;
    container.innerHTML = '';
    const pages = Array.isArray(data.pages) && data.pages.length ? data.pages : [{}];
    pages.forEach(page => addQuestionBuilderPage(null, page));
    renumberQuestionBuilderPages();
}

function loadQuestionBuilderDraft(id) {
    const msg = document.getElementById('qbMsg');
    db.collection('questionPapers').doc(id).get().then(doc => {
        if (!doc.exists) {
            msg.textContent = '❌ Draft পাওয়া যায়নি।';
            msg.className = 'msg-error';
            return;
        }
        const data = doc.data();
        document.getElementById('qbCurrentDraftId').value = id;
        setQuestionBuilderSettings(data);
        buildQuestionBuilderFromDraft(data);
        updateQuestionBuilderActiveStatus();
        msg.textContent = '✅ Draft ওপেন হয়েছে।';
        msg.className = 'msg-success';
    }).catch(err => {
        console.error(err);
        msg.textContent = '❌ Draft ওপেন করা যায়নি।';
        msg.className = 'msg-error';
    });
}

function deleteQuestionBuilderDraft(id) {
    if (!confirm('এই draft টি ডিলিট করতে চান?')) return;
    db.collection('questionPapers').doc(id).delete().then(() => {
        loadQuestionBuilderDrafts();
        const draftIdEl = document.getElementById('qbCurrentDraftId');
        if (draftIdEl && draftIdEl.value === id) draftIdEl.value = '';
    }).catch(err => {
        console.error(err);
        alert('ডিলিট করা যায়নি!');
    });
}

function newQuestionBuilderDraft(needConfirm = true) {
    if (needConfirm && !confirm('নতুন draft শুরু করবেন? বর্তমান unsaved change হারাতে পারেন।')) return;
    document.getElementById('qbCurrentDraftId').value = '';
    document.getElementById('qbPages').innerHTML = '';
    const autoSync = document.getElementById('qbAutoSync');
    if (autoSync) autoSync.checked = true;
    syncQuestionBuilderDefaultsFromSettings(true);
    addQuestionBuilderPage();
    applyQuestionBuilderHeaderToAll();
    const msg = document.getElementById('qbMsg');
    if (msg) {
        msg.textContent = '🆕 নতুন draft ready।';
        msg.className = 'msg-success';
    }
}

function getQuestionBuilderPrintStyles() {
    return `
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 14px; background: #eef3ef; font-family: 'Noto Sans Bengali', sans-serif; color: #111; }
        .no-print { text-align: center; margin-bottom: 12px; }
        .print-btn { background:#1a5632; color:#fff; border:none; padding:10px 22px; border-radius:6px; margin:5px; font-family:inherit; font-weight:700; cursor:pointer; }
        .qb-print-page { width: 297mm; min-height: 210mm; margin: 0 auto 14px; page-break-after: always; }
        .qb-print-page:last-child { page-break-after: auto; }
        .qb-paper-sheet { width: 297mm; min-height: 210mm; background:#fff; padding:8mm; border:1px solid #ccc; display:grid; grid-template-columns:repeat(2,1fr); gap:8mm; }
        .qb-paper-column { border:1.4px solid #222; min-height:194mm; display:flex; flex-direction:column; padding:7mm 6mm; }
        .qb-column-head { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:3mm; }
        .qb-column-title { font-size:11px; font-weight:800; text-transform:uppercase; color:#1a5632; }
        .qb-column-head .qb-tool-btn { display:none; }
        .qb-paper-header { border-bottom:1px solid #444; padding-bottom:4mm; margin-bottom:4mm; text-align:center; line-height:1.35; }
        .qb-header-main { font-size:16px; font-weight:800; }
        .qb-header-title { font-size:15px; font-weight:700; }
        .qb-header-sub, .qb-header-note { font-size:14px; font-weight:600; }
        .qb-header-meta { display:flex; justify-content:space-between; gap:8px; font-size:13px; margin-top:4px; font-weight:600; }
        .qb-paper-editor { flex:1; font-size:15px; line-height:1.55; overflow:hidden; }
        .qb-paper-editor p, .qb-paper-header p { margin:0 0 7px; }
        .qb-column-status { display:none; }
        .qb-mcq-block .qb-choice { margin-left:18px; margin-bottom:3px; }
        .qb-mark-box { display:inline-block; border:1px solid #222; padding:1px 7px; min-width:34px; text-align:center; font-size:13px; border-radius:4px; }
        .qb-fill-line, .qb-dotted-line { width:100%; margin:8px 0; min-height:16px; }
        .qb-fill-line { border-bottom:1px solid #222; }
        .qb-dotted-line { border-bottom:1px dotted #333; }
        .qb-fraction { display:inline-flex; flex-direction:column; vertical-align:middle; text-align:center; min-width:34px; margin:0 3px; line-height:1.2; }
        .qb-fr-top { border-bottom:1px solid #222; padding:0 3px 1px; }
        .qb-fr-bottom { padding:1px 3px 0; }
        .qb-mini-table { width:100%; border-collapse:collapse; margin:8px 0; }
        .qb-mini-table td { border:1px solid #222; height:28px; min-width:45px; padding:4px; }
        @media print {
            body { padding:0; background:#fff; }
            .no-print { display:none; }
            .qb-print-page { margin-bottom:0; }
        }
    `;
}

function buildQuestionBuilderPrintHtml() {
    const pagesMarkup = Array.from(document.querySelectorAll('#qbPages .qb-paper-sheet')).map(sheet => {
        const cleaned = sheet.outerHTML
            .replace(/\scontenteditable="true"/g, '')
            .replace(/\sdata-placeholder="[^"]*"/g, '')
            .replace(/\sqb-active/g, '')
            .replace(/\sqb-overflow/g, '');
        return `<section class="qb-print-page">${cleaned}</section>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Question Builder Print</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${getQuestionBuilderPrintStyles()}</style>
</head>
<body>
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">🖨️ প্রিন্ট / Save as PDF</button>
        <button class="print-btn" style="background:#666;" onclick="window.close()">✕ বন্ধ করুন</button>
    </div>
    ${pagesMarkup}
</body>
</html>`;
}

function printQuestionBuilder() {
    initQuestionBuilder();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Popup block হয়েছে। Live preview-তে নাও কাজ করতে পারে; deploy করার পর normal hosting-এ ঠিকমতো কাজ করবে।');
        return;
    }
    printWindow.document.open();
    printWindow.document.write(buildQuestionBuilderPrintHtml());
    printWindow.document.close();
    printWindow.focus();
}
