import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { KeycloakService } from '../core/keycloak.service';
import { CRUDS, CRUD_BY_SLUG } from '../features/cruds.catalog';

type ModuleKey = 'Admisión' | 'Trayectoria';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  kc = inject(KeycloakService);
  private router = inject(Router);

  collapsed = signal(false);
  private url = signal(this.router.url);

  // Módulo activo según la URL
  activeModule = computed<ModuleKey | null>(() => {
    const u = this.url();
    if (u.startsWith('/trayectoria')) return 'Trayectoria';
    if (u.startsWith('/admision')) return 'Admisión';
    const match = u.match(/^\/crud\/([^/?#]+)/);
    if (match) {
      const def = CRUD_BY_SLUG.get(match[1]);
      if (def) return def.group;
    }
    return null;
  });

  admision    = computed(() => CRUDS.filter(c => c.group === 'Admisión'));
  trayectoria = computed(() => CRUDS.filter(c => c.group === 'Trayectoria'));

  showAdmision    = computed(() => this.activeModule() === 'Admisión');
  showTrayectoria = computed(() => this.activeModule() === 'Trayectoria');

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.url.set(e.urlAfterRedirects));
  }

  toggle() { this.collapsed.update(v => !v); }
  logout() { this.kc.logout(); }
}
