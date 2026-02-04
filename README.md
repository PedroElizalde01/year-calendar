# ![Icon](public/icon.svg) Year Tiles

A minimal year-at-a-glance tile calendar. Mark special dates with colors and labels, pick your time zone, and generate a shareable wallpaper link.

![Desktop](public/screenshot/desktop-home.png)
![Editor](public/screenshot/desktop-editor.png)
![Share Link](public/screenshot/desktop-share.png)

## Features
- Year grid with daily tiles and hover labels
- Special dates with color, label, and optional birthday highlight
- Time zone selection and automatic day rollover
- Shareable image link with wallpaper sizes

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

## Optional: Profile Storage
Share links can persist by storing profiles in Vercel Blob. Set `BLOB_BASE_URL` to the public base URL for your blob store.
