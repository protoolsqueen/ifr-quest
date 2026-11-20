# IFR QUEST — Jack's Flight Academy

## Status

The game includes the original 44-question modes, local Flight Log, hands-on four-sector cockpit training, and a moving hangar background. The optional custom aircraft model is activated automatically when the binary asset below exists.

## One binary asset to upload

Upload the attached file **Jack_N404CK_Volpar_Turboliner_II_spline.glb** in the **repository root** alongside `index.html`. **Do not unzip or rename it.** The repository currently has the JavaScript loader but not the GLB asset. GitHub's connected text-file API cannot upload a binary GLB from this chat.

Direct upload screen (sign in to GitHub first): https://github.com/protoolsqueen/ifr-quest/upload/main

Once committed, open https://protoolsqueen.github.io/ifr-quest/ and refresh. The loader checks for that exact filename and replaces the illustrative aircraft view with the GLB when available. It preserves the existing hangar as a lightweight fallback if the model, network, or WebGL fails.

## Paint shop

Default (original materials), Sonic Blue Pearl (stylized blue), Yellow, Red. The paint choice is saved in localStorage. The loader attempts to identify exterior fuselage/wing/paint materials without recoloring glass, tires, interiors, or props. Exact named-material mapping must be checked against the supplied GLB after it is uploaded: unknown naming conventions may mean only some surfaces recolor.

## Study system

- IR.I.C.K2: physically select IFR altitude above terrain and obstacles.
- IR.VI.A.K1: interpret actual RNAV annunciation and choose applicable LNAV vs LP minima.
- IR.VI.B.K1: set the initial descent-rate estimate for a 3° precision approach based on groundspeed.
- IR.VII.D.K2: practice primary-display failure priority order.

These are educational conceptual simulations, not a faithful cockpit/avionics model for N404CK and not certified flight-training software. The existing question modes and progress data are retained.

## Keeping it current

Edits committed to `main` update the same GitHub Pages URL after publishing. For easier iPhone use, tell Jack to open the URL in Safari and use Share → Add to Home Screen. Existing local progress remains under the same site origin and storage key. Public GitHub Pages are not access-controlled, even if the page requests no indexing.
