# Firebase browser boundary

`config.ts` contains the exact six-field public Web app identity supplied by the
site owner in the implementation conversation. Its source evidence is preserved
locally in `prompt-workflow/architecture/firebase-web-config.json`; that planning
directory is not a deployment input. The configuration is browser application
identity, not a service-account credential or a grant to deploy infrastructure.

The shared Astro shell includes `src/components/FirebaseBootstrap.astro`. Its
ordinary bundled `<script>` calls `startFirebaseBrowserApp()` without awaiting it
from page rendering. No React hydration is needed. The entry checks for a browser
before dynamically importing `firebase/app`, so importing the boundary in build,
server, or content code does not initialize or import the SDK at runtime.

The intended app uses Firebase's default app name. The boundary creates it once,
explicitly disables automatic data collection, and returns the same object on
repeated or concurrent entry. An existing default app must retain all six supplied
options, have no additional defined options, and keep automatic data collection
disabled. A conflict is reported and left untouched; the site never deletes,
replaces, or silently reuses an incompatible app. Unrelated named apps are not
substituted for the intended app.

An import or initialization failure resolves to `undefined`. The console receives
one bounded `sdk-startup-failed` or `configuration-conflict` diagnostic per failed
entry, with no configuration values, exception payload, or visitor data. There is
no connected-status interface, retry loop, storage, token handling, or dependency
from public reading and navigation to Firebase availability.

The only runtime SDK import is `firebase/app`. Firebase 13.0.0 is pinned in Yarn;
its resolved `@firebase/app` 0.16.3 requires Node >=24.12.0, compatible with the
repository's Node 24.16.0 baseline. The umbrella package installs unused product
packages locally, but those packages are not activated or imported. Yarn currently
reports upstream missing `@firebase/app-types` peer declarations in four unused
compatibility packages; no local package extension conceals those warnings.

Run the focused behavioral tests with Node 24:

```sh
node --test src/lib/firebase/browser.test.ts
```

The tests cover original-config parity through a SHA-256 digest without disclosing
values, build/server no-import behavior, app identity under repeated and concurrent
entry, incompatible configuration and data-collection settings, and startup
failure. They inject the app registry rather than contacting a Firebase service.
The digest checks supplied configuration parity; it is not an authentication or
security mechanism.

Actual built-page request/console tracing and a failed-SDK-load browser check are
separate integration acceptance work. Unit tests do not establish network behavior
or access to the supplied Firebase project. Future Auth, Firestore, Storage, AI,
analytics, Functions, or Hosting deployment work needs a concrete selected feature
and its own integration and security boundaries. GitHub Pages remains the host.

Primary references: [Firebase modular Web setup](https://firebase.google.com/docs/web/setup),
[Firebase App reference](https://firebase.google.com/docs/reference/js/app), and
[Firebase project configuration](https://firebase.google.com/docs/projects/learn-more#config-files-objects).
