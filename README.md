# Alke Wallet

Billetera digital básica desarrollada con HTML, CSS, Bootstrap, JavaScript y jQuery.
Incluye registro/inicio de sesión, saldo por usuario, depósitos, envío/recepción simulada y listado de movimientos.

## Demo (GitHub Pages)
https://crisbonatici1.github.io/alke-wallet/login.html

## Pantallas
- login.html (Inicio de sesión)
- register.html (Crear cuenta)
- menu.html (Menú principal + saldo)
- deposit.html (Depósito)
- sendmoney.html (Enviar / Recibir dinero + agenda)
- transactions.html (Últimos movimientos + filtro)
- withdraw.html (Retiro) *(si aplica)*

## Funcionalidades
- Registro e inicio de sesión con validaciones.
- Sesión y protección de pantallas (redirige al login si no hay sesión).
- Saldo persistente por usuario (localStorage).
- Depósitos que actualizan saldo y generan transacción.
- Envío de dinero a contactos guardados (simulado) y recepción de dinero (simulado).
- Historial de transacciones con filtro por tipo.

## Tecnologías
- HTML5, CSS3
- Bootstrap 5
- JavaScript
- jQuery
- localStorage

## Estructura del proyecto
- assets/
  - css/styles.css
  - js/app.js
- *.html (pantallas)

## Cómo ejecutar (local)
Opción recomendada: abrir `login.html` con **Live Server** en VS Code.

1. Abrir la carpeta del proyecto en VS Code
2. Click derecho en `login.html` → **Open with Live Server**
3. Crear cuenta en `register.html` o iniciar sesión si ya existe

## Notas técnicas
- El estado del usuario (sesión), saldo, contactos y transacciones se guardan en localStorage.
- Las transacciones se registran con tipo (deposito / envio / recibo / retiro) para poder filtrarlas.
