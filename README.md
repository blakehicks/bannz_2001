# bannz_3000

## HTML Banner Package for the Yeare of Oure Lourde Three Thousande

_Dap to [@crigger](https://github.com/crigger) for the OG package this is based on._

---

## Installation

_This is for cloning directly from repository. You can also use command line tools with [create-bannz](https://github.com/blakehicks/create-bannz)._

- Open Terminal, `cd` to desired location, then `git clone https://github.com/blakehicks/bannz_3000.git` to grab repo.
- Switch to directory with `cd bannz_3000` (feel free to change name first to be more descriptive if desired).
- `yarn` or `npm install` to get dependencies.

## Commands

### `yarn bannz setup` or `npm run bannz setup`

**Perform initial setup.**

- Set client name.
- Choose animation library ([GSAP](https://greensock.com/docs/v3) or [Anime.js](https://animejs.com/documentation/)) and insert CDN link into template HTML.
- Initialize your first ad creative based on whatever size you feel like starting with.

### `yarn bannz watch` or `npm run bannz watch`

**Choose creative to watch for changes and show in browser.**

- Lists all existing ad creatives in `src/banners/` that are properly denoted with size names.
- Loads chosen creative in default browser tab at `localhost:3000`.
- Monitors for changes in directory and reloads tab via [Browsersync](https://browsersync.io/).
- Minifies CSS from `src/banners/<creative>/assets/css/source.css` to `style.css` in same folder.
- Minifies JS from `src/banners/<creative>/assets/js/main.js` to `main.min.js` in same folder.
- Add arg `--folder <creative name here>` to skip selection process and target specific ad.
- Use `CTRL + C` to stop process.

### `yarn bannz deploy` or `npm run bannz deploy`

**Zip up vendor-ready files in `src/banners/` and output to `/dist` for sending along to vendor.**

- Grabs only minified and otherwise necessary files before zip to cut file size down as much as possible.

### `yarn bannz -h` or `npm run bannz -h`

**See most of the above information in your terminal.**
