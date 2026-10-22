import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const capturedTextRef = useRef<string>('');
  const timerIntervalRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const callbackRef = useRef(options.onTranscript);

  useEffect(() => {
    callbackRef.current = options.onTranscript;
  }, [options.onTranscript]);

  const cleanupAudio = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const stopVoiceInput = useCallback(async () => {
    setIsListening(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);

    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recordedChunks = [...audioChunksRef.current];
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';

    // Stop recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    // Stop tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }

    setInterimText('');

    // If Web Speech API captured text and passed it, we are satisfied
    const webSpeechText = capturedTextRef.current.trim();

    // Allow a tiny delay for trailing audio chunk to append
    await new Promise((r) => setTimeout(r, 250));
    const allChunks = audioChunksRef.current.length > 0 ? audioChunksRef.current : recordedChunks;

    // If Web Speech didn't capture text (or was blocked by browser), transcribe with Gemini AI
    if (!webSpeechText && allChunks.length > 0) {
      const audioBlob = new Blob(allChunks, { type: mimeType });
      if (audioBlob.size > 800) {
        setIsTranscribing(true);
        try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1] || '');
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });

          // Call backend transcription endpoint with retry
          let res: Response | null = null;
          let lastErrData: any = null;

          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              if (attempt > 0) {
                await new Promise((r) => setTimeout(r, 800));
              }
              res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioData: base64Data,
                  mimeType: mimeType.split(';')[0] || 'audio/webm',
                }),
              });
              if (res.ok) break;
              lastErrData = await res.json().catch(() => ({}));
            } catch (networkErr) {
              lastErrData = { error: 'Network request failed.' };
            }
          }

          if (res && res.ok) {
            const data = await res.json();
            if (data.transcript && data.transcript.trim()) {
              if (callbackRef.current) {
                callbackRef.current(data.transcript.trim());
              }
            } else {
              setError('No clear speech was detected. Please speak clearly into your mic.');
            }
          } else {
            const msg = lastErrData?.error || 'AI transcription server was unavailable. Please try again.';
            setError(msg);
          }
        } catch (transcribeErr: any) {
          console.error('Audio transcription failed:', transcribeErr);
          setError('Failed to reach AI voice transcription server.');
        } finally {
          setIsTranscribing(false);
        }
      }
    }
  }, []);

  const startVoiceInput = useCallback(async (customOnTranscript?: (text: string) => void) => {
    setError(null);
    setInterimText('');
    setRecordingSeconds(0);
    capturedTextRef.current = '';
    audioChunksRef.current = [];

    if (customOnTranscript) {
      callbackRef.current = customOnTranscript;
    }

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Audio recording is not supported in this browser environment.');
      return;
    }

    try {
      // 1. Request microphone access directly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Setup Audio Visualizer (AnalyserNode)
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            setAudioLevel(normalized);
            animFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext meter notice:', audioCtxErr);
      }

      // 3. Setup MediaRecorder
      if (typeof MediaRecorder !== 'undefined') {
        let mimeType = '';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }

        try {
          const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          recorder.start(250);
        } catch (recErr) {
          console.warn('MediaRecorder error:', recErr);
        }
      }

      setIsListening(true);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // 4. Try Web Speech API for real-time dictation preview if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = navigator.language || 'en-US';

          recognition.onresult = (event: any) => {
            let currentInterim = '';
            let newFinals = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                newFinals += res + ' ';
              } else {
                currentInterim += res;
              }
            }

            setInterimText(currentInterim);

            if (newFinals.trim()) {
              capturedTextRef.current = (capturedTextRef.current + ' ' + newFinals).trim();
              if (callbackRef.current) {
                callbackRef.current(newFinals.trim());
              }
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('Web Speech API event error:', event.error);
            // Don't show blocking error if MediaRecorder is active, since Gemini fallback will transcribe audio!
            if (event.error === 'not-allowed' && !mediaRecorderRef.current) {
              setError('Microphone permission was denied.');
            }
          };

          recognition.start();
        } catch (speechErr) {
          console.warn('SpeechRecognition startup error:', speechErr);
        }
      }
    } catch (err: any) {
      console.error('Microphone initialization failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone hardware was detected on this device.');
      } else {
        setError(`Microphone error: ${err.message || 'Unable to access microphone'}`);
      }
      setIsListening(false);
    }
  }, []);

  const toggleVoiceInput = useCallback(
    (customOnTranscript?: (text: string) => void) => {
      if (isListening) {
        stopVoiceInput();
      } else {
        startVoiceInput(customOnTranscript);
      }
    },
    [isListening, startVoiceInput, stopVoiceInput]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    isListening,
    isTranscribing,
    interimText,
    audioLevel,
    recordingSeconds,
    error,
    clearError: () => setError(null),
    startVoiceInput,
    stopVoiceInput,
    toggleVoiceInput,
  };
}
