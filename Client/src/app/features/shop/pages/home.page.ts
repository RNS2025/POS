import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { UserRepository } from '../../../../Server/src/repositories/user.repository';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly health = signal<string>('Checking API…');

  ngOnInit(): void {
    this.api.getHealth().subscribe({
      next: (res) => {
        this.health.set(`API ${res.status} · DB ${res.db} · ${res.timestamp}`);
      },
      error: () => {
        this.health.set('API unreachable — is the Express server running on port 3000?');
      },
    });
  }

  createUser(): void {
    const userRepository = new UserRepository();
    userRepository.createUser({
      email: 'test@example.com',
      password: 'password',
    });
  }
}
