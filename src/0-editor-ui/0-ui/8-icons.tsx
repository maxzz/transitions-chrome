import type { CSSProperties } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";

interface IconProps {
    style?: CSSProperties;
}

export function RecordIcon(props: HTMLMotionProps<"span">) {
    return (
        <>
            {/* RecordIcon */}
            <motion.span className="inline-block size-3.5 rounded-full bg-white/50" {...props} />
        </>
    );
}

export function AddIcon({ style }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}>
            <title>Add</title>
            <path
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="32"
                d="M256 112v288M400 256H112"
            />
        </svg>
    );
}

export function InspectIcon({ style }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}>
            <title>Inspect element</title>
            <path d="M456.69 421.39L362.6 327.3a173.81 173.81 0 0034.84-104.58C397.44 126.38 319.06 48 222.72 48S48 126.38 48 222.72s78.38 174.72 174.72 174.72A173.81 173.81 0 00327.3 362.6l94.09 94.09a25 25 0 0035.3-35.3zM97.92 222.72a124.8 124.8 0 11124.8 124.8 124.95 124.95 0 01-124.8-124.8z" />
        </svg>
    );
}

export function CodeExportIcon({ style }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}>
            <title>Code icon</title>
            <path d="M160 389a20.91 20.91 0 01-13.82-5.2l-128-112a21 21 0 010-31.6l128-112a21 21 0 0127.66 31.61L63.89 256l109.94 96.19A21 21 0 01160 389zM352 389a21 21 0 01-13.84-36.81L448.11 256l-109.94-96.19a21 21 0 0127.66-31.61l128 112a21 21 0 010 31.6l-128 112A20.89 20.89 0 01352 389zM208 437a21 21 0 01-20.12-27l96-320a21 21 0 1140.23 12l-96 320A21 21 0 01208 437z" />
        </svg>
    );
}

export function RepeatIcon({ style }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}>
            <title>Repeat</title>
            <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="32"
                d="M320 120l48 48-48 48"
            />
            <path
                d="M352 168H144a80.24 80.24 0 00-80 80v16M192 392l-48-48 48-48"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="32"
            />
            <path
                d="M160 344h208a80.24 80.24 0 0080-80v-16"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="32"
            />
        </svg>
    );
}

export function PlayIcon({ style }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}>
            <title>Play</title>
            <path d="M133 440a35.37 35.37 0 01-17.5-4.67c-12-6.8-19.46-20-19.46-34.33V111c0-14.37 7.46-27.53 19.46-34.33a35.13 35.13 0 0135.77.45l247.85 148.36a36 36 0 010 61l-247.89 148.4A35.5 35.5 0 01133 440z" />
        </svg>
    );
}

export function PauseIcon({ style }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}>
            <title>Pause</title>
            <path d="M208 432h-48a16 16 0 01-16-16V96a16 16 0 0116-16h48a16 16 0 0116 16v320a16 16 0 01-16 16zM352 432h-48a16 16 0 01-16-16V96a16 16 0 0116-16h48a16 16 0 0116 16v320a16 16 0 01-16 16z" />
        </svg>
    );
}

export function SkipBackIcon({ style }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}>
            <title>Play Skip Back</title>
            <path d="M112 64a16 16 0 0116 16v136.43L360.77 77.11a35.13 35.13 0 0135.77-.44c12 6.8 19.46 20 19.46 34.33v290c0 14.37-7.46 27.53-19.46 34.33a35.14 35.14 0 01-35.77-.45L128 295.57V432a16 16 0 01-32 0V80a16 16 0 0116-16z" />
        </svg>
    );
}

export function CloseIcon({ style }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}>
            <title>Close Circle</title>
            <path
                d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z"
                fill="none"
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeWidth="32"
            />
            <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="32"
                d="M320 320L192 192M192 320l128-128"
            />
        </svg>
    );
}

export function TrashIcon({ style }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}>
            <title>Trash</title>
            <path
                d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="32"
            />
            <path stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M80 112h352" />
            <path
                d="M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="32"
            />
        </svg>
    );
}
