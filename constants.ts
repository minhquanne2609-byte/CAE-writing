import { SubscaleDefinition } from './types';

export const TASK_TYPES = [
  { id: 'Essay', label: 'Part 1: Essay', description: 'Focus on discursive argument, weighing up two points.' },
  { id: 'Letter/Email', label: 'Part 2: Letter/Email', description: 'Response to a prompt, varying register (formal/informal).' },
  { id: 'Proposal', label: 'Part 2: Proposal', description: 'Persuasive, making recommendations for future action.' },
  { id: 'Report', label: 'Part 2: Report', description: 'Factual, evaluating past events/situations.' },
  { id: 'Review', label: 'Part 2: Review', description: 'Descriptive, evaluative, personal opinion/recommendation.' },
];

export const SCALES: SubscaleDefinition[] = [
  {
    name: 'Content',
    description: 'Focuses on how well the candidate has fulfilled the task, in other words if they have done what they were asked to do.',
    descriptors: [
      {
        band: 5,
        summary: 'Target reader is fully informed.',
        details: [
          'All content is relevant to the task.',
          'Target reader is fully informed.'
        ]
      },
      {
        band: 3,
        summary: 'Target reader is on the whole informed.',
        details: [
          'Minor irrelevances and/or omissions may be present.',
          'Target reader is on the whole informed.'
        ]
      },
      {
        band: 1,
        summary: 'Target reader is minimally informed.',
        details: [
          'Irrelevances and misinterpretation of task may be present.',
          'Target reader is minimally informed.'
        ]
      },
      {
        band: 0,
        summary: 'Target reader is not informed.',
        details: ['Content is totally irrelevant.', 'Target reader is not informed.']
      }
    ]
  },
  {
    name: 'Communicative Achievement',
    description: 'Focuses on how appropriate the writing is for the task and whether the candidate has used the appropriate register.',
    descriptors: [
      {
        band: 5,
        summary: 'Communicates complex ideas effectively.',
        details: [
          'Uses the conventions of the communicative task with sufficient flexibility to communicate complex ideas in an effective way.',
          'Holds the target reader’s attention with ease, fulfilling all communicative purposes.'
        ]
      },
      {
        band: 3,
        summary: 'Communicates straightforward and complex ideas.',
        details: [
          'Uses the conventions of the communicative task effectively to hold the target reader’s attention.',
          'Communicates straightforward and complex ideas, as appropriate.'
        ]
      },
      {
        band: 1,
        summary: 'Communicates straightforward ideas.',
        details: [
          'Uses the conventions of the communicative task to hold the target reader’s attention.',
          'Communicates straightforward ideas.'
        ]
      }
    ]
  },
  {
    name: 'Organisation',
    description: 'Focuses on the way the candidate puts together the piece of writing, in other words if it is logical and ordered.',
    descriptors: [
      {
        band: 5,
        summary: 'Well-organised, coherent whole.',
        details: [
          'Text is a well-organised, coherent whole.',
          'Uses a variety of cohesive devices and organisational patterns with flexibility.'
        ]
      },
      {
        band: 3,
        summary: 'Well organised and coherent.',
        details: [
          'Text is well organised and coherent.',
          'Using a variety of cohesive devices and organisational patterns to generally good effect.'
        ]
      },
      {
        band: 1,
        summary: 'Generally well organised.',
        details: [
          'Text is generally well organised and coherent.',
          'Using a variety of linking words and cohesive devices.'
        ]
      }
    ]
  },
  {
    name: 'Language',
    description: 'Focuses on vocabulary and grammar. This includes the range of language as well as how accurate it is.',
    descriptors: [
      {
        band: 5,
        summary: 'Wide range, full control, occasional slips.',
        details: [
          'Uses a range of vocabulary, including less common lexis, effectively and precisely.',
          'Uses a wide range of simple and complex grammatical forms with full control, flexibility and sophistication.',
          'Errors, if present, are related to less common words and structures, or occur as slips.'
        ]
      },
      {
        band: 3,
        summary: 'Range of vocabulary, occasional errors.',
        details: [
          'Uses a range of vocabulary, including less common lexis, appropriately.',
          'Uses a range of simple and complex grammatical forms with control and flexibility.',
          'Occasional errors may be present but do not impede communication.'
        ]
      },
      {
        band: 1,
        summary: 'Everyday vocabulary, some errors.',
        details: [
          'Uses a range of everyday vocabulary appropriately, with occasional inappropriate use of less common lexis.',
          'Uses a range of simple and some complex grammatical forms with a good degree of control.',
          'Errors do not impede communication.'
        ]
      }
    ]
  }
];
