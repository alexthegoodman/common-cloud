/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  var describe: typeof import('jest').describe;
  var test: typeof import('jest').test;
  var it: typeof import('jest').it;
  var expect: typeof import('jest').expect;
  var beforeEach: typeof import('jest').beforeEach;
  var afterEach: typeof import('jest').afterEach;
  var beforeAll: typeof import('jest').beforeAll;
  var afterAll: typeof import('jest').afterAll;
}

export {};