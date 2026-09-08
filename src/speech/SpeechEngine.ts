/**
 * SnapOps Vision SpeechEngine Adapter
 * Integrates the browser's Web Speech API for real-time speech recognition.
 * Listens for operator commands, matches against a defined command map,
 * and triggers deterministic SOP engine actions with graceful fallback.
 */

export type SOPCommandAction =
  | 'START_INSPECTION'
  | 'NEXT_STEP'
  | 'PREVIOUS_STEP'
  | 'REPEAT_INSTRUCTION'
  | 'MARK_STEP_COMPLETE'
  | 'CAPTURE_EVIDENCE'
  | 'SHOW_ISSUE'
  | 'GENERATE_REPORT'
  | 'OVERRIDE_STEP'
  | 'PAUSE_INSPECTION'
  | 'RESUME_INSPECTION';

export interface CommandDefinition {
  id: string;
  action: SOPCommandAction;
  phrases: string[];
  description: string;
  regex?: RegExp;
  patterns?: RegExp[];
}

export interface RecognizedCommand {
  commandId: string;
  action: SOPCommandAction;
  rawTranscript: string;
  matchedPhrase: string;
  confidence: number;
  timestamp: string;
}

export type SpeechEngineStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'unsupported'
  | 'permission_denied'
  | 'error';

export interface SpeechEngineCallbacks {
  onStatusChange?: (status: SpeechEngineStatus, detail?: string) => void;
  onTranscript?: (interim: string, isFinal: boolean) => void;
  onCommandRecognized?: (command: RecognizedCommand) => void;
  onError?: (error: string) => void;
}

export class SpeechEngine {
  private recognition: any = null;
  private isListening = false;
  private status: SpeechEngineStatus = 'idle';
  private commandMap: CommandDefinition[] = [];
  private actionHandlers: Map<SOPCommandAction, (cmd: RecognizedCommand) => void> = new Map();
  private callbacks: SpeechEngineCallbacks = {};

  constructor() {
    this.initDefaultCommandMap();
    this.initRecognition();
  }

  /**
   * Defined SOP Command Map
   */
  private initDefaultCommandMap(): void {
    this.commandMap = [
      {
        id: 'cmd-start',
        action: 'START_INSPECTION',
        phrases: ['start inspection', 'begin inspection', 'initiate audit', 'launch inspection'],
        description: 'Initiate or launch a new equipment inspection session',
      },
      {
        id: 'cmd-next',
        action: 'NEXT_STEP',
        phrases: ['next step', 'advance step', 'go to next', 'proceed', 'continue'],
        description: 'Advance to the subsequent SOP inspection step',
      },
      {
        id: 'cmd-prev',
        action: 'PREVIOUS_STEP',
        phrases: ['previous step', 'back step', 'go back', 'return step'],
        description: 'Return to the preceding inspection step',
      },
      {
        id: 'cmd-repeat',
        action: 'REPEAT_INSTRUCTION',
        phrases: [
          'repeat instruction',
          'repeat step',
          'read instruction',
          'what should i do',
          'read step',
          'say instruction',
        ],
        description: 'Synthesize audio readback of the current step requirement',
      },
      {
        id: 'cmd-complete',
        action: 'MARK_STEP_COMPLETE',
        phrases: [
          'mark this step complete',
          'mark complete',
          'step complete',
          'approve step',
          'confirm step',
          'verify complete',
        ],
        description: 'Validate current step against criteria and mark completed',
      },
      {
        id: 'cmd-capture',
        action: 'CAPTURE_EVIDENCE',
        phrases: [
          'capture evidence',
          'take photo',
          'snap photo',
          'save evidence',
          'record frame',
          'take picture',
        ],
        description: 'Capture high-resolution optical evidence into the audit vault',
      },
      {
        id: 'cmd-issue',
        action: 'SHOW_ISSUE',
        phrases: [
          'show the detected issue',
          'show issue',
          'report issue',
          'show findings',
          'log finding',
          'what is the issue',
          'explain failure',
        ],
        description: 'Display detected safety anomaly or failure explanation',
      },
      {
        id: 'cmd-override',
        action: 'OVERRIDE_STEP',
        phrases: [
          'override this step',
          'override step',
          'manual override',
          'bypass check',
          'supervisor override',
        ],
        patterns: [/(?:override|bypass)/i],
        description: 'Request authorized manual supervisor override on current step',
      },
      {
        id: 'cmd-report',
        action: 'GENERATE_REPORT',
        phrases: [
          'generate report',
          'create report',
          'inspection report',
          'finish inspection',
          'export report',
          'view report',
          'sign off',
        ],
        patterns: [
          /(?:generate|create|view|export|open|finish).*(?:report|sign off)/i,
          /report/i,
        ],
        description: 'Conclude audit and open official compliance report',
      },
      {
        id: 'cmd-pause',
        action: 'PAUSE_INSPECTION',
        phrases: ['pause inspection', 'freeze camera', 'hold frame'],
        description: 'Pause live optical analysis and stream',
      },
      {
        id: 'cmd-resume',
        action: 'RESUME_INSPECTION',
        phrases: ['resume inspection', 'unfreeze camera', 'continue stream'],
        description: 'Resume live optical camera stream',
      },
    ];
  }

