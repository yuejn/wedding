# Ysabel & Peter, 10 April 2027, Amsterdam

Plain HTML, CSS and JS. No build step.

## Where to edit things
| What | File |
|---|---|
| All text (English + Dutch), incl. the NO-button taunts | `content/copy.json` |
| Guest list and plus-ones | `content/guests.json` |
| Colours, fonts, spacing, motion | `css/tokens.css` |
| Wedding date/time, sheet URL, how many dodges before surrender | `js/config.js` |

## Run locally
`fetch()` needs a server, so don't open `index.html` directly:

```bash
python3 -m http.server 8123
```

Then open http://localhost:8123.

## Collect answers in Google Sheets
1. Create a Google Sheet. Open Extensions > Apps Script and paste `apps-script.gs`.
2. Deploy > New deployment > Web app. Execute as: Me. Access: Anyone.
3. Paste the web-app URL into `sheetUrl` in `js/config.js`.

Until `sheetUrl` is set, answers are only logged to the browser console.

## Deploy on GitHub Pages
Push this folder to a repo, then Settings > Pages > deploy from `main` / root.
All paths are relative, so it works under `/repo-name/`. `.nojekyll` is included.
The page has `noindex`, but the guest list in `guests.json` is public in the repo,
so use first names or a private repo if that matters.
