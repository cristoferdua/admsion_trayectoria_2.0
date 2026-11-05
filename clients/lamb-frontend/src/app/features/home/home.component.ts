import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KeycloakService } from '../../core/keycloak.service';

interface Tile {
  label: string;
  icon: string;
  route: string | any[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  kc = inject(KeycloakService);

  tiles: Tile[] = [
    { label: 'ADMISIÓN',    icon: 'how_to_reg', route: ['/crud', 'convocatorias'] },
    { label: 'TRAYECTORIA', icon: 'route',      route: '/trayectoria/plan' }
  ];
}
