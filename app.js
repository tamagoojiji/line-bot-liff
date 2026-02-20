/**
 * LIFF アプリ選択メニュー
 */
(function () {
  'use strict';

  // === 設定 ===
  var LIFF_ID = '2009188037-EJ4sq6gE';
  var PROFILE_KEY = 'liff_profile_registered';

  // === DOM要素 ===
  var profileForm = document.getElementById('profileForm');
  var appSection = document.getElementById('appSection');
  var searchInput = document.getElementById('searchInput');
  var categoriesContainer = document.getElementById('categories');
  var appGrid = document.getElementById('appGrid');

  // === 状態 ===
  var allApps = [];
  var allCategories = [];
  var currentCategory = 'all';
  var currentSearch = '';
  var selectedGender = '';

  // === LIFF 初期化 ===
  liff.init({ liffId: LIFF_ID })
    .then(function () {
      if (!liff.isInClient() && !liff.isLoggedIn()) {
        liff.login();
        return;
      }
      // プロフィール登録済みか確認
      if (localStorage.getItem(PROFILE_KEY)) {
        showAppSection();
      } else {
        showProfileForm();
      }
    })
    .catch(function (err) {
      console.error('LIFF init error:', err);
      showError('LIFFの初期化に失敗しました');
    });

  // === プロフィールフォーム表示 ===
  function showProfileForm() {
    profileForm.style.display = 'block';
    appSection.style.display = 'none';
    categoriesContainer.style.display = 'none';
    appGrid.style.display = 'none';
    initProfileForm();
  }

  // === アプリ一覧表示 ===
  function showAppSection() {
    profileForm.style.display = 'none';
    appSection.style.display = '';
    categoriesContainer.style.display = '';
    appGrid.style.display = '';
    loadApps();
  }

  // === プロフィールフォーム初期化 ===
  function initProfileForm() {
    var yearSelect = document.getElementById('birthYear');
    var monthSelect = document.getElementById('birthMonth');
    var daySelect = document.getElementById('birthDay');
    var submitBtn = document.getElementById('profileSubmit');
    var nicknameInput = document.getElementById('nickname');

    // 年（1940〜今年）
    var currentYear = new Date().getFullYear();
    for (var y = currentYear; y >= 1940; y--) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y + '年';
      yearSelect.appendChild(opt);
    }

    // 月
    for (var m = 1; m <= 12; m++) {
      var opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m + '月';
      monthSelect.appendChild(opt);
    }

    // 日
    for (var d = 1; d <= 31; d++) {
      var opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d + '日';
      daySelect.appendChild(opt);
    }

    // 性別ボタン
    document.querySelectorAll('.gender-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.gender-btn').forEach(function (b) {
          b.classList.remove('selected');
        });
        this.classList.add('selected');
        selectedGender = this.getAttribute('data-value');
        validateForm();
      });
    });

    // バリデーション
    nicknameInput.addEventListener('input', validateForm);
    yearSelect.addEventListener('change', validateForm);
    monthSelect.addEventListener('change', validateForm);
    daySelect.addEventListener('change', validateForm);

    // 送信
    submitBtn.addEventListener('click', submitProfile);
  }

  // === バリデーション ===
  function validateForm() {
    var nickname = document.getElementById('nickname').value.trim();
    var year = document.getElementById('birthYear').value;
    var month = document.getElementById('birthMonth').value;
    var day = document.getElementById('birthDay').value;
    var btn = document.getElementById('profileSubmit');

    if (nickname && year && month && day && selectedGender) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  }

  // === プロフィール送信 ===
  function submitProfile() {
    var nickname = document.getElementById('nickname').value.trim();
    var year = document.getElementById('birthYear').value;
    var month = String(document.getElementById('birthMonth').value).padStart(2, '0');
    var day = String(document.getElementById('birthDay').value).padStart(2, '0');
    var birthday = year + '-' + month + '-' + day;
    var btn = document.getElementById('profileSubmit');

    btn.disabled = true;
    btn.textContent = '登録中...';

    if (!liff.isInClient()) {
      alert('このページはLINEアプリ内で開いてください');
      btn.disabled = false;
      btn.textContent = '登録する';
      return;
    }

    // 「プロフィール:ニックネーム:生年月日:性別」形式で送信
    liff.sendMessages([{
      type: 'text',
      text: '\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb:' + nickname + ':' + birthday + ':' + selectedGender
    }])
      .then(function () {
        localStorage.setItem(PROFILE_KEY, '1');
        liff.closeWindow();
      })
      .catch(function (err) {
        console.error('sendMessages error:', err);
        alert('送信に失敗しました。もう一度お試しください。');
        btn.disabled = false;
        btn.textContent = '登録する';
      });
  }

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
      if (app.category) cats[app.category] = true;
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

  // === アプリ選択 → メッセージ送信 → 閉じる ===
  function selectApp(appId) {
    if (!liff.isInClient()) {
      alert('このページはLINEアプリ内で開いてください');
      return;
    }

    liff.sendMessages([{
      type: 'text',
      text: '\u30a2\u30d7\u30ea:' + appId
    }])
      .then(function () {
        liff.closeWindow();
      })
      .catch(function (err) {
        console.error('sendMessages error:', err);
        alert('メッセージ送信に失敗しました。もう一度お試しください。');
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
