import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatosPedido } from '../models/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  // 🟢 Usamos BehaviorSubject para mantener el estado reactivo
  private productosSubject = new BehaviorSubject<DatosPedido[]>(this.cargarDesdeLocalStorage());
  public productos$ = this.productosSubject.asObservable();

  constructor() {
    // Inicializar desde localStorage
    this.productosSubject.next(this.cargarDesdeLocalStorage());
  }

  /** 🛒 Cargar carrito desde localStorage */
  private cargarDesdeLocalStorage(): DatosPedido[] {
    try {
      const carrito = localStorage.getItem('carrito');
      return carrito ? JSON.parse(carrito) : [];
    } catch (error) {
      console.error('Error al cargar carrito desde localStorage:', error);
      return [];
    }
  }

  /** 🛒 Guardar carrito en localStorage */
  private guardarEnLocalStorage(): void {
    try {
      localStorage.setItem('carrito', JSON.stringify(this.productosSubject.value));
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  }

  /** 🛒 Agregar un producto o combo al carrito */
  agregarProducto(item: any) {
    console.log('🛒 Recibiendo item:', item);

    // Normalizar el objeto al modelo DatosPedido
    const nuevoItem: DatosPedido = {
      id: Date.now() + Math.random(), // ID temporal único para el frontend
      
      // IDs Reales para el Backend
      idProductoT: item.idProductoT || item.ID_Producto_T || null,
      idCombo: item.idCombo || item.ID_Combo || null,
      
      // Datos Visuales
      nombre: item.nombre || item.Nombre || 'Ítem sin nombre',
      cantidad: item.cantidad || 1,
      precioUnitario: Number(item.precioUnitario || item.Precio || item.precio || 0),
      precioTotal: 0, // Se calcula abajo
      
      tamano: item.tamano || item.nombre_tamano || '',
      esCombo: !!item.esCombo || !!item.ID_Combo, // Detectar si es combo
      descripcion: item.descripcion || item.Descripcion || ''
    };

    // Calcular subtotal inicial
    nuevoItem.precioTotal = nuevoItem.precioUnitario * nuevoItem.cantidad;

    const productosActuales = [...this.productosSubject.value];

    // 1. LÓGICA PARA COMBOS (Se agrupan por ID de Combo)
    if (nuevoItem.esCombo && nuevoItem.idCombo) {
      const existente = productosActuales.find(p => p.esCombo && p.idCombo === nuevoItem.idCombo);

      if (existente) {
        existente.cantidad += nuevoItem.cantidad;
        existente.precioTotal = existente.precioUnitario * existente.cantidad;
        console.log('🛒 Combo actualizado:', existente);
      } else {
        productosActuales.push(nuevoItem);
        console.log('🛒 Nuevo combo agregado:', nuevoItem);
      }
    } 
    // 2. LÓGICA PARA PRODUCTOS (Se agrupan por ID_Producto_T, que es Producto+Tamaño)
    else if (nuevoItem.idProductoT) {
      const existente = productosActuales.find(p => !p.esCombo && p.idProductoT === nuevoItem.idProductoT);

      if (existente) {
        existente.cantidad += nuevoItem.cantidad;
        existente.precioTotal = existente.precioUnitario * existente.cantidad;
        console.log('🛒 Producto actualizado:', existente);
      } else {
        productosActuales.push(nuevoItem);
        console.log('🛒 Nuevo producto agregado:', nuevoItem);
      }
    } else {
      // 3. Para items sin ID específico (complementos, etc.)
      productosActuales.push(nuevoItem);
      console.log('🛒 Nuevo ítem agregado:', nuevoItem);
    }

    // Actualizar el estado y guardar
    this.productosSubject.next(productosActuales);
    this.guardarEnLocalStorage();
    
    console.log('🛒 Carrito actual:', productosActuales);
  }

  // Obtener lista actual
  obtenerProductos(): DatosPedido[] {
    return this.productosSubject.value;
  }

  // Eliminar
  eliminarProducto(index: number) {
    const productosActuales = [...this.productosSubject.value];
    productosActuales.splice(index, 1);
    this.productosSubject.next(productosActuales);
    this.guardarEnLocalStorage();
  }

  // +1 Cantidad
  incrementarCantidad(index: number) {
    const productosActuales = [...this.productosSubject.value];
    const item = productosActuales[index];
    item.cantidad++;
    item.precioTotal = item.precioUnitario * item.cantidad;
    this.productosSubject.next(productosActuales);
    this.guardarEnLocalStorage();
  }

  // -1 Cantidad
  decrementarCantidad(index: number) {
    const productosActuales = [...this.productosSubject.value];
    const item = productosActuales[index];
    if (item.cantidad > 1) {
      item.cantidad--;
      item.precioTotal = item.precioUnitario * item.cantidad;
    } else {
      productosActuales.splice(index, 1);
    }
    this.productosSubject.next(productosActuales);
    this.guardarEnLocalStorage();
  }

  vaciarCarrito() {
    this.productosSubject.next([]);
    this.guardarEnLocalStorage();
  }

  // Calcular Total General
  obtenerTotal(): number {
    return this.productosSubject.value.reduce((sum, item) => sum + item.precioTotal, 0);
  }

  obtenerCantidadItems(): number {
    return this.productosSubject.value.length;
  }
}