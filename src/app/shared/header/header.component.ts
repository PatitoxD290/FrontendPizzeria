import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd, Data } from '@angular/router';
import { filter, map, mergeMap, startWith } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CategoriaService } from '../../core/services/categoria.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonToggleModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  titulo: string = '';
  subtitulo: string = '';
  mostrarCategorias: boolean = false;
  filtroCategoria: string = '';
  categorias: { id: number; nombre: string }[] = [];
  CATEGORY_MAP: Record<number, string> = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private categoriaService: CategoriaService
  ) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null),
        map(() => this.route),
        map(route => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap(route => route.data)
      )
      .subscribe((data: Data) => {
        this.titulo = data['title'] ?? '';
        this.subtitulo = data['subtitle'] ?? '';
        this.mostrarCategorias = data['mostrarCategorias'] ?? false;
      });
  }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  private cargarCategorias(): void {
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (data: any[]) => {
        if (Array.isArray(data)) {
          this.CATEGORY_MAP = data.reduce((acc, item) => {
            acc[item.ID_Categoria_P] = item.Nombre ?? `Categoría ${item.ID_Categoria_P}`;
            return acc;
          }, {} as Record<number, string>);

          this.categorias = data.map((item) => ({
            id: item.ID_Categoria_P,
            nombre: item.Nombre ?? `Categoría ${item.ID_Categoria_P}`,
          }));

          const existeCombos = this.categorias.some(
            (c) => c.nombre.toLowerCase() === 'combos'
          );
          if (!existeCombos) {
            this.categorias.push({ id: 999, nombre: 'Combos' });
            this.CATEGORY_MAP[999] = 'Combos';
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.CATEGORY_MAP = {};
        this.categorias = [{ id: 999, nombre: 'Combos' }];
        this.CATEGORY_MAP[999] = 'Combos';
      },
    });
  }

  getIconoCategoria(nombre: string): string {
    const lower = nombre.toLowerCase();
    
    // Bebidas
    if (lower === 'bebida' || lower === 'bebidas') {
      return '/assets/icons/ic-bebida.png';
    }
    
    // Pizza Clásica
    if (lower.includes('pizza clásica') || lower.includes('pizzas clásicas') || 
        lower.includes('pizza clasica') || lower.includes('pizzas clasicas') ||
        lower.includes('pizza clásicas') || lower.includes('pizzas clásica')) {
      return '/assets/icons/ic-pizza-cl.png';
    }
    
    // Pizza Especial
    if (lower.includes('pizza especial') || lower.includes('pizzas especiales') ||
        lower.includes('pizza especiales') || lower.includes('pizzas especial')) {
      return '/assets/icons/ic-pizza-es.png';
    }
    
    // Combos
    if (lower.includes('combo')) {
      return '/assets/icons/ic-combo.png';
    }
    
    // Icono por defecto para otras categorías
    return '/assets/icons/ic-combo.png';
  }

  cambiarCategoria(categoria: string): void {
    this.filtroCategoria = categoria;
    window.dispatchEvent(new CustomEvent('cambioCategoria', { detail: categoria }));
  }
}