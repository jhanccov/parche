# Despliegue en AWS

Parche se ejecuta como tres contenedores, así que se puede desplegar en AWS de dos formas.

## Opción simple: una instancia con Docker

1. Crear una instancia EC2 o Lightsail con Ubuntu y abrir los puertos 80 y 443.
2. Instalar Docker y el plugin Compose.
3. Clonar el repositorio, copiar `.env.example` a `.env` y definir `JWT_SECRET`, `DEMO_MODE=false` y `SMTP_URL` (por ejemplo, Amazon SES por SMTP).
4. `docker compose up -d --build`.
5. Poner un dominio y certificado HTTPS (por ejemplo, con un balanceador o Caddy delante de Nginx).

## Opción gestionada

- **Base de datos**: Amazon RDS para PostgreSQL 16 (definir `DATABASE_URL`).
- **API**: imagen de `apps/api` en Amazon ECR y servicio en Amazon ECS con Fargate.
- **Web**: `apps/web/dist` en Amazon S3 con Amazon CloudFront, redirigiendo `/api/*` al balanceador de la API.
- **Correo**: Amazon SES para los códigos de acceso.
- **Monitoreo**: Amazon CloudWatch para registros y alarmas.

## Comunidad AWS

El proyecto encaja con los AWS Student Builder Groups de la red La Salle: el despliegue puede ser un taller práctico de la comunidad, y Parche puede alojar a esas comunidades y su ruta de formación.
