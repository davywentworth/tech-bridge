import { describe, it, expect } from 'vitest';
import { parsePackages } from './executor.js';

describe('parsePackages', () => {
  it('returns an empty list when there are no imports', () => {
    const code = `const x = 1;\nconsole.log(x);`;
    expect(parsePackages(code)).toEqual([]);
  });

  it('returns an empty list for an empty string', () => {
    expect(parsePackages('')).toEqual([]);
  });

  it('extracts a single third-party package from an import statement', () => {
    const code = `import express from 'express';`;
    expect(parsePackages(code)).toEqual(['express']);
  });

  it('extracts multiple packages from multiple import statements', () => {
    const code = `
import express from 'express';
import { z } from 'zod';
    `;
    expect(parsePackages(code)).toEqual(['express', 'zod']);
  });

  it('extracts scoped packages (e.g. @reduxjs/toolkit) as a single entry', () => {
    const code = `import { configureStore } from '@reduxjs/toolkit';`;
    expect(parsePackages(code)).toEqual(['@reduxjs/toolkit']);
  });

  it('strips the subpath from a scoped package and returns only the scope/name', () => {
    const code = `import { something } from '@reduxjs/toolkit/query/react';`;
    expect(parsePackages(code)).toEqual(['@reduxjs/toolkit']);
  });

  it('ignores relative imports', () => {
    const code = `import { foo } from './foo.js';`;
    expect(parsePackages(code)).toEqual([]);
  });

  it('ignores absolute path imports', () => {
    const code = `import { foo } from '/some/absolute/path';`;
    expect(parsePackages(code)).toEqual([]);
  });

  it('ignores side-effect imports with no `from` clause', () => {
    const code = `import 'express';`;
    expect(parsePackages(code)).toEqual([]);
  });

  it('deduplicates packages imported more than once', () => {
    const code = `
import { Router } from 'express';
import express from 'express';
    `;
    expect(parsePackages(code)).toEqual(['express']);
  });

  it('strips the subpath from a non-scoped package and returns only the root package name', () => {
    const code = `import { something } from 'lodash/merge';`;
    expect(parsePackages(code)).toEqual(['lodash']);
  });

  it('handles type-only imports', () => {
    const code = `import type { Foo } from 'some-package';`;
    expect(parsePackages(code)).toEqual(['some-package']);
  });

  it('does not match imports that are indented (only top-level imports are detected)', () => {
    const code = `
function setup() {
  import express from 'express';
}
    `;
    expect(parsePackages(code)).toEqual([]);
  });

  it('does not match multi-line import statements (only single-line imports are detected)', () => {
    const code = `
import {
  something
} from 'lodash';
    `;
    expect(parsePackages(code)).toEqual([]);
  });
});
