/*
 * Script to control the micrcontroller simulation
 * Created by P.C. Vijay Ganesh
 *  @vijayganesh
 * @https://github.com/vijayganesh/8051simulation/
 */
var user_name = "Guest";

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
    console.log("The clicj is :"+this.id);
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
//class asm_execute
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
    "^mov ((a)|(b)|p[0-3]|psw),#(([+-]?)((((0[a-fA-f][a-fA-F0-9]H)|(([0-9]?[0-9a-fA-F]H))))|([0-9]{1,3}$)))$",
     "mov (a|b|dpl|dph|p[0-3]),(r[0-7]|a|b|dph|dpl|p[0-3])",  // done 1
     "mov r[0-7],(a|b|p[0-3]|dph|dpl)", // done 2
     "mov r[0-7],#[+-]?((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", //done mov r[0-7] immediate 3
     "mov r[0-7],r[0-7]",// done mov register, register 4
     "mov (a|b|psw|p[0-3]),([0-9a-fA-F]){2}H", // done mov a,direct address  5
     "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,#[+-]?((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // done mov dir,data 6
     "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", //  done mov dir,dir 7
     "mov r[0-7],((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // done mov r[0-7], direct 8
     "mov a,@r[0-1]",// done mov indirect @r[0-1] 9
     "jmp [a-zA-Z0-9]+", // done Jump instruction;  10
     "^inc (a|p[0-3]|dph|dpl|sp|b|dptr)$", // done increment a+1 11
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
     "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,(a|b|p[0-3]|dph|dpl)", // mov direct,a 26
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
     "mov dptr,#((0[a-fA-f]([a-fA-F0-9]){1,3})|(([0-9][0-9a-fA-F]{1,3})))H", //done 38
     "push acc", // push acc 39
     "push b", // push b 40
     "push ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // push direct 41
     "pop acc", // pop acc 42
     "pop b", // pop b 43 
     "pop ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // pop direct 44
     "mov sp,#((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // sp #immediate 45
     "xchd a,@r[0|1]", //XCHD A, @R1 46
     // Arithmetic 
     "add a,#[+-]?((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // add a,#immediate 47
     "add a,@r[0|1]", // add a,indirect  48
     "add a,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // add a,direct 49
     "add a,r[0-7]", // add a,register 50
     "addc a,#[+-]?((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // addc a,#immediate 51
     "addc a,@r[0|1]", // addc a,indirect 52
     "addc a,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // addc a,direct 53
     "addc a,r[0-7]", // addc a,register 54
     "subb a,#[+-]?((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // subb a,#immediate 55
     "subb a,@r[0|1]", // subb a,indirect 56
     "subb a,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // subb a,direct 57
     "subb a,r[0-7]", // subb a,register 58
     "^clr a$", // clear acc 59
     "clr ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // clear address of bit 60
     "^clr (acc|p[0-3]|tcon|scon|ie|ip|b|psw).[0-7]$", // clear spf 61
     "^clr c$", // clear carry flag 62
     "setb ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // 63
     "^setb (acc|p[0-3]|tcon|scon|ie|ip|b|psw).[0-7]$", //64
     "^setb c$", //65
     "^da a$", // Adjust to bcd //66 
     "^dec (a|p[0-3]|dph|dpl|sp|b|dptr)$", // done increment a - 1 67
     "dec r[0-7]", // done increment r[0-7]  - 1 68
     "dec ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // done increment direct address value - 1 69
     "dec @r[0-1]", // done increment indirect address - 1 70
     // Logical operation 
     // and 
     "ANL (A|p[0-3]),#[+-]?((((0[a-fA-f][a-fA-F0-9])|(([0-9]?[0-9a-fA-F])))H)|([0-9]{1,3}))", // and a,immediate 71
     "ANL A,@R[0-1]", // and a,indirect 72
     "ANL A,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // and a,direct 73
     "ANL A,R[0-7]", // and a,register 74
     "ANL C,/((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // and bit cy with ~ bit values 75
     "ANL C,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // and bit cy with bit values 76
     "ANL ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,A", // and direct with a 77
     "ANL ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,#[+-]?((((0[a-fA-f][a-fA-F0-9])|(([0-9]?[0-9a-fA-F])))H)|([0-9]{1,3}))", // and direct with immediate data 78
     
     // Or logical 
     "ORL (A|p[0-3]),#[+-]?((((0[a-fA-f][a-fA-F0-9])|(([0-9]?[0-9a-fA-F])))H)|([0-9]{1,3}))", // and a,immediate 79
     "ORL A,@R[0-1]", // and a,indirect 80
     "ORL A,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // and a,direct 81
     "ORL A,R[0-7]", // and a,register 82
     "ORL C,/((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // and bit cy with ~ bit values 83
     "ORL C,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // and bit cy with bit values 84
     "ORL ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,A", // and direct with a 85
     "ORL ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,#[+-]?((((0[a-fA-f][a-fA-F0-9])|(([0-9]?[0-9a-fA-F])))H)|([0-9]{1,3}))", // and direct with immediate data 86
     // 87 - 90 reserved for logical operraion and OR if needed 
    "orl ---", // 87
     "orl z+", // 88
    "anl ---", //89
    "anl z+", //90
     
     "XRL (A|p[0-3]),#[+-]?((((0[a-fA-f][a-fA-F0-9])|(([0-9]?[0-9a-fA-F])))H)|([0-9]{1,3}))", // and a,immediate 91
     "XRL A,@R[0-1]", // and a,indirect 92
     "XRL A,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // and a,direct 93
     "XRL A,R[0-7]", // and a,register 94
     "^XRL C,/((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H$", // and bit cy with ~ bit values 95
     "XRL C,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // and bit cy with bit values 96
     "XRL ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,A", // and direct with a 97
     "XRL ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,#[+-]?((((0[a-fA-f][a-fA-F0-9])|(([0-9]?[0-9a-fA-F])))H)|([0-9]{1,3}))", // and direct with immediate data 98
     "xrl z-", //99
     
     
     // Complement instruction 
     "^CPL (A|p[0-3])$",// comp a 100
     "CPL ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // comp location 101
     "CPL C", // Complement c 102
     "^CPL (a|p[0-3]|tcon|scon|ie|ip|b|psw).[0-7]$", // 103
     "^cpl $", // additional activity 104
     
    // multiple and Divivsion 
    "div ab", // divivsion 105
    "mul ab",// multiple 106
    
    // Rotate instruction 
    "^rr a$", // rotate right 107 
    "^rrc a$", // Rotate right with carry 108
    "^rl a$", // rotate left 109
    "^rlc a$", // rotate left with carry 110
    "rlc ex ", // 111

    "rrc rx", //112
    "rr rx",//113
    "rl ex",//114
    "^jb ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,[a-z0-9]+", // 115
     "^jb (acc|p[0-3]|tcon|scon|ie|ip|b|psw).[0-7],[a-z0-9]+", //116
     "^jbc ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,[a-z0-9]+", // 117
     "^jbc (a|p[0-3]|tcon|scon|ie|ip|b|psw).[0-7],[a-z0-9]+", //118
    "^jc [a-z][a-z0-9]+$", //119
    "jc xr", //120
        "^jnb ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,[a-z0-9]+", //121
        "^jnb (acc|p[0-3]|tcon|scon|ie|ip|b|psw).[0-7],[a-z0-9]+", //122
        "^jnc [a-z][a-z0-9]+$", //123
        "jnc x", //124
        "jnz [a-z][a-z0-9]+$", //125
        "jnz ax", // 126
        "^jz [a-z][a-z0-9]+$", //127
        "jz x", //128
        
        "^jc x[a-z][a-z0-9]+$", //129 R
        "jc x", // 130 R
        
        // swap instruction
        "swap a", //131 swap
    
        "mov c,((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H", // 132
        "mov ((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,c", // 133
        "sjmp [a-z][a-z0-9]+$", // short jump 134
        "^nop", // No operation 135
        "end", // Ends the simulation 136
    
      "add a,b", // add a and b 137
      "addc a,b", // addc a,b 138
       "subb a,b", // sub a,b 139
       "cjne @r[0-1],#(([+-]?)((((0[a-fA-f][a-fA-F0-9]H)|(([0-9]?[0-9a-fA-F]H))))|([0-9]{1,3}$))),[a-z][a-z0-9]+$", // 140
    "cjne r[0-7],#(([+-]?)((((0[a-fA-f][a-fA-F0-9]H)|(([0-9]?[0-9a-fA-F]H))))|([0-9]{1,3}$))),[a-z][a-z0-9]+$", // 141
    "cjne a,#(([+-]?)((((0[a-fA-f][a-fA-F0-9]H)|(([0-9]?[0-9a-fA-F]H))))|([0-9]{1,3}$))),[a-z][a-z0-9]+$", // 142
    "cjne (r[0-7]|a),((0[a-fA-f][a-fA-F0-9])|(([0-9][0-9a-fA-F])))H,[a-z][a-z0-9]+$", // 143 direct offset
        
    // Pending  jump, call, 
    ""
    ];
