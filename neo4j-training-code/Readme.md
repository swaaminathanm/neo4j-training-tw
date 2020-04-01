# Setup
1. Do npm install (to install dependencies)
2. Create dump folder in the root of your project
3. node index.js (to run the application)

# Queries
**Create Promotion on Entity**
```
MATCH(promotion:Promotion{id:'9bbbf713-0d06-4e30-af4a-5e59206fa58b'}) 
WITH promotion 
MATCH(category:Category{name:'Kids'}) 
MERGE(promotion)-[:has]->(category)
```

**Give the count of entities to which the Promotion was applied to**
```
MATCH path=(:Promotion{id:'9bbbf713-0d06-4e30-af4a-5e59206fa58b'})-[:has*]->() 
RETURN count(*)
```

**Return all the variants of a Promotion with a particular color (slower version)**
```
MATCH (:Promotion{id:'9bbbf713-0d06-4e30-af4a-5e59206fa58b'})-[:has*]->(variant:Variant{color:'red'}) 
RETURN variant.name
```

**Return all the variants of a Promotion with a particular color (faster version)**
```
MATCH (:Promotion{id:'9bbbf713-0d06-4e30-af4a-5e59206fa58b'})-[:has*]->(product:Product) WITH product MATCH (product)-[:has_variant_with_color_red]->(variant:Variant) 
RETURN variant.name
```

# Observations
Data Ingestion specifications
```
Total nodes inserted: 800509
Total relationships: 1300534
```

For promotion - 50% off on all items in Kids Category on only red items
```
Total count of affected items: 1072
Time Taken to query all the items(with :has relationship): 108ms
Time Taken to query all the items(with :has_variant_with_color_red relationship): 116ms
```

For promotion - 10% on all the items in blue
```
Total count of affected items: 16070
Time Taken to query all the items(with :has relationship): 4619ms
Time Taken to query all the items(with :has_variant_with_color_blue relationship): 1431ms
```

# Useful Links
Neo4j Architecture
+ https://www.youtube.com/watch?v=oALqiXDAYhc&feature=youtu.be

Match Query Optimizations
+ https://stackoverflow.com/questions/33352673/why-does-neo4j-warn-this-query-builds-a-cartesian-product-between-disconnected

Indexes
+ https://neo4j.com/docs/cypher-manual/current/administration/indexes-for-search-performance/

