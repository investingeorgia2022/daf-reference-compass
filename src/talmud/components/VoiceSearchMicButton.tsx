// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic } from 'lucide-react';

interface VoiceSearchMicButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  append?: boolean;
  lang?: string;
  className?: string;
  title?: string;
  isDark?: boolean;
  size?: 'sm' | 'md' | 'lg' | string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal?: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export const VoiceSearchMicButton: React.FC<VoiceSearchMicButtonProps> = React.memo(
  ({
    onTranscript,
    currentValue = '',
    append = false,
    lang = 'ka-GE',
    className = '',
    title = 'ხმოვანი ჩაწერა საძიებო ველში',
  }) => {
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);

    useEffect(() => {
      return () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
          recognitionRef.current = null;
        }
      };
    }, []);

    const toggleListening = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (listening && recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
          setListening(false);
          return;
        }

        if (typeof window === 'undefined') return;
        const win = window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionInstanceLike;
          webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike;
        };
        const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
        if (!SpeechRec) {
          return;
        }

        try {
          const rec = new SpeechRec();
          rec.lang = lang;
          rec.continuous = false;
          rec.interimResults = false;

          rec.onresult = (event: SpeechRecognitionEventLike) => {
            const transcript = Array.from(event.results)
              .map((r) => r[0]?.transcript || '')
              .join(' ')
              .trim();
            if (transcript) {
              const nextVal =
                append && currentValue.trim()
                  ? `${currentValue.trim()} ${transcript}`
                  : transcript;
              onTranscript(nextVal);
            }
          };

          rec.onerror = () => {
            setListening(false);
          };

          rec.onend = () => {
            setListening(false);
            recognitionRef.current = null;
          };

          recognitionRef.current = rec;
          setListening(true);
          rec.start();
        } catch {
          setListening(false);
        }
      },
      [listening, lang, append, currentValue, onTranscript]
    );

    return (
      <button
        type="button"
        data-raw-btn="true"
        data-flat-btn="true"
        onClick={toggleListening}
        title={listening ? 'მოსმენის გაჩერება...' : title}
        aria-label={title}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 select-none ${
          listening
            ? 'bg-rose-500/20 text-rose-600 ring-1 ring-rose-400 animate-pulse'
            : 'bg-sky-500/8 hover:bg-sky-500/18 text-sky-700/75 hover:text-amber-600'
        } ${className}`}
      >
        <Mic className="w-3.5 h-3.5 stroke-[2]" />
      </button>
    );
  }
);
