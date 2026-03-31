-- Executado só na primeira inicialização do volume do Postgres.
-- Base separada para o Keycloak (a API usa a base definida em POSTGRES_DB).
CREATE DATABASE keycloak;
