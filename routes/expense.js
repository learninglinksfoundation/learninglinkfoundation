const express = require('express');
//const router = express.Router();
const pool = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Router = require('express-promise-router');
const format = require('pg-format');
const joi = require('@hapi/joi');
const { request, response } = require('express');
const router = new Router()

router.get('/testQuery',(resquest, response) => {

  pool.query('SELECT exp.sfid,  exp.Project_Name__c, pro.name as proname,exp.Name as expName FROM salesforce.Milestone1_Expense__c as exp JOIN salesforce.Milestone1_Project__c as pro ON exp.Project_name__c = pro.sfid')
  .then((testQueryResult) => {
      response.send(testQueryResult.rows);
  })
  .catch((testQueryError) => {
    response.send(testQueryError.stack);
  })

});

router.get('/',verify, async (request, response) => {

    console.log('Expense request.user '+JSON.stringify(request.user));
    var userId = request.user.sfid; 
    var objUser = request.user;
    console.log('Expense userId : '+userId);

    /* var objProjectList = [];

    await
    pool
  .query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',[userId])
  .then(contactResult => {
    console.log('Name of Contact  ::     '+contactResult.rows[0].name+' sfid'+contactResult.rows[0].sfid);
    var contactId = contactResult.rows[0].sfid;
      pool
      .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[userId])
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
                    objProjectList = projectQueryResult.rows;
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
                       // response.send({projectList : projectQueryResult.rows, contactList : contactResult.rows, taskList : taskQueryResult.rows }); // render calendar
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


    await
    pool
    .query('SELECT id, sfid, Name , Project_Name__c, Approval_Status__c, Amount_Claimed__c, petty_cash_amount__c, Conveyance_Amount__c, Tour_bill_claim_Amount__c FROM salesforce.Milestone1_Expense__c WHERE Incurred_By_Heroku_User__c = $1 AND sfid != \'\'',[userId])
    .then((expenseQueryResult) => {
        console.log('expenseQueryResult   : '+JSON.stringify(expenseQueryResult.rows));
            if(expenseQueryResult.rowCount > 0)
            {
                console.log('expenseQueryResult   : '+JSON.stringify(expenseQueryResult.rows));
                var projectIDs = [], projectIDparams = [];
                for(let i =1 ;i <= expenseQueryResult.rowCount ; i++)
                {
                    console.log('Inside For Loop ');
                    projectIDs.push(expenseQueryResult.rows[i-1].project_name__c);
                    projectIDparams.push('$'+i);
                }

                let projectQueryText = 'SELECT id, sfid , name FROM salesforce.Milestone1_Project__c WHERE sfid IN ( '+projectIDparams.join(',')+' )';
                console.log('projectQueryText  : '+projectQueryText);

                pool
                .query(projectQueryText,projectIDs)
                .then((projectQueryResult) => {
                    console.log('projectQueryResult  : '+JSON.stringify(projectQueryResult.rows));
                })
                .catch((projectQueryError) => {
                    console.log('projectQueryError   : '+projectQueryError.stack);
                })
                response.render('expense.ejs',{objUser : objUser, name : request.user.name, email : request.user.email, expenseList : expenseQueryResult.rows, projectList : objProjectList});
            }
            else
            {
                response.render('expense.ejs',{objUser: objUser, name : request.user.name, email : request.user.email, expenseList : expenseQueryResult.rows, projectList : objProjectList});
            }
    })
    .catch((expenseQueryError) => {
        console.log('expenseQueryError   '+expenseQueryError.stack);
        response.send(403);
    }) */

    response.render('./expenses/expense.ejs',{objUser : objUser, name : request.user.name, email : request.user.email});
  
});


router.get('/expenseAllRecords',verify, async (request, response) => {

  let objUser = request.user;
  console.log('objUser   : '+JSON.stringify(objUser));
  var isEnableNewButton;
  pool
  .query('SELECT exp.id, exp.sfid, exp.Name,exp.Project_Manager_Status__c ,exp.Accounts_Status__c, exp.isHerokuEditButtonDisabled__c, exp.Project_Name__c, exp.Approval_Status__c, exp.Amount_Claimed__c, exp.petty_cash_amount__c, exp.Conveyance_Amount__c, exp.createddate, pro.sfid as prosfid, pro.name as proname FROM salesforce.Milestone1_Expense__c as exp JOIN salesforce.Milestone1_Project__c as pro ON exp.Project_name__c = pro.sfid WHERE exp.Incurred_By_Heroku_User__c = $1 AND exp.sfid != \'\'',[objUser.sfid])
  .then((expenseQueryResult) => {
      console.log('expenseQueryResult   : '+JSON.stringify(expenseQueryResult.rows));
          if(expenseQueryResult.rowCount > 0)
          {
              console.log('expenseQueryResult   : '+JSON.stringify(expenseQueryResult.rows));
              var projectIDs = [], projectIDparams = [];
              for(let i =1 ;i <= expenseQueryResult.rowCount ; i++)
              {
                  console.log('Inside For Loop ');
                  projectIDs.push(expenseQueryResult.rows[i-1].project_name__c);
                  projectIDparams.push('$'+i);
              }

              let expenseList = [];
              for(let i=0 ; i < expenseQueryResult.rows.length; i++)
              {
                let obj = {};
                let crDate = new Date(expenseQueryResult.rows[i].createddate);
                crDate.setHours(crDate.getHours() + 5);
                crDate.setMinutes(crDate.getMinutes() + 30);
                let strDate = crDate.toLocaleString();
                obj.sequence = i+1;
                obj.name = '<a href="'+expenseQueryResult.rows[i].sfid+'" data-toggle="modal" data-target="#popup" class="expId" id="name'+expenseQueryResult.rows[i].sfid+'"  >'+expenseQueryResult.rows[i].name+'</a>';
                obj.projectName = expenseQueryResult.rows[i].proname;
               // obj.approvalStatus = expenseQueryResult.rows[i].approval_status__c;
                obj.totalAmount = '<span id="amount'+expenseQueryResult.rows[i].sfid+'" >'+expenseQueryResult.rows[i].amount_claimed__c+'</span>';
                obj.pettyCashAmount = expenseQueryResult.rows[i].petty_cash_amount__c;
                obj.conveyanceVoucherAmount = expenseQueryResult.rows[i].conveyance_amount__c;
                obj.accStatus=expenseQueryResult.rows[i].accounts_status__c;
                obj.projManagerStatus=expenseQueryResult.rows[i].project_manager_status__c;
                obj.reportManagerstatus=expenseQueryResult.rows[i].approval_status__c;
                obj.createdDate = strDate;
                obj.print='<button    data-toggle="modal" data-target="#popupPrint" class="btn btn-primary printexp" id="print'+expenseQueryResult.rows[i].sfid+'" >Print</button>';
                  obj.editButton = '<button    data-toggle="modal" data-target="#popupEdit" class="btn btn-primary expIdEditMode"   id="edit'+expenseQueryResult.rows[i].sfid+'" >Edit</button>';
                if(expenseQueryResult.rows[i].project_manager_status__c == 'Rejected' || expenseQueryResult.rows[i].approval_status__c == 'Rejected' || expenseQueryResult.rows[i].accounts_status__c == 'Rejected' ){
                  obj.editButton = '<button    data-toggle="modal" data-target="#popupEdit" class="btn btn-primary expIdEditMode" id="edit'+expenseQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.approvalButton = '<button   class="btn btn-primary expIdApproval" style="color:white;" id="'+expenseQueryResult.rows[i].sfid+'" >Approval</button>';
                }
                 else if(expenseQueryResult.rows[i].approval_status__c == 'Pending' || expenseQueryResult.rows[i].approval_status__c == 'Approved' || expenseQueryResult.rows[i].project_manager_status__c == 'Pending' || expenseQueryResult.rows[i].project_manager_status__c == 'Approved' )
                  {
                    obj.editButton = '<button    data-toggle="modal" data-target="#popupEdit" class="btn btn-primary expIdEditMode" disabled = "true"  id="edit'+expenseQueryResult.rows[i].sfid+'" >Edit</button>';
                    obj.approvalButton = '<button   class="btn btn-primary expIdApproval" disabled = "true" style="color:white;" id="'+expenseQueryResult.rows[i].sfid+'" >Approval</button>';
                    obj.isEnableNewButton = true;
                  }
                 else
                 {
                  obj.editButton = '<button    data-toggle="modal" data-target="#popupEdit" class="btn btn-primary expIdEditMode" id="edit'+expenseQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.approvalButton = '<button   class="btn btn-primary expIdApproval" style="color:white;" id="'+expenseQueryResult.rows[i].sfid+'" >Approval</button>';
                 }
                  expenseList.push(obj);
                /* disabled="'+expenseQueryResult.rows[i].isherokueditbuttondisabled__c+'" */
              }

              let successMessages = [];
              successMessages.push({s_msg : 'Expense Data Received'})
             request.flash({successs_msg : 'Expense Data Received'});
              response.send({objUser : objUser, expenseList : expenseList, successs_msg : 'Expense Data Received'});
          }
          else
          {
              response.send({objUser: objUser, expenseList : []});
          }
  })
  .catch((expenseQueryError) => {
      console.log('expenseQueryError   '+expenseQueryError.stack);
      response.send({objUser: objUser, expenseList : []});
  })

})

router.get('/userid',verify,(request,response)=>
{
  console.log('hello i am inside Expense userId');
  console.log('Expense request.userId '+JSON.stringify(request.user));
  var userId = request.user.sfid;
  var userName = request.user.name;
  var us ={};
  us.uid=userId;
  us.uname=userName;
  console.log('user Data '+JSON.stringify(us));
  response.send(us);
})

