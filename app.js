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
  var currentEl = document.getElementById('current');
  var totalEl = document.getElementById('total');
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

  totalEl.textContent = String(pageFlip.getPageCount());

  function updateStatus() {
    currentEl.textContent = String(pageFlip.getCurrentPageIndex() + 1);
  }

  pageFlip.on('flip', updateStatus);
  pageFlip.on('changeState', updateStatus);

  nextBtn.addEventListener('click', function () {
    pageFlip.flipNext();
  });

  prevBtn.addEventListener('click', function () {
    pageFlip.flipPrev();
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      pageFlip.flipNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      pageFlip.flipPrev();
    }
  });

  updateStatus();
})();
