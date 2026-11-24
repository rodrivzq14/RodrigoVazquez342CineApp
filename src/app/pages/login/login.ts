import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink} from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);

  // ?volver=/perfil lo pone el guard cuando quiso entrar a una página sin sesión
  readonly volver = input<string>();

  readonly error = signal('');
  readonly enviando = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async enviar() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.enviando.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      // solo rutas internas (que empiecen con una sola /), nunca otra página
      const destino = this.volver();
      this.router.navigateByUrl(destino?.startsWith('/') && !destino.startsWith('//') ? destino : '/');
    } catch {
      this.error.set('Email o contraseña incorrectos');
    } finally {
      this.enviando.set(false);
    }
  }
}