router.get('/fetchProjectforCreateNew', verify ,(request, response) => 
{

      console.log('hello i am inside Expense Project');
      
      console.log('Expense request.user '+JSON.stringify(request.user));
      var userId = request.user.sfid; 
      var objUser =request.user;
      console.log('Obj user => '+JSON.stringify(objUser));
      var projectName ='';
      if(objUser.isManager){
        console.log('manager login ... ');
        pool
        .query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',[userId])
        .then(contactResult => 
          {
            console.log('Name of Contact  :: '+contactResult.rows[0].name+' sfid='+contactResult.rows[0].sfid);
            var contactId = contactResult.rows[0].sfid;                 
            pool
            .query('SELECT sfid, Name FROM salesforce.team__c WHERE manager__c = $1 ;',[contactId])
            .then(teamcResult => 
              {
                console.log('teamcResult  '+JSON.stringify(teamcResult.rows));
               /*  console.log('Name of TeamMemberId  : '+teamMemberResult.rows[0].name+'   sfid :'+teamMemberResult.rows[0].sfid);
                console.log('Team Id  : '+teamMemberResult.rows[0].team__c);
                console.log('Number of Team Member '+teamMemberResult.rows.length); */
                  var projectTeamparams = [], lstTeamId = [];
                  for(var i = 1; i <= teamcResult.rows.length; i++) 
                   {
                     projectTeamparams.push('$' + i);
                    lstTeamId.push(teamcResult.rows[i-1].sfid);
                    } 
                  var projectTeamQueryText = 'SELECT sfid, Name, Project__c FROM salesforce.Project_Team__c WHERE Team__c IN (' + projectTeamparams.join(',') + ')';
                  console.log('projectTeamQueryText '+projectTeamQueryText);
                          
                   pool
                  .query(projectTeamQueryText,lstTeamId)
                  .then((projectTeamResult) => 
                     {
                       console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
                        console.log('projectTeam Name '+projectTeamResult.rows[0].name);
                  
                        var projectParams = [], lstProjectId = [];
                        for(var i = 1; i <= projectTeamResult.rows.length; i++) 
                          {
                        projectParams.push('$' + i);
                        lstProjectId.push(projectTeamResult.rows[i-1].project__c);
                          } 
                        console.log('lstProjectId  : '+lstProjectId);
                        var projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';
                  
                          pool.
                          query(projetQueryText, lstProjectId)
                         .then((projectQueryResult) => 
                           { 
                            console.log('Number of Projects '+projectQueryResult.rows.length);
                            console.log('Project sfid '+projectQueryResult.rows[0].sfid+ 'Project Name '+projectQueryResult.rows[0].name);
                            var projectList = projectQueryResult.rows;
                            var lstProjectId = [], projectParams = [];
                            var j = 1;
                            projectList.forEach((eachProject) => 
                             {
                              console.log('eachProject sfid : '+eachProject.sfid);
                             lstProjectId.push(eachProject.sfid);
                             projectParams.push('$'+ j);
                             console.log('eachProject name : '+eachProject.name);
                             j++;
                              })
                              response.send(projectQueryResult.rows);
                            })
                                .catch((projectQueryError) => 
                                 {
                                  console.log('projectQueryError '+projectQueryError.stack);
                                 })
                               
                            })
                                .catch((projectTeamQueryError) =>
                                {
                                  console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
                                })          
                            })
                                .catch((teamMemberQueryError) =>
                                {
                                   console.log('Error in team member query '+teamMemberQueryError.stack);
                                })
                    
                          }) 
                    
                          .catch((contactQueryError) => 
                            { 
                              console.error('Error executing contact query', contactQueryError.stack);
                            })
      }
      else{

        pool
        .query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',[userId])
        .then(contactResult => 
          {
            console.log('Name of Contact  :: '+contactResult.rows[0].name+' sfid'+contactResult.rows[0].sfid);
            var contactId = contactResult.rows[0].sfid;                 
            pool
            .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[contactId])
            .then(teamMemberResult => 
              {
                console.log('Name of TeamMemberId  : '+teamMemberResult.rows[0].name+'   sfid :'+teamMemberResult.rows[0].sfid);
                console.log('Team Id  : '+teamMemberResult.rows[0].team__c);
                console.log('Number of Team Member '+teamMemberResult.rows.length);
                  var projectTeamparams = [], lstTeamId = [];
                  for(var i = 1; i <= teamMemberResult.rows.length; i++) 
                   {
                     projectTeamparams.push('$' + i);
                    lstTeamId.push(teamMemberResult.rows[i-1].team__c);
                    } 
                  var projectTeamQueryText = 'SELECT sfid, Name, Project__c FROM salesforce.Project_Team__c WHERE Team__c IN (' + projectTeamparams.join(',') + ')';
                  console.log('projectTeamQueryText '+projectTeamQueryText);
                          
                   pool
                  .query(projectTeamQueryText,lstTeamId)
                  .then((projectTeamResult) => 
                     {
                       console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
                        console.log('projectTeam Name '+projectTeamResult.rows[0].name);
                  
                        var projectParams = [], lstProjectId = [];
                        for(var i = 1; i <= projectTeamResult.rows.length; i++) 
                          {
                        projectParams.push('$' + i);
                        lstProjectId.push(projectTeamResult.rows[i-1].project__c);
                          } 
                        console.log('lstProjectId  : '+lstProjectId);
                        var projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';
                  
                          pool.
                          query(projetQueryText, lstProjectId)
                         .then((projectQueryResult) => 
                           { 
                            console.log('Number of Projects '+projectQueryResult.rows.length);
                            console.log('Project sfid '+projectQueryResult.rows[0].sfid+ 'Project Name '+projectQueryResult.rows[0].name);
                            var projectList = projectQueryResult.rows;
                            var lstProjectId = [], projectParams = [];
                            var j = 1;
                            projectList.forEach((eachProject) => 
                             {
                              console.log('eachProject sfid : '+eachProject.sfid);
                             lstProjectId.push(eachProject.sfid);
                             projectParams.push('$'+ j);
                             console.log('eachProject name : '+eachProject.name);
                             j++;
                              })
                              response.send(projectQueryResult.rows);
                            })
                                .catch((projectQueryError) => 
                                 {
                                  console.log('projectQueryError '+projectQueryError.stack);
                                 })
                               
                            })
                                .catch((projectTeamQueryError) =>
                                {
                                  console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
                                })          
                            })
                                .catch((teamMemberQueryError) =>
                                {
                                   console.log('Error in team member query '+teamMemberQueryError.stack);
                                })
                    
                          }) 
                    
                          .catch((contactQueryError) => 
                            { 
                              console.error('Error executing contact query', contactQueryError.stack);
                            })
  


      }


       
  });
                   
                  
      
/* Project Query
                  pool
                  .query('Select sfid , Name FROM salesforce.Milestone1_Project__c WHERE Incurred_By_Heroku_User__c = $1 AND sfid != \'\'',[objUser.sfid])
                  .then((projectQueryResult) => {
                    console.log('projectQueryResult  : '+JSON.stringify(projectQueryResult.rows));
                    response.send(projectQueryResult.rows);

                  })
                  .catch((activityCodeQueryError) => {
                    console.log('activityCodeQueryError  : '+activityCodeQueryError.stack);
                    response.send([]);
                  })
*/
router.post('/createExpense',(request, response) => {

   // var {expenseName, projectName} = request.body;
    console.log('request.body  '+JSON.stringify(request.body));

   const {taskname,proj , incurredBy} = request.body;
   console.log('taskname  '+taskname);
   console.log('proj  '+proj);
  // console.log('department  '+department);
  // console.log('empCategory  '+empCategory);
   console.log('incurredBy  '+incurredBy);

   const schema=joi.object({
    taskname:joi.string().required().label('Please Fill Expense Name'),
    task:joi.string().min(3).required().label('Please Fill Expense Name'),
    expense:joi.string().max(80).required().label(' Expense Name too long.'),
    proj:joi.string().required().label('Please choose Project'),
  //  department:joi.string().required().label('Please choose Department'),
 //   departm:joi.string().min(3).required().label('Please Fill Department'),
 //   depart:joi.string().max(255).required().label('Department value too long.'),
      })
let result=schema.validate({taskname:taskname,task:taskname,expense:taskname,proj:proj});
if(result.error){
    console.log('fd'+result.error);
    response.send(result.error.details[0].context.label);    
}
  else{
    pool
    .query('INSERT INTO salesforce.Milestone1_Expense__c (name,project_name__c,Incurred_By_Heroku_User__c) values ($1,$2,$3)',[taskname,proj,incurredBy])
    .then((expenseInsertResult) => {     
             console.log('expenseInsertResult.rows '+JSON.stringify(expenseInsertResult.rows));
             response.send('Successfully Inserted');
    })
    .catch((expenseInsertError) => {
         console.log('expenseInsertError   '+expenseInsertError.stack);
         response.send('Error');
    })
  }
   
 
});

router.get('/saved-expense-details',verify, async (request, response) => {

  let finaResponse = {};
  console.log('Expense request.user '+JSON.stringify(request.user));
  let objUser = request.user;
  finaResponse.objUser = objUser;


  let expenseId = request.query.expenseId;
  console.log('Hurrah expenseId '+expenseId);
  let expenseQueryText = 'SELECT exp.id,exp.sfid,exp.Name,exp.project_name__c, proj.name as projname, proj.sfid as projId, exp.Designation__c, '+
    'exp.Conveyance_Employee_Category_Band__c,'+
    'exp.Approval_Status__c, exp.Amount_Claimed__c, exp.petty_cash_amount__c, exp.Conveyance_Amount__c '+
    'FROM salesforce.Milestone1_Expense__c exp '+
    'INNER JOIN salesforce.Milestone1_Project__c proj '+
    'ON exp.Project_Name__c =  proj.sfid '+  
    'WHERE exp.sfid = $1';

  await
  pool
  .query(expenseQueryText,[expenseId])
  .then((expenseQueryResult) => {
      if(expenseQueryResult.rowCount > 0)
      {
        finaResponse.expenseDetails = expenseQueryResult.rows[0];
       
      }   
      else
        response.send({});
  })
  .catch((expenseQueryError) => {
        console.log('expenseQueryError  '+expenseQueryError.stack);
        response.send({});
  })

  await
  pool
  .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[objUser.sfid])
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
          let projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';

          pool.query(projetQueryText, lstProjectId)
          .then((projectQueryResult) => { 
                console.log('Number of Projects '+projectQueryResult.rows.length);
                finaResponse.projectList = projectQueryResult.rows;
                response.send(finaResponse);
           })
          .catch((projectQueryError) => {

           })
        })   
       .catch((projectTeamQueryError)=> {

       })
    })
    .catch((teamMemberQueryError) => {

    })


});

