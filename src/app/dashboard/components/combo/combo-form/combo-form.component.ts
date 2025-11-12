import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Combo, ComboDetalle } from '../../../../core/models/combo.model';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { CombosService } from '../../../../core/services/combos.service';

@Component({
  selector: 'app-combo-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './combo-form.component.html',
  styleUrl: './combo-form.component.css'
})
export class ComboFormComponent implements OnInit {
  @Input() combo?: Combo;
  @Input() showModal: boolean = false;
  
  @Output() guardar = new EventEmitter<{combo: Combo, detalles: ComboDetalle[]}>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  // Datos del combo
  comboData: Combo = {
    ID_Combo: 0,
    Nombre: '',
    Descripcion: '',
    Precio: 0,
    Estado: 'A'
  };

  // Detalles del combo
  detalles: ComboDetalle[] = [];

  // Productos y filtros
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  terminoBusqueda: string = '';
  categoriaFiltro: number = 0;
  cargando: boolean = false;

  constructor(
    private productoService: ProductoService,
    private combosService: CombosService
  ) {}

  ngOnInit() {
    this.cargarProductos();
    if (this.combo) {
      this.comboData = { ...this.combo };
      this.cargarDetallesCombo(this.combo.ID_Combo);
    }
  }

  // Cargar productos desde el servicio
  cargarProductos() {
    this.cargando = true;
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = [...this.productos];
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.cargando = false;
      }
    });
  }

  // Cargar detalles del combo existente
  cargarDetallesCombo(idCombo: number) {
    // Aquí deberías implementar la llamada al servicio para obtener los detalles del combo
    // Por ahora lo dejamos vacío ya que no hay un endpoint específico en el servicio
  }

  // Filtrar productos
  filtrarProductos() {
    this.productosFiltrados = this.productos.filter(producto => {
      const coincideBusqueda = producto.Nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase());
      const coincideCategoria = this.categoriaFiltro === 0 || producto.ID_Categoria_P === this.categoriaFiltro;
      const productoActivo = producto.Estado === 'A';
      const tieneTamanosActivos = producto.tamanos?.some(t => t.Estado === 'A');
      
      return coincideBusqueda && coincideCategoria && productoActivo && tieneTamanosActivos;
    });
  }

  // Agregar producto al combo
  agregarProducto(productoTamano: ProductoTamano, producto: Producto) {
    const detalleExistente = this.detalles.find(d => d.ID_Producto_T === productoTamano.ID_Producto_T);
    
    if (detalleExistente) {
      detalleExistente.Cantidad++;
    } else {
      const nuevoDetalle: ComboDetalle = {
        ID_Combo_D: 0,
        ID_Combo: this.comboData.ID_Combo,
        ID_Producto_T: productoTamano.ID_Producto_T,
        Cantidad: 1,
        Producto_Nombre: producto.Nombre,
        Tamano_Nombre: productoTamano.nombre_tamano
      };
      this.detalles.push(nuevoDetalle);
    }
    
    this.calcularPrecioTotal();
  }

  // Remover producto del combo
  removerProducto(index: number) {
    this.detalles.splice(index, 1);
    this.calcularPrecioTotal();
  }

  // Actualizar cantidad
  actualizarCantidad(detalle: ComboDetalle, cantidad: number) {
    if (cantidad > 0) {
      detalle.Cantidad = cantidad;
      this.calcularPrecioTotal();
    } else if (cantidad === 0) {
      const index = this.detalles.indexOf(detalle);
      if (index > -1) {
        this.detalles.splice(index, 1);
        this.calcularPrecioTotal();
      }
    }
  }

  // Calcular precio total del combo
  calcularPrecioTotal() {
    let total = 0;
    this.detalles.forEach(detalle => {
      const productoTamano = this.obtenerProductoTamano(detalle.ID_Producto_T);
      if (productoTamano) {
        total += productoTamano.Precio * detalle.Cantidad;
      }
    });
    
    // Aplicar descuento del 10% para combos (puedes ajustar este porcentaje)
    this.comboData.Precio = Math.round(total * 0.9 * 100) / 100;
  }

  // Obtener ProductoTamano por ID
  obtenerProductoTamano(idProductoTamano: number): ProductoTamano | undefined {
    for (const producto of this.productos) {
      const encontrado = producto.tamanos?.find(t => t.ID_Producto_T === idProductoTamano);
      if (encontrado) return encontrado;
    }
    return undefined;
  }

  // Obtener categorías únicas para el filtro
  get categorias() {
    const categoriasUnicas = [...new Set(this.productos.map(p => p.ID_Categoria_P))];
    return categoriasUnicas.map(id => {
      const producto = this.productos.find(p => p.ID_Categoria_P === id);
      return {
        id: id,
        nombre: producto?.nombre_categoria || `Categoría ${id}`
      };
    });
  }

  // Obtener tamaños activos de un producto
  getTamanosActivos(producto: Producto): ProductoTamano[] {
    return producto.tamanos?.filter(t => t.Estado === 'A') || [];
  }

  // Validar formulario
  validarFormulario(): boolean {
    if (!this.comboData.Nombre?.trim()) {
      alert('Por favor, ingrese un nombre para el combo.');
      return false;
    }

    if (this.detalles.length === 0) {
      alert('Por favor, agregue al menos un producto al combo.');
      return false;
    }

    return true;
  }

  // Guardar combo
  onGuardar() {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardar.emit({
      combo: this.comboData,
      detalles: this.detalles
    });
  }

  // Cancelar
  onCancelar() {
    this.cancelar.emit();
  }

  // Cerrar modal
  onCerrar() {
    this.cerrar.emit();
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.categoriaFiltro = 0;
    this.filtrarProductos();
  }
}