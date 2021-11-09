var express = require('express');
var router = express.Router();
const pool = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const jwt = require('jsonwebtoken');
const { json, request, response } = require('express');
const { errors } = require('pg-promise');
const Joi = require('@hapi/joi');
const joi = require('@hapi/joi');


router.get('/timesheet',verify,(request, response) => {

  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 
  var projectName ='';
  pool
  .query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',[userId])
  .then(contactResult => {
    console.log('Name of Contact  ::     '+contactResult.rows[0].name+' sfid'+contactResult.rows[0].sfid);
    var contactId = contactResult.rows[0].sfid;
      pool
      .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[contactId])
      .then(teamMemberResult => {
        console.log('Name of TeamMemberId  : '+teamMemberResult.rows[0].name+'   sfid :'+teamMemberResult.rows[0].sfid);
        console.log('Team Id  : '+teamMemberResult.rows[0].team__c);
        console.log('Number of Team Member '+teamMemberResult.rows.length);
        
        var projectTeamparams = [], lstTeamId = [];
        for(var i = 1; i <= teamMemberResult.rows.length; i++) {
          projectTeamparams.push('$' + i);
          lstTeamId.push(teamMemberResult.rows[i-1].team__c);
        } 
        var projectTeamQueryText = 'SELECT sfid, Name, Project__c FROM salesforce.Project_Team__c WHERE Team__c IN (' + projectTeamparams.join(',') + ')';
        console.log('projectTeamQueryText '+projectTeamQueryText);
        
          pool
          .query(projectTeamQueryText,lstTeamId)
          .then((projectTeamResult) => {
              console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
              console.log('projectTeam Name '+projectTeamResult.rows[0].name);

              var projectParams = [], lstProjectId = [];
              for(var i = 1; i <= projectTeamResult.rows.length; i++) {
                projectParams.push('$' + i);
                lstProjectId.push(projectTeamResult.rows[i-1].project__c);
              } 
              console.log('lstProjectId  : '+lstProjectId);
              var projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';

              pool.
              query(projetQueryText, lstProjectId)
              .then((projectQueryResult) => { 
                    console.log('Number of Projects '+projectQueryResult.rows.length);
                    console.log('Project sfid '+projectQueryResult.rows[0].sfid+ 'Project Name '+projectQueryResult.rows[0].name);
                    var projectList = projectQueryResult.rows;
                    var lstProjectId = [], projectParams = [];
                    var j = 1;
                    projectList.forEach((eachProject) => {
                      console.log('eachProject sfid : '+eachProject.sfid);
                      lstProjectId.push(eachProject.sfid);
                      projectParams.push('$'+ j);
                      console.log('eachProject name : '+eachProject.name);
                      j++;
                    });


                  var taskQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Task__c  WHERE Project_Name__c IN ('+projectParams.join(',')+') AND  Project_Milestone__c IN (SELECT sfid FROM salesforce.Milestone1_Milestone__c WHERE Name = \'Timesheet Category\') AND sfid IS NOT NULL';
                  console.log('taskQueryText  : '+taskQueryText);



                    pool
                    .query(taskQueryText, lstProjectId)
                    .then((taskQueryResult) => {
                        console.log('taskQueryResult  rows '+taskQueryResult.rows.length);
                        response.send({projectList : projectQueryResult.rows, contactList : contactResult.rows, taskList : taskQueryResult.rows }); // render calendar
                    })
                    .catch((taskQueryError) => {
                        console.log('taskQueryError : '+taskQueryError.stack);
                       // response.send({projectList : projectQueryResult.rows, contactList : contactResult.rows, taskList : taskQueryResult.rows }); // render calendar
                    })
                    
              })
              .catch((projectQueryError) => {
                    console.log('projectQueryError '+projectQueryError.stack);
              })
           
          })
            .catch((projectTeamQueryError) =>{
              console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
            })          
        })
        .catch((teamMemberQueryError) => {
        console.log('Error in team member query '+teamMemberQueryError.stack);
        })

      }) 
      .catch(contactQueryError => console.error('Error executing contact query', contactQueryError.stack));

});



router.get('/getevents',verify, function(req, res, next) 
{
    
    var user = 'manager';
    
    console.log('Expense request.user '+JSON.stringify(request.user));
    var userId = request.user.sfid; 

    
        pool
        .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[userId])
        .then((teamMemberResult) => {
            res.send(teamMemberResult);
        })
        .then((teamMemberResult) => {
            res.send(teamMemberResult);
        })
        .catch((teamMemberQueryError) => {
            res.send(teamMemberQueryError.stack);
        });
   

   /*  console.log('req.query :'+req.query.date);
    var strdate = req.query.date;
    console.log('typeof date '+typeof(strdate));
    //  var selectedDate = new Date(strdate);
    var selectedDate = new Date('2020/02/01');
    // var year = selectedDate.getFullYear();
    var year = 2020;
    // var month = selectedDate.getMonth();
    var month = 01;
    console.log('Month '+selectedDate.getMonth());
    console.log('Year : '+selectedDate.getFullYear());
    var numberOfDays = new Date(year, month+1, 0).getDate();
    console.log('numberOfDays : '+numberOfDays);
    
    var lstEvents = [];
    for(let i = 1;i <= 31 ; i++)
    {
      lstEvents.push({
          title : 'Fill Actuals',
          start : year+'-'+(month+1)+'-'+i,
          end : year+'-'+(month+1)+'-'+i
      });
      lstEvents.push({
        title : 'Create Task',
        start : year+'-'+(month+1)+'-'+i,
        end : year+'-'+(month+1)+'-'+i
      });
      lstEvents.push({
        title : 'Details',
        start : year+'-'+(month+1)+'-'+i,
        end : year+'-'+(month+1)+'-'+i
      });
      lstEvents.push({
        title : 'Planned Hours',
        start : year+'-'+(month+1)+'-'+i,
        end : year+'-'+(month+1)+'-'+i
      });
      lstEvents.push({
        title : 'Actual Hours',
        start : year+'-'+(month+1)+'-'+i,
        end : year+'-'+(month+1)+'-'+i
      });
      lstEvents.push({
        title : 'Date : '+year+'-'+(month+1)+'-'+i,
        start : year+'-'+(month+1)+'-'+i,
        end : year+'-'+(month+1)+'-'+i
      });
    } 
     //console.log('JSON.strigify '+JSON.stringify(lstEvents));
      res.send(lstEvents); */
   });





router.get('/getdata',verify, function(req, response, next) 
{

  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 
    
        pool
        .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[userId])
        .then((teamMemberResult) => {
            response.send(teamMemberResult);
            if(teamMemberResult.rowCount > 0)
            {
                const lstTeamId = [] , lstTeamIdParams = [];
                for(let i =1 ; i <= iteamMemberResult.rowCount ; i++)
                {
                    lstTeamIdParams.push('$'+i);
                    lstTeamId.push(iteamMemberResult[i-1].Team__c);
                }

                if(lstTeamId.length > 0 && lstTeamIdParams.length >0)
                {
                    var projectTeamQueryText = 'SELECT sfid, Name, Project__c FROM salesforce.Project_Team__c WHERE Team__c IN (' + lstTeamIdParams.join(',') + ')';
                    pool
                    .query(projectTeamQueryText,lstTeamId)
                    .then((projectTeamQueryResult) => {
                        response.send(projectTeamQueryResult);
                    })
                    .catch((projectTeamQueryError) => {
                        response.send(projectTeamQueryError.stack);
                    })
                }
            }
        })
        .catch((teamMemberQueryError) => {
            response.send(teamMemberQueryError.stack);
        });
});

