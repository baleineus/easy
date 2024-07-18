import { Enum } from '../types/Enum';
import { text } from '../types/Template';
import type { Text } from '../types/Text';
import { List, toList } from '../types/List';
import { IdName } from '../types/Identity';
import { isString } from '../types/Is';
import { kebab } from '../types/Text';

export class Scope extends Enum {
  protected constructor(
    readonly name: string,
    id: Text = text(name).kebab,
    readonly subs: List<Scope> = toList()
  ) {
    super(name, id.toString());
  }

  for(item: string | IdName): Scope {
    return new Scope(`${this.name} ${isString(item) ? text(item).title : item.name}`, kebab(`${this.id} ${isString(item) ? item : item.id}`));
  }

  combines(...scopes: Scope[]): this {
    this.subs.add(scopes);
    return this;
  }

  expand(): List<Scope> {
    return this.subs
      .flatMap(s => s.expand())
      .add(this)
      .distinct();
  }
}
