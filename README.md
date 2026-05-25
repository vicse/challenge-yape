# Challenge Yape - Card Issuance Platform

Plataforma de emisión de tarjetas construida con una arquitectura de microservicios event-driven usando NestJS, Kafka y PostgreSQL.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CARD ISSUANCE PLATFORM                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐       ┌──────────────────┐       ┌───────────────────┐        │
│  │   Client     │       │   Card Issuer    │       │  Card Processor   │        │
│  │  (HTTP)      │──────▶│   (Port 3000)    │       │   (Port 3001)     │        │
│  └──────────────┘       │                  │       │                   │        │
│                         │  ┌────────────┐  │       │  ┌─────────────┐  │        │
│                         │  │ Controller │  │       │  │  Consumer   │  │        │
│                         │  └─────┬──────┘  │       │  └──────┬──────┘  │        │
│                         │        │         │       │         │         │        │
│                         │  ┌─────▼──────┐  │       │  ┌──────▼──────┐  │        │
│                         │  │  Command   │  │       │  │   Command   │  │        │
│                         │  │  Handler   │  │       │  │   Handler   │  │        │
│                         │  └─────┬──────┘  │       │  └──────┬──────┘  │        │
│                         │        │         │       │         │         │        │
│                         │  ┌─────▼──────┐  │       │  ┌──────▼──────┐  │        │
│                         │  │   Event    │  │       │  │    Event    │  │        │
│                         │  │  Handler   │  │       │  │   Handler   │  │        │
│                         │  └─────┬──────┘  │       │  └──────┬──────┘  │        │
│                         └────────┼─────────┘       └─────────┼─────────┘        │
│                                  │                           │                  │
│  ┌───────────────────────────────▼───────────────────────────▼───────────────┐  │
│  │                            Apache Kafka                                   │  │
│  │                                                                           │  │
│  │  ┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │  │
│  │  │io.card.requested.v1 │  │io.cards.issued.v1│  │io.card.requested.v1 │   │  │
│  │  │                     │  │                  │  │       .dlq          │   │  │
│  │  └─────────────────────┘  └──────────────────┘  └─────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         PostgreSQL (cards table)                          │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Flujo de Negocio

```
1. POST /v1/cards/issue
   └─▶ Card Issuer: valida duplicados → crea card (PENDING) → publica evento

2. Kafka: io.card.requested.v1
   └─▶ Card Processor: consume → marca PROCESSING → simula carga externa
       ├─ Éxito: genera datos de tarjeta → marca ISSUED → publica io.cards.issued.v1
       └─ Fallo (3 reintentos con backoff 1s, 2s, 4s): marca FAILED → publica io.card.requested.v1.dlq
```

### Estados de una tarjeta

| Estado       | Descripción                                 |
| ------------ | ------------------------------------------- |
| `PENDING`    | Solicitud creada, esperando procesamiento   |
| `PROCESSING` | El processor la tomó, en proceso de emisión |
| `ISSUED`     | Tarjeta emitida exitosamente                |
| `FAILED`     | Falló tras agotar reintentos                |

## Stack Tecnológico

| Tecnología      | Uso                            |
| --------------- | ------------------------------ |
| NestJS 11       | Framework (monorepo)           |
| TypeScript      | Lenguaje                       |
| PostgreSQL 16   | Base de datos                  |
| TypeORM         | ORM + migraciones              |
| Apache Kafka    | Mensajería event-driven        |
| @nestjs/cqrs    | Patrón CQRS (Commands, Events) |
| Docker          | Containerización               |
| class-validator | Validación de DTOs             |

## Estructura del Proyecto

```
├── apps/
│   ├── card-issuer/              # API HTTP - recibe solicitudes de tarjeta
│   │   └── src/
│   │       ├── application/      # Commands y Event handlers
│   │       ├── domain/           # Excepciones de dominio
│   │       ├── infrastructure/   # NestJS modules, filters, healthcheck
│   │       └── presentation/     # Controllers, DTOs
│   │
│   └── card-processor/           # Worker - procesa solicitudes via Kafka
│       └── src/
│           ├── application/      # Commands y Event handlers
│           └── infrastructure/   # Kafka consumer, NestJS modules
│
├── libs/
│   ├── cards/                    # Bounded context de tarjetas
│   │   └── src/
│   │       ├── domain/           # Entidades, Value Objects, Enums, Events, Repository
│   │       └── infrastructure/   # TypeORM (entities, mappers, migrations, repository)
│   │
│   └── shared/                   # Utilidades compartidas
│       └── src/
│           ├── domain/           # CloudEvent interface
│           ├── infrastructure/   # Kafka producer, consumer, module
│           ├── application/      # JsonLoggerService
│           └── utils/            # Constants, CardGenerator, TimeUtils
│
├── docker-compose.yml
├── Dockerfile                    # Multi-stage build
└── .env.example
```

## Patrones Implementados

- **Clean Architecture**: separación domain → application → infrastructure → presentation
- **CQRS**: Commands + Events via `@nestjs/cqrs`
- **Domain Events**: desacoplamiento entre lógica de negocio y publicación a Kafka
- **Event-Driven Architecture**: comunicación asíncrona entre microservicios via Kafka
- **CloudEvents**: estructura estándar para mensajes (`id`, `source`, `type`, `data`)
- **Exponential Backoff**: reintentos con espera incremental (1s, 2s, 4s)
- **Dead Letter Queue (DLQ)**: mensajes fallidos van a `io.card.requested.v1.dlq`
- **Idempotencia**: el processor valida el estado antes de procesar (evita duplicados)
- **Repository Pattern**: abstracción de persistencia con implementación TypeORM

