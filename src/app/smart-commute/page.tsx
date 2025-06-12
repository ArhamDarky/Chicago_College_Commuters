'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserCircle, LogIn, LogOut, CalendarClock, Brain, Lightbulb, MapPin, Clock, Route, Bus, TrainFront, Footprints, Edit } from 'lucide-react';
import type { ScheduleItem, UserLocation } from '@/types/schedule';
import { ScheduleForm } from '@/components/smart-commute/schedule-form';
import { ScheduleList } from '@/components/smart-commute/schedule-list';
import { User, onAuthStateChanged, signInWithGoogle, signOutUser, loadSchedules, saveSchedules } from '@/lib/firebase';
import { suggestCommute, SuggestCommuteInput, SuggestCommuteOutput } from '@/ai/flows/suggest-commute-flow';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';

const getCurrentDateTimeISO = () => new Date().toISOString();

const getModeIcon = (mode?: string) => {
  switch (mode?.toLowerCase()) {
    case 'bus': return <Bus className="h-4 w-4 text-primary inline mr-1.5" />;
    case 'train': return <TrainFront className="h-4 w-4 text-primary inline mr-1.5" />;
    case 'walk': return <Footprints className="h-4 w-4 text-primary inline mr-1.5" />;
    default: return <Route className="h-4 w-4 text-primary inline mr-1.5" />;
  }
};

