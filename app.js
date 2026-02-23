/**
 * LIFF — たまごのアプリ部屋への誘導ページ
 */
(function () {
  'use strict';

  var LIFF_ID = '2009188037-EJ4sq6gE';
  var APP_ROOM_ADD_FRIEND_URL = 'https://lin.ee/sRWAxgm';

  liff.init({ liffId: LIFF_ID })
    .then(function () {
      if (!liff.isInClient() && !liff.isLoggedIn()) {
        liff.login();
        return;
      }
    })
    .catch(function (err) {
      console.error('LIFF init error:', err);
    });

  document.getElementById('addFriendBtn').addEventListener('click', function () {
    if (liff.isInClient()) {
      liff.openWindow({ url: APP_ROOM_ADD_FRIEND_URL, external: true });
    } else {
      window.open(APP_ROOM_ADD_FRIEND_URL, '_blank');
    }
  });
})();
