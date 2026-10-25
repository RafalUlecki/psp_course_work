import { findAndMountFixtureHover } from "./components/fixtureHoverRoot/FixtureHoverRoot";
import { startGenericPropHover } from "./components/genericPropHover/GenericPropHoverRoot";

if (!findAndMountFixtureHover()) {
  startGenericPropHover();
}
