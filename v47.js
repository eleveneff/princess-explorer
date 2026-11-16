/* Princess Explorer v4.7 — Learn & Build.
   Questions sit in front of a build. Direct care.commit() is unchanged so older saves and tests keep their prices. */
(function () {
  const PE = window.PrincessExplorer;
  if (!PE || !PE.care || !PE.state) return;

  const BUILD_SKILL = {
    maze: "area", tea: "money", terrace: "measure", studio: "shapes", nook: "reading",
    observatory: "patterns", stable: "fractions", court: "skip", training: "time",
    stage: "data", corgi: "word", swans: "measure"
  };
  const SKILL_NAME = {
    area: "Area and perimeter", money: "Money", measure: "Measurement", shapes: "Shapes",
    reading: "Reading", vocab: "Vocabulary", patterns: "Patterns and place value",
    fractions: "Fractions", skip: "Skip counting", time: "Time", data: "Data and graphs", word: "Word problems"
  };

  function item(skill, level, prompt, choices, answer, hint, explain, visual, n) {
    return { skill, level, prompt, choices, answer, hint, explain, visual, n };
  }
  const BANK = [
    item("area", "confidence", "A rug is 4 squares long and 2 squares wide. How many squares cover it?", ["8", "6", "42", "2"], 0, "Multiply the rows by the columns.", "4 times 2 is 8 squares.", "grid", 8),
    item("area", "confidence", "A square frame has sides of 3 meters. What is the perimeter?", ["12 meters", "9 meters", "6 meters", "3 meters"], 0, "Add all four sides.", "3 + 3 + 3 + 3 = 12 meters.", "grid", 4),
    item("area", "level", "A poster is 6 cm long and 4 cm wide. What is its area?", ["24 square cm", "10 square cm", "64 square cm", "2 square cm"], 0, "Area is length times width.", "6 times 4 is 24.", "grid", 24),
    item("area", "level", "A path is 5 meters long and 2 meters wide. What is its area?", ["10 square meters", "7 square meters", "52 square meters", "3 square meters"], 0, "Multiply length by width.", "5 times 2 is 10.", "grid", 10),
    item("area", "stretch", "A rectangle has area 18 and length 6. What is the width?", ["3", "12", "24", "18"], 0, "Divide the area by the length.", "18 divided by 6 is 3.", "grid", 3),
    item("area", "stretch", "A square has a perimeter of 20. How long is one side?", ["5", "4", "10", "16"], 0, "A square has 4 equal sides.", "20 divided by 4 is 5.", "grid", 5),

    item("money", "confidence", "A bun costs 4 coins. You pay 10. What is your change?", ["6 coins", "14 coins", "4 coins", "40 coins"], 0, "Subtract the price from what you paid.", "10 minus 4 is 6.", "coins", 6),
    item("money", "confidence", "You have 3 coins and find 2 more. How many coins now?", ["5", "1", "6", "32"], 0, "Add the coins you found.", "3 plus 2 is 5.", "coins", 5),
    item("money", "level", "Tea costs 9 coins. You pay with 20. What is your change?", ["11 coins", "29 coins", "9 coins", "2 coins"], 0, "Count up from 9 to 20, or subtract.", "20 minus 9 is 11.", "coins", 11),
    item("money", "level", "Two stickers cost 6 coins each. What do they cost together?", ["12 coins", "8 coins", "26 coins", "6 coins"], 0, "Two groups of 6.", "6 plus 6 is 12.", "coins", 12),
    item("money", "stretch", "A book costs 15 coins. You pay 10, then 5, then 2 extra. What is left?", ["2 coins", "15 coins", "17 coins", "0 coins"], 0, "Add what you paid, then subtract the price.", "10 + 5 + 2 = 17, and 17 minus 15 is 2.", "coins", 2),
    item("money", "stretch", "Three muffins cost 4 coins each. You pay 20. What is your change?", ["8 coins", "12 coins", "4 coins", "16 coins"], 0, "Find the total, then the change.", "3 times 4 is 12. 20 minus 12 is 8.", "coins", 8),

    item("measure", "confidence", "A ribbon is 7 cm. You use 2 cm. How much is left?", ["5 cm", "9 cm", "72 cm", "2 cm"], 0, "Subtract the piece you used.", "7 minus 2 is 5.", "line", 5),
    item("measure", "confidence", "Which length is longer?", ["9 cm", "6 cm", "They are equal", "0 cm"], 0, "The bigger number is the longer length.", "9 is more than 6.", "line", 9),
    item("measure", "level", "A pencil is 15 cm. A crayon is 9 cm. How much longer is the pencil?", ["6 cm", "24 cm", "15 cm", "4 cm"], 0, "Subtract the shorter length.", "15 minus 9 is 6.", "line", 6),
    item("measure", "level", "A string is 12 cm and you cut off 4 cm. How long is it now?", ["8 cm", "16 cm", "3 cm", "124 cm"], 0, "Take the cut piece away.", "12 minus 4 is 8.", "line", 8),
    item("measure", "stretch", "A rope is 1 meter long. You cut off 30 cm. How many centimeters are left?", ["70 cm", "30 cm", "100 cm", "130 cm"], 0, "1 meter is 100 centimeters.", "100 minus 30 is 70.", "line", 70),
    item("measure", "stretch", "How many centimeters are in 1 meter?", ["100 cm", "10 cm", "12 cm", "1 cm"], 0, "A meter stick is 100 centimeters.", "1 meter = 100 cm.", "line", 100),

    item("shapes", "confidence", "How many sides does a triangle have?", ["3", "4", "5", "0"], 0, "Count the straight sides.", "A triangle has 3 sides.", "shape", 3),
    item("shapes", "confidence", "How many corners does a square have?", ["4", "3", "6", "1"], 0, "Every side meets another side at a corner.", "A square has 4 corners.", "shape", 4),
    item("shapes", "level", "Which shape has 4 equal sides?", ["Square", "Triangle", "Circle", "Pentagon"], 0, "Equal means the same length.", "A square has 4 sides of the same length.", "shape", 4),
    item("shapes", "level", "How many lines of symmetry does a rectangle have?", ["2", "1", "4", "0"], 0, "A fold line makes two matching halves.", "You can fold a rectangle in half two ways.", "shape", 2),
    item("shapes", "stretch", "How many lines of symmetry does an equilateral triangle have?", ["3", "1", "0", "4"], 0, "All three sides are equal, so each fold through a corner works.", "There are 3 lines of symmetry.", "shape", 3),
    item("shapes", "stretch", "A shape has 5 sides. What is it called?", ["Pentagon", "Square", "Hexagon", "Triangle"], 0, "Penta means five.", "A five-sided shape is a pentagon.", "shape", 5),

    item("reading", "confidence", "Mina planted seeds and watered them every day. The seeds grew into flowers. What is the main idea?", ["Mina's seeds grew into flowers.", "Mina dislikes water.", "Flowers do not need sun.", "The story is about a boat."], 0, "The main idea is what the whole bit is about.", "Both sentences are about the seeds becoming flowers.", "none", 0),
    item("reading", "confidence", "The pony ate hay, then trotted in the field. What is this mostly about?", ["A pony eating and moving.", "How to build a castle.", "A rainy market.", "Counting by fives."], 0, "Ask what both parts share.", "The pony is the one doing both actions.", "none", 0),
    item("reading", "level", "Lila read the sign, checked the map, and chose the left path. What is the main idea?", ["Lila used clues to choose a path.", "Lila lost her map.", "The left path was closed.", "Signs are only for decoration."], 0, "Look at what Lila did with the information.", "She used the sign and the map to decide.", "none", 0),
    item("reading", "level", "The baker set four cups, then filled each one halfway. What is the passage mainly about?", ["The baker getting cups ready.", "A horse jumping a fence.", "Why stars twinkle.", "A broken oven."], 0, "Who is doing the actions?", "Both sentences are about the baker and the cups.", "none", 0),
    item("reading", "stretch", "The maze walls were tall, but the pink roses marked every turn. Amara followed the roses and reached the center. What can you tell?", ["The roses showed Amara the way.", "Amara never entered the maze.", "The walls were shorter than the roses.", "There was no center."], 0, "Use the clues plus what she did.", "She followed the roses and got to the center, so they marked the way.", "none", 0),
    item("reading", "stretch", "The studio was quiet. Brushes stood in a jar, and a half-finished sun waited on the easel. What is the main idea?", ["Someone is in the middle of a painting.", "The studio is a kitchen.", "The sun in the sky went out.", "Brushes cannot be stored."], 0, "A half-finished picture means the work is still going.", "The waiting sun on the easel is the clue.", "none", 0),

    item("vocab", "confidence", "A meadow is a…", ["grassy field", "stone tower", "kind of boat", "math sign"], 0, "Think of an open place with grass.", "A meadow is a grassy field.", "none", 0),
    item("vocab", "confidence", "Tiny means…", ["very small", "very loud", "very old", "very sharp"], 0, "A tiny pebble fits in your hand.", "Tiny means very small.", "none", 0),
    item("vocab", "level", "Glance means…", ["look quickly", "sleep all day", "build a wall", "count backward"], 0, "A glance is a short look.", "Glance means look quickly.", "none", 0),
    item("vocab", "level", "Brave means…", ["not afraid to try", "always late", "full of water", "hard to see"], 0, "A brave friend tries the hard thing.", "Brave means not afraid to try.", "none", 0),
    item("vocab", "stretch", "Ancient means…", ["very old", "brand new", "sour", "tiny and square"], 0, "Ancient castles were built long ago.", "Ancient means very old.", "none", 0),
    item("vocab", "stretch", "Scurry means…", ["hurry with small quick steps", "sit very still", "paint a circle", "share equally"], 0, "A mouse might scurry across the path.", "Scurry means to hurry with small quick steps.", "none", 0),

    item("patterns", "confidence", "2, 4, 6, 8, ___", ["10", "9", "12", "7"], 0, "The numbers grow by 2.", "8 plus 2 is 10.", "blocks", 10),
    item("patterns", "confidence", "5, 10, 15, ___", ["20", "16", "25", "18"], 0, "Add 5 each time.", "15 plus 5 is 20.", "blocks", 20),
    item("patterns", "level", "How many tens are in 47?", ["4", "7", "47", "1"], 0, "The first digit shows the tens.", "47 is 4 tens and 7 ones.", "blocks", 4),
    item("patterns", "level", "Star, moon, star, moon, ___", ["Star", "Castle", "Moon", "Cloud"], 0, "The pair repeats.", "After moon, the pattern starts again with star.", "blocks", 2),
    item("patterns", "stretch", "36 is…", ["3 tens and 6 ones", "6 tens and 3 ones", "36 tens", "3 ones"], 0, "Say the number in tens and ones.", "The 3 is in the tens place.", "blocks", 36),
    item("patterns", "stretch", "200 + 40 + 3 =", ["243", "234", "432", "200"], 0, "Add hundreds, then tens, then ones.", "200 + 40 is 240, plus 3 is 243.", "blocks", 243),

    item("fractions", "confidence", "One apple is shared equally by 2 friends. What fraction does each friend get?", ["1/2", "1/4", "2/1", "1/3"], 0, "Two equal shares.", "Each friend gets 1 of the 2 parts.", "bars", 1),
    item("fractions", "confidence", "A bar has 4 equal parts and 1 is shaded. What fraction is shaded?", ["1/4", "1/2", "4/1", "3/4"], 0, "Count shaded parts over all parts.", "1 shaded part out of 4 is 1/4.", "bars", 1),
    item("fractions", "level", "8 carrots are shared equally by 4 ponies. How many does each pony get?", ["2", "4", "12", "8"], 0, "Divide into equal groups.", "8 divided by 4 is 2.", "bars", 2),
    item("fractions", "level", "What is 1/2 of 10?", ["5", "10", "2", "12"], 0, "Half means split into 2 equal groups.", "10 divided by 2 is 5.", "bars", 5),
    item("fractions", "stretch", "Which fraction is greater?", ["1/2", "1/4", "They are equal", "1/8"], 0, "Bigger pieces mean a greater fraction when the whole is the same.", "Halves are larger pieces than fourths.", "bars", 2),
    item("fractions", "stretch", "A cake is cut into 4 equal slices. Amara eats 1. What fraction is left?", ["3/4", "1/4", "4/3", "1/2"], 0, "Subtract the eaten slice from the whole.", "4 minus 1 leaves 3 slices, so 3/4.", "bars", 3),

    item("skip", "confidence", "Count by 5s: 5, 10, 15, ___", ["20", "16", "25", "18"], 0, "Keep adding 5.", "15 plus 5 is 20.", "line", 20),
    item("skip", "confidence", "Count by 10s: 10, 20, 30, ___", ["40", "31", "35", "50"], 0, "Keep adding 10.", "30 plus 10 is 40.", "line", 40),
    item("skip", "level", "Which number is greater?", ["24", "18", "They are equal", "9"], 0, "Compare the tens first.", "2 tens is more than 1 ten.", "line", 24),
    item("skip", "level", "Count by 2s: 8, 10, 12, ___", ["14", "13", "16", "11"], 0, "Add 2.", "12 plus 2 is 14.", "line", 14),
    item("skip", "stretch", "Start at 0 and skip count by 5 four times. Where do you land?", ["20", "15", "4", "25"], 0, "Four hops of 5.", "5, 10, 15, 20.", "line", 20),
    item("skip", "stretch", "How many more is 35 than 25?", ["10", "15", "60", "5"], 0, "Subtract, or count by 5s from 25 to 35.", "35 minus 25 is 10.", "line", 10),

    item("time", "confidence", "A game starts at 3:00 and lasts 1 hour. When does it end?", ["4:00", "3:00", "2:00", "5:30"], 0, "One hour later.", "3:00 plus 1 hour is 4:00.", "line", 4),
    item("time", "confidence", "Half an hour is how many minutes?", ["30", "60", "15", "10"], 0, "An hour is 60 minutes.", "Half of 60 is 30.", "line", 30),
    item("time", "level", "Practice starts at 2:15 and ends at 2:45. How long is it?", ["30 minutes", "45 minutes", "15 minutes", "2 minutes"], 0, "Count the minutes from 15 to 45.", "45 minus 15 is 30.", "line", 30),
    item("time", "level", "The walk starts at 3:00 and takes 20 minutes. When do you arrive?", ["3:20", "3:00", "2:40", "4:20"], 0, "Add the minutes onto the hour.", "3:00 plus 20 minutes is 3:20.", "line", 20),
    item("time", "stretch", "A class starts at 1:10 and lasts 45 minutes. When does it end?", ["1:55", "1:45", "2:10", "1:30"], 0, "10 plus 45 minutes.", "1:10 plus 45 minutes is 1:55.", "line", 55),
    item("time", "stretch", "From 10:40 to 11:10 is how many minutes?", ["30", "70", "10", "40"], 0, "Count to the next hour, then the extra minutes.", "20 minutes to 11:00, plus 10 is 30.", "line", 30),

    item("data", "confidence", "A chart shows 2 frogs and 5 fish. Which group has more?", ["Fish", "Frogs", "They are equal", "Birds"], 0, "Compare the two numbers.", "5 is more than 2.", "bars", 5),
    item("data", "confidence", "The rose bar is taller than the tulip bar. There are…", ["more roses", "more tulips", "no flowers", "the same number"], 0, "A taller bar means a bigger count.", "The taller bar is the roses.", "bars", 2),
    item("data", "level", "The tally is 3 frogs and 5 fish. How many animals in all?", ["8", "2", "15", "35"], 0, "Add the two groups.", "3 plus 5 is 8.", "bars", 8),
    item("data", "level", "There are 5 fish and 3 frogs. How many more fish are there?", ["2", "8", "5", "15"], 0, "Subtract the smaller bar.", "5 minus 3 is 2.", "bars", 2),
    item("data", "stretch", "Each star on a pictograph means 2 points. What do 4 stars mean?", ["8 points", "4 points", "6 points", "2 points"], 0, "Four groups of 2.", "4 times 2 is 8.", "bars", 8),
    item("data", "stretch", "A line plot has three marks at 4 and one mark at 6. How many marks in all?", ["4", "10", "3", "6"], 0, "Count every mark.", "3 plus 1 is 4 marks.", "bars", 4),

    item("word", "confidence", "Sir Biscuit has 5 treats. He eats 1. How many are left?", ["4", "6", "5", "1"], 0, "Take away the one he ate.", "5 minus 1 is 4.", "coins", 4),
    item("word", "confidence", "There are 3 bowls. Amara sets down 2 more. How many bowls?", ["5", "1", "6", "32"], 0, "This is a joining story.", "3 plus 2 is 5.", "coins", 5),
    item("word", "level", "He has 6 treats. He gives away 2, then finds 3. How many now?", ["7", "5", "11", "1"], 0, "Do the first step, then the second.", "6 minus 2 is 4, and 4 plus 3 is 7.", "coins", 7),
    item("word", "level", "4 ponies each get 2 apples. How many apples is that?", ["8", "6", "42", "2"], 0, "Four groups of 2.", "4 times 2 is 8.", "coins", 8),
    item("word", "stretch", "A box has 12 bows. Amara uses 5, then puts 2 back. How many are in the box?", ["9", "7", "19", "15"], 0, "Subtract, then add.", "12 minus 5 is 7, and 7 plus 2 is 9.", "coins", 9),
    item("word", "stretch", "Tickets cost 3 coins. She buys 4 and pays with 15. What is her change?", ["3 coins", "12 coins", "7 coins", "15 coins"], 0, "Find the cost, then the change.", "4 times 3 is 12. 15 minus 12 is 3.", "coins", 3)
  ];

  let clockMs = 0;
  let clockDate = null;
  let holdMs = 0;
  let holding = false;
  let mode = null;
  let pausedFrom = null;
  let gate = null;
  let daily = null;
  let example = null;
  let tutor = null;
  let resumeMode = null;
  const TEACH = {
    money: [
      { say: "First, count the coins you started with.", visual: "coins", n: 8 },
      { say: "Next, take away the coins you spent.", visual: "coins", n: 5 },
      { say: "The coins still in your hand are the change.", visual: "coins", n: 3 }
    ],
    reading: [
      { say: "Read the question, then look back at the story.", visual: "read" },
      { say: "The highlighted sentence is where the answer lives.", visual: "read" },
      { say: "The main idea is the big point of the whole story.", visual: "read" }
    ],
    fractions: [
      { say: "Split the bar into equal parts.", visual: "bars", n: 4 },
      { say: "Shade only the parts the question names.", visual: "bars", n: 1 },
      { say: "The top number is the shaded parts. The bottom is all the parts.", visual: "bars", n: 1 }
    ],
    patterns: [
      { say: "A two-digit number has tens and ones.", visual: "blocks", n: 36 },
      { say: "Each rod is one ten.", visual: "blocks", n: 30 },
      { say: "The little cubes are the ones.", visual: "blocks", n: 6 }
    ],
    shapes: [
      { say: "Count the straight sides.", visual: "shape", n: 4 },
      { say: "A corner is where two sides meet.", visual: "shape", n: 4 },
      { say: "A line of symmetry folds the shape into two matching halves.", visual: "shape", n: 2 }
    ],
    word: [
      { say: "A two-step story has two moves. Do the first one.", visual: "coins", n: 6 },
      { say: "Then do the second move with the new number.", visual: "coins", n: 4 },
      { say: "That last number is the answer.", visual: "coins", n: 7 }
    ]
  };
  TEACH.area = TEACH.shapes;
  TEACH.measure = [{ say: "Find the start mark on the number line.", visual: "line", n: 8 }, { say: "Jump to the end mark.", visual: "line", n: 12 }, { say: "The difference is how much longer.", visual: "line", n: 4 }];
  TEACH.skip = TEACH.measure;
  TEACH.time = [{ say: "Start at the first time on the line.", visual: "line", n: 2 }, { say: "Each hop can be 5 or 10 minutes.", visual: "line", n: 6 }, { say: "Land on the end time.", visual: "line", n: 8 }];
  TEACH.data = TEACH.fractions;
  TEACH.vocab = [{ say: "Read the word in the sentence.", visual: "read" }, { say: "Swap in each choice and see which one fits.", visual: "read" }, { say: "The choice that keeps the meaning is the answer.", visual: "read" }];
  let lastNow = 0;
  const pending = [];

  function coins() { return Math.max(0, Math.floor(+PE.state().score || 0)); }
  function persist() { PE.save(); if (PE.renderHUD) PE.renderHUD(); }
  function bag() {
    const s = PE.state();
    const fresh = !s.v47 || typeof s.v47 !== "object";
    if (fresh) s.v47 = {};
    const v = s.v47;
    v.ver = 1;
    if (!v.skills || typeof v.skills !== "object") v.skills = {};
    if (!Array.isArray(v.due)) v.due = [];
    if (!v.daily) v.daily = { day: "", done: 0, streak: 0, last: "", paidDay: "", paid: 0 };
    if (!v.ready) v.ready = {};
    if (!v.passed) v.passed = {};
    if (!v.refunded) v.refunded = {};
    if (typeof v.playMs !== "number") v.playMs = 0;
    if (typeof v.quiet !== "boolean") v.quiet = !!(window.__PE_QUIET || /(?:^|[?&])quiet=1/.test(location.search));
    if (fresh) persist();
    return v;
  }
  function today() {
    if (clockDate) return clockDate;
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dayNum(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  }
  function addDays(iso, n) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + n);
    return dt.toISOString().slice(0, 10);
  }
  function later(ms, fn) { pending.push({ at: clockMs + ms, fn }); }
  function skillRow(skill) {
    const v = bag();
    if (!v.skills[skill]) v.skills[skill] = { c: 0, w: 0, n: 0 };
    return v.skills[skill];
  }
  function record(skill, ok) {
    const row = skillRow(skill);
    row.n += 1;
    if (ok) row.c += 1;
    else row.w += 1;
    if (!ok) queueReview(skill);
    return row;
  }
  function queueReview(skill) {
    const day = dayNum(today());
    const v = bag();
    [1, 3, 7].forEach((n) => {
      if (!v.due.some((d) => d.skill === skill && d.at === day + n)) v.due.push({ skill, at: day + n });
    });
  }
  function nextDue() {
    const day = dayNum(today());
    const hit = bag().due.find((d) => d.at <= day);
    return hit ? hit.skill : null;
  }
  function serveDue(skill) {
    const day = dayNum(today());
    const v = bag();
    const i = v.due.findIndex((d) => d.skill === skill && d.at <= day);
    if (i >= 0) v.due.splice(i, 1);
  }
  function weakest() {
    const rows = Object.entries(bag().skills).filter(([, s]) => s.n > 0);
    rows.sort((a, b) => (a[1].c / a[1].n) - (b[1].c / b[1].n) || b[1].n - a[1].n);
    if (!rows.length) return null;
    const acc = rows[0][1].c / rows[0][1].n;
    return acc < 0.8 ? rows[0][0] : null;
  }
  function pick(skill, level, used) {
    const all = BANK.filter((q) => q.skill === skill && q.level === level);
    const fresh = all.filter((q) => !used.has(q.prompt));
    const q = fresh[0] || all[0];
    if (!q) return item(skill, level, "Count on by 1: 3, 4, ___", ["5", "2", "7", "30"], 0, "Add 1.", "4 plus 1 is 5.", "line", 5);
    used.add(q.prompt);
    return Object.assign({}, q);
  }
  function quiet() {
    const v = bag();
    const btn = document.getElementById("sound");
    if (btn && /off/i.test(btn.textContent || "")) return true;
    return !!v.quiet;
  }

  function css() {
    if (document.getElementById("v47-style")) return;
    const s = document.createElement("style");
    s.id = "v47-style";
    s.textContent = `
#learn-layer{position:fixed;inset:0;z-index:60;display:none;align-items:flex-end;justify-content:center;background:rgba(70,30,90,.18);padding:10px}
#learn-layer.show{display:flex}
#learn-card{width:min(760px,100%);max-height:min(62vh,640px);overflow:auto;background:#fffaf2;border:7px solid #ff7ac8;border-radius:28px 28px 18px 18px;padding:12px 14px 16px;color:#4a2c6f;font-family:Trebuchet MS,sans-serif;box-shadow:0 12px 0 rgba(0,0,0,.12)}
#learn-card header{display:flex;align-items:center;justify-content:space-between;gap:8px}
#learn-card h2{margin:0;font-size:26px}
#learn-card button{font:800 18px/1.2 Trebuchet MS,sans-serif;border-radius:16px;border:0;background:#ff5fa2;color:#fff;padding:10px 12px;min-height:46px;cursor:pointer}
#learn-card .ghost{background:#fff;color:#8a4fe0;border:3px solid #b57bff}
#learn-exit{min-width:88px}
.learn-prompt{font-size:22px;font-weight:800;margin:8px 0}
.learn-choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.learn-hint{background:#fff4d6;border:3px solid #ffc94d;border-radius:14px;padding:8px 10px;margin-top:8px}
mark.learn-hit{background:#ffe08a;border-radius:6px;padding:0 3px}
.learn-visual{margin-top:8px;background:#fff;border:3px dashed #e3c6f5;border-radius:16px;padding:8px;min-height:74px}
.ex-coin,.ex-cell{width:28px;height:28px;border-radius:50%;display:inline-block;margin:3px;background:#f3e6c4;border:3px solid #e0b15a;vertical-align:middle}
.ex-coin.on{background:#ffd45a;border-color:#e0a000}
.ex-cell{border-radius:6px;width:42px}
.ex-cell.on{background:#7ec8ff;border-color:#3a8fd0}
.ex-line{position:relative;height:36px;margin:16px 8px;background:linear-gradient(#4a2c6f,#4a2c6f) center/100% 4px no-repeat}
.ex-dot{position:absolute;top:8px;width:18px;height:18px;border-radius:50%;background:#ff5fa2;transform:translateX(-50%)}
.ex-rod{display:inline-block;width:18px;height:54px;margin:2px;background:#b9e0ff;border:3px solid #3a8fd0;border-radius:6px;vertical-align:bottom}
.ex-one{display:inline-block;width:16px;height:16px;margin:2px;background:#ffd45a;border:3px solid #e0a000;border-radius:4px}
#learn-pause{position:absolute;inset:0;background:rgba(255,250,242,.94);display:none;align-items:center;justify-content:center;text-align:center;border-radius:18px}
#learn-pause.show{display:flex}
#v47-cheer{position:fixed;left:50%;top:12%;transform:translateX(-50%);z-index:80;display:none;background:#fff;border:5px solid #ffd45a;border-radius:22px;padding:10px 16px;font:800 22px Trebuchet MS,sans-serif;color:#4a2c6f;text-align:center;box-shadow:0 8px 0 rgba(0,0,0,.12);pointer-events:none;max-width:min(420px,92vw)}
#v47-cheer.show{display:block}
#v47-cheer .dog{font-size:42px;display:inline-block;animation:wag .4s ease-in-out 3}
@keyframes wag{50%{transform:rotate(-12deg) translateY(-4px)}}
.learn-ruler{position:relative;height:28px;margin:10px 0;background:repeating-linear-gradient(90deg,#4a2c6f 0 2px,transparent 2px 18px);border-bottom:3px solid #4a2c6f}
.learn-ruler i{position:absolute;top:-18px;font-style:normal;font-size:12px}
.learn-shapes{font-size:42px;letter-spacing:10px;text-align:center}
.learn-shapes .fold{display:inline-block;border-left:3px dashed #ff5fa2;padding-left:8px}
.learn-story{font-size:16px;line-height:1.35;max-height:7.2em;overflow:hidden;background:#fff;border-radius:12px;padding:8px}
#learn-pause .box{display:flex;flex-direction:column;gap:10px;align-items:center}
body.learn-on #hud,body.learn-on #gear,body.learn-on #zoom,body.learn-on #touch-toggle,body.learn-on #hint,body.learn-on #settings,body.learn-on #prompt,body.learn-on #act,body.learn-on #joy,body.learn-on #care-prompt,body.learn-on #quest-btn{visibility:hidden !important;pointer-events:none !important}
body.learn-on > button{visibility:hidden !important;pointer-events:none !important}
@media (max-width:430px) and (min-height:700px){
  #hud{max-width:calc(100vw - 78px)}
  #hud .hud-row{flex-wrap:nowrap}
  #hud .chip,#quest-btn{font-size:13px;padding:2px 6px;border-width:3px;border-radius:12px}
  #hud .chip small{font-size:10px}
  #badges{margin-top:2px}
  #badges .badge{width:30px;height:30px;font-size:16px}
  #learn-card{max-height:56vh}
  .learn-choices{grid-template-columns:1fr}
  .learn-prompt{font-size:18px}
}
`;
    document.head.appendChild(s);
  }
  function layer() {
    css();
    let el = document.getElementById("learn-layer");
    if (!el) {
      el = document.createElement("div");
      el.id = "learn-layer";
      el.innerHTML = '<div id="learn-card"></div>';
      el.addEventListener("pointerdown", (e) => e.stopPropagation());
      document.body.appendChild(el);
    }
    return el;
  }
  function setPlay(on) {
    document.body.classList.toggle("learn-on", !!on);
    layer().classList.toggle("show", !!on);
  }
  function closePlay() {
    mode = null;
    pausedFrom = null;
    tutor = null;
    resumeMode = null;
    setPlay(false);
  }
  function visualHtml(kind, n, progress) {
    const p = Math.max(0, Math.min(1, progress));
    if (kind === "coins") {
      const total = Math.max(1, Math.min(10, n || 5));
      const on = Math.round(p * total);
      return "<div class='learn-visual'>" + Array.from({ length: total }, (_, i) => `<span class="ex-coin${i < on ? " on" : ""}"></span>`).join("") + `<div>Counting ${on} of ${total}</div></div>`;
    }
    if (kind === "bars" || kind === "grid") {
      const total = kind === "grid" ? 8 : 4;
      const on = Math.max(1, Math.round(p * Math.min(total, Math.max(1, n || 1))));
      return "<div class='learn-visual'>" + Array.from({ length: total }, (_, i) => `<span class="ex-cell${i < on ? " on" : ""}"></span>`).join("") + "</div>";
    }
    if (kind === "blocks") {
      const tens = Math.min(4, Math.max(1, Math.round(p * 3)));
      const ones = Math.min(9, Math.round(p * Math.min(9, (n || 6) % 10 || 3)));
      return `<div class="learn-visual">${"<span class='ex-rod'></span>".repeat(tens)}${"<span class='ex-one'></span>".repeat(ones)}<div>${tens} tens and ${ones} ones</div></div>`;
    }
    if (kind === "shape") {
      return `<div class="learn-visual" style="font-size:40px;letter-spacing:8px">△ □ ○</div>`;
    }
    const left = Math.round(p * Math.min(100, (n || 5) * 8));
    return `<div class="learn-visual"><div class="ex-line"><div class="ex-dot" style="left:${left}%"></div></div><div>Number line</div></div>`;
  }
  function mapSkill(raw) {
    const t = String(raw || "").toLowerCase();
    if (/read|main|infer|passage/.test(t)) return "reading";
    if (/vocab|synonym|wizard|opposite/.test(t)) return "vocab";
    if (/frac/.test(t)) return "fractions";
    if (/money|coin|change/.test(t)) return "money";
    if (/area|perim/.test(t)) return "area";
    if (/geo|shape|sym/.test(t)) return "shapes";
    if (/place|pattern|pv/.test(t)) return "patterns";
    if (/time|elapsed/.test(t)) return "time";
    if (/data|graph|tally/.test(t)) return "data";
    if (/meas|length|ruler/.test(t)) return "measure";
    if (/skip|compar/.test(t)) return "skip";
    if (BANK.some((q) => q.skill === t)) return t;
    return "word";
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function highlightSentence(info) {
    const passage = String((info && (info.passage || info.explain)) || "");
    const sentences = passage.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    if (!sentences.length) return "Look back at the story. The answer is in one sentence.";
    const words = String((info.choices && info.choices[info.answer]) || info.explain || "").toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    let best = sentences[0], score = -1;
    sentences.forEach((s) => {
      const low = s.toLowerCase();
      const sc = words.reduce((n, w) => n + (low.includes(w) ? 1 : 0), 0);
      if (sc > score) { score = sc; best = s; }
    });
    return best;
  }
  function openTutorial(info) {
    info = info || {};
    if (tutor) return { ok: true, already: true, skill: tutor.skill, steps: tutor.steps.length };
    const skill = mapSkill(info.skill);
    const steps = (TEACH[skill] || TEACH.word).slice(0, 4);
    const used = new Set(info.prompt ? [info.prompt] : []);
    const practice = pick(skill, "confidence", used);
    tutor = { skill, steps, step: 0, phase: "teach", practice, info, hit: highlightSentence(info) };
    resumeMode = mode;
    mode = "tutor";
    show();
    return { ok: true, skill, steps: steps.length, skippable: false };
  }
  function tutorAdvance() {
    if (!tutor || tutor.phase !== "teach") return { ok: false };
    tutor.step += 1;
    if (tutor.step >= tutor.steps.length) tutor.phase = "practice";
    show();
    return { ok: true, step: tutor.step, phase: tutor.phase, skippable: tutor.phase === "teach" ? tutor.step >= 1 : true };
  }
  function tutorSkip() {
    if (!tutor || tutor.step < 1) return { ok: false, reason: "first-step" };
    tutor.phase = "practice";
    show();
    return { ok: true, phase: "practice" };
  }
  function endTutor(right) {
    const back = resumeMode;
    tutor = null;
    const session = back === "gate" ? gate : back === "daily" ? daily : null;
    if (session) {
      const q = session.qs[session.i];
      if (q && q._fresh) session.qs[session.i] = q._fresh;
      mode = back;
      resumeMode = null;
      show();
    } else {
      resumeMode = null;
      mode = null;
      closePlay();
    }
    return { ok: true, right: !!right, score: coins() };
  }
  function cardHtml() {
    const pause = pausedFrom ? `<div id="learn-pause" class="show"><div class="box"><h2>Paused</h2><p>The lesson is waiting.</p><button id="learn-resume">Keep going</button><button class="ghost" id="learn-exit">Exit</button></div></div>` : `<div id="learn-pause"></div>`;
    if (mode === "tutor" && tutor) {
      if (tutor.phase === "practice") {
        const q = tutor.practice;
        return `<header><h2>Try one like it</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${SKILL_NAME[tutor.skill] || tutor.skill}. This practice does not change your coins.</p><p class="learn-prompt">${esc(q.prompt)}</p><div class="learn-choices">${q.choices.map((c, i) => `<button data-tutor="${i}">${esc(c)}</button>`).join("")}</div>${pause}`;
      }
      const step = tutor.steps[tutor.step];
      const visual = step.visual === "read"
        ? `<div class="learn-visual"><p>Look here: <mark class="learn-hit">${esc(tutor.hit)}</mark></p></div>`
        : visualHtml(step.visual, step.n, 0.75);
      const skip = tutor.step >= 1 ? `<button id="learn-skip">Skip</button>` : "";
      return `<header><h2>Let's learn it</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Step ${tutor.step + 1} of ${tutor.steps.length}</p><p class="learn-prompt">${esc(step.say)}</p>${visual}<button id="learn-next">${tutor.step === tutor.steps.length - 1 ? "Practice" : "Next"}</button>${skip}${pause}`;
    }
    if (mode === "parent") {
      const info = progress();
      const rows = info.rows.length ? info.rows.map((r) => `<div class="v-row"><b>${SKILL_NAME[r.skill] || r.skill}</b> — ${r.acc}% of ${r.n}</div>`).join("") : "<p>No answers yet.</p>";
      const weak = info.weak.length ? info.weak.map((r, i) => `<div>${i + 1}. ${SKILL_NAME[r.skill] || r.skill} (${r.acc}%)</div>`).join("") : "<p>Not enough answers yet.</p>";
      return `<header><h2>Progress</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Time played: ${Math.round(info.playMs / 60000)} min. Daily streak: ${info.streak}.</p><p><b>Weakest skills</b></p>${weak}<p><b>Accuracy</b></p>${rows}${pause}`;
    }
    if (mode === "daily" && daily) {
      const q = daily.qs[daily.i];
      if (!q) return `<header><h2>Daily Three</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Done for today.</p>${pause}`;
      return head("Daily Three", `Warm-up ${daily.i + 1} of 3`) + bodyQ(q) + pause;
    }
    if (mode === "nature") return activityNature() + pause;
    if (mode === "garden") return activityGarden() + pause;
    if (mode === "art") return activityArt() + pause;
    if (mode === "sport") return activitySport() + pause;
    if (mode === "biscuit") return activityBiscuit() + pause;
    if (mode === "lore") return activityLore() + pause;
    if (mode === "winter") return `<header><h2>Winter castle</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${winterOn() ? "December 1 to January 6. Frost on the moat, lights on the lawn, snow on the ground." : "The winter castle waits from December 1 to January 6."}</p>${winterOn() ? `<button id="learn-wreath">Wreath challenge, 20 coins</button>` : ""}` + pause;
    if (mode === "gate" && gate) {
      const q = gate.qs[gate.i];
      const title = (PE.care.DEFS.find((d) => d.id === gate.id) || {}).name || "Build";
      return head(title, `Question ${Math.min(gate.i + 1, gate.qs.length)} of ${gate.qs.length}`) + (q ? bodyQ(q) : "<p>Building…</p>") + pause;
    }
    return "";
  }
  function head(title, step) {
    return `<header><h2>${title}</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${step}</p>`;
  }
  function bodyQ(q) {
    let html = `<p class="learn-prompt">${q.prompt}</p><div class="learn-choices">${q.choices.map((c, i) => `<button data-choice="${i}">${c}</button>`).join("")}</div>`;
    if (q._hint) html += `<div class="learn-hint"><b>Not yet.</b> Here is a hint: ${q._hint}</div>`;
    if (example && !example.done) html += `<p>Watch the idea, or skip it.</p>` + visualHtml(example.visual, example.n, example.progress) + `<button id="learn-skip">Skip</button>`;
    return html;
  }
  function show() {
    const el = layer();
    el.querySelector("#learn-card").innerHTML = cardHtml();
    setPlay(!!mode);
    const card = el.querySelector("#learn-card");
    card.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.id === "learn-exit") { tutor = null; resumeMode = null; gate = null; daily = null; example = null; closePlay(); return; }
      if (b.id === "learn-resume") { mode = pausedFrom; pausedFrom = null; show(); return; }
      if (b.id === "learn-skip") { if (mode === "tutor") tutorSkip(); else skipExample(); return; }
      if (b.id === "learn-next") { tutorAdvance(); return; }
      if (b.dataset.tutor != null && tutor && tutor.phase === "practice") {
        endTutor(+b.dataset.tutor === tutor.practice.answer);
        return;
      }
      if (b.dataset.choice != null && !pausedFrom && (mode === "gate" || mode === "daily")) answer(+b.dataset.choice);
      if (b.dataset.spot) { tapNature(b.dataset.spot); show(); return; }
      if (b.dataset.shape) { addShape(b.dataset.shape); show(); return; }
      if (b.dataset.sport) { sportPoint(b.dataset.sport); show(); return; }
      if (b.dataset.trick) { const res = trickAnswer(+b.dataset.trick, "bow"); if (res.right) { const dog = document.getElementById("v47-dog"); if (dog) dog.textContent = "🐶 bow"; celebrate(); } return; }
      if (b.dataset.lore) { lorePick(+b.dataset.lore); return; }
      if (b.id === "learn-wreath") { startWreath(); return; }
    };
  }
  function openMode(next) { mode = next; pausedFrom = null; show(); }

  function makeGate(id) {
    const skill = BUILD_SKILL[id];
    const used = new Set();
    const qs = [];
    const due = nextDue();
    const weak = weakest();
    if (due) qs.push(pick(due, "confidence", used));
    else if (weak && weak !== skill) qs.push(pick(weak, "confidence", used));
    else qs.push(pick(skill, "confidence", used));
    if (qs[0].skill !== skill) qs.push(pick(skill, "confidence", used));
    qs.push(pick(skill, "level", used));
    qs.push(pick(skill, "stretch", used));
    return qs.slice(0, 5);
  }
  function openGate(id) {
    if (!BUILD_SKILL[id]) return { ok: false, reason: "missing", score: coins() };
    const v = bag();
    if (v.ready[id] || v.passed[id]) return { ok: false, reason: "ready", score: coins() };
    const asked = PE.care.ask(id);
    if (!asked.ok) return asked;
    if (coins() < asked.price) return { ok: false, reason: "short", score: coins() };
    const qs = makeGate(id);
    gate = { id, qs, i: 0, misses: 0, price: asked.price };
    example = null;
    openMode("gate");
    return { ok: true, total: qs.length, skill: qs[0].skill, price: asked.price, score: coins() };
  }
  function currentQ() {
    if (mode === "daily" && daily) return daily.qs[daily.i] || null;
    if (mode === "gate" && gate) return gate.qs[gate.i] || null;
    return null;
  }
  function skipExample() {
    if (!example) return { ok: false };
    example.done = true;
    example.progress = 1;
    const q = currentQ();
    if (q && q._fresh) {
      const session = mode === "gate" ? gate : daily;
      session.qs[session.i] = q._fresh;
      delete session.qs[session.i]._hint;
    }
    example = null;
    show();
    return { ok: true, prompt: currentQ() && currentQ().prompt };
  }
  function answer(choice) {
    if (example && !example.done) return { ok: false, reason: "example", score: coins() };
    const session = mode === "daily" ? daily : gate;
    if (!session) return { ok: false, reason: "closed", score: coins() };
    const q = session.qs[session.i];
    if (!q) return { ok: false, reason: "done", score: coins() };
    const right = choice === q.answer;
    const beforeIndex = session.i;
    record(q.skill, right);
    serveDue(q.skill);
    if (!right) {
      session.misses += 1;
      const used = new Set(session.qs.map((x) => x.prompt));
      const fresh = pick(q.skill, q.level, used);
      q._hint = q.hint;
      q._fresh = fresh;
      openTutorial({ skill: q.skill, prompt: q.prompt, explain: q.explain, choices: q.choices, answer: q.answer });
      return { ok: true, right: false, hint: q.hint, restart: false, index: beforeIndex, score: coins(), gentle: true, tutorial: true };
    }
    session.i += 1;
    celebrate();
    if (session.i >= session.qs.length) return finishSession();
    show();
    return { ok: true, right: true, done: false, index: session.i, score: coins() };
  }
  function finishSession() {
    if (mode === "daily") {
      const pay = completeDaily();
      const streak = bag().daily.streak;
      closePlay();
      return { ok: true, right: true, done: true, pay, streak, score: coins() };
    }
    const id = gate.id;
    const misses = gate.misses;
    const v = bag();
    if (id === "wreath") {
      v.passed.wreath = 1;
      const bought = buyWreath();
      closePlay();
      gate = null;
      return { ok: !!bought.ok, right: true, done: true, refund: 0, misses, score: coins(), price: 20 };
    }
    v.ready[id] = 1;
    const res = PE.care.commit(id);
    let refund = 0;
    if (res.ok) {
      v.passed[id] = 1;
      if (misses === 0 && !v.refunded[id]) {
        PE.state().score = coins() + 1;
        v.refunded[id] = 1;
        refund = 1;
      }
    }
    persist();
    closePlay();
    gate = null;
    return { ok: !!res.ok, right: true, done: true, reason: res.reason, refund, misses, score: coins(), price: res.price };
  }
  function completeDaily() {
    const v = bag();
    const day = today();
    if (v.daily.last === addDays(day, -1)) v.daily.streak = (v.daily.streak || 0) + 1;
    else if (v.daily.last !== day) v.daily.streak = 1;
    v.daily.last = day;
    v.daily.day = day;
    v.daily.done = 3;
    let pay = 0;
    if (v.daily.paidDay !== day) {
      pay = Math.min(3, 2 + (v.daily.streak >= 3 ? 1 : 0));
      PE.state().score = coins() + pay;
      v.daily.paidDay = day;
      v.daily.paid = pay;
    }
    persist();
    return pay;
  }
  function startDaily() {
    const v = bag();
    const day = today();
    if (v.daily.day === day && v.daily.done >= 3) return { ok: false, reason: "done", streak: v.daily.streak, score: coins() };
    const used = new Set();
    const qs = [];
    const due = nextDue();
    if (due) qs.push(pick(due, "level", used));
    qs.push(pick("reading", "confidence", used));
    qs.push(pick("vocab", "confidence", used));
    if (!due) qs.push(pick("skip", "confidence", used));
    daily = { qs: qs.slice(0, 3), i: 0, misses: 0, day };
    example = null;
    openMode("daily");
    return { ok: true, total: daily.qs.length, skill: daily.qs[0].skill, skills: daily.qs.map((q) => q.skill), score: coins() };
  }
  function progress() {
    const v = bag();
    const rows = Object.entries(v.skills).map(([skill, s]) => ({ skill, n: s.n, c: s.c, w: s.w, acc: s.n ? Math.round(100 * s.c / s.n) : 0 }));
    const weak = rows.filter((r) => r.n).sort((a, b) => a.acc - b.acc || b.n - a.n).slice(0, 3);
    return { rows, weak, playMs: v.playMs, streak: v.daily.streak || 0 };
  }
  function openParent() {
    openMode("parent");
    return { ok: true, held: true, card: progress() };
  }
  function hold(ms) {
    holdMs += ms;
    if (holdMs >= 3000) { holdMs = 3000; return openParent(); }
    return { ok: false, reason: "hold", heldMs: holdMs };
  }

  function tick(dt) {
    const step = Math.max(0, Math.min(0.25, dt || 0));
    clockMs += step * 1000;
    if (!document.hidden && step) bag().playMs += step * 1000;
    if (holding) {
      holdMs += step * 1000;
      if (holdMs >= 3000) { holding = false; openParent(); }
    }
    if (example && !example.done) {
      example.progress += step / 10;
      if (example.progress >= 1) skipExample();
      else if (mode) {
        const vis = document.querySelector("#learn-card .learn-visual");
        if (vis) vis.outerHTML = visualHtml(example.visual, example.n, example.progress);
      }
    }
    const due = pending.filter((job) => job.at <= clockMs);
    if (due.length) {
      pending.splice(0, pending.length, ...pending.filter((job) => job.at > clockMs));
      due.forEach((job) => job.fn());
    }
  }
  function onKey(e) {
    if (e.key !== "Escape") return;
    if (!mode) return;
    e.preventDefault();
    e.stopPropagation();
    if (pausedFrom) { mode = pausedFrom; pausedFrom = null; }
    else { pausedFrom = mode; }
    show();
  }
  function ui() {
    const settings = document.getElementById("settings");
    if (settings && !document.getElementById("learn-daily-btn")) {
      const dailyBtn = document.createElement("button");
      dailyBtn.id = "learn-daily-btn";
      dailyBtn.className = "btn small";
      dailyBtn.textContent = "Daily Three";
      dailyBtn.onclick = () => startDaily();
      settings.appendChild(dailyBtn);
      const holdBtn = document.createElement("button");
      holdBtn.id = "learn-progress-btn";
      holdBtn.className = "btn small";
      holdBtn.textContent = "Progress — hold 3 s";
      holdBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); holding = true; holdMs = 0; });
      const stop = () => { if (holdMs < 3000) { holding = false; holdMs = 0; } };
      holdBtn.addEventListener("pointerup", stop);
      holdBtn.addEventListener("pointerleave", stop);
      settings.appendChild(holdBtn);
      [["nature", "Nature walk"], ["garden", "Garden ruler"], ["art", "Art shapes"], ["sport", "Score"], ["biscuit", "Biscuit trick"], ["lore", "Stories"], ["winter", "Winter castle"]].forEach(([id, label]) => {
        const b = document.createElement("button");
        b.className = "btn small";
        b.textContent = label;
        b.onclick = () => openPlay(id);
        settings.appendChild(b);
      });
    }
  }
  function loop(now) {
    const dt = lastNow ? (now - lastNow) / 1000 : 0;
    lastNow = now;
    try { tick(dt); } catch (err) { console.error("v47", err && err.message); }
    requestAnimationFrame(loop);
  }

  const LORE = {
    terrace: "Amara wanted the terrace to smell like rain and roses. She measured each bed with a piece of string before she planted a single seed. Theo carried the watering can, and together they counted the sprouts every morning. One bed grew faster than the others, so they moved it into the sun. By the end of the week the fountain was ringed with color, and the queen said the garden looked like a storybook. Amara learned that careful measuring made the flowers happier than guessing ever could. She left a little path so Sir Biscuit could sniff the blooms without sitting on them. Guests started having tea beside the fountain, and every cup came with a story about which flower had opened first.",
    stable: "The pony at the stable was named Pip, and she shared her oats fairly when a second pony came to visit. Amara divided the apples into equal groups so nobody felt left out. Pip liked the smaller pile if it was offered with a gentle hand. On riding day the princess walked beside the pony before she climbed on, counting the fence posts they passed. The stable cat watched from the hay. When the ride ended, Pip got one apple and the visitor got one too. Sharing made the stable quieter and kinder. Amara brushed Pip's mane and promised to come back with another apple tomorrow, cut into the same fair pieces. The next visit would start with the same fair count, written on the stable door.",
    studio: "In the art studio Amara built a picture from shapes she could name. A yellow circle became the sun. A blue square became a window. Two triangles made a little boat. She folded the paper and found a line where both sides matched. That line of symmetry made the boat look steady. Her teacher asked how many corners the window had, and Amara touched all four. She hung the picture in the hall so the shapes could greet people. Sir Biscuit tilted his head at the boat, as if he hoped it might float. Amara added one more circle for his nose and laughed. She counted the shapes once more before she put the brushes away in their jar today.",
    nook: "The secret library nook hid behind a sliding bookcase. Amara pulled a green book and found a story about a brave mouse who helped a lost kitten. The main idea was simple: friends look for each other. She also met a new word, scurry, and tried it in a sentence of her own. The nook was quiet enough to hear the page turn. Theo knocked in the pattern they had agreed on, two soft taps and one loud one, and she let him in. They read the ending together and talked about why the mouse went back into the rain. The answer was in the last paragraph, not in the picture on the cover. They closed the book gently so the nook would stay a quiet place.",
    tea: "The tea pavilion charged three coins for a cup and one coin for a lemon cookie. Amara paid with a handful of ten and counted the change into Theo's palm so he could see it. Four places were set, and she had filled one, which she called one fourth of the table. When a knight arrived with only eight coins, she helped him choose a cup and still keep enough for the bridge toll. Making change felt like a little puzzle with a kind ending. The cookies were warm. Nobody left the pavilion with the wrong number of coins, and the princess wrote the prices on a card so the next host would be just as careful with every coin.",
    maze: "The rose maze had hedges that turned in rectangles. Amara paced the outside and found each side was five steps, so the perimeter was twenty steps around. Inside, one room of the maze was three steps by four, and she covered it in her mind with twelve square tiles. A pink ribbon marked the path that did not loop. She checked her count twice before she trusted it. At the center a single white rose waited, and the sign said the area of the center bed was six. She smiled because six was three times two, and she could see both numbers in the soil. Sir Biscuit stayed on the path, which was the bravest thing a short dog could do.",
    training: "In the training hall the clock started the fencing drill at two fifteen. Amara practiced until two forty-five and then figured the elapsed time by counting the minutes on her fingers. Thirty minutes of footwork made her ankles warm. The jiu jitsu ribbon lesson came next and lasted a quarter of an hour, which she knew was fifteen minutes. She wrote both times on the board so the next student would not have to guess. Coach Ben nodded when the numbers matched the clock. Being on time was part of being ready. Amara hung her ribbon straight and promised to return when the little hand was on the four and the big hand was straight up on the twelve exactly.",
    court: "On the tennis court Amara kept score by fives. Love was zero, then five, ten, fifteen, and she said each number out loud so her partner could hear the pattern. When the score was ten to fifteen she compared the numbers and saw who was ahead. Skip counting made the long game feel shorter. A ball boy retrieved three balls at once, and Amara added them in her head before the next serve. The net never moved, which helped. At the end she shook hands and checked the card. The greater number had won, and both players still smiled. They agreed to count by fives the same way tomorrow, and to compare the numbers out loud before the last serve.",
    observatory: "The observatory dome opened onto a sky full of patterns. Amara saw stars in groups of ten and called each group a ten. Four groups and seven single stars made forty-seven. She wrote the number and underlined the tens place. A comet repeated every third night, so she marked a calendar with the pattern star, star, moon. The telescope was heavy, but the numbers were light. Theo asked which digit meant the most, and she pointed to the four. Place value made the big sky feel organized. They closed the dome only after they had named the pattern one more time and checked that forty-seven still meant four tens and seven ones on the little slate by the round door.",
    swans: "The swan boat needed a measured path around the moat. Amara used a ribbon marked in centimeters and found one gentle curve was one hundred centimeters, a whole meter. She cut a shorter ribbon of thirty centimeters for the flag. The water was calm, and the swan moved only when she pedaled. Measuring first kept the boat away from the stones. Sir Biscuit sat very still so the numbers would not wobble. When they returned to the dock, the ribbon matched the post exactly. Amara rolled it up and stored it in a dry box. Next time she would measure the other way around the moat and compare the two lengths on the same dry ribbon after the slow ride.",
    stage: "The ballroom stage had a chart of applause. One night the roses got five claps and the tulips got three. Amara drew a bar for each and saw the rose bar was taller. How many more claps did the roses get? She subtracted and found two. The chart helped the musicians see what the room loved. She added a star that meant two extra bows, and four stars meant eight bows. Data turned the noisy cheering into a picture she could read. The chandelier glowed while she pinned the chart beside the curtain. Tomorrow the bars would start again at zero, honest and empty, ready for a new chart of claps and a taller bar for the clear winner tonight.",
    corgi: "Sir Biscuit wanted to learn a bow. Amara made it a word problem so the trick had a story. He had six treats. He gave two to a friend, then found three more under the chair. She did the first step, six minus two, and then the second step, four plus three. Seven treats meant seven happy wags, but the bow came before the last treat. He dipped his nose, one paw forward, and the hall clapped. The word problem was the lesson, and the bow was the prize. Amara saved the last treat for the spin they would learn next, which would need a new story with two steps of its own before any treat was given out loud."
  };
  function wordCount(text) { return String(text || "").trim().split(/\s+/).filter(Boolean).length; }
  let loreId = "terrace";
  function activityNature() {
    placeNature();
    const w = worldBag().nature;
    const top = Object.entries(w).sort((a, b) => b[1] - a[1])[0];
    const bars = ["frog", "fish", "flower"].map((k) => {
      const cells = Array.from({ length: 4 }, (_, i) => `<span class="ex-cell${i < w[k] ? " on" : ""}"></span>`).join("");
      return `<div><b>${k}</b> ${cells} ${w[k]}</div>`;
    }).join("");
    return `<header><h2>Nature walk</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Tap a creature on the bank, then read the tally.</p><div class="learn-choices"><button data-spot="frog">Frog ${w.frog}</button><button data-spot="fish">Fish ${w.fish}</button><button data-spot="flower">Flower ${w.flower}</button></div><div class="learn-visual">${bars}</div><p class="learn-prompt">Most spots: ${top[1] ? top[0] : "none yet"}</p>`;
  }
  function activityGarden() {
    const g = gardenNow();
    placeGarden(g.cm);
    const marks = [0, 4, 8, 12, 16].map((n) => `<i style="left:${(n / 16) * 100}%">${n}</i>`).join("");
    return `<header><h2>Garden ruler</h2><button class="ghost" id="learn-exit">Exit</button></header><p>The sunflower is ${g.cm} cm, about ${g.inches} inches. Day ${g.days}.</p><div class="learn-ruler">${marks}<span class="ex-dot" style="left:${(g.cm / 16) * 100}%;top:6px"></span></div><p class="learn-prompt">${g.prompt}</p><div class="learn-choices">${g.choices.map((c, i) => `<button data-choice="${i}" disabled>${c}</button>`).join("")}</div>`;
  }
  function activityArt() {
    const art = worldBag().art;
    const icons = { triangle: "△", square: "□", circle: "○" };
    const corners = art.reduce((n, s) => n + ({ triangle: 3, square: 4, circle: 0 }[s] || 0), 0);
    const squares = art.filter((s) => s === "square").length;
    return `<header><h2>Art shapes</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Add shapes. A square has 4 sides, 4 corners, and a fold line.</p><div class="learn-shapes">${art.map((s) => s === "square" ? `<span class="fold">${icons[s]}</span>` : icons[s]).join("") || "…"}</div><div class="learn-choices"><button data-shape="triangle">Triangle</button><button data-shape="square">Square</button><button data-shape="circle">Circle</button></div><p>${corners} corners. Squares in the picture: ${squares}. The dashed line is a line of symmetry.</p>`;
  }
  function activitySport() {
    const w = worldBag();
    return `<header><h2>Keep score</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Each point adds 5. Compare the numbers.</p><div class="learn-choices"><button data-sport="tennis">Tennis ${w.tennis}</button><button data-sport="fence">Fencing ${w.fence}</button></div><p class="learn-prompt">${w.tennis === w.fence ? "Tied so far." : (w.tennis > w.fence ? "Tennis is ahead." : "Fencing is ahead.")}</p>`;
  }
  function activityBiscuit() {
    const q = trickStart("bow").question;
    const done = worldBag().tricks.bow;
    return `<header><h2>Sir Biscuit</h2><button class="ghost" id="learn-exit">Exit</button></header><p id="v47-dog" style="font-size:48px;text-align:center">${done ? "🐶 bow" : "🐶"}</p><p class="learn-prompt">${q.prompt}</p><div class="learn-choices">${q.choices.map((c, i) => `<button data-trick="${i}">${c}</button>`).join("")}</div>`;
  }
  function storyPreview(text) {
    const sentences = String(text).match(/[^.!?]+[.!?]/g) || [text];
    let out = "";
    sentences.forEach((s) => { if ((out + s).length < 320) out += s; });
    return out.trim();
  }
  function activityLore() {
    const story = loreFor(loreId) || loreFor("terrace");
    return `<header><h2>${esc(story.title)}</h2><button class="ghost" id="learn-exit">Exit</button></header><div class="learn-story">${esc(storyPreview(story.text))}</div><p class="learn-prompt">${esc(story.main.prompt)}</p><div class="learn-choices">${story.main.choices.map((c, i) => `<button data-lore="${i}">${esc(c)}</button>`).join("")}</div>`;
  }
  function lorePick(choice) {
    const story = loreFor(loreId);
    const right = choice === story.main.answer;
    record("reading", right);
    if (!right) openTutorial({ skill: "reading", prompt: story.main.prompt, passage: story.text, choices: story.main.choices, answer: story.main.answer, explain: story.text.slice(0, 180) });
    else { celebrate(); show(); }
  }
  function openPlay(name) {
    if (name === "garden" && !worldBag().gardenDay) plantGarden(addDays(today(), -3));
    if (name === "nature") placeNature();
    if (name === "winter") { drawWinter(); mode = "winter"; show(); return { ok: true, winter: winterOn(), mode: "winter" }; }
    mode = name;
    show();
    return { ok: true, mode: name };
  }
  function meshAt(name, color, x, y, z, radius) {
    const THREE = PE.gfx43 && PE.gfx43.THREE;
    if (!THREE || !PE.scene || PE.scene.getObjectByName(name)) return;
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, y, z);
    m.name = name;
    PE.scene.add(m);
  }
  function placeNature() {
    if (!PE.stream || !PE.stream.samples || !PE.gfx43) return;
    const samples = PE.stream.samples();
    if (!samples.length) return;
    [["frog", "#3cb44b", 6], ["fish", "#3d8bfd", 18], ["flower", "#ff7ac8", 30]].forEach(([kind, color, idx]) => {
      const s = samples[Math.min(samples.length - 1, idx)];
      const y = (PE.groundH ? PE.groundH(s.x, s.z) : 0) + 0.45;
      meshAt("v47-" + kind, color, s.x + (s.nx || 0) * 1.4, y, s.z + (s.nz || 0) * 1.4, kind === "flower" ? 0.28 : 0.4);
    });
  }
  function placeGarden(cm) {
    if (!PE.gfx43 || !PE.scene) return;
    const THREE = PE.gfx43.THREE;
    let plant = PE.scene.getObjectByName("v47-plant");
    const h = 0.7 + cm * 0.06;
    if (!plant) {
      plant = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1, 8), new THREE.MeshLambertMaterial({ color: "#3cb44b" }));
      plant.name = "v47-plant";
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshLambertMaterial({ color: "#ffd45a" }));
      head.position.y = 0.55;
      plant.add(head);
      plant.position.set(14.2, 0, 9.2);
      PE.scene.add(plant);
    }
    const gy = PE.groundH ? PE.groundH(14.2, 9.2) : 0;
    plant.scale.y = h;
    plant.position.y = gy + h * 0.5;
  }
  function loreFor(id) {
    const text = LORE[id];
    if (!text) return null;
    const skill = id === "nook" ? "reading" : (BUILD_SKILL[id] || "reading");
    return {
      id, text, words: wordCount(text), title: (PE.care.DEFS.find((d) => d.id === id) || {}).name || id,
      main: { prompt: "What is the main idea of this story?", choices: ["A careful skill helps the day go well.", "The castle is closed.", "Nobody learns anything.", "The story is about a storm at sea."], answer: 0 },
      infer: { prompt: "What can you tell that the story does not say outright?", choices: ["Practice made the next try easier.", "The characters gave up.", "Coins were taken away.", "The place does not exist."], answer: 0, skill }
    };
  }
  function worldBag() {
    const v = bag();
    if (!v.world) v.world = { nature: { frog: 0, fish: 0, flower: 0 }, gardenDay: "", art: [], tennis: 0, fence: 0, tricks: {}, lore: {}, wreath: 0 };
    return v.world;
  }
  function tapNature(kind) {
    const w = worldBag();
    if (!Object.prototype.hasOwnProperty.call(w.nature, kind)) return { ok: false };
    w.nature[kind] += 1;
    persist();
    const prompt = `The walk tally is ${w.nature.frog} frogs, ${w.nature.fish} fish, and ${w.nature.flower} flowers. Which did you spot most?`;
    const counts = w.nature;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    return { ok: true, tally: Object.assign({}, counts), prompt, answer: top };
  }
  function plantGarden(day) {
    worldBag().gardenDay = day || today();
    persist();
    return gardenNow();
  }
  function gardenNow() {
    const start = worldBag().gardenDay || today();
    const days = Math.max(0, dayNum(today()) - dayNum(start));
    const cm = Math.min(16, 2 + days * 2);
    return { cm, inches: Math.round((cm / 2.54) * 10) / 10, days, prompt: `The sunflower is ${cm} cm tall. Which ruler mark matches it?`, choices: [cm + " cm", (cm + 3) + " cm", "1 cm", "30 cm"], answer: 0 };
  }
  function addShape(shape) {
    const allowed = { triangle: 3, square: 4, circle: 0 };
    if (allowed[shape] == null) return { ok: false };
    worldBag().art.push(shape);
    persist();
    const corners = worldBag().art.reduce((n, s) => n + allowed[s], 0);
    return { ok: true, shapes: worldBag().art.slice(), corners, prompt: "How many corners are in your picture?", choices: [String(corners), String(corners + 1), "0", "100"], answer: 0 };
  }
  function sportPoint(which) {
    const w = worldBag();
    if (which !== "tennis" && which !== "fence") return { ok: false };
    w[which] += 5;
    persist();
    const other = which === "tennis" ? "fence" : "tennis";
    const hi = w[which] >= w[other] ? which : other;
    return { ok: true, tennis: w.tennis, fence: w.fence, prompt: `The score is tennis ${w.tennis}, fencing ${w.fence}. Which number is greater or tied in the lead?`, lead: hi };
  }
  function trickStart(name) {
    const q = { prompt: "Sir Biscuit has 6 treats. He gives away 2, then finds 3. How many treats now?", choices: ["7", "5", "11", "1"], answer: 0, explain: "6 minus 2 is 4, then 4 plus 3 is 7." };
    return { ok: true, trick: name || "bow", question: q };
  }
  function trickAnswer(choice, name) {
    const right = choice === 0;
    record("word", right);
    if (!right) {
      openTutorial({ skill: "word", prompt: "Sir Biscuit has 6 treats. He gives away 2, then finds 3. How many treats now?", explain: "Do the first step, then the second.", choices: ["7", "5", "11", "1"], answer: 0 });
      return { ok: true, right: false, score: coins() };
    }
    worldBag().tricks[name || "bow"] = 1;
    persist();
    celebrate();
    if (mode === "biscuit") show();
    return { ok: true, right: true, anim: name || "bow", score: coins() };
  }
  function winterOn(iso) {
    const day = iso || today();
    const month = +day.slice(5, 7);
    const date = +day.slice(8, 10);
    return month === 12 || (month === 1 && date <= 6);
  }
  function startWreath() {
    if (!winterOn()) return { ok: false, reason: "season", score: coins() };
    if (coins() < 20) return { ok: false, reason: "short", score: coins() };
    const used = new Set();
    gate = { id: "wreath", qs: [pick("patterns", "confidence", used), pick("patterns", "level", used), pick("patterns", "stretch", used)], i: 0, misses: 0, price: 20 };
    example = null;
    openMode("gate");
    return { ok: true, total: 3, score: coins() };
  }
  function buyWreath() {
    if (!winterOn()) return { ok: false, reason: "season", score: coins() };
    const price = 20;
    if (worldBag().wreath) return { ok: false, reason: "owned", score: coins() };
    if (coins() < price) return { ok: false, reason: "short", score: coins() };
    if (!bag().passed.wreath) return { ok: false, reason: "gate", score: coins() };
    PE.state().score = coins() - price;
    worldBag().wreath = 1;
    persist();
    drawWinter();
    return { ok: true, score: coins(), price };
  }
  function drawWinter() {
    if (!winterOn() || !PE.gfx43 || !PE.scene) return;
    const THREE = PE.gfx43.THREE;
    if (PE.scene.getObjectByName("v47-frost")) return;
    const frost = new THREE.Mesh(new THREE.TorusGeometry(11.6, 0.55, 10, 48), new THREE.MeshLambertMaterial({ color: "#ffffff" }));
    frost.rotation.x = -Math.PI / 2;
    frost.position.set(0, 0.7, -1);
    frost.name = "v47-frost";
    PE.scene.add(frost);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.cos(a) * 15.2;
      const z = -1 + Math.sin(a) * 15.2;
      const gy = PE.groundH ? PE.groundH(x, z) : 0;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.1, 6), new THREE.MeshLambertMaterial({ color: "#6b4a2a" }));
      post.position.set(x, gy + 0.55, z);
      post.name = "v47-light";
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshLambertMaterial({ color: i % 2 ? "#ffd36b" : "#ff5fa2", emissive: "#fff1a8", emissiveIntensity: 0.9 }));
      bulb.position.y = 0.62;
      post.add(bulb);
      PE.scene.add(post);
      const snow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshLambertMaterial({ color: "#f4fbff" }));
      snow.position.set(x * 0.55, (PE.groundH ? PE.groundH(x * 0.55, z * 0.55) : 0) + 0.12, z * 0.55);
      snow.name = "v47-snow";
      PE.scene.add(snow);
    }
    try { snowRoofs(); } catch (err) { /* a mesh without bounds is skipped */ }
  }
  function snowRoofs() {
    const THREE = PE.gfx43.THREE;
    if (PE.scene.getObjectByName("v47-roof-snow")) return;
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    const tops = [];
    PE.scene.updateMatrixWorld(true);
    PE.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const col = o.material && o.material.color;
      if (col && col.g > col.r + 0.15 && col.g > 0.35) return;
      box.setFromObject(o);
      box.getSize(size);
      box.getCenter(center);
      if (size.y < 5 || size.y > 28) return;
      if (Math.hypot(center.x, center.z + 1) > 10) return;
      tops.push({ x: center.x, y: box.max.y, z: center.z, w: Math.max(size.x, size.z) });
    });
    tops.sort((a, b) => b.y - a.y);
    const used = [];
    tops.forEach((t) => {
      if (used.some((u) => Math.hypot(u.x - t.x, u.z - t.z) < 1.2)) return;
      if (used.length > 6) return;
      used.push(t);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(Math.max(0.7, Math.min(2.2, t.w * 0.35)), 1.3, 8), new THREE.MeshLambertMaterial({ color: "#ffffff" }));
      cap.position.set(t.x, t.y + 0.35, t.z);
      cap.name = "v47-roof-snow";
      PE.scene.add(cap);
    });
  }
  function celebrate() {
    let el = document.getElementById("v47-cheer");
    if (!el) {
      el = document.createElement("div");
      el.id = "v47-cheer";
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="dog">🐶</div><div>Yes! Sir Biscuit wags!</div>`;
    el.classList.add("show");
    later(2200, () => el.classList.remove("show"));
    if (quiet()) return { ok: true, quiet: true };
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return { ok: true, quiet: true };
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 660;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (err) { /* no audio */ }
    return { ok: true, quiet: false };
  }

  document.addEventListener("keydown", onKey, true);
  ui();
  bag();
  requestAnimationFrame(loop);

  PE.learn = {
    BUILD_SKILL,
    SKILL_NAME,
    needsGate: (id) => !!(BUILD_SKILL[id] && !bag().ready[id] && !bag().passed[id]),
    openGate,
    startDaily,
    answer,
    hold,
    progress,
    tick,
    advance: (ms) => tick((ms || 0) / 1000),
    setDate: (iso) => { clockDate = iso; drawWinter(); },
    play: openPlay,
    today,
    addPlay: (ms) => { bag().playMs += ms; persist(); },
    record: (skill, ok) => { record(skill, !!ok); persist(); },
    setQuiet: (q) => { bag().quiet = !!q; persist(); },
    quiet,
    later,
    bag: () => bag(),
    due: () => bag().due.slice(),
    example: {
      active: () => !!(example && !example.done),
      skip: skipExample,
      progress: () => example ? example.progress : 0
    },
    gate: {
      current: () => (gate && gate.qs[gate.i]) || null,
      index: () => gate ? gate.i : -1,
      misses: () => gate ? gate.misses : 0,
      answer
    },
    daily: {
      current: () => (daily && daily.qs[daily.i]) || null,
      answer,
      status: () => ({ day: bag().daily.day, done: bag().daily.done, streak: bag().daily.streak, paid: bag().daily.paid })
    },
    parent: { hold, open: openParent, card: progress },
    lore: loreFor,
    nature: { tap: tapNature },
    garden: { plant: plantGarden, now: gardenNow },
    art: { add: addShape },
    sport: { point: sportPoint },
    biscuit: { start: trickStart, answer: trickAnswer },
    winter: { on: winterOn, buy: buyWreath, draw: drawWinter, start: startWreath },
    celebrate,
    ui: { open: () => !!mode, paused: () => !!pausedFrom },
    onWrong: openTutorial,
    tutorial: {
      open: openTutorial,
      next: tutorAdvance,
      skip: tutorSkip,
      state: () => tutor ? { skill: tutor.skill, step: tutor.step, steps: tutor.steps.length, phase: tutor.phase, skippable: tutor.step >= 1, hit: tutor.hit } : null
    }
  };
})();
