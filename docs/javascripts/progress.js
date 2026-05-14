/*
 * MyNote 学習進捗トラッカー
 * - 各章ページに「読了チェック」と「メモ欄」を挿入
 * - progress ページに全体／層別の進捗ダッシュボードを描画
 * - 保存先はブラウザの localStorage（サーバ送信なし・端末間同期なし）
 */
(function () {
  "use strict";

  var PROGRESS_KEY = "mynote-progress-v1";
  var NOTES_KEY = "mynote-notes-v1";

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

  function load(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (e) {
      return {};
    }
  }
  function save(key, obj) {
    try {
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {
      /* localStorage 不可の環境では何もしない */
    }
  }

  function normalizedPath() {
    var path = window.location.pathname;
    if (path.charAt(path.length - 1) !== "/") path += "/";
    return path;
  }

  // 現在ページが追跡対象ならその page オブジェクトを返す（末尾一致で判定）
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

  // サイトのルートパス（例: "/MyNote/"）を推定
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

  /* ---- 各章ページにチェックボックス + メモ欄を挿入 ---- */
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
      'placeholder="気づき・疑問・復習したいポイントなど（このブラウザに保存されます）"></textarea>' +
      "</details>" +
      '<div class="mynote-widget-foot"><a href="' +
      siteRoot() +
      'progress/">📊 学習の記録（全体進捗）を見る</a></div>';

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

  /* ---- ダッシュボード（progress ページ）を描画 ---- */
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
          "<li><label><input type=\"checkbox\" data-id=\"" +
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
      '<button id="mynote-reset-btn">学習記録をすべてリセット</button>' +
      '<p class="mynote-note-hint">※ 進捗とメモはこのブラウザ（端末）内だけに保存されます。' +
      "サーバには送信されず、別の端末・ブラウザとは同期しません。" +
      "ブラウザのデータを消去すると記録も消えます。</p>" +
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
            "学習の進捗とメモをすべて削除します。よろしいですか？"
          )
        ) {
          localStorage.removeItem(PROGRESS_KEY);
          localStorage.removeItem(NOTES_KEY);
          renderDashboard();
        }
      });
    }
  }

  function init() {
    injectPageWidget();
    renderDashboard();
  }

  if (typeof window.document$ !== "undefined" && window.document$.subscribe) {
    window.document$.subscribe(init);
  } else if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
