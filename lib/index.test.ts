import { analyzeTypes, sortTypeAnalysisResult } from './index'


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
			sortTypeAnalysisResult( analyzeTypes( jsonSchema ) ),
			sortTypeAnalysisResult( {
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
			} ),
		);
	} );
} );

describe( "sortTypeAnalysisResult", ( ) =>
{
	it( "should sort properly", ( ) =>
	{
		const sorted = sortTypeAnalysisResult( {
			all: [ ],
			cycles: [ ],
			dependencies: [ 'b', 'a' ],
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
			entrypoints: [ ],
			graph: [
				[ 'f', [ 'g', 'h' ] ],
				[ 'g', [ 'f', 'g', 'h' ] ],
				[ 'x', [ 'a', 'b', 'c' ] ],
			],
		} );
	} );
} );
