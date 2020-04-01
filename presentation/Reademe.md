# Queries

1. Create Promotion

```
CREATE (percentOffPromotion:Promotion{id: 'promo_123', name: '50% on all on all Kids items'});
```

2. Create Promotion -> Category Relation

```
MATCH (promotion:Promotion{id:'promo_123'}) 
MATCH (category:Category{name:'Kids'}) 
MERGE (promotion)-[:has]->(category)
```

3. Get all variants of a particular promotion

```
MATCH (:Promotion{id:'promo_123'})-[:has]->(:Category)-[:has]->(:Brand)-[:has]->(:Product)-[:has]->(variant:Variant) 
RETURN variant.name
```

4. Optimized get all variants of a particular promotion with specific relationships having color ivory

```
MATCH (:Promotion{id:'promo_123'})-[:has]->(:Category)-[:has]->(:Brand)-[:has]->(:Product)-[:has_variant_with_color_ivory]->(variant:Variant{color:'ivory'}) 
RETURN variant.name
```