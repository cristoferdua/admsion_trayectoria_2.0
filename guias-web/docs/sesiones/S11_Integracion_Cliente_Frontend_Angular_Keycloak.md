# S11 - Integración del cliente (frontend Angular con Keycloak)

*Guía principal: agregar un microservicio nuevo (sin CRUD) al proyecto Lamb - Parte 11 de 16 - 2026*

!!! note "Antes de empezar: debe estar levantado"
    Desde la raíz del proyecto (`Lamb-Modulo02-Admision-Trayectoria`). Si ya está corriendo, no lo arranques otra vez.

    **Docker** (Docker Desktop abierto; se pueden pegar en la misma terminal):

    ```powershell
    docker compose -f kafka/compose-dev.yml up -d    # Kafka + Kafka UI
    docker compose -f keycloak/compose-dev.yml up -d    # Keycloak (tarda ~1 min)
    docker compose -f services/lamb-evaluacionn-ms/compose-dev.yml up -d    # BD de tu servicio
    ```

    **Servicios** (cada uno en **su propia terminal**, en este orden, esperando que diga `Started ...`):

    ```powershell
    cd infra\lamb-config; .\mvnw.cmd spring-boot:run    # Config Server
    cd infra\lamb-eureka; .\mvnw.cmd spring-boot:run    # Eureka
    cd services\lamb-evaluacionn-ms; .\mvnw.cmd spring-boot:run    # Tu servicio
    cd infra\lamb-gateway; .\mvnw.cmd spring-boot:run    # Gateway (al final)
    ```

    Comprueba que responden:

    - Kafka + Kafka UI: http://localhost:18090
    - Keycloak: http://localhost:18180/realms/lamb
    - BD de tu servicio: `docker ps` → `lamb-postgres-evaluacionn-dev` *Up*
    - Config Server: http://localhost:18888/lamb-evaluacionn-ms/dev
    - Eureka: http://localhost:18761
    - Tu servicio: http://localhost:8095/actuator/health
    - Gateway: http://localhost:18080/actuator/health

    La primera vez, antes de `npm start`: `cd clients\lamb-frontend; npm install`. El frontend se arranca **en esta sesión** (paso 4).

## 1. Introducción

Agregas páginas al frontend Angular de Lamb (`clients\lamb-frontend`), **sin diseño**: HTML simple, sin
estilos ni componentes bonitos. Siguen el patrón de `features/catalogo` de Pagatu: un **service** que llama al
Gateway y componentes con su `.ts` y su `.html`. El login de Keycloak y el envío del token **ya los hace Lamb**.

Agregas **una página**: `/evaluacionn`, con el "Hola mundo" y un botón *Enviar evento a Kafka*.

Crea la carpeta `evaluacionn` (cambia por tu nombre): en VS Code, clic derecho en `clients\lamb-frontend\src\app\features\`
→ **New Folder** → `evaluacionn`. Ahí van **todos** los archivos `.ts` y `.html` de esta sesión (salvo `app.routes.ts`).

```text
clients\lamb-frontend\src\app\
├── app.routes.ts          <- se MODIFICA (rutas)
└── features\
    ├── admision\  inicio\  trayectoria\ ...   <- ya existen, no se tocan
    └── evaluacionn\        <- NUEVA: aquí creas todos los archivos
```

## 2. La página Hola mundo

### 2.1 `evaluacionn-service.ts`

**Crea el archivo:** `evaluacionn-service.ts`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Cómo:** clic derecho en la carpeta `evaluacionn` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EvaluacionnService {
  private readonly http = inject(HttpClient);

  saludo(): Observable<string> {
    return this.http.get(`${environment.apiUrl}/api/v1/evaluacionn/saludo`, { responseType: 'text' });
  }

  enviarEvento(): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/api/v1/evaluacionn/saludo/evento`, {});
  }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 2 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `Evaluacionn` (aparece 1 vez) → el nombre de **tu servicio**, con mayúscula. Ej.: `Tesoreria`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    El nombre de la clase y las rutas `/api/v1/evaluacionn/...`. `environment.apiUrl` es el Gateway (`http://localhost:18080`): no lo cambies.

### 2.2 `saludo.ts`

