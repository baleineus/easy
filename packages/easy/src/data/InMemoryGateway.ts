import { Exception, FetchOptions, Gateway, Id, isDefined, Json, JsonValue, Optional, PageList, toPageList } from '../types';
import { when } from '../validation';

export class InMemoryGateway extends Gateway {
  constructor(private readonly data: Promise<PageList<Json>>) {
    super();
  }

  all(options?: FetchOptions): Promise<PageList<Json>> {
    return this.data.then(d => toPageList(d, d));
  }

  byId(id: Id): Promise<Optional<Json>> {
    return this.data.then(d => d.byId(id)).then(d => (d ? { ...d } : undefined));
  }

  by = (key: string, value: JsonValue): Promise<PageList<Json>> => {
    return this.data.then(d => d.filter(i => i[key] === value));
  };

  exists(id: Id): Promise<boolean> {
    return this.byId(id).then(d => isDefined(d));
  }

  add(item: Json): Promise<Json> {
    return when(item)
      .not.contains(i => i.id)
      .reject(Exception.IsMissingId)
      .then(i => this.exists(i.id as Id))
      .then(ex => when(ex).isTrue.reject(Exception.AlreadyExists))
      .then(() => this.data.then(d => d.add(item)))
      .then(() => ({ ...item }));
  }

  remove(id: Id): Promise<true> {
    return this.data
      .then(d =>
        when(d.findIndex(i => i.id === id))
          .with(i => i < 0)
          .reject(Exception.DoesNotExist)
          .then(i => d.splice(i, 1))
      )
      .then(() => true);
  }

  update(item: Json): Promise<Json> {
    return when(item)
      .not.contains(i => i.id)
      .reject(Exception.IsMissingId)
      .then(i => this.remove(i.id as Id).then(() => this.add(i)));
  }
}
