import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from './dashboard/dashboard';
import { Detail } from './detail/detail';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    Dashboard,
    Detail
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule // Reuses common logic like loaders and pipes
  ]
})
export class DashboardModule { }