router.post('/update-expense',verify,(request, response) => {

  console.log('Expense request.user '+JSON.stringify(request.user));
  let objUser = request.user;
  
    let formBody = request.body;
    console.log('formBody  :'+JSON.stringify(formBody));
    const {name,editProject , incurredBy, empCategory, hide} = request.body;
   console.log('name  '+name);
   console.log('project  '+editProject);
   //console.log('department  '+department);
   //console.log('designation  '+designation);
   console.log('incurredBy  '+incurredBy);
   console.log('empCategory  '+empCategory);
   console.log('expense Id '+hide);

   const schema=joi.object({
    name:joi.string().min(3).required().label('Please fill Expense Name'),
    editProject: joi.string().required().label('Please choose Project'),
   // department:joi.string().required().label('Please fill Department'),
    //designation:joi.string().required().label('Please fill Designation'),
})
let result=schema.validate({name,editProject});
if(result.error){
    console.log('fd'+result.error);
    response.send(result.error.details[0].context.label);    
}
else{

   let updateExpenseQuery = 'UPDATE salesforce.Milestone1_Expense__c SET '+
                             'name = \''+name+'\', '+
                             'project_name__c = \''+editProject+'\' '+
                           //  'department__c = \''+department+'\' , '+
                            // 'designation__c = \''+designation+'\' '+
                             'WHERE sfid = $1';
  console.log('updateExpenseQuery  '+updateExpenseQuery);

   pool
   .query(updateExpenseQuery,[hide])
   .then((expenseInsertResult) => {     
            console.log('expenseInsertResult.rows '+JSON.stringify(expenseInsertResult.rows));
            response.send('Successfully Updated !');
   })
   .catch((expenseInsertError) => {
        console.log('expenseInsertError   '+expenseInsertError.stack);
        response.send('Error');
   })
  }
});


router.get('/expenseRecordDetails',(request, response) =>{

    var expenseId = request.query.expenseId;
    console.log('Hurrah expenseId '+expenseId);

});

router.get('/details', async (request, response) => {

  var expenseId = request.query.expenseId;
  console.log('Hurrah expenseId '+expenseId);

  var expenseQueryText = 'SELECT exp.id,exp.sfid,exp.Name, proj.name as projname, proj.sfid as projId, exp.Department__c, exp.Designation__c, '+
  ' exp.Conveyance_Employee_Category_Band__c,exp.Employee_ID__c, exp.Project_Manager_Status__c, exp.Accounts_Status__c , '+
  'exp.Approval_Status__c, exp.Amount_Claimed__c, exp.Extra_Amount__c, exp.petty_cash_amount__c, exp.Conveyance_Amount__c, exp.Tour_Bill_Claim__c FROM salesforce.Milestone1_Expense__c exp '+
  'INNER JOIN salesforce.Milestone1_Project__c proj '+
  'ON exp.Project_Name__c =  proj.sfid '+
  'WHERE exp.sfid = $1';


  var pettyCashQueryText = 'SELECT id, sfid, name, Bill_No__c, Bill_Date__c,Nature_of_exp__c, Amount__c FROM salesforce.Petty_Cash_Expense__c WHERE Expense__c = $1';
  var conveyanceQueryText = 'SELECT id, sfid, Name, Amount__c, Mode_of_Conveyance__c, From__c FROM salesforce.Conveyance_Voucher__c WHERE Expense__c = $1';
  var tourBillClaimQueryText = 'SELECT id, sfid, Name,Grand__c FROM salesforce.Tour_Bill_Claim__c WHERE Expense__c = $1 ';
  var customApprovalText = 'SELECT cust.id, cust.sfid,cust.approval_type__c, cust.Name as custname, cust.Comment__c as custcomm,cust.Approver_PM__c,con.name as conname,cust.Approver_RM__c '+
  'FROM salesforce.Custom_Approval__c cust '+
  'INNER JOIN salesforce.Contact con '+
  'ON cust.submitter_heroku__c=con.sfid '+
  'WHERE cust.Expense__c = $1 ';

  var objData =  {};

  try{

      await pool.query(expenseQueryText,[expenseId])
      .then((expenseQueryResult) => {
              console.log('Expense Result '+JSON.stringify(expenseQueryResult.rows));
              objData.Expense = expenseQueryResult.rows;
      })
      .catch(expenseQueryError => console.log('expenseQueryError   :'+expenseQueryError.stack))


      await pool.query(pettyCashQueryText,[expenseId])
      .then(pettyCashQueryResult => {console.log('Petty Cash Result '+JSON.stringify(pettyCashQueryResult.rows))
              objData.PettyCash = pettyCashQueryResult.rows;
      })
      .catch(pettyCashQueryError => console.log('pettyCashQueryError  : '+pettyCashQueryError.stack))
      
      await pool.query(conveyanceQueryText,[expenseId])
      .then((conveyanceQueryResult) => {
              console.log('Conveyance Result '+JSON.stringify(conveyanceQueryResult.rows));
              objData.Conveyance = conveyanceQueryResult.rows;
      })
      .catch(conveyanceQueryError => console.log('conveyanceQueryError   :'+conveyanceQueryError.stack))

      await pool.query(tourBillClaimQueryText,[expenseId])
      .then((tourBillClaimResult) => {
          console.log('Tour BillClaim Result '+JSON.stringify(tourBillClaimResult.rows));
          objData.TourBillClaim = tourBillClaimResult.rows;
      })
      .catch(tourBillClaimQueryError => console.log('tourBillClaimQueryError   :'+tourBillClaimQueryError.stack))

      await pool.query(customApprovalText,[expenseId])
      .then((customApprovalResult) => {
          console.log('customApprovalResult '+JSON.stringify(customApprovalResult.rows));
          objData.customApproval = customApprovalResult.rows;
      })
      .catch(customApprovalResultError => console.log('customApprovalResultError   :'+customApprovalResultError.stack))
    
     
  }
  catch(err){
      console.log('error async await '+err);
  }

  console.log('objData '+JSON.stringify(objData));
  response.send(objData);
});


router.get('/getExpenseApproval/:expenseId&:isDisabled',verify,(request,response)=>{

  console.log('About to render expense Approval Page');
  let objUser=request.user;
  console.log('user '+objUser);
 // let expenseId = request.query.expenseId;
  let parentExpenseId = request.params.expenseId;
  console.log('parentExpenseId  '+parentExpenseId);
  isDisabled = request.params.isDisabled;
  console.log(' ++++ isDisabled ++++ '+isDisabled);
  response.render('./expenses/expenseApprovalList',{objUser,isDisabled,parentExpenseId:parentExpenseId});
//  response.render('./expenses/conveyanceVoucher/ConveyanceListView',{objUser,expenseId});

})

router.get('/approvalList',verify,(request,response)=>{

  console.log('Your are inside the Approvel List Router method');
  let parentId = request.query.parentId;
  console.log('parentId '+parentId);
   let objUser=request.body.user;
   console.log('objUser '+JSON.stringify(objUser));
  console.log('Your are inside the Approvel List Router method');
  let qry ='SELECT app.sfid as appsfid, app.name as appname, app.Approval_Type__c,app.Comment__c, con.name as conname, exp.name as expname, exp.sfid as expsfid, app.Approver_RM__c , app.Amount__c,app.createddate, app.Expense__c, app.Assign_To_PM__c '+
  ' FROM salesforce.Custom_Approval__c app '+
 'INNER JOIN salesforce.Contact con '+
 'ON app.submitter_heroku__c=con.sfid '+
 'INNER JOIN salesforce.Milestone1_Expense__c exp '+
 'ON app.Expense__c = exp.sfid '+
 'WHERE app.Expense__c = $1 ';
  
/*    qry ='SELECT app.sfid as appsfid, app.name as appname, app.Approval_Type__c,app.Comment__c, con.name as conname, exp.name as expname, exp.sfid as expsfid, app.Approver_RM__c , app.Amount__c,app.createddate, app.Expense__c, app.Assign_To_PM__c '+
   ' FROM salesforce.Custom_Approval__c app '+
  'INNER JOIN salesforce.Contact con '+
  'ON app.Approver_RM__c=con.sfid '+
  'INNER JOIN salesforce.Milestone1_Expense__c exp '+
  'ON app.Expense__c = exp.sfid '+
  'WHERE app.Expense__c = $1 ';
 */
          console.log('qyer '+qry)
   pool
  .query(qry,[parentId])
  .then((querryResult)=>{
      console.log('querryResult'+JSON.stringify(querryResult.rows)+'ROWCOUNT: '+querryResult.rowCount);
      if(querryResult.rowCount > 0)
      {
          //response.send(pettyCashQueryResult.rows);

          let customApproval = [],i =1;
          querryResult.rows.forEach((eachRecord) => {
            let obj = {};
            let createdDate = new Date(eachRecord.createddate);
            createdDate.setHours(createdDate.getHours() + 5);
            createdDate.setMinutes(createdDate.getMinutes() + 30);
            let strDate = createdDate.toLocaleString();
            obj.sno = i;
            obj.name = '<a href="#" class="approvalTag" id="'+eachRecord.appsfid+'" >'+eachRecord.appname+'</a>';
            obj.type = eachRecord.approval_type__c;
            obj.approver = eachRecord.conname;
            obj.comment = eachRecord.comment__c;
            obj.expense = eachRecord.expname;
            obj.amount = eachRecord.amount__c;
            obj.createdDate = strDate;

            i= i+1;
            customApproval.push(obj);
          })
          response.send(customApproval);
      }
      else
      {
          response.send([]);
      }
  })
  .catch((querryError)=>{
      console.log('QuerrError=>'+querryError.stack);
      response.send(querryError); 
  })

})


