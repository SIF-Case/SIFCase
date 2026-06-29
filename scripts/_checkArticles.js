const { MongoClient } = require('mongodb');
const fs = require('fs');
const content = fs.readFileSync('.env','utf8');
content.split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)/); if(m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g,''); });
(async() => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const db = c.db();
  const slugs = ['sif-meaning-features-benefits-restrictions','reading-sif-isid-investment-strategy-document','5-things-to-check-before-investing-sif','understanding-risk-bands-sifs'];
  const arts = await db.collection('articles').find({ slug: { $in: slugs } }).project({ slug:1, title:1, category:1, status:1 }).toArray();
  console.log(JSON.stringify(arts, null, 2));
  // also fix category/status if wrong
  for (const a of arts) {
    if (a.category !== 'SIF Education' || a.status !== 'published') {
      await db.collection('articles').updateOne({ _id: a._id }, { $set: { category: 'SIF Education', status: 'published' } });
      console.log('Fixed:', a.slug);
    }
  }
  await c.close();
})().catch(console.error);
