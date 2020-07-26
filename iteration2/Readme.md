## Queries

### Creating a node with label Category and adding some properties to it
```
CREATE (technology:Category) SET technology.name = 'Technology', technology.uuid = 'ffd0fb95-cf25-4a0d-9f0e-945a25d52366'
```
The `CREATE` clause creates a node/relationship with given label and properties. The create clause will create a duplicate node if it is already present. 
More about `CREATE` [here](https://neo4j.com/docs/cypher-manual/current/clauses/create/)


### Creating relationships between 2 nodes
```
MATCH (c:Category{uuid:'1'}) WITH c as technology
MATCH (c:Category{uuid:'2'}) WITH c as smartphone, technology
MERGE (technology)-[:HAS]->(smartphone)
```

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

### Getting all variants of a promotion
1. The query below is slow because it scans all the possible paths from the given `Category` node and then filters `Variant` nodes from that result. This query takes more time to run. Refer to the concept of `VarLengthExpand(All)` [here](https://neo4j.com/docs/cypher-manual/current/execution-plans/operators/#query-plan-varlength-expand-all) for more information. 
```
MATCH (c:Category {uuid:'f3cfc627-fa24-591a-a583-7060b1fed52f'})-[:HAS*]->(variant:Variant) RETURN DISTINCT variant.uuid as variantUuid;
```

2. The query below uses a custom procedure that traverses the graph from the give `Category` node and filters `Variants` nodes on-demand during traversal itself. This is more faster than the previous query. More about user defined procedures [here.](https://neo4j.com/docs/java-reference/current/extending-neo4j/procedures-and-functions/procedures/#:~:text=A%20user%2Ddefined%20procedure%20is,the%20database%2C%20and%20return%20results.)
```
MATCH (c:Category {uuid:'f3cfc627-fa24-591a-a583-7060b1fed52f'}) CALL example.getVariants({node:c}) YIELD variantUuid RETURN variantUuid;
```

### Applying promotion on common variants of two categories (tablet, smartPhone)
1. The query below performs very slow because of the following reasons
    + `MATCH (c:Category{uuid:'ffd0fb95-cf25-4a0d-9f0e-945a25d52367'})-[:HAS*]->(tabletVariant:Variant)` This portion of the query scans all possible paths between the given `Category` node and `Variant` node. Refer to the concept of `VarLengthExpand(All)` [here](https://neo4j.com/docs/cypher-manual/current/execution-plans/operators/#query-plan-varlength-expand-all) for more information. 

    + `exists((tabletVariant)<-[:HAS*]-(smartPhone))` This portion of the query also scans all possible paths between the two defined `Category` and `Variant` nodes. Refer to the concept of `VarLengthExpand(Into)` [here](https://neo4j.com/docs/cypher-manual/current/execution-plans/operators/#query-plan-varlength-expand-into) for more information.  
```
MATCH (c:Category {uuid:'ffd0fb95-cf25-4a0d-9f0e-945a25d52368'}) WITH c as smartPhone 
MATCH (c:Category{uuid:'ffd0fb95-cf25-4a0d-9f0e-945a25d52367'})-[:HAS*]->(tabletVariant:Variant)
WHERE exists((tabletVariant)<-[:HAS*]-(smartPhone)) RETURN tabletVariant.uuid as variantUuid
```

2. The query below is more performant due to the usage  of `procedures`. With this procedure we do the required relatinoship level filtering on-demand during the traversal itself. So we don't have to scan all the possible paths before filtering. More about user defined procedures [here.](https://neo4j.com/docs/java-reference/current/extending-neo4j/procedures-and-functions/procedures/#:~:text=A%20user%2Ddefined%20procedure%20is,the%20database%2C%20and%20return%20results.)
```
MATCH (c:Category {uuid:'ffd0fb95-cf25-4a0d-9f0e-945a25d52368'}) WITH c as smartPhone 
MATCH (c:Category{uuid:'ffd0fb95-cf25-4a0d-9f0e-945a25d52367'}) WITH c as tablet,smartPhone
CALL example.getCommonVariants({node1:tablet,node2:smartPhone}) YIELD variantUuid 
RETURN variantUuid
```

## Streaming in Neo4j
The Neo4j JS driver supports streaming which helps to stream large data without consuming large amount of memory. The advantage of using streams to run the query is that Neo4j & NodeJS heap memory only contains the data chunk that is currently being streamed rather than the entire data for that query. Neo4j streaming is supported in other languages drivers as well. 
More info about Neo4j streaming [here.](https://neo4j.com/docs/api/javascript-driver/current/class/src/result.js~Result.html#instance-method-subscribe)
