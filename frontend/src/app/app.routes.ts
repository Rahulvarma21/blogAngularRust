import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Detail } from './pages/detail/detail';
import { AuthGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },      // Public 
  { path: 'login', component: Login },    // Public
  { 
    path: 'dashboard', 
    component: Dashboard, 
    canActivate: [AuthGuard]             // Protected
  },
  { 
    path: 'detail/:id', 
    component: Detail,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: 'home' }
];
