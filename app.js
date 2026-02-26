/**
 * LIFF アプリ選択メニュー（静的ディレクトリ版）
 * アプリ選択 → 相談部屋LINE への友だち追加を誘導
 */
(function () {
  'use strict';

  // === 設定 ===
  var LIFF_ID = '2009188037-EJ4sq6gE';
  var HIDDEN_KEY = 'liff_hidden_unlocked';
  var HIDDEN_PW = 'shikiboubou';
  // 相談部屋（@643ianwu）友だち追加URL
  var CONSULT_LINE_ADD_FRIEND_URL = 'https://lin.ee/UOIlqJW';

  // === DOM要素 ===
  var searchInput = document.getElementById('searchInput');
  var categoriesContainer = document.getElementById('categories');
  var appGrid = document.getElementById('appGrid');

  // === 状態 ===
  var allApps = [];
  var allCategories = [];
  var currentCategory = 'all';
  var currentSearch = '';
  var hiddenUnlocked = localStorage.getItem(HIDDEN_KEY) === '1';

  // === アプリ詳細情報 ===
  var appDetails = {
    storytelling: {
      description: 'ストーリーで学ぶプレゼン術。チャプター形式の学習とクイズで、話し方のスキルが身につきます。',
    },
    personality: {
      description: '12動物の個性を学んで覚えよう。個性心理学のチャプター学習とクイズで理解を深めます。',
    },
    animals_consult: {
      description: '5アニマルで相手との関わり方をAI分析。診断スクショを送るだけで、関係性のアドバイスがもらえます。',
    },
  };

  // === LIFF 初期化 ===
  liff.init({ liffId: LIFF_ID })
    .then(function () {
      try {
        if (!liff.isInClient() && !liff.isLoggedIn()) {
          liff.login();
          return;
        }
        var lockBtn = document.getElementById('lockBtn');
        lockBtn.textContent = hiddenUnlocked ? '🔓' : '🔒';
        initLockButton();
        loadApps();
      } catch (e) {
        console.error('App display error:', e);
        showError('表示エラー: ' + e.message);
      }
    })
    .catch(function (err) {
      console.error('LIFF init error:', err);
      showError('LIFFの初期化に失敗しました: ' + (err.message || err));
    });

  // === アプリ一覧読み込み ===
  function loadApps() {
    showLoading();
    fetch('./apps.json')
      .then(function (res) { return res.json(); })
      .then(function (apps) {
        allApps = apps;
        allCategories = extractCategories(apps);
        renderCategories();
        renderApps();
      })
      .catch(function (err) {
        console.error('Failed to load apps:', err);
        showError('アプリ一覧の読み込みに失敗しました');
      });
  }

  // === カテゴリ抽出 ===
  function extractCategories(apps) {
    var cats = {};
    apps.forEach(function (app) {
      if (!app.hidden || hiddenUnlocked) {
        if (app.category) cats[app.category] = true;
      }
    });
    return Object.keys(cats);
  }

  // === カテゴリタブ描画 ===
  function renderCategories() {
    var html = '<button class="category-tab active" data-cat="all">すべて</button>';
    allCategories.forEach(function (cat) {
      html += '<button class="category-tab" data-cat="' + cat + '">' + cat + '</button>';
    });
    categoriesContainer.innerHTML = html;

    categoriesContainer.querySelectorAll('.category-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentCategory = this.getAttribute('data-cat');
        categoriesContainer.querySelectorAll('.category-tab').forEach(function (b) {
          b.classList.remove('active');
        });
        this.classList.add('active');
        renderApps();
      });
    });
  }

  // === アプリカード描画 ===
  function renderApps() {
    var filtered = allApps.filter(function (app) {
      if (app.hidden && !hiddenUnlocked) return false;
      var matchCat = currentCategory === 'all' || app.category === currentCategory;
      var matchSearch = !currentSearch ||
        app.name.indexOf(currentSearch) !== -1 ||
        app.description.indexOf(currentSearch) !== -1;
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      appGrid.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">🔍</div>' +
        '<p>アプリが見つかりません</p>' +
        '</div>';
      return;
    }

    var html = '';
    filtered.forEach(function (app) {
      html +=
        '<div class="app-card" data-id="' + app.id + '">' +
        '<div class="app-icon">' + app.icon + '</div>' +
        '<div class="app-name">' + app.name + '</div>' +
        '<div class="app-desc">' + app.description + '</div>' +
        '</div>';
    });
    appGrid.innerHTML = html;

    appGrid.querySelectorAll('.app-card').forEach(function (card) {
      card.addEventListener('click', function () {
        selectApp(this.getAttribute('data-id'));
      });
    });
  }

  // === アプリ選択 → メッセージ送信して起動 ===
  var appCommands = {
    storytelling: 'ストーリーテリング',
    personality: '個性心理学',
    animals_consult: '5アニマルズ相談',
  };

  function selectApp(appId) {
    var command = appCommands[appId];
    if (!command) {
      alert('DEBUG: command not found for ' + appId);
      return;
    }

    alert('「' + command + '」を起動します');

    if (liff.isInClient()) {
      liff.sendMessage({ type: 'text', text: command })
        .then(function () {
          liff.closeWindow();
        })
        .catch(function (err) {
          alert('送信エラー: ' + (err.message || err));
          liff.closeWindow();
        });
    } else {
      alert('DEBUG: not in client');
    }
  }

  // === 相談部屋LINE誘導モーダルイベント ===
  document.getElementById('qaAddFriend').addEventListener('click', function () {
    if (liff.isInClient()) {
      liff.openWindow({ url: CONSULT_LINE_ADD_FRIEND_URL, external: true });
    } else {
      window.open(CONSULT_LINE_ADD_FRIEND_URL, '_blank');
    }
  });

  document.getElementById('qaClose').addEventListener('click', function () {
    document.getElementById('qaModal').style.display = 'none';
  });

  document.getElementById('qaModal').addEventListener('click', function (e) {
    if (e.target === this) this.style.display = 'none';
  });

  // === 鍵ボタン ===
  function initLockButton() {
    var lockBtn = document.getElementById('lockBtn');
    var modal = document.getElementById('pwModal');
    var pwInput = document.getElementById('pwInput');
    var pwError = document.getElementById('pwError');
    var pwCancel = document.getElementById('pwCancel');
    var pwSubmit = document.getElementById('pwSubmit');

    lockBtn.addEventListener('click', function () {
      if (hiddenUnlocked) {
        hiddenUnlocked = false;
        localStorage.removeItem(HIDDEN_KEY);
        lockBtn.textContent = '🔒';
        allCategories = extractCategories(allApps);
        renderCategories();
        renderApps();
        return;
      }
      modal.style.display = 'flex';
      pwInput.value = '';
      pwError.style.display = 'none';
      pwInput.focus();
    });

    pwCancel.addEventListener('click', function () {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.style.display = 'none';
    });

    pwSubmit.addEventListener('click', function () {
      if (pwInput.value === HIDDEN_PW) {
        hiddenUnlocked = true;
        localStorage.setItem(HIDDEN_KEY, '1');
        lockBtn.textContent = '🔓';
        modal.style.display = 'none';
        allCategories = extractCategories(allApps);
        renderCategories();
        renderApps();
      } else {
        pwError.style.display = 'block';
        pwInput.value = '';
        pwInput.focus();
      }
    });

    pwInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') pwSubmit.click();
    });
  }

  // === 検索 ===
  searchInput.addEventListener('input', function () {
    currentSearch = this.value.trim();
    renderApps();
  });

  // === ヘルパー ===
  function showLoading() {
    appGrid.innerHTML =
      '<div class="loading"><div class="loading-spinner"></div></div>';
  }

  function showError(msg) {
    appGrid.innerHTML =
      '<div class="error-message">' +
      '<p>' + msg + '</p>' +
      '<button onclick="location.reload()">再読み込み</button>' +
      '</div>';
  }
})();
