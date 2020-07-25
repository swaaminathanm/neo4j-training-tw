const uuid = require('uuid');
const faker = require('faker');
const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');
const readline = require('readline');

// --------------------------------------
// Utility functions
// --------------------------------------

const emptyDirectory = (directory) => {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    fs.unlinkSync(path.join(directory, file));
  }
};

const readLine = async (path, cb) => {
  let linesInserted = 0;
  const fileStream = fs.createReadStream(path);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    await cb(line);
    linesInserted++;
  }

  return linesInserted;
};

// ----------------------------------------

// --------------------------------------
// Data Ingestion - These functions create
// entity JSONs and insert into <entity>.json
// files respectively
// --------------------------------------

const DUMP_DIRECTORY = 'dump';
const MERCHANTS_COUNT = 1;
const CATEGORIES_PER_MERCHANT = 500;
const BRANDS_PER_CATEGORY = 100;
const PRODUCTS_PER_BRAND = 5;
const VARIANTS_PER_PRODUCT = 2;

const merchantsDI = () => {
  const dataToStoreInFile = [];

  for (let i = 0; i < MERCHANTS_COUNT; i++) {
    dataToStoreInFile.push({
      id: `merchant_${uuid.v4()}`,
      name: faker.company.companyName()
    })
  }

  writeToFile(dataToStoreInFile, 'dump/merchants.txt')

  return dataToStoreInFile;
};

const categoriesDI = (merchants) => {
  const dataToStoreInFile = [];

  for (let i = 0; i < merchants.length; i++) {
    const merchant = merchants[i];

    for (let j = 0; j < CATEGORIES_PER_MERCHANT; j++) {
      const category = {
        id: `category_${uuid.v4()}`,
        merchantId: merchant.id,
        name: faker.commerce.department()
      };

      dataToStoreInFile.push(category)
    }
  }

  writeToFile(dataToStoreInFile, 'dump/categories.txt');

  return dataToStoreInFile;
};

const brandsDI = (categories) => {
  const dataToStoreInFile = [];

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];

    for (let j = 0; j < BRANDS_PER_CATEGORY; j++) {
      const brand = {
        id: `brand_${uuid.v4()}`,
        categoryId: category.id,
        name: faker.commerce.productAdjective()
      };

      dataToStoreInFile.push(brand)
    }
  }

  writeToFile(dataToStoreInFile, 'dump/brands.txt');

  return dataToStoreInFile;
};

const productsDI = (brands) => {
  const dataToStoreInFile = [];

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];

    for (let j = 0; j < PRODUCTS_PER_BRAND; j++) {
      const product = {
        id: `product_${uuid.v4()}`,
        brandId: brand.id,
        name: faker.commerce.productName()
      };

      dataToStoreInFile.push(product)
    }
  }

  writeToFile(dataToStoreInFile, 'dump/products.txt');

  return dataToStoreInFile;
};

const variantsDI = (products) => {
  const dataToStoreInFile = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    for (let j = 0; j < VARIANTS_PER_PRODUCT; j++) {
      const variant = {
        id: `variant_${uuid.v4()}`,
        productId: product.id,
        name: faker.random.number(),
        color: faker.commerce.color()
      };

      dataToStoreInFile.push(variant)
    }
  }

  writeToFile(dataToStoreInFile, 'dump/variants.txt');

  return dataToStoreInFile;
};

const writeToFile = (data, filePath) => {
  data.forEach((d) => {
    fs.appendFileSync(filePath, JSON.stringify(d));
    fs.appendFileSync(filePath, '\n');
  })
};

// ----------------------------------------

// --------------------------------------
// Insert into Neo4j - These functions create
// nodes and relationships in Neo4j
// --------------------------------------

const insertMerchants = (dbDriver) => {
  return readLine('dump/merchants.txt', async (line) => {
    const merchant = JSON.parse(line);
    const dbSession = dbDriver.session();

    try {
      await dbSession.run(createNodeQuery(merchant, 'Merchant'));
      console.log('Inserted merchant ' + merchant.id);
      await dbSession.close();
      return {result: true, error: null}
    } catch (error) {
      return {result: false, error}
    }
  })
};

const insertCategories = (dbDriver) => {
  return readLine('dump/categories.txt', async (line) => {
    const category = JSON.parse(line);
    const id = category.id;
    const merchantId = category.merchantId;

    let dbSession = dbDriver.session();
    await dbSession.run(createNodeQuery(category, 'Category'));
    console.log('Inserted category ' + category.id);
    await dbSession.close();

    dbSession = dbDriver.session();
    await dbSession.run(createRelationshipQuery({id: merchantId}, {id}, 'Merchant', 'Category'));
    console.log('Created merchant->category relationship for ' + category.id);
    await dbSession.close();
  })
};

