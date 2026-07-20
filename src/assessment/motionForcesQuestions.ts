import type { Question } from './types';

export const motionQuestions: Question[] = [
  {
    id: 'mq-741-return', kind: 'mcq', outcomeCode: '7.4.1', concept: 'Distance and displacement', misconception: 'Distance and displacement are interchangeable', difficulty: 'foundational', representation: 'text',
    prompt: 'A walker travels 6 m right, then 6 m left to the starting point. Which result is correct?',
    options: [
      { id: 'a', text: 'Distance 12 m; displacement 0 m.', correct: true, feedback: 'Correct. Distance totals the path; displacement compares final and initial position.' },
      { id: 'b', text: 'Distance 0 m; displacement 0 m.', correct: false, feedback: 'Returning makes displacement zero, but the 12 m path does not disappear.' },
      { id: 'c', text: 'Distance 12 m; displacement 12 m.', correct: false, feedback: 'Displacement is signed change in position, so it is zero after returning.' },
    ],
    hints: [{ level: 1, text: 'One quantity counts the whole path.' }, { level: 2, text: 'Displacement depends only on start and finish.' }, { level: 3, text: 'Path = 6 + 6 = 12 m; finish − start = 0 m.' }],
    explanation: 'Distance is a non-negative path length. Displacement is the signed change from run start to finish.',
  },
  {
    id: 'mq-741-velocity', kind: 'numeric', outcomeCode: '7.4.1', concept: 'Average velocity', difficulty: 'developing', representation: 'numeric',
    prompt: 'A walker has a displacement of −12 m in 4.0 s. What is the average velocity?', exactValue: -3, unit: 'm/s',
    hints: [{ level: 1, text: 'Keep the displacement sign.' }, { level: 2, text: 'vₐᵥ = Δs/Δt.' }, { level: 3, text: '−12 m ÷ 4.0 s = −3.0 m/s.' }],
    explanation: 'Average velocity is signed displacement divided by elapsed time.',
  },
  {
    id: 'mq-742-spacing', kind: 'mcq', outcomeCode: '7.4.2', concept: 'Equal-time motion diagrams', difficulty: 'foundational', representation: 'diagram',
    prompt: 'Equal-time dots have equal gaps to the right. What motion do they represent?',
    options: [
      { id: 'a', text: 'Constant positive velocity.', correct: true, feedback: 'Correct. Equal displacement in every equal interval means constant velocity.' },
      { id: 'b', text: 'Positive acceleration.', correct: false, feedback: 'Positive acceleration would make the rightward gaps grow.' },
      { id: 'c', text: 'Rest.', correct: false, feedback: 'Rest would repeat dots at the same position.' },
    ],
    hints: [{ level: 1, text: 'The time between dots is fixed.' }, { level: 2, text: 'Compare each displacement interval.' }, { level: 3, text: 'Equal displacement ÷ equal time gives constant velocity.' }],
    explanation: 'Equal spacing in one direction at equal times represents constant velocity.',
  },
  {
    id: 'mq-742-negative-a', kind: 'mcq', outcomeCode: '7.4.2', concept: 'Acceleration sign', misconception: 'Negative acceleration always means slowing', difficulty: 'challenging', representation: 'text',
    prompt: 'An object has velocity −2 m/s and acceleration −1 m/s². What happens initially?',
    options: [
      { id: 'a', text: 'It speeds up in the negative direction.', correct: true, feedback: 'Correct. Velocity and acceleration have the same sign, so speed increases.' },
      { id: 'b', text: 'It must slow down because acceleration is negative.', correct: false, feedback: 'Negative describes direction. Slowing depends on acceleration opposing velocity.' },
      { id: 'c', text: 'It is at rest.', correct: false, feedback: 'Its velocity is already −2 m/s.' },
    ],
    hints: [{ level: 1, text: 'A sign names a direction.' }, { level: 2, text: 'Compare the signs of velocity and acceleration.' }, { level: 3, text: 'Same signs → speed grows; opposite signs → speed falls.' }],
    explanation: 'Negative acceleration is acceleration in the selected negative direction, not a synonym for slowing.',
  },
  {
    id: 'mq-743-slope', kind: 'unit-select', outcomeCode: '7.4.3', concept: 'Distance–time slope', difficulty: 'developing', representation: 'graph',
    prompt: 'Distance rises from 2 m to 10 m between 1 s and 5 s. What is the graph slope?', exactValue: 2, correctUnit: 'm/s', unitOptions: ['m', 's', 'm/s', 'm/s²'],
    hints: [{ level: 1, text: 'Slope is rise divided by run.' }, { level: 2, text: 'Use Δdistance/Δtime.' }, { level: 3, text: '(10 − 2) m ÷ (5 − 1) s = 2 m/s.' }],
    explanation: 'The slope of a distance–time graph is speed and therefore has units m/s.',
  },
  {
    id: 'mq-743-hill', kind: 'mcq', outcomeCode: '7.4.3', concept: 'Graph interpretation', misconception: 'A motion graph is a literal hill or path', difficulty: 'developing', representation: 'graph',
    prompt: 'A distance–time line becomes horizontal. What does that section mean?',
    options: [
      { id: 'a', text: 'Distance is unchanged, so the object is stopped.', correct: true, feedback: 'Correct. A horizontal distance–time section has zero slope and zero speed.' },
      { id: 'b', text: 'The object is walking along a flat road.', correct: false, feedback: 'The graph is not a picture of terrain. Its axes are time and distance.' },
      { id: 'c', text: 'The object is moving vertically.', correct: false, feedback: 'Vertical position is not an axis on this graph.' },
    ],
    hints: [{ level: 1, text: 'Read the axis labels.' }, { level: 2, text: 'A horizontal section has zero slope.' }, { level: 3, text: 'Zero distance–time slope means zero speed.' }],
    explanation: 'Motion graphs encode quantities against time; they are not sketches of the path or landscape.',
  },
];

