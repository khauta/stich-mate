import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {StitchState, HubFile} from '../services/stitch-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-config',
  imports: [CommonModule, RouterLink],
  templateUrl: './config.html'
})
export class ConfigPage {
  readonly state = inject(StitchState);
  
  // Toast notifications
  readonly showToast = signal<boolean>(false);
  readonly toastMessage = signal<string>('');
  
  // Drag-and-drop / Ingest simulated file states
  readonly isDragging = signal<boolean>(false);

  // Mobile sidebar collapsing drawer
  readonly sidebarOpen = signal<boolean>(false);

  onToneSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    this.state.setTone(value);
  }

  saveLayout() {
    const activePersonaName = this.state.activeClassByPersonaMap[this.state.activePersona()].name;
    this.toastMessage.set(`Configuration settings for [${activePersonaName}] saved successfully!`);
    this.showToast.set(true);
    
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }

  toggleLayoutCheckbox(category: 'codeBlocks' | 'dataViz' | 'canvasDynamics', setting: string, event: Event) {
    const target = event.target as HTMLInputElement;
    this.state.updateLayoutConfig(this.state.activePersona(), category, setting, target.checked);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.ingestFile(file.name, file.size);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.ingestFile(file.name, file.size);
    }
  }

  private ingestFile(name: string, sizeInBytes: number) {
    // Format sizing
    let sizeStr = 'KB';
    let sizeNum = sizeInBytes / 1024;
    if (sizeNum > 1024) {
      sizeNum = sizeNum / 1024;
      sizeStr = 'MB';
    }
    const finalSize = `${sizeNum.toFixed(1)} ${sizeStr}`;

    // Get type
    const ext = name.split('.').pop()?.toLowerCase();
    let type: HubFile['type'] = 'other';
    let icon = 'description';
    if (ext === 'pdf') { type = 'pdf'; icon = 'picture_as_pdf'; }
    else if (ext === 'xlsx' || ext === 'xls') { type = 'xlsx'; icon = 'table_chart'; }
    else if (ext === 'csv') { type = 'csv'; icon = 'csv'; }
    else if (ext === 'zip' || ext === 'rar') { type = 'zip'; icon = 'folder_zip'; }
    else if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext || '')) { type = 'png'; icon = 'image'; }

    // Add to mediaFiles signal list in StitchState
    this.state.addMediaFile({
      name,
      size: finalSize,
      timeLabel: 'Just added',
      type,
      icon
    });

    this.toastMessage.set(`Successfully ingested [${name}] into Media Storage Hub!`);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
