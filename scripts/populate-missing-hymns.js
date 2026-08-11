const fs = require('fs');
const path = require('path');

const hymnsPath = path.join(__dirname, '../lib/rccg-hymns.json');
const hymns = JSON.parse(fs.readFileSync(hymnsPath, 'utf8'));

const updates = {
  11: {
    verses: [
      "Mercy and judgment will I sing;\nTo Thee, O Lord, my voice I raise;\nTo Thee my earliest offerings bring,\nAnd tune my heart to sing Thy praise.",
      "O when wilt Thou unto me come?\nI long Thy sacred presence, Lord,\nWithin my heart, within my home,\nTo guide my life and keep Thy Word.",
      "No wicked thing shall stand my sight,\nNo deceitful worker dwell within;\nThy truth shall be my pure delight,\nAnd save my soul from every sin."
    ]
  },
  14: {
    verses: [
      "Sweet is the work, my God, my King,\nTo praise Thy Name, give thanks and sing;\nTo show Thy love by morning light,\nAnd talk of all Thy truth at night.",
      "Sweet is the day of sacred rest;\nNo mortal cares shall seize my breast;\nO may my heart in tune be found,\nLike David's harp of solemn sound!",
      "My heart shall triumph in the Lord,\nAnd bless His works, and bless His Word;\nThy works of grace, how bright they shine!\nHow deep Thy counsels, how divine!",
      "Then shall I share a glorious part,\nWhen grace hath well refined my heart,\nAnd fresh supplies of joy are shed,\nLike holy oil, to cheer my head."
    ]
  },
  16: {
    verses: [
      "Jesus, stand among us\nIn Thy risen power;\nLet Thy sweet peace breathe on us\nIn this sacred hour.",
      "Breathe Thy Holy Spirit\nInto every heart;\nBid the fears and worries\nFrom our souls depart.",
      "Thus with joy receiving\nThy divine embrace,\nWe shall go forth serving\nSaved by grace to grace."
    ]
  },
  17: {
    verses: [
      "O worship the Lord in the beauty of holiness,\nBow down before Him, His glory proclaim;\nWith gold of obedience, and incense of lowliness,\nKneel and adore Him, the Lord is His Name.",
      "Low at His feet lay thy burden of carefulness,\nHigh on His heart He will bear it for thee,\nComfort thy sorrow, and answer thy prayerfulness,\nGuiding thy steps as he set thee free.",
      "Fear not to enter His courts in the slenderness\nOf the poor wealth thou wouldst reckon as thine;\nTruth in its beauty, and love in its tenderness,\nThese are the offerings to lay on His shrine.",
      "These, though we bring them in trembling and fearfulness,\nHe will accept for the Name that is dear;\nMornings of joy shall be untroubled by tearfulness,\nTrust in His mercy, for Jesus is near."
    ]
  },
  18: {
    verses: [
      "Come, ye that love the Lord,\nAnd let your joys be known;\nJoin in a song with sweet accord,\nAnd thus surround the throne.",
      "Let those refuse to sing\nWho never knew our God;\nBut children of the heavenly King\nMay speak their joys abroad.",
      "The hill of Zion yields\nA thousand sacred sweets\nBefore we reach the heavenly fields,\nOr walk the golden streets.",
      "Then let our songs abound,\nAnd every tear be dry;\nWe’re marching through Immanuel’s ground\nTo fairer worlds on high.",
      "[Refrain]\nWe’re marching to Zion,\nBeautiful, beautiful Zion;\nWe’re marching upward to Zion,\nThe beautiful city of God."
    ]
  },
  19: {
    verses: [
      "The heav'nly host are all astir,\nTo praise the Lord and King;\nWith harp and voice and trumpets clear,\nTheir loud hosannas sing.",
      "And we on earth below would join\nThe grand celestial choir,\nTo magnify the Name divine,\nWith hearts of holy fire.",
      "Praise God from whom all blessings flow,\nPraise Him all creatures here below,\nPraise Him above, ye heav'nly host,\nPraise Father, Son, and Holy Ghost."
    ]
  },
  20: {
    verses: [
      "All hail the power of Jesus' name!\nLet angels prostrate fall;\nBring forth the royal diadem,\nAnd crown Him Lord of all.\nBring forth the royal diadem,\nAnd crown Him Lord of all!",
      "Crown Him, ye martyrs of our God,\nWho from His altar call;\nExtol the Stem of Jesse's rod,\nAnd crown Him Lord of all.\nExtol the Stem of Jesse's rod,\nAnd crown Him Lord of all!",
      "Ye seed of Israel's chosen race,\nYe ransomed from the fall,\nHail Him who saves you by His grace,\nAnd crown Him Lord of all.\nHail Him who saves you by His grace,\nAnd crown Him Lord of all!",
      "Sinners, whose love can ne'er forget\nThe wormwood and the gall,\nGo spread your trophies at His feet,\nAnd crown Him Lord of all.\nGo spread your trophies at His feet,\nAnd crown Him Lord of all!",
      "Let every kindred, every tribe\nOn this terrestrial ball,\nTo Him all majesty ascribe,\nAnd crown Him Lord of all.\nTo Him all majesty ascribe,\nAnd crown Him Lord of all!",
      "O that with yonder sacred throng\nWe at His feet may fall!\nWe'll join the everlasting song,\nAnd crown Him Lord of all.\nWe'll join the everlasting song,\nAnd crown Him Lord of all!"
    ]
  },
  22: {
    verses: [
      "The God of Abraham praise,\nWho reigns enthroned above;\nAncient of everlasting days,\nAnd God of love;\nJehovah, Great I AM!\nBy earth and heav'n confessed;\nI bow and bless the sacred name\nForever blessed.",
      "The God of Abraham praise,\nAt whose supreme command\nFrom earth I rise and seek the joys\nAt His right hand;\nI all on earth forsake,\nIts wisdom, fame, and power;\nAnd Him my only portion make,\nMy shield and tower.",
      "The heavenly land I see,\nWith peace and plenty blest;\nA land of sacred liberty,\nAnd endless rest;\nThere milk and honey flow,\nAnd oil and wine abound,\nAnd trees of life forever grow\nWith mercy crowned."
    ]
  },
  23: {
    verses: [
      "O for a thousand tongues to sing\nMy great Redeemer's praise,\nThe glories of my God and King,\nThe triumphs of His grace!",
      "My gracious Master and my God,\nAssist me to proclaim,\nTo spread through all the earth abroad\nThe honors of Thy name.",
      "Jesus! the name that charms our fears,\nThat bids our sorrows cease;\n'Tis music in the sinner's ears,\n'Tis life, and health, and peace.",
      "He breaks the power of canceled sin,\nHe sets the prisoner free;\nHis blood can make the foulest clean,\nHis blood availed for me."
    ]
  }
};

let updatedCount = 0;
hymns.forEach(h => {
  if (updates[h.number]) {
    h.verses = updates[h.number].verses;
    h.verse_count = updates[h.number].verses.length;
    updatedCount++;
  }
});

fs.writeFileSync(hymnsPath, JSON.stringify(hymns, null, 2), 'utf8');
console.log(`Successfully updated ${updatedCount} hymns with full lyrics!`);
