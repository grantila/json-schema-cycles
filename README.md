[![npm version][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]
[![build status][build-image]][build-url]
[![coverage status][coverage-image]][coverage-url]
[![Language grade: JavaScript][lgtm-image]][lgtm-url]
[![Node.JS version][node-version]][node-url]


# json-schema-cycles

Detect cyclic dependencies in a JSON schema (or more precisely a JSON schema with the `definitions` property for the individual type definitions). This package doesn't handle external references, you need to use a ref-parser and squash all types into one schema before using this package.


## Example

`json-schema-cycles` exports a function `analyzeTypes` which takes a JSON schema object and returns a result object on the same format as [`AnalysisResult` in graph-cycles](https://github.com/grantila/graph-cycles#example) but with an additional `graph` property containing the type dependency graph as an array of `[ from: string, to: Array< string > ]` where `from` is the type and `to` is the dependent types.

```ts
import { analyzeTypes } from 'json-schema-cycles'

const { cycles, entrypoints, dependencies, all, graph } = analyzeTypes( schemaObject );
```

Check [graph-cycles](https://github.com/grantila/graph-cycles) for an understanding of the result object, apart from `graph`.

<details style="padding-left: 32px; border-left: 4px solid gray;">
<summary>Given the following JSON Schema:</summary>
<p>

```ts
const jsonSchema = {
    definitions: {
        Link: {}, // Non-cyclic but dependency of Message
        Subscriber: {
            type: 'object',
            properties: {
                user: { $ref: '#/definitions/User' },
            },
        },
        Message: {
            type: 'object',
            properties: {
                replyTo: { $ref: '#/definitions/Message' },
                link: { $ref: '#/definitions/Link' },
                subscriber: { $ref: '#/definitions/Subscriber' },
            },
        },
        User: {
            type: 'object',
            properties: {
                parent: { $ref: '#/definitions/User' },
                lastMessage: { $ref: '#/definitions/Message' },
            },
        },
        DM: {
            type: 'object',
            properties: {
                lastUser: { $ref: '#/definitions/User' },
            },
        },
        Actions: {
            type: 'object',
            properties: {
                dms: {
                    type: 'array',
                    items: { $ref: '#/definitions/DM' },
                },
            },
        },
        // Has dependencies, but nothing cyclic
        Product: {},
        Cart: {
            type: 'array',
            items: { $ref: '#/definitions/Product' },
        },
    }
};
```

</p>
</details>

the analysis will be:

```ts
{
    entrypoints: [
        [ "DM" ],
        [ "Actions", "DM" ],
    ],
    cycles: [
        [ 'User' ],
        [ 'Message' ],
        [ 'User', 'Message', 'Subscriber' ],
    ],
    all: [ 'User', 'Message', 'DM', 'Actions', 'Subscriber' ],
    dependencies: [ "Link" ],
    graph: [
        [ 'Link', [ ] ],
        [ 'Subscriber', [ 'User' ] ],
        [ 'Message', [ 'Message', 'Link', 'Subscriber' ] ],
        [ 'User', [ 'Message', 'User' ] ],
        [ 'DM', [ 'User' ] ],
        [ 'Actions', [ 'DM' ] ],
        [ 'Product', [ ] ],
        [ 'Cart', [ 'Product' ] ],
    ],
}
```


## Helper

Another function `sortTypeAnalysisResult` is exported, which takes an analysis result (of type `TypeAnalysisResult`) and returns new object of the same type, with all fields sorted in a deterministic way, which is useful in tests.



[npm-image]: https://img.shields.io/npm/v/json-schema-cycles.svg
[npm-url]: https://npmjs.org/package/json-schema-cycles
[downloads-image]: https://img.shields.io/npm/dm/json-schema-cycles.svg
[build-image]: https://img.shields.io/github/workflow/status/grantila/json-schema-cycles/Master.svg
[build-url]: https://github.com/grantila/json-schema-cycles/actions?query=workflow%3AMaster
[coverage-image]: https://coveralls.io/repos/github/grantila/json-schema-cycles/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/grantila/json-schema-cycles?branch=master
[lgtm-image]: https://img.shields.io/lgtm/grade/javascript/g/grantila/json-schema-cycles.svg?logo=lgtm&logoWidth=18
[lgtm-url]: https://lgtm.com/projects/g/grantila/json-schema-cycles/context:javascript
[node-version]: https://img.shields.io/node/v/json-schema-cycles
[node-url]: https://nodejs.org/en/