const insertBrands = (dbDriver) => {
  return readLine('dump/brands.txt', async (line) => {
    const brand = JSON.parse(line);
    const id = brand.id;
    const categoryId = brand.categoryId;

    let dbSession = dbDriver.session();
    await dbSession.run(createNodeQuery(brand, 'Brand'));
    console.log('Inserted brand ' + brand.id);
    await dbSession.close();

    dbSession = dbDriver.session();
    await dbSession.run(createRelationshipQuery({id: categoryId}, {id}, 'Category', 'Brand'));
    console.log('Created category->brand relationship for ' + brand.id);
    await dbSession.close();
  })
};

const insertProducts = (dbDriver) => {
  return readLine('dump/products.txt', async (line) => {
    const product = JSON.parse(line);
    const dbSession = dbDriver.session();

    await dbSession.run(createNodeQuery(product, 'Product'));
    console.log('Inserted product ' + product.id);
    await dbSession.close();
  })
};

const insertBrandProductRelationship = (dbDriver) => {
  return readLine('dump/products.txt', async (line) => {
    const product = JSON.parse(line);
    const id = product.id;
    const brandId = product.brandId;
    const dbSession = dbDriver.session();

    await dbSession.run(createRelationshipQuery({id: brandId}, {id}, 'Brand', 'Product'));
    console.log('Created brand->product relationship for ' + product.id);
    await dbSession.close();
  })
};

const insertVariants = (dbDriver) => {
  return readLine('dump/variants.txt', async (line) => {
    const variant = JSON.parse(line);
    const dbSession = dbDriver.session();

    await dbSession.run(createNodeQuery(variant, 'Variant'));
    console.log('Inserted variant ' + variant.id);
    await dbSession.close();
  })
};

const insertProductVariantRelationshipV1 = (dbDriver) => {
  return readLine('dump/variants.txt', async (line) => {
    const variant = JSON.parse(line);
    const id = variant.id;
    const productId = variant.productId;
    const dbSession = dbDriver.session();

    await dbSession.run(createRelationshipQuery({id: productId}, {id}, 'Product', 'Variant'));
    console.log('Created product->variant relationship for ' + variant.id);
    await dbSession.close();
  })
};

const insertProductVariantRelationshipV2 = (dbDriver) => {
  return readLine('dump/variants.txt', async (line) => {
    const variant = JSON.parse(line);
    const id = variant.id;
    const color = variant.color;
    const productId = variant.productId;
    const dbSession = dbDriver.session();

    await dbSession.run(createProductVariantRelationshipQuery(productId, id, color));
    console.log('Created product->variant relationship for ' + variant.id);
    await dbSession.close();
  })
};

const insertPromotionNode = async (dbDriver, promotionId, promotionMetaData, applyToEntityLabel, query) => {
  let dbSession = dbDriver.session();

  await dbSession.run(createNodeQuery({...promotionMetaData, id: promotionId}, 'Promotion'));
  console.log(`Created promotion node ${promotionId}`);
  await dbSession.close();

  const entityAlias = applyToEntityLabel.toLowerCase();

  const matchQuery = `MATCH(promotion:Promotion{id:'${promotionId}'}) WITH promotion MATCH(${entityAlias}:${applyToEntityLabel}{${Object.entries(query).map(entry => `${entry[0]}:'${entry[1]}'`).join(",")}})`;
  const relationshipQuery = `MERGE(promotion)-[:has]->(${entityAlias})`;

  const createRelationshipQuery = `${matchQuery} ${relationshipQuery}`;

  dbSession = dbDriver.session();

  await dbSession.run(createRelationshipQuery);
  console.log(`Created promotion->${entityAlias} relationship`);
  await dbSession.close();
};

const createNodeQuery = (payload, label) => {
  return `MERGE(:${label}{${Object.entries(payload).map(entry => `${entry[0]}:'${entry[1]}'`).join(",")}})`
};

