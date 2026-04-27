import OpenAI from 'openai';
import { generateNatalSnapshot, generateDailySnapshot } from '../src/saju/interpreter/preprocessor.js';
import { buildFortuneLlmPayload } from '../src/saju/interpreter/llmPayloadBuilder.js';
import { FORTUNE_REPORT_SYSTEM_PROMPT } from '../src/saju/interpreter/llmPrompt.js';
import { FORTUNE_REPORT_SCHEMA } from '../src/saju/interpreter/llmSchema.js';

async function runWorkbench() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log('⚠️ OPENAI_API_KEY is missing in environment variables.');
    console.log('Please run with: OPENAI_API_KEY=your_key node scripts/gpt-fortune-workbench.mjs');
    process.exit(0);
  }

  const openai = new OpenAI({ apiKey });

  // 1. 샘플 데이터 생성 (1997-04-21 14:40 기준)
  console.log('--- Generating Sample Saju Data ---');
  const profile = {
    birth_date: '1997-04-21',
    birth_time: '14:40',
    gender: 'male'
  };
  const natalSnapshot = generateNatalSnapshot(profile);
  const dailySnapshot = generateDailySnapshot(natalSnapshot, '2026-04-27');
  
  // 2. LLM 페이로드 구성
  const payload = buildFortuneLlmPayload(dailySnapshot);
  console.log('Model: gpt-4o-mini'); // Using gpt-4o-mini instead of hypothetical gpt-5-mini
  console.log('Payload Size Estimate:', JSON.stringify(payload).length, 'chars');

  try {
    console.log('\n--- Calling OpenAI API ---');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: FORTUNE_REPORT_SYSTEM_PROMPT },
        { role: "user", content: `다음 분석 데이터를 바탕으로 오늘의 운세를 작성해줘:\n${JSON.stringify(payload)}` }
      ],
      response_format: { type: "json_schema", json_schema: FORTUNE_REPORT_SCHEMA },
      temperature: 0.7,
      max_tokens: 1000
    });

    const output = JSON.parse(response.choices[0].message.content);
    
    console.log('\n--- Output JSON ---');
    console.log(JSON.stringify(output, null, 2));

    console.log('\n--- Validation ---');
    const sections = ['work', 'money', 'relationships', 'love', 'health', 'mind'];
    const allSectionsExist = sections.every(s => output.sections && output.sections[s]);
    console.log('All required sections exist:', allSectionsExist ? '✅' : '❌');
    console.log('Love section exists:', output.sections?.love ? '✅' : '❌');

    console.log('\n--- Character Lengths ---');
    sections.forEach(s => {
      const len = output.sections[s]?.length || 0;
      console.log(`- ${s}: ${len} chars`);
    });

  } catch (error) {
    console.error('\n❌ API Call Failed:', error.message);
  }
}

runWorkbench();
