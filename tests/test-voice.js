/* 말로 알리기 (음성 신고) — 익명이 지켜지는가, 조용히 실패하지 않는가

   ★★ 이 묶음에서 가장 중요한 것은 "목소리가 저장되지 않는가" 다.
     reports 는 익명인데 목소리는 사람을 식별한다. 작은 사업장에서는
     담당자가 녹음을 들으면 누구인지 거의 확실히 안다.
     녹음을 붙이는 순간 익명 신고가 익명이 아니게 되고, 신고가 멈춘다.

   jsdom 에는 SpeechRecognition 이 없다. 그래서 두 가지를 본다.
     1. 없는 환경에서 화면이 조용히 실패하지 않는가 (V4 와 같은 규칙)
     2. 가짜 SpeechRecognition 을 심어 실제 흐름을 돌려 본다 */
const fs = require('fs');
const path = require('path');
const { boot, ok, eq, has, report, SRC } = require('./harness');

const ui = fs.readFileSync(path.join(SRC, 'assets/ui.js'), 'utf8');
const rjs = fs.readFileSync(path.join(SRC, 'worker/report.js'), 'utf8');
const rhtml = fs.readFileSync(path.join(SRC, 'worker/report.html'), 'utf8');

/* 가짜 받아쓰기 — 브라우저 대신 우리가 결과를 준다 */
function fakeRecognition(win, script) {
  win.SpeechRecognition = function () {
    var self = this;
    this.lang = ''; this.continuous = false; this.interimResults = false;
    this.start = function () {
      win.__rec = self;
      setTimeout(function () { script(self); }, 0);
    };
    this.stop = function () { if (self.onend) self.onend(); };
    this.abort = function () { if (self.onend) self.onend(); };
  };
}

/* =================================================================
   1. ★★ 목소리를 저장하지 않는가
   ================================================================= */
{
  /* 코드에 녹음 기능이 아예 없어야 한다.
     MediaRecorder 가 들어오면 그때부터 오디오를 담을 수 있게 된다. */
  const RECORDERS = ['MediaRecorder', 'getUserMedia', 'audio/webm', 'AudioContext'];
  const hits = RECORDERS.filter((w) => ui.indexOf(w) !== -1 || rjs.indexOf(w) !== -1);
  ok('★★ 녹음하는 코드가 없다 (오디오를 담을 수 있게 되면 익명이 깨진다)',
    hits.length === 0, hits.join(', '));

  has('★ 왜 목소리를 저장하지 않는지 ui.js 에 적혀 있다', ui, '목소리는 사람을 식별');
  has('★ 신고 화면에도 적혀 있다', rjs, '목소리');
  has('★ 사람이 보는 화면에 그 사실이 있다', rhtml, 'voice.privacy');
}

/* =================================================================
   2. 외부 요청 0건 규칙의 예외를 숨기지 않는가
   ================================================================= */
{
  has('★ 인터넷이 필요하다는 것을 화면에 적는다', rhtml, 'voice.netNotice');
  has('그 예외를 ui.js 주석에 적어 뒀다', ui, '외부 요청 0건 규칙의 유일한 예외');
  has('오프라인이면 못 한다는 것을 판정에 넣었다', ui, "return 'offline';");
}

