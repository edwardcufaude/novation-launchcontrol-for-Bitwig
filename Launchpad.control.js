

//This is a very basic Launch Control script
//
//I'm not terribly great at programming so anyone can take over and help
// This is what I know
// The Side Buttons only accept red
// The status MIDI for the Factory templates come in at status B00 to B15 User templates start at B00 to B07, Factory B08 to B15
// Colours have been setup in LaunchControl_constants and match Launchpad script
// data1 for Sidebuttons are 114 to 117, you can use SideButton.UP / DOWN / LEFT / RIGHT
// Factory preset one has been mapped to Macros on bottom and parameters on top
// Transport controls for the pads have been setup and next/prev parameter page
// Rainbow indicators work for both
// Tried to add light script, can't get it to work, so I just stuck a MIDI out to light them up when pressed.
// Most code has been copied from Launchpad and Launchey scripts
 

loadAPI(1);

host.defineController("Novation", "Launch Control", "1.0", "05e2b820-177e-11e4-8c21-0800200c9a66");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Launch Control"], ["Launch Control"]);

//Load LaunchControl constants containing the status for pages and other constant variables
load("LaunchControl_constants.js");
load("LaunchControl_common.js");

canScrollTracksUp = false;
canScrollTracksDown = false;
canScrollScenesUp = false;
canScrollScenesDown = false;
canScrollLeft = false;
canScrollRight = false;
canScrollUp = false;
canScrollDown = false;
mixerAlignedGrid = false;

function init()
{
	// Setup MIDI in stuff
   host.getMidiInPort(0).setMidiCallback(onMidi);
   noteInput = host.getMidiInPort(0).createNoteInput("Launch Control", "80????", "90????");
   noteInput.setShouldConsumeEvents(false);
   
	// create a transport section for on Factory Preset 1
	transport = host.createTransportSection();
	
	// create a trackbank (arguments are tracks, sends, scenes)
	trackBank = host.createTrackBankSection(NUM_TRACKS, NUM_SENDS, NUM_SCENES);

	// create a cursor device to move about using the arrows
   cursorTrack = host.createCursorTrackSection(0, 8);
   cursorDevice = host.createCursorDevice();
   masterTrack = host.createMasterTrackSection(0);

   primaryDevice = cursorTrack.getPrimaryDevice();
   
   // Make CCs 21-48 freely mappable for all 16 Channels
   userControls = host.createUserControlsSection((HIGHEST_CC - LOWEST_CC + 1)*16);

   for(var i=LOWEST_CC; i<=HIGHEST_CC; i++)
   {
			for (var j=1; j<=16; j++) {

				 // Create the index variable c
				 var c = i - LOWEST_CC + (j-1) * (HIGHEST_CC-LOWEST_CC+1);
				 // Set a label/name for each userControl
				 userControls.getControl(c).setLabel("CC " + i + " - Channel " + j);
			}
   }
   
   trackBank.addCanScrollTracksUpObserver(function(canScroll)
   {
      canScrollTracksUp = canScroll;
   });

   trackBank.addCanScrollTracksDownObserver(function(canScroll)
   {
      canScrollTracksDown = canScroll;
   });

   cursorDevice.addCanSelectNextObserver(function(canScroll)
   {
      canScrollScenesUp = canScroll;
   });

   cursorDevice.addCanSelectPreviousObserver(function(canScroll)
   {
     canScrollScenesDown = canScroll;
   });

   // Call the update indicators function so that those rainbow indicators display
   updateIndications();
}

// This updates the indicators (rainbow things) 
function updateIndications()
{
   for(var i=0; i<8; i++)
   {
      primaryDevice.getParameter(i).setIndication(incontrol_knobs);
      userControls.getControl(i).setIndication(!incontrol_knobs);
      primaryDevice.getMacro(i).getAmount().setIndication(incontrol_mix);
      trackBank.getTrack(i).getVolume().setIndication(!incontrol_mix);
   }
}

var incontrol_mix = true;
var incontrol_knobs = true;
var incontrol_pads = true;

