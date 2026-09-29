import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Validador propio: la fecha no puede ser futura ni de hace más de 120 años
function fechaNacimientoValida(control: AbstractControl) {
  if (!control.value) return null;
  const nacimiento = new Date(control.value);
  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

  return edad >= 0 && edad < 120 ? null : { edadInvalida: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly error = signal('');
  readonly enviando = signal(false);
  readonly sangres = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    fecha_nacimiento: ['', [Validators.required, fechaNacimientoValida]],
    tipo_sangre: ['', Validators.required],
    color_ojos: ['', Validators.required],
    dias_vacaciones: [0, [Validators.required, Validators.min(0), Validators.max(365)]],
  });

  async enviar() {
    if (this.form.invalid) return this.form.markAllAsTouched();

    this.enviando.set(true);
    this.error.set('');

    try {
      // Separamos email y password del resto: el resto viaja como metadata al trigger
      const { email, password, ...datos } = this.form.getRawValue();
      await this.auth.register(email, password, datos);
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo registrar');
    } finally {
      this.enviando.set(false);
    }
  }
}