import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/chat').then(m => m.ChatPage)
  },
  {
    path: 'config',
    loadComponent: () => import('./pages/config').then(m => m.ConfigPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

