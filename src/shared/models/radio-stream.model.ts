import { Model, ModelProp } from './model.model';

export class RadioStream extends Model {
  static className = 'RadioStream';

  @ModelProp()
  private url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }
}
