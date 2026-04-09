import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SobreService } from '../../core/servicos/sobre.service';

/** Página "Sobre nós" da loja */
@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sobre.component.html',
  styleUrls: ['./sobre.component.scss'],
})
export class SobreComponent {
  private sobreService = inject(SobreService);

  readonly conteudo = this.sobreService.conteudo;
}