router.get('/printdetails',async(request,response)=>{
  var expenseId = request.query.expenseId;
    console.log('Hurrah expenseId '+expenseId);
    var tourBillClaimId=[];
    var tourBillCaimParam=[];
    var airRailBusQuery='';
    var conveyanceChargeQuery='';
    var boardinglodgingQuery='';
    var telephoneFoodQuery='';
    var miscellaneousQuery='';
    var expenseQueryText = 'SELECT exp.id,exp.sfid,exp.Name, proj.name as projname, proj.sfid as projId, exp.Department__c, exp.Designation__c, '+
    ' exp.Conveyance_Employee_Category_Band__c,exp.Employee_ID__c, exp.Project_Manager_Status__c, exp.Accounts_Status__c , '+
    'exp.Approval_Status__c, exp.Amount_Claimed__c, exp.petty_cash_amount__c, exp.Conveyance_Amount__c, exp.Tour_Bill_Claim__c FROM salesforce.Milestone1_Expense__c exp '+
    'INNER JOIN salesforce.Milestone1_Project__c proj '+
    'ON exp.Project_Name__c =  proj.sfid '+  
    'WHERE exp.sfid = $1';
     var pettyCashQueryText = 'SELECT petty.sfid as sfid, petty.name as name, petty.Activity_Code_Project__c, petty.Bill_No__c,act.name as actname, petty.Bill_Date__c,petty.Nature_of_exp__c, petty.Amount__c '+
    'FROM salesforce.Petty_Cash_Expense__c petty '+
    'INNER JOIN salesforce.Activity_Code__c act ON petty.Activity_Code_Project__c = act.sfid '+
    'WHERE Expense__c = $1';  
    console.log('jdcj '+pettyCashQueryText);
    var conveyanceQueryText = 'SELECT  con.sfid, con.Name as name, con.Amount__c, con.Mode_of_Conveyance__c, con.From__c,con.To__c,con.Kms_Travelled__c,act.name as actname '+
    'FROM salesforce.Conveyance_Voucher__c con '+
    'INNER JOIN salesforce.Activity_Code__c act ON con.Activity_Code_Project__c = act.sfid '+
    'WHERE Expense__c = $1';
    var tourBillClaimQueryText = 'SELECT id, sfid, Name,Grand__c FROM salesforce.Tour_Bill_Claim__c WHERE Expense__c = $1 ';
    
    var objData =  {};
    try{

      await pool.query(expenseQueryText,[expenseId])
      .then((expenseQueryResult) => {
              console.log('Expense Result '+JSON.stringify(expenseQueryResult.rows));
              objData.Expense = expenseQueryResult.rows;
      })
      .catch(expenseQueryError => console.log('expenseQueryError   :'+expenseQueryError.stack))


      await pool.query(pettyCashQueryText,[expenseId])
      .then(pettyCashQueryResult => {console.log('Petty Cash Result '+JSON.stringify(pettyCashQueryResult.rows))
              objData.PettyCash = pettyCashQueryResult.rows;
      })
      .catch(pettyCashQueryError => console.log('pettyCashQueryError  : '+pettyCashQueryError.stack))
      
      await pool.query(conveyanceQueryText,[expenseId])
      .then((conveyanceQueryResult) => {
              console.log('Conveyance Result '+JSON.stringify(conveyanceQueryResult.rows));
              objData.Conveyance = conveyanceQueryResult.rows;
      })
      .catch(conveyanceQueryError => console.log('conveyanceQueryError   :'+conveyanceQueryError.stack))

      await pool.query(tourBillClaimQueryText,[expenseId])
      .then((tourBillClaimResult) => {
          console.log('Tour BillClaim Result '+JSON.stringify(tourBillClaimResult.rows));
          objData.TourBillClaim = tourBillClaimResult.rows;
          for(var i=1;i<=tourBillClaimResult.rowCount;i++){
            tourBillCaimParam.push('$'+i);
            tourBillClaimId.push(tourBillClaimResult.rows[i-1].sfid);
          }
          console.log('tourBillCaimParam '+tourBillCaimParam+'  @tourBillClaimId'+tourBillClaimId );
          airRailBusQuery = 'SELECT air.sfid, air.Name as name, air.Departure_Date__c, air.Arrival_Date__c,air.Departure_Station__c,'+ 
          'air.Arrival_Station__c,air.Amount__c, Tour_Bill_Claim__c, Activity_Code_Project__c,act.name as actname, tour.name as tourname '+
          'FROM salesforce.Air_Rail_Bus_Fare__c air '+
          'INNER JOIN salesforce.Activity_Code__c act ON air.Activity_Code_Project__c = act.sfid '+
          'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON air.Tour_Bill_Claim__c = tour.sfid '+
          'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';
           console.log('airRailBusQuery '+airRailBusQuery);
           // Conveyance charge Query Result
           conveyanceChargeQuery='SELECT conch.sfid,conch.Name as name,conch.Date__c,conch.Amount__c,conch.Place__c,'+ 
           'conch.Remarks__c,act.name as actname,tour.name as tourname '+
           'FROM salesforce.Conveyance_Charges__c conch '+
           'INNER JOIN salesforce.Activity_Code__c act ON conch.Activity_Code_Project__c = act.sfid '+
           'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON conch.Tour_Bill_Claim__c = tour.sfid '+
           'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';
           // boardinglodgingQuery query  
           boardinglodgingQuery='SELECT board.sfid, board.Name as name,board.Stay_Option__c,board.Place_Journey__c,board.Correspondence_City__c,board.Activity_Code_Project__c,board.Own_Stay_Amount__c,board.From__c,board.To__c,'+
           'board.Daily_Allowance__c,board.Amount_of_B_L_as_per_policy__c, board.Actual_Amount_for_boarding_and_lodging__c,board.Amount_for_boarding_and_lodging__c, '+
           'board.Total_Amount__c,board.Extra_Amount__c,board.Total_Allowance__c, act.name as actname,tour.name as tourname '+
           'FROM salesforce.Boarding_Lodging__c board '+
           'INNER JOIN salesforce.Activity_Code__c act ON board.Activity_Code_Project__c = act.sfid '+
           'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON board.Tour_Bill_Claim__c = tour.sfid '+
           'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';
           console.log('boardinglodgingQuery '+boardinglodgingQuery);

           telephoneFoodQuery='SELECT telephn.sfid,telephn.Name as name, telephn.Laundry_Expense__c,telephn.Fooding_Expense__c,telephn.Remarks__c,'+ 
           'telephn.Total_Amount__c, act.name as actname,tour.name as tourname '+
           'FROM salesforce.Telephone_Fooding_Laundry_Expenses__c telephn '+
           'INNER JOIN salesforce.Activity_Code__c act ON telephn.Activity_Code_Project__c = act.sfid '+
           'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON telephn.Tour_Bill_Claim__c = tour.sfid '+
           'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';

           miscellaneousQuery='SELECT misc.sfid,misc.Name,misc.Date__c,misc.Amount__c,misc.Particulars_Mode__c,'+ 
           'misc.Remarks__c,misc.Tour_Bill_Claim__c,act.name as actname,tour.name as tourname '+
           'FROM salesforce.Miscellaneous_Expenses__c misc '+
           'INNER JOIN salesforce.Activity_Code__c act ON misc.Activity_Code_Project__c = act.sfid '+
           'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON misc.Tour_Bill_Claim__c = tour.sfid '+
           'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';
           
      })
      .catch(tourBillClaimQueryError => console.log('tourBillClaimQueryError   :'+tourBillClaimQueryError.stack))
    
      await pool.query(airRailBusQuery,tourBillClaimId)
      .then((airRailBusQueryResult) => {
              console.log('airRailBusQueryResult Result '+JSON.stringify(airRailBusQueryResult.rows));
              objData.airRailBus = airRailBusQueryResult.rows;
      })
      .catch(airRailBusQueryerror => console.log('airRailBusQueryerror   :'+airRailBusQueryerror.stack))

      await pool.query(conveyanceChargeQuery,tourBillClaimId)
      .then((conveyanceChargeQueryResult) => {
              console.log('conveyanceChargeQueryResult Result '+JSON.stringify(conveyanceChargeQueryResult.rows));
              objData.conveyanceCharge = conveyanceChargeQueryResult.rows;
      })
      .catch(conveyanceChargeQueryError => console.log('conveyanceChargeQueryError   :'+conveyanceChargeQueryError.stack))

      await pool.query(boardinglodgingQuery,tourBillClaimId)
      .then((boardinglodgingQueryResut) => {
              console.log('boardinglodgingQueryResut Result '+JSON.stringify(boardinglodgingQueryResut.rows));
              objData.boarding = boardinglodgingQueryResut.rows;
      })
      .catch(boardinglodgingQueryError => console.log('boardinglodgingQueryError   :'+boardinglodgingQueryError.stack))


      await pool.query(telephoneFoodQuery,tourBillClaimId)
      .then((telephoneFoodQueryresult) => {
              console.log('telephoneFoodQueryresult Result '+JSON.stringify(telephoneFoodQueryresult.rows));
              objData.telephone= telephoneFoodQueryresult.rows;
      })
      .catch(telephoneFoodQueryerror => console.log('telephoneFoodQueryerror   :'+telephoneFoodQueryerror.stack))

      await pool.query(miscellaneousQuery,tourBillClaimId)
      .then((miscellaneousQueryresult) => {
              console.log('miscellaneousQueryresult Result '+JSON.stringify(miscellaneousQueryresult.rows));
              objData.miscell= miscellaneousQueryresult.rows;
      })
      .catch(miscellaneousQueryerror => console.log('miscellaneousQueryerror   :'+miscellaneousQueryerror.stack))


     
  }
  catch(err){
      console.log('error async await '+err);
  }
  console.log('objData '+JSON.stringify(objData));
  response.send(objData);

})




var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|PNG|JPG|GIF|pdf|doc|docx|xlsx)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

console.log('process.env.CLOUD_NAME  : '+process.env.CLOUD_NAME);
console.log('process.env.API_ID  : '+process.env.API_ID);
console.log('process.env.API_SECRET  : '+process.env.API_SECRET);

var upload = multer({ storage: storage, fileFilter: imageFilter})
cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_ID, 
  api_secret: process.env.API_SECRET
}); 




router.get('/pettyCash/:parentExpenseId&:isDisabled',verify,(request, response) => {

  var parentExpenseId = request.params.parentExpenseId;
  console.log('parentExpenseId  '+parentExpenseId);
  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 
  var objUser = request.user;
  console.log('Expense userId : '+userId);
  isDisabled = request.params.isDisabled;
  console.log(' ++++ isDisabled ++++ '+isDisabled);
  response.render('expenses/pettyCash/pettyCash',{objUser,isDisabled, parentExpenseId: parentExpenseId });
 // response.render('expenses/pettyCash/pettyCash',{objUser, parentExpenseId:parentExpenseId });
});



