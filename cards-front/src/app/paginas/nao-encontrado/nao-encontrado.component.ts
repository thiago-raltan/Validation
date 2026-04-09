import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página 404 - Página não encontrada */
@Component({
  selector: 'app-nao-encontrado',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="pagina-404">
      <div class="pagina-404__conteudo">
        <span class="pagina-404__codigo">404</span>
        <h1 class="pagina-404__titulo">Página não encontrada</h1>
        <p class="pagina-404__texto">
          Ops! A página que você procura não existe ou foi movida.
        </p>
        <a routerLink="/" class="pagina-404__btn">🏠 Voltar ao Início</a>
      </div>
    </div>
  `,
  styles: [`
    .pagina-404 {
      background: #1a1a2e;
      min-height: calc(100vh - 200px);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;

      &__conteudo { max-width: 500px; }

      &__codigo {
        display: block;
        font-size: 6rem;
        font-weight: 900;
        color: #e63946;
        line-height: 1;
        margin-bottom: 0.5rem;
      }

      &__titulo {
        font-size: 1.8rem;
        font-weight: 800;
        color: #f1faee;
        margin-bottom: 0.75rem;
      }

      &__texto {
        color: #6c757d;
        margin-bottom: 2rem;
      }

      &__btn {
        background: #e63946;
        color: #fff;
        padding: 0.85rem 2rem;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 700;
        transition: background 0.2s;

        &:hover { background: #c1121f; }
      }
    }
  `],
})
export class NaoEncontradoComponent {}
