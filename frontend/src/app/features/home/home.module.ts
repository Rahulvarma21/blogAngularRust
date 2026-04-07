import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home } from './home/home';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    Home
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    Home
  ]
})
export class HomeModule { }
