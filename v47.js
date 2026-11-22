/* Princess Explorer 5.2: Learn & Build. File name stays v47.js. Save keys are unchanged.
   Questions sit in front of a build. Direct care.commit() is unchanged so older saves and tests keep their prices. */
(function () {
  const PE = window.PrincessExplorer;
  if (!PE || !PE.care || !PE.state) return;

  const BUILD_SKILL = {
    maze: "area", tea: "money", terrace: "measure", studio: "shapes", nook: "reading",
    observatory: "patterns", stable: "fractions", court: "skip", training: "time",
    stage: "data", corgi: "word", swans: "measure", upper: "reading"
  };
  const SKILL_NAME = {
    area: "Area and perimeter", money: "Money", measure: "Measurement", shapes: "Shapes",
    reading: "Reading", vocab: "Vocabulary", patterns: "Patterns and place value",
    fractions: "Fractions", skip: "Skip counting", time: "Time", data: "Data and graphs", word: "Word problems",
    groups: "Equal groups"
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
    item("skip", "confidence", "Which number is even?", ["8", "7", "11", "3"], 0, "Even numbers are the ones you land on when you count by 2s.", "8 splits into pairs. 7 does not.", "line", 8),
    item("groups", "confidence", "3 flower beds with 4 roses in each. How many roses?", ["12", "7", "34", "1"], 0, "Multiply the groups by how many are in each.", "3 times 4 is 12.", "grid", 12),
    item("groups", "confidence", "2 pots with 5 seeds in each. How many seeds?", ["10", "7", "25", "3"], 0, "Two groups of 5.", "2 times 5 is 10.", "grid", 10),
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
  TEACH.skip = [
    { say: "Line the numbers up. Compare the hundreds, then the tens, then the ones.", visual: "blocks", n: 36 },
    { say: "The greater number is the one that is further along.", visual: "line", n: 24 },
    { say: "Even numbers are the ones you land on when you count by 2s.", visual: "line", n: 8 }
  ];
  TEACH.groups = [
    { say: "Count how many are in one group.", visual: "grid", n: 4 },
    { say: "Count the groups.", visual: "grid", n: 3 },
    { say: "Groups times how many are in each group is the total.", visual: "grid", n: 12 }
  ];
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
  function practiceLike(skill, used, info) {
    const blob = (String(info && info.prompt || "") + " " + String(info && info.explain || "")).toLowerCase();
    const tests = [
      [/great|least/, /great|least/],
      [/even|odd/, /even|odd/],
      [/group|times|each/, /group|each|times/],
      [/share/, /share|equal/]
    ];
    const pair = tests.find((t) => t[0].test(blob));
    if (pair) {
      const hit = BANK.find((q) => q.skill === skill && !used.has(q.prompt) && pair[1].test(q.prompt.toLowerCase()));
      if (hit) { used.add(hit.prompt); return Object.assign({}, hit); }
    }
    return pick(skill, "confidence", used);
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
#learn-layer{position:fixed;inset:0;z-index:70;display:none;align-items:flex-end;justify-content:center;background:rgba(70,30,90,.28);padding:10px}
body.learn-on #a35-card{visibility:hidden}
#learn-layer.show{display:flex}
#learn-card{width:min(760px,100%);max-height:min(62vh,640px);overflow:auto;background:#fffaf2;border:7px solid #ff7ac8;border-radius:28px 28px 18px 18px;padding:12px 14px 16px;color:#4a2c6f;font-family:"Trebuchet MS",sans-serif;box-shadow:0 22px 40px rgba(70,24,60,.28),0 10px 0 rgba(0,0,0,.08)}
#learn-card header{display:flex;align-items:center;justify-content:space-between;gap:8px}
#learn-card h2{margin:0;font-size:26px;font-family:"Trebuchet MS",sans-serif;display:flex;align-items:center;gap:8px}
.learn-ico{width:36px;height:36px;border-radius:12px;background:linear-gradient(#fff,#ffd6ee);display:inline-flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 0 rgba(180,70,130,.22);flex:0 0 auto}
#v47-grade{position:fixed;inset:0;pointer-events:none;z-index:4;background:radial-gradient(ellipse at center, rgba(255,214,170,.08) 40%, rgba(40,18,28,.38) 100%)}
#learn-card button{font:800 17px/1.2 Trebuchet MS,sans-serif;border-radius:14px;border:0;background:#ff5fa2;color:#fff;padding:8px 10px;min-height:40px;cursor:pointer}
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
#learn-card.short{max-height:36vh}
.learn-choices.nat{grid-template-columns:1fr 1fr 1fr}
#learn-card.short button{min-height:34px;padding:6px 8px}
.g-stage{position:relative;height:208px;margin:4px 0 6px}
.g-ruler{position:absolute;left:4px;bottom:0;width:72px;height:196px;border-left:3px solid #4a2c6f}
.g-ruler b{position:absolute;left:14px;font-size:13px;line-height:13px;font-weight:700;transform:translateY(6px)}
.g-ruler i{position:absolute;left:0;width:10px;border-top:2px solid #4a2c6f}
.g-plant{position:absolute;left:78px;bottom:0;width:36px;display:flex;flex-direction:column;align-items:center}
.g-head{width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff4b0,#f0b429 58%,#d98416);box-shadow:0 0 0 3px #e07a18;flex:0 0 auto}
.g-stem{width:12px;background:linear-gradient(#67c45a,#2f7d34);border-radius:6px 6px 2px 2px;flex:0 0 auto}
.learn-shapes{font-size:42px;letter-spacing:10px;text-align:center}
.learn-shapes .fold{display:inline-block;border-left:3px dashed #ff5fa2;padding-left:8px}
.learn-story{font-size:15px;line-height:1.4;max-height:34vh;overflow:auto;background:#fff;border-radius:12px;padding:8px}
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
    if (/odd|even/.test(t)) return "skip";
    if (/group|times|multipl/.test(t)) return "groups";
    if (/shar/.test(t)) return "fractions";
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
    const practice = practiceLike(skill, used, info);
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
        return `<header><h2><span class="learn-ico">✎</span>Try one like it</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${SKILL_NAME[tutor.skill] || tutor.skill}. This practice does not change your coins.</p><p class="learn-prompt">${esc(q.prompt)}</p><div class="learn-choices">${q.choices.map((c, i) => `<button data-tutor="${i}">${esc(c)}</button>`).join("")}</div>${pause}`;
      }
      const step = tutor.steps[tutor.step];
      const visual = step.visual === "read"
        ? `<div class="learn-visual"><p>Look here: <mark class="learn-hit">${esc(tutor.hit)}</mark></p></div>`
        : visualHtml(step.visual, step.n, 0.75);
      const skip = tutor.step >= 1 ? `<button id="learn-skip">Skip</button>` : "";
      return `<header><h2><span class="learn-ico">✎</span>Let's learn it</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Step ${tutor.step + 1} of ${tutor.steps.length}</p><p class="learn-prompt">${esc(step.say)}</p>${visual}<button id="learn-next">${tutor.step === tutor.steps.length - 1 ? "Practice" : "Next"}</button>${skip}${pause}`;
    }
    if (mode === "parent") {
      const info = progress();
      const rows = info.rows.length ? info.rows.map((r) => `<div class="v-row"><b>${SKILL_NAME[r.skill] || r.skill}</b> — ${r.acc}% of ${r.n}</div>`).join("") : "<p>No answers yet.</p>";
      const weak = info.weak.length ? info.weak.map((r, i) => `<div>${i + 1}. ${SKILL_NAME[r.skill] || r.skill} (${r.acc}%)</div>`).join("") : "<p>No weak spots yet.</p>";
      return `<header><h2><span class="learn-ico">★</span>Progress</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Princess Explorer 5.3: Learn &amp; Build</p><p>Time played: ${Math.round(info.playMs / 60000)} min. Daily streak: ${info.streak}.</p><p><b>Weakest skills</b></p>${weak}<p><b>Accuracy</b></p>${rows}${pause}`;
    }
    if (mode === "daily" && daily) {
      const q = daily.qs[daily.i];
      if (!q) return `<header><h2><span class="learn-ico">☀</span>Daily Three</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Done for today.</p>${pause}`;
      return head("Daily Three", `Warm-up ${daily.i + 1} of 3`) + bodyQ(q) + pause;
    }
    if (mode === "nature") return activityNature() + pause;
    if (mode === "garden") return activityGarden() + pause;
    if (mode === "art") return activityArt() + pause;
    if (mode === "sport") return activitySport() + pause;
    if (mode === "biscuit") return activityBiscuit() + pause;
    if (mode === "lore") return activityLore() + pause;
    if (mode === "winter") return `<header><h2><span class="learn-ico">❄</span>Winter castle</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${winterOn() ? "December 1 to January 6. Frost on the moat, lights on the lawn, snow on the ground." : "The winter castle waits from December 1 to January 6."}</p>${winterOn() ? `<button id="learn-wreath">Wreath challenge, 20 coins</button>` : ""}` + pause;
    if (mode === "gate" && gate) {
      const q = gate.qs[gate.i];
      const title = gate.id === "passage" ? "Secret passage" : ((PE.care.DEFS.find((d) => d.id === gate.id) || {}).name || "Build");
      return head(title, `Question ${Math.min(gate.i + 1, gate.qs.length)} of ${gate.qs.length}`) + (q ? bodyQ(q) : "<p>Building…</p>") + pause;
    }
    return "";
  }
  function head(title, step) {
    const icon = mode === "daily" ? "☀" : "🏰";
    return `<header><h2><span class="learn-ico">${icon}</span>${title}</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${step}</p>`;
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
    el.querySelector("#learn-card").classList.toggle("short", mode === "nature");
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
      if (b.dataset.nq != null) {
        const q = natureQuestion();
        if (+b.dataset.nq === q.answer) celebrate();
        else openTutorial({ skill: "data", prompt: q.prompt, explain: "Subtract the fish count from the frog count.", choices: q.choices, answer: q.answer });
        return;
      }
      if (b.dataset.gq != null) {
        const g = gardenNow();
        if (+b.dataset.gq === 0) { gardenAsk = "grew"; show(); }
        else openTutorial({ skill: "measure", prompt: "How tall is the sunflower?", explain: "Read the ruler from 0 up to the top of the flower.", choices: gardenChoices(g.cm, "cm"), answer: 0 });
        return;
      }
      if (b.dataset.gg != null) {
        const g = gardenNow();
        if (+b.dataset.gg === 0) celebrate();
        else openTutorial({ skill: "measure", prompt: "How much did it grow since Day 2?", explain: "Subtract the Day 2 height from today's height.", choices: gardenChoices(g.grew, "cm"), answer: 0 });
        return;
      }
      if (b.dataset.aq != null) {
        const corners = worldBag().art.reduce((n, s) => n + ({ triangle: 3, square: 4, circle: 0 }[s] || 0), 0);
        if (+b.dataset.aq === 0) celebrate();
        else openTutorial({ skill: "shapes", prompt: "How many corners are in your picture?", explain: "A triangle has 3 corners and a square has 4. A circle has none.", choices: gardenChoices(corners, "corners"), answer: 0 });
        return;
      }
      if (b.dataset.as != null) {
        if (+b.dataset.as === 2) celebrate();
        else openTutorial({ skill: "shapes", prompt: "How many lines of symmetry does a square have?", explain: "A square folds in half four ways.", choices: ["1", "2", "4", "0"], answer: 2 });
        return;
      }
      if (b.dataset.shape) { addShape(b.dataset.shape); show(); return; }
      if (b.dataset.sport) { sportPoint(b.dataset.sport); show(); return; }
      if (b.dataset.trick) { const res = trickAnswer(+b.dataset.trick, "bow"); if (res.right) { const dog = document.getElementById("v47-dog"); if (dog) dog.textContent = "🐶 bow"; celebrate(); } return; }
      if (b.dataset.lore) { lorePick(+b.dataset.lore); return; }
      if (b.id === "learn-wreath") { startWreath(); return; }
    };
  }
  function openMode(next) { mode = next; pausedFrom = null; show(); }

  function passageQuestions() {
    return [
      item("reading", "confidence", "Lila opened a green book. The first page said, \"The castle keeps its stories upstairs.\" What is the main idea?", ["The book tells where the castle stories are.", "Lila lost her book.", "The castle has no books.", "The page was blank."], 0, "Read what the page says.", "The page says the castle keeps its stories upstairs.", "read", 0),
      item("vocab", "level", "In the sentence \"She pulled the cheerful book,\" the word cheerful means ____.", ["happy", "heavy", "lost", "closed"], 0, "Cheerful is a feeling word.", "Cheerful means happy.", "read", 0),
      item("reading", "stretch", "A sign read, \"Pull the cheerful book to find the quiet room.\" Why does she pull that book?", ["To open the way to the quiet room.", "To put the book away.", "To turn off the lights.", "To pay a coin."], 0, "The sign tells what the pull does.", "Pulling that book finds the quiet room.", "read", 0)
    ];
  }
  function openPassage() {
    const v = bag();
    if (v.passed.passage) return { ok: true, ready: true, score: coins() };
    gate = { id: "passage", qs: passageQuestions(), i: 0, misses: 0, price: 0 };
    example = null;
    openMode("gate");
    return { ok: true, total: 3, skill: "reading", price: 0, score: coins() };
  }
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
    if (id === "upper") return { ok: false, reason: "confirm", score: coins() };
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
    if (id === "passage") {
      v.passed.passage = 1;
      persist();
      closePlay();
      gate = null;
      if (window.PE_V53 && window.PE_V53.openPassage) window.PE_V53.openPassage();
      return { ok: true, right: true, done: true, refund: 0, misses, score: coins(), price: 0 };
    }
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
      if (id !== "upper" && misses === 0 && !v.refunded[id]) {
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
    const weak = rows.filter((r) => r.n >= 2 && r.acc < 80).sort((a, b) => a.acc - b.acc || b.n - a.n).slice(0, 3);
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
    const fall = PE.scene && PE.scene.getObjectByName && PE.scene.getObjectByName("v47-fall");
    if (fall && fall.geometry) {
      const arr = fall.geometry.attributes.position.array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= step * 1.4;
        if (arr[i] < 0.4) arr[i] = 12;
      }
      fall.geometry.attributes.position.needsUpdate = true;
    }
    if (gfx) {
      gfx.t += step;
      gfx.scrolls.forEach((s) => { s.map.offset.x = gfx.t * s.speed; s.map.offset.y = Math.sin(gfx.t * s.speed) * 0.05; });
      gfx.sways.forEach((b, i) => { b.rotation.z = Math.sin(gfx.t * 1.5 + i) * 0.18; });
      gfx.wags.forEach((w) => { w.rotation.z = Math.sin(gfx.t * 7) * 0.55; });
      gfx.clouds.forEach((c, i) => { c.position.x += Math.sin(gfx.t * 0.15 + i) * step * 0.35; });
      natureBobs.forEach((g, i) => {
        const base = g.userData.baseY || 0;
        if (g.userData.kind === "fish") {
          const wave = Math.sin(clockMs / 420 + i);
          g.position.y = base + Math.max(0, wave) * 0.85;
          g.position.x = g.userData.baseX + Math.sin(clockMs / 520 + i) * 0.35;
        } else g.position.y = base + Math.sin(clockMs / 320 + i) * 0.08;
      });
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
    terrace: "Amara wanted the terrace to smell like rain and roses. She measured each bed with a piece of string before she planted a single seed. Theo carried the watering can, and together they counted the sprouts every morning. One bed grew faster than the others, so they moved it into the sun. By the end of the week the fountain was ringed with color, and the queen said the garden looked like a storybook. Amara learned that careful measuring made the flowers happier than guessing ever could. She left a little path so Sir Biscuit could sniff the blooms without sitting on them. Guests started having tea beside the fountain, and every cup came with a story about which flower had opened first. That evening Amara wrote each length in a little book so next spring she could match the beds again. Theo drew the fountain on the last page. They agreed the best part was measuring carefully and doing the work together.",
    stable: "The pony at the stable was named Pip, and she shared her oats fairly when a second pony came to visit. Amara divided the apples into equal groups so nobody felt left out. Pip liked the smaller pile if it was offered with a gentle hand. On riding day the princess walked beside the pony before she climbed on, counting the fence posts they passed. The stable cat watched from the hay. When the ride ended, Pip got one apple and the visitor got one too. Sharing made the stable quieter and kinder. Amara brushed Pip's mane and promised to come back with another apple tomorrow, cut into the same fair pieces. The next visit would start with the same fair count, written on the stable door. In the morning Pip waited by the gate, and Amara checked the note before she opened the oat bin. Equal shares kept both ponies calm. She closed the stable proud that nobody had been left out.",
    studio: "In the art studio Amara built a picture from shapes she could name. A yellow circle became the sun. A blue square became a window. Two triangles made a little boat. She folded the paper and found a line where both sides matched. That line of symmetry made the boat look steady. Her teacher asked how many corners the window had, and Amara touched all four. She hung the picture in the hall so the shapes could greet people. Sir Biscuit tilted his head at the boat, as if he hoped it might float. Amara added one more circle for his nose and laughed. She counted the shapes once more before she put the brushes away in their jar today. The teacher smiled and asked her to point to the fold line. Amara did, and the two sides matched. The picture stayed in the hall so other children could count the corners too.",
    nook: "The secret library nook hid behind a sliding bookcase. Amara pulled a green book and found a story about a brave mouse who helped a lost kitten. The main idea was simple: friends look for each other. She also met a new word, scurry, and tried it in a sentence of her own. The nook was quiet enough to hear the page turn. Theo knocked in the pattern they had agreed on, two soft taps and one loud one, and she let him in. They read the ending together and talked about why the mouse went back into the rain. The answer was in the last paragraph, not in the picture on the cover. They closed the book gently so the nook would stay a quiet place. Amara slid the bookcase shut and whispered the new word once more. The mouse and the kitten had found each other, and that was the heart of the tale. Theo promised to knock the same way tomorrow.",
    tea: "The tea pavilion charged three coins for a cup and one coin for a lemon cookie. Amara paid with a handful of ten and counted the change into Theo's palm so he could see it. Four places were set, and she had filled one, which she called one fourth of the table. When a knight arrived with only eight coins, she helped him choose a cup and still keep enough for the bridge toll. Making change felt like a little puzzle with a kind ending. The cookies were warm. Nobody left the pavilion with the wrong number of coins, and the princess wrote the prices on a card so the next host would be just as careful with every coin. When the last guest left, Amara counted the jar twice. The number matched her card. She blew out the candle feeling sure that fair change had made the party kind.",
    maze: "The rose maze had hedges that turned in rectangles. Amara paced the outside and found each side was five steps, so the perimeter was twenty steps around. Inside, one room of the maze was three steps by four, and she covered it in her mind with twelve square tiles. A pink ribbon marked the path that did not loop. She checked her count twice before she trusted it. At the center a single white rose waited, and the sign said the area of the center bed was six. She smiled because six was three times two, and she could see both numbers in the soil. Sir Biscuit stayed on the path, which was the bravest thing a short dog could do. Amara walked back out the way she had come and checked the ribbon once more. The numbers still matched the hedges. She left the maze smiling, because measuring had kept her from getting lost.",
    training: "In the training hall the clock started the fencing drill at two fifteen. Amara practiced until two forty-five and then figured the elapsed time by counting the minutes on her fingers. Thirty minutes of footwork made her ankles warm. The jiu jitsu ribbon lesson came next and lasted a quarter of an hour, which she knew was fifteen minutes. She wrote both times on the board so the next student would not have to guess. Coach Ben nodded when the numbers matched the clock. Being on time was part of being ready. Amara hung her ribbon straight and promised to return when the little hand was on the four and the big hand was straight up on the twelve exactly. Coach Ben tapped the clock and nodded. Amara bowed, hung up her ribbon, and walked out on time. Knowing the minutes had made the whole lesson feel steady.",
    court: "On the tennis court Amara kept score by fives. Love was zero, then five, ten, fifteen, and she said each number out loud so her partner could hear the pattern. When the score was ten to fifteen she compared the numbers and saw who was ahead. Skip counting made the long game feel shorter. A ball boy retrieved three balls at once, and Amara added them in her head before the next serve. The net never moved, which helped. At the end she shook hands and checked the card. The greater number had won, and both players still smiled. They agreed to count by fives the same way tomorrow, and to compare the numbers out loud before the last serve. Amara shook hands and wrote the final score on the card. The greater number had won, and both players still wanted another game. Counting by fives had kept the match fair from the first serve to the last.",
    observatory: "The observatory dome opened onto a sky full of patterns. Amara saw stars in groups of ten and called each group a ten. Four groups and seven single stars made forty-seven. She wrote the number and underlined the tens place. A comet repeated every third night, so she marked a calendar with the pattern star, star, moon. The telescope was heavy, but the numbers were light. Theo asked which digit meant the most, and she pointed to the four. Place value made the big sky feel organized. They closed the dome only after they had named the pattern one more time and checked that forty-seven still meant four tens and seven ones on the little slate by the round door. Theo closed the slate and they pulled the dome shut together. The pattern of the comet was saved for the next clear night. Amara felt the big sky had become a story she could read.",
    swans: "The swan boat needed a measured path around the moat. Amara used a ribbon marked in centimeters and found one gentle curve was one hundred centimeters, a whole meter. She cut a shorter ribbon of thirty centimeters for the flag. The water was calm, and the swan moved only when she pedaled. Measuring first kept the boat away from the stones. Sir Biscuit sat very still so the numbers would not wobble. When they returned to the dock, the ribbon matched the post exactly. Amara rolled it up and stored it in a dry box. Next time she would measure the other way around the moat and compare the two lengths on the same dry ribbon after the slow ride. At the dock she held the two ribbons side by side. They were not the same, so she wrote both numbers down. Next time the swan would follow the shorter, safer curve. Measuring first had kept them off the stones.",
    stage: "The ballroom stage had a chart of applause. One night the roses got five claps and the tulips got three. Amara drew a bar for each and saw the rose bar was taller. How many more claps did the roses get? She subtracted and found two. The chart helped the musicians see what the room loved. She added a star that meant two extra bows, and four stars meant eight bows. Data turned the noisy cheering into a picture she could read. The chandelier glowed while she pinned the chart beside the curtain. Tomorrow the bars would start again at zero, honest and empty, ready for a new chart of claps and a taller bar for the clear winner tonight. The musicians looked at the bars and chose the next song. Amara pinned the chart straight and stepped off the stage. A picture of the numbers had told the truth better than the noise.",
    corgi: "Sir Biscuit wanted to learn a bow. Amara made it a word problem so the trick had a story. He had six treats. He gave two to a friend, then found three more under the chair. She did the first step, six minus two, and then the second step, four plus three. Seven treats meant seven happy wags, but the bow came before the last treat. He dipped his nose, one paw forward, and the hall clapped. The word problem was the lesson, and the bow was the prize. Amara saved the last treat for the spin they would learn next, which would need a new story with two steps of its own before any treat was given. He held the bow until she said the last number out loud. Then he wagged, took one treat, and sat. The story had two steps, and so did the trick. Amara clapped once for the math and once for the dog."
  };
  function wordCount(text) { return String(text || "").trim().split(/\s+/).filter(Boolean).length; }
  let loreId = "terrace";
  let natureAnchor = { x: 8, z: 14 };
  let natureBobs = [];
  let gardenAsk = "height";
  let gfx = null;
  function natureQuestion() {
    const w = worldBag().nature;
    const moreFrogs = w.frog - w.fish;
    const more = Math.abs(moreFrogs);
    const prompt = moreFrogs >= 0 ? "How many more frogs than fish?" : "How many more fish than frogs?";
    const choices = [String(more), "0", String(more + 1), String(more + 2), String(w.frog + w.fish)];
    const unique = [];
    choices.forEach((c) => { if (!unique.includes(c)) unique.push(c); });
    while (unique.length < 4) unique.push(String(8 + unique.length));
    return { prompt, choices: unique.slice(0, 4), answer: 0, skill: "data" };
  }
  function activityNature() {
    placeNature();
    const w = worldBag().nature;
    const q = natureQuestion();
    return `<header><h2><span class="learn-ico">🐸</span>Nature walk</h2><button class="ghost" id="learn-exit">Exit</button></header><div class="learn-choices nat"><button data-spot="frog">Frog ${w.frog}</button><button data-spot="fish">Fish ${w.fish}</button><button data-spot="flower">Flower ${w.flower}</button></div><p class="learn-prompt">${q.prompt}</p><div class="learn-choices">${q.choices.map((c, i) => `<button data-nq="${i}">${c}</button>`).join("")}</div>`;
  }
  function activityGarden() {
    const g = gardenNow();
    placeGarden(g.cm);
    const rulerH = 196;
    const total = Math.round((g.cm / 16) * rulerH);
    const head = 26;
    const stem = Math.max(4, total - head);
    const ticks = [];
    for (let n = 0; n <= 16; n++) {
      const at = `bottom:${(n / 16) * 100}%`;
      ticks.push(n % 2 === 0 ? `<b style="${at}">${n}</b>` : `<i style="${at}"></i>`);
    }
    const asking = gardenAsk === "grew"
      ? { prompt: "How much did it grow since Day 2?", choices: gardenChoices(g.grew, "cm"), attr: "gg" }
      : { prompt: "How tall is the sunflower?", choices: gardenChoices(g.cm, "cm"), attr: "gq" };
    return `<header><h2><span class="learn-ico">🌻</span>Garden ruler</h2><button class="ghost" id="learn-exit">Exit</button></header><div class="g-stage"><div class="g-ruler">${ticks.join("")}</div><div class="g-plant" style="height:${total}px"><div class="g-head"></div><div class="g-stem" style="height:${stem}px"></div></div></div><p class="learn-prompt">${asking.prompt}</p><div class="learn-choices">${asking.choices.map((c, i) => `<button data-${asking.attr}="${i}">${c}</button>`).join("")}</div>`;
  }
  function gardenChoices(right, unit) {
    const opts = [right, right + 2, Math.max(0, right - 2), right + 4];
    const unique = [];
    opts.forEach((n) => { const label = n + " " + unit; if (!unique.includes(label)) unique.push(label); });
    while (unique.length < 4) unique.push((right + 6 + unique.length) + " " + unit);
    return unique.slice(0, 4);
  }
  function activityArt() {
    const art = worldBag().art;
    const icons = { triangle: "△", square: "□", circle: "○" };
    const corners = art.reduce((n, s) => n + ({ triangle: 3, square: 4, circle: 0 }[s] || 0), 0);
    const sideQ = ["1", "2", "4", "0"];
    const cornerChoices = gardenChoices(corners, "corners").map((c) => c.replace(" corners", ""));
    return `<header><h2><span class="learn-ico">▲</span>Art shapes</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Build a picture, then count.</p><div class="learn-shapes">${art.map((s) => s === "square" ? `<span class="fold">${icons[s]}</span>` : icons[s]).join("") || "…"}</div><div class="learn-choices"><button data-shape="triangle">Triangle</button><button data-shape="square">Square</button><button data-shape="circle">Circle</button></div><p class="learn-prompt">How many corners are in your picture?</p><div class="learn-choices">${cornerChoices.map((c, i) => `<button data-aq="${i}">${c}</button>`).join("")}</div><p class="learn-prompt">How many lines of symmetry does a square have?</p><div class="learn-choices">${sideQ.map((c, i) => `<button data-as="${i}">${c}</button>`).join("")}</div>`;
  }
  function activitySport() {
    const w = worldBag();
    return `<header><h2><span class="learn-ico">🎾</span>Keep score</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Each point adds 5. Compare the numbers.</p><div class="learn-choices"><button data-sport="tennis">Tennis ${w.tennis}</button><button data-sport="fence">Fencing ${w.fence}</button></div><p class="learn-prompt">${w.tennis === w.fence ? "Tied so far." : (w.tennis > w.fence ? "Tennis is ahead." : "Fencing is ahead.")}</p>`;
  }
  function activityBiscuit() {
    const q = trickStart("bow").question;
    const done = worldBag().tricks.bow;
    return `<header><h2><span class="learn-ico">🐶</span>Sir Biscuit</h2><button class="ghost" id="learn-exit">Exit</button></header><p id="v47-dog" style="font-size:48px;text-align:center">${done ? "🐶 bow" : "🐶"}</p><p class="learn-prompt">${q.prompt}</p><div class="learn-choices">${q.choices.map((c, i) => `<button data-trick="${i}">${c}</button>`).join("")}</div>`;
  }
  function storyPreview(text) {
    const sentences = String(text).match(/[^.!?]+[.!?]/g) || [text];
    let out = "";
    sentences.forEach((s) => { if ((out + s).length < 320) out += s; });
    return out.trim();
  }
  function activityLore() {
    const story = loreFor(loreId) || loreFor("terrace");
    return `<header><h2><span class="learn-ico">📖</span>${esc(story.title)}</h2><button class="ghost" id="learn-exit">Exit</button></header><div class="learn-story">${esc(story.text)}</div><p class="learn-prompt">${esc(story.main.prompt)}</p><div class="learn-choices">${story.main.choices.map((c, i) => `<button data-lore="${i}">${esc(c)}</button>`).join("")}</div>`;
  }
  function lorePick(choice) {
    const story = loreFor(loreId);
    const right = choice === story.main.answer;
    record("reading", right);
    if (!right) openTutorial({ skill: "reading", prompt: story.main.prompt, passage: story.text, choices: story.main.choices, answer: story.main.answer, explain: story.text.slice(0, 180) });
    else { celebrate(); show(); }
  }
  function hookLook() {
    const cam = PE.camera;
    if (!cam || cam._v47look) return;
    cam._v47look = true;
    const orig = cam.lookAt.bind(cam);
    cam.lookAt = function (x, y, z) {
      if (mode === "garden") {
        const plant = PE.scene && PE.scene.getObjectByName("v47-plant");
        if (plant) {
          const p = plant.position;
          cam.position.set(p.x + 2.8, p.y + 2.8, p.z + 8.6);
          return orig(p.x, p.y + 1.2, p.z);
        }
      }
      if (mode === "nature") {
        cam.position.set(natureAnchor.x + 3.4, 4.8, natureAnchor.z + 7.4);
        return orig(natureAnchor.x, 1.3, natureAnchor.z);
      }
      return orig(x, y, z);
    };
  }
  function openPlay(name) {
    if (name === "garden") {
      gardenAsk = "height";
      if (!worldBag().gardenDay) plantGarden(addDays(today(), -3));
      const g = gardenNow();
      placeGarden(g.cm);
      if (PE.teleport) PE.teleport(16.8, 13.4);
      hookLook();
    }
    if (name === "nature") {
      placeNature();
      if (PE.teleport) PE.teleport(natureAnchor.x + 4.6, natureAnchor.z + 3.6);
      hookLook();
    }
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
  let natureSig = "";
  function makeFrog(THREE) {
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: "#3cb44b" });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), skin);
    body.scale.set(1.2, 0.72, 1.25);
    body.position.y = 0.28;
    g.add(body);
    const white = new THREE.MeshLambertMaterial({ color: "#f7fff4" });
    const dark = new THREE.MeshLambertMaterial({ color: "#1c1c1c" });
    [-1, 1].forEach((s) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), white);
      eye.position.set(s * 0.16, 0.52, 0.1);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), dark);
      dot.position.set(0, 0.03, 0.09);
      eye.add(dot);
      g.add(eye);
    });
    [[-0.28, 0.12, 0.18], [0.28, 0.12, 0.18], [-0.2, 0.1, -0.2], [0.2, 0.1, -0.2]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), skin);
      leg.scale.set(1.5, 0.5, 0.85);
      leg.position.set(x, y, z);
      g.add(leg);
    });
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), new THREE.MeshLambertMaterial({ color: "#2e8f42", side: THREE.DoubleSide }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.03;
    g.add(pad);
    return g;
  }
  function makeFish(THREE) {
    const g = new THREE.Group();
    const gold = new THREE.MeshLambertMaterial({ color: "#f0a020" });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), gold);
    body.scale.set(1.55, 0.8, 0.7);
    body.position.y = 0.36;
    g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 4), gold);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.46, 0.36, 0);
    g.add(tail);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), new THREE.MeshLambertMaterial({ color: "#1c1c1c" }));
    eye.position.set(0.26, 0.42, 0.1);
    g.add(eye);
    return g;
  }
  function makeBloom(THREE) {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.62, 6), new THREE.MeshLambertMaterial({ color: "#2f8f3a" }));
    stem.position.y = 0.31;
    g.add(stem);
    const petal = new THREE.MeshLambertMaterial({ color: "#ff7ac8" });
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), petal);
      p.scale.set(1.35, 0.5, 0.7);
      const a = (i / 6) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.15, 0.7, Math.sin(a) * 0.15);
      g.add(p);
    }
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshLambertMaterial({ color: "#ffe14a" }));
    heart.position.y = 0.72;
    g.add(heart);
    return g;
  }
  function clearNature() {
    const gone = [];
    PE.scene.traverse((o) => { if (o.name && o.name.indexOf("v47-spot-") === 0) gone.push(o); });
    gone.forEach((o) => { if (o.parent) o.parent.remove(o); });
    natureBobs = [];
  }
  function placeNature() {
    if (!PE.stream || !PE.stream.samples || !PE.gfx43) return;
    const THREE = PE.gfx43.THREE;
    const w = worldBag().nature;
    if (w.frog + w.fish + w.flower === 0) { w.frog = 2; w.fish = 1; w.flower = 1; persist(); }
    const sig = [w.frog, w.fish, w.flower].join(",");
    if (sig === natureSig && PE.scene.getObjectByName("v47-spot-frog")) return;
    natureSig = sig;
    clearNature();
    const samples = PE.stream.samples();
    if (!samples.length) return;
    let best = samples[0], score = -1e9;
    samples.forEach((s) => { const sc = s.z - Math.abs(s.x) * 0.15; if (sc > score && s.z > 4 && s.z < 28) { score = sc; best = s; } });
    const y = PE.groundH ? PE.groundH(best.x, best.z) : 0;
    const nx = best.nx || 1, nz = best.nz || 0;
    const lineup = [];
    for (let i = 0; i < w.frog; i++) lineup.push("frog");
    for (let i = 0; i < w.fish; i++) lineup.push("fish");
    for (let i = 0; i < w.flower; i++) lineup.push("flower");
    const glowColor = { frog: "#7dff9a", fish: "#ffd36a", flower: "#ff9ad2" };
    lineup.forEach((kind, i) => {
      const group = kind === "frog" ? makeFrog(THREE) : kind === "fish" ? makeFish(THREE) : makeBloom(THREE);
      const index = lineup.slice(0, i + 1).filter((k) => k === kind).length;
      group.name = index === 1 ? "v47-spot-" + kind : "v47-spot-" + kind + "-" + index;
      const side = (i - (lineup.length - 1) / 2) * 1.7;
      const into = kind === "fish" ? -0.9 : 0.35;
      const px = best.x + nx * (2.4 + into) + nz * side;
      const pz = best.z + nz * (2.4 + into) - nx * side;
      const gy = PE.groundH ? PE.groundH(px, pz) : y;
      group.position.set(px, gy, pz);
      group.userData.baseY = gy;
      group.userData.baseX = px;
      group.userData.kind = kind;
      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 16), new THREE.MeshBasicMaterial({ color: glowColor[kind], transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.05;
      group.add(glow);
      PE.scene.add(group);
      natureBobs.push(group);
    });
    natureAnchor = { x: best.x + nx * 2.4, z: best.z + nz * 2.4 };
    bindPicks();
  }
  function bindPicks() {
    const canvas = document.getElementById("scene");
    const THREE = PE.gfx43 && PE.gfx43.THREE;
    if (!canvas || !THREE || canvas.dataset.v47pick) return;
    canvas.dataset.v47pick = "1";
    const ray = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    canvas.addEventListener("pointerdown", (ev) => {
      if (mode !== "nature" || !PE.camera) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, PE.camera);
      const hits = ray.intersectObjects(PE.scene.children, true);
      for (let i = 0; i < hits.length; i++) {
        let o = hits[i].object;
        while (o) {
          if (o.name && o.name.indexOf("v47-spot-") === 0) {
            tapNature(o.name.slice(9));
            show();
            return;
          }
          o = o.parent;
        }
      }
    });
  }
  function placeGarden(cm) {
    if (!PE.gfx43 || !PE.scene) return;
    const THREE = PE.gfx43.THREE;
    let plant = PE.scene.getObjectByName("v47-plant");
    const h = 0.35 + cm * 0.12;
    if (!plant) {
      const group = new THREE.Group();
      group.name = "v47-plant";
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1, 8), new THREE.MeshLambertMaterial({ color: "#3cb44b" }));
      stem.name = "v47-stem";
      group.add(stem);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshLambertMaterial({ color: "#ffd45a" }));
      head.position.y = 0.62;
      group.add(head);
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), new THREE.MeshLambertMaterial({ color: "#f4efe4" }));
      pole.position.set(0.7, 1.2, 0);
      group.add(pole);
      for (let n = 0; n <= 16; n++) {
        const tick = new THREE.Mesh(new THREE.BoxGeometry(n % 2 ? 0.16 : 0.28, 0.03, 0.03), new THREE.MeshLambertMaterial({ color: "#4a2c6f" }));
        tick.position.set(0.55, n * 0.15, 0);
        group.add(tick);
      }
      group.position.set(11.5, 0, 7.5);
      PE.scene.add(group);
      plant = group;
    }
    const stem = plant.getObjectByName("v47-stem");
    const gy = PE.groundH ? PE.groundH(11.5, 7.5) : 0;
    if (stem) { stem.scale.y = h; stem.position.y = h * 0.5; }
    const head = plant.children[1];
    if (head) head.position.y = h + 0.2;
    plant.position.y = gy;
  }
  const LORE_Q = {
    terrace: {
      main: ["Measuring the beds carefully helped the flowers grow better than guessing.", "Theo carried the watering can before breakfast.", "People enjoy gardens.", "The queen had planted every rose herself."],
      infer: ["Amara will use her length book again next spring.", "Theo refused to help after midday.", "The fountain was taken down that night.", "The shady bed grew the tallest leaves."]
    },
    stable: {
      main: ["Sharing the oats and apples equally kept both ponies content.", "A cat watched from the hay.", "Animals live in stables.", "Pip ate the visitor's whole share."],
      infer: ["Amara plans to use the same fair count on the next visit.", "The second pony was sent away hungry.", "The stable cat drove the ponies out.", "Pip disliked every apple."]
    },
    studio: {
      main: ["Amara built a picture from shapes and used a fold line to check it.", "She hung the picture in the hall.", "Art uses many colors.", "The teacher painted the boat for her."],
      infer: ["Other children can practice counting corners on her picture.", "Sir Biscuit tore the painting down.", "The square window had no corners.", "Amara hid the picture so nobody could see it."]
    },
    nook: {
      main: ["A quiet story shows that friends look for each other.", "Theo knocked two soft taps and one loud one.", "Libraries have many books.", "The kitten did not want a friend."],
      infer: ["Amara and Theo will meet in the nook again.", "Amara never learned a new word.", "The mouse stayed lost in the rain.", "They left the bookcase open all night."]
    },
    tea: {
      main: ["Careful counting let every guest leave with the right change.", "A cup cost three coins.", "Parties need food.", "The knight paid nothing and kept all his coins."],
      infer: ["The price card will help the next host make fair change.", "Amara's jar count did not match her card.", "The cookies were never served.", "Four places meant the table was empty."]
    },
    maze: {
      main: ["Measuring the hedges helped Amara reach the center and find her way out.", "A white rose waited in the center.", "Mazes are puzzles.", "Sir Biscuit ran ahead and got lost."],
      infer: ["Amara trusts the ribbon because the numbers matched on the way out.", "The center bed had an area of twenty.", "She never checked her count.", "The hedges moved after she left."]
    },
    training: {
      main: ["Knowing the start and end times helped Amara finish the lesson ready.", "The drill began at two fifteen.", "Practice happens indoors.", "Coach Ben said her clock was wrong."],
      infer: ["Amara left the hall when she had promised to return.", "The ribbon lesson lasted a full hour.", "She skipped writing the times on the board.", "Footwork took only five minutes."]
    },
    court: {
      main: ["Skip counting by fives and comparing numbers kept the tennis match fair.", "A ball boy brought three balls.", "Sports are fun.", "The lower number won the match."],
      infer: ["Both players would count by fives again in another game.", "Amara refused to shake hands.", "The net was moved during the last serve.", "They stopped keeping score after ten."]
    },
    observatory: {
      main: ["Place value and a repeating pattern helped Amara read the night sky.", "Four groups of ten made forty.", "Stars are far away.", "Theo said the ones digit mattered most."],
      infer: ["They will look for the comet again on the marked night.", "Amara erased the number forty-seven.", "The dome stayed open in the rain.", "The pattern was moon, moon, star."]
    },
    swans: {
      main: ["Measuring the curves first kept the swan boat off the stones.", "One ribbon was one hundred centimeters.", "Boats float on water.", "The two ribbons were exactly the same length."],
      infer: ["Next time Amara will choose the shorter curve on purpose.", "Sir Biscuit steered the boat into the stones.", "She threw both ribbons away.", "The flag ribbon was longer than a meter."]
    },
    stage: {
      main: ["A bar chart helped the musicians see which song the room loved.", "The roses got five claps.", "People like music.", "The tulip bar was the taller one."],
      infer: ["The musicians trusted the chart more than the loudest shout.", "Amara started the next chart at five.", "Each star meant ten bows.", "The chandelier went out before the chart was pinned."]
    },
    corgi: {
      main: ["A two-step story helped Sir Biscuit learn his bow.", "He started with six treats.", "Dogs can do tricks.", "Amara gave him the treat before the bow."],
      infer: ["The spin will also begin with a two-step story.", "Sir Biscuit ended with eleven treats.", "He never sat after the bow.", "The hall was empty when he dipped his nose."]
    }
  };
  function loreFor(id) {
    const text = LORE[id];
    const pack = LORE_Q[id];
    if (!text || !pack) return null;
    const ask = (prompt, choices) => ({ prompt, choices, answer: 0 });
    return {
      id, text, words: wordCount(text), title: (PE.care.DEFS.find((d) => d.id === id) || {}).name || id,
      main: ask("What is the main idea of this story?", pack.main),
      infer: ask("What can you tell that the story does not say outright?", pack.infer)
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
    const onDay2 = Math.min(16, 2 + Math.min(days, 2) * 2);
    return { cm, days, grew: cm - onDay2, spot: { x: 11.5, z: 7.5 } };
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
    }
    try { snowRoofs(); } catch (err) { /* a mesh without bounds is skipped */ }
    snowFall();
  }
  function snowRoofs() {
    const THREE = PE.gfx43.THREE;
    if (PE.scene.getObjectByName("v47-roof-snow")) return;
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    const snowMat = new THREE.MeshLambertMaterial({ color: "#f3f7ff" });
    let n = 0;
    PE.scene.updateMatrixWorld(true);
    const list = [];
    PE.scene.traverse((o) => { if (o.isMesh && o.geometry && !String(o.name || "").startsWith("v47-")) list.push(o); });
    list.sort((a, b) => (b.geometry.type === "ConeGeometry") - (a.geometry.type === "ConeGeometry"));
    list.forEach((o) => {
      if (n > 120) return;
      box.setFromObject(o);
      if (!isFinite(box.max.y)) return;
      box.getSize(size);
      box.getCenter(center);
      if (Math.hypot(center.x, center.z) > 22) return;
      if (PE.princess && Math.hypot(center.x - PE.princess.position.x, center.z - PE.princess.position.z) < 2.6) return;
      if (Math.abs(center.x) < 1.8 && center.z > 5 && center.z < 22) return;
      let parent = o.parent;
      let onPerson = false;
      while (parent) {
        if (parent === PE.princess || parent.name === "v34-biscuit" || parent.name === "v35-biscuit") onPerson = true;
        parent = parent.parent;
      }
      if (onPerson) return;
      const col = o.material && o.material.color;
      const green = col && col.g > col.r + 0.08 && col.g > 0.25;
      const cone = o.geometry.type === "ConeGeometry";
      const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), snowMat);
      if (cone && size.y > 1.2 && size.y < 8) {
        const r = Math.min(size.x, size.z) * 0.18;
        cap.scale.set(r, r * 0.42, r);
        cap.position.set(center.x, box.max.y - r * 0.42, center.z);
      } else if (green && size.y > 0.6 && size.y < 3.2 && size.x < 4) {
        const r = Math.min(size.x, size.z) * 0.42;
        cap.scale.set(r, r * 0.32, r);
        cap.position.set(center.x, box.max.y - r * 0.08, center.z);
      } else { return; }
      cap.name = "v47-roof-snow";
      PE.scene.add(cap);
      n++;
    });
  }
  function snowFall() {
    const THREE = PE.gfx43.THREE;
    if (PE.scene.getObjectByName("v47-fall")) return;
    const count = 90;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 36;
      pos[i * 3 + 1] = 2 + Math.random() * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.18 }));
    pts.name = "v47-fall";
    PE.scene.add(pts);
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
  function paintTex(draw, w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const tex = new PE.gfx43.THREE.CanvasTexture(c);
    const THREE = PE.gfx43.THREE;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  function dressGrounds() {
    if (!PE.gfx43 || !PE.scene || PE.scene.getObjectByName("v47-gfx")) return;
    const THREE = PE.gfx43.THREE;
    const root = new THREE.Group();
    root.name = "v47-gfx";
    PE.scene.add(root);
    gfx = { t: 0, scrolls: [], sways: [], wags: [], clouds: [], ao: null, dogAo: null, dog: null };
    if (!document.getElementById("v47-grade")) {
      const grade = document.createElement("div");
      grade.id = "v47-grade";
      document.body.appendChild(grade);
    }
    const stone = paintTex((g, w, h) => {
      g.fillStyle = "#f6d0e4";
      g.fillRect(0, 0, w, h);
      const bw = 64, bh = 40;
      for (let y = 0; y < h; y += bh) {
        for (let x = -((y / bh) % 2) * bw / 2; x < w; x += bw) {
          const shade = 18 + ((x + y) % 5) * 6;
          g.fillStyle = `rgb(${230 + shade % 12},${170 + shade % 10},${196 + shade % 8})`;
          g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
          g.fillStyle = "rgba(255,255,255,.35)";
          g.fillRect(x + 4, y + 4, bw - 10, 5);
          g.fillStyle = "rgba(120,50,80,.28)";
          g.fillRect(x + 4, y + bh - 8, bw - 10, 4);
        }
      }
      g.strokeStyle = "#9a5d78";
      g.lineWidth = 3;
      for (let y = 0; y <= h; y += bh) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      for (let y = 0; y < h; y += bh) {
        const off = ((y / bh) % 2) * bw / 2;
        for (let x = off; x <= w + bw; x += bw) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + bh); g.stroke(); }
      }
    }, 256, 256);
    stone.repeat.set(2.2, 2.2);
    const shingle = paintTex((g, w, h) => {
      g.fillStyle = "#8d62d6";
      g.fillRect(0, 0, w, h);
      for (let row = 0; row < 8; row++) {
        const y = row * 32;
        const off = row % 2 ? 24 : 0;
        for (let x = -48 + off; x < w; x += 48) {
          g.fillStyle = row % 2 ? "#c9a6ff" : "#b388f0";
          g.beginPath();
          g.moveTo(x, y + 30);
          g.quadraticCurveTo(x + 24, y - 4, x + 48, y + 30);
          g.fill();
          g.strokeStyle = "#5c3d96";
          g.lineWidth = 2;
          g.stroke();
        }
      }
    }, 256, 256);
    shingle.repeat.set(2, 3);
    const wood = paintTex((g, w, h) => {
      g.fillStyle = "#8a4e28";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) {
        g.fillStyle = i % 2 ? "#c48955" : "#a86a3c";
        g.fillRect(0, i * 22, w, 18);
        g.strokeStyle = "rgba(90,40,16,.45)";
        g.strokeRect(0, i * 22, w, 18);
      }
      g.fillStyle = "#4e555c";
      g.fillRect(0, 18, w, 8);
      g.fillRect(0, 70, w, 8);
    }, 128, 128);
    const paving = paintTex((g, w, h) => {
      g.fillStyle = "#b08968";
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 36) {
        const off = (y / 36) % 2 ? 28 : 0;
        for (let x = -56 + off; x < w; x += 56) {
          g.fillStyle = (x + y) % 3 ? "#f0d7b0" : "#e4c89a";
          g.fillRect(x + 3, y + 3, 50, 30);
          g.strokeStyle = "#8d6848";
          g.strokeRect(x + 3, y + 3, 50, 30);
        }
      }
    }, 256, 256);
    paving.repeat.set(3, 3);
    const caustic = paintTex((g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = "#7fd4f2";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(255,255,255,.85)";
      g.lineWidth = 3;
      for (let i = 0; i < 18; i++) {
        g.beginPath();
        g.arc((i * 47) % w, (i * 31) % h, 10 + (i % 4) * 6, 0.2, 2.4);
        g.stroke();
      }
      g.fillStyle = "rgba(255,255,255,.75)";
      for (let i = 0; i < 30; i++) { g.beginPath(); g.arc((i * 61) % w, (i * 43) % h, 2, 0, 7); g.fill(); }
    }, 256, 256);
    const moss = paintTex((g, w, h) => {
      g.fillStyle = "#d7d2ca";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 24; i++) {
        g.fillStyle = "rgba(160,156,148,.22)";
        g.beginPath();
        g.arc((i * 47) % w, (i * 29) % h, 5, 0, 7);
        g.fill();
      }
      g.fillStyle = "rgba(96,122,78,.38)";
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        g.ellipse(24 + (i * 34) % (w - 48), 6 + (i * 9) % Math.floor(h * 0.2), 9, 4, i * 0.4, 0, 7);
        g.fill();
      }
    }, 256, 256);
    const sky = paintTex((g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#8ec5ff");
      grd.addColorStop(0.55, "#d7ecff");
      grd.addColorStop(1, "#ffe7c8");
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255,255,255,.9)";
      for (let i = 0; i < 9; i++) {
        const x = 40 + (i * 97) % (w - 80);
        const y = 30 + (i * 41) % (h * 0.55);
        g.beginPath();
        g.ellipse(x, y, 70, 28, 0, 0, 7);
        g.ellipse(x + 40, y + 6, 50, 22, 0, 0, 7);
        g.fill();
      }
    }, 512, 256);
    const stoneMat = new THREE.MeshLambertMaterial({ map: stone, color: "#ffffff" });
    const roofMat = new THREE.MeshLambertMaterial({ map: shingle, color: "#ffffff" });
    const woodMat = new THREE.MeshLambertMaterial({ map: wood, color: "#ffffff" });
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    PE.scene.traverse((o) => {
      if (!o.isMesh || !o.material || !o.material.color) return;
      const hex = o.material.color.getHexString();
      box.setFromObject(o);
      if (!isFinite(box.max.y)) return;
      box.getSize(size);
      box.getCenter(center);
      const near = Math.hypot(center.x, center.z + 1) < 16;
      if (near && (hex === "f9c2e4" || hex === "ffc6df") && size.y > 2 && size.x < 5) o.material = stoneMat;
      if (near && (hex === "b57bff" || hex === "c99bff") && o.geometry.type === "ConeGeometry" && center.z > -2) o.material = roofMat;
    });
    const bridge = PE.scene.getObjectByName("v34-drawbridge");
    if (bridge) bridge.traverse((o) => { if (o.isMesh) o.material = woodMat; });
    PE.scene.traverse((o) => {
      if (!o.isMesh || o.geometry.type !== "SphereGeometry" || !o.geometry.parameters) return;
      const segs = o.geometry.parameters.widthSegments || 8;
      const hex = o.material && o.material.color && o.material.color.getHexString();
      if (hex === "d7cbb8" && segs <= 12) {
        const box = new THREE.Box3().setFromObject(o);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const minDim = Math.min(size.x, size.y, size.z);
        if (maxDim < 1.5) return;
        if (maxDim > 12 && minDim > 4) return;
        const parentScale = new THREE.Vector3(1, 1, 1);
        if (o.parent) o.parent.getWorldScale(parentScale);
        const tall = Math.max(0.35, Math.min(size.x, size.y, size.z)) * 0.6;
        o.geometry = new THREE.SphereGeometry(1, 24, 16);
        o.scale.set(tall * 0.42 / parentScale.x, tall * 0.32 / parentScale.y, tall * 0.42 / parentScale.z);
        const mat = o.material.clone();
        mat.map = moss;
        mat.color.set("#e7e2d8");
        o.material = mat;
      }
      if (o.geometry.parameters.radius > 80 && o.material && o.material.color) o.material.color.set("#d7ecff");
    });
    const chunky = [];
    PE.scene.traverse((o) => {
      if (!o.isMesh || o.geometry.type !== "BufferGeometry") return;
      const box = new THREE.Box3().setFromObject(o);
      if (!isFinite(box.max.y)) return;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      if (size.x > 4 && size.x < 9 && size.y > 3 && size.y < 8 && center.y > 1 && center.y < 6 && Math.hypot(center.x, center.z) < 36) chunky.push({ o, center, r: Math.min(size.x, size.y, size.z) * 0.28 });
    });
    chunky.forEach(({ o, center, r }) => {
      o.visible = false;
      if (Math.abs(center.x) < 16 && center.z > 8 && center.z < 26) center.x += center.x >= 0 ? 4 : -4;
      const rock = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshLambertMaterial({ map: moss, color: "#d9d4cc" }));
      rock.position.copy(center);
      root.add(rock);
    });
    PE.scene.traverse((o) => {
      if (!o.isLight) return;
      if (o.isDirectionalLight && o.intensity > 1) { o.color.set("#ffc98a"); o.intensity = 2.05; }
      if (o.isHemisphereLight && o.intensity > 1) { o.color.set("#fff4e4"); o.groundColor.set("#b7d98a"); o.intensity = 1.2; }
    });
    if (PE.scene.fog && PE.scene.fog.color) PE.scene.fog.color.set("#f4ead8");
    const frameMat = new THREE.MeshLambertMaterial({ color: "#6a3048" });
    const glowMat = new THREE.MeshLambertMaterial({ color: "#fff3c4", emissive: "#ffd56a", emissiveIntensity: 0.85 });
    [[-4.5, 2.5, 0], [4.5, 2.5, 0], [-4.5, -4.5, Math.PI], [4.5, -4.5, Math.PI], [0, -1.5, 0]].forEach(([x, z, yaw]) => {
      [3.2, 5.4].forEach((y) => {
        const win = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.86, 0.08), frameMat);
        const glow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.58, 0.1), glowMat);
        glow.position.z = 0.02;
        win.add(frame); win.add(glow);
        const out = 1.55;
        win.position.set(x + Math.sin(yaw) * out, y, z + Math.cos(yaw) * out);
        win.rotation.y = yaw;
        root.add(win);
      });
    });
    const cloth = new THREE.MeshLambertMaterial({ color: "#ff4f93", side: THREE.DoubleSide });
    [[-4.5, 9.1, 4.1], [4.5, 9.1, 4.1], [-6.1, 9.1, -4.5], [6.1, 9.1, -4.5]].forEach(([x, y, z]) => {
      const ban = new THREE.Group();
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.9), cloth);
      flag.position.y = -1.05;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), new THREE.MeshLambertMaterial({ color: "#ffe27a" }));
      ban.add(pole); ban.add(flag);
      ban.position.set(x, y, z);
      root.add(ban);
      gfx.sways.push(ban);
    });
    const pathMat = new THREE.MeshLambertMaterial({ map: paving, color: "#ffffff" });
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 16), pathMat);
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(0, 0.07, 16);
    root.add(walk);
    if (bridge) {
      const iron = new THREE.MeshLambertMaterial({ color: "#3e4650" });
      for (let i = 0; i < 4; i++) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.16), iron);
        band.position.set(0, 0.28, -1.1 + i * 0.7);
        bridge.add(band);
      }
    }
    function ao(x, z, r) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 14), new THREE.MeshBasicMaterial({ color: "#243018", transparent: true, opacity: 0.16, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, (PE.groundH ? PE.groundH(x, z) : 0) + 0.04, z);
      m.scale.setScalar(r);
      root.add(m);
      return m;
    }
    ao(0, -1, 4.4);
    ao(0, 6.4, 1.5);
    const dog = PE.scene.getObjectByName("v34-biscuit");
    gfx.dog = dog;
    function watch(mesh, speed) {
      if (!mesh || !mesh.material || mesh.material.userData.v47scroll) return;
      mesh.material.map = caustic;
      mesh.material.needsUpdate = true;
      mesh.material.userData.v47scroll = 1;
      gfx.scrolls.push({ map: caustic, speed });
    }
    PE.scene.traverse((o) => {
      if ((o.name === "moat-ripple" || o.name === "stream-spark") && o.material && o.material.map && !o.material.userData.v47scroll) {
        o.material.userData.v47scroll = 1;
        gfx.scrolls.push({ map: o.material.map, speed: 0.16 });
      }
      if (o.name === "stream-fall" && o.material && o.material.map) gfx.scrolls.push({ map: o.material.map, speed: 0.35 });
    });
    const padMat = new THREE.MeshLambertMaterial({ color: "#2f9a45" });
    const bloomMat = new THREE.MeshLambertMaterial({ color: "#ff7ab8" });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const x = Math.cos(a) * 6.4;
      const z = -1 + Math.sin(a) * 6.4;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.42, 8), padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(x, 0.36, z);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), i % 2 ? bloomMat : new THREE.MeshLambertMaterial({ color: "#ffe27a" }));
      bloom.position.set(x, 0.48, z);
      root.add(pad); root.add(bloom);
    }
    const foamCount = 48;
    const foamPos = new Float32Array(foamCount * 3);
    const fall = PE.scene.getObjectByName("stream-fall");
    const fp = new THREE.Vector3(-8.7, 0.5, -9.7);
    if (fall) fall.getWorldPosition(fp);
    for (let i = 0; i < foamCount; i++) {
      const edge = i < 24;
      const a = (i / 24) * Math.PI * 2;
      if (edge) {
        const rad = i % 2 ? 7.9 : 12.1;
        foamPos[i * 3] = Math.cos(a) * rad;
        foamPos[i * 3 + 1] = 0.4;
        foamPos[i * 3 + 2] = -1 + Math.sin(a) * rad;
      } else {
        foamPos[i * 3] = fp.x + (Math.random() - 0.5) * 2.4;
        foamPos[i * 3 + 1] = fp.y + Math.random() * 1.2;
        foamPos[i * 3 + 2] = fp.z + (Math.random() - 0.5) * 2.4;
      }
    }
    const foamGeo = new THREE.BufferGeometry();
    foamGeo.setAttribute("position", new THREE.BufferAttribute(foamPos, 3));
    const foam = new THREE.Points(foamGeo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.28 }));
    foam.name = "v47-moat-foam";
    root.add(foam);
    const dummy = new THREE.Object3D();
    const petalColors = ["#ff5fa2", "#ffd24a", "#ffffff", "#c084fc"];
    petalColors.forEach((color, ci) => {
      const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 7, 5), new THREE.MeshLambertMaterial({ color }), 10);
      for (let i = 0; i < 10; i++) {
        const n = ci * 10 + i;
        const a = (n / 40) * Math.PI * 2;
        const rad = 13.6 + (n % 4) * 0.45;
        const x = Math.cos(a) * rad;
        const z = -1 + Math.sin(a) * rad;
        const wet = PE.stream && PE.stream.inDeep && PE.stream.inDeep(x, z);
        dummy.position.set(x, (PE.groundH ? PE.groundH(x, z) : 0) + 0.28, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(wet ? 0 : 1.15, wet ? 0 : 0.45, wet ? 0 : 1.15);
        dummy.updateMatrix();
        flowers.setMatrixAt(i, dummy.matrix);
      }
      root.add(flowers);
    });
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9, depthWrite: false }));
      cloud.scale.set(5.5, 1.3, 2.6);
      cloud.position.set(Math.cos(a) * 26, 15 + (i % 3), -1 + Math.sin(a) * 22);
      root.add(cloud);
      gfx.clouds.push(cloud);
    }
    if (PE.princess) {
      const trim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 20), new THREE.MeshLambertMaterial({ color: "#ffe27a", emissive: "#ffd24a", emissiveIntensity: 0.7 }));
      trim.rotation.x = Math.PI / 2;
      trim.position.y = 1.2;
      PE.princess.add(trim);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshLambertMaterial({ color: "#fff6c4", emissive: "#fff1a0", emissiveIntensity: 0.95 }));
      shine.position.set(0.1, 1.52, 0.08);
      PE.princess.add(shine);
    }
    if (dog) {
      let head = null;
      let best = -999;
      dog.traverse((o) => {
        if (o.isMesh && o.geometry && o.geometry.type === "SphereGeometry" && o.position.y > best) { best = o.position.y; head = o; }
      });
      if (head && head.geometry.parameters) {
        const r = head.geometry.parameters.radius || 0.1;
        const eyeMat = new THREE.MeshLambertMaterial({ color: "#1b1b1b" });
        [-1, 1].forEach((s) => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(r * 0.09, 8, 6), eyeMat);
          eye.position.set(s * r * 0.28, r * 0.1, r * 0.78);
          head.add(eye);
          const dot = new THREE.Mesh(new THREE.SphereGeometry(r * 0.06, 6, 4), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
          dot.position.set(0, 0, r * 0.12);
          eye.add(dot);
        });
      }
      const tail = new THREE.Group();
      const fur = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.22, 6), new THREE.MeshLambertMaterial({ color: "#e98e35" }));
      fur.position.y = 0.08;
      tail.add(fur);
      tail.position.set(0, 0.16, -0.16);
      dog.add(tail);
      gfx.wags.push(tail);
    }
  }
  ui();
  bag();
  dressGrounds();
  requestAnimationFrame(loop);

  PE.learn = {
    BUILD_SKILL,
    SKILL_NAME,
    needsGate: (id) => !!(BUILD_SKILL[id] && !bag().ready[id] && !bag().passed[id]),
    openGate,
    openPassage,
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
    nature: {
      tap: tapNature,
      question: natureQuestion,
      where: () => natureAnchor,
      setCounts: (counts) => {
        const w = worldBag().nature;
        ["frog", "fish", "flower"].forEach((k) => { if (counts[k] != null) w[k] = counts[k]; });
        natureSig = "";
        persist();
        placeNature();
        return Object.assign({}, w);
      }
    },
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
