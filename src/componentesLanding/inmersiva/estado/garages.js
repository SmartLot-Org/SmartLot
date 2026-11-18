import { create } from 'zustand';

// Estado del interruptor "Visible / En borrador" de /para-garages. Va aparte de
// estado/store.js para que la home no cargue nada de esta página. Lo escribe la pieza
// de la nota (ui/garages/Visibilidad.jsx) y lo leen el guion y el 3D con getState y
// subscribe, sin pasar por React. Es del visitante: no toca ningún garage real.
export const useGarages = create((set) => ({
  visible: true,
  setVisible: (visible) => set({ visible }),
}));
