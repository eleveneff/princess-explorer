# NEXT — Princess Explorer v4.5

Branch `cursor/castle-grounds-additions-85e7`. Do not merge. Do not publish.

Game version: **v4.5**.

## What this round adds

- Royal quest map: ten short chapters through the gate, castle rooms, the garden island, and a practice question. Progress is saved. The little checks do not pay coins.
- Castle care: confirm-before-charge, a fresh coin and prerequisite check, no second charge, hidden until bought, saved. Twelve additions are on that list.
- Castle grounds radius 15 → 19.5 (×1.30). Interior rooms stay the same size. Paths now start at the new edge. A saved position on the old lawn (farther than the moat, inside the old 15) is scaled once by 1.30. Coins, stars, items, and other fields stay.
- Hall signs for Throne Hall, Library, Ballroom, Kitchen, and Trophy are solid plaques in the wide shot.
- Prompt and Exit are 56px and do not overlap at 1280×720, 390×844, or 844×390.
- Grown-ups page (12 × 8 = 96): weak kinds, recent answers, wardrobe / gate / build spending.
- Weekly review repeats missed question kinds and pays nothing.

## Additions

| Piece | Coins | Needs |
| --- | ---: | --- |
| Royal Garden Terrace | 40 | — |
| Pony Stable | 50 | — |
| Art Studio Tower | 45 | — |
| Secret Library Nook | 35 | — |
| Tea Party Pavilion | 30 | Terrace |
| Rose Maze | 35 | Terrace |
| Fencing and Jiu Jitsu Training Hall | 50 | — |
| Royal Tennis Court | 40 | — |
| Star Observatory | 45 | — |
| Moat Swan Boats | 30 | — |
| Grand Ballroom Chandelier and Stage | 35 | — |
| Corgi Castle for Sir Biscuit | 25 | — |

Their activities do not pay coins. The 3-in-a-row gate still pays 20. Castle entry is still 10 or 3 in a row. An outfit change is still 1 coin, and trying on is free.

## Checks

`node tests/v45.mjs` — **21 passed, 0 failed**.
`node tests/castle-polish.mjs` — **20 passed, 0 failed**.
No page errors. Only this agent was running, so the SwiftShader passes were serial.

Hall entry, same camera `(400, 4.2, 9)`, median of three on this machine (not a phone):

- v4.4 baseline: **5** (3.75, 5, 5)
- v4.5: **4** (4, 4, 5)

The runs overlap. This is not a phone measurement.

## Nits

- The outdoor camera is a fixed offset, so standing beside one new building can put another roof in the foreground.
- Hedge walls are not solid. The maze is followed by clues.
- Castle-gate coins in the grown-up page count only payments after this update. Wardrobe spend still includes older saves.
- Wide-shot signs name the rooms. They are not doorway plaques up close.
