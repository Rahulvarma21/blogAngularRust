import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  
  // 1. Static Public Route
  { path: 'home', component: Home },
  
  // 2. Feature-based Lazy Loading for AuthModule
  // This ensures the Login/Register logic is only loaded when users attempt to authenticate!
  { 
    path: '', 
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) 
  },
  
  // 3. Feature-based Lazy Loading for DashboardModule (Protected)
  // Encapsulates all dashboard, detail and user management features organically
  { 
    path: 'dashboard', 
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) 
  },
  
  { path: '**', redirectTo: 'home' }
];
