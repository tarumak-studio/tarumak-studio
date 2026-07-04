/* tool-hero.js — wires the "compare" hero's before/after slider.
 *
 * The slider is a real <input type="range"> (keyboard-accessible,
 * screen-reader-labeled) laid invisibly over the visual — this script's
 * only job is to read its value and update the CSS custom property the
 * clip-path and handle position read from. Every other hero type
 * (scan/workflow/code/live/convert) is pure CSS animation and needs no
 * JS at all, so this file does nothing on pages that don't use the
 * compare hero.
 */
(function () {
  'use strict';
  var ranges = document.querySelectorAll('.tp-compare-range');
  if (!ranges.length) return;

  ranges.forEach(function (input) {
    var compare = input.closest('.tp-compare');
    if (!compare) return;
    var handle = compare.querySelector('.tp-compare-handle');

    function apply() {
      var pct = input.value + '%';
      compare.style.setProperty('--tp-split', pct);
      if (handle) handle.style.left = pct;
    }

    input.addEventListener('input', apply);
    apply();
  });
})();
