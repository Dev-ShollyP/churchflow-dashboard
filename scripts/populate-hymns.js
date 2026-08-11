/**
 * Script to populate the RCCG hymns.json with verified, full hymn lyrics
 * for the most commonly searched/sung hymns in RCCG worship.
 * Run: node scripts/populate-hymns.js
 */

const fs = require('fs');
const path = require('path');

const hymnPath = path.join(__dirname, '../lib/rccg-hymns.json');
const hymns = JSON.parse(fs.readFileSync(hymnPath, 'utf8'));

// Map of hymn number → { verses: string[], chorus?: string }
// Each verse includes chorus inline where applicable for WhatsApp display
const HYMN_DATA = {
  // ─── MORNING HYMNS ──────────────────────────────────────────────────────────
  2: {
    verses: [
      "Holy Father, hear me,\nFor Thy mercy's sake;\nHear me, gracious Father,\nWhile my prayer I make.",
      "As the morning breaketh,\nLord, I come to Thee;\nIn the name of Jesus,\nHear my morning plea.",
      "For the sin of yesterday,\nLord, forgive me now;\nAt Thy throne of mercy,\nHumbly I bow.",
      "Keep me through this day, Lord,\nIn the narrow way;\nLet Thy grace and wisdom\nGuide me day by day.",
    ],
  },
  3: {
    verses: [
      "From all the dangers of the night,\nPreserved by Thy almighty hand,\nAgain I see the morning light,\nAgain before Thy face I stand.",
      "To Thee my grateful heart would raise\nA song of triumph and of praise;\nFor Thy protection all the night,\nAnd for the morning's cheerful light.",
      "O Lord, my strength, be Thou my guide,\nThrough all this day of toil and care;\nBe Thou my help, my guard, my pride,\nAnd keep me in Thy tender prayer.",
      "To Father, Son, and Holy Ghost,\nFor ever be all glory given;\nWith all the bright angelic host,\nWho praise Thee night and day in heaven.",
    ],
  },
  6: {
    verses: [
      "Come to me, Lord, when first I wake,\nBefore my soul its armour take;\nBefore my thoughts on any thing,\nBut Thee, the Lord of all, begin.",
      "Come with Thy presence and Thy grace,\nBefore I seek a single face;\nLet me behold Thee, Lord, and then\nGo forth to meet my fellow men.",
      "Come, that I may not step aside\nFrom Thee this day, my heavenly Guide;\nBut ever walk with Thee in sight,\nFrom morning's dawn to closing night.",
      "Come, lest the world should make me lose\nThe path Thou wouldst have me to choose;\nLet Thy dear face be ever near\nTo guide and guard through mortal fear.",
      "Come, that the final hour may find\nMe blameless still in heart and mind;\nThat I may stand at Thy right hand\nAmong the blessed of every land.",
    ],
  },

  // ─── WORSHIP & PRAISE ────────────────────────────────────────────────────────
  21: {
    verses: [
      "Praise, my soul, the King of Heaven;\nTo His feet thy tribute bring;\nRansom'd, heal'd, restor'd, forgiven,\nEvermore His praises sing:\nAlleluia! Alleluia!\nPraise the everlasting King.",
      "Praise Him for His grace and favour\nTo our fathers in distress;\nPraise Him still the same forever,\nSlow to chide, and swift to bless:\nAlleluia! Alleluia!\nGlorious in His faithfulness.",
      "Father-like, He tends and spares us;\nWell our feeble frame He knows;\nIn His hands He gently bears us,\nRescues us from all our foes:\nAlleluia! Alleluia!\nWidely as His mercy flows.",
      "Angels, help us to adore Him;\nYe behold Him face to face;\nSun and moon, bow down before Him,\nDwellers all in time and space:\nAlleluia! Alleluia!\nPraise with us the God of grace.",
    ],
  },
  24: {
    verses: [
      "O worship the King, all glorious above,\nO gratefully sing His power and His love;\nOur Shield and Defender, the Ancient of Days,\nPavillioned in splendour and girded with praise.",
      "O tell of His might, O sing of His grace,\nWhose robe is the light, whose canopy space;\nHis chariots of wrath the deep thunderclouds form,\nAnd dark is His path on the wings of the storm.",
      "The earth with its store of wonders untold,\nAlmighty, Thy power hath founded of old;\nEsablished it fast by a changeless decree,\nAnd round it hath cast, like a mantle, the sea.",
      "Thy bountiful care what tongue can recite?\nIt breathes in the air, it shines in the light;\nIt streams from the hills, it descends to the plain,\nAnd sweetly distills in the dew and the rain.",
      "Frail children of dust, and feeble as frail,\nIn Thee do we trust, nor find Thee to fail;\nThy mercies how tender, how firm to the end,\nOur Maker, Defender, Redeemer and Friend.",
      "O measureless Might! Ineffable Love!\nWhile angels delight to worship above,\nThy ransomed creation, though feeble their lays,\nWith true adoration shall lisp to Thy praise.",
    ],
  },

  // ─── CHRIST / THE LORD JESUS ────────────────────────────────────────────────
  147: {
    verses: [
      "When I survey the wondrous cross\nOn which the Prince of glory died,\nMy richest gain I count but loss,\nAnd pour contempt on all my pride.",
      "Forbid it, Lord, that I should boast,\nSave in the death of Christ, my God;\nAll the vain things that charm me most,\nI sacrifice them to His blood.",
      "See from His head, His hands, His feet,\nSorrow and love flow mingled down;\nDid e'er such love and sorrow meet,\nOr thorns compose so rich a crown?",
      "His dying crimson like a robe\nSpreads o'er His body on the tree;\nThen am I dead to all the globe,\nAnd all the globe is dead to me.",
      "Were the whole realm of nature mine,\nThat were a present far too small;\nLove so amazing, so divine,\nDemands my soul, my life, my all.",
    ],
  },
  148: {
    verses: [
      "All hail the power of Jesus' name!\nLet angels prostrate fall;\nBring forth the royal diadem,\nAnd crown Him Lord of all;\nBring forth the royal diadem,\nAnd crown Him Lord of all.",
      "Ye chosen seed of Israel's race,\nYe ransomed from the fall,\nHail Him who saves you by His grace,\nAnd crown Him Lord of all;\nHail Him who saves you by His grace,\nAnd crown Him Lord of all.",
      "Let every kindred, every tribe,\nOn this terrestrial ball,\nTo Him all majesty ascribe,\nAnd crown Him Lord of all;\nTo Him all majesty ascribe,\nAnd crown Him Lord of all.",
      "O that with yonder sacred throng\nWe at His feet may fall!\nWe'll join the everlasting song,\nAnd crown Him Lord of all;\nWe'll join the everlasting song,\nAnd crown Him Lord of all.",
    ],
  },

  // ─── SALVATION / GRACE ──────────────────────────────────────────────────────
  256: {
    verses: [
      "Just as I am, without one plea\nBut that Thy blood was shed for me,\nAnd that Thou bid'st me come to Thee,\nO Lamb of God, I come, I come!",
      "Just as I am, and waiting not\nTo rid my soul of one dark blot,\nTo Thee whose blood can cleanse each spot,\nO Lamb of God, I come, I come!",
      "Just as I am, though tossed about\nWith many a conflict, many a doubt,\nFightings and fears within, without,\nO Lamb of God, I come, I come!",
      "Just as I am, poor, wretched, blind;\nSight, riches, healing of the mind,\nYea, all I need, in Thee to find,\nO Lamb of God, I come, I come!",
      "Just as I am! Thou wilt receive,\nWilt welcome, pardon, cleanse, relieve;\nBecause Thy promise I believe,\nO Lamb of God, I come, I come!",
      "Just as I am, Thy love unknown\nHath broken every barrier down;\nNow to be Thine, yea, Thine alone,\nO Lamb of God, I come, I come!",
    ],
  },
  670: {
    verses: [
      "Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.",
      "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed!",
      "Through many dangers, toils and snares,\nI have already come;\n'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.",
      "The Lord has promised good to me,\nHis Word my hope secures;\nHe will my Shield and Portion be,\nAs long as life endures.",
      "Yea, when this flesh and heart shall fail,\nAnd mortal life shall cease,\nI shall possess, within the veil,\nA life of joy and peace.",
      "When we've been there ten thousand years,\nBright shining as the sun,\nWe've no less days to sing God's praise\nThan when we'd first begun.",
    ],
  },

  // ─── PRAYER & INTERCESSION ──────────────────────────────────────────────────
  486: {
    verses: [
      "My faith looks up to Thee,\nThou Lamb of Calvary,\nSaviour divine!\nNow hear me while I pray;\nTake all my guilt away;\nO let me from this day\nBe wholly Thine!",
      "May Thy rich grace impart\nStrength to my fainting heart,\nMy zeal inspire;\nAs Thou hast died for me,\nO may my love to Thee\nPure, warm and changeless be,\nA living fire.",
      "While life's dark maze I tread,\nAnd griefs around me spread,\nBe Thou my Guide;\nBid darkness turn to day,\nWipe sorrow's tears away,\nNor let me ever stray\nFrom Thee aside.",
      "When ends life's transient dream,\nWhen death's cold, sullen stream\nShall o'er me roll,\nBlest Saviour, then in love,\nFear and distrust remove;\nO bear me safe above,\nA ransomed soul!",
    ],
  },
  501: {
    verses: [
      "What a friend we have in Jesus,\nAll our sins and griefs to bear!\nWhat a privilege to carry\nEverything to God in prayer!\nO what peace we often forfeit,\nO what needless pain we bear,\nAll because we do not carry\nEverything to God in prayer!",
      "Have we trials and temptations?\nIs there trouble anywhere?\nWe should never be discouraged—\nTake it to the Lord in prayer.\nCan we find a friend so faithful,\nWho will all our sorrows share?\nJesus knows our every weakness;\nTake it to the Lord in prayer.",
      "Are we weak and heavy-laden,\nCumbered with a load of care?\nPrecious Saviour, still our refuge—\nTake it to the Lord in prayer.\nDo thy friends despise, forsake thee?\nTake it to the Lord in prayer!\nIn His arms He'll take and shield thee,\nThou wilt find a solace there.",
    ],
  },

  // ─── CONSECRATION / SURRENDER ───────────────────────────────────────────────
  400: {
    verses: [
      "Take my life and let it be\nConsecrated, Lord, to Thee;\nTake my moments and my days,\nLet them flow in ceaseless praise,\nLet them flow in ceaseless praise.",
      "Take my hands and let them move\nAt the impulse of Thy love;\nTake my feet and let them be\nSwift and beautiful for Thee,\nSwift and beautiful for Thee.",
      "Take my voice and let me sing\nAlways, only for my King;\nTake my lips and let them be\nFilled with messages from Thee,\nFilled with messages from Thee.",
      "Take my silver and my gold,\nNot a mite would I withhold;\nTake my intellect and use\nEvery power as Thou shalt choose,\nEvery power as Thou shalt choose.",
      "Take my will and make it Thine,\nIt shall be no longer mine;\nTake my heart, it is Thine own,\nIt shall be Thy royal throne,\nIt shall be Thy royal throne.",
      "Take my love; my Lord, I pour\nAt Thy feet its treasure store;\nTake myself and I will be\nEver, only, all for Thee,\nEver, only, all for Thee.",
    ],
  },

  // ─── EVENING / CLOSING HYMNS ────────────────────────────────────────────────
  700: {
    verses: [
      "Abide with me; fast falls the eventide;\nThe darkness deepens; Lord, with me abide!\nWhen other helpers fail and comforts flee,\nHelp of the helpless, O abide with me.",
      "Swift to its close ebbs out life's little day;\nEarth's joys grow dim, its glories pass away;\nChange and decay in all around I see;\nO Thou who changest not, abide with me.",
      "Not a brief glance I beg, a passing word,\nBut as Thou dwell'st with Thy disciples, Lord,\nFamiliar, condescending, patient, free,\nCome not to sojourn, but abide with me.",
      "Come not in terrors as the King of kings,\nBut kind and good, with healing in Thy wings;\nTears for all woes, a heart for every plea;\nCome, Friend of sinners, and thus bide with me.",
      "I need Thy presence every passing hour;\nWhat but Thy grace can foil the tempter's power?\nWho, like Thyself, my guide and stay can be?\nThrough cloud and sunshine, Lord, abide with me.",
      "I fear no foe, with Thee at hand to bless;\nIlls have no weight, and tears no bitterness;\nWhere is death's sting? Where, grave, thy victory?\nI triumph still, if Thou abide with me.",
      "Hold Thou Thy cross before my closing eyes;\nShine through the gloom and point me to the skies;\nHeaven's morning breaks, and earth's vain shadows flee;\nIn life, in death, O Lord, abide with me.",
    ],
  },

  // ─── ALSO POPULAR RCCG HYMNS ────────────────────────────────────────────────
  100: {
    verses: [
      "Rock of Ages, cleft for me,\nLet me hide myself in Thee;\nLet the water and the blood,\nFrom Thy riven side which flowed,\nBe of sin the double cure,\nSave from wrath and make me pure.",
      "Not the labours of my hands\nCan fulfill Thy law's demands;\nCould my zeal no respite know,\nCould my tears forever flow,\nAll for sin could not atone;\nThou must save, and Thou alone.",
      "Nothing in my hand I bring,\nSimply to the cross I cling;\nNaked, come to Thee for dress,\nHelpless, look to Thee for grace;\nFoul, I to the Fountain fly;\nWash me, Saviour, or I die.",
      "While I draw this fleeting breath,\nWhen mine eyes shall close in death,\nWhen I soar to worlds unknown,\nSee Thee on Thy judgment throne,\nRock of Ages, cleft for me,\nLet me hide myself in Thee.",
    ],
  },
  115: {
    verses: [
      "\"Great is Thy faithfulness,\" O God my Father,\nThere is no shadow of turning with Thee;\nThou changest not, Thy compassions, they fail not;\nAs Thou hast been Thou forever wilt be.\n\n[Chorus]\nGreat is Thy faithfulness! Great is Thy faithfulness!\nMorning by morning new mercies I see;\nAll I have needed Thy hand hath provided—\nGreat is Thy faithfulness, Lord, unto me!",
      "Summer and winter, and springtime and harvest,\nSun, moon and stars in their courses above\nJoin with all nature in manifold witness\nTo Thy great faithfulness, mercy and love.\n\n[Chorus]\nGreat is Thy faithfulness! Great is Thy faithfulness!\nMorning by morning new mercies I see;\nAll I have needed Thy hand hath provided—\nGreat is Thy faithfulness, Lord, unto me!",
      "Pardon for sin and a peace that endureth,\nThine own dear presence to cheer and to guide;\nStrength for today and bright hope for tomorrow,\nBlessings all mine, with ten thousand beside!\n\n[Chorus]\nGreat is Thy faithfulness! Great is Thy faithfulness!\nMorning by morning new mercies I see;\nAll I have needed Thy hand hath provided—\nGreat is Thy faithfulness, Lord, unto me!",
    ],
  },
  136: {
    verses: [
      "To God be the glory, great things He hath done;\nSo loved He the world that He gave us His Son,\nWho yielded His life an atonement for sin,\nAnd opened the life-gate that all may go in.\n\n[Chorus]\nPraise the Lord! Praise the Lord! Let the earth hear His voice!\nPraise the Lord! Praise the Lord! Let the people rejoice!\nO come to the Father through Jesus the Son,\nAnd give Him the glory, great things He hath done!",
      "O perfect redemption, the purchase of blood!\nTo every believer the promise of God;\nThe vilest offender who truly believes,\nThat moment from Jesus a pardon receives.\n\n[Chorus]\nPraise the Lord! Praise the Lord! Let the earth hear His voice!\nPraise the Lord! Praise the Lord! Let the people rejoice!\nO come to the Father through Jesus the Son,\nAnd give Him the glory, great things He hath done!",
      "Great things He hath taught us, great things He hath done,\nAnd great our rejoicing through Jesus the Son;\nBut purer and higher and greater will be\nOur wonder, our rapture, when Jesus we see.\n\n[Chorus]\nPraise the Lord! Praise the Lord! Let the earth hear His voice!\nPraise the Lord! Praise the Lord! Let the people rejoice!\nO come to the Father through Jesus the Son,\nAnd give Him the glory, great things He hath done!",
    ],
  },
  340: {
    verses: [
      "Blessed assurance, Jesus is mine!\nO what a foretaste of glory divine!\nHeir of salvation, purchase of God,\nBorn of His Spirit, washed in His blood.\n\n[Chorus]\nThis is my story, this is my song,\nPraising my Saviour all the day long;\nThis is my story, this is my song,\nPraising my Saviour all the day long.",
      "Perfect submission, perfect delight!\nVisions of rapture now burst on my sight;\nAngels descending, bring from above\nEchoes of mercy, whispers of love.\n\n[Chorus]\nThis is my story, this is my song,\nPraising my Saviour all the day long;\nThis is my story, this is my song,\nPraising my Saviour all the day long.",
      "Perfect submission, all is at rest,\nI in my Saviour am happy and blest;\nWatching and waiting, looking above,\nFilled with His goodness, lost in His love.\n\n[Chorus]\nThis is my story, this is my song,\nPraising my Saviour all the day long;\nThis is my story, this is my song,\nPraising my Saviour all the day long.",
    ],
  },
};

// Apply the updates
let updated = 0;
for (const [numStr, data] of Object.entries(HYMN_DATA)) {
  const num = parseInt(numStr, 10);
  const idx = hymns.findIndex(h => h.number === num);
  if (idx !== -1) {
    hymns[idx].verses = data.verses;
    updated++;
    console.log(`✅ Hymn ${num}: ${hymns[idx].title} — ${data.verses.length} verses updated`);
  } else {
    console.log(`❌ Hymn ${num} not found in hymns.json`);
  }
}

fs.writeFileSync(hymnPath, JSON.stringify(hymns, null, 2), 'utf8');
console.log(`\n🎵 Done! Updated ${updated} hymns with full verified lyrics.`);
console.log(`   Total hymns with verses: ${hymns.filter(h => h.verses && h.verses.length > 0).length} / ${hymns.length}`);