router.post('/savePettyCashForm', (request, response) => {

  console.log('Body Result '+JSON.stringify(request.body));  
  console.log('Now For Each   lllllllllLoop !');
  console.log('Hello Work done !');
  let parentExpenseId='';


  const{bill_no,bill_date,projectTask,desc,nature_exp,amount,imgpath}=request.body;
  if(typeof(request.body.parentExpenseId)!='object'){
    console.log('inside single record');
     parentExpenseId =request.body.parentExpenseId;
  }
  else{
    parentExpenseId = request.body.parentExpenseId[0];
    console.log('parentExpenseId '+parentExpenseId);
  }
  
  console.log('parentExpenseId pettyCash '+parentExpenseId);
    pool.
    query('Select sfid,name,Approval_Status__c from salesforce.Milestone1_Expense__c where sfid=$1',[parentExpenseId])
    .then((ExpenseQuerryResult)=>{
      console.log('ExpenseQuerryResult => '+JSON.stringify(ExpenseQuerryResult.rows));
      if(ExpenseQuerryResult.rows[0].approval_status__c=='Approved' || ExpenseQuerryResult.rows[0].approval_status__c=='Pending'){
        console.log('sddjs');
        response.send('The record cannot be created as the Expense status is PENDING/APPROVED');
      }
      
      else {
    
         let numberOfRows,lstPettyCash = [];
        if(typeof(request.body.bill_no) == 'object')
  {
       numberOfRows = request.body.bill_no.length;           
        for(let i=0; i< numberOfRows ; i++)
        {
          const schema = joi.object({
             bill_no:joi.string().required().label('Please enter Bill No.'),
          //  bill_dt:joi.date().required().label('Please Fill Bill Date.'),
            bills:joi.string().min(3).required().label('Please enter Bill No.'),
            bill:joi.string().max(255).required().label('Please enter Bill No. , ranging from 1-255 Characters'),
            bill_date:joi.date().required().label('Please enter Bill Date'),
              bill_dated:joi.date().max('now').label('Bill Date must be less than today'),
              projectTask:joi.string().required().label('Please select Activity Code'),
              desc: joi.string().min(3).required().label('Please enter DESCRIPTION OF ACTIVITY EXPENSES '),
              descrip: joi.string().min(1).max(255).required().label('Please enter Description, ranging from 1-255 Characters'),
              natureexp: joi.string().min(3).required().label('Please enter Nature of Expense'),
              nature: joi.string().max(255).label('Please enter Nature of Expense, ranging from 1-255 Characters'),
              amount:joi.number().required().label('Please enter Amount'),
              amt:joi.number().min(0).label('Amount cannot be negative.'),
              amtt:joi.number().min(1).label('Please enter Amount greater than zero.'),
              imgpath:joi.string().invalid('demo').required().label('Please Upload File/Attachments'),
             })
             let result = schema.validate({bill_no:request.body.bill_no[i], bills:request.body.bill_no[i], bill:request.body.bill_no[i], bill_date:request.body.bill_date[i], bill_dated:request.body.bill_date[i],projectTask : request.body.projectTask[i],desc:request.body.desc[i], descrip:request.body.desc[i], nature:request.body.nature_exp[i], natureexp:request.body.nature_exp[i], amount:request.body.amount[i], amt:request.body.amount[i],amtt:request.body.amount[i], imgpath:request.body.imgpath[i]})
             if(result.error)
             {
               console.log('ejssssss VAlidation'+JSON.stringify(result.error));
               response.send(result.error.details[0].context.label);
               return;
             }
             else{
   
              let pettyCashValues = [];
              pettyCashValues.push(request.body.bill_no[i]);
              pettyCashValues.push(request.body.bill_date[i]);
              pettyCashValues.push(request.body.projectTask[i]);
              pettyCashValues.push(request.body.desc[i]);
              pettyCashValues.push(request.body.nature_exp[i]);
              pettyCashValues.push(request.body.amount[i]);
              pettyCashValues.push(request.body.imgpath[i]);
              pettyCashValues.push(request.body.parentExpenseId[i]);
              lstPettyCash.push(pettyCashValues);
             }
          }    
          console.log('lstPettyCash  '+JSON.stringify(lstPettyCash));
         }
         else
    { 
      const schema = joi.object({
        //   bill_no:joi.string().required().label('Please provode Bill NO'),
        bill_no:joi.string().required().label('Please enter Bill No.'),
        bills:joi.string().min(3).required().label('Please enter Bill No.'),
        bill:joi.string().max(255).required().label('Please enter Bill No. , ranging from 1-255 Characters'),
        bill_date:joi.date().required().label('Please enter Bill Date'),
        bill_dated:joi.date().max('now').label('Bill Date must be less than today'),
        projectTask:joi.string().required().label('Please select Activity Code'),
        desc: joi.string().min(3).required().label('Please enter DESCRIPTION OF ACTIVITY EXPENSES '),
        descrip: joi.string().max(255).required().label('Please enter Description, ranging from 1-255 Characters'),
        natureexp: joi.string().min(3).required().label('Please enter Nature of Expense'),
        nature: joi.string().max(255).label('Please enter Nature of Expense, ranging from 1-255 Characters'),
        amount:joi.number().required().label('Please enter Amount'),
        amt:joi.number().min(0).label('Amount cannot be negative.'),
        amtt:joi.number().min(1).label('Please enter Amount greater than zero.'),
        imgpath:joi.string().invalid('demo').required().label('Please Upload File/Attachments'),
       })

       let result = schema.validate({bill_no:request.body.bill_no,bills:request.body.bill_no, bill:request.body.bill_no, bill_date:request.body.bill_date, bill_dated:request.body.bill_date, projectTask:request.body.projectTask,desc:request.body.desc, descrip:request.body.desc, nature:request.body.nature_exp, natureexp:request.body.nature_exp, amount:request.body.amount, amt:request.body.amount, amtt:request.body.amount, imgpath:request.body.imgpath})
       if(result.error)
       {
         console.log('ejssssss VAlidation'+JSON.stringify(result.error));
         response.send(result.error.details[0].context.label);
         return;
       }
       else{

        numberOfRows = 1;
        for(let i=0; i< numberOfRows ; i++)
        {
            let pettyCashValues = [];
         /*    if(typeof(request.body.bill_no) == 'undefined' || request.body.bill_no == '')
              pettyCashValues.push('');
            else
              pettyCashValues.push(request.body.bill_no); */
            pettyCashValues.push(request.body.bill_no);
            pettyCashValues.push(request.body.bill_date);
            pettyCashValues.push(request.body.projectTask);
            pettyCashValues.push(request.body.desc);
            pettyCashValues.push(request.body.nature_exp);
            pettyCashValues.push(request.body.amount);
            pettyCashValues.push(request.body.imgpath);
            pettyCashValues.push(request.body.parentExpenseId);
            lstPettyCash.push(pettyCashValues);
            
        }

       }    
      
        console.log('lstPettyCash  '+JSON.stringify(lstPettyCash));
         }
    
    
    let pettyCashInsertQuery = format('INSERT INTO salesforce.Petty_Cash_Expense__c (bill_no__c, bill_date__c,Activity_Code_Project__c,description_of_activity_expenses__c,nature_of_exp__c,amount__c,heroku_image_url__c,expense__c) VALUES %L returning id', lstPettyCash);

    console.log('pettyCashInsertQuery   '+pettyCashInsertQuery);
    pool.query(pettyCashInsertQuery)
    .then((pettyCashQueryResult) => {
        console.log('pettyCashQueryResult  '+JSON.stringify(pettyCashQueryResult.rows));
        response.send('Petty Cash Form Saved Succesfully !');
    })
    .catch((pettyCashQueryError) => {
      console.log('pettyCashQueryError  '+pettyCashQueryError.stack);
      response.send('Error Occured !');
    })
  }
})
.catch((error)=>{
  console.log('Error in Expense Validation Querry '+JSON.stringify(error.stack));
})
});

router.post('/uploadImage',upload.any(),async (request, response) => {

    console.log('uploadImage  Called !');
    console.log('request.files[0].path   '+request.files[0].path);
    try{
    cloudinary.uploader.upload(request.files[0].path, { resource_type: "raw" }, function(error, result) {
 
        if(error){
          console.log('cloudinary  error' + error);
        }
        console.log('cloudinary result '+JSON.stringify(result));
        response.send(result);
      });
   }
   catch(Ex)
   {
        console.log('Exception '+ex);
        console.log('Exception '+JSON.stringify(ex));
   }
});



router.get('/conveyanceVoucher/:parentExpenseId&:isDisabled',verify,(request, response) => {

  var parentExpenseId = request.params.parentExpenseId;
  console.log('conveyanceVoucher parentExpenseId '+parentExpenseId);
  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 
  var objUser = request.user;
  console.log('Expense userId : '+userId);
  isDisabled = request.params.isDisabled;
  console.log(' ++++ isDisabled ++++ '+isDisabled);
  response.render('expenses/conveyanceVoucher/conveyanceVoucher',{objUser,isDisabled, parentExpenseId: parentExpenseId });

}); 
router.get('/tourBillNewPage/:parentExpenseId&:isDisabled',verify,(request, response) => {

  var parentExpenseId = request.params.parentExpenseId;
  console.log(' parentExpenseId '+parentExpenseId);
  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 
  var objUser = request.user;
  console.log('Expense userId : '+userId);
  isDisabled = request.params.isDisabled;
  console.log(' ++++ isDisabled ++++ '+isDisabled);
  pool
  .query('SELECT sfid, name from salesforce.Tour_Bill_Claim__c WHERE expense__c = $1',[parentExpenseId])
  .then((querryResult) => {


    console.log('tourbillquerryResult :  '+JSON.stringify(querryResult.rows));
    if(querryResult.rowCount>0){
      response.render('expenses/tourBillClaims/TourBillclaimNew',{objUser,isDisabled, parentExpenseId: parentExpenseId,tourbillId:querryResult.rows[0].sfid });
    }
    else{
      response.render('expenses/tourBillClaims/TourBillclaimNew',{objUser,isDisabled, parentExpenseId: parentExpenseId ,tourbillId:'true'});
    }
    
})
.catch((conveyanceQueryError) => {
  console.log('conveyanceQueryError  '+conveyanceQueryError);
  response.send('Error in new Page')
})

 
}); 

