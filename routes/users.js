"use strict";
var express = require('express');
const nodemailer = require("nodemailer");
//var router = express.Router();
const Router = require('express-promise-router');
const router = new Router()
const {pool} = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const jwt = require('jsonwebtoken');
const joi = require('@hapi/joi');
const { response } = require('express');
const { Client } = require('pg');
// const {check, validationResult }=require('express-validator');
/*
router.get('/testByAmit',(request,response) =>{
 
  pool.query('INSERT INTO salesforce.Milestone1_Task__c (Name,RecordTypeId,Project_Name__c,Project_Task_Category__c) VALUES($1,$2,$3,$4) RETURNING *',['Test With RKKKK And Amit','0120p000000C8pqAAC','a030p000001low4AAA','Project Initiation'])
  .then((result)=>{
    console.log('result : '+JSON.stringify(result));
    response.send(result);
  })
  .catch((error)=>{
    console.log('error  '+error.stack);
  }) 


  pool.query('DELETE FROM salesforce.custom_approval__c WHERE id = $1',['131'])
  .then((deleteResponseResult) => {
      console.log('deleteResponseResult  : '+JSON.stringify(deleteResponseResult));
      response.send('Deleted Successfully !');
  })
  .catch((deleteResponseError) => {
    console.log('deleteResponseError  : '+deleteResponseError.stack);
     response.send('Error Occured !');
  })
 
 })

 router.get('/testByAmitClient',(request,response) =>{

   const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl:true,
  }
  const client = new Client(dbConfig);
  client.query('select id,sfid, name from salesforce.contact;')
  .then((result)=>{
    console.log('result : '+JSON.stringify(result));
    response.send(result);
  })
  .catch((error)=>{
    console.log('error  '+error.stack);
  })
 
 }) */
 
router.post('/savePldForm',(request, response) => {

  console.log('request.body  : '+JSON.stringify(request.body));
  let contactId = request.body.contactId;
  let projectId = request.body.projectId;
  let pldFormUrl = request.body.pldFormUrl;
  let sentDate = request.body.sentDate;
  let projectName = request.body.projectName;
  let pldFormId = request.body.pldFormId;


  pool.query('insert into pld_forms (contactId,projectId,pldFormUrl,sentDate, projectName,pldFormId) values($1,$2,$3,$4,$5,$6)',[contactId,projectId,pldFormUrl, sentDate,projectName, pldFormId])
  .then((pldQueryResult) => {
        console.log('pldQueryResult  '+JSON.stringify(pldQueryResult));
        response.send(pldQueryResult);
  })
  .catch((pldQueryError) => {
      console.log('pldQueryError  '+JSON.stringify(pldQueryError));
      response.send(pldQueryError);
  })

});


