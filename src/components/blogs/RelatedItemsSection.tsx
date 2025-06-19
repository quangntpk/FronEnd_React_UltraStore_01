
import { useIsMobile } from "@/hooks/use-mobile";
import { RelatedProducts } from "./RelatedProducts";

interface RelatedItemsSectionProps {
  category: string;
  relatedProducts?: number[];
  relatedCombos?: number[];
}

export const RelatedItemsSection = ({ 
  category, 
  relatedProducts, 
  relatedCombos 
}: RelatedItemsSectionProps) => {
  const isMobile = useIsMobile();
  
  if ((category === "product" && !relatedProducts?.length) || 
      (category === "combo" && !relatedCombos?.length)) {
    return null;
  }

  const title = category === "product" ? "Featured Products" : "Featured Combos";
  const ids = category === "product" ? relatedProducts : relatedCombos;
  const type = category === "product" ? "product" : "combo";

  return (
    <div className="mb-8">
      <h2 className={`text-xl ${isMobile ? "" : "text-2xl"} font-bold mb-4 md:mb-6`}>{title}</h2>
      <RelatedProducts ids={ids || []} type={type} />
    </div>
  );
};