router.post('/createtask',async (request, response) => {
  var formData = request.body;
  console.log('formData  '+JSON.stringify(formData));
  console.log('ffff '+formData.taskname);
  var startTime,endTime;
  var suffixStart = '';
  var suffixEnd = '';
var taskname = formData.taskname,
      status = formData.status,
      projectname = formData.projectname, 
      taskdate = formData.taskdate, 
      assignedresource = formData.assignedresource,
      tasktype = formData.tasktype,
      plannedstarttime = formData.plannedstarttime,
      plannedendtime = formData.plannedendtime;
      deadline = formData.deadline,

console.log('taskname '+taskname);
console.log('status : '+status);
console.log('projectname  '+projectname);
console.log('taskdate '+taskdate);
var dateParts = taskdate.split('/');

console.log('assignedresource  '+assignedresource);
console.log('tasktype   '+tasktype);

console.log('plannedstarttime  '+plannedstarttime);
console.log('plannedendtime '+plannedendtime);
console.log('deadline '+deadline);
let schema,result ; 
if(deadline == undefined || deadline == '')
{
  console.log('deadline Null/undefine');
   schema=joi.object({
    taskname:joi.string().min(3).required().label('Please enter Task Description!'),
    task:joi.string().invalid(' ').required().label('Please enter Task Description!'),
    taskn:joi.string().min(1).max(80).required().label(' Task Description too long.'),
    projectname:joi.string().required().label('Please select Project !'),
    type:joi.string().required().label('Please select Task Type !'),
    status:joi.string().invalid('None').required().label('Please choose Status'),
    assignedresource:joi.string().invalid('None').required().label('Please Assign Resource!'),

   // depart:joi.string().min(1).max(255).required().label('Department value too long.'),
      })

 result=schema.validate({taskname:taskname,task:taskname,taskn:taskname,type:tasktype,projectname:projectname,status:request.body.status,assignedresource:assignedresource});
}

else if(deadline == 'Select')
{
  console.log('select');
  schema=joi.object({
    taskname:joi.string().min(3).required().label('Please enter Task Description!'),
    task:joi.string().invalid(' ').required().label('Please enter Task Description!'),
    taskn:joi.string().min(1).max(80).required().label(' Task Description too long.'),
    projectname:joi.string().required().label('Please select Project !'),
    type:joi.string().required().label('Please select Task Type !'),
    status:joi.string().invalid('None').required().label('Please choose Status'),
    assignedresource:joi.string().invalid('None').required().label('Please Assign Resource!'),

    deadline:joi.string().invalid('Select').required().label('Please select Deadline Type!'),

  })
  result=schema.validate({deadline:deadline,taskname:taskname,task:taskname,taskn:taskname,type:tasktype,projectname:projectname,status:request.body.status,assignedresource:assignedresource});

 // result=schema.validate({deadline:deadline});
}
else if(deadline == 'Deadlines')
{
  console.log('Deadlines');
  schema=joi.object({
    taskname:joi.string().min(3).required().label('Please enter Task Description!'),
    task:joi.string().min(3).required().label('Please enter Task Description!'),
    taskn:joi.string().min(1).max(80).required().label(' Task Description too long.'),
    projectname:joi.string().required().label('Please select Project !'),
    type:joi.string().required().label('Please select Task Type !'),
    assignedresource:joi.string().invalid('None').required().label('Please Assign Resource!'),
    status:joi.string().invalid('None').required().label('Please choose Status'),
    plannedendtime:joi.string().regex(/^([0-9]{2})\:([0-9]{2})$/).required().label('Please fill Planned End Time !'),

  })

  result=schema.validate({taskname:taskname,task:taskname,taskn:taskname,type:tasktype,projectname:projectname,assignedresource:assignedresource,status:request.body.status,plannedendtime:plannedendtime});
}

else if(deadline == 'Block Time')
{
  schema=joi.object({
    taskname:joi.string().min(3).required().label('Please enter Task Description!'),
    task:joi.string().min(3).required().label('Please enter Task Description!'),
    taskn:joi.string().min(1).max(80).required().label(' Task Description too long.'),
    projectname:joi.string().required().label('Please select Project !'),
    type:joi.string().required().label('Please select Task Type !'),
    assignedresource:joi.string().invalid('None').required().label('Please Assign Resource!'),
    status:joi.string().invalid('None').required().label('Please choose Status'),
  
    //plannedstarttime:joi.string().regex(/^([0-9]{2})\:([0-9]{2})$/).required().label('Please fill Planned Start Time !'),
   // plannedendtime:joi.string().regex(/^([0-9]{2})\:([0-9]{2})$/).required().label('Please fill Planned End Time !'),
   //plantime:joi.string().required().less(joi.ref('plannedendtime')).label('Planned Start time should be less than Planned End time. !'),
  })

  result=schema.validate({taskname:taskname,task:taskname,taskn:taskname,type:tasktype,projectname:projectname,assignedresource:assignedresource,status:request.body.status});
}

if(result.error){
  console.log('fd'+result.error);
  response.send(result.error.details[0].context.label);    
}
else{

 if(deadline == 'Block Time')
 {
  var starthours = Number(plannedstarttime.match(/^(\d+)/)[1]);
  var startminutes = Number(plannedstarttime.match(/:(\d+)/)[1]);
  var endhours = Number(plannedendtime.match(/^(\d+)/)[1]);
  var endminutes = Number(plannedendtime.match(/:(\d+)/)[1]);
  console.log('starthours '+starthours);
  console.log('startminutes '+startminutes);
  console.log('endhours '+endhours);
  console.log('endminutes '+endminutes);
   
startTime = (starthours > 11) ? (starthours-12 + ':' + startminutes + ':00'+' PM') : (starthours + ':' + startminutes + ':00' +' AM');
endTime = (endhours >= 11) ? (endhours-12 + ':' + endminutes + ':00'+' PM') : (endhours + ':' + endminutes + ':00'+' AM');

console.log('startTime abc '+startTime);
console.log('endTime xyz'+endTime);


 }
else if(deadline == 'Deadlines')
 {
  var endhours = Number(plannedendtime.match(/^(\d+)/)[1]);
  var endminutes = Number(plannedendtime.match(/:(\d+)/)[1]);
  console.log('endhours '+endhours);
  console.log('endminutes '+endminutes);
  endTime = (endhours > 12) ? (endhours-12 + ':' + endminutes + ':00'+' PM') : (endhours + ':' + endminutes + ':00'+' AM');
  startTime = plannedstarttime;
  console.log('startTime '+startTime);
  console.log('endTime '+endTime);

 }
 else
 {
startTime = plannedstarttime;
endTime = plannedendtime;
 }

  pool
// let qry='SELECT Id, Name FROM Milestone1_Milestone__c WHERE Project__c =$1 AND Name =$2,'+[projectname,'Timesheets'];
pool.query('SELECT Id,sfid, Name,project__c FROM salesforce.Milestone1_Milestone__c WHERE project__c = $1 AND Name = $2',[projectname, 'Timesheets'])
// pool.query('SELECT id,sfid from salesforce.Milestone1_Milestone__c WHERE Name = $1',['Timesheet Category'])
.then((milestoneQueryResult) => {
  console.log('milestoneQueryResult '+JSON.stringify(milestoneQueryResult.rows))
    if(milestoneQueryResult.rowCount > 0)
    {
        console.log('milestoneQueryResult '+JSON.stringify(milestoneQueryResult.rows));
        var timesheetMilestoneId =  milestoneQueryResult.rows[0].sfid;
        console.log('timesheetMilestoneId Inside Milestone : '+timesheetMilestoneId +' Name :'+milestoneQueryResult.rows[0].name);   /*'a020p000001cObIAAU'*/
          pool
            .query('INSERT INTO salesforce.Milestone1_Task__c (Name, project_milestone__c, RecordTypeId, Task_Stage__c, Project_Name__c, Start_Date__c, Assigned_Manager__c,Task_Type__c ,Start_Time__c,End_Time__c,DeadLine_Type__c) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',[taskname,timesheetMilestoneId ,'0122y00000005mMAAQ',status,projectname,taskdate,assignedresource,tasktype,startTime,endTime,deadline])
            .then((saveTaskResult) => {
                    console.log('saveTaskResult =====>>>>>>>>>>>>  : '+JSON.stringify(saveTaskResult.rows));
    //  response.send('savedInserted');
  //  console.log('inserted Id '+saveTaskResult.rows[0]);
               response.send('Task saved Successfully');
                })
                  .catch((saveTaskError) => {
                   console.log('saveTaskError  '+saveTaskError.stack);
                    console.log('saveTaskError._hc_err  : '+saveTaskError._hc_err.msg);
                     response.send('Error Occured');
                }) 

      }

})
.catch((milestoneQueryError) => {
    console.log('milestoneQueryError '+milestoneQueryError.stack);
})

}

});

