import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import CreateProfile from "@/pages/create-profile";
import SelectProfile from "@/pages/select-profile";
import ProfileView from "@/pages/profile";
import Experiments from "@/pages/experiments";
import StroopTest from "@/pages/stroop-test";
import SchulteTable from "@/pages/schulte-table";
import ADHDQuestionnaire from "@/pages/adhd-questionnaire";
import Testing from "@/pages/testing";
import MunsterbergTest from "@/pages/munsterberg-test";
import NBack from "@/pages/n-back";
import AlphabetGame from "@/pages/alphabet-game";
import CorrectionTest from "@/pages/correction-test";
import MagicForest from "@/pages/magic-forest";
import Calcudoku from "@/pages/calcudoku";
import CountingGame from "@/pages/counting-game";
import SpeedReading from "@/pages/speed-reading";
import Admin from "@/pages/admin";
// New games
import StartTest from "@/pages/start-test";
import AttentionTest from "@/pages/attention-test";
import AuditoryTest from "@/pages/auditory-test";
import FlexibilityTest from "@/pages/flexibility-test";

import ReactionTest from "@/pages/reaction-test";
import SequenceTest from "@/pages/sequence-test";
import TowerOfHanoi from "@/pages/tower-of-hanoi";
import VocabularyTest from "@/pages/vocabulary-test";
import VisualMemoryTest from "@/pages/visual-memory-test";
import PairsTest from "@/pages/pairs-test";
import FlyTest from "@/pages/fly-test";
import AnagramTest from "@/pages/anagram-test";
import MathTest from "@/pages/math-test";
import AnimalSoundTest from "@/pages/animal-sound-test"; // New
import FastNumbers from "@/pages/fast-numbers";
// Login system
import LoginPage from "@/pages/login";
import SuperAdmin from "@/pages/super-admin";
import SchoolDashboard from "@/pages/school-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import { AuthProvider } from "@/lib/auth-store";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";

function PageTracker() {
  const [location] = useLocation();

  useEffect(() => {
    apiRequest("POST", "/api/view", { path: location }).catch(() => { });
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <PageTracker />
      <Switch>
        <Route path="/" component={Welcome} />
        <Route path="/create-profile" component={CreateProfile} />
        <Route path="/adhd-questionnaire" component={ADHDQuestionnaire} />
        <Route path="/testing" component={Testing} />
        <Route path="/select-profile" component={SelectProfile} />
        <Route path="/profile/:id" component={ProfileView} />
        <Route path="/experiments" component={Experiments} />
        <Route path="/stroop-test" component={StroopTest} />
        <Route path="/schulte-table" component={SchulteTable} />
        <Route path="/munsterberg-test" component={MunsterbergTest} />
        <Route path="/n-back" component={NBack} />
        <Route path="/alphabet-game" component={AlphabetGame} />
        <Route path="/correction-test" component={CorrectionTest} />
        <Route path="/magic-forest" component={MagicForest} />
        <Route path="/calcudoku" component={Calcudoku} />
        <Route path="/counting-game" component={CountingGame} />
        <Route path="/speed-reading" component={SpeedReading} />
        <Route path="/admin" component={Admin} />
        {/* Login system */}
        <Route path="/login" component={LoginPage} />
        <Route path="/super-admin" component={SuperAdmin} />
        <Route path="/school-dashboard" component={SchoolDashboard} />
        <Route path="/student-dashboard" component={StudentDashboard} />
        {/* New games */}
        <Route path="/start-test" component={StartTest} />
        <Route path="/attention-test" component={AttentionTest} />
        <Route path="/auditory-test" component={AuditoryTest} />
        <Route path="/flexibility-test" component={FlexibilityTest} />

        <Route path="/reaction-test" component={ReactionTest} />
        <Route path="/sequence-test" component={SequenceTest} />
        <Route path="/tower-of-hanoi" component={TowerOfHanoi} />
        <Route path="/vocabulary-test" component={VocabularyTest} />
        <Route path="/visual-memory-test" component={VisualMemoryTest} />
        <Route path="/pairs-test" component={PairsTest} />
        <Route path="/fly-test" component={FlyTest} />
        <Route path="/anagram-test" component={AnagramTest} />
        <Route path="/math-test" component={MathTest} />
        <Route path="/animal-sound-test" component={AnimalSoundTest} />
        <Route path="/fast-numbers" component={FastNumbers} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
