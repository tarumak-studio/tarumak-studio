# Tarumak Studio

Free tools for designers, marketers and developers.
**46 tools • 10 blog articles • 100% browser-based**

---

## Getting started

### Deploy to Netlify (recommended, 30 seconds)
1. Drag the `tarumak-studio` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Your site is live on a `.netlify.app` URL

### Run locally
Open `index.html` in any browser — no server needed.

---

## Before going live — checklist

### 1. Add your Google Analytics 4 ID
Open `assets/js/config.js` and replace `G-XXXXXXXXXX`:
```js
ga4: 'G-XXXXXXXXXX',  // ← your real ID here
```
Get your ID at [analytics.google.com](https://analytics.google.com) → Admin → Create Property.

### 2. Add real affiliate links
In `assets/js/config.js`, replace the `url:` values in the `AFFS` object:
- Canva Pro affiliate: [canva.com/affiliates](https://canva.com/affiliates)
- Namecheap affiliate: [namecheap.com/affiliates](https://namecheap.com/affiliates)
- ConvertKit affiliate: [convertkit.com/affiliate](https://convertkit.com/affiliate)

### 3. Apply for Google AdSense
After deploying with real content, apply at [adsense.google.com](https://adsense.google.com).
You need: 20+ articles, live HTTPS URL, some traffic. Approval takes 2–4 weeks.

---

## File structure

```
tarumak-studio/
├── index.html                    ← Main SPA (loads all CSS + JS)
├── assets/
│   ├── css/
│   │   ├── main.css              ← Variables, layout, header, hero, footer
│   │   ├── tools.css             ← Tool panels, dropzone, results
│   │   └── blog.css              ← Blog cards, article styles, affiliate banners
│   └── js/
│       ├── config.js             ← ⭐ Edit this before deploying
│       ├── utils.js              ← Shared helpers (download, toast, dropzone)
│       ├── data.js               ← TOOLS array, categories, icons
│       ├── features.js           ← Favourites, counter, cookie consent, Cmd+K
│       └── app.js                ← Router, grid, pages, blog, navigation
├── tools/
│   ├── image-tools.js            ← 15 image tool implementations
│   ├── pdf-tools.js              ← 15 PDF tool implementations
│   ├── converter-tools.js        ← 8 converter tool implementations
│   └── marketing-tools.js        ← 8 Marketing Designer tool implementations
└── blog/
    ├── data.js                   ← 10 blog articles (add new ones here)
    └── articles/
        ├── jpg-vs-png-vs-webp.html         ← Static SEO pages
        └── social-media-image-sizes-2026.html
```

## Adding a new tool

1. Add entry to `TOOLS[]` array in `assets/js/data.js`
2. Add `INIT['your-slug'] = function(panel){...}` to the appropriate tools file
3. Done — the tool appears automatically in the grid and tabs

## Adding a new blog article

1. Add entry to `ARTICLES` object in `blog/data.js`
2. Create a static `blog/articles/your-slug.html` for SEO (copy existing article as template)
3. Done — article appears in the blog grid automatically

---

## Navigation structure
```
[Home] [Tools] [Marketing Toolkit] [AI Tools] [Blog] [Resources] [Templates] [Go Pro ✦]
```

## Recommended domain
`tarumak.studio` — register at Namecheap, point to Netlify via CNAME.

---

Made with ♥ by Tarumak Studio
