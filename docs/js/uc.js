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
$('.nav-tabs a').on('show.bs.tab', function(event){
    var x = $(event.target).text();         // active tab
   // var y = $(event.relatedTarget).text();  // previous tab
    asm_exe.setActiveScreen(x);
   // console.log("The clicj is :"+x);
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
    this.active_screen = "SPF";
    this.IRAM = [];//new array();
    this.ERAM = [];//new array();
    this.labels = {};
    this.pc_inc = 1;
    this.pc_inc_flag = 0;
    
    
     this.validOPCODE = [
     //"mov a,#([a-fA-F0-9]{2})H", // done 0
     "mov a,#((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H",
     "mov a,r[0-7]",  // done 1
     "mov r[0-7],a", // done 2
     "mov r[0-7],#((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", //done mov r[0-7] immediate 3
     "mov r[0-7],r[0-7]",// done mov register, register 4
     "mov a,([0-9a-fA-F]){2}H", // done mov a,direct address  5
     "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,#((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // done mov dir,data 6
     "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", //  done mov dir,dir 7
     "mov r[0-7],((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // done mov r[0-7], direct 8
     "mov a,@r[0-1]",// done mov indirect @r[0-1] 9
     "jmp [a-zA-Z0-9]+", // done Jump instruction;  10
     "inc a", // done increment a+1 11
     "inc r[0-7]", // done increment r[0-7] +1 12
     "inc ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // done increment direct address value +1 13
     "inc @r[0-1]", // done increment indirect address + 1 14
     "mov dp(l|h),#((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H",//done move dpl|h immediate 15
     "mov dp(l|h),r[0-7]", //done  mov dp(1|h) register 16
     "mov dp(l|h),@r[0-7]",// done mov dp indirect 17
     "mov dp(l|h),((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // mov dp direct 18
     
     "mov r[0-7],dp(l|h)", //  mov  register dp(1|h) 19
     "mov @r[0-7],dp(l|h)",//  mov  indirect dp(1|h) 20
     "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,dp(l|h)", //  mov direct dp(1|h) 21
     "movx a,@dptr",// done movx a,@dptr 22
     "movx @dptr,a",//done  movx @dptr,a 23
     "djnz r[0-7],[a-zA-Z0-9]+", // djnz rn,rel 24
     "djnz ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,[a-zA-Z0-9]+", // djnz direct,rel 25
     "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,a", // mov direct,a 26
     "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,r[0-7]", // mov direct,reg 27
     "xch a,@r[0-7]",//XCH A, @Ri 28
     "xch a,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H",// XCH A, direct 29
     "xch a,r[0-7]", // XCH A, Rn 30
     "org ((0[a-fA-f][a-fA-F0-9]{3})|(([0-9][0-9a-fA-F]{3})))H", // org 0000h 31
     // mov indirect instruction already done mov a,@r[01]
     "mov @r[0-1],a", // mov @r0-1,a 32
     "mov @r[0-1],#((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // mov @r0-1 immediate 33
     "mov @r[0-1],((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // mov @r[0-1] direct 34
     "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,@r[0-1]", // mov direct,@r[0-1] 35
     "movx a,@r[0-1]",// done movx a,@r[0-1] 36
     "movx @r[0-1],a",//done  movx @r[0-1],a 37
     "mov dptr,#((0[a-fA-f]([a-fA-F0-9]){1,3})|(([0-9][0-9a-fA-F]{1,3})))H",
     
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
   //"auxr1" : ["auxr1",0xa2],
   "dpl" : ["dpl",0x82],
   "dph" : ["dph",0x83],
   //"dp1l" : ["dp1l",0x84],
   //"dp1h" : ["dp1h",0x82],
   "p0" :["p0",0x80],
   "p1" :["p1",0x90],
   "p2" :["p2",0xA0],
   "p3" :["p3",0xB0],
   "ip" :["ip",0xB8],
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
this.stop_flag = 0;
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
 document.getElementById("asm_code").disabled = true;
 document.getElementById("Error_msg").innerHTML = " ";
// this.resetRegister();
 
    
}
    
this.debugStop = function ()
{ 
    document.getElementById("debugStart").disabled = false; 
    document.getElementById("debugStop").disabled = true;
    document.getElementById("debugNext").disabled = true;
    document.getElementById("reset").disabled = false;
    document.getElementById("run").disabled = false;
    document.getElementById("asm_code").disabled = false;
}

this.getCode = function ()
{
    var i=0;
    this.labels = {}; // reset labels dict;
    this.line_code = asm_area.value.split("\n");
        this.line_length = this.line_code.length;
    var er_flag=0;
    this.error = " ";
    document.getElementById("Error_msg").innerHTML = " ";
    while(i< this.line_length)
    {
         this.line_code[i] = this.line_code[i].toLowerCase();
        var op_split = this.line_code[i].split(":"); // Is label is there 
         
        if(!this.validateOPCODE(op_split[op_split.length-1]))
        {
            
            this.error += "  Error at line "+(i+1)+" <i> "+this.line_code[i]+"</i> <br>";
            er_flag = 1;
        }
        if(op_split.length > 1)
        { 
            // There is label 
            this.labels[op_split[0]] = i;
            this.line_code[i] = op_split[1];
        }
        //console.log(this.line_code[i]);
        // Convert capital to small letters
        
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
        if(this.SPF["pc"] > this.line_length-1)
        { 
            // Come out of debug mode 
            this.debugStop();
           // console.log("Reached to stop debun");
            return 0;
        }
        
    }
    this.execute();
    this.pc_Increment();
    this.update();
    
}

this.pc_Increment = function ()
{
    if(this.pc_inc_flag == 0)
    {
 this.SPF["pc"] = this.SPF["pc"]+1;   
    }
    else
    {
        this.SPF["pc"] = this.pc_inc; // switch to location 
        this.pc_inc_flag = 0;
    }
   // console.log(this.SPF["pc"]);
}

this.execute = function ()
{
    // This function will execute each line of code
    
    // find which opcode  to execute
    var op_exec = this.getOpcode();
    //console.log("The optainded exec="+op_exec);
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
        case 8:
            // mov r[0-7], direct
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            break;
        case 9:
            // mov indirect a,@r[0-1]
            operand = ((this.line_code[this.SPF["pc"]]).split("@"));
            this.IRAM[this.SPF["a"][1]] = this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]];
            break;
        case 10:
             operand =  (this.line_code[this.SPF["pc"]]).split(" ");
            this.pc_inc_flag = 1;
            this.pc_inc = this.labels[operand[1]];
             
            break;
        case 11:
            // increment a+1 11
            this.IRAM[this.SPF["a"][1]] = this.IRAM[this.SPF["a"][1]] + 1;
            break;
        case 12: 
            // increment r[0-7] +1 12
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
            this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] + 1; 
            break;
        case 13:
           //  increment direct address value +1 13
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
            this.IRAM[parseInt(operand[1].replace('\h',''),16)] = this.IRAM[parseInt(operand[1].replace('\h',''),16)]+1;
            
            break
            
        case 14: 
         // increment indirect address + 1 14
            operand = ((this.line_code[this.SPF["pc"]]).split("@"));
            this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] = this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] + 1;
        break;
        case 15: 
            // mov dpl|h immediate
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
           // console.log("dpl is : " + parseInt(operand[1].replace('\#','').replace('\h',''),16));
            this.IRAM[this.SPF[operand[0]][1]] = parseInt(operand[1].replace('\#','').replace('\h',''),16);
            break;
            
        case 16:
             // mov dp(1|h) register
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]] = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            break;
            
        case 17:
            // mov dp indirect
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]] = this.IRAM[this.IRAM[parseInt(this.SPF[operand[1].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] ;
            
            break;
        case 18:
            // mov dp direct 18
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]] = this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            console.log("The value is :"+this.IRAM[parseInt(operand[1].replace('\h',''),16)]);
            break;
            
          
            
        case 19:
             // mov  register dp(1|h)
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = this.IRAM[this.SPF[operand[1]][1]];
            break;
            
        case 20:
            // mov  indirect dl
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             this.IRAM[this.IRAM[parseInt(this.SPF[operand[0].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] = this.IRAM[this.SPF[operand[1]][1]] ;
            
            break;
        case 21:
            // mov  direct  dl 
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             this.IRAM[parseInt(operand[0].replace('\h',''),16)]= this.IRAM[this.SPF[operand[1]][1]];
           // console.log("The value is :"+this.IRAM[parseInt(operand[1].replace('\h',''),16)]);
            break; 
        case 22:
            // movx a,@dptr 22
            
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var dptr = (this.IRAM[this.SPF["dph"][1]]<<8) + this.IRAM[this.SPF["dpl"][1]];
          //  console.log("The value of dptr is "+parseInt(dptr,10) +" Dpl:"+ this.IRAM[this.SPF["dpl"][1]] + " DPH: "+ this.IRAM[this.SPF["dph"][1]]);
            this.IRAM[this.SPF[operand[0]][1]] = this.ERAM[dptr];
            
            break;
        case 23:
            
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var dptr = (this.IRAM[this.SPF["dph"][1]]<<8) + this.IRAM[this.SPF["dpl"][1]];
            console.log("The value of dptr is "+parseInt(dptr,10) +" Dpl:"+ this.IRAM[this.SPF["dpl"][1]] + " DPH: "+ this.IRAM[this.SPF["dph"][1]]);
            this.ERAM[dptr] = this.IRAM[this.SPF[operand[1]][1]] ;
            break;
        case 24:
            
            // djnz rn,rel 24
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] -1;
            
            if(this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] == 0)
            {
                // Do nothing in PC
            }
            else
            {
                // Now Jump to given label
            this.pc_inc_flag = 1;
            this.pc_inc = this.labels[operand[1]];
                
            }
            
            
            break;
        case 25:
            
            // djnz direct,rel 25
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] = this.IRAM[parseInt(operand[0].replace('\h',''),16)] - 1;
            
            if(this.IRAM[parseInt(operand[0].replace('\h',''),16)] == 0)
            {
            }
            else
            {
                this.pc_inc_flag = 1;
              //  console.log("The label is "+this.labels[operand[1]] + " value:"+this.IRAM[parseInt(operand[0].replace('\h',''),16)]); 
             this.pc_inc = this.labels[operand[1]];
            }
            
            
            break;
                   
        case 26:
            // mov direct,a 26
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] = this.IRAM[this.SPF["a"][1]];            
            break;
        case 27:
            // mov direct,reg 27
            
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            break;
        case 28:
             //XCH A,@Ri 28
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split("@");    
            var temp1 = this.IRAM[this.SPF["a"][1]];
            var temp2 = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            this.IRAM[this.SPF["a"][1]] = temp2;
            this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = temp1;
            // Update status word for priority
            this.setPSWpriority();
            
     
            break;
        case 29:
            // XCH A, direct 29
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var temp1 = this.IRAM[this.SPF["a"][1]];
            var temp2 = this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            this.IRAM[this.SPF["a"][1]] = temp2;
            this.IRAM[parseInt(operand[1].replace('\h',''),16)] = temp1;
            // update status word for priority
            this.setPSWpriority();
            break;
        case 30:
            // XCH A, Rn 30
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var temp1 = this.IRAM[this.SPF["a"][1]];
            var temp2 = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = temp1;
            this.IRAM[this.SPF["a"][1]] = temp2;
            // update status work for priority
            this.setPSWpriority();
            
            break;
            
        case 31:
            // org do nothing
            break;
            
        case 32:
            // mov @r0-1,a 32
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.IRAM[parseInt(this.SPF[operand[0].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] = this.IRAM[this.SPF[operand[1]][1]] ;
            
            break;
        case 33:
            // mov @r0-1 immediate 33
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.IRAM[parseInt(this.SPF[operand[0].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] =  parseInt(operand[1].replace('\#','').replace('\h',''),16);
            break;
        case 34:
            // mov @r[0-1] direct 34
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.IRAM[parseInt(this.SPF[operand[0].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] =  this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            break;
        case 35:
            // mov direct,@r[0-1] 35
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] = this.IRAM[this.IRAM[parseInt(this.SPF[operand[1].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]];
            break;
            
        case 36:
            //movx a,@r[0-1] 36
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             this.IRAM[this.SPF[operand[0]][1]] = this.ERAM[this.IRAM[parseInt(this.SPF[operand[1].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]];
            
            break;
        case 37:
            // movx @r[0-1],a 37
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.ERAM[this.IRAM[parseInt(this.SPF[operand[0].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] = this.IRAM[this.SPF[operand[1]][1]];
            break;
        case 38:
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF["dpl"][1]] = parseInt(operand[1].replace('\#','').replace('\h',''),16) & 0x0FF;
            this.IRAM[this.SPF["dph"][1]] = (parseInt(operand[1].replace('\#','').replace('\h',''),16) & 0xFF00)>>8;
            
            break;
            
            
        default: break;
    }
    
    
    
}
this.setPSWpriority = function ()
{
    var priority = 0;
    var temp = this.IRAM[this.SPF["a"][1]]; // Acc value
    
    while(temp != 0)
    {
        priority = !priority;
        temp = temp & (temp -1);
    }
    
    var ps_t = this.IRAM[this.SPF["psw"][1]];
    ps_t = ps_t | 0x01;
    
    //console.log("pri = "+priority+" and int value - "+( 0xFE | (priority?1:0))+" Acc = "+this.IRAM[this.SPF["a"][1]]);
    console.log(ps_t & ( 0xFE | (priority?1:0)));
    this.IRAM[this.SPF["psw"][1]] = ps_t & ( 0xFE | (priority?1:0)); 
}
this.getOpcode = function ()
{
  var i = 0;
  var optain = 0;
  for (i=0;i<this.validOPCODE.length;i++)
  {
      optain = (this.line_code[this.SPF["pc"]]).search(new RegExp(this.validOPCODE[i],'i'));
     // console.log("the GetOpcode is "+optain+this.validateOPCODE[i]);
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
    //this.stop = 0;
  if(this.getCode())
  {
   // Write the logic to stop the eecution
     // console.log("Return at first getcode");
   return -1;
  }
  document.getElementById("stop").disabled = false;
  document.getElementById("run").disabled = true;
  document.getElementById("asm_code").disabled = true;
  while(this.SPF["pc"] <= this.line_length-1)
  {
     // console.log("Inside exec while loop");
      if(this.stop_flag > 100)
      {
          document.getElementById("asm_code").disabled = false;
          return -1;
      }
     this.stop_flag++; 
     this.execute();
      this.update();
      this.pc_Increment();
  }
  //this.stop();
  document.getElementById("stop").disabled = true;
  document.getElementById("run").disabled = false;
  document.getElementById("asm_code").disabled = false;
  return 0;
}
 
this.stop = function()
{
  this.SPF["pc"] = this.line_length +2;
  this.stop_flag = 101;
  document.getElementById("stop").disabled = true;
  document.getElementById("run").disabled = false;
  
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
 
    var values = "";
   
    values += "<div class=\"table-responsive overflow-auto\" style=\"height:250px\"> <table class=\"table\"> <tr> <th>  SFR </th> <th> Values </th></tr>";
 
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
 values += "<tr> <td> DPL </td> <td> 0x"+this.IRAM[this.SPF["dpl"][1]].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> DPH </td> <td> 0x"+this.IRAM[this.SPF["dph"][1]].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> PSW </td> <td> 0x"+this.IRAM[this.SPF["psw"][1]].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> PC</td> <td> 0x"+this.SPF["pc"].toString(this.radix)+"</td> </tr>";
 values += "</table></div>";
 
 document.getElementById("spr_8051").innerHTML = values;
//console.log("Inside showSFR");
}

// External Ram DISPlay 
this.showERAM = function ()
{
    var values = " ";
     values = "<div class=\"input-group mb-3 input-group-sm\">  <span class=\"input-group-text\" id=\"basic-addon1\">Search Address :</span> <input type=\"search\" id=\"eadrr_search\" onChange=\"getERAMvalue(); \">  Value is  <input type=\"text\" class = \"\"id=\"exvalues\"> <button type=\"button\" value=\"Step\" class=\"btn btn-primary\" id=\"exvalueUpdate\" onClick=\" updateERAMvalue();\"> Update </button> ";
    // values += "<div class=\"col\">Drop down menu input value button to click </div>";
    values += "</div>";
    values += " <div class=\"table-responsive overflow-auto\" style=\"height:250px\"> <table class=\"table\"> <tr> <th>  Address </th> <th colspan=\"8\"> Values </th></tr> ";
  
  var i,j;
  for(i=0;i<(4096/8); i++)
  {
      values += "<tr>"; 
      values += "<td>0x"+(i*8).toString(16)+"<td>";
      for(j=0;j<8;j++)
      {
         // console.log("The values:"+i+" -" +j+"\n");
      values += "<td> 0x"+this.ERAM[(i*8)+j].toString(16)+"</td>";
      }
      values += "</tr>";
      
  }
  //console.log("Completed the values");
  
  values += "</table> </div>";
  document.getElementById("ERAM").innerHTML = values;
}


this.getERAMvalue = function (address)
{
 return  parseInt(this.ERAM[parseInt(address,16)],16); //this.ERAM[parseInt(address,16)];
}

this.updateERAMvalue = function(address,values)
{
  this.ERAM[parseInt(address,16)] = parseInt(values,16);
  this.update();
}

this.resetIRegister = function ()
{
  for(var i=0;i<256;i++)
     this.IRAM[i] = 0;
this.SPF["pc"] = 0;  
this.update();
}
}


function getERAMvalue()
{
  document.getElementById('exvalues').value =(asm_exe.getERAMvalue(document.getElementById("eadrr_search").value)).toString(16);
}

function updateERAMvalue()
{
  asm_exe.updateERAMvalue(document.getElementById("eadrr_search").value, document.getElementById('exvalues').value);  
}

