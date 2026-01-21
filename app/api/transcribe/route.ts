import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;
    const language = formData.get('language') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const groqFormData = new FormData();
    // Groq requires a filename for the file upload to correctly detect the format
    groqFormData.append('file', audioFile, 'audio.webm');
    groqFormData.append('model', 'whisper-large-v3');
    if (language) {
      groqFormData.append('language', language);
    }
    groqFormData.append('response_format', 'json');

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is missing');
      return NextResponse.json({ error: 'GROQ_API_KEY is not set' }, { status: 500 });
    }

    console.log('Sending audio to Groq...');
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', response.status, errorText);
      return NextResponse.json({ error: `Groq API error: ${response.status} ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log('Groq Transcription Success:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
