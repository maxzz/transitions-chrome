import { useEffect, useMemo, useState } from "react";
import type { MutableRefObject } from "react";
import styled from "styled-components";
import { getPlayback, getTimeScale, useEditorState } from "../state/store";
import type { DragOrigin, EditorStore } from "../types";
import { scrubberHalfWidth, sidebarWidth } from "./shared-styles";

const Container = styled.div`
  position: absolute;
  width: 20px;
  height: var(--row-height);
  cursor: grabber;

  svg {
    position: relative;
    top: 10px;
    left: 5px;
  }
`;

const Stick = styled.div`
  width: 1px;
  height: 0;
  background-color: var(--splash);
  position: absolute;
  top: var(--row-height);
  left: 10px;
  pointer-events: none;
`;

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

function Scrubber({
  scale,
  currentTime,
  dragOrigin,
  setDragOrigin,
  stopPlaying,
  timelineHeight,
  containerRef,
}: {
  scale: number;
  currentTime: number;
  dragOrigin?: DragOrigin;
  setDragOrigin: (origin: DragOrigin) => void;
  stopPlaying: () => void;
  timelineHeight: number;
  containerRef: MutableRefObject<HTMLElement | null>;
}) {
  return (
    <Container
      style={{
        transform: `translateX(${scale * currentTime + 7}px)`,
        cursor: dragOrigin ? "grabbing" : "grab",
      }}
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
      <Stick
        onPointerDown={(event) => event.stopPropagation()}
        style={{ height: `calc(${Math.floor(timelineHeight)}px - var(--row-height))` }}
      />
    </Container>
  );
}

const MarkerBackground = styled.div`
  background-color: var(--feint);
  backdrop-filter: brightness(50%) blur(3px);
  position: fixed;
  left: 0;
  right: 0;
  top: var(--tab-bar-height);
  height: var(--row-height);
  z-index: 2;
`;

const MarkersRow = styled.div`
  margin-left: calc(-1 * var(--sidebar-width) - 40px);
  padding-left: calc(var(--sidebar-width) + 40px);
  flex: 0 0 var(--row-height);
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  z-index: 3;
`;

const Marker = styled.div`
  --marker-padding: 10px;
  padding-left: var(--marker-padding);
  color: var(--white);
  font-weight: bold;
  flex: 0 0 calc(var(--marker-width));
`;

const increment = 0.5;

function generateMarkers(totalWidth: number, scale: number) {
  if (!totalWidth) return null;
  const numVisibleSeconds = totalWidth / scale;
  const numMarkers = Math.ceil(numVisibleSeconds / increment);
  const markers = [];
  for (let i = 0; i < numMarkers; i += 1) {
    const time = increment * i;
    markers.push(
      <Marker key={time} style={{ "--marker-width": `${increment * scale}px` }}>
        {time}
      </Marker>,
    );
  }
  return markers;
}

const getScrubTo = (state: EditorStore) => state.scrubTo;

export function TimeMarkers({
  currentTime,
  timelineRect,
  containerRef,
}: {
  currentTime: number;
  timelineRect: { width: number; height: number };
  containerRef: MutableRefObject<HTMLElement | null>;
}) {
  const [dragOrigin, setDragOrigin] = useState<DragOrigin | undefined>(undefined);
  const scale = useEditorState(getTimeScale);
  const scrubTo = useEditorState(getScrubTo);
  const { stopPlaying } = useEditorState(getPlayback);
  const markers = useMemo(() => generateMarkers(timelineRect.width, scale), [timelineRect.width, scale]);

  useEffect(() => {
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
  }, [containerRef, dragOrigin, scale, scrubTo]);

  return (
    <>
      <MarkerBackground onClick={(event) => event.stopPropagation()} />
      <MarkersRow
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
      </MarkersRow>
    </>
  );
}