router.post('/conveyanceform',(request,response) => {  
  let body = request.body;
  let parentExpenseId ='';
  console.log('parentExpenseId conveyance '+parentExpenseId);
    console.log('conveyanceform Body Result  : '+JSON.stringify(request.body));
    if(typeof(request.body.parentExpenseId)!='object'){
      parentExpenseId =request.body.parentExpenseId;
   }
   else{
     parentExpenseId = request.body.parentExpenseId[0];
     console.log('parentExpenseId '+parentExpenseId);
   }
   

    pool.
    query('Select sfid,name,Approval_Status__c from salesforce.Milestone1_Expense__c where sfid=$1',[parentExpenseId])
    .then((ExpenseQuerryResult)=>{
      console.log('ExpenseQuerryResult => '+JSON.stringify(ExpenseQuerryResult.rows));
      if(ExpenseQuerryResult.rows[0].approval_status__c=='Approved' || ExpenseQuerryResult.rows[0].approval_status__c=='Pending'){
        console.log('sddjs');
        response.send('The record cannot be created as the Expense status is PENDING/APPROVED');
      } 
      else{
        let numberOfRows ,lstConveyance = [];
        if(typeof(request.body.from) == 'object')
        {
            numberOfRows = request.body.from.length;
            console.log('number of rows'+numberOfRows)
            for(let i=0; i<numberOfRows ; i++)
            {
              const schema = joi.object({
                
                fromBlank:joi.date().required().label('Please enter From Date'),
                fromdate:joi.date().max('now').label('From Date must be less than or equals to today'),
                toBlank:joi.date().required().label('Please enter To Date'),
                to:joi.date().max('now').label('To date must be less than or equals to today'),
                from:joi.date().max(joi.ref('to')).label('From Date must be less than or equals to To Date'),
                projectTask: joi.string().required().label('Please select Activity Code'),
                purposeoftravel:joi.string().required().label('Please enter Purpose of Travel'),
                purpose:joi.string().min(3).required().label('Please enter Purpose of Travel'),
                purposeof: joi.string().max(255).required().label('Please enter Purpose of Travel, ranging from 1-255 Characters'),
                modeofconveyance: joi.string().required().label('Please enter Mode of Conveyance'),
                mode:joi.string().min(3).required().label('Please enter Mode of Conveyance'),
                modeof: joi.string().max(255).required().label('Please enter Mode of Conveyance, ranging from 1-255 Characters'),
                kmtravelled:joi.number().required().label('Please enter Km. Travelled'),
                km:joi.number().min(0).label('Km. Travelled cannot be negative.'),
                amount:joi.number().required().label('Please enter Amount'), 
                amt:joi.number().min(0).label('Amount cannot be negative.'),
                imgpath:joi.string().invalid('demo').required().label('Please Upload File/Attachment '),
               })
               let result = schema.validate({toBlank:body.to[i] ,fromdate:body.from[i] ,to:body.to[i],fromBlank:body.from[i], from:body.from[i], projectTask: body.projectTask[i], purposeoftravel:body.purposeoftravel[i], purpose:body.purposeoftravel[i], purposeof:body.purposeoftravel[i], modeofconveyance: body.modeofconveyance[i], mode: body.modeofconveyance[i],  modeof: body.modeofconveyance[i], kmtravelled:body.kmtravelled[i], km:body.kmtravelled[i], amount:body.amount[i],amt:body.amount[i],imgpath:body.imgpath[i]});
               console.log('sdjabsdjb'+JSON.stringify(result));
               if(result.error)
               {
                console.log(' VAlidation'+JSON.stringify(result.error));
                response.send(result.error.details[0].context.label);
                return;
               } 
               else{
    
                let conveyanceValues = [];
                conveyanceValues.push(request.body.from[i]);
                conveyanceValues.push(request.body.to[i]);
                conveyanceValues.push(request.body.projectTask[i]);
                conveyanceValues.push(request.body.purposeoftravel[i]);
                conveyanceValues.push(request.body.modeofconveyance[i]);
                conveyanceValues.push(request.body.kmtravelled[i]);
                conveyanceValues.push(request.body.amount[i]);
                conveyanceValues.push(request.body.imgpath[i]);
                conveyanceValues.push(request.body.parentExpenseId[i]);
                lstConveyance.push(conveyanceValues);
               }
            }   
            console.log('lstConveyance   : '+lstConveyance);
        }
        else
        {
              const schema=joi.object({
                
                fromBlank:joi.date().required().label('Please enter From Date'),
                fromdate:joi.date().max('now').label('From Date must be less than or equals to today'),
                toBlank:joi.date().required().label('Please enter To Date'),
                to:joi.date().max('now').label('To date must be less than or equals to today'),
                from:joi.date().max(joi.ref('to')).label('From Date must be less than or equals to To Date'),
                projectTask: joi.string().required().label('Please select Activity Code'),
                purposeoftravel:joi.string().required().label('Please enter Purpose of Travel'),
                purpose:joi.string().min(3).required().label('Please enter Purpose of Travel'),
                purposeof: joi.string().max(255).required().label('Please enter Purpose of Travel, ranging from 1-255 Characters'),
                modeofconveyance: joi.string().required().label('Please enter Mode of Conveyance'),
                mode:joi.string().min(3).required().label('Please enter Mode of Conveyance'),
                modeof: joi.string().max(255).required().label('Please enter Mode of Conveyance, ranging from 1-255 Characters'),
                kmtravelled:joi.number().required().label('Please enter Km. Travelled'),
                km:joi.number().min(0).label('Km. Travelled cannot be negative.'),
                amount:joi.number().required().label('Please enter Amount'), 
                amt:joi.number().min(0).label('Amount cannot be negative.'),
                imgpath:joi.string().invalid('demo').required().label('Please Upload File/Attachment '),
               })
               let result = schema.validate({toBlank:body.to,to:body.to,fromBlank:body.from,fromdate:body.from, from:body.from,projectTask:body.projectTask, purposeoftravel:body.purposeoftravel,purpose:body.purposeoftravel, purposeof:body.purposeoftravel, modeofconveyance:body.modeofconveyance,mode:body.modeofconveyance,modeof:body.modeofconveyance,amount:body.amount,amt:body.amount,kmtravelled:body.kmtravelled,km:body.kmtravelled,imgpath:body.imgpath});
               console.log('sdjabsdjb'+JSON.stringify(result));
               if(result.error)
               {
                console.log(' VAlidation'+JSON.stringify(result.error));
                response.send(result.error.details[0].context.label);
                return;
               } 
               else{
                numberOfRows = 1;
                for(let i=0; i<numberOfRows ; i++)
                {    
                let conveyanceValues = [];
                conveyanceValues.push(request.body.from);
                conveyanceValues.push(request.body.to);
                conveyanceValues.push(request.body.projectTask);
                conveyanceValues.push(request.body.purposeoftravel);
                conveyanceValues.push(request.body.modeofconveyance);
                conveyanceValues.push(request.body.kmtravelled);
                conveyanceValues.push(request.body.amount);
                conveyanceValues.push(request.body.imgpath);
                conveyanceValues.push(request.body.parentExpenseId);
                lstConveyance.push(conveyanceValues);
                
               }
            }   
            console.log('lstConveyance   : '+lstConveyance);
        }
        
        let conveyanceVoucherInsertQuery = format('INSERT INTO salesforce.Conveyance_Voucher__c (From__c, To__c,Activity_Code_Project__c,Purpose_of_Travel__c,Mode_of_Conveyance__c,Kms_Travelled__c,amount__c,heroku_image_url__c,expense__c) VALUES %L returning id', lstConveyance);
        console.log('conveyanceVoucherInsertQuery   '+conveyanceVoucherInsertQuery);
        pool.query(conveyanceVoucherInsertQuery)
        .then((conveyanceQueryResult) => {
            console.log('conveyanceQueryResult :  '+JSON.stringify(conveyanceQueryResult.rows));
            response.send('Conveyance Saved Successfully !');
        })
        .catch((conveyanceQueryError) => {
          console.log('conveyanceQueryError  '+conveyanceQueryError);
          response.send('Error Occured !');
        })


      }
    })
    .catch((error)=>{
      console.log('Error in Expense Validation In Conveyance '+JSON.stringify(error.stack));
    })

});


router.get('/addExpense', (request, response) => {
    response.render('expenseAddEditForm');
});


router.get('/activityCode', verify ,(request, response) => {

  console.log('hello i am inside');

  let objUser = request.user;

  console.log('objUser :' +JSON.stringify(objUser));

  let expenseId = request.query.parentExpenseId;
  
  console.log('parentId :' +expenseId)
  let projectId ;
 
  pool
  .query('SELECT sfid, project_name__c FROM salesforce.Milestone1_Expense__c WHERE sfid != \'null\' AND sfid = $1',[expenseId])
  .then((expenseQueryResult) => {
    console.log('---- 1376 expense.js expenseQueryResult :' +JSON.stringify(expenseQueryResult.rows));
    if(expenseQueryResult.rowCount > 0)
    {
      projectId = expenseQueryResult.rows[0].project_name__c;
      console.log('---- 1380 expense.js Inside ExpenseQuery  : '+projectId);
    
      pool
      .query('Select sfid , Name FROM salesforce.Activity_Code__c where sfid != \'null\' AND Project__c = $1', [projectId])
       .then((activityCodeQueryResult) => {
        console.log('--- 1385 expense.js activityCodeQueryResult  : '+JSON.stringify(activityCodeQueryResult.rows));
        let numberOfRows, lstActivityCode =[];
        if(activityCodeQueryResult.rowCount > 0)
        {
          numberOfRows = activityCodeQueryResult.rows.length;
          for(let i=0; i< numberOfRows ; i++)
          {
            lstActivityCode.push(activityCodeQueryResult.rows[i]);
          }
          response.send(lstActivityCode);
        }
      })
      .catch((activityCodeQueryError) => {
        console.log('---- 1398 activityCodeQueryError  : '+activityCodeQueryError.stack);
        response.send([]);
      })
    }

    

  })
  .catch((expenseQueryError) => {
    console.log('--- 1407 expenseQueryError  : '+expenseQueryError.stack);
})

})




