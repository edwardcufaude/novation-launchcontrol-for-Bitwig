A Novation LaunchControl script for BitWig-Studio
================================================

The User-Pages emmit midi events that can be used to midi-learn the knobs and buttons to in Bitwig
the script is based on the work of [eduk](https://github.com/educk)

The Factory-Pages are mapped to the following functions:

Factory-Page 1: 
 * the top row knobs control volume
 * the lower row knobs controle pan
 * the buttons are mapped to Play, Record, Writing Arranger Automation, Loop, Click, Launcher Overdub, Overdub

Factory-Page 2:
 * the top row knobs control send1
 * the lower row knobs controle send2
 * the buttons are mapped to mute

Factory-Page 3: 
 * the left 8 knobs are mapped to Macro Functions
 * the right 8 knobs are mapped to Device Parameters
 * the buttons are mapped to record arm 

Factory-Page 3: 
 * the knobs aren't currently mapped
 * the buttons create an empty clip on the next free slot of the selected Track. The button number is the clip lenght in bars

Since selecting the first few factory-pages can be a bit tricky when the launch-control is handled operated with the left hand (at least for me)
I also added a setting option in the scripts settings dialog that allows to reverse the Page mapping - so page 1 gets page 8, page 2 gets page 7, ...

