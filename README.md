# Simulador de Credito Hipotecario 🇨🇱

Calculadora de crédito hipotecario para Chile.

## Características

- Cálculo estimado del dividendo mensual en CLP y UF.
- Consulta del valor actual de la UF mediante la API pública de [findic.cl](https://findic.cl), con respaldo en [mindicador.cl](https://mindicador.cl) si la primera no responde.
- Interfaz simple, sin registro y sin almacenamiento de datos.

## Aviso de seguridad

- Este sitio **no está afiliado** a ningún banco ni institución financiera.
- **No se solicita ni guarda información personal**. Todos los cálculos se ejecutan localmente en el navegador del usuario.
- Peticiones de red externas: `https://findic.cl/api/uf` (principal) y `https://mindicador.cl/api` (respaldo) para obtener el valor de la UF.
- Los resultados son estimaciones con fines informativos; no constituyen una oferta de crédito.

## Tecnologías

- HTML5, CSS3 y JavaScript vanilla.
- Sin frameworks ni dependencias externas.
- Sin backend ni base de datos.