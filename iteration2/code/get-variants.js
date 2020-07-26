const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "neo")
);

const queryWithoutProcedures =
  `MATCH (c:Category {uuid:'f3cfc627-fa24-591a-a583-7060b1fed52f'})-[:HAS*]->(variant:Variant)` +
  `RETURN DISTINCT variant.uuid as variantUuid`;

const queryWithProcedures =
  `MATCH (c:Category {uuid:'f3cfc627-fa24-591a-a583-7060b1fed52f'}) ` +
  `CALL example.getVariants({node:c}) YIELD variantUuid ` +
  `RETURN variantUuid`;

const getVariants = async (query) => {
  const startTime = new Date().getTime();

  const session = driver.session();

  const { records } = await session.run(query);
  await session.close();

  console.log("Total Records " + records.length);
  const endTime = new Date().getTime() - startTime;
  console.log("Total time: " + endTime / 1000 + " seconds");
};

getVariants(queryWithProcedures);
// getVariants(queryWithoutProcedures);
