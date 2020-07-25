## Queries

### Creating a node with label Category and adding some properties to it
```
CREATE (technology:Category) SET technology.name = 'Technology', technology.uuid = 'ffd0fb95-cf25-4a0d-9f0e-945a25d52366'
```
The `CREATE` clause creates a node/repationship with given label and properties. The create clause will create a duplicate node if it is already present. 
More about `CREATE` [here](https://neo4j.com/docs/cypher-manual/current/clauses/create/)


### Creating relationships between 2 nodes
```
MATCH (c:Category{uuid:'1'}) WITH c as technology
MATCH (c:Category{uuid:'2'}) WITH c as smartphone, technology
MERGE (technology)-[:HAS]->(smartphone)
````

The `MERGE` clause creates a node/relationship when it doesn't exist in the graph. It’s like a combination of `MATCH` and `CREATE` that additionally allows you to specify what happens if the data was matched or created. More about `MERGE` [here](https://neo4j.com/docs/cypher-manual/current/clauses/merge/)

### Creating a single property index
```
CREATE INDEX INDEX_CATEGORY_UUID
FOR (n:Category)
ON (n.uuid)
```
The above example creates an index named `INDEX_CATEGORY_UUID` on label `Category` for property `uuid`. More about indexes [here](https://neo4j.com/docs/cypher-manual/current/administration/indexes-for-search-performance/)

### Getting all LTE variants for category `Tablet`
1. The query below first finds the category node `Tablet` in db, then traverses from that node to all product nodes, then scans all the `:HAS` relationship between `Product` and `Variant` nodes, then filters the relationships that contains `{type:'LTE'}` relationship property and finally returns the results. 
```
MATCH (tablet:Category{uuid:'ffd0fb95-cf25-4a0d-9f0e-945a25d52367'})-[:HAS]->()-[:HAS{type:'LTE'}]->(v:Variant) RETURN v as variants
```

2. The query below first finds the category node `Tablet` in db, then traverses from that node to all product nodes, then traverses to `Variant` nodes that in connected using `:HAS_TYPE_LTE` and returns the results. **This query performs better than the previous one.**
```
MATCH (tablet:Category{uuid:'ffd0fb95-cf25-4a0d-9f0e-945a25d52367'})-[:HAS]->()-[:HAS_TYPE_LTE]->(v:Variant) RETURN v as variants
```

## Streaming in Neo4j
The Neo4j JS driver supports streaming which helps to stream large data without consuming large amount of memory. The advantage of using streams to run the query is that Neo4j & NodeJS heap memory only contains the data chunk that is currently being streamed rather than the entire data for that query. Neo4j streaming is supported in other languare drivers as well. 
More info about Neo4j streaming [here.](https://neo4j.com/docs/api/javascript-driver/current/class/src/result.js~Result.html#instance-method-subscribe)
