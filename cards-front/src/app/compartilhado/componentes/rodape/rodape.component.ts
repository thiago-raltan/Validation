import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Componente do rodapé da aplicação */
@Component({
  selector: 'app-rodape',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './rodape.component.html',
  styleUrls: ['./rodape.component.scss'],
})
export class RodapeComponent {
  readonly anoAtual = new Date().getFullYear();
}
