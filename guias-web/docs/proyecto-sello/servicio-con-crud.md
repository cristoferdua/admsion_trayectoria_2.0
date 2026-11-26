# Guía: agregar un servicio con CRUD a Lamb

*Guía de Proyecto Sello - complemento de la guía principal (S1 a S16) - 2026*

!!! note "Primero, la guía principal"
    Esta guía **no repite** lo que ya está en la guía principal (las sesiones S1 a S16), que enseña a agregar un
    servicio **sin CRUD** conectado a todo (Config, Eureka, Gateway, Keycloak, Kafka, Grafana y frontend).
    Aquí solo está **lo que agregas** para que tu servicio tenga un CRUD: tabla, entidad, DTO, mapper, servicio,
    controlador, rutas, roles, eventos y las páginas de lista y formulario.

## 1. Cómo usar esta guía

1. Haz una sesión de la guía principal (ej. la [S1](../sesiones/S01_Construccion_Servicio_Base.md)).
2. Al terminarla, haz **la parte de esa misma sesión** en esta guía (ej. la sección 2, "S1").
3. Pasa a la siguiente sesión de la guía principal y repite.

| Terminas en la guía principal... | Y aquí haces... |
|---|---|
| [S1 - Servicio base](../sesiones/S01_Construccion_Servicio_Base.md) | [2. Tabla, entidad, DTO, mapper, servicio y controlador](#2-s1-tabla-entidad-dto-mapper-servicio-y-controlador) |
| [S2 - Config Server](../sesiones/S02_Configuracion_Centralizada_Ambientes.md) | [3. Flyway crea la tabla](#3-s2-flyway-crea-la-tabla) |
| [S3 - Eureka](../sesiones/S03_Registro_Descubrimiento_Ejecucion_Concurrente.md) | nada |
| [S4 - Gateway](../sesiones/S04_Punto_Unico_Acceso_Distribucion_Trafico.md) | [4. Rutas y permisos del CRUD](#4-s4-rutas-y-permisos-del-crud) |
| [S5 - Evaluación U1](../sesiones/S05_Evaluacion_Unidad_1.md) | [5. Evidencias extra](#5-s5-evidencias-extra-del-crud) |
| [S6](../sesiones/S06_Comunicacion_Sincrona_Resiliente.md) / [S7b](../sesiones/S07b_Seguridad_Distribuida_Keycloak.md) / [S10](../sesiones/S10_Observabilidad_Diagnostico_Sistemas_Distribuidos.md) | nada (es igual con o sin CRUD) |
| [S7 - Seguridad](../sesiones/S07_Seguridad_Distribuida_Control_Acceso.md) | [6. Roles para el CRUD](#6-s7-roles-para-el-crud) |
| [S8 - Kafka](../sesiones/S08_Mensajeria_Asincrona_Entre_Servicios.md) | [7. Cada cambio del CRUD avisa a Kafka](#7-s8-cada-cambio-del-crud-avisa-a-kafka) |
| [S9 - Consistencia](../sesiones/S09_Consistencia_Distribuida_Procesos_Negocio.md) | [8. No publicar si no se guardó](#8-s9-no-publicar-si-no-se-guardo) |
| [S11 - Frontend](../sesiones/S11_Integracion_Cliente_Frontend_Angular_Keycloak.md) | [9. Lista y formulario](#9-s11-frontend-lista-y-formulario) |
| S12 a S16 | [10. Pruebas y preguntas del CRUD](#10-s12-a-s16-pruebas-y-preguntas-del-crud) |

El ejemplo es el mismo servicio de la guía principal, **`lamb-evaluacionn-ms`**, con un CRUD de **examenes**
(atributos `titulo` y `curso`) en la ruta `/api/v1/examenes`. Todo el código fue ejecutado y probado.

**Elige tus nombres** (además de los de la [S1, sección 2](../sesiones/S01_Construccion_Servicio_Base.md#2-elige-tus-nombres)):

| En la guía dice | Lo cambias por (ej. te piden "Pagos") | Se usa en |
|---|---|---|
| `examen` / `examenes` | `pago` / `pagos` | variables, tabla, ruta `/api/v1/pagos` |
| `Examen` | `Pago` | clases Java (`Pago`, `PagoRequest`...) |
| `titulo`, `curso` | los atributos que te pidan | tabla, entidad, DTOs, formulario |

### 1.1 Traduce los atributos que te piden

El ejemplo tiene 2 atributos: `titulo` (obligatorio) y `curso` (opcional). **Depende del caso que te den,
cambia estos atributos** en: la tabla (2.2), la entidad (2.3), el Request y el Response (2.4),
el servicio en `actualizar` (2.8) y el frontend (sección 9). Usa esta tabla:

| Te piden... | SQL | Java | Validación en el Request | Input en el formulario |
|---|---|---|---|---|
| texto | `VARCHAR(150)` | `String` | `@NotBlank @Size(max = 150)` | `<input type="text" formControlName="x" />` |
| número entero | `INTEGER` | `Integer` | `@NotNull @Min(0)` | `<input type="number" formControlName="x" />` |
| decimal / dinero | `NUMERIC(10,2)` | `BigDecimal` | `@NotNull @DecimalMin("0.0")` | `<input type="number" step="0.01" formControlName="x" />` |
| fecha | `DATE` | `LocalDate` | `@NotNull` | `<input type="date" formControlName="x" />` |
| sí / no | `BOOLEAN NOT NULL DEFAULT true` | `Boolean` | — | `<input type="checkbox" formControlName="x" />` |

Para un atributo **opcional**: quita `NOT NULL` del SQL, `nullable = false` de la entidad y `@NotBlank`/`@NotNull` del Request.

## 2. S1: tabla, entidad, DTO, mapper, servicio y controlador

!!! note "Antes de esta parte"
    Haz la [S1 de la guía principal](../sesiones/S01_Construccion_Servicio_Base.md) completa (proyecto, código base,
    `SaludoController` y base de datos en Docker). El `SaludoController` también va en el servicio con CRUD.

### 2.1 Las carpetas del CRUD

**Dónde abrir la terminal:** En la **raíz del proyecto** (`Lamb-Modulo02-Admision-Trayectoria`). En VS Code: *Terminal → New Terminal*. Si no sale nada, está bien.

```powershell
$java = "services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn"   # cambia por tu nombre
"dto","entity","exception","mapper","repository","service" | ForEach-Object { New-Item -ItemType Directory -Force "$java\$_" | Out-Null }
```

Así queda la carpeta Java de tu servicio:

```text
services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\
├── config\  controller\  filter\                    <- de la guía principal
└── dto\  entity\  exception\  mapper\  repository\  service\   <- NUEVAS (esta guía)
```

### 2.2 La tabla: `src\main\resources\db\migration\V1__create_examenes.sql`

Flyway crea la tabla sola al arrancar el servicio.

**Crea el archivo:** `V1__create_examenes.sql`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\resources\db\migration\`  
**Cómo:** clic derecho en la carpeta `migration` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Ojo:** El nombre lleva **dos** guiones bajos después de `V1` (`V1__`).  
**Y pega el siguiente código:**

```sql
CREATE TABLE IF NOT EXISTS examenes (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY,
    titulo VARCHAR(150) NOT NULL,
    curso VARCHAR(100),
    PRIMARY KEY (id)
);
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `examen` / `examenes` (aparece 1 vez) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `titulo`, `curso` (aparece 2 veces) → **tus atributos** (uno por cada atributo que te pidan). Ej.: `monto`, `fecha`. El tipo de cada uno está en la [tabla 1.1](#11-traduce-los-atributos-que-te-piden).
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Ejemplo: te piden “Pagos” con monto, fecha y método de pago"
    Archivo `V1__create_pagos.sql`:
    ```sql
    CREATE TABLE IF NOT EXISTS pagos (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY,
        monto NUMERIC(10,2) NOT NULL,
        fecha DATE NOT NULL,
        metodo_pago VARCHAR(30),
        PRIMARY KEY (id)
    );
    ```
    No cambies: `id BIGINT GENERATED BY DEFAULT AS IDENTITY` y `PRIMARY KEY (id)`.
    Los nombres con varias palabras van con guion bajo (`metodo_pago`).

!!! note "Nunca edites una migración ya aplicada"
    Si ya arrancaste el servicio y quieres cambiar la tabla, crea `V2__...sql`
    (ej. `ALTER TABLE examenes ADD COLUMN anio INTEGER;`). Si editas el `V1`, Flyway falla con `Migration checksum mismatch`.

### 2.3 `entity\Examen.java`

Una propiedad por columna.

**Crea el archivo:** `Examen.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\entity\`  
**Cómo:** clic derecho en la carpeta `entity` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "examenes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Examen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    @Column(name = "curso", length = 100)
    private String curso;
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 1 vez) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 1 vez) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 1 vez) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- `titulo`, `curso` (aparece 4 veces) → **tus atributos** (uno por cada atributo que te pidan). Ej.: `monto`, `fecha`. El tipo de cada uno está en la [tabla 1.1](#11-traduce-los-atributos-que-te-piden).
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Ejemplo para “Pagos”"
    ```java
    @Column(name = "monto", nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "metodo_pago", length = 30)
    private String metodoPago;          // columna metodo_pago -> propiedad metodoPago
    ```
    No cambies: las anotaciones de la clase y el bloque del `id`.

### 2.4 `dto\ExamenRequest.java` (lo que entra) y `dto\ExamenResponse.java` (lo que sale)

**Crea el archivo:** `ExamenRequest.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\dto\`  
**Cómo:** clic derecho en la carpeta `dto` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExamenRequest {

    @NotBlank
    @Size(max = 150)
    private String titulo;

    @Size(max = 100)
    private String curso;
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 1 vez) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `Examen` (aparece 1 vez) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- `titulo`, `curso` (aparece 2 veces) → **tus atributos** (uno por cada atributo que te pidan). Ej.: `monto`, `fecha`. El tipo de cada uno está en la [tabla 1.1](#11-traduce-los-atributos-que-te-piden).
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

**Crea el archivo:** `ExamenResponse.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\dto\`  
**Cómo:** clic derecho en la carpeta `dto` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamenResponse {
    private Long id;
    private String titulo;
    private String curso;
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 1 vez) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `Examen` (aparece 1 vez) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- `titulo`, `curso` (aparece 2 veces) → **tus atributos** (uno por cada atributo que te pidan). Ej.: `monto`, `fecha`. El tipo de cada uno está en la [tabla 1.1](#11-traduce-los-atributos-que-te-piden).
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    Los atributos (los mismos de la entidad, **sin `id`** en el Request y **con `id`** en el Response) y sus validaciones (tabla 1.1).

### 2.5 `mapper\ExamenMapper.java` (MapStruct)

MapStruct genera solo el código que copia los datos entre la entidad y los DTO.

**Crea el archivo:** `ExamenMapper.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\mapper\`  
**Cómo:** clic derecho en la carpeta `mapper` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.edu.upeu.lamb.evaluacionn.dto.ExamenRequest;
import pe.edu.upeu.lamb.evaluacionn.dto.ExamenResponse;
import pe.edu.upeu.lamb.evaluacionn.entity.Examen;

@Mapper(componentModel = "spring")
public interface ExamenMapper {

    ExamenResponse toResponse(Examen examen);

    @Mapping(target = "id", ignore = true)
    Examen toEntity(ExamenRequest request);
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 4 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 1 vez) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 8 veces) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    Solo los nombres (`Examen` → tu entidad). No tienes que escribir los atributos: MapStruct los copia solo si se llaman igual.

**Agrega MapStruct al `pom.xml`** (copia tal cual). Son **2 cambios** en el mismo archivo.

**Abre el archivo:** `pom.xml`  
**En la ruta:** `services\lamb-evaluacionn-ms\`  
**Qué hacer:** Busca la **primera** línea `</dependencies>` (cierra la lista de dependencias, cerca de la línea 112) y pega este bloque **justo arriba** de ella. No borres lo demás del archivo.


```xml
		<dependency>
			<groupId>org.mapstruct</groupId>
			<artifactId>mapstruct</artifactId>
			<version>1.6.3</version>
		</dependency>
```

**Qué cambiar en este código:** nada, se pega tal cual.

**Cambio 2:** en el **mismo** `pom.xml`, busca `<annotationProcessorPaths>` (sale **2 veces**: en `default-compile` y en `default-testCompile`).
En **cada una**, debajo del `</path>` que cierra el de Lombok (`<artifactId>lombok</artifactId>`), pega:

```xml
								<path>
									<groupId>org.mapstruct</groupId>
									<artifactId>mapstruct-processor</artifactId>
									<version>1.6.3</version>
								</path>
```

**Qué cambiar en este código:** nada, se pega tal cual.

### 2.6 `repository\ExamenRepository.java`

**Crea el archivo:** `ExamenRepository.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\repository\`  
**Cómo:** clic derecho en la carpeta `repository` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.lamb.evaluacionn.entity.Examen;

public interface ExamenRepository extends JpaRepository<Examen, Long> {
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 2 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `Examen` (aparece 3 veces) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

### 2.7 `exception\ResourceNotFoundException.java` y `exception\GlobalExceptionHandler.java` - copia tal cual

Responden `404` cuando no existe el registro y `400` cuando los datos no pasan la validación.

**Crea el archivo:** `ResourceNotFoundException.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\exception\`  
**Cómo:** clic derecho en la carpeta `exception` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String mensaje) {
        super(mensaje);
    }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 1 vez) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

**Crea el archivo:** `GlobalExceptionHandler.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\exception\`  
**Cómo:** clic derecho en la carpeta `exception` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Not Found");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");
        body.put("message", "Error de validación en los datos enviados");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 1 vez) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

### 2.8 `service\ExamenService.java`

En la [sección 7 (S8)](#7-s8-cada-cambio-del-crud-avisa-a-kafka) se le agrega el aviso a Kafka.

**Crea el archivo:** `ExamenService.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\service\`  
**Cómo:** clic derecho en la carpeta `service` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.lamb.evaluacionn.dto.ExamenRequest;
import pe.edu.upeu.lamb.evaluacionn.dto.ExamenResponse;
import pe.edu.upeu.lamb.evaluacionn.entity.Examen;
import pe.edu.upeu.lamb.evaluacionn.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.evaluacionn.mapper.ExamenMapper;
import pe.edu.upeu.lamb.evaluacionn.repository.ExamenRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamenService {

    private final ExamenRepository examenRepository;
    private final ExamenMapper examenMapper;

    public List<ExamenResponse> listar() {
        return examenRepository.findAll().stream()
                .map(examenMapper::toResponse)
                .toList();
    }

    public ExamenResponse obtener(Long id) {
        return examenMapper.toResponse(buscarOFallar(id));
    }

    @Transactional
    public ExamenResponse crear(ExamenRequest request) {
        Examen examen = examenRepository.save(examenMapper.toEntity(request));
        return examenMapper.toResponse(examen);
    }

    @Transactional
    public ExamenResponse actualizar(Long id, ExamenRequest request) {
        Examen examen = buscarOFallar(id);
        examen.setTitulo(request.getTitulo());
        examen.setCurso(request.getCurso());
        return examenMapper.toResponse(examenRepository.save(examen));
    }

    @Transactional
    public void eliminar(Long id) {
        examenRepository.delete(buscarOFallar(id));
    }

    private Examen buscarOFallar(Long id) {
        return examenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Examen no encontrado: " + id));
    }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 7 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 18 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 18 veces) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    Los nombres (`Examen` → tu entidad), el mensaje `"Examen no encontrado: "` y, en `actualizar`,
    **un `examen.setX(request.getX());` por cada atributo**. Ej. para Pagos:
    `pago.setMonto(request.getMonto()); pago.setFecha(request.getFecha()); pago.setMetodoPago(request.getMetodoPago());`

### 2.9 `controller\ExamenController.java`

| Método | Ruta | Responde |
|---|---|---|
| `GET` | `/api/v1/examenes` | `200` lista |
| `GET` | `/api/v1/examenes/{id}` | `200` o `404` |
| `POST` | `/api/v1/examenes` | `201` o `400` |
| `PUT` | `/api/v1/examenes/{id}` | `200`, `400` o `404` |
| `DELETE` | `/api/v1/examenes/{id}` | `204` o `404` |

**Crea el archivo:** `ExamenController.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\controller\`  
**Cómo:** clic derecho en la carpeta `controller` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Ojo:** Va en la misma carpeta que `SaludoController.java`.  
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.lamb.evaluacionn.dto.ExamenRequest;
import pe.edu.upeu.lamb.evaluacionn.dto.ExamenResponse;
import pe.edu.upeu.lamb.evaluacionn.service.ExamenService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/examenes")
@RequiredArgsConstructor
public class ExamenController {

    private final ExamenService examenService;

    @GetMapping
    public List<ExamenResponse> listar() {
        log.info("Listando examenes");
        return examenService.listar();
    }

    @GetMapping("/{id}")
    public ExamenResponse obtener(@PathVariable Long id) {
        return examenService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExamenResponse crear(@Valid @RequestBody ExamenRequest request) {
        return examenService.crear(request);
    }

    @PutMapping("/{id}")
    public ExamenResponse actualizar(@PathVariable Long id, @Valid @RequestBody ExamenRequest request) {
        return examenService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        examenService.eliminar(id);
    }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 4 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 8 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 11 veces) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    Los nombres y la ruta `@RequestMapping("/api/v1/examenes")` (en plural: `/api/v1/pagos`). Los 5 métodos se quedan igual.

### 2.10 Compilar

**Dónde abrir la terminal:** En la **raíz del proyecto** (`Lamb-Modulo02-Admision-Trayectoria`). El bloque entra a la carpeta de tu servicio.

```powershell
cd services\lamb-evaluacionn-ms
.\mvnw.cmd -DskipTests package
```

Debe terminar en `BUILD SUCCESS` y debe existir
`target\generated-sources\annotations\...\mapper\ExamenMapperImpl.java` (lo generó MapStruct).

!!! note "Archivos de esta parte"
    **Creas** (dentro de `services\lamb-evaluacionn-ms\`):

    - `src\main\resources\db\migration\V1__create_examenes.sql`
    - en `src\main\java\pe\edu\upeu\lamb\evaluacionn\`: `entity\Examen.java`, `dto\ExamenRequest.java`, `dto\ExamenResponse.java`, `mapper\ExamenMapper.java`, `repository\ExamenRepository.java`, `exception\ResourceNotFoundException.java`, `exception\GlobalExceptionHandler.java`, `service\ExamenService.java` (**se reemplaza en la sección 7**), `controller\ExamenController.java`

    **Modificas:** `pom.xml` (MapStruct).

Siguiente: [S2 de la guía principal](../sesiones/S02_Configuracion_Centralizada_Ambientes.md).

## 3. S2: Flyway crea la tabla

En la S2 **no hay archivos nuevos** para el CRUD: el `-dev.yml` del Config Server ya trae la base de datos y Flyway.
Solo hay más cosas que comprobar.

**Al arrancar tu servicio** (S2, paso 4), en el log además debe salir:

```text
Successfully applied 1 migration to schema "public", now at version v1
```

Eso quiere decir que Flyway creó la tabla.

**En VS Code (Database Client, S2 paso 5):** despliega `lamb_evaluacionn_db` → `public` → *Tables*:

| Tabla | Qué es |
|---|---|
| `examenes` | Tu tabla. Clic en ella para ver los registros (se llenan al agregar desde la página o la API) |
| `flyway_schema_history` | La crea Flyway: lista de migraciones aplicadas (`V1`, `V2`...). **No la modifiques** |

```sql
SELECT * FROM examenes;
```

Si agregas registros desde la página, clic derecho en la tabla → *Refresh* para ver los cambios.

**Evidencia extra de la S2:**

| Qué | Link | Qué debes ver |
|---|---|---|
| CRUD directo | http://localhost:8095/api/v1/examenes | `[]` |
| BD en VS Code | Database Client → `lamb_evaluacionn_db` | la tabla `examenes` |

## 4. S4: rutas y permisos del CRUD

En la S4 de la guía principal agregaste la ruta y el permiso del Hola mundo. Ahora agregas los del CRUD.

**1. La ruta.**

**Abre el archivo:** `lamb-gateway-dev.yml`  
**En la ruta:** `infra\lamb-config\config-repo\`  
**Qué hacer:** Busca (`Ctrl+F`) la ruta `- id: lamb-evaluacionn-saludo` que pegaste en la S4 y pega este bloque **justo debajo** de sus 4 líneas (antes de `- id: lamb-finanzas`). No borres lo demás del archivo.

```yaml
            - id: lamb-evaluacionn-examenes
              uri: lb://lamb-evaluacionn-ms
              predicates:
                - Path=/api/v1/examenes/**
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 2 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 2 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    `id` (único), `uri: lb://` + tu servicio y el `Path` de tu controlador (`/api/v1/pagos/**`). Si te piden otro CRUD
    en el mismo servicio, agrega otra ruta igual con su `Path`. No cambies la indentación (12 espacios antes de `- id:`).

**2. El permiso (fase 1, todo abierto).**

**Abre el archivo:** `SecurityConfig.java`  
**En la ruta:** `infra\lamb-gateway\src\main\java\pe\edu\upeu\lamb\gateway\config\`  
**Qué hacer:** Busca la línea que pegaste en la S4, `.requestMatchers("/api/v1/evaluacionn/**").permitAll()`, **bórrala** y en su lugar pega esta:

```java
                        .requestMatchers("/api/v1/evaluacionn/**", "/api/v1/examenes/**").permitAll()
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 1 vez) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 1 vez) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

**3. Reinicia el Gateway** (en su terminal `Ctrl+C` y otra vez `.\mvnw.cmd spring-boot:run`).

**4. Probar.** Abre http://localhost:18080/api/v1/examenes → `[]` o la lista. Y prueba el CRUD completo por el Gateway:

**Dónde abrir la terminal:** Cualquier PowerShell (no importa la carpeta). Pega **una línea a la vez** para ver qué responde cada una.

```powershell
$api = "http://localhost:18080/api/v1/examenes"                       # cambia por tu ruta
Invoke-RestMethod -Method Post $api -ContentType "application/json; charset=utf-8" -Body '{"titulo":"Parcial 1","curso":"Matematica"}'
Invoke-RestMethod $api                                              # mira el id
Invoke-RestMethod -Method Put "$api/1" -ContentType "application/json; charset=utf-8" -Body '{"titulo":"Parcial 1 (recuperacion)","curso":"Matematica"}'
Invoke-RestMethod -Method Delete "$api/1"
```

El `-Body` lleva **tus** atributos.

## 5. S5: evidencias extra del CRUD

Además de las evidencias de la [S5](../sesiones/S05_Evaluacion_Unidad_1.md):

| Evidencia | Cómo obtenerla | Parte |
|---|---|---|
| Tabla creada por Flyway | log: `Successfully applied 1 migration` | sección 3 |
| CRUD por Gateway | crear, listar, editar y eliminar con PowerShell | sección 4 |

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué el `V1__...sql` no se puede editar? | Flyway guarda un checksum de cada migración aplicada; si cambia, falla. Se crea un `V2`. |
| ¿Para qué sirven Request, Response y el mapper? | Separan lo que entra/sale por la API de la tabla; MapStruct copia los datos entre ellos. |

## 6. S7: roles para el CRUD

En la S7 de la guía principal pusiste 2 líneas en el `SecurityConfig` del **Gateway** (GET libre, POST solo `ADMIN`).
Con CRUD, también hay que proteger `PUT` y `DELETE`.

**Abre el archivo:** `SecurityConfig.java`  
**En la ruta:** `infra\lamb-gateway\src\main\java\pe\edu\upeu\lamb\gateway\config\`  
**Qué hacer:** Busca las 2 líneas con `/api/v1/evaluacionn/**` que pegaste en la S7, **bórralas** y en su lugar pega estas 4. No borres lo demás del archivo.

```java
                        .requestMatchers(HttpMethod.GET, "/api/v1/evaluacionn/**", "/api/v1/examenes/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/evaluacionn/**", "/api/v1/examenes/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/examenes/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/examenes/**").hasRole("ADMIN")
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 2 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 4 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

Guarda y **reinicia el Gateway**. Para otros roles (`hasAnyRole(...)`), usa la tabla de la S7.

**Probar** (sin iniciar sesión, cualquier PowerShell):

```powershell
Invoke-RestMethod http://localhost:18080/api/v1/examenes                            # 200
Invoke-RestMethod -Method Post http://localhost:18080/api/v1/examenes -ContentType "application/json" -Body '{"titulo":"x"}'   # 401
```

**Evidencia extra:** `PUT` y `DELETE` también responden `401` sin token.

## 7. S8: cada cambio del CRUD avisa a Kafka

En la S8 de la guía principal creaste el topic, el evento, el productor, el consumidor y el nuevo `SaludoController`.
Ahora el `ExamenService` publica un evento en cada `crear`, `actualizar` y `eliminar`:
`examen.creado`, `examen.actualizado` y `examen.eliminado`.

**Abre el archivo:** `ExamenService.java`  
**En la ruta:** `services\lamb-evaluacionn-ms\src\main\java\pe\edu\upeu\lamb\evaluacionn\service\`  
**Borra todo su contenido y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.evaluacionn.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.lamb.evaluacionn.dto.ExamenRequest;
import pe.edu.upeu.lamb.evaluacionn.dto.ExamenResponse;
import pe.edu.upeu.lamb.evaluacionn.entity.Examen;
import pe.edu.upeu.lamb.evaluacionn.event.EvaluacionnEvento;
import pe.edu.upeu.lamb.evaluacionn.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.evaluacionn.mapper.ExamenMapper;
import pe.edu.upeu.lamb.evaluacionn.messaging.EvaluacionnEventosProducer;
import pe.edu.upeu.lamb.evaluacionn.repository.ExamenRepository;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamenService {

    private final ExamenRepository examenRepository;
    private final ExamenMapper examenMapper;
    private final EvaluacionnEventosProducer producer;

    @Value("${spring.application.name}")
    private String nombreServicio;

    public List<ExamenResponse> listar() {
        return examenRepository.findAll().stream()
                .map(examenMapper::toResponse)
                .toList();
    }

    public ExamenResponse obtener(Long id) {
        return examenMapper.toResponse(buscarOFallar(id));
    }

    @Transactional
    public ExamenResponse crear(ExamenRequest request) {
        Examen examen = examenRepository.save(examenMapper.toEntity(request));
        publicar("examen.creado", examen);
        return examenMapper.toResponse(examen);
    }

    @Transactional
    public ExamenResponse actualizar(Long id, ExamenRequest request) {
        Examen examen = buscarOFallar(id);
        examen.setTitulo(request.getTitulo());
        examen.setCurso(request.getCurso());
        examen = examenRepository.save(examen);
        publicar("examen.actualizado", examen);
        return examenMapper.toResponse(examen);
    }

    @Transactional
    public void eliminar(Long id) {
        Examen examen = buscarOFallar(id);
        examenRepository.delete(examen);
        publicar("examen.eliminado", examen);
    }

    private Examen buscarOFallar(Long id) {
        return examenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Examen no encontrado: " + id));
    }

    private void publicar(String tipoEvento, Examen examen) {
        producer.publicarTrasCommit(EvaluacionnEvento.builder()
                .tipoEvento(tipoEvento)
                .id(examen.getId())
                .mensaje(examen.getTitulo())
                .origen(nombreServicio)
                .timestamp(Instant.now().toEpochMilli())
                .build());
    }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 9 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `Evaluacionn` (aparece 4 veces) → el nombre de **tu servicio**, con mayúscula. Ej.: `Tesoreria`.
- `examen` / `examenes` (aparece 31 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 20 veces) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Qué cambia respecto a la sección 2"
    Se agregaron: `producer`, `nombreServicio`, el método `publicar(...)` y una llamada `publicar("examen.xxx", examen)`
    en cada método que modifica. Cambia `"examen.creado"` etc. por tu recurso (`"pago.creado"`) y en
    `.mensaje(examen.getTitulo())` usa un atributo que identifique tu registro.

**Probar:** reinicia tu servicio y crea, edita y elimina un examen directo al servicio (sin token):

```powershell
$api = "http://localhost:8095/api/v1/examenes"
Invoke-RestMethod -Method Post $api -ContentType "application/json; charset=utf-8" -Body '{"titulo":"Parcial 1","curso":"Matematica"}'
Invoke-RestMethod -Method Put "$api/1" -ContentType "application/json; charset=utf-8" -Body '{"titulo":"Parcial 2","curso":"Matematica"}'
Invoke-RestMethod -Method Delete "$api/1"
```

En el log salen `examen.creado`, `examen.actualizado` y `examen.eliminado` (enviados y recibidos), y los ves en
**Kafka UI**: http://localhost:18090 → *Topics* → `evaluacionn-eventos` → *Messages*.

## 8. S9: no publicar si no se guardó

En `ExamenService`, `crear`, `actualizar` y `eliminar` tienen `@Transactional`: o se guarda **todo**, o **nada**.
Y el productor usa `publicarTrasCommit` (explicado en la [S9](../sesiones/S09_Consistencia_Distribuida_Procesos_Negocio.md)):

| Situación | Qué pasa |
|---|---|
| Se guarda bien | Después del commit se publica `examen.creado` |
| Falla al guardar (error, validación, BD caída) | Se hace *rollback* y **no** se publica nada |

**Probar:** envía un examen **inválido** (título vacío) y revisa que **no** salga ningún evento:

```powershell
Invoke-RestMethod -Method Post http://localhost:8095/api/v1/examenes -ContentType "application/json" -Body '{"titulo":""}'
```

Responde `400` ("Error de validación en los datos enviados") y en el log **no** aparece `component=producer`.
Con un examen válido sí aparece `examen.creado`.

**Evidencia extra:** captura del `400` sin evento y del `201` con su evento `examen.creado`.

## 9. S11: frontend, lista y formulario

En la S11 de la guía principal creaste la página Hola mundo (`evaluacionn-service.ts`, `saludo.ts`, `saludo.html`)
y su ruta. Ahora agregas la tabla y el formulario del CRUD, en la **misma** carpeta
`clients\lamb-frontend\src\app\features\evaluacionn\`.

| Página | Para qué |
|---|---|
| `/evaluacionn/examenes` | tabla con todos los registros |
| `/evaluacionn/examenes/nuevo` | formulario para agregar |
| `/evaluacionn/examenes/:id/editar` | el mismo formulario, para editar |

### 9.1 El link "Ver examenes" en la página Hola mundo

**Abre el archivo:** `saludo.html`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Borra todo su contenido y pega el siguiente código:**

```html
<h1>{{ mensaje() }}</h1>

<button (click)="enviarEvento()">Enviar evento a Kafka</button>
@if (resultado()) {
  <p>{{ resultado() }}</p>
}

<p><a routerLink="/evaluacionn/examenes">Ver examenes</a></p>
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 1 vez) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 2 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

**Abre el archivo:** `saludo.ts`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Borra todo su contenido y pega el siguiente código** (agrega `RouterLink`, que usa el link):

```ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { EvaluacionnService } from './evaluacionn-service';

@Component({
  selector: 'app-saludo',
  imports: [RouterLink],
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

### 9.2 `examen.model.ts`

**Crea el archivo:** `examen.model.ts`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Cómo:** clic derecho en la carpeta `evaluacionn` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```ts
export interface Examen {
  id?: number;
  titulo: string;
  curso?: string;
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `Examen` (aparece 1 vez) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- `titulo`, `curso` (aparece 2 veces) → **tus atributos** (uno por cada atributo que te pidan). Ej.: `monto`, `fecha`. El tipo de cada uno está en la [tabla 1.1](#11-traduce-los-atributos-que-te-piden).
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    Un atributo por cada campo del `ExamenResponse` (sección 2.4). `id?` siempre se queda. Tipos: texto → `string`,
    números → `number`, fecha → `string`, sí/no → `boolean`. Opcional → con `?`.

### 9.3 `examen-service.ts`

**Crea el archivo:** `examen-service.ts`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Cómo:** clic derecho en la carpeta `evaluacionn` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Examen } from './examen.model';

@Injectable({ providedIn: 'root' })
export class ExamenService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Examen[]> {
    return this.http.get<Examen[]>(`${environment.apiUrl}/api/v1/examenes`);
  }

  obtener(id: number): Observable<Examen> {
    return this.http.get<Examen>(`${environment.apiUrl}/api/v1/examenes/${id}`);
  }

  crear(examen: Examen): Observable<Examen> {
    return this.http.post<Examen>(`${environment.apiUrl}/api/v1/examenes`, examen);
  }

  actualizar(id: number, examen: Examen): Observable<Examen> {
    return this.http.put<Examen>(`${environment.apiUrl}/api/v1/examenes/${id}`, examen);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/v1/examenes/${id}`);
  }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `examen` / `examenes` (aparece 10 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 12 veces) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    Los nombres y la ruta `/api/v1/examenes`. Los 5 métodos se quedan igual.

### 9.4 `examen-list.ts` (la tabla)

**Crea el archivo:** `examen-list.ts`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Cómo:** clic derecho en la carpeta `evaluacionn` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ExamenService } from './examen-service';
import { Examen } from './examen.model';

@Component({
  selector: 'app-examen-list',
  imports: [RouterLink],
  templateUrl: './examen-list.html',
})
export class ExamenList implements OnInit {
  private readonly examenService = inject(ExamenService);
  protected readonly examenes = signal<Examen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly errorAccion = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.examenService.listar().subscribe({
      next: (data) => {
        this.examenes.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de examenes.');
        this.cargando.set(false);
      },
    });
  }

  eliminar(id: number): void {
    if (!confirm(`¿Seguro que quieres eliminar el examen ${id}?`)) {
      return;
    }
    this.errorAccion.set(null);
    this.examenService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => {
        this.errorAccion.set(
          err.status === 403 ? 'No tienes permiso para esta acción.' : 'No se pudo eliminar el examen.',
        );
      },
    });
  }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `examen` / `examenes` (aparece 12 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 5 veces) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

### 9.5 `examen-list.html`

**Crea el archivo:** `examen-list.html`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Cómo:** clic derecho en la carpeta `evaluacionn` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```html
<h1>Examenes</h1>

@if (cargando()) {
  <p>Cargando examenes...</p>
} @else if (error()) {
  <p>{{ error() }}</p>
} @else {
  <a routerLink="/evaluacionn/examenes/nuevo">Nuevo examen</a>

  @if (errorAccion()) {
    <p class="error">{{ errorAccion() }}</p>
  }

  <table>
    <thead>
      <tr><th>Titulo</th><th>Curso</th><th></th></tr>
    </thead>
    <tbody>
      @for (examen of examenes(); track examen.id) {
        <tr>
          <td>{{ examen.titulo }}</td>
          <td>{{ examen.curso }}</td>
          <td>
            <a [routerLink]="['/evaluacionn/examenes', examen.id, 'editar']">Editar</a>
            <button (click)="eliminar(examen.id!)">Eliminar</button>
          </td>
        </tr>
      } @empty {
        <tr><td colspan="3">No hay examenes registrados.</td></tr>
      }
    </tbody>
  </table>
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 2 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 12 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 1 vez) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- `titulo`, `curso` (aparece 4 veces) → **tus atributos** (uno por cada atributo que te pidan). Ej.: `monto`, `fecha`. El tipo de cada uno está en la [tabla 1.1](#11-traduce-los-atributos-que-te-piden).
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    Un `<th>` y un `<td>{{ examen.x }}</td>` por cada atributo que quieras mostrar, y las rutas `/evaluacionn/examenes...`.
    Ajusta el `colspan="3"` al número de columnas.

### 9.6 `examen-form.ts` (agregar y editar con el mismo formulario)

Si la ruta trae `:id`, carga el examen y al guardar hace `PUT`; si no, hace `POST`.

**Crea el archivo:** `examen-form.ts`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Cómo:** clic derecho en la carpeta `evaluacionn` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```ts
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ExamenService } from './examen-service';

@Component({
  selector: 'app-examen-form',
  imports: [ReactiveFormsModule],
  templateUrl: './examen-form.html',
})
export class ExamenForm {
  private readonly fb = inject(FormBuilder);
  private readonly examenService = inject(ExamenService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly id = signal<number | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    curso: ['', [Validators.maxLength(100)]],
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.id.set(id);
      this.cargando.set(true);
      this.examenService.obtener(id).subscribe({
        next: (examen) => {
          this.form.patchValue(examen);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el examen.');
          this.cargando.set(false);
        },
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    const id = this.id();
    const peticion = id ? this.examenService.actualizar(id, valor) : this.examenService.crear(valor);

    peticion.subscribe({
      next: () => this.router.navigate(['/evaluacionn/examenes']),
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 403 ? 'No tienes permiso para esta acción.' : 'No se pudo guardar el examen.',
        );
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/evaluacionn/examenes']);
  }

  protected mensajeValidacion(campo: 'titulo' | 'curso'): string {
    const control = this.form.controls[campo];

    if (!control.touched) return '';
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('maxlength')) {
      return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    }
    return '';
  }
}
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 2 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 13 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 3 veces) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- `titulo`, `curso` (aparece 4 veces) → **tus atributos** (uno por cada atributo que te pidan). Ej.: `monto`, `fecha`. El tipo de cada uno está en la [tabla 1.1](#11-traduce-los-atributos-que-te-piden).
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    En `form = this.fb.nonNullable.group({...})` va **un control por atributo** con sus validaciones
    (las mismas del Request), y en `mensajeValidacion(campo: 'titulo' | 'curso')` la lista de tus atributos.
    Ejemplo para Pagos:
    ```ts
    protected readonly form = this.fb.nonNullable.group({
      monto: [0, [Validators.required, Validators.min(0)]],
      fecha: ['', [Validators.required]],
      metodoPago: ['', [Validators.maxLength(30)]],
    });
    ```

### 9.7 `examen-form.html`

**Crea el archivo:** `examen-form.html`  
**En la ruta:** `clients\lamb-frontend\src\app\features\evaluacionn\`  
**Cómo:** clic derecho en la carpeta `evaluacionn` → **New File** (es un archivo, no una carpeta) → escribe el nombre exacto.  
**Y pega el siguiente código:**

```html
<h1>{{ id() ? 'Editar examen' : 'Nuevo examen' }}</h1>

<form [formGroup]="form" (ngSubmit)="guardar()">
  @if (cargando()) {
    <p>Cargando...</p>
  }

  <label>
    Titulo
    <input type="text" formControlName="titulo" />
  </label>
  @if (mensajeValidacion('titulo'); as mensaje) {
    <p class="error">{{ mensaje }}</p>
  }

  <label>
    Curso
    <input type="text" formControlName="curso" />
  </label>
  @if (mensajeValidacion('curso'); as mensaje) {
    <p class="error">{{ mensaje }}</p>
  }

  @if (error()) {
    <p class="error">{{ error() }}</p>
  }

  <button type="submit" [disabled]="cargando()">Guardar</button>
  <button type="button" (click)="cancelar()">Cancelar</button>
</form>
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `examen` / `examenes` (aparece 2 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `titulo`, `curso` (aparece 6 veces) → **tus atributos** (uno por cada atributo que te pidan). Ej.: `monto`, `fecha`. El tipo de cada uno está en la [tabla 1.1](#11-traduce-los-atributos-que-te-piden).
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

!!! note "Más detalle"
    Un bloque `<label>...<input formControlName="x" />...</label>` + su mensaje por cada atributo.
    El tipo de `<input>` está en la tabla 1.1.

### 9.8 Las rutas: `app.routes.ts`

**Abre el archivo:** `app.routes.ts`  
**En la ruta:** `clients\lamb-frontend\src\app\`  
**Qué hacer:** Busca la ruta `path: 'evaluacionn'` que pegaste en la S11 y pega esto **debajo** de su `},`. No borres lo demás del archivo.


```ts
  {
    path: 'evaluacionn/examenes',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/evaluacionn/examen-list').then((m) => m.ExamenList)
  },
  {
    path: 'evaluacionn/examenes/nuevo',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/evaluacionn/examen-form').then((m) => m.ExamenForm)
  },
  {
    path: 'evaluacionn/examenes/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/evaluacionn/examen-form').then((m) => m.ExamenForm)
  },
```

**Qué cambiar en este código** (ejemplo: si tu servicio es **Tesorería** y tu CRUD es **Pagos** con `monto` y `fecha`):

- `evaluacionn` (aparece 6 veces) → el nombre de **tu servicio**, en minúscula. Ej.: `tesoreria`.
- `examen` / `examenes` (aparece 6 veces) → el nombre de **tu CRUD**, en minúscula (singular / plural). Ej.: `pago` / `pagos`.
- `Examen` (aparece 3 veces) → el nombre de **tu CRUD**, con mayúscula. Ej.: `Pago`.
- Todo lo demás se copia **igual**. Tip: `Ctrl+H` en VS Code, con **Aa** activado (respeta mayúsculas).

### 9.9 Probar

Con el frontend corriendo (`cd clients\lamb-frontend; npm start`):

1. Entra como `admin` / `admin123` → http://localhost:4200/evaluacionn → *Ver examenes*.
2. *Nuevo examen* → llena el formulario → *Guardar* → aparece en la tabla.
3. *Editar* → cambia el título → *Guardar* → se actualiza.
4. *Eliminar* → confirma → desaparece.
5. Como `estudiante1` / `estudiante123`: ve la tabla, pero al guardar sale "No tienes permiso para esta acción."

**Evidencia extra:** capturas de la tabla, el formulario y eliminar, y del `403` para `estudiante1`.

## 10. S12 a S16: pruebas y preguntas del CRUD

### 10.1 Pruebas de la API (S13)

Además de las pruebas de la [S13](../sesiones/S13_Validacion_End_to_End_Producto.md):

| N. | Prueba | Esperado |
|---|---|---|
| 1 | `GET http://localhost:18080/api/v1/examenes` | `200` |
| 2 | `POST` sin token por el Gateway | `401` |
| 3 | `POST http://localhost:8095/api/v1/examenes` con datos válidos | `201` + `examen.creado` |
| 4 | `POST` con `{"titulo":""}` | `400` "Error de validación en los datos enviados" y **sin** evento |
| 5 | `PUT .../examenes/{id}` | `200` + `examen.actualizado` |
| 6 | `GET .../examenes/99999` | `404` "Examen no encontrado: 99999" |
| 7 | `DELETE .../examenes/{id}` | `204` + `examen.eliminado` |
| 8 | Datos con tildes y ñ (`"Año"`) | se guardan bien |

!!! note "Ver el código de error en PowerShell"
    `Invoke-RestMethod` lanza una excepción con `400`/`404`. Para ver solo el código:
    ```powershell
    try { Invoke-RestMethod http://localhost:8095/api/v1/examenes/99999 } catch { $_.Exception.Response.StatusCode.value__ }
    ```

En el navegador: con `admin`, nuevo, editar y eliminar funcionan; con `estudiante1`, *Guardar* responde
"No tienes permiso para esta acción.".

### 10.2 Evidencias extra (S12 y S15)

| Evidencia | Cómo obtenerla |
|---|---|
| Dato inválido → `400` sin evento | PowerShell (sección 8) |
| CRUD en el frontend | `/evaluacionn/examenes`: nuevo, editar, eliminar |
| CRUD completo con validaciones (`400`) y `404` | pruebas 4 y 6 de la tabla de arriba |

En la demostración (S15) muestra también el código: entidad → DTO → mapper → servicio → controlador.

### 10.3 Problemas comunes del CRUD (S14)

| Síntoma | Causa | Solución |
|---|---|---|
| `Migration checksum mismatch` | Editaste un `V1__...sql` ya aplicado | Devuelve el V1 como estaba y crea un `V2`. En desarrollo: `docker compose -f ... down -v` (**borra los datos**) |
| `Schema-validation: missing column` | La entidad tiene un atributo que no está en la tabla | Agrega la columna con una migración `V2` o corrige el nombre (`metodoPago` ↔ `metodo_pago`) |
| `No qualifying bean of type '...ExamenMapper'` | Falta `mapstruct-processor` en el `pom.xml` | Sección 2.5 (en **las dos** `annotationProcessorPaths`) |
| Gateway `404` en `/api/v1/examenes` | Falta la ruta del CRUD o no reiniciaste el Gateway | Sección 4 |
| `401` en `PUT`/`DELETE` siendo `admin` por PowerShell | Por PowerShell no hay token | Prueba desde el frontend o directo al `8095` |

Para encontrar lo que olvidaste al adaptarlo a otro caso (ej. **Pagos**), busca la palabra vieja:

```powershell
Get-ChildItem services\lamb-tesoreria-ms\src -Recurse -File | Select-String -Pattern "evaluacionn|examen"
```

Más errores, con el archivo a abrir y qué cambiar: [Solución de errores](../sesiones/Solucion_Errores.md).

### 10.4 Preguntas y cambios en vivo (S16)

| Pregunta | Respuesta corta |
|---|---|
| ¿Qué hace cada carpeta (`controller`, `service`, `repository`, `dto`, `entity`, `mapper`)? | Controlador recibe HTTP; servicio tiene la lógica; repositorio habla con la BD; DTO es lo que entra/sale; entidad es la tabla; mapper copia entre DTO y entidad. |
| ¿Cómo se crea la tabla? | Flyway ejecuta `V1__...sql` al arrancar y anota que ya lo aplicó. |
| ¿Qué pasa si falla la BD después de publicar? | No pasa: se publica **después** del commit (`publicarTrasCommit`). |

| Te piden | Qué haces | Dónde |
|---|---|---|
| "Agrega un atributo" | Migración `V2__...sql` + entidad + Request/Response + `actualizar` + formulario | secciones 1.1, 2 y 9 |
| "Agrega otra validación" | Anotación en el Request (`@Size`, `@Min`...) + `Validators` en el formulario | secciones 1.1, 2.4 y 9.6 |
| "Agrega otro CRUD en el mismo servicio" | Repite la sección 2 con otro nombre, otra ruta en el Gateway (4) y sus reglas (6) | secciones 2, 4, 6 y 9 |

## 11. Resumen de archivos del CRUD

Lo que agregas **encima** de lo de la guía principal (ver [Resumen rápido](../sesiones/Resumen_Rapido.md)):

```text
services\lamb-evaluacionn-ms\
├── pom.xml                                      + MapStruct (2.5)
└── src\main\
    ├── java\pe\edu\upeu\lamb\evaluacionn\
    │   ├── controller\ExamenController.java      2.9
    │   ├── entity\Examen.java                    2.3
    │   ├── dto\ExamenRequest.java                2.4
    │   ├── dto\ExamenResponse.java               2.4
    │   ├── mapper\ExamenMapper.java              2.5
    │   ├── repository\ExamenRepository.java      2.6
    │   ├── exception\ResourceNotFoundException.java   2.7
    │   ├── exception\GlobalExceptionHandler.java      2.7
    │   └── service\ExamenService.java            7  (versión final, con Kafka)
    └── resources\db\migration\V1__create_examenes.sql   2.2

clients\lamb-frontend\src\app\features\evaluacionn\
├── saludo.ts / saludo.html                      9.1 (con el link "Ver examenes")
├── examen.model.ts                              9.2
├── examen-service.ts                            9.3
├── examen-list.ts / .html                       9.4, 9.5
└── examen-form.ts / .html                       9.6, 9.7
```

| Archivo fuera de tu servicio | Qué agregas | Sección |
|---|---|---|
| `infra\lamb-config\config-repo\lamb-gateway-dev.yml` | la ruta `/api/v1/examenes/**` | 4 |
| `infra\lamb-gateway\...\config\SecurityConfig.java` | `examenes` en `permitAll` (S4) y luego `GET`/`POST`/`PUT`/`DELETE` por rol (S7) | 4 y 6 |
| `clients\lamb-frontend\src\app\app.routes.ts` | 3 rutas más | 9.8 |
