# Setup — reusing the `cookie-voting` Firebase project

The new app reuses the existing Firebase / Google Cloud project **`cookie-voting`**
(hosting at <https://cookie-voting.web.app>) instead of creating a new one. The
project is already on the Blaze plan with Firestore, Storage, Auth and Hosting
set up, so the owner only needs to verify a few settings and clear out what the
previous attempt left behind.

This file lists the steps only the owner can do. Agent sessions never touch the
real project: they build and test against the Firebase emulators with the
`demo-cookie-voting` project ID, and changes reach `cookie-voting` only through
the deploy job in CI (see §4).

## Known facts about the project

| Item                 | Value                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| Project ID           | `cookie-voting`                                                             |
| Hosting              | <https://cookie-voting.web.app> (serves the old app until the first deploy) |
| Storage bucket       | `cookie-voting.firebasestorage.app`                                         |
| Old functions region | `us-west1` (new functions use the same region)                              |
| Web config           | Public; readable at <https://cookie-voting.web.app/__/firebase/init.json>   |

The web config (API key, app ID, …) identifies the project; it is not a secret,
so it gets committed to the repo in phase 2. Access is protected by Auth and
security rules, not by hiding the config.

## 1. Check the basics (~5 min)

Do this before real-device testing (roadmap phase 3).

- [ ] **Blaze plan still active.** Firebase console → ⚙️ → _Usage and billing_ →
      _Details & settings_ should show Blaze. (The old app's Cloud Functions
      required Blaze, so it should be.)
- [ ] **Budget alert.** Google Cloud console → _Billing_ → _Budgets & alerts_ →
      create a budget for `cookie-voting` of **$1** with email alerts. It's a
      tripwire; expected spend is $0.
- [ ] **Storage bucket location.** Firebase console → _Storage_ → the bucket's
      location. The free quota (5 GB stored, 100 GB/month downloads) only
      applies to **us-west1, us-central1 or us-east1**. The old functions ran
      in us-west1, so it's probably us-west1. If it's anything else, costs at
      this scale are still cents per year; tell the next agent session so
      ARCHITECTURE.md records it.
- [ ] **Sign-in providers.** Firebase console → _Authentication_ → _Sign-in
      method_: **Google** and **Anonymous** enabled. Under _Settings_ →
      _Authorized domains_, `cookie-voting.web.app`,
      `cookie-voting.firebaseapp.com` and `localhost` are listed.

## 2. Clear out the previous attempt

Do this before real-device testing (roadmap phase 3). Why it matters:

- The old **Cloud Functions are still deployed**. `processCookieImage` runs on
  every Storage upload and calls the paid Cloud Vision API for files under
  `uploads/`.
- The old **Firestore data uses the same `events/…` paths** the new app reads,
  in an incompatible shape, so old events would show up broken on the new
  dashboard.
- The old **security rules** allow any signed-in user, including anonymous
  voters, to write to test collections. They are replaced when the new rules
  deploy.

Install the Firebase CLI and sign in once: `npm install -g firebase-tools`, then
`firebase login`.

**a) Delete the old functions.** List what's deployed first; the names below come
from the old code and should match.

```sh
firebase functions:list --project cookie-voting
firebase functions:delete processCookieImage addAdminRole removeAdminRole confirmCookieCrops \
  --region us-west1 --project cookie-voting
```

Delete anything else the list shows too. Later, the new deploy workflow also
removes functions that aren't in the repo.

**b) Delete the old Firestore data.** This is irreversible. If you want to keep
anything, export it first (Firestore console → _Import/Export_).

```sh
firebase firestore:delete --all-collections --project cookie-voting
```

That clears the old `events`, `images`, `test_events`, `cookie_batches` and
`test_system` collections.

**c) Delete the old photos.** The plate photos worth keeping (every unique
one in `shared/cookies/`) are already saved in `fixtures/plates/`, so the
bucket can be emptied. Firebase console → _Storage_ → select every folder →
_Delete_. The new app hasn't uploaded anything yet, so the bucket should end
up empty. (With the Google Cloud CLI:
`gcloud storage rm --recursive "gs://cookie-voting.firebasestorage.app/**"`.)

**d) Optional tidy-ups**

- Google Cloud console → _APIs & Services_: disable **Cloud Vision API**;
  nothing will use it.
- GitHub → repo _Settings_ → _Secrets and variables_ → _Actions_: the old
  `FIREBASE_TOKEN` and `VITE_*` secrets are unused by the new workflows. Remove
  them once the new deploy workflow is running (phase 2).
- Your Google account may still carry the old `admin: true` custom claim. It's
  harmless; the new app ignores it.

