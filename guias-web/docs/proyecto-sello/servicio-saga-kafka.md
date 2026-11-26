# Guía: agregar un servicio con saga Kafka a tu proyecto Lamb (examen final)

*Guía de práctica para el examen final de Distribuidas — Variante 4: `<tunombre>-notificacion-ms`*

| Dato | Valor |
|---|---|
| Repositorio del proyecto | [https://github.com/cristoferdua/Admision_Trayectoria_Lamb.git](https://github.com/cristoferdua/Admision_Trayectoria_Lamb.git) |
| Sitio de las guías | [https://cristoferdua.github.io/Admision_Trayectoria_Lamb/](https://cristoferdua.github.io/Admision_Trayectoria_Lamb/) |
| Examen de referencia | [Pagatu — Examen final práctico Variante 4](https://262dist.github.io/pagatu/examenes/examen-final-practico-v4-notificacion/) |
| Nombre del servicio en esta guía | `cristoferdua-notificacion-ms` (cámbialo por el tuyo) |

!!! info "Esta guía es para TU proyecto que ya existe"
    No creas un proyecto nuevo desde cero. Esta guía **agrega un microservicio más** a tu proyecto
    `Lamb-Modulo02-Admision-Trayectoria`, que ya tiene Config Server, Eureka, Gateway, Kafka,
    Prometheus y Grafana funcionando. Al terminar tendrás un servicio nuevo integrado a todo eso
    y que cumple **todo** lo que pide el examen: base de datos con Flyway, Config Server, Eureka,
    ruta en el Gateway con `permitAll`, Kafka, una **saga** (`PENDIENTE → ENVIADA` o
    `PENDIENTE → CANCELADA`), idempotencia y un panel de Grafana que dice **ACTIVO / CAÍDO**.

!!! warning "Sin seguridad"
    Este microservicio **no lleva Spring Security ni Keycloak**. El examen lo prohíbe. El Gateway de tu proyecto
    sigue protegiendo las demás rutas; para esta ruta solamente agregas `permitAll`.

---

## Antes de todo: escribe tus nombres

Todo lo que vas a crear usa **tu nombre** y el **nombre del servicio**. Antes de empezar, copia esta
tabla en un papel (o en un archivo) y escribe tus valores en la columna **"Tu valor"**. Los vas a
necesitar en cada paso.

| Placeholder | Qué es | Ejemplo del examen | Tu valor (escríbelo) |
|---|---|---|---|
| `<prefijo>` | Tu nombre y apellido, en minúsculas y sin espacios | `cristoferdua` | |
| `<servicio>` | Nombre del servicio (el examen fija `notificacion`) | `notificacion` | |
| `<entidad>` | Nombre de la entidad en PascalCase | `Notificacion` | |
| `<plural>` | Tabla y ruta REST, en minúsculas | `notificaciones` | |
| `<evento>` | Prefijo de los eventos, en minúsculas | `notificacion` | |
| `<topic>` | Topic de Kafka | `notificacion-eventos` | |
| `<puerto>` | Puerto del microservicio | `8090` | |
| `<puerto-bd>` | Puerto de host del Postgres | `15460` | |
| `<db>` | Nombre de la base de datos | `lamb_notificacion_db` | |
| `<contenedor-bd>` | Nombre del contenedor Postgres | `cristoferdua-postgres-notificacion-dev` | |
| `<paquete>` | Paquete Java | `pe.edu.upeu.lamb.notificacion` | |

!!! tip "Ejemplo con otro nombre"
    Si te llamas **Juan Pérez**, tu `<prefijo>` es `juanperez`. Entonces el artefacto será
    `juanperez-notificacion-ms`, el contenedor `juanperez-postgres-notificacion-dev`, y en la
    consulta de Grafana usarás `juanperez-notificacion-ms`. El resto de nombres (servicio, entidad,
    topic) los fija el examen y **no cambian**.

### Diccionario: dónde aparece cada nombre

| Placeholder | Dónde lo vas a escribir |
|---|---|
| `<prefijo>` | artefacto del `pom.xml`, `spring.application.name`, nombre del archivo del Config Server, ruta del Gateway, `group-id` de Kafka, `container_name` de Postgres, consulta de Grafana |
| `<servicio>` | sufijo del artefacto, paquete Java, carpeta del proyecto |
| `<entidad>` | nombres de las clases Java (`Notificacion`, `NotificacionService`, ...) |
| `<plural>` | tabla de la base de datos, `@Table`, ruta REST `/api/v1/<plural>` |
| `<evento>` | nombres de los eventos (`<evento>.solicitada`, `<evento>.enviada`, `<evento>.fallida`) |
| `<topic>` | topic de Kafka y `app.kafka.topic.eventos` |
| `<puerto>` | `server.port` y todos los `curl` |
| `<puerto-bd>` | `ports` del compose y `spring.datasource.url` |
| `<db>` | `POSTGRES_DB` y `spring.datasource.url` |
| `<contenedor-bd>` | `container_name` del compose y los `docker exec` |
| `<paquete>` | `package` de todos los archivos Java y el YAML del Config Server |

!!! note "Reglas de nombres"
    Usa una sola palabra en minúsculas, sin tildes, sin espacios y sin guiones para `<servicio>`,
    `<entidad>` y `<evento>`. El `<prefijo>` es tu nombre y apellido en minúsculas.

---

## Cómo leer esta guía

Cada paso te dice **qué archivo crear o modificar**, **la ruta exacta** y **cómo hacerlo en VS Code**:

- **Para crear un archivo:** clic derecho en la carpeta → **New File** → escribe el nombre exacto.
- **Para crear una carpeta:** clic derecho en la carpeta → **New Folder** → escribe el nombre exacto.
- **Para abrir una terminal:** en VS Code, menú **Terminal → New Terminal**.
- **Para pegar código:** abre el archivo y pega el bloque completo.
- **Para buscar y reemplazar:** `Ctrl+H` en VS Code, con **Aa** activado (distingue mayúsculas).

!!! tip "🔁 El recuadro «Cambia esto»"
    En cada paso vas a ver un recuadro **🔁 Cambia esto**. Ahí te digo **exactamente** qué palabras
    debes reemplazar por tus valores de la tabla de arriba. Si un paso **no** tiene ese recuadro,
    copia el código tal cual, sin cambiar nada.

!!! note "Abre el proyecto completo en VS Code"
    Abre la carpeta **`Lamb-Modulo02-Admision-Trayectoria`** (la raíz del proyecto), no solo el servicio nuevo.
    Así ves `services`, `infra`, `kafka`, `obs`, etc. En VS Code: **File → Open Folder...** → elige
    `Lamb-Modulo02-Admision-Trayectoria`.

---

## Mapa de lo que vas a crear y modificar

| Acción | Archivo o carpeta | Paso |
|---|---|---|
| Crear | `services\<prefijo>-<servicio>-ms\` (el proyecto completo) | Paso 1 |
| Crear | `services\<prefijo>-<servicio>-ms\compose-dev.yml` | Paso 2 |
| Crear | `...\src\main\resources\db\migration\V1__crear_<plural>.sql` | Paso 2 |
| Crear | `infra\lamb-config\config-repo\<prefijo>-<servicio>-ms-dev.yml` | Paso 3 |
| Crear | 12 archivos Java en `...\src\main\java\<paquete>\` | Paso 4 |
| Modificar | `infra\lamb-config\config-repo\lamb-gateway-dev.yml` | Paso 5 |
| Modificar | `infra\lamb-gateway\...\config\SecurityConfig.java` | Paso 5 |
| Crear (UI) | topic `<topic>` en Kafka UI | Paso 6 |
| Crear (UI) | panel en Grafana | Paso 8 |

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

### 2.1 Lo que necesitas instalado

| Herramienta | Cómo comprobar que está |
|---|---|
| Docker Desktop | `docker --version` |
| Java 21 | `java -version` (debe decir 21) |
| VS Code | lo abres normalmente |
| Git | `git --version` |

### 2.2 Levanta la infraestructura que ya tienes

Abre una terminal en la **raíz del proyecto** (`Lamb-Modulo02-Admision-Trayectoria`).
En VS Code: **Terminal → New Terminal**.

```powershell
docker compose -f kafka/compose-dev.yml up -d
docker compose -f keycloak/compose-dev.yml up -d
docker compose -f obs/compose-dev.yml up -d
```

Comprueba que están arriba:

```powershell
docker ps
```

Debes ver `lamb-kafka-dev`, `lamb-kafka-ui-dev`, `lamb-prometheus-dev`, `lamb-grafana-dev` y los de Keycloak.

### 2.3 Arranca Config Server, Eureka y Gateway

Cada uno en **su propia terminal** y en este orden. Para abrir otra terminal: **Terminal → New Terminal**.

**Terminal 1 — Config Server:**

```powershell
cd infra\lamb-config
.\mvnw.cmd spring-boot:run
```

Espera a ver `Started ...` y deja esa terminal abierta.

**Terminal 2 — Eureka:**

```powershell
cd infra\lamb-eureka
.\mvnw.cmd spring-boot:run
```

**Terminal 3 — Gateway:**

```powershell
cd infra\lamb-gateway
.\mvnw.cmd spring-boot:run
```

### 2.4 URLs y puertos que vas a usar

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

### 2.5 Elige un puerto libre

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

## Paso 1: crear el proyecto con Spring Initializr

### 1.1 Abre Spring Initializr

Abre en tu navegador:

```text
https://start.spring.io
```

Verás un formulario a la izquierda y un panel con las dependencias a la derecha.

### 1.2 Llena los datos del proyecto

Llena **exactamente** estos campos:

| Campo | Qué poner |
|---|---|
| **Project** | `Maven` |
| **Language** | `Java` |
| **Spring Boot** | `4.0.8` (si no aparece, elige el mismo que usa `services\lamb-trayectoria-ms\pom.xml`) |
| **Group** | `pe.edu.upeu` |
| **Artifact** | `cristoferdua-notificacion-ms` |
| **Name** | `cristoferdua-notificacion-ms` |
| **Description** | `Notificaciones con saga Kafka` |
| **Package name** | `pe.edu.upeu.lamb.notificacion` |
| **Packaging** | `Jar` |
| **Java** | `21` |

!!! tip "🔁 Cambia esto en este paso"
    - **Artifact** y **Name:** `cristoferdua-notificacion-ms` → `<prefijo>-notificacion-ms` (tu nombre).
    - **Package name:** `pe.edu.upeu.lamb.notificacion` → `pe.edu.upeu.lamb.<servicio>` (en el examen queda igual: `notificacion`).
    - **Description:** cámbiala si quieres; no afecta la nota.
    - En el examen, `<servicio>` **siempre** es `notificacion`. Solo cambia tu `<prefijo>`.

!!! note "Si no aparece Spring Boot 4.0.8"
    Usa la versión que tenga tu proyecto. Lo importante es que después reemplaces el `pom.xml`
    por el de esta guía (paso 1.8), que ya trae las versiones correctas.

### 1.3 Selecciona las dependencias

Haz clic en el botón **ADD DEPENDENCIES** (o **Add Dependencies**) del panel derecho.
Busca cada una por su nombre y haz clic para agregarla:

| # | Busca y agrega | Para qué |
|---:|---|---|
| 1 | **Spring Web** | Los endpoints REST |
| 2 | **Spring Data JPA** | La entidad y el repositorio |
| 3 | **Flyway Migration** | La tabla `notificaciones` |
| 4 | **Validation** | `@NotBlank`, `@Size` en el POST |
| 5 | **Spring for Apache Kafka** | Productor y consumidor |
| 6 | **Spring Boot Actuator** | `/actuator/health` y `/actuator/prometheus` |
| 7 | **Config Client** | Leer el `.yml` del Config Server |
| 8 | **Eureka Discovery Client** | Registrarse en Eureka |
| 9 | **PostgreSQL Driver** | La base de datos |
| 10 | **Lombok** | Menos código repetido |
| 11 | **Prometheus** (Micrometer registry) | Métricas para Grafana |
| 12 | **Springdoc OpenAPI** (opcional) | Swagger |

!!! danger "NO selecciones estas"
    - **Spring Security**
    - **OAuth2 Resource Server**

    El examen no usa Keycloak ni JWT en este microservicio. Si agregas seguridad, el POST directo
    responderá `401` y perderás los puntos de la saga.

Al terminar, en el panel derecho deben aparecer las dependencias seleccionadas. Si te equivocaste,
haz clic en la **X** de la dependencia para quitarla.

### 1.4 Genera y descarga el ZIP

1. Haz clic en el botón **GENERATE** (abajo).
2. Se descarga un archivo llamado `cristoferdua-notificacion-ms.zip`.
3. Abre la carpeta de **Descargas**.
4. Clic derecho en el ZIP → **Extract All...** (o **Extraer todo...**).
5. Se crea una carpeta `cristoferdua-notificacion-ms`.

### 1.5 Mueve la carpeta a `services\`

Mueve la carpeta descomprimida dentro de:

```text
Lamb-Modulo02-Admision-Trayectoria\
└── services\
    └── cristoferdua-notificacion-ms\
```

La ruta final debe quedar así:

```text
services\cristoferdua-notificacion-ms\pom.xml
services\cristoferdua-notificacion-ms\src\
```

!!! warning "Ojo con la carpeta doble"
    A veces el ZIP se descomprime como `cristoferdua-notificacion-ms\cristoferdua-notificacion-ms\`.
    Si ves eso, mueve **la carpeta interna** a `services\` y borra la carpeta externa vacía.
    Dentro de `services\cristoferdua-notificacion-ms\` debe estar directamente el `pom.xml`.

### 1.6 Abre el proyecto en VS Code

1. En VS Code: **File → Open Folder...**
2. Elige la carpeta **`Lamb-Modulo02-Admision-Trayectoria`**.
3. En el explorador de la izquierda, abre `services\cristoferdua-notificacion-ms`.
4. Debes ver `pom.xml`, `src`, `mvnw`, `mvnw.cmd` y `.mvn`.

### 1.7 Copia el Maven Wrapper (recomendado)

Para usar la misma versión de Maven que el resto del proyecto, copia el wrapper de
`lamb-trayectoria-ms`. Abre una terminal en la **raíz del proyecto** y ejecuta:

```powershell
Copy-Item "services\lamb-trayectoria-ms\mvnw"     "services\cristoferdua-notificacion-ms\" -Force
Copy-Item "services\lamb-trayectoria-ms\mvnw.cmd" "services\cristoferdua-notificacion-ms\" -Force
Copy-Item "services\lamb-trayectoria-ms\.mvn"     "services\cristoferdua-notificacion-ms\.mvn" -Recurse -Force
```

Si ya los tenías, no pasa nada: se reemplazan.

### 1.8 Reemplaza el `pom.xml`

**Modifica el archivo:** `pom.xml`
**En la ruta:** `services\cristoferdua-notificacion-ms\`
**Cómo:** ábrelo, selecciona todo (`Ctrl+A`) y pega este contenido completo:

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

!!! tip "🔁 Cambia esto en este paso (pom.xml)"
    - `<artifactId>` y `<name>`: `cristoferdua-notificacion-ms` → `<prefijo>-notificacion-ms`.
    - `<description>`: puedes cambiarla; no afecta la nota.
    - **No cambies** `groupId`, `java.version` ni `spring-cloud.version` salvo que tu proyecto use otras versiones.

### 1.9 Crea el `application.yml`

Spring Initializr crea `src\main\resources\application.properties`. Lo vamos a reemplazar por `application.yml`.

**Borra el archivo:** `application.properties`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\resources\`
**Cómo:** clic derecho en `application.properties` → **Delete**.

**Crea el archivo:** `application.yml`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\resources\`
**Cómo:** clic derecho en la carpeta `resources` → **New File** → escribe `application.yml`.
**Y pega el siguiente código:**

```yaml
spring:
  application:
    name: cristoferdua-notificacion-ms
  profiles:
    active: dev
  config:
    import: "optional:configserver:${CONFIG_SERVER_URL:http://localhost:18888}"
```

!!! tip "🔁 Cambia esto en este paso (application.yml)"
    - `name: cristoferdua-notificacion-ms` → `name: <prefijo>-notificacion-ms`.
    - No cambies nada más: el resto de la configuración vive en el Config Server (Paso 3).

!!! note "Por qué solo tiene esto"
    El puerto, la base de datos, Kafka, Eureka y Actuator viven en el **Config Server**
    (`infra\lamb-config\config-repo`). Ese es el ítem de configuración centralizada.

### 1.10 Verifica la clase principal

Spring Initializr ya creó la clase principal:

`services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\CristoferduaNotificacionMsApplication.java`

**Abre el archivo** y verifica que el paquete sea `pe.edu.upeu.lamb.notificacion`.
Debe verse así:

```java
package pe.edu.upeu.lamb.notificacion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CristoferduaNotificacionMsApplication {

    public static void main(String[] args) {
        SpringApplication.run(CristoferduaNotificacionMsApplication.class, args);
    }
}
```

!!! tip "🔁 Cambia esto en este paso (clase principal)"
    - El `package` debe ser tu `<paquete>`: `pe.edu.upeu.lamb.notificacion`.
    - El nombre de la clase lo genera Initializr (`CristoferduaNotificacionMsApplication`); no importa si no coincide exactamente con el ejemplo.
    - Si el paquete quedó distinto, corrígelo aquí **y en todos los archivos Java** (Paso 4).

### 1.11 Compila para comprobar que todo está bien

Abre una terminal en la **raíz del proyecto**:

```powershell
cd services\cristoferdua-notificacion-ms
.\mvnw.cmd clean package -DskipTests
```

Debe terminar con `BUILD SUCCESS`. Si falla, revisa que el `pom.xml` se haya pegado completo
y que Java sea 21 (`java -version`).

### 1.12 Mapa de archivos que vas a crear

!!! tip "🔁 Cambia esto en este paso (mapa)"
    En el árbol de abajo, `cristoferdua` es tu `<prefijo>` y `notificacion` es tu `<servicio>`.
    Si el examen usa `notificacion`, el árbol queda **exactamente** como se muestra.

Al terminar la guía, la carpeta del servicio debe verse así:

```text
services\cristoferdua-notificacion-ms\
├── compose-dev.yml
├── pom.xml
├── mvnw
├── mvnw.cmd
├── .mvn\
└── src\main\
    ├── java\pe\edu\upeu\lamb\notificacion\
    │   ├── CristoferduaNotificacionMsApplication.java
    │   ├── config\KafkaTopicsConfig.java
    │   ├── controller\NotificacionController.java
    │   ├── dto\NotificacionRequest.java
    │   ├── dto\NotificacionResponse.java
    │   ├── entity\EstadoNotificacion.java
    │   ├── entity\Notificacion.java
    │   ├── event\NotificacionEvento.java
    │   ├── exception\GlobalExceptionHandler.java
    │   ├── messaging\NotificacionEventosConsumer.java
    │   ├── messaging\NotificacionEventosProducer.java
    │   ├── repository\NotificacionRepository.java
    │   └── service\NotificacionService.java
    └── resources\
        ├── application.yml
        └── db\migration\V1__crear_notificaciones.sql
```

---

## Paso 2: base de datos y Flyway

### 2.1 Crea el `compose-dev.yml`

**Crea el archivo:** `compose-dev.yml`
**En la ruta:** `services\cristoferdua-notificacion-ms\`
**Cómo:** clic derecho en la carpeta `cristoferdua-notificacion-ms` → **New File** → escribe `compose-dev.yml`.
**Y pega el siguiente código:**

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

!!! tip "🔁 Cambia esto en este paso (compose-dev.yml)"
    - `name: cristoferdua-notificacion-dev` → `name: <prefijo>-notificacion-dev`.
    - `container_name: cristoferdua-postgres-notificacion-dev` → `container_name: <contenedor-bd>`.
    - `POSTGRES_DB: lamb_notificacion_db` → `POSTGRES_DB: <db>`.
    - `- "15460:5432"` → `- "<puerto-bd>:5432"`.
    - El volumen `cristoferdua_notificacion_dev_data` puede quedarse igual o cambiar tu `<prefijo>`.

### 2.2 Levanta el Postgres

Abre una terminal en la **raíz del proyecto**:

```powershell
cd services\cristoferdua-notificacion-ms
docker compose -f compose-dev.yml up -d
docker ps --filter "name=cristoferdua-postgres-notificacion-dev"
```

Debe aparecer el contenedor en estado `Up`.

### 2.3 Crea la carpeta `db\migration`

**Crea las carpetas:** `db` y `migration`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\resources\`

**Opción A (VS Code):**

1. Clic derecho en la carpeta `resources` → **New Folder** → escribe `db`.
2. Clic derecho en la carpeta `db` → **New Folder** → escribe `migration`.

**Opción B (terminal, más rápido):**

```powershell
New-Item -ItemType Directory -Force "services\cristoferdua-notificacion-ms\src\main\resources\db\migration" | Out-Null
```

### 2.4 Crea la migración Flyway

**Crea el archivo:** `V1__crear_notificaciones.sql`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\resources\db\migration\`
**Cómo:** clic derecho en la carpeta `migration` → **New File** → escribe `V1__crear_notificaciones.sql`.
**Ojo:** El nombre lleva **dos** guiones bajos después de `V1` (`V1__`).
**Y pega el siguiente código:**

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

!!! tip "🔁 Cambia esto en este paso (migración SQL)"
    - Nombre del archivo: `V1__crear_notificaciones.sql` → `V1__crear_<plural>.sql`.
    - `CREATE TABLE notificaciones` → `CREATE TABLE <plural>`.
    - `uk_notificaciones_referencia` → `uk_<plural>_referencia`.
    - En el examen `<plural>` es `notificaciones`, así que **no cambia nada**.

!!! important "La restricción UNIQUE"
    `uk_notificaciones_referencia` es la que evita las filas duplicadas en la prueba de idempotencia.
    No la quites.

Flyway ejecuta esta migración al arrancar el microservicio. La configuración usa `ddl-auto: validate`,
así que Hibernate **no** crea la tabla: la crea Flyway.

---

## Paso 3: Config Server y Eureka

### 3.1 Crea el archivo del Config Server

**Crea el archivo:** `cristoferdua-notificacion-ms-dev.yml`
**En la ruta:** `infra\lamb-config\config-repo\`
**Cómo:** clic derecho en la carpeta `config-repo` → **New File** → escribe `cristoferdua-notificacion-ms-dev.yml`.
**Y pega el siguiente código:**

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

!!! tip "🔁 Cambia esto en este paso (archivo del Config Server)"
    - Nombre del archivo: `cristoferdua-notificacion-ms-dev.yml` → `<prefijo>-notificacion-ms-dev.yml`.
    - `server.port: 8090` → `<puerto>`.
    - `url: ...localhost:15460/lamb_notificacion_db` → `...localhost:<puerto-bd>/<db>`.
    - `group-id: cristoferdua-notificacion-ms` → `<prefijo>-notificacion-ms`.
    - `pe.edu.upeu.lamb.notificacion` (en `default.type`, `trusted.packages` y `logging.level`) → `<paquete>`.
    - `eventos: notificacion-eventos` → `eventos: <topic>`.

!!! note "Los 5 bloques que califica el docente"
    - `server.port`: el puerto del microservicio.
    - `spring.datasource` + `flyway` + `ddl-auto: validate`: la base y la migración.
    - `spring.kafka`: productor, consumidor, group-id y deserializador.
    - `app.kafka.topic.eventos`: el nombre del topic.
    - `eureka` + `management`: registro y métricas para Prometheus.

### 3.2 Reinicia el Config Server

Si la terminal del Config Server sigue abierta, detenla con `Ctrl+C` y vuelve a arrancar:

```powershell
cd infra\lamb-config
.\mvnw.cmd spring-boot:run
```

### 3.3 Verifica que el Config Server sirve tu archivo

En otra terminal:

```powershell
curl.exe -s http://localhost:18888/cristoferdua-notificacion-ms/dev
```

Debe devolver el YAML con `port: 8090`, `notificacion-eventos`, etc.

### 3.4 Verifica Eureka

Abre http://localhost:18761 y deja la pestaña abierta. El servicio aparecerá **después** de arrancarlo
(Paso 4). Por ahora solo confirma que Eureka está arriba.

---

## Paso 4: código Java

### 4.1 Crea las carpetas del código

!!! tip "🔁 Cambia esto en TODOS los archivos Java de este paso"
    - La ruta `...\java\pe\edu\upeu\lamb\notificacion\` → `...\java\<paquete en carpetas>\`.
    - En cada archivo, `package pe.edu.upeu.lamb.notificacion...;` → `package <paquete>...;`.
    - Nombres de clases: `Notificacion` → `<entidad>` (en el examen sigue siendo `Notificacion`).
    - Ruta REST: `/api/v1/notificaciones` → `/api/v1/<plural>`.
    - Eventos: `notificacion.solicitada/enviada/fallida` → `<evento>.solicitada/enviada/fallida`.
    - **En el examen** (`notificacion`) estos valores **no cambian**: copia el código tal cual.
    - Las carpetas `config`, `controller`, `dto`, `entity`, `event`, `exception`, `messaging`, `repository` y `service` **no cambian**.

**Crea las carpetas:** `config`, `controller`, `dto`, `entity`, `event`, `exception`, `messaging`, `repository`, `service`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\`

**Opción A (terminal, más rápido):**

```powershell
$base = "services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion"
"config","controller","dto","entity","event","exception","messaging","repository","service" |
  ForEach-Object { New-Item -ItemType Directory -Force "$base\$_" | Out-Null }
```

**Opción B (VS Code):** clic derecho en la carpeta `notificacion` → **New Folder** → escribe cada nombre.

Así debe quedar:

```text
services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\
├── CristoferduaNotificacionMsApplication.java
├── config\
├── controller\
├── dto\
├── entity\
├── event\
├── exception\
├── messaging\
├── repository\
└── service\
```

### 4.2 Crea `EstadoNotificacion.java`

**Crea el archivo:** `EstadoNotificacion.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\entity\`
**Cómo:** clic derecho en la carpeta `entity` → **New File** → escribe `EstadoNotificacion.java`.
**Y pega el siguiente código:**

```java
package pe.edu.upeu.lamb.notificacion.entity;

public enum EstadoNotificacion {
    PENDIENTE,
    ENVIADA,
    CANCELADA
}
```

### 4.3 Crea `Notificacion.java`

**Crea el archivo:** `Notificacion.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\entity\`
**Cómo:** clic derecho en la carpeta `entity` → **New File** → escribe `Notificacion.java`.
**Y pega el siguiente código:**

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

### 4.4 Crea `NotificacionRepository.java`

**Crea el archivo:** `NotificacionRepository.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\repository\`
**Cómo:** clic derecho en la carpeta `repository` → **New File** → escribe `NotificacionRepository.java`.
**Y pega el siguiente código:**

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

### 4.5 Crea `NotificacionRequest.java`

**Crea el archivo:** `NotificacionRequest.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\dto\`
**Cómo:** clic derecho en la carpeta `dto` → **New File** → escribe `NotificacionRequest.java`.
**Y pega el siguiente código:**

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

### 4.6 Crea `NotificacionResponse.java`

**Crea el archivo:** `NotificacionResponse.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\dto\`
**Cómo:** clic derecho en la carpeta `dto` → **New File** → escribe `NotificacionResponse.java`.
**Y pega el siguiente código:**

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

### 4.7 Crea `NotificacionEvento.java`

**Crea el archivo:** `NotificacionEvento.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\event\`
**Cómo:** clic derecho en la carpeta `event` → **New File** → escribe `NotificacionEvento.java`.
**Y pega el siguiente código:**

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

### 4.8 Crea `KafkaTopicsConfig.java`

**Crea el archivo:** `KafkaTopicsConfig.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\config\`
**Cómo:** clic derecho en la carpeta `config` → **New File** → escribe `KafkaTopicsConfig.java`.
**Y pega el siguiente código:**

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

### 4.9 Crea `NotificacionEventosProducer.java`

**Crea el archivo:** `NotificacionEventosProducer.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\messaging\`
**Cómo:** clic derecho en la carpeta `messaging` → **New File** → escribe `NotificacionEventosProducer.java`.
**Y pega el siguiente código:**

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

### 4.10 Crea `NotificacionService.java`

**Crea el archivo:** `NotificacionService.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\service\`
**Cómo:** clic derecho en la carpeta `service` → **New File** → escribe `NotificacionService.java`.
**Y pega el siguiente código:**

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

### 4.11 Crea `NotificacionEventosConsumer.java`

**Crea el archivo:** `NotificacionEventosConsumer.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\messaging\`
**Cómo:** clic derecho en la carpeta `messaging` → **New File** → escribe `NotificacionEventosConsumer.java`.
**Y pega el siguiente código:**

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

### 4.12 Crea `NotificacionController.java`

**Crea el archivo:** `NotificacionController.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\controller\`
**Cómo:** clic derecho en la carpeta `controller` → **New File** → escribe `NotificacionController.java`.
**Y pega el siguiente código:**

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

### 4.13 Crea `GlobalExceptionHandler.java` (opcional, recomendado)

**Crea el archivo:** `GlobalExceptionHandler.java`
**En la ruta:** `services\cristoferdua-notificacion-ms\src\main\java\pe\edu\upeu\lamb\notificacion\exception\`
**Cómo:** clic derecho en la carpeta `exception` → **New File** → escribe `GlobalExceptionHandler.java`.
**Y pega el siguiente código:**

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

### 4.14 Compila y arranca el microservicio

Abre una terminal en la **raíz del proyecto**:

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

### 4.15 Comprueba que está arriba

En otra terminal:

```powershell
curl.exe -s http://localhost:8090/actuator/health
```

Debe responder:

```json
{"status":"UP"}
```

Abre http://localhost:18761 y verifica que aparece `CRISTOFERDUA-NOTIFICACION-MS`.

!!! danger "Si ves `401` o `403` en el POST directo"
    Agregaste Spring Security al microservicio. Quítalo: el examen no lo usa. Revisa que el `pom.xml`
    no tenga `spring-boot-starter-security-oauth2-resource-server` y que el YAML del Config Server no tenga
    `spring.security.oauth2`.

---

## Paso 5: Gateway

### 5.1 Agrega la ruta en el Config Server

**Modifica el archivo:** `lamb-gateway-dev.yml`
**En la ruta:** `infra\lamb-config\config-repo\`
**Cómo:** ábrelo y baja hasta la lista `routes:`. Agrega este bloque al final de las rutas,
debajo de la ruta de `lamb-finanzas`:

```yaml
            - id: cristoferdua-notificacion
              uri: lb://cristoferdua-notificacion-ms
              predicates:
                - Path=/api/v1/notificaciones/**
```

!!! tip "🔁 Cambia esto en este paso (lamb-gateway-dev.yml)"
    - `- id: cristoferdua-notificacion` → `- id: <prefijo>-notificacion`.
    - `uri: lb://cristoferdua-notificacion-ms` → `uri: lb://<prefijo>-notificacion-ms`.
    - `Path=/api/v1/notificaciones/**` → `Path=/api/v1/<plural>/**`.
    - En el examen solo cambia tu `<prefijo>`.

Debe quedar con la misma indentación que las demás rutas (12 espacios antes de `- id:`).

### 5.2 Agrega `permitAll` en la seguridad del Gateway

**Modifica el archivo:** `SecurityConfig.java`
**En la ruta:** `infra\lamb-gateway\src\main\java\pe\edu\upeu\lamb\gateway\config\`
**Cómo:** ábrelo y busca esta línea:

```java
                        .requestMatchers("/actuator/**", "/error").permitAll()
```

Justo **debajo** de esa línea, agrega:

```java
                        .requestMatchers("/api/v1/notificaciones/**").permitAll()
```

!!! tip "🔁 Cambia esto en este paso (SecurityConfig.java)"
    - `/api/v1/notificaciones/**` → `/api/v1/<plural>/**` (en el examen se queda igual).
    - No borres las demás reglas ni `anyRequest().authenticated()`.

Debe quedar antes de `anyRequest().authenticated()`. Spring aplica la primera regla que coincide.

### 5.3 Reinicia el Gateway

Detén la terminal del Gateway con `Ctrl+C` y vuelve a arrancar:

```powershell
cd infra\lamb-gateway
.\mvnw.cmd spring-boot:run
```

### 5.4 Prueba por el Gateway (sin token)

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

### 6.1 Crea el topic desde Kafka UI

1. Abre http://localhost:18090.
2. En el menú izquierdo, haz clic en **Topics**.
3. Haz clic en **Create Topic** (o **Add Topic**).
4. Llena:
   - **Name:** `notificacion-eventos`
   - **Partitions:** `3`
   - **Replication factor:** `1`
5. Haz clic en **Create**.

!!! tip "🔁 Cambia esto en este paso (topic de Kafka)"
    - **Name:** `notificacion-eventos` → `<topic>`.
    - En el examen el topic es `notificacion-eventos`, así que **no cambia**.
    - El comando de abajo también usa `--topic notificacion-eventos`.

**Alternativa por comando:**

```powershell
docker exec -it lamb-kafka-dev /opt/kafka/bin/kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --create --if-not-exists `
  --topic notificacion-eventos `
  --partitions 3 --replication-factor 1
```

### 6.2 Verifica el topic

En Kafka UI, en **Topics**, debe aparecer `notificacion-eventos`.

Por comando:

```powershell
docker exec -it lamb-kafka-dev /opt/kafka/bin/kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --describe --topic notificacion-eventos
```

### 6.3 Verifica el grupo del consumidor

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

En Kafka UI, en **Consumers**, el grupo debe verse en estado **Stable**.

### 6.4 Ve el mensaje `notificacion.solicitada`

Haz el POST válido del [Paso 7](#paso-7-probar-la-saga) y en Kafka UI:

1. **Topics** → `notificacion-eventos`.
2. Pestaña **Messages**.
3. Haz clic en **Refresh** si no aparece.

Debes ver:

- **Key:** `NOT-001` (la referencia)
- **Value:** el JSON con `"tipo":"notificacion.solicitada"`, `referencia`, `destinatario`, `canal` y `mensaje`.

---

## Paso 7: probar la saga

!!! important "Prueba la saga directo al microservicio"
    Usa `http://localhost:8090`. El Gateway (`http://localhost:18080`) se usa **solo** para el ítem del Gateway.
    Así lo pide el examen.

!!! note "Usa `curl.exe`, no `curl`"
    En PowerShell, `curl` es un alias de `Invoke-WebRequest`. Escribe **`curl.exe`** para usar el curl real.

!!! tip "🔁 Cambia esto en este paso (pruebas con curl)"
    - `http://localhost:8090` → `http://localhost:<puerto>`.
    - `/api/v1/notificaciones` → `/api/v1/<plural>`.
    - `cristoferdua-postgres-notificacion-dev` y `lamb_notificacion_db` (en los `docker exec`) → tus nombres.
    - En el examen estos valores son los de la guía; solo cambia `<puerto>` si elegiste otro.

### 7.1 Camino feliz

Abre una terminal y ejecuta:

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

Desde Kafka UI:

1. **Topics** → `notificacion-eventos` → **Messages**.
2. Haz clic en **Produce Message** (o **Produce**).
3. **Key:** `NOT-001`
4. **Value:**

```json
{"tipo":"notificacion.solicitada","referencia":"NOT-001","destinatario":"ana@correo.com","canal":"EMAIL","mensaje":"Tu pedido salio"}
```

5. Haz clic en **Produce**.

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

Abre http://localhost:19090/targets y busca `cristoferdua-notificacion-ms`.
Debe estar en estado **UP**. No tienes que configurar nada: `obs\prometheus\prometheus-dev.yml`
ya usa `eureka_sd_configs`.

Si no aparece, revisa:

```powershell
curl.exe -s http://localhost:8090/actuator/prometheus
curl.exe -s http://localhost:18761/eureka/apps
```

### 8.2 Crea el panel en Grafana

1. Abre http://localhost:13000.
2. Inicia sesión con **admin / admin** (si te pide cambiar la clave, puedes omitirlo).
3. Menú izquierdo → **Dashboards** → **New** → **New dashboard**.
4. Haz clic en **Add visualization**.
5. En **Select data source**, elige **Prometheus**.
6. Arriba a la derecha, cambia el tipo de panel a **Stat**.
7. En la consulta (query), pega:

```promql
max(up{application=~"(?i)cristoferdua-notificacion-ms"}) or vector(0)
```

8. Activa **Instant** (o usa un rango de 5 minutos).
9. En el panel derecho, busca **Value mappings** y agrega:
   - `1` → texto `ACTIVO`, color verde.
   - `0` → texto `CAÍDO`, color rojo.
10. Para que el fondo cambie de color:
    - **Standard options → Color mode:** `Background`.
    - **Color scheme:** `From thresholds (by value)`.
    - **Thresholds:** `0` rojo, `1` verde.
11. En **Panel options → Title**, escribe: `Estado de cristoferdua-notificacion-ms`.
12. Haz clic en **Apply** y luego en **Save dashboard**.

!!! tip "🔁 Cambia esto en este paso (Grafana)"
    - En la consulta: `max(up{application=~"(?i)cristoferdua-notificacion-ms"}) or vector(0)` → usa `<prefijo>-notificacion-ms`.
    - En el título del panel: `Estado de cristoferdua-notificacion-ms` → `Estado de <prefijo>-notificacion-ms`.
    - En el examen solo cambia tu `<prefijo>`.

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

!!! tip "🔁 Cambia esto en este paso (checklist)"
    En la columna "Cómo lo demuestras", cambia `cristoferdua-notificacion-ms`,
    `cristoferdua-postgres-notificacion-dev` y `notificacion-eventos` por tus valores.
    En el examen se usan los de esta guía.

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

!!! tip "🔁 Cambia esto en este paso (problemas)"
    Los mensajes de error mencionan `cristoferdua-notificacion-ms`, `cristoferdua-notificacion-ms-dev.yml`
    y `notificacion-eventos`. Si usaste otro nombre, busca tu `<prefijo>` en su lugar.

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
| `curl` no hace el POST | En PowerShell `curl` es un alias | Usa `curl.exe` |

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
    (`notificacion` → `pago`). Hazlo con calma y revisa el resultado.

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

!!! tip "🔁 Cambia esto en este anexo"
    Todos los comandos usan `cristoferdua-notificacion-ms`, `cristoferdua-postgres-notificacion-dev`,
    `lamb_notificacion_db`, `notificacion-eventos`, `8090` y `15460`. Reemplázalos por tus valores
    si usaste otro nombre o puerto.

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
