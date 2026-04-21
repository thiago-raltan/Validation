import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TemaService } from '../../../core/servicos/tema.service';
import { MARCA_CONFIG } from '../../../core/config/marca.config';

/** Componente do rodapé da aplicação */
@Component({
  selector: 'app-rodape',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './rodape.component.html',
  styleUrls: ['./rodape.component.scss'],
})
export class RodapeComponent {
  readonly temaService = inject(TemaService);
  readonly anoAtual = new Date().getFullYear();
  readonly slogan = MARCA_CONFIG.slogan;
}
