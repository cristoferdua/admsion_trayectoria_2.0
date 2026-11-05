import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'crud/:slug',
        loadComponent: () => import('./features/crud-generic/crud-generic.component').then(m => m.CrudGenericComponent)
      },
      {
        path: 'admision/reniec',
        loadComponent: () => import('./features/admision/reniec-buscador.component').then(m => m.ReniecBuscadorComponent)
      },
      {
        path: 'admision/nueva-postulacion',
        loadComponent: () => import('./features/admision/wizard-postulacion.component').then(m => m.WizardPostulacionComponent)
      },
      {
        path: 'trayectoria/plan',
        loadComponent: () => import('./features/trayectoria/plan-academico.component').then(m => m.PlanAcademicoComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
