import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Adresnica {
  _id?: string;
  imePrezime: string;
  adresa: string;
  telefon: string;
  otkup: string;
  napomena: string;
  country?: string;
  createdAt?: string;
}

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://posao-backend-uhw-ag.fly.dev/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getAll(country: string): Observable<Adresnica[]> {
    return this.http.get<Adresnica[]>(`${API_URL}/adresnice/${country}`);
  }

  create(country: string, data: Partial<Adresnica>): Observable<Adresnica> {
    return this.http.post<Adresnica>(`${API_URL}/adresnice/${country}`, data);
  }

  update(country: string, id: string, data: Partial<Adresnica>): Observable<Adresnica> {
    return this.http.put<Adresnica>(`${API_URL}/adresnice/${country}/${id}`, data);
  }

  delete(country: string, id: string): Observable<any> {
    return this.http.delete(`${API_URL}/adresnice/${country}/${id}`);
  }
}
