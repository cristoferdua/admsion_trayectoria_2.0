# S9 - Consistencia distribuida en procesos de negocio

*Guía principal: agregar un microservicio nuevo (sin CRUD) al proyecto Lamb - Parte 9 de 16 - 2026*

!!! note "Antes de empezar: debe estar levantado"
    Desde la raíz del proyecto (`Lamb-Modulo02-Admision-Trayectoria`). Si ya está corriendo, no lo arranques otra vez.

    **Docker** (Docker Desktop abierto; se pueden pegar en la misma terminal):

    ```powershell
    docker compose -f kafka/compose-dev.yml up -d    # Kafka + Kafka UI
    docker compose -f services/lamb-evaluacionn-ms/compose-dev.yml up -d    # BD de tu servicio
    ```

    **Servicios** (cada uno en **su propia terminal**, en este orden, esperando que diga `Started ...`):

    ```powershell
    cd infra\lamb-config; .\mvnw.cmd spring-boot:run    # Config Server
    cd infra\lamb-eureka; .\mvnw.cmd spring-boot:run    # Eureka
    cd services\lamb-evaluacionn-ms; .\mvnw.cmd spring-boot:run    # Tu servicio
    ```

    Comprueba que responden:

    - Kafka + Kafka UI: http://localhost:18090
    - BD de tu servicio: `docker ps` → `lamb-postgres-evaluacionn-dev` *Up*
    - Config Server: http://localhost:18888/lamb-evaluacionn-ms/dev
    - Eureka: http://localhost:18761
    - Tu servicio: http://localhost:8095/actuator/health

## 1. Introducción

Cuando un servicio **guarda en su base de datos** y **avisa por Kafka**, hay un riesgo:
avisar algo que al final **no se guardó** (por ejemplo, si la base de datos falla justo después).
Tu servicio ya está protegido: no tienes que escribir código nuevo, pero sí **entender y demostrar** por qué.

## 2. Lo que ya hace tu código

### 2.1 `publicarTrasCommit` en el productor

```java
public void publicarTrasCommit(EvaluacionnEvento evento) {
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
        // hay una transacción abierta: espera a que se confirme (commit)
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                enviar(evento);
            }
        });
    } else {
        // no hay transacción (ej. el botón de Hola mundo): envía de inmediato
        enviar(evento);
    }
}
```

| Situación | Qué pasa |
|---|---|
| Sin transacción (tu botón *Enviar evento*) | Se publica **de inmediato** |
| Con transacción que se guarda bien (ej. un CRUD con `@Transactional`) | Se publica **después** del commit |
| Con transacción que falla (error, validación, BD caída) | Se hace *rollback* y **no** se publica nada |

Es el mismo mecanismo que usa `PagoEventosProducer` en Pagatu.

## 3. Si te piden más: idempotencia

Kafka puede entregar **el mismo mensaje dos veces**. Si te piden que tu consumidor **haga algo** al recibir un
evento (ej. guardar un registro), debe ignorar los repetidos. Patrón de `pagatu-pago-ms` (`PagoServiceImpl.procesar`):

```java
@Transactional
public void procesar(EvaluacionnEvento evento) {
    if (historialRepository.existsByEventoId(evento.getId())) {      // tu repositorio y campo
        log.warn("component=processor id={} status=ignored motivo=\"evento duplicado\"", evento.getId());
        return;
    }
    // ... guardar lo que te pidan ...
}
```

Para la compensación (deshacer un paso cuando otro falla, como `pago.fallido` → orden `CANCELADA`), sigue la
[S9 original de Pagatu](https://262dist.github.io/pagatu/sesiones/S09_Consistencia_Distribuida_Procesos_Negocio/).

!!! note "Esta sección 3 no está en el ejemplo probado"
    Solo hazla si te la piden: el servicio funciona sin ella.

## 4. Probar

Tu botón no abre transacción, así que el evento sale enseguida. Pruébalo (en cualquier PowerShell):

```powershell
Invoke-RestMethod -Method Post http://localhost:8095/api/v1/evaluacionn/saludo/evento
```

En el log sale `component=producer ... status=published` en el mismo instante: es la rama `else` de `publicarTrasCommit` ("no hay transacción: envía de inmediato").

!!! note "Archivos de esta sesión"
    En esta sesión **no creas ni cambias archivos**: el código de la S8 ya lo hace.

## 5. Evidencia de cierre de la S9

- Captura del log con `status=published` al pulsar el botón.
- Explicación en tus palabras de `publicarTrasCommit`.

**Si te piden CRUD:** ahora haz la [parte S9 de la guía con CRUD](../proyecto-sello/servicio-con-crud.md#8-s9-no-publicar-si-no-se-guardo).

Siguiente: [S10 - Observabilidad](S10_Observabilidad_Diagnostico_Sistemas_Distribuidos.md).
