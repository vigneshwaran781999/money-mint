# Money Mint 🌿

Personal & family money manager for **Android** and **Windows** (web app), built with Expo (SDK 58) and Supabase.

## Features

- **Daily entries**: income, expense and transfers between accounts, with categories, notes and dates
- **Profit & Loss**: monthly and yearly P&L, savings rate, month-by-month table
- **Accounts**: bank, cash, UPI, wallet and credit card, with live balances, a ledger per account, and archive
- **Reports**: income vs expense bar chart, category donut charts
- **Budgets**: monthly limit per category, with alerts at 80% and 100%
- **Recurring & reminders**: salary, rent, EMIs and bills. Each one is either auto-added on its due date or only reminds you (phone notification at 9 AM)
- **Lend & borrow**: track money given to or taken from people, partial repayments and due-date reminders
- **Search & filters**: by text, period, type, account and category
- **CSV export**: opens in Excel or Google Sheets
- **Security**: 4-digit PIN lock plus fingerprint unlock; the app relocks after 1 minute in the background
- **Light / dark mode**, ₹ INR with Indian number format (1,00,000)
- **Cloud sync**: sign in on your phone and on Windows to see the same data
- **Over-the-air updates**: push new features to the installed Android app without reinstalling

## 1. One-time setup

### Supabase (free cloud database)
1. Create a project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. Open **Project Settings → API** (or **API Keys**) and copy the **Project URL** and the **publishable key**.
4. Copy `.env.example` to `.env` and fill in both values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
5. Optional: to sign up without a confirmation email, go to **Authentication → Sign In / Providers → Email** and turn off **Confirm email**.

### Install
```bash
npm install
```

## 2. Run on your Android phone (Expo Go)
1. Install **Expo Go** from the Play Store.
2. Connect the phone and the laptop to the **same Wi-Fi**.
3. Run:
   ```bash
   npx expo start
   ```
4. In Expo Go, tap **Scan QR code** and scan the QR code shown in the terminal.

If the phone can't connect (because of office or college Wi-Fi, or a firewall), use `npx expo start --tunnel`. Also allow Node.js through the Windows Firewall when Windows asks.

After you change `.env`, restart with `npx expo start -c` to clear the cache.

## 3. Run on Windows
- **Development:** run `npm run web`. It opens in your browser.
- **Build:** run `npx expo export -p web`. This creates a static site in `dist/`. Host it for free on Netlify, Vercel or Cloudflare Pages.
- **Install as an app:** open the site in Edge or Chrome, then choose **⋯ → Apps → Install this site as an app**. You get a Start-menu icon and its own window.

## 4. Installable APK and over-the-air updates
You need a free Expo account (`npx eas-cli@latest login`).

```bash
npx eas-cli@latest init                    # link the project (one time)
npx eas-cli@latest update:configure        # sets updates.url in app.json (one time)
npx eas-cli@latest build -p android --profile preview   # builds an APK; install it on your phone
```

To ship new features to the installed app later, without reinstalling:
```bash
npx eas-cli@latest update --channel preview --message "Added X"
```
The app downloads the update on its next launch. You can also go to **More → Settings → Check for updates**.

## Project structure
```
src/
  app/            screens (expo-router): (tabs)/ home, entries, reports, accounts, more
                  transaction, account/[id], loans, loan/[id], budgets, recurring, categories, settings
  components/     UI kit, charts, pickers, PIN pad, lock screen
  data/           React Query hooks over Supabase tables
  lib/            money/date helpers, P&L calculations, CSV export, reminders, recurring engine
  providers/      auth, theme, app lock
supabase/schema.sql   database tables + row-level security
```

## Scripts
| Command | What it does |
|---|---|
| `npx expo start` | Dev server for Expo Go |
| `npm run web` | Web/Windows dev |
| `npx tsc --noEmit` | Type-check |
| `npx expo lint` | Lint |
