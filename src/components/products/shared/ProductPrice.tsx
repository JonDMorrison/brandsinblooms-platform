import { formatPrice, isOnSale, calculateDiscountPercentage } from '@/src/lib/products/utils/pricing';

interface ProductPriceProps {
  price: number;
  salePrice?: number | null;
  compareAtPrice?: number | null;
  className?: string;
  showSavings?: boolean;
}

export function ProductPrice({
  price,
  salePrice,
  compareAtPrice,
  className = '',
  showSavings = true,
}: ProductPriceProps) {
  const onSale = isOnSale(price, salePrice);
  const discount = compareAtPrice && salePrice
    ? calculateDiscountPercentage(compareAtPrice, salePrice)
    : onSale && salePrice
    ? calculateDiscountPercentage(price, salePrice)
    : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {onSale && salePrice ? (
        <>
          <span className="text-lg font-bold text-primary">
            {formatPrice(salePrice)}
          </span>
          <span className="text-sm text-gray-500 line-through">
            {formatPrice(price)}
          </span>
          {showSavings && discount > 0 && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
              Save {discount}%
            </span>
          )}
        </>
      ) : (
        <span className="text-lg font-bold">{formatPrice(price)}</span>
      )}
    </div>
  );
}
