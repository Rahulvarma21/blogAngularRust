import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
})
export class Register {
  registerForm: FormGroup;
  isSubmitting = false;
  successMessage = '';

  constructor(private fb: FormBuilder) {
    // 1. We construct the Reactive Form using FormBuilder
    // 2. We apply built-in Validators explicitly mapping to form fields
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Easy getter for clean HTML template logic
  get f() { 
    return this.registerForm.controls; 
  }

  onSubmit() {
    this.isSubmitting = true;
    this.successMessage = '';

    if (this.registerForm.invalid) {
      // Mark all fields as touched strictly blocking API calls when invalid
      this.registerForm.markAllAsTouched();
      return;
    }

    // Prepare exactly how API calls receive the format safely
    console.log("Successfully Prepared Payload for API Call:", this.registerForm.value);
    
    // Simulate successful form clearance and user feedback
    this.successMessage = "Registration successful! Data payload prepped.";
    this.registerForm.reset();
    this.isSubmitting = false;
  }
}
