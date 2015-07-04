var LOWEST_CC = 21;
var HIGHEST_CC = 48;

var NUM_TRACKS = 8;
var NUM_SENDS = 2;
var NUM_SCENES = 1;

var Pads = {
    PAD1:9,
    PAD2:10,
    PAD3:11,
    PAD4:12,
    PAD5:25,
    PAD6:26,
    PAD7:27,
    PAD8:28
}

var PadIndex = [
    Pads.PAD1,
    Pads.PAD2,
    Pads.PAD3,
    Pads.PAD4,
    Pads.PAD5,
    Pads.PAD6,
    Pads.PAD7,
    Pads.PAD8
]

var Scenes = {
    USER1:0,
    USER2:1,
    USER3:2,
    USER4:3,
    USER5:4,
    USER6:5,
    USER7:6,
    USER8:7,
    FACTORY1:8,
    FACTORY2:9,
    FACTORY3:10,
    FACTORY4:11,
    FACTORY5:12,
    FACTORY6:13,
    FACTORY7:14,
    FACTORY8:15
}

var SideButton =
{
   UP:114,
   DOWN:115,
   LEFT:116,
   RIGHT:117,
};

var UserPageKnobs =
{
	Page1:176,
	Page2:177,
	Page3:178,
	Page4:179,
	Page5:180,
	Page6:181,
	Page7:182,
	Page8:183
};

var FactoryPageKnobs = 
{
	Page1:184,
	Page2:185,
	Page3:186,
	Page4:187,
	Page5:188,
	Page6:189,
	Page7:190,
	Page8:191
};

var UserPagePads =
{
	Page1:144,
	Page2:145,
	Page3:146,
	Page4:147,
	Page5:148,
	Page6:149,
	Page7:150,
	Page8:151
};

var FactoryPagePads = 
{
	Page1:152,
	Page2:153,
	Page3:154,
	Page4:155,
	Page5:156,
	Page6:157,
	Page7:158,
	Page8:159
};

var Colour = // Novation are from the UK
{
   OFF:12,
   RED_LOW:13,
   RED_FULL:15,
   AMBER_LOW:29,
   AMBER_FULL:63,
   YELLOW_FULL:62,
   YELLOW_LOW: 0x2D,
   ORANGE:39,
   LIME:0x3D,
   GREEN_LOW:28,
   GREEN_FULL:60,
   RED_FLASHING:11,
   AMBER_FLASHING:59,
   YELLOW_FLASHING:58,
   GREEN_FLASHING:56
};

var LED =
{
   GRID:0,
   CURSORS:1,

   CURSOR_UP:0,
   CURSOR_DOWN:1,
   CURSOR_LEFT:2,
   CURSOR_RIGHT:3,
};

