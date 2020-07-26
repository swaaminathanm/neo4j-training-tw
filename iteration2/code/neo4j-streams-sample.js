const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "neo")
);

const query =
`MATCH (c:Category {uuid:'f3cfc627-fa24-591a-a583-7060b1fed52f'}) ` +
`CALL example.getVariants({node:c}) YIELD variantUuid ` +
`RETURN variantUuid as variantUuid`;

const logMemory = () => {
  return setInterval(() => {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryUsedInMb = Math.round(used * 100) / 100;

    console.log("Heap Memory", memoryUsedInMb + "MB");
  }, 1000);
};

const withoutStreaming = async () => {
  const session = driver.session();
  const { records } = await session.run(query);
  console.log("Total Records " + records.length);
  await session.close();
};

const withStreaming = async () => {
  let totalRecords = 0;
  const session = driver.session();
  session.run(query).subscribe({
    onNext: (record) => {
      totalRecords++;
    },
    onCompleted: async () => {
      await session.close();
      console.log("Total Records " + totalRecords);
    },
    onError: async (error) => {
      await session.close();
      console.error(error);
    },
  });
};

logMemory();

// withoutStreaming();
withStreaming();
