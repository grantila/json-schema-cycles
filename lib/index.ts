import * as traverse from 'json-schema-traverse'
import {
	analyzeGraph,
	sortAnalysisResult,
	Edge,
	Graph,
	AnalysisResult,
} from 'graph-cycles'


function decodeRef( ref: string | undefined )
{
	if ( ref == null )
		return undefined;

	if ( ref.startsWith( "#/definitions/" ) )
		return ref.slice( 14 );

	return undefined;
}

interface TypeAnalysisResult extends AnalysisResult
{
	graph: Graph;
}

export function analyzeTypes( schema: traverse.SchemaObject )
: TypeAnalysisResult
{
	const graph = Object
		.keys( schema.definitions ?? { } )
		.map( ( type ): Edge =>
		{
			const subSchema = schema.definitions[ type ];

			const dependencies = new Set< string >( );

			traverse( subSchema, ( schema: traverse.SchemaObject ) =>
			{
				const ref = decodeRef( schema.$ref );
				if ( ref )
					dependencies.add( ref );
			} );

			return [ type, [ ...dependencies ] ];
		} );

	return { ...analyzeGraph( graph ), graph };
}

export function sortTypeAnalysisResult( result: TypeAnalysisResult )
: TypeAnalysisResult
{
	const { graph } = result;

	const sortedGraph =
		[ ...graph ]
		.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) )
		.map( ( [ from, to ] ): Edge => [ from, [ ...to ].sort( ) ] );

	return {
		...sortAnalysisResult( result ),
		graph: sortedGraph,
	};
}
