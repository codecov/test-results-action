import Coverage from './coverage';

test('test uncovered if', () => {
  const coverageObj = new Coverage();
  expect(coverageObj.uncovered_if()).toEqual(true);
});

test('fully covered', () => {
  const coverageObj = new Coverage();
  expect(coverageObj.fully_covered()).toEqual(false);
});
