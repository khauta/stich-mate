import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {StitchState} from '../services/stitch-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chat',
  imports: [CommonModule, RouterLink],
  templateUrl: './chat.html'
})
export class ChatPage {
  readonly state = inject(StitchState);
  
  // Local input field state
  readonly inputText = signal<string>('');
  
  // Media popover visibility
  readonly mediaPopoverOpen = signal<boolean>(false);
  
  // Sidebar state (for mobile)
  readonly sidebarOpen = signal<boolean>(false);
  
  // Microphone recording simulation
  readonly isRecording = signal<boolean>(false);

  onTextChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.inputText.set(target.value);
  }

  toggleMediaPopover(event: MouseEvent) {
    event.stopPropagation();
    this.mediaPopoverOpen.update(v => !v);
  }

  closeMediaPopover() {
    this.mediaPopoverOpen.set(false);
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  toggleRecording() {
    this.isRecording.update(v => !v);
  }

  onKeydownEnter(event: Event, textInputEl: HTMLTextAreaElement) {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.handleSend(textInputEl);
    }
  }

  attachFile(type: 'pdf' | 'xlsx' | 'csv') {
    const mockFiles = {
      pdf: { id: 'm_pdf', name: 'Analysis_Specifications.pdf', size: '1.2 MB', timeLabel: 'Now', type: 'pdf' as const, icon: 'picture_as_pdf' },
      xlsx: { id: 'm_xlsx', name: 'Sim_Data_Spreadsheet.xlsx', size: '450 KB', timeLabel: 'Now', type: 'xlsx' as const, icon: 'table_chart' },
      csv: { id: 'm_csv', name: 'Sim_Telemetry_v4.csv', size: '2.1 MB', timeLabel: 'Now', type: 'csv' as const, icon: 'csv' }
    };
    this.state.attachedFile.set(mockFiles[type]);
    this.mediaPopoverOpen.set(false);
  }

  async handleSend(textInputEl: HTMLTextAreaElement) {
    const text = this.inputText().trim();
    if (!text && !this.state.attachedFile()) return;
    
    // Clear input
    this.inputText.set('');
    if (textInputEl) {
      textInputEl.value = '';
      textInputEl.style.height = 'auto';
    }

    await this.state.sendMessage(text);
  }

  // Helper to render markdown-like structures
  renderMarkdown(text: string): string {
    if (!text) return '';
    let rendered = text;
    // Replace code blocks with HTML
    rendered = rendered.replace(/```typescript([\s\S]*?)```/g, '<pre class="bg-surface-container-lowest/80 p-md rounded-xl border border-outline-variant/10 font-mono text-sm overflow-x-auto text-blue-300">$1</pre>');
    rendered = rendered.replace(/```javascript([\s\S]*?)```/g, '<pre class="bg-surface-container-lowest/80 p-md rounded-xl border border-outline-variant/10 font-mono text-sm overflow-x-auto text-blue-300">$1</pre>');
    rendered = rendered.replace(/```([\s\S]*?)```/g, '<pre class="bg-surface-container-lowest/80 p-md rounded-xl border border-outline-variant/10 font-mono text-xs overflow-x-auto text-on-surface-variant">$1</pre>');
    // Replace code lines
    rendered = rendered.replace(/`([^`]+)`/g, '<code class="bg-surface-container-high/60 px-1.5 py-0.5 rounded font-mono text-xs text-primary">$1</code>');
    // Replace headings
    rendered = rendered.replace(/#### (.*)/g, '<h4 class="text-sm font-label-caps text-primary mt-sm mb-xs">$1</h4>');
    rendered = rendered.replace(/### (.*)/g, '<h3 class="text-md font-headline-md text-primary mt-md mb-xs">$1</h3>');
    // Replace bold
    rendered = rendered.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    return rendered;
  }
}
