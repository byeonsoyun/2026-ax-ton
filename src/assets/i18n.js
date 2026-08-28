/* ===================================================================
   i18n.js — 화면 안내를 노동자의 언어로 (UI-1)

   왜 필요한가
     안전 문구와 이해도 검증 문항은 이미 노동자의 언어로 나가고 그 언어로
     읽힌다 (Store.qtext · library translations). 그런데 거기까지 가는 길 —
     버튼 · 탭바 · 배지 · 안내 음성 — 이 전부 한국어였다.

     크메르어 노동자는 "안전 문구 듣기" 버튼을 찾는 것부터 막힌다.
     내용을 번역해 놓고 그 내용에 닿는 길을 한국어로 두면,
     "문해력을 전제하지 않는다" 는 주장이 절반만 참이 된다.

   ★ 읽는 통로는 이 파일 하나다.
     화면에서 한국어 문자열을 직접 쓰지 않는다. Store.qtext 를 만든 것과
     같은 이유다 — 통로가 하나여야 빠뜨린 곳을 검사가 잡을 수 있다.

   ★★ 이 사전에 "안전 지시" 를 넣지 않는다.
     안전 지시는 Store.library 를 지나 사람의 검수를 받아야 한다.
     여기 있는 것은 버튼 이름과 화면 안내뿐이다. 만약 여기에
     "손을 넣지 마십시오" 같은 문장이 들어오면, 검수를 지나지 않은 안전
     지시가 화면에 나가는 통로가 새로 생긴다. tests/test-i18n.js 가 막는다.

   ★ 번역은 아직 검수 전이다 (REVIEWED 참고).
     그래서 화면에 그 사실을 적는다 (I18N.note). 조용히 두면 검수된 것과
     구분이 안 되고, 이 프로젝트가 문구 라이브러리를 만든 이유가 사라진다.

   ES 모듈을 쓰지 않는다. file:// 로 열려야 한다.
   =================================================================== */