router.get('/getpldForm',verify, (request, response) => {

  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 
  console.log('request.query  : '+JSON.stringify(request.query));
  let contactId = request.query.contactId;

  pool.query('SELECT pld.sfid,pld.project__c, pld.pldform_generatedURL__c, pld.createddate, pld.project_library__c ,pld.name as pldname, pro.name as proname FROM salesforce.sent_pld_form__c as pld INNER JOIN salesforce.Milestone1_Project__c as pro ON pld.project__c = pro.sfid WHERE tocontact__c = $1 AND isactive__c = $2',[userId, true])
  .then((pldQueryResult) => {
        console.log('pldQueryResult  : '+JSON.stringify(pldQueryResult.rows));
        if(pldQueryResult.rowCount>0){

          let modifiedList = [],i =1;
          pldQueryResult.rows.forEach((eachRecord) => {
            let obj = {};
            let crDate = new Date(eachRecord.createddate);
            crDate.setHours(crDate.getHours() + 5);
            crDate.setMinutes(crDate.getMinutes() + 30);
            let strDate = crDate.toLocaleString();
            obj.sequence = i;
            obj.formLink = '<a href="'+eachRecord.pldform_generatedurl__c+'" class="btn btn-primary editVendor" target="_blank" id="'+eachRecord.sfid+'" >Click Here</a>'
            obj.name = eachRecord.proname;
            obj.formName = eachRecord.pldname;
            obj.viewResponses = '<a href="#" class="btn btn-primary vendorTag" id="'+eachRecord.project_library__c+'" >View Responses</a>'

            obj.createdDate = strDate;
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
  .catch((pldQueryError) => {
      console.log('pldQueryError :  '+pldQueryError);
      response.send([]);
  })

});



router.get('/viewResponses',verify ,async(request,response)=>{

 // let pldFormId = request.query.formId;
  let pldFormId=request.query.formId;
  console.log('pldFormId : '+pldFormId );

  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 

  pool
  .query('SELECT psr.sfid, psr.name, psr.createdDate,ca.id, psr.approval_status__c, ca.status__c from salesforce.Project_Survey_Response__c as psr LEFT JOIN salesforce.Custom_Approval__c as ca ON  psr.sfid = ca.expense__c WHERE Project_Library__c = $1 AND Response_By__c = $2',[pldFormId, userId])
  .then((pldResponseQueryResult) => {
    console.log('pldResponseQueryResult  '+JSON.stringify(pldResponseQueryResult.rows));
    if(pldResponseQueryResult.rowCount > 0)
    {
      response.send(pldResponseQueryResult.rows);
    }
    else
    {
      response.send([]);
    }

  })
  .catch((pldResponseQueryError) => {
    console.log('pldResponseQueryError : '+pldResponseQueryError.stack);
    response.send([]);
  });

});

/* GET users listing. */
router.get('/login', function(req, response, next) {
    response.render('login');
});


router.get('/testApi', (request,response)=>{

  pool
  .query('SELECT Id, sfid, name  FROM salesforce.account')
  .then((queryResult) => {
       console.log('loginResult  : '+JSON.stringify(queryResult));  
       response.send(queryResult);
  }) 
  .catch((loginError)=>{
    console.log('loginError   :  '+loginError.stack);
    isUserExist = false;
  })

});

router.post('/login', async (request,response)=>{

//////////////////////////////////////////////////////////////////////////////////////
/*
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();
console.log('MYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',client);
client.query('SELECT id,sfid,name  FROM salesforce.contact;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  client.end();
});

return  */
//////////////////////////////////////////////////////////////////////////////////////



   const {email, password} = request.body;
   console.log('email : '+email+' passoword '+password);

  let errors = [], userId, objUser = {}, isUserExist = false;
  let isActive=true;

   if (!email || !password) {
     errors.push({ msg: 'Please enter all fields' });
     response.render('login',{errors});
    }
   console.log('pool.query : ');
  
    await
    pool
   .query('SELECT Id, sfid,active__c, Name, email, employee_category_band__c, profile_picture_url__c, PM_email__c FROM salesforce.Contact WHERE email = $1 AND password2__c = $2',[email,password])
   .then((loginResult) => {
         console.log('loginResult.rows[0]  '+JSON.stringify(loginResult.rows));
         if(loginResult.rowCount > 0)
         {
          if(loginResult.rows[0].active__c==true){ 
            userId = loginResult.rows[0].sfid;
            objUser = loginResult.rows[0];
            isUserExist = true;
            isActive=true;
          }
          else{
            isActive=false;
          }
         }
         else
         {
           isUserExist = false;
         }      
   }) 
   .catch((loginError) =>{
     console.log('loginError   :  '+loginError.stack);
     isUserExist = false;
   })


   await pool.query('SELECT sfid, Name,reporting_manager__c FROM salesforce.Contact where reporting_manager__c = $1 ',[userId])
   .then(resp=>{
      if(resp.rowCount > 0){
        objUser.isReportingManager = true;
      }
      else{
        objUser.isReportingManager = false;
      }
   })
   .catch(err=>{
    console.log('loginError   :  ',err);
     objUser.isReportingManager = false;
   })


   
  await pool.query('SELECT sfid FROM salesforce.Team__c WHERE Manager__c =  $1 ',[userId])
  .then((teamQueryResult) => {
        if(teamQueryResult.rowCount > 0)
              objUser.isManager = true;
        else
              objUser.isManager = false; 

    console.log('is Manager ++++'+objUser.isManager);
  })
  .catch((teamQueryError) => {

  })

  if(isUserExist && errors.length == 0)
  {
    const token = jwt.sign({ user : objUser }, process.env.TOKEN_SECRET, {
      expiresIn: 8640000 // expires in 24 hours
    });
  
    response.cookie('jwt',token, { httpOnly: false, secure: false, maxAge: 3600000 });
    response.cookie('obj',JSON.stringify(objUser), { httpOnly: false, secure: false, maxAge: 3600000 });
    response.header('auth-token', token).render('dashboard',{objUser});
  }
  else if(!isActive){
    errors.push({ msg: 'User is inactive.Contact your website administrator' });
    response.render('login',{errors});
  }
 
  else
  {
    errors.push({ msg: 'Please enter correct email or correct password' });
    response.render('login',{errors});
  }
    
}) 

router.get('/home',verify, (request, response) => {
    let objUser = request.user;
    response.render('dashboard',{objUser});
})


router.get('/getuser',verify, (request, response) => {

    console.log('request.user '+JSON.stringify(request.user));
    console.log('request.user.id   :  '+request.user.sfid);
    console.log('request.user.name :  '+request.user.name);
    response.send('Hello Amit');

});

router.get('/getContact',verify, (request, response) => {

  console.log('request.user '+JSON.stringify(request.user),request.query);
  pool
  .query('SELECT sfid, Name FROM salesforce.Contact')
  .then((contactQueryResult) => {
    console.log('contactQueryResult  : '+JSON.stringify(contactQueryResult.rows));
      response.send(contactQueryResult.rows);
    
  })
  .catch((contactQueryError) => {
    console.error('Error executing contact query', contactQueryError.stack);
    response.send(403);
});

});


router.get('/getProjectMemeber',verify, (request, response) => {

  console.log('request.user '+JSON.stringify(request.user),request.query);
  let id = request.query.projectId;
  pool
  .query(`SELECT pr.Name as name, pr.sfid as prjsfid , tm.sfid as team__c  FROM salesforce.Team__c tm INNER JOIN  salesforce.Project_Team__c pr on pr.sfid = tm.Project_Team__c where pr.Project__c = '${id}'`)
  .then((contactQueryResult) => {
    console.log('contactQueryResult  : '+JSON.stringify(contactQueryResult.rows));
    let teamList = [];
    contactQueryResult.rows.forEach(dt=>{
        teamList.push(dt.team__c);
    });
    console.log('1',`SELECT Team__c, Representative__c, sfId, Name FROM salesforce.Team_Member__c WHERE Team__c IN ('${teamList.join("','")}') ORDER BY Name`);
    pool.query(`SELECT Team__c, Representative__c, sfId, Name FROM salesforce.Team_Member__c WHERE Team__c IN ('${teamList.join("','")}') ORDER BY Name`)
      .then(data=>{
        console.log('2');
        let conId = [];
        data.rows.forEach(dt=>{
          conId.push( dt.representative__c);
        });
        console.log(conId,`SELECT sfid, Name FROM salesforce.Contact WHERE sfid IN ('${conId.join("','")}') ORDER BY Name`);
        pool.query(`SELECT sfid, Name FROM salesforce.Contact WHERE sfid IN ('${conId.join("','")}') ORDER BY Name`)
        .then(data1=>{
          console.log(data1.rows);
          response.send(data1.rows);
        })
        .catch((contactQueryError) => {
            console.error('Error executing contact query', contactQueryError.stack);
            response.send(403);
        });
        
      })
      .catch((contactQueryError) => {
        console.error('Error executing contact query', contactQueryError.stack);
        response.send(403);
      });
      
    
  })
  .catch((contactQueryError) => {
    console.error('Error executing contact query', contactQueryError.stack);
    response.send(403);
});

});


router.get('/getProjectMemeberReport',verify, async (request, response) => {

  console.log('request.user '+JSON.stringify(request.user),request.query);
  let id = request.query.projectId;
  let userId = request.query.userId;
  let projTeam = [];
  //let finalRows = [];
   await pool.query(`SELECT pr.Name as name, pr.sfid as prjsfid , tm.sfid as team__c  FROM salesforce.Team__c tm INNER JOIN  salesforce.Project_Team__c pr on pr.sfid = tm.Project_Team__c where pr.Project__c = '${id}'`)
  .then( async (contactQueryResult) => {
    console.log('contactQueryResult  : '+JSON.stringify(contactQueryResult.rows));
    let teamList = [];
    contactQueryResult.rows.forEach(dt=>{
        teamList.push(dt.team__c);
    });
    console.log('1',`SELECT Team__c, Representative__c, sfId, Name FROM salesforce.Team_Member__c WHERE Team__c IN ('${teamList.join("','")}') ORDER BY Name`);
     await pool.query(`SELECT Team__c, Representative__c, sfId, Name FROM salesforce.Team_Member__c WHERE Team__c IN ('${teamList.join("','")}') ORDER BY Name`)
      .then(async data=>{
        console.log('2');
        let conId = [];
        data.rows.forEach(dt=>{
          conId.push( dt.representative__c);
        });
        projTeam = conId;
        console.log('inside');
        console.log(conId,`SELECT sfid, Name,reporting_manager__c FROM salesforce.Contact WHERE sfid IN ('${conId.join("','")}') ORDER BY Name`);
         /*await pool.query(`SELECT sfid, Name,reporting_manager__c FROM salesforce.Contact WHERE sfid IN ('${conId.join("','")}') ORDER BY Name` )
            .then( data1=>{

             projTeam = data1.rows;


          //console.log('finalList',finalList,obj);
          //response.send(temp);
        })
        .catch((contactQueryError) => {
            console.error('Error executing contact query', contactQueryError.stack);
            response.send(403);
        });
        */
      })
      .catch((contactQueryError) => {
        console.error('Error executing contact query', contactQueryError.stack);
        response.send(403);
      });
      
    
  })
  .catch((contactQueryError) => {
    console.error('Error executing contact query', contactQueryError.stack);
    response.send(403);
});


//console.log('outside',projTeam);
  await pool.query(`SELECT sfid, Name,reporting_manager__c FROM salesforce.Contact` )
        .then( data1=>{

          let temp = data1.rows;
          
          let w = {};
          temp.forEach((dt,i)=>{
            if( dt.reporting_manager__c && !w[dt.reporting_manager__c]  ){
                //console.log(dt,i)
                w[dt.reporting_manager__c] = [dt]
            }
              else if(dt.reporting_manager__c) {
                   //console.log(dt,i)
                  w[dt.reporting_manager__c].push(dt)
              }
              
          })

          let users = w[userId]  ? w[userId] : [];

          let kt = []

          function addData(dt){

                dt.forEach(d=>{
                   // console.log(d)
                    
                    kt.push(d)
                   // console.log(kt)
                    if(w[d.sfid]){
                        addData(w[d.sfid])
                    }
                })
          }

          users.forEach(dt=>{
              kt .push(dt)
              //console.log(dt)
              if(w[dt.sfid])
               addData(w[dt.sfid])
              
          })

          //console.log('w',kt,JSON.stringify(w));

          let projData = []
          temp.forEach(dt=>{
            if(projTeam.includes(dt.sfid)){
              projData.push(dt);
            }
          });
          let finalList = kt.concat(projData);

          let distinctData = {};

          finalList.forEach(dt=>{

            distinctData[dt.sfid] = dt;
          })
          
          console.log(finalList,JSON.stringify(distinctData));



          response.send(Object.values(distinctData));


             
        })
        .catch((contactQueryError) => {
            console.error('Error executing contact query', contactQueryError.stack);
            response.send(403);
        });

});


/*
console.log('kttt',kt)
          const unique = [...new Set(finalList.map(item => item.sfid))];
          let obj = [];
          unique.forEach(dt=>{
            obj.push({sfid:dt});
          });

console.log('obj',obj)
          finalList.forEach(dt=>{
            let str = dt.sfid;
            obj.forEach((d,i)=>{
              if(d.sfid === str){
                 d.name = dt.name; 
              }

            })

          })
          

*/





router.get('/timesheet',verify, function(request,response){ 

  console.log('request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid;
  let objusername = request.user.name;
  let objUser = request.user;
  console.log('userId : '+userId);
  console.log('is manager objUser '+objUser);
//  response.render('timesheetcalendar');

   var projectName ='';
    pool
    //.query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',[userId])
   .query('SELECT sfid, Name FROM salesforce.Contact')
    .then(contactResult => {
      console.log('Name of Contact  ::     '+contactResult.rows[0].name+' sfid'+contactResult.rows[0].sfid);
      var contactId = contactResult.rows[0].sfid;
      let isReportingManager = false;
        pool
        .query('SELECT sfid, name, Team__c FROM salesforce.Team_Member__c')
        .then(teamMemberResult => {
          console.log('team '+JSON.stringify(teamMemberResult.rows));
          if(teamMemberResult.rowCount>0){
            console.log('Name of TeamMemberId   : '+teamMemberResult.rows[0].name+'   sfid :'+teamMemberResult.rows[0].sfid);
            console.log('Team Id  : '+teamMemberResult.rows[0].team__c);
            console.log('Number of Team Member '+teamMemberResult.rows.length);
          }
        
          
          var projectTeamparams = [], lstTeamId = [];
          for(var i = 1; i <= teamMemberResult.rows.length; i++) {
            projectTeamparams.push('$' + i);
            lstTeamId.push(teamMemberResult.rows[i-1].team__c);
          } 
          var projectTeamQueryText = 'SELECT  pr.sfid , pr.Project__c as project__c  FROM salesforce.Team__c tm INNER JOIN  salesforce.Project_Team__c pr on pr.sfid = tm.Project_Team__c WHERE tm.sfId IN (' + projectTeamparams.join(',') + ') ORDER BY pr.Name';
          console.log('projectTeamQueryText '+projectTeamQueryText);
          
            pool
            .query(projectTeamQueryText,lstTeamId)
            .then((projectTeamResult) => {
                console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
                //console.log('projectTeam Name '+projectTeamResult.rows[0].name);
  
                var projectParams = [], lstProjectId = [];
                for(var i = 1; i <= projectTeamResult.rows.length; i++) {
                  projectParams.push('$' + i);
                  lstProjectId.push(projectTeamResult.rows[i-1].project__c);
                } 
                console.log('lstProjectId  : '+lstProjectId);
               // var projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';
               var projetQueryText='SELECT sfid,Project_Manager__c, Name FROM salesforce.Milestone1_Project__c';
               console.log('project query from user '+projetQueryText);
                pool.
                query(projetQueryText)
                .then(async (projectQueryResult) => { 
                      console.log('Number of Projects '+projectQueryResult.rows.length);
                      console.log('Project sfid '+projectQueryResult.rows[0].sfid+ 'Project Name '+projectQueryResult.rows[0].name +' MAnager '+projectQueryResult.rows[0].project_manager__c);
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

                      var Accounts = ['Bills checking & tracking.','Voucher posting in Tally & related activities.','Claims/bills processing for payments.','Preparation of utilization report and discussion with Project Managers.','Project audit with Donor auditors','Determining statutory due & its payments','Statutory returns and related activities.','Invoicing through GST portal','Bank correspondences & preparation of reconciliation.','Procurement related activities','Financial statement related activities.','FCRA related compliances','MIS & other activities as required by the management.','Review of Grants agreements & budget approval','Other Accounts related activities'];
                      var Compliance = ['Process audit as per audit calendar','Internal Audit of LLF financials','Procurement Process deliberations and approvals','Quality process','Others [EQFI. Wizfinity, Misc.]'];
                      var Content = ['Research','MarComm - Digital/Social Media','Marketing Collaterals/Branding','Communications - LLF','Communications - External','Content Creation','Content Review','Editing and Proofreading','Formatting and Design'];
                      var HR = ['Payroll Process','Joining Process','Exit Process','Handling Employee Grievances','Full & Final Settlements','Prepare and deposition of the statutory liabilities such as PF, ESI, PT & LW','Prepare and submit quarterly, half yearly and annual returns','Calculate TDS deductions based on tax laws','Attendance Management','Manage employees investment declarations, Payroll reimbursements, etc','Sourcing / Job posting / database searches','​Documentation/Closures/Filings','HR Internal / HR – IT/HRMS','MIS & other activities required by the management.','Project audit / Internal  Audit Work','Project Hiring - Collecting CVs & Shortlisting Candidates','Project Hiring - Evaluation/Interview of Candidates','Project Hiring - Finalization of Candidates','Internal Hiring - Collecting CVs & Shortlisting Candidates','Internal Hiring - Evaluation/Interview of Candidates','Internal Hiring - Finalization of Candidates','Doing Appraisals'];
                      var IT_Support = ['Meeting - Vendor','Meeting - Internal','Resolving hardware & software issues','Implementation - R&D','Server administration','Asset inventory management','Setting up & maintenance of hardware & software','Hardware & software procurement research','Other misc. work related to IT support'];
                      var Learning_Development = ['Attended Training/Orientation  - Org Conducted','Attended Training/Orientation - Self Managed','Analysis - Conduct Training - Need Analysis','Design - Conduct Training - Training Plan','Design - Conduct Training - Dry Run','Development - Develop Training Content','Implementation - Imparted Training - External Stakeholders','Implementation - Imparted Training - External Project Delivery Purpose','Implementation - Imparted Training - Internal LLF Purpose','Evaluate - Post Training Session Feedback Analysis & Improvement Planning','Evaluate - Post Training Follow Up & Review','Evaluate - Prepare Training Report','Prepare Training Plans','Prepare Periodic Reports','Create Learning Development Plans','Project - Attending Events/Conferences/Forums','Internal - Attending Events/Conferences/Forums','Professional Development - improving own teaching practices'];
                      var Operations = ['Expenses reviewing & approving bills  Teams','Procurement  Raising request & follow up','Procurement  reviewing & approving  Teams'];
                      var Project = ['Team Meetings/Progress Review Meetings','Travel Time  - field visits/meetings/etc','Facilitation - Field Visit - Interaction with Officials','Facilitation - Online/Telephonic - project team members','Facilitation - Physical Meeting - project team members','Facilitation -  Online/Telephonic - External stakeholders','Facilitation -  Physical Meeting - External stakeholders','Data Analysis','Report-Making/Presentations','Monitoring & Evaluation - Strategic Thinking','Conduct Events/Conferences/Forums'];
                      var Self_Management = ['Miscellaneous Personal official work - IT Support, HR, Flexiele, etc.','Raising Expenses/Invoices, Travel requests for Self','Filling Timesheets - Reflecting & Planning Personal Time for official work'];
                      var Internal  = ['Internal - Team Meetings/Progress Review Meetings','Internal - Travel Time - field visits/meetings/etc','Internal - Faciliation - Field Visit - Interaction with Officials','Internal - Facilitation - Physical Meeting - External Stakeholders','Internal - Faciliation - Field Visit - Engagement with Beneficiaries','Internal - Facilitation - Online/Telephonic - Non project team members','Internal - Facilitation - Physical Meeting - Non project team members','Internal - Facilitation- Online/Telephonic - External stakeholders','Internal - Facilitation- Online/Telephonic - Beneficiaries','Internal - Data Analysis','Internal - Report-Making/Presentations ','Internal - Monitoring & Evaluation - Strategic Thinking','Internal - Conduct Events/Conferences/Forums','Existing Donor Expansions','New Donor acquisition','Advisory/Board meetings'];
                      var Beneficiary = ['Project - Online - Web/Telephonic','Project - Field Visit/Physical Presence','Internal - Online - Web/Telephonic','Internal - Field Visit/Physical Presence'];                  
                      var taskType  = {Beneficiary:Beneficiary,Self_Management:Self_Management,Internal:Internal,Project:Project,Operations : Operations,Learning_Development :Learning_Development, IT_Support:IT_Support,Accounts : Accounts,Compliance : Compliance,Content : Content,HR : HR,}

                    //  var milestoneQueryText = 'SELECT Id,Name FROM salesforce.Milestone1_Milestone__c WHERE Project__c IN ('+projectParams.join(',')+') AND Name = ;
                    //  pool.query
  
                  /*  var taskQueryText = 'SELECT task.sfid, task.Name, task.Project_Milestone__c, mile.sfid FROM salesforce.Milestone1_Task__c task, Salesforce.Milestone1_Milestone__c mile '
                    + 'WHERE '
                    + 'task.Project_Name__c IN ('+projectParams.join(',')+ ') ' 
                    + 'AND task.Project_Milestone__c = mile.sfid '
                    + 'AND mile.Name = \'Timesheet Category\'';  */
  
                    var taskQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Task__c  WHERE Project_Name__c IN ('+projectParams.join(',')+') AND  Project_Milestone__c IN (SELECT sfid FROM salesforce.Milestone1_Milestone__c WHERE Name = \'Timesheet Category\') AND sfid IS NOT NULL';
                    console.log('taskQueryText  : '+taskQueryText);
                    
                    let qry = `SELECT sfid,Name FROM salesforce.contact WHERE Reporting_Manager__c = '${objUser.sfid}'`;
                   
                   console.log('run',qry)
                    await pool
                      .query(qry)
                      .then(data=>{
                        console.log('run1',data.rows);
                          if(data.rowCount > 0){
                            isReportingManager = true
                          }
                          console.log('run2',isReportingManager);
                          
                      })
                      .catch(err=>{
                        console.log('runERROR',isReportingManager);
                        response.send(403);
                      })
    console.log('run23',isReportingManager);
  
                      pool
                      .query(taskQueryText, lstProjectId)
                      .then((taskQueryResult) => {
                          console.log('taskQueryResult  rows '+taskQueryResult.rows.length);
                          
                          response.render('./timesheets/timesheetcalendar',{taskType:taskType,objUser, objname : objusername, objUserId : userId, projectList : projectQueryResult.rows, contactList : contactResult.rows, taskList : taskQueryResult.rows,isReportingManager:isReportingManager }); // render calendar
                      })
                      .catch((taskQueryError) => {
                          console.log('taskQueryError : '+taskQueryError.stack);
                          response.send(403);
                      })
                      
                })
                .catch((projectQueryError) => {
                      console.log('projectQueryError '+projectQueryError.stack);
                      //response.send(403);
                      response.render('./timesheets/timesheetcalendar',{taskType:{},objUser, projectList : [], contactList : [], taskList : [],isReportingManager:false }); // render calendar
                })
             
            })
              .catch((projectTeamQueryError) =>{
                console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
               // response.send(403);
               response.render('./timesheets/timesheetcalendar',{taskType:{},objUser, projectList : [], contactList : [], taskList : [] ,isReportingManager:false}); 
              })          
           })

          .catch((teamMemberQueryError) => {
            console.log('Error in team member query '+teamMemberQueryError.stack);
            //response.send(403);
            response.render('./timesheets/timesheetcalendar',{taskType:{},objUser, projectList : [], contactList : [], taskList : [] ,isReportingManager:false}); 
          })
  
        }) 
        .catch((contactQueryError) => {
            console.error('Error executing contact query', contactQueryError.stack);
            response.send(403);
        });
 
});


router.get('/geteventsTeam', verify, async function(req, res, next) {
  console.log('request.user ' + JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : ' + userId + ' ObjUser :' + JSON.stringify(req.user));

  var projTeampram = [],
    lstProjTeam = [];
  var taskparam = [],
    lsttask = [];
  var lstTeams = [];
  var teamParam = [];
  let teamMember = [];
  let teamMemberParam = [];
  teamMemberParam.push('$' + 1);
  teamMember.push(userId);

  console.log('req.query :' + req.query.date);
  var strdate = req.query.date;
  console.log('typeof date ' + typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : ' + selectedDate);
  console.log('typeof(selectedDate)   : ' + typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month ' + selectedDate.getMonth());
  console.log('Year : ' + selectedDate.getFullYear());
  var numberOfDays = new Date(year, month + 1, 0).getDate();
  console.log('numberOfDays : ' + numberOfDays);
  let plannedHoursMap = new Map();
  let actualHoursMap = new Map();
  let projectTeamMap = new Map();
  let teamProjId = [];


  function convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }

  let projectTeamQuery =  'SELECT   tm.sfid as team__c , pr.project__c as project__c  FROM salesforce.Team__c tm INNER JOIN  salesforce.Project_Team__c pr on pr.sfid = tm.Project_Team__c WHERE pr.Project__c IS NOT NULL'  ;// 'SELECT id,name,sfid,Project__c,Team__c FROM salesforce.Project_Team__c WHERE Project__c IS NOT NULL';
  console.log('All project Team ' + projectTeamQuery);
  pool.query(projectTeamQuery)
    .then((projTeamResult) => {
      if (projTeamResult.rowCount > 0) {
        projTeampram.push('$' + 1);
        lstProjTeam.push(userId);
        for (var i = 2; i <= projTeamResult.rows.length + 1; i++) {
          projTeampram.push('$' + i);
          lstProjTeam.push(projTeamResult.rows[i - 2].team__c);
          projectTeamMap.set(projTeamResult.rows[i - 2].team__c, projTeamResult.rows[i - 2].project__c);
        }
        let teamQry = 'SELECT Id, sfid , Manager__c, name FROM salesforce.Team__c WHERE Manager__c = $1 AND sfid IN (' + projTeampram.join(',') + ')';
        console.log('teamQry ' + teamQry);
        pool.query(teamQry, lstProjTeam)
          .then((teamQueryResult) => {
            if (teamQueryResult.rowCount > 0) {
              console.log('teamQueryResult team ' + JSON.stringify(teamQueryResult.rows));

              for (var i = 1; i <= teamQueryResult.rows.length; i++) {
                teamParam.push('$' + i);
                lstTeams.push(teamQueryResult.rows[i - 1].sfid);
                var teamid = teamQueryResult.rows[i - 1].sfid;
                //console.log(teamid+'  88888888888888*********************'+projectTeamMap.has(teamid));
                if (projectTeamMap.has(teamid)) {
                  //  console.log('taemfek '+teamQueryResult.rows[i-1].sfid);
                  teamProjId.push(projectTeamMap.get(teamQueryResult.rows[i - 1].sfid));
                  console.log('event project ' + projectTeamMap.get(teamQueryResult.rows[i - 1].sfid));
                }
              }

              console.log(' lstTeams ' + lstTeams + ' teamParam ' + teamParam + 'teamProjId ' + teamProjId);
              let teamUserQuery = 'SELECT Id, sfid,Representative__c , team__c FROM salesforce.Team_Member__c WHERE team__c IN (' + teamParam.join(',') + ')';
              console.log('teamUserQuery ' + teamUserQuery);
              pool.query(teamUserQuery, lstTeams)
                .then((userTeamQueryResult) => {
                  console.log('userTeamQueryResult ' + JSON.stringify(userTeamQueryResult.rows));
                  for (var i = 2; i <= userTeamQueryResult.rows.length + 1; i++) {
                    teamMemberParam.push('$' + i);
                    teamMember.push(userTeamQueryResult.rows[i - 2].representative__c);
                  }
                  console.log('Team Member involne in Team ' + teamMember + 'dollers ' + teamMemberParam);
                  let qry = 'SELECT Id, sfid , Planned_Hours__c,Project_Name__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE sfid IS NOT NULL AND Assigned_Manager__c IN (' + teamMemberParam.join(',') + ')';
                  console.log('qry xxxxxxxxxxx' + qry);
                  pool.query(qry, teamMember)
                    .then((taskQueryResult) => {
                      console.log('taskQueryResult ' + taskQueryResult.rowCount);
                      console.log('teamProjId ' + teamProjId.length);
                      /*  for(var i = 1; i <= taskQueryResult.rowCount; i++) {
                         taskparam.push('$' + i);
                         lsttask.push(taskQueryResult.rows[i-1].sfid);
                         } */
                      if (taskQueryResult.rowCount > 0) {
                        taskQueryResult.rows.forEach((eachTask) => {
                          // console.log('foreachTAsk '+JSON.stringify(eachTask));
                          // teamProjId.forEach((eachProject)=>{
                          for (var i = 1; i <= teamProjId.length; i++) {
                            console.log('each prject inside if ' + teamProjId[i - 1])

                            //console.log('eachProject '+eachProject);
                            if (eachTask.project_name__c == teamProjId[i - 1]) {
                              console.log('eachProject ' + teamProjId[i - 1]);
                              lsttask.push(eachTask.sfid);

                              var date = convert(eachTask.start_date__c);
                              console.log('date xxx  ' + date + '  eachTask.planned_hours__c  xxxxx : ' + eachTask.planned_hours__c);

                              console.log('plannedHoursMap.has(date)  xxx' + plannedHoursMap.has(date));
                              console.log('Opposite plannedHoursMap.has(date)  xxx' + (!plannedHoursMap.has(date)));
                              if (!plannedHoursMap.has(date)) {
                                plannedHoursMap.set(date, eachTask.planned_hours__c);
                                console.log('if Block ' + eachTask.planned_hours__c);
                                if (eachTask.planned_hours__c != null)
                                  plannedHoursMap.set(date, eachTask.planned_hours__c);
                                else
                                  plannedHoursMap.set(date, 0);
                              } else {

                                let previousHours = plannedHoursMap.get(date);
                                console.log('date   ' + date + '  else Block Previous Hours : ' + previousHours);
                                let currentHours = eachTask.planned_hours__c;
                                console.log('date   ' + date + '  else Block Current Hours : ' + currentHours);
                                if (currentHours != null) {
                                  console.log('date  xx' + date + 'previousHours + currentHours  ' + (previousHours + currentHours));
                                  plannedHoursMap.set(date, previousHours + currentHours);
                                }
                              }
                            }
                          }

                        })
                        for (var i = 1; i <= lsttask.length; i++) {
                          taskparam.push('$' + i);
                        }
                        let timeQuery = 'SELECT sfid, date__c, calculated_hours__c, project_task__c  FROM salesforce.Milestone1_Time__c WHERE project_task__c IN (' + taskparam.join(',') + ')' + ' AND sfid != \'' + '' + '\'';
                        console.log('tiemquery ' + timeQuery);
                        console.log('lsttask ' + lsttask);
                        pool.query(timeQuery, lsttask)
                          .then((timesheetQueryResult) => {
                            console.log('timesheetQueryResult  ' + JSON.stringify(timesheetQueryResult.rows));
                            console.log('timesheetQueryResult.rowCount ' + timesheetQueryResult.rowCount);
                            if (timesheetQueryResult.rowCount > 0) {


                              timesheetQueryResult.rows.forEach((eachTimesheet) => {

                                let fillingDate = convert(eachTimesheet.date__c);
                                console.log('fillingDate TeamView ' + fillingDate);

                                if (!actualHoursMap.has(fillingDate)) {
                                  if (eachTimesheet.calculated_hours__c != null)
                                    actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
                                  else
                                    actualHoursMap.set(fillingDate, 0);
                                } else {
                                  let previousFilledHours = actualHoursMap.get(fillingDate);
                                  let currentFilledHours = eachTimesheet.calculated_hours__c;
                                  if (currentFilledHours != null) {
                                    actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
                                  } else
                                    actualHoursMap.set(fillingDate, (previousFilledHours + 0));
                                }

                                for (let time of actualHoursMap) {
                                  console.log('time  : ' + time);
                                }

                              })
                              var lstEvents = [];
                              for (let i = 1; i <= numberOfDays; i++) {
                                let day = i,
                                  twoDigitMonth = month + 1;
                                if (day >= 1 && day <= 9) {
                                  day = '0' + i;
                                }
                                if (twoDigitMonth >= 1 && twoDigitMonth <= 9) {
                                  twoDigitMonth = '0' + twoDigitMonth;
                                }

                                var date = year + '-' + twoDigitMonth + '-' + day;
                                // console.log('date inside events '+date);
                                //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
                                if (plannedHoursMap.has(date)) {
                                  console.log('plannedHoursMap.get(date)  : ' + plannedHoursMap.get(date));
                                  lstEvents.push({
                                    title: 'Planned Hours : ' + (plannedHoursMap.get(date)).toFixed(2),
                                    start: year + '-' + twoDigitMonth + '-' + day,
                                  });

                                } else {
                                  lstEvents.push({
                                    title: 'Planned Hours : ' + '0',
                                    start: year + '-' + twoDigitMonth + '-' + day,
                                  });
                                }


                                if (actualHoursMap.has(date)) {
                                  lstEvents.push({
                                    title: 'Actual Hours : ' + actualHoursMap.get(date),
                                    start: year + '-' + twoDigitMonth + '-' + day,
                                  });
                                } else {
                                  lstEvents.push({
                                    title: 'Actual Hours : ' + '0',
                                    start: year + '-' + twoDigitMonth + '-' + day,
                                  });
                                }

                                lstEvents.push({
                                  title: 'Create Task',
                                  start: year + '-' + twoDigitMonth + '-' + day,
                                });
                                /*lstEvents.push({
                                  title : 'Details',
                                  start : year+'-'+twoDigitMonth+'-'+day,   
                                });
                                */
                                lstEvents.push({
                                  title: 'Fill Actuals',
                                  start: year + '-' + twoDigitMonth + '-' + day,
                                });

                              }
                              console.log('JSON.strigify teamView' + JSON.stringify(lstEvents));
                              res.send(lstEvents);
                            }


                          })
                          .catch((timesheetQueryError) => {
                            console.log('timesheetQueryError  ' + timesheetQueryError.stack);
                          })
                        /********************************************
                       taskQueryResult.rows.forEach((eachTask) =>{
                           var date = convert(eachTask.start_date__c);
                           console.log('date xxx  '+date+'  eachTask.planned_hours__c  xxxxx : '+eachTask.planned_hours__c);
                          
                           console.log('plannedHoursMap.has(date)  xxx'+plannedHoursMap.has(date));
                           console.log('Opposite plannedHoursMap.has(date)  xxx'+(!plannedHoursMap.has(date)));
                           if( !plannedHoursMap.has(date))
                           {
                             plannedHoursMap.set(date, eachTask.planned_hours__c);
                             console.log('if Block '+eachTask.planned_hours__c);
                             if(eachTask.planned_hours__c != null)
                               plannedHoursMap.set(date, eachTask.planned_hours__c);
                             else
                               plannedHoursMap.set(date, 0);
                           }
                           else
                           {
                               
                               let previousHours = plannedHoursMap.get(date);
                               console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                               let currentHours = eachTask.planned_hours__c;
                               console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                               if(currentHours != null)
                               {
                                 console.log('date  xx'+date +'previousHours + currentHours  '+(previousHours + currentHours));
                                 plannedHoursMap.set(date, previousHours + currentHours );
                               }
                           }
                       })
         
                       let mapIter = plannedHoursMap.entries();
                       console.log('plannedHoursMap    size '+plannedHoursMap.size);
                       
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
         
                       for (let key of plannedHoursMap.keys()) {
                        console.log('key :'+key)
                       }
         
                       for(let value of plannedHoursMap.values()){
                         console.log('values : '+value);
                       }
                       *****************************************/
                      }
                      //  let timesheetqry='SELECT sfid, date__c,representative__c, calculated_hours__c FROM salesforce.Milestone1_Time__c WHERE representative__c IN ('+ teamMemberParam.join(',')+ ')'+' AND sfid != \''+''+'\'';

                    })


                    .catch((taskQueryError) => {
                      console.log('taskQueryError  xxxx :  ' + taskQueryError.stack);
                    })


                })
                .catch((error) => {
                  console.log('eroor in Team USer ID ' + error.stack);
                })
            }
          })
          .catch((teamQueryError) => {
            console.log('teamQueryResult ' + teamQueryError.stack);
          })
      }
    })
    .catch((error) => {
      console.log('eroro in PRojectTEam ' + JSON.stringify(error.stack));

    })

  console.log('Just above Team View')

});


 

router.get('/geteventsProjteam',verify,async function(req,res,next) {
  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId+' ObjUser :'+JSON.stringify(req.user));
  var projId=req.query.projectid;
  console.log('projId '+projId);

  var projTeampram = [],
    lstProjTeam = [];
  var taskparam = [],
    lsttask = [];
  var lstTeams = [];
  var teamParam = [];
  let teamMember = [];
  let twoDigitMonth;
  let teamMemberParam = [];
  teamMemberParam.push('$' + 1);
  teamMember.push(userId);
  var lstProject = [];
  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  let actualHoursMap = new Map();

  function convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }

let projSet = new Set();
  let tskMap = {};
  let projectTeamQuery = 'SELECT projteam.id,projteam.name,projteam.sfid as sfid,projteam.Project__c,team.sfid as tsfid, team.Manager__c ' +
    'FROM  salesforce.Team__c team  ' +
    'INNER JOIN salesforce.Project_Team__c projteam  ON projteam.sfid =  team.Project_Team__c ' +
    'WHERE projteam.Project__c IS NOT NULL  AND team.Manager__c = $1 ';
  console.log('All project Team ' + projectTeamQuery);
  pool.query(projectTeamQuery, [userId])
    .then((projTeamResult) => {
      console.log('projectsssds' + JSON.stringify(projTeamResult.rows));
      if (projTeamResult.rowCount > 0) {
        //  projTeampram.push('$' + 1);
        // lstProjTeam.push(userId);
        for (var i = 1; i <= projTeamResult.rows.length; i++) {
          projTeampram.push('$' + i);
          lstProjTeam.push(projTeamResult.rows[i - 1].tsfid);
          //lstProject.push(projTeamResult.rows[i - 1].project__c)
          projSet.add(projTeamResult.rows[i - 1].project__c)
          //  projectTeamMap.set(projTeamResult.rows[i-2].team__c,projTeamResult.rows[i-2].project__c);
        }
        lstProject = [...projSet]
        let teamUserQuery = 'SELECT Representative__c FROM salesforce.Team_Member__c WHERE team__c IN (' + projTeampram.join(',') + ')';
        console.log('teamUserQuery ' + teamUserQuery);
        pool.query(teamUserQuery, lstProjTeam)
          .then((memberQueryresult) => {
            console.log('memberQueryresult ' + memberQueryresult.rowCount + ' ' + JSON.stringify(memberQueryresult.rows));

            for (var i = 2; i <= memberQueryresult.rows.length + 1; i++) {
              teamMemberParam.push('$' + i);
              teamMember.push(memberQueryresult.rows[i - 2].representative__c);
            }
            console.log('Team Member involne in Team ' + teamMember + 'dollers ' + teamMemberParam);
            console.log('project list ' + lstProject.length + ' gh  ' + lstProject);
            let qry = 'SELECT Id, sfid , Planned_Hours__c,Project_Name__c,task_assigned_by__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE sfid IS NOT NULL ' + `  AND Project_Name__c = '${projId}' `;
            console.log('taskQuery ' + qry);
            let lstSet = new Set()
            pool.query(qry)
              .then((taskQueryResult) => {

                taskQueryResult.rows.forEach(dt=>{
                  tskMap[dt.sfid] = dt;
                })


                let temp1 = [];
                  console.log('data=>>>>',JSON.stringify(tskMap))
                  for(let key in tskMap){
                    let tempObj = tskMap[key];
                    console.log('tempObj',tempObj);
                    if(lstProject.includes(tempObj.project_name__c) || tempObj.task_assigned_by__c == userId ){
                          temp1.push(tempObj)
                    }

                  }

                console.log('taskQueryResult Count' + taskQueryResult.rowCount);
                //if (taskQueryResult.rowCount > 0) {
                  temp1.forEach((eachTask) => {
                    for (var i = 1; i <= lstProject.length; i++) {
                      console.log('each prject inside if ' + lstProject[i - 1]);
                     // if (eachTask.project_name__c == lstProject[i - 1]) {
                        console.log('eachProject ' + lstProject[i - 1]);
                        //lsttask.push(eachTask.sfid); //filter task ID for Timesheet Actual Hours
                        lstSet.add(eachTask.sfid)
                        var date = convert(eachTask.start_date__c);
                        console.log('date xxx  ' + date + '  eachTask.planned_hours__c  xxxxx : ' + eachTask.planned_hours__c);

                        console.log('plannedHoursMap.has(date)  xxx' + plannedHoursMap.has(date));
                        console.log('Opposite plannedHoursMap.has(date)  xxx' + (!plannedHoursMap.has(date)));
                        if (!plannedHoursMap.has(date)) {
                          plannedHoursMap.set(date, eachTask.planned_hours__c);
                          console.log('if Block ' + eachTask.planned_hours__c);
                          if (eachTask.planned_hours__c != null)
                            plannedHoursMap.set(date, eachTask.planned_hours__c);
                          else
                            plannedHoursMap.set(date, 0);
                        } else {

                          let previousHours = plannedHoursMap.get(date);
                          console.log('date   ' + date + '  else Block Previous Hours : ' + previousHours);
                          let currentHours = eachTask.planned_hours__c;
                          console.log('date   ' + date + '  else Block Current Hours : ' + currentHours);
                          if (currentHours != null) {
                            console.log('date  xx' + date + 'previousHours + currentHours  ' + (previousHours + currentHours));
                            plannedHoursMap.set(date, previousHours + currentHours);
                          }
                        }

                      //}

                    }
                  })

                   lsttask = [...lstSet]
                  for (var i = 1; i <= lsttask.length; i++) {
                    taskparam.push('$' + i);

                  }
                  console.log('task  param' + taskparam);
                  console.log('task  param' + taskparam);
                  let timeQuery = 'SELECT sfid, date__c, calculated_hours__c, project_task__c  FROM salesforce.Milestone1_Time__c WHERE project_task__c IN (' + taskparam.join(',') + ')' + ' AND sfid != \'' + '' + '\'';
                  console.log('tiemquery ' + timeQuery);
                  pool.query(timeQuery, lsttask)
                    .then((timesheetQueryResult) => {
                      console.log('timesheetQueryResult ' + timesheetQueryResult.rowCount);
                      //if (timesheetQueryResult.rowCount > 0) {
                        timesheetQueryResult.rows.forEach((eachTimesheet) => {
                          let fillingDate = convert(eachTimesheet.date__c);
                          console.log('fillingDate TeamView ' + fillingDate);
                          if (!actualHoursMap.has(fillingDate)) {
                            if (eachTimesheet.calculated_hours__c != null)
                              actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
                            else
                              actualHoursMap.set(fillingDate, 0);
                          } else {
                            let previousFilledHours = actualHoursMap.get(fillingDate);
                            let currentFilledHours = eachTimesheet.calculated_hours__c;
                            if (currentFilledHours != null) {
                              actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
                            } else
                              actualHoursMap.set(fillingDate, (previousFilledHours + 0));
                          }

                          for (let time of actualHoursMap) {
                            console.log('time  : ' + time);
                          }
                        })

                        var lstEvents = [];
                        for (let i = 1; i <= numberOfDays; i++) {
                          let day = i;
                          twoDigitMonth = month + 1;
                          if (day >= 1 && day <= 9) {
                            day = '0' + i;
                          }
                          if (twoDigitMonth >= 1 && twoDigitMonth <= 9) {
                            twoDigitMonth = '0' + twoDigitMonth;
                          }

                          var date = year + '-' + twoDigitMonth + '-' + day;
                          console.log('date inside events ' + date);
                          //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
                          if (plannedHoursMap.has(date)) {
                            console.log('plannedHoursMap.get(date)  : ' + plannedHoursMap.get(date));
                            lstEvents.push({
                              title: 'Planned Hours : ' + plannedHoursMap.get(date),
                              start: year + '-' + twoDigitMonth + '-' + day,
                            });

                          } else {
                            lstEvents.push({
                              title: 'Planned Hours : ' + '0',
                              start: year + '-' + twoDigitMonth + '-' + day,
                            });
                          }


                          if (actualHoursMap.has(date)) {
                            lstEvents.push({
                              title: 'Actual Hours : ' + actualHoursMap.get(date),
                              start: year + '-' + twoDigitMonth + '-' + day,
                            });
                          } else {
                            lstEvents.push({
                              title: 'Actual Hours : ' + '0',
                              start: year + '-' + twoDigitMonth + '-' + day,
                            });
                          }

                          lstEvents.push({
                            title: 'Create Task',
                            start: year + '-' + twoDigitMonth + '-' + day,
                          });
                          /*lstEvents.push({
                            title : 'Details',
                            start : year+'-'+twoDigitMonth+'-'+day,   
                          });
                          */
                          lstEvents.push({
                            title: 'Fill Actuals',
                            start: year + '-' + twoDigitMonth + '-' + day,
                          });

                        }
                        console.log('JSON.strigify teamView' + JSON.stringify(lstEvents));
                        res.send(lstEvents);


                      //}

                    })
                    .catch((error) => {
                      console.log('eroro in Task Query ' + JSON.stringify(error.stack));
                    })


                //}

              })
              .catch((error) => {
                console.log('eroro in Task Query ' + JSON.stringify(error.stack));
              })

          })
          .catch((error) => {
            console.log('eroro in member Query ' + JSON.stringify(error.stack));
          })
      }
      else{


        var lstEvents = [];
                        for (let i = 1; i <= numberOfDays; i++) {
                          let day = i;
                            twoDigitMonth = month + 1;
                          if (day >= 1 && day <= 9) {
                            day = '0' + i;
                          }
                          if (twoDigitMonth >= 1 && twoDigitMonth <= 9) {
                            twoDigitMonth = '0' + twoDigitMonth;
                          }

                          var date = year + '-' + twoDigitMonth + '-' + day;
                          console.log('date inside events ' + date);
                          //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
                          if (plannedHoursMap.has(date)) {
                            console.log('plannedHoursMap.get(date)  : ' + plannedHoursMap.get(date));
                            lstEvents.push({
                              title: 'Planned Hours : ' + plannedHoursMap.get(date),
                              start: year + '-' + twoDigitMonth + '-' + day,
                            });

                          } else {
                            lstEvents.push({
                              title: 'Planned Hours : ' + '0',
                              start: year + '-' + twoDigitMonth + '-' + day,
                            });
                          }


                          if (actualHoursMap.has(date)) {
                            lstEvents.push({
                              title: 'Actual Hours : ' + actualHoursMap.get(date),
                              start: year + '-' + twoDigitMonth + '-' + day,
                            });
                          } else {
                            lstEvents.push({
                              title: 'Actual Hours : ' + '0',
                              start: year + '-' + twoDigitMonth + '-' + day,
                            });
                          }

                          lstEvents.push({
                            title: 'Create Task',
                            start: year + '-' + twoDigitMonth + '-' + day,
                          });
                          /*lstEvents.push({
                            title : 'Details',
                            start : year+'-'+twoDigitMonth+'-'+day,   
                          });
                          */
                          lstEvents.push({
                            title: 'Fill Actuals',
                            start: year + '-' + twoDigitMonth + '-' + day,
                          });

                        }
                        console.log('JSON.strigify teamView' + JSON.stringify(lstEvents));
                        res.send(lstEvents);

      }

    })
    .catch((error) => {
      console.log('eroro in PRojectTEam ' + JSON.stringify(error.stack));
    })
})
 
router.get('/getNullevents',verify,async function(req,res,next) {
  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId+' ObjUser :'+JSON.stringify(req.user));
  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  var lstEvents = [];
  for(let i = 1;i <= numberOfDays ; i++)
  {
      let day = i , twoDigitMonth = month+1;
      if(day >= 1 && day <= 9)
      {
          day = '0'+i;
      }
      if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
      {
        twoDigitMonth = '0'+twoDigitMonth;
      }

      var date = year+'-'+twoDigitMonth+'-'+day;
     // console.log('date inside events '+date);
    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
   
      
          lstEvents.push({
            title : 'Planned Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
    


     
    
          lstEvents.push({
            title : 'Actual Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      

      lstEvents.push({
        title : 'Create Task',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      /*lstEvents.push({
        title : 'Details',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });*/
      
      lstEvents.push({
        title : 'Fill Actuals',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
   
  } 
    console.log('JSON.strigify '+JSON.stringify(lstEvents));
    res.send(lstEvents);
  
})



router.get('/geteventsProj',verify,async function(req,res,next){
  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId+' ObjUser :'+JSON.stringify(req.user));
  var projId=req.query.projectid;
  console.log('projId '+projId);

  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  let actualHoursMap = new Map();

  function convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }  
  
  await pool.query('SELECT Id,name, sfid ,project_name__c, planned_Hours__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE Assigned_Manager__c = $1 AND project_name__c =$2' ,[userId,projId])
  .then((taskQueryResult) => {
    console.log('sizzzz '+taskQueryResult.rowCount);
        if(taskQueryResult.rowCount > 0)
        {
          console.log('taskQueryResult proj '+JSON.stringify(taskQueryResult.rows));
              taskQueryResult.rows.forEach((eachTask) =>{
                  var date = convert(eachTask.start_date__c);
                  console.log('date  '+date+'  eachTask.planned_hours__c  : '+eachTask.planned_hours__c);
                 
                  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date));
                  console.log('Opposite plannedHoursMap.has(date)  '+(!plannedHoursMap.has(date)));
                  if( !plannedHoursMap.has(date))
                  {
                    plannedHoursMap.set(date, eachTask.planned_hours__c);
                    console.log('if Block '+eachTask.planned_hours__c);
                    if(eachTask.planned_hours__c != null)
                      plannedHoursMap.set(date, eachTask.planned_hours__c);
                    else
                      plannedHoursMap.set(date, 0);
                  }
                  else
                  {
                      
                      let previousHours = plannedHoursMap.get(date);
                      console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                      let currentHours = eachTask.planned_hours__c;
                      console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                      if(currentHours != null)
                      {
                        console.log('date  '+date +'previousHours + currentHours  '+(previousHours + currentHours));
                        plannedHoursMap.set(date, previousHours + currentHours );
                      }
                  }
              })

              let mapIter = plannedHoursMap.entries();
              console.log('plannedHoursMap    size '+plannedHoursMap.size);
              
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);

              for (let key of plannedHoursMap.keys()) {
               console.log('key :'+key)
              }

              for(let value of plannedHoursMap.values()){
                console.log('values : '+value);
              }
        }
  })
  .catch((taskQueryError) => {
        console.log('taskQueryError   :  '+taskQueryError.stack);
  })

  await pool.query('SELECT name,sfid, date__c, projecttimesheet__c,representative__c,calculated_hours__c FROM salesforce.Milestone1_Time__c WHERE projecttimesheet__c=$1 AND representative__c=$2 AND sfid IS NOT null',[projId,userId])
  .then((timesheetQueryResult) => {
   console.log('timesheetQueryResult project '+JSON.stringify(timesheetQueryResult.rows));
   console.log('timesheetQueryResult.rowCount '+timesheetQueryResult.rowCount);
   if(timesheetQueryResult.rowCount > 0)
   {
     timesheetQueryResult.rows.forEach((eachTimesheet) => {
       
         let fillingDate = convert(eachTimesheet.date__c);
         console.log('fillingDate  '+fillingDate);

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
   

}).catch((timesheetQueryError) => {
  console.log('timesheetQueryError  '+timesheetQueryError.stack);
})


  console.log('Just above proj $$ current  ')
  var lstEvents = [];
  for(let i = 1;i <= numberOfDays ; i++)
  {
      let day = i , twoDigitMonth = month+1;
      if(day >= 1 && day <= 9)
      {
          day = '0'+i;
      }
      if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
      {
        twoDigitMonth = '0'+twoDigitMonth;
      }

      var date = year+'-'+twoDigitMonth+'-'+day;
     // console.log('date inside events '+date);
    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
      if(plannedHoursMap.has(date))
      {
          console.log('plannedHoursMap.get(date)  : '+plannedHoursMap.get(date));
          lstEvents.push({
            title : 'Planned Hours : '+(plannedHoursMap.get(date)).toFixed(2),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
         
      }
      else
      {
          lstEvents.push({
            title : 'Planned Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }


      if(actualHoursMap.has(date))
      {
          lstEvents.push({
            title : 'Actual Hours : '+actualHoursMap.get(date),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }
      else
      {
          lstEvents.push({
            title : 'Actual Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }

      lstEvents.push({
        title : 'Create Task',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      /*lstEvents.push({
        title : 'Details',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      */
      lstEvents.push({
        title : 'Fill Actuals',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
   
  } 
   // console.log('JSON.strigify '+JSON.stringify(lstEvents));
    res.send(lstEvents);



})


router.get('/geteventsProjReporting',verify,async function(req,res,next){
  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId+' ObjUser :'+JSON.stringify(req.user));
  var projId=req.query.projectid;
  console.log('projId '+projId);

  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  let actualHoursMap = new Map();

  function convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  } 

    let str = `Select id,sfid,Name,Email,Employee_ID__c,reporting_manager__c FROM salesforce.Contact `;

   let conList =   await pool.query(str);
   let temp = conList.rows;
   let idArray = getReportingAllDepthData(temp,userId);
   let indexArray = [];
   //let id
   //let tempAr = [];

   idArray.forEach((dt,i)=>{
     // tempAr.push(`'${dt}'`)
      indexArray.push(`$${i+1}`);
   })


   //let strings =  `('${idArray.join("','")}')`  

console.log(idArray,indexArray)

let q = "SELECT Id,name, sfid ,project_name__c, planned_Hours__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE Assigned_Manager__c IN  (" + indexArray.join(",") + ") AND project_name__c = '" + projId + "'";
  console.log(q);
  await pool.query( q,idArray)
  .then((taskQueryResult) => {

    console.log('sizzzz '+taskQueryResult.rowCount);
        if(taskQueryResult.rowCount > 0)
        {
          indexArray = [];
          idArray = [];
          console.log('taskQueryResult proj '+JSON.stringify(taskQueryResult.rows));
              taskQueryResult.rows.forEach((eachTask,i) =>{
                  var date = convert(eachTask.start_date__c);
                  console.log('date  '+date+'  eachTask.planned_hours__c  : '+eachTask.planned_hours__c);

                  indexArray.push(`$${i+1}`);
                  idArray.push(eachTask.sfid)
                  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date));
                  console.log('Opposite plannedHoursMap.has(date)  '+(!plannedHoursMap.has(date)));
                  if( !plannedHoursMap.has(date))
                  {
                    plannedHoursMap.set(date, eachTask.planned_hours__c);
                    console.log('if Block '+eachTask.planned_hours__c);
                    if(eachTask.planned_hours__c != null)
                      plannedHoursMap.set(date, eachTask.planned_hours__c);
                    else
                      plannedHoursMap.set(date, 0);
                  }
                  else
                  {
                      
                      let previousHours = plannedHoursMap.get(date);
                      console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                      let currentHours = eachTask.planned_hours__c;
                      console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                      if(currentHours != null)
                      {
                        console.log('date  '+date +'previousHours + currentHours  '+(previousHours + currentHours));
                        plannedHoursMap.set(date, previousHours + currentHours );
                      }
                  }
              })

              let mapIter = plannedHoursMap.entries();
              console.log('plannedHoursMap    size '+plannedHoursMap.size);
              
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);

              for (let key of plannedHoursMap.keys()) {
               console.log('key :'+key)
              }

              for(let value of plannedHoursMap.values()){
                console.log('values : '+value);
              }
        }
  })
  .catch((taskQueryError) => {
        console.log('taskQueryError   :  '+taskQueryError.stack);
  })

  console.log(idArray,indexArray)
let qrt = `SELECT name,sfid, date__c, projecttimesheet__c,representative__c,calculated_hours__c FROM salesforce.Milestone1_Time__c WHERE Project_Task__c IN (${indexArray.join(",")})  AND sfid IS NOT null`;
console.log(qrt);
  await pool.query(qrt,idArray)
  .then((timesheetQueryResult) => {
   console.log('timesheetQueryResult project '+JSON.stringify(timesheetQueryResult.rows));
   console.log('timesheetQueryResult.rowCount '+timesheetQueryResult.rowCount);
   if(timesheetQueryResult.rowCount > 0)
   {
     timesheetQueryResult.rows.forEach((eachTimesheet) => {
       
         let fillingDate = convert(eachTimesheet.date__c);
         console.log('fillingDate  '+fillingDate);

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
   

}).catch((timesheetQueryError) => {
  console.log('timesheetQueryError  '+timesheetQueryError.stack);
})


  console.log('Just above proj $$ current  ')
  var lstEvents = [];
  for(let i = 1;i <= numberOfDays ; i++)
  {
      let day = i , twoDigitMonth = month+1;
      if(day >= 1 && day <= 9)
      {
          day = '0'+i;
      }
      if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
      {
        twoDigitMonth = '0'+twoDigitMonth;
      }

      var date = year+'-'+twoDigitMonth+'-'+day;
     // console.log('date inside events '+date);
    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
      if(plannedHoursMap.has(date))
      {
          console.log('plannedHoursMap.get(date)  : '+plannedHoursMap.get(date));
          lstEvents.push({
            title : 'Planned Hours : '+(plannedHoursMap.get(date)).toFixed(2),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
         
      }
      else
      {
          lstEvents.push({
            title : 'Planned Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }


      if(actualHoursMap.has(date))
      {
          lstEvents.push({
            title : 'Actual Hours : '+actualHoursMap.get(date),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }
      else
      {
          lstEvents.push({
            title : 'Actual Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }

      lstEvents.push({
        title : 'Create Task',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      /*lstEvents.push({
        title : 'Details',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      */
      lstEvents.push({
        title : 'Fill Actuals',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
   
  } 
   // console.log('JSON.strigify '+JSON.stringify(lstEvents));
    res.send(lstEvents);



})


function getReportingAllDepthData(temp,userId){
  
   let w = {};
      temp.forEach((dt,i)=>{
        if( dt.reporting_manager__c && !w[dt.reporting_manager__c]  ){
            //console.log(dt,i)
            w[dt.reporting_manager__c] = [dt]
        }
          else if(dt.reporting_manager__c) {
               //console.log(dt,i)
              w[dt.reporting_manager__c].push(dt)
          }
          
      })

      let users = w[userId]  ? w[userId] : [];

      let kt = []
      //console.log(users,w);
      function addData(dt){

            dt.forEach(d=>{
                //console.log(d)
                
                kt.push(d)
                //console.log(kt)
                if(w[d.sfid]){
                    addData(w[d.sfid])
                }
            })
      }
      //console.log('23456');
      users.forEach(dt=>{
          kt .push(dt)
          console.log(dt)
          if(w[dt.sfid])
           addData(w[dt.sfid])
          
      })

      //console.log('test',kt.length,kt)
      let idList = new Set();
      kt.forEach(dt=>{
        idList.add(dt.sfid);

      })

      //response.send(kt);
      console.log('idList',idList)
      let idArray = [...idList].filter(d=> d != userId);
      return idArray;
      //let strings = `('${idArray.join("','")}')`
      //console.log(strings);
}


router.get('/getTaskDetailsForReportingAll',verify, async function(req, res, next) {
    console.log('request.user '+JSON.stringify(req.user));
    var userId = req.user.sfid;
    console.log('userId : '+userId);


    console.log('req.query :'+req.query.date);
    var strdate = req.query.date;
    console.log('typeof date '+typeof(strdate));
    var selectedDate = new Date(strdate);
    console.log('selectedDate   : '+selectedDate);
    console.log('typeof(selectedDate)   : '+typeof(selectedDate));
    var year = selectedDate.getFullYear();
    var month = selectedDate.getMonth();
    console.log('Month '+selectedDate.getMonth());
    console.log('Year : '+selectedDate.getFullYear());
    var numberOfDays = new Date(year, month+1, 0).getDate();
    console.log('numberOfDays : '+numberOfDays);
    let plannedHoursMap = new Map();
    let actualHoursMap = new Map();

    var timesheetParams=[];
    var lsttskid =[];
    function convert(str) {
      var date = new Date(str),
        mnth = ("0" + (date.getMonth() + 1)).slice(-2),
        day = ("0" + date.getDate()).slice(-2);
      return [date.getFullYear(), mnth, day].join("-");
    }



    let str = `Select id,sfid,Name,Email,Employee_ID__c,reporting_manager__c FROM salesforce.Contact `;

   let conList =   await pool.query(str);
   let temp = conList.rows;
   let idArray = getReportingAllDepthData(temp,userId);
   let strings =  `('${idArray.join("','")}')`


  await pool.query('SELECT Id, sfid , Planned_Hours__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE Assigned_Manager__c IN  '+ strings )
  .then((taskQueryResult) => {
    console.log('taskQuery allProject curretUser '+JSON.stringify(taskQueryResult.rows));
    for(let i=1; i<= taskQueryResult.rowCount ; i++)
    {
        lsttskid.push(taskQueryResult.rows[i-1].sfid)
        timesheetParams.push('$'+i);
    }  
        if(taskQueryResult.rowCount > 0)
        {
              taskQueryResult.rows.forEach((eachTask) =>{
                  var date = convert(eachTask.start_date__c);
                  console.log('date  '+date+'  eachTask.planned_hours__c  : '+eachTask.planned_hours__c);
                 
                  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date));
                  console.log('Opposite plannedHoursMap.has(date)  '+(!plannedHoursMap.has(date)));
                  if( !plannedHoursMap.has(date))
                  {
                    plannedHoursMap.set(date, eachTask.planned_hours__c);
                    console.log('if Block '+eachTask.planned_hours__c);
                    if(eachTask.planned_hours__c != null)
                      plannedHoursMap.set(date, eachTask.planned_hours__c);
                    else
                      plannedHoursMap.set(date, 0);
                  }
                  else
                  {
                      
                      let previousHours = plannedHoursMap.get(date);
                      console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                      let currentHours = eachTask.planned_hours__c;
                      console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                      if(currentHours != null)
                      {
                        console.log('date  '+date +'previousHours + currentHours  '+(previousHours + currentHours));
                        plannedHoursMap.set(date, previousHours + currentHours );
                      }
                  }
              })

              let mapIter = plannedHoursMap.entries();
              console.log('plannedHoursMap    size '+plannedHoursMap.size);
              
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);

              for (let key of plannedHoursMap.keys()) {
               console.log('key :'+key)
              }

              for(let value of plannedHoursMap.values()){
                console.log('values : '+value);
              }
        }
  })
  .catch((taskQueryError) => {
        console.log('taskQueryError   :  '+taskQueryError.stack);
  })

  var timesheetQuery = 'SELECT sfid, date__c, calculated_hours__c, project_Task__c  FROM salesforce.Milestone1_Time__c WHERE sfid != \''+''+'\' AND Project_Task__c IN ('+ timesheetParams.join(',') +')';
  console.log(timesheetQuery)
 // await pool.query('SELECT sfid, date__c,representative__c, calculated_hours__c FROM salesforce.Milestone1_Time__c WHERE representative__c=$1 AND sfid != \''+''+'\'',[userId])
 await pool.query(timesheetQuery,lsttskid) 
 .then((timesheetQueryResult) => {
      console.log('timesheetQueryResult  '+JSON.stringify(timesheetQueryResult.rows));
      console.log('timesheetQueryResult.rowCount '+timesheetQueryResult.rowCount);
      if(timesheetQueryResult.rowCount > 0)
      {
        timesheetQueryResult.rows.forEach((eachTimesheet) => {
          
            let fillingDate = convert(eachTimesheet.date__c);
            console.log('fillingDate  '+fillingDate);

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
      

  })
  .catch((timesheetQueryError) => {
    console.log('timesheetQueryError  '+timesheetQueryError.stack);
  })


  /* Start Actual Hours Query  Calculation */




  /* End Actual Hours Query  Calculation */


  console.log('Just above ')
  var lstEvents = [];
  for(let i = 1;i <= numberOfDays ; i++)
  {
      let day = i , twoDigitMonth = month+1;
      if(day >= 1 && day <= 9)
      {
          day = '0'+i;
      }
      if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
      {
        twoDigitMonth = '0'+twoDigitMonth;
      }

      var date = year+'-'+twoDigitMonth+'-'+day;
     // console.log('date inside events '+date);
    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
      if(plannedHoursMap.has(date))
      {
          console.log('plannedHoursMap.get(date)  : '+plannedHoursMap.get(date));
          lstEvents.push({
            title : 'Planned Hours : '+(plannedHoursMap.get(date)).toFixed(2),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
         
      }
      else
      {
          lstEvents.push({
            title : 'Planned Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }


      if(actualHoursMap.has(date))
      {
          lstEvents.push({
            title : 'Actual Hours : '+actualHoursMap.get(date),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }
      else
      {
          lstEvents.push({
            title : 'Actual Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }

      lstEvents.push({
        title : 'Create Task',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      /*lstEvents.push({
        title : 'Details',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      */
      lstEvents.push({
        title : 'Fill Actuals',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
   
  } 
    console.log('JSON.strigify '+JSON.stringify(lstEvents));
    res.send(lstEvents);



    

})



router.get('/getevents',verify, async function(req, res, next) {

  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId);

  
  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  let actualHoursMap = new Map();

  var timesheetParams=[];
  var lsttskid =[];
  function convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }  

  await pool.query('SELECT Id, sfid , Planned_Hours__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE Assigned_Manager__c = $1',[userId])
  .then((taskQueryResult) => {
    console.log('taskQuery allProject curretUser '+JSON.stringify(taskQueryResult.rows));
    for(let i=1; i<= taskQueryResult.rowCount ; i++)
    {
        lsttskid.push(taskQueryResult.rows[i-1].sfid)
        timesheetParams.push('$'+i);
    }  
        if(taskQueryResult.rowCount > 0)
        {
              taskQueryResult.rows.forEach((eachTask) =>{
                  var date = convert(eachTask.start_date__c);
                  console.log('date  '+date+'  eachTask.planned_hours__c  : '+eachTask.planned_hours__c);
                 
                  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date));
                  console.log('Opposite plannedHoursMap.has(date)  '+(!plannedHoursMap.has(date)));
                  if( !plannedHoursMap.has(date))
                  {
                    plannedHoursMap.set(date, eachTask.planned_hours__c);
                    console.log('if Block '+eachTask.planned_hours__c);
                    if(eachTask.planned_hours__c != null)
                      plannedHoursMap.set(date, eachTask.planned_hours__c);
                    else
                      plannedHoursMap.set(date, 0);
                  }
                  else
                  {
                      
                      let previousHours = plannedHoursMap.get(date);
                      console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                      let currentHours = eachTask.planned_hours__c;
                      console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                      if(currentHours != null)
                      {
                        console.log('date  '+date +'previousHours + currentHours  '+(previousHours + currentHours));
                        plannedHoursMap.set(date, previousHours + currentHours );
                      }
                  }
              })

              let mapIter = plannedHoursMap.entries();
              console.log('plannedHoursMap    size '+plannedHoursMap.size);
              
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);

              for (let key of plannedHoursMap.keys()) {
               console.log('key :'+key)
              }

              for(let value of plannedHoursMap.values()){
                console.log('values : '+value);
              }
        }
  })
  .catch((taskQueryError) => {
        console.log('taskQueryError   :  '+taskQueryError.stack);
  })

  var timesheetQuery = 'SELECT sfid, date__c, calculated_hours__c, project_Task__c  FROM salesforce.Milestone1_Time__c WHERE sfid != \''+''+'\' AND Project_Task__c IN ('+ timesheetParams.join(',') +')';
  console.log(timesheetQuery)
 // await pool.query('SELECT sfid, date__c,representative__c, calculated_hours__c FROM salesforce.Milestone1_Time__c WHERE representative__c=$1 AND sfid != \''+''+'\'',[userId])
 await pool.query(timesheetQuery,lsttskid) 
 .then((timesheetQueryResult) => {
      console.log('timesheetQueryResult  '+JSON.stringify(timesheetQueryResult.rows));
      console.log('timesheetQueryResult.rowCount '+timesheetQueryResult.rowCount);
      if(timesheetQueryResult.rowCount > 0)
      {
        timesheetQueryResult.rows.forEach((eachTimesheet) => {
          
            let fillingDate = convert(eachTimesheet.date__c);
            console.log('fillingDate  '+fillingDate);

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
      

  })
  .catch((timesheetQueryError) => {
    console.log('timesheetQueryError  '+timesheetQueryError.stack);
  })


  /* Start Actual Hours Query  Calculation */




  /* End Actual Hours Query  Calculation */


  console.log('Just above ')
  var lstEvents = [];
  for(let i = 1;i <= numberOfDays ; i++)
  {
      let day = i , twoDigitMonth = month+1;
      if(day >= 1 && day <= 9)
      {
          day = '0'+i;
      }
      if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
      {
        twoDigitMonth = '0'+twoDigitMonth;
      }

      var date = year+'-'+twoDigitMonth+'-'+day;
     // console.log('date inside events '+date);
    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
      if(plannedHoursMap.has(date))
      {
          console.log('plannedHoursMap.get(date)  : '+plannedHoursMap.get(date));
          lstEvents.push({
            title : 'Planned Hours : '+(plannedHoursMap.get(date)).toFixed(2),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
         
      }
      else
      {
          lstEvents.push({
            title : 'Planned Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }


      if(actualHoursMap.has(date))
      {
          lstEvents.push({
            title : 'Actual Hours : '+actualHoursMap.get(date),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }
      else
      {
          lstEvents.push({
            title : 'Actual Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }

      lstEvents.push({
        title : 'Create Task',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      /*lstEvents.push({
        title : 'Details',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      */
      lstEvents.push({
        title : 'Fill Actuals',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
   
  } 
    console.log('JSON.strigify '+JSON.stringify(lstEvents));
    res.send(lstEvents);
 });



router.get('/logout', (request, response) => {
 // request.logout();obj
 // request.flash('success_msg', 'You are logged out');
 response.clearCookie("jwt");
 response.clearCookie("obj");
  response.redirect('/users/login');
});
router.get('/inactivity', (request, response) => {
  // request.logout();obj
  // request.flash('success_msg', 'You are logged out');
  response.clearCookie("jwt");
  response.clearCookie("obj");
  response.render('inactivity');
 });
 




/*
Forget Password
*/
router.get('/forgotpassword',(req,res)=>{
  console.log('rendering'+JSON.req);
  res.render('forgetPassword');
})


router.post('/salesforceEmailVeerification',(request,response)=>{
  let emailEnter= request.body;
  const {emailPass }= request.body;
  console.log('emailAddress' +emailPass);
  console.log('Body'+JSON.stringify(emailEnter));
  let queryContact = 'SELECT sfid,email,name FROM salesforce.contact where email=$1' ;
  console.log('querry Contact '+queryContact);
  pool
  .query(queryContact,[emailPass])
  .then((querryResult)=>{
        console.log('queryResult: '+JSON.stringify(querryResult.rows));
        if(querryResult.rowCount==1)
        {
          response.send(querryResult.rows);
        }
        else
        {
          response.send('Enter valid and authorised email');
        }
  })
  .catch((QueryError)=>{
    console.log('Erros '+ QueryError.stack);
    response.send('QueryError');
  })
})

router.post('/sendEMail',(request,response)=>{
 let bodysent= request.body;
  const {email,sfid ,name} = request.body;
  console.log('emaoBidy' +email);
  console.log('sfid' +sfid);
  console.log('name' +name);
 /*  nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        return process.exit(1);
    }  */
    const transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com", // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      tls: {
         ciphers:'SSLv3'
      },
      auth: {
          user:'crm@learninglinksindia.org',
          pass:'Myworld@1234'
      }
  })
  let message = {
    from: 'crm@learninglinksindia.org',
    to:email,
    subject: 'Finish Resetting your Heroku Password ',
    text: 'Plz Click the below link to generate your password',
    html: 'Heroku recently received a request to reset the password for the username '+email +'. <br/>To finish resetting your password, go to the following link. <br/> This link expires in 24 hours<br/><br/> Link : http://learninglinksfoundation.herokuapp.com/users/resetPassword/'+sfid+'<br/><br/> Sender Email : crm@learninglinksindia.org<br/><br/>Sender Name : Heroku_Support <br/>'
    
  }

  transporter.sendMail(message, (err, info) => {
    if (err) {
        console.log('Error occurred. ' + err.message);
        return process.exit(1);
    }
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
  //  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    response.send('Email Sent');
  })
})
router.get('/resetPassword/:userId',(request,response)=>{
  let userId = request.params.userId;
  console.log('userId  : '+userId);
  response.render('resetPassword',{userId});
})
router.get('/generatePassword/:userId',(request,response)=>{
  let userId =request.params.userId;
  response.render('generatePassword',{userId});
})
router.post('/updatePass',(request,response)=>{
  console.log('BODy'+JSON.stringify(request.body));
  const { pass,pass2,user}=request.body;

   const schema = joi.object({
    password:joi.string().required().label('Please Fill Password'),
    pass:joi.string().min(10).minOfNumeric(1).minOfSpecialCharacters(1).required(),
    password2:joi.string().required().label('Please Re-enter Password'),  
    confirmPassword:joi.string().required().valid(joi.ref('password')).label('Passwords does not match'),
      })
      let Result=schema.validate({password:pass,pass:pass,password2:pass2,confirmPassword:pass2});
          console.log('validaton result '+JSON.stringify(Result.error));
          if(Result.error)
          {
              console.log('fd'+Result.error)
              response.send(Result.error.details[0].context.label);
          } 
          else
          {    
    let updateQuerryPass='UPDATE salesforce.contact SET '+
    'password__c = \''+pass+'\', '+
     'password2__c=\''+pass2+'\' '+
     'WHERE sfid = $1';
     console.log('update query'+updateQuerryPass);
      pool
      .query(updateQuerryPass,[user])
      .then((querryResult)=>{
      console.log('querryResult.rows '+JSON.stringify(querryResult.rows));
      console.log('querryResult'+JSON.stringify(querryResult));
      response.send('Updated Successfully !');
    
      })
      .catch((queryyError)=>{
      console.log('queryyError'+queryyError.stack);
      response.send('queryyError');
      })
    }
 
})

router.get('/editProfile',verify,(request,response)=>{
  let objUser=request.user;
  let userId=objUser.sfid;
  console.log('Sfidddd :'+JSON.stringify(objUser));
  let queryContact = 'SELECT c.sfid, c.profile_picture_url__c, c.email, c.employee_id__c,c.reporting_manager__c ,c.pm_email__c, c.employee_category_band__c, c.address__c,c.mobilephone, c.name FROM salesforce.contact c  where c.sfid=$1  ' ;
  pool
  .query(queryContact,[userId])
  .then( async (queryResult)=>{

    let userdetail=queryResult.rows[0];
    objUser.name = userdetail.name;
    let resp = await pool.query('Select sfid,name from salesforce.contact where sfid = $1',[userdetail.reporting_manager__c])
    console.log('userdeat '+JSON.stringify(userdetail));
    userdetail.reportingname = resp.rows.length > 0 ? resp.rows[0].name : ''
 /*    console.log('queryResult'+JSON.stringify(queryResult.rows));
    let obj = queryResult.rows;
    console.log('check'+JSON.stringify(obj[0]));
    let user =JSON.stringify(obj[0]); 
    console.log('user '+user);
    response.render('editProfile',{userI}); */
    response.render('editProfile',{userdetail, objUser});
    
  })
  .catch((QueryError)=>{
    console.log('QueryError'+QueryError.stack);
    response.send(QueryError);
  })
})
router.post('/updateProfile',verify,(request,response)=>{
  let objUser=request.user;
  const {nam,phn,empid,desig,empCat, postal,mob,uid,imgpath }=request.body;
  //let objUser=request.user;
  /*  const errors = validationResult(req);
   if(!errors.isEmpty()){
     return res.status(422).JSON({errors:errors.array()})
   } */
 // request.checkQuery('postal','"Postal Code should not  be empty ').notEmpty().isInt();
  let bdy= request.body;
   const schema = joi.object({
    nam:joi.string().min(4).max(20)
   /*
    
    phn:joi.string().required(),
    add:joi.string(),
    uid:joi.string(), */
  }) 
 // const scema = joi.number().max(5);
  let result= schema.validate({nam:bdy.nam});
  console.log('resutk '+JSON.stringify(result));
  if(result.error){
    response.status(400).send(result.error.details[0].message)
    return;
    } 
  console.log('body : '+ JSON.stringify(bdy));
  console.log('name '+nam);
  console.log('phn '+phn);
  console.log('napostalme '+postal);
  //console.log('add '+add);
  console.log('empi '+empid);
  console.log('uid '+uid);
  let qry ='UPDATE salesforce.contact SET '+
           
            'employee_id__c=\''+empid+'\', '+
            'pm_email__c=\''+desig+'\', '+
            'name=\''+nam+'\', '+
            'mobilephone=\''+mob+'\', '+
            'employee_category_band__c=\''+empCat+'\','+
            'profile_picture_url__c=\''+imgpath+'\' '+
             'WHERE sfid = $1';
             console.log('qry '+qry);
            
  pool
  .query(qry ,[uid])
  .then((querryResult)=>{
    console.log('querryResult'+JSON.stringify(querryResult));
    objUser.name  = nam
    objUser.profile_picture_url__c = imgpath
    objUser.pm_email__c= desig
    objUser.employee_category_band__c= empCat
     response.cookie('obj',JSON.stringify(objUser), { httpOnly: false, secure: false, maxAge: 3600000 });
    response.send(querryResult);
 
  })
  .catch((qurryError)=>{
    console.log('qrryError ' +qurryError.stack);
    response.send(qurryError);
  })
  
});
/* 
    TAsk Activity Code 
 */
router.get('/taskDetail',verify,(req,res)=>{
  console.log('calling Activity Code Page')
  res.render('taskCode');
})



router.get('/fetchTASKCODE',verify,(request,response)=>{

  pool.query('select sfid ,name from salesforce.Milestone1_Milestone__c where Project__c =$1 and sfid!=$2',['a030p0000018ScOAAU','a020p0000035q9lAAA'])
  .then((querryRes)=>{
    console.log('querryRes'+JSON.stringify(querryRes.rows));
    var sId=[];
    querryRes.rows.forEach((eachRecord)=>{
     // console.log(JSON.stringify(eachRecord.sfid));
      sId.push(eachRecord.sfid);
    })
    console.log('IDSET are :'+sId);
    let qry ='Select sfid ,Activity_Code__c FROM salesforce.Milestone1_Task__c where sfid IS NOT NULL AND Project_Milestone__c IN ($1,$2,$3,$4,$5,$6)';
    console.log('qry qry '+qry);
    pool.query(qry,[sId[0],sId[1],sId[2],sId[3],sId[4],sId[5]]) 
  ///  let qry='Select sfid ,Activity_Code__c FROM salesforce.Milestone1_Task__c where sfid IS NOT NULL AND Project_Milestone__c IN '+'('+ sId+')';
  //  console.log('qriesssss +'+ qry); 
 //   pool.query(qry,[sId])
    .then((result)=>{
      console.log('result TAsk '+ JSON.stringify(result));
      if(result.rowCount>0)
      {
        var modifiedList=[],i=1
        result.rows.forEach((eachRecord)=>{
          let obj={};
          obj.sequence=i;
          obj.taskId=eachRecord.sfid;
          obj.activityCode=eachRecord.activity_code__c;
          i=i+1;
          modifiedList.push(obj);
        })
        console.log('modified list '+JSON.stringify(modifiedList));
        response.send(modifiedList)
      }
      else
      {
        response('[]');
      }
    })
    .catch((error)=>{
      console.log('error'+error.stack);
      response.send(error);
    })
  })
  .catch((queryEr)=>{
    console.log('queryEr'+queryEr.stack);
    response.send(queryEr);
  })
})

router.get('/pldReports',verify,(request, response) => {
  let objUser = request.user;

  pool
  .query('SELECT sfid FROM salesforce.PldExcelReportVisibility__c WHERE Contact__c = $1 AND isShared__c = $2',[objUser.sfid, true])
  .then((excelReportResult) =>{
      console.log('excelReportResult  : '+JSON.stringify(excelReportResult.rows));
      if(excelReportResult.rowCount > 0)
      {
       response.render('./loginDashboard/pldReports',{objUser,showExcelReport : true});
      }
      else
      {
        response.render('./loginDashboard/pldReports',{objUser,showExcelReport : false});
      }
  })
  .catch((excelReportError) =>{
      console.log('excelReportError : '+excelReportError);
      response.render('./loginDashboard/pldReports',{objUser,showExcelReport : false});
  })

  
})


router.post('/sendResponseForApproval',verify, (request, response) => {
  console.log('Expense request.user '+JSON.stringify(request.user));
  let objUser = request.user;
  let reponseId = request.body.reponseId;
  console.log('reponseId   : '+reponseId);

  let managerId = '';
    pool
    .query('SELECT manager__c FROM salesforce.Team__c WHERE sfid IN (SELECT team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1)',[objUser.sfid])
    .then((teamMemberQueryResult) => {
          console.log('teamMemberQueryResult   : '+JSON.stringify(teamMemberQueryResult.rows));
          if(teamMemberQueryResult.rowCount > 0)
          {
            let lstManagerId = teamMemberQueryResult.rows.filter((eachRecord) => {
                                    if(eachRecord.manager__c != null)
                                        return eachRecord;
                              })
            managerId = lstManagerId[0].manager__c;
            console.log('managerId   : '+managerId);

            

              pool.query('SELECT id, sfid, Approval_Status__c FROM salesforce.Project_Survey_Response__c WHERE sfid = $1',[reponseId])
              .then((responseStatusQuery) => {
                   if(responseStatusQuery.rowCount > 0)
                   {
                        console.log('responseStatusQuery.rows  : '+JSON.stringify(responseStatusQuery.rows));
                        if(responseStatusQuery.rows[0].approval_status__c == 'Pending' || responseStatusQuery.rows[0].approval_status__c == 'Approved' || responseStatusQuery.rows[0].approval_status__c == 'Rejected')
                        {
                          response.send('Approval already sent !');
                          return;
                        }
                        else
                        {
                           pool.query('UPDATE salesforce.Project_Survey_Response__c SET Approval_Status__c = $1 WHERE sfid = $2',['Pending',reponseId])
                          .then((responseUpdateQuery) => {
                                if(responseUpdateQuery.rowCount > 0)
                                {

                                    pool.query('INSERT INTO salesforce.Custom_Approval__c (Approval_Type__c,Submitter__c, Assign_To__c ,Expense__c, Comment__c, Status__c, Record_Name__c,amount__c) values($1, $2, $3, $4, $5, $6, $7, $8) ',['PldForm',objUser.sfid, managerId, reponseId, '', 'Pending', '', 0 ])
                                    .then((customApprovalQueryResult) => {
                                            console.log('customApprovalQueryResult  '+JSON.stringify(customApprovalQueryResult));
                                            response.send('Sent For Approval !');
                                    })
                                    .catch((customApprovalQueryError) => {
                                            console.log('customApprovalQueryError  '+customApprovalQueryError.stack);
                                            response.send('Error Occured while sending for approval !');
                                    })

                                }

                          })
                          .catch((responseUpdateQueryError) =>{
                                console.log('responseUpdateQueryError  '+responseUpdateQueryError.stack);
                                response.send('Error Occured while sending for approval !');
                          })

                        }
                   }
                   

              })
              .catch((responseStatusQueryError) =>{
                  console.log('responseStatusQueryError  : '+responseStatusQueryError.stack);
                  response.send('Error Occured while sending for approval !');
              })

            

             
            


        /*    pool.query('INSERT INTO salesforce.Custom_Approval__c (Approval_Type__c,Submitter__c, Assign_To__c ,Expense__c, Comment__c, Status__c, Record_Name__c,amount__c) values($1, $2, $3, $4, $5, $6, $7, $8) ',['PldForm',objUser.sfid, managerId, reponseId, '', 'Pending', '', 0 ])
            .then((customApprovalQueryResult) => {
                    console.log('customApprovalQueryResult  '+JSON.stringify(customApprovalQueryResult));
                    response.send('Sent For Approval !');
            })
            .catch((customApprovalQueryError) => {
                    console.log('customApprovalQueryError  '+customApprovalQueryError.stack);
                    response.send('Error Occured while sending for approval !');
            })   */
          }
    })
    .catch((teamMemberQueryError) => {
          console.log('teamMemberQueryError   :  '+teamMemberQueryError.stack);
          response.send('Error Occured while sending for approval !');
    })
});


router.post('/deletePldResponse',verify, (request, response) => {

  let objUser = request.user;
  console.log('objUser   : '+JSON.stringify(objUser));
  let reponseId = request.body.reponseId;
  console.log('reponseId  : '+reponseId);

  pool.query('DELETE FROM salesforce.Project_Survey_Response__c WHERE sfid = $1',[reponseId])
  .then((deleteResponseResult) => {
      console.log('deleteResponseResult  : '+JSON.stringify(deleteResponseResult));
      response.send('Deleted Successfully !');
  })
  .catch((deleteResponseError) => {
    console.log('deleteResponseError  : '+deleteResponseError.stack);
     response.send('Error Occured !');
  })

});


router.get('/getRelatedProjectLibraries',verify,(request, response)=> {

  let selectedProjectId = request.query.selectedProjectId;
  console.log('Inside Get Method selectedProjectId : '+selectedProjectId);

  pool
  .query('SELECT sfid, name,PLD_Questions__c FROM salesforce.Project_Library__c WHERE Project__c = $1 AND Active__c =$2',[selectedProjectId,true])
  .then((projectLibraryResult) => {
    console.log('projectLibraryResult  : '+JSON.stringify(projectLibraryResult.rows));
    if(projectLibraryResult.rowCount > 0)
    {
      response.send(projectLibraryResult.rows);
    }
    else
    {
      response.send([]);
    }
    

  })
  .catch((projectLibraryQueryError) => {
    console.log('projectLibraryQueryError  : '+projectLibraryQueryError);
    response.send([]);
  })

});




router.get('/getProjects',verify,(request, response) =>{

  
  let objUser = request.user;
  console.log('objUser  '+JSON.stringify(objUser));

  if(objUser.isManager ==  false)
  {
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
      var projectTeamQueryText = 'SELECT   tm.sfid as team__c , pr.project__c as project__c  FROM salesforce.Team__c tm INNER JOIN  salesforce.Project_Team__c pr on pr.sfid = tm.Project_Team__c WHERE tm.sfid IN (' + projectTeamparams.join(',') + ')';
      console.log('projectTeamQueryText '+projectTeamQueryText);
      
        pool
        .query(projectTeamQueryText,lstTeamId)
        .then((projectTeamResult) => {
            console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
            //console.log('projectTeam Name '+projectTeamResult.rows[0].name);

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
                  
                  
                  if(projectQueryResult.rowCount > 0)
                  {
                    response.send(projectQueryResult.rows);
                  }
                  else
                  {
                    response.send([]);
                  }
                
            })
            .catch((projectQueryError) => {
                  console.log('projectQueryError '+projectQueryError.stack);
                  response.send([]);
            })
         
        })
          .catch((projectTeamQueryError) =>{
            console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
            response.send([]);
          })          
      })
      .catch((teamMemberQueryError) => {
      console.log('Error in team member query '+teamMemberQueryError.stack);
        response.send([]);
      })

  }
  else
  {

    pool
    .query('SELECT sfid, Name FROM salesforce.Team__c WHERE Manager__c = $1 ;',[objUser.sfid])
    .then(teamMemberResult => {
      
      
      var projectTeamparams = [], lstTeamId = [];
      for(var i = 1; i <= teamMemberResult.rows.length; i++) {
        projectTeamparams.push('$' + i);
        lstTeamId.push(teamMemberResult.rows[i-1].sfid);
      } 
      var projectTeamQueryText = 'SELECT   tm.sfid as team__c , pr.project__c as project__c  FROM salesforce.Team__c tm INNER JOIN  salesforce.Project_Team__c pr on pr.sfid = tm.Project_Team__c WHERE tm.sfid IN IN (' + projectTeamparams.join(',') + ')';
      console.log('projectTeamQueryText '+projectTeamQueryText);
      
        pool
        .query(projectTeamQueryText,lstTeamId)
        .then((projectTeamResult) => {
            console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
            //console.log('projectTeam Name '+projectTeamResult.rows[0].name);

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
                  
                  
                  if(projectQueryResult.rowCount > 0)
                  {
                    response.send(projectQueryResult.rows);
                  }
                  else
                  {
                    response.send([]);
                  }
                  
                  


            })
            .catch((projectQueryError) => {
                  console.log('projectQueryError '+projectQueryError.stack);
                  response.send([]);
            })
         
        })
          .catch((projectTeamQueryError) =>{
            console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
            response.send([]);
          })          
      })
      .catch((teamMemberQueryError) => {
      console.log('Error in team member query '+teamMemberQueryError.stack);
        response.send([]);
      })
  }

});


router.get('/getProjectReportsAccessbility',verify, (request, response) =>{

  let objUser = request.user;

  pool
  .query('SELECT sfid, Project__c FROM salesforce.PldExcelReportVisibility__c WHERE Contact__c = $1 AND isShared__c = $2',[objUser.sfid, true])
  .then((excelReportResult) =>{
      console.log('excelReportResult  : '+JSON.stringify(excelReportResult.rows));
      if(excelReportResult.rowCount > 0)
      {
        let projectIdParams = [], lstProjectIds = [],i=1;
        excelReportResult.rows.forEach((eachRecord) => {
            projectIdParams.push('$'+i);
            lstProjectIds.push(eachRecord.project__c);
            i++;
        })

        let projectQueryText = 'SELECT id, sfid, name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+projectIdParams.join(',')+')';
        pool
        .query(projectQueryText,lstProjectIds)
        .then((projectQueryResult) => {
          console.log('Number of Projects '+projectQueryResult.rows.length);
          if(projectQueryResult.rowCount > 0)
          {
            response.send(projectQueryResult.rows);
          }
          else
          {
            response.send([]);
          }

        })
        .catch((projectQueryError) => {
          console.log('projectQueryError  : '+projectQueryError);
          response.send([]);
        })


      }
      else
      {
        response.send([]);
      }
  })
  .catch((excelReportError) =>{
      console.log('excelReportError : '+excelReportError);
      response.send([]);
  })

});




router.get('/geteventsTeams', verify, async function(req, res, next) {
    console.log('request.user ' + JSON.stringify(req.user));
    var userId = req.user.sfid;
    console.log('userId : ' + userId + ' ObjUser :' + JSON.stringify(req.user));

    var projTeampram = [],
        lstProjTeam = [];
    var taskparam = [],
        lsttask = [];
    var lstTeams = [];
    var teamParam = [];
    let teamMember = [];
    let teamMemberParam = [];
    teamMemberParam.push('$' + 1);
    teamMember.push(userId);
    var lstProject = [];

    console.log('req.query :' + req.query.date);
    var strdate = req.query.date;
    console.log('typeof date ' + typeof(strdate));
    var selectedDate = new Date(strdate);
    console.log('selectedDate   : ' + selectedDate);
    console.log('typeof(selectedDate)   : ' + typeof(selectedDate));
    var year = selectedDate.getFullYear();
    var month = selectedDate.getMonth();
    console.log('Month ' + selectedDate.getMonth());
    console.log('Year : ' + selectedDate.getFullYear());
    var numberOfDays = new Date(year, month + 1, 0).getDate();
    console.log('numberOfDays : ' + numberOfDays);
    let plannedHoursMap = new Map();
    let actualHoursMap = new Map();
    let projectTeamMap = new Map();
    let teamProjId = [];
    let twoDigitMonth;

    function convert(str) {
        var date = new Date(str),
            mnth = ("0" + (date.getMonth() + 1)).slice(-2),
            day = ("0" + date.getDate()).slice(-2);
        return [date.getFullYear(), mnth, day].join("-");
    }
    let projIdSet = new Set();

    let projectTeamQuery = 'SELECT projteam.id,projteam.name,projteam.sfid as sfid,projteam.Project__c as project__c,team.sfid as tsfid, team.Manager__c ' +
        'FROM  salesforce.Team__c team  ' +
        'INNER JOIN salesforce.Project_Team__c projteam  ON projteam.sfid =  team.Project_Team__c ' +
        'WHERE projteam.Project__c IS NOT NULL AND team.Manager__c = $1 ';
    console.log('All project Team ' + projectTeamQuery);
    pool.query(projectTeamQuery, [userId])
        .then(async (projTeamResult) => {
            console.log('projectsssds' + JSON.stringify(projTeamResult.rows));
            if (projTeamResult.rowCount > 0) {
                //  projTeampram.push('$' + 1);
                // lstProjTeam.push(userId);
                for (var i = 1; i <= projTeamResult.rows.length; i++) {
                    projTeampram.push('$' + i);
                    lstProjTeam.push(projTeamResult.rows[i - 1].tsfid);
                    //lstProject.push()
                    projIdSet.add(projTeamResult.rows[i - 1].project__c)
                    //  projectTeamMap.set(projTeamResult.rows[i-2].team__c,projTeamResult.rows[i-2].project__c);
                }
                lstProject = [...projIdSet]

                let ind = [];
                lstProject.forEach((dt,i)=>{
                    ind.push(`$${i+1}`)
                })



                let qrrr = `SELECT Id, sfid , Task_Assigned_by__c,Planned_Hours__c,Project_Name__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE sfid IS NOT NULL AND Assigned_Manager__c <> '${userId}'   `


                let resp22 = await pool.query(qrrr);
                let tskMap = {};
                resp22.rows.forEach(dt=>{
                    tskMap[dt.sfid] = dt;
                })

                let teamUserQuery = 'SELECT Representative__c FROM salesforce.Team_Member__c WHERE team__c IN (' + projTeampram.join(',') + ')';
                console.log('teamUserQuery ' + teamUserQuery);
                pool.query(teamUserQuery, lstProjTeam)
                    .then((memberQueryresult) => {
                        console.log('memberQueryresult ' + memberQueryresult.rowCount + ' ' + JSON.stringify(memberQueryresult.rows));

                        for (var i = 2; i <= memberQueryresult.rows.length + 1; i++) {
                            teamMemberParam.push('$' + i);
                            teamMember.push(memberQueryresult.rows[i - 2].representative__c);
                        }
                        console.log('Team Member involne in Team ' , teamMember , 'dollers ' , teamMemberParam);
                        console.log('project list ' + lstProject.length + ' gh  ' + lstProject);
                        let qry = 'SELECT Id, sfid , Task_Assigned_by__c,Planned_Hours__c,Project_Name__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE sfid IS NOT NULL AND Assigned_Manager__c IN ( ' + teamUserQuery + ' )'  //+ ` AND  Assigned_Manager__c IS NOT '${userId}' OR Task_Assigned_by__c =  '${userId}' `  ;
                        console.log('taskQuery ' + qry);
                        let lstSet = new Set()
                        pool.query(qry,lstProjTeam)
                            .then((taskQueryResult) => {
                                console.log('taskQueryResult Count' + taskQueryResult.rowCount);
                                //if (taskQueryResult.rowCount > 0) {
                                  taskQueryResult.rows.forEach(dt=>{
                                    tskMap[dt.sfid] = dt;
                                  })

                                  let temp1 = [];
                                  console.log('data=>>>>',JSON.stringify(tskMap))
                                  for(let key in tskMap){
                                    let tempObj = tskMap[key];
                                    console.log('tempObj',tempObj);
                                    if(lstProject.includes(tempObj.project_name__c) || tempObj.task_assigned_by__c == userId ){
                                          temp1.push(tempObj)
                                    }

                                  }


                                    temp1.forEach((eachTask) => {
                                        for (var i = 1; i <= lstProject.length; i++) {
                                            console.log('each prject inside if ' + lstProject[i - 1]);
                                           // if (eachTask.project_name__c == lstProject[i - 1]) {
                                                console.log('eachProject ' + lstProject[i - 1]);
                                                lstSet.add(eachTask.sfid)
                                                //lsttask.push(eachTask.sfid); //filter task ID for Timesheet Actual Hours
                                                var date = convert(eachTask.start_date__c);
                                                console.log('date xxx  ' + date + '  eachTask.planned_hours__c  xxxxx : ' + eachTask.planned_hours__c);

                                                console.log('plannedHoursMap.has(date)  xxx' + plannedHoursMap.has(date));
                                                console.log('Opposite plannedHoursMap.has(date)  xxx' + (!plannedHoursMap.has(date)));
                                                if (!plannedHoursMap.has(date)) {
                                                    plannedHoursMap.set(date, eachTask.planned_hours__c);
                                                    console.log('if Block ' + eachTask.planned_hours__c);
                                                    if (eachTask.planned_hours__c != null)
                                                        plannedHoursMap.set(date, eachTask.planned_hours__c);
                                                    else
                                                        plannedHoursMap.set(date, 0);
                                                } else {

                                                    let previousHours = plannedHoursMap.get(date);
                                                    console.log('date   ' + date + '  else Block Previous Hours : ' + previousHours);
                                                    let currentHours = eachTask.planned_hours__c;
                                                    console.log('date   ' + date + '  else Block Current Hours : ' + currentHours);
                                                    if (currentHours != null) {
                                                        console.log('date  xx' + date + 'previousHours + currentHours  ' + (previousHours + currentHours));
                                                        plannedHoursMap.set(date, previousHours + currentHours);
                                                    }
                                                }

                                           // }

                                        }
                                    })

                                    lsttask = [...lstSet]

                                    for (var i = 1; i <= lsttask.length; i++) {
                                        taskparam.push('$' + i);

                                    }
                                    console.log('task  param' + taskparam);
                                    console.log('task  param' + taskparam);
                                    let timeQuery = 'SELECT sfid, date__c, calculated_hours__c, project_task__c  FROM salesforce.Milestone1_Time__c WHERE project_task__c IN (' + taskparam.join(',') + ')' + ' AND sfid != \'' + '' + '\'';
                                    console.log('tiemquery ' + timeQuery);
                                    pool.query(timeQuery, lsttask)
                                        .then((timesheetQueryResult) => {
                                            console.log('timesheetQueryResult ' + timesheetQueryResult.rowCount);
                                           // if (timesheetQueryResult.rowCount > 0) {
                                                timesheetQueryResult.rows.forEach((eachTimesheet) => {
                                                    let fillingDate = convert(eachTimesheet.date__c);
                                                    console.log('fillingDate TeamView ' + fillingDate);
                                                    if (!actualHoursMap.has(fillingDate)) {
                                                        if (eachTimesheet.calculated_hours__c != null)
                                                            actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
                                                        else
                                                            actualHoursMap.set(fillingDate, 0);
                                                    } else {
                                                        let previousFilledHours = actualHoursMap.get(fillingDate);
                                                        let currentFilledHours = eachTimesheet.calculated_hours__c;
                                                        if (currentFilledHours != null) {
                                                            actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
                                                        } else
                                                            actualHoursMap.set(fillingDate, (previousFilledHours + 0));
                                                    }

                                                    for (let time of actualHoursMap) {
                                                        console.log('time  : ' + time);
                                                    }
                                                })

                                                var lstEvents = [];
                                                for (let i = 1; i <= numberOfDays; i++) {
                                                    let day = i;
                                                    twoDigitMonth = month + 1;
                                                    if (day >= 1 && day <= 9) {
                                                        day = '0' + i;
                                                    }
                                                    if (twoDigitMonth >= 1 && twoDigitMonth <= 9) {
                                                        twoDigitMonth = '0' + twoDigitMonth;
                                                    }

                                                    var date = year + '-' + twoDigitMonth + '-' + day;
                                                    console.log('date inside events ' + date);
                                                    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
                                                    if (plannedHoursMap.has(date)) {
                                                        console.log('plannedHoursMap.get(date)  : ' + plannedHoursMap.get(date));
                                                        lstEvents.push({
                                                            title: 'Planned Hours : ' + plannedHoursMap.get(date),
                                                            start: year + '-' + twoDigitMonth + '-' + day,
                                                        });

                                                    } else {
                                                        lstEvents.push({
                                                            title: 'Planned Hours : ' + '0',
                                                            start: year + '-' + twoDigitMonth + '-' + day,
                                                        });
                                                    }


                                                    if (actualHoursMap.has(date)) {
                                                        lstEvents.push({
                                                            title: 'Actual Hours : ' + actualHoursMap.get(date),
                                                            start: year + '-' + twoDigitMonth + '-' + day,
                                                        });
                                                    } else {
                                                        lstEvents.push({
                                                            title: 'Actual Hours : ' + '0',
                                                            start: year + '-' + twoDigitMonth + '-' + day,
                                                        });
                                                    }

                                                    lstEvents.push({
                                                        title: 'Create Task',
                                                        start: year + '-' + twoDigitMonth + '-' + day,
                                                    });
                                                    /*lstEvents.push({
                                                      title : 'Details',
                                                      start : year+'-'+twoDigitMonth+'-'+day,   
                                                    });
                                                    */
                                                    lstEvents.push({
                                                        title: 'Fill Actuals',
                                                        start: year + '-' + twoDigitMonth + '-' + day,
                                                    });

                                                }
                                                console.log('JSON.strigify teamView' + JSON.stringify(lstEvents));
                                                res.send(lstEvents);


                                           // }

                                        })
                                        .catch((error) => {
                                            console.log('eroro in Task Query ' + JSON.stringify(error.stack));
                                        })


                                //}

                            })
                            .catch((error) => {
                                console.log('eroro in Task Query ' + JSON.stringify(error.stack));
                            })

                    })
                    .catch((error) => {
                        console.log('eroro in member Query ' + JSON.stringify(error.stack));
                    })
            } else {

                var lstEvents = [];
                for (let i = 1; i <= numberOfDays; i++) {
                    let day = i;
                    twoDigitMonth = month + 1;
                    if (day >= 1 && day <= 9) {
                        day = '0' + i;
                    }
                    if (twoDigitMonth >= 1 && twoDigitMonth <= 9) {
                        twoDigitMonth = '0' + twoDigitMonth;
                    }

                    var date = year + '-' + twoDigitMonth + '-' + day;
                    console.log('date inside events ' + date);
                    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
                    if (plannedHoursMap.has(date)) {
                        console.log('plannedHoursMap.get(date)  : ' + plannedHoursMap.get(date));
                        lstEvents.push({
                            title: 'Planned Hours : ' + plannedHoursMap.get(date),
                            start: year + '-' + twoDigitMonth + '-' + day,
                        });

                    } else {
                        lstEvents.push({
                            title: 'Planned Hours : ' + '0',
                            start: year + '-' + twoDigitMonth + '-' + day,
                        });
                    }


                    if (actualHoursMap.has(date)) {
                        lstEvents.push({
                            title: 'Actual Hours : ' + actualHoursMap.get(date),
                            start: year + '-' + twoDigitMonth + '-' + day,
                        });
                    } else {
                        lstEvents.push({
                            title: 'Actual Hours : ' + '0',
                            start: year + '-' + twoDigitMonth + '-' + day,
                        });
                    }

                    lstEvents.push({
                        title: 'Create Task',
                        start: year + '-' + twoDigitMonth + '-' + day,
                    });
                    /*lstEvents.push({
                      title : 'Details',
                      start : year+'-'+twoDigitMonth+'-'+day,   
                    });
                    */
                    lstEvents.push({
                        title: 'Fill Actuals',
                        start: year + '-' + twoDigitMonth + '-' + day,
                    });

                }
                console.log('JSON.strigify teamView' + JSON.stringify(lstEvents));
                res.send(lstEvents);

            }


        })
        .catch((error) => {
            console.log('eroro in PRojectTEam ' + JSON.stringify(error.stack));
        })
})



 module.exports = router;
