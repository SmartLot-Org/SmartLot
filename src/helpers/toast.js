import { Z_INDEX } from './zIndex';
import { mensajeToast } from './erroresMensajes';

export function showToast(message, icon = 'error') {
  // sweetalert2 pesa ~50 kB gzip: se carga recién cuando aparece un toast,
  // no en el arranque de la landing.
  import('sweetalert2').then(({ default: Swal }) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: mensajeToast(message),
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      zIndex: Z_INDEX.SWAL_TOAST,
    });
  }).catch(() => {});
}