/* =================================================================
   3. 없는 브라우저에서 조용히 실패하지 않는가 (V4 와 같은 규칙)
   ================================================================= */
{
  const b = boot('worker/report.html', { login: 'W-4821-07', page: 'worker/report.js' });
  ok('화면이 오류 없이 뜬다', b.errors.length === 0, b.errors.join(' | '));

  eq('받아쓰기를 못 하는 것으로 판정한다', b.win.UI.listenReady(), false);
  eq('무엇이 문제인지 코드로 돌려준다', b.win.UI.listenProblem(), 'unsupported');

  const btn = b.$('btn-voice');
  ok('★ 버튼을 감추지 않는다 (감추면 사람은 고장으로 읽는다)',
    btn !== null && btn.hidden === false);

  const state = b.$('voice-state');
  ok('★ 왜 안 되는지 화면에 적혀 있다', state && state.hidden === false);
  has('손으로 쓰는 길을 함께 알려 준다', state ? state.textContent : '',
    b.win.I18N.t('voice.errUnsupported'));
  ok('★ 그 안내가 이 사람의 언어로 나온다 (크메르어)',
    b.win.I18N.t('voice.errUnsupported') !== b.win.I18N.t('voice.errUnsupported', 'ko'));

  /* 눌러도 아무 일이 없으면 그것이 가장 나쁜 실패다 */
  btn.dispatchEvent(new b.win.Event('click'));
  ok('눌러도 화면이 안 깨진다', b.errors.length === 0, b.errors.join(' | '));
  ok('누른 뒤에도 이유가 그대로 적혀 있다', state.hidden === false);
}

/* =================================================================
   4. 되는 브라우저에서 실제로 옮겨지는가
   ================================================================= */
{
  const b = boot('worker/report.html', {
    login: 'W-4821-07', page: 'worker/report.js',
    before: function (win) {
      fakeRecognition(win, function (rec) {
        rec.onresult({
          resultIndex: 0,
          results: [{ 0: { transcript: '덮개가 흔들립니다' }, isFinal: true, length: 1 }]
        });
        rec.onend();
      });
    }
  });

  ok('화면이 오류 없이 뜬다', b.errors.length === 0, b.errors.join(' | '));
  eq('받아쓰기를 할 수 있는 것으로 판정한다', b.win.UI.listenReady(), true);
  eq('막는 이유가 없다', b.win.UI.listenProblem(), '');

  const state = b.$('voice-state');
  ok('되는 브라우저에는 경고가 안 뜬다', state.hidden === true);

  b.$('btn-voice').dispatchEvent(new b.win.Event('click'));

  /* 받아쓰기 결과는 다음 차례에 온다. 타이머가 살아 있으면 node 는 기다린다. */
  setTimeout(function () {
      eq('★ 말한 것이 메모 칸에 글자로 들어간다', b.$('memo').value, '덮개가 흔들립니다');
      ok('옮겼다고 화면에 적는다', state.hidden === false);
      has('무엇을 하라고 알려 준다', state.textContent, b.win.I18N.t('voice.gotIt'));

      /* ★ 옮긴 글을 사람이 고칠 수 있어야 한다. 받아쓰기는 틀린다. */
      ok('★ 옮긴 글이 고칠 수 있는 칸에 들어간다 (받아쓰기는 틀린다)',
        b.$('memo').tagName === 'INPUT' && !b.$('memo').readOnly);

      /* 알아듣는 언어가 그 사람의 언어여야 한다 */
      eq('★ 그 사람의 언어로 알아듣는다 (크메르어)', b.win.__rec.lang, 'km-KH');

      /* 접수하면 "옮긴 글" 이라는 표시가 남고, 목소리는 안 남는다 */
      b.win.document.querySelector('input[name="equip"]').checked = true;
      b.win.document.querySelector('input[name="hazard"]').checked = true;
      b.$('btn-send').dispatchEvent(new b.win.Event('click'));

      const made = b.win.Store.reports.load().slice(-1)[0];
      eq('★ 말로 알린 것이라는 표시가 남는다', made.memoFromVoice, true);
      eq('옮겨진 글자가 그대로 저장된다', made.memo, '덮개가 흔들립니다');
      ok('★★ 저장된 것에 목소리가 없다',
        !/audio|blob|base64|recording/i.test(JSON.stringify(made)), JSON.stringify(made));
      ok('★★ 저장된 것에 사람을 가리키는 값이 없다',
        !JSON.stringify(made).includes('W-4821'), JSON.stringify(made));

    report('말로 알리기 — 익명이 지켜지는가 (음성 신고)');
  }, 20);
}
