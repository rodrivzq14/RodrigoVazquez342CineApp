import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/**
 * Por defecto Angular reutiliza el componente si solo cambian los parámetros de la ruta
 * (de /pelicula/1 a /pelicula/2), y como los datos se cargan en ngOnInit se seguía viendo la anterior.
 * Con esto, si cambia el id se crea el componente de nuevo y carga la película / función correcta.
 */
export class NoReutilizarSiCambiaElId extends BaseRouteReuseStrategy {
  override shouldReuseRoute(futura: ActivatedRouteSnapshot, actual: ActivatedRouteSnapshot): boolean {
    return (
      futura.routeConfig === actual.routeConfig &&
      JSON.stringify(futura.params) === JSON.stringify(actual.params)
    );
  }
}
