import type { ButtonHTMLAttributes, ComponentPropsWithoutRef } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";

export const sidebarWidth = 220;
export const tabBarHeight = 42;
export const scrubberHalfWidth = 16;

const actionButtonClassName =
    "flex items-center justify-center rounded-[5px] border border-feint px-3.75 py-2.5 text-(--white) disabled:cursor-default disabled:opacity-50 disabled:[&_svg]:text-(--white) data-[disabled=true]:cursor-default data-[disabled=true]:opacity-50 data-[disabled=true]:[&_svg]:text-(--white) [&_svg]:mr-1.25 [&_svg]:size-4 [&_svg]:text-(--red)";

const sidebarContainerClassName =
    "sticky top-0 bottom-0 z-5 w-(--sidebar-width) shrink-0 bg-transparent bg-[radial-gradient(rgba(0,0,0,0)_1px,var(--background)_1px)] bg-size-[4px_4px] pt-[calc(10px+var(--row-height))] pr-2.5 pb-12.5 pl-5 backdrop-blur-[3px]";

const valueMarkerClassName = "size-4 rounded-[5px] border-[3px] border-(--black) bg-[var(--white)]";

export function ActionButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <>
            {/* ActionButton */}
            <button className={className ? `${actionButtonClassName} ${className}` : actionButtonClassName} {...props} />
        </>
    );
}

export function SidebarContainer({ className, ...props }: ComponentPropsWithoutRef<"section">) {
    return (
        <>
            {/* SidebarContainer */}
            <section className={className ? `${sidebarContainerClassName} ${className}` : sidebarContainerClassName} {...props} />
        </>
    );
}

export function ValueMarker({ className, ...props }: HTMLMotionProps<"div">) {
    return (
        <>
            {/* ValueMarker */}
            <motion.div className={className ? `${valueMarkerClassName} ${className}` : valueMarkerClassName} {...props} />
        </>
    );
}
