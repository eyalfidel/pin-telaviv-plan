# Tel Aviv Pins

The platform should include an interactive map (based on OpenStreetMap or a similar open-source map).

Users should be able to click anywhere on the map (“drop a pin”). When a pin is placed, open a submission panel (popup or side card) with the following fields:

Full address (free text) – street name, house number, Tel Aviv–Yafo

Contact details for follow-up and updates:

Email address (required)

Mobile phone number (required)
(Clearly state that contact details are collected only for clarification and updates related to this process.)

Photo upload – allow upload of one image

Existing bicycle parking at the location (single choice):

There are existing bicycle parking facilities at this exact spot, but additional facilities are needed

There are no bicycle parking facilities at this location

There are bicycle parking facilities nearby (within short walking distance), but not at this exact spot

Is this location a point of interest? (multiple choice):

Cultural institution

Educational institution

Health institution

Commercial area

Public transport hub

Park / public space

Other (with free text field)

Free text comments – open text for additional explanation or context

After submission, each point should appear as a visible marker on the map.

Platform Requirements

Aggregate all submitted points on the map

Enable basic filtering (e.g., by existing bicycle parking conditions or type of point of interest)

Be fully mobile-friendly

Use a clean, minimal, civic-oriented design suitable for a municipal website

Admin Interface

Include a password-protected admin interface that allows municipal staff to:

View all submissions in a table and on the map

Export data in CSV and GeoJSON formats

Moderate, hide, or remove inappropriate or duplicate submissions

The overall tone, UI, and UX must clearly communicate that this is a municipal public participation tool for Tel Aviv–Yafo, intended for planning, analysis, and informed decision-making — not a commercial product.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pin-telaviv-plan.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8f4fe1b3-bd59-4bb5-a0ba-80d97a078b8d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deployment

This is no longer served from Lovable. Every push to `main` runs
`.github/workflows/deploy.yml`, which builds the app and publishes it via
GitHub Pages to the custom domain in `public/CNAME`
(**bikepark.meitallehavi.com**).

## Keeping the Supabase project awake

Supabase's Free plan auto-pauses a project after about 7 days with no
database activity. Two independent, redundant pings keep that from ever
happening again:

1. `.github/workflows/supabase-keepalive.yml` — a daily GitHub Actions job
   that does one harmless, read-only `SELECT` against `site_settings`.
2. An external ping via [cron-job.org](https://cron-job.org) (or similar),
   hitting the same endpoint independently of GitHub's scheduler:
   - URL: `https://mawyyatwjpqyfdhdshzh.supabase.co/rest/v1/site_settings?select=id&limit=1`
   - Header: `apikey: <VITE_SUPABASE_PUBLISHABLE_KEY from .env>`
   - Method: GET, at least every few days.

Neither one writes anything, so neither shows up on the public map or in
the admin dashboard. If GitHub's scheduler ever skips a run, the external
ping still covers it, and vice versa.
