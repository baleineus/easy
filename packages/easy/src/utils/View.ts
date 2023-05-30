import {
  asJson,
  choose,
  Constructor,
  DontInfer,
  isArray,
  isBoolean,
  isDefined,
  isEqual,
  isFunction,
  isNumber,
  isObject,
  isPageList,
  isString,
  Json,
  json,
  List,
  meta,
  PageList,
  toPageList,
  tryTo,
} from '../types';
import { traverse } from './Traverse';

type Func<T = unknown> = (a: any, key?: string) => T;

export type InOut = { in?: Func | View; col?: string };

const isColOnly = (v: unknown): v is InOut => isObject(v) && isDefined(v.col) && !isDefined(v.in);
const isInOnly = (v: unknown): v is InOut => isObject(v) && !isDefined(v.col) && isFunction(v.in);
const isColAndFunction = (
  v: unknown
): v is {
  col: string;
  in: Func;
} => isObject(v) && isDefined(v.col) && isFunction(v.in);
const isColAndView = (
  v: unknown
): v is {
  col: string;
  in: View;
} => isObject(v) && isDefined(v.col) && v.in instanceof View;

type Views<V = Json> = Partial<Record<keyof V, string | Func | InOut | number | boolean | undefined>>;
type Viewer = { in: { key: string; f: Func } };

const toFunc = (a: any, col: string, f: Func = a => a): Func =>
  tryTo(traverse(a, col)).map(v => (isArray(v) ? () => v.map(i => f(i, col)) : (a: any) => f(traverse(a, col)))).value;

const toViewer = (key: string, value: unknown): Viewer =>
  choose(value)
    .is.not.defined(
      v => v,
      () => toViewer(key, () => undefined)
    )
    .type(isBoolean, b => toViewer(key, () => b))
    .type(isNumber, n => toViewer(key, () => n))
    .type(isString, s => toViewer(key, (a: any) => toFunc(a, s)(a)))
    .type(isColOnly, io => toViewer(key, io.col))
    .type(isFunction, f => toViewer(key, { in: { key, f } }))
    .type(isInOnly, io => toViewer(key, { in: { key, f: io.in } }))
    .type(isColAndFunction, io => toViewer(key, { in: { key, f: (a: any) => toFunc(a, io.col, io.in)(a) } }))
    .type(isColAndView, io => toViewer(key, { in: { key, f: (a: any) => io.in.from(traverse(a, io.col)) } }))
    .else(v => v as Viewer);

const toViewers = (views: Views): Viewer[] =>
  meta(views)
    .entries()
    .map(([k, v]) => toViewer(k, v));

export class View<V = Json> {
  constructor(private views: Views<V> = {} as Views<V>, readonly startsFrom: 'scratch' | 'source' = 'scratch', readonly viewers: Viewer[] = toViewers(views)) {}

  get fromSource(): View<V> {
    return new View(this.views, 'source', this.viewers);
  }

  from<T = unknown>(source: PageList<T>): PageList<V>;
  from<T = unknown>(source: List<T>): List<V>;
  from<T = unknown>(source: T[]): V[];
  from<T = unknown>(source: T): V;
  from<T = unknown>(source: PageList<T> | List<T> | T[] | T): PageList<V> | List<V> | V[] | V {
    if (isPageList(source))
      return toPageList(
        source.map(s => this.reduce(asJson(s))),
        source
      );
    if (isArray(source)) return source.map(s => this.reduce(asJson(s)));
    return this.reduce(asJson(source));
  }

  same = (one?: unknown, another?: unknown): boolean => isEqual(this.from(one), this.from(another));

  private reduce = (i: any): any => this.viewers.reduce((a: any, v) => json.set(a, v.in.key, v.in.f(i, v.in.key)), this.startsFrom === 'scratch' ? {} : i);
}

export const skip = () => undefined;
export const view = <V = Json>(views: Views<DontInfer<V>>): View<V> => new View<V>(views);

export const views = {
  ignore: () => undefined,
  skip: () => undefined,
  keep: (a: unknown, key?: string) => traverse(a, key),
  keepOr: (alt?: unknown) => (a: unknown, key?: string) => traverse(a, key) ?? alt,
  or:
    (key: string, alt = '') =>
    (a: unknown) =>
      traverse(a, key) ?? alt,
  value: (value: unknown) => () => value,
  to:
    <T>(ctor: Constructor<T>) =>
    (a: unknown, key?: string) =>
      new ctor(traverse(a, key)),
};
