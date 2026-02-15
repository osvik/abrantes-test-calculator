(function () {
    'use strict';

    // --- Statistical functions ---

    function erf(x) {
        var a1 = 0.254829592;
        var a2 = -0.284496736;
        var a3 = 1.421413741;
        var a4 = -1.453152027;
        var a5 = 1.061405429;
        var p = 0.3275911;

        var sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        var t = 1.0 / (1.0 + p * x);
        var y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    function normalCDF(x) {
        return 0.5 * (1 + erf(x / Math.SQRT2));
    }

    // Inverse normal CDF using rational approximation (Abramowitz & Stegun 26.2.23)
    function inverseNormalCDF(p) {
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        if (p === 0.5) return 0;

        var pLow = p < 0.5 ? p : 1 - p;
        var t = Math.sqrt(-2 * Math.log(pLow));

        // Rational approximation coefficients
        var c0 = 2.515517;
        var c1 = 0.802853;
        var c2 = 0.010328;
        var d1 = 1.432788;
        var d2 = 0.189269;
        var d3 = 0.001308;

        var x = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);

        return p < 0.5 ? -x : x;
    }

    // --- Sample size calculation ---

    function calculateSampleSize(baseRate, mdeRelative, alpha, power) {
        var p1 = baseRate;
        var p2 = p1 * (1 + mdeRelative);

        if (p2 > 1) p2 = 1;
        if (p1 === p2) return Infinity;

        var pBar = (p1 + p2) / 2;
        var zAlpha = inverseNormalCDF(1 - alpha / 2); // two-tailed
        var zBeta = inverseNormalCDF(power);

        var termAlpha = zAlpha * Math.sqrt(2 * pBar * (1 - pBar));
        var termBeta = zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));

        var numerator = Math.pow(termAlpha + termBeta, 2);
        var denominator = Math.pow(p2 - p1, 2);

        return Math.ceil(numerator / denominator);
    }

    // --- DOM references ---

    var dailyParticipantsInput = document.getElementById('daily-participants');
    var dailyConversionsInput = document.getElementById('daily-conversions');
    var numVariantsSelect = document.getElementById('num-variants');
    var resultsCard = document.getElementById('results-card');
    var resultParticipants = document.getElementById('result-participants');
    var resultConversions = document.getElementById('result-conversions');
    var resultDays = document.getElementById('result-days');
    var notesArea = document.getElementById('notes-area');
    var shareBtn = document.getElementById('share-btn');
    var experimentTitleInput = document.getElementById('experiment-title');
    var confidenceToggle = document.getElementById('confidence-toggle');
    var toggleOptions = confidenceToggle.querySelectorAll('.toggle-option');

    // --- Constants ---

    var MDE_RELATIVE = 0.07; // 7% minimum detectable effect
    var POWER = 0.80;        // 80% power

    function getAlpha() {
        var active = confidenceToggle.querySelector('.toggle-option.active');
        return parseFloat(active.getAttribute('data-value'));
    }

    // --- Event listeners ---

    dailyParticipantsInput.addEventListener('input', function () { clampConversions(); updateResults(); });
    dailyConversionsInput.addEventListener('input', function () { clampConversions(); updateResults(); });
    numVariantsSelect.addEventListener('change', function () {
        enforceConfidenceForMultipleVariants();
        updateResults();
    });
    shareBtn.addEventListener('click', shareLink);

    for (var i = 0; i < toggleOptions.length; i++) {
        toggleOptions[i].addEventListener('click', function () {
            if (this.disabled) return;
            for (var j = 0; j < toggleOptions.length; j++) {
                toggleOptions[j].classList.remove('active');
            }
            this.classList.add('active');
            updateResults();
        });
    }

    // --- Functions ---

    function enforceConfidenceForMultipleVariants() {
        var numVariants = parseInt(numVariantsSelect.value, 10);
        var btn90 = confidenceToggle.querySelector('[data-value="0.10"]');

        if (numVariants > 1) {
            // Force 95% confidence
            for (var i = 0; i < toggleOptions.length; i++) {
                toggleOptions[i].classList.remove('active');
            }
            confidenceToggle.querySelector('[data-value="0.05"]').classList.add('active');
            btn90.disabled = true;
            btn90.classList.add('toggle-disabled');
        } else {
            btn90.disabled = false;
            btn90.classList.remove('toggle-disabled');
        }
    }

    function clampConversions() {
        var dp = parseInt(dailyParticipantsInput.value, 10) || 0;
        var dc = parseInt(dailyConversionsInput.value, 10) || 0;

        if (dc > dp && dp > 0) {
            dailyConversionsInput.value = dp;
        }
        if (dc < 0) {
            dailyConversionsInput.value = 0;
        }
    }

    function formatNumber(n) {
        if (n >= 1000000) {
            return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (n >= 10000) {
            return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return n.toLocaleString();
    }

    function updateResults() {
        var dp = parseInt(dailyParticipantsInput.value, 10) || 0;
        var dc = parseInt(dailyConversionsInput.value, 10) || 0;
        var numVariants = parseInt(numVariantsSelect.value, 10);

        if (dp <= 0 || dc <= 0) {
            resultsCard.style.display = 'none';
            return;
        }

        var alpha = getAlpha();
        var confidencePercent = Math.round((1 - alpha) * 100);

        var baseRate = dc / dp;
        var nPerGroup = calculateSampleSize(baseRate, MDE_RELATIVE, alpha, POWER);

        if (!isFinite(nPerGroup)) {
            resultsCard.style.display = 'none';
            return;
        }

        var totalGroups = numVariants + 1; // variants + original
        var totalParticipants = nPerGroup * totalGroups;
        var totalConversions = Math.ceil(totalParticipants * baseRate);
        var minDays = Math.ceil(totalParticipants / dp);

        resultParticipants.textContent = formatNumber(totalParticipants);
        resultConversions.textContent = formatNumber(totalConversions);
        resultDays.textContent = minDays + (minDays === 1 ? ' day' : ' days');

        resultsCard.style.display = '';

        // Build notes
        var notes = [];

        if (baseRate < 0.01) {
            notes.push({ text: '<strong>Very low conversion rate (' + (baseRate * 100).toFixed(2) + '%).</strong> You will need a large sample size to detect small changes. Consider testing bolder variations.', warning: true });
        } else if (baseRate > 0.5) {
            notes.push({ text: '<strong>High conversion rate (' + (baseRate * 100).toFixed(1) + '%).</strong> With a high base rate, there is less room for improvement. Consider whether a different metric might be more useful.', warning: true });
        }

        if (minDays > 90) {
            notes.push({ text: '<strong>Long experiment duration (' + minDays + ' days).</strong> With your current traffic, this experiment would take over 3 months. Consider increasing traffic to the tested pages or testing larger changes.', warning: true });
        } else if (minDays > 30) {
            notes.push({ text: '<strong>Experiment duration: ' + minDays + ' days.</strong> This is a long experiment. Make sure external factors (seasonality, campaigns) won\'t skew results over this period.', warning: true });
        }

        notes.push({ text: 'This estimate uses a <strong>' + confidencePercent + '% confidence level</strong> and a <strong>7% minimum detectable effect</strong> (relative change), which is at the conservative end of the typical 7&ndash;10% range for conversion rate optimization.', warning: false });
        notes.push({ text: '<strong>80% statistical power</strong> means there is an 80% chance of detecting the effect if it truly exists. The remaining 20% is the risk of a false negative.', warning: false });

        var notesHTML = '<div class="planner-notes">';
        for (var i = 0; i < notes.length; i++) {
            var cls = notes[i].warning ? 'planner-note planner-note-warning' : 'planner-note';
            notesHTML += '<div class="' + cls + '">' + notes[i].text + '</div>';
        }
        notesHTML += '</div>';

        notesArea.innerHTML = notesHTML;
    }

    // --- URL sharing ---

    function generateShareURL() {
        var params = new URLSearchParams();
        var title = experimentTitleInput.value.trim();
        var dp = dailyParticipantsInput.value.trim();
        var dc = dailyConversionsInput.value.trim();
        var v = numVariantsSelect.value;

        if (title) params.set('t', title);
        if (dp) params.set('dp', dp);
        if (dc) params.set('dc', dc);
        if (v !== '1') params.set('v', v);
        var alpha = getAlpha();
        if (alpha !== 0.05) params.set('cl', Math.round((1 - alpha) * 100));

        var query = params.toString();
        return window.location.origin + window.location.pathname + (query ? '?' + query : '');
    }

    function shareLink() {
        var url = generateShareURL();

        history.replaceState(null, '', url);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                showCopiedFeedback();
            }).catch(function () {
                fallbackCopy(url);
            });
        } else {
            fallbackCopy(url);
        }
    }

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showCopiedFeedback();
        } catch (e) {
            // silent fail
        }
        document.body.removeChild(textarea);
    }

    function showCopiedFeedback() {
        var originalText = shareBtn.textContent;
        shareBtn.textContent = 'Copied!';
        setTimeout(function () {
            shareBtn.textContent = originalText;
        }, 2000);
    }

    // --- Load from URL ---

    function loadFromURL() {
        var params = new URLSearchParams(window.location.search);
        if (params.toString() === '') return;

        var title = params.get('t');
        var dp = params.get('dp');
        var dc = params.get('dc');
        var v = params.get('v');
        var cl = params.get('cl');

        if (title !== null) experimentTitleInput.value = title;
        if (dp !== null) dailyParticipantsInput.value = dp;
        if (dc !== null) dailyConversionsInput.value = dc;
        if (v !== null) numVariantsSelect.value = v;
        if (cl === '90') {
            for (var i = 0; i < toggleOptions.length; i++) {
                toggleOptions[i].classList.remove('active');
                if (toggleOptions[i].getAttribute('data-value') === '0.10') {
                    toggleOptions[i].classList.add('active');
                }
            }
        }

        updateResults();
    }

    // Initialize
    loadFromURL();
    enforceConfidenceForMultipleVariants();
})();
