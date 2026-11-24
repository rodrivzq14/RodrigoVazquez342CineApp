# El Proyector

TP de Programación IV (UTN). Es la página de un cine: se ve la cartelera, se eligen butacas en el mapa de la sala, se compran entradas y candy, y en la puerta se valida el QR. También tiene un panel para administrar todo.

Deploy: https://cine-app-progra4.web.app

## Tecnologías

- **Angular 22** (componentes standalone, signals)
- **Supabase**: base de datos Postgres, login, realtime y funciones en SQL
- **Firebase Hosting** para publicarlo
- jspdf, exceljs y chart.js para los PDF, los Excel y los gráficos de los reportes
- qrcode para generar los QR y html5-qrcode para leerlos con la cámara

## Cómo correrlo

```bash
npm install
ng serve
```

y entrar a `http://localhost:4200`. La URL y la key pública de Supabase están en `src/environments/environment.ts`.

Para publicar:

```bash
ng build
firebase deploy --only hosting
```

## Qué se puede hacer

**Cualquiera (sin cuenta)**
- Ver la cartelera, las más vistas, lo que viene (próximamente) y filtrar por género
- Ver el detalle de una película con sus funciones y reseñas
- Elegir butacas y comprar (las butacas quedan reservadas 5 minutos mientras se paga)

**Cliente**
- Comprar entradas con combos y productos del candy, usando cupones
- Sumar puntos (1 por cada peso) y canjearlos por entradas o productos
- Ver sus compras, cancelar si falta tiempo, y bajar las entradas en PDF con el QR
- Dejar reseñas, anotarse en la lista de espera de una función agotada y proponer películas
- Recibir notificaciones (por ejemplo, si se cancela una función se le devuelve el crédito)

**Empleado**
- Validar entradas en la sala y entregar el candy escaneando el QR (o con el código a mano)

**Administrador**
- Películas, funciones (se programan varias de una y el sistema busca la sala libre), salas
- Productos, combos, precios, cupones y canjes
- Propuestas de los clientes, log de actividad
- Reportes de facturación, películas y candy con gráficos, exportables a PDF y Excel
- Roles: se pueden crear roles con permisos sueltos (por ejemplo un "Contador" que solo ve los reportes) y asignarlos a empleados

## Estructura

```
src/app/
  pages/        una carpeta por pantalla (catalog, movie-detail, seat-selection, checkout...)
  pages/admin/  el panel, se carga aparte con loadChildren
  components/   piezas que se repiten (navbar, movie-card, reseñas, notificaciones...)
  services/     un servicio por tema, todos hablan con Supabase
  guards/       auth, rol y permiso
  directives/   *appSiRol y *appSiPermiso para mostrar/ocultar cosas según quién entra
  pipes/        fechaAr, para mostrar las fechas en hora de Argentina
  models/       interfaces de los datos
```