function onMidi(status, data1, data2)
{
	
	printMidi(status, data1, data2);
	println(MIDIChannel(status));
	
	// make Pads green when pressed
	if(status < 71 || status > 75) {
		sendMidi(status, data1, 60);
	}
	//If Side Buttons make red when pressed // Doesn't work for some reason
	else if (data2 == 127) {
		sendMidi(status, 0x + data1, Colour.RED_FULL);
	}
	//Turn Off Side Buttons if not pressed.
	else if (data2 == 0) {
		sendMidi(status, 0x + data1, Colour.OFF);	
	}
	
	if (status == FactoryPagePads.Page1 && data2 == 127)
    {
      // Factory Preset 1 = Transport Controls and Parameter selector
      if (data1 == 9)
      {
	  	transport.stop();
      }
      else if (data1 == 10)
      {
        transport.play();			     
      }
      else if (data1 == 11)
      {
        transport.record(); 
      }
      else if (data1 == 12)
      {
		transport.toggleWriteArrangerAutomation();
      }
      else if (data1 == 25)
      {
		transport.toggleLoop();
      }
      else if (data1 == 26)
      {
		transport.toggleClick(); 
      }
	  else if (data1 == 27)
      {
         primaryDevice.previousParameterPage();
		 updateIndications();
      }
	  else if (data1 == 28)
      {
         primaryDevice.nextParameterPage();
		 updateIndications();
      }
    }
	 // Factory Preset 1 = Setup knobs to control Macros and Parameters
	if (status == FactoryPageKnobs.Page1){
		if (data1 >= 21 && data1 <= 28)
		{
			var knobIndexTop = data1 - 21;
			primaryDevice.getParameter(knobIndexTop).set(data2, 128);
		}
		else if (data1 >= 41 && data1 <= 48)
		{
			var knobIndexBottom = data1 - 41;
			primaryDevice.getMacro(knobIndexBottom).getAmount().set(data2, 128);
		}
	}
	// If not on a Factory Bank already assigned then make the knobs assignable and assign those arrows on the right of the control to move around the tracks and devices on the screen
	if (isChannelController(status))
	{
		if (data2 == 127)

		{
			if (data1 == SideButton.UP)
			{
				if (incontrol_mix)
				{
					cursorTrack.selectPrevious();
				}
				else
				{
					trackBank.scrollTracksPageUp();
				}
			}
			else if (data1 == SideButton.DOWN)
			{
				if (incontrol_mix)
				{
					cursorTrack.selectNext();
				}
				else
				{
					trackBank.scrollTracksPageDown();
				}
			}
			else if (data1 == SideButton.LEFT)
			{
				if (incontrol_mix)
				{
					cursorDevice.selectPrevious();
					primaryDevice.switchToDevice(DeviceType.ANY, ChainLocation.PREVIOUS)
				}
				else
				{
					trackBank.scrollTracksPageUp();
				}
			}
			else if (data1 == SideButton.RIGHT)
			{
				if (incontrol_mix)
				{
					cursorDevice.selectNext();
					primaryDevice.switchToDevice(DeviceType.ANY, ChainLocation.NEXT)
				}
				else
				{
					trackBank.scrollTracksPageDown();
				}
			}
		}
		// Make rest of the knobs not in the Factory bank freely assignable
		else if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC)
		{
			var index = data1 - LOWEST_CC + (HIGHEST_CC * MIDIChannel(status));
			userControls.getControl(index).set(data2, 128);
		}
		
   }
   updateOutputState();
}

//Works
function exit()
{
   sendMidi(0xB8, 0x00, 0x00);
}

function updateScrollButtons()
{
   setSideLED(0, canScrollUp ? Colour.RED_FULL : Colour.RED_FULL);
   setSideLED(1, canScrollDown ? Colour.RED_FULL : Colour.OFF);
   setSideLED(2, canScrollLeft ? Colour.RED_FULL : Colour.OFF);
   setSideLED(3, canScrollRight ? Colour.RED_FULL : Colour.OFF);
};

function setSideLED(index, colour)
{
   sendMidi(0xb8, (72 + index), colour);
}

function updateOutputState()
{
   clear();

   canScrollUp = mixerAlignedGrid ? canScrollScenesUp : canScrollTracksUp;
   canScrollDown = mixerAlignedGrid ? canScrollScenesDown : canScrollTracksDown;
   canScrollLeft = mixerAlignedGrid ? canScrollScenesUp : canScrollTracksUp;
   canScrollRight = mixerAlignedGrid ? canScrollScenesDown : canScrollTracksDown;

   updateScrollButtons();
};
