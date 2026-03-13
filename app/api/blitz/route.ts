import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { message } = await req.json()

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: {
          parts: [
            {
              text: `You are Blitz, an AI tutor for Pakistani Matric and FSc students on Aghaaz — a video learning platform. You are warm, encouraging, and direct. Mix in Urdu phrases naturally like "samajh gaye?", "theek hai", "bilkul sahi", "koi baat nahi". Keep responses to 2-3 sentences maximum. Be like a good private tutor, not a textbook.`,
            },
          ],
        },
      }),
    },
  )

  const data = await response.json()
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    'Koi baat nahi — try again in a moment!'
  return NextResponse.json({ message: text })
}

