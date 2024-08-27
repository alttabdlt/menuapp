import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { name, image, type } = await req.json();

  let prompt = '';
  if (type === 'menuItem') {
    prompt = `Generate a brief, appetizing description for a menu item named "${name}".${image ? ' The item has an image.' : ''}`;
  } else if (type === 'category') {
    prompt = `Generate a brief description for a menu category named "${name}".`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    const generatedDescription = completion.choices[0].message.content;
    return NextResponse.json({ description: generatedDescription });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}