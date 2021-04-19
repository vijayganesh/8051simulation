/*
 * Script to control the micrcontroller simulation
 * Created by P.C. Vijay Ganesh
 *   
 */

const asm = {
   "mov":1,
   "add":2
 };
var asm_area;  // = document.getElementById("asm_code");

$(document).ready(function(){
$('.nav-tabs a').on('shown.bs.tab', function(event){
    var x = $(event.target).text();         // active tab
   // var y = $(event.relatedTarget).text();  // previous tab
    asm_exe.setActiveScreen(x);
  });

});
function init()
{
    asm_area = document.getElementById("asm_code");
    asm_exe = new asm_execute();
    asm_exe.resetRegister();
    
}
function clear_asm_text()
{
    asm_area.value = "";
    
}

function asm_execute()
{

    
// all the values are added in a single object for easy operation 
    this.active_screen = "";
    this.IRAM = [];//new array();
    this.ERAM = [];//new array();
    
    
     this.validOPCODE = [
     "mov a,#([a-fA-F0-9]{2})H", // done 0
     "mov a,r[0-7]",  // done 1
     "mov r[0-7],a", // done 2
     "mov r[0-7],#([a-fA-F0-9]{2})H", //done mov r[0-7] immediate 3
     "mov r[0-7],r[0-7]",// done mov register, register 4
     "mov a,([0-9a-fA-F]){2}H", // done mov a,direct address  5
     "mov ([a-fA-F0-9]{2})H,#([a-fA-F0-9]{2})H", // done mov dir,data 6
     "mov ([a-fA-F0-9]{2})H,([a-fA-F0-9]{2})H", //  done mov dir,dir 7
     // Pending indirect address , dptr , setb, clr
    "add a,b",
    "sub a,b"
    ];
    this.reg_opcode = new RegExp(this.validOPCODE.join("|"),"i");
 this.SPF = {
   "a":["a",0xE0],
   "b":["b",0xF0],
  // "reg_bank": [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]],
   "r0":["r0",0x0],
   "r1":["r1",0x1],
   "r2":["r2",0x2],
   "r3":["r3",0x3],
   "r4":["r4",0x4],
   "r5":["r5",0x5],
   "r6":["r6",0x6],
   "r7":["r7",0x7],
   "psw" :["psw",0xD0],// 0,
   "pc" : 0
  };
    
 this.line_code = asm_area.value.split("\n");

this.line_length=0;
this.current_line = 0;
//this.a =0x17;
//this.b = 0x0;
//this.psw = 0x0;
this.prefix = "0x";
this.radix = 16;
this.error = "";
//this.pc = 0;
//this.reg_bank = [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];


this.update = function ()
{
  var i =0;
  //console.log("Inside update");
   if(this.active_screen == "SPF")
   {   
   this.showSFR();
     
   }
   else if(this.active_screen == "I RAM")
   {
       this.showIRAM();
       
   }
   else if(this.active_screen == "E RAM")
   {
       // Update function
       this.showERAM();
   }
   
}

this.reset = function ()
{
 
 this.prefix = "0x";
 this.SPF["pc"]=0;
 this.radix = 16;
 
 for(var i=0;i<256;i++)
     this.IRAM[i] = 0;
 
 for(var i=0;i<4096;i++)
     this.ERAM[i] = 0;

}

this.debugStart = function ()
{
    // first remove run visibility 
    // Enable next and stop debug GamepadButton
    // invisible debug button 
    
 document.getElementById("debugStop").disabled = false; 
 document.getElementById("debugNext").disabled = false; 
 document.getElementById("debugStart").disabled = true;   
 document.getElementById("reset").disabled = true;
 document.getElementById("run").disabled = true;
 this.resetRegister();
 
    
}
    
this.debugStop = function ()
{ 
    document.getElementById("debugStart").disabled = false; 
    document.getElementById("debugStop").disabled = true;
    document.getElementById("debugNext").disabled = true;
    document.getElementById("reset").disabled = false;
    document.getElementById("run").disabled = false;
}

this.getCode = function ()
{
    var i=0;
    this.line_code = asm_area.value.split("\n");
        this.line_length = this.line_code.length;
    var er_flag=0;
    this.error = " ";
    document.getElementById("Error_msg").innerHTML = " ";
    while(i< this.line_length)
    {
         
        var op_split = this.line_code[i].split(":");
       
        if(!this.validateOPCODE(op_split[op_split.length-1]))
        {
            this.error += "  Error at line "+(i+1)+" <i> "+this.line_code[i]+"</i> <br>";
            er_flag = 1;
        }
        i = i+1;
    }
    document.getElementById("Error_msg").innerHTML = this.error;
    return er_flag;
}
this.debugNext = function ()
{
    if(this.SPF["pc"] == 0)
    {
        if(this.getCode())
        {
            this.debugStop();
            return -1;
        }
       // this.pc = 0;
    }
    else
    {
        if(this.SPF["pc"] >= this.line_length)
        { 
            // Come out of debug mode 
            this.debugStop();
        }
        
    }
    this.execute();
    this.pc_Increment();
    this.update();
    
}

this.pc_Increment = function ()
{
 this.SPF["pc"] = this.SPF["pc"]+1;   
}

this.execute = function ()
{
    // This function will execute each line of code
    
    // find which opcode  to execute
    var op_exec = this.getOpcode();
    console.log("The optainded exec="+op_exec);
    if( op_exec == -1)
        return -1;
    var oprand = " ";
    switch(op_exec)
    {
     
       // case 5: this.SPF["a"] = this.SPF["b"]; break;
        case 0: this.IRAM[this.SPF["a"][1]] = parseInt(((this.line_code[this.SPF["pc"]]).split("#"))[1].replace('\h',''),16);  break; // parseInt ((k.split("#"))[1].replace('\h',''),16)
        case 1: // This is mov a,r[0-7]
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF["a"][1]] = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            break;
        case 2:
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = this.IRAM[this.SPF["a"][1]] ;
            break;
        case 3:
            // mov r[0-7] #immediate
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = parseInt(((this.line_code[this.SPF["pc"]]).split("#"))[1].replace('\h',''),16);
            break;
        case 4:
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]; 
            break;
        case 5:
            operand =  (this.line_code[this.SPF["pc"]]).split(",");
            this.IRAM[this.SPF["a"][1]] = (this.IRAM[parseInt(operand[1].replace('\h',''),16)]);
           // console.log("The data is operand 1 is "+operand[1].replace('\h',''));
          //  console.log("The value to update is "+parseInt(this.IRAM[operand[1].replace('\h','')],16));
            break;
        case 6:
            // mov direct,#data
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] = parseInt(operand[1].replace('\#','').replace('\h',''),16);
            //console.log("mov direct " + parseInt(operand[1].replace('\#','').replace('\h',''),16).toString(16));
            break;
        case 7:
            // mov dir,dir
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] = this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            break;
        default: break;
    }
    
    
    
}

