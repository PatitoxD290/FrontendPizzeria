import { Component, EventEmitter, Output, Input, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importar modelos correctos
import { Combo, ComboDetalle, ComboCreacionDTO } from '../../../../core/models/combo.model';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';
// Importar servicios
import { ProductoService } from '../../../../core/services/producto.service';
import { CombosService } from '../../../../core/services/combos.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import Swal from 'sweetalert2';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Interface local para el estado del formulario (incluye datos visuales)
interface ComboFormState {
  ID_Combo: number;
  Nombre: string;
  Descripcion: string;
  Precio: number;
  Estado: 'A' | 'I';
  detalles: Array<{
    ID_Producto_T: number;
    Cantidad: number;
    // Campos visuales opcionales
    Producto_Nombre?: string;
    Tamano_Nombre?: string;
    PrecioUnitario?: number; // Para calcular totales visuales
  }>;
}

@Component({
  selector: 'app-combo-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './combo-form.component.html',
  styleUrl: './combo-form.component.css'
})
export class ComboFormComponent implements OnInit {

  // Estado del formulario
  comboData: ComboFormState = {
    ID_Combo: 0,
    Nombre: '',
    Descripcion: '',
    Precio: 0,
    Estado: 'A',
    detalles: []
  };

  // Datos auxiliares
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: CategoriaProducto[] = [];
  
  // Filtros
  terminoBusqueda: string = '';
  categoriaFiltro: number = 0;
  
  // UI States
  cargando: boolean = false;
  cargandoCategorias: boolean = false;
  guardando: boolean = false;

  // Imágenes
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private productoService: ProductoService,
    private combosService: CombosService,
    private categoriaService: CategoriaService,
    private dialogRef: MatDialogRef<ComboFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { combo?: Combo }
  ) {}

  ngOnInit() {
    this.cargarCategorias();
    this.cargarProductos();
    
    // Si estamos editando, cargar datos
    if (this.data.combo) {
      this.inicializarFormulario(this.data.combo);
    }
  }

  inicializarFormulario(combo: Combo) {
    this.comboData = {
      ID_Combo: combo.ID_Combo,
      Nombre: combo.Nombre,
      Descripcion: combo.Descripcion,
      Precio: combo.Precio,
      Estado: combo.Estado,
      // Mapear detalles existentes para la vista
      detalles: (combo.detalles || []).map(d => ({
        ID_Producto_T: d.ID_Producto_T,
        Cantidad: d.Cantidad,
        Producto_Nombre: d.Producto_Nombre,
        Tamano_Nombre: d.Tamano_Nombre
        // PrecioUnitario se llenará cuando carguen los productos
      }))
    };

    // Si hay imagen, mostrar la primera (si existe)
    if (combo.imagenes && combo.imagenes.length > 0) {
      // Asignamos la URL directamente para previsualizar (solo lectura)
      // Nota: Para editar la imagen, el usuario debe subir una nueva
      // this.imagePreview = combo.imagenes[0]; 
    }
  }

  // =========================================
  // 📥 CARGA DE DATOS
  // =========================================

  cargarProductos() {
    this.cargando = true;
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = [...this.productos];
        this.cargando = false;
        
        // Actualizar precios unitarios en detalles existentes (si es edición)
        if (this.comboData.detalles.length > 0) {
          this.comboData.detalles.forEach(detalle => {
            const pt = this.obtenerProductoTamano(detalle.ID_Producto_T);
            if (pt) detalle.PrecioUnitario = pt.Precio;
          });
        }
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
      }
    });
  }

  cargarCategorias() {
    this.cargandoCategorias = true;
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cargandoCategorias = false;
      },
      error: (err) => {
        console.error(err);
        this.cargandoCategorias = false;
      }
    });
  }

  // =========================================
  // 🔍 FILTROS Y BÚSQUEDA
  // =========================================
filtrarProductos() {
  const termino = this.terminoBusqueda.toLowerCase().trim();
  
  this.productosFiltrados = this.productos.filter(producto => {
    const coincideNombre = producto.Nombre.toLowerCase().includes(termino);
    const coincideCategoria = this.categoriaFiltro === 0 || producto.ID_Categoria_P === this.categoriaFiltro;
    const productoActivo = producto.Estado === 'A'; // Solo productos con Estado = 'A'
    
    return coincideNombre && coincideCategoria && productoActivo;
  });
}

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.categoriaFiltro = 0;
    this.filtrarProductos();
  }

  // =========================================
  // 🛒 GESTIÓN DE DETALLES
  // =========================================

  agregarProducto(productoTamano: ProductoTamano, producto: Producto) {
    const detalleExistente = this.comboData.detalles.find(d => d.ID_Producto_T === productoTamano.ID_Producto_T);
    
    if (detalleExistente) {
      detalleExistente.Cantidad++;
    } else {
      this.comboData.detalles.push({
        ID_Producto_T: productoTamano.ID_Producto_T,
        Cantidad: 1,
        Producto_Nombre: producto.Nombre,
        Tamano_Nombre: productoTamano.nombre_tamano,
        PrecioUnitario: productoTamano.Precio
      });
    }
    
    // Feedback visual opcional (toast)
  }

  // Agregar y recalcular precio sugerido
  agregarProductoYCalcular(productoTamano: ProductoTamano, producto: Producto) {
    this.agregarProducto(productoTamano, producto);
    this.calcularPrecioAutomatico();
  }

  removerProducto(index: number) {
    this.comboData.detalles.splice(index, 1);
  }

  removerProductoYCalcular(index: number) {
    this.removerProducto(index);
    this.calcularPrecioAutomatico();
  }

  actualizarCantidad(detalle: any, nuevaCantidad: number) {
    if (nuevaCantidad > 0) {
      detalle.Cantidad = nuevaCantidad;
    } else {
      // Si llega a 0, eliminar del array
      const idx = this.comboData.detalles.indexOf(detalle);
      if (idx > -1) this.comboData.detalles.splice(idx, 1);
    }
  }

  actualizarCantidadYCalcular(detalle: any, nuevaCantidad: number) {
    this.actualizarCantidad(detalle, nuevaCantidad);
    this.calcularPrecioAutomatico();
  }

  // =========================================
  // 💰 CÁLCULOS
  // =========================================

  calcularPrecioAutomatico() {
    let totalBase = 0;
    
    for (const detalle of this.comboData.detalles) {
      // Usamos el precio guardado en el detalle o lo buscamos
      let precio = detalle.PrecioUnitario;
      if (!precio) {
        const pt = this.obtenerProductoTamano(detalle.ID_Producto_T);
        precio = pt ? pt.Precio : 0;
      }
      totalBase += precio * detalle.Cantidad;
    }

    // Aplicar un descuento sugerido del 10-15% para que sea atractivo
    // Redondear a 2 decimales
    this.comboData.Precio = Number((totalBase * 0.85).toFixed(2));
  }

  // Helper para encontrar el objeto tamaño
  obtenerProductoTamano(idProductoT: number): ProductoTamano | undefined {
    for (const p of this.productos) {
      const encontrado = p.tamanos?.find(t => t.ID_Producto_T === idProductoT);
      if (encontrado) return encontrado;
    }
    return undefined;
  }

