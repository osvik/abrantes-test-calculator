# A/B Test Significance Calculator

A free, open-source A/B test calculator that tells you whether your experiment results are statistically significant.

**Use it now:** [osvik.github.io/abrantes-test-calculator](https://osvik.github.io/abrantes-test-calculator/)

## What it does

Enter the number of participants and conversions for your original and variant(s). The calculator instantly shows:

- **Conversion rate** for each variant
- **Relative improvement** compared to the original (e.g. +20%)
- **Confidence level** (e.g. 95.2%)
- **Statistical significance** — whether you can trust the result

Results update in real time as you type. No server, no signup, no tracking.

## Who is this for

- **Marketing teams** running landing page or email experiments
- **Web designers and developers** testing layout, copy, or UX changes
- **Product managers** evaluating feature variations
- **Anyone** who needs a quick, reliable significance check

## How to read the results

A result is marked **Significant** when the confidence level reaches 95% or higher (p-value < 0.05). This means there is less than a 5% probability that the difference between your variants happened by chance.

If the result says **Not Significant**, you either need more data or the difference between variants is too small to be conclusive.

### Sample size matters

Small sample sizes produce unreliable results. As a general rule:

- Below ~1,000 participants per variant, significance is hard to reach unless the difference is large
- For subtle differences (1-2% improvement), you typically need 10,000+ participants per variant
- Always let your experiment run to completion before making decisions

## Features

- Compare up to 4 variants (original + 3 variations)
- Share experiments via URL — click "Share Link" to copy a URL that restores all your data
- Works entirely in the browser — no data is sent to any server
- Responsive design for desktop and mobile

## Statistical method

The calculator uses a **two-proportion Z-test** (two-tailed):

```
SE = sqrt[(p1 * (1 - p1) / n1) + (p2 * (1 - p2) / n2)]
Z  = (p2 - p1) / SE
p-value = 2 * (1 - normalCDF(|Z|))
```

Where `p1`/`p2` are conversion rates and `n1`/`n2` are participant counts. The normal CDF is computed using an Abramowitz & Stegun error function approximation (max error ~1.5e-7).

The significance threshold is **p < 0.05** (95% confidence).

## Tech stack

Static site — three files, no dependencies, no build step:

- `index.html` — page structure
- `style.css` — styling
- `script.js` — statistics and interactivity

Hosted on GitHub Pages.

## License

[GNU Affero General Public License v3.0](https://choosealicense.com/licenses/agpl-3.0/)
