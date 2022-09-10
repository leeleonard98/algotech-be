const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createProduct = async (req) => {
  const { sku, name, description, image, categories, brand_id, qtyThreshold } =
    req;

  await prisma.product.create({
    data: {
      sku,
      name,
      description,
      image,
      brand_id,
      qtyThreshold,
      ProductCategory: {
        create: categories.map((c) => ({
          category_name: c.name,
          category: {
            connect: {
              name: c.name
            }
          }
        }))
      }
    }
  });
};

const getAllProducts = async () => {
  const products = await prisma.product.findMany({
    include: { ProductCategory: true }
  });
  return products;
};

const findProductById = async (req) => {
  const { id } = req;
  const product = await prisma.product.findUnique({
    where: {
      id: Number(id)
    }
  });
  return product;
};

const findProductBySku = async (req) => {
  const { sku } = req;
  const product = await prisma.product.findUnique({
    where: {
      sku
    }
  });
  return product;
};

const findProductByName = async (req) => {
  const { name } = req;
  const product = await prisma.product.findUnique({
    where: {
      name
    }
  });
  return product;
};

const updateProduct = async (req) => {
  const { id, name, description, image, category_id, qtyThreshold } = req;
  product = await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      image,
      category_id,
      qtyThreshold,
      brand_id
    }
  });
  return product;
};

const deleteProduct = async (req) => {
  const { id } = req;
  await prisma.product.delete({
    where: {
      id: Number(id)
    }
  });
};

exports.createProduct = createProduct;
exports.getAllProducts = getAllProducts;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.findProductById = findProductById;
exports.findProductBySku = findProductBySku;
exports.findProductByName = findProductByName;
