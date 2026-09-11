import styled from "styled-components";
import { motion } from "framer-motion";

const Container = styled.ul`
  display: flex;
`;

const Tab = styled.li`
  cursor: pointer;
  position: relative;
  font-weight: bold;
  padding: 10px;

  .underline {
    height: 2px;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--strong-blue);
  }
`;

export interface ExportTab {
  id: string;
  label: string;
}

export function Tabs({
  values,
  selected,
  onChange,
}: {
  values: ExportTab[];
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    <Container>
      {values.map((value) => (
        <Tab key={value.id} onClick={() => onChange(value.id)}>
          {value.label}
          {selected === value.id ? <motion.div className="underline" layoutId="underline" /> : null}
        </Tab>
      ))}
    </Container>
  );
}
