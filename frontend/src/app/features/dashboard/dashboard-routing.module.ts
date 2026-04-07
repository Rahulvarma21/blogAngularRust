import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Detail } from './detail/detail';
import { AuthGuard } from '../../core/auth/auth-guard';

const routes: Routes = [
  { 
    path: '', 
    component: Dashboard,
    canActivate: [AuthGuard]
  },
  { 
    path: 'detail/:id', 
    component: Detail,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
