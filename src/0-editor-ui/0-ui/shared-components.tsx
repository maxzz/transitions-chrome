import type { ButtonHTMLAttributes, ComponentPropsWithoutRef } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";

export const sidebarWidth = 220;
export const tabBarHeight = 42;
export const scrubberHalfWidth = 16;

export function ActionButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button className={className ? `${actionButtonClasses} ${className}` : actionButtonClasses} {...props} />
    );
}

const actionButtonClasses = "\
flex \
items-center \
justify-center \
rounded-[5px] \
border \
border-feint \
px-3.75 \
py-2.5 \
text-(--white) \
disabled:cursor-default \
disabled:opacity-50 \
disabled:[&_svg]:text-(--white) \
data-[disabled=true]:cursor-default \
data-[disabled=true]:opacity-50 \
data-[disabled=true]:[&_svg]:text-(--white) \
[&_svg]:mr-1.25 \
[&_svg]:size-4 \
[&_svg]:text-(--red)";

export function SidebarContainer({ className, ...props }: ComponentPropsWithoutRef<"section">) {
    return (
        <section className={className ? `${sidebarContainerClasses} ${className}` : sidebarContainerClasses} {...props} />
    );
}

const sidebarContainerClasses = "\
sticky \
top-0 \
bottom-0 \
z-5 \
w-(--sidebar-width) \
shrink-0 \
bg-transparent \
bg-[radial-gradient(rgba(0,0,0,0)_1px,var(--background)_1px)] \
bg-size-[4px_4px] \
pt-[calc(10px+var(--row-height))] \
pr-2.5 \
pb-12.5 \
pl-5 \
backdrop-blur-[3px] \
";

export function ValueMarker({ className, ...props }: HTMLMotionProps<"div">) {
    return (
        <motion.div className={className ? `${valueMarkerClasses} ${className}` : valueMarkerClasses} {...props} />
    );
}

const valueMarkerClasses = "\
size-4 \
rounded-[5px] \
border-[3px] \
border-(--black) \
bg-(--white) \
";