router.post('/fillactuals',(request, response) => {
    var fillActualsFormData = request.body;
    console.log('fillActualsFormData  '+JSON.stringify(fillActualsFormData));
    var projectName = fillActualsFormData.projectName,
        dateIncurred = fillActualsFormData.dateIncurred,
        selectedTask = fillActualsFormData.selectedTask,
        statusTimesheet = fillActualsFormData.statusTimesheet,
        actualStartTimeTimesheet = fillActualsFormData.plannedStartTimeTimesheet,
        actualEndTimeTimesheet = fillActualsFormData.plannedEndTimeTimesheet,
        descriptionTimesheet = fillActualsFormData.descriptionTimesheet,
        representative = fillActualsFormData.representative;


    console.log('projectName  : '+projectName);
    console.log('dateIncurred   : '+dateIncurred);
    console.log('selectedTask   : '+selectedTask);
    console.log('statusTimesheet   : '+statusTimesheet);
    console.log('representative  '+representative);
    console.log('actualStartTimeTimesheet   : '+actualStartTimeTimesheet);
    console.log('actualEndTimeTimesheet  :  '+actualEndTimeTimesheet);
    console.log('descriptionTimesheet  :  '+descriptionTimesheet);

    const schema=joi.object({
      projectname:joi.string().required().label('Please select Project Name !'),
      project:joi.string().invalid('None').required().label('Please select Project Name !'),
      selectedTask:joi.string().required().label('Please select Task !'),
      task:joi.string().invalid('None').required().label('Please select Task !'),
      statusTimesheet:joi.string().required().label('Please select Status !'),
      status:joi.string().invalid('None').required().label('Please select Status !'),
      actualStartTimeTimesheet:joi.string().regex(/^([0-9]{2})\:([0-9]{2})$/).required().label('Please select Actual Start Time !'),
      actualEndTimeTimesheet:joi.string().regex(/^([0-9]{2})\:([0-9]{2})$/).required().label('Please select Actual End Time !'),
     // actual:joi.string().required().less(joi.ref('actualStartTimeTimesheet')).label('Planned Start time should be less than Planned End time. !'),
      descriptionTimesheet:joi.string().required().label('Please enter Description !'),
      descriptionTimesheets:joi.string().min(3).required().label('Please enter Description !'),
      description:joi.string().invalid('').required().label('Please enter Description !'),
      descr:joi.string().min(1).max(80).required().label('Description too long. !'),
   
  
     // depart:joi.string().min(1).max(255).required().label('Department value too long.'),
        })
  let result=schema.validate({projectname:projectName,project:projectName,selectedTask:selectedTask,task:selectedTask,statusTimesheet:statusTimesheet,status:statusTimesheet,actualStartTimeTimesheet:actualStartTimeTimesheet,actualEndTimeTimesheet:actualEndTimeTimesheet,descriptionTimesheet:descriptionTimesheet,descriptionTimesheets:descriptionTimesheet,description:descriptionTimesheet,descr:descriptionTimesheet});
  if(result.error){
      console.log('fd'+result.error);
      response.send(result.error.details[0].context.label);    
  }
    else{
    pool
    .query('INSERT INTO salesforce.Milestone1_Time__c (Projecttimesheet__c, Date__c, Project_Task__c, Representative__c,Related_Task_Status__c,Start_Time__c, End_Time__c, Description__c) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING sfid',[projectName,dateIncurred,selectedTask,representative,statusTimesheet,actualStartTimeTimesheet,actualEndTimeTimesheet,descriptionTimesheet])
    .then((timesheetQueryResult) => {
      
      console.log('timesheetQueryResult  '+JSON.stringify(timesheetQueryResult));
      response.send('Successfully Inserted');
    })
    .catch((timesheetQueryError) => {
      console.log('timesheetQueryError  '+timesheetQueryError.stack)
      response.send('Exception Occured');
    })
  }
 });


 /* router.get('/getdetails',verify, (request, response) => {
        
    console.log('request.user '+JSON.stringify(req.user));
    var userId = req.user.sfid;
    console.log('userId : '+userId);
    var selectedDate = request.query.date;
    console.log('date  '+selectedDate);
    pool
    .query('SELECT Id,sfid, Name, Project_Name__c, Start_Date__c, Planned_Hours__c FROM salesforce.Milestone1_Task__c WHERE Start_Date__c = $1',[selectedDate])
    .then((taskQueryResult) => {
        console.log('Query Result '+JSON.stringify(taskQueryResult.rows));
        console.log('Project ID '+taskQueryResult.rows[0].project_name__c);
        pool
        .query('SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid = $1',[taskQueryResult.rows[0].project_name__c])
        .then((projectQueryResult) => {
            console.log('project query '+JSON.stringify(projectQueryResult.rows));
            var taskDetails = [];
            taskQueryResult.rows.forEach((eachTask) => {
                var task = {};
                task.name = eachTask.name;
                task.plannedHours = eachTask.planned_hours__c;
                task.actualHours = '';
                task.date = eachTask.start_date__c;
                projectQueryResult.rows.forEach((eachPro) => {
                        if(eachTask.project_name__c == eachPro.sfid)
                            task.projectName = eachPro.name;
                });
                taskDetails.push(task);
            });
            console.log('taskDetails   '+JSON.stringify(taskDetails));
            response.send(taskDetails);
        })
        .catch((projectQueryError) => {
            console.log('projectQueryError '+JSON.stringify(projectQueryError.stack));
            response.send(403);
        })
    })
    .catch((taskQueryError) => {
        console.log('task Query Error '+taskQueryError.stack);
        response.send(403);
    })
    
 }); */

