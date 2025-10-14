import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  scrollable?: boolean;
  showArrows?: boolean;
};

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, scrollable = true, showArrows, ...props }, ref) => {
  const effectiveShowArrows = showArrows ?? scrollable;
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  }, []);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 240;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const leftDisabled = !canScrollLeft;
  const rightDisabled = !canScrollRight;

  if (!scrollable) {
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <div className="relative flex items-center">
      {effectiveShowArrows && (
        <button
          onClick={() => scroll('left')}
          disabled={leftDisabled}
          className={cn(
            "absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center w-8 sm:w-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-200",
            leftDisabled ? "opacity-40 cursor-not-allowed" : "opacity-100"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "relative inline-flex h-auto items-center gap-2 p-0 bg-transparent w-full",
          className,
        )}
        {...props}
      >
        <div
          ref={scrollContainerRef}
          className="flex gap-2 w-full overflow-x-auto scrollbar-hide flex-nowrap snap-x snap-mandatory scroll-px-2"
        >
          {props.children}
        </div>
      </TabsPrimitive.List>
      {effectiveShowArrows && (
        <button
          onClick={() => scroll('right')}
          disabled={rightDisabled}
          className={cn(
            "absolute right-0 top-0 bottom-0 z-10 flex items-center justify-center w-8 sm:w-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-200",
            rightDisabled ? "opacity-40 cursor-not-allowed" : "opacity-100"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 lg:px-6 py-2.5 lg:py-3 text-sm lg:text-base font-medium transition-all duration-200 bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 min-h-[44px] flex-shrink-0",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
