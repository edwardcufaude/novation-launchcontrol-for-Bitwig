
var ledstate = initArray(-1, 18);
var pendingLedstate = initArray(0, 18);

var selectedPage = 0;
var numParameterPages = 0;

function mixColour(red, green, blink)
{
   return (blink ? 8 : 12) | red | (green * 16);
}

function updateOutputState()
{
   for(var i=0; i<8; i++)
   {
      pendingLedstate[i] = (selectedPage == i)
         ? mixColour(3, 3, false)
         : (i < numParameterPages) ? mixColour(1, 1, false) : 0;

      var j = i + 9;

      pendingLedstate[j] = (modSourceStates.values[i])
         ? (blink ? mixColour(1, 3, false) : mixColour(0, 1, false))
         : 0;
   }
}

function flushOutputState()
{
   for(var i=0; i<9; i++)
   {
      if (pendingLedstate[i] != ledstate[i])
      {
         ledstate[i] = pendingLedstate[i];
         host.getMidiOutPort(0).sendMidi(0x98, 96 + i, ledstate[i]);
      }

      var j = i + 9;
      if (pendingLedstate[j] != ledstate[j])
      {
         ledstate[j] = pendingLedstate[j];
         host.getMidiOutPort(0).sendMidi(0x98, 112 + i, ledstate[j]);
      }
   }
}

/* Simple buffer array with setter. */

function BufferedElementArray(initialVal, count)
{
   this.values = initArray(initialVal, count);
}

/* Return a setter function for the specific index. */
BufferedElementArray.prototype.setter = function(index)
{
   var obj = this;

   return function(data)
   {
      obj.set(index, data);
   }
};

BufferedElementArray.prototype.set = function(index, data)
{
   this.values[index] = data;
};

var modSourceStates = new BufferedElementArray(false, 8);