## Requisitos

- Node.js 22+
- pnpm
- Docker y Docker Compose

## Setup Rápido

```bash
# 1. Clonar y configurar
git clone <repo-url>
cd challenge-yape
cp .env.example .env

# 2. Levantar toda la infraestructura + microservicios
docker compose up -d --build

# 3. Verificar que todo está corriendo
docker compose ps
```

### Servicios disponibles

| Servicio       | URL                   | Descripción                        |
| -------------- | --------------------- | ---------------------------------- |
| Card Issuer    | http://localhost:3000 | API de solicitud de tarjetas       |
| Card Processor | http://localhost:3001 | Worker de procesamiento            |
| Kafka UI       | http://localhost:8080 | Visualización de topics y mensajes |
| PostgreSQL     | localhost:5432        | Base de datos                      |

## Desarrollo Local (sin Docker)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar solo infra (postgres + kafka)
docker compose up -d postgres zookeeper kafka kafka-ui

# 3. Correr migraciones
pnpm run migration:run

# 4. Iniciar servicios
pnpm run start:issuer      # Terminal 1
pnpm run start:processor   # Terminal 2
```

## API

### POST /v1/cards/issue

Solicita la emisión de una tarjeta.

**Request:**

```json
{
  "customer": {
    "documentType": "DNI",
    "documentNumber": "12345678",
    "fullName": "Juan Pérez",
    "age": 25,
    "email": "juan@email.com"
  },
  "product": {
    "type": "VISA",
    "currency": "PEN"
  },
  "forceError": false
}
```

**Response (201):**

```json
{
  "requestId": "435c29b3-a67f-4feb-9b31-dab623dee349",
  "status": "PENDING"
}
```

**Errores:**

- `409 Conflict`: ya existe una solicitud para ese número de documento

### GET /healthcheck

Health check de cada microservicio.

**Response (200):**

```json
{
  "status": "UP",
  "timestamp": "2026-05-24T21:00:00.000Z"
}
```

## Eventos Kafka

### io.card.requested.v1

Publicado por el **issuer** cuando se crea una solicitud.

```json
{
  "id": 1,
  "source": "435c29b3-a67f-4feb-9b31-dab623dee349",
  "type": "io.card.requested.v1",
  "data": {
    "cardId": "...",
    "requestId": "...",
    "customer": { ... },
    "product": { ... },
    "status": "PENDING",
    "forceError": false
  }
}
```

### io.cards.issued.v1

Publicado por el **processor** cuando la tarjeta se emite exitosamente.

```json
{
  "id": 2,
  "source": "435c29b3-a67f-4feb-9b31-dab623dee349",
  "type": "io.cards.issued.v1",
  "data": {
    "cardId": "...",
    "requestId": "...",
    "cardNumber": "4XXXXXXXXXXXXXXX",
    "expirationDate": "03/2029",
    "cvv": "123",
    "status": "ISSUED"
  }
}
```

### io.card.requested.v1.dlq

Publicado cuando se agotan los reintentos.

```json
{
  "id": 3,
  "source": "435c29b3-a67f-4feb-9b31-dab623dee349",
  "type": "io.card.requested.v1.dlq",
  "data": {
    "reason": "Max retries exceeded",
    "attempts": 3,
    "originalPayload": {
      "cardId": "...",
      "requestId": "...",
      "forceError": true
    }
  }
}
```

## Testing del DLQ

Para forzar que una solicitud falle y llegue al DLQ, envía `"forceError": true` en el request. Esto hace que todos los reintentos fallen garantizando la publicación al topic DLQ.

## Variables de Entorno

| Variable                   | Default        | Descripción                          |
| -------------------------- | -------------- | ------------------------------------ |
| `DB_HOST`                  | localhost      | Host de PostgreSQL                   |
| `DB_PORT`                  | 5432           | Puerto de PostgreSQL                 |
| `DB_USER`                  | postgres       | Usuario de PostgreSQL                |
| `DB_PASSWORD`              | password       | Contraseña de PostgreSQL             |
| `DB_NAME`                  | reto_yape      | Nombre de la base de datos           |
| `KAFKA_CLIENT_ID`          | card-issuer    | Client ID para Kafka                 |
| `KAFKA_BROKERS`            | localhost:9092 | Brokers de Kafka                     |
| `KAFKA_FROM_BEGINNING`     | false          | Consumir mensajes desde el inicio    |
| `ISSUER_PORT`              | 3000           | Puerto del Card Issuer               |
| `PROCESSOR_PORT`           | 3001           | Puerto del Card Processor            |
| `MAX_RETRIES_PROCESS_CARD` | 3              | Máximo de reintentos en el processor |

## Comandos Útiles

```bash
pnpm run build                 # Build de todos los proyectos
pnpm run start:issuer          # Iniciar card-issuer
pnpm run start:processor       # Iniciar card-processor
pnpm run lint                  # Linter
pnpm run format                # Prettier
pnpm run test                  # Tests unitarios
pnpm run migration:generate    # Generar migración
pnpm run migration:run         # Ejecutar migraciones
pnpm run migration:revert      # Revertir última migración
```
