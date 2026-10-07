'use client';

import { useState, useRef } from 'react';
import api from '@/lib/api';
// Normally we import from @google/genai, but we must use a dynamic import or window object since it's Next.js client component and browser-only
import { GoogleGenAI } from '@google/genai';

export default function VoiceTestPage() {
  const [status, setStatus] = useState('Disconnected');
  const [error, setError] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startVoice = async () => {
    try {
      setError('');
      setStatus('Requesting microphone...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setStatus('Fetching token...');
      const response = await api.post('/api/interviews/voice/session-token/', {});
      
      if (!response || !response.data || !response.data.token) {
        throw new Error("Failed to get session token");
      }

      setStatus('Connecting to Gemini Live...');
      
      // Initialize Gemini Client with token (ephemeral tokens require v1alpha)
      const ai = new GoogleGenAI({ apiKey: response.data.token, httpOptions: { apiVersion: 'v1alpha' } });
      // Setup AudioContext for playback (24kHz as required by Gemini)
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 24000 });
      let nextPlayTime = audioContextRef.current.currentTime;

      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
           responseModalities: ["AUDIO" as any]
        },
        callbacks: {
          onmessage: (content: any) => {
            if (content?.serverContent?.modelTurn?.parts || content?.modelTurn?.parts) {
                const parts = content.serverContent ? content.serverContent.modelTurn.parts : content.modelTurn.parts;
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.data) {
                        // Play audio data (base64 PCM to AudioBuffer)
                        const audioStr = atob(part.inlineData.data);
                        const arrayBuffer = new ArrayBuffer(audioStr.length);
                        const view = new Uint8Array(arrayBuffer);
                        for (let i = 0; i < audioStr.length; i++) {
                            view[i] = audioStr.charCodeAt(i);
                        }
                        
                        // Decode PCM16
                        const pcm16 = new Int16Array(arrayBuffer);
                        const float32 = new Float32Array(pcm16.length);
                        for (let i = 0; i < pcm16.length; i++) {
                            float32[i] = pcm16[i] / 32768.0;
                        }
                        
                        if (!audioContextRef.current) return;
                        const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
                        audioBuffer.getChannelData(0).set(float32);
                        
                        const source = audioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContextRef.current.destination);
                        
                        const currentTime = audioContextRef.current.currentTime;
                        nextPlayTime = Math.max(currentTime, nextPlayTime);
                        source.start(nextPlayTime);
                        nextPlayTime += audioBuffer.duration;
                    }
                }
            }
          },
          onerror: (err: unknown) => {
            console.error("Gemini Error:", err);
            setError("Connection failed or expired.");
            stopVoice();
          },
          onclose: () => {
            setStatus('Disconnected');
          }
        }
      });
      
      sessionRef.current = session;
      
      setStatus('Connected');
      
      // Send instruction
      session.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [{text: "You are a friendly mock interviewer. Have a short conversational exchange with the candidate. Ask one simple technical question and respond naturally to their spoken answer. Do not provide feedback or scores."}]
          }
        ],
        turnComplete: true
      });

      // Stream mic audio to session (16kHz as required by Gemini)
      const micAudioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 16000 });
      const source = micAudioCtx.createMediaStreamSource(stream);
      const processor = micAudioCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!sessionRef.current || status === 'Disconnected') return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to PCM16 Base64
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }
        
        const uint8 = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < uint8.byteLength; i++) {
            binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);

        sessionRef.current.sendRealtimeInput([{
            mimeType: "audio/pcm;rate=16000",
            data: base64
        }]);
      };
      
      source.connect(processor);
      // processor.connect(micAudioCtx.destination); // Do not connect to destination (avoids feedback loop)

    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || 'An error occurred');
      setStatus('Disconnected');
    }
  };

  const stopVoice = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setStatus('Disconnected');
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Voice Interview POC</h1>
      
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="space-x-4">
        <button 
          onClick={startVoice}
          disabled={status !== 'Disconnected' && status !== 'Error'}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Start Voice Test
        </button>
        <button 
          onClick={stopVoice}
          disabled={status === 'Disconnected'}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
        >
          Stop Voice Test
        </button>
      </div>
    </div>
  );
}
