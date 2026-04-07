import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    // Reusable UI components would go here.
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    // Export components to make them available to feature modules.
  ]
})
export class SharedModule { }