/* 
 router.get('/getprejectTeam',verify,(request,response)=>{
  console.log('request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid;
  var userName = request.user.name;
  console.log('userId : '+userId+'  userName  : '+userName);
  var selproject=request.query.selproject;
  var selectedDate = request.query.date;
  console.log('date  '+selectedDate);
  console.log('selected project '+selproject);
  pool.query('SELECT id,name,sfid,Project__c,Team__c FROM salesforce.Project_Team__c WHERE Project__c=$1',[selproject])
   .then((projTeamResult)=>{
     console.log('projectTeam '+JSON.stringify(projTeamResult.rows));
     response.send(projTeamResult.rows);
     })
     .catch((error)=>{
       console.log('error '+JSON.stringify(error.stack));
     })
 }) */
 router.get('/getallTeamdetails',verify,async(request,response)=>{
  console.log('request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid;
  var userName = request.user.name;
  console.log('userId : '+userId+'  userName  : '+userName);
  var selproject=request.query.selproject;
  var selectedDate = request.query.date;
  console.log('date  '+selectedDate);
  console.log('selected project '+selproject);

  var projTeampram=[],lstProjTeam=[];
  var teamParam=[],lstTeams=[];
  var teamMemberParam=[],teamMember=[];
  var teamtskqry='';

  var lstTasksToShow = [],contname=[];
  /* var projectParams = [], projectIDs = [];
  var timesheetParams = [], taskIDs = [];
  var projectMap = new Map();
  
  var lstTaskOfRelatedDate ; */
  

  pool.query('SELECT id,name,sfid,Project__c,Team__c FROM salesforce.Project_Team__c')
  .then((projTeamResult)=>{
    console.log('projectTeam '+JSON.stringify(projTeamResult.rows)+'rows '+projTeamResult.rowCount);
    if(projTeamResult.rowCount<1){
      console.log('djskdjjksdfjdks');
      response.send(lstTasksToShow);
    }
    else{
      projTeampram.push('$' + 1);
      lstProjTeam.push(userId);
       for(var i = 2; i <= projTeamResult.rows.length; i++) {
        projTeampram.push('$' + i);
        lstProjTeam.push(projTeamResult.rows[i-2].team__c);
      }
      /* Team ehere team manager is curret uSer or not  */
      let teamQry = 'SELECT Id, sfid , Manager__c, name FROM salesforce.Team__c WHERE Manager__c = $1 AND sfid IN ('+ projTeampram.join(',')+ ')';
      console.log('teamQry '+teamQry);
      pool.query(teamQry,lstProjTeam)
      .then((teamQueryResult)=>{
        console.log('team query result ='+JSON.stringify(teamQueryResult.rows));
        if(teamQueryResult.rowCount>0){
          for(var i = 1; i <= teamQueryResult.rows.length; i++) {
            teamParam.push('$' + i);
            lstTeams.push(teamQueryResult.rows[i-1].sfid);
          }
          console.log(' lstTeams '+lstTeams+' teamParam '+teamParam);
          /* TEAM member   */
          let teamUserQuery='SELECT Id, sfid,representative__c , team__c FROM salesforce.Team_Member__c WHERE team__c IN ('+ teamParam.join(',')+ ')';
          console.log('teamUserQuery '+teamUserQuery);
          pool.query(teamUserQuery,lstTeams) 
          .then((memberQryResult)=>{
            console.log('member result '+JSON.stringify(memberQryResult.rows));
            if(memberQryResult.rowCount>0){
              teamMember.push(selectedDate);
              teamMember.push(selproject);
              teamMemberParam.push('$' + 3);
              teamMember.push(userId);
              for(var i = 4; i <= memberQryResult.rows.length+1; i++) {
                     teamMemberParam.push('$' + i);
                     teamMember.push(memberQryResult.rows[i-4].representative__c);
               }
               /* TAsk Query Started  */
               teamtskqry='SELECT tsk.Id,tsk.sfid as sfid,tsk.name as tskname,tsk.Project_Name__c, tsk.Start_Date__c,tsk.assigned_manager__c,tsk.Planned_Hours__c,cont.sfid as contid ,cont.name as contname,proj.name as projname '+
'                   FROM salesforce.Milestone1_Task__c tsk '+
                    'INNER JOIN salesforce.Contact cont ON tsk.assigned_manager__c = cont.sfid '+
                   // 'INNER JOIN salesforce.Milestone1_Time__c mileTime ON tsk.sfid = mileTime.project_task__c '+
                    'INNER JOIN salesforce.Milestone1_Project__c proj ON tsk.Project_Name__c= proj.sfid '+
                    'WHERE Start_Date__c = $1 AND tsk.Project_Name__c=$2 AND Assigned_Manager__c IN ('+ teamMemberParam.join(',')+ ')'+' AND tsk.sfid != \''+''+'\''; 
                    console.log('teamtskqry for selected PRoject 1' +teamtskqry +' member Param '+teamMemberParam +'member '+teamMember);
                    pool.query(teamtskqry,teamMember)
                    .then((teamtskqueryresult)=>{
                     // console.log('team task query result '+JSON.stringify(teamtskqueryresult.rows));
                      lstTasksToShow=teamtskqueryresult.rows;
                      pool.query('SELECT sfid, date__c, calculated_hours__c, project_Task__c  FROM salesforce.Milestone1_Time__c WHERE sfid IS NOT NULL')
            .then((timesheetQueryResult)=>{
              console.log('querryResult '+JSON.stringify(timesheetQueryResult.rows));
              console.log('lstTasksToShow x'+JSON.stringify(lstTasksToShow));
              var timesheetMap = new Map();
              var lstsendResposne=[];
              for(let i=0; i < timesheetQueryResult.rowCount ; i++)
              {
                  console.log('timesheetQueryResult.rows[i].project_Task__c   '+timesheetQueryResult.rows[i].project_task__c +' timesheetQueryResult.rows[i].calculated_hours__c  : '+timesheetQueryResult.rows[i].calculated_hours__c);
                  timesheetMap.set( timesheetQueryResult.rows[i].project_task__c , timesheetQueryResult.rows[i].calculated_hours__c );
              }
              console.log('timesheetMap +'+JSON.stringify(timesheetMap.get('a050p000001xvZ3AAI')));
              lstTasksToShow.forEach((eachTask)=>{
                //console.log('each task is :'+eachTask);

                let taskDetail = {};
                taskDetail.tskname = eachTask.tskname;
                taskDetail.plannedHours = eachTask.planned_hours__c;
                if(timesheetMap.has(eachTask.sfid))
                 taskDetail.actualHours = timesheetMap.get(eachTask.sfid);
                 else
                 taskDetail.actualHours = '';
                 //console.log('Inside Last Loop timesheetMap.get(eachTask.sfid)    '+timesheetMap.get(eachTask.sfid));
                 console.log('start_date__c '+eachTask.start_date__c);
                 let dt =eachTask.start_date__c.getTime()+19800000;
                 let start_date__c=new Date(dt);
                 console.log('start_date__c new '+start_date__c);
                 taskDetail.date = start_date__c ;

                 taskDetail.projectName =eachTask.projname;
                 taskDetail.userName =eachTask.contname;
                 taskDetail.assigned =eachTask.contid;
                 taskDetail.currentuser=userName;
                 taskDetail.projectid=eachTask.project_name__c;
                lstsendResposne.push(taskDetail);
              })
              console.log('lstsendResposne '+JSON.stringify(lstsendResposne));
              response.send(lstsendResposne);

            }).catch((error)=>{
              console.log('errororo +'+JSON.stringify(errors.stack));
            })
                    })
                    .catch((tskqueryError)=>{
                      console.log('tskqueryError '+JSON.stringify(tskqueryError.stack));
                    })
               /* Task query ended  */
            }
          })
          .catch((meberError)=>{
            console.log('error in memberQuery '+JSON.stringify(meberError.stack));
          })

          /* TEAM member End  */
        }
        else{
          response.send('You are not the team MAneger for the related project');
        }

      })
      .catch((teamError)=>{
        console.log('team error '+JSON,stringify(teamError.stack));
      })
      /* ensd of team  */

    }
    
    })
    .catch((error)=>{
      console.log('error '+JSON.stringify(error.stack));
    })


})
router.get('/getTeamdetails',verify,async(request,response)=>{
  console.log('request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid;
  var userName = request.user.name;
  console.log('userId : '+userId+'  userName  : '+userName);
  var selproject=request.query.selproject;
  var selectedDate = request.query.date;
  console.log('date  '+selectedDate);
  console.log('selected project '+selproject);

  var projTeampram=[],lstProjTeam=[];
  var teamParam=[],lstTeams=[];
  var teamMemberParam=[],teamMember=[];
  var teamtskqry='';
  var taskparam=[],lsttask=[];

  var lstTasksToShow = [],contname=[];
  var actualHoursMap=new Map();
  /* var projectParams = [], projectIDs = [];
  var timesheetParams = [], taskIDs = [];
  var projectMap = new Map();
  var actualHoursMap=new Map();
  */
  var lstTaskOfRelatedDate ; 
  var projectTeamQuery ='';
  if(selproject!='allproject'){
    projectTeamQuery='SELECT id,name,sfid,Project__c,Team__c FROM salesforce.Project_Team__c WHERE Project__c=$1';
    console.log('pppppppppppppppppppppppprrrrrrrrrrrrrrrrrrrrrrrrrjjjjjjjjjjjjjjeeeccccccccccttttttt');
    pool.query(projectTeamQuery,[selproject])
  .then((projTeamResult)=>{
    console.log('projectTeam '+JSON.stringify(projTeamResult.rows)+'rows '+projTeamResult.rowCount);
    if(projTeamResult.rowCount<1){
      console.log('djskdjjksdfjdks');
      response.send(lstTasksToShow);
    }
    else{
    //  projTeampram.push('$' + 1);
      lstProjTeam.push(userId);
       for(var i = 2; i <= projTeamResult.rows.length+1; i++) {
        projTeampram.push('$' + i);
        lstProjTeam.push(projTeamResult.rows[i-2].team__c);
      }
      /* Team ehere team manager is curret uSer or not  */
      let teamQry = 'SELECT Id, sfid , Manager__c, name FROM salesforce.Team__c WHERE Manager__c = $1 AND sfid IN ('+ projTeampram.join(',')+ ')';
      console.log('teamQry '+teamQry);
      pool.query(teamQry,lstProjTeam)
      .then((teamQueryResult)=>{
        console.log('team query result ='+JSON.stringify(teamQueryResult.rows));
        if(teamQueryResult.rowCount>0){
          for(var i = 1; i <= teamQueryResult.rows.length; i++) {
            teamParam.push('$' + i);
            lstTeams.push(teamQueryResult.rows[i-1].sfid);
          }
          console.log(' lstTeams '+lstTeams+' teamParam '+teamParam);
          /* TEAM member   */
          let teamUserQuery='SELECT Id, sfid,representative__c , team__c FROM salesforce.Team_Member__c WHERE team__c IN ('+ teamParam.join(',')+ ')';
          console.log('teamUserQuery '+teamUserQuery);
          pool.query(teamUserQuery,lstTeams) 
          .then((memberQryResult)=>{
            console.log('member result '+JSON.stringify(memberQryResult.rowCount));
            if(memberQryResult.rowCount>0){
              teamMember.push(selectedDate);
              teamMember.push(selproject);
              teamMemberParam.push('$' + 3);
              teamMember.push(userId);
              for(var i = 4; i <= memberQryResult.rows.length+3; i++) {
                     teamMemberParam.push('$' + i);
                     teamMember.push(memberQryResult.rows[i-4].representative__c);
               }
               /* TAsk Query Started  */
               teamtskqry='SELECT tsk.Id,tsk.sfid as sfid,tsk.name as tskname,tsk.Project_Name__c, tsk.Start_Date__c,tsk.assigned_manager__c,tsk.Planned_Hours__c,cont.sfid as contid ,cont.name as contname,proj.name as projname '+
'                   FROM salesforce.Milestone1_Task__c tsk '+
                    'INNER JOIN salesforce.Contact cont ON tsk.assigned_manager__c = cont.sfid '+
                    'INNER JOIN salesforce.Milestone1_Project__c proj ON tsk.Project_Name__c= proj.sfid '+
                    'WHERE Start_Date__c = $1 AND tsk.Project_Name__c=$2 AND Assigned_Manager__c IN ('+ teamMemberParam.join(',')+ ')'+' AND tsk.sfid != \''+''+'\''; 
                    console.log('teamtskqry for selected PRoject 1' +teamtskqry +' member Param '+teamMemberParam +'member '+teamMember);
                    pool.query(teamtskqry,teamMember)
                    .then((teamtskqueryresult)=>{
                      lstTaskOfRelatedDate=teamtskqueryresult.rows;
                      console.log('team task query result '+JSON.stringify(teamtskqueryresult.rowCount));
                      if(teamtskqueryresult.rowCount<1){
                        response.send(lstTasksToShow);
                      }
                      for(var i = 1; i <= teamtskqueryresult.rowCount; i++) {
                        taskparam.push('$' + i);
                        lsttask.push(teamtskqueryresult.rows[i-1].sfid);
                  }
                  console.log('taskparam '+taskparam);
                  console.log('vlsttask '+lsttask);
                  
                     // console.log('team task query result '+JSON.stringify(teamtskqueryresult.rows));
                      
                      timeQuery ='SELECT sfid, date__c, calculated_hours__c, project_task__c  FROM salesforce.Milestone1_Time__c WHERE project_task__c IN ('+ taskparam.join(',')+ ')'+' AND sfid != \''+''+'\'';
                      pool.query(timeQuery,lsttask)
                      .then((timesheetQueryResult )=>{
                        console.log('timesheet cout '+timesheetQueryResult.rowCount);
                        console.log('TIEMSHEEt reslt '+JSON.stringify(timesheetQueryResult.rows));
                        if(timesheetQueryResult.rowCount > 0)
                        {
                          timesheetQueryResult.rows.forEach((eachTimesheet) => {
                          let fillingDate = eachTimesheet.project_task__c;
                          console.log('project_task__c  '+fillingDate);

                         if( ! actualHoursMap.has(fillingDate))
                          {
                           if(eachTimesheet.calculated_hours__c != null)
                             actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
                          else
                          actualHoursMap.set(fillingDate, 0);
                           }
                          else
                          {
                             let previousFilledHours =  actualHoursMap.get(fillingDate);
                             let currentFilledHours = eachTimesheet.calculated_hours__c;
                             if(currentFilledHours != null)
                             {
                              actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
                          }
                          else
                             actualHoursMap.set(fillingDate, (previousFilledHours + 0));
                          }

                         for(let time of actualHoursMap)
                         {
                           console.log('time  : '+time);
                         }
       
                     })
                }   
                if(lstTaskOfRelatedDate != null)
                 {
                   console.log('preparing dta to detil moda');
                   lstTaskOfRelatedDate.forEach((eachTask) => {
                   let taskDetail = {};
                   taskDetail.name = eachTask.tskname;
                   taskDetail.plannedHours = eachTask.planned_hours__c;
 
                  if(actualHoursMap.has(eachTask.sfid))
                   taskDetail.actualHours = actualHoursMap.get(eachTask.sfid);
                  else
                   taskDetail.actualHours = '';
                   console.log('Inside Last Loop timesheetMap.get(eachTask.sfid)    '+actualHoursMap.get(eachTask.sfid));
                   console.log('start_date__c '+eachTask.start_date__c);
                   let dt =eachTask.start_date__c.getTime()+19800000;
                   let start_date__c=new Date(dt);
                   console.log('start_date__c new '+start_date__c);
                   taskDetail.date = start_date__c ;
                   taskDetail.projectName = eachTask.projname
                   taskDetail.userName =eachTask.contname;
                   taskDetail.assigned =eachTask.contid;
                   taskDetail.currentuser=userName;
                   console.log('task detail '+JSON.stringify(taskDetail));
 
                   lstTasksToShow.push(taskDetail);
            })
         }
               // lstTasksToShow.push(lstmember);
              console.log('  lstTasksToShow  : '+JSON.stringify(lstTasksToShow));
              response.send(lstTasksToShow);
  

            }).catch((error)=>{
              console.log('errororo +'+JSON.stringify(errors.stack));
              response.send([]);
            })
                    })
                    .catch((tskqueryError)=>{
                      console.log('tskqueryError '+JSON.stringify(tskqueryError.stack));
                    })
               /* Task query ended  */
            }
          })
          .catch((meberError)=>{
            console.log('error in memberQuery '+JSON.stringify(meberError.stack));
          })

          /* TEAM member End  */
        }
        else{
          response.send('You are not the team MAneger for the related project');
        }

      })
      .catch((teamError)=>{
        console.log('team error '+JSON,stringify(teamError.stack));
      })
      /* ensd of team  */

    }
    
    })
    .catch((error)=>{
      console.log('error '+JSON.stringify(error.stack));
    })

  }

  /* Start of all project */
  else{
    let teamProjId=[];
    let lstTaskOfRelatedDate1 =[];
    let projectID =[];
    let projectTeamQuery='SELECT projteam.id,projteam.name,projteam.sfid as sfid,projteam.Project__c,team.sfid as tsfid, team.Manager__c '+
    'FROM salesforce.Project_Team__c projteam '+
    'INNER JOIN salesforce.Team__c team ON projteam.team__c =  team.sfid '+
    'WHERE projteam.Project__c IS NOT NULL AND team.Manager__c = $1 ';
    console.log('TEAM VIEW ALL PROJECTS'+projectTeamQuery);
    pool.query(projectTeamQuery,[userId])
    .then((projTeamResult)=>{
    console.log('projectTeam '+JSON.stringify(projTeamResult.rows)+'rows '+projTeamResult.rowCount);
    if(projTeamResult.rowCount<1){
      console.log('djskdjjksdfjdks');
      response.send(lstTasksToShow);
    }
    else{
      let projectTeamMap = new Map();
      // projTeampram.push('$' + 1);
      //  lstProjTeam.push(userId);
       for(var i = 1; i <= projTeamResult.rows.length; i++) {
        projTeampram.push('$' + i);
        lstProjTeam.push(projTeamResult.rows[i-1].tsfid);
        projectID.push(projTeamResult.rows[i-1].project__c);
       // projectTeamMap.set(projTeamResult.rows[i-2].team__c,projTeamResult.rows[i-2].project__c);
       }
      /* Team ehere team manager is curret User or not  */
     // let teamQry = 'SELECT Id, sfid , Manager__c, name FROM salesforce.Team__c WHERE Manager__c = $1 AND sfid IN ('+ projTeampram.join(',')+ ')';
     let teamQry = 'SELECT Id, sfid , Manager__c, name FROM salesforce.Team__c';
      console.log('teamQry '+teamQry);
      pool.query(teamQry)
      .then((teamQueryResult)=>{
        console.log('team query result ='+JSON.stringify(teamQueryResult.rowCount));
        if(teamQueryResult.rowCount>0){

          /* TEAM member   */
        //  console.log(' lstTeams '+lstTeams+' teamParam '+teamParam +'teamProjId '+teamProjId);
          let teamUserQuery='SELECT Id, sfid,representative__c , team__c FROM salesforce.Team_Member__c WHERE team__c IN ('+ projTeampram.join(',')+ ')';
          console.log('teamUserQuery '+teamUserQuery);
          console.log('lstProjTeam  '+lstProjTeam);
          pool.query(teamUserQuery,lstProjTeam) 
          .then((memberQryResult)=>{
            console.log('member result '+JSON.stringify(memberQryResult.rowCount));
            if(memberQryResult.rowCount>0){
              teamMember.push(selectedDate);
              teamMemberParam.push('$' + 2);
              teamMember.push(userId);
              for(var i = 3; i <= memberQryResult.rows.length+2; i++) {
                     teamMemberParam.push('$' + i);
                     teamMember.push(memberQryResult.rows[i-3].representative__c);
               }
               /* TAsk Query Started  */
               teamtskqry='SELECT tsk.Id,tsk.sfid as sfid,tsk.name as tskname,tsk.Project_Name__c, tsk.Start_Date__c,tsk.assigned_manager__c,tsk.Planned_Hours__c,cont.sfid as contid ,cont.name as contname,proj.name as projname '+
                          'FROM salesforce.Milestone1_Task__c tsk '+
                           'INNER JOIN salesforce.Contact cont ON tsk.assigned_manager__c = cont.sfid '+
                            'INNER JOIN salesforce.Milestone1_Project__c proj ON tsk.Project_Name__c= proj.sfid '+
                              'WHERE Start_Date__c = $1 AND  Assigned_Manager__c IN ('+ teamMemberParam.join(',')+ ')'+' AND tsk.sfid != \''+''+'\''; 
                    console.log('teamtskqry for selected PRoject 1' +teamtskqry +' member Param '+teamMemberParam +'member '+teamMember);
                    pool.query(teamtskqry,teamMember)
                    .then((teamtskqueryresult)=>{
                     // lstTaskOfRelatedDate=teamtskqueryresult.rows;
                      console.log('team task query result '+JSON.stringify(teamtskqueryresult.rowCount));
                      teamtskqueryresult.rows.forEach((eachTask) =>{
                        for(var i = 1; i <= projectID.length; i++){
                          if(eachTask.project_name__c==projectID[i-1]){
                            console.log('eachProject '+projectID[i-1]);
                            lsttask.push(eachTask.sfid);
                            lstTaskOfRelatedDate1.push(eachTask);
                          }
                        }
                      })
                    
                     for(var i = 1; i <= lsttask.length; i++) {
                      taskparam.push('$' + i);
                     }
                     console.log('taskparam '+taskparam);
                     console.log('vlsttask '+lsttask);
                      timeQuery ='SELECT sfid, date__c, calculated_hours__c, project_task__c  FROM salesforce.Milestone1_Time__c WHERE project_task__c IN ('+ taskparam.join(',')+ ')'+' AND sfid != \''+''+'\'';
                      pool.query(timeQuery,lsttask)
                      .then((timesheetQueryResult )=>{
                        console.log('timesheet cout '+timesheetQueryResult.rowCount);
                        console.log('TIEMSHEEt reslt '+JSON.stringify(timesheetQueryResult.rows));
                        if(timesheetQueryResult.rowCount > 0)
                        {
                          timesheetQueryResult.rows.forEach((eachTimesheet) => {
                          let fillingDate = eachTimesheet.project_task__c;
                          console.log('project_task__c  '+fillingDate);

                         if( ! actualHoursMap.has(fillingDate))
                          {
                           if(eachTimesheet.calculated_hours__c != null)
                             actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
                          else
                          actualHoursMap.set(fillingDate, 0);
                           }
                          else
                          {
                             let previousFilledHours =  actualHoursMap.get(fillingDate);
                             let currentFilledHours = eachTimesheet.calculated_hours__c;
                             if(currentFilledHours != null)
                             {
                              actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
                          }
                          else
                             actualHoursMap.set(fillingDate, (previousFilledHours + 0));
                          }

                         for(let time of actualHoursMap)
                         {
                           console.log('time  : '+time);
                         }
       
                     })
                }   
                if(lstTaskOfRelatedDate1.length>0)
                 {
                   console.log('preparing dta to detil moda');
                   lstTaskOfRelatedDate1.forEach((eachTask) => {
                   let taskDetail = {};
                   taskDetail.name = eachTask.tskname;
                   taskDetail.plannedHours = eachTask.planned_hours__c;
 
                  if(actualHoursMap.has(eachTask.sfid))
                   taskDetail.actualHours = actualHoursMap.get(eachTask.sfid);
                  else
                   taskDetail.actualHours = '';
                   console.log('Inside Last Loop timesheetMap.get(eachTask.sfid)    '+actualHoursMap.get(eachTask.sfid));
                   console.log('start_date__c '+eachTask.start_date__c);
                   let dt =eachTask.start_date__c.getTime()+19800000;
                   let start_date__c=new Date(dt);
                   console.log('start_date__c new '+start_date__c);
                   taskDetail.date = start_date__c ;
                   taskDetail.projectName = eachTask.projname
                   taskDetail.userName =eachTask.contname;
                   taskDetail.assigned =eachTask.contid;
                   taskDetail.currentuser=userName;
                   console.log('task detail '+JSON.stringify(taskDetail));
 
                   lstTasksToShow.push(taskDetail);
            })
         }
               // lstTasksToShow.push(lstmember);
              console.log('  lstTasksToShow  : '+JSON.stringify(lstTasksToShow));
              response.send(lstTasksToShow);
  

            }).catch((error)=>{
              console.log('errororo +'+JSON.stringify(errors.stack));
              response.send([]);
            })
                    })
                    .catch((tskqueryError)=>{
                      console.log('tskqueryError '+JSON.stringify(tskqueryError.stack));
                    })
               /* Task query ended  */
            }
          })
          .catch((meberError)=>{
            console.log('error in memberQuery '+JSON.stringify(meberError.stack));
          })

          /* TEAM member End  */
        }
        else{
          response.send('You are not the team MAneger for the related project');
        }

      })
      .catch((teamError)=>{
        console.log('team error '+JSON.stringify(teamError.stack));
      })
      /* ensd of team  */

    }
    
    })
    .catch((error)=>{
      console.log('error '+JSON.stringify(error.stack));
    })
  
 
  }
  })

  router.get('/getdetails',verify, async(request, response) => {
  
    console.log('request.user '+JSON.stringify(request.user));
    var userId = request.user.sfid;
    var userName = request.user.name;
    
    console.log('userId : '+userId+'  userName  : '+userName);
    var selproject=request.query.selproject;
    var selectedDate = request.query.date;
    console.log('date  '+selectedDate);
    console.log('selected project '+selproject);
    var lstTasksToShow = [],contname=[];
    var projectParams = [], projectIDs = [];
    var timesheetParams = [], taskIDs = [];
    var status = [];
    var projectMap = new Map();
    var timesheetMap = new Map();
    var lstTaskOfRelatedDate ;
    let plannedHoursMap = new Map();
    let actualHoursMap = new Map();
    function convert(str) {
      var date = new Date(str),
        mnth = ("0" + (date.getMonth() + 1)).slice(-2),
        day = ("0" + date.getDate()).slice(-2);
      return [date.getFullYear(), mnth, day].join("-");
    } 
  
  let tskqry='SELECT tsk.Id,tsk.sfid as sfid,tsk.name as tskname,tsk.Project_Name__c, tsk.Task_Stage__c,tsk.Start_Date__c,tsk.assigned_manager__c,tsk.Planned_Hours__c,cont.sfid as contid ,cont.name as contname, proj.name as projname '+
  'FROM salesforce.Milestone1_Task__c tsk '+
  'INNER JOIN salesforce.Contact cont ON tsk.assigned_manager__c = cont.sfid '+
  'INNER JOIN salesforce.Milestone1_Project__c proj ON tsk.project_name__c = proj.sfid '+
  'WHERE Start_Date__c = $1 AND tsk.assigned_manager__c=$2 AND tsk.sfid != \''+''+'\'';
  console.log('tskqry '+tskqry);
  await
    pool.query(tskqry,[selectedDate,userId])
    .then((taskQueryResult) => {
        console.log('Query Result '+JSON.stringify(taskQueryResult.rows));  
        lstTaskOfRelatedDate = taskQueryResult.rows;
        for(let i=0; i< taskQueryResult.rowCount ; i++)
        {
  
            projectIDs.push(taskQueryResult.rows[i].project_name__c);
            taskIDs.push(taskQueryResult.rows[i].sfid)
            contname.push(taskQueryResult.rows[i].contname)
            status.push(taskQueryResult.rows[i].task_stage__c)
            projectParams.push('$'+(i+1));
            timesheetParams.push('$'+(i+1));
        }  
  
        console.log('projectIDs  : '+projectIDs);
        console.log('taskIDs  : '+taskIDs);
        console.log('projectParams    : '+ projectParams);
        console.log('timesheetParams  : '+timesheetParams);
        console.log('contname    : '+ contname); 
        console.log('task_stage__c    : '+ status); 
        if(taskQueryResult.rowCount>0){
        var timesheetQuery = 'SELECT sfid, date__c, calculated_hours__c, project_Task__c  FROM salesforce.Milestone1_Time__c WHERE sfid != \''+''+'\' AND Project_Task__c IN ('+ timesheetParams.join(',') +')';
        console.log('timesheert Query '+timesheetQuery);
        pool.query(timesheetQuery,taskIDs)
        .then((timesheetQueryResult) => {
          console.log('timesheetQueryResult   :  '+JSON.stringify(timesheetQueryResult.rows));
          
          if(timesheetQueryResult.rowCount > 0)
           {
                timesheetQueryResult.rows.forEach((eachTimesheet) => {
         
            let fillingDate = eachTimesheet.project_task__c;
             console.log('project_task__c  '+fillingDate);
  
             if( ! actualHoursMap.has(fillingDate))
           {
               if(eachTimesheet.calculated_hours__c != null)
                 actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
               else
                 actualHoursMap.set(fillingDate, 0);
           }
           else
           {
              let previousFilledHours =  actualHoursMap.get(fillingDate);
              let currentFilledHours = eachTimesheet.calculated_hours__c;
              if(currentFilledHours != null)
              {
                 actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
              }
              else
                 actualHoursMap.set(fillingDate, (previousFilledHours + 0));
           }
  
           for(let time of actualHoursMap)
           {
             console.log('time  : '+time);
           }
         
       })
     }
  
  
     if(lstTaskOfRelatedDate != null)
     {
         lstTaskOfRelatedDate.forEach((eachTask) => {
               let taskDetail = {};
               taskDetail.name = eachTask.tskname;
               taskDetail.plannedHours = eachTask.planned_hours__c.toFixed(2);
   
               if(actualHoursMap.has(eachTask.sfid))
                 taskDetail.actualHours = actualHoursMap.get(eachTask.sfid);
               else
                 taskDetail.actualHours = '';
               console.log('Inside Last Loop timesheetMap.get(eachTask.sfid)++++++    '+actualHoursMap.get(eachTask.sfid));
               console.log('start_date__c '+eachTask.start_date__c);
               let dt =eachTask.start_date__c.getTime()+19800000;
               let start_date__c=new Date(dt);
               console.log('start_date__c new '+start_date__c);
               taskDetail.date = start_date__c ;
               taskDetail.projectName = eachTask.projname
               taskDetail.userName =eachTask.contname;
               taskDetail.assigned =eachTask.contid;
               taskDetail.currentuser=userName;
               taskDetail.status=eachTask.task_stage__c;
               console.log('task detail '+JSON.stringify(taskDetail));
   
               lstTasksToShow.push(taskDetail);
         })
     }
    // lstTasksToShow.push(lstmember);
     console.log('  lstTasksToShow  : '+JSON.stringify(lstTasksToShow));
     response.send(lstTasksToShow);
  
  
  
  
  
  
  
  
    })
    .catch((timesheetQueryError) => {
          console.log('timesheetQueryError   :  '+timesheetQueryError.stack);
    })
        }
    })
    .catch((taskQueryError) =>{
        console.log('task Query Error '+taskQueryError.stack);
        response.send(403);
    })
    
    
  })
   
  
  
  
  router.get('/getdetailsproject',verify,async(request,response)=>{
    console.log('request.user '+JSON.stringify(request.user));
    var userId = request.user.sfid;
    var userName = request.user.name;
    
    console.log('userId : '+userId+'  userName  : '+userName);
    var selproject=request.query.selproject;
    var selectedDate = request.query.date;
    console.log('date  '+selectedDate);
    console.log('selected project '+selproject);
    var lstTasksToShow = [],contname=[];
    var projectParams = [], projectIDs = [];
    var timesheetParams = [], taskIDs = [];
    var status = [];
    var projectMap = new Map();
    var timesheetMap = new Map();
    var lstTaskOfRelatedDate ;
    let plannedHoursMap = new Map();
    let actualHoursMap = new Map();
    function convert(str) {
      var date = new Date(str),
        mnth = ("0" + (date.getMonth() + 1)).slice(-2),
        day = ("0" + date.getDate()).slice(-2);
      return [date.getFullYear(), mnth, day].join("-");
    } 
    
  let tskqry='SELECT tsk.Id,tsk.sfid as sfid,tsk.name as tskname,tsk.Project_Name__c, tsk.Start_Date__c,tsk.assigned_manager__c,tsk.task_stage__c,tsk.Planned_Hours__c,cont.sfid as contid ,cont.name as contname, proj.name as projname '+
  'FROM salesforce.Milestone1_Task__c tsk '+
  'INNER JOIN salesforce.Contact cont ON tsk.assigned_manager__c = cont.sfid '+
  'INNER JOIN salesforce.Milestone1_Project__c proj ON tsk.project_name__c = proj.sfid '+
  'WHERE Start_Date__c = $1 AND tsk.Project_Name__c=$2 AND tsk.assigned_manager__c=$3 AND tsk.sfid != \''+''+'\'';
  console.log('tskqry '+tskqry);
    await
    pool.query(tskqry,[selectedDate,selproject,userId])
    .then((taskQueryResult) => {
        console.log('Query Result '+JSON.stringify(taskQueryResult.rows));  
        lstTaskOfRelatedDate = taskQueryResult.rows;
        for(let i=0; i< taskQueryResult.rowCount ; i++)
        {
  
            projectIDs.push(taskQueryResult.rows[i].project_name__c);
            taskIDs.push(taskQueryResult.rows[i].sfid)
            contname.push(taskQueryResult.rows[i].contname)
            status.push(taskQueryResult.rows[i].task_stage__c)
            projectParams.push('$'+(i+1));
            timesheetParams.push('$'+(i+1));
        }  
  
        console.log('projectIDs  : '+projectIDs);
        console.log('taskIDs  : '+taskIDs);
        console.log('projectParams    : '+ projectParams);
        console.log('timesheetParams  : '+timesheetParams);
        console.log('contname    : '+ contname); 
        console.log('task_stage__c    : '+ status); 
        if(taskQueryResult.rowCount>0){
        var timesheetQuery = 'SELECT sfid, date__c, calculated_hours__c, project_Task__c  FROM salesforce.Milestone1_Time__c WHERE sfid != \''+''+'\' AND Project_Task__c IN ('+ timesheetParams.join(',') +')';
        console.log('timesheert Query '+timesheetQuery);
        pool.query(timesheetQuery,taskIDs)
        .then((timesheetQueryResult) => {
          console.log('timesheetQueryResult   :  '+JSON.stringify(timesheetQueryResult.rows));
          
          if(timesheetQueryResult.rowCount > 0)
           {
                timesheetQueryResult.rows.forEach((eachTimesheet) => {
         
            let fillingDate = eachTimesheet.project_task__c;
             console.log('project_task__c  '+fillingDate);
  
             if( ! actualHoursMap.has(fillingDate))
           {
               if(eachTimesheet.calculated_hours__c != null)
                 actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
               else
                 actualHoursMap.set(fillingDate, 0);
           }
           else
           {
              let previousFilledHours =  actualHoursMap.get(fillingDate);
              let currentFilledHours = eachTimesheet.calculated_hours__c;
              if(currentFilledHours != null)
              {
                 actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
              }
              else
                 actualHoursMap.set(fillingDate, (previousFilledHours + 0));
           }
  
           for(let time of actualHoursMap)
           {
             console.log('time  : '+time);
           }
         
       })
     }
  
  
     if(lstTaskOfRelatedDate != null)
     {
         lstTaskOfRelatedDate.forEach((eachTask) => {
               let taskDetail = {};
               taskDetail.name = eachTask.tskname;
               if(eachTask.planned_hours__c != null || achTask.planned_hours__c != '' ){
                taskDetail.plannedHours = eachTask.planned_hours__c.toFixed(2);
               }
               else{
                taskDetail.plannedHours = eachTask.planned_hours__c
               }
             
           //    taskDetail.status = eachTask.task_stage__c;
   
               if(actualHoursMap.has(eachTask.sfid))
                 taskDetail.actualHours = actualHoursMap.get(eachTask.sfid);
               else
                 taskDetail.actualHours = '';
               console.log('Inside Last Loop timesheetMap.get(eachTask.sfid)********    '+actualHoursMap.get(eachTask.sfid));
               console.log('start_date__c ********* '+eachTask.start_date__c);
               let dt =eachTask.start_date__c.getTime()+19800000;
               let start_date__c=new Date(dt);
               console.log('start_date__c new '+start_date__c);
               taskDetail.date = start_date__c ;
               taskDetail.projectName = eachTask.projname
               taskDetail.userName =eachTask.contname;
               taskDetail.assigned =eachTask.contid;
               taskDetail.currentuser=userName;
               taskDetail.status =eachTask.task_stage__c;
               console.log('task detail '+JSON.stringify(taskDetail));
   
               lstTasksToShow.push(taskDetail);
         })
     }
    // lstTasksToShow.push(lstmember);
     console.log('  lstTasksToShow  : '+JSON.stringify(lstTasksToShow));
     response.send(lstTasksToShow);
  
  
  
  
  
  
  
  
    })
    .catch((timesheetQueryError) => {
          console.log('timesheetQueryError   :  '+timesheetQueryError.stack);
    })
        }
    })
    .catch((taskQueryError) =>{
        console.log('task Query Error '+taskQueryError.stack);
        response.send(403);
    })
    
    
  })
  
 router.get('/getrelatedtasks',verify,(request, response) => {

   var projectId =  request.query.projectId;
   var selectedDate = request.query.selectedDate;
   console.log('projectId '+projectId + 'selectedDate  : '+selectedDate);

   pool
   .query('SELECT sfid, Name FROM salesforce.Milestone1_Milestone__c WHERE Project__c = $1 AND Name = $2',[projectId, 'Timesheets'])
   .then((projectMilestoneQueryResult) => {
       console.log('projectMilestoneQueryResult  : '+JSON.stringify(projectMilestoneQueryResult.rows));
         
        pool
       .query('SELECT id, sfid, Name FROM salesforce.Milestone1_Task__c WHERE Project_Milestone__c = $1 AND Start_Date__c = $2 AND Assigned_Manager__c=$3 And sfid != \''+''+'\'',[projectMilestoneQueryResult.rows[0].sfid, selectedDate,request.user.sfid])
       .then((taskQueryResult) => { 
            console.log('taskQueryResult  : '+JSON.stringify(taskQueryResult.rows));
            response.send(taskQueryResult.rows);
       })
       .catch((taskQueryError) => {
            console.log('taskQueryError  : '+taskQueryError.stack);
            response.send(403);
       })

   })
   .catch((projectMilestoneQueryError) => {
        console.log('projectMilestoneQueryError  :  '+projectMilestoneQueryError.stack);
        response.send(403);
   })

 });


 /************************************************    Task List View   **************************************/

 router.get('/taskListView',verify,(request,response)=>{
  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  response.render('./timesheets/taskListView',{objUser});
})

router.get('/getTasklist',verify,(request,response)=>{
  let objUser=request.user;
  console.log('objUser.sfid '+objUser.sfid);
  let queryText = 'SELECT tsk.Id,tsk.sfid as sfids,tsk.name as tskname,tsk.start_date__c ,tsk.Project_Name__c, tsk.assigned_manager__c,tsk.end_time__c,tsk.Task_Type__c,tsk.Planned_Hours__c,tsk.Start_Time__c,cont.sfid as contid ,cont.name as contname,proj.name as projname,tsk.createddate '+
                   'FROM salesforce.Milestone1_Task__c tsk '+ 
                   'INNER JOIN salesforce.Contact cont ON tsk.assigned_manager__c = cont.sfid '+
                   'INNER JOIN salesforce.Milestone1_Project__c proj ON tsk.Project_Name__c= proj.sfid '+
                   'WHERE  tsk.Assigned_Manager__c= $1 AND tsk.sfid IS NOT NULL ';
                   
 console.log('queryText  taskkkkkkkkkkkkkkkkkkk',queryText);
  pool
   .query(queryText,[objUser.sfid])
  .then((taskQueryResult)=>{
    console.log('taskQueryResult '+JSON.stringify(taskQueryResult.rows) +'Row COUNT => '+taskQueryResult.rowCount);
    if(taskQueryResult.rowCount > 0)
    {
        let modifiedTaskList = [],i =1;
        taskQueryResult.rows.forEach((eachRecord) => {
          let obj = {};
            let createdDate = new Date(eachRecord.createddate);
            createdDate.setHours(createdDate.getHours() + 5);
            createdDate.setMinutes(createdDate.getMinutes() + 30);
            let strDate = createdDate.toLocaleString();

            let planDate = new Date(eachRecord.start_date__c);
            planDate.setHours(planDate.getHours() + 5);
            createdDate.setMinutes(planDate.getMinutes() + 30);
            let strplanDate = planDate.toLocaleString();




          obj.sequence = i;
          obj.name = '<a href="#" class="taskreferenceTag" id="'+eachRecord.sfids+'" >'+eachRecord.tskname+'</a>';
          obj.assigned = eachRecord.contname;
          obj.hrs=eachRecord.planned_hours__c;
          obj.startTime=eachRecord.start_time__c;
          obj.endtime=eachRecord.end_time__c;
          obj.taskType=eachRecord.task_type__c;
          obj.plandate=strplanDate;
          obj.createDdate = strDate;
          obj.deleteAction = '<button href="#" class="btn btn-primary deleteTask" id="'+eachRecord.sfids+'" >Delete</button>'     
      //    obj.editAction = '<button href="#" class="btn btn-primary editTask" id="'+eachRecord.sfids+'" >Edit</button>'
          i= i+1;
          modifiedTaskList.push(obj);
        })
        response.send(modifiedTaskList);
    }
    else
    {
        response.send([]);
    }

  })
  .catch((QueryError) => {
    console.log('QueryError  timeshheer=t'+QueryError.stack);
  }) 
})
router.get('/fetchTaskDetail',verify,(request,response)=>{
  let tskId=request.query.taskId;
  console.log('task ID '+tskId);
  let queryText = 'SELECT tsk.Id,tsk.sfid as sfid,tsk.name as tskname,tsk.Project_Name__c,tsk.Project_Milestone__c,catego.name as categoname, tsk.assigned_manager__c, tsk.deadLine_type__c,tsk.task_stage__c,tsk.start_date__c,tsk.end_time__c,tsk.Task_Type__c,tsk.total_hours__c,tsk.Planned_Hours__c,tsk.Start_Time__c,cont.sfid as contid ,cont.name as contname,proj.name as projname,tsk.createddate '+
  'FROM salesforce.Milestone1_Task__c tsk '+ 
  'INNER JOIN salesforce.Contact cont ON tsk.assigned_manager__c = cont.sfid '+
  'INNER JOIN salesforce.Milestone1_Project__c proj ON tsk.Project_Name__c= proj.sfid '+
  'INNER JOIN salesforce.Milestone1_Milestone__c catego ON tsk.Project_Milestone__c= catego.sfid '+
  'WHERE  tsk.sfid= $1 ';
  pool
 // .query('select sfid,name ,Assigned_Manager__c ,end_time__c,Task_Type__c,Planned_Hours__c,Start_Time__c FROM salesforce.Milestone1_Task__c where sfid=$1 ',[tskId])
 .query(queryText,[tskId])
 .then((querryResult)=>{
    console.log('QUERRY rESULT'+ JSON.stringify(querryResult.rows));
    response.send(querryResult.rows);
  })
  .catch((querryError)=>{
    console.log('querryError '+querryError);
    response.send(querryError.stack)
})
})

router.post('/updateTask',verify,(request,response)=>{
  let body=request.body;
  console.log('Body '+ JSON.stringify(body));
  const {start,endTime , taskType, hrs, hide} = request.body;
  console.log('start '+ start);
  console.log('endTime '+ endTime);
  console.log('taskType '+ taskType);
  console.log('hr '+ hrs);
  console.log('hide '+ hide);
  let updateQuery= 'UPDATE salesforce.Milestone1_Task__c SET '+
                    'end_time__c = \''+endTime+'\', '+
                    'start_time__c = \''+start+'\', '+
                    'task_type__c = \''+taskType+'\' '+
                       'WHERE sfid = $1';
  console.log('updateQuerryyyyy '+updateQuery);
  pool
  .query(updateQuery,[hide])
  .then((queryResult)=>{
    console.log('queryResult '+JSON.stringify(queryResult.rows));
    response.send('successsss')
    .catch((querryError)=>{
      console.log('querryError'+querryError.stack);
      response.send(querryError);
    })
  })
})

router.get('/deleteTask/:parentId',(request,response)=>{

  var taskId  = request.params.parentId;
console.log('taskId Id1111 ='+taskId);

    let deleteQuerry = 'DELETE FROM salesforce.Milestone1_Task__c '+
    'WHERE sfid = $1';
  console.log('deleteQuerry  '+deleteQuerry);
  pool
  .query(deleteQuerry,[taskId])
  .then((deleteQuerry) => {     
  console.log('deleteQuerry =>>'+JSON.stringify(deleteQuerry));
  response.send(200);
  })
  .catch((deleteError) => {
  console.log('deleteError'+deleteError.stack);
  response.send('Error');
  })
})


/*****************************************   Task List View End  ********************************/

/*****************************************   Timesheet List View Start ********************************/

router.get('/timesheetListView',verify,(request,response)=>{
  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  response.render('./timesheets/timesheetListView',{objUser});
})

router.get('/getTimesheetlist',verify,(request,response)=>{
  let objUser=request.user;
  console.log('objUser.sfid '+objUser.sfid);
  let queryText = 'SELECT sfid, Date__c,end_time__c,Hours__c,	Start_Time__c,name,Incurred_By__c,representative__c,createddate '+
                   'FROM salesforce.Milestone1_Time__c  '+ 
                   'WHERE  representative__c= $1 '+
                   'AND sfid IS NOT NULL ' ;
 console.log('queryText timesheetList',queryText);
  pool
  .query(queryText,[objUser.sfid])
  .then((timesheetQueryResult)=>{
    console.log('timesheetQueryResult '+JSON.stringify(timesheetQueryResult));
    if(timesheetQueryResult.rowCount > 0 && timesheetQueryResult.rows)
    {
        let modifiedList = [],i =1;
        timesheetQueryResult.rows.forEach((eachRecord) => {
          
          let obj = {};
       //   let createdDate = new Date(eachRecord.createddate);
         // let strDate = createdDate.toLocaleString();
          let createdDate = new Date(eachRecord.createddate);
          createdDate.setHours(createdDate.getHours() + 5);
          createdDate.setMinutes(createdDate.getMinutes() + 30);
          let strDate = createdDate.toLocaleString();
          let strDated = new Date(eachRecord.createddate);
          strDated.setHours(strDated.getHours() + 5);
          strDated.setMinutes(strDated.getMinutes() + 30);
          let strDated1 = strDated.toLocaleString();
          obj.sequence = i;
          obj.name = '<a href="#" class="taskreferenceTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
          obj.hours=eachRecord.hours__c;
          obj.startTime=eachRecord.start_time__c;
          obj.endtime=eachRecord.end_time__c;
          obj.date=strDated1.split(',')[0];
          obj.createDdate = strDate;
         // obj.editAction = '<button href="#" class="btn btn-primary editTimesheet" id="'+eachRecord.sfid+'" >Edit</button>'
          obj.deleteAction = '<button href="#" class="btn btn-primary deleteTimesheet" id="'+eachRecord.sfid+'" >Delete</button>'

          i= i+1;
          modifiedList.push(obj);
          
        })
        response.send(modifiedList);
    }
    else
    {
        response.send([]);
    }

  })
  .catch((QueryError) => {
    console.log('QueryError  '+QueryError.stack);
    response.send(querryError);
  }) 
})
  
router.get('/fetchTimesheetDetail',verify,(request,response)=>{
  let timesheetId= request.query.timesheetId;
  console.log('timesheet ID '+timesheetId);
  let queryText = 'SELECT time.Id,time.sfid as sfid,time.name as tname,time.Projecttimesheet__c , tsk.assigned_manager__c, tsk.sfid as tsksfid ,tsk.name as taskname,proj.name as projname,cont.sfid as contid ,cont.name as contname,usr.sfid as usrid ,usr.name as usrname, '+
  'time.Date__c,time.end_time__c,time.Hours__c,time.Start_Time__c,time.Incurred_By__c,time.representative__c,time.createddate,time.Description__c,time.Related_Task_Status__c,time.Calculated_Hours__c '+
  'FROM salesforce.Milestone1_Time__c time '+ 
  'INNER JOIN salesforce.Contact cont ON time.representative__c = cont.sfid '+
  'INNER JOIN salesforce.User usr ON time.Incurred_By__c = usr.sfid '+
  'INNER JOIN salesforce.Milestone1_Project__c proj ON time.Projecttimesheet__c= proj.sfid '+
  'INNER JOIN salesforce.Milestone1_Task__c tsk ON time.Project_Task__c= tsk.sfid '+
  'WHERE  time.sfid= $1 ';
console.log('queryText timesheetList',queryText);
  pool
 // .query('select sfid,name ,Assigned_Manager__c ,end_time__c,Task_Type__c,Planned_Hours__c,Start_Time__c FROM salesforce.Milestone1_Task__c where sfid=$1 ',[tskId])
 .query(queryText,[timesheetId])
 .then((querryResult)=>{
    console.log('QUERRY rESULT'+ JSON.stringify(querryResult.rows));
    response.send(querryResult.rows);
  })
  .catch((querryError)=>{
    console.log('querryError '+querryError);
    response.send(querryError.stack)
})
})

router.get('/fetchtimesheetkDetail',verify,(request,response)=>{
  let timesheetId= request.query.timesheetId;
  console.log('timesheet ID '+timesheetId);
 /*  let queryText = ;
console.log('queryText '+queryText); */
pool
.query('SELECT sfid,date__c,end_time__c,Hours__c,Start_Time__c,name,Incurred_By__c,representative__c,createddate FROM salesforce.Milestone1_Time__c WHERE sfid= $1 ',[timesheetId])
.then((querryResult)=>{
  console.log('queryrResult fetchqueryrResult fetchqueryrResult fetchqueryrResult fetch'+JSON.stringify(querryResult.rows));
  response.send(querryResult.rows);
})
.catch((QueryError)=>{
  console.log('querryError '+QueryError.stack);
  response.send(QueryError);
})
});

router.post('/updateTimesheet',verify,(request,response) => {

  let body=request.body;
  console.log('Body '+ JSON.stringify(body));
  const {start,endTime , dt, hr, hide} = request.body;
  console.log('start '+ start);
  console.log('endTime '+ endTime);
  console.log('dt '+ dt);
  console.log('hr '+ hr);
  console.log('hide '+ hide);
  let updateQuery= 'UPDATE salesforce.Milestone1_Time__c SET '+
                    'end_time__c = \''+endTime+'\', '+
                    'Start_Time__c = \''+start+'\', '+
                       'date__c = \''+dt+'\' '+
                       'WHERE sfid = $1';
  console.log('update Querry'+updateQuery);
  pool
  .query(updateQuery,[hide])
  .then((querryResult)=>{
    console.log('querryResult '+JSON.stringify(querryResult));
    response.send('Success');
  })
  .catch((querryError)=>{
    console.log('querryError'+querryError.stack);
    response.send(querryError);
  })
});

router.get('/deleteTimesheet/:parentId',(request,response)=>{

  var timesheetId  = request.params.parentId;
console.log('taskId Id1111 ='+timesheetId);

    let deleteQuerry = 'DELETE FROM salesforce.Milestone1_Time__c '+
    'WHERE sfid = $1';
  console.log('deleteQuerry  '+deleteQuerry);
  pool
  .query(deleteQuerry,[timesheetId])
  .then((deleteQuerry) => {     
  console.log('deleteQuerry =>>'+JSON.stringify(deleteQuerry));
  response.send(200);
  })
  .catch((deleteError) => {
  console.log('deleteError'+deleteError.stack);
  response.send('Error');
  })
})

/*****************************************   Timesheet List View End ********************************/
 


module.exports = router;
