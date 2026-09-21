(function () {
  'use strict';

  // Number of single-page images in the "page/" folder.
  // Files are named A.jpg, A2.jpg, A3.jpg ... A<TOTAL>.jpg.
  // Bump this number if you add or remove pages later.
  var TOTAL_PAGES = 108;

  var pages = ['page/A.jpg'];
  for (var i = 2; i <= TOTAL_PAGES; i++) {
    pages.push('page/A' + i + '.jpg');
  }

  var book = document.getElementById('book');
  var totalEl = document.getElementById('total');
  var slider = document.getElementById('slider');
  var jumpInput = document.getElementById('jump');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');

  var pageFlip = new St.PageFlip(book, {
    // Aspect ratio of a single page (1748 x 2150 = 0.813).
    width: 813,
    height: 1000,
    size: 'stretch',
    minWidth: 240,
    maxWidth: 480,
    minHeight: 300,
    maxHeight: 700,
    showCover: true,
    usePortrait: true,
    drawShadow: true,
    maxShadowOpacity: 0.4,
    flippingTime: 700,
    swipeDistance: 30,
    disableFlipByClick: false,
    showPageCorners: false
  });

  pageFlip.loadFromImages(pages);

  // ---- HiDPI (Retina) sharpness ----
  // StPageFlip draws its canvas at 1x CSS pixels, which comes out soft on
  // high-DPI screens. Scale the canvas buffer and context by devicePixelRatio.
  var dpr = Math.max(1, window.devicePixelRatio || 1);
  var render = pageFlip.getRender();
  var ui = pageFlip.getUI();
  var canvas = ui.getCanvas();

  function sizeForDpr() {
    var cssW = canvas.clientWidth;
    var cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    render.getContext().setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  ui.resizeCanvas = sizeForDpr;
  render.resizeCanvas = sizeForDpr;
  sizeForDpr();

  // The page count comes from the library, so the slider range and the
  // "/ total" readout stay correct if TOTAL_PAGES changes later.
  var pageCount = pageFlip.getPageCount();
  totalEl.textContent = String(pageCount);
  slider.max = String(pageCount);
  jumpInput.max = String(pageCount);

  // 1-based page number currently shown.
  function currentPage() {
    return pageFlip.getCurrentPageIndex() + 1;
  }

  function syncControls(page) {
    slider.value = String(page);
    jumpInput.value = String(page);
  }

  // While the user drags the slider, keep the controls under the user's
  // control instead of letting flip events yank them back.
  var scrubbing = false;
  var stepping = false;
  var chasing = false;
  var targetPage = currentPage();
  var FLIP_NORMAL = pageFlip.getSettings().flippingTime;
  var FLIP_FAST = 80; // snappier page turns while scrubbing

  function setFlipSpeed(fast) {
    pageFlip.getSettings().flippingTime = fast ? FLIP_FAST : FLIP_NORMAL;
  }

  function updateStatus() {
    if (scrubbing || chasing) return;
    syncControls(currentPage());
  }

  // Turn one page toward targetPage; the flip event keeps it going until the
  // book catches up, giving a page-by-page turning feel while dragging.
  function stepTowardTarget() {
    if (stepping) return;
    var cur = currentPage();
    if (targetPage === cur) {
      chasing = false;
      if (!scrubbing) setFlipSpeed(false);
      return;
    }
    chasing = true;
    stepping = true;
    setFlipSpeed(true);
    if (targetPage > cur) {
      pageFlip.flipNext();
    } else {
      pageFlip.flipPrev();
    }
  }

  pageFlip.on('flip', function () {
    stepping = false;
    updateStatus();
    // Defer the next page turn: the flip event fires synchronously inside the
    // previous flip's onEnd, before it calls reset(). Starting the next flip
    // here would have its freshly-created calc/state wiped by that reset().
    if (chasing) {
      setTimeout(function () {
        // The user may have stopped (change) while this was queued, which
        // clears chasing; don't resume the catch-up then.
        if (chasing) stepTowardTarget();
      }, 0);
    }
  });
  pageFlip.on('changeState', updateStatus);

  // Clamp a raw value to a valid 1-based page number (NaN if not a number).
  function clampPage(raw) {
    var n = parseInt(raw, 10);
    if (isNaN(n)) return NaN;
    if (n < 1) n = 1;
    if (n > pageCount) n = pageCount;
    return n;
  }

  // Jump to a 1-based page number instantly (used by the input box).
  function jumpTo(raw) {
    var n = clampPage(raw);
    if (isNaN(n)) return;
    targetPage = n;
    pageFlip.turnToPage(n - 1);
    syncControls(n);
  }

  // Slider: scrub page-by-page with the flip animation. Each time the thumb
  // crosses a page, the book turns one page toward it.
  slider.addEventListener('input', function () {
    var n = clampPage(slider.value);
    jumpInput.value = slider.value;
    scrubbing = true;
    if (isNaN(n)) return;
    targetPage = n;
    stepTowardTarget();
  });
  slider.addEventListener('change', function () {
    scrubbing = false;
    // The user has stopped dragging: end the page-by-page catch-up and flip
    // straight to the page they stopped on, in a single turn instead of many.
    chasing = false;
    stepping = false;
    setFlipSpeed(false);
    var n = clampPage(slider.value);
    if (isNaN(n)) return;
    var cur = currentPage();
    if (n === cur) return;
    pageFlip.flip(n - 1, n > cur ? 'bottom' : 'top');
  });

  // Jump input: Enter or leaving the field jumps to the typed page.
  jumpInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      jumpTo(jumpInput.value);
    }
  });
  jumpInput.addEventListener('change', function () {
    jumpTo(jumpInput.value);
  });

  // Arrow buttons and keyboard: normal single-page turns. Stop any in-progress
  // scrub catch-up first so the two don't fight each other.
  nextBtn.addEventListener('click', function () {
    chasing = false;
    stepping = false;
    pageFlip.flipNext();
  });

  prevBtn.addEventListener('click', function () {
    chasing = false;
    stepping = false;
    pageFlip.flipPrev();
  });

  window.addEventListener('keydown', function (e) {
    // Don't hijack arrow keys while the user is typing in the jump field
    // or moving the slider.
    if (e.target === jumpInput || e.target === slider) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      chasing = false;
      stepping = false;
      pageFlip.flipNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      chasing = false;
      stepping = false;
      pageFlip.flipPrev();
    }
  });

  // Layer the book-back image underneath the book, peeking out around it.
  // The green spine sits a little left of center in the photo; GREEN_SPINE_X
  // is its horizontal position as a fraction of the image width. We shift the
  // image so that green spine lands under the book's center.
  var bookBack = document.getElementById('book-back');
  var bookShell = document.querySelector('.book-shell');
  var GREEN_SPINE_X = 0.5;
  var BOOK_BACK_RATIO = 3740 / 2232; // bookback.jpg aspect ratio (w / h)
  var BOOK_BACK_OFFSET_X = 1; // nudge the image right by this many px
  var BOOK_BACK_OFFSET_Y = 1; // nudge the image down by this many px

  function syncBookBackSize() {
    if (!bookBack || !bookShell) return;
    var r = canvas.getBoundingClientRect();
    var s = bookShell.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var imgH = r.height * 1.033; // peek out a little above and below the book
    var imgW = imgH * BOOK_BACK_RATIO;
    var bookCenterX = r.left - s.left + r.width / 2;
    bookBack.style.height = Math.round(imgH) + 'px';
    bookBack.style.width = Math.round(imgW) + 'px';
    bookBack.style.top = Math.round(r.top - s.top - (imgH - r.height) / 2 + BOOK_BACK_OFFSET_Y) + 'px';
    bookBack.style.left = Math.round(bookCenterX - GREEN_SPINE_X * imgW + BOOK_BACK_OFFSET_X) + 'px';
  }
  requestAnimationFrame(syncBookBackSize);
  window.addEventListener('resize', function () {
    requestAnimationFrame(syncBookBackSize);
  });

  updateStatus();
})();
