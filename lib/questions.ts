import { Question } from "./types";

// -----------------------------------------------------------------------
// QUESTION BANK — IPIP Big-Five Factor Markers, 50 items (public domain)
// -----------------------------------------------------------------------
// https://ipip.ori.org/newBigFive5broadKey.htm
// Wording, order and keying are the instrument behind the percentile norms in
// lib/oceanNorms.ts, so changing an item would make those norms invalid.
// -----------------------------------------------------------------------

export const questionBank: Question[] = [
  { id: 1, trait: "E", prompt: "I am the life of the party.", reverse: false },
  { id: 2, trait: "A", prompt: "I feel little concern for others.", reverse: true },
  { id: 3, trait: "C", prompt: "I am always prepared.", reverse: false },
  { id: 4, trait: "N", prompt: "I get stressed out easily.", reverse: false },
  { id: 5, trait: "O", prompt: "I have a rich vocabulary.", reverse: false },
  { id: 6, trait: "E", prompt: "I don't talk a lot.", reverse: true },
  { id: 7, trait: "A", prompt: "I am interested in people.", reverse: false },
  { id: 8, trait: "C", prompt: "I leave my belongings around.", reverse: true },
  { id: 9, trait: "N", prompt: "I am relaxed most of the time.", reverse: true },
  { id: 10, trait: "O", prompt: "I have difficulty understanding abstract ideas.", reverse: true },
  { id: 11, trait: "E", prompt: "I feel comfortable around people.", reverse: false },
  { id: 12, trait: "A", prompt: "I insult people.", reverse: true },
  { id: 13, trait: "C", prompt: "I pay attention to details.", reverse: false },
  { id: 14, trait: "N", prompt: "I worry about things.", reverse: false },
  { id: 15, trait: "O", prompt: "I have a vivid imagination.", reverse: false },
  { id: 16, trait: "E", prompt: "I keep in the background.", reverse: true },
  { id: 17, trait: "A", prompt: "I sympathize with others' feelings.", reverse: false },
  { id: 18, trait: "C", prompt: "I make a mess of things.", reverse: true },
  { id: 19, trait: "N", prompt: "I seldom feel blue.", reverse: true },
  { id: 20, trait: "O", prompt: "I am not interested in abstract ideas.", reverse: true },
  { id: 21, trait: "E", prompt: "I start conversations.", reverse: false },
  { id: 22, trait: "A", prompt: "I am not interested in other people's problems.", reverse: true },
  { id: 23, trait: "C", prompt: "I get chores done right away.", reverse: false },
  { id: 24, trait: "N", prompt: "I am easily disturbed.", reverse: false },
  { id: 25, trait: "O", prompt: "I have excellent ideas.", reverse: false },
  { id: 26, trait: "E", prompt: "I have little to say.", reverse: true },
  { id: 27, trait: "A", prompt: "I have a soft heart.", reverse: false },
  { id: 28, trait: "C", prompt: "I often forget to put things back in their proper place.", reverse: true },
  { id: 29, trait: "N", prompt: "I get upset easily.", reverse: false },
  { id: 30, trait: "O", prompt: "I do not have a good imagination.", reverse: true },
  { id: 31, trait: "E", prompt: "I talk to a lot of different people at parties.", reverse: false },
  { id: 32, trait: "A", prompt: "I am not really interested in others.", reverse: true },
  { id: 33, trait: "C", prompt: "I like order.", reverse: false },
  { id: 34, trait: "N", prompt: "I change my mood a lot.", reverse: false },
  { id: 35, trait: "O", prompt: "I am quick to understand things.", reverse: false },
  { id: 36, trait: "E", prompt: "I don't like to draw attention to myself.", reverse: true },
  { id: 37, trait: "A", prompt: "I take time out for others.", reverse: false },
  { id: 38, trait: "C", prompt: "I shirk my duties.", reverse: true },
  { id: 39, trait: "N", prompt: "I have frequent mood swings.", reverse: false },
  { id: 40, trait: "O", prompt: "I use difficult words.", reverse: false },
  { id: 41, trait: "E", prompt: "I don't mind being the center of attention.", reverse: false },
  { id: 42, trait: "A", prompt: "I feel others' emotions.", reverse: false },
  { id: 43, trait: "C", prompt: "I follow a schedule.", reverse: false },
  { id: 44, trait: "N", prompt: "I get irritated easily.", reverse: false },
  { id: 45, trait: "O", prompt: "I spend time reflecting on things.", reverse: false },
  { id: 46, trait: "E", prompt: "I am quiet around strangers.", reverse: true },
  { id: 47, trait: "A", prompt: "I make people feel at ease.", reverse: false },
  { id: 48, trait: "C", prompt: "I am exacting in my work.", reverse: false },
  { id: 49, trait: "N", prompt: "I often feel blue.", reverse: false },
  { id: 50, trait: "O", prompt: "I am full of ideas.", reverse: false },
];