router.post('/sendForApproval',verify, async(request, response) => {
    console.log('hekllo');
    let objUser = request.user;
    let expenseId = request.body.selectedExpenseId;
    let expenseName = request.body.expenseName;
    let totalAmount = request.body.totalAmount;
    let comment = request.body.comment;
    let projectManagerId = '';
    let projectTeamId = '';
    console.log('comment  :  '+comment);
    console.log('expenseId  :  '+expenseId+'  expenseName  : '+expenseName+'  totalAmount : '+totalAmount);

    let approvalStatus = 'Pending';
    const schema=joi.object({
      comment:joi.string().required().label('Please Fill Comment'),
      comm:joi.string().min(3).required().label('Please Fill Comment'),
      totalAmount:joi.number().min(1).required().label('Total Expense Amount should be greater than zero')
      
  })
  let result=schema.validate({comment:comment, comm:comment,totalAmount});
  if(result.error){
      console.log('fd'+result.error);
      response.send(result.error.details[0].context.label);    
  }
  else{    
    let updateExpenseQuery = 'UPDATE salesforce.Milestone1_Expense__c SET '+  
                             'isHerokuEditButtonDisabled__c = true , '+
                             'approval_status__c = \''+approvalStatus+'\' '+
                             'WHERE sfid = $1';
     console.log('updateExpenseQuery :  '+updateExpenseQuery);

    await
    pool.query(updateExpenseQuery,[expenseId])
    .then((expenseUpdateQueryResult) => {
          console.log('expenseUpdateQueryResult  : '+JSON.stringify(expenseUpdateQueryResult));
    })
    .catch((expenseUpdateQueryError) => {
          console.log('expenseUpdateQueryError  : '+expenseUpdateQueryError.stack);
    });
  

      let managerId = '';
      let teamId = '';

              await
              pool.query('SELECT sfid, project_name__c FROM salesforce.Milestone1_Expense__c WHERE  sfid = $1',[expenseId])
              .then((projectQueryResult) => {
                console.log('projectQueryResult :' +JSON.stringify(projectQueryResult.rows));
                if(projectQueryResult.rowCount > 0)
                {
                  projectId = projectQueryResult.rows[0].project_name__c;
                  console.log('Inside projectQuery  : '+projectId);

                  pool
                  .query('SELECT sfid, name, Team__c FROM salesforce.Project_Team__c WHERE Project__c = $1 ',[projectId])
                  .then((projectTeamQueryResult) =>{
                    console.log('projectTeamQueryResult   : '+JSON.stringify(projectTeamQueryResult.rows));
                    if(projectTeamQueryResult.rowCount > 0)
                    {
                      projectTeamId = projectTeamQueryResult.rows[0].sfid;
                      console.log('projectTeamId +++ '+projectTeamId);
                      let projectTeamName = projectTeamQueryResult.rows[0].name;
                      console.log('projectTeamName +++ '+projectTeamName);
                      teamId = projectTeamQueryResult.rows[0].team__c;
                      console.log('teamId +++ '+teamId);

                      pool
                      .query('SELECT sfid,name, Manager__c FROM salesforce.Team__c WHERE sfid = $1',[teamId]) 
                      .then((teamManagerQueryResult) =>{
                      console.log('teamManagerQueryResult   : '+JSON.stringify(teamManagerQueryResult.rows));
                      if(teamManagerQueryResult.rowCount > 0)
                      {
                        managerId = teamManagerQueryResult.rows[0].manager__c;
                        console.log('managerId +++ '+managerId);

                        if(!objUser.isManager)
                        {
                          console.log('Rp user Condition true')
                          pool.query('SELECT sfid, Project_Manager__c FROM salesforce.Milestone1_Project__c WHERE  sfid = $1',[projectId])
                          .then((projectManagerQueryResult) => 
                          {
                          console.log('projectManagerQueryResult :' +JSON.stringify(projectManagerQueryResult.rows));
                            if(projectManagerQueryResult.rowCount > 0)
                              {
                                projectManagerId = projectManagerQueryResult.rows[0].project_manager__c;
                                console.log('Inside projectManagerQueryResult  : '+projectManagerId);
                                pool.query('INSERT INTO salesforce.Custom_Approval__c (Approval_Type__c,Submitter_Heroku__c, Approver_RM__c ,Expense__c, Comment__c, Status__c, Record_Name__c,amount__c) values($1, $2, $3, $4, $5, $6, $7, $8) ',['Expense',objUser.sfid, managerId, expenseId, comment, 'Pending', expenseName, totalAmount ])
                                .then((customApprovalQueryResult) => {
                                       console.log('After Ciustom Approval C querryy ');
                                        console.log('customApprovalQueryResult  '+JSON.stringify(customApprovalQueryResult));
                                })
                            .catch((customApprovalQueryError) => {
                                    console.log('customApprovalQueryError  '+customApprovalQueryError.stack);
                                  })
                             }
                          })
                          .catch((projectQueryError) => {
                                  console.log('projectQueryError  '+projectQueryError.stack);
                                })
                          }
      
                          else
                          {
                            console.log('manager approval true');
                            console.log('projectid Id => '+projectId);
                            pool.query('SELECT sfid, Project_Manager__c FROM salesforce.Milestone1_Project__c WHERE  sfid = $1',[projectId])
                            .then((projectManagerQueryResult)=>{
                              console.log('projectManagerQueryResult '+JSON.stringify(projectManagerQueryResult.rows));
                              if(projectManagerQueryResult.rowCount>0){
                                let projectManagerId = projectManagerQueryResult.rows[0].project_manager__c;
                                
                                pool.query('INSERT INTO salesforce.Custom_Approval__c (Approval_Type__c,Submitter_Heroku__c, Approver_PM__c ,Expense__c, Comment__c, Project_Manager_Approval_Status__c, Record_Name__c,amount__c) values($1, $2, $3, $4, $5, $6, $7, $8) ',['Expense',objUser.sfid, projectManagerId, expenseId, comment, 'Pending', expenseName, totalAmount ])
                                .then((customApprovalQueryResult) => {
                                        console.log('customApprovalQueryResult  '+JSON.stringify(customApprovalQueryResult));
                                })
                                .catch((customApprovalQueryError) => {
                                        console.log('customApprovalQueryError  '+customApprovalQueryError.stack);
                                      })
                              }
                            })
                            .catch((Error)=>{
                              console.log('ProjectManagerWueryyError'+Error.stack);
                            })

                                                      
                          }
                        }
                   
                   })
                  .catch((teamManagerQueryError) => {
                    console.log('teamManagerQueryError  '+teamManagerQueryError.stack);
                  })

                    }
                  })
                    .catch((projectTeamQueryError) => {
                      console.log('projectTeamQueryError  '+projectTeamQueryError.stack);
                    })
      

                }
              })
              .catch((projectQueryError) => {
                console.log('projectQueryError  '+projectQueryError.stack);
              })
            
          

    response.send('Approval Send Succesfully!');
            }
});

var isDisabled = false;
router.get('/pettycashlistview/:expenseId&:isDisabled',verify,(request, response) => {

  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  let expenseId = request.params.expenseId;
  console.log('expenseId  '+expenseId);
  isDisabled = request.params.isDisabled;
    console.log(' ++++ isDisabled ++++ '+isDisabled);

  response.render('./expenses/pettyCash/pettycashlistview',{objUser,isDisabled,expenseId});
})


router.get('/getpettycashlist',verify,(request, response) => {

  let objUser = request.user;
  let expenseId = request.query.expenseId;
  console.log('expenseId  '+expenseId);
  pool
  .query('SELECT sfid, name, bill_no__c, Bill_Date__c,amount__c ,Nature_of_exp__c ,createddate from salesforce.Petty_Cash_Expense__c WHERE expense__c = $1',[expenseId])
  .then((pettyCashQueryResult) => {
        console.log('pettyCashQueryResult  '+JSON.stringify(pettyCashQueryResult.rows));
          if(pettyCashQueryResult.rowCount > 0)
          {
              //response.send(pettyCashQueryResult.rows);

              let modifiedPettyCashList = [],i =1;
              pettyCashQueryResult.rows.forEach((eachRecord) => {
                let obj = {};
                let createdDate = new Date(eachRecord.createddate);
                createdDate.setHours(createdDate.getHours() + 5);
                createdDate.setMinutes(createdDate.getMinutes() + 30);
                let strDate = createdDate.toLocaleString();
                let strBillDate = new Date(eachRecord.bill_date__c).toLocaleString();
                obj.sequence = i;
                obj.name = '<a href="#" class="pettyCashTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
                obj.billNo = eachRecord.bill_no__c;
                obj.natureOfExpense = eachRecord.nature_of_exp__c;
                obj.total=eachRecord.amount__c;
                obj.billDate = strBillDate.split(',')[0];
                obj.createDdate = strDate;
                obj.isDisabled = isDisabled;
                if(isDisabled == 'true')
                {
                    console.log('++Inside if check ++ '+isDisabled);
                obj.deleteAction = '<button href="#" class="btn btn-primary deletePetty" disabled = "true" id="'+eachRecord.sfid+'" >Delete</button>'
              } else{
                console.log('++Inside else check ++ '+isDisabled);
                obj.deleteAction = '<button href="#" class="btn btn-primary deletePetty" id="'+eachRecord.sfid+'" >Delete</button>'
            }
                i= i+1;
                modifiedPettyCashList.push(obj);
              })
              response.send(modifiedPettyCashList);
          }
          else
          {
              response.send([]);
          }
  })
  .catch((pettyCashQueryError) => {
        console.log('pettyCashQueryError  '+pettyCashQueryError.stack);
        response.send([]);
  })

  console.log('objUser  : '+JSON.stringify(objUser));

})



