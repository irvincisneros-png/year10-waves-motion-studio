import { NavLink, Outlet, useLocation } from "react-router-dom";
import "../wave-foundations/WaveLab.css";
import "./MotionForcesLab.css";

const MOTION_PHASES = [
  { to: "/motion", end: true, phase: "Orient · Learn", label: "Start here" },
  { to: "/motion/track", phase: "Explore", label: "Signed track" },
  { to: "/motion/diagrams", phase: "Explore", label: "Motion diagrams" },
  { to: "/motion/graphs", phase: "Investigate", label: "Graphs & trials" },
  { to: "/motion/check", phase: "Check", label: "Check" },
  { to: "/motion/explain", phase: "Explain", label: "Explain" },
  { to: "/motion/connect", phase: "Connect", label: "Connect" },
];

const FORCE_PHASES = [
  { to: "/forces", end: true, phase: "Orient · Learn", label: "Start here" },
  { to: "/forces/vectors", phase: "Explore", label: "Force vectors" },
  { to: "/forces/cart", phase: "Investigate", label: "Cart fair test" },
  { to: "/forces/applications", phase: "Apply", label: "Newton cases" },
  { to: "/forces/calculations", phase: "Learn · Apply", label: "Calculations" },
  { to: "/forces/check", phase: "Check", label: "Check" },
  { to: "/forces/explain", phase: "Explain", label: "Explain" },
  { to: "/forces/connect", phase: "Connect", label: "Connect" },
];

export function MotionForcesLayout() {
  const isForces = useLocation().pathname.startsWith("/forces");
  const phases = isForces ? FORCE_PHASES : MOTION_PHASES;
  return (
    <div
      className={`wave-lab motion-forces-lab ${isForces ? "motion-forces-lab--forces" : ""}`}
    >
      <nav
        aria-label={`${isForces ? "Forces" : "Motion"} learning phases`}
        className="wave-lab__phases"
      >
        <ul role="list" className="wave-lab__phase-list">
          {phases.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className="wave-lab__phase-link"
              >
                <span className="wave-lab__phase-tag">{item.phase}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}
