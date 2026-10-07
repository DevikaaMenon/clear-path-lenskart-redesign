# Photo credits

The site uses three photographs, all on the Home page and nowhere else: a product shot in the hero and two portraits.
Product cards keep the to-scale frame drawings so frames stay easy to compare.

## Current photos

The project owner supplied the three photos as one three-panel image (7 Oct 2026).
They were cut into three 4:5 crops.

> **To do before publishing:** record each photo's source, photographer and licence below.
> If the licence can't be confirmed, switch back to the earlier Unsplash photos (see below).

| Where | File | Shows | Source / licence |
|---|---|---|---|
| Hero | `src/assets/photos/hero-crystal-frame-lilac.jpg` | Crystal-clear round frame leaning on ribbed glass, lilac (product shot, no person) | Supplied by project owner; source not yet recorded |
| *(not used now; was the hero)* | `src/assets/photos/hero-clear-frames-pink.jpg` | Grey-transparent and crystal-clear round frames on pink | Supplied by project owner; source not yet recorded |
| *(not used now; was the hero)* | `src/assets/photos/hero-black-frames-clip-on.jpg` | Black glasses with a clip-on sun front | Supplied by project owner; source not yet recorded |
| *(not used now; was the hero)* | `src/assets/photos/portrait-round-yellow.jpg` | Round gold-wire glasses, yellow-tinted lenses | Supplied by project owner; source not yet recorded |
| Eye test section | `src/assets/photos/portrait-round-gold.jpg` | Round gold-wire glasses, pushed up | Supplied by project owner; source not yet recorded |
| Featherweight collection tile | `src/assets/photos/portrait-red-rimless.jpg` | Slim rimless glasses, red-tinted lenses | Supplied by project owner; source not yet recorded |

## Earlier photos (kept in the repo, not used)

These are from Unsplash under the [Unsplash License](https://unsplash.com/license): free to use,
including commercially, with no attribution required. Each licence was checked on 7 Oct 2026.
To use them again, point `src/lib/photos.ts` back at these files.

| Was used in | File | Photo | Photographer |
|---|---|---|---|
| Hero | `src/assets/photos/hero-professional.jpg` | [Man wearing glasses looking down at laptop](https://unsplash.com/photos/9LwA7kToz9g) | litoon dev ([@litoondev](https://unsplash.com/@litoondev)) |
| Eye test section | `src/assets/photos/eyetest-older-woman.jpg` | [Older woman smiling, in glasses](https://unsplash.com/photos/3VwALdNbvFQ) | Ashwini Chaudhary (Monty) ([@suicide_chewbacca](https://unsplash.com/@suicide_chewbacca)) |
| Featherweight collection tile | `src/assets/photos/featherweight-student.jpg` | [Man wearing glasses and a plaid shirt](https://unsplash.com/photos/cZxNs7ZS1O0) | Mahir Velani ([@mahir009](https://unsplash.com/@mahir009)) |

## Treatment

- **Crop:** every photo is cropped to 4:5 around the face. The current files are 840×1050; the earlier ones are 1000×1250.
- **Compression:** JPEG via mozjpeg, giving 68–104 KB per current file. Next.js then serves AVIF/WebP at the width each layout needs.
- **Corners and border:** square corners and a 1px border, matching the product cards.
- **Loading:** the hero photo loads with priority. The other two load lazily, with a blur placeholder.
- **No text on photos:** headlines and buttons always sit on a plain background beside the photo, never on top of it.
- **Alt text:** each photo describes the person and their glasses. The text lives in `src/lib/photos.ts`.
