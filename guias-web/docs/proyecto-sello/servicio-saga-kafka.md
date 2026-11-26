# Guía: agregar un servicio con saga Kafka al proyecto Lamb (examen final)

*Guía de práctica para el examen final de Distribuidas — Variante 4: `<tunombre>-notificacion-ms`*

| Dato | Valor |
|---|---|
| Repositorio del proyecto | [https://github.com/cristoferdua/Admision_Trayectoria_Lamb.git](https://github.com/cristoferdua/Admision_Trayectoria_Lamb.git) |
| Sitio de las guías | [https://cristoferdua.github.io/Admision_Trayectoria_Lamb/](https://cristoferdua.github.io/Admision_Trayectoria_Lamb/) |
| Examen de referencia | [Pagatu — Examen final práctico Variante 4](https://262dist.github.io/pagatu/examenes/examen-final-practico-v4-notificacion/) |
| Nombre del servicio en esta guía | `cristoferdua-notificacion-ms` (cámbialo por el tuyo) |

!!! info "Qué hace esta guía"
    Crea **desde cero** un microservicio pequeño que se suma a tu proyecto Lamb y cumple **todo** lo que pide el examen:
    base de datos con Flyway, Config Server, Eureka, ruta en el Gateway con `permitAll`, Kafka, una **saga**
    (`PENDIENTE → ENVIADA` o `PENDIENTE → CANCELADA`), idempotencia y un panel de Grafana que dice **ACTIVO / CAÍDO**.

    No es una guía de "servicio desde cero aislado": usa la infraestructura real de tu proyecto
    (Config Server, Eureka, Gateway, Kafka, Prometheus y Grafana).

!!! warning "Sin seguridad"
    Este microservicio **no lleva Spring Security ni Keycloak**. El examen lo prohíbe. El Gateway de tu proyecto
    sigue protegiendo las demás rutas; para esta ruta solamente agregas `permitAll`.

---

## 0. Cómo usar esta guía para crear **otros** servicios

La guía está escrita con el ejemplo del examen (`notificacion`). Para crear otro servicio con otro nombre
(`pagos`, `reservas`, `constancias`, etc.) cambia **solo** los valores de esta tabla desde el inicio.
El resto del código es el mismo patrón: un POST que publica un evento, un consumidor que aplica la saga,
un GET que lista y un panel de Grafana.

| Variable | Ejemplo del examen | Otro ejemplo | Dónde se usa |
|---|---|---|---|
| `PREFIJO` | `cristoferdua` | `cristoferdua` | artefacto, `spring.application.name`, archivo del Config Server, ruta del Gateway, group-id, contenedor Postgres |
| `SERVICIO` | `notificacion` | `pagos` | sufijo del artefacto, paquete Java, ruta REST |
| `ENTIDAD` | `Notificacion` | `Pago` | clases Java, tabla |
| `PLURAL` | `notificaciones` | `pagos` | tabla, ruta REST |
| `EVENTO` | `notificacion` | `pago` | nombres de eventos y topic |
| `TOPIC` | `notificacion-eventos` | `pago-eventos` | Kafka |
| `PUERTO` | `8090` | `8091` | `server.port` |
| `PUERTO_BD` | `15460` | `15461` | puerto de host del Postgres |
| `DB` | `lamb_notificacion_db` | `lamb_pagos_db` | datasource |
| `CONTENEDOR_BD` | `cristoferdua-postgres-notificacion-dev` | `cristoferdua-postgres-pagos-dev` | `container_name` |
| `PAQUETE` | `pe.edu.upeu.lamb.notificacion` | `pe.edu.upeu.lamb.pagos` | paquete Java |

!!! note "Reglas de nombres"
    Usa una sola palabra en minúsculas, sin tildes, sin espacios y sin guiones para `SERVICIO`, `ENTIDAD` y `EVENTO`.
    El prefijo es tu nombre y apellido en minúsculas (ejemplo: `cristoferdua`).

---

## 1. Qué pide el examen y dónde se cumple

| Pregunta | Ítem | Puntos | Sección de esta guía |
|---|---|---:|---|
| 1 | Base de datos y migración Flyway | 1 | [Paso 2](#paso-2-base-de-datos-y-flyway) |
| 1 | Configuración centralizada y Eureka | 1 | [Paso 3](#paso-3-config-server-y-eureka) |
| 1 | Ruta del Gateway y `permitAll` | 1 | [Paso 5](#paso-5-gateway) |
| 2 | Configuración de Kafka y grupo estable | 3 | [Paso 4](#paso-4-codigo-java) y [Paso 6](#paso-6-kafka) |
| 2 | Topic y mensaje en Kafka UI | 2 | [Paso 6](#paso-6-kafka) |
| 3 | Camino feliz | 2 | [Paso 7](#paso-7-probar-la-saga) |
| 3 | Idempotencia (una sola fila) | 1 | [Paso 7](#paso-7-probar-la-saga) |
| 3 | Compensación | 3 | [Paso 7](#paso-7-probar-la-saga) |
| 4 | Target UP en Prometheus | 1 | [Paso 8](#paso-8-prometheus-y-grafana) |
| 4 | Consulta del panel | 2 | [Paso 8](#paso-8-prometheus-y-grafana) |
| 4 | Mapeo ACTIVO / CAÍDO | 1 | [Paso 8](#paso-8-prometheus-y-grafana) |
| 4 | Apagar: el panel marca CAÍDO | 1 | [Paso 8](#paso-8-prometheus-y-grafana) |
| 4 | Encender: el panel marca ACTIVO | 1 | [Paso 8](#paso-8-prometheus-y-grafana) |
| | **Total** | **20** | |

---

## 2. Antes de empezar

### 2.1 Levanta la infraestructura que ya tienes

Desde la raíz del proyecto (`Lamb-Modulo02-Admision-Trayectoria`):

```powershell
docker compose -f kafka/compose-dev.yml up -d
docker compose -f keycloak/compose-dev.yml up -d
docker compose -f obs/compose-dev.yml up -d
```

Luego arranca, cada uno en su terminal y en este orden:

```powershell
cd infra\lamb-config
.\mvnw.cmd spring-boot:run
```

```powershell
cd infra\lamb-eureka
.\mvnw.cmd spring-boot:run
```

```powershell
cd infra\lamb-gateway
.\mvnw.cmd spring-boot:run
```

### 2.2 URLs y puertos que vas a usar

| Herramienta | URL / puerto |
|---|---|
| Config Server | http://localhost:18888 |
| Eureka | http://localhost:18761 |
| Gateway | http://localhost:18080 |
| Kafka (bootstrap) | `localhost:18092` |
| Kafka UI | http://localhost:18090 |
| Prometheus | http://localhost:19090 |
| Grafana | http://localhost:13000 (admin / admin) |
| Keycloak | http://localhost:18180 |

### 2.3 Elige un puerto libre

En tu proyecto ya están ocupados `8081` a `8089`. Usa **`8090`** para este servicio.
Los puertos de Postgres ocupados son `15451` a `15459`; usa **`15460`**.

!!! note "Si eliges otro puerto"
    Cambia `8090` y `15460` en **todos** los archivos de esta guía (config, compose, curl, Grafana).
    No uses `8088`: en tu proyecto ese puerto ya lo tiene `lamb-curriculo-ms`.

---

## Paso 0: nombres del examen

Para la variante 4 usa exactamente:

```text
Artefacto / spring.application.name : cristoferdua-notificacion-ms
Paquete Java                        : pe.edu.upeu.lamb.notificacion
Tabla                               : notificaciones
Topic                               : notificacion-eventos
Group-id                            : cristoferdua-notificacion-ms
Puerto del microservicio            : 8090
Puerto de host de Postgres          : 15460
Base de datos                       : lamb_notificacion_db
Contenedor Postgres                 : cristoferdua-postgres-notificacion-dev
```

---

## Paso 1: crear el proyecto Spring Boot

### 1.1 Carpeta del servicio

Crea la carpeta dentro de `services`:

```text
services\
└── cristoferdua-notificacion-ms\
```

Copia desde `services\lamb-trayectoria-ms` los archivos del Maven Wrapper:

```text
mvnw
mvnw.cmd
.mvn\
```

Así usas la misma versión de Maven que el resto del proyecto.

### 1.2 Dependencias (Spring Initializr)

Si usas [start.spring.io](https://start.spring.io), selecciona:

| Dependencia | Para qué |
|---|---|
| Spring Web (Web MVC) | Los endpoints REST |
| Spring Data JPA | La entidad y el repositorio |
| Flyway Migration | La tabla `notificaciones` |
| Validation | `@NotBlank`, `@Size` en el POST |
| Spring for Apache Kafka | Productor y consumidor |
| Spring Boot Actuator | `/actuator/health` y `/actuator/prometheus` |
| Config Client | Leer el `.yml` del Config Server |
| Eureka Discovery Client | Registrarse en Eureka |
| PostgreSQL Driver | La base de datos |
| Lombok | Menos código repetido |
| Prometheus (micrometer-registry-prometheus) | Métricas para Grafana |
| Springdoc OpenAPI (opcional) | Swagger |

!!! danger "No selecciones Spring Security"
    El examen no usa Keycloak ni JWT en este microservicio. Si agregas seguridad, el POST directo
    responderá `401` y perderás los puntos de la saga.

### 1.3 `pom.xml`

Reemplaza el `pom.xml` por este (ya incluye Kafka, Flyway, Eureka, Config, Actuator y Prometheus, **sin seguridad**):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>4.0.8</version>
		<relativePath/>
	</parent>
	<groupId>pe.edu.upeu</groupId>
	<artifactId>cristoferdua-notificacion-ms</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>cristoferdua-notificacion-ms</name>
	<description>Notificaciones con saga Kafka para el examen final</description>
	<properties>
		<java.version>21</java.version>
		<spring-cloud.version>2025.1.3</spring-cloud.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-config</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-flyway</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-validation</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-webmvc</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-kafka</artifactId>
		</dependency>
		<dependency>
			<groupId>org.flywaydb</groupId>
			<artifactId>flyway-database-postgresql</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springdoc</groupId>
			<artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
			<version>3.0.2</version>
		</dependency>
		<dependency>
			<groupId>io.micrometer</groupId>
			<artifactId>micrometer-registry-prometheus</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-devtools</artifactId>
			<scope>runtime</scope>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>org.postgresql</groupId>
			<artifactId>postgresql</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-flyway-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-validation-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-webmvc-test</artifactId>
			<scope>test</scope>
		</dependency>
	</dependencies>
	<dependencyManagement>
		<dependencies>
			<dependency>
				<groupId>org.springframework.cloud</groupId>
				<artifactId>spring-cloud-dependencies</artifactId>
				<version>${spring-cloud.version}</version>
				<type>pom</type>
				<scope>import</scope>
			</dependency>
		</dependencies>
	</dependencyManagement>
	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<executions>
					<execution>
						<id>default-compile</id>
						<phase>compile</phase>
						<goals><goal>compile</goal></goals>
						<configuration>
							<annotationProcessorPaths>
								<path>
									<groupId>org.projectlombok</groupId>
									<artifactId>lombok</artifactId>
								</path>
							</annotationProcessorPaths>
						</configuration>
					</execution>
					<execution>
						<id>default-testCompile</id>
						<phase>test-compile</phase>
						<goals><goal>testCompile</goal></goals>
						<configuration>
							<annotationProcessorPaths>
								<path>
									<groupId>org.projectlombok</groupId>
									<artifactId>lombok</artifactId>
								</path>
							</annotationProcessorPaths>
						</configuration>
					</execution>
				</executions>
			</plugin>
		</plugins>
	</build>
</project>
```

### 1.4 `src\main\resources\application.yml`

```yaml
spring:
  application:
    name: cristoferdua-notificacion-ms
  profiles:
    active: dev
  config:
    import: "optional:configserver:${CONFIG_SERVER_URL:http://localhost:18888}"
```

!!! note "Por qué solo tiene esto"
    El puerto, la base de datos, Kafka, Eureka y Actuator viven en el **Config Server**
    (`infra\lamb-config\config-repo`). Ese es el ítem de configuración centralizada.

### 1.5 Clase principal

`src\main\java\pe\edu\upeu\lamb\notificacion\NotificacionMsApplication.java`

```java
package pe.edu.upeu.lamb.notificacion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NotificacionMsApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificacionMsApplication.class, args);
    }
}
```

---

## Paso 2: base de datos y Flyway

### 2.1 `compose-dev.yml` del servicio

`services\cristoferdua-notificacion-ms\compose-dev.yml`

```yaml
name: cristoferdua-notificacion-dev

services:
  postgres-notificacion-dev:
    image: postgres:16-alpine
    container_name: cristoferdua-postgres-notificacion-dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: lamb_notificacion_db
      POSTGRES_USER: lamb
      POSTGRES_PASSWORD: lamb
    ports:
      - "15460:5432"
    volumes:
      - cristoferdua_notificacion_dev_data:/var/lib/postgresql/data

volumes:
  cristoferdua_notificacion_dev_data:
```

Levántalo:

```powershell
cd services\cristoferdua-notificacion-ms
docker compose -f compose-dev.yml up -d
docker ps --filter "name=cristoferdua-postgres-notificacion-dev"
```

### 2.2 Migración Flyway

`src\main\resources\db\migration\V1__crear_notificaciones.sql`

!!! important "Pega este script tal cual"
    La restricción `UNIQUE` sobre `referencia` es la que evita las filas duplicadas en la prueba de idempotencia.

```sql
CREATE TABLE notificaciones (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    referencia VARCHAR(40) NOT NULL,
    destinatario VARCHAR(120) NOT NULL,
    canal VARCHAR(20) NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_notificaciones_referencia UNIQUE (referencia)
);
```

Flyway la ejecuta al arrancar el microservicio. La configuración usa `ddl-auto: validate`,
así que Hibernate **no** crea la tabla: la crea Flyway.

---

## Paso 3: Config Server y Eureka

Crea el archivo:

`infra\lamb-config\config-repo\cristoferdua-notificacion-ms-dev.yml`

```yaml
server:
  port: 8090

spring:
  datasource:
    url: jdbc:postgresql://localhost:15460/lamb_notificacion_db
    username: lamb
    password: lamb
    driver-class-name: org.postgresql.Driver
  flyway:
    enabled: true
    locations: classpath:db/migration
  kafka:
    bootstrap-servers: localhost:18092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JacksonJsonSerializer
      properties:
        spring.json.add.type.headers: false
    consumer:
      group-id: cristoferdua-notificacion-ms
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JacksonJsonDeserializer
        spring.json.value.default.type: pe.edu.upeu.lamb.notificacion.event.NotificacionEvento
        spring.json.trusted.packages: pe.edu.upeu.lamb.notificacion.event
        spring.json.use.type.headers: false
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: false
  devtools:
    restart:
      enabled: true
    livereload:
      enabled: true

springdoc:
  swagger-ui:
    path: /swagger-ui.html

logging:
  level:
    pe.edu.upeu.lamb.notificacion: DEBUG

app:
  kafka:
    topic:
      eventos: notificacion-eventos

eureka:
  instance:
    hostname: localhost
    instance-id: ${spring.application.name}:${server.port}
  client:
    service-url:
      defaultZone: http://localhost:18761/eureka

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
```

!!! note "Los 5 bloques que califica el docente"
    - `server.port`: el puerto del microservicio.
    - `spring.datasource` + `flyway` + `ddl-auto: validate`: la base y la migración.
    - `spring.kafka`: productor, consumidor, group-id y deserializador.
    - `app.kafka.topic.eventos`: el nombre del topic.
    - `eureka` + `management`: registro y métricas para Prometheus.

Reinicia el Config Server para que lea el archivo nuevo:

```powershell
cd infra\lamb-config
.\mvnw.cmd spring-boot:run
```

Verifica que el archivo se sirve:

```powershell
curl.exe -s http://localhost:18888/cristoferdua-notificacion-ms/dev
```

Debe devolver el YAML con `port: 8090`, `notificacion-eventos`, etc.

---

## Paso 4: código Java

Crea los paquetes dentro de `src\main\java\pe\edu\upeu\lamb\notificacion\`:

```text
notificacion\
├── NotificacionMsApplication.java
├── config\KafkaTopicsConfig.java
├── controller\NotificacionController.java
├── dto\NotificacionRequest.java
├── dto\NotificacionResponse.java
├── entity\EstadoNotificacion.java
├── entity\Notificacion.java
├── event\NotificacionEvento.java
├── exception\GlobalExceptionHandler.java
├── messaging\NotificacionEventosConsumer.java
├── messaging\NotificacionEventosProducer.java
├── repository\NotificacionRepository.java
└── service\NotificacionService.java
```

### 4.1 Entidad y estado

`entity\EstadoNotificacion.java`

```java
package pe.edu.upeu.lamb.notificacion.entity;

public enum EstadoNotificacion {
    PENDIENTE,
    ENVIADA,
    CANCELADA
}
```

`entity\Notificacion.java`

```java
package pe.edu.upeu.lamb.notificacion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "referencia", nullable = false, length = 40, unique = true)
    private String referencia;

    @Column(name = "destinatario", nullable = false, length = 120)
    private String destinatario;

    @Column(name = "canal", nullable = false, length = 20)
    private String canal;

    @Column(name = "mensaje", nullable = false, length = 255)
    private String mensaje;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoNotificacion estado;

    @Column(name = "creado_en", nullable = false, insertable = false, updatable = false)
    private LocalDateTime creadoEn;
}
```

### 4.2 Repositorio

`repository\NotificacionRepository.java`

```java
package pe.edu.upeu.lamb.notificacion.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.lamb.notificacion.entity.Notificacion;

import java.util.List;
import java.util.Optional;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    boolean existsByReferencia(String referencia);

    Optional<Notificacion> findByReferencia(String referencia);

    List<Notificacion> findAllByOrderByIdDesc();
}
```

### 4.3 DTOs

`dto\NotificacionRequest.java`

```java
package pe.edu.upeu.lamb.notificacion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionRequest {

    @NotBlank
    @Size(max = 40)
    private String referencia;

    @NotBlank
    @Size(max = 120)
    private String destinatario;

    @NotBlank
    @Size(max = 20)
    private String canal;

    @NotBlank
    @Size(max = 255)
    private String mensaje;
}
```

`dto\NotificacionResponse.java`

```java
package pe.edu.upeu.lamb.notificacion.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionResponse {

    private Long id;
    private String referencia;
    private String destinatario;
    private String canal;
    private String mensaje;
    private String estado;
    private LocalDateTime creadoEn;
}
```

### 4.4 Evento de Kafka

`event\NotificacionEvento.java`

```java
package pe.edu.upeu.lamb.notificacion.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionEvento {

    private String tipo;
    private String referencia;
    private String destinatario;
    private String canal;
    private String mensaje;
    private Long timestamp;
}
```

`tipo` lleva uno de estos valores:

| `tipo` | Cuándo |
|---|---|
| `notificacion.solicitada` | Lo publica el POST |
| `notificacion.enviada` | Camino feliz |
| `notificacion.fallida` | Compensación |

### 4.5 Topic de Kafka

`config\KafkaTopicsConfig.java`

```java
package pe.edu.upeu.lamb.notificacion.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicsConfig {

    @Bean
    public NewTopic notificacionEventos(@Value("${app.kafka.topic.eventos}") String nombre) {
        return TopicBuilder.name(nombre).partitions(3).replicas(1).build();
    }
}
```

!!! note "Topic creado de forma explícita"
    Tu broker tiene `KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"`, así que los topics no se crean solos.
    Este bean los declara con `KafkaAdmin` al arrancar. También puedes crearlo desde Kafka UI o con el comando
    del [Paso 6](#paso-6-kafka). Para el examen, muestra el topic en Kafka UI de todos modos.

### 4.6 Productor

`messaging\NotificacionEventosProducer.java`

```java
package pe.edu.upeu.lamb.notificacion.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.edu.upeu.lamb.notificacion.event.NotificacionEvento;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificacionEventosProducer {

    private final KafkaTemplate<String, NotificacionEvento> kafkaTemplate;

    @Value("${app.kafka.topic.eventos}")
    private String topic;

    /**
     * Publica el evento. Si hay una transaccion abierta, espera al commit
     * para no avisar algo que luego se revierte.
     */
    public void publicar(NotificacionEvento evento) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    enviar(evento);
                }
            });
        } else {
            enviar(evento);
        }
    }

    private void enviar(NotificacionEvento evento) {
        kafkaTemplate.send(topic, evento.getReferencia(), evento)
                .whenComplete((resultado, ex) -> {
                    if (ex != null) {
                        log.error("component=producer topic={} referencia={} status=error error=\"{}\"",
                                topic, evento.getReferencia(), ex.getMessage());
                        return;
                    }
                    log.info("component=producer topic={} partition={} offset={} tipo={} referencia={} status=published",
                            resultado.getRecordMetadata().topic(),
                            resultado.getRecordMetadata().partition(),
                            resultado.getRecordMetadata().offset(),
                            evento.getTipo(), evento.getReferencia());
                });
    }
}
```

!!! important "La llave del mensaje"
    `kafkaTemplate.send(topic, evento.getReferencia(), evento)` usa la **referencia** como llave.
    Eso es exactamente lo que pide el examen y hace que los mensajes de la misma referencia vayan a la misma partición.

### 4.7 Servicio con la saga

`service\NotificacionService.java`

```java
package pe.edu.upeu.lamb.notificacion.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.lamb.notificacion.dto.NotificacionResponse;
import pe.edu.upeu.lamb.notificacion.entity.EstadoNotificacion;
import pe.edu.upeu.lamb.notificacion.entity.Notificacion;
import pe.edu.upeu.lamb.notificacion.event.NotificacionEvento;
import pe.edu.upeu.lamb.notificacion.messaging.NotificacionEventosProducer;
import pe.edu.upeu.lamb.notificacion.repository.NotificacionRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private static final String DESTINATARIO_INVALIDO = "INVALIDO";

    private final NotificacionRepository repository;
    private final NotificacionEventosProducer producer;

    @Transactional(readOnly = true)
    public List<NotificacionResponse> listar() {
        return repository.findAllByOrderByIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void procesarSaga(NotificacionEvento evento) {
        // 1) Idempotencia: si la referencia ya existe, se ignora el mensaje.
        if (repository.existsByReferencia(evento.getReferencia())) {
            log.warn("component=saga referencia={} status=ignored motivo=\"referencia duplicada\"",
                    evento.getReferencia());
            return;
        }

        // 2) Estado inicial PENDIENTE.
        Notificacion notificacion = repository.saveAndFlush(Notificacion.builder()
                .referencia(evento.getReferencia())
                .destinatario(evento.getDestinatario())
                .canal(evento.getCanal())
                .mensaje(evento.getMensaje())
                .estado(EstadoNotificacion.PENDIENTE)
                .build());

        // 3) Camino feliz o compensacion.
        boolean falla = DESTINATARIO_INVALIDO.equals(evento.getDestinatario());
        notificacion.setEstado(falla ? EstadoNotificacion.CANCELADA : EstadoNotificacion.ENVIADA);
        repository.save(notificacion);

        NotificacionEvento resultado = NotificacionEvento.builder()
                .tipo(falla ? "notificacion.fallida" : "notificacion.enviada")
                .referencia(notificacion.getReferencia())
                .destinatario(notificacion.getDestinatario())
                .canal(notificacion.getCanal())
                .mensaje(notificacion.getMensaje())
                .timestamp(System.currentTimeMillis())
                .build();
        producer.publicar(resultado);

        log.info("component=saga referencia={} estado={} status=processed",
                notificacion.getReferencia(), notificacion.getEstado());
    }

    private NotificacionResponse toResponse(Notificacion n) {
        return NotificacionResponse.builder()
                .id(n.getId())
                .referencia(n.getReferencia())
                .destinatario(n.getDestinatario())
                .canal(n.getCanal())
                .mensaje(n.getMensaje())
                .estado(n.getEstado().name())
                .creadoEn(n.getCreadoEn())
                .build();
    }
}
```

!!! note "Por qué hay `saveAndFlush` y luego `save`"
    `saveAndFlush` inserta la fila en **PENDIENTE** (la saga arranca ahí). Después, en la misma transacción,
    se cambia a **ENVIADA** o **CANCELADA** y se guarda. La fila nunca se queda en PENDIENTE.

### 4.8 Consumidor

`messaging\NotificacionEventosConsumer.java`

```java
package pe.edu.upeu.lamb.notificacion.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import pe.edu.upeu.lamb.notificacion.event.NotificacionEvento;
import pe.edu.upeu.lamb.notificacion.service.NotificacionService;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificacionEventosConsumer {

    private static final String SOLICITADA = "notificacion.solicitada";

    private final NotificacionService service;

    @KafkaListener(
            topics = "${app.kafka.topic.eventos}",
            properties = "spring.json.value.default.type=pe.edu.upeu.lamb.notificacion.event.NotificacionEvento")
    public void alRecibir(NotificacionEvento evento) {
        if (!SOLICITADA.equals(evento.getTipo())) {
            log.debug("component=consumer tipo={} referencia={} status=ignored",
                    evento.getTipo(), evento.getReferencia());
            return;
        }
        service.procesarSaga(evento);
    }
}
```

!!! note "El consumidor también recibe sus propios eventos"
    `notificacion.enviada` y `notificacion.fallida` viajan por el mismo topic. El consumidor los recibe,
    ve que `tipo` no es `notificacion.solicitada` y los ignora. Eso es normal y no rompe nada.

### 4.9 Controlador

`controller\NotificacionController.java`

```java
package pe.edu.upeu.lamb.notificacion.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.lamb.notificacion.dto.NotificacionRequest;
import pe.edu.upeu.lamb.notificacion.dto.NotificacionResponse;
import pe.edu.upeu.lamb.notificacion.event.NotificacionEvento;
import pe.edu.upeu.lamb.notificacion.messaging.NotificacionEventosProducer;
import pe.edu.upeu.lamb.notificacion.service.NotificacionService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionEventosProducer producer;
    private final NotificacionService service;

    /**
     * Recibe los datos, publica notificacion.solicitada y responde 202.
     * No guarda nada: el guardado lo hace el consumidor.
     */
    @PostMapping
    public ResponseEntity<Void> solicitar(@Valid @RequestBody NotificacionRequest request) {
        NotificacionEvento evento = NotificacionEvento.builder()
                .tipo("notificacion.solicitada")
                .referencia(request.getReferencia())
                .destinatario(request.getDestinatario())
                .canal(request.getCanal())
                .mensaje(request.getMensaje())
                .timestamp(System.currentTimeMillis())
                .build();
        producer.publicar(evento);
        return ResponseEntity.accepted().build();
    }

    @GetMapping
    public List<NotificacionResponse> listar() {
        return service.listar();
    }
}
```

### 4.10 Manejo de errores (opcional, pero recomendado)

`exception\GlobalExceptionHandler.java`

```java
package pe.edu.upeu.lamb.notificacion.exception;

import org.springframework.dao.DataIntegrityViolationException;
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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");
        body.put("message", "Error de validacion en los datos enviados");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", "Conflict");
        body.put("message", "La referencia ya existe");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }
}
```

### 4.11 Compilar y arrancar

```powershell
cd services\cristoferdua-notificacion-ms
.\mvnw.cmd clean package -DskipTests
.\mvnw.cmd spring-boot:run
```

Espera a ver en el log:

```text
Tomcat started on port 8090
DiscoveryClient ... registering service ...
```

Comprueba:

```powershell
curl.exe -s http://localhost:8090/actuator/health
```

Debe responder `{"status":"UP"}`.

!!! danger "Si ves `401` o `403` en el POST directo"
    Agregaste Spring Security al microservicio. Quítalo: el examen no lo usa. Revisa que el `pom.xml`
    no tenga `spring-boot-starter-security-oauth2-resource-server` y que el YAML del Config Server no tenga
    `spring.security.oauth2`.

---

## Paso 5: Gateway

### 5.1 Ruta en el Config Server

Edita `infra\lamb-config\config-repo\lamb-gateway-dev.yml` y agrega esta ruta dentro de `routes:`
(por ejemplo, después de la ruta de `lamb-trayectoria`):

```yaml
            - id: cristoferdua-notificacion
              uri: lb://cristoferdua-notificacion-ms
              predicates:
                - Path=/api/v1/notificaciones/**
```

### 5.2 `permitAll` en la seguridad del Gateway

Edita `infra\lamb-gateway\src\main\java\pe\edu\upeu\lamb\gateway\config\SecurityConfig.java`
y agrega esta línea **antes** de las reglas que autentican el resto (por ejemplo, justo después de
`.requestMatchers("/actuator/**", "/error").permitAll()`):

```java
                        .requestMatchers("/api/v1/notificaciones/**").permitAll()
```

La regla debe quedar **antes** de `anyRequest().authenticated()`. Spring aplica la primera regla que coincide.

### 5.3 Reinicia el Gateway

```powershell
cd infra\lamb-gateway
.\mvnw.cmd spring-boot:run
```

Prueba por el Gateway (sin token):

```powershell
curl.exe -i http://localhost:18080/api/v1/notificaciones
```

Debe responder `HTTP/1.1 200` y `[]` (o la lista de notificaciones).

!!! warning "El Gateway sigue usando Keycloak para las demás rutas"
    No quites la seguridad del Gateway. Solo agregas `permitAll` para `/api/v1/notificaciones/**`.
    Si el Gateway no arranca porque Keycloak no está, levanta Keycloak como siempre:
    `docker compose -f keycloak/compose-dev.yml up -d`.

---

## Paso 6: Kafka

### 6.1 Crear el topic (si no lo creó el bean)

En Kafka UI (`http://localhost:18090`) o por comando:

```powershell
docker exec -it lamb-kafka-dev /opt/kafka/bin/kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --create --if-not-exists `
  --topic notificacion-eventos `
  --partitions 3 --replication-factor 1
```

Verifica:

```powershell
docker exec -it lamb-kafka-dev /opt/kafka/bin/kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --describe --topic notificacion-eventos
```

### 6.2 Ver el grupo del consumidor

Cuando el microservicio esté arriba y haya consumido al menos un mensaje:

```powershell
docker exec -it lamb-kafka-dev /opt/kafka/bin/kafka-consumer-groups.sh `
  --bootstrap-server localhost:9092 `
  --list
```

Debe aparecer `cristoferdua-notificacion-ms`. Para ver el estado:

```powershell
docker exec -it lamb-kafka-dev /opt/kafka/bin/kafka-consumer-groups.sh `
  --bootstrap-server localhost:9092 `
  --describe --group cristoferdua-notificacion-ms
```

En Kafka UI el grupo debe verse en estado **Stable**.

### 6.3 Ver el mensaje `notificacion.solicitada`

Haz el POST válido (ver [Paso 7](#paso-7-probar-la-saga)) y en Kafka UI entra a:

```text
Topics → notificacion-eventos → Messages
```

Debes ver:

- **Key**: `NOT-001` (la referencia)
- **Value**: el JSON con `"tipo":"notificacion.solicitada"`, `referencia`, `destinatario`, `canal` y `mensaje`.

---

## Paso 7: probar la saga

!!! important "Prueba la saga directo al microservicio"
    Usa `http://localhost:8090`. El Gateway (`http://localhost:18080`) se usa **solo** para el ítem del Gateway.
    Así lo pide el examen.

### 7.1 Camino feliz

```powershell
curl.exe -i -X POST http://localhost:8090/api/v1/notificaciones `
  -H "Content-Type: application/json" `
  -d '{\"referencia\":\"NOT-001\",\"destinatario\":\"ana@correo.com\",\"canal\":\"EMAIL\",\"mensaje\":\"Tu pedido salio\"}'
```

Respuesta esperada: `HTTP/1.1 202`.

Espera 2 o 3 segundos y consulta:

```powershell
curl.exe -s http://localhost:8090/api/v1/notificaciones
```

Debe mostrar una fila con `"estado":"ENVIADA"`.

En la base de datos:

```powershell
docker exec -it cristoferdua-postgres-notificacion-dev psql -U lamb -d lamb_notificacion_db `
  -c "SELECT id, referencia, destinatario, estado, creado_en FROM notificaciones ORDER BY id;"
```

En Kafka UI debe aparecer también `notificacion.enviada`.

### 7.2 Idempotencia (una sola fila)

Desde Kafka UI, entra al topic `notificacion-eventos` y **produce de nuevo** el mismo mensaje:

- **Key**: `NOT-001`
- **Value**:

```json
{"tipo":"notificacion.solicitada","referencia":"NOT-001","destinatario":"ana@correo.com","canal":"EMAIL","mensaje":"Tu pedido salio"}
```

Luego verifica que sigue habiendo **una sola fila**:

```powershell
docker exec -it cristoferdua-postgres-notificacion-dev psql -U lamb -d lamb_notificacion_db `
  -c "SELECT referencia, COUNT(*) FROM notificaciones GROUP BY referencia HAVING COUNT(*) > 1;"
```

No debe devolver filas. También puedes listar:

```powershell
curl.exe -s http://localhost:8090/api/v1/notificaciones
```

Debe seguir apareciendo una sola `NOT-001`.

### 7.3 Compensación (fallo)

```powershell
curl.exe -i -X POST http://localhost:8090/api/v1/notificaciones `
  -H "Content-Type: application/json" `
  -d '{\"referencia\":\"NOT-002\",\"destinatario\":\"INVALIDO\",\"canal\":\"EMAIL\",\"mensaje\":\"Tu pedido salio\"}'
```

Respuesta esperada: `HTTP/1.1 202`.

Espera y consulta:

```powershell
curl.exe -s http://localhost:8090/api/v1/notificaciones
```

Debe aparecer `NOT-002` con `"estado":"CANCELADA"`. En Kafka UI debe verse `notificacion.fallida`.
El microservicio **no se cae** y la fila **no queda en PENDIENTE**.

### 7.4 Resumen de pruebas

| Prueba | POST | Resultado en GET | Evento en Kafka UI |
|---|---|---|---|
| Camino feliz | `destinatario = ana@correo.com` | `ENVIADA` | `notificacion.enviada` |
| Idempotencia | mismo `referencia` repetido | una sola fila | no cambia el estado |
| Compensación | `destinatario = INVALIDO` | `CANCELADA` | `notificacion.fallida` |

---

## Paso 8: Prometheus y Grafana

### 8.1 Prometheus descubre el servicio por Eureka

Abre `http://localhost:19090/targets` y busca `cristoferdua-notificacion-ms`.
Debe estar en estado **UP**. No tienes que configurar nada: `obs\prometheus\prometheus-dev.yml`
ya usa `eureka_sd_configs`.

Si no aparece, revisa:

```powershell
curl.exe -s http://localhost:8090/actuator/prometheus
curl.exe -s http://localhost:18761/eureka/apps
```

### 8.2 Panel de Grafana

1. Abre `http://localhost:13000` (admin / admin).
2. **Dashboards → New → New dashboard → Add visualization**.
3. Elige **Prometheus** como fuente de datos.
4. Tipo de panel: **Stat**.
5. En la consulta pega:

```promql
max(up{application=~"(?i)cristoferdua-notificacion-ms"}) or vector(0)
```

6. Activa **Instant** (o usa un rango de 5 minutos).
7. En **Value mappings** agrega:
   - `1` → texto `ACTIVO`, color verde.
   - `0` → texto `CAÍDO`, color rojo.
8. Para que el fondo cambie de color, en **Standard options → Color mode** elige **Background**
   y en **Color scheme** elige **From thresholds (by value)**.
9. Título del panel: `Estado de cristoferdua-notificacion-ms`.
10. Guarda el dashboard.

!!! note "Por qué `(?i)`"
    Eureka escribe el nombre de la aplicación en mayúsculas (`CRISTOFERDUA-NOTIFICACION-MS`).
    `(?i)` hace que la comparación no distinga mayúsculas de minúsculas.

### 8.3 Apagar y encender

**Apagar:** detén el microservicio (`Ctrl+C` en su terminal). El panel debe pasar a **CAÍDO**.
Puede tardar hasta **2 minutos**, porque Eureka retiene la instancia un tiempo antes de olvidarla.

**Encender:** vuelve a arrancar el microservicio:

```powershell
cd services\cristoferdua-notificacion-ms
.\mvnw.cmd spring-boot:run
```

El panel debe volver a **ACTIVO**.

---

## Paso 9: checklist de calificación (20 puntos)

| # | Ítem | Puntos | Cómo lo demuestras |
|---|---|---:|---|
| 1 | Base de datos y migración | 1 | `docker ps` muestra `cristoferdua-postgres-notificacion-dev`; existe `V1__crear_notificaciones.sql`; la tabla `notificaciones` existe |
| 2 | Configuración centralizada y Eureka | 1 | `cristoferdua-notificacion-ms-dev.yml` en el Config Server; el servicio aparece en http://localhost:18761 |
| 3 | Ruta del Gateway y `permitAll` | 1 | `curl.exe http://localhost:18080/api/v1/notificaciones` responde `200` sin token |
| 4 | Configuración de Kafka y grupo estable | 3 | Kafka UI muestra el grupo `cristoferdua-notificacion-ms` en **Stable** |
| 5 | Topic y mensaje en Kafka UI | 2 | Topic `notificacion-eventos` con el mensaje `notificacion.solicitada` |
| 6 | Camino feliz | 2 | POST válido → GET muestra `ENVIADA` |
| 7 | Idempotencia | 1 | Repites el mensaje y sigue habiendo **una sola fila** |
| 8 | Compensación | 3 | POST con `INVALIDO` → GET muestra `CANCELADA` y Kafka UI muestra `notificacion.fallida` |
| 9 | Target UP en Prometheus | 1 | http://localhost:19090/targets muestra el servicio **UP** |
| 10 | Consulta del panel | 2 | El panel Stat devuelve 1 con el servicio arriba y 0 cuando está abajo |
| 11 | Mapeo ACTIVO / CAÍDO | 1 | `1` se ve **ACTIVO** en verde y `0` **CAÍDO** en rojo |
| 12 | Apagar | 1 | Detienes el servicio y el panel pasa a **CAÍDO** |
| 13 | Encender | 1 | Lo vuelves a arrancar y el panel vuelve a **ACTIVO** |

### Lo que revisa el docente en vivo (Tabla 4)

| Pregunta | Qué mira |
|---|---|
| 1 | `docker ps`, el archivo `cristoferdua-notificacion-ms-dev.yml`, el panel de Eureka y la llamada por el Gateway |
| 2 | Kafka UI: el grupo `cristoferdua-notificacion-ms`, el topic `notificacion-eventos` y el mensaje `notificacion.solicitada` |
| 3 | La tabla `notificaciones` y los mensajes del topic, con el POST válido, el repetido y el de fallo |
| 4 | Prometheus (Targets) y el panel de Grafana con el servicio encendido, apagado y otra vez encendido |

---

## Paso 10: problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El POST directo responde `401` | Agregaste Spring Security al microservicio | Quita la dependencia y el bloque `spring.security.oauth2` del YAML |
| El Gateway responde `401` en `/api/v1/notificaciones` | Falta `permitAll` o está después de `anyRequest()` | Agrega `.requestMatchers("/api/v1/notificaciones/**").permitAll()` antes de `anyRequest().authenticated()` y reinicia el Gateway |
| El Gateway responde `404` | Ruta no cargada o servicio no registrado | Revisa `lamb-gateway-dev.yml`, reinicia el Gateway y confirma que el servicio está en Eureka |
| El servicio no aparece en Eureka | `spring.application.name` distinto o Config Server no leído | Revisa `application.yml` y que el archivo se llame `cristoferdua-notificacion-ms-dev.yml` |
| Flyway falla al arrancar | La tabla ya existe o la migración está mal nombrada | Borra el volumen (`docker compose -f compose-dev.yml down -v`) y vuelve a levantar; el archivo debe ser `V1__crear_notificaciones.sql` |
| Hibernate dice que falta una columna | `ddl-auto` no es `validate` o la tabla no coincide | Usa `ddl-auto: validate` y pega el SQL del examen tal cual |
| El grupo de Kafka no aparece | El consumidor no arrancó o el topic no existe | Crea el topic y revisa el log del `@KafkaListener` |
| El grupo no está **Stable** | Deserialización fallando | Revisa `spring.json.value.default.type`, `spring.json.trusted.packages` y que el evento tenga `@NoArgsConstructor` |
| Se duplican filas | Falta el `UNIQUE` o el consumidor no verifica | Verifica `uk_notificaciones_referencia` y `existsByReferencia` |
| El panel dice **CAÍDO** con el servicio arriba | La consulta no coincide con el nombre o Prometheus no lo ve | Usa `(?i)cristoferdua-notificacion-ms` y revisa http://localhost:19090/targets |
| El panel tarda en cambiar | Eureka retiene la instancia | Espera hasta 2 minutos |
| El puerto `8090` está ocupado | Otro proceso | Cambia el puerto en el YAML del Config Server y en los curl |

---

## Anexo A: convertir esta guía en **otro** servicio

Supongamos que ahora te piden un servicio `pagos` con entidad `Pago`, topic `pago-eventos`,
puerto `8091` y base `lamb_pagos_db`. Haz los reemplazos **en este orden** y con
**Ctrl+H** de VS Code, activando **Aa** (distingue mayúsculas):

| # | Buscar | Reemplazar por |
|---:|---|---|
| 1 | `cristoferdua-notificacion-ms` | `cristoferdua-pagos-ms` |
| 2 | `lamb_notificacion_db` | `lamb_pagos_db` |
| 3 | `cristoferdua-postgres-notificacion-dev` | `cristoferdua-postgres-pagos-dev` |
| 4 | `cristoferdua_notificacion_dev_data` | `cristoferdua_pagos_dev_data` |
| 5 | `notificacion-eventos` | `pago-eventos` |
| 6 | `notificaciones` | `pagos` |
| 7 | `Notificacion` | `Pago` |
| 8 | `notificacion` | `pago` |
| 9 | `NOTIFICACION` | `PAGO` |
| 10 | `pe.edu.upeu.lamb.notificacion` | `pe.edu.upeu.lamb.pagos` |
| 11 | `8090` | `8091` |
| 12 | `15460` | `15461` |

!!! warning "El orden importa"
    Reemplaza primero el plural (`notificaciones` → `pagos`) y después el singular
    (`notificacion` → `pago`). Si lo haces al revés, `notificaciones` se convierte en `pagos` y luego
    el reemplazo de `notificacion` ya no encuentra nada (está bien), pero puedes romper palabras.
    Hazlo con calma y revisa el resultado.

Después de los reemplazos:

1. Renombra la carpeta `services\cristoferdua-notificacion-ms` → `services\cristoferdua-pagos-ms`.
2. Renombra el archivo del Config Server:
   `cristoferdua-notificacion-ms-dev.yml` → `cristoferdua-pagos-ms-dev.yml`.
3. Renombra las clases y archivos Java que llevan `Notificacion` → `Pago`
   (`Notificacion.java`, `NotificacionController.java`, etc.).
4. Cambia la ruta REST en el controlador:
   `/api/v1/notificaciones` → `/api/v1/pagos`.
5. Cambia la ruta en `lamb-gateway-dev.yml`:
   `Path=/api/v1/notificaciones/**` → `Path=/api/v1/pagos/**`.
6. Cambia el `permitAll` del Gateway:
   `/api/v1/notificaciones/**` → `/api/v1/pagos/**`.
7. Cambia los nombres de los eventos:
   `notificacion.solicitada` → `pago.solicitada`, `notificacion.enviada` → `pago.enviada`,
   `notificacion.fallida` → `pago.fallida`.
8. Cambia la consulta de Grafana:
   `cristoferdua-notificacion-ms` → `cristoferdua-pagos-ms`.
9. Cambia el `@KafkaListener` y el `spring.json.value.default.type` al nuevo paquete y clase.
10. Borra el volumen viejo de Postgres y levanta el nuevo:
    `docker compose -f compose-dev.yml down -v` y `docker compose -f compose-dev.yml up -d`.

!!! tip "Si quieres otro comportamiento"
    La saga es un patrón, no un texto fijo. Cambia solo:
    - El **disparador de fallo** (`DESTINATARIO_INVALIDO` en este ejemplo).
    - Los **estados** (`PENDIENTE`, `ENVIADA`, `CANCELADA`).
    - Los **nombres de los eventos**.
    El resto (POST 202, consumidor, idempotencia, GET, Kafka, Grafana) se queda igual.

---

## Anexo B: comandos rápidos

### Arranque completo

```powershell
# Infra
docker compose -f kafka/compose-dev.yml up -d
docker compose -f keycloak/compose-dev.yml up -d
docker compose -f obs/compose-dev.yml up -d

# Base del servicio nuevo
docker compose -f services/cristoferdua-notificacion-ms/compose-dev.yml up -d

# Config Server
cd infra\lamb-config
.\mvnw.cmd spring-boot:run

# Eureka (otra terminal)
cd infra\lamb-eureka
.\mvnw.cmd spring-boot:run

# Microservicio (otra terminal)
cd services\cristoferdua-notificacion-ms
.\mvnw.cmd spring-boot:run

# Gateway (otra terminal)
cd infra\lamb-gateway
.\mvnw.cmd spring-boot:run
```

### Pruebas

```powershell
# POST valido
curl.exe -i -X POST http://localhost:8090/api/v1/notificaciones `
  -H "Content-Type: application/json" `
  -d '{\"referencia\":\"NOT-001\",\"destinatario\":\"ana@correo.com\",\"canal\":\"EMAIL\",\"mensaje\":\"Tu pedido salio\"}'

# POST que dispara la compensacion
curl.exe -i -X POST http://localhost:8090/api/v1/notificaciones `
  -H "Content-Type: application/json" `
  -d '{\"referencia\":\"NOT-002\",\"destinatario\":\"INVALIDO\",\"canal\":\"EMAIL\",\"mensaje\":\"Tu pedido salio\"}'

# Listar
curl.exe -s http://localhost:8090/api/v1/notificaciones

# Por el Gateway (sin token)
curl.exe -i http://localhost:18080/api/v1/notificaciones
```

### Base de datos

```powershell
docker exec -it cristoferdua-postgres-notificacion-dev psql -U lamb -d lamb_notificacion_db `
  -c "SELECT id, referencia, destinatario, estado, creado_en FROM notificaciones ORDER BY id;"
```

### Kafka

```powershell
# Crear topic
docker exec -it lamb-kafka-dev /opt/kafka/bin/kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --create --if-not-exists `
  --topic notificacion-eventos `
  --partitions 3 --replication-factor 1

# Ver grupos
docker exec -it lamb-kafka-dev /opt/kafka/bin/kafka-consumer-groups.sh `
  --bootstrap-server localhost:9092 --list

# Ver el grupo
docker exec -it lamb-kafka-dev /opt/kafka/bin/kafka-consumer-groups.sh `
  --bootstrap-server localhost:9092 `
  --describe --group cristoferdua-notificacion-ms
```

### Parar todo

```powershell
docker compose -f services/cristoferdua-notificacion-ms/compose-dev.yml down
docker compose -f kafka/compose-dev.yml down
docker compose -f keycloak/compose-dev.yml down
docker compose -f obs/compose-dev.yml down
```

---

## Anexo C: tiempos sugeridos (100 minutos)

| Pregunta | Minutos |
|---|---:|
| 1 Base (BD, Config, Gateway) | 10 |
| 2 Kafka | 20 |
| 3 Saga | 25 |
| 4 Grafana | 35 |
| Margen y revisión en vivo | 10 |
| **Total** | **100** |

---

## Enlaces del proyecto

- Repositorio: [https://github.com/cristoferdua/Admision_Trayectoria_Lamb.git](https://github.com/cristoferdua/Admision_Trayectoria_Lamb.git)
- Sitio de guías: [https://cristoferdua.github.io/Admision_Trayectoria_Lamb/](https://cristoferdua.github.io/Admision_Trayectoria_Lamb/)
- Examen de referencia: [https://262dist.github.io/pagatu/examenes/examen-final-practico-v4-notificacion/](https://262dist.github.io/pagatu/examenes/examen-final-practico-v4-notificacion/)
- Eureka: http://localhost:18761
- Kafka UI: http://localhost:18090
- Prometheus: http://localhost:19090
- Grafana: http://localhost:13000
- Gateway: http://localhost:18080
