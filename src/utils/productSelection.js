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

export const isVariantAvailable = (variant) =>
  variant?.availability_status === 'IN_STOCK';

export const getAvailableColors = (product) => {
  const availableNames = new Set(
    (product?.variants || [])
      .filter(isVariantAvailable)
      .map((variant) => variant.color?.name)
      .filter(Boolean),
  );
  return getUniqueColors(product).filter((color) => availableNames.has(color.name));
};

export const getInitialProductSelection = (product) => {
  const colors = getAvailableColors(product);
  const color = colors.length === 1 ? colors[0].name : "";
  const availableVariants = (product?.variants || []).filter(
    (variant) => isVariantAvailable(variant) &&
      (!color || variant.color?.name === color),
  );

  return {
    color,
    size: availableVariants.length === 1 ? availableVariants[0].size?.name || "" : "",
  };
};

export const reconcileProductSelection = (product, selection) => {
  const availableColors = getAvailableColors(product);
  const hasColors = getUniqueColors(product).length > 0;
  const selectedColorIsAvailable = availableColors.some(
    (color) => color.name === selection.color,
  );
  const color = selectedColorIsAvailable
    ? selection.color
    : availableColors.length === 1
      ? availableColors[0].name
      : '';
  const validVariants = (product?.variants || []).filter(
    (variant) => isVariantAvailable(variant) &&
      (!hasColors || variant.color?.name === color),
  );
  const selectedSizeIsAvailable = validVariants.some(
    (variant) => variant.size?.name === selection.size,
  );

  return {
    color,
    size: selectedSizeIsAvailable
      ? selection.size
      : validVariants.length === 1
        ? validVariants[0].size?.name || ''
        : '',
  };
};

export const findSelectedVariant = (product, color, size) => {
  if (!product?.variants || !size) return null;

  const hasColors = getUniqueColors(product).length > 0;
  if (hasColors && !color) return null;

  return (
    product.variants.find(
      (variant) => isVariantAvailable(variant) &&
        (!hasColors || variant.color?.name === color) &&
        variant.size?.name === size,
    ) || null
  );
};

export const getPurchasableVariant = (product, color, size) => {
  const variant = findSelectedVariant(product, color, size);
  return isVariantAvailable(variant) ? variant : null;
};
