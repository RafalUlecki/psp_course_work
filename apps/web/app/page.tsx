"use client";

import styled from "styled-components";

const Heading = styled.h1`
  font-family: system-ui, sans-serif;
  font-size: 2rem;
  color: #111;
`;

export default function Home() {
  return (
    <main>
      <Heading>PropHover</Heading>
    </main>
  );
}
