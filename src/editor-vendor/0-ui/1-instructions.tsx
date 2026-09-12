import { motion } from "framer-motion";
import { RecordIcon } from "./8-icons";

export function Instructions() {
    return (
        <motion.div
            className="flex flex-1 items-center justify-center text-sm"
            exit={{ scale: 0.925, opacity: 0 }}
            transition={{ duration: 0.15, ease: "linear" }}
        >
            <p>
                While recording
                <span className="mx-1.25 inline-flex translate-y-0.75 items-center justify-center rounded-0.75 border border-feint p-1.25 fill-red-500">
                    <RecordIcon />
                </span> 
                is active, interact with or reload the page to inspect animations.
            </p>
        </motion.div>
    );
}
