// client/scripts/fetchKoreanNames.js
// 실행: node scripts/fetchKoreanNames.js
// 결과: src/data/pokemonKoreanNames.json 생성

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/pokemonKoreanNames.json');
const TOTAL = 1025;
const BATCH = 20; // 동시 요청 수

async function fetchSpecies(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  if (!res.ok) throw new Error(`Failed: ${id}`);
  const data = await res.json();
  const ko = data.names.find(n => n.language.name === 'ko');
  return { id, name: data.name, ko: ko?.name ?? data.name };
}

async function run() {
  const results = {};
  const ids = Array.from({ length: TOTAL }, (_, i) => i + 1);

  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const settled = await Promise.allSettled(batch.map(fetchSpecies));

    settled.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const { name, ko } = result.value;
        results[name] = ko;
      } else {
        console.warn(`  ⚠️  id ${batch[idx]} 실패:`, result.reason.message);
      }
    });

    const done = Math.min(i + BATCH, TOTAL);
    process.stdout.write(`\r  진행: ${done}/${TOTAL} (${Math.round(done / TOTAL * 100)}%)`);

    // rate limit 방지: 배치 사이 300ms 대기
    if (i + BATCH < ids.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log('\n');

  // src/data 디렉토리 없으면 생성
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`✅ 저장 완료: ${OUTPUT_PATH}`);
  console.log(`   총 ${Object.keys(results).length}마리`);
}

run().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
