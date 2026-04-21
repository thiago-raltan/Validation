import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CabecalhoComponent } from './compartilhado/componentes/cabecalho/cabecalho.component';
import { RodapeComponent } from './compartilhado/componentes/rodape/rodape.component';
import { TemaService } from './core/servicos/tema.service';

/** Componente raiz da aplicação — organiza cabeçalho, conteúdo e rodapé */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CabecalhoComponent, RodapeComponent],
  template: `
    <div class="layout">
      <app-cabecalho />
      <main class="layout__conteudo">
        <router-outlet />
      </main>
      <app-rodape />
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;

      &__conteudo {
        flex: 1;
      }
    }
  `],
})
export class AppComponent {
  readonly temaService = inject(TemaService);
}
