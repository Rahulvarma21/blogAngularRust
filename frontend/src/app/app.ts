import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BindingDemo } from './binding-demo/binding-demo';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BindingDemo],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
