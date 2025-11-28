import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Modelos
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';
import { Receta } from '../../../../core/models/receta.model';
import { Tamano } from '../../../../core/models/tamano.model';

// Servicios
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { RecetaService } from '../../../../core/services/receta.service';
import { TamanoService } from '../../../../core/services/tamano.service';

import Swal from 'sweetalert2';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-producto-form',
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
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './producto-form.component.html',
  styleUrls: ['./producto-form.component.css']
})
export class ProductoFormComponent implements OnInit {
  
  producto: Producto;
  
  // Listas para selects
  categorias: CategoriaProducto[] = [];
  recetas: Receta[] = [];
  todosLosTamanos: Tamano[] = [];
  
  // Array local para manejar la configuración de precios
  tamanosConPrecio: ProductoTamano[] = [];
  
  // Manejo de Imágenes
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  
  // Estado UI
  guardando: boolean = false;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private recetaService: RecetaService,
    private tamanoService: TamanoService,
    private dialogRef: MatDialogRef<ProductoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto?: Producto }
  ) {
    // Inicializar producto (Edición o Nuevo)
    if (data?.producto) {
      this.producto = { ...data.producto };
      // Si hay imagen existente, podrías asignarla para visualización (opcional)
      // this.imagePreview = ... 
    } else {
      this.producto = {
        ID_Producto: 0,
        Nombre: '',
        Descripcion: '',
        ID_Categoria_P: 0,
        ID_Receta: null,
        Cantidad_Disponible: 0,
        Estado: 'A',
        Fecha_Registro: new Date().toISOString()
      };
    }
  }

  ngOnInit(): void {
    this.loadCategorias();
    this.loadRecetas();
    this.loadTamanos();
  }

  // =========================================
  // 📥 CARGA DE DATOS
  // =========================================

  loadCategorias() {
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (data) => (this.categorias = data),
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  loadRecetas() {
    this.recetaService.getRecetas().subscribe({
      next: (data) => (this.recetas = data),
      error: (err) => console.error('Error al cargar recetas', err)
    });
  }

  loadTamanos() {
    this.tamanoService.getTamanos().subscribe({
      next: (data) => {
        this.todosLosTamanos = data;
        this.inicializarTamanosProducto();
      },
      error: (err) => console.error('Error al cargar tamaños', err)
    });
  }

  inicializarTamanosProducto() {
    // Si es edición y tiene tamaños, cargarlos
    if (this.producto.tamanos && this.producto.tamanos.length > 0) {
      // Clonar para no mutar el original hasta guardar
      this.tamanosConPrecio = this.producto.tamanos.map(t => ({
        ...t,
        nombre_tamano: this.getNombreTamano(t.ID_Tamano)
      }));
    } else {
      // Si es nuevo o no tiene, agregar una fila vacía por defecto
      this.agregarTamano();
    }
  }

  // =========================================
  // 📏 GESTIÓN DE TAMAÑOS
  // =========================================

  getNombreTamano(idTamano: number): string {
    return this.todosLosTamanos.find(t => t.ID_Tamano === idTamano)?.Tamano || '';
  }

  agregarTamano() {
    // Buscar el primer tamaño que NO esté seleccionado todavía
    const primerDisponible = this.todosLosTamanos.find(t => 
      !this.tamanosConPrecio.some(tp => tp.ID_Tamano === t.ID_Tamano)
    );
    
    const idInicial = primerDisponible ? primerDisponible.ID_Tamano : (this.todosLosTamanos[0]?.ID_Tamano || 0);

    const nuevoTamano: ProductoTamano = {
      ID_Producto_T: 0,
      ID_Producto: this.producto.ID_Producto,
      ID_Tamano: idInicial,
      Precio: 0,
      Estado: 'A',
      Fecha_Registro: new Date().toISOString(),
      nombre_tamano: this.getNombreTamano(idInicial)
    };
    
    this.tamanosConPrecio.push(nuevoTamano);
  }

  eliminarTamano(index: number) {
    if (this.tamanosConPrecio.length > 1) {
      this.tamanosConPrecio.splice(index, 1);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'El producto debe tener al menos un tamaño y precio.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  // Verificar si un tamaño ya está seleccionado en OTRA fila
  isTamanoDisponible(tamanoId: number, currentIndex: number): boolean {
    return !this.tamanosConPrecio.some((tamano, index) => 
      index !== currentIndex && tamano.ID_Tamano === tamanoId
    );
  }

  // Actualizar nombre visual al cambiar el select
  onTamanoChange(tamanoId: number, index: number) {
    const tamanoSeleccionado = this.todosLosTamanos.find(t => t.ID_Tamano === tamanoId);
    if (tamanoSeleccionado) {
      this.tamanosConPrecio[index].nombre_tamano = tamanoSeleccionado.Tamano;
    }
  }

  // =========================================
  // 🖼️ IMÁGENES
  // =========================================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // =========================================
  // 💾 GUARDAR
  // =========================================

  saveProducto() {
    // 1. Validaciones
    if (!this.producto.Nombre?.trim() || !this.producto.ID_Categoria_P) {
      Swal.fire('Campos incompletos', 'Nombre y Categoría son obligatorios.', 'warning');
      return;
    }

    if (this.producto.Cantidad_Disponible < 0) {
      Swal.fire('Error', 'La cantidad no puede ser negativa.', 'error');
      return;
    }

    // Validar tamaños
    const preciosValidos = this.tamanosConPrecio.every(t => t.Precio > 0);
    if (!preciosValidos) {
      Swal.fire('Precios inválidos', 'Todos los tamaños deben tener un precio mayor a 0.', 'warning');
      return;
    }

    // Validar duplicados (backup)
    const ids = this.tamanosConPrecio.map(t => t.ID_Tamano);
    if (new Set(ids).size !== ids.length) {
      Swal.fire('Duplicados', 'No puedes tener el mismo tamaño repetido.', 'error');
      return;
    }

    this.guardando = true;

    // 2. Preparar FormData
    const formData = new FormData();
    
    // Campos simples
    formData.append('Nombre', this.producto.Nombre.trim());
    formData.append('Descripcion', this.producto.Descripcion || '');
    formData.append('ID_Categoria_P', String(this.producto.ID_Categoria_P));
    // Enviar ID_Receta solo si no es null
    if (this.producto.ID_Receta) formData.append('ID_Receta', String(this.producto.ID_Receta));
    formData.append('Cantidad_Disponible', String(this.producto.Cantidad_Disponible));
    formData.append('Estado', this.producto.Estado);

    // 3. Array de Tamaños -> JSON String
    const tamanosLimpios = this.tamanosConPrecio.map(t => ({
      ID_Tamano: t.ID_Tamano,
      Precio: Number(t.Precio)
    }));
    formData.append('Producto_Tamano', JSON.stringify(tamanosLimpios));

    // 4. Imagen
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    // 5. Enviar al servicio
    if (!this.producto.ID_Producto || this.producto.ID_Producto === 0) {
      // CREAR
      this.productoService.createProductoFormData(formData).subscribe({
        next: () => this.handleSuccess('Producto creado correctamente'),
        error: (err) => this.handleError('crear', err)
      });
    } else {
      // ACTUALIZAR
      this.productoService.updateProductoFormData(this.producto.ID_Producto, formData).subscribe({
        next: () => this.handleSuccess('Producto actualizado correctamente'),
        error: (err) => this.handleError('actualizar', err)
      });
    }
  }

  private handleSuccess(msg: string) {
    this.guardando = false;
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: msg,
      timer: 1500,
      showConfirmButton: false
    });
    this.dialogRef.close(true);
  }

  private handleError(action: string, err: any) {
    this.guardando = false;
    console.error(`Error al ${action} producto:`, err);
    Swal.fire('Error', `No se pudo ${action} el producto.`, 'error');
  }

  close() {
    this.dialogRef.close(false);
  }
}