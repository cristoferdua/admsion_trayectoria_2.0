# S5 - Evaluación de la Unidad I

*Guía principal: agregar un microservicio nuevo (sin CRUD) al proyecto Lamb - Parte 5 de 16 - 2026*

!!! note "Antes de empezar: debe estar levantado"
    Desde la raíz del proyecto (`Lamb-Modulo02-Admision-Trayectoria`). Si ya está corriendo, no lo arranques otra vez.

    **Docker** (Docker Desktop abierto; se pueden pegar en la misma terminal):

    ```powershell
    docker compose -f services/lamb-evaluacionn-ms/compose-dev.yml up -d    # BD de tu servicio
    ```

    **Servicios** (cada uno en **su propia terminal**, en este orden, esperando que diga `Started ...`):

    ```powershell
    cd infra\lamb-config; .\mvnw.cmd spring-boot:run    # Config Server
    cd infra\lamb-eureka; .\mvnw.cmd spring-boot:run    # Eureka
    cd services\lamb-evaluacionn-ms; .\mvnw.cmd spring-boot:run    # Tu servicio
    cd services\lamb-evaluacionn-ms; .\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8096"    # 2da instancia
    cd infra\lamb-gateway; .\mvnw.cmd spring-boot:run    # Gateway (al final)
    ```

    Comprueba que responden:

    - BD de tu servicio: `docker ps` → `lamb-postgres-evaluacionn-dev` *Up*
    - Config Server: http://localhost:18888/lamb-evaluacionn-ms/dev
    - Eureka: http://localhost:18761
    - Tu servicio: http://localhost:8095/actuator/health
    - 2da instancia: http://localhost:8096/actuator/health
    - Gateway: http://localhost:18080/actuator/health

## 1. Qué debes demostrar

Al terminar la Unidad I tu servicio es un **sistema distribuido base**: funciona, toma su configuración del
Config Server, se registra en Eureka, se accede por el Gateway y puede correr en varias instancias.

## 2. Lista de evidencias

Toma una captura de cada una (sirven para el [Producto U1](../proyecto-sello/u1-producto.md)):

| N. | Evidencia | Cómo obtenerla | Sesión |
|---|---|---|---|
| 1 | El servicio compila | `.\mvnw.cmd -DskipTests package` → `BUILD SUCCESS` | S1 |
| 2 | Base de datos en Docker | `docker ps` → `lamb-postgres-evaluacionn-dev` | S1 |
| 3 | Configuración centralizada | http://localhost:18888/lamb-evaluacionn-ms/dev | S2 |
| 4 | Servicio sano | http://localhost:8095/actuator/health → `UP` | S2 |
| 5 | Swagger | http://localhost:8095/swagger-ui.html | S2 |
| 6 | Registro en Eureka (2 instancias) | http://localhost:18761 | S3 |
| 7 | Acceso por Gateway | http://localhost:18080/api/v1/evaluacionn/saludo | S4 |
| 8 | Balanceo de carga | `Saludo solicitado` en las consolas de las 2 instancias | S4 |

## 3. Preguntas que te pueden hacer

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué `application.yml` casi no tiene nada? | Porque la configuración vive en el Config Server; el servicio solo sabe su nombre y dónde pedirla. |
| ¿Cómo sabe el Gateway en qué puerto está tu servicio? | No lo sabe: usa `lb://lamb-evaluacionn-ms` y le pregunta a Eureka. |
| ¿Qué pasa si se cae una instancia? | Eureka la saca de la lista y el Gateway sigue mandando a la otra. |

**Si te piden CRUD:** ahora haz la [parte S5 de la guía con CRUD](../proyecto-sello/servicio-con-crud.md#5-s5-evidencias-extra-del-crud).

Siguiente: [S6 - Comunicación síncrona](S06_Comunicacion_Sincrona_Resiliente.md).
