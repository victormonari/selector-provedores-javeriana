# Selector de proveedores · Brown & Gibson

Versión web e interactiva del aplicativo en Excel del trabajo final de Gerencia de Operaciones.
Elige la mejor alternativa de compra con el método sinérgico de Brown & Gibson:

```
IS = FC × [α × FO + (1 − α) × FS]
```

- **FC**: requisitos obligatorios (1 cumple / 0 no cumple; incluye ética).
- **FO**: costo total (precio × unidades + horas × tarifa interna). A menor costo, mayor FO.
- **FS**: calidad, con pesos por comparación de pares y calificación de 1 a 5.
- **α**: cuánto pesa el costo frente a la calidad.

Con el caso de ejemplo da los mismos resultados que el Excel: gana la producción propia con IA con IS = 0,2748.

## Uso

1. **Parámetros**: insumo, unidades, tarifa interna, α y alternativas (de 2 a 8).
2. **Requisitos**: marcar ✓ o ✕ en cada requisito obligatorio.
3. **Costos**: precio por unidad y horas de coordinación.
4. **Calidad**: elegir qué factor importa más en cada par y calificar cada alternativa.
5. **Resultado**: ganador, ranking con el aporte del costo y de la calidad, sensibilidad a α y conclusión.

Los datos se guardan solo en el navegador. «Guardar archivo» y «Abrir archivo» exportan e importan el caso en JSON. En el resultado se pueden descargar los datos en CSV.

## Correr en local

```bash
npm install
npm run dev
```

Abrir http://localhost:3000.

## Desplegar en Vercel

No necesita variables de entorno ni base de datos: es una página estática.

```bash
npx vercel        # vista previa
npx vercel --prod # producción
```

También se puede subir el repositorio a GitHub o GitLab e importarlo desde vercel.com/new.
