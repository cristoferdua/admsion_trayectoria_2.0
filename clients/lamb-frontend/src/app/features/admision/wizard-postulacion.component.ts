import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

interface ReniecResponse {
  dni: string;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  nombreCompleto: string | null;
  encontrado: boolean;
  fuente: string;
}

interface WizardResponse {
  idPostulante: number;
  idPersona: number;
  codigoPostulante: string;
  nombreCompleto: string;
  estado: string;
  periodo: string;
  mensajeConfirmacion: string;
  correoProgramado: boolean;
  correoDestino: string | null;
}

@Component({
  selector: 'app-wizard-postulacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wizard-postulacion.component.html',
  styleUrl: './wizard-postulacion.component.scss'
})
export class WizardPostulacionComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  paso = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

  // Paso 1 — DNI + RENIEC
  dni = signal('');
  reniec = signal<ReniecResponse | null>(null);

  // Paso 2 — Académico
  idConvocatoria = signal<number | null>(null);
  idPrograma = signal<number | null>(null);
  idModalidad = signal<number | null>(null);
  convocatorias = signal<any[]>([]);
  modalidades = signal<any[]>([]);

  // Paso 3 — Contacto
  colegio = signal('');
  anioEgreso = signal<number | null>(null);
  promedio = signal<number | null>(null);
  telefono = signal('');
  correo = signal('');
  apoderado = signal('');
  telefonoApoderado = signal('');

  // Resultado
  resultado = signal<WizardResponse | null>(null);

  puedePaso2 = computed(() => !!this.reniec()?.encontrado);
  puedePaso3 = computed(() => !!this.idConvocatoria() && !!this.idPrograma() && !!this.idModalidad());

  constructor() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.api.list<any>('/api/v1/convocatorias').subscribe({
      next: r => this.convocatorias.set(r.filter((c: any) => c.estado === 'ABIERTA')),
      error: () => this.convocatorias.set([])
    });
    this.api.list<any>('/api/v1/modalidades-admision').subscribe({
      next: r => this.modalidades.set(r),
      error: () => this.modalidades.set([])
    });
  }

  buscarDni() {
    const dni = this.dni().trim();
    if (!/^\d{8}$/.test(dni)) {
      this.error.set('El DNI debe tener 8 dígitos.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    this.api.get<ReniecResponse>(`/api/v1/admision/reniec/${dni}`).subscribe({
      next: r => {
        this.loading.set(false);
        this.reniec.set(r);
        if (!r.encontrado) this.error.set(`No se encontraron datos (${r.fuente}).`);
      },
      error: e => {
        this.loading.set(false);
        this.error.set(`Error RENIEC: ${e.status ?? ''} ${e.message ?? ''}`);
      }
    });
  }

  avanzar() {
    if (this.paso() === 1 && !this.puedePaso2()) return;
    if (this.paso() === 2 && !this.puedePaso3()) return;
    this.paso.update(p => Math.min(3, p + 1));
  }

  volver() {
    this.paso.update(p => Math.max(1, p - 1));
  }

  registrar() {
    const r = this.reniec();
    if (!r?.encontrado) return;
    const payload = {
      dni: r.dni,
      nombres: r.nombres,
      apellidoPaterno: r.apellidoPaterno,
      apellidoMaterno: r.apellidoMaterno,
      idConvocatoria: this.idConvocatoria(),
      idPrograma: this.idPrograma(),
      idModalidad: this.idModalidad(),
      colegioProcedencia: this.colegio() || null,
      anioEgresoColegio: this.anioEgreso(),
      promedioColegio: this.promedio(),
      telefonoContacto: this.telefono() || null,
      correoContacto: this.correo() || null,
      nombreApoderado: this.apoderado() || null,
      telefonoApoderado: this.telefonoApoderado() || null
    };
    this.loading.set(true);
    this.error.set(null);
    this.api.post<WizardResponse>('/api/v1/admision/postulacion-wizard', payload).subscribe({
      next: res => {
        this.loading.set(false);
        this.resultado.set(res);
        this.paso.set(4);
      },
      error: e => {
        this.loading.set(false);
        const msg = e.error?.message || e.error?.detail || e.message || 'Error al registrar';
        this.error.set(`${e.status ?? ''} ${msg}`);
      }
    });
  }

  nuevo() {
    this.paso.set(1);
    this.dni.set('');
    this.reniec.set(null);
    this.idConvocatoria.set(null);
    this.idPrograma.set(null);
    this.idModalidad.set(null);
    this.colegio.set('');
    this.anioEgreso.set(null);
    this.promedio.set(null);
    this.telefono.set('');
    this.correo.set('');
    this.apoderado.set('');
    this.telefonoApoderado.set('');
    this.resultado.set(null);
    this.error.set(null);
  }

  irAListado() {
    this.router.navigate(['/crud/postulantes']);
  }
}