export const forceQuestions: Question[] = [
  {
    id: 'fq-744-mass', kind: 'mcq', outcomeCode: '7.4.4', concept: 'Mass and acceleration', misconception: 'Greater mass gives the same acceleration under the same force', difficulty: 'foundational', representation: 'graph',
    prompt: 'The same net force acts on two carts. Cart B has twice Cart A’s mass. How does B’s acceleration compare?',
    options: [
      { id: 'a', text: 'It is half as large.', correct: true, feedback: 'Correct. With fixed Fnet, a = Fnet/m.' },
      { id: 'b', text: 'It is twice as large.', correct: false, feedback: 'Greater mass reduces acceleration for the same net force.' },
      { id: 'c', text: 'It is unchanged.', correct: false, feedback: 'That ignores the inverse mass relationship in a = Fnet/m.' },
    ],
    hints: [{ level: 1, text: 'Hold net force constant.' }, { level: 2, text: 'Rearrange F = ma.' }, { level: 3, text: 'a = F/m, so doubling m halves a.' }],
    explanation: 'At fixed net force, acceleration is inversely proportional to mass.',
  },
  {
    id: 'fq-744-fma', kind: 'unit-select', outcomeCode: '7.4.4', concept: 'F = ma', difficulty: 'developing', representation: 'numeric',
    prompt: 'A 2.0 kg cart has net force 6.0 N. What is its acceleration?', exactValue: 3, correctUnit: 'm/s²', unitOptions: ['N', 'kg', 'm/s', 'm/s²'],
    hints: [{ level: 1, text: 'Acceleration is the unknown.' }, { level: 2, text: 'a = Fnet/m.' }, { level: 3, text: '6.0 N ÷ 2.0 kg = 3.0 m/s².' }],
    explanation: 'Acceleration equals signed net force divided by positive mass.',
  },
  {
    id: 'fq-745-seatbelt', kind: 'mcq', outcomeCode: '7.4.5', concept: 'Newton’s first law', difficulty: 'foundational', representation: 'text',
    prompt: 'Why does a seatbelt exert a force on a passenger when a car stops suddenly?',
    options: [
      { id: 'a', text: 'The passenger tends to keep moving; the belt supplies the force that changes their motion.', correct: true, feedback: 'Correct. The belt provides the net force needed to decelerate the passenger.' },
      { id: 'b', text: 'Motion naturally runs out at exactly the same instant as the car stops.', correct: false, feedback: 'Without a net force the passenger would continue at constant velocity.' },
      { id: 'c', text: 'The belt cancels the passenger’s mass.', correct: false, feedback: 'Mass does not disappear. The belt changes velocity by exerting a force.' },
    ],
    hints: [{ level: 1, text: 'Think inertia.' }, { level: 2, text: 'What would happen without the belt force?' }, { level: 3, text: 'The passenger continues forward until the belt exerts a stopping force.' }],
    explanation: 'Newton’s first law predicts continued motion unless a net force changes it.',
  },
  {
    id: 'fq-745-third', kind: 'mcq', outcomeCode: '7.4.5', concept: 'Newton’s third law', misconception: 'Third-law pairs cancel on one free-body diagram', difficulty: 'challenging', representation: 'diagram',
    prompt: 'A foot pushes Earth backward and Earth pushes the foot forward. Why do these forces not cancel on the foot’s free-body diagram?',
    options: [
      { id: 'a', text: 'They act on different objects.', correct: true, feedback: 'Correct. Only forces acting on the selected foot belong on its diagram.' },
      { id: 'b', text: 'The Earth force is always larger.', correct: false, feedback: 'The pair is equal in magnitude and opposite in direction.' },
      { id: 'c', text: 'Action forces happen before reaction forces.', correct: false, feedback: 'The interaction forces occur together.' },
    ],
    hints: [{ level: 1, text: 'Name the object each force acts on.' }, { level: 2, text: 'A free-body diagram contains one selected object.' }, { level: 3, text: 'Earth-on-foot acts on foot; foot-on-Earth acts on Earth.' }],
    explanation: 'Third-law forces are equal and opposite but attached to different objects, so they never cancel on one object’s diagram.',
  },
  {
    id: 'fq-746-net', kind: 'numeric', outcomeCode: '7.4.6', concept: 'Signed net force', difficulty: 'developing', representation: 'diagram',
    prompt: 'Positive is right. Forces of 8 N right, 3 N left and 1 N left act on one object. What is Fnet?', exactValue: 4, unit: 'N',
    hints: [{ level: 1, text: 'Assign signs before adding.' }, { level: 2, text: 'Right is positive and left is negative.' }, { level: 3, text: '+8 − 3 − 1 = +4 N.' }],
    explanation: 'One-dimensional net force is the signed sum of all forces on the selected object.',
  },
  {
    id: 'fq-746-convention', kind: 'mcq', outcomeCode: '7.4.6', concept: 'Positive-direction convention', difficulty: 'developing', representation: 'diagram',
    prompt: 'You change the chosen positive direction from right to left. What happens to the physical forces and their signed values?',
    options: [
      { id: 'a', text: 'Physical arrows stay put; every signed value reverses.', correct: true, feedback: 'Correct. Changing coordinates does not move a force in the world.' },
      { id: 'b', text: 'Every physical force reverses direction.', correct: false, feedback: 'A coordinate convention changes signs, not physical directions.' },
      { id: 'c', text: 'Nothing changes, including signs.', correct: false, feedback: 'The same physical direction has the opposite sign under the new convention.' },
    ],
    hints: [{ level: 1, text: 'Separate model coordinates from physical direction.' }, { level: 2, text: 'The object does not know which direction you named positive.' }, { level: 3, text: 'Arrows stay physical; their numerical signs flip.' }],
    explanation: 'Coordinate conventions relabel physical vectors without changing them.',
  },
  {
    id: 'fq-747-deltav', kind: 'unit-select', outcomeCode: '7.4.7', concept: 'a = Δv/Δt', difficulty: 'developing', representation: 'numeric',
    prompt: 'Velocity changes from −2 m/s to +6 m/s in 4.0 s. What is acceleration?', exactValue: 2, correctUnit: 'm/s²', unitOptions: ['m/s²', 'm/s', 'N', 's'],
    hints: [{ level: 1, text: 'First calculate final minus initial velocity.' }, { level: 2, text: 'Δv = 6 − (−2) = 8 m/s.' }, { level: 3, text: 'a = 8 m/s ÷ 4.0 s = 2.0 m/s².' }],
    explanation: 'Acceleration is change in signed velocity divided by elapsed time.',
  },
  {
    id: 'fq-747-constant-v', kind: 'mcq', outcomeCode: '7.4.7', concept: 'Net force and constant velocity', misconception: 'Constant velocity requires a net force', difficulty: 'challenging', representation: 'graph',
    prompt: 'A cart moves right at constant velocity. What is its net force?',
    options: [
      { id: 'a', text: '0 N.', correct: true, feedback: 'Correct. Constant velocity means zero acceleration, so Fnet = ma = 0.' },
      { id: 'b', text: 'A constant positive force.', correct: false, feedback: 'A positive net force would cause positive acceleration, not constant velocity.' },
      { id: 'c', text: 'A force equal to its mass.', correct: false, feedback: 'Force and mass have different dimensions and cannot be set equal this way.' },
    ],
    hints: [{ level: 1, text: 'Constant velocity means no velocity change.' }, { level: 2, text: 'No velocity change means a = 0.' }, { level: 3, text: 'Fnet = m × 0 = 0 N.' }],
    explanation: 'An object can move at constant nonzero velocity while forces balance to zero net force.',
  },
];