this.exe_msg = " ";   
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
   "tcon" :["tcon",0x88],
   "scon" : ["scon",0x98],
   "ip" :["ip",0xb8],
   "ie" :["ie",0xa8],
   "pc" : 0,
   "sp" : 0x07
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
   
    else if(this.active_screen == "ports")
   {
       // Update function
       this.showPorts();
   }
   
}

this.reset = function ()
{
 
 this.prefix = "0x";
 this.SPF["pc"]=0;
 this.SPF["sp"] = 0x07;
 this.radix = 16;
 this.exe_msg = " ";
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
         // remove the spaces and update instruction
        var in_split = op_split[op_split.length-1].split(" ");
        
        var opcode_flag = 1;
        var clear_ins = "";
        for(var temp=0;temp<in_split.length; temp++)
        {
           // console.log("The ins is : "+in_split[temp]);
            if(in_split[temp] != "")
            {
                if(opcode_flag)
                {
                   //  console.log("ins if part "+in_split[temp]);
                    clear_ins += in_split[temp]+" ";
                    opcode_flag = 0;
                }
                else
                {
                 //   console.log("ins else part "+in_split[temp]);
                    clear_ins += in_split[temp];
                }
            }
        }
        op_split[op_split.length-1] = clear_ins;
       // console.log("The final op_split "+op_split[op_split.length-1]);
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
        else
        {
          this.line_code[i] = op_split[0];
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
this.convertValuedecimal = function (value)
{
   var length = value.length;
  // alert("GOt value = "+value);
   var r_value  = 0x0;
    if(value[length-1] == 'h')
        r_value = parseInt(value,16);
    else
        r_value = parseInt(value);
    
    return r_value;
}
this.execute = function ()
{
    // This function will execute each line of code
    
    // find which opcode  to execute
    var op_exec = this.getOpcode();
    console.log("The optainded exec="+op_exec + " code is " + this.line_code[this.SPF["pc"]]);
    if( op_exec == -1)
        return -1;
    this.exe_msg += "Executing "+user_name +"'s line No : "+this.SPF["pc"]+" -> "+ (this.line_code[this.SPF["pc"]])+ "<br>"; 
    document.getElementById("Error_msg").innerHTML = this.exe_msg;
    document.getElementById("Error_msg").scrollTo(0,document.getElementById("Error_msg").scrollHeight);
    var oprand = " ";
    switch(op_exec)
    {
      
       // case 5: this.SPF["a"] = this.SPF["b"]; break;
        case 0:
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            //this.IRAM[this.SPF[operand[0]][1]] = parseInt(((this.line_code[this.SPF["pc"]]).split("#"))[1].replace('\h',''),16);  break; // parseInt ((k.split("#"))[1].replace('\h',''),16)
            this.IRAM[this.SPF[operand[0]][1]] = this.convertValuedecimal((operand[1].split("#"))[1]);
            break;
        case 1: // This is mov a,r[0-7]
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             if(operand[1] == "r0" || operand[1] == "r1" || operand[1] == "r2" || operand[1] == "r3" || operand[1] == "r4" || operand[1] == "r5" || operand[1] == "r6" || operand[1] == "r7")
             {
            this.IRAM[this.SPF[operand[0]][1]] = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
             }
             else
             {
                 this.IRAM[this.SPF[operand[0]][1]] = this.IRAM[this.SPF[operand[1]][1]];
             }
            break;
        case 2:
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = this.IRAM[this.SPF[operand[1]][1]] ;
            break;
        case 3:
            // mov r[0-7] #immediate
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] =this.convertValuedecimal((operand[1].split("#"))[1]);
            //parseInt(((this.line_code[this.SPF["pc"]]).split("#"))[1].replace('\h',''),16);
            break;
        case 4:
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]; 
            break;
        case 5: // mov a,direct
            //operand =  (this.line_code[this.SPF["pc"]]).split(",");
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]] = (this.IRAM[parseInt(operand[1].replace('\h',''),16)]);
           // console.log("The data is operand 1 is "+operand[1].replace('\h',''));
          //  console.log("The value to update is "+parseInt(this.IRAM[operand[1].replace('\h','')],16));
            break;
        case 6:
            // mov direct,#data
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] = this.convertValuedecimal((operand[1].split("#"))[1]); // parseInt(operand[1].replace('\#','').replace('\h',''),16);
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
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
            if(operand[1] == "dptr")
            {
              var dpl = this.IRAM[this.SPF["dpl"][1]];
              var dph = this.IRAM[this.SPF["dph"][1]];
              var val = (dpl|(dph<<8)) + 1;
              this.IRAM[this.SPF["dpl"][1]] = val & 0xff;
              this.IRAM[this.SPF["dph"][1]] = (val & 0xff00) >> 8;
            }
            else
            {
                
            this.IRAM[this.SPF[operand[1]][1]] = (this.IRAM[this.SPF[operand[1]][1]] +1) & 0xff;
            }
            break;
        case 12: 
            // increment r[0-7] +1 12
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
            this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = (this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] + 1) & 0xff; 
            break;
        case 13:
           //  increment direct address value +1 13
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
            this.IRAM[parseInt(operand[1].replace('\h',''),16)] = (this.IRAM[parseInt(operand[1].replace('\h',''),16)]+1) & 0xff;
            
            break;
            
        case 14: 
         // increment indirect address + 1 14
            operand = ((this.line_code[this.SPF["pc"]]).split("@"));
            this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] = (this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] + 1) & 0xff;
        break;
        case 15: 
            // mov dpl|h immediate
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
           // console.log("dpl is : " + parseInt(operand[1].replace('\#','').replace('\h',''),16));
            this.IRAM[this.SPF[operand[0]][1]] = this.convertValuedecimal((operand[1].split("#"))[1]); 
            //parseInt(operand[1].replace('\#','').replace('\h',''),16);
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
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] = this.IRAM[this.SPF[operand[1]][1]];            
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
            var temp2 = this.IRAM[this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]];
            this.IRAM[this.SPF["a"][1]] = temp2;
            this.IRAM[this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]] = temp1;
            // Update status word for priority
            //this.setPSWpriority();
            
     
            break;
        case 29:
            // XCH A, direct 29
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var temp1 = this.IRAM[this.SPF["a"][1]];
            var temp2 = this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            this.IRAM[this.SPF["a"][1]] = temp2;
            this.IRAM[parseInt(operand[1].replace('\h',''),16)] = temp1;
            // update status word for priority
            //this.setPSWpriority();
            break;
        case 30:
            // XCH A, Rn 30
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var temp1 = this.IRAM[this.SPF["a"][1]];
            var temp2 = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = temp1;
            this.IRAM[this.SPF["a"][1]] = temp2;
            // update status work for priority
            //this.setPSWpriority();
            
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
            this.IRAM[this.IRAM[parseInt(this.SPF[operand[0].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] =  this.convertValuedecimal((operand[1].split("#"))[1]); 
            //parseInt(operand[1].replace('\#','').replace('\h',''),16);
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
             var temp = this.ERAM[this.IRAM[parseInt(this.SPF[operand[1].replace('\@','')][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]];
             this.IRAM[this.SPF[operand[0]][1]] = temp;
             //console.log("Temp val = "+temp);
             
            
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
        case 39:
            // push acc 39
            this.SPF["sp"] = this.SPF["sp"] + 1;
            this.IRAM[this.SPF["sp"]] = this.IRAM[this.SPF["a"][1]];
            break;
        case 40:
            // push b 40
            this.SPF["sp"] = this.SPF["sp"] + 1;
            this.IRAM[this.SPF["sp"]] = this.IRAM[this.SPF["b"][1]];
            break;
        case 41:
            // push direct 41
            operand = ((this.line_code[this.SPF["pc"]]).split(" "));
            this.SPF["sp"] = this.SPF["sp"] + 1;
            this.IRAM[this.SPF["sp"]] =  this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            break;
        case 42:
            // pop acc 42
            this.IRAM[this.SPF["a"][1]] =   this.IRAM[this.SPF["sp"]];
            this.SPF["sp"] = this.SPF["sp"] - 1;
            break;
        case 43:
            // pop b 43 
            this.IRAM[this.SPF["b"][1]] =  this.IRAM[this.SPF["sp"]];
            this.SPF["sp"] = this.SPF["sp"] - 1;
            break;
        case 44:
            // pop direct 44
            operand = ((this.line_code[this.SPF["pc"]]).split(" "));
             this.IRAM[parseInt(operand[1].replace('\h',''),16)] =  this.IRAM[this.SPF["sp"]];
            this.SPF["sp"] = this.SPF["sp"] - 1;
            break;
        case 45:
            // sp #immediate
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.SPF["sp"] =  this.convertValuedecimal((operand[1].split("#"))[1]);
            //parseInt(operand[1].replace('\#','').replace('\h',''),16);
            break;
        case 46: //XCHD A, @R1
           // operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split("@");    
            var temp1 = this.IRAM[this.SPF["a"][1]];
            var temp2 = this.IRAM[this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]];
            
            this.IRAM[this.SPF["a"][1]] = (temp1 & 0xF0) | (temp2& 0x0F);
            this.IRAM[this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]] = (temp2 & 0xF0) | (temp1 & 0x0F);
            break;   
        case 47: //add a,#immediate
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = 0x0FF & this.convertValuedecimal((operand[1].split("#"))[1]); //parseInt(operand[1].replace('\#','').replace('\h',''),16);
            this.opcode_Add(data_a,data_b,0);
            
            break;
        case 48: // add a,indirect  48
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split("@");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = 0x0FF & this.IRAM[this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]];
            this.opcode_Add(data_a,data_b,0);
            
            break;
        case 49:// add a,direct 49
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            this.opcode_Add(data_a,data_b,0);
            
            
            break;
        case 50: // add a,register 50
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            console.log("the data for reg is : "+data_a +" b " +data_b);
            this.opcode_Add(data_a,data_b,0);
            
            break;
        case 51:// addc a,#immediate 51
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = 0x0FF & this.convertValuedecimal((operand[1].split("#"))[1]); //parseInt(operand[1].replace('\#','').replace('\h',''),16);
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_Add(data_a,data_b,data_c);
            
            break;
        case 52: // addc a,indirect 52
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split("@");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = 0x0FF & this.IRAM[this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]];
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_Add(data_a,data_b,data_c);
            //this.opcode_Add(data_a,data_b,0);
            break;
        case 53:// addc a,direct 53
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_Add(data_a,data_b,data_c);
            
            break;
        case 54:// addc a,register 54
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_Add(data_a,data_b,data_c);
            break;
        case 55:
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = 0x0FF & parseInt(operand[1].replace('\#','').replace('\h',''),16);
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_sub(data_a,data_b,data_c);
            break;
        case 56:// subb a,indirect
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split("@");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = 0x0FF & this.IRAM[this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]];
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_sub(data_a,data_b,data_c);
            break;
        case 57://subb a,direct
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = this.IRAM[parseInt(operand[1].replace('\h',''),16)];
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_sub(data_a,data_b,data_c);
            break;
        case 58: // subb a,register
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_sub(data_a,data_b,data_c);
            break;
        case 59: // clear a
            this.IRAM[0xe0] = 0x0;
            break
        case 60:// clear given addresst
            // call function to set 
            //
            var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            loc = parseInt(operand[0].replace('\h','').replace(' ',''),16);
            this.set_clr_bit(loc,0);
            break;
        case 61: // clear spf 
            var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
           // loc = parseInt(operand[0].replace('\h','').replace(' ',''),16);
           // console.log("Reachced clear spf " + operand);
            loc = operand[0].split(".");
            //console.log("loc values " + loc);
            if(loc[0] == "acc")
            {
                loc[0] = "a";
            }
            //console.log("Loc values " + loc);
            loc = this.SPF[loc[0]][1]+parseInt(loc[1],16);
            this.set_clr_bit(loc,0);
            break;
        case 62:
            this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),0);
            break;
            
            case 63:// setb given addresst
            // call function to set 
            //
            var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            loc = parseInt(operand[0].replace('\h','').replace(' ',''),16);
            this.set_clr_bit(loc,1);
            break;
        case 64: // setb spf 
            var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
           // loc = parseInt(operand[0].replace('\h','').replace(' ',''),16);
            //console.log("Reachced clear spf " + operand);
            loc = operand[0].split(".");
            //console.log("loc values " + loc);
            if(loc[0] == "acc")
            {
                loc[0] = "a";
            }
            //console.log("Loc values " + loc);
            loc = this.SPF[loc[0]][1]+parseInt(loc[1],16);
            this.set_clr_bit(loc,1);
            break;
            case 65:
            this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),1);
            break;
            case 66:
                // da a 
                // condition if lower nibble is > 9 add 6 to lower nibble or AC is 1 add 06 to a
                // if CY = 1 or higher nibble > 9 add 60h
                // flags affected is CY due to addition and parity 
                
                var to_add = 0x00;
                var psw = this.IRAM[this.SPF["psw"][1]];
                var acc = this.IRAM[this.SPF["a"][1]];
                var bcd = 0x00;
                if((psw & 0x80) || (acc&0xF0) > 0x9f)
                {
                    to_add = to_add | 0x60;
                }
                if((psw & 0x40) || (acc&0x0f)>0x09)
                {
                    to_add = to_add | 0x06;
                }
                
                bcd = acc + to_add;
                if((bcd & 0xf0) > 0x09)
                {
                    bcd = bcd + 0x60;
                }
                
                this.IRAM[this.SPF["a"][1]] = bcd & 0xff;
                // update the carry flag
                this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),(bcd&0x300)?1:0);
                break;
        // decrement by 1 
        case 67:
            // decrement a-1 11
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
            if(operand[1] == "dptr")
            {
              var dpl = this.IRAM[this.SPF["dpl"][1]];
              var dph = this.IRAM[this.SPF["dph"][1]];
              var val = (dpl|(dph<<8)) - 1;
              this.IRAM[this.SPF["dpl"][1]] = val & 0xff;
              this.IRAM[this.SPF["dph"][1]] = (val & 0xff00) >> 8;
            }
            else
            {
                
            this.IRAM[this.SPF[operand[1]][1]] = (this.IRAM[this.SPF[operand[1]][1]] - 1) & 0xff;
            }
            break;
        case 68: 
            // decrement r[0-7] +1 12
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
            this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] = (this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)] - 1) & 0xff; 
            break;
        case 69:
           //  decrement direct address value +1 13
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
            this.IRAM[parseInt(operand[1].replace('\h',''),16)] = (this.IRAM[parseInt(operand[1].replace('\h',''),16)]-1) & 0xff;
            
            break;
            
        case 70: 
         // decrement indirect address + 1 14
            operand = ((this.line_code[this.SPF["pc"]]).split("@"));
            this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] = (this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]] - 1) & 0xff;
        break; 
        // logical operation 
        // and
        case 71: // and a,immediate
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]] = this.IRAM[this.SPF[operand[0]][1]] & this.convertValuedecimal((operand[1].split("#"))[1]);
           
            break;
        case 72: // and a,inditrect
            operand = ((this.line_code[this.SPF["pc"]]).split("@"));
            this.IRAM[this.SPF["a"][1]] &= this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]];
            break;
        case 73: //and a,direct
            operand =  (this.line_code[this.SPF["pc"]]).split(",");
            this.IRAM[this.SPF["a"][1]] &= (this.IRAM[parseInt(operand[1].replace('\h',''),16)]);
            break;                
         case 74: // and a,register
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF["a"][1]] &=  this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            break;
         case 75: // and c,not bit
             var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            loc = parseInt(operand[1].replace('\h','').replace('/','').replace(' ',''),16);
             var val = 0x0;
             val = (this.getBitValue(this.SPF["psw"][1]+parseInt(7,16)) & ~this.getBitValue(loc))&0x01;
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),val);
             
            break;
         case 76: // and c,bitposition
             var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            console.log("THe operand get is :"+operand[1]);
            loc = parseInt(operand[1].replace('\h','').replace(' ',''),16);
             var val = 0x0;
             val = (this.getBitValue(this.SPF["psw"][1]+parseInt(7,16)) & this.getBitValue(loc))&0x01;
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),val);
            break;
         case 77: // and direct with a 77
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] &= this.IRAM[this.SPF["a"][1]]
            break;
         case 78: // and direct with immediate data 78
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] &= this.convertValuedecimal((operand[1].split("#"))[1]);
            break;
         case 79: // 0r a,immediate
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]] = this.IRAM[this.SPF[operand[0]][1]] | this.convertValuedecimal((operand[1].split("#"))[1]);
           
            break;
        case 80: // or a,inditrect
            operand = ((this.line_code[this.SPF["pc"]]).split("@"));
            this.IRAM[this.SPF["a"][1]] |= this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]];
            break;
        case 81: //or a,direct
            operand =  (this.line_code[this.SPF["pc"]]).split(",");
            this.IRAM[this.SPF["a"][1]] |= (this.IRAM[parseInt(operand[1].replace('\h',''),16)]);
            break;                
         case 82: // or a,register
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF["a"][1]] |=  this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            break;
         case 83: // or c,not bit
             var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            loc = parseInt(operand[1].replace('\h','').replace('/','').replace(' ',''),16);
             var val = 0x0;
             val = (this.getBitValue(this.SPF["psw"][1]+parseInt(7,16)) | ~this.getBitValue(loc))&0x01;
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),val);
             
            break;
         case 84: // or c,bitposition
             var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            //console.log("THe operand get is :"+operand[1]);
            loc = parseInt(operand[1].replace('\h','').replace(' ',''),16);
             var val = 0x0;
             val = (this.getBitValue(this.SPF["psw"][1]+parseInt(7,16)) | this.getBitValue(loc))&0x01;
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),val);
            break;
         case 85: // or direct with a 77
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] |= this.IRAM[this.SPF["a"][1]]
            break;
         case 86: // or direct with immediate data 78
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             //console.log("The Values of op1 is "+operand[1]);
             var val = this.convertValuedecimal((operand[1].split("#"))[1]);
            // console.log("The Values of val = "+val);
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] |=  val;
            break;
                
            //Logical XOR gate
           case 91: // xor a,immediate
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF[operand[0]][1]] = this.IRAM[this.SPF[operand[0]][1]] ^ this.convertValuedecimal((operand[1].split("#"))[1]);
           
            break;
        case 92: // xor a,inditrect
            operand = ((this.line_code[this.SPF["pc"]]).split("@"));
            this.IRAM[this.SPF["a"][1]] ^= this.IRAM[this.IRAM[parseInt(this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]];
            break;
        case 93: //xor a,direct
            operand =  (this.line_code[this.SPF["pc"]]).split(",");
            this.IRAM[this.SPF["a"][1]] ^= (this.IRAM[parseInt(operand[1].replace('\h',''),16)]);
            break;                
         case 94: // xor a,register
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[this.SPF["a"][1]] ^=  this.IRAM[this.SPF[operand[1]][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)];
            break;
         case 95: // xor c,not bit
             var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            loc = parseInt(operand[1].replace('\h','').replace('/','').replace(' ',''),16);
             var val = 0x0;
             val = (this.getBitValue(this.SPF["psw"][1]+parseInt(7,16)) ^ ~this.getBitValue(loc))&0x01;
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),val);
             
            break;
         case 96: // xor c,bitposition
             var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            //console.log("THe operand get is :"+operand[1]);
            loc = parseInt(operand[1].replace('\h','').replace(' ',''),16);
             var val = 0x0;
             val = (this.getBitValue(this.SPF["psw"][1]+parseInt(7,16)) ^ this.getBitValue(loc))&0x01;
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),val);
            break;
         case 97: // xor direct with a 97
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] ^= this.IRAM[this.SPF["a"][1]]
            break;
         case 98: // xor direct with immediate data 98
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            this.IRAM[parseInt(operand[0].replace('\h',''),16)] ^= this.convertValuedecimal((operand[1].split("#"))[1]);    
            
        // Complement 
         case 100: // cpl a or p0-3
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
             this.IRAM[this.SPF[operand[1]][1]] = ~(this.IRAM[this.SPF[operand[1]][1]])&0xff;
             break;
         case 101: // cpl bitposition
             var loc= 0x0;
             operand = ((this.line_code[this.SPF["pc"]]).split(" "));
             loc = parseInt(operand[1].replace('\h','').replace(' ',''),16);
             this.set_clr_bit(loc,~(this.getBitValue(loc)&0x1));
             break;
         case 102: // cpl c
             var val = this.getBitValue(this.SPF["psw"][1]+parseInt(7,16));
             console.log("The values of carry is :"+val);
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),(~val&0x01));
             break;
         case 103: // cpl with spf
              var loc=0;
            operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
           // loc = parseInt(operand[0].replace('\h','').replace(' ',''),16);
            //console.log("Reachced clear spf " + operand);
            loc = operand[0].split(".");
            //console.log("loc values " + loc);
            if(loc[0] == "acc")
            {
                loc[0] = "a";
            }
            //console.log("Loc values " + loc);
            loc = this.SPF[loc[0]][1]+parseInt(loc[1],16);
            this.set_clr_bit(loc,~this.getBitValue(loc));
             
             break;
             
         case 105:// Division 
             // Quotion stored in A
             // Remainder stored in b
             // Overflow flag is set when b is zero CY = 0 always
             var a = this.IRAM[0xe0];
             var b = this.IRAM[0xf0];
             var q = 0;
             var rem = 0;
             if(b != 0)
             {
                 q = parseInt(a/b) & 0xff;
                 rem = a%b;
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(2,16),0);
             }
             else
             {
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(2,16),1);
             }
             
             this.IRAM[0xe0] = q;
             this.IRAM[0xf0] = rem;
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),0);
             break;
             
             
             
         case 106:
             
             // lower byte stored in A
             // upperbyte stored in b
             // Overflow flag is set when result more than 255 is zero CY = 0 always
             var a = this.IRAM[0xe0];
             var b = this.IRAM[0xf0];
             var result = a*b;
             var lower_byte = result & 0x00ff;
             var upper_byte = (result & 0xff00)>>8;
             console.log("THe values are "+ a+" " +b+ " " + result+ " l " +lower_byte+ " h "+upper_byte);
             
             this.IRAM[0xe0] = lower_byte;
             this.IRAM[0xf0] = upper_byte;
             if(result > 255)
             {
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(2,16),1);
             }
             else
             {
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(2,16),0);
             }
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),0);
             break;
             
         case 107: // rotate right 107 
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
             var val = this.IRAM[this.SPF[operand[1]][1]];
             var msb_upate = (val & 0x1) << 7;
             val = val >> 1;
             val |= msb_upate;
             this.IRAM[this.SPF[operand[1]][1]] = val& 0xff;
             break;
             
         case 108: // Rotate right with carry 108
             /*
              * 
              * 
              * RRC
                An = An+1 where n = 0 to 6
                A7 = C
                C = A0
              * 
              */
             
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
             var val = this.IRAM[this.SPF[operand[1]][1]];
             var msb_upate = (val & 0x1);
             val = val >> 1;
             val |= (this.getBitValue(this.SPF["psw"][1]+parseInt(7,16))<<7);
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),msb_upate);
             this.IRAM[this.SPF[operand[1]][1]] = val& 0xff;
             break;
             
         case 109: // rotate left 109
             /* 
              * RL
                An+1 = An WHERE n = 0 TO 6
                A0 = A7
              */
             operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
             var val = this.IRAM[this.SPF[operand[1]][1]];
             val = val << 1;
             val |= (val & 0x100)?1:0;
             this.IRAM[this.SPF[operand[1]][1]] = val& 0xff;
             break;
         case 110: // rotate left with carry 110
      /*       RLC
                An+1 = AN WHERE N = 0 TO 6
                A0 = C
                C = A7
        */     
            operand =  ((this.line_code[this.SPF["pc"]]).split(" "));
             var val = this.IRAM[this.SPF[operand[1]][1]];
             val = val << 1;
             //console.log("The RLC val is "+val);
             val |= this.getBitValue(this.SPF["psw"][1]+parseInt(7,16));//(val & 0x100)?1:0;
             //console.log("The RLC val after getingc "+val);
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),((val & 0x100)?1:0));
            this.IRAM[this.SPF[operand[1]][1]] = val& 0xff;
             break;
         case 115: // given bit position value
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             loc = parseInt(operand[0].replace('\h','').replace(' ',''),16);
             if(loc[0] == "acc")
            {
                loc[0] = "a";
            }
             if(this.getBitValue(loc))
             {
                 // change the pc value 
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
             }
             else
             {
                 // Do nothing 
             }
             break;
         case 116:// check if given bit name is set 
             /*
              * operand[0] holds name of bit location
              * operand[1] holds name of label
              * to getvalue of bit use getBitValue function
              */
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             loc = operand[0].split(".");
             loc = this.SPF[loc[0]][1]+parseInt(loc[1],16);
           //  console.log("The location in jb "+loc);
             if(this.getBitValue(loc))
             {
                 // change the pc value 
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
               //  console.log("The Data is " + this.pc_inc + "and label is " + operand[1]+ " ");
             }
             else
             {
                 // Do nothing 
             }
             break;
         case 117:/*
             
             JBC
            PC = PC + 3
            IF (bit) = 1
            (bit) = 0
            PC = PC + offset
             */
             
              operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             loc = parseInt(operand[0].replace('\h','').replace(' ',''),16);
             if(this.getBitValue(loc))
             {
                 // change the pc value 
                 this.set_clr_bit(loc,0);
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
             }
             else
             {
                 // Do nothing 
             }
             break;
         case 118:
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             loc = operand[0].split(".");
             loc = this.SPF[loc[0]][1]+parseInt(loc[1],16);
            // console.log("The location in jb "+loc);
             if(this.getBitValue(loc))
             {
                 // change the pc value 
                 this.set_clr_bit(loc,0); // reset the value
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
                // console.log("The Data is " + this.pc_inc + "and label is " + operand[1]+ " ");
             }
             else
             {
                 // Do nothing 
             }
             break;
             // Pending Jump Instructions, JNB,JNC,JC
         case 119: // jc label
             operand = ((this.line_code[this.SPF["pc"]]).split(" "));
              loc = this.SPF["psw"][1]+parseInt(7,16);
             if(this.getBitValue(loc))
             {
                 // change the pc value 
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
             }
             else
             {
                 // Do nothing 
             }
             
             break;
         case 121: // jnb bit,label
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             loc = operand[0].split(".");
             loc = this.SPF[loc[0]][1]+parseInt(loc[1],16);
           //  console.log("The location in jb "+loc);
             if(!this.getBitValue(loc))
             {
                 // change the pc value 
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
               //  console.log("The Data is " + this.pc_inc + "and label is " + operand[1]+ " ");
             }
             else
             {
                 // Do nothing 
             }
             
             break;
         case 122:
             /*
              * 
              * jnb spf 
              * */
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             loc = parseInt(operand[0].replace('\h','').replace(' ',''),16);
             if(loc[0] == "acc")
            {
                loc[0] = "a";
            }
             if(!this.getBitValue(loc))
             {
                 // change the pc value 
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
             }
             else
             {
                 // Do nothing 
             }
             break;
             
         case 123: // jump not carry location 
              operand = ((this.line_code[this.SPF["pc"]]).split(" "));
              loc = this.SPF["psw"][1]+parseInt(7,16);
             if(!this.getBitValue(loc))
             {
                 // change the pc value 
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
             }
             else
             {
                 // Do nothing 
             }
             break;
             
         case 125: 
             /* JNZ label
              * 
              * 
              * JNZ
                PC = PC + 2
                IF A <> 0
                PC = PC + offset
              * 
              */
             operand = ((this.line_code[this.SPF["pc"]]).split(" "));
              loc = this.SPF["a"][1];
             if(!this.IRAM[loc])
             {
                 // change the pc value 
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
             }
             else { /* Do nothing */   }
             break;
             
         case 127: 
                /* JNZ label
              * 
              * 
              * JNZ
                PC = PC + 2
                IF A <> 0
                PC = PC + offset
              * 
              */
             operand = ((this.line_code[this.SPF["pc"]]).split(" "));
              loc = this.SPF["a"][1];
             if(this.IRAM[loc])
             {
                 // change the pc value 
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[operand[1]];
             }
             else { /* Do nothing */   }
             break;
             //swap instruction
         case 131: // swap a
             /* SWAP
                A3-0 swap A7-4
                */
             operand = ((this.line_code[this.SPF["pc"]]).split(" "));
             var val = this.IRAM[this.SPF[operand[1]][1]];
             this.IRAM[this.SPF[operand[1]][1]] = ((val&0xf0) >> 4) | ((val&0x0f) << 4);
             break;
             
         case 132: // mov c,bitposition
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),this.getBitValue(operand[1].replace('\h','')));
             break;
         case 133: // mov bit,c
              operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             this.set_clr_bit(operand[0].replace('\h',''),this.getBitValue(this.SPF["psw"][1]+parseInt(7,16)));
             break;
         case 134: // sjmp label
             /*
              * 
              *  Keeping the same as that of jmp if required need to modify
              * */
             operand =  (this.line_code[this.SPF["pc"]]).split(" ");
            this.pc_inc_flag = 1;
            this.pc_inc = this.labels[operand[1]];
             break;
         case 135: // No operation
             break;
         case 136: // END of simulation
             this.debugStop();
             this.stop();
             break;
         case 137:
              operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = this.IRAM[this.SPF[operand[1]][1]];
            this.opcode_Add(data_a,data_b,0);
             break;
         case 138:
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = this.IRAM[this.SPF[operand[1]][1]];
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_Add(data_a,data_b,data_c);
             
             break;
         case 139:
              operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
            var data_a = this.IRAM[this.SPF["a"][1]];
            var data_b = this.IRAM[this.SPF[operand[1]][1]];
            var data_c = (this.IRAM[this.SPF["psw"][1]] & 0x80) ? 1:0;
            this.opcode_sub(data_a,data_b,data_c);
             
             break;
         case 140:
             /*
              * PC = PC + 3
                IF (@Ri) <> immedate
                PC = PC + offset
                IF (@Ri) < immediate
                C = 1
                ELSE
                C = 0
              * 
              * 
              */
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             var loc = operand[0].replace('@','');
             var offsets = operand[2];
             var val_test = this.IRAM[this.IRAM[parseInt(this.SPF[loc][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)]];
             var imm_value = this.convertValuedecimal((operand[1].replace('#','')));
             console.log("The Value are " + val_test +" imm = " + imm_value + " offset = "+offsets);
             if(val_test < imm_value)
             {
              // set carry flag   
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[offsets];
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),1);
             }
             else if( val_test > imm_value)
             {
              // Clear carry
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[offsets];
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),0);
                 
             }
             else
             {
                 // Do nothing
             }
            
             
             break;
         case 141:// CJNE rn, immediate, offset
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             var loc = operand[0];
             var offsets = operand[2];
             var val_test = 0;
            // if(loc == "r0" || loc == "r1" || loc == "r2" || loc == "r3" || loc == "r4" || loc == "r5" || loc == "r6" || loc == "r7")
             {   
             val_test = this.IRAM[parseInt(this.SPF[loc][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)];
             }
            // else
             //{
              //   val_test = this.IRAM[this.SPF[loc][1]];
            // }
             var imm_value = this.convertValuedecimal((operand[1].replace('#','')));
             console.log("The Value are " + val_test +" imm = " + imm_value + " offset = "+offsets);
             if(val_test < imm_value)
             {
              // set carry flag   
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[offsets];
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),1);
             }
             else if( val_test > imm_value)
             {
              // Clear carry
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[offsets];
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),0);
                 
             }
             else
             {
                 // Do nothing
             }
             break;
         case 142: // CJNE A, immediate
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             var loc = operand[0];
             var offsets = operand[2];
             var val_test = this.IRAM[parseInt(this.SPF[loc][1],16)];
             var imm_value = this.convertValuedecimal((operand[1].replace('#','')));
             console.log("The Value are " + val_test +" imm = " + imm_value + " offset = "+offsets);
             if(val_test < imm_value)
             {
              // set carry flag   
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[offsets];
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),1);
             }
             else if( val_test > imm_value)
             {
              // Clear carry
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[offsets];
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),0);
                 
             }
             else
             {
                 // Do nothing
             }
             break;
         case 143: // CJNE rn,direct,offset 
             operand = ((this.line_code[this.SPF["pc"]]).split(" "))[1].split(",");
             var loc = operand[0];
             var offsets = operand[2];
             //var val_test = this.IRAM[parseInt(this.SPF[loc][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)];
             var imm_value = this.IRAM[parseInt(operand[1].replace('h',''),16)];
             var val_test = 0;
             if(loc == "r0" || loc == "r1" || loc == "r2" || loc == "r3" || loc == "r4" || loc == "r5" || loc == "r6" || loc == "r7")
             {   
             val_test = this.IRAM[parseInt(this.SPF[loc][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8),16)];
             }
             else
             {
                 val_test = this.IRAM[this.SPF[loc][1]];
             }
             
             
             
             console.log("143 The Value are " + val_test +" imm = " + imm_value + " offset = "+offsets+ " Dir = "+operand[1]);
             if(val_test < imm_value)
             {
              // set carry flag   
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[offsets];
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),1);
             }
             else if( val_test > imm_value)
             {
              // Clear carry
                 this.pc_inc_flag = 1;
                 this.pc_inc = this.labels[offsets];
                 this.set_clr_bit(this.SPF["psw"][1]+parseInt(7,16),0);
                 
             }
             else
             {
                 // Do nothing
             }
             
             break;
        default: break;
    }
    
 // Set priority update always   
 this.setPSWpriority();   
}
this.getBitValue = function (loc)
{
    
      var base = 0x0;
    var iloc = 0x0;
    var bitposition = 0;
    var data= 0x0;
   // console.log("The get loc = "+loc);
 if(loc < 0x7f)
 {
     base = 0x20;
     // this is between IRAM 20-2F   
     // finding iram location
     iloc = base+parseInt(loc/8,16);
     bitposition = parseInt(loc%8);
     data = this.IRAM[iloc];
     
     data = (data & 1 << bitposition);
    
     
 }
 else if(loc >= 0x80 && loc <= 0xBF) 
 {
     
     base = 0x80;
     bitposition = parseInt(loc%8);
     data = this.IRAM[iloc];
     
     data = (data & 1 << bitposition);
    
     
 }
 else if(loc >= 0xE0 && loc <= 0xe7)
 {
     base = 0xe0;
     bitposition = parseInt(loc%8);
     iloc = base;
     data = this.IRAM[iloc];
     
     data = (data & 1 << bitposition);
     
 }
 else if(loc >= 0xf0 && loc <= 0xf7)
 {
     base = 0xf0;
     iloc = base;
     bitposition = parseInt(loc%8);
     data = this.IRAM[iloc];
     
     data = (data & 1 << bitposition);
     
 }
 else if(loc >= 0xd0 && loc <= 0xd7)
 {
    
     base = 0xd0;
     iloc = base;
     bitposition = parseInt(loc%8);
     data = this.IRAM[iloc];
     
     data = (data & 1 << bitposition);
  
 }
 console.log("THe data bit is :" + data);
 return (data?1:0);
 
}
this.set_clr_bit = function (loc,set_clr)
{
    var base = 0x0;
    var iloc = 0x0;
    var bitposition = 0;
    var data= 0x0;
    console.log("The loc = "+loc);
 if(loc < 0x7f)
 {
     base = 0x20;
     // this is between IRAM 20-2F   
     // finding iram location
     iloc = base+parseInt(loc/8,16);
     bitposition = parseInt(loc%8);
     data = this.IRAM[iloc];
     
     data = (data | 1 << bitposition);
  //   console.log("The loc = "+loc+" iloc = "+iloc+" bitposition = "+bitposition); 
     if(!set_clr)
     {
     data = data & ( ~(1 << bitposition) & 0xff);
     }
     this.IRAM[iloc] = data;
     
 }
 else if(loc >= 0x80 && loc <= 0xBF) 
 {
     
     base = 0x80;
     bitposition = parseInt(loc%8);
     data = this.IRAM[iloc];
     
     data = (data | 1 << bitposition);
  //   console.log("The loc = "+loc+" iloc = "+iloc+" bitposition = "+bitposition); 
     if(!set_clr)
     {
     data = data & ( ~(1 << bitposition) & 0xff);
     }
     this.IRAM[iloc] = data;
     
 }
 else if(loc >= 0xE0 && loc <= 0xe7)
 {
     base = 0xe0;
     bitposition = parseInt(loc%8);
     iloc = base;
     data = this.IRAM[iloc];
     
     data = (data | 1 << bitposition);
    // console.log("The loc = "+loc+" iloc = "+iloc+" bitposition = "+bitposition); 
     if(!set_clr)
     {
     data = data & ( ~(1 << bitposition) & 0xff);
     }
     this.IRAM[iloc] = data;
 }
 else if(loc >= 0xf0 && loc <= 0xf7)
 {
     base = 0xf0;
     iloc = base;
     bitposition = parseInt(loc%8);
     data = this.IRAM[iloc];
     
     data = (data | 1 << bitposition);
   //  console.log("The loc = "+loc+" iloc = "+iloc+" bitposition = "+bitposition); 
     if(!set_clr)
     {
     data = data & ( ~(1 << bitposition) & 0xff);
     }
     this.IRAM[iloc] = data;
 }
 else if(loc >= 0xd0 && loc <= 0xd7)
 {
    
     base = 0xd0;
     iloc = base;
     bitposition = parseInt(loc%8);
     data = this.IRAM[iloc];
     
     data = (data | 1 << bitposition);
 //    console.log("psw The loc = "+loc+" iloc = "+iloc+" bitposition = "+bitposition); 
     if(!set_clr)
     {
     data = data & ( ~(1 << bitposition) & 0xff);
     }
     this.IRAM[iloc] = data;
 }
     
    
}
this.setPSWpriority = function ()
{ // can merge this with set_clr_bit function 
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
   // console.log(ps_t & ( 0xFE | (priority?1:0)));
    this.IRAM[this.SPF["psw"][1]] = ps_t & ( 0xFE | (priority?1:0)); 
}
this.opcode_Add = function (data_a,data_b,data_c)
{
    var temp = (data_a&0xff) + (data_b&0xff ) + (data_c&0xff);
            var aux_cy = (data_a&0x0f) + (data_b&0x0f) + data_c;
            var over_flow = ((data_a&0x7F) + (data_b&0x7F) + data_c) & 0x80;
            var cy = temp & 0x100;
            // carry 
            var ps_t = this.IRAM[this.SPF["psw"][1]];
    ps_t = ps_t | 0x80;
            this.IRAM[this.SPF["psw"][1]] =  (((cy) >> 1) | 0x7F) & ps_t;
          //  console.log("After CY : "+ this.IRAM[this.SPF["psw"][1]].toString(16));
            // Aux carry 
            ps_t = 0;
            ps_t = this.IRAM[this.SPF["psw"][1]];
    ps_t = (ps_t | 0x40);
            this.IRAM[this.SPF["psw"][1]] = (((aux_cy & 0x10) << 2) | 0xBF) & ps_t;
            //console.log("After AC : "+ parseInt(this.IRAM[this.SPF["psw"][1]]).toString(16)+"ac =  "+((aux_cy & 0x10) >>2)+ " ps_t = " +ps_t);
            // Overflow 
            ps_t = this.IRAM[this.SPF["psw"][1]];
    ps_t = ps_t | 0x04;
            if((cy && !over_flow) || (!cy && over_flow))
            {
                this.IRAM[this.SPF["psw"][1]] = ps_t & 0x0FF; 
            }
            else
            {
                 this.IRAM[this.SPF["psw"][1]] = ps_t & 0x0FB;
            }
            //console.log("After ov : "+ this.IRAM[this.SPF["psw"][1]].toString(16));
            // Update A value
            this.IRAM[this.SPF["a"][1]] = temp & 0xFF;
            
}

