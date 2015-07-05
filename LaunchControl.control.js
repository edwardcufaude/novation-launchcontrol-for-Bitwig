

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

currentScene = Scenes.FACTORY1;

isPlaying = false;
isRecording = false;
isWritingArrangerAutomation = false;
isLoopActive = false;
isClickActive = false;
isOverdubActive = false;
isLauncherOverdubActive = false;

var hasContent = initArray(0, 64)
selectedChannel = 0
muted = []
armed = []

function init()
{
	// Setup MIDI in stuff
   host.getMidiInPort(0).setMidiCallback(onMidi);
   host.getMidiInPort(0).setSysexCallback(onSysex);

   noteInput = host.getMidiInPort(0).createNoteInput("Launch Control", "80????", "90????");
   noteInput.setShouldConsumeEvents(false);
   
	// create a transport section for on Factory Preset 1
	transport = host.createTransportSection();
   sendMidi( FactoryPagePads.Page1, Pads.PAD1, Colour.YELLOW_LOW );

   transport.addIsPlayingObserver(function(on) {
        sendMidi( FactoryPagePads.Page1, Pads.PAD2,  on ? Colour.LIME : Colour.GREEN_LOW );
        isPlaying = on;
   });
   transport.addIsRecordingObserver(function(on) {
        sendMidi( FactoryPagePads.Page1, Pads.PAD3,  on ? Colour.RED_FULL : Colour.RED_LOW );
        isRecording = on;
   });
   transport.addIsWritingArrangerAutomationObserver(function(on) {
        sendMidi( FactoryPagePads.Page1, Pads.PAD4,  on ? Colour.RED_FULL : Colour.OFF );
        isWritingArrangerAutomation = on;
   });

   transport.addIsLoopActiveObserver(function(on) {
        sendMidi( FactoryPagePads.Page1, Pads.PAD5,  on ? Colour.ORANGE : Colour.OFF );
        isLoopActive = on;
   });
   transport.addClickObserver(function(on) {
        sendMidi( FactoryPagePads.Page1, Pads.PAD6,  on ? Colour.ORANGE : Colour.OFF );
        isClickActive = on;
   });
   transport.addLauncherOverdubObserver(function(on) {
        sendMidi( FactoryPagePads.Page1, Pads.PAD7,  on ? Colour.RED_FULL : Colour.OFF );
        isLauncherOverdubActive = on;
   });

   transport.addOverdubObserver(function(on) {
        sendMidi( FactoryPagePads.Page1, Pads.PAD8,  on ? Colour.ORANGE : Colour.OFF );
        isOverdubActive = on;
   });


	// create a trackbank (arguments are tracks, sends, scenes)
	trackBank = host.createTrackBankSection(NUM_TRACKS, NUM_SENDS, NUM_SCENES);
    for ( var i=0; i<8; i++ ) {
        var track = trackBank.getTrack( i )

        track.getMute().addValueObserver(makeIndexedFunction(i, function(col, on) {
            muted[ col ] = on;
            sendMidi( FactoryPagePads.Page2, PadIndex[col], on ? Colour.ORANGE : Colour.YELLOW_LOW  );
            
        }));
        track.getArm().addValueObserver(makeIndexedFunction(i, function(col, on) {
            armed[ col ] = on;
            sendMidi( FactoryPagePads.Page3, PadIndex[col], on ? Colour.RED_FULL : Colour.LIME );
        }));
        track.addIsSelectedInMixerObserver( makeIndexedFunction(i, function( col, on ) { 
            if ( on ) {
                selectedChannel = col;
            }
        }));
        var clipLauncher = track.getClipLauncher();
        clipLauncher.addHasContentObserver( makeSlotIndexedFunction(i, function( track, slot, on ) {
            hasContent[ track * 8 + slot ] = on;     
        }));
    }

	// create a cursor device to move about using the arrows
   cursorTrack = host.createCursorTrackSection(0, 8);
   cursorDevice = host.createCursorDevice();
   masterTrack = host.createMasterTrackSection(0);

   primaryDevice = cursorTrack.getPrimaryDevice();
   
   // Make CCs 21-48 freely mappable for all 16 Channels
   userControls = host.createUserControlsSection((HIGHEST_CC - LOWEST_CC + 1)*16);

   for(var i=LOWEST_CC; i<=HIGHEST_CC; i++) {
       for (var j=1; j<=16; j++) { 
           // Create the index variable c
           var c = i - LOWEST_CC + (j-1) * (HIGHEST_CC-LOWEST_CC+1);
           // Set a label/name for each userControl
           userControls.getControl(c).setLabel("CC " + i + " - Channel " + j);
       }
   }
   
   trackBank.addCanScrollTracksUpObserver(function(canScroll) {
      canScrollTracksUp = canScroll;
   });

   trackBank.addCanScrollTracksDownObserver(function(canScroll) {
      canScrollTracksDown = canScroll;
   });

   cursorDevice.addCanSelectNextObserver(function(canScroll) {
      canScrollScenesUp = canScroll;
   });

   cursorDevice.addCanSelectPreviousObserver(function(canScroll) {
     canScrollScenesDown = canScroll;
   });

   // Call the update indicators function so that those rainbow indicators display
   updateIndications();
}

