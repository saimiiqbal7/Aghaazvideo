import type { Checkpoint } from '@/types'

export const HLS_URL =
  'https://vz-dfa24d6f-377.b-cdn.net/6e085b97-2323-4e78-89ba-25852c68284e/playlist.m3u8'

export const LESSON_TITLE = 'Office Day at Aghaaz'
export const SUBJECT = 'Computer Science'
export const GRADE = '9th Grade'
export const CHAPTER = 'Chapter 1 · Introduction'

export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 'q1',
    timestamp: 15,
    question: 'How many letters did Mahad count?',
    options: ['14', '15', '16'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    timestamp: 59,
    question: 'What is the mark called in English?',
    options: ['Exclamation mark', 'Question mark', 'The mark'],
    correctIndex: 0,
  },
  {
    id: 'q3',
    timestamp: 91,
    question: 'What does Ctrl + Z do on the lightboard?',
    options: ['Undo', 'Redo', 'Nothing'],
    correctIndex: 2,
  },
  {
    id: 'q4',
    timestamp: 148,
    question: 'What will happen if Mahad and Hassam keep fighting?',
    options: ['Setup will fall', 'Someone will get hurt', 'Nothing'],
    correctIndex: 0,
  },
  {
    id: 'q5',
    timestamp: 173,
    question: 'What does Saim want to do?',
    options: ['Make reels', 'Serious conversation', 'Play tennis'],
    correctIndex: 1,
  },
  {
    id: 'q6',
    timestamp: 220,
    question: 'Who has a sad life?',
    options: ['Hassam', 'Saim', 'Mahad'],
    correctIndex: 0,
  },
  {
    id: 'q7',
    timestamp: 290,
    question: 'Who is Hamza?',
    options: ['A branch of Aghaaz', 'A dude', 'A dude on a bike'],
    correctIndex: 0,
  },
]

