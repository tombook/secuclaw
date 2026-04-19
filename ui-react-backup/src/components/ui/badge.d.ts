import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const badgeVariants: (props?: ({
    variant?: "info" | "success" | "warning" | "default" | "secondary" | "destructive" | "outline" | "critical" | "high" | "medium" | "low" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}
declare function Badge({ className, variant, ...props }: BadgeProps): import("react/jsx-runtime").JSX.Element;
export { Badge, badgeVariants };
//# sourceMappingURL=badge.d.ts.map