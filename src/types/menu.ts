export interface MenuSubItem {
  v_Ruta: string;
  v_RutaHija: string;
}

export interface MenuItem {
  v_RutaRaiz: string;
  v_Icon: string | null;
  SubMenus: MenuSubItem[];
}