const createRelationshipQuery = (parentQuery, childQuery, parentLabel, childLabel) => {
  const parentAlias = parentLabel.toLowerCase();
  const childAlias = childLabel.toLowerCase();

  const matchQuery = `MATCH(${parentAlias}:${parentLabel}{${Object.entries(parentQuery).map(entry => `${entry[0]}:'${entry[1]}'`).join(",")}}) WITH ${parentAlias} MATCH (${childAlias}:${childLabel}{${Object.entries(childQuery).map(entry => `${entry[0]}:'${entry[1]}'`).join(",")}})`;
  const relationshipQuery = `MERGE(${parentAlias})-[:has]->(${childAlias})`;

  return `${matchQuery} ${relationshipQuery}`;
};

const createProductVariantRelationshipQuery = (productId, variantId, variantColor) => {
  const matchQuery = `MATCH(product:Product{id:'${productId}'}) WITH product MATCH (variant:Variant{id:'${variantId}'})`;
  const relationshipQuery = `MERGE(product)-[:has_variant_with_color_${variantColor.replace(/ /g, "_")}]->(variant)`;

  return `${matchQuery} ${relationshipQuery}`;
};

// ----------------------------------------

const doDIToFile = () => {
  if (!fs.existsSync(DUMP_DIRECTORY)){
    fs.mkdirSync(DUMP_DIRECTORY);
  }

  emptyDirectory(DUMP_DIRECTORY);
  console.log(`Cleared ${DUMP_DIRECTORY}`);

  const merchants = merchantsDI();
  console.log('Data loaded for merchants');

  const categories = categoriesDI(merchants);
  console.log('Data loaded for categories');

  const brands = brandsDI(categories);
  console.log('Data loaded for brands');

  const products = productsDI(brands);
  console.log('Data loaded for products');

  const variants = variantsDI(products);
  console.log('Data loaded for variants');

  console.log('Data loaded to all files');
};

const createPromotion = async (dbDriver) => {
  const promotion = {
    id: uuid.v4(),
    name: '10% on all the items in blue'
  };
  await insertPromotionNode(dbDriver, promotion.id, promotion, 'Merchant', {id:'merchant_6a957f73-b867-4ec1-a6aa-4b84733b49ec'})
};

const findAllVariantsOfPromotionSlowerVersion = async (dbDriver, promotionId, variantColor) => {
  const startTime = new Date();

  const query = `MATCH (:Promotion{id:'${promotionId}'})-[:has*]->(variant:Variant{color:'${variantColor}'}) RETURN variant.name as variantName`;

  const dbSession = dbDriver.session();

  const response = await dbSession.run(query);
  const variantNames = [];

  response.records.forEach(record => {
    const variantName = record.get("variantName");
    variantNames.push(variantName);
  });

  console.log('Result count for variant names ' + variantNames.length);

  await dbSession.close();

  const endTime = new Date();
  const timeTaken = Math.abs(endTime.getTime() - startTime.getTime());

  console.log(`Time taken to execute findAllVariantsOfPromotionSlowerVersion function ${timeTaken}ms`);
};

const findAllVariantsOfPromotionFasterVersion = async (dbDriver, promotionId, variantColor) => {
  const startTime = new Date();

  const query = `MATCH (:Promotion{id:'${promotionId}'})-[:has*]->(product:Product) WITH product MATCH (product)-[:has_variant_with_color_${variantColor.replace(/ /g, "_")}]->(variant:Variant) RETURN variant.name as variantName`;
  const dbSession = dbDriver.session();

  const response = await dbSession.run(query);
  const variantNames = [];

  response.records.forEach(record => {
    const variantName = record.get("variantName");
    variantNames.push(variantName);
  });

  console.log('Result count for variant names ' + variantNames.length);

  await dbSession.close();

  const endTime = new Date();
  const timeTaken = Math.abs(endTime.getTime() - startTime.getTime());

  console.log(`Time taken to execute findAllVariantsOfPromotionFasterVersion function ${timeTaken}ms`);
};

const main = async () => {
  doDIToFile();

  const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));

  try {
    await insertMerchants(driver);
    await insertCategories(driver);
    await insertBrands(driver);
    await insertProducts(driver);
    await insertVariants(driver);
    await insertBrandProductRelationship(driver);
    await insertProductVariantRelationshipV1(driver);
    await insertProductVariantRelationshipV2(driver);
  } catch (err) {
    console.error('Error', err);
  }

  await createPromotion(driver);

  const promotionId = '152704bc-93b8-4562-bed3-986f077a02df';
  const variantColor = 'blue';
  await findAllVariantsOfPromotionSlowerVersion(driver, promotionId, variantColor);
  await findAllVariantsOfPromotionFasterVersion(driver, promotionId, variantColor);
};

main();