this.opcode_sub = function (data_a,data_b,data_c)
{
    var temp = data_a - data_b - data_c;
            var aux_cy = (data_a&0x0f) - (data_b&0x0f) - data_c;
            var over_flow = ((data_a&0x7F) - (data_b&0x7F) - data_c) & 0x80;
            var cy = temp & 0x100;
            // carry 
            var ps_t = this.IRAM[this.SPF["psw"][1]];
    ps_t = ps_t | 0x80;
            this.IRAM[this.SPF["psw"][1]] =  (((cy) >> 1) | 0x7F) & ps_t;
          //  console.log("After CY : "+ this.IRAM[this.SPF["psw"][1]].toString(16));
            // Aux carry 
            ps_t = 0;
            ps_t = this.IRAM[this.SPF["psw"][1]];
    ps_t = (ps_t | 0x40);
            this.IRAM[this.SPF["psw"][1]] = (((aux_cy & 0x10) << 2) | 0xBF) & ps_t;
            //console.log("After AC : "+ parseInt(this.IRAM[this.SPF["psw"][1]]).toString(16)+"ac =  "+((aux_cy & 0x10) >>2)+ " ps_t = " +ps_t);
            // Overflow 
            ps_t = this.IRAM[this.SPF["psw"][1]];
    ps_t = ps_t | 0x04;
            if((cy && !over_flow) || (!cy && over_flow))
            {
                this.IRAM[this.SPF["psw"][1]] = ps_t & 0x0FF; 
            }
            else
            {
                 this.IRAM[this.SPF["psw"][1]] = ps_t & 0x0FB;
            }
            //console.log("After ov : "+ this.IRAM[this.SPF["psw"][1]].toString(16));
            // Update A value
            this.IRAM[this.SPF["a"][1]] = temp & 0xFF;
            
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
     console.log("Return at first getcode");
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
 
 values += "<tr> <td> Acc </td> <td> 0x"+(this.IRAM[this.SPF["a"][1]]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> B </td> <td> 0x"+(this.IRAM[this.SPF["b"][1]]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R0 </td> <td> 0x"+(this.IRAM[this.SPF["r0"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R1 </td> <td> 0x"+(this.IRAM[this.SPF["r1"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R2 </td> <td> 0x"+(this.IRAM[this.SPF["r2"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R3 </td> <td> 0x"+(this.IRAM[this.SPF["r3"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R4 </td> <td> 0x"+(this.IRAM[this.SPF["r4"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R5 </td> <td> 0x"+(this.IRAM[this.SPF["r5"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R6 </td> <td> 0x"+(this.IRAM[this.SPF["r6"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> R7 </td> <td> 0x"+(this.IRAM[this.SPF["r7"][1]+(((this.IRAM[this.SPF["psw"][1]]&0x18)>>3)*8)]&0xff).toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> DPL </td> <td> 0x"+this.IRAM[this.SPF["dpl"][1]].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> DPH </td> <td> 0x"+this.IRAM[this.SPF["dph"][1]].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> PSW </td> <td> 0x"+this.IRAM[this.SPF["psw"][1]].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> PC</td> <td> 0x"+this.SPF["pc"].toString(this.radix)+"</td> </tr>";
 values += "<tr> <td> SP</td> <td> 0x"+this.SPF["sp"].toString(this.radix)+"</td> </tr>";
 values += "</table></div>";
 
 document.getElementById("spr_8051").innerHTML = values;
//console.log("Inside showSFR");
}
this.showPorts = function ()
{
    var values = "";
   
    values += "<div class=\"table-responsive overflow-auto\" style=\"height:250px\"> <table class=\"table\"> <tr> <th>  SFR </th> <th> Values </th></tr>";
    values += "<tr> <td> P0 </td> <td> 0x"+this.IRAM[this.SPF["p0"][1]].toString(this.radix)+"</td> </tr>";
    values += "<tr> <td> P1 </td> <td> 0x"+this.IRAM[this.SPF["p1"][1]].toString(this.radix)+"</td> </tr>";
    values += "<tr> <td> P2 </td> <td> 0x"+this.IRAM[this.SPF["p2"][1]].toString(this.radix)+"</td> </tr>";
    values += "<tr> <td> P3 </td> <td> 0x"+this.IRAM[this.SPF["p3"][1]].toString(this.radix)+"</td> </tr>";
     values += "</table></div>";
     document.getElementById("ports").innerHTML = values;
     
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
 return  parseInt(this.ERAM[parseInt(address,16)],16);
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
this.exe_msg = " ";
this.stop_flag = 0;

this.update();
}
}

function getERAMvalue()
{
  document.getElementById('exvalues').value =asm_exe.getERAMvalue(document.getElementById("eadrr_search").value);
}

function updateERAMvalue()
{
  asm_exe.updateERAMvalue(document.getElementById("eadrr_search").value, document.getElementById('exvalues').value);  
}

