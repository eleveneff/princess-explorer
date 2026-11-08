# NEXT — Princess Explorer castle polish

Branch `cursor/castle-interior-polish-85e7`. Do not treat this file as a publish note until the PR is merged. Live site before this work is v4.3.

Game version marker: **v4.4**.

## What changed

Castle interior graphics and the interior camera only. Coins, saves, owned items, stars, the castle gate (10 coins or 3 correct in a row), the math-gate total of 20, and wardrobe pricing (1 coin per changed item, both pickers) are the same actions as v4.3.

Rooms already had floors, murals, and furniture. This pass closes the view and finishes the surfaces:

- Door plaques sit above the opening. They are no longer faded slabs in front of the lens. The action prompt still appears only when the princess is near.
- Side rooms use a doorway camera that stays on walkable floor and looks at the princess and the furniture. The long hall keeps the old follow camera (same entry pose as v4.3).
- The camera stays at least 1.35 m under the ceiling above it, and it looks at her head. Ceilings are not faded across her face.
- Each side room gets a plaster band with a gold lip, a gold rug edge inset from the walls, an opaque round gold rose window, a framed picture, an emissive lantern or sconce, and a cushion where a seat was bare. New pieces sit on the walls and corners. The middle of the room stays open. No new point lights.
- On a short landscape screen the Exit to Fountain pill sits above the keyboard hint, and above the joystick when touch controls are on.

## Lessons for Captain (apply before that release)

These are from the castle as it plays in v4.4, plus the mistakes this pass had to undo.

1. Build the shell first: floor, walls, ceiling, and an inside-facing picture. A window is a framed painting on that shell, not a hole. The outdoors should not show through a wall.
2. A follow camera behind the player stands in the back wall whenever she faces the door. For a furnished room, put the camera inside the walkable floor, in the doorway or a corner, and look at the player and the furniture. Do not let the ray travel into the next room.
3. Do not fade a ceiling across the head. That is the stair bug still in the lair climb: the slab stays in front of the face. Keep the camera at least about 1.3 m below the ceiling underside and aim at the head (here, 1.5 m up). Drop the camera; do not punch the ceiling out.
4. Name plaques belong over the door, small and solid. A large transparent label between the camera and the player reads as a dirty window. The “press E” prompt can stay on the HUD and only while she is close.
5. Light the room with the lights you already have. A sconce or hanging lamp is an emissive mesh that shares a material. It does not get its own point light.
6. Finish a surface with a few strips: a band on the lower wall, a gold edge on the rug, a frame around a picture, a cushion on the seat. Leave the center lane empty. The castle hall’s red runner with gold edges is the model. Flat boxes with no edge still read as prototypes.
7. Royal reading of the lighthouse, not a copy: blush wainscot instead of brick, a gold rose roundel instead of a brass porthole, small gold spiral finials on the balcony newels instead of a brass stair rail, and a gold cord with a glowing lantern instead of a hanging brass lamp.
8. The Exit control has to clear the thumb and the keyboard hint. On a short phone landscape that means above the joystick, not in the same bottom band.
9. Spawn on open floor. New furniture stays off the entry spot and off the room spots, so she is never boxed in. This game does not collide with props; a chair in the lane still looks like a trap when the camera sits inside it.
10. Batch the new pieces (one group, shadows off, a handful of materials). Measure the same camera before and after. A couple of frames is the budget, not a new lighting rig.

## Checks

`node tests/castle-polish.mjs` — **20 passed, 0 failed**, no page errors. There is no older suite in this repo. The new file is the regression smoke.

Covered: version v4.4, castle gate refuses at 9 coins, Pay drops 30 to 20, three correct answers stay at 40 and pass, every room camera is inside the strict walkable floor, ceiling gap stays above 1.1 m (smallest is Sir Biscuit’s room at 2.77 m) and the head is under the lens, Exit returns outside, one wardrobe change counts as 1 and a second charge drops 8 to 6, an empty purse does not charge, the shop bar reads “1 change = 1”, the mini-game cost line uses that same plural, three math-gate answers pay 6+7+7 = 20 (50 to 70), reload keeps 77 coins, streak 4, best streak 9, throne sits 3, the fencing star, the sun hat, and wardrobe spend 2. On an 844×390 touch screen the Exit pill’s bottom is at 176 and the joystick top is at 192, so the pill sits above the thumb.

Headless SwiftShader, median of three, same sampler as the v4.3 baseline on this machine (not a phone). Frame time is chunky, so a 1 fps move is inside the noise:

| View | v4.3 median | v4.4 median | Runs v4.4 |
| --- | ---: | ---: | --- |
| Hall entry (same camera) | 4 | 4 | 3.75, 4, 4 |
| Ballroom (worst before) | 3.16 | 5 | 5, 5, 5 |
| Sir Biscuit’s room | — | 5.46 | 5.45, 5.46, 5.46 |

The worst room after the polish is the hall at 4 fps, the same median as that shot before. Ballroom is not slower.

## Known nits

- Door plaques are high, so a wide shot does not show the room name. The prompt still names the spot when she stands there.
- The throne arch looks through into Sir Biscuit’s room. That opening was already the plan of the castle.
- Landscape Exit sits just above the joystick on the left. A wide prompt can still touch its right edge. The words on the prompt stay readable, and the pill stays tappable.
- SwiftShader fps is not a phone measurement.