this.getOpcode = function ()
{
  var i = 0;
  var optain = 0;
  for (i=0;i<this.validOPCODE.length;i++)
  {
      optain = (this.line_code[this.SPF["pc"]]).search(new RegExp(this.validOPCODE[i],'i'));
     // console.log("the GetOpcode is "+optain);
      if(optain!= -1)
           return i;
  }
  return -1;
}

this.run = function ()
{
  // run the entire code in single strecth 
  // As of now no loop statement id executed. 
    
  //var i=0;
  if(this.getCode())
  {
   // Write the logic to stop the eecution
   return -1;
  }
  while(this.SPF["pc"] <= this.line_length-1)
  {
      this.execute();
      this.update();
      this.pc_Increment();
  }
  
}
 
this.stop = function()
{
  this.SPF["pc"] = this.line_length +1;
  
}

this.resetRegister = function ()
{
    this.reset();
    this.update();
}

this.inst_MOV = function(op1,op2)
{
    
}

this.validateOPCODE = function (opcode)
{
    return this.reg_opcode.test(opcode);
}

this.showIRAM = function ()
{
  var values = " <div class=\"table-responsive overflow-auto\" style=\"height:250px\"> <table class=\"table\"> <tr> <th>  Address </th> <th colspan=\"8\"> Values </th></tr> ";
  
  var i,j;
  for(i=0;i<32; i++)
  {
      values += "<tr>"; 
      values += "<td>0x"+(i*8).toString(16)+"<td>";
      for(j=0;j<8;j++)
      {
         // console.log("The values:"+i+" -" +j+"\n");
      values += "<td> 0x"+(this.IRAM[(i*8)+j]).toString(16)+"</td>";
      }
      values += "</tr>";
      
  }
  //console.log("Completed the values");
  
  values += "</table> </div>";
  document.getElementById("IRAM").innerHTML = values;
}


this.setActiveScreen = function (va)
{
    this.active_screen = va;
   // console.log("Enere Activescreen");
    this.update();
}

this.showSFR = function()
{
 var values = "<div class=\"table-responsive overflow-auto\" style=\"height:250px\"> <table class=\"table\"> <tr> <th>  SFR </th> <th> Values </th></tr>";
 
 values += "<tr> <td> Acc </td> <td> 0x"+this.IRAM[this.SPF["a"][1]].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> B </td> <td> 0x"+this.IRAM[this.SPF["b"][1]].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R0 </td> <td> 0x"+this.IRAM[this.SPF["r0"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R1 </td> <td> 0x"+this.IRAM[this.SPF["r1"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R2 </td> <td> 0x"+this.IRAM[this.SPF["r2"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R3 </td> <td> 0x"+this.IRAM[this.SPF["r3"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R4 </td> <td> 0x"+this.IRAM[this.SPF["r4"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R5 </td> <td> 0x"+this.IRAM[this.SPF["r5"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R6 </td> <td> 0x"+this.IRAM[this.SPF["r6"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R7 </td> <td> 0x"+this.IRAM[this.SPF["r7"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> PSW </td> <td> 0x"+this.IRAM[this.SPF["psw"][1]].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> PC</td> <td> 0x"+this.SPF["pc"].toString(this.radix)+"</td> </tr>";
 values += "</table></div>";
 
 document.getElementById("8051_spr").innerHTML = values;
//console.log("Inside showSFR");
}

// External Ram DISPlay 
this.showERAM = function ()
{
    var values = " <div class=\"table-responsive overflow-auto\" style=\"height:250px\"> <table class=\"table\"> <tr> <th>  Address </th> <th colspan=\"8\"> Values </th></tr> ";
  
  var i,j;
  for(i=0;i<(4096/8); i++)
  {
      values += "<tr>"; 
      values += "<td>0x"+(i*8).toString(16)+"<td>";
      for(j=0;j<8;j++)
      {
         // console.log("The values:"+i+" -" +j+"\n");
      values += "<td> "+this.ERAM[(i*8)+j]+"</td>";
      }
      values += "</tr>";
      
  }
  //console.log("Completed the values");
  
  values += "</table> </div>";
  document.getElementById("ERAM").innerHTML = values;
}

}