## 3. Make yourself an admin

Do this after step 2b, which would delete it.

Firebase console → _Firestore_ → _Start collection_ → collection ID `admins` →
document ID = **your Google account email in lowercase** → add a field
`addedAt` (type _timestamp_, now) → _Save_. Only the first admin needs this:
everyone else signs in and taps **Ask to be an admin**, and you approve them on
the app's **Admins** page.

## 4. Deploy credentials for GitHub Actions

CI (`.github/workflows/ci.yml`) deploys to `cookie-voting` on every push to
`main` once tests pass: Firestore rules and indexes, Storage rules, Cloud
Functions, hosting, and the photo bucket's CORS config. Pull requests get a
hosting preview URL (valid 7 days) posted as a comment. Until the secret below
exists, both jobs are skipped with a notice, so CI stays green.

Do steps 2a–2b first: the first deploy runs with `--force`, which deletes any
function that isn't in this repo (including the old ones).

**a) Create a service account.** Google Cloud console → _IAM & Admin_ →
_Service accounts_ (project `cookie-voting`) → _Create service account_.
Name it `github-deploy`. Grant these roles:

| Role                            | Needed for                                   |
| ------------------------------- | -------------------------------------------- |
| Firebase Admin                  | Rules, indexes, hosting and preview channels |
| Cloud Functions Admin           | Deploying functions                          |
| Cloud Run Admin                 | 2nd-gen functions run on Cloud Run           |
| Eventarc Admin                  | Firestore triggers for 2nd-gen functions     |
| Artifact Registry Administrator | Function images and their cleanup policy     |
| Service Account User            | Deploying functions as the runtime account   |
| Storage Admin                   | Applying the photo bucket's CORS config      |
| Service Usage Consumer          | Checking that the needed APIs are enabled    |

If a first deploy still fails with a permission error, the log names the
missing permission; add the matching role and re-run the workflow.

**b) Create a key.** Open the service account → _Keys_ → _Add key_ →
_Create new key_ → JSON. A file downloads. Treat it like a password.

**c) Add it to GitHub.** GitHub → repo _Settings_ → _Secrets and variables_ →
_Actions_ → _New repository secret_. Name: **`FIREBASE_SERVICE_ACCOUNT`**.
Value: the whole contents of the JSON file. Then delete the downloaded file.

**d) Deploy.** GitHub → _Actions_ → _CI_ → _Run workflow_ on `main` (or push
anything to `main`). The _Deploy to cookie-voting_ job should go green, and
<https://cookie-voting.web.app> then serves the new app.

**e) Let Storage rules read Firestore (one time).** Storage rules check the
admin list in Firestore, which needs a role the CLI can't grant from CI. Without
it, every photo upload fails with `storage/unauthorized`. Done on 2026-10-14;
on a new project run:

```sh
PN=$(gcloud projects describe cookie-voting --format='value(projectNumber)')
gcloud projects add-iam-policy-binding cookie-voting \
  --member="serviceAccount:service-${PN}@gcp-sa-firebasestorage.iam.gserviceaccount.com" \
  --role="roles/firebaserules.firestoreServiceAgent" --condition=None
```

**f) Tidy up.** Once that works, delete the old `FIREBASE_TOKEN` and `VITE_*`
secrets (step 2d).

## 5. Storybook on GitHub Pages

GitHub → repo _Settings_ → _Pages_ → _Build and deployment_ → Source:
**GitHub Actions**. The old attempt published Storybook here too, so this may
already be set.

## 6. Error reporting with Sentry

The web app reports errors (crashes, failed saves and uploads) to Sentry. It's
off until these GitHub Actions secrets exist; the owner keeps them in Doppler
and syncs them to the repo.

| Secret              | Where it comes from                                                  | Needed for            |
| ------------------- | -------------------------------------------------------------------- | --------------------- |
| `SENTRY_DSN`        | Sentry → the React project → _Settings_ → _Client Keys (DSN)_        | Sending errors at all |
| `SENTRY_ORG`        | The organization slug in the Sentry URL (`https://<org>.sentry.io`)  | Readable stack traces |
| `SENTRY_PROJECT`    | The project's slug (_Settings_ → _General_)                          | Readable stack traces |
| `SENTRY_AUTH_TOKEN` | _Settings_ → _Developer Settings_ → _Organization Tokens_ → _Create_ | Uploading source maps |

**Doppler:** put the four in a `cookie-voting` project, then _Integrations_ →
_GitHub_ → sync that config to `TytaniumDev/CookieVoting` (Actions secrets).
The next deploy picks them up. Production errors are tagged `production`,
PR previews `preview`, and each with the deployed commit as the release.
