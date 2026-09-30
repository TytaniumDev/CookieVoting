# Setup — reusing the `cookie-voting` Firebase project

The new app reuses the existing Firebase / Google Cloud project **`cookie-voting`**
(hosting at <https://cookie-voting.web.app>) instead of creating a new one. The
project is already on the Blaze plan with Firestore, Storage, Auth and Hosting
set up, so the owner only needs to verify a few settings and clear out what the
previous attempt left behind.

This file lists the steps only the owner can do. Agent sessions never touch the
real project: they build and test against the Firebase emulators with the
`demo-cookie-voting` project ID, and changes reach `cookie-voting` only through
the deploy workflow (roadmap phase 2).

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
`addedAt` (type _timestamp_, now) → _Save_. Repeat for any co-admins.

## 4. Deploy credentials for GitHub Actions

Roadmap phase 2 adds a workflow that deploys rules, functions and hosting to
`cookie-voting` from `main`, plus preview URLs for pull requests. Phase 2
replaces this section with the exact steps (a service account with the right
roles, stored as a GitHub secret).

## 5. Storybook on GitHub Pages

GitHub → repo _Settings_ → _Pages_ → _Build and deployment_ → Source:
**GitHub Actions**. The old attempt published Storybook here too, so this may
already be set.
