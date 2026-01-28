# Alke Wallet

Billetera digital básica desarrollada con HTML, CSS, Bootstrap, JavaScript y jQuery.
Incluye registro/inicio de sesión, saldo por usuario, depósitos, envío/recepción simulada y listado de movimientos.

## Funcionalidades
- Registro e inicio de sesión con validaciones.
- Sesión y protección de pantallas (redirige al login si no hay sesión).
- Saldo persistente por usuario (localStorage).
- Depósitos que actualizan saldo y generan transacción.
- Envío de dinero a contactos guardados (simulado).
- Recepción de dinero (simulado).
- Historial de transacciones con filtro por tipo.

## Tecnologías
- HTML5, CSS3
- Bootstrap 5
- JavaScript
- jQuery
- localStorage

## Ejecución
Recomendado: abrir `login.html` con Live Server en VS Code.
## Flujo principal de uso
1. Registrarse en register.html
2. Iniciar sesión en login.html
3. Ver saldo en menu.html
4. Depositar / Enviar / Recibir
5. Revisar movimientos en transactions.html
## Flujo de uso
1. Registrarse en register.html
2. Iniciar sesión en login.html
3. Operar desde menu.html (depositar / enviar / movimientos)
