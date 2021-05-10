import test from 'ava'
import * as fs from 'fs'
import { resolve } from 'path'
import * as ts from 'typescript'

import { createSpec } from './utils'
import { Options, createTransformer } from '../src'

const suites: { title: string, config: Options | Options[] }[] = [
  {
    title: 'should be able to compile with less config: ',
    config: { style: true }
  },
  {
    title: 'should be able to compile with css config',
    config: { style: 'css' },
  },
  {
    title: 'should be able to compile with css.web config',
    config: { style: 'css.web' },
  },
  {
    title: 'should be able to compile with custom style path generator config',
    config: { style: (path) => `${path}/style/index.styl` },
  },
  {
    title: 'should be able to compile with custom style path generator ignore confing',
    config: {
      style: (path) => {
        if (path === 'antd/lib/alert') {
          return false
        }
        return `${path}/style/index.styl`
      },
    }
  },
  {
    title: 'should be able to compile without style config',
    config: undefined,
  },
  {
    title: 'should be able to compile lodash',
    config: {
      style: false,
      libraryName: 'lodash',
      libraryDirectory: null,
      camel2DashComponentName: false
    },
  },
  {
    title: 'should be able to compile with camel2UnderlineComponentName config',
    config: { style: false, camel2UnderlineComponentName: true },
  },
  {
    title: 'should be able to compile with custom libraryDirectory resolver config',
    config: {
      libraryDirectory: importName => {
        const stringVec = importName.split(/([A-Z][a-z]+|[0-9]*)/)
          .filter(s => s.length)
          .map(s => s.toLocaleLowerCase())

        return stringVec
          .reduce((acc, cur, index) => {
            if (index > 1) {
              return acc + '-' + cur
            } else if (index === 1) {
              return acc + '/' + cur
            }
            return acc + cur
          }, '')
      },
      libraryName: 'material-ui/svg-icons',
      style: false,
      camel2DashComponentName: false
    }
  },
  {
    title: 'should be able to compile with an array of options',
    config: [
      {
      style: false,
      libraryName: 'lodash',
      libraryDirectory: null,
      camel2DashComponentName: false
    }, {
      style: false,
      libraryName: 'material-ui',
      libraryDirectory: '',
      camel2DashComponentName: false
    }
    ]
  },
  {
    title: 'should be able to override the library reference entirely',
    config: [
      {
        style: false,
        libraryName: 'lodash',
        libraryDirectory: (importName) => {
          return `lodash-es/${importName}`
        },
        libraryOverride: true
      }
    ]
  }
]

for (const suite of suites) {
  createSpec(suite.title, suite.config)
}

test('should throw if custom style resolver thrown', (t) => {
  const sourceCode = fs.readFileSync(resolve(__dirname, 'fixtures', 'index.tsx'), 'utf-8')

  const source = ts.createSourceFile('index.tsx', sourceCode, ts.ScriptTarget.ESNext, true)

  const error = new TypeError('Error happend')

  const transformer = createTransformer({
    style: () => {
      throw error
    }
  })

  const transpile = () => ts.transform(source, [transformer])
  t.throws(transpile, {
    message: error.message
  })
})

test('should throw if Component path is not found and failIfNotFound is true', (t) => {
  const sourceCode = fs.readFileSync(resolve(__dirname, 'fixtures', 'component-not-found', 'index.ts'), 'utf-8')

  const source = ts.createSourceFile('index.tsx', sourceCode, ts.ScriptTarget.ESNext, true)

  const transformer = createTransformer({
    libraryName: 'react',
    failIfNotFound: true
  })

  const transpile = () => ts.transform(source, [transformer])
  t.throws(transpile, {
    message: 'Can not find component for library: react in react/lib/component'
  });
})
