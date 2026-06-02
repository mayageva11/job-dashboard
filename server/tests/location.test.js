const { isIsraeliJob } = require('../location');

describe('isIsraeliJob', () => {
  test.each([
    ['Tel Aviv, Israel', true],
    ['Tel Aviv-Yafo, Tel Aviv District, Israel', true],
    ['Ramat Gan, Tel Aviv District, Israel', true],
    ['Petah Tikva, Center District, Israel', true],
    ['Herzliya, Tel Aviv District, Israel', true],
    ['Haifa, Haifa District, Israel', true],
    ['Jerusalem, Jerusalem District, Israel', true],
    ['Netanya, Center District, Israel', true],
    ['Rishon LeZion, Center District, Israel', true],
    ['Rehovot, Center District, Israel', true],
    ['Center District, Israel', true],
    ['Israel', true],
  ])('%s → true', (location, expected) => {
    expect(isIsraeliJob(location)).toBe(expected);
  });

  test.each([
    ['London, UK', false],
    ['New York, NY, US', false],
    ['Remote', false],
    ['Berlin, Germany', false],
    ['', false],
    [null, false],
    [undefined, false],
  ])('%s → false', (location, expected) => {
    expect(isIsraeliJob(location)).toBe(expected);
  });
});
