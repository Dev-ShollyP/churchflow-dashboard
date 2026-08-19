const fs = require('fs');
const path = require('path');

const hymnsPath = path.join(__dirname, '..', 'lib', 'rccg-hymns.json');
const hymns = JSON.parse(fs.readFileSync(hymnsPath, 'utf8'));

const anthems = [
  {
    number: 100,
    title: 'RCCG Anthem (The Redeemed Anthem)',
    scripture: 'Revelation 5:9',
    category: 'ANTHEM',
    verse_count: 1,
    verses: [
      'We are the Redeemed, Some are called of God\nWashed in the blood of Jesus, Saved by His grace\nLet us praise the Lord, Let us praise His name\nFor He is the Lord of lords, He is the King of kings\nCome and join us now, Come and praise His name\nCome and give Him glory, For what He has done\nPraise the Lord! (Hallelujah), Praise the Lord! (Hallelujah)\nPraise the Lord! Hallelujah, Praise the Lord.'
    ]
  },
  {
    number: 101,
    title: 'RCCG Sunday School Anthem',
    scripture: '2 Timothy 2:15',
    category: 'ANTHEM',
    verse_count: 5,
    verses: [
      "O Sunday School, on the Lord's day,\nO how I love Thee well,\nI am happy, it makes me glad\nTo rejoice at Thy birth.",
      "O Sunday School, on the Lord's day,\nThy friendship suits me well,\nBoth young and old will sing Thy song,\nWe long for Sunday School.",
      "O Sunday School, on the Lord's day,\nChrist was Thy first teacher,\nThe Holy Spirit, great teacher,\nDoes manifest in thee.",
      "O Sunday School, on the Lord's day,\nThis pledge we give today,\nThat to God's word we will be true,\nThrough Sunday School with love.",
      "O Sunday School, on the Lord's day,\nThy counsel's so divine,\nLead me to know the holy truth,\nTill with my Lord I reign."
    ]
  },
  {
    number: 102,
    title: 'RCCG House Fellowship Anthem',
    scripture: 'Acts 2:46',
    category: 'ANTHEM',
    verse_count: 1,
    verses: [
      'O House Fellowship, where God meets with man,\nA place of love, of prayer and grace divine,\nWe gather in unity, one big family,\nRejoicing together in Christ the King.'
    ],
    refrain: 'House Fellowship, House Fellowship,\nA place of joy and fellowship with God,\nWhere burdens are lifted, and lives are transformed,\nGlory to Jesus our Savior and Lord.'
  }
];

for (const a of anthems) {
  if (!hymns.find(h => h.title.toLowerCase().includes(a.title.toLowerCase()))) {
    hymns.push(a);
  }
}

fs.writeFileSync(hymnsPath, JSON.stringify(hymns, null, 2));
console.log('Anthems added! Total count:', hymns.length);
