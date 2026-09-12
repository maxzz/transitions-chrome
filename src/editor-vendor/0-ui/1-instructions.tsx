import styled from "styled-components";
import { motion } from "framer-motion";
import { RecordIcon } from "./8-icons";

export function Instructions() {
    return (
        <Container exit={{ scale: 0.925, opacity: 0 }} transition={{ duration: 0.15, ease: "linear" }}>
            <p>
                While recording
                <RecordIconContainer>
                    <RecordIcon />
                </RecordIconContainer> is active, interact
                with or reload the page to inspect animations.
            </p>
        </Container>
    );
}

const Container = styled(motion.div)`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
`;

const RecordIconContainer = styled.div`
  border: 1px solid var(--feint);
  border-radius: 3px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  margin: 0 5px;
  transform: translateY(3px);
  fill: var(--red);
`;
