const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "neo")
);

const queryWithoutProcedures =
  `MATCH (c1:Category {uuid:'f3cfc627-fa24-591a-a583-7060b1fed52f'}) WITH c1 as category ` +
  `MATCH (c2:Category{uuid:'bcf62239-31e6-5492-992c-b1aae5a24f08'})-[:HAS*]->(variant:Variant) ` +
  `WHERE exists((variant)<-[:HAS*]-(category)) RETURN variant.uuid as variantUuid`;

const queryWithProcedures =
  `MATCH (c1:Category {uuid:'f3cfc627-fa24-591a-a583-7060b1fed52f'}) WITH c1 as cat1 ` +
  `MATCH (c2:Category{uuid:'bcf62239-31e6-5492-992c-b1aae5a24f08'}) WITH c2 as cat2,cat1 ` +
  `CALL example.getCommonVariants({node1:cat1,node2:cat2}) YIELD variantUuid ` +
  `RETURN variantUuid`;

const getCommonVariants = async (query) => {
  const startTime = new Date().getTime();
  let totalRecords = 0;
  const session = driver.session();
  session.run(query).subscribe({
    onNext: (record) => {
      totalRecords++;
    },
    onCompleted: async () => {
      await session.close();
      console.log("Total Records " + totalRecords);
      const endTime = new Date().getTime() - startTime;
      console.log("Total time: " + endTime / 1000 + " seconds");
    },
    onError: async (error) => {
      await session.close();
      console.error(error);
    },
  });
};

// getCommonVariants(queryWithProcedures);
getCommonVariants(queryWithoutProcedures);
