import { Component, EventEmitter, Output, Input, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Combo, ComboDetalle } from '../../../../core/models/combo.model';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';
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

// Interface para combo con detalles
interface ComboConDetalles extends Combo {
  detalles: Array<{
    ID_Producto_T: number;
    Cantidad: number;
    Producto_Nombre?: string;
    Tamano_Nombre?: string;
  }>;
}

@Component({
  selector: 'app-combo-form',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './combo-form.component.html',
  styleUrl: './combo-form.component.css'
})
export class ComboFormComponent implements OnInit {

  // Datos del combo CON DETALLES
  comboData: ComboConDetalles = {
    ID_Combo: 0,
    Nombre: '',
    Descripcion: '',
    Precio: 0,
    Estado: 'A',
    detalles: []
  };

  // Productos y filtros
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: CategoriaProducto[] = [];
  terminoBusqueda: string = '';
  categoriaFiltro: number = 0;
  cargando: boolean = false;
  cargandoCategorias: boolean = false;

  // Manejo de imágenes
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private productoService: ProductoService,
    private combosService: CombosService,
    private categoriaService: CategoriaService,
    private dialogRef: MatDialogRef<ComboFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { combo?: ComboConDetalles }
  ) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarCategorias();
    
    // Usar data del diálogo
    if (this.data.combo) {
      this.comboData = { 
        ...this.data.combo,
        detalles: this.data.combo.detalles || []
      };
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

  // Cargar categorías desde el servicio
  cargarCategorias() {
    this.cargandoCategorias = true;
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cargandoCategorias = false;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.cargandoCategorias = false;
      }
    });
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
    const detalleExistente = this.comboData.detalles.find(d => d.ID_Producto_T === productoTamano.ID_Producto_T);
    
    if (detalleExistente) {
      detalleExistente.Cantidad++;
    } else {
      const nuevoDetalle = {
        ID_Producto_T: productoTamano.ID_Producto_T,
        Cantidad: 1,
        Producto_Nombre: producto.Nombre,
        Tamano_Nombre: productoTamano.nombre_tamano
      };
      this.comboData.detalles.push(nuevoDetalle);
    }
  }

  // Remover producto del combo
  removerProducto(index: number) {
    this.comboData.detalles.splice(index, 1);
  }

  // Actualizar cantidad
  actualizarCantidad(detalle: any, cantidad: number) {
    if (cantidad > 0) {
      detalle.Cantidad = cantidad;
    } else if (cantidad === 0) {
      const index = this.comboData.detalles.indexOf(detalle);
      if (index > -1) {
        this.comboData.detalles.splice(index, 1);
      }
    }
  }

  // Obtener ProductoTamano por ID
  obtenerProductoTamano(idProductoTamano: number): ProductoTamano | undefined {
    for (const producto of this.productos) {
      const encontrado = producto.tamanos?.find(t => t.ID_Producto_T === idProductoTamano);
      if (encontrado) return encontrado;
    }
    return undefined;
  }

  // Obtener nombre de categoría por ID
  getNombreCategoria(idCategoria: number): string {
    const categoria = this.categorias.find(c => c.ID_Categoria_P === idCategoria);
    return categoria ? categoria.Nombre : `Categoría ${idCategoria}`;
  }

  // Obtener tamaños activos de un producto
  getTamanosActivos(producto: Producto): ProductoTamano[] {
    return producto.tamanos?.filter(t => t.Estado === 'A') || [];
  }

  // Validar formulario
  validarFormulario(): boolean {
    // Capitalizar nombre
    if (this.comboData.Nombre) {
      this.comboData.Nombre = this.capitalizeWords(this.comboData.Nombre.trim());
    }

    if (!this.comboData.Nombre?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo incompleto',
        text: 'Por favor ingrese un nombre para el combo.',
        confirmButtonColor: '#3085d6'
      });
      return false;
    }

    if (this.comboData.Precio <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'Por favor ingrese un precio válido para el combo.',
        confirmButtonColor: '#3085d6'
      });
      return false;
    }

    if (this.comboData.detalles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Por favor agregue al menos un producto al combo.',
        confirmButtonColor: '#3085d6'
      });
      return false;
    }

    return true;
  }

  // ==============================
  // 🖼️ MANEJO DE IMÁGENES
  // ==============================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.imagePreview = null;
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

// ==============================
// 💾 GUARDAR COMBO - CORREGIDO
// ==============================
onGuardar() {
  if (!this.validarFormulario()) {
    return;
  }

  // Preparar los detalles para enviar (solo campos necesarios)
  const detallesParaEnviar = this.comboData.detalles.map(detalle => ({
    ID_Producto_T: detalle.ID_Producto_T,
    Cantidad: detalle.Cantidad
  }));

  console.log('=== DATOS A ENVIAR ===');
  console.log('Combo:', this.comboData);
  console.log('Detalles para enviar:', detallesParaEnviar);

  if (this.selectedFile) {
    // Usar FormData para enviar con imagen
    const formData = new FormData();
    formData.append('Nombre', this.comboData.Nombre);
    formData.append('Descripcion', this.comboData.Descripcion || '');
    formData.append('Precio', String(this.comboData.Precio));
    formData.append('Estado', this.comboData.Estado);
    
    // ✅ CRÍTICO: Enviar detalles como JSON string
    formData.append('detalles', JSON.stringify(detallesParaEnviar));
    
    formData.append('file', this.selectedFile);

    // Debug: mostrar lo que se envía en FormData
    console.log('FormData contenido:');
    for (let [key, value] of (formData as any).entries()) {
      console.log(key, value);
    }

    if (!this.comboData.ID_Combo || this.comboData.ID_Combo === 0) {
      this.combosService.createComboFormData(formData).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          this.handleSuccess('Combo creado', 'El combo se registró correctamente.');
        },
        error: (err) => {
          console.error('❌ Error completo:', err);
          console.error('❌ Error details:', err.error);
          this.handleError('crear', err);
        }
      });
    } else {
      this.combosService.updateComboFormData(this.comboData.ID_Combo, formData).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          this.handleSuccess('Combo actualizado', 'El combo fue actualizado correctamente.');
        },
        error: (err) => {
          console.error('❌ Error completo:', err);
          console.error('❌ Error details:', err.error);
          this.handleError('actualizar', err);
        }
      });
    }
  } else {
    // Enviar sin imagen (JSON directo)
    const comboParaEnviar = {
      ...this.comboData,
      detalles: detallesParaEnviar
    };

    console.log('Enviando JSON directo:', comboParaEnviar);

    if (!this.comboData.ID_Combo || this.comboData.ID_Combo === 0) {
      this.combosService.createCombo(comboParaEnviar).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          this.handleSuccess('Combo creado', 'El combo se registró correctamente.');
        },
        error: (err) => {
          console.error('❌ Error completo:', err);
          console.error('❌ Error details:', err.error);
          this.handleError('crear', err);
        }
      });
    } else {
      this.combosService.updateCombo(this.comboData.ID_Combo, comboParaEnviar).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          this.handleSuccess('Combo actualizado', 'El combo fue actualizado correctamente.');
        },
        error: (err) => {
          console.error('❌ Error completo:', err);
          console.error('❌ Error details:', err.error);
          this.handleError('actualizar', err);
        }
      });
    }
  }
}

  private capitalizeWords(text: string): string {
    return text
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private handleSuccess(title: string, text: string) {
    Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 1500,
      showConfirmButton: false
    });
    this.dialogRef.close(true);
  }

  private handleError(action: string, err: any) {
    console.error(`Error al ${action} combo`, err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `No se pudo ${action} el combo.`,
      confirmButtonColor: '#d33'
    });
  }

  // Cancelar
  onCancelar() {
    this.dialogRef.close();
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.categoriaFiltro = 0;
    this.filtrarProductos();
  }

  // Calcular precio automáticamente basado en los productos seleccionados
  calcularPrecioAutomatico() {
    let total = 0;
    for (const detalle of this.comboData.detalles) {
      const productoTamano = this.obtenerProductoTamano(detalle.ID_Producto_T);
      if (productoTamano) {
        total += productoTamano.Precio * detalle.Cantidad;
      }
    }
    // Aplicar un descuento del 10% para el combo
    this.comboData.Precio = total * 0.9;
  }

  // Agregar producto y calcular precio automático
  agregarProductoYCalcular(productoTamano: ProductoTamano, producto: Producto) {
    this.agregarProducto(productoTamano, producto);
    this.calcularPrecioAutomatico();
  }

  // Actualizar cantidad y recalcular precio
  actualizarCantidadYCalcular(detalle: any, cantidad: number) {
    this.actualizarCantidad(detalle, cantidad);
    this.calcularPrecioAutomatico();
  }

  // Remover producto y recalcular precio
  removerProductoYCalcular(index: number) {
    this.removerProducto(index);
    this.calcularPrecioAutomatico();
  }
}