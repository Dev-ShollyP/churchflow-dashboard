/**
 * Fix hymns with repeated chorus/refrain — chorus should appear ONCE at the end only.
 * Also fixes multi-hymn entries in the database.
 */

const fs = require('fs');
const path = require('path');

const hymnsPath = path.join(__dirname, '../lib/rccg-hymns.json');
const hymns = JSON.parse(fs.readFileSync(hymnsPath, 'utf8'));

// Updated entries: chorus appears ONCE at the end, not after every verse
const FIXED_HYMNS = {
  219: {
    verses: [
      "There shall be showers of blessing:\nThis is the promise of love;\nThere shall be seasons refreshing,\nSent from the Savior above.",
      "There shall be showers of blessing,\nPrecious reviving again;\nOver the hills and the valleys,\nSound of abundance of rain.",
      "There shall be showers of blessing;\nSend them upon us, O Lord;\nGrant to us now a refreshing,\nCome, and now honor Thy Word.",
      "There shall be showers of blessing:\nOh, that today they might fall,\nNow as to God we're confessing,\nNow as on Jesus we call!",
      "[Refrain]\nShowers of blessing,\nShowers of blessing we need:\nMercy-drops round us are falling,\nBut for the showers we plead."
    ]
  },
  340: {
    verses: [
      "Blessed assurance, Jesus is mine!\nO what a foretaste of glory divine!\nHeir of salvation, purchase of God,\nBorn of His Spirit, washed in His blood.",
      "Perfect submission, perfect delight,\nVisions of rapture now burst on my sight;\nAngels descending, bring from above\nEchoes of mercy, whispers of love.",
      "Perfect submission, all is at rest,\nI in my Saviour am happy and blest;\nWatching and waiting, looking above,\nFilled with His goodness, lost in His love.",
      "[Refrain]\nThis is my story, this is my song,\nPraising my Saviour all the day long;\nThis is my story, this is my song,\nPraising my Saviour all the day long."
    ]
  },
  115: {
    verses: [
      "\"Great is Thy faithfulness,\" O God my Father,\nThere is no shadow of turning with Thee;\nThou changest not, Thy compassions, they fail not;\nAs Thou hast been Thou forever wilt be.",
      "Summer and winter, and springtime and harvest,\nSun, moon and stars in their courses above\nJoin with all nature in manifold witness\nTo Thy great faithfulness, mercy and love.",
      "Pardon for sin and a peace that endureth,\nThine own dear presence to cheer and to guide;\nStrength for today and bright hope for tomorrow,\nBlessings all mine, with ten thousand beside!",
      "[Refrain]\nGreat is Thy faithfulness! Great is Thy faithfulness!\nMorning by morning new mercies I see;\nAll I have needed Thy hand hath provided—\nGreat is Thy faithfulness, Lord, unto me!"
    ]
  },
  136: {
    verses: [
      "To God be the glory, great things He hath done;\nSo loved He the world that He gave us His Son,\nWho yielded His life an atonement for sin,\nAnd opened the life-gate that all may go in.",
      "O perfect redemption, the purchase of blood!\nTo every believer the promise of God;\nThe vilest offender who truly believes,\nThat moment from Jesus a pardon receives.",
      "Great things He hath taught us, great things He hath done,\nAnd great our rejoicing through Jesus the Son;\nBut purer and higher and greater will be\nOur wonder, our rapture, when Jesus we see.",
      "[Refrain]\nPraise the Lord! Praise the Lord! Let the earth hear His voice!\nPraise the Lord! Praise the Lord! Let the people rejoice!\nO come to the Father through Jesus the Son,\nAnd give Him the glory, great things He hath done!"
    ]
  },
  223: {
    verses: [
      "O spread the tidings 'round, wherever man is found,\nWherever human hearts and human woes abound;\nLet ev'ry Christian tongue proclaim the joyful sound:\nThe Comforter has come!",
      "The long, long night is past, the morning breaks at last,\nAnd hushed the dreadful wail and fury of the blast,\nAs o'er the golden hills the day advances fast!\nThe Comforter has come!",
      "Lo, the great King of kings, with healing in His wings,\nTo ev'ry captive soul a full deliv'rance brings;\nAnd through the vacant cells the song of triumph rings;\nThe Comforter has come!",
      "O boundless love divine! How shall this tongue of mine\nTo wond'ring mortals tell the matchless grace divine—\nThat I, a child of hell, should in His image shine!\nThe Comforter has come!",
      "Sing till the echoes fly above the vaulted sky,\nAnd all the saints above to all below reply,\nIn strains of endless love, the song that ne'er will die:\nThe Comforter has come!",
      "[Refrain]\nThe Comforter has come, the Comforter has come!\nThe Holy Ghost from Heav'n, the Father's promise giv'n;\nO spread the tidings 'round, wherever man is found—\nThe Comforter has come!"
    ]
  },
  10: {
    verses: [
      "There is sunshine in the valley today,\nThere is brightness along the way;\nFor the Saviour is near, all our trials to cheer,\nAnd to wipe every tear away.",
      "Though the shadows may gather around,\nYet in Jesus true comfort is found;\nHe will lighten our load on the heavenly road,\nAnd His blessings will ever abound.",
      "In His presence is fullness of joy,\nPraise eternal our lips shall employ;\nWith the redeemed above in the kingdom of love,\nNothing ever our peace can destroy.",
      "[Refrain]\nThere is sunshine, blessed sunshine,\nIn the valley where Jesus abides;\nThere is sunshine, heavenly sunshine,\nWhen we walk with the Saviour as guides."
    ]
  },
  13: {
    verses: [
      "We are never, never weary of the grand old song,\nGlory to God, hallelujah!\nWe can sing it loud and cheerily the whole day long,\nGlory to God, hallelujah!",
      "We are dwelling in the Beulah land of light divine,\nGlory to God, hallelujah!\nWhere the radiant beams of heavenly glory shine,\nGlory to God, hallelujah!",
      "We will praise Him for the victory again and again,\nGlory to God, hallelujah!\nWe will tell the wondrous story to the sons of men,\nGlory to God, hallelujah!",
      "[Refrain]\nO, the children of the Lord have a right to shout and sing,\nFor the Lord is on the throne, and He reigns as King!\nGlory to God, hallelujah!"
    ]
  }
};

let fixedCount = 0;
hymns.forEach(hymn => {
  if (FIXED_HYMNS[hymn.number]) {
    hymn.verses = FIXED_HYMNS[hymn.number].verses;
    fixedCount++;
  }
});

fs.writeFileSync(hymnsPath, JSON.stringify(hymns, null, 2), 'utf8');
console.log(`✅ Fixed ${fixedCount} hymns — chorus now appears once at the end.`);
console.log('Fixed hymn numbers:', Object.keys(FIXED_HYMNS).join(', '));
