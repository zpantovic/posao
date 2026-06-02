import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

const PASSWORDS: Record<string, string> = {
  bih: 'BIHbjutiglam',
  cg: 'CGbjutiglam'
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private router = inject(Router);

  showModal = false;
  selectedCountry = '';
  password = '';
  error = false;

  openLogin(country: string) {
    if (sessionStorage.getItem(`auth_${country}`)) {
      this.router.navigate([`/${country}`]);
      return;
    }
    this.selectedCountry = country;
    this.password = '';
    this.error = false;
    this.showModal = true;
  }

  login() {
    if (this.password === PASSWORDS[this.selectedCountry]) {
      sessionStorage.setItem(`auth_${this.selectedCountry}`, '1');
      this.showModal = false;
      this.router.navigate([`/${this.selectedCountry}`]);
    } else {
      this.error = true;
      this.password = '';
    }
  }

  closeModal() {
    this.showModal = false;
    this.password = '';
    this.error = false;
  }
}
