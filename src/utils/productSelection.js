export const getUniqueColors = (product) => {
  if (!product?.variants) return [];

  const colors = new Map();
  product.variants.forEach((variant) => {
    if (variant.color && !colors.has(variant.color.name)) {
      colors.set(variant.color.name, variant.color);
    }
  });
  return Array.from(colors.values());
};

export const getInitialProductSelection = (product) => {
  const colors = getUniqueColors(product);
  const color = colors.length === 1 ? colors[0].name : "";
  const firstVariant = product?.variants?.find(
    (variant) => !color || variant.color?.name === color,
  );

  return {
    color,
    size: colors.length === 1 ? firstVariant?.size?.name || "" : "",
  };
};

export const findSelectedVariant = (product, color, size) => {
  if (!product?.variants || !size) return null;

  const hasColors = getUniqueColors(product).length > 0;
  if (hasColors && !color) return null;

  return (
    product.variants.find(
      (variant) =>
        (!hasColors || variant.color?.name === color) &&
        variant.size?.name === size,
    ) || null
  );
};
