import { speechEngine, SpeechEngine, SOPCommandAction, RecognizedCommand } from './SpeechEngine';

export type VoiceCommandAction =
  | 'START_INSPECTION'
  | 'NEXT_STEP'
  | 'PREVIOUS_STEP'
  | 'REPEAT_INSTRUCTION'
  | 'MARK_STEP_COMPLETE'
  | 'SHOW_ISSUE'
  | 'GENERATE_REPORT'
  | 'CAPTURE_EVIDENCE'
  | 'OVERRIDE_STEP'
  | 'UNKNOWN';

export interface ParsedVoiceCommand {
  rawTranscript: string;
  action: VoiceCommandAction;
  confidence: number;
}

export type VoiceListenerStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'unsupported'
  | 'permission_denied'
  | 'error';

export { SpeechEngine, speechEngine };


export class VoiceCommander {
  private recognition: any = null;
  private isListening = false;
  private statusCallback: ((status: VoiceListenerStatus) => void) | null = null;
  private commandCallback: ((cmd: ParsedVoiceCommand) => void) | null = null;
  private transcriptCallback: ((text: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.statusCallback?.('listening');
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const currentText = (finalTranscript || interimTranscript).trim();
          if (currentText) {
            this.transcriptCallback?.(currentText);
          }

          if (finalTranscript) {
            const parsed = this.parseCommand(finalTranscript);
            this.commandCallback?.(parsed);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('[VoiceCommander] Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            this.statusCallback?.('permission_denied');
          } else if (event.error === 'no-speech') {
            // benign
          } else {
            this.statusCallback?.('error');
          }
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            // Auto-restart if active
            try {
              this.recognition.start();
            } catch {
              this.isListening = false;
              this.statusCallback?.('idle');
            }
          } else {
            this.statusCallback?.('idle');
          }
        };
      }
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  setCallbacks(
    onCommand: (cmd: ParsedVoiceCommand) => void,
    onStatus: (status: VoiceListenerStatus) => void,
    onTranscript: (text: string) => void
  ) {
    this.commandCallback = onCommand;
    this.statusCallback = onStatus;
    this.transcriptCallback = onTranscript;
  }

  start(): void {
    if (!this.recognition) {
      this.statusCallback?.('unsupported');
      return;
    }
    if (this.isListening) return;

    try {
      this.isListening = true;
      this.recognition.start();
    } catch (err) {
      console.warn('[VoiceCommander] Start error:', err);
    }
  }

  stop(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.statusCallback?.('idle');
  }

  parseCommand(text: string): ParsedVoiceCommand {
    const clean = text.toLowerCase().trim();

    if (clean.includes('start inspection') || clean.includes('begin inspection')) {
      return { rawTranscript: text, action: 'START_INSPECTION', confidence: 0.95 };
    }
    if (
      clean.includes('next step') ||
      clean.includes('advance step') ||
      clean.includes('go to next') ||
      clean.includes('continue')
    ) {
      return { rawTranscript: text, action: 'NEXT_STEP', confidence: 0.95 };
    }
    if (clean.includes('previous step') || clean.includes('back step') || clean.includes('go back')) {
      return { rawTranscript: text, action: 'PREVIOUS_STEP', confidence: 0.95 };
    }
    if (
      clean.includes('repeat instruction') ||
      clean.includes('repeat step') ||
      clean.includes('read instruction') ||
      clean.includes('what should i do')
    ) {
      return { rawTranscript: text, action: 'REPEAT_INSTRUCTION', confidence: 0.95 };
    }
    if (
      clean.includes('mark this step complete') ||
      clean.includes('mark complete') ||
      clean.includes('step complete') ||
      clean.includes('approve step')
    ) {
      return { rawTranscript: text, action: 'MARK_STEP_COMPLETE', confidence: 0.95 };
    }
    if (
      clean.includes('show the detected issue') ||
      clean.includes('show issue') ||
      clean.includes('show findings') ||
      clean.includes('what is the issue')
    ) {
      return { rawTranscript: text, action: 'SHOW_ISSUE', confidence: 0.95 };
    }
    if (
      clean.includes('generate report') ||
      clean.includes('create report') ||
      clean.includes('finish inspection') ||
      clean.includes('export report')
    ) {
      return { rawTranscript: text, action: 'GENERATE_REPORT', confidence: 0.95 };
    }
    if (
      clean.includes('capture evidence') ||
      clean.includes('take photo') ||
      clean.includes('snap photo') ||
      clean.includes('save evidence')
    ) {
      return { rawTranscript: text, action: 'CAPTURE_EVIDENCE', confidence: 0.95 };
    }

    return { rawTranscript: text, action: 'UNKNOWN', confidence: 0.4 };
  }
}

export const voiceCommander = new VoiceCommander();
