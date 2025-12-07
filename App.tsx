
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GamePhase, InventoryItem, GrammarSubmission, ItemType } from './types';
import { INITIAL_INVENTORY, INITIAL_SENTENCE, PARSED_SENTENCE_TOKENS, DAY_7_SENTENCE, DAY_7_TOKENS } from './constants';
import { Inventory } from './components/Inventory';
import { DialogueBox } from './components/DialogueBox';
import { GrammarPaper } from './components/GrammarPaper';
import { ScienceVideo } from './components/ScienceVideo';
import { WalkingSegment } from './components/WalkingSegment';
import { HallwaySegment } from './components/HallwaySegment';
import { LibraryWalkSegment } from './components/LibraryWalkSegment';
import { MusicWalkSegment } from './components/MusicWalkSegment';
import { LobbySegment } from './components/LobbySegment';
import { gradePaperWithGemini, generateNightEvent } from './services/geminiService';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.START_SCREEN);
  const [day, setDay] = useState(1);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [teacherDialogue, setTeacherDialogue] = useState<string>("");
  const [teacherName, setTeacherName] = useState<string>("Mrs. Grim");
  const [showDialogue, setShowDialogue] = useState(false);
  const [gradingResult, setGradingResult] = useState<{grade: string, feedback: string} | null>(null);
  const [nightText, setNightText] = useState("");
  const [journalEntry, setJournalEntry] = useState("");
  const [showBlood, setShowBlood] = useState(false); 
  const [dunkCount, setDunkCount] = useState(0);
  const [artColor, setArtColor] = useState<string>('white');
  const [showTheEnd, setShowTheEnd] = useState(false);
  
  const videoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bloodTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Audio Logic ---

  const speakDialogue = useCallback((text: string, speaker: string) => {
      // Cancel previous speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.pitch = 1;
      utterance.rate = 1;
      utterance.volume = 1;

      switch (speaker) {
          case "Mrs. Grim":
              utterance.pitch = 0.6; 
              utterance.rate = 0.8;
              break;
          case "Mr. Snickerdoodle":
              utterance.pitch = 1.6; 
              utterance.rate = 1.3;
              break;
          case "Principal":
              utterance.pitch = 0.5; 
              utterance.rate = 0.9;
              break;
          case "Mrs. Turpancki":
              utterance.pitch = 1.2; 
              utterance.rate = 1.1; 
              break;
          case "Mrs. Isaiah":
              utterance.pitch = 1.3; 
              utterance.rate = 0.8; 
              break;
          case "Classmate":
          case "Kid":
              utterance.pitch = 1.1;
              utterance.rate = 1.1;
              break;
          case "Friend 1":
              utterance.pitch = 1.1;
              utterance.rate = 1.2; 
              break;
          case "Bully":
              utterance.pitch = 0.4; 
              utterance.rate = 0.9;
              break;
          case "Mr. Tharnett":
              utterance.pitch = 0.8;
              utterance.rate = 0.95;
              break;
          case "Pinky":
              utterance.pitch = 1.8;
              utterance.rate = 0.8;
              break;
          case "Ms. Palette":
              utterance.pitch = 1.4;
              utterance.rate = 1.1;
              break;
          case "Mr. Mitch":
              utterance.pitch = 0.7;
              utterance.rate = 1.2; // Fast, sporty
              break;
          case "Nurse":
              utterance.pitch = 1.5;
              utterance.rate = 0.7; // Sweet but slow/creepy
              break;
          case "Corrupted Student 99":
              utterance.pitch = 0.2;
              utterance.rate = 0.8;
              break;
          case "Student 99":
          case "Student 99 (Thought)":
              utterance.pitch = 1.0;
              utterance.rate = 1.0;
              break;
          default:
              break;
      }

      window.speechSynthesis.speak(utterance);
  }, []);

  const playJumpscareSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc1 = ctx.createOscillator();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < ctx.sampleRate * 2; i++) { output[i] = Math.random() * 2 - 1; }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, ctx.currentTime); 
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(100, ctx.currentTime);
        osc1.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
        osc1.connect(gain);
        noise.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        noise.start();
        osc1.stop(ctx.currentTime + 2);
        noise.stop(ctx.currentTime + 2);
    } catch (e) { console.error(e); }
  };

  const playCorruptedMusic = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        // Distorted melody
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 1);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 2);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 3);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        
        osc.start();
        osc.stop(ctx.currentTime + 10);
      } catch (e) { console.error(e); }
  }

  useEffect(() => {
      if (showDialogue && teacherDialogue) {
          speakDialogue(teacherDialogue, teacherName);
      }
  }, [showDialogue, teacherDialogue, teacherName, speakDialogue]);

  // --- Handlers ---

  const handleStartGame = () => {
    setDay(1);
    setPhase(GamePhase.INTRO_DIALOGUE);
    setTeacherName("Mrs. Grim");
    setTeacherDialogue("Welcome, students. Sit down. Silence. Take out your pencils.");
    setShowDialogue(true);
    setShowTheEnd(false);
  };

  const triggerAccusation = () => {
    if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
    setPhase(GamePhase.SCIENCE_ACCUSATION);
    setTeacherName("Classmate");
    setTeacherDialogue("Mr. SnickleDoodle is weird...");
    setShowDialogue(true);
  };

  const handleDialogueNext = () => {
    window.speechSynthesis.cancel();

    switch (phase) {
      case GamePhase.INTRO_DIALOGUE:
        setTeacherDialogue("Today we are reviewing basic grammar. I expect perfection. Nothing less will be tolerated in my classroom.");
        setPhase(GamePhase.CLASSROOM_LESSON);
        break;
      case GamePhase.CLASSROOM_LESSON:
        setTeacherDialogue("Here is your assignment. Complete it immediately. Do not make mistakes.");
        setTimeout(() => {
            setShowDialogue(false);
            setPhase(GamePhase.GRAMMAR_TASK);
        }, 2000);
        break;
      case GamePhase.GRADING_RESULT:
         if (day === 1) setPhase(GamePhase.NIGHT_NOTE_READ);
         else {
            setPhase(GamePhase.NIGHT_TRANSITION);
            loadNightEvent();
         }
         break;
      case GamePhase.SCIENCE_INTRO:
         if (teacherDialogue.includes("Hand in")) {
             setTeacherDialogue("Good. Now take your seat. We are watching a video about the human eye.");
         } else {
             setPhase(GamePhase.SCIENCE_VIDEO);
             setTeacherDialogue("");
             setShowDialogue(false);
             videoTimeoutRef.current = setTimeout(() => triggerAccusation(), 8000); 
         }
         break;
      case GamePhase.SCIENCE_ACCUSATION:
          if (teacherDialogue === "Mr. SnickleDoodle is weird...") {
             setTeacherName("Mr. Snickerdoodle");
             setTeacherDialogue("WHO SAID THAT!?");
          } else if (teacherDialogue === "WHO SAID THAT!?") {
              setTeacherName("Classmate");
              setTeacherDialogue("It was YOU! Student 99!");
          } else if (teacherDialogue.includes("Student 99")) {
              setTeacherName("Mr. Snickerdoodle");
              setTeacherDialogue("Detention. Tonight. Don't be late.");
          } else {
              setPhase(GamePhase.NIGHT_NOTE_READ);
          }
          break;
      case GamePhase.PRINCIPAL_OFFICE:
          if (teacherDialogue.includes("What the Heck?")) {
              setTeacherName("Principal");
              setTeacherDialogue("Language buddy boy.");
          } else if (teacherDialogue === "Language buddy boy.") {
              setTeacherName("Principal");
              setTeacherDialogue("Why were you there last night?");
          } else if (teacherDialogue === "Why were you there last night?") {
              setTeacherName("Student 99");
              setTeacherDialogue("Because Mrs. Turpancki uses her room for speech lessons All day.");
          } else if (teacherDialogue.includes("Mrs. Turpancki")) {
              setTeacherName("Principal");
              setTeacherDialogue("From now on I want you in the afternoon.");
          } else if (teacherDialogue.includes("afternoon")) {
              setPhase(GamePhase.AFTERNOON_SPEECH);
              setTeacherName("Mrs. Turpancki");
              setTeacherDialogue("Let me fix you up.");
          }
          break;
      case GamePhase.AFTERNOON_SPEECH:
          setPhase(GamePhase.JUMPSCARE_SNICKERDOODLE);
          playJumpscareSound();
          setShowDialogue(false);
          break;
      case GamePhase.BULLY_ENCOUNTER:
          if (teacherDialogue.includes("Hey nerd")) {
              setTeacherName("Student 99");
              setTeacherDialogue("You shut up!");
          } else if (teacherDialogue === "You shut up!") {
              setTeacherName("Student 99");
              setTeacherDialogue("Not like your the one who's sandwhiches is his dention.");
          } else if (teacherDialogue.includes("sandwhiches")) {
               setTeacherName("Bully");
               setTeacherDialogue("*Picks you up*");
          } else if (teacherDialogue === "*Picks you up*") {
               setTeacherName("Student 99");
               setTeacherDialogue("I'm not so sorry?");
          } else if (teacherDialogue === "I'm not so sorry?") {
               setTeacherName("Mr. Snickerdoodle");
               setTeacherDialogue("Bully in my classroom now!");
          } else {
               setPhase(GamePhase.NIGHT_4_NOTE);
          }
          break;
      case GamePhase.MRS_GRIM_NO_REACTION:
           if (teacherDialogue === "Give me your paper.") {
               setTeacherName("Mrs. Grim");
               setTeacherDialogue("You're such a bad student.");
           } else if (teacherDialogue === "You're such a bad student.") {
               setTeacherName("Student 99");
               setTeacherDialogue("What did I do?");
           } else if (teacherDialogue === "What did I do?") {
               setTeacherName("Mrs. Grim");
               setTeacherDialogue("*Shows the paper to the whole class: NO. NO. NO.*");
           } else if (teacherDialogue.includes("whole class")) {
               setTeacherName("Mrs. Grim");
               setTeacherDialogue("You just wrote no!");
           } else if (teacherDialogue === "You just wrote no!") {
               setTeacherName("Student 99");
               setTeacherDialogue("What the?");
           } else if (teacherDialogue === "What the?") {
               setTeacherName("Mrs. Grim");
               setTeacherDialogue("You're in for lunch detention.");
           } else {
               setPhase(GamePhase.LUNCH_CONVERSATION);
               setTeacherName("Student 99");
               setTeacherDialogue("Yo, What if 98xx 2 came out.");
           }
           break;
      case GamePhase.LUNCH_CONVERSATION:
           if (teacherDialogue === "Yo, What if 98xx 2 came out.") {
               setTeacherName("Friend 1");
               setTeacherDialogue("That would be sick!");
           } else if (teacherDialogue === "That would be sick!") {
               setTeacherName("Mrs. Isaiah");
               setTeacherDialogue("Hmmm, Aren't you supposed to be at Table 10.");
           } else if (teacherDialogue === "Hmmm, Aren't you supposed to be at Table 10.") {
               setTeacherName("Student 99");
               setTeacherDialogue("Mrs. Isaiah please.");
           } else if (teacherDialogue === "Mrs. Isaiah please.") {
               setTeacherName("Mrs. Isaiah");
               setTeacherDialogue("Table 10 now!");
           } else {
               setPhase(GamePhase.LUNCH_DETENTION_TASK);
               setJournalEntry("");
               startBloodTimer();
           }
           break;
      case GamePhase.NIGHT_5_INTRO:
          if (teacherDialogue.includes("I wanna know")) {
              setPhase(GamePhase.LIBRARY_WALK);
              setShowDialogue(false);
          }
          break;
      case GamePhase.DAY_6_SNICKERDOODLE_INTRO:
          if (teacherDialogue === "You're evil!") {
              setTeacherName("Mr. Snickerdoodle");
              setTeacherDialogue("What do you mean?");
          } else if (teacherDialogue === "What do you mean?") {
              setTeacherName("Student 99");
              setTeacherDialogue("Get the principal I'll show you 2 it's too disturbing to talk about.");
          } else if (teacherDialogue.includes("disturbing")) {
              setPhase(GamePhase.DAY_6_PRINCIPAL_OFFICE);
              setTeacherName("Mr. Snickerdoodle");
              setTeacherDialogue("This trouble maker wanted to show us something.");
          }
          break;
      case GamePhase.DAY_6_PRINCIPAL_OFFICE:
          if (teacherDialogue.includes("trouble maker")) {
              setTeacherName("Principal");
              setTeacherDialogue("Oh, Ok.");
          } else if (teacherDialogue === "Oh, Ok.") {
              setTeacherName("Student 99");
              setTeacherDialogue("Follow me!");
          } else if (teacherDialogue === "Follow me!") {
              setPhase(GamePhase.DAY_6_WALK_TO_LIBRARY);
              setShowDialogue(false);
          }
          break;
      case GamePhase.DAY_6_LIBRARY_EMPTY:
          if (teacherDialogue.includes("nothing on the smartboard")) {
              setTeacherName("Mr. Snickerdoodle");
              setTeacherDialogue("You were saying.");
          } else if (teacherDialogue === "You were saying.") {
              setTeacherName("Student 99");
              setTeacherDialogue("I saw Bully face with no eyes on the smartboard.");
          } else if (teacherDialogue.includes("Bully face")) {
              setTeacherName("Principal");
              setTeacherDialogue("How would you see the library if all classrooms only go once every 7 days.");
          } else if (teacherDialogue.includes("every 7 days")) {
              setTeacherName("Student 99");
              setTeacherDialogue("Fine I came here last night.");
          } else if (teacherDialogue.includes("last night")) {
              setTeacherName("Mr. Snickerdoodle");
              setTeacherDialogue("This kid, Meet us here at night.");
          } else {
              setPhase(GamePhase.NIGHT_6_INTRO);
              setDay(6);
              setTeacherName("Student 99");
              setTeacherDialogue("Why is no body here yet.");
          }
          break;
      case GamePhase.NIGHT_6_INTRO:
          if (teacherDialogue === "Why is no body here yet.") {
              setTeacherName("Student 99 (Thought)");
              setTeacherDialogue("Maybe its them.");
          } else {
              setPhase(GamePhase.NIGHT_6_MUSIC_WALK);
              setShowDialogue(false);
          }
          break;
      case GamePhase.NIGHT_SURVIVAL:
         setDay(prev => prev + 1);
         setPhase(GamePhase.START_SCREEN); 
         break;
      case GamePhase.DAY_7_THARNETT_INTRO:
          if (teacherDialogue.includes("Welcome class")) {
              setTeacherName("Kid");
              setTeacherDialogue("Mrs. Steen was the nicest teacher ever.");
          } else if (teacherDialogue.includes("nicest teacher")) {
              setTeacherName("Mr. Tharnett");
              setTeacherDialogue("Seems like we got a new face in here.");
          } else if (teacherDialogue.includes("new face")) {
              setTeacherName("Student 99");
              setTeacherDialogue("I'm not new I'm just not trying to be a math teacher. More like a NBA player but you know were in our senior year.");
          } else if (teacherDialogue.includes("NBA player")) {
              setTeacherName("Mr. Tharnett");
              setTeacherDialogue("Well, class today we have a movie I want to show you. Its called pinky.");
          } else {
              setPhase(GamePhase.DAY_7_PINKY_MOVIE);
              setTeacherName("Pinky");
              setTeacherDialogue("I am going to warn you.");
          }
          break;
      case GamePhase.DAY_7_PINKY_MOVIE:
          if (teacherDialogue === "I am going to warn you.") {
              setTeacherName("Mr. Tharnett");
              setTeacherDialogue("What the.");
          } else if (teacherDialogue === "What the.") {
              setTeacherName("Student 99");
              setTeacherDialogue("I'm out.");
          } else {
              setPhase(GamePhase.DAY_7_HALLWAY_ESCAPE);
              setTeacherName("Student 99");
              setTeacherDialogue("I'm coming back when Mrs. Steen is here.");
          }
          break;
      case GamePhase.DAY_7_HALLWAY_ESCAPE:
          // Go to Grim
          setPhase(GamePhase.DAY_7_GRIM_SUFFIX_INTRO);
          setTeacherName("Mrs. Grim");
          setTeacherDialogue("We're going to take a test about what word in this is not a suffix but still changes the word sequence.");
          break;
      case GamePhase.DAY_7_GRIM_SUFFIX_INTRO:
          setShowDialogue(false);
          setPhase(GamePhase.DAY_7_GRIM_SUFFIX_TASK);
          break;
      case GamePhase.DAY_8_ART_INTRO:
          setPhase(GamePhase.DAY_8_PAINTING);
          setTeacherDialogue("Mix the colors. Paint the portrait. Don't disappoint me.");
          setShowDialogue(false);
          break;
      case GamePhase.DAY_8_HORROR_REVEAL:
          // Should generally not reach here due to timeout, but if clicked fast
          break;
      case GamePhase.NIGHT_8_LUNCH_WALK:
          // Handled by WalkingSegment completion
          break;
      case GamePhase.DAY_9_HALLWAY_BULLY:
          if (teacherDialogue.includes("Sorry")) {
              setTeacherName("Student 99");
              setTeacherDialogue("Why now when threr is 1 day left of school.");
          } else if (teacherDialogue.includes("Why now")) {
              setTeacherName("Bully");
              setTeacherDialogue("I have been bleeding bad in the hostpital so I realized that I can do that to other people.");
          } else if (teacherDialogue.includes("bleeding bad")) {
              setTeacherName("Student 99");
              setTeacherDialogue("Ok.");
          } else {
              setPhase(GamePhase.DAY_9_GRIM_CLASS_WAIT);
              setTeacherName("Classmate");
              setTeacherDialogue("She is 10 minutes late.");
          }
          break;
      case GamePhase.DAY_9_GRIM_CLASS_WAIT:
          if (teacherDialogue === "She is 10 minutes late.") {
              setTeacherName("Student 99");
              setTeacherDialogue("Wait for her.");
          } else if (teacherDialogue === "Wait for her.") {
              setTeacherName("Classmate");
              setTeacherDialogue("I'm out.");
          } else if (teacherDialogue === "I'm out.") {
              setPhase(GamePhase.DAY_9_INK_RUN); // Visual trigger
              setTeacherName("Student 99");
              setTeacherDialogue("Run!!!!!!");
          } else {
              setDay(10);
              setPhase(GamePhase.DAY_10_GYM_INTRO);
              setTeacherName("Mr. Mitch");
              setTeacherDialogue("I set up a trampoline so you can all dunk.");
          }
          break;
      case GamePhase.DAY_10_GYM_INTRO:
          if (teacherDialogue.includes("set up a trampoline")) {
              setTeacherName("Student 99");
              setTeacherDialogue("I can not dunk.");
          } else if (teacherDialogue === "I can not dunk.") {
              setTeacherName("Mr. Mitch");
              setTeacherDialogue("Looks like we have student 99 going up first.");
          } else {
              setPhase(GamePhase.DAY_10_DUNK_TASK);
              setDunkCount(0);
              setShowDialogue(false);
          }
          break;
      case GamePhase.DAY_10_INJURY:
           if (teacherDialogue === "Your hands.") {
               setTeacherName("Student 99");
               setTeacherDialogue("There bleeding.");
           } else if (teacherDialogue === "There bleeding.") {
               setTeacherName("Mr. Mitch");
               setTeacherDialogue("Lets go get you a paper towel.");
           } else {
               setPhase(GamePhase.NIGHT_10_NURSE_INTRO);
               setTeacherName("Student 99");
               setTeacherDialogue("Yo, Nurse.");
           }
           break;
      case GamePhase.NIGHT_10_NURSE_INTRO:
           if (teacherDialogue === "Yo, Nurse.") {
               setTeacherName("Nurse");
               setTeacherDialogue("Yes darling.");
           } else if (teacherDialogue === "Yes darling.") {
               setTeacherName("Student 99");
               setTeacherDialogue("My hand is bleeding.");
           } else if (teacherDialogue === "My hand is bleeding.") {
               setTeacherName("Nurse");
               setTeacherDialogue("A knife would help.");
           } else if (teacherDialogue === "A knife would help.") {
               // Slash effect logic here if needed
               playJumpscareSound();
               setTeacherName("Student 99");
               setTeacherDialogue("My hand!");
           } else if (teacherDialogue === "My hand!") {
               setTeacherName("Nurse");
               setTeacherDialogue("Theres more were that came from.");
           } else {
               setPhase(GamePhase.NIGHT_10_SURVIVAL_QTE);
               setShowDialogue(false);
           }
           break;
      case GamePhase.NIGHT_10_TRANSFORMATION:
           if (teacherDialogue === "Nurse your stronger than me.") {
               setTeacherName("Corrupted Student 99");
               setTeacherDialogue("But Corrupted is better.");
           } else {
               setPhase(GamePhase.GAME_OVER);
           }
           break;
      default:
        break;
    }
  };

  const startBloodTimer = () => {
      bloodTimeoutRef.current = setTimeout(() => {
          setShowBlood(true);
          setTimeout(() => {
              setPhase(GamePhase.NIGHT_5_INTRO);
              setShowBlood(false);
              setDay(5);
              setTeacherName("Student 99 (Thought)");
              setTeacherDialogue("Even though I don't have detention I wanna know what's going on.");
              setShowDialogue(true);
          }, 3000); 
      }, 6000);
  };

  const loadNightEvent = async () => {
      setNightText("Loading night sequence...");
      const text = await generateNightEvent(day);
      setNightText(text);
      setPhase(GamePhase.NIGHT_SURVIVAL);
  };

  const handlePaperSubmit = async (submission: GrammarSubmission) => {
    // Day 1 Logic
    setPhase(GamePhase.GRADING_WAIT);
    setTeacherDialogue("Let me see what you have written...");
    setShowDialogue(true);
    const result = await gradePaperWithGemini(INITIAL_SENTENCE, submission, PARSED_SENTENCE_TOKENS);
    setGradingResult(result);
    setTeacherDialogue(`... ${result.grade}. ${result.feedback}`);
    setPhase(GamePhase.GRADING_RESULT);
  };
  
  const handleGrimSuffixSubmit = (submission: GrammarSubmission) => {
      // Day 7 Logic
      const targetId = submission.singleWordId;
      if (targetId !== null && DAY_7_TOKENS[targetId].cleanText === "speak") {
          // Success
          setPhase(GamePhase.NIGHT_NOTE_READ); // Reuse note read for "Night 7" intro
          setShowDialogue(false);
      } else {
          // Fail
          setPhase(GamePhase.DAY_7_GRIM_FAILURE);
          playJumpscareSound();
          setTimeout(() => {
              setPhase(GamePhase.GAME_OVER);
          }, 4000);
      }
  };

  const handleNoteClick = () => {
      if (day === 4) {
          setPhase(GamePhase.NIGHT_4_JOURNAL);
          setJournalEntry("");
      } else if (day === 7) {
          setPhase(GamePhase.NIGHT_7_LOBBY_SEARCH);
      } else if (day === 8) {
          setPhase(GamePhase.NIGHT_8_LUNCH_WALK);
      } else {
          setPhase(GamePhase.NIGHT_JOURNAL_ENTRY);
          setJournalEntry("");
      }
  };

  const handleJournalSubmit = () => {
      if (day === 1) {
          setDay(2);
          setPhase(GamePhase.SCIENCE_INTRO);
          setTeacherName("Mr. Snickerdoodle");
          setTeacherDialogue("Welcome to Science. Hand in your papers.");
          setShowDialogue(true);
      } else if (day === 2) {
          setPhase(GamePhase.EMPTY_CLASSROOM_EXPLORE);
      }
  };

  const handleJournalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (day === 4) {
          setJournalEntry(prev => prev + "No. ");
          if (journalEntry.length > 50) {
              setTimeout(() => {
                setDay(5);
                setPhase(GamePhase.MRS_GRIM_NO_REACTION);
                setTeacherName("Mrs. Grim");
                setTeacherDialogue("Give me your paper.");
                setShowDialogue(true);
              }, 1000);
          }
      } else {
          setJournalEntry(e.target.value);
      }
  };

  const handleEnding = () => {
      setDay(3);
      setPhase(GamePhase.PRINCIPAL_OFFICE);
      setTeacherName("Student 99 (Thought)");
      setTeacherDialogue("What the Heck? was on the board last night.");
      setShowDialogue(true);
  };
  
  const handleLockerOpen = () => {
      setPhase(GamePhase.BULLY_ENCOUNTER);
      setTeacherName("Bully");
      setTeacherDialogue("Hey nerd, Your the one nerd that's a bad kid.");
      setShowDialogue(true);
  };

  const handleLibraryDoor = () => {
      if (phase === GamePhase.DAY_6_WALK_TO_LIBRARY) {
          setPhase(GamePhase.DAY_6_LIBRARY_EMPTY);
          setTeacherName("Student 99");
          setTeacherDialogue("... There's nothing on the smartboard.");
          setShowDialogue(true);
      } else {
          setPhase(GamePhase.LIBRARY_REVEAL);
          setTimeout(() => {
              setDay(6);
              setPhase(GamePhase.DAY_6_SNICKERDOODLE_INTRO);
              setTeacherName("Student 99");
              setTeacherDialogue("You're evil!");
              setShowDialogue(true);
          }, 5000);
      }
  };
  
  const handleMusicDoor = () => {
      setPhase(GamePhase.NIGHT_6_MUSIC_REVEAL);
      setTimeout(() => {
          // Transition directly to Day 7
          setDay(7);
          setPhase(GamePhase.DAY_7_THARNETT_INTRO);
          setTeacherName("Mr. Tharnett");
          setTeacherDialogue("Welcome class I will be your math teacher for 1 month because Mrs. Steen is out.");
          setShowDialogue(true);
      }, 5000);
  }

  const handleTapeFound = () => {
      setInventory(prev => [...prev, {
          id: 'vhs-1',
          type: ItemType.VHS_TAPE,
          description: 'A dark, unmarked VHS tape.',
          icon: '📼'
      }]);
  };

  const handleTheaterEnter = () => {
      setPhase(GamePhase.NIGHT_7_THEATER_END);
      playCorruptedMusic();
      setTimeout(() => {
          // Start Day 8
          setDay(8);
          setPhase(GamePhase.DAY_8_ART_INTRO);
          setTeacherName("Ms. Palette");
          setTeacherDialogue("Welcome to Art. I am Ms. Palette. Today we paint.");
          setShowDialogue(true);
      }, 10000);
  };

  const handleArtMix = (color: string) => {
      if (color === 'purple') {
          // Success? Or just spooky change
          setArtColor('purple');
          setTimeout(() => {
              playJumpscareSound();
              setPhase(GamePhase.DAY_8_HORROR_REVEAL);
              setShowDialogue(false); // Hide dialogue during jumpscare
          }, 2000);
      }
  };
  
  const handleInkHeal = () => {
      setPhase(GamePhase.NIGHT_10_TRANSFORMATION);
      setTeacherName("Student 99");
      setTeacherDialogue("Nurse your stronger than me.");
      setShowDialogue(true);
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
         if (phase === GamePhase.START_SCREEN) handleStartGame();
         else if (phase === GamePhase.NIGHT_NOTE_READ || phase === GamePhase.NIGHT_4_NOTE) handleNoteClick();
         else if (phase === GamePhase.SCIENCE_VIDEO) triggerAccusation();
      }
      
      // Dunk logic
      if (phase === GamePhase.DAY_10_DUNK_TASK && e.key.toLowerCase() === 'e') {
          setDunkCount(prev => prev + 1);
      }

      // Fake QTE logic
      if (phase === GamePhase.NIGHT_10_SURVIVAL_QTE && e.key.toLowerCase() === 'e') {
          // Do nothing, futile
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [phase]);

  // Dunk completion check
  useEffect(() => {
      if (phase === GamePhase.DAY_10_DUNK_TASK && dunkCount >= 50) {
          setPhase(GamePhase.DAY_10_INJURY);
          setTeacherName("Mr. Mitch");
          setTeacherDialogue("Your hands.");
          setShowDialogue(true);
      }
  }, [dunkCount, phase]);
  
  // Fake QTE Timer
  useEffect(() => {
      if (phase === GamePhase.NIGHT_10_SURVIVAL_QTE) {
          const timer = setTimeout(() => {
              setPhase(GamePhase.NIGHT_10_INK_CHOICE);
          }, 7000);
          return () => clearTimeout(timer);
      }
  }, [phase]);
  
  // Day 8 Jumpscare Transition
  useEffect(() => {
      if (phase === GamePhase.DAY_8_HORROR_REVEAL) {
          const timer = setTimeout(() => {
              setPhase(GamePhase.NIGHT_NOTE_READ);
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [phase]);

  useEffect(() => {
      if (phase === GamePhase.JUMPSCARE_SNICKERDOODLE) {
          const timer = setTimeout(() => {
              setDay(4);
              setPhase(GamePhase.HALLWAY_WALK);
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [phase]);
  
  // End Game Timer
  useEffect(() => {
      if (phase === GamePhase.GAME_OVER) {
          const timer = setTimeout(() => {
              setShowTheEnd(true);
          }, 10000);
          return () => clearTimeout(timer);
      }
  }, [phase]);

  // --- Visuals ---
  const TharnettVisual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-orange-200 rounded-lg border-4 border-orange-900 relative shadow-2xl overflow-hidden">
             {/* Balding head */}
             <div className="absolute top-0 left-0 right-0 h-4 bg-orange-900"></div>
             {/* Glasses */}
             <div className="absolute top-12 left-6 w-12 h-8 border-2 border-black rounded bg-blue-100/50"></div>
             <div className="absolute top-12 right-6 w-12 h-8 border-2 border-black rounded bg-blue-100/50"></div>
             <div className="absolute top-14 left-1/2 -translate-x-1/2 w-4 h-1 bg-black"></div>
             {/* Tie */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-24 bg-red-700"></div>
        </div>
        <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
            MR. THARNETT
        </div>
    </div>
  );

  const MrsGrimVisual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-800 rounded-full border-4 border-black relative shadow-2xl overflow-hidden">
            <div className="absolute top-8 left-8 w-8 h-8 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-8 w-8 h-8 bg-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-2 bg-white rounded-full"></div>
            <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay"></div>
        </div>
        <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
            MRS. GRIM
        </div>
    </div>
  );
  
  const MrSnickerdoodleVisual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-green-900 rounded-full border-4 border-yellow-600 relative shadow-2xl overflow-hidden">
            <div className="absolute -top-4 left-0 right-0 h-16 bg-gray-300 rounded-full opacity-80"></div>
            <div className="absolute top-10 left-10 w-10 h-10 bg-white rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-black rounded-full"></div></div>
            <div className="absolute top-10 right-10 w-6 h-6 bg-white rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-black rounded-full"></div></div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-4 bg-black rounded-full skew-x-12"></div>
        </div>
        <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
            MR. SNICKERDOODLE
        </div>
    </div>
  );

  const PrincipalVisual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-200 rounded-full border-4 border-gray-900 relative shadow-2xl overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-black"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-16 bg-white"></div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rotate-45"></div>
            <div className="absolute top-14 left-10 w-10 h-2 bg-black"></div>
            <div className="absolute top-14 right-10 w-10 h-2 bg-black"></div>
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-16 h-1 bg-black"></div>
        </div>
        <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
            THE PRINCIPAL
        </div>
    </div>
  );

  const TurpanckiVisual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-pink-100 rounded-full border-4 border-pink-300 relative shadow-2xl overflow-visible">
            <div className="absolute -top-6 -left-4 -right-4 h-32 bg-yellow-700 rounded-full -z-10"></div>
            <div className="absolute top-12 left-8 w-4 h-4 bg-black rounded-full"></div>
            <div className="absolute top-12 right-8 w-4 h-4 bg-black rounded-full"></div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-4 bg-red-400 rounded-full border border-red-500"></div>
            <div className="absolute top-24 -right-12 w-24 h-10 bg-pink-100 border border-gray-400 rotate-45 rounded-full overflow-hidden">
                <div className="absolute top-0 left-4 w-12 h-12 bg-red-900/50 rounded-full blur-md"></div>
                <div className="absolute top-4 right-8 w-1 h-8 bg-red-800 rounded-full opacity-80"></div>
            </div>
        </div>
        <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
            MRS. TURPANCKI
        </div>
    </div>
  );
  
  const BullyVisual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-blue-200 rounded-md border-4 border-blue-900 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-10 bg-blue-900"></div>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-4 bg-blue-900 rounded-b"></div>
            <div className="absolute top-16 left-10 w-10 h-2 bg-black rotate-12"></div>
            <div className="absolute top-16 right-10 w-10 h-2 bg-black -rotate-12"></div>
            <div className="absolute top-20 left-12 w-4 h-4 bg-black rounded-full"></div>
            <div className="absolute top-20 right-12 w-4 h-4 bg-black rounded-full"></div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-16 h-8 border-t-4 border-black rounded-t-full"></div>
        </div>
        <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
            BULLY
        </div>
    </div>
  );

  const IsaiahVisual = () => (
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-purple-200 rounded-full border-4 border-purple-900 relative shadow-2xl overflow-hidden">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-gray-400 rounded-full -z-10 border-2 border-gray-600"></div>
             <div className="absolute top-16 left-8 w-10 h-10 border-4 border-black rounded-full"></div>
             <div className="absolute top-16 right-8 w-10 h-10 border-4 border-black rounded-full"></div>
             <div className="absolute top-20 left-1/2 -translate-x-1/2 w-4 h-1 bg-black"></div>
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-12 h-1 bg-black"></div>
          </div>
          <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
              MRS. ISAIAH
          </div>
      </div>
  );

  const PaletteVisual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-pink-200 rounded-full border-4 border-pink-500 relative shadow-2xl overflow-hidden">
             {/* Paint splatters */}
             <div className="absolute top-2 left-4 w-6 h-6 bg-red-500 rounded-full blur-sm opacity-80"></div>
             <div className="absolute bottom-4 right-6 w-8 h-8 bg-blue-500 rounded-full blur-sm opacity-80"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-4 border-green-500 rounded-full opacity-20"></div>
             {/* Face */}
             <div className="absolute top-16 left-10 w-8 h-8 bg-black rounded-full"></div>
             <div className="absolute top-16 right-10 w-8 h-8 bg-black rounded-full"></div>
             <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-10 h-2 bg-black rotate-12"></div>
        </div>
        <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
            MS. PALETTE
        </div>
    </div>
  );
  
  const ArtJumpscare = () => (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full animate-shake flex items-center justify-center">
              <div className="absolute inset-0 bg-red-900 mix-blend-multiply animate-pulse"></div>
              <div className="w-[80vw] h-[80vw] bg-white rounded-full border-8 border-black flex flex-col items-center justify-center relative">
                  <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-black rounded-full animate-bounce">
                      <div className="absolute inset-0 bg-red-600 rounded-full blur-md opacity-50"></div>
                  </div>
                  <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-black rounded-full animate-bounce delay-75">
                      <div className="absolute inset-0 bg-red-600 rounded-full blur-md opacity-50"></div>
                  </div>
                  <div className="absolute bottom-1/4 w-2/3 h-48 bg-black rounded-[50%] animate-pulse overflow-hidden border-4 border-red-500">
                      <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-50"></div>
                  </div>
              </div>
          </div>
      </div>
  );

  const MitchVisual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-orange-300 rounded-full border-4 border-orange-600 relative shadow-2xl overflow-hidden">
             {/* Headband */}
             <div className="absolute top-6 left-0 right-0 h-4 bg-blue-600"></div>
             {/* Whistle */}
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-400 rounded-full border-2 border-black"></div>
             {/* Eyes */}
             <div className="absolute top-16 left-12 w-4 h-4 bg-black rounded-full"></div>
             <div className="absolute top-16 right-12 w-4 h-4 bg-black rounded-full"></div>
        </div>
        <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
            MR. MITCH
        </div>
    </div>
  );
  
  const NurseVisual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-full border-4 border-red-500 relative shadow-2xl overflow-hidden">
             {/* Hat */}
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-10 bg-white border-2 border-red-500 flex items-center justify-center">
                 <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">+</div>
             </div>
             {/* Eyes - covered by mask? No, creepy eyes */}
             <div className="absolute top-20 left-10 w-10 h-6 bg-black rounded-full"></div>
             <div className="absolute top-20 right-10 w-10 h-6 bg-black rounded-full"></div>
             {/* Mask */}
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-16 bg-blue-200 opacity-80 border-t-2 border-white"></div>
        </div>
        <div className="mt-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-white/20">
            NURSE
        </div>
    </div>
  );

  const CorruptedStudent99Visual = () => (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500 animate-shake">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-black rounded-full border-4 border-red-900 relative shadow-2xl overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/tv-noise.png')] opacity-50 animate-pulse"></div>
             {/* Glitch Eyes */}
             <div className="absolute top-16 left-10 w-8 h-8 bg-red-600 rounded-full animate-bounce"></div>
             <div className="absolute top-16 right-10 w-8 h-8 bg-red-600 rounded-full animate-bounce delay-75"></div>
             {/* Smile */}
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-20 h-10 border-b-8 border-white rounded-full"></div>
        </div>
        <div className="mt-4 bg-red-900/80 text-black px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-black animate-pulse">
            CORRUPTED 99
        </div>
    </div>
  );

  const SmartBoardHorror = () => (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90">
          <div className="relative w-3/4 aspect-video bg-white shadow-[0_0_100px_rgba(255,255,255,0.2)] border-8 border-gray-400 flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-blue-100/10 animate-pulse"></div>
               <div className="absolute top-10 right-20 flex flex-col items-center animate-bounce">
                    <span className="text-6xl font-horror text-red-600">BULLY</span>
                    <span className="text-4xl text-red-600">⬇</span>
               </div>
               <div className="relative w-64 h-64 bg-blue-200 rounded-full border-4 border-blue-900 flex flex-col items-center">
                   <div className="absolute top-0 left-0 right-0 h-12 bg-blue-900"></div>
                   <div className="absolute top-20 left-12 w-12 h-12 bg-black rounded-full shadow-inner"></div>
                   <div className="absolute top-20 right-12 w-12 h-12 bg-black rounded-full shadow-inner"></div>
                   <div className="absolute top-24 left-16 w-4 h-32 bg-red-800 opacity-90 rounded-b-full"></div>
                   <div className="absolute top-24 right-16 w-4 h-32 bg-red-800 opacity-90 rounded-b-full"></div>
                   <div className="absolute bottom-8 w-20 h-10 bg-black rounded-full"></div>
                   <div className="absolute -bottom-10 w-32 h-10 bg-red-900 rounded-full blur-md"></div>
               </div>
          </div>
      </div>
  );

  const SnickerdoodleJumpscare = () => (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
          <div className="w-[120vw] h-[120vw] bg-green-900 rounded-full border-8 border-yellow-600 relative animate-shake flex items-center justify-center">
            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-white rounded-full flex items-center justify-center"><div className="w-8 h-8 bg-black rounded-full"></div></div>
            <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-white rounded-full flex items-center justify-center"><div className="w-4 h-4 bg-black rounded-full"></div></div>
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-32 bg-black rounded-full border-4 border-red-500 animate-pulse"></div>
          </div>
      </div>
  );

  const BloodDropOverlay = () => (
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 w-8 h-8 bg-red-800 rounded-full animate-bounce opacity-80 blur-sm"></div>
          <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-red-900 rounded-full animate-pulse opacity-90 blur-sm delay-75"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-red-700 rounded-full opacity-80 mix-blend-multiply blur-md delay-150"></div>
          <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay animate-pulse"></div>
      </div>
  );
  
  const GlitchGrimVisual = () => (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
        <div className="relative w-96 h-96 animate-shake">
            <div className="absolute inset-0 bg-gray-800 rounded-full border-4 border-white opacity-50"></div>
            <div className="absolute top-10 left-0 w-full h-10 bg-white/20 -skew-x-12 translate-x-4"></div>
            <div className="absolute bottom-20 left-0 w-full h-4 bg-red-500/50 skew-x-12 -translate-x-4"></div>
            <div className="absolute top-24 left-20 w-16 h-16 bg-white rounded-full animate-pulse">
                <div className="absolute top-4 left-4 w-4 h-4 bg-black rounded-full"></div>
            </div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full animate-bounce">
                <div className="absolute bottom-4 right-4 w-4 h-4 bg-black rounded-full"></div>
            </div>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-32 h-20 bg-black overflow-hidden border border-white">
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] animate-pulse"></div>
            </div>
            <div className="absolute inset-0 mix-blend-difference bg-red-900/20"></div>
        </div>
        <div className="absolute bottom-20 text-white font-mono text-2xl tracking-[1rem] animate-pulse">
            E R R O R
        </div>
    </div>
  );

  const MusicRoomBackground = () => (
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-purple-900/20 flex flex-col">
              <div className="h-2/3 bg-gray-900 relative border-b-8 border-purple-800">
                   <div className="absolute inset-0 flex justify-center items-center opacity-20">
                       <span className="text-9xl text-white">♪</span>
                   </div>
                   <div className="absolute bottom-0 left-10 w-40 h-32 bg-yellow-900 rounded-t-lg"></div>
                   <div className="absolute bottom-0 right-10 w-20 h-48 bg-gray-600 rounded-t-full"></div>
              </div>
              <div className="h-1/3 bg-[#1a1005]"></div>
          </div>
      </div>
  );

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden font-sans">
      
      {/* Background - Grim Room / Standard Classroom */}
      { (phase === GamePhase.INTRO_DIALOGUE || phase === GamePhase.CLASSROOM_LESSON || phase === GamePhase.GRAMMAR_TASK || phase === GamePhase.GRADING_WAIT || phase === GamePhase.GRADING_RESULT || phase === GamePhase.MRS_GRIM_NO_REACTION || phase === GamePhase.NIGHT_5_INTRO || phase === GamePhase.DAY_7_GRIM_SUFFIX_INTRO || phase === GamePhase.DAY_7_GRIM_SUFFIX_TASK || phase === GamePhase.DAY_9_GRIM_CLASS_WAIT) && (
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#e5e7eb] flex flex-col">
                <div className="h-2/3 bg-[#d1d5db] relative border-b-8 border-[#9ca3af]">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-3/5 bg-[#1a2e1a] border-8 border-[#5c3a21] shadow-xl rounded-sm p-4 overflow-hidden">
                        <p className="text-white/20 font-handwriting text-2xl absolute top-4 left-4">Grammar is Order.</p>
                        <p className="text-white/20 font-handwriting text-2xl absolute bottom-4 right-4">Silence is Golden.</p>
                        <p className="text-white/80 font-handwriting text-4xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            NOUNS<br/>ARTICLES<br/>PREPOSITIONS
                        </p>
                    </div>
                </div>
                <div className="h-1/3 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-amber-800"></div>
            </div>
            {phase !== GamePhase.NIGHT_5_INTRO && <MrsGrimVisual />}
        </div>
      )}

      {/* Background - Mr. Tharnett (Math Room) */}
      { (phase === GamePhase.DAY_7_THARNETT_INTRO || phase === GamePhase.DAY_7_PINKY_MOVIE) && (
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#fef3c7] flex flex-col">
                <div className="h-2/3 bg-[#fde68a] relative border-b-8 border-[#fbbf24]">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-3/5 bg-black border-8 border-gray-600 shadow-xl rounded-sm p-4 overflow-hidden flex items-center justify-center">
                         {phase === GamePhase.DAY_7_PINKY_MOVIE ? (
                             <div className="text-pink-500 font-mono text-center animate-pulse">
                                 <h1 className="text-4xl">PINKY.mp4</h1>
                                 <p className="mt-4">"I AM GOING TO WARN YOU"</p>
                             </div>
                         ) : (
                            <p className="text-white/50 font-mono text-4xl text-center">
                                MATH IS TRUTH<br/>2 + 2 = 4
                            </p>
                         )}
                    </div>
                </div>
                <div className="h-1/3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-800"></div>
            </div>
            {phase !== GamePhase.DAY_7_PINKY_MOVIE && <TharnettVisual />}
        </div>
      )}

      {/* Background - Science Classroom */}
      { (phase === GamePhase.SCIENCE_INTRO || phase === GamePhase.SCIENCE_ACCUSATION || phase === GamePhase.DAY_6_SNICKERDOODLE_INTRO) && (
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#e0f2fe] flex flex-col">
                <div className="h-2/3 bg-[#bae6fd] relative border-b-8 border-[#7dd3fc]">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-3/5 bg-white border-8 border-gray-400 shadow-xl rounded-sm p-4 overflow-hidden">
                         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
                         <p className="text-blue-900/80 font-mono text-4xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            OBSERVE<br/>HYPOTHESIZE<br/>OBEY
                        </p>
                    </div>
                </div>
                <div className="h-1/3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-700"></div>
            </div>
            <MrSnickerdoodleVisual />
        </div>
      )}
      
      {/* Background - Art Classroom */}
      { (phase === GamePhase.DAY_8_ART_INTRO || phase === GamePhase.DAY_8_PAINTING || phase === GamePhase.DAY_8_HORROR_REVEAL) && (
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-pink-100 flex flex-col">
                <div className="h-2/3 bg-pink-200 relative border-b-8 border-pink-400">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-3/5 bg-white border-8 border-yellow-700 shadow-xl rounded-sm p-4 overflow-hidden flex items-center justify-center">
                         {/* The Living Portrait */}
                         <div className={`w-32 h-40 bg-gray-200 rounded-full border-2 border-black relative transition-all duration-1000 ${phase === GamePhase.DAY_8_HORROR_REVEAL ? 'scale-150 shadow-[0_0_50px_red]' : ''}`}>
                             <div className={`absolute top-12 left-8 w-4 h-4 bg-black rounded-full ${phase === GamePhase.DAY_8_HORROR_REVEAL ? 'bg-red-600 animate-pulse' : ''}`}></div>
                             <div className={`absolute top-12 right-8 w-4 h-4 bg-black rounded-full ${phase === GamePhase.DAY_8_HORROR_REVEAL ? 'bg-red-600 animate-pulse' : ''}`}></div>
                             {/* Mouth */}
                             <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-10 h-2 bg-black rounded-full transition-all duration-500 ${phase === GamePhase.DAY_8_HORROR_REVEAL ? 'h-8 w-8 rounded-full bg-black animate-ping' : ''}`}></div>
                             {/* Tears */}
                             {phase === GamePhase.DAY_8_HORROR_REVEAL && (
                                 <>
                                    <div className="absolute top-16 left-8 w-2 h-10 bg-red-600 rounded-full animate-bounce"></div>
                                    <div className="absolute top-16 right-8 w-2 h-10 bg-red-600 rounded-full animate-bounce delay-100"></div>
                                 </>
                             )}
                         </div>
                    </div>
                </div>
                <div className="h-1/3 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-amber-900"></div>
            </div>
            {phase !== GamePhase.DAY_8_HORROR_REVEAL && <PaletteVisual />}
            
            {/* Color Mixing UI */}
            {phase === GamePhase.DAY_8_PAINTING && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-4">
                    <button onClick={() => setArtColor('red')} className="w-16 h-16 rounded-full bg-red-600 border-4 border-white shadow-lg hover:scale-110 transition-transform"></button>
                    <button onClick={() => setArtColor('blue')} className="w-16 h-16 rounded-full bg-blue-600 border-4 border-white shadow-lg hover:scale-110 transition-transform"></button>
                    <button onClick={() => handleArtMix('purple')} className="px-6 py-2 bg-purple-800 text-white font-bold rounded hover:bg-purple-700">MIX PURPLE</button>
                </div>
            )}
        </div>
      )}
      
      {/* Background - Gym */}
      { (phase === GamePhase.DAY_10_GYM_INTRO || phase === GamePhase.DAY_10_DUNK_TASK || phase === GamePhase.DAY_10_INJURY) && (
          <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-orange-50 flex flex-col">
                 <div className="h-2/3 bg-orange-100 relative border-b-8 border-orange-300">
                      {/* Basketball Hoop */}
                      <div className="absolute top-10 right-20 w-32 h-24 bg-transparent border-4 border-red-600 z-10">
                          <div className="w-full h-full border-2 border-white opacity-50 bg-white/20"></div>
                      </div>
                      <div className="absolute top-32 right-24 w-24 h-2 bg-orange-600"></div>
                      
                      {/* Trampoline */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-16 bg-black border-t-4 border-gray-400 rounded-t-full"></div>
                 </div>
                 <div className="h-1/3 bg-[#e8aea1] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
             </div>
             <MitchVisual />
          </div>
      )}

      {/* Background - Principal Office */}
      { (phase === GamePhase.PRINCIPAL_OFFICE || phase === GamePhase.DAY_6_PRINCIPAL_OFFICE) && (
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gray-300 flex flex-col">
                <div className="h-2/3 bg-gray-400 relative border-b-8 border-gray-600">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/p6.png')] opacity-20"></div>
                </div>
                <div className="h-1/3 bg-red-900 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
            </div>
            <PrincipalVisual />
        </div>
      )}
      
      {/* Background - Empty Library (Day 6) */}
      { (phase === GamePhase.DAY_6_LIBRARY_EMPTY || phase === GamePhase.NIGHT_6_INTRO) && (
         <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-gray-200 flex flex-col">
                 <div className="h-2/3 bg-gray-300 relative border-b-8 border-gray-500">
                     <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-3/5 bg-white shadow-lg border-8 border-gray-400"></div>
                 </div>
                 <div className="h-1/3 bg-[#3f2e18]"></div>
             </div>
             {phase === GamePhase.DAY_6_LIBRARY_EMPTY && (
                <>
                  <div className="absolute left-1/4 top-1/2"><MrSnickerdoodleVisual /></div>
                  <div className="absolute right-1/4 top-1/2"><PrincipalVisual /></div>
                </>
             )}
         </div>
      )}

      {/* Background - Mrs. Turpancki Room */}
      { phase === GamePhase.AFTERNOON_SPEECH && (
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-pink-50 flex flex-col">
                <div className="h-2/3 bg-pink-100 relative border-b-8 border-pink-300">
                     <p className="text-pink-300/50 font-sans text-9xl absolute top-10 left-1/2 -translate-x-1/2 font-bold">SPEECH</p>
                </div>
                <div className="h-1/3 bg-teal-800"></div>
            </div>
            <TurpanckiVisual />
        </div>
      )}
      
      {/* Background - Bully Encounter (Day 4 & 9) */}
      { (phase === GamePhase.BULLY_ENCOUNTER || phase === GamePhase.DAY_9_HALLWAY_BULLY) && (
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#1e293b] flex flex-col">
                <div className="h-2/3 bg-gray-300 relative border-b-8 border-gray-400">
                     <div className="absolute inset-0 flex justify-around px-10 items-end">
                         <div className="w-16 h-48 bg-gray-500 border border-gray-600"></div>
                         <div className="w-16 h-48 bg-gray-500 border border-gray-600"></div>
                         <div className="w-16 h-48 bg-gray-500 border border-gray-600"></div>
                         <div className="w-16 h-48 bg-gray-500 border border-gray-600"></div>
                     </div>
                </div>
                <div className="h-1/3 bg-[#3f2e18]"></div>
            </div>
            <BullyVisual />
        </div>
      )}

      {/* Background - Lunchroom */}
      { phase === GamePhase.LUNCH_CONVERSATION && (
          <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-yellow-50 flex flex-col">
                  <div className="h-2/3 bg-yellow-100 relative border-b-8 border-yellow-200">
                      <div className="absolute top-20 left-10 w-40 h-20 bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-gray-400 font-bold">MENU</div>
                  </div>
                  <div className="h-1/3 bg-blue-100"></div>
              </div>
              <IsaiahVisual />
          </div>
      )}
      
      {/* Night 6 Music Room */}
      { phase === GamePhase.NIGHT_6_MUSIC_REVEAL && (
          <>
            <MusicRoomBackground />
            <GlitchGrimVisual />
          </>
      )}
      
      {/* Night 10 Nurse Room */}
      { (phase === GamePhase.NIGHT_10_NURSE_INTRO || phase === GamePhase.NIGHT_10_SURVIVAL_QTE || phase === GamePhase.NIGHT_10_INK_CHOICE) && (
          <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-white flex flex-col">
                  <div className="h-2/3 bg-gray-100 relative border-b-8 border-gray-300">
                      <div className="absolute top-10 left-10 w-24 h-24 bg-red-100 border-2 border-red-200 flex items-center justify-center">
                          <span className="text-4xl text-red-500 font-bold">+</span>
                      </div>
                  </div>
                  <div className="h-1/3 bg-teal-100"></div>
              </div>
              <NurseVisual />
          </div>
      )}
      
      {/* Night 10 Transformation */}
      { phase === GamePhase.NIGHT_10_TRANSFORMATION && (
          <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
              <CorruptedStudent99Visual />
          </div>
      )}

      {/* Jumpscare */}
      { phase === GamePhase.JUMPSCARE_SNICKERDOODLE && <SnickerdoodleJumpscare /> }
      
      {/* Art Jumpscare */}
      { phase === GamePhase.DAY_8_HORROR_REVEAL && <ArtJumpscare /> }

      {/* Science Video */}
      {phase === GamePhase.SCIENCE_VIDEO && <ScienceVideo />}
      
      {/* Library Reveal */}
      {phase === GamePhase.LIBRARY_REVEAL && <SmartBoardHorror />}
      
      {/* Day 7 Failure Jumpscare (Bloody Screen) */}
      {phase === GamePhase.DAY_7_GRIM_FAILURE && (
          <div className="absolute inset-0 z-[100] bg-red-900 flex items-center justify-center animate-pulse">
              <h1 className="text-9xl font-horror text-black animate-shake">I SEE YOU</h1>
          </div>
      )}
      
      {/* Day 9 Ink Run Visual */}
      {phase === GamePhase.DAY_9_INK_RUN && (
          <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
               <h1 className="text-9xl text-white font-horror animate-shake mb-8">RUN!!!</h1>
               <div className="w-full h-32 bg-black overflow-hidden relative">
                   <div className="absolute inset-0 bg-gray-800 animate-pulse"></div>
               </div>
               {setTimeout(() => {
                   setDay(10);
                   setPhase(GamePhase.DAY_9_GRIM_CLASS_WAIT); // Triggers next day in dialogue handler logic or direct setPhase
                   // Actually we want to go to Day 10 Gym after this brief scare
                   setPhase(GamePhase.DAY_10_GYM_INTRO);
                   setTeacherName("Mr. Mitch");
                   setTeacherDialogue("I set up a trampoline so you can all dunk.");
                   setShowDialogue(true);
               }, 3000) && null}
          </div>
      )}

      {/* Start Screen */}
      {phase === GamePhase.START_SCREEN && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-4 text-center">
          <h1 className="text-6xl md:text-8xl font-horror text-red-600 mb-4 animate-pulse-slow tracking-wider">
            100 NIGHTS
          </h1>
          <h2 className="text-2xl md:text-4xl font-sans font-light text-gray-400 mb-2">
            IN A SCHOOL
          </h2>
          <h3 className="text-xl md:text-2xl font-mono text-red-500 mb-12">
            PART 1
          </h3>
          <button 
            onClick={handleStartGame}
            className="px-12 py-4 bg-red-900 hover:bg-red-700 text-white font-bold text-xl rounded shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all transform hover:scale-105"
          >
            ENTER CLASSROOM
          </button>
          <div className="mt-4 text-gray-500 text-sm">[Press Enter]</div>
        </div>
      )}

      {/* Note Screen (Generic for Days) */}
      {(phase === GamePhase.NIGHT_NOTE_READ || phase === GamePhase.NIGHT_4_NOTE) && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 animate-fade-in">
              <h2 className="text-4xl text-gray-500 font-horror mb-8">
                  {day === 2 || day === 4 || day === 8 ? "DETENTION" : day === 7 ? "NIGHT 7" : day === 10 ? "NIGHT 10" : `NIGHT ${day}`}
              </h2>
              <div 
                onClick={handleNoteClick}
                className="bg-[#fefce8] text-black font-handwriting p-8 md:p-12 rotate-2 max-w-md shadow-[0_0_50px_rgba(255,255,255,0.1)] cursor-pointer hover:scale-105 transition-transform relative"
              >
                  <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-red-900/50 blur-sm"></div>
                  <p className="text-3xl font-bold leading-relaxed text-center">
                      {day === 1 && '"Think about what you\'ve done."'}
                      {day === 2 && '"Why did you disrespect the person that helps you?"'}
                      {day === 4 && '"Have you\'ve felt alone in detantion?"'}
                      {day === 7 && '"Find my tape."'}
                      {day === 8 && '"Paint is red..."'}
                  </p>
                  <p className="mt-8 text-sm text-gray-400 text-center font-sans">(Click or Press Enter)</p>
              </div>
          </div>
      )}
      
      {/* Day 10 Dunk Prompt Overlay */}
      {phase === GamePhase.DAY_10_DUNK_TASK && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center z-50">
              <p className="text-white font-mono text-2xl animate-pulse bg-black/50 p-4 rounded">
                  PRESS [E] TO DUNK
              </p>
              <p className="text-red-500 font-bold text-4xl mt-2">{dunkCount} / 50</p>
          </div>
      )}
      
      {/* Night 10 Ink Choice Overlay */}
      {phase === GamePhase.NIGHT_10_INK_CHOICE && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="text-center">
                  <h1 className="text-white text-4xl font-bold mb-8">INK WILL HEAL IT</h1>
                  <button onClick={handleInkHeal} className="px-8 py-4 bg-black border-2 border-white text-white font-mono hover:bg-white hover:text-black transition-colors">
                      [ USE INK ]
                  </button>
              </div>
          </div>
      )}

      {/* Journal Entry Screen (And Lunch Detention) */}
      {(phase === GamePhase.NIGHT_JOURNAL_ENTRY || phase === GamePhase.NIGHT_4_JOURNAL || phase === GamePhase.LUNCH_DETENTION_TASK) && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
               {phase === GamePhase.LUNCH_DETENTION_TASK && showBlood && <BloodDropOverlay />}
               <div className="w-full max-w-2xl h-[70vh] bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] bg-[#f5f5f5] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-8 bottom-0 w-0.5 bg-red-300/50"></div>
                  <div className="bg-gray-800 p-4 text-white flex justify-between items-center z-10">
                      <span>
                          {phase === GamePhase.LUNCH_DETENTION_TASK ? "LUNCH DETENTION - TABLE 10" : `Journal Entry - Night ${day}`}
                      </span>
                      {day !== 4 && phase !== GamePhase.LUNCH_DETENTION_TASK && (
                        <button onClick={handleJournalSubmit} className="text-green-400 hover:text-green-300 font-bold">
                            FINISH
                        </button>
                      )}
                  </div>
                  
                  {phase === GamePhase.LUNCH_DETENTION_TASK ? (
                      <div className="flex-grow p-8 pl-12 text-gray-800 font-handwriting text-2xl leading-10">
                          <p className="mb-4 font-bold">Question: Did you try to skip detention?</p>
                          <textarea 
                             className="w-full h-full bg-transparent resize-none focus:outline-none"
                             placeholder="Start writing..."
                             onChange={() => {}} 
                             style={{
                                backgroundImage: 'linear-gradient(#999 1px, transparent 1px)',
                                backgroundSize: '100% 2.5rem',
                                lineHeight: '2.5rem'
                             }}
                          />
                      </div>
                  ) : (
                    <textarea 
                        className="flex-grow bg-transparent p-8 pl-12 text-gray-800 font-handwriting text-xl resize-none focus:outline-none leading-10"
                        placeholder="Start writing..."
                        value={journalEntry}
                        onChange={handleJournalChange}
                        style={{
                            backgroundImage: 'linear-gradient(#999 1px, transparent 1px)',
                            backgroundSize: '100% 2.5rem',
                            lineHeight: '2.5rem'
                        }}
                    />
                  )}
               </div>
          </div>
      )}

      {/* Walking Segments */}
      {phase === GamePhase.EMPTY_CLASSROOM_EXPLORE && <WalkingSegment onComplete={handleEnding} />}
      {phase === GamePhase.HALLWAY_WALK && <HallwaySegment onLockerOpen={handleLockerOpen} />}
      {phase === GamePhase.DAY_7_HALLWAY_ESCAPE && <HallwaySegment onLockerOpen={() => handleDialogueNext()} />} 
      
      {/* Night 8 Lunch Walk */}
      {phase === GamePhase.NIGHT_8_LUNCH_WALK && (
          <WalkingSegment 
            mode="lunchroom" 
            onComplete={() => {
                setDay(9);
                setPhase(GamePhase.DAY_9_HALLWAY_BULLY);
                setTeacherName("Bully");
                setTeacherDialogue("Sorry for what I have done to you.");
                setShowDialogue(true);
            }} 
          />
      )}

      {(phase === GamePhase.LIBRARY_WALK || phase === GamePhase.DAY_6_WALK_TO_LIBRARY) && <LibraryWalkSegment onDoorOpen={handleLibraryDoor} />}
      {phase === GamePhase.NIGHT_6_MUSIC_WALK && <MusicWalkSegment onDoorOpen={handleMusicDoor} />}
      {phase === GamePhase.NIGHT_7_LOBBY_SEARCH && (
          <LobbySegment 
            onTapeFound={handleTapeFound} 
            onTheaterEnter={handleTheaterEnter} 
            hasTape={inventory.some(i => i.type === ItemType.VHS_TAPE)}
          />
      )}
      
      {/* Night 7 Theater End Screen */}
      {phase === GamePhase.NIGHT_7_THEATER_END && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
               <div className="relative w-full max-w-4xl aspect-video bg-gray-900 shadow-2xl overflow-hidden border-8 border-gray-800">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/tv-noise.png')] animate-pulse opacity-50"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <h1 className="text-white font-mono text-4xl animate-shake">NO SIGNAL</h1>
                    </div>
               </div>
          </div>
      )}

      {/* Game Over / To Be Continued */}
      {phase === GamePhase.GAME_OVER && (
          <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in">
              {!showTheEnd ? (
                  <>
                    <h1 className="text-6xl text-white font-horror mb-4">TO BE CONTINUED...</h1>
                    <p className="text-gray-500 font-mono mb-8">END OF PART 1</p>
                  </>
              ) : (
                  <h1 className="text-8xl text-red-600 font-horror mb-4 animate-pulse">THE END</h1>
              )}
              
              <button 
                onClick={handleStartGame}
                className={`mt-8 text-white border px-6 py-2 hover:bg-white/20 transition-opacity duration-1000 ${showTheEnd ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                  Restart
              </button>
          </div>
      )}

      {/* UI Layers */}
      {phase !== GamePhase.START_SCREEN && 
       phase !== GamePhase.NIGHT_NOTE_READ && 
       phase !== GamePhase.NIGHT_JOURNAL_ENTRY && 
       phase !== GamePhase.SCIENCE_VIDEO && 
       phase !== GamePhase.EMPTY_CLASSROOM_EXPLORE && 
       phase !== GamePhase.GAME_OVER && 
       phase !== GamePhase.JUMPSCARE_SNICKERDOODLE && 
       phase !== GamePhase.HALLWAY_WALK &&
       phase !== GamePhase.NIGHT_4_NOTE &&
       phase !== GamePhase.NIGHT_4_JOURNAL && 
       phase !== GamePhase.LUNCH_DETENTION_TASK &&
       phase !== GamePhase.LIBRARY_WALK &&
       phase !== GamePhase.LIBRARY_REVEAL && 
       phase !== GamePhase.DAY_6_WALK_TO_LIBRARY &&
       phase !== GamePhase.NIGHT_6_MUSIC_WALK && 
       phase !== GamePhase.NIGHT_6_MUSIC_REVEAL && 
       phase !== GamePhase.NIGHT_7_LOBBY_SEARCH &&
       phase !== GamePhase.NIGHT_7_THEATER_END && 
       phase !== GamePhase.DAY_7_GRIM_FAILURE && 
       phase !== GamePhase.NIGHT_8_LUNCH_WALK && 
       phase !== GamePhase.DAY_9_INK_RUN &&
       phase !== GamePhase.NIGHT_10_INK_CHOICE && 
       phase !== GamePhase.NIGHT_10_TRANSFORMATION && 
       phase !== GamePhase.DAY_8_HORROR_REVEAL && (
        <>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-40 pointer-events-none">
                <div className="bg-black/50 text-white px-4 py-2 rounded">
                    Day: {day} / 100
                </div>
            </div>

            {/* Grammar Paper Minigame (Day 1) */}
            {phase === GamePhase.GRAMMAR_TASK && (
                <GrammarPaper 
                    sentence={INITIAL_SENTENCE} 
                    tokens={PARSED_SENTENCE_TOKENS}
                    onSubmit={handlePaperSubmit}
                />
            )}
            
            {/* Grammar Paper Minigame (Day 7) */}
            {phase === GamePhase.DAY_7_GRIM_SUFFIX_TASK && (
                <GrammarPaper 
                    sentence={DAY_7_SENTENCE} 
                    tokens={DAY_7_TOKENS}
                    onSubmit={handleGrimSuffixSubmit}
                    mode="single_word"
                />
            )}

            {/* Dialogue */}
            <DialogueBox 
                speaker={teacherName} 
                text={teacherDialogue} 
                visible={showDialogue} 
                onNext={handleDialogueNext}
            />

            {/* Inventory */}
            <Inventory items={inventory} />
        </>
      )}
      
      {/* Overlay vignette for horror atmosphere */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] z-30"></div>
    </div>
  );
}