  /**
   * Initializes browser SpeechRecognition instance with graceful fallback
   */
  private initRecognition(): void {
    if (typeof window === 'undefined') {
      this.status = 'unsupported';
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.status = 'unsupported';
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.setStatus('listening');
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText) {
          this.callbacks.onTranscript?.(currentText, !!finalTranscript);
        }

        if (finalTranscript) {
          this.processTranscript(finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        const error = event.error || 'unknown_error';
        if (error === 'not-allowed') {
          this.setStatus('permission_denied', 'Microphone access denied by user or browser security policy');
        } else if (error === 'no-speech') {
          // Benign timeout when operator is silent
        } else {
          this.setStatus('error', `Speech recognition error: ${error}`);
          this.callbacks.onError?.(error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Maintain continuous listening if active
          try {
            this.recognition.start();
          } catch {
            this.isListening = false;
            this.setStatus('idle');
          }
        } else {
          this.setStatus('idle');
        }
      };
    } catch (err: any) {
      this.status = 'unsupported';
      console.warn('[SpeechEngine] SpeechRecognition initialization failed:', err);
    }
  }

  /**
   * Check if speech recognition is available in current runtime
   */
  isSupported(): boolean {
    return !!this.recognition;
  }

  getStatus(): SpeechEngineStatus {
    return this.status;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getCommandMap(): CommandDefinition[] {
    return [...this.commandMap];
  }

  getRegisteredCommands(): CommandDefinition[] {
    return [...this.commandMap];
  }

  parseTranscript(transcript: string): RecognizedCommand | null {
    return this.processTranscript(transcript);
  }

  /**
   * Registers a custom or extended command definition
   */
  registerCommand(command: CommandDefinition): void {
    const existingIndex = this.commandMap.findIndex((c) => c.id === command.id);
    if (existingIndex >= 0) {
      this.commandMap[existingIndex] = command;
    } else {
      this.commandMap.push(command);
    }
  }

  /**
   * Bind an action handler for an SOP action
   */
  bindAction(action: SOPCommandAction, handler: (cmd: RecognizedCommand) => void): void {
    this.actionHandlers.set(action, handler);
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: SpeechEngineCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private setStatus(status: SpeechEngineStatus, detail?: string): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status, detail);
  }

  /**
   * Start listening for voice commands
   */
  async startListening(): Promise<boolean> {
    if (!this.recognition) {
      this.setStatus('unsupported', 'Web Speech API is not supported in this browser environment');
      return false;
    }

    if (this.isListening) return true;

    try {
      this.isListening = true;
      this.recognition.start();
      return true;
    } catch (err: any) {
      console.warn('[SpeechEngine] startListening error:', err);
      this.isListening = false;
      this.setStatus('error', err.message);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
    }
    this.setStatus('idle');
  }

  /**
   * Parses and matches raw speech against the command map
   */
  matchCommand(text: string): RecognizedCommand | null {
    const clean = text.toLowerCase().trim();
    if (!clean) return null;

    for (const def of this.commandMap) {
      // 1. Patterns check if defined
      if (def.patterns && def.patterns.length > 0) {
        for (const p of def.patterns) {
          if (p.test(clean)) {
            return {
              commandId: def.id,
              action: def.action,
              rawTranscript: text,
              matchedPhrase: def.phrases[0] || clean,
              confidence: 0.95,
              timestamp: new Date().toISOString(),
            };
          }
        }
      }

      // 2. Regex check if defined
      if (def.regex && def.regex.test(clean)) {
        return {
          commandId: def.id,
          action: def.action,
          rawTranscript: text,
          matchedPhrase: def.phrases[0] || clean,
          confidence: 0.95,
          timestamp: new Date().toISOString(),
        };
      }

      // 3. Phrase matching (substring / includes)
      for (const phrase of def.phrases) {
        if (clean.includes(phrase)) {
          return {
            commandId: def.id,
            action: def.action,
            rawTranscript: text,
            matchedPhrase: phrase,
            confidence: 0.92,
            timestamp: new Date().toISOString(),
          };
        }
      }
    }

    return null;
  }

  /**
   * Processes final transcript and dispatches to registered action handlers
   */
  processTranscript(transcript: string): RecognizedCommand | null {
    const matched = this.matchCommand(transcript);
    if (matched) {
      this.callbacks.onCommandRecognized?.(matched);

      const handler = this.actionHandlers.get(matched.action);
      if (handler) {
        handler(matched);
      }
    }
    return matched;
  }

  /**
   * Graceful simulation fallback for environments without microphone hardware or automated tests
   */
  simulateCommand(phrase: string): { recognized: boolean; command?: RecognizedCommand } {
    const matched = this.processTranscript(phrase);
    return {
      recognized: !!matched,
      command: matched || undefined,
    };
  }
}

// Global shared SpeechEngine singleton instance
export const speechEngine = new SpeechEngine();
