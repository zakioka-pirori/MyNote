/*
 * MyNote 学習進捗トラッカー
 * - 各章ページに「読了チェック」と「メモ欄」を挿入
 * - progress ページに全体／層別の進捗ダッシュボードを描画
 * - 既定の保存先はブラウザの localStorage
 * - GitHub Gist 連携を設定すると複数端末で自動同期
 */
(function () {
  "use strict";

  var PROGRESS_KEY = "mynote-progress-v1";
  var NOTES_KEY = "mynote-notes-v1";
  var META_KEY = "mynote-meta-v1"; // { updatedAt, lastSync }
  var TOKEN_KEY = "mynote-gh-token";
  var GIST_KEY = "mynote-gist-id";

  var GIST_FILENAME = "mynote-progress.json";
  var GIST_DESCRIPTION = "MyNote 学習進捗の同期データ（自動生成）";

  // 追跡対象の全章（セクションごと）
  var SECTIONS = [
    {
      title: "第 1 層 数学・論理基礎",
      pages: [
        { id: "textbook/01-foundations/01-discrete-math/", title: "01. 離散数学" },
        { id: "textbook/01-foundations/02-linear-algebra/", title: "02. 線形代数" },
        { id: "textbook/01-foundations/03-calculus/", title: "03. 微積分" },
        { id: "textbook/01-foundations/04-probability-statistics/", title: "04. 確率と統計" },
        { id: "textbook/01-foundations/05-logic/", title: "05. 計算のための論理" }
      ]
    },
    {
      title: "第 2 層 コア科目",
      pages: [
        { id: "textbook/02-core/01-programming-paradigms/", title: "06. プログラミング言語パラダイム" },
        { id: "textbook/02-core/02-data-structures-algorithms/", title: "07. データ構造とアルゴリズム" },
        { id: "textbook/02-core/03-theory-of-computation/", title: "08. 計算理論" },
        { id: "textbook/02-core/04-computer-architecture/", title: "09. コンピュータアーキテクチャ" },
        { id: "textbook/02-core/05-operating-systems/", title: "10. オペレーティングシステム" },
        { id: "textbook/02-core/06-networking/", title: "11. コンピュータネットワーク" },
        { id: "textbook/02-core/07-databases/", title: "12. データベース" },
        { id: "textbook/02-core/08-compilers/", title: "13. コンパイラと言語処理系" },
        { id: "textbook/02-core/09-software-engineering/", title: "14. ソフトウェア工学" }
      ]
    },
    {
      title: "第 3 層 応用・発展",
      pages: [
        { id: "textbook/03-applied/01-security/", title: "15. セキュリティ" },
        { id: "textbook/03-applied/02-distributed-systems/", title: "16. 分散システム" },
        { id: "textbook/03-applied/03-ai-ml/", title: "17. 人工知能と機械学習" },
        { id: "textbook/03-applied/04-hci/", title: "18. ヒューマンコンピュータインタラクション" },
        { id: "textbook/03-applied/05-graphics/", title: "19. コンピュータグラフィックス" }
      ]
    },
    {
      title: "第 4 層 選択・先端",
      pages: [
        { id: "textbook/04-electives/01-overview/", title: "20. 選択・先端領域" }
      ]
    },
    {
      title: "高校数学",
      pages: [
        { id: "highschool-math/01-math-i/", title: "数学 I" },
        { id: "highschool-math/02-math-a/", title: "数学 A" },
        { id: "highschool-math/03-math-ii/", title: "数学 II" },
        { id: "highschool-math/04-math-b/", title: "数学 B" },
        { id: "highschool-math/05-math-iii/", title: "数学 III" },
        { id: "highschool-math/06-math-c/", title: "数学 C" }
      ]
    }
  ];

  /* ---------- localStorage ヘルパ ---------- */
  function load(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (e) {
      return {};
    }
  }
  function writeRaw(key, obj) {
    try {
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {
      /* localStorage 不可の環境では何もしない */
    }
  }
  // ユーザー操作による保存。updatedAt を更新し、同期をスケジュール
  function save(key, obj) {
    writeRaw(key, obj);
    if (key === PROGRESS_KEY || key === NOTES_KEY) {
      var meta = load(META_KEY);
      meta.updatedAt = Date.now();
      writeRaw(META_KEY, meta);
      schedulePush();
    }
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function setToken(t) {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }
  function getGistId() {
    try {
      return localStorage.getItem(GIST_KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function setGistId(id) {
    try {
      if (id) localStorage.setItem(GIST_KEY, id);
      else localStorage.removeItem(GIST_KEY);
    } catch (e) {}
  }
  function setLastSync(ts) {
    var meta = load(META_KEY);
    meta.lastSync = ts;
    writeRaw(META_KEY, meta);
  }

  /* ---------- ページ判定 ---------- */
  function normalizedPath() {
    var path = window.location.pathname;
    if (path.charAt(path.length - 1) !== "/") path += "/";
    return path;
  }
  function currentPage() {
    var path = normalizedPath();
    for (var s = 0; s < SECTIONS.length; s++) {
      var pages = SECTIONS[s].pages;
      for (var p = 0; p < pages.length; p++) {
        var id = pages[p].id;
        if (path.length >= id.length && path.slice(-id.length) === id) {
          return pages[p];
        }
      }
    }
    return null;
  }
  function siteRoot() {
    var path = normalizedPath();
    var page = currentPage();
    if (page) {
      var idx = path.lastIndexOf(page.id);
      if (idx !== -1) return path.substring(0, idx);
    }
    if (/progress\/$/.test(path)) return path.replace(/progress\/$/, "");
    return path;
  }
  function allPages() {
    var arr = [];
    SECTIONS.forEach(function (s) {
      s.pages.forEach(function (p) {
        arr.push(p);
      });
    });
    return arr;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function bar(pct) {
    return (
      '<div class="mynote-bar"><div class="mynote-bar-fill" style="width:' +
      pct +
      '%"></div><span class="mynote-bar-label">' +
      pct +
      "%</span></div>"
    );
  }

  /* ---------- スナップショット & マージ ---------- */
  function localSnapshot() {
    var meta = load(META_KEY);
    return {
      progress: load(PROGRESS_KEY),
      notes: load(NOTES_KEY),
      updatedAt: meta.updatedAt || 0
    };
  }
  function applySnapshot(snap) {
    var meta = load(META_KEY);
    meta.updatedAt = snap.updatedAt || Date.now();
    writeRaw(PROGRESS_KEY, snap.progress || {});
    writeRaw(NOTES_KEY, snap.notes || {});
    writeRaw(META_KEY, meta);
  }
  // progress は和集合（読了は単調に増える前提）、notes は新しい側を優先
  function mergeSnapshots(local, remote) {
    var progress = {};
    Object.keys(local.progress || {}).forEach(function (k) {
      progress[k] = true;
    });
    Object.keys(remote.progress || {}).forEach(function (k) {
      progress[k] = true;
    });
    var notes;
    if ((remote.updatedAt || 0) >= (local.updatedAt || 0)) {
      notes = Object.assign({}, local.notes, remote.notes);
    } else {
      notes = Object.assign({}, remote.notes, local.notes);
    }
    return {
      progress: progress,
      notes: notes,
      updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0)
    };
  }

  /* ---------- GitHub Gist 連携 ---------- */
  function ghHeaders() {
    return {
      Authorization: "Bearer " + getToken(),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    };
  }

  async function findOrCreateGist() {
    var id = getGistId();
    if (id) return id;
    // 既存の同期 Gist を探す
    var res = await fetch("https://api.github.com/gists?per_page=100", {
      headers: ghHeaders()
    });
    if (res.status === 401) throw new Error("トークンが無効です（401）");
    if (!res.ok) throw new Error("GitHub API エラー: " + res.status);
    var list = await res.json();
    for (var i = 0; i < list.length; i++) {
      if (list[i].files && list[i].files[GIST_FILENAME]) {
        setGistId(list[i].id);
        return list[i].id;
      }
    }
    // なければ作成
    var files = {};
    files[GIST_FILENAME] = {
      content: JSON.stringify(localSnapshot(), null, 2)
    };
    var cr = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: ghHeaders(),
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: files
      })
    });
    if (!cr.ok) throw new Error("Gist の作成に失敗しました: " + cr.status);
    var created = await cr.json();
    setGistId(created.id);
    return created.id;
  }

  // pull → merge → push（双方向同期）
  async function syncNow() {
    if (!getToken()) throw new Error("トークンが設定されていません");
    var id = await findOrCreateGist();
    var res = await fetch("https://api.github.com/gists/" + id, {
      headers: ghHeaders()
    });
    if (res.status === 401) throw new Error("トークンが無効です（401）");
    if (!res.ok) throw new Error("Gist の取得に失敗しました: " + res.status);
    var gist = await res.json();
    var remoteSnap = { progress: {}, notes: {}, updatedAt: 0 };
    if (gist.files && gist.files[GIST_FILENAME]) {
      try {
        remoteSnap = JSON.parse(gist.files[GIST_FILENAME].content || "{}");
      } catch (e) {}
    }
    var merged = mergeSnapshots(localSnapshot(), remoteSnap);
    applySnapshot(merged);
    var files = {};
    files[GIST_FILENAME] = { content: JSON.stringify(merged, null, 2) };
    var pr = await fetch("https://api.github.com/gists/" + id, {
      method: "PATCH",
      headers: ghHeaders(),
      body: JSON.stringify({ files: files })
    });
    if (!pr.ok) throw new Error("Gist の更新に失敗しました: " + pr.status);
    setLastSync(Date.now());
    return merged;
  }

  // 変更時の自動アップロード（デバウンス）
  var pushTimer = null;
  function schedulePush() {
    if (!getToken()) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      pushOnly().catch(function () {
        /* オフライン等は黙ってスキップ。次回の同期で復旧 */
      });
    }, 2500);
  }
  async function pushOnly() {
    if (!getToken()) return;
    var id = await findOrCreateGist();
    var files = {};
    files[GIST_FILENAME] = {
      content: JSON.stringify(localSnapshot(), null, 2)
    };
    var pr = await fetch("https://api.github.com/gists/" + id, {
      method: "PATCH",
      headers: ghHeaders(),
      body: JSON.stringify({ files: files })
    });
    if (pr.ok) {
      setLastSync(Date.now());
      var msg = document.getElementById("mynote-sync-msg");
      if (msg) msg.textContent = "";
      var st = document.querySelector(".mynote-sync-status");
      if (st) renderDashboard();
    }
  }

  // ページ読み込み時の自動同期（30 秒以内の重複は抑止）
  function maybeAutoSync() {
    if (!getToken()) return;
    var lastSync = load(META_KEY).lastSync || 0;
    if (Date.now() - lastSync < 30000) return;
    syncNow()
      .then(function () {
        refreshUI();
      })
      .catch(function () {
        /* 失敗は黙ってスキップ（手動同期で再試行可能） */
      });
  }

  /* ---------- 各章ページのウィジェット ---------- */
  function injectPageWidget() {
    var page = currentPage();
    if (!page) return;
    if (document.getElementById("mynote-page-widget")) return;

    var article =
      document.querySelector(".md-content__inner") ||
      document.querySelector("article");
    if (!article) return;
    var h1 = article.querySelector("h1");
    if (!h1) return;

    var progress = load(PROGRESS_KEY);
    var notes = load(NOTES_KEY);
    var done = !!progress[page.id];
    var noteText = notes[page.id] || "";

    var box = document.createElement("div");
    box.id = "mynote-page-widget";
    box.className = "mynote-widget";
    box.innerHTML =
      '<label class="mynote-check">' +
      '<input type="checkbox" id="mynote-page-check"' +
      (done ? " checked" : "") +
      "> <span>この章を読了にする</span></label>" +
      '<details class="mynote-note-details"' +
      (noteText ? " open" : "") +
      "><summary>📝 この章のメモ</summary>" +
      '<textarea id="mynote-page-note" class="mynote-note" ' +
      'placeholder="気づき・疑問・復習したいポイントなど（保存先はこのブラウザ／同期設定時は全端末）"></textarea>' +
      "</details>" +
      '<div class="mynote-widget-foot"><a href="' +
      siteRoot() +
      'progress/">📊 学習の記録（全体進捗・端末間同期）を見る</a></div>';

    h1.parentNode.insertBefore(box, h1.nextSibling);

    var check = document.getElementById("mynote-page-check");
    check.addEventListener("change", function () {
      var pr = load(PROGRESS_KEY);
      if (check.checked) pr[page.id] = true;
      else delete pr[page.id];
      save(PROGRESS_KEY, pr);
    });

    var note = document.getElementById("mynote-page-note");
    note.value = noteText;
    note.addEventListener("input", function () {
      var nt = load(NOTES_KEY);
      if (note.value.trim()) nt[page.id] = note.value;
      else delete nt[page.id];
      save(NOTES_KEY, nt);
    });
  }

  /* ---------- 同期パネル（ダッシュボード内） ---------- */
  function syncPanelHtml() {
    var hasToken = !!getToken();
    var lastSync = load(META_KEY).lastSync || 0;
    var html = '<details class="mynote-sync"' + (hasToken ? "" : " open") + ">";
    html +=
      "<summary>🔄 端末間で同期する（GitHub Gist）" +
      (hasToken ? " — <strong>有効</strong>" : " — 未設定") +
      "</summary>";
    html += '<div class="mynote-sync-body">';
    if (!hasToken) {
      html +=
        "<p>GitHub の個人アクセストークンを 1 度設定すると、複数の端末で進捗とメモが" +
        "<strong>自動同期</strong>されます。各端末で同じトークンを入れるだけです。</p>";
      html += "<ol>";
      html +=
        '<li><a href="https://github.com/settings/tokens/new?scopes=gist&description=MyNote%20progress%20sync" ' +
        'target="_blank" rel="noopener">こちらから classic トークンを作成</a>' +
        "（スコープは <code>gist</code> <strong>だけ</strong>にチェック。有効期限は任意）</li>";
      html += "<li>生成されたトークン（<code>ghp_…</code>）をコピー</li>";
      html += "<li>下に貼り付けて「同期を開始」を押す</li>";
      html += "</ol>";
      html +=
        '<input type="password" id="mynote-token-input" class="mynote-token-input" ' +
        'placeholder="ghp_xxxxxxxxxxxx（gist スコープのトークン）" autocomplete="off">';
      html += '<button id="mynote-token-save">同期を開始</button>';
      html +=
        '<p class="mynote-note-hint">⚠️ トークンはこのブラウザの localStorage に保存されます。' +
        "共有 PC では使わないでください。スコープは必ず <code>gist</code> のみに（他の権限は不要）。" +
        "進捗データは <strong>非公開 (secret) の Gist</strong> に保存されます。</p>";
    } else {
      html += '<p class="mynote-sync-status">✅ 同期が有効です。';
      if (lastSync) {
        html +=
          "最終同期: " +
          escapeHtml(new Date(lastSync).toLocaleString("ja-JP"));
      }
      html += "</p>";
      html += '<button id="mynote-sync-now">今すぐ同期</button> ';
      html += '<button id="mynote-sync-off">同期を解除</button>';
      html +=
        '<p class="mynote-note-hint">' +
        "別の端末でも同じトークンを設定すれば、同じ Gist が自動的に見つかり同期されます。" +
        "チェックやメモ編集をすると数秒後に自動アップロード、ページを開くと自動で取得します。" +
        "「同期を解除」してもこの端末・Gist のデータは消えません（トークンの保存だけ解除）。</p>";
    }
    html += '<p id="mynote-sync-msg" class="mynote-sync-msg"></p>';
    html += "</div></details>";
    return html;
  }

  function wireSyncPanel(root) {
    var msg = root.querySelector("#mynote-sync-msg");
    function showMsg(text, isError) {
      if (!msg) return;
      msg.textContent = text;
      msg.className = "mynote-sync-msg" + (isError ? " mynote-sync-err" : "");
    }

    var saveBtn = root.querySelector("#mynote-token-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var input = root.querySelector("#mynote-token-input");
        var token = input ? input.value.trim() : "";
        if (!token) {
          showMsg("トークンを入力してください。", true);
          return;
        }
        setToken(token);
        showMsg("接続を確認しています…", false);
        saveBtn.disabled = true;
        syncNow()
          .then(function () {
            showMsg("同期を開始しました ✅", false);
            refreshUI();
          })
          .catch(function (e) {
            setToken(""); // 失敗したらトークンを破棄
            showMsg(
              "失敗しました: " + e.message + "（トークンを確認してください）",
              true
            );
            saveBtn.disabled = false;
          });
      });
    }

    var nowBtn = root.querySelector("#mynote-sync-now");
    if (nowBtn) {
      nowBtn.addEventListener("click", function () {
        showMsg("同期中…", false);
        nowBtn.disabled = true;
        syncNow()
          .then(function () {
            showMsg("同期しました ✅", false);
            refreshUI();
          })
          .catch(function (e) {
            showMsg("失敗しました: " + e.message, true);
            nowBtn.disabled = false;
          });
      });
    }

    var offBtn = root.querySelector("#mynote-sync-off");
    if (offBtn) {
      offBtn.addEventListener("click", function () {
        if (
          window.confirm(
            "この端末での同期を解除します（トークンの保存を削除）。\n" +
              "進捗データや Gist は削除されません。よろしいですか？"
          )
        ) {
          setToken("");
          setGistId("");
          renderDashboard();
        }
      });
    }
  }

  /* ---------- ダッシュボード ---------- */
  function renderDashboard() {
    var root = document.getElementById("mynote-dashboard");
    if (!root) return;

    var progress = load(PROGRESS_KEY);
    var notes = load(NOTES_KEY);
    var all = allPages();
    var doneCount = all.filter(function (p) {
      return progress[p.id];
    }).length;
    var total = all.length;
    var pct = total ? Math.round((doneCount / total) * 100) : 0;
    var base = siteRoot();

    var html = "";

    html += syncPanelHtml();

    html += '<div class="mynote-overall">';
    html += "<h2>全体進捗</h2>";
    html += bar(pct);
    html +=
      '<p class="mynote-overall-text"><strong>' +
      doneCount +
      " / " +
      total +
      "</strong> 章 完了（" +
      pct +
      "%）</p>";
    html += "</div>";

    SECTIONS.forEach(function (s) {
      var sp = s.pages;
      var sdone = sp.filter(function (p) {
        return progress[p.id];
      }).length;
      var spct = sp.length ? Math.round((sdone / sp.length) * 100) : 0;
      html += '<div class="mynote-section">';
      html +=
        "<h3>" +
        escapeHtml(s.title) +
        ' <span class="mynote-section-count">' +
        sdone +
        " / " +
        sp.length +
        "</span></h3>";
      html += bar(spct);
      html += '<ul class="mynote-list">';
      sp.forEach(function (p) {
        var checked = progress[p.id] ? " checked" : "";
        var noteBadge = notes[p.id]
          ? ' <span class="mynote-has-note" title="メモあり">📝</span>'
          : "";
        html +=
          '<li><label><input type="checkbox" data-id="' +
          escapeHtml(p.id) +
          '"' +
          checked +
          '> <a href="' +
          base +
          escapeHtml(p.id) +
          '">' +
          escapeHtml(p.title) +
          "</a>" +
          noteBadge +
          "</label></li>";
      });
      html += "</ul></div>";
    });

    html +=
      '<div class="mynote-reset">' +
      '<button id="mynote-reset-btn">この端末の学習記録をリセット</button>' +
      '<p class="mynote-note-hint">※ 同期が無効の場合、進捗とメモはこのブラウザ内だけに保存されます。' +
      "同期を設定すると、各端末に同じトークンを入れるだけで自動的に共有されます。</p>" +
      "</div>";

    root.innerHTML = html;

    root
      .querySelectorAll('input[type="checkbox"][data-id]')
      .forEach(function (cb) {
        cb.addEventListener("change", function () {
          var pr = load(PROGRESS_KEY);
          var id = cb.getAttribute("data-id");
          if (cb.checked) pr[id] = true;
          else delete pr[id];
          save(PROGRESS_KEY, pr);
          renderDashboard();
        });
      });

    var resetBtn = document.getElementById("mynote-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (
          window.confirm(
            "この端末の学習の進捗とメモをすべて削除します。よろしいですか？\n" +
              "（同期が有効な場合、次の同期で他端末のデータが復元されることがあります）"
          )
        ) {
          localStorage.removeItem(PROGRESS_KEY);
          localStorage.removeItem(NOTES_KEY);
          localStorage.removeItem(META_KEY);
          renderDashboard();
        }
      });
    }

    wireSyncPanel(root);
  }

  /* ---------- UI 再描画 ---------- */
  function refreshUI() {
    var w = document.getElementById("mynote-page-widget");
    if (w) {
      w.parentNode.removeChild(w);
      injectPageWidget();
    }
    renderDashboard();
  }

  /* ---------- 初期化 ---------- */
  function init() {
    injectPageWidget();
    renderDashboard();
    maybeAutoSync();
  }

  if (typeof window.document$ !== "undefined" && window.document$.subscribe) {
    window.document$.subscribe(init);
  } else if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
