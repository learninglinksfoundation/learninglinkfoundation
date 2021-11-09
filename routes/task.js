const express = require('express');
const pool = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const format = require('pg-format');
const Router = require('express-promise-router');
const joi = require('@hapi/joi');
const { query } = require('express');

const router = new Router();
router.get('/TaskListView',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    let vendorId = request.query.vendorId;
    console.log('task Id =>'+vendorId);
    response.render('TaskListView',{objUser,vendorId});

})
router.get('/TaskListView/:activityId',verify,(request,response)=>{
    let objUser=request.user;
    let activityCode = request.params.activityCode;
    console.log('user '+objUser);
    let vendorId = request.query.vendorId;
    console.log('task Id =>'+vendorId);
    response.render('TaskListView',{objUser,vendorId, activityCode:activityId});

})
router.get('/taskList',verify,async(request,response)=>{

    let objUser = request.user; let projectIdParams = [] ; let lstProjectIds = [];
    await
    pool.query('select id, sfid,project__c from salesforce.Heroku_Visibility__c where to_contact__c = $1 and hastaskaccess__c = $2', [objUser.sfid, true])
    .then((result)=>{
            if(result.rowCount > 0)
            {
                let herokuVisibiltyRows = result.rows;
                for(let k=0 ; k < herokuVisibiltyRows.length ; k++)
                {
                    lstProjectIds.push(herokuVisibiltyRows[k].project__c);
                    projectIdParams.push('$'+(k+1));
                } 
            }
            
    })
    .catch((error)=>{
        console.log('heroku visibility error : '+error.stack);
    })

    console.log('lstProjectIds  : '+lstProjectIds);
    console.log('projectIdParams  : '+projectIdParams);
/*    let qry;
    if(request.query.activityCode){
        console.log('inside iffff', request.query.activityCode)
        let activityCode = request.query.activityCode;
        qry = pool
         .query('SELECT sfid, Task_Stage__c, Name,Project_Name2__c	,Activity_Code_Name__c,Project_Task_Category_Name__c,CreatedById,CreatedDate,Id,IsDeleted,estimated_expense__c,start_date__c,due_date__c,actual_start_date__c,actual_end_date__c,LastActivityDate,LastModifiedById,LastModifiedDate,LastReferencedDate,LastViewedDate '+
         'FROM salesforce.Milestone1_Task__c WHERE Activity_Codes__c =$1',[activityCode])
    }else {
        qry =pool
      //  .query('SELECT * FROM salesforce.Milestone1_Task__c WHERE sfid IS NOT NULL');
        .query('SELECT sfid, Task_Stage__c,total_hours__c, Name,Project_Name2__c	,Activity_Code_Name__c,Project_Task_Category_Name__c,CreatedById,CreatedDate,Id,IsDeleted,estimated_expense__c,start_date__c,due_date__c,actual_start_date__c,actual_end_date__c,LastActivityDate,LastModifiedById,LastModifiedDate,LastReferencedDate,LastViewedDate '+
        'FROM salesforce.Milestone1_Task__c WHERE project_task_category_name__c != $1 AND sfid IS NOT NULL',['Timesheets']);
    }
     console.log('qry  =>'+qry);  */

    let projectTaskCategoryName = 'Timesheets';
    let queryTxt = 'SELECT sfid, Task_Stage__c,total_hours__c, Name,Project_Name2__c ,Activity_Code_Name__c,Project_Task_Category_Name__c,CreatedById,CreatedDate,Id,IsDeleted,estimated_expense__c,start_date__c,due_date__c,actual_start_date__c,actual_end_date__c,LastActivityDate,LastModifiedById,LastModifiedDate,LastReferencedDate,LastViewedDate '+
    'FROM salesforce.Milestone1_Task__c WHERE project_task_category_name__c != \''+projectTaskCategoryName+'\' AND  Project_Name__c IN (' + projectIdParams.join(',') + ')';

     console.log('queryTxt  : '+queryTxt);

     await
     pool.query(queryTxt,lstProjectIds)
    .then((taskListResult) => {
         console.log('activityCodeListResult  : '+JSON.stringify(taskListResult.rows));
         if(taskListResult.rowCount>0){

            let modifiedList = [],i =1;
            taskListResult.rows.forEach((eachRecord) => {
              let obj = {};
              let crDate = new Date(eachRecord.createddate);
              crDate.setHours(crDate.getHours() + 5);
              crDate.setMinutes(crDate.getMinutes() + 30);
              let strDate = crDate.toLocaleString();
          //    obj.sequence = i;
              obj.selectAction = '<input type="checkbox" id="' + eachRecord.sfid + '" name="' + eachRecord.sfid + '" value="' + eachRecord.sfid + '">'
              obj.editAction = '<button href="#" class="btn btn-primary editTask" id="'+eachRecord.sfid+'" >Edit</button>'
              obj.name = '<a href="#" class="ActivityTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
              obj.status = eachRecord.task_stage__c;
              obj.project = eachRecord.project_name2__c	;
              obj.activityCode = eachRecord.activity_code_name__c;
              obj.projectTaskCategory=eachRecord.project_task_category_name__c;
              obj.estimated_expense__c=eachRecord.estimated_expense__c;
              obj.start_date__c=eachRecord.start_date__c != null ? eachRecord.start_date__c.toLocaleString().split(',')[0]: eachRecord.start_date__c; 
              obj.due_date__c=eachRecord.due_date__c !=null ? eachRecord.due_date__c.toLocaleString().split(',')[0]: eachRecord.due_date__c;
              obj.actual_start_date__c=eachRecord.actual_start_date__c!=null ? eachRecord.actual_start_date__c.toLocaleString().split(',')[0]: eachRecord.actual_start_date__c;
              obj.actual_end_date__c=eachRecord.actual_end_date__c !=null ? eachRecord.actual_end_date__c.toLocaleString().split(',')[0] : eachRecord.actual_end_date__c;
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
     .catch((error) => {
         console.log('error  : '+error.stack);
         response.send('Error Occurred !');
     })
})



router.get('/getTaskDetails',async(request,response)=>{
    let activityCode=request.query.taskCodeId;
    console.log('task details '+activityCode);
    
    let qry ='';
    console.log('qry Detail =>'+qry);
    let recordDeatil= {};
    let projectId ;
    let activity ;
    await
    pool
    .query('select sfid, Task_Stage__c,activity_code_name__c, Name,Project_Name__c,Project_Name2__c,Project_Milestone__c,Activity_Code_Name__c,Project_Task_Category_Name__c,Start_Date__c,Due_Date__c,Pro_Rate_Analysis__c,Grant_Utilization_On_Pro_Rate_Basis__c,Description__c,Actual_Start_Date__c,Actual_End_Date__c,Today_s_Date__c,Actual_Hours__c,Estimated_Hours__c,Estimated_Expense__c,CreatedById,CreatedDate,Id '+
    'FROM salesforce.Milestone1_Task__c where sfid =$1 ',[activityCode])
    .then((queryResult)=>{
        console.log('queryResult +>'+JSON.stringify(queryResult.rows));
        recordDeatil.ActivityCodeDetail=queryResult.rows;
        if(recordDeatil !=null){
            console.log('hello i am inside Procurement Activity Code');
            
                          pool
                          .query('SELECT sfid, Project_Name__c FROM salesforce.Milestone1_Task__c WHERE  sfid = $1',[activityCode])
                          .then((taskQueryResult) => {
                            console.log('taskQueryResult :' +JSON.stringify(taskQueryResult.rows));
                            if(taskQueryResult.rowCount > 0)
                            {
                               activity = taskQueryResult.rows[0] ;
                               console.log('activity ++ '+activity);
                              projectId = activity.project_name__c;
                              console.log('Inside Procurement query  : '+projectId);
                              pool
                              .query('Select sfid , Name FROM salesforce.Activity_Code__c where Project__c = $1', [projectId])
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
                                  console.log('lstActivityCode ++ '+lstActivityCode);
                                  recordDeatil.activity = lstActivityCode;
                                  
                                //  details.push(lstActivityCode);
                                  //response.send(objData);
                                }
                              })
                              .catch((activityCodeQueryError) => {
                                console.log('activityCodeQueryError  : '+activityCodeQueryError.stack);
                                response.send([]);
                              })
                            }
                          })
                          .catch((projectQueryError) =>
                              {
                            console.log('projectQueryError  : '+projectQueryError.stack);
                             })
        }
     
        if(recordDeatil.ActivityCodeDetail[0].start_date__c !=null){
            let crDate = new Date(recordDeatil.ActivityCodeDetail[0].start_date__c);
                crDate.setHours(crDate.getHours() + 5);
                crDate.setMinutes(crDate.getMinutes() + 30);
                let strDate = crDate.toLocaleString();
            recordDeatil.ActivityCodeDetail[0].start_date__c= formatDate(strDate.split(',')[0])
        }  
        if(recordDeatil.ActivityCodeDetail[0].due_date__c !=null){
            let crDate = new Date(recordDeatil.ActivityCodeDetail[0].due_date__c);
                crDate.setHours(crDate.getHours() + 5);
                crDate.setMinutes(crDate.getMinutes() + 30);
                let strDate = crDate.toLocaleString();
            recordDeatil.ActivityCodeDetail[0].due_date__c= formatDate(strDate.split(',')[0])
        }  
        if(recordDeatil.ActivityCodeDetail[0].actual_start_date__c !=null){
            let crDate = new Date(recordDeatil.ActivityCodeDetail[0].actual_start_date__c);
                crDate.setHours(crDate.getHours() + 5);
                crDate.setMinutes(crDate.getMinutes() + 30);
                let strDate = crDate.toLocaleString();
            recordDeatil.ActivityCodeDetail[0].actual_start_date__c= formatDate(strDate.split(',')[0])
        }  
        if(recordDeatil.ActivityCodeDetail[0].actual_end_date__c !=null){
            let crDate = new Date(recordDeatil.ActivityCodeDetail[0].actual_end_date__c);
                crDate.setHours(crDate.getHours() + 5);
                crDate.setMinutes(crDate.getMinutes() + 30);
                let strDate = crDate.toLocaleString();
            recordDeatil.ActivityCodeDetail[0].actual_end_date__c= formatDate(strDate.split(',')[0])
        }  
        if(recordDeatil.ActivityCodeDetail[0].today_s_date__c !=null){
            let crDate = new Date();
                crDate.setHours(crDate.getHours() + 5);
                crDate.setMinutes(crDate.getMinutes() + 30);
                let strDate = crDate.toLocaleString();
            recordDeatil.ActivityCodeDetail[0].today_s_date__c= formatDate(strDate.split(',')[0])
        }  
        console.log('record '+recordDeatil);
      
                               
        response.send(recordDeatil);
    })
    .catch((error)=>{
        console.log('error =>'+JSON.stringify(error.stack));
        response.send(error);
    })
console.log('reccord' +recordDeatil);

})

router.post('/deleteAllTaskList', (request, response) => {
    var projectParams = [], lstProjectId = [];
    var data = request.body['taskListArray[]'];
    console.log("new data", typeof data);
    console.log('dattaa=======  ', data);
    if (typeof data == 'object') {
        const objectArray = data;
        console.log('objectArray>>>>>>>>>>>>>', objectArray)
        for (var i = 0; i < objectArray.length; i++) {
            projectParams.push('$' + (i + 1));
            lstProjectId.push(objectArray[i])
            console.log('lstProjectId>>>>>>>>>>>>  ' + lstProjectId);
        }
        console.log('sfid before deltet>>>>>>>>>HHHHHHHHH>>>', lstProjectId)
        console.log('sfid before deltet>>>>>>$111111>>>>>>', projectParams)
    
        pool
            .query('DELETE FROM salesforce.Milestone1_Task__c WHERE sfid IN (' + projectParams.join(',') + ') ', lstProjectId)
            .then((deleteActivityCodeResult) => {
                console.log('deleteActivityCodeResult =>>' + JSON.stringify(deleteActivityCodeResult));
                response.send('Success');
            })
            .catch((deleteError) => {
                console.log('deleteError' + deleteError.stack);
                response.send('Error');
            })
    } else {
        lstProjectId = data;
        // projectParams = '$1';

        let deleteQuerry = 'DELETE FROM salesforce.Milestone1_Task__c ' +
            'WHERE sfid = $1';
        console.log('deleteQuerry  ' + deleteQuerry);
        pool
            .query(deleteQuerry, [lstProjectId])
            .then((deleteQuerry) => {
                console.log('deleteQuerry =>>' + JSON.stringify(deleteQuerry));
                response.send('Success');
            })
            .catch((deleteError) => {
                console.log('deleteError' + deleteError.stack);
                response.send('Error');
            })
    }
})
router.post('/updateTask',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { name,status,project,activityCode,projecttaskcategory,StartDate,DueDate,Description,Actual_Start_Date,Actual_End_Date,Estimated_Hours,Estimated_Expense,hide} = request.body;
    console.log('ActivityCode id  '+hide);
    console.log('activityCode  : '+activityCode);
    console.log('request body=======  ',request.body);
    schema = joi.object({
        name: joi.string().required().label('Please Fill Project Task Name')
    })
    result = schema.validate({ name: name });

    if (result.error) {
        console.log('fd' + result.error);
        response.send(result.error.details[0].context.label);
    }else {
        let updateQuerry;
        if(Actual_Start_Date=="" || Actual_End_Date==""){
            updateQuerry = 'UPDATE salesforce.Milestone1_Task__c SET '+
            'Name = \''+name+'\', '+
            'Task_Stage__c = \''+status+'\', '+
            'Activity_Codes__c = \''+activityCode+'\', '+
            'Project_Task_Category__c = \''+projecttaskcategory+'\', '+
            'Start_Date__c = \''+StartDate+'\', '+
            'Due_Date__c = \''+DueDate+'\', '+
            'Description__c = \''+Description+'\', '+
            'Estimated_Hours__c = \''+Estimated_Hours+'\', '+
            'External_ID__c = \''+hide+'\', '+
            'Estimated_Expense__c = \''+Estimated_Expense+'\' '+'WHERE sfid = $1';
        }else {
            updateQuerry = 'UPDATE salesforce.Milestone1_Task__c SET '+
                                 'Name = \''+name+'\', '+
                                 'Task_Stage__c = \''+status+'\', '+
                                 'Activity_Codes__c = \''+activityCode+'\', '+
                                 'Project_Task_Category__c = \''+projecttaskcategory+'\', '+
                                 'Start_Date__c = \''+StartDate+'\', '+
                                 'Due_Date__c = \''+DueDate+'\', '+
                                 'Description__c = \''+Description+'\', '+
                                 'Actual_Start_Date__c = \''+Actual_Start_Date+'\', '+
                                 'Actual_End_Date__c = \''+Actual_End_Date+'\', '+
                                 'Estimated_Hours__c = \''+Estimated_Hours+'\', '+
                                 'External_ID__c = \''+hide+'\', '+
                                 'Estimated_Expense__c = \''+Estimated_Expense+'\' '+'WHERE sfid = $1';
        }
      console.log('updateQuerry  '+updateQuerry);
        pool
        .query(updateQuerry,[hide])
        .then((updateQuerryResult) => {     
                 console.log('updateQuerryResult =>>'+JSON.stringify(updateQuerryResult));
                 response.send('Success');
        })
        .catch((updatetError) => {
             console.log('updatetError'+updatetError.stack);
             response.send('Error');
        })
    }
})

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}
//get Activity Code for project on task
router.get('/getActivityCode',async(request,response)=>{
    let projectId=request.query.projectId;
    console.log('projectId ',projectId);
    
    let qry ='';
    let recordDeatil={};
    pool
         .query('SELECT id,sfid, name, activity_code_name__c '+
         'FROM salesforce.activity_code__c WHERE sfid != \'null\' AND project__c =$1',[projectId])
    .then((queryResult)=>{
        console.log('queryResult +>'+JSON.stringify(queryResult.rows));
        recordDeatil.ActivityCodeDetail=queryResult.rows;  
        console.log('reccord' +recordDeatil);
        response.send(recordDeatil);
    })
    .catch((error)=>{
        console.log('error =>'+JSON.stringify(error.stack));
        response.send(error);
    })
})


