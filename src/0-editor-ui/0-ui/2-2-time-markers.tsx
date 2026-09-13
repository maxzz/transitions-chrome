import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties, MutableRefObject } from "react";
import { getPlayback, getTimeScale, useEditorState } from "../state/store";
import type { DragOrigin, EditorStore } from "../types";
import { scrubberHalfWidth, sidebarWidth } from "./shared-components";

export function TimeMarkers({ currentTime, timelineRect, containerRef }: { currentTime: number; timelineRect: { width: number; height: number; }; containerRef: MutableRefObject<HTMLElement | null>; }) {
    const [dragOrigin, setDragOrigin] = useState<DragOrigin | undefined>(undefined);
    const scale = useEditorState(getTimeScale);
    const scrubTo = useEditorState(getScrubTo);
    const { stopPlaying } = useEditorState(getPlayback);

    const markers = useMemo(() => generateMarkers(timelineRect.width, scale), [timelineRect.width, scale]);

    useEffect(
        () => {
            document.body.style.cursor = dragOrigin ? "grabbing" : "";
            if (!dragOrigin) return;

            const handleDrag = (event: PointerEvent) => {
                const deltaX = event.pageX + (containerRef.current?.scrollLeft ?? 0) - scrubberHalfWidth - dragOrigin.pointerX;
                scrubTo(Math.max(0, dragOrigin.time + deltaX / scale));
            };
            const stopDrag = () => setDragOrigin(undefined);

            window.addEventListener("pointermove", handleDrag);
            window.addEventListener("pointerup", stopDrag);

            return () => {
                window.removeEventListener("pointermove", handleDrag);
                window.removeEventListener("pointerup", stopDrag);
            };
        },
        [containerRef, dragOrigin, scale, scrubTo]);

    return (<>
        {/* MarkerBackground */}
        <div className="fixed top-(--tab-bar-height) right-0 left-0 z-2 h-(--row-height) bg-feint backdrop-blur-[3px] backdrop-brightness-50" onClick={(event) => event.stopPropagation()} />

        {/* MarkersRow */}
        <div
            className="sticky top-0 z-3 flex h-(--row-height) shrink-0 items-center ml-[calc(-1*var(--sidebar-width)-40px)] pl-[calc(var(--sidebar-width)+40px)]"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => {
                const pointerX = event.pageX + (containerRef.current?.scrollLeft ?? 0) - scrubberHalfWidth;
                const time = (pointerX - sidebarWidth) / scale;
                stopPlaying();
                setDragOrigin({ pointerX, time });
                scrubTo(Math.max(0, time));
            }}
        >
            {markers}
            <Scrubber
                scale={scale}
                currentTime={currentTime}
                dragOrigin={dragOrigin}
                setDragOrigin={setDragOrigin}
                stopPlaying={stopPlaying}
                timelineHeight={timelineRect.height}
                containerRef={containerRef}
            />
        </div>
    </>);
}

const getScrubTo = (state: EditorStore) => state.scrubTo;

function Scrubber({ scale, currentTime, dragOrigin, setDragOrigin, stopPlaying, timelineHeight, containerRef }: {
    scale: number;
    currentTime: number;
    dragOrigin?: DragOrigin;
    setDragOrigin: (origin: DragOrigin) => void;
    stopPlaying: () => void;
    timelineHeight: number;
    containerRef: MutableRefObject<HTMLElement | null>;
}) {
    return (<>
        {/* Container */}
        <div
            className="absolute h-(--row-height) w-5 [&_svg]:relative [&_svg]:top-2.5 [&_svg]:left-1.25"
            style={{ transform: `translateX(${scale * currentTime + 7}px)`, cursor: dragOrigin ? "grabbing" : "grab" }}
            onPointerDown={(event) => {
                event.stopPropagation();
                stopPlaying();
                setDragOrigin({
                    pointerX: event.pageX + (containerRef.current?.scrollLeft ?? 0) - scrubberHalfWidth,
                    time: currentTime,
                });
            }}
        >
            <ScrubberIcon />
            {/* Stick */}
            <div
                className="pointer-events-none absolute top-(--row-height) left-2.5 h-0 w-px bg-splash"
                onPointerDown={(event) => event.stopPropagation()}
                style={{ height: `calc(${Math.floor(timelineHeight)}px - var(--row-height))` }}
            />
        </div>
    </>);
}

function ScrubberIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="20">
            <path
                d="M 0 2.25 C 0 1.145 0.895 0.25 2 0.25 L 9 0.25 C 10.105 0.25 11 1.145 11 2.25 L 11 14.997 C 11 15.721 10.609 16.388 9.977 16.742 L 5.5 19.25 L 1.023 16.742 C 0.391 16.388 0 15.721 0 14.997 Z"
                fill="var(--splash)"
            />
        </svg>
    );
}

function generateMarkers(totalWidth: number, scale: number) {
    if (!totalWidth) return null;
    const numVisibleSeconds = totalWidth / scale;
    const numMarkers = Math.ceil(numVisibleSeconds / increment);
    const markers = [];
    for (let i = 0; i < numMarkers; i += 1) {
        const time = increment * i;
        markers.push(
            <Fragment key={time}>
                {/* Marker */}
                <div
                    className="[--marker-padding:10px] shrink-0 grow-0 basis-(--marker-width) pl-(--marker-padding) font-bold text-(--white)"
                    style={{ "--marker-width": `${increment * scale}px` } as CSSProperties}
                >
                    {time}
                </div>
            </Fragment>,
        );
    }
    return markers;
}

const increment = 0.5;
