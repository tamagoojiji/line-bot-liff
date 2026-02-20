/**
 * LIFF アプリ選択メニュー
 */
(function () {
  'use strict';

  // === 設定 ===
  var LIFF_ID = '2009188037-EJ4sq6gE';

  // === DOM要素 ===
  var searchInput = document.getElementById('searchInput');
  var categoriesContainer = document.getElementById('categories');
  var appGrid = document.getElementById('appGrid');

  // === 状態 ===
  var allApps = [];
  var allCategories = [];
  var currentCategory = 'all';
  var currentSearch = '';

  // === LIFF 初期化 ===
  liff.init({ liffId: LIFF_ID })
    .then(function () {
      if (!liff.isInClient() && !liff.isLoggedIn()) {
        liff.login();
        return;
      }
      loadApps();
    })
    .catch(function (err) {
      console.error('LIFF init error:', err);
      showError('LIFFの初期化に失敗しました');
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

    // イベント
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

    // タップイベント
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
      text: '\u30a2\u30d7\u30ea:' + appId  // 「アプリ:xxx」
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
