import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'bih',
    loadComponent: () => import('./adresnice/adresnice.component').then(m => m.AdresnicePage)
  },
  {
    path: 'cg',
    loadComponent: () => import('./adresnice/adresnice.component').then(m => m.AdresnicePage)
  },
  { path: '**', redirectTo: '' }
];