// This updates the indicators (rainbow things) 
function updateIndications() {
   for(var i=0; i<8; i++) {
      trackBank.getTrack(i).getVolume().setIndication( currentScene == Scenes.FACTORY1 ) 
      trackBank.getTrack(i).getPan().setIndication( currentScene == Scenes.FACTORY1 ) 

      trackBank.getTrack(i).getSend(0).setIndication( currentScene == Scenes.FACTORY2 ) 
      trackBank.getTrack(i).getSend(1).setIndication( currentScene == Scenes.FACTORY2 ) 

      primaryDevice.getParameter(i).setIndication( currentScene == Scenes.FACTORY3 )
      primaryDevice.getMacro(i).getAmount().setIndication( currentScene == Scenes.FACTORY3 )

      var isUserControl = (currentScene != Scenes.FACTORY1 && currentScene != Scenes.FACTORY2 && currentScene !=Scenes.FACTORY3)
      userControls.getControl(i).setIndication( isUserControl );
   }

   if ( currentScene == Scenes.FACTORY1 ) {
       sendMidi( FactoryPagePads.Page1, Pads.PAD1, Colour.YELLOW_LOW );
       sendMidi( FactoryPagePads.Page1, Pads.PAD2, isPlaying ? Colour.LIME : Colour.GREEN_LOW );
       sendMidi( FactoryPagePads.Page1, Pads.PAD3, isRecording ? Colour.RED_FULL : Colour.RED_LOW );
       sendMidi( FactoryPagePads.Page1, Pads.PAD4, isWritingArrangerAutomation ? Colour.RED_FULL : Colour.OFF );
       sendMidi( FactoryPagePads.Page1, Pads.PAD5, isLoopActive ? Colour.ORANGE : Colour.OFF );
       sendMidi( FactoryPagePads.Page1, Pads.PAD6, isClickActive ? Colour.ORANGE : Colour.OFF );
       sendMidi( FactoryPagePads.Page1, Pads.PAD7, isLauncherOverdubActive ? Colour.RED_FULL : Colour.OFF );
       sendMidi( FactoryPagePads.Page1, Pads.PAD8, isOverdubActive ? Colour.ORANGE : Colour.OFF );

  } else if ( currentScene == Scenes.FACTORY2 ) {
        for ( var i=0; i<8; i++) {
            sendMidi( FactoryPagePads.Page2, PadIndex[i], muted[ i ]  ?  Colour.ORANGE : Colour.YELLOW_LOW  );
        }
 
  } else if ( currentScene == Scenes.FACTORY3 ) {
        for ( var i=0; i<8; i++) {
            sendMidi( FactoryPagePads.Page3, PadIndex[i], armed[ i ]  ?  Colour.RED_FULL : Colour.LIME  );
            
        }
  } else if ( currentScene == Scenes.FACTORY4 ) {
        for ( var i=0; i<8; i++) {
            sendMidi( FactoryPagePads.Page4, PadIndex[i], Colour.RED_LOW );
        }
 }


}

