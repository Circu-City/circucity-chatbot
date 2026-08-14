import { crawlWebsite } from './lib/crawler'
const r = await crawlWebsite('ws_circucity_001')
console.log('Pages:', r.pages.length)
console.log('Products:', r.products.length)
console.log('FAQs:', r.faqs.length)
console.log('Error:', r.error)