**Crea el archivo:** `saludo.ts`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Cómo:** clic derecho en la carpeta `evaluacionn` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EvaluacionnService } from './evaluacionn-service';

@Component({
  selector: 'app-saludo',
  imports: [],
  templateUrl: './saludo.html',
})
export class Saludo implements OnInit {
  private readonly evaluacionnService = inject(EvaluacionnService);
  protected readonly mensaje = signal('Cargando...');
  protected readonly resultado = signal<string | null>(null);

  ngOnInit(): void {
    this.evaluacionnService.saludo().subscribe({
      next: (texto) => this.mensaje.set(texto),
      error: () => this.mensaje.set('No se pudo conectar con el servicio.'),
    });
  }

  enviarEvento(): void {
    this.evaluacionnService.enviarEvento().subscribe({
      next: () => this.resultado.set('Evento enviado a Kafka.'),
      error: (err: HttpErrorResponse) =>
        this.resultado.set(err.status === 403 ? 'No tienes permiso para esta acción.' : 'No se pudo enviar el evento.'),
    });
  }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 4 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `Evaluacionn` (aparece 2 veces) → el nombre de **tu servicio**, con mayúscula. Ej.: `Tesoreria`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

### 2.3 `saludo.html`

**Crea el archivo:** `saludo.html`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Cómo:** clic derecho en la carpeta `evaluacionn` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```html
<h1>{{ mensaje() }}</h1>

<button (click)="enviarEvento()">Enviar evento a Kafka</button>
@if (resultado()) {
  <p>{{ resultado() }}</p>
}
```

**Qué cambiar en este código:** nada, se pega tal cual.

### 2.4 La ruta: `clients\lamb-frontend\src\app\app.routes.ts`

**Abre el archivo:** `app.routes.ts`  
**En la ruta:** `clients\lamb-frontend\src\app\`  
**Qué hacer:** Busca (`Ctrl+F`) la línea `{ path: '**', redirectTo: '' }` (casi al final) y pega **justo arriba** de ella. No borres lo demás del archivo.


```ts
  // ====== EVALUACIONN (paginas simples, sin diseño; piden login de Keycloak) ======
  {
    path: 'evaluacionn',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/evaluacionn/saludo').then((m) => m.Saludo)
  },
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 2 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `EVALUACIONN` (aparece 1 vez) → el nombre de **tu servicio**, en mayúsculas. Ej.: `TESORERIA`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

`adminGuard` (ya existe en Lamb) pide iniciar sesión en Keycloak. No lo cambies.

## 3. Probar

**Dónde abrir la terminal:** En la **raíz del proyecto** (`Lamb-Modulo02-Admision-Trayectoria`). En VS Code: *Terminal → New Terminal*. Déjala abierta: el frontend se queda corriendo ahí.

```powershell
cd clients\lamb-frontend
npm start
```

1. Abre http://localhost:4200/evaluacionn → te pide login → `admin` / `admin123`.
2. Si te deja en la página de inicio, vuelve a abrir http://localhost:4200/evaluacionn.
3. Ves **"Hola mundo desde lamb-evaluacionn-ms"**. Pulsa *Enviar evento a Kafka* → "Evento enviado a Kafka."
4. Cierra sesión, entra como `estudiante1` / `estudiante123` y pulsa el botón → "No tienes permiso para esta acción."

!!! note "Errores de Keycloak en la consola (F12)"
    Lamb muestra un error de CORS al cargar el perfil (`/realms/lamb/account`). Ya existía y no afecta a tus páginas.

!!! note "Archivos de esta sesión"
    **Creas** en `clients\lamb-frontend\src\app\features\evaluacionn\`:

    - `evaluacionn-service.ts`, `saludo.ts`, `saludo.html`

    **Modificas:**

    - `clients\lamb-frontend\src\app\app.routes.ts` - 1 ruta

## 4. Evidencia de cierre de la S11

- Capturas de la página funcionando (login, Hola mundo, "Evento enviado a Kafka.").
- Captura del `403` para `estudiante1`.

**Si te piden CRUD:** ahora haz la [parte S11 de la guía con CRUD](../proyecto-sello/servicio-con-crud.md#9-s11-frontend-lista-y-formulario).

Siguiente: [S12 - Evaluación de la Unidad II](S12_Evaluacion_Unidad_2.md).