var incontrol_mix = true;
var incontrol_knobs = true;
var incontrol_pads = true;

function onMidi(status, data1, data2)
{
	
	//printMidi(status, data1, data2);
	//println(MIDIChannel(status));
	
	// make Pads green when pressed
	if(status < 71 || status > 75) {
//		sendMidi(status, data1, 60);
	}
	//If Side Buttons make red when pressed // Doesn't work for some reason
	else if (data2 == 127) {
		//sendMidi(status, 0x + data1, Colour.RED_FULL);
	}
	//Turn Off Side Buttons if not pressed.
	else if (data2 == 0) {
		//sendMidi(status, 0x + data1, Colour.OFF);	
	}
	
	if (status == FactoryPagePads.Page1 && data2 == 127) {
        // Factory Preset 1 = Transport Controls and Parameter selector
        handleFactory1Pads( data1 )
    } else if (status == FactoryPagePads.Page2 && data2 == 127) {
        handleFactory2Pads( data1 )
    } else if (status == FactoryPagePads.Page3 && data2 == 127) {
        handleFactory3Pads( data1 )
    } else if (status == FactoryPagePads.Page4 && data2 == 127) {
        handleFactory4Pads( data1 )

    }

	if (status == FactoryPageKnobs.Page1 && isTopRow( data1 )){
		trackBank.getTrack( knobIndex( data1 )).getVolume().set(data2, 128);

	} else if ( status == FactoryPageKnobs.Page1 && isBottomRow( data1 )) {
		trackBank.getTrack( knobIndex( data1 )).getPan().set(data2, 128);

	} else if (status == FactoryPageKnobs.Page2 && isTopRow( data1 )){
		trackBank.getTrack( knobIndex( data1 )).getSend(0).set(data2, 128);

	} else if ( status == FactoryPageKnobs.Page2 && isBottomRow( data1 )) {
		trackBank.getTrack( knobIndex( data1 )).getSend(1).set(data2, 128);

	} else if (status == FactoryPageKnobs.Page3 && isTopRow( data1 )){
        var idx = knobIndex( data1 )
        if ( idx < 4 ) {
	        primaryDevice.getMacro( idx ).getAmount().set(data2, 128);
        } else {
	        primaryDevice.getParameter( idx-4 ).set(data2, 128);
        }

     } else if (status == FactoryPageKnobs.Page3 && isBottomRow( data1 )){
        var idx = knobIndex( data1 )
        if ( idx < 4 ) {
	        primaryDevice.getMacro( idx+4 ).getAmount().set(data2, 128);
        } else {
	        primaryDevice.getParameter( idx ).set(data2, 128);
        }
    } else 

	// If not on a Factory Bank already assigned then make the knobs assignable and assign those arrows on the right of the control to move around the tracks and devices on the screen
	if (isChannelController(status)) {
		if (data2 == 127) {
            if (!incontrol_mix) {
                switch( data1 ) {
                    case SideButton.UP:
                        primaryDevice.previousParameterPage();
		                updateIndications();
                        break;
                    case SideButton.DOWN:
                        primaryDevice.nextParameterPage();
		                updateIndications();
                        break;
                    case SideButton.LEFT:
                        cursorDevice.selectPrevious();
                        primaryDevice.switchToDevice( DeviceType.ANY, ChainLocation.PREVIOUS);
                        updateIndications();
                            break;
                    case SideButton.RIGHT:
                        cursorDevice.selectNext();
                        primaryDevice.switchToDevice( DeviceType.ANY, ChainLocation.NEXT);
                        updateIndications();
                        break;
                }
                    
            } else {
                switch( data1 ){
                    case SideButton.UP:
					    trackBank.scrollTracksPageUp();
                        break;
                    case SideButton.DOWN:
					    trackBank.scrollTracksPageDown();
                        break;
                    case SideButton.LEFT:
					    trackBank.scrollTracksPageLeft();
                        break;
                    case SideButton.RIGHT:
					    trackBank.scrollTracksPageRight();
                        break;
				}
			}
		}
		// Make rest of the knobs not in the Factory bank freely assignable
		else if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
			var index = data1 - LOWEST_CC + (HIGHEST_CC * MIDIChannel(status));
			userControls.getControl(index).set(data2, 128);
		}
		
   }
   updateOutputState();
}

