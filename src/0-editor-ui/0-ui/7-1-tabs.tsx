import { Fragment } from "react";
import { motion } from "framer-motion";

type ExportTab = {
    id: string;
    label: string;
}

export function Tabs({ values, selected, onChange }: { values: ExportTab[]; selected: string; onChange: (id: string) => void; }) {
    return (
        <>
            {/* Container */}
            <ul className="flex">
                {values.map((value) => (
                    <Fragment key={value.id}>
                        {/* Tab */}
                        <li className="relative cursor-pointer p-2.5 font-bold" onClick={() => onChange(value.id)}>
                            {value.label}
                            {selected === value.id ? (
                                <motion.div className="absolute right-0 bottom-0 left-0 h-0.5 bg-strong-blue" layoutId="underline" />
                            ) : null}
                        </li>
                    </Fragment>
                ))}
            </ul>
        </>
    );
}
