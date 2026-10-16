# Built-artifact browser verification

Build and validate the isolated `dist/public` artifact first. The browser suite
does not run a source/development server or a repository-root web server.

```sh
node --test scripts/serve-public.test.mjs
yarn playwright test
```

Playwright starts `node scripts/serve-public.mjs` at `127.0.0.1:4173` and refuses
to reuse an existing listener. Stop a separately started preview before running
the suite. The server always selects `dist/public` from its own script location;
there is no CLI override for exposing another directory. Its fixture-only
programmatic directory argument lets the five server tests exercise traversal,
symlink, MIME, HEAD, redirect and genuine-404 behavior in a temporary directory.

The suite uses installed Chrome when available at the standard macOS path,
otherwise Playwright's existing Chromium installation. A known local executable
can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. No browser download,
user profile, saved account session, or authentication state is needed. Every
test gets a fresh temporary browser context. Sandboxed browser launch failures
are environment failures and must not be reported as product regressions.

The private route contract is read from
`dist/site-build/publication-manifest.json`; the public artifact must exclude it.
The expected ten route paths and canonical origin are also asserted independently
in the tests. Every route is opened directly, checked for meaningful HTML and
metadata, then compared with the complete main text in a JavaScript-disabled
mobile context. Additional checks cover the seven homepage sections, honest
in-progress project summaries, original writing links, keyboard and touch
navigation, native no-JS contents, responsive document overflow, reduced motion,
system/light/dark preferences, blocked storage and the pre-paint theme bootstrap.
Profile utility checks cover the real Clipboard API with granted temporary test
permissions, rejection fallback selection, bounded status messages and responsive
source-row gutters. The success check writes the approved public profile JSON;
clipboard comparison stays inside the browser and returns only booleans, without
logging arbitrary clipboard contents. A JavaScript-disabled copy control must be
disabled or hidden while the main content remains readable.

Firebase checks find the actual emitted app SDK chunk. They observe its successful
same-origin response, read the existing SDK's app registry, compare the supplied
configuration by digest, and check instance identity/data-collection settings.
The failure check blocks only that chunk and requires a bounded warning while
article text and contents remain usable. This does not validate access to a
Firebase account, a service product, or remote project settings. The focused
Firebase unit tests separately cover repeated/concurrent startup and conflict
handling.

One additional scenario reads the generated enforced Content Security Policy
from `firebase.json` and applies it to the actual public document responses using
scoped browser interception. It checks hydration, theme preference, app startup,
reading and contents navigation while collecting `securitypolicyviolation`
events. This establishes local compatibility of the proposed policy, including
its generated inline hashes. It does not establish Firebase provider routing,
header matching, cache behavior or a successful Hosting deployment.

Each scenario attaches observed requests, responses, failures, console messages
and uncaught exceptions. Unexpected third-party requests, console errors, page
errors and request failures fail the scenario. Expected chunk-blocking errors are
scoped to the failure test; their exact URL and warning are still asserted.
JSON results and failure traces are saved under `dist/verification`, outside the
public artifact. The suite takes no screenshots; the selected-composition review
uses a separate, bounded capture round.

These checks provide local static-artifact evidence in Chromium. They do not
establish complete WCAG conformance, screen-reader compatibility, browser-family
parity, Lighthouse scores, native browser zoom interaction, or live GitHub/Firebase
headers, cache behavior and unknown-route responses. The 200-percent test verifies
equivalent CSS-pixel reflow geometry; the 320px case additionally exercises narrow
reflow. Actual token contrast/gamut is checked by `yarn check:contrast`.
