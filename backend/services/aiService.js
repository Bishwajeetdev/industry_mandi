// Provider-neutral, database-grounded assistance. Swap this adapter for an external LLM safely.
export const summarizeComparison=results=>results.map(r=>`${r.product.name} is #${r.rank} with ${r.score}/100.`).join(' ')+' Scores use configured category weights and verified offers only.';
export const matchProducts=(name,products)=>products.map(p=>({product:p,confidence:Math.min(99,Math.round(100*(p.name.toLowerCase().split(' ').filter(w=>name.toLowerCase().includes(w)).length/Math.max(1,p.name.split(' ').length))))})).filter(x=>x.confidence>20).sort((a,b)=>b.confidence-a.confidence).slice(0,5);
export const parseSearch=q=>({query:q, maxPrice:(q.match(/(?:under|below)\s*(?:₹|rs\.?\s*)?(\d[\d,]*)/i)?.[1]||'').replaceAll(',','')||null, ram:q.match(/(\d+)\s*gb/i)?.[1]||null});
