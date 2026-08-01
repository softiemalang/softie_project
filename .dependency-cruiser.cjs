module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Report circular JavaScript module dependencies without blocking the build.',
      severity: 'warn',
      from: {
        path: '^(src|scripts|tools|test)/',
      },
      to: {
        circular: true,
      },
    },
    {
      name: 'not-to-unresolvable',
      comment: 'Report imports dependency-cruiser cannot resolve.',
      severity: 'warn',
      from: {
        path: '^(src|scripts|tools|test)/',
      },
      to: {
        couldNotResolve: true,
      },
    },
    {
      name: 'no-non-package-json',
      comment: 'Report npm dependencies that are not declared in package.json.',
      severity: 'warn',
      from: {
        path: '^(src|scripts|tools|test)/',
      },
      to: {
        dependencyTypes: [
          'unknown',
          'undetermined',
          'npm-no-pkg',
          'npm-unknown',
        ],
      },
    },
    {
      name: 'no-src-to-test',
      comment: 'Report dependencies from production source files to test files.',
      severity: 'warn',
      from: {
        path: '^src/',
      },
      to: {
        path: '^test/',
      },
    },
    {
      name: 'no-orphans',
      comment: 'List modules without incoming or outgoing JavaScript dependencies for manual triage.',
      severity: 'info',
      from: {
        path: '^(src|scripts|tools|test)/',
        orphan: true,
      },
      to: {},
    },
  ],
  options: {
    includeOnly: '^(src|scripts|tools|test)/',
    exclude: {
      path: '(^|/)(node_modules|dist|build|coverage|artifacts|\\.git)(/|$)',
    },
    doNotFollow: {
      dependencyTypes: [
        'npm',
        'npm-dev',
        'npm-optional',
        'npm-peer',
        'npm-bundled',
      ],
    },
  },
}
