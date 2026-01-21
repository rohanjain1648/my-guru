import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { text, languageCode } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
        if (!apiKey) {
            console.error('GOOGLE_CLOUD_API_KEY is missing');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Google Cloud TTS API Endpoint
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

        const requestBody = {
            input: { text },
            voice: { languageCode: languageCode, ssmlGender: 'FEMALE' },
            audioConfig: { audioEncoding: 'MP3' },
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google TTS API Error:', errorData);
            return NextResponse.json({ error: errorData.error?.message || 'TTS Error' }, { status: response.status });
        }

        const data = await response.json();
        const audioContent = data.audioContent; // Base64 string

        return NextResponse.json({ audioContent });

    } catch (error) {
        console.error('TTS Handler Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
