# Clear Path wireframes for Figma

A small Figma plugin that draws a **low-fidelity, clickable wireframe** of the Clear Path
redesign in your own Figma file. It runs locally; nothing is sent anywhere.

The wireframe keeps the redesign's screens, structure and flow, but none of its visual
design or real content. Everything is drawn with black, white and greys only:

- thin outlines
- boxes with an X for images
- grey bars for text
- outlined buttons, plain inputs, checkboxes and radio buttons

## What it creates

**Page "Clear Path · Lo-fi wireframes"**

- **Main flow, left to right**, with a labelled arrow between each pair of screens:

  01 Home → 02 Frame Finder → 03 Finder results → 04 Listing → 05 Product details →
  06 Prescription → 07 Bag → 08 Checkout → 09 Confirmation

- **Branch screens directly under the screen they belong to**, each joined by a short
  vertical arrow:
  - **04A Empty state**, under 04 Listing
  - **04B Compare**, under 05 Product details. It is opened from the compare tray on 04,
    and its arrow points up to 05.
  - **08A Payment declined**, under 08 Checkout. Its "Retry" button goes to 09.
- **Labels:** every screen has a label outside the page, for example "04 — LISTING",
  plus a one-line description. Each page sits inside a simple browser frame showing its
  URL.
- **Cover and component kit**, to the left of 01:
  - The cover has a legend and the flow.
  - The kit holds the Header, Footer and Product card as main components. Edit one and
    every screen updates.

**Page "Clear Path · UX notes"**

- One card per screen. Each numbered black circle on a screen is explained here, with
  its issue ID (U1–U6, X1–X13).

**Clickable prototype**

- Start the flow "Purchase journey" from 01.
- These are linked:
  - main buttons: Next, See my frames, Continue, Save, Checkout, Pay, Retry
  - Back and Change buttons
  - need tiles, shape tiles and "See all" links
  - product cards and their VIEW button
  - the filter option that produces the empty state
  - Compare frames and Choose
  - in the header: the logo, Shop by need, Frames by shape, Find my frame and the bag
- Elements that lead nowhere in the flow, such as Help or Track order, are left unlinked.

## Run it (Figma desktop app; plugins in development can't be imported in the browser)

1. Open or create a Figma design file.
2. Menu → **Plugins → Development → Import plugin from manifest…**
3. Choose `design/figma-wireframe/manifest.json` from this repository.
4. Menu → **Plugins → Development → Clear Path Wireframes**.
5. Wait for the "Clear Path lo-fi wireframes" message. Then select **01 — HOME** and
   press **Present** (▶).

Running it again adds new pages; delete the old ones first if you want a single copy.

## Tips

- **Hide the notes:** search the layers for "UX marker" (Ctrl+F), select them all and hide
  them.
- **Prototype device:** set it to Desktop or "None" so long pages scroll.
- **Font:** Inter, which is always available in Figma.
- **Earlier version:** the previous, more detailed generator (with full copy, prices and
  the low/mid toggle) is kept in `archive/code-v1-detailed.js`. To run it, point `main` in
  `manifest.json` at that file.