var I18N = (function () {
  'use strict';

  /* 한국어는 원문이라 늘 검수된 것으로 본다.
     나머지는 사람이 확인하기 전까지 false 다. 확인한 언어만 true 로 바꾼다. */
  var REVIEWED = { ko: true, km: false, id: false, vi: false, ne: false, th: false };

  /* -----------------------------------------------------------------
     사전

     ★ 짧게 쓴다. 화면 버튼은 한 줄에 들어가야 하고, 긴 문장은 번역이
       틀릴 확률이 높아진다. 긴 설명은 음성 쪽(speech.*)에만 둔다.
     ----------------------------------------------------------------- */
  var DICT = {

    /* 하단 탭 — 글자를 못 읽어도 아이콘과 함께 위치로 기억한다 */
    'nav.home':   { ko: '홈',   km: 'ទំព័រដើម', id: 'Beranda',  vi: 'Trang chủ', ne: 'गृह',    th: 'หน้าแรก' },
    'nav.learn':  { ko: '교육', km: 'បណ្តុះបណ្តាល', id: 'Pelatihan', vi: 'Đào tạo',  ne: 'तालिम',  th: 'อบรม' },
    'nav.report': { ko: '신고', km: 'រាយការណ៍', id: 'Lapor',     vi: 'Báo cáo',  ne: 'सूचना',  th: 'แจ้ง' },
    'nav.talk':   { ko: '소통', km: 'សន្ទនា',   id: 'Obrolan',   vi: 'Trao đổi', ne: 'कुराकानी', th: 'พูดคุย' },
    'nav.my':     { ko: '마이', km: 'ខ្ញុំ',      id: 'Saya',      vi: 'Của tôi',  ne: 'मेरो',   th: 'ของฉัน' },

    /* 공통 동작 */
    'action.logout': { ko: '로그아웃',   km: 'ចាកចេញ',      id: 'Keluar',      vi: 'Đăng xuất', ne: 'बाहिरिनु',  th: 'ออกจากระบบ' },
    'action.listen': { ko: '들어 보기',  km: 'ស្តាប់',        id: 'Dengarkan',   vi: 'Nghe',      ne: 'सुन्नुहोस्',  th: 'ฟัง' },
    'action.next':   { ko: '다음',       km: 'បន្ទាប់',       id: 'Berikutnya',  vi: 'Tiếp theo', ne: 'अर्को',     th: 'ถัดไป' },
    'action.prev':   { ko: '이전',       km: 'មុន',          id: 'Sebelumnya',  vi: 'Trước',     ne: 'अघिल्लो',   th: 'ก่อนหน้า' },
    'action.home':   { ko: '홈으로',     km: 'ទៅទំព័រដើម',  id: 'Ke beranda',  vi: 'Về trang chủ', ne: 'गृहपृष्ठमा', th: 'ไปหน้าแรก' },
    'action.back':   { ko: '돌아가기',   km: 'ត្រឡប់ក្រោយ',  id: 'Kembali',     vi: 'Quay lại',  ne: 'फर्कनु',    th: 'กลับ' },

    /* 상태 — 색만으로 구분하지 않으므로 이 글자가 뜻을 나른다 */
    'state.done':       { ko: '완료',                   km: 'បានបញ្ចប់',   id: 'Selesai',       vi: 'Hoàn thành', ne: 'सम्पन्न',       th: 'เสร็จแล้ว' },
    'state.notStarted': { ko: '아직 안 들었습니다',     km: 'មិនទាន់ស្តាប់', id: 'Belum diikuti', vi: 'Chưa học',   ne: 'अझै सुनेको छैन', th: 'ยังไม่ได้เรียน' },
    'state.quizLeft':   { ko: '이해도 검증이 남았습니다', km: 'នៅសល់ការត្រួតពិនិត្យ', id: 'Uji pemahaman belum', vi: 'Còn phần kiểm tra', ne: 'जाँच बाँकी', th: 'เหลือการตรวจสอบ' },
    'state.passed':     { ko: '이수',                   km: 'ជាប់',        id: 'Lulus',         vi: 'Đạt',        ne: 'उत्तीर्ण',      th: 'ผ่าน' },
    'state.failed':     { ko: '미통과',                 km: 'មិនជាប់',     id: 'Belum lulus',   vi: 'Chưa đạt',   ne: 'अनुत्तीर्ण',    th: 'ไม่ผ่าน' },
    'state.retry':      { ko: '다시 해야 합니다',       km: 'ត្រូវធ្វើម្តងទៀត', id: 'Harus diulang', vi: 'Phải làm lại', ne: 'फेरि गर्नुपर्छ', th: 'ต้องทำใหม่' },
    'state.allDone':    { ko: '모두 마침',              km: 'បញ្ចប់ទាំងអស់', id: 'Semua selesai', vi: 'Xong tất cả', ne: 'सबै सकियो',   th: 'เสร็จทั้งหมด' },
    'state.correct':    { ko: '정답',                   km: 'ត្រឹមត្រូវ',    id: 'Benar',         vi: 'Đúng',       ne: 'सही',          th: 'ถูก' },
    'state.wrong':      { ko: '틀림',                   km: 'ខុស',         id: 'Salah',         vi: 'Sai',        ne: 'गलत',          th: 'ผิด' },
    'state.checking':   { ko: '확인 중',                km: 'កំពុងពិនិត្យ',  id: 'Diperiksa',     vi: 'Đang xử lý', ne: 'जाँच हुँदै',    th: 'กำลังตรวจสอบ' },
    'state.handled':    { ko: '조치됨',                 km: 'បានដោះស្រាយ', id: 'Ditangani',     vi: 'Đã xử lý',   ne: 'समाधान भयो',   th: 'ดำเนินการแล้ว' },
    'state.urgent':     { ko: '긴급',                   km: 'បន្ទាន់',      id: 'Mendesak',      vi: 'Khẩn cấp',   ne: 'अत्यावश्यक',   th: 'ด่วน' },

    /* 홈 */
    'home.todayPhrase':  { ko: '오늘의 안전 문구',        km: 'សារសុវត្ថិភាពថ្ងៃនេះ', id: 'Pesan keselamatan hari ini', vi: 'Câu an toàn hôm nay', ne: 'आजको सुरक्षा वाक्य', th: 'ข้อความความปลอดภัยวันนี้' },
    'home.myCourses':    { ko: '내 교육',                km: 'ការបណ្តុះបណ្តាលរបស់ខ្ញុំ', id: 'Pelatihan saya', vi: 'Khóa của tôi', ne: 'मेरो तालिम', th: 'การอบรมของฉัน' },
    'home.retryOrder':   { ko: '다시 들어 주세요',        km: 'សូមស្តាប់ម្តងទៀត',  id: 'Mohon ikuti lagi', vi: 'Vui lòng học lại', ne: 'कृपया फेरि सुन्नुहोस्', th: 'กรุณาเรียนอีกครั้ง' },
    'home.listenPhrase': { ko: '안전 문구 듣기',          km: 'ស្តាប់សារសុវត្ថិភាព', id: 'Dengarkan pesan', vi: 'Nghe câu an toàn', ne: 'सुरक्षा वाक्य सुन्नुहोस्', th: 'ฟังข้อความความปลอดภัย' },
    'home.prevPhrase':   { ko: '이전 안전 문구',          km: 'សារមុន',        id: 'Pesan sebelumnya', vi: 'Câu trước', ne: 'अघिल्लो वाक्य', th: 'ข้อความก่อนหน้า' },
    'home.nextPhrase':   { ko: '다음 안전 문구',          km: 'សារបន្ទាប់',     id: 'Pesan berikutnya', vi: 'Câu tiếp theo', ne: 'अर्को वाक्य', th: 'ข้อความถัดไป' },
    'home.badTrans':     { ko: '말이 이상하면 알려 주세요', km: 'បើពាក្យខុស សូមប្រាប់', id: 'Beri tahu jika terjemahan aneh', vi: 'Nếu câu chữ sai, hãy báo', ne: 'अनुवाद अनौठो भए भन्नुहोस्', th: 'ถ้าคำแปลผิด โปรดแจ้ง' },
    'home.listenStatus': { ko: '내 교육 상태 듣기',       km: 'ស្តាប់ស្ថានភាព',  id: 'Dengarkan status', vi: 'Nghe tình trạng', ne: 'अवस्था सुन्नुहोस्', th: 'ฟังสถานะ' },
    'home.offlineOk':    { ko: '오프라인 가능',           km: 'ប្រើបានគ្មានអ៊ីនធឺណិត', id: 'Bisa tanpa internet', vi: 'Dùng được khi mất mạng', ne: 'इन्टरनेट बिना चल्छ', th: 'ใช้ได้แบบออฟไลน์' },

    /* 교육 */
    'learn.title':        { ko: '안전교육 수강',          km: 'រៀនសុវត្ថិភាព',   id: 'Ikuti pelatihan', vi: 'Học an toàn', ne: 'सुरक्षा तालिम', th: 'เรียนความปลอดภัย' },
    'learn.backToList':   { ko: '교육 목록으로 돌아가기', km: 'ត្រឡប់ទៅបញ្ជី',  id: 'Kembali ke daftar', vi: 'Quay lại danh sách', ne: 'सूचीमा फर्कनु', th: 'กลับไปที่รายการ' },
    'learn.notYet':       { ko: '아직 들을 수 없습니다',  km: 'មិនទាន់អាចស្តាប់', id: 'Belum bisa diikuti', vi: 'Chưa thể học', ne: 'अझै सुन्न सकिँदैन', th: 'ยังเรียนไม่ได้' },
    'learn.listenAgain':  { ko: '이 문구를 다시 듣기',    km: 'ស្តាប់សារនេះម្តងទៀត', id: 'Dengarkan lagi', vi: 'Nghe lại câu này', ne: 'फेरि सुन्नुहोस्', th: 'ฟังอีกครั้ง' },
    'learn.startQuiz':    { ko: '이해도 검증 시작',       km: 'ចាប់ផ្តើមត្រួតពិនិត្យ', id: 'Mulai uji pemahaman', vi: 'Bắt đầu kiểm tra', ne: 'जाँच सुरु गर्नुहोस्', th: 'เริ่มตรวจความเข้าใจ' },
    'learn.transPending': { ko: '내 언어 번역 준비 중',   km: 'កំពុងរៀបចំការបកប្រែ', id: 'Terjemahan disiapkan', vi: 'Đang chuẩn bị bản dịch', ne: 'अनुवाद तयारीमा', th: 'กำลังเตรียมคำแปล' },

    /* 이해도 검증 */
    'quiz.nextQuestion': { ko: '다음 문항',        km: 'សំណួរបន្ទាប់',    id: 'Soal berikutnya', vi: 'Câu hỏi tiếp', ne: 'अर्को प्रश्न', th: 'ข้อถัดไป' },
    'quiz.listenAgain':  { ko: '문항을 다시 듣기', km: 'ស្តាប់សំណួរម្តងទៀត', id: 'Dengarkan soal lagi', vi: 'Nghe lại câu hỏi', ne: 'प्रश्न फेरि सुन्नुहोस्', th: 'ฟังคำถามอีกครั้ง' },

    /* 신고 */
    'report.title':     { ko: '위험한 곳 알리기',        km: 'ជូនដំណឹងកន្លែងគ្រោះថ្នាក់', id: 'Laporkan tempat berbahaya', vi: 'Báo nơi nguy hiểm', ne: 'खतरा ठाउँ जनाउनु', th: 'แจ้งจุดอันตราย' },
    'report.anon':      { ko: '이름을 남기지 않습니다',  km: 'មិនទុកឈ្មោះទេ',   id: 'Nama tidak dicatat', vi: 'Không lưu tên', ne: 'नाम राखिँदैन', th: 'ไม่บันทึกชื่อ' },
    'report.step1':     { ko: '어디입니까',              km: 'នៅឯណា',          id: 'Di mana',        vi: 'Ở đâu',      ne: 'कहाँ',        th: 'ที่ไหน' },
    'report.step2':     { ko: '무엇이 위험합니까',       km: 'អ្វីគ្រោះថ្នាក់',   id: 'Apa yang berbahaya', vi: 'Nguy hiểm gì', ne: 'के खतरा छ', th: 'อะไรอันตราย' },
    'report.step3':     { ko: '더 할 말 (안 써도 됩니다)', km: 'បន្ថែម (មិនចាំបាច់)', id: 'Tambahan (boleh kosong)', vi: 'Thêm (không bắt buộc)', ne: 'थप (नलेखे पनि हुन्छ)', th: 'เพิ่มเติม (ไม่บังคับ)' },
    'report.send':      { ko: '이대로 알리기',           km: 'ជូនដំណឹងឥឡូវ',    id: 'Kirim laporan',  vi: 'Gửi báo cáo', ne: 'पठाउनुहोस्',  th: 'ส่งแจ้ง' },
    'report.thanks':    { ko: '알려 주셔서 고맙습니다',  km: 'អរគុណសម្រាប់ការជូនដំណឹង', id: 'Terima kasih atas laporannya', vi: 'Cảm ơn bạn đã báo', ne: 'जानकारीका लागि धन्यवाद', th: 'ขอบคุณที่แจ้ง' },
    'report.again':     { ko: '또 알리기',               km: 'ជូនដំណឹងម្តងទៀត', id: 'Lapor lagi',     vi: 'Báo tiếp',   ne: 'फेरि जनाउनु', th: 'แจ้งอีก' },
    'report.listTitle': { ko: '우리 현장에 들어온 신고', km: 'របាយការណ៍នៅកន្លែងធ្វើការ', id: 'Laporan di lokasi kami', vi: 'Báo cáo tại công trường', ne: 'हाम्रो कार्यस्थलका सूचना', th: 'รายงานในไซต์งาน' },
    'report.ticketNo':  { ko: '접수 번호',               km: 'លេខទទួល',        id: 'Nomor laporan',  vi: 'Số tiếp nhận', ne: 'दर्ता नम्बर', th: 'หมายเลขรับแจ้ง' },

    /* 소통 */
    'talk.title':      { ko: '물어보기',              km: 'សួរសំណួរ',      id: 'Bertanya',      vi: 'Hỏi',         ne: 'सोध्नुहोस्',   th: 'ถาม' },
    'talk.new':        { ko: '새로 쓰기',             km: 'សរសេរថ្មី',      id: 'Tulis baru',    vi: 'Viết mới',    ne: 'नयाँ लेख्नुहोस्', th: 'เขียนใหม่' },
    'talk.titleField': { ko: '제목',                  km: 'ចំណងជើង',       id: 'Judul',         vi: 'Tiêu đề',     ne: 'शीर्षक',      th: 'หัวข้อ' },
    'talk.bodyField':  { ko: '내용 (안 써도 됩니다)', km: 'ខ្លឹមសារ (មិនចាំបាច់)', id: 'Isi (boleh kosong)', vi: 'Nội dung (không bắt buộc)', ne: 'विषयवस्तु (नलेखे पनि हुन्छ)', th: 'เนื้อหา (ไม่บังคับ)' },
    'talk.cancel':     { ko: '그만두기',              km: 'បោះបង់',        id: 'Batal',         vi: 'Hủy',         ne: 'रद्द',        th: 'ยกเลิก' },
    'talk.submit':     { ko: '올리기',                km: 'ផ្ញើ',           id: 'Kirim',         vi: 'Đăng',        ne: 'पठाउनुहोस्',  th: 'ส่ง' },
    'talk.comment':    { ko: '댓글 쓰기',             km: 'សរសេរមតិ',      id: 'Tulis komentar', vi: 'Viết bình luận', ne: 'टिप्पणी लेख्नुहोस्', th: 'เขียนความเห็น' },
    'talk.toList':     { ko: '목록으로',              km: 'ទៅបញ្ជី',        id: 'Ke daftar',     vi: 'Về danh sách', ne: 'सूचीमा',     th: 'ไปที่รายการ' },
    'talk.official':   { ko: '공식 답변',             km: 'ចម្លើយផ្លូវការ',  id: 'Jawaban resmi', vi: 'Trả lời chính thức', ne: 'आधिकारिक जवाफ', th: 'คำตอบทางการ' },

    /* 마이 */
    'my.title':    { ko: '내 기록',        km: 'កំណត់ត្រារបស់ខ្ញុំ', id: 'Catatan saya',  vi: 'Hồ sơ của tôi', ne: 'मेरो अभिलेख', th: 'บันทึกของฉัน' },
    'my.info':     { ko: '내 정보',        km: 'ព័ត៌មានរបស់ខ្ញុំ',  id: 'Informasi saya', vi: 'Thông tin của tôi', ne: 'मेरो जानकारी', th: 'ข้อมูลของฉัน' },
    'my.courses':  { ko: '받은 교육',      km: 'ការបណ្តុះបណ្តាលដែលបានទទួល', id: 'Pelatihan yang diikuti', vi: 'Khóa đã học', ne: 'प्राप्त तालिम', th: 'การอบรมที่ได้รับ' },
    'my.proof':    { ko: '내 수강 증빙',   km: 'ភស្តុតាងចូលរួម',  id: 'Bukti pelatihan', vi: 'Chứng nhận đã học', ne: 'तालिम प्रमाण', th: 'หลักฐานการอบรม' },
    'my.print':    { ko: '증빙 출력하기',  km: 'បោះពុម្ពភស្តុតាង', id: 'Cetak bukti',    vi: 'In chứng nhận', ne: 'प्रमाण छाप्नुहोस्', th: 'พิมพ์หลักฐาน' },
    'my.myLang':   { ko: '내 언어',        km: 'ភាសារបស់ខ្ញុំ',    id: 'Bahasa saya',    vi: 'Ngôn ngữ của tôi', ne: 'मेरो भाषा',   th: 'ภาษาของฉัน' },
    'my.fontSize': { ko: '글자 크기',      km: 'ទំហំអក្សរ',       id: 'Ukuran huruf',   vi: 'Cỡ chữ',      ne: 'अक्षर आकार',  th: 'ขนาดตัวอักษร' },

    /* 말로만 나가는 안내 — 화면에 글자로는 없고 음성으로만 흐른다.
       ★ 여기 있는 것도 "안전 지시" 가 아니다. 무엇을 하면 되는지의 안내다. */
    'speech.reportDone':  { ko: '알려 주셔서 고맙습니다. 접수되었습니다.', km: 'អរគុណ។ បានទទួលរួចហើយ។', id: 'Terima kasih. Laporan sudah diterima.', vi: 'Cảm ơn bạn. Đã tiếp nhận báo cáo.', ne: 'धन्यवाद। सूचना प्राप्त भयो।', th: 'ขอบคุณ ได้รับแจ้งแล้ว' },
    'speech.anonNotice':  { ko: '알려 주신 분이 누구인지는 기록하지 않습니다.', km: 'យើងមិនកត់ត្រាថាអ្នកណាបានប្រាប់ទេ។', id: 'Kami tidak mencatat siapa yang melapor.', vi: 'Chúng tôi không ghi lại ai đã báo.', ne: 'कसले जानकारी दियो भन्ने राखिँदैन।', th: 'เราไม่บันทึกว่าใครเป็นผู้แจ้ง' },

    'speech.anonReport':  { ko: '누가 알렸는지는 저장하지 않습니다. 관리자도 알 수 없습니다. 걱정하지 말고 알려 주세요.', km: 'យើងមិនរក្សាទុកថាអ្នកណាបានប្រាប់ទេ។ អ្នកគ្រប់គ្រងក៏មិនដឹងដែរ។ សូមកុំបារម្ភ ហើយប្រាប់មក។', id: 'Kami tidak menyimpan siapa yang melapor. Pengelola pun tidak tahu. Jangan khawatir, laporkan saja.', vi: 'Chúng tôi không lưu ai đã báo. Người quản lý cũng không biết. Đừng lo, hãy báo cho chúng tôi.', ne: 'कसले जनायो भन्ने सुरक्षित गरिँदैन। प्रबन्धकले पनि थाहा पाउँदैन। नडराई जानकारी दिनुहोस्।', th: 'เราไม่เก็บว่าใครเป็นผู้แจ้ง ผู้ดูแลก็ไม่ทราบ ไม่ต้องกังวล แจ้งได้เลย' },
    'speech.badTrans':    { ko: '안전 문구의 말이 이상하면 관리자에게 알려 주세요. 알려 주신 분이 누구인지는 기록하지 않습니다.', km: 'បើពាក្យក្នុងសារសុវត្ថិភាពខុស សូមប្រាប់អ្នកគ្រប់គ្រង។ យើងមិនកត់ត្រាថាអ្នកណាបានប្រាប់ទេ។', id: 'Jika kalimat pesan keselamatan terasa aneh, beri tahu pengelola. Kami tidak mencatat siapa yang memberi tahu.', vi: 'Nếu câu chữ trong thông điệp an toàn có vẻ sai, hãy báo cho người quản lý. Chúng tôi không ghi lại ai đã báo.', ne: 'सुरक्षा वाक्यको भाषा अनौठो लागे प्रबन्धकलाई भन्नुहोस्। कसले भन्यो भन्ने राखिँदैन।', th: 'หากข้อความความปลอดภัยดูผิดเพี้ยน โปรดแจ้งผู้ดูแล เราไม่บันทึกว่าใครเป็นผู้แจ้ง' },
    'action.listenGuide': { ko: '설명 듣기',        km: 'ស្តាប់ការពន្យល់',  id: 'Dengarkan penjelasan', vi: 'Nghe giải thích', ne: 'व्याख्या सुन्नुहोस्', th: 'ฟังคำอธิบาย' },
    'report.listenDone':  { ko: '접수 안내 듣기',   km: 'ស្តាប់ការជូនដំណឹង', id: 'Dengarkan info laporan', vi: 'Nghe thông báo tiếp nhận', ne: 'दर्ता जानकारी सुन्नुहोस्', th: 'ฟังข้อมูลการรับแจ้ง' },
    'report.listenAnon':  { ko: '익명 안내 듣기',   km: 'ស្តាប់ការពន្យល់អនាមិក', id: 'Dengarkan info anonim', vi: 'Nghe giải thích ẩn danh', ne: 'गुमनाम जानकारी सुन्नुहोस्', th: 'ฟังข้อมูลการไม่ระบุชื่อ' },

    /* 이 화면 자체에 대한 고지 */
    'i18n.unreviewed': { ko: '이 화면 안내의 번역은 아직 검수 전입니다.', km: 'ការបកប្រែនៃការណែនាំនេះមិនទាន់ត្រួតពិនិត្យទេ។', id: 'Terjemahan panduan layar ini belum diperiksa.', vi: 'Bản dịch hướng dẫn màn hình này chưa được kiểm duyệt.', ne: 'यस पर्दाको निर्देशनको अनुवाद अझै जाँच भएको छैन।', th: 'คำแปลคำแนะนำหน้านี้ยังไม่ได้ตรวจสอบ' }
  };

  /* -----------------------------------------------------------------
     읽기
     ----------------------------------------------------------------- */

  /* 지금 화면을 보는 사람의 언어.
     로그인 전이거나 관리자면 한국어다 — 관리자 화면은 번역하지 않는다. */
  function lang() {
    try {
      var u = (typeof Auth !== 'undefined') && Auth.current();
      return (u && u.lang) || 'ko';
    } catch (e) {
      return 'ko';
    }
  }

  function has(key, code) {
    var row = DICT[key];
    return !!(row && row[code || lang()]);
  }

  /* ★ 없으면 한국어로 내려간다. 빈 글자를 내보내면 버튼 이름이 사라지고,
     글을 못 읽는 사람에게는 그 자리가 통째로 없어진 것과 같다. */
  function t(key, code) {
    var row = DICT[key];
    if (!row) return key;                    // 키를 그대로 — 빠뜨린 것이 눈에 보이게
    var l = code || lang();
    return row[l] || row.ko || key;
  }

  /* UI.speak 에 그대로 넘길 수 있는 모양.
     기기에 그 언어 음성이 없으면 UI.speak 이 ko 로 내려간다. */
  function say(key, code) {
    var l = code || lang();
    return { text: t(key, l), lang: l, ko: t(key, 'ko') };
  }

  function reviewed(code) {
    return REVIEWED[code || lang()] === true;
  }

  /* 검수 전이면 그 사실을 적을 문장, 검수됐으면 빈 글자.
     UI.voiceNote 와 같은 방식이다 — 안 되는 것을 조용히 두지 않는다. */
  function note(code) {
    return reviewed(code) ? '' : t('i18n.unreviewed', code);
  }

  /* -----------------------------------------------------------------
     화면에 붙이기

     HTML 에는 data-i18n="키" 만 적는다. 한국어 원문은 그대로 두어서,
     JS 가 멈춰도 화면이 비지 않는다.
     ----------------------------------------------------------------- */
  function apply(root, code) {
    var l = code || lang();
    var scope = root || document;
    if (!scope.querySelectorAll) return;

    Array.prototype.slice.call(scope.querySelectorAll('[data-i18n]')).forEach(function (node) {
      node.textContent = t(node.getAttribute('data-i18n'), l);
    });

    /* 소리로 읽어 주는 이름(aria-label)도 같은 언어여야 한다.
       화면은 크메르어인데 읽어 주는 이름만 한국어면 화면 낭독기가 헷갈린다. */
    Array.prototype.slice.call(scope.querySelectorAll('[data-i18n-aria]')).forEach(function (node) {
      node.setAttribute('aria-label', t(node.getAttribute('data-i18n-aria'), l));
    });

    /* 문서 언어를 알려 준다. 브라우저가 글꼴과 줄바꿈을 그 언어에 맞춘다. */
    if (document.documentElement) document.documentElement.setAttribute('lang', l);
  }

  return {
    t: t, has: has, say: say, apply: apply,
    lang: lang, reviewed: reviewed, note: note,
    REVIEWED: REVIEWED, DICT: DICT
  };
})();