//create task
router.post('/createTask',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { name,statusCreate,projectDropdown,activitycodes,projecttaskcategorycreate,StartDate,DueDate,Description,Actual_Start_Date,Actual_End_Date,Estimated_Hours,Estimated_Expense} = request.body;
    
    console.log('request body=======  ',request.body);
    schema = joi.object({
        name: joi.string().required().label('Please Fill Project Task Name')
    })
    result = schema.validate({ name: name });
    // SELECT Id, Name FROM salesforce.RecordType WHERE sObjectType = 'Milestone1_Task__c' AND name = 'Project tasks'
    //above query need to implement for fetching dynamic RecordTypeId;  
    if (result.error) {
        console.log('fd' + result.error);
        response.send(result.error.details[0].context.label);
    }else {
        let queryResult;
        if(Actual_Start_Date=="" || Actual_End_Date==""){
            
            queryResult= pool.query('INSERT INTO salesforce.Milestone1_Task__c (Name,Task_Stage__c,Project_Name__c,Activity_Codes__c,Project_Task_Category__c,Start_Date__c,Due_Date__c,Description__c,Estimated_Hours__c,Estimated_Expense__c, RecordTypeId ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[name,statusCreate,projectDropdown,activitycodes, projecttaskcategorycreate,StartDate,DueDate,Description,Estimated_Hours,Estimated_Expense,'0122y00000005mLAAQ']) 
        }else {
            queryResult= pool
            .query('INSERT INTO salesforce.Milestone1_Task__c (Name,Task_Stage__c,Project_Name__c,Activity_Codes__c,Project_Task_Category__c,Start_Date__c,Due_Date__c,Description__c,Actual_Start_Date__c,Actual_End_Date__c,Estimated_Hours__c,Estimated_Expense__c, RecordTypeId ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[name,statusCreate,projectDropdown,activitycodes, projecttaskcategorycreate,StartDate,DueDate,Description,Actual_Start_Date,Actual_End_Date,Estimated_Hours,Estimated_Expense,'0122y00000005mLAAQ'])
        }
        queryResult.then((updateQuerryResult) => {     
                 console.log('updateQuerryResult =>>'+JSON.stringify(updateQuerryResult));
                 response.send('Success');
        })
        .catch((updatetError) => {
             console.log('updatetError'+updatetError.stack);
             response.send('Error');
        })
    }
})
function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

module.exports = router;