router.get('/getpettycashDetail',verify,(request, response) => {

  let pettyCashId = request.query.pettyCashId;
  console.log('pettyCashId  : '+pettyCashId);
  let queryText = 'SELECT pettycash.sfid, act.name as activityCode, pettycash.description_of_activity_expenses__c, pettycash.amount__c, pettycash.name as pettycashname ,exp.name as expname, pettycash.bill_no__c, pettycash.Bill_Date__c, pettycash.heroku_image_url__c ,pettycash.Nature_of_exp__c ,pettycash.createddate '+
                   'FROM salesforce.Petty_Cash_Expense__c pettycash '+ 
                   'INNER JOIN salesforce.Milestone1_Expense__c exp ON pettycash.Expense__c =  exp.sfid '+
                   'INNER JOIN salesforce.Activity_Code__c act ON pettycash.Activity_Code_Project__c= act.sfid '+
                   'WHERE  pettycash.sfid= $1 ';

  pool
  .query(queryText,[pettyCashId])
  .then((pettyCashQueryResult) => {
        console.log('pettyCashQueryResult  '+JSON.stringify(pettyCashQueryResult.rows));
        if(pettyCashQueryResult.rowCount > 0)
        {
          response.send(pettyCashQueryResult.rows);
        }
        else
        {
          response.send({});
        }
         
  })
  .catch((pettyCashQueryError) => {
        console.log('pettyCashQueryError  '+pettyCashQueryError.stack);
        response.send({});
  })

})
/*****  Anukarsh Conveyance ListView */

router.get('/ConveyanceListView/:expenseId&:isDisabled',verify,(request, response) => {

  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  let expenseId = request.params.expenseId;
  console.log('expenseId  '+expenseId);
  isDisabled = request.params.isDisabled;
  console.log(' ++++ isDisabled ++++ '+isDisabled);
  response.render('./expenses/conveyanceVoucher/ConveyanceListView',{objUser,isDisabled,expenseId});
})

router.get('/getconveyancelist' ,verify,(request,response) => {
  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  let expenseId = request.query.expenseId;
  console.log('expenseId conveyance '+expenseId);
  pool
  .query('SELECT sfid, name, Mode_of_Conveyance__c,Amount__c	, Purpose_of_Travel__c ,createddate from salesforce.Conveyance_Voucher__c WHERE expense__c = $1 AND sfid IS NOT NULL',[expenseId])
  .then((conveyanceQueryResult)=>{
    console.log('conveyanceQueryResult :'+conveyanceQueryResult.rowCount);
    console.log('conveyanceQueryResult :'+JSON.stringify(conveyanceQueryResult.rows));
    if(conveyanceQueryResult.rowCount>0)
    {
      let modifiedConveyanceList = [],i =1;
      
      conveyanceQueryResult.rows.forEach((eachRecord) => {
        let obj = {};
        let createdDate = new Date(eachRecord.createddate);
        createdDate.setHours(createdDate.getHours() + 5);
        createdDate.setMinutes(createdDate.getMinutes() + 30);
        let strDate = createdDate.toLocaleString();
        obj.sequence = i;
        obj.name = '<a href="#" class="conveyanceTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
        obj.TravellingPurpose = eachRecord.purpose_of_travel__c;
        obj.createDdate = strDate;
        obj.BillAmt=eachRecord.amount__c;
        obj.modeOfTravel = eachRecord.mode_of_conveyance__c;
        if(isDisabled == 'true')
        {
            console.log('++Inside if check ++ '+isDisabled);
        obj.deleteAction = '<button href="#" class="btn btn-primary deleteButton" disabled = "true" id="'+eachRecord.sfid+'" >Delete</button>'
      } else{
        console.log('++Inside else check ++ '+isDisabled);
        obj.deleteAction = '<button href="#" class="btn btn-primary deleteButton" id="'+eachRecord.sfid+'" >Delete</button>'
    }
        i= i+1;
        modifiedConveyanceList.push(obj);
      })
      response.send(modifiedConveyanceList);
    }
    else{
      response.send([]);
    }
    
  })
  .catch((conveyanceQueryError)=>{
    console.log('conveyanceQueryError'+conveyanceQueryError.stack);
  })
} )

router.get('/TourBillClaimListView/:expenseId&:isDisabled',verify,(request,response)=>{
  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  let expenseId = request.params.expenseId;
  console.log('expenseId  '+expenseId);
  isDisabled = request.params.isDisabled;
    console.log(' ++++ isDisabled ++++ '+isDisabled);
  response.render('TourBillClaimListView',{objUser,isDisabled,expenseId});
})






router.get('/getConveyanceVoucherDetail',verify,(request, response) => {

  let  conveyanceId= request.query.conveyanceId;
  console.log('conveyanceId  : '+conveyanceId);
  let queryText = 'SELECT conVoucher.sfid, act.name as activityCode, conVoucher.amount__c, conVoucher.From__c, conVoucher.To__c, conVoucher.Kms_Travelled__c, conVoucher.mode_of_conveyance__c,conVoucher.purpose_of_travel__c, conVoucher.name as conveyancename ,exp.name as expname, conVoucher.Heroku_Image_URL__c, conVoucher.createddate '+
                   'FROM salesforce.Conveyance_Voucher__c conVoucher '+ 
                   'INNER JOIN salesforce.Milestone1_Expense__c exp ON conVoucher.expense__c =  exp.sfid '+
                   'INNER JOIN salesforce.Activity_Code__c act ON conVoucher.Activity_Code_Project__c= act.sfid '+
                   'WHERE  conVoucher.sfid= $1 ';

  pool
  .query(queryText,[conveyanceId])
  .then((conveyanceQueryResult) => {
        console.log('conveyanceQueryResult  '+JSON.stringify(conveyanceQueryResult.rows));
        if(conveyanceQueryResult.rowCount > 0)
        {
          response.send(conveyanceQueryResult.rows);
        }
        else
        {
          response.send({});
        }
         
  })
  .catch((conveyanceQueryError) => {
        console.log('conveyanceQueryError  '+conveyanceQueryError.stack);
        response.send({});
  })

})


router.get('/tourBillClaimActivityCode', verify ,(request, response) => {

  console.log('hello i am inside Tour Bill Claim Activity Code');

  let tourbillId = request.query.tourbillId;

  console.log('tourbillId :' +tourbillId)
  isDisabled = request.query.isDisabled;
  console.log(' ++++ isDisabled ++++ '+isDisabled);
  let expenseId;
  let projectId ;

              pool
              .query('SELECT sfid, Expense__c FROM salesforce.Tour_Bill_Claim__c WHERE  sfid = $1',[tourbillId])
              .then((tourBillClaimQueryResult) => {
                console.log('tourBillClaimQueryResult :' +JSON.stringify(tourBillClaimQueryResult.rows));
                expenseId = tourBillClaimQueryResult.rows[0].expense__c;
                if(tourBillClaimQueryResult.rowCount > 0)
                {
                  pool
                  .query('SELECT sfid, project_name__c FROM salesforce.Milestone1_Expense__c WHERE  sfid = $1',[expenseId])
                  .then((expenseQueryResult) => {
                    console.log('expenseQueryResult :' +JSON.stringify(expenseQueryResult.rows));
                    if(expenseQueryResult.rowCount > 0)
                    {
                      projectId = expenseQueryResult.rows[0].project_name__c;
                      console.log('Inside ExpenseQuery  : '+projectId);
                    
                      pool
                      .query('Select sfid ,Name FROM salesforce.Activity_Code__c where sfid != $1 AND Project__c = $2', ['null',projectId])
                      .then((activityCodeQueryResult) => {
                        console.log('activityCodeQueryResult  : '+JSON.stringify(activityCodeQueryResult.rows));
                        let numberOfRows, lstActivityCode =[];
                        if(activityCodeQueryResult.rowCount > 0)
                        {
                          numberOfRows = activityCodeQueryResult.rows.length;
                          for(let i=0; i< numberOfRows ; i++)
                          {
                            lstActivityCode.push(activityCodeQueryResult.rows[i]);
                          }
                          response.send(lstActivityCode);
                        }
                      })
                      .catch((activityCodeQueryError) => {
                        console.log('activityCodeQueryError  : '+activityCodeQueryError.stack);
                        response.send([]);
                      })
                    }
                  })
                  .catch((expenseQueryError) =>
                      {
                    console.log('expenseQueryError  : '+expenseQueryError.stack);
                     })
                    }
                })
         .catch((tourBillClaimQueryError) =>
              {
               console.log('tourBillClaimQueryError  : '+tourBillClaimQueryError.stack);
             })
  })


  router.get('/expenseViewRel/:parentExpenseId&:isDisabled',verify,(request, response) => {
    var parentExpenseId = request.params.parentExpenseId;
    console.log('parentExpenseId  '+parentExpenseId);
  let objUser=request.user;
        console.log('user '+objUser);  
        isDisabled = request.params.isDisabled;
        console.log(' ++++ isDisabled ++++ '+isDisabled);
        response.render('./expenses/expensePageRealted',{objUser,isDisabled,parentExpenseId:parentExpenseId}); 
})

    router.get('/deletepetty/:parentId',(request,response)=>{

      var pettyCashId  = request.params.parentId;
    console.log('pettyCashId Id1111 ='+pettyCashId);

        let deleteQuerry = 'DELETE FROM salesforce.Petty_Cash_Expense__c '+
        'WHERE sfid = $1';
      console.log('deleteQuerry  '+deleteQuerry);
      pool
      .query(deleteQuerry,[pettyCashId])
      .then((deleteQuerry) => {     
      console.log('deleteQuerry =>>'+JSON.stringify(deleteQuerry));
      response.send(200);
      })
      .catch((deleteError) => {
      console.log('deleteError'+deleteError.stack);
      response.send('Error');
      })
    })

    router.get('/deleteConveyance/:parentId',(request,response)=>{

      var conveyanceId  = request.params.parentId;
    console.log('conveyanceId Id1111 ='+conveyanceId);

        let deleteQuerry = 'DELETE FROM salesforce.Conveyance_Voucher__c '+
        'WHERE sfid = $1';
      console.log('deleteQuerry  '+deleteQuerry);
      pool
      .query(deleteQuerry,[conveyanceId])
      .then((deleteQuerry) => {     
      console.log('deleteQuerry =>>'+JSON.stringify(deleteQuerry));
      response.send(200);
      })
      .catch((deleteError) => {
      console.log('deleteError'+deleteError.stack);
      response.send('Error');
      })
    })


module.exports = router;
