import * as path from "path";

import {
	analyzeTypes,
	analyzeTypesFast,
	sortTypeAnalysisFullResult,
	sortTypeAnalysisFastResult,
} from './index'


const fixturePath = path.resolve( __dirname, '..', 'fixtures' );
const largeJson = require( `${fixturePath}/large-json-schema.json` );


function expectEqual< T >( got: T, expected: T )
{
	expect( got ).toStrictEqual( expected );
}

describe( "analyzeTypes", ( ) =>
{
	it( "no definition", ( ) =>
	{
		expectEqual(
			analyzeTypes( { } ),
			{
				entrypoints: [ ],
				cycles: [ ],
				all: [ ],
				dependencies: [ ],
				dependents: [ ],
				graph: [ ],
			}
		);
	} );

	it( "no types", ( ) =>
	{
		expectEqual(
			analyzeTypes( { definitions: { } } ),
			{
				entrypoints: [ ],
				cycles: [ ],
				all: [ ],
				dependencies: [ ],
				dependents: [ ],
				graph: [ ],
			}
		);
	} );

	it( "simple type", ( ) =>
	{
		expectEqual(
			analyzeTypes( { definitions: { User: { } } } ),
			{
				entrypoints: [ ],
				cycles: [ ],
				all: [ ],
				dependencies: [ ],
				dependents: [ ],
				graph: [ [ 'User', [ ] ] ],
			}
		);
	} );

	it( "single recursive type", ( ) =>
	{
		const definitions = {
			User: {
				type: 'object',
				properties: {
					parent: { $ref: '#/definitions/User' },
				},
			},
		};
		expectEqual(
			analyzeTypes( { definitions } ),
			{
				entrypoints: [ ],
				cycles: [ [ 'User' ] ],
				all: [ 'User' ],
				dependencies: [ ],
				dependents: [ ],
				graph: [ [ 'User', [ 'User' ] ] ],
			}
		);
	} );

	it( "complex typings", ( ) =>
	{
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
				Product: { $ref: '#/non-local-dep/Foo' },
				Cart: {
					type: 'array',
					items: { $ref: '#/definitions/Product' },
				},
			}
		};

		expectEqual(
			sortTypeAnalysisFullResult( analyzeTypes( jsonSchema ) ),
			sortTypeAnalysisFullResult( {
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
				dependents: [ ],
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
			} ),
		);
	} );
} );

describe( "analyzeTypesFast", ( ) =>
{
	it( "no definition", ( ) =>
	{
		expectEqual(
			analyzeTypesFast( { } ),
			{
				cyclic: [ ],
				dependencies: [ ],
				dependents: [ ],
				graph: [ ],
			}
		);
	} );

	it( "no types", ( ) =>
	{
		expectEqual(
			analyzeTypesFast( { definitions: { } } ),
			{
				cyclic: [ ],
				dependencies: [ ],
				dependents: [ ],
				graph: [ ],
			}
		);
	} );

	it( "simple type", ( ) =>
	{
		expectEqual(
			analyzeTypesFast( { definitions: { User: { } } } ),
			{
				cyclic: [ ],
				dependencies: [ ],
				dependents: [ ],
				graph: [ [ 'User', [ ] ] ],
			}
		);
	} );

	it( "single recursive type", ( ) =>
	{
		const definitions = {
			User: {
				type: 'object',
				properties: {
					parent: { $ref: '#/definitions/User' },
				},
			},
		};
		expectEqual(
			analyzeTypesFast( { definitions } ),
			{
				cyclic: [ 'User' ],
				dependencies: [ ],
				dependents: [ ],
				graph: [ [ 'User', [ 'User' ] ] ],
			}
		);
	} );

	it( "complex typings", ( ) =>
	{
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
				Product: { $ref: '#/non-local-dep/Foo' },
				Cart: {
					type: 'array',
					items: { $ref: '#/definitions/Product' },
				},
			}
		};

		expectEqual(
			sortTypeAnalysisFastResult( analyzeTypesFast( jsonSchema ) ),
			sortTypeAnalysisFastResult( {
				cyclic: [ 'User', 'Message', 'DM', 'Actions', 'Subscriber' ],
				dependencies: [ "Link" ],
				dependents: [ ],
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
			} ),
		);
	} );
} );

describe( "sortTypeAnalysisFullResult", ( ) =>
{
	it( "should sort properly", ( ) =>
	{
		const sorted = sortTypeAnalysisFullResult( {
			all: [ ],
			cycles: [ ],
			dependencies: [ 'b', 'a' ],
			dependents: [ ],
			entrypoints: [ ],
			graph: [
				[ 'x', [ 'a', 'c', 'b' ] ],
				[ 'f', [ 'g', 'h' ] ],
				[ 'g', [ 'h', 'f', 'g' ] ],
			],
		} );

		expect( sorted ).toStrictEqual( {
			all: [ ],
			cycles: [ ],
			dependencies: [ 'a', 'b' ],
			dependents: [ ],
			entrypoints: [ ],
			graph: [
				[ 'f', [ 'g', 'h' ] ],
				[ 'g', [ 'f', 'g', 'h' ] ],
				[ 'x', [ 'a', 'b', 'c' ] ],
			],
		} );
	} );
} );

describe( "sortTypeAnalysisFastResult", ( ) =>
{
	it( "should sort properly", ( ) =>
	{
		const sorted = sortTypeAnalysisFastResult( {
			cyclic: [ 'b', 'a', 'c' ],
			dependencies: [ 'y', 'x' ],
			dependents: [ 'z', 'w' ],
			graph: [
				[ 'x', [ 'a', 'c', 'b' ] ],
				[ 'f', [ 'g', 'h' ] ],
				[ 'g', [ 'h', 'f', 'g' ] ],
			],
		} );

		expect( sorted ).toStrictEqual( {
			cyclic: [ 'a', 'b', 'c' ],
			dependencies: [ 'x', 'y' ],
			dependents: [ 'w', 'z' ],
			graph: [
				[ 'f', [ 'g', 'h' ] ],
				[ 'g', [ 'f', 'g', 'h' ] ],
				[ 'x', [ 'a', 'b', 'c' ] ],
			],
		} );
	} );
} );

describe( "large input (fast mode)", ( ) =>
{
	it( "should handle really large json schema", ( ) =>
	{
		const { graph, ...analysis } = analyzeTypesFast( largeJson );

		expect( analysis ).toMatchSnapshot( );
	} );
} );
