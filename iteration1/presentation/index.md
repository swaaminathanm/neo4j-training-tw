---
theme: gaia
_class: lead
paginate: true
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.jpg')
marp: true
---

# **Introduction to Graph Databases**

by Swami M

---

# Agenda

+ Why Graph Databases?
+ neo4j
+ Demo
+ Optimization

---

# What is a Database?

+ Organize data for easy access

---

# Types of Databases

+ SQL Databases (MySQL, PostgresSQL, Google CloudSQL etc...)
+ NoSQL Datbases (MongoDb, Google Datastore etc...)
+ Graph Databases (Neo4j, ArangoDB)

---


<!-- _class: lead -->

# Let's design database for an ecommerce application (promotions domain)

---

# Specifications (promotions domain)

1. Business should be able to create Promotions on their inventory
2. Consumers should know the list of applicable SKUs/Variants for a given Promotion

*SKU - Stock Keeping Unit*

---

# Inventory Specification

+ Merchant: Single Business
+ Category: Mobile Phones, Electronics etc...
+ Brand: Apple, LG etc...
+ Product: iPhone, LG OLED TV etc...
+ Variant: iPhone 65 GB Space Grey, LG Smart OLED 4K 65B9PUA 

---

<!-- _class: lead -->

# Whiteboard View of the Problem

[flow diagram](./whiteboard-view.png)

---

<!-- _class: lead -->

# Will SQL Databases work well?

[Schema](./sql-schema.png)

---

<!-- _class: lead -->

# How about NOSQL Databases?
[Schema](./nosql-schema.png)

---

<!-- _class: lead -->

# Finally...

---

<!-- _class: lead -->

# **Introduction to Graph Databases :)**

---

# Why would Graph Databases work?

+ Relationships are first-class citizens
+ Closely represent whiteboard models
+ Cheap Traversals

---

<!-- _class: lead -->

# **The Cypher Query Language**

---

<!-- _class: lead -->

# Let's create a simple graph using Cypher queries

[model](./sample-graph.png)

---

# CREATE Clause

```
CREATE (appleBrand:Brand{id:'apple_123', name:'Apple'}) RETURN appleBrand;
```

---

# Relationships

```
MATCH (appleBrand:Brand{id:'apple_123'})
MATCH (iphoneVariant:Variant{id:'variant_123'})
CREATE (appleBrand)-[:has_variant]->(iphoneVariant);
```

---

<!-- _class: lead -->

# Demo

---

<!-- _class: lead -->

# Optimizations

[how neo4j works](./optimization_sample_graph.png)

---

# Further Reading

+ Indexes in Neo4j [click here](https://neo4j.com/docs/cypher-manual/current/administration/indexes-for-search-performance/)
+ Match Query Optimizations [click here](https://stackoverflow.com/questions/33352673/why-does-neo4j-warn-this-query-builds-a-cartesian-product-between-disconnected)
+ Neo4j Architecture [click here](https://www.youtube.com/watch?v=oALqiXDAYhc&feature=youtu.be)

---

<!-- _class: lead -->

# Thank you for your time
:)

---

<!-- _class: lead -->

# Questions?

---