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

    function conversionRate(conversions, participants) {
        if (participants <= 0) return 0;
        return conversions / participants;
    }

    function relativeImprovement(variantRate, originalRate) {
        if (originalRate === 0) return 0;
        return ((variantRate - originalRate) / originalRate) * 100;
    }

    function calculateSignificance(origParticipants, origConversions, varParticipants, varConversions, alpha) {
        var p1 = conversionRate(origConversions, origParticipants);
        var p2 = conversionRate(varConversions, varParticipants);
        var n1 = origParticipants;
        var n2 = varParticipants;

        if (n1 <= 0 || n2 <= 0) {
            return { zScore: 0, pValue: 1, confidence: 0, significant: false };
        }

        var se1 = (p1 * (1 - p1)) / n1;
        var se2 = (p2 * (1 - p2)) / n2;
        var se = Math.sqrt(se1 + se2);

        if (se === 0) {
            return { zScore: 0, pValue: 1, confidence: 0, significant: false };
        }

        var z = (p2 - p1) / se;
        var pValue = 1 - normalCDF(Math.abs(z));
        var confidence = (1 - pValue) * 100;

        var weightedDiff = Math.abs(p2 - p1) * Math.min(n1, n2);

        return {
            zScore: z,
            pValue: pValue,
            confidence: confidence,
            significant: pValue < alpha,
            lowData: pValue < alpha && weightedDiff <= 20
        };
    }

    // --- DOM references ---

    var variantsContainer = document.getElementById('variants-container');
    var addVariantBtn = document.getElementById('add-variant-btn');
    var shareBtn = document.getElementById('share-btn');
    var experimentTitleInput = document.getElementById('experiment-title');
    var confidenceToggle = document.getElementById('confidence-toggle');
    var toggleOptions = confidenceToggle.querySelectorAll('.toggle-option');

    var variantCount = 2; // starts with Original (0) + Variant 1 (1)
    var MAX_VARIANTS = 4; // indices 0-3

    function getAlpha() {
        var active = confidenceToggle.querySelector('.toggle-option.active');
        return parseFloat(active.getAttribute('data-value'));
    }

    // --- Event listeners ---

    addVariantBtn.addEventListener('click', addVariant);
    shareBtn.addEventListener('click', shareLink);
    experimentTitleInput.addEventListener('input', updateResults);

    for (var ti = 0; ti < toggleOptions.length; ti++) {
        toggleOptions[ti].addEventListener('click', function () {
            if (this.disabled) return;
            for (var tj = 0; tj < toggleOptions.length; tj++) {
                toggleOptions[tj].classList.remove('active');
            }
            this.classList.add('active');
            updateResults();
        });
    }

    // Attach input listeners to initial cards
    attachInputListeners(0);
    attachInputListeners(1);

    // --- Functions ---

    function attachInputListeners(index) {
        var pInput = document.getElementById('participants-' + index);
        var cInput = document.getElementById('conversions-' + index);
        if (pInput) pInput.addEventListener('input', function () { clampConversions(index); updateResults(); });
        if (cInput) cInput.addEventListener('input', function () { clampConversions(index); updateResults(); });
    }

    function clampConversions(index) {
        var pInput = document.getElementById('participants-' + index);
        var cInput = document.getElementById('conversions-' + index);
        if (!pInput || !cInput) return;

        var p = parseInt(pInput.value, 10) || 0;
        var c = parseInt(cInput.value, 10) || 0;

        if (c > p && p > 0) {
            cInput.value = p;
        }
        if (c < 0) {
            cInput.value = 0;
        }
    }

    function getVariantData(index) {
        var pInput = document.getElementById('participants-' + index);
        var cInput = document.getElementById('conversions-' + index);
        if (!pInput || !cInput) return null;
        return {
            participants: parseInt(pInput.value, 10) || 0,
            conversions: parseInt(cInput.value, 10) || 0
        };
    }

    function updateResults() {
        var origData = getVariantData(0);
        if (!origData) return;

        // Original card: show conversion rate only
        renderOriginalResults(0, origData);

        // Variant cards: show full comparison
        for (var i = 1; i < variantCount; i++) {
            var varData = getVariantData(i);
            if (varData) {
                renderVariantResults(i, origData, varData);
            }
        }
    }

    function renderOriginalResults(index, data) {
        var container = document.getElementById('results-' + index);
        if (!container) return;

        if (data.participants <= 0) {
            container.innerHTML = '';
            return;
        }

        var rate = conversionRate(data.conversions, data.participants) * 100;

        container.innerHTML =
            '<div class="results-grid">' +
                '<div class="result-item">' +
                    '<div class="result-label">Conversion Rate</div>' +
                    '<div class="result-value">' + rate.toFixed(2) + '%</div>' +
                '</div>' +
            '</div>';
    }

    function renderVariantResults(index, origData, varData) {
        var container = document.getElementById('results-' + index);
        if (!container) return;

        if (varData.participants <= 0) {
            container.innerHTML = '';
            return;
        }

        var rate = conversionRate(varData.conversions, varData.participants) * 100;
        var origRate = conversionRate(origData.conversions, origData.participants);
        var varRate = conversionRate(varData.conversions, varData.participants);
        var improvement = relativeImprovement(varRate, origRate);

        var html =
            '<div class="results-grid">' +
                '<div class="result-item">' +
                    '<div class="result-label">Conversion Rate</div>' +
                    '<div class="result-value">' + rate.toFixed(2) + '%</div>' +
                '</div>';

        if (origData.participants > 0 && origData.conversions >= 0) {
            var improvementClass = improvement > 0 ? 'positive' : (improvement < 0 ? 'negative' : '');
            var improvementSign = improvement > 0 ? '+' : '';

            var stats = calculateSignificance(
                origData.participants, origData.conversions,
                varData.participants, varData.conversions,
                getAlpha()
            );

            var badgeClass = stats.significant ? 'badge-significant' : 'badge-not-significant';
            var badgeText = stats.significant ? 'Significant' : 'Not Significant';

            html +=
                '<div class="result-item">' +
                    '<div class="result-label">vs. Original</div>' +
                    '<div class="result-value ' + improvementClass + '">' + improvementSign + improvement.toFixed(2) + '%</div>' +
                '</div>' +
                '<div class="result-item">' +
                    '<div class="result-label">Confidence</div>' +
                    '<div class="result-value">' + stats.confidence.toFixed(1) + '%</div>' +
                '</div>' +
                '<div class="result-item">' +
                    '<div class="result-label">Significance</div>' +
                    '<div class="result-value"><span class="badge ' + badgeClass + '">' + badgeText + '</span></div>' +
                '</div>';
        }

        html += '</div>';

        if (stats && stats.lowData) {
            html +=
                '<div class="low-data-warning">' +
                    '<strong>Low data warning!</strong> ' +
                    ' This is a significant result based on your thresholds, but the actual weighted difference is 20 conversions or less &mdash; please be careful interpreting these results &mdash; gathering more data is advised.' +
                '</div>';
        }

        container.innerHTML = html;
    }

    // --- Variant management ---

    function createVariantCard(index) {
        var card = document.createElement('div');
        card.className = 'variant-card card';
        card.setAttribute('data-variant', index);

        card.innerHTML =
            '<div class="variant-header">' +
                '<h3 class="variant-title">Variant ' + index + '</h3>' +
                '<button type="button" class="btn-remove" onclick="window._removeVariant(' + index + ')">Remove</button>' +
            '</div>' +
            '<div class="inputs-grid">' +
                '<div class="input-group">' +
                    '<label class="input-label" for="participants-' + index + '">Participants</label>' +
                    '<input type="number" id="participants-' + index + '" class="input" min="0" placeholder="0">' +
                '</div>' +
                '<div class="input-group">' +
                    '<label class="input-label" for="conversions-' + index + '">Conversions</label>' +
                    '<input type="number" id="conversions-' + index + '" class="input" min="0" placeholder="0">' +
                '</div>' +
            '</div>' +
            '<div class="results-area" id="results-' + index + '"></div>';

        return card;
    }

    function addVariant() {
        if (variantCount >= MAX_VARIANTS) return;

        var card = createVariantCard(variantCount);
        variantsContainer.appendChild(card);
        attachInputListeners(variantCount);
        variantCount++;

        updateRemoveButtons();
        enforceConfidenceForMultipleVariants();

        if (variantCount >= MAX_VARIANTS) {
            addVariantBtn.disabled = true;
        }
    }

    // Expose remove for onclick handler
    window._removeVariant = function (index) {
        // Only allow removing the last variant, and only if it's index 2 or 3
        if (index < 2 || index !== variantCount - 1) return;

        var card = variantsContainer.querySelector('[data-variant="' + index + '"]');
        if (card) {
            variantsContainer.removeChild(card);
            variantCount--;
            updateRemoveButtons();
            enforceConfidenceForMultipleVariants();
            addVariantBtn.disabled = false;
            updateResults();
        }
    };

    function enforceConfidenceForMultipleVariants() {
        var hasMultipleVariants = variantCount > 2;
        var btn90 = confidenceToggle.querySelector('[data-value="0.10"]');

        if (hasMultipleVariants) {
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
        updateResults();
    }

    function updateRemoveButtons() {
        // Only show remove button on the last card if it's variant 2+
        var cards = variantsContainer.querySelectorAll('.variant-card');
        for (var i = 0; i < cards.length; i++) {
            var idx = parseInt(cards[i].getAttribute('data-variant'), 10);
            var removeBtn = cards[i].querySelector('.btn-remove');
            if (removeBtn) {
                // Show only on last card, and only for variant 2+
                removeBtn.style.display = (idx >= 2 && idx === variantCount - 1) ? '' : 'none';
            }
        }
    }

    // --- URL sharing ---

    function generateShareURL() {
        var params = new URLSearchParams();
        var title = experimentTitleInput.value.trim();
        if (title) {
            params.set('t', title);
        }

        for (var i = 0; i < variantCount; i++) {
            var data = getVariantData(i);
            if (data) {
                params.set('p' + i, data.participants);
                params.set('c' + i, data.conversions);
            }
        }

        var alpha = getAlpha();
        if (alpha !== 0.05) {
            params.set('cl', Math.round((1 - alpha) * 100));
        }

        return window.location.origin + window.location.pathname + '?' + params.toString();
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
        if (title) {
            experimentTitleInput.value = title;
        }

        var cl = params.get('cl');
        if (cl === '90') {
            for (var ci = 0; ci < toggleOptions.length; ci++) {
                toggleOptions[ci].classList.remove('active');
                if (toggleOptions[ci].getAttribute('data-value') === '0.10') {
                    toggleOptions[ci].classList.add('active');
                }
            }
        }

        // Determine how many variants exist in params
        var maxIndex = 1; // minimum is 0 and 1
        for (var i = 2; i < MAX_VARIANTS; i++) {
            if (params.has('p' + i) || params.has('c' + i)) {
                maxIndex = i;
            }
        }

        // Add extra variant cards as needed
        for (var j = 2; j <= maxIndex; j++) {
            addVariant();
        }

        // Fill in data
        for (var k = 0; k <= maxIndex; k++) {
            var pVal = params.get('p' + k);
            var cVal = params.get('c' + k);
            var pInput = document.getElementById('participants-' + k);
            var cInput = document.getElementById('conversions-' + k);

            if (pInput && pVal !== null) pInput.value = pVal;
            if (cInput && cVal !== null) cInput.value = cVal;
        }

        updateResults();
    }

    // Initialize
    loadFromURL();
    updateRemoveButtons();
    enforceConfidenceForMultipleVariants();
})();
