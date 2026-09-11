import styled from "styled-components";
import { motion } from "framer-motion";

export const sidebarWidth = 220;
export const tabBarHeight = 42;
export const scrubberHalfWidth = 16;

export const ActionButton = styled.button`
  color: var(--white);
  padding: 10px 15px;
  border-radius: 5px;
  border: 1px solid var(--feint);
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled,
  &[data-disabled="true"] {
    opacity: 0.5;
    cursor: default;

    svg {
      color: var(--white);
    }
  }

  svg {
    width: 16px;
    height: 16px;
    color: var(--red);
    margin-right: 5px;
  }
`;

export const SidebarContainer = styled.section`
  flex: 0 0 var(--sidebar-width);
  width: var(--sidebar-width);
  background-color: transparent;
  background-image: radial-gradient(rgba(0, 0, 0, 0) 1px, var(--background) 1px);
  background-size: 4px 4px;
  backdrop-filter: blur(3px);
  padding: calc(10px + var(--row-height)) 10px 50px 20px;
  position: sticky;
  top: 0;
  bottom: 0;
  z-index: 5;
`;

export const ValueMarker = styled(motion.div)`
  width: 16px;
  height: 16px;
  background-color: var(--white);
  border-radius: 5px;
  border: 3px solid var(--black);
`;