getTamanosActivos(producto: Producto): ProductoTamano[] {
  // Filtrar solo los tamaños con estado 'A' (Activo)
  return (producto.tamanos || []).filter(tamano => tamano.Estado === 'A');
}

// Método para verificar si un producto tiene tamaños activos disponibles
tieneTamanosActivos(producto: Producto): boolean {
  return this.getTamanosActivos(producto).length > 0;
}

// Método para obtener todos los tamaños (activos e inactivos) - para mostrar información
getTodosLosTamanos(producto: Producto): ProductoTamano[] {
  return producto.tamanos || [];
}

  getNombreCategoria(id: number): string {
    const cat = this.categorias.find(c => c.ID_Categoria_P === id);
    return cat ? cat.Nombre : 'Sin Categoría';
  }

  // =========================================
  // 🖼️ IMÁGENES
  // =========================================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreview = e.target?.result || null;
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  // =========================================
  // 💾 GUARDAR
  // =========================================

  validarFormulario(): boolean {
    if (!this.comboData.Nombre?.trim()) {
      Swal.fire('Atención', 'El nombre del combo es obligatorio', 'warning');
      return false;
    }
    if (this.comboData.Precio <= 0) {
      Swal.fire('Atención', 'El precio debe ser mayor a 0', 'warning');
      return false;
    }
    if (this.comboData.detalles.length === 0) {
      Swal.fire('Atención', 'Debes agregar al menos un producto al combo', 'warning');
      return false;
    }
    return true;
  }

  onGuardar() {
    if (!this.validarFormulario()) return;

    this.guardando = true;

    // 1. Preparar array limpio para el DTO (solo ID y Cantidad)
    const detallesDTO = this.comboData.detalles.map(d => ({
      ID_Producto_T: d.ID_Producto_T,
      Cantidad: d.Cantidad
    }));

    // 2. Decidir si usar FormData (con imagen) o JSON (sin imagen)
    if (this.selectedFile) {
      // --- CON IMAGEN ---
      const formData = new FormData();
      formData.append('Nombre', this.comboData.Nombre.trim());
      formData.append('Descripcion', this.comboData.Descripcion || '');
      formData.append('Precio', String(this.comboData.Precio));
      formData.append('Estado', this.comboData.Estado);
      
      // Enviar detalles como JSON string
      formData.append('detalles', JSON.stringify(detallesDTO));
      
      // Adjuntar archivo
      formData.append('file', this.selectedFile);

      if (this.comboData.ID_Combo) {
        this.combosService.updateComboFormData(this.comboData.ID_Combo, formData)
          .subscribe({
            next: () => this.handleSuccess('Combo actualizado correctamente'),
            error: (err) => this.handleError(err)
          });
      } else {
        this.combosService.createComboFormData(formData)
          .subscribe({
            next: () => this.handleSuccess('Combo creado correctamente'),
            error: (err) => this.handleError(err)
          });
      }

    } else {
      // --- SIN IMAGEN (JSON DIRECTO) ---
      const comboDTO: ComboCreacionDTO = {
        Nombre: this.comboData.Nombre.trim(),
        Descripcion: this.comboData.Descripcion,
        Precio: this.comboData.Precio,
        Estado: this.comboData.Estado,
        detalles: detallesDTO
      };

      if (this.comboData.ID_Combo) {
        this.combosService.updateCombo(this.comboData.ID_Combo, comboDTO)
          .subscribe({
            next: () => this.handleSuccess('Combo actualizado correctamente'),
            error: (err) => this.handleError(err)
          });
      } else {
        this.combosService.createCombo(comboDTO)
          .subscribe({
            next: () => this.handleSuccess('Combo creado correctamente'),
            error: (err) => this.handleError(err)
          });
      }
    }
  }

  private handleSuccess(msg: string) {
    this.guardando = false;
    Swal.fire('¡Éxito!', msg, 'success');
    this.dialogRef.close(true);
  }

  private handleError(err: any) {
    this.guardando = false;
    console.error(err);
    Swal.fire('Error', 'Ocurrió un error al guardar el combo', 'error');
  }

  onCancelar() {
    this.dialogRef.close();
  }
}