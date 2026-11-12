/* SOLA static site interactions — page content lives in editable .html files. */
(() => {
  "use strict";

  // メニューの円形アニメーションの長さ(ms)。css/site.css の --menu-duration と同じ値にする
  const MENU_DURATION = 860;
  // スマホ表示に切り替わる幅。css/site.css の @media (max-width: 800px) と同じ値にする
  const MOBILE_MAX_WIDTH = 800;
  // MORE ボタンを押す前に表示する件数
  const WORKS_INITIAL_COUNT = 9;
  const COLUMNS_INITIAL_COUNT = 5;
  // リンクを押してから次のページへ移るまでの時間(ms)。css/site.css の .is-leaving と合わせる
  const PAGE_LEAVE_DELAY = 420;
  // MORE ボタンで一覧を開く／メニューの Instagram を開くまでの時間(ms)。押したときの色の変化を見せるため
  const TAP_FEEDBACK_DELAY = 260;
  // トップのヘッダーを「リンク」→「メニューボタン」に切り替える、ヒーロー写真の開き具合。
  // 行きと帰りで差をつけ、境目でスクロールしてもちらちら切り替わらないようにする
  const HEADER_COMPACT_ON = 0.7;
  const HEADER_COMPACT_OFF = 0.5;

  const page = document.body.dataset.page || "home";
  const header = document.querySelector("[data-site-header]");
  const hero = document.querySelector(".home-hero");
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-nav");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let menuOpen = false;
  let headerCompact = false;
  let menuCloseTimer = 0;
  let heroRaf = 0;

  const setHeaderTone = (progressValue = 0) => {
    if (!header) return;
    const onHome = page === "home" && Boolean(hero);
    const progress = Number.isFinite(progressValue) ? progressValue : 0;
    // ヒーロー写真の下端がヘッダーの下を通り過ぎるまでは「写真の上」として扱う（ヘッダーは透明）
    const heroEnd = hero
      ? hero.offsetTop + hero.offsetHeight - header.offsetHeight
      : -1;
    const backdropActive = Boolean(onHome && window.scrollY <= heroEnd + 1);
    if (!onHome) headerCompact = false;
    else if (progress >= HEADER_COMPACT_ON) headerCompact = true;
    else if (progress < HEADER_COMPACT_OFF) headerCompact = false;
    const expanded = headerCompact;
    const menuIsOpen = menuOpen || header.classList.contains("menu-open");

    header.classList.toggle("home-compact", expanded);
    header.classList.toggle("is-hero-expanded", expanded);
    header.classList.toggle("hero-backdrop-active", backdropActive);
    header.classList.toggle("is-solid", !onHome);

    // ヒーロー写真の上以外は、ヘッダーが茶色の帯になるので常に "dark"（クリーム色の文字）
    let tone = "dark";
    if (!menuIsOpen && onHome && backdropActive) {
      // ヒーロー写真の上では、写真の明るさで文字色を決める
      const photo = hero.querySelector("[data-hero-frame] img");
      const brightness = imageLuminance(photo) ?? 53;
      tone =
        53 * (1 - progress) + brightness * progress < 145 ? "dark" : "light";
    }

    header.classList.toggle("tone-dark", tone === "dark");
    header.classList.toggle("tone-light", tone === "light");
    header
      .querySelector(".wordmark")
      ?.classList.toggle("wordmark--inverse", tone === "dark" || menuIsOpen);
  };

  function imageLuminance(image) {
    if (!image?.complete || !image.naturalWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 14;
    canvas.height = 14;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    try {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      let total = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        total +=
          0.2126 * pixels[index] +
          0.7152 * pixels[index + 1] +
          0.0722 * pixels[index + 2];
      }
      return total / (pixels.length / 4);
    } catch {
      return null;
    }
  }

  function setupHeroMotion() {
    const rootStyle = document.documentElement.style;
    const frame = document.querySelector("[data-hero-frame]");
    if (!hero || !frame) {
      rootStyle.removeProperty("--hero-progress");
      setHeaderTone(0);
      return;
    }

    let current = reducedMotion.matches ? 1 : 0;
    let target = current;
    let lastTime = 0;
    let active = true;
    const geometry = () => ({
      top:
        window.innerWidth <= MOBILE_MAX_WIDTH
          ? 76
          : Math.max(94, Math.min(132, window.innerHeight * 0.15)),
      left:
        window.innerWidth <= MOBILE_MAX_WIDTH
          ? Math.min(30, window.innerWidth * 0.08)
          : window.innerWidth * 0.22,
      bottom: window.innerWidth <= MOBILE_MAX_WIDTH ? 23 : 30,
    });
    const paint = (progress) => {
      const size = geometry();
      frame.style.setProperty("--open-progress", progress.toFixed(4));
      frame.style.setProperty("--frame-top", `${size.top * (1 - progress)}px`);
      frame.style.setProperty(
        "--frame-left",
        `${size.left * (1 - progress)}px`,
      );
      frame.style.setProperty(
        "--frame-bottom",
        `${size.bottom * (1 - progress)}px`,
      );
      frame.style.setProperty(
        "--copy-shift",
        `${size.left * (1 - progress)}px`,
      );
      rootStyle.setProperty("--hero-progress", progress.toFixed(4));
      setHeaderTone(progress);
    };
    const tick = (time) => {
      if (!active) return;
      const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
      lastTime = time;
      const easing = 1 - Math.exp(-elapsed / 118);
      const distance = target - current;
      current =
        Math.abs(distance) < 0.001 ? target : current + distance * easing;
      paint(current);
      if (current !== target) heroRaf = requestAnimationFrame(tick);
      else {
        heroRaf = 0;
        lastTime = 0;
      }
    };
    const update = () => {
      const hold =
        window.innerWidth <= MOBILE_MAX_WIDTH
          ? Math.max(100, Math.min(240, window.innerHeight * 0.2))
          : 0;
      const range = Math.max(1, hero.offsetHeight - window.innerHeight - hold);
      target = reducedMotion.matches
        ? 1
        : Math.min(1, Math.max(0, (window.scrollY - hero.offsetTop) / range));
      if (reducedMotion.matches) {
        current = 1;
        paint(1);
      } else if (!heroRaf) {
        lastTime = 0;
        heroRaf = requestAnimationFrame(tick);
      }
    };
    paint(current);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    reducedMotion.addEventListener?.("change", update);
    update();
    window.addEventListener(
      "pagehide",
      () => {
        active = false;
        window.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
        reducedMotion.removeEventListener?.("change", update);
        if (heroRaf) cancelAnimationFrame(heroRaf);
        rootStyle.removeProperty("--hero-progress");
      },
      { once: true },
    );
  }

  function setupScrollImageReveal() {
    const main = document.querySelector("main");
    if (!main) return;
    const images = [...main.querySelectorAll("img")].filter(
      (image) => !image.closest(".hero-frame"),
    );
    const observer =
      !reducedMotion.matches && "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries, activeObserver) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                activeObserver.unobserve(entry.target);
              });
            },
            { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
          )
        : null;

    images.forEach((image) => {
      image.classList.add("scroll-image-reveal");
      if (observer) observer.observe(image);
      else image.classList.add("is-visible");
    });
    window.addEventListener("pagehide", () => observer?.disconnect(), {
      once: true,
    });
  }

  // トップの FLOW：画面に入ったステップから順に、ふわっと表示して線を伸ばす
  function setupFlowReveal() {
    const flow = document.querySelector(".flow");
    if (!flow || reducedMotion.matches || !("IntersectionObserver" in window))
      return;
    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          activeObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    flow.classList.add("is-reveal-ready");
    flow.querySelectorAll(".flow__step").forEach((step) => observer.observe(step));
    window.addEventListener("pagehide", () => observer.disconnect(), {
      once: true,
    });
  }

  // サイト内のリンクを押したら、色の変化（is-tapped）と画面がふわっと薄くなるのを見せてから移動する
  function setupPageTransitions() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || reducedMotion.matches) return;
      // 新しいタブで開く操作や、メニュー内のリンク（setupMenu が処理）はそのまま
      const opensElsewhere =
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey;
      if (opensElsewhere || link.target === "_blank" || link.closest(".site-nav"))
        return;
      // 電話・メール・外部サイト・同じページ内の移動はそのまま
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;
      event.preventDefault();
      link.classList.add("is-tapped");
      document.documentElement.classList.add("is-leaving");
      window.setTimeout(() => window.location.assign(url.href), PAGE_LEAVE_DELAY);
    });
    // ブラウザの「戻る」で戻ってきたときに、薄くなった状態を元に戻す
    window.addEventListener("pageshow", () => {
      document.documentElement.classList.remove("is-leaving");
      document
        .querySelectorAll(".is-tapped")
        .forEach((link) => link.classList.remove("is-tapped"));
    });
  }

  function setupMenu() {
    if (!header || !nav || !menuButton) return;
    const closeMenu = () => {
      if (!menuOpen) return;
      menuOpen = false;
      header.classList.add("menu-closing");
      header.classList.remove("menu-open", "menu-opening");
      menuButton.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "メニューを開く");
      document.body.classList.remove("menu-lock");
      window.clearTimeout(menuCloseTimer);
      menuCloseTimer = window.setTimeout(
        () => {
          nav.classList.remove("is-open");
          header.classList.remove("menu-visible", "menu-closing");
          menuCloseTimer = 0;
          setHeaderTone(
            Number.parseFloat(
              getComputedStyle(document.documentElement).getPropertyValue(
                "--hero-progress",
              ),
            ) || 0,
          );
        },
        reducedMotion.matches ? 0 : MENU_DURATION,
      );
    };
    const openMenu = () => {
      window.clearTimeout(menuCloseTimer);
      menuCloseTimer = 0;
      const bounds = menuButton.getBoundingClientRect();
      const originX = `${bounds.left + bounds.width / 2}px`;
      const originY = `${bounds.top + bounds.height / 2}px`;
      nav.style.setProperty("--menu-origin-x", originX);
      nav.style.setProperty("--menu-origin-y", originY);
      header.classList.add("menu-visible", "menu-opening");
      header.classList.remove("menu-closing");
      nav.classList.add("is-open");
      menuButton.classList.add("is-open");
      menuButton.setAttribute("aria-expanded", "true");
      menuButton.setAttribute("aria-label", "メニューを閉じる");
      document.body.classList.add("menu-lock");
      menuOpen = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          header.classList.add("menu-open");
          header.classList.remove("menu-opening");
        }),
      );
      setHeaderTone(
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--hero-progress",
          ),
        ) || 0,
      );
    };
    menuButton.addEventListener("click", () =>
      menuOpen ? closeMenu() : openMenu(),
    );
    nav.querySelectorAll("a[href]").forEach((anchor) =>
      anchor.addEventListener("click", (event) => {
        if (!menuOpen) return;
        // Cmd/Ctrl/Shift+クリック（新しいタブ・ウィンドウで開く）はブラウザーに任せる
        const opensElsewhere =
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
        if (opensElsewhere) {
          closeMenu();
          return;
        }
        // 外部サイト（Instagram）：黄緑に変えてから新しいタブで開き、メニューを閉じる
        const isExternal =
          anchor.target === "_blank" ||
          new URL(anchor.href, window.location.href).origin !==
            window.location.origin;
        if (isExternal) {
          event.preventDefault();
          anchor.classList.add("is-tapped");
          window.setTimeout(
            () => {
              const opened = window.open(anchor.href, "_blank");
              if (opened) opened.opener = null;
              else window.location.assign(anchor.href);
              anchor.classList.remove("is-tapped");
              closeMenu();
            },
            reducedMotion.matches ? 0 : TAP_FEEDBACK_DELAY,
          );
          return;
        }
        event.preventDefault();
        const destination = anchor.href;
        // 押したリンクを黄緑にし、画面がふわっと薄くなってから移動する（setupPageTransitions と同じ流れ）
        anchor.classList.add("is-tapped");
        if (!reducedMotion.matches)
          document.documentElement.classList.add("is-leaving");
        window.setTimeout(
          () => {
            // 同じページ（トップで TOP を押したときなど）でも、先頭から表示する
            window.scrollTo(0, 0);
            window.location.assign(destination);
          },
          reducedMotion.matches ? 0 : PAGE_LEAVE_DELAY,
        );
      }),
    );
    // ブラウザの「戻る」で戻ってきたときは、メニューを閉じた状態にする
    window.addEventListener("pageshow", (event) => {
      if (event.persisted && menuOpen) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuOpen) closeMenu();
    });
  }

  // MORE ボタン：押したら淡い黄緑（.is-tapped）を見せてから、一覧を開く／閉じる
  function onMoreButtonClick(button, toggle) {
    button.addEventListener("click", () => {
      if (button.classList.contains("is-tapped")) return;
      button.classList.add("is-tapped");
      window.setTimeout(() => {
        toggle();
        button.classList.remove("is-tapped");
      }, reducedMotion.matches ? 0 : TAP_FEEDBACK_DELAY);
    });
  }

  function setupWorksControls() {
    const cards = [...document.querySelectorAll(".works-page .work-card")];
    const filterButtons = [
      ...document.querySelectorAll(".works-filter [data-filter]"),
    ];
    const moreButton = document.querySelector("[data-more-works]");
    if (!cards.length) return;
    let activeFilter = "all";
    let expanded = false;
    const update = () => {
      const matches = cards.filter(
        (card) =>
          activeFilter === "all" ||
          (card.dataset.tags || "").split(/\s+/).includes(activeFilter),
      );
      const shown = expanded ? matches.length : Math.min(WORKS_INITIAL_COUNT, matches.length);
      cards.forEach((card) => {
        card.hidden = !matches.includes(card) || matches.indexOf(card) >= shown;
      });
      filterButtons.forEach((button) => {
        const active = button.dataset.filter === activeFilter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      if (moreButton) {
        moreButton.hidden = matches.length <= WORKS_INITIAL_COUNT;
        moreButton.innerHTML = `${expanded ? "閉じる" : "MORE GARDENS"} <span aria-hidden="true">${expanded ? "−" : "＋"}</span>`;
        moreButton.setAttribute("aria-expanded", String(expanded));
      }
    };
    filterButtons.forEach((button) =>
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter || "all";
        expanded = false;
        update();
      }),
    );
    if (moreButton) {
      onMoreButtonClick(moreButton, () => {
        expanded = !expanded;
        update();
      });
    }
    update();
  }

  function setupColumnMore() {
    const rows = [...document.querySelectorAll(".column-page .column-row")];
    const moreButton = document.querySelector("[data-more-columns]");
    if (!rows.length || !moreButton) return;
    let expanded = false;
    const update = () => {
      rows.forEach((row, index) => {
        row.hidden = !expanded && index >= COLUMNS_INITIAL_COUNT;
      });
      moreButton.innerHTML = `${expanded ? "閉じる" : "MORE STORIES"} <span aria-hidden="true">${expanded ? "−" : "＋"}</span>`;
      moreButton.setAttribute("aria-expanded", String(expanded));
    };
    onMoreButtonClick(moreButton, () => {
      expanded = !expanded;
      update();
    });
    update();
  }

  /*
   * お問い合わせフォーム
   * - 入力チェック（日本語のエラーメッセージ）をして、問題なければ thanks.html へ移動
   * - contact.html の <form data-endpoint=""> に送信先URL（Formspree など）を入れると、
   *   そこへ送信してから移動します。空のままだと送信せずに移動します（動作確認用）
   * - WordPress 版では Contact Form 7 が送信し、送信できたらお礼ページへ移動します
   *   （お礼ページのURLは、フォームを囲む要素の data-thanks-url）
   * - 入力欄は id（name・kana・email・tel・message）で探すので、静的版と WordPress 版で共通です
   */
  function setupContactForm() {
    const form = document.querySelector("#contact-form");
    if (!form) return;
    const isContactForm7 = form.classList.contains("wpcf7-form");
    const THANKS_URL =
      form.closest("[data-thanks-url]")?.dataset.thanksUrl || "./thanks.html";
    const summary = document.querySelector("#form-summary");
    const submitButton = document.querySelector("#submit-button");
    const submitLabel = submitButton.querySelector("span");
    const tel = form.querySelector("#tel");
    const telRequired = document.querySelector("#tel-req");
    const honeypot = form.querySelector('[name="website"]');
    const RULES = {
      name: {
        test: (value) => value.trim() !== "",
        message: "お名前を入力してください。",
      },
      kana: {
        test: (value) => /^[ぁ-ゖァ-ヺー\s　]+$/.test(value.trim()),
        message: "ふりがなをひらがなで入力してください。",
      },
      email: {
        test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
        message:
          "メールアドレスを正しい形式で入力してください。（例：example@mail.com）",
      },
      tel: {
        test: (value) => /^[0-9０-９+＋\-ー－\s()（）]{9,16}$/.test(value.trim()),
        message: "電話番号を正しい形式で入力してください。（例：03-0000-0000）",
      },
      message: {
        test: (value) => value.trim() !== "",
        message: "ご相談内容を入力してください。",
      },
    };
    const inputs = Object.keys(RULES).map((id) => form.querySelector(`#${id}`));

    const showError = (input, message) => {
      input.setAttribute("aria-invalid", "true");
      input.closest(".form-field").classList.add("is-invalid");
      document.querySelector(`#err-${input.id}`).textContent = message;
    };
    const clearError = (input) => {
      input.removeAttribute("aria-invalid");
      input.closest(".form-field").classList.remove("is-invalid");
      document.querySelector(`#err-${input.id}`).textContent = "";
    };
    const check = (input) => {
      // 電話番号は、連絡方法が「お電話」のときだけ必須
      if (input === tel && !tel.required && tel.value.trim() === "") {
        clearError(input);
        return true;
      }
      const rule = RULES[input.id];
      if (!rule.test(input.value)) {
        showError(input, rule.message);
        return false;
      }
      clearError(input);
      return true;
    };
    const syncTelRequired = () => {
      // 静的版の値は "phone"、WordPress 版（Contact Form 7）の値は "お電話"
      const method = form.querySelector('input[type="radio"]:checked');
      const needed = /phone|電話/.test(method ? method.value : "");
      tel.required = needed;
      telRequired.hidden = !needed;
      if (!needed) check(tel);
    };
    const setSending = (sending) => {
      submitButton.disabled = sending;
      submitButton.toggleAttribute("aria-busy", sending);
      submitLabel.textContent = sending ? "送信中…" : "送　信";
    };
    const showSummary = (message) => {
      summary.textContent = message;
      summary.hidden = false;
    };

    form
      .querySelectorAll('input[type="radio"]')
      .forEach((radio) => radio.addEventListener("change", syncTelRequired));
    syncTelRequired();
    // 入力し終えたときにチェックし、エラー表示中は入力のたびに再チェック
    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        if (input.value !== "" || input.required) check(input);
      });
      input.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true") check(input);
      });
    });

    // Contact Form 7 の送信結果を受け取る
    if (isContactForm7) {
      const container = form.closest(".wpcf7") || form;
      container.addEventListener("wpcf7mailsent", () =>
        window.location.assign(THANKS_URL),
      );
      ["wpcf7invalid", "wpcf7spam", "wpcf7mailfailed"].forEach((type) =>
        container.addEventListener(type, () => {
          setSending(false);
          showSummary(
            "送信に失敗しました。入力内容をご確認のうえ、もう一度お試しいただくか、お電話にてご連絡ください。",
          );
          summary.focus();
        }),
      );
    }

    // 3つ目の引数 true：Contact Form 7 の送信処理より先に入力チェックをするため
    form.addEventListener(
      "submit",
      (event) => {
        summary.hidden = true;
        const invalid = inputs.filter((input) => !check(input));
        // 入力に誤りがあるとき・迷惑メール対策の欄に入力があるときは、送信しない
        if (invalid.length || honeypot.value) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        if (invalid.length) {
          showSummary(
            "入力内容をご確認ください。赤色の項目を修正してから、もう一度送信してください。",
          );
          invalid[0].focus();
          return;
        }
        if (honeypot.value) {
          window.location.assign(THANKS_URL);
          return;
        }
        setSending(true);
        if (isContactForm7) return; // ここから先の送信は Contact Form 7 が行う
        event.preventDefault();
        sendToEndpoint();
      },
      true,
    );

    async function sendToEndpoint() {
      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        window.setTimeout(() => window.location.assign(THANKS_URL), 600);
        return;
      }
      const data = Object.fromEntries(new FormData(form));
      delete data.website;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        window.location.assign(THANKS_URL);
      } catch {
        setSending(false);
        showSummary(
          "送信に失敗しました。時間をおいてもう一度お試しいただくか、お電話にてご連絡ください。",
        );
        summary.focus();
      }
    }
  }

  // ロゴ：トップページではページの先頭へ戻る（ほかのページではトップページへ移動）
  // Page TOP：どのページでも、そのページの先頭へなめらかに戻る
  function setupTopLinks() {
    document.querySelectorAll(".wordmark, .back-to-top").forEach((anchor) =>
      anchor.addEventListener("click", (event) => {
        const isPageTop = anchor.classList.contains("back-to-top");
        if (page !== "home" && !isPageTop) return;
        event.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });
      }),
    );
  }

  document.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (
        !(image instanceof HTMLImageElement) ||
        !image.dataset.fallback ||
        image.dataset.fallbackUsed
      )
        return;
      image.dataset.fallbackUsed = "true";
      image.src = image.dataset.fallback;
    },
    true,
  );

  setupMenu();
  setupPageTransitions();
  setupWorksControls();
  setupColumnMore();
  setupContactForm();
  setupTopLinks();
  setupHeroMotion();
  setupScrollImageReveal();
  setupFlowReveal();
})();
