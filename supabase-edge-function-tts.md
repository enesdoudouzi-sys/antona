# Premium-Stimme: Supabase Edge Function "tts"

Diese Funktion ruft ElevenLabs auf (echte menschliche Stimme) und versteckt den
API-Schlüssel sicher auf dem Server. Die App ruft sie über
`{SUPABASE_URL}/functions/v1/tts` auf.

## Einrichtung

1. **ElevenLabs-Konto** (kostenlos, ohne Kreditkarte): https://elevenlabs.io
   -> Profil -> "API Keys" -> Schlüssel kopieren.

2. In **Supabase**: links **Edge Functions** -> **Create a function** ->
   Name: `tts` -> den Code unten einfügen -> **Deploy**.
   Wichtig: Beim Deploy **"Verify JWT" ausschalten** (Funktion ist dann ohne
   Login aufrufbar, die App nutzt trotzdem den anon key).

3. In Supabase: **Edge Functions -> Secrets** (oder Project Settings ->
   Edge Functions -> Secrets) -> neuen Secret anlegen:
   - Name: `ELEVENLABS_API_KEY`
   - Value: (dein ElevenLabs-Schlüssel)

4. In der App: Eltern-Bereich -> Vorlese-Stimme -> **🌟 Echte Premium-Stimme**
   anhaken -> **Premium-Stimme testen**. (Die App nutzt URL + anon key, die
   schon beim Geräte-Sync eingetragen sind.)

## Funktions-Code (index.ts)

```ts
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Deutsche, freundliche Standard-Stimme (ElevenLabs). Kann per Body "voice" ueberschrieben werden.
const DEFAULT_VOICE = "EXAVITQu4vr4xnSDxMaL"; // "Sarah"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { text, voice } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "no text" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const key = Deno.env.get("ELEVENLABS_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not set" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const voiceId = voice || DEFAULT_VOICE;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      return new Response(JSON.stringify({ error: "elevenlabs " + r.status, detail: detail.slice(0, 200) }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const audio = await r.arrayBuffer();
    return new Response(audio, { headers: { ...cors, "Content-Type": "audio/mpeg" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
```
