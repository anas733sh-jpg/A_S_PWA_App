/* admin.js - النسخة المصححة */
(async function(){
    const addForm = document.getElementById('addForm');
    const itemsDiv = document.getElementById('items');

    // نظام أصوات بديل
    function playSound(type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            switch(type) {
                case 'click':
                    oscillator.frequency.value = 800;
                    gainNode.gain.value = 0.1;
                    break;
                case 'success':
                    oscillator.frequency.value = 1000;
                    gainNode.gain.value = 0.08;
                    break;
                case 'error':
                    oscillator.frequency.value = 400;
                    gainNode.gain.value = 0.1;
                    break;
            }

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            setTimeout(() => oscillator.stop(), 100);
        } catch(e) {
            console.log('الأصوات غير متاحة');
        }
    }

    // تحميل قائمة الوضعيات
    async function loadList(){
        try {
            console.log('📡 جاري تحميل الوضعيات...');
            const response = await fetch('/api/positions');

            if (!response.ok) {
                throw new Error(`خطأ في السيرفر: ${response.status}`);
            }

            const list = await response.json();
            console.log('✅ تم تحميل', list.length, 'وضعية');
            render(list);
        } catch(error) {
            console.error('❌ فشل تحميل القائمة:', error);
            showError('فشل تحميل البيانات. تأكد من اتصال السيرفر.');
        }
    }

    // عرض القائمة
    function render(list){
        console.log('🎨 عرض', list.length, 'وضعية');
        itemsDiv.innerHTML = '';

        if (!list || list.length === 0) {
            itemsDiv.innerHTML = `
                <div style="text-align:center; padding:40px; color:#666; background:rgba(255,255,255,0.05); border-radius:10px;">
                    <i style="font-size:48px; margin-bottom:15px; display:block;">📝</i>
                    <div>لا توجد وضعيات مضافة بعد</div>
                </div>
            `;
            return;
        }

        list.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'item';

            // معالجة مسار الصورة
            let imageUrl = item.image || '';
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/') && !imageUrl.startsWith('data:')) {
                imageUrl = '/public/uploads/' + imageUrl;
            }

            // صورة افتراضية إذا لم توجد صورة
            const imageHtml = imageUrl ? 
                `<img src="${imageUrl}" alt="${item.name}" class="item-image" onerror="this.style.display='none'">` :
                '';

            div.innerHTML = `
                ${imageHtml}
                <div class="item-placeholder" style="${imageUrl ? 'display:none' : ''}">
                    <i class="fa fa-image"></i>
                </div>
                <div class="item-content">
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.description || 'لا يوجد وصف'}</div>
                </div>
                <button data-id="${item.id || index}" class="delBtn">
                    <i class="fa fa-trash"></i> حذف
                </button>
            `;
            itemsDiv.appendChild(div);
        });

        bindDelete();
    }

    // ربط أحداث الحذف
    function bindDelete(){
        document.querySelectorAll('.delBtn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if(!confirm('هل تريد حذف هذه الوضعية؟')) return;

                playSound('click');
                try {
                    console.log('🗑️ جاري حذف الوضعية:', id);
                    const response = await fetch('/api/positions/' + id, { 
                        method: 'DELETE' 
                    });

                    if (!response.ok) {
                        throw new Error('فشل في الحذف');
                    }

                    console.log('✅ تم الحذف بنجاح');
                    playSound('success');
                    loadList();
                } catch(error) { 
                    console.error('❌ فشل الحذف:', error);
                    playSound('error');
                    alert('فشل في حذف الوضعية. تأكد من اتصال السيرفر.'); 
                }
            });
        });
    }

    // إضافة وضعية جديدة
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        playSound('click');

        const formData = new FormData(addForm);
        const name = formData.get('name');

        if (!name || !name.trim()) {
            alert('يرجى إدخال اسم الوضعية');
            return;
        }

        const submitBtn = addForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> جاري الإضافة...';
            submitBtn.disabled = true;

            console.log('➕ جاري إضافة وضعية جديدة:', name);
            const response = await fetch('/api/positions', { 
                method: 'POST', 
                body: formData 
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`فشل في الإضافة: ${errorText}`);
            }

            console.log('✅ تمت الإضافة بنجاح');
            playSound('success');
            addForm.reset();
            loadList();

            // إظهار رسالة نجاح
            showSuccess('تمت إضافة الوضعية بنجاح!');

        } catch(error) { 
            console.error('❌ فشل الإضافة:', error);
            playSound('error');
            alert('فشل في إضافة الوضعية: ' + error.message); 
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // تصدير البيانات
    document.getElementById('exportBtn').addEventListener('click', async () => {
        playSound('click');
        try {
            console.log('📤 جاري تصدير البيانات...');
            const response = await fetch('/api/positions');

            if (!response.ok) {
                throw new Error('فشل في جلب البيانات');
            }

            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; 
            a.download = 'wheel-positions-backup.json'; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ تم التصدير بنجاح');
            playSound('success');
        } catch(error) {
            console.error('❌ فشل التصدير:', error);
            playSound('error');
            alert('فشل في تصدير البيانات: ' + error.message);
        }
    });

    // استيراد البيانات
    document.getElementById('importBtn').addEventListener('click', () => {
        playSound('click');
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if(!file) return;

        playSound('click');

        try {
            console.log('📥 جاري استيراد البيانات...');
            const text = await file.text();
            const data = JSON.parse(text);

            // التحقق من صحة البيانات
            if (!Array.isArray(data)) {
                throw new Error('الملف يجب أن يحتوي على مصفوفة من الوضعيات');
            }

            const response = await fetch('/api/positions/import', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('فشل في الاستيراد');
            }

            console.log('✅ تم الاستيراد بنجاح');
            playSound('success');
            loadList();
            e.target.value = ''; // مسح حقل الملف

            showSuccess('تم استيراد البيانات بنجاح!');

        } catch(error) { 
            console.error('❌ فشل الاستيراد:', error);
            playSound('error');
            alert('فشل في استيراد البيانات: ' + error.message); 
        }
    });

    // وظائف مساعدة للرسائل
    function showSuccess(message) {
        // يمكن إضافة نظام إشعارات هنا
        console.log('✅ ' + message);
    }

    function showError(message) {
        // يمكن إضافة نظام إشعارات هنا  
        console.error('❌ ' + message);
    }

    // التحميل الأولي
    console.log('🚀 بدء تحميل لوحة الإدارة...');
    loadList();

})();