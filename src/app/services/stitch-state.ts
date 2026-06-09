import {Injectable, signal, computed} from '@angular/core';

export type PersonaType = 'coder' | 'scientist' | 'therapist' | 'doctor' | 'unhinged';
export type EngineType = 'AUTO' | 'FAST' | 'EXPERT' | 'HEAVY';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  persona: PersonaType;
  text: string;
  timestamp: Date;
  formula?: string;
  tableData?: {
    runId: string;
    energy: number;
    barrierH: number;
    probability: number;
  }[];
  attachedFile?: string;
}

export interface PersonaLayout {
  codeBlocks: {
    syntaxHighlighting: boolean;
    lineNumbers: boolean;
    monospace: boolean;
  };
  dataViz: {
    autoRenderCharts: boolean;
    geometryView: boolean;
    interactiveTables: boolean;
  };
  canvasDynamics: {
    sideBySide: boolean;
    focusMode: boolean;
    metadataOverlays: boolean;
  };
}

export interface HubFile {
  id: string;
  name: string;
  size: string;
  timeLabel: string;
  type: 'pdf' | 'xlsx' | 'csv' | 'zip' | 'png' | 'other';
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class StitchState {
  // Active states
  readonly activePersona = signal<PersonaType>('scientist');
  readonly currentEngine = signal<EngineType>('EXPERT');
  
  // Connectors
  readonly googleDriveActive = signal<boolean>(true);
  readonly gmailActive = signal<boolean>(true);
  readonly calendarActive = signal<boolean>(false);
  
  // Behavioral Engine
  readonly responseTone = signal<number>(80); // 0 (Playful/Creative) to 100 (Rigid/Technical)
  readonly toneLabel = computed(() => {
    const val = this.responseTone();
    if (val < 30) return 'Creative';
    if (val < 70) return 'Balanced';
    return 'Technical';
  });

  // Formatting constraints
  readonly formatMarkdown = signal<boolean>(true);
  readonly formatEmojis = signal<boolean>(false);
  readonly formatLaTeX = signal<boolean>(true);
  readonly formatCitations = signal<boolean>(false);

  // Core Assets
  readonly assetWebSearch = signal<boolean>(true);
  readonly assetComputerVision = signal<boolean>(false);

  // Layout Threads configurations (per persona)
  readonly layoutConfig = signal<Record<PersonaType, PersonaLayout>>({
    coder: {
      codeBlocks: { syntaxHighlighting: true, lineNumbers: true, monospace: true },
      dataViz: { autoRenderCharts: false, geometryView: false, interactiveTables: true },
      canvasDynamics: { sideBySide: true, focusMode: false, metadataOverlays: true }
    },
    scientist: {
      codeBlocks: { syntaxHighlighting: true, lineNumbers: true, monospace: true },
      dataViz: { autoRenderCharts: true, geometryView: false, interactiveTables: true },
      canvasDynamics: { sideBySide: true, focusMode: false, metadataOverlays: true }
    },
    therapist: {
      codeBlocks: { syntaxHighlighting: false, lineNumbers: false, monospace: false },
      dataViz: { autoRenderCharts: false, geometryView: false, interactiveTables: false },
      canvasDynamics: { sideBySide: false, focusMode: true, metadataOverlays: false }
    },
    doctor: {
      codeBlocks: { syntaxHighlighting: true, lineNumbers: false, monospace: true },
      dataViz: { autoRenderCharts: true, geometryView: false, interactiveTables: true },
      canvasDynamics: { sideBySide: false, focusMode: false, metadataOverlays: true }
    },
    unhinged: {
      codeBlocks: { syntaxHighlighting: true, lineNumbers: true, monospace: false },
      dataViz: { autoRenderCharts: true, geometryView: true, interactiveTables: false },
      canvasDynamics: { sideBySide: true, focusMode: false, metadataOverlays: false }
    }
  });

  // Active persona's layout
  readonly activeLayout = computed(() => {
    return this.layoutConfig()[this.activePersona()];
  });

  // Media storage files
  readonly mediaFiles = signal<HubFile[]>([
    { id: 'f1', name: 'Q3_Projections_Final.pdf', size: '2.4 MB', timeLabel: '2h ago', type: 'pdf', icon: 'picture_as_pdf' },
    { id: 'f2', name: 'User_Onboarding_Metrics.xlsx', size: '842 KB', timeLabel: '5h ago', type: 'xlsx', icon: 'table_chart' },
    { id: 'f3', name: 'Raw_Sensor_Data_V2.csv', size: '12.1 MB', timeLabel: 'Yesterday', type: 'csv', icon: 'csv' }
  ]);

  readonly activeClassByPersonaMap: Record<PersonaType, { name: string, colorClass: string, accentColor: string, icon: string, description: string }> = {
    coder: {
      name: 'Coder',
      colorClass: 'text-blue-400 border-blue-500/30',
      accentColor: '#3b82f6',
      icon: 'code',
      description: 'Algorithm optimization & clean syntax.'
    },
    scientist: {
      name: 'Scientist',
      colorClass: 'text-emerald-400 border-emerald-500/30',
      accentColor: '#10b981',
      icon: 'science',
      description: 'Hypothesis testing & data analysis.'
    },
    therapist: {
      name: 'Therapist',
      colorClass: 'text-purple-400 border-purple-500/30',
      accentColor: '#a78bfa',
      icon: 'psychology',
      description: 'Empathetic listening & cognitive shifts.'
    },
    doctor: {
      name: 'Doctor',
      colorClass: 'text-red-400 border-red-500/30',
      accentColor: '#ef4444',
      icon: 'medical_services',
      description: 'Clinical precision & medical diagnostics.'
    },
    unhinged: {
      name: 'Unhinged',
      colorClass: 'text-fuchsia-400 border-fuchsia-500/30',
      accentColor: '#d946ef',
      icon: 'psychiatry',
      description: 'Chaotic creativity & raw processing.'
    }
  };

  readonly activePersonaDetails = computed(() => {
    return this.activeClassByPersonaMap[this.activePersona()];
  });

  // Chat message state
  readonly messages = signal<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'user',
      persona: 'scientist',
      text: 'Analyze the quantum tunneling probability in the provided simulation data and render the derivation of the wave function solution.',
      timestamp: new Date(Date.now() - 1000 * 60 * 10)
    },
    {
      id: 'm2',
      sender: 'assistant',
      persona: 'scientist',
      text: 'Based on the provided dataset, the transmission coefficient $T$ for a rectangular potential barrier of height $V_0$ and width $a$ is calculated as follows:',
      timestamp: new Date(Date.now() - 1000 * 60 * 9),
      formula: 'T = \\left( 1 + \\frac{V_0^2 \\sinh^2(ka)}{4E(V_0 - E)} \\right)^{-1}',
      tableData: [
        { runId: 'S-0102', energy: 1.45, barrierH: 2.1, probability: 0.0234 },
        { runId: 'S-0103', energy: 1.82, barrierH: 2.1, probability: 0.0891 },
        { runId: 'S-0104', energy: 2.05, barrierH: 2.1, probability: 0.1422 }
      ]
    }
  ]);

  // Temporary attachment status in prompt input
  readonly attachedFile = signal<HubFile | null>(null);

  // Send message loading state
  readonly isSending = signal<boolean>(false);

  // Actions
  setPersona(persona: PersonaType) {
    this.activePersona.set(persona);
  }

  setEngine(engine: EngineType) {
    this.currentEngine.set(engine);
  }

  toggleGoogleDrive() {
    this.googleDriveActive.update(v => !v);
  }

  toggleGmail() {
    this.gmailActive.update(v => !v);
  }

  toggleCalendar() {
    this.calendarActive.update(v => !v);
  }

  setTone(val: number) {
    this.responseTone.set(val);
  }

  toggleMarkdown() {
    this.formatMarkdown.update(v => !v);
  }

  toggleEmojis() {
    this.formatEmojis.update(v => !v);
  }

  toggleLaTeX() {
    this.formatLaTeX.update(v => !v);
  }

  toggleCitations() {
    this.formatCitations.update(v => !v);
  }

  toggleWebSearch() {
    this.assetWebSearch.update(v => !v);
  }

  toggleComputerVision() {
    this.assetComputerVision.update(v => !v);
  }

  updateLayoutConfig(persona: PersonaType, category: keyof PersonaLayout, setting: string, value: boolean) {
    this.layoutConfig.update(cfg => {
      const currentPersonaCfg = { ...cfg[persona] };
      const subCategory = { ...currentPersonaCfg[category] } as Record<string, boolean>;
      subCategory[setting] = value;
      currentPersonaCfg[category] = subCategory as never;
      return {
        ...cfg,
        [persona]: currentPersonaCfg
      };
    });
  }

  addMediaFile(file: Omit<HubFile, 'id'>) {
    const id = 'f_' + Math.random().toString(36).substr(2, 9);
    this.mediaFiles.update(files => [...files, { id, ...file }]);
  }

  removeMediaFile(id: string) {
    this.mediaFiles.update(files => files.filter(f => f.id !== id));
  }

  async sendMessage(text: string) {
    if (!text.trim() && !this.attachedFile()) return;
    
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      persona: this.activePersona(),
      text,
      timestamp: new Date(),
      attachedFile: this.attachedFile()?.name
    };

    this.messages.update(m => [...m, userMsg]);
    this.attachedFile.set(null);
    this.isSending.set(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          persona: userMsg.persona,
          tone: this.toneLabel(),
          formatting: {
            markdown: this.formatMarkdown(),
            emojis: this.formatEmojis(),
            latex: this.formatLaTeX(),
            citations: this.formatCitations()
          },
          assets: {
            webSearch: this.assetWebSearch(),
            computerVision: this.assetComputerVision()
          },
          engine: this.currentEngine(),
          chatHistory: this.messages().slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error('API server error');
      }

      const responseData = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: 'assistant_' + Date.now(),
        sender: 'assistant',
        persona: userMsg.persona,
        text: responseData.text,
        timestamp: new Date(),
        formula: responseData.formula,
        tableData: responseData.tableData
      };

      this.messages.update(m => [...m, assistantMsg]);
    } catch (e) {
      console.error('Error sending chat', e);
      // Fallback response simulation if server API fails / key is absent
      const fallbackText = this.simulateResponse(text, userMsg.persona);
      const assistantMsg: ChatMessage = {
        id: 'assistant_' + Date.now(),
        sender: 'assistant',
        persona: userMsg.persona,
        text: fallbackText.text,
        timestamp: new Date(),
        formula: fallbackText.formula,
        tableData: fallbackText.tableData
      };
      this.messages.update(m => [...m, assistantMsg]);
    } finally {
      this.isSending.set(false);
    }
  }

  private simulateResponse(input: string, persona: PersonaType): { text: string; formula?: string; tableData?: ChatMessage['tableData'] } {
    const toneText = this.toneLabel();
    if (persona === 'coder') {
      return {
        text: `Here is a custom typescript implementation aligned with your query on "${input}". Since my active styling is set to **${toneText}**, this incorporates optimal type safety and linear complexity:\n\n\`\`\`typescript\ninterface CoderStats {\n  performanceRating: number;\n  syntaxValid: boolean;\n}\n\nexport function optimizeStitchTask(query: string): CoderStats {\n  // Code block generated dynamically\n  console.log("Analyzing task query:", query);\n  return {\n    performanceRating: 0.99,\n    syntaxValid: true\n  };\n}\n\`\`\``
      };
    }
    if (persona === 'scientist') {
      return {
        text: `Affirmative. Testing your parameter matrix for "${input}" with the **${toneText}** configuration. In quantum telemetry, we represent the dimensional state overlap coefficient dynamically:`,
        formula: 'S = \\int_{-\\infty}^{\\infty} \\psi_a^*(x) \\psi_b(x) \\, dx = \\delta_{ab}',
        tableData: [
          { runId: 'S-7001', energy: 2.11, barrierH: 3.5, probability: 0.054 },
          { runId: 'S-7002', energy: 2.45, barrierH: 3.5, probability: 0.112 },
          { runId: 'S-7003', energy: 3.10, barrierH: 3.5, probability: 0.289 }
        ]
      };
    }
    if (persona === 'therapist') {
      return {
        text: `I hear your thoughts about "${input}". With my current tone being **${toneText}**, let's sit with this feeling. Imagine we are weaving together different threads of your emotional fabric. What part of this feels most heavy today? 🌸`
      };
    }
    if (persona === 'doctor') {
      return {
        text: `[Clinical Precision Protocol Active] Your query "${input}" indicates high cognitive loading. Under the **${toneText}** strict check system, the recommended diagnostic pathway suggests: \n\n1. Maintain hydrated status (minimum 2.5L/day).\n2. Schedule intervals of cognitive stillness (5 minutes/hour).\n3. Consult standard health metrics for physical tracking.`
      };
    }
    // Unhinged
    return {
      text: `🌀 BOOTING INTO DANGER OVERLOAD!! Query "${input}" is completely INSANE under our **${toneText}** tone settings!!! Let's break the matrix! 💥 🔬 Quantum portals are sparking right in our server lines! System override initiated!`
    };
  }
}
