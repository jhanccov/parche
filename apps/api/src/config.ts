export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://parche:parche@localhost:5432/parche',
  jwtSecret: process.env.JWT_SECRET ?? 'cambia-este-secreto',
  demoMode: (process.env.DEMO_MODE ?? 'true') === 'true',
  brevoApiKey: process.env.BREVO_API_KEY ?? '',
  smtpUrl: process.env.SMTP_URL ?? '',
  mailFrom: process.env.MAIL_FROM ?? 'Parche <no-reply@parche.app>',
  webOrigin: process.env.WEB_ORIGIN ?? true,
};
