import path from 'path';
import test from 'ava';
import helpers from 'yeoman-test';
import assert from 'yeoman-assert';
import pify from 'pify';
import moduleName from './app/module-name';

let generator;

test.beforeEach(async() => {
  await pify(helpers.testDirectory)(path.join(__dirname, 'temp'));
  generator = helpers.createGenerator('node-modules:app', ['../app'], null, {
    skipInstall: true,
  });
});

test.serial('generates expected files', async() => {
  helpers.mockPrompt(generator, {
    moduleName: 'test',
    githubUsername: 'test',
    website: 'test.com',
    transpilation: false,
    cli: false,
  });

  await pify(generator.run.bind(generator))();

  assert.file([
    '.editorconfig',
    '.eslintrc.json',
    '.git',
    '.gitattributes',
    '.gitignore',
    '.travis.yml',
    'index.js',
    'license',
    'package.json',
    'readme.md',
    'test.js',
    '.git',
  ]);

  assert.noFile([
    'cli.js',
    '.babelrc',
  ]);

  assert.noFileContent('package.json', /cli\.js/);
});

test.serial('Transpilation option', async() => {
  helpers.mockPrompt(generator, {
    moduleName: 'test',
    githubUsername: 'test',
    website: 'test.com',
    transpilation: true,
    cli: true,
  });

  await pify(generator.run.bind(generator))();

  assert.file([
    'src/',
    'lib/',
    'src/cli.js',
    'src/index.js',
    '.babelrc',
  ]);

  assert.fileContent('package.json', /"bin": "lib\/cli.js"/);
  assert.fileContent('package.json', /"transpile": "babel src --out-dir lib"/);
  assert.fileContent('package.json', /"start": "node lib\/cli.js/);
});

test.serial('CLI option', async() => {
  helpers.mockPrompt(generator, {
    moduleName: 'test',
    githubUsername: 'test',
    website: 'test.com',
    transpilation: false,
    cli: true,
  });

  await pify(generator.run.bind(generator))();

  assert.file('cli.js');
  assert.fileContent('package.json', /"bin":/);
  assert.fileContent('package.json', /"bin": "cli.js"/);
  assert.fileContent('package.json', /"meow"/);

  assert.noFile([
    'src/',
    'lib/',
    '.babelrc',
  ]);
});

test.serial('nyc option', async() => {
  helpers.mockPrompt(generator, {
    moduleName: 'test',
    githubUsername: 'test',
    website: 'test.com',
    transpilation: false,
    cli: false,
    nyc: true,
    coveralls: false,
  });

  await pify(generator.run.bind(generator))();

  assert.noFile([
    'src/',
    'lib/',
    'cli.js',
    '.babelrc',
  ]);
  assert.fileContent('.gitignore', /\.nyc_output/);
  assert.fileContent('.gitignore', /coverage/);
  assert.fileContent('package.json', /"xo && nyc ava --verbose"/);
  assert.fileContent('package.json', /"nyc": "/);
  assert.noFileContent('package.json', /"coveralls":/);
  assert.noFileContent('package.json', /"lcov"/);
  assert.noFileContent('.travis.yml', /coveralls/);
});

test.serial('coveralls option', async() => {
  helpers.mockPrompt(generator, {
    moduleName: 'test',
    githubUsername: 'test',
    website: 'test.com',
    transpilation: false,
    cli: false,
    nyc: true,
    coveralls: true,
  });

  await pify(generator.run.bind(generator))();

  assert.noFile([
    'src/',
    'lib/',
    'cli.js',
    '.babelrc',
  ]);
  assert.fileContent('.gitignore', /\.nyc_output/);
  assert.fileContent('.gitignore', /coverage/);
  assert.fileContent('package.json', /"xo && nyc ava --verbose"/);
  assert.fileContent('package.json', /"nyc": "/);
  assert.fileContent('package.json', /"coveralls":/);
  assert.fileContent('package.json', /"lcov"/);
  assert.fileContent('.travis.yml', /coveralls/);
});

test('parse scoped package names', (t) => {
  t.is(moduleName.slugify('author/thing'), 'author-thing', 'slugify non-scoped packages');
  t.is(moduleName.slugify('@author/thing'), '@author/thing', 'accept scoped packages');
  t.is(moduleName.slugify('@author/hi/there'),
    'author-hi-there', 'fall back to regular slugify if invalid scoped name');
});

test.serial('prompts for description', async() => {
  helpers.mockPrompt(generator, {
    moduleName: 'test',
    moduleDescription: 'foo',
    githubUsername: 'test',
    website: 'test.com',
    transpilation: false,
    cli: false,
    nyc: true,
    coveralls: true,
  });

  await pify(generator.run.bind(generator))();

  assert.fileContent('package.json', /"description": "foo",/);
  assert.fileContent('readme.md', /> foo/);
});

test.serial('defaults to superb description', async() => {
  helpers.mockPrompt(generator, {
    moduleName: 'test',
    githubUsername: 'test',
    website: 'test.com',
    transpilation: false,
    cli: false,
    nyc: true,
    coveralls: true,
  });

  await pify(generator.run.bind(generator))();

  assert.fileContent('package.json', /"description": "My .+ module",/);
  assert.fileContent('readme.md', /> My .+ module/);
});
