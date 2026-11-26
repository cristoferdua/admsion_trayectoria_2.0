# Resumen rápido: todos los archivos

*Guía principal: agregar un microservicio nuevo (sin CRUD) al proyecto Lamb - Para quien ya sabe y solo quiere copiar - 2026*

Esta página junta **todo lo que tocas** en la guía, con la sesión donde está la **versión final** de cada archivo.
Si es tu primera vez, mejor sigue las sesiones en orden desde la [S1](S01_Construccion_Servicio_Base.md).

!!! note "Cuidado con los archivos que se reemplazan"
    `SecurityConfig.java` (del servicio) y `SaludoController.java` tienen una versión
    temprana y una final. Copia **siempre la versión de la sesión que dice la tabla**.

## 1. Cómo queda tu servicio

```text
services\lamb-evaluacionn-ms\
├── compose-dev.yml                          S1
├── pom.xml  mvnw  mvnw.cmd  .mvn\           S1 (copiados de Trayectoria)
└── src\main\
    ├── java\pe\edu\upeu\lamb\evaluacionn\
    │   ├── LambEvaluacionnMsApplication.java     S1
    │   ├── config\
    │   │   ├── SecurityConfig.java              S7  (versión final)
    │   │   ├── OpenApiConfig.java               S1
    │   │   └── KafkaTopicsConfig.java           S8
    │   ├── filter\CorrelationIdFilter.java      S1
    │   ├── event\EvaluacionnEvento.java          S8
    │   ├── messaging\
    │   │   ├── EvaluacionnEventosProducer.java   S8
    │   │   └── EvaluacionnEventosConsumer.java   S8
    │   └── controller\SaludoController.java    S8  (versión final)
    └── resources\
        ├── application.yml                      S2
        └── logback-spring.xml                   S1
```

Si además te piden CRUD, los archivos extra están en la [guía con CRUD](../proyecto-sello/servicio-con-crud.md#11-resumen-de-archivos-del-crud).

## 2. Archivos fuera de tu servicio

| Archivo | Qué haces | Sesión |
|---|---|---|
| `infra\lamb-config\config-repo\lamb-evaluacionn-ms-dev.yml` | Creas (toda la configuración) | [S2](S02_Configuracion_Centralizada_Ambientes.md) |
| `infra\lamb-config\config-repo\lamb-gateway-dev.yml` | Agregas 1 ruta | [S4](S04_Punto_Unico_Acceso_Distribucion_Trafico.md) |
| `infra\lamb-gateway\...\config\SecurityConfig.java` (Gateway) | Agregas las reglas por rol | [S7](S07_Seguridad_Distribuida_Control_Acceso.md) |
| `obs\promtail\promtail-config-dev.yml` | Agregas 1 job | [S10](S10_Observabilidad_Diagnostico_Sistemas_Distribuidos.md) |
| `clients\lamb-frontend\src\app\features\evaluacionn\` | Creas la página | [S11](S11_Integracion_Cliente_Frontend_Angular_Keycloak.md) |
| `clients\lamb-frontend\src\app\app.routes.ts` | Agregas 1 ruta | [S11](S11_Integracion_Cliente_Frontend_Angular_Keycloak.md) |
| Keycloak (consola web) | Solo si te piden un rol o usuario nuevo | [S7b](S07b_Seguridad_Distribuida_Keycloak.md) |

## 3. Frontend

```text
clients\lamb-frontend\src\app\features\evaluacionn\
├── evaluacionn-service.ts     S11
├── saludo.ts                 S11
└── saludo.html               S11
```

## 4. Pasos en orden (lista corta)

| N. | Paso | Sesión |
|---|---|---|
| 1 | Elegir nombres (servicio, recurso, atributos, puertos) | [S1](S01_Construccion_Servicio_Base.md#2-elige-tus-nombres) |
| 2 | Crear el proyecto copiando Trayectoria | [S1](S01_Construccion_Servicio_Base.md#3-crear-el-proyecto) |
| 3 | Código base + `SaludoController` | [S1](S01_Construccion_Servicio_Base.md#4-codigo-base) |
| 4 | BD en Docker y compilar | [S1](S01_Construccion_Servicio_Base.md#6-base-de-datos-en-docker) |
| 5 | `application.yml` + `-dev.yml` en el Config Server | [S2](S02_Configuracion_Centralizada_Ambientes.md) |
| 6 | Arrancar y verlo en Eureka | [S3](S03_Registro_Descubrimiento_Ejecucion_Concurrente.md) |
| 7 | Ruta en el Gateway | [S4](S04_Punto_Unico_Acceso_Distribucion_Trafico.md) |
| 8 | `SecurityConfig` final + roles en el Gateway | [S7](S07_Seguridad_Distribuida_Control_Acceso.md) |
| 9 | Kafka: topic, evento, productor, consumidor; reemplazar `SaludoController` | [S8](S08_Mensajeria_Asincrona_Entre_Servicios.md) |
| 10 | Job de Promtail | [S10](S10_Observabilidad_Diagnostico_Sistemas_Distribuidos.md) |
| 11 | Frontend y rutas | [S11](S11_Integracion_Cliente_Frontend_Angular_Keycloak.md) |
| 12 | Probar todo | [S13](S13_Validacion_End_to_End_Producto.md) |

Si algo falla: [Solución de errores](Solucion_Errores.md). Todos los links: [Enlaces del sistema](Enlaces_Sistema.md).
