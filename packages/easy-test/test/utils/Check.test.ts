import { check, checkDefined, mock } from "../../src";

describe("Check", () => {

  let ctx: jest.MatcherContext;

  const { return: returns } = mock;

  beforeEach(() => {
    ctx = {utils: {printReceived: returns('received'), printExpected: returns('expected'), diff: returns('diff')}} as unknown as jest.MatcherContext;
  });

  test("received and expected are undefined", () => {
    const m = check(ctx, undefined, undefined);
    expect(m.undefined(([r]) => r, '').else().pass).toBeFalsy();
    expect(m.undefined(([,e]) => e, '').else().pass).toBeFalsy();
  });

  test("received and expected are both undefined", () => {
    const m = checkDefined(ctx, undefined, undefined);
    expect(m.else().pass).toBeFalsy();
  });

  test("received and expected are defined", () => {
    const m = check(ctx, {}, {});
    expect(m.undefined(([r]) => r, '').else().pass).toBeTruthy();
    expect(m.undefined(([,e]) => e, '').else().pass).toBeTruthy();
  });

  test("received and expected are both defined", () => {
    const m = checkDefined(ctx, {}, {});
    expect(m.else().pass).toBeTruthy();
  });

  test("property of received is undefined", () => {
    const m = check(ctx, {name: undefined}, {});
    expect(m.undefined(([r]) => r.name, '').else().pass).toBeFalsy();
  });

  test("property of received is defined", () => {
    const m = check(ctx, {name: 'Sander'});
    expect(m.undefined(([r]) => r.name, '').else().pass).toBeTruthy();
  });

  test("property of received is not valid", () => {
    const m = check(ctx, {name: 'Sander'});
    expect(m.not(([r]) => r.name === 'Eugen', '').else().pass).toBeFalsy();
  });

  test("property of received is valid", () => {
    const m = check(ctx, {name: 'Claudia'});
    expect(m.not(([r]) => r.name === 'Claudia', '').else().pass).toBeTruthy();
  });

  test('print strings', () => {
    const m = check(ctx, {name: 'Claudia'}, {name: 'Joyce'});
    expect(m.print('This is what we {r}')).toBe('This is what we received');
    expect(m.print('This is what we {e}')).toBe('This is what we expected');
    expect(m.print('And this is the {diff}')).toBe('And this is the diff');
  })

  test('print functions', () => {
    const m = check(ctx, {name: 'Claudia'}, {name: 'Joyce'});
    expect(m.print(([{name: r}, {name: e}]) => `This is ${r} and this is ${e}`)).toBe('This is Claudia and this is Joyce');
    // expect(m.print(([, {name: e}])
  });
});