export default function SmartCommutePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const [suggestions, setSuggestions] = useState<SuggestCommuteOutput | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualLocationInput, setManualLocationInput] = useState<string>("");
  const [useManualLocation, setUseManualLocation] = useState<boolean>(false);
  const [isFetchingGeoLocation, setIsFetchingGeoLocation] = useState<boolean>(false);

  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Smart Commute - ChiCommute';
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      setLoadingAuth(false);
      if (authUser) {
        setLoadingSchedules(true);
        try {
          const userSchedules = await loadSchedules(authUser.uid);
          setSchedules(userSchedules);
          toast({ title: "Schedules Loaded", description: "Your schedules have been loaded." });
        } catch (error) {
          console.error("Error loading schedules:", error);
          toast({ variant: "destructive", title: "Error Loading Schedules", description: "Could not load your schedules." });
          setSchedules([]); 
        }
        setLoadingSchedules(false);
      } else {
        setSchedules([]);
        setSuggestions(null);
        setUserLocation(null);
        setManualLocationInput("");
        setUseManualLocation(false); 
        setLocationError(null);
      }
    });
    return () => unsubscribe();
  }, [toast]);


  useEffect(() => {
    if (!useManualLocation && user) { 
      if (navigator.geolocation) {
        setIsFetchingGeoLocation(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationError(null);
            setIsFetchingGeoLocation(false);
          },
          (error) => {
            console.error("Error getting user location:", error);
            setLocationError(`Could not get current location: ${error.message}. Try manual entry or check permissions.`);
            setUserLocation(null);
            setIsFetchingGeoLocation(false);
          }
        );
      } else {
        setLocationError("Geolocation is not supported. Please enter your location manually.");
        setUserLocation(null);
        setIsFetchingGeoLocation(false);
      }
    } else {
      setIsFetchingGeoLocation(false); 
      if (useManualLocation) setUserLocation(null);
    }
  }, [useManualLocation, user]); 

  useEffect(() => {
    if (user && !loadingAuth && !loadingSchedules) { 
      saveSchedules(user.uid, schedules)
        .then(() => {
          // console.log("Schedules saved to Firestore.");
        })
        .catch(error => {
          console.error("Error saving schedules to Firestore:", error);
          toast({ variant: "destructive", title: "Error Saving Schedules", description: "Could not save your schedules to the cloud." });
        });
    }
  }, [schedules, user, loadingAuth, loadingSchedules, toast]);


  const handleSignIn = async () => {
    setLoadingAuth(true);
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        toast({ title: "Signed In", description: `Welcome, ${result.user.displayName || 'User'}!` });
      } else {
         toast({ variant: "destructive", title: "Sign In Failed", description: "Could not sign you in. Please try again." });
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast({ variant: "destructive", title: "Sign In Error", description: "An unexpected error occurred during sign in." });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast({ title: "Signed Out", description: "You have been signed out." });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({ variant: "destructive", title: "Sign Out Error", description: "Could not sign you out." });
    }
  };
  
  const handleUseCurrentLocation = () => {
    setUseManualLocation(false); 
  };

  const handleAddOrUpdateSchedule = (scheduleItem: ScheduleItem) => {
    setSchedules(prevSchedules => {
      const existingIndex = prevSchedules.findIndex(s => s.id === scheduleItem.id);
      if (existingIndex > -1) {
        const updatedSchedules = [...prevSchedules];
        updatedSchedules[existingIndex] = scheduleItem;
        return updatedSchedules;
      }
      return [...prevSchedules, scheduleItem];
    });
    setEditingSchedule(null);
    setShowScheduleForm(false);
    toast({ title: "Schedule Updated", description: `"${scheduleItem.name}" has been saved.` });
  };

  const handleEditSchedule = (scheduleItem: ScheduleItem) => {
    setEditingSchedule(scheduleItem);
    setShowScheduleForm(true);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const itemToDelete = schedules.find(s => s.id === scheduleId);
    setSchedules(prevSchedules => prevSchedules.filter(s => s.id !== scheduleId));
    if (editingSchedule?.id === scheduleId) {
        setEditingSchedule(null);
        setShowScheduleForm(false);
    }
    if (itemToDelete) {
      toast({ title: "Schedule Deleted", description: `"${itemToDelete.name}" has been removed.` });
    }
  };

  const handleGetCommuteSuggestions = async () => {
    if (!user) {
      setSuggestionError("Please sign in to get commute suggestions.");
      return;
    }
    if (!schedules.length) {
      setSuggestionError("Please add at least one schedule item to get suggestions.");
      return;
    }
    if (useManualLocation && !manualLocationInput.trim()) {
      setSuggestionError("Please enter your starting address or uncheck 'Use Manual Address'.");
      return;
    }
    if (!useManualLocation && !userLocation && !isFetchingGeoLocation) {
        setSuggestionError("Could not determine your current location. Please try 'Use Current Location' or enter address manually.");
        return;
    }
    if (!useManualLocation && isFetchingGeoLocation) {
        setSuggestionError("Still trying to get your current location. Please wait a moment.");
        return;
    }

    setLoadingSuggestions(true);
    setSuggestionError(null);
    setSuggestions(null);
    try {
      const input: SuggestCommuteInput = {
        schedule: schedules,
        currentDateTime: getCurrentDateTimeISO(),
        currentUserLocation: useManualLocation ? undefined : userLocation || undefined,
        manualOriginAddress: useManualLocation ? manualLocationInput.trim() : undefined,
        preferences: { preferredMode: 'any', maxTransfers: 2 }
      };
      const result = await suggestCommute(input);
      setSuggestions(result);
    } catch (error) {
      console.error("Error getting commute suggestions:", error);
      setSuggestionError(error instanceof Error ? error.message : "Failed to get suggestions.");
    }
    setLoadingSuggestions(false);
  };
  
  if (loadingAuth || (!user && loadingSchedules && typeof window !== 'undefined')) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <UserCircle className="h-16 w-16 text-primary mb-6" />
        <h1 className="text-3xl font-bold text-primary mb-3">Welcome to Smart Commute</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Sign in to save your recurring schedules and get personalized CTA route suggestions.
        </p>
        <Button size="lg" onClick={handleSignIn} disabled={loadingAuth}>
          {loadingAuth ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-5 w-5" />
          )}
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <CalendarClock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-primary">Smart Commute Planner</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
          <div className="text-xs text-muted-foreground text-right sm:text-left w-full">
             Welcome, {user.displayName || 'User'}!
            {!useManualLocation && userLocation && (
              <span className="block sm:inline sm:ml-2">
                <MapPin className="h-3 w-3 inline mr-1 text-green-600" /> Location Acquired
              </span>
            )}
             {useManualLocation && manualLocationInput && (
              <span className="block sm:inline sm:ml-2">
                <Edit className="h-3 w-3 inline mr-1" /> Using Manual Address
              </span>
            )}
             {!useManualLocation && isFetchingGeoLocation && (
              <span className="block sm:inline sm:ml-2">
                <Loader2 className="h-3 w-3 inline mr-1 animate-spin" /> Fetching Location...
              </span>
            )}
          </div>
          <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Your Starting Location</CardTitle>
          <CardDescription>Choose to use your current location or enter an address manually.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button 
              variant="outline" 
              onClick={handleUseCurrentLocation} 
              disabled={isFetchingGeoLocation || (typeof navigator !== 'undefined' && !navigator.geolocation)}
              className="w-full sm:w-auto"
            >
              {isFetchingGeoLocation ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              Use Current Location
            </Button>
            <div className="flex items-center space-x-2 pt-2 sm:pt-0">
              <Label htmlFor="manual-location-switch">Or, use Manual Address:</Label>
              <Switch
                id="manual-location-switch"
                checked={useManualLocation}
                onCheckedChange={setUseManualLocation}
              />
            </div>
          </div>

          {useManualLocation && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="manual-location-input">Starting Address</Label>
              <Input
                id="manual-location-input"
                type="text"
                placeholder="e.g., 123 Main St, Chicago, IL"
                value={manualLocationInput}
                onChange={(e) => setManualLocationInput(e.target.value)}
              />
            </div>
          )}
          
          {!useManualLocation && !isFetchingGeoLocation && userLocation && (
            <Alert variant="default" className="mt-2 border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Location Acquired</AlertTitle>
              <AlertDescription>
                Using your current location (Lat: {userLocation.latitude.toFixed(4)}, Lon: {userLocation.longitude.toFixed(4)}).
              </AlertDescription>
            </Alert>
          )}
          {locationError && !useManualLocation && !isFetchingGeoLocation && (
            <Alert variant="destructive" className="mt-2">
              <MapPin className="h-4 w-4" />
              <AlertTitle>Location Access Issue</AlertTitle>
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Your Schedules</CardTitle>
          <CardDescription>Manage your recurring daily or weekly commitments. Schedules are saved automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingSchedules ? (
             <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading schedules...
            </div>
          ) : showScheduleForm ? (
            <ScheduleForm
              onSubmit={handleAddOrUpdateSchedule}
              initialData={editingSchedule}
              onCancel={() => { setShowScheduleForm(false); setEditingSchedule(null); }}
            />
          ) : (
            <Button onClick={() => { setEditingSchedule(null); setShowScheduleForm(true); }} disabled={!user || loadingSchedules}>
              Add New Schedule Item
            </Button>
          )}
          <Separator className="my-6" />
          <ScheduleList schedules={schedules} onEdit={handleEditSchedule} onDelete={handleDeleteSchedule} />
        </CardContent>
      </Card>
      
      {schedules.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Brain className="mr-2 h-7 w-7 text-primary"/> AI Commute Suggestions
            </CardTitle>
            <CardDescription>
              Get AI-powered commute suggestions based on your schedule and starting location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGetCommuteSuggestions} 
              disabled={!user || loadingSuggestions || schedules.length === 0 || (!useManualLocation && isFetchingGeoLocation)}
            >
              {loadingSuggestions ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Get Commute Suggestions
            </Button>

            {suggestionError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{suggestionError}</AlertDescription>
              </Alert>
            )}

            {loadingSuggestions && (
              <div className="mt-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-2">Generating suggestions...</p>
              </div>
            )}
            
            {suggestions && !loadingSuggestions && (
              <div className="mt-6 space-y-6">
                <h3 className="text-xl font-semibold text-primary">Personalized Commute Plan:</h3>
                {suggestions.dailySuggestions.length > 0 ? (
                  suggestions.dailySuggestions.map((daySuggestion) => (
                    <Card key={daySuggestion.day} className="bg-card shadow-md">
                      <CardHeader className="bg-muted/30 dark:bg-muted/10 p-4">
                        <CardTitle className="text-lg text-primary">{daySuggestion.day}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        {daySuggestion.events.map((eventSuggestion, eventIndex) => (
                          <div key={`${eventSuggestion.eventId}-${eventIndex}`} className="p-3 border border-border/70 dark:border-border/40 rounded-lg bg-background dark:bg-card/80">
                            <h4 className="font-semibold text-lg text-primary">{eventSuggestion.eventName} to {eventSuggestion.destination}</h4>
                            
                            {eventSuggestion.suggestion.summary && (
                              <div className="mt-2 mb-3 p-3 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/60 rounded-md">
                                <p className="text-sm text-blue-800 dark:text-blue-200">{eventSuggestion.suggestion.summary}</p>
                              </div>
                            )}

                            {eventSuggestion.suggestion.totalDuration && <p className="text-sm text-muted-foreground mb-3"><Clock className="inline h-4 w-4 mr-1.5"/>Est. Total Duration: <span className="font-medium">{eventSuggestion.suggestion.totalDuration}</span></p>}
                            
                            <h5 className="font-medium text-md mb-2 mt-4 text-foreground/90">Steps:</h5>
                            {eventSuggestion.suggestion.steps && eventSuggestion.suggestion.steps.length > 0 ? (
                               <ul className="space-y-3 list-none p-0">
                                {eventSuggestion.suggestion.steps.map((step, index) => (
                                  <li key={index} className="p-2 border-b border-border/50 dark:border-border/30 last:border-b-0">
                                    <div className="flex items-center mb-1">
                                      {getModeIcon(step.mode)}
                                      <span className="font-semibold text-md text-primary leading-tight">{step.mode}</span>
                                      {step.line && <Badge variant="secondary" className="ml-1.5 py-0.5 px-1.5 text-xs align-middle">{step.line}</Badge>}
                                      {step.duration && <span className="ml-2 text-xs text-muted-foreground">({step.duration})</span>}
                                    </div>
                                    <p className="text-sm text-foreground/85 ml-7 mb-1">{step.instruction}</p>
                                    
                                    {step.notes && (
                                      <div className="ml-7 mt-1 flex items-start text-xs text-amber-700 dark:text-amber-400">
                                        <Lightbulb className="h-3.5 w-3.5 mr-1.5 mt-0.5 shrink-0" />
                                        <p className="flex-1">{step.notes}</p>
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No detailed steps provided for this event.</p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Alert className="mt-4">
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>No Commute Suggestions</AlertTitle>
                    <AlertDescription>
                      No specific commute suggestions were generated for your current schedule and the selected day. 
                      This could be because:
                      <ul className="list-disc pl-5 mt-2">
                        <li>There are no events scheduled for the day the AI is considering (typically today).</li>
                        <li>The events are too far in the future or already passed.</li>
                        <li>Your starting location might be too far or not specific enough for the AI to generate a relevant public transit route.</li>
                      </ul>
                      Try adding events for today, ensure your starting location is clear, or check back closer to your event time.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}