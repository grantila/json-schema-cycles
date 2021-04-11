import * as traverse from 'json-schema-traverse'
import {
	analyzeGraph,
	analyzeGraphFast,
	sortFullAnalysisResult,
	sortFastAnalysisResult,
	Edge,
	Graph,
	FullAnalysisResult,
	FastAnalysisResult,
} from 'graph-cycles'


function decodeRef( ref: string | undefined )
{
	if ( ref == null )
		return undefined;

	if ( ref.startsWith( "#/definitions/" ) )
		return ref.slice( 14 );

	return undefined;
}

export interface CommonGraphResult
{
	graph: Graph;
}

export interface TypeAnalysisFullResult
	extends FullAnalysisResult, CommonGraphResult
{ }

export interface TypeAnalysisFastResult
	extends FastAnalysisResult, CommonGraphResult
{ }

export function analyzeTypes( schema: traverse.SchemaObject )
: TypeAnalysisFullResult
{
	const graph = getJsonSchemaGraph( schema );

	return { ...analyzeGraph( graph ), graph };
}

export function analyzeTypesFast( schema: traverse.SchemaObject )
: TypeAnalysisFastResult
{
	const graph = getJsonSchemaGraph( schema );

	return { ...analyzeGraphFast( graph ), graph };
}

export function getJsonSchemaGraph( schema: traverse.SchemaObject ): Graph
{
	return Object
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
}

function sortGraph( result: CommonGraphResult ): CommonGraphResult[ 'graph' ]
{
	const { graph } = result;

	return [ ...graph ]
		.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) )
		.map( ( [ from, to ] ): Edge => [ from, [ ...to ].sort( ) ] );
}

export function sortTypeAnalysisFullResult( result: TypeAnalysisFullResult )
: TypeAnalysisFullResult
{
	return {
		...sortFullAnalysisResult( result ),
		graph: sortGraph( result ),
	};
}

export function sortTypeAnalysisFastResult( result: TypeAnalysisFastResult )
: TypeAnalysisFastResult
{
	return {
		...sortFastAnalysisResult( result ),
		graph: sortGraph( result ),
	};
}