function isTopRow( knob ) {
    return knob >= 21 && knob <= 28;
}

function isBottomRow( knob ) {
    return knob >= 41 && knob <= 48;
}

function knobIndex( knob ) {
    return knob -( isTopRow( knob ) ? 21 : 41 );
}

//Works
function exit() {
   sendMidi(0xB8, 0x00, 0x00);
}

function updateScrollButtons() {
   setSideLED(0, canScrollUp ? Colour.RED_FULL : Colour.RED_FULL);
   setSideLED(1, canScrollDown ? Colour.RED_FULL : Colour.OFF);
   setSideLED(2, canScrollLeft ? Colour.RED_FULL : Colour.OFF);
   setSideLED(3, canScrollRight ? Colour.RED_FULL : Colour.OFF);
}

function setSideLED(index, colour) {
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

function handleFactory1Pads( pad ) {
      switch( pad ) {
        case Pads.PAD1:
	  	    transport.stop();
            break;
        case Pads.PAD2: 
            transport.play();			     
            break;
        case Pads.PAD3: 
            transport.record(); 
            break;
        case Pads.PAD4:
            transport.toggleWriteArrangerAutomation();
            break;
        case Pads.PAD5:
		    transport.toggleLoop();
            break;
        case Pads.PAD6:
		    transport.toggleClick(); 
            break;  
        case Pads.PAD7:
            transport.toggleLauncherOverdub();
            break;
        case Pads.PAD8:
            transport.toggleOverdub();
            break;
      }
}


function handleFactory2Pads( pad ) {
      var idx = PadIndex.indexOf( pad )
      trackBank.getTrack( idx ).getMute().toggle();
}


function handleFactory3Pads( pad ) {
      var idx = PadIndex.indexOf( pad )
      var track = trackBank.getTrack( idx )
      var old = armed[idx]
      track.getArm().toggle();
      if ( !old ) {
        track.selectInMixer()
      }
}

function handleFactory4Pads( pad ) {
    for ( var i=0; i<8; i++) {
        if ( !hasContent[ selectedChannel * 8 + i ] ) {
            emptySlot = i;
            break;
        }
    }    
    println( emptySlot )
    if ( emptySlot == -1 ) {
        return
    } else {
       var idx = PadIndex.indexOf( pad );
       trackBank.getTrack( selectedChannel ).getClipLauncherSlots().createEmptyClip( emptySlot, (idx+1) * 4 );
    }
}

function onSysex(data) {
    if ( data.substring(0,14) == 'f0002029020a77' ) {
        currentScene = parseInt( data.substring(14,16), 16)     
       
        if ( currentScene == Scenes.FACTORY3 ) {
           mixerAlignedGrid = false;
           incontrol_mix = false;           
        }
        
        if ( currentScene == Scenes.FACTORY1 || currentScene == Scenes.FACTORY2 || currentScene == Scenes.FACTORY4) {
            mixerAlignedGrid = true;
            incontrol_mix = true;
        }
        updateIndications();
    }
}

function makeIndexedFunction(index, f) {
    return function(value) {
        f(index, value);
    };
}

function makeSlotIndexedFunction( track, f) {
    return function( s, v) {
        f(track, s, v)
    }
}
