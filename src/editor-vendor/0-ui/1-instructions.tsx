import { motion } from "framer-motion";
import { RecordIcon } from "./8-icons";

export function Instructions() {
    return (
        <motion.div
            className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center text-sm"
            exit={{ scale: 0.925, opacity: 0 }}
            transition={{ duration: 0.15, ease: "linear" }}
        >
            <p>
                While recording
                <span className="mx-1.25 inline-flex translate-y-0.75 items-center justify-center rounded-0.75 border border-feint p-1.25 fill-red-500">
                    <RecordIcon />
                </span>
                is on, trigger a CSS or Motion One animation in the inspected tab.
            </p>
            <p className="max-w-140 text-white/55">
                This panel does not play a demo. Hover, click, or reload a page that already animates.
                With the dev server running, open{" "}
                <span className="font-mono text-white/80">http://localhost:5173/playground.html</span>
                {" "}in the tab behind DevTools.
            </p>
            <p className="max-w-140 text-white/40">
                Framer Motion, GSAP, and react-spring are not recorded yet.
            </p>
        </motion.div>
    );
}
