const BIBLE_VERSES = {
  'mark 11:23': '"For verily I say unto you, That whosoever shall say unto this mountain, Be thou removed, and be thou cast into the sea; and shall not doubt in his heart, but shall believe that those things which he saith shall come to pass; he shall have whatsoever he saith." — Mark 11:23',
  '1 timothy 4:12': '"Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity." — 1 Timothy 4:12',
  'psalm 100:4': '"Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name." — Psalm 100:4',
  'jeremiah 33:3': '"Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not." — Jeremiah 33:3',
  '2 timothy 2:15': '"Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth." — 2 Timothy 2:15',
  'james 5:14-15': '"Is any sick among you? let him call for the elders of the church; and let them pray over him... And the prayer of faith shall save the sick." — James 5:14-15',
  'colossians 3:14': '"And above all these things put on charity, which is the bond of perfectness." — Colossians 3:14',
  '1 corinthians 10:16': '"The cup of blessing which we bless, is it not the communion of the blood of Christ? The bread which we break, is it not the communion of the body of Christ?" — 1 Corinthians 10:16',
};

function quoteScripture(ref) {
  if (!ref) return '';
  const key = ref.toLowerCase().trim();
  if (BIBLE_VERSES[key]) return BIBLE_VERSES[key];
  for (const k in BIBLE_VERSES) {
    if (key.includes(k) || k.includes(key)) return BIBLE_VERSES[k];
  }
  return `"${ref}"`;
}

console.log('Mark 11:23 Quote:', quoteScripture('Mark 11:23'));
console.log('1 Timothy 4:12 Quote:', quoteScripture('1 Timothy 4:12'));
