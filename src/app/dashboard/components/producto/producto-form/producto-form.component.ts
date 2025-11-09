import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule,NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { RecetaService } from '../../../../core/services/receta.service';
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano } from '../../../../core/models/tamano.model';
import Swal from 'sweetalert2';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule
  ],
  templateUrl: './producto-form.component.html',
  styleUrls: ['./producto-form.component.css']
})
export class ProductoFormComponent implements OnInit {
  producto: Producto;
  CategoriaProducto: any[] = [];
  Receta: any[] = [];
  todosLosTamanos: Tamano[] = [];
  
  // Array para manejar múltiples tamaños con precios
  tamanosConPrecio: ProductoTamano[] = [];
  
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private recetaService: RecetaService,
    private tamanoService: TamanoService,
    private dialogRef: MatDialogRef<ProductoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto?: Producto }
  ) {
    this.producto = data?.producto ? { ...data.producto } : {
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

  ngOnInit(): void {
    this.loadCategorias();
    this.loadRecetas();
    this.loadTamanos();
  }

  loadCategorias() {
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (data) => (this.CategoriaProducto = data),
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  loadRecetas() {
    this.recetaService.getRecetas().subscribe({
      next: (data) => (this.Receta = data),
      error: (err) => console.error('Error al cargar recetas', err)
    });
  }

loadTamanos() {
  this.tamanoService.getTamanos().subscribe({
    next: (data) => {
      this.todosLosTamanos = data;
      
      // Si es edición y el producto tiene tamaños, cargarlos
      if (this.producto.tamanos && this.producto.tamanos.length > 0) {
        this.tamanosConPrecio = this.producto.tamanos.map(t => ({
          ...t,
          nombre_tamano: this.getNombreTamano(t.ID_Tamano)
        }));
      } else {
        // Si es nuevo, agregar un tamaño por defecto
        this.agregarTamano();
      }
    },
    error: (err) => console.error('Error al cargar tamaños', err)
  });
}

  getNombreTamano(idTamano: number): string {
    return this.todosLosTamanos.find(t => t.ID_Tamano === idTamano)?.Tamano || '';
  }

  // Agregar un nuevo tamaño
  agregarTamano() {
    const nuevoTamano: ProductoTamano = {
      ID_Producto_T: 0,
      ID_Producto: this.producto.ID_Producto,
      ID_Tamano: this.todosLosTamanos.length > 0 ? this.todosLosTamanos[0].ID_Tamano : 0,
      Precio: 0,
      Estado: 'A',
      Fecha_Registro: new Date().toISOString(),
      nombre_tamano: this.todosLosTamanos.length > 0 ? this.todosLosTamanos[0].Tamano : ''
    };
    this.tamanosConPrecio.push(nuevoTamano);
  }

  // Eliminar un tamaño
  eliminarTamano(index: number) {
    if (this.tamanosConPrecio.length > 1) {
      this.tamanosConPrecio.splice(index, 1);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede eliminar',
        text: 'Debe haber al menos un tamaño para el producto.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  // Verificar si un tamaño ya está seleccionado en otros campos
  isTamanoDisponible(tamanoId: number, currentIndex: number): boolean {
    return !this.tamanosConPrecio.some((tamano, index) => 
      index !== currentIndex && tamano.ID_Tamano === tamanoId
    );
  }

  // Cuando cambia la selección de tamaño
  onTamanoChange(tamanoId: number, index: number) {
    const tamanoSeleccionado = this.todosLosTamanos.find(t => t.ID_Tamano === tamanoId);
    if (tamanoSeleccionado) {
      this.tamanosConPrecio[index].nombre_tamano = tamanoSeleccionado.Tamano;
    }
  }

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

  // Método para quitar imagen
  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    
    // También limpia el input file
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  saveProducto() {
    // Capitalizar nombre
    if (this.producto.Nombre) {
      this.producto.Nombre = this.capitalizeWords(this.producto.Nombre.trim());
    }

    // Validar campos obligatorios
    if (!this.producto.Nombre || !this.producto.ID_Categoria_P) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa los campos obligatorios: nombre y categoría.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Validar que la cantidad disponible no sea negativa
    if (this.producto.Cantidad_Disponible < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: 'La cantidad disponible no puede ser negativa.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Validar que haya al menos un tamaño
    if (this.tamanosConPrecio.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin tamaños',
        text: 'Debes agregar al menos un tamaño para el producto.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Validar que todos los tamaños tengan precio válido
    const tamanosValidos = this.tamanosConPrecio.filter(t => t.Precio > 0);
    if (tamanosValidos.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precios inválidos',
        text: 'Todos los tamaños deben tener un precio mayor a 0.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Validar que no haya tamaños duplicados
    const tamanosIds = this.tamanosConPrecio.map(t => t.ID_Tamano);
    const tieneDuplicados = new Set(tamanosIds).size !== tamanosIds.length;
    if (tieneDuplicados) {
      Swal.fire({
        icon: 'warning',
        title: 'Tamaños duplicados',
        text: 'No puedes seleccionar el mismo tamaño más de una vez.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Preparar FormData
    const formData = new FormData();
    
    // Datos del producto
    formData.append('Nombre', this.producto.Nombre);
    formData.append('Descripcion', this.producto.Descripcion || '');
    formData.append('ID_Categoria_P', String(this.producto.ID_Categoria_P));
    formData.append('ID_Receta', this.producto.ID_Receta ? String(this.producto.ID_Receta) : '');
    formData.append('Cantidad_Disponible', String(this.producto.Cantidad_Disponible));
    formData.append('Estado', this.producto.Estado);
    
    // Agregar tamaños como JSON string
    formData.append('Producto_Tamano', JSON.stringify(tamanosValidos));
    
    // Agregar imagen si existe
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    // Debug
    console.log('Datos a enviar:');
    console.log('Producto:', this.producto);
    console.log('Tamaños válidos:', tamanosValidos);

    // Enviar
    if (!this.producto.ID_Producto || this.producto.ID_Producto === 0) {
      this.productoService.createProductoFormData(formData).subscribe({
        next: () => this.handleSuccess('Producto creado', 'El producto se registró correctamente.'),
        error: (err) => this.handleError('crear', err)
      });
    } else {
      this.productoService.updateProductoFormData(this.producto.ID_Producto, formData).subscribe({
        next: () => this.handleSuccess('Producto actualizado', 'El producto fue actualizado correctamente.'),
        error: (err) => this.handleError('actualizar', err)
      });
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
    console.error(`Error al ${action} producto`, err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `No se pudo ${action} el producto.`,
      confirmButtonColor: '#d33'
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}