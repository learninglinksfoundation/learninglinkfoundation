const express = require('express');
const pool = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const format = require('pg-format');
const Router = require('express-promise-router');
const joi = require('@hapi/joi');
const { query } = require('express');

const router = new Router();

router.get('/expenseApprovals',verify, (request, response) => {
    let objUser = request.user;
    response.render('./approvals/expenseApprovals',{objUser});

});


router.get('/expenseApprovalsList',verify, (request, response) => {
    let objUser = request.user;
    pool.query('SELECT sfid, Submitter_Heroku__c, status__c, createddate,record_name__c, amount__c, expense__c FROM salesforce.Custom_Approval__c WHERE Approval_Type__c = $1 AND Approver_RM__c = $2 ',['Expense', objUser.sfid])
    .then((customApprovalResult) => {
            console.log('customApprovalResult  : '+JSON.stringify(customApprovalResult.rows));
            if(customApprovalResult.rowCount > 0)
            {
                let lstApprovalRecords = [];
                for(let i=0, len = customApprovalResult.rows.length ; i < len ; i++ )
                {
                    let crDate = new Date(customApprovalResult.rows[i].createddate);
                    crDate.setHours(crDate.getHours() + 5);
                    crDate.setMinutes(crDate.getMinutes() + 30);
                    let strDate = crDate.toLocaleString();
                    let obj = {};
                    obj.sequence = (i+1);
                    obj.recordName = '<a href="#" data-toggle="modal" data-target=""  id="name'+customApprovalResult.rows[i].expense__c+'" class="expnseRecordName" >'+customApprovalResult.rows[i].record_name__c+'</a>';
                    obj.currentStatus = customApprovalResult.rows[i].status__c;
                    obj.totalAmount = customApprovalResult.rows[i].amount__c;
                    obj.createdDate = strDate;
                    if(customApprovalResult.rows[i].status__c == 'Approved' || customApprovalResult.rows[i].status__c == 'Rejected')
                    {
                        //obj.approveBtn = '<button class="btn btn-primary approvalButton"  disabled = "true"  id="Approved-'+customApprovalResult.rows[i].expense__c+'@'+customApprovalResult.rows[i].sfid+'" >Approve</button>';
                        obj.approveBtn = '<button href="#" class="btn btn-primary approvalpopup"  disabled = "true"  id="Approved-'+customApprovalResult.rows[i].expense__c+'@'+customApprovalResult.rows[i].sfid+'" >Approve</button>';
                        obj.rejectBtn = '<button href="#" class="btn btn-danger approvalpopup" disabled = "true"  id="Rejected-'+customApprovalResult.rows[i].expense__c+'@'+customApprovalResult.rows[i].sfid+'" >Reject</button>';
                      //  obj.rejectBtn = '<button class="btn btn-danger approvalButton" disabled = "true"  id="Rejected-'+customApprovalResult.rows[i].expense__c+'@'+customApprovalResult.rows[i].sfid+'" >Reject</button>';
         
                    }
                   else
                   {
                  //  obj.approveBtn = '<button class="btn btn-primary approvalButton" id="Approved-'+customApprovalResult.rows[i].expense__c+'@'+customApprovalResult.rows[i].sfid+'" >Approve</button>';
                  //  obj.rejectBtn = '<button class="btn btn-danger approvalButton" id="Rejected-'+customApprovalResult.rows[i].expense__c+'@'+customApprovalResult.rows[i].sfid+'" >Reject</button>';
                    obj.approveBtn = '<button href="#" class="btn btn-primary approvalpopup" id="Approved-'+customApprovalResult.rows[i].expense__c+'@'+customApprovalResult.rows[i].sfid+'" >Approve</button>';
                    obj.rejectBtn = '<button href="#" class="btn btn-danger approvalpopup" id="Rejected-'+customApprovalResult.rows[i].expense__c+'@'+customApprovalResult.rows[i].sfid+'" >Reject</button>';
  
                }

                    lstApprovalRecords.push(obj);
                }
                response.send(lstApprovalRecords);
            }
            else
                response.send([]);
    })
    .catch((customApprovalError) => {
            console.log('customApprovalError  : '+customApprovalError.stack);
            response.send([]);
    });

});



router.get('/pldFormApprovals',verify, (request, response) => {
    let objUser = request.user;
    response.render('./approvals/pldFormApprovals',{objUser});

});



router.get('/pldFormsApprovalList', verify, (request, response) => {
    let objUser = request.user;

    pool.query('SELECT app.Submitter_Heroku__c, app.status__c, app.createddate, pldresp.createddate, app.record_name__c, app.expense__c, pldresp.name FROM salesforce.Custom_Approval__c as app INNER JOIN salesforce.Project_Survey_Response__c as pldresp ON app.expense__c = pldresp.sfid WHERE Approval_Type__c = $1 AND Assign_To__c = $2 ',['PldForm', objUser.sfid])
    .then((customApprovalResult) => {
            console.log('customApprovalResult  : '+JSON.stringify(customApprovalResult.rows));
            if(customApprovalResult.rowCount > 0)
            {
                let lstApprovalRecords = [];
                for(let i=0, len = customApprovalResult.rows.length ; i < len ; i++ )
                {
                    let crDate = new Date(customApprovalResult.rows[i].createddate);
                    console.log('crDate  : '+crDate);
                    let strDate = crDate.toLocaleString();
                    console.log('strDate  :'+strDate);
                    let dateTime = new Date(customApprovalResult.rows[i].createddate);
                   dateTime.setHours(dateTime.getHours() + 5);
                   dateTime.setMinutes(dateTime.getMinutes() + 30);
                  //  dateTime =  dateTime.toLocaleString();
                  //  console.log('dateTime   : '+dateTime);
                    let obj = {};
                    obj.sequence = (i+1);
                    obj.recordName = '<a href="https://learninglinksfoundationdonor.secure.force.com/responsepdf?Id='+customApprovalResult.rows[i].expense__c+'" target="_blank"  id="name'+customApprovalResult.rows[i].expense__c+'" class="pldResponseName" >'+customApprovalResult.rows[i].name+'</a>';
                    obj.currentStatus = customApprovalResult.rows[i].status__c;
                    obj.createdDate =  dateTime.toLocaleString();
                  //  obj.status = assetQueryResult.rows[i].status__c
                    if(customApprovalResult.rows[i].status__c == 'Approved' || customApprovalResult.rows[i].status__c == 'Rejected' )
                    {
                      obj.approveBtn = '<button class="btn btn-primary approveResponse" disabled = "true" id="approve'+customApprovalResult.rows[i].expense__c+'"  >Approve</button>';
                      obj.rejectBtn = '<button class="btn btn-danger rejectResponse" disabled = "true" id="reject'+customApprovalResult.rows[i].expense__c+'" >Reject</button>';
                    }
                   else
                   {
                    obj.approveBtn = '<button class="btn btn-primary approveResponse" id="approve'+customApprovalResult.rows[i].expense__c+'"  >Approve</button>';
                    obj.rejectBtn = '<button class="btn btn-danger rejectResponse" id="reject'+customApprovalResult.rows[i].expense__c+'" >Reject</button>';
                  }
                    
                    lstApprovalRecords.push(obj);
                }
                response.send(lstApprovalRecords);
            }
            else
                response.send([]);
    })
    .catch((customApprovalError) => {
            console.log('customApprovalError  : '+customApprovalError.stack);
            response.send([]);
    });


});



router.post('/pldApprovalFeedback',verify, (request,response) => {

    let objUser = request.user;
    let body = request.body;
    let statusToSet = '';
    if(body.type == 'approve')
    {
        statusToSet = 'Approved';
    }
    else
    {
        statusToSet = 'Rejected';
    }
    console.log('statusToSet  : '+statusToSet);



    pool.query('UPDATE salesforce.Project_Survey_Response__c SET Approval_Status__c = $1 WHERE sfid = $2',[statusToSet,body.responseId])
    .then((responseUpdateQuery) => {
            if(responseUpdateQuery.rowCount > 0)
            {
                let updateQueryText = 'UPDATE salesforce.Custom_Approval__c SET  '+
                          'status__c = \''+statusToSet+'\' '+
                          'WHERE Assign_To__c = $1 AND Approval_Type__c = $2 AND expense__c = $3 ';

                console.log('updateQueryText  : '+updateQueryText);
                console.log('objUser.Id  :  '+objUser.Id+' body.responseId  : '+body.responseId);
                pool
                .query(updateQueryText,[objUser.sfid, 'PldForm', body.responseId])
                .then((approvalFeedbackResult) => {
                        console.log('approvalFeedbackResult  '+JSON.stringify(approvalFeedbackResult));
                        response.send('Success');
                })
                .catch((approvalFeedbackError) => {
                    console.log('approvalFeedbackError  '+approvalFeedbackError.stack);
                    response.send('Error');
                })
            }
            else
            {
                response.send('Error');
            }

    })
    .catch((responseUpdateQueryError) => {
        console.log('approvalFeedbackError  '+approvalFeedbackError.stack);
        response.send('Error');
    })
            
                    

    
    
 
});

router.get('/getApprovalListView/:parentId',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    let parentId = request.params.parentId;
    console.log('parentId  '+parentId);
    response.render('approvalListView',{objUser,parentId:parentId});
  })

  router.get('/approvalinfo', (request, response) =>
   {
      let sfid = "a1e0p000000KH9qAAG" ;
   let qry ='SELECT app.sfid, app.name, app.Approval_Type__c,app.Status__c,asset.name as assetname, app.Submitted_By_Salesforce_User__c, app.Approver_s_Emails__c, app.Approval_Comment__c, app.Submitted_By_Heroku_User__c '+
   'FROM salesforce.Approval__c app '+
   'INNER JOIN salesforce.asset_requisition_form__c asset '+
   'ON app.Asset_Requisition_Form__c = asset.sfid '+
   'WHERE app.sfid = $1 ';
   console.log('qry  :'+qry+' sfid '+sfid);
    pool
    .query(qry,[sfid])
    .then((approvalQueryResult) => {
    console.log('approvalQueryResult.rows[0]  '+JSON.stringify(approvalQueryResult.rows));
        if(approvalQueryResult.rowCount > 0 )
               {
                 userId = approvalQueryResult.rows[0].sfid;
                 objUser2 = approvalQueryResult.rows[0];
                  response.render('./approvals/approval.ejs',{objUser2});
                }})
     .catch((InfoError) =>
          {
          console.log('InfoError   :  '+InfoError.stack);
          });
     });   

     //approval list view query

     router.get('/approvalList',(request,response)=>{
    let parentId=request.query.parentId;
    console.log('parentId '+parentId);
    console.log('Your are inside the Approvel List Router method');
    let qry ='SELECT app.sfid, app.name as appname, app.Approval_Type__c,app.Status__c,asset.name as assetname, app.Submitted_By_Salesforce_User__c, app.Approver_s_Emails__c, app.Approval_Comment__c, app.Submitted_By_Heroku_User__c '+
    'FROM salesforce.Approval__c app '+
    'INNER JOIN salesforce.asset_requisition_form__c asset '+
    'ON app.Asset_Requisition_Form__c = asset.sfid '+
      'WHERE app.asset_requisition_form__c = $1';
            console.log('qyer '+qry)
     pool
    .query(qry,[parentId])
    .then((querryResult)=>{
        console.log('querryResult'+JSON.stringify(querryResult.rows)+'ROWCOUNT: '+querryResult.rowCount);
        if(querryResult.rowCount>0){

            let approvalList = [],i =1;
            querryResult.rows.forEach((eachRecord) => {
              let obj = {};
              obj.name = '<a href="#" class="approveTag" id="'+eachRecord.sfid+'" >'+eachRecord.appname+'</a>';
              obj.type = eachRecord.approval_type__c;
              obj.asset = eachRecord.assetname;
              obj.status = eachRecord.status__c;
              obj.comment = eachRecord.approval_comment__c;
              obj.email = eachRecord.approver_s_emails__c;
              i= i+1;
              approvalList.push(obj);
            })
            response.send(approvalList);
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
router.get('/getApprovalDetail',verify, async(request,response)=>{
 
    let approvalId=request.query.approvalId;
    
    console.log('getApprovalDetail Id='+approvalId);
    
    var approvalFormAndRelatedRecords = {};

    let qry ='SELECT app.sfid, app.name as appname, app.Approval_Type__c,app.Status__c,asset.name as assetname, app.Submitted_By_Salesforce_User__c, app.Approver_s_Emails__c, app.Approval_Comment__c, app.Submitted_By_Heroku_User__c '+
      'FROM salesforce.Approval__c app '+
      'INNER JOIN salesforce.asset_requisition_form__c asset '+
      'ON app.Asset_Requisition_Form__c = asset.sfid '+
      'WHERE app.sfid = $1 ';
      console.log('qry '+qry);
        await
        pool
        .query(qry,[approvalId])
        .then((querryResult)=>{
            if(querryResult.rowCount > 0)
            {
                console.log('querryResult  '+querryResult.rows);
                approvalFormAndRelatedRecords.approvalFormDetails = querryResult.rows;        
            }
            else
            {
                approvalFormAndRelatedRecords.approvalFormDetails = [];
            }
                //console.log('QuerryResult=>'+JSON.stringify(querryResult.rows));
            //response.send(querryResult.rows);
        })
        .catch((approvalQueryError)=> {
            console.log('approvalQueryError  : '+approvalQueryError.stack);
            approvalFormAndRelatedRecords.approvalFormDetails = [];
        })
    

        let query ='SELECT hist.sfid, hist.name as histname, hist.Status__c,app.name as appname, hist.Approver_Email__c, hist.Comment__c, hist.approver_profile__c '+
        'FROM salesforce.approval_history__c hist '+
        'INNER JOIN salesforce.approval__c app '+
        'ON hist.approval__c = app.sfid '+
        'WHERE app.sfid = $1 ';
        console.log('query '+query);
          await
          pool
          .query(query,[approvalId])
        .then((approvalHistoryResult)=> {
                if(approvalHistoryResult.rowCount > 0)
                {   
                        console.log('approvalHistoryResult  '+approvalHistoryResult.rows);
                        approvalFormAndRelatedRecords.relatedHistrory = approvalHistoryResult.rows;
                }
                else
                {
                    approvalFormAndRelatedRecords.relatedHistrory = [];
                }
    
        })
        .catch((relatedHistroryError)=> {
            console.log('relatedHistroryError  '+relatedHistroryError.stack);
            approvalFormAndRelatedRecords.relatedHistrory = [];
        })
        response.send(approvalFormAndRelatedRecords);

      })


router.get('/getExpenseApprovalDetail',verify, async(request,response)=>{
 
        let approvalId=request.query.approvalId;
        let conId ='';
        
        console.log('getApprovalDetail Id='+approvalId);
        
        var approvalFormAndRelatedRecords = {};

         let qryTest='SELECT sfid ,name,Approver_PM__c,Approver_RM__c FROM salesforce.Custom_Approval__c app where app.sfid = $1 '; 
              
         let qryRM ='SELECT app.sfid as appsdif ,app.name as appname , app.Approval_Type__c, app.comment__c,app.Reporting_Manager_Comment__c, app.Submitter_Heroku__c, '+
          'app.Project_Manager_Comment__c, app.Status__c,  app.Approver_RM__c,con.name as conname,exp.name as expname,con2.name as submitter, '+
          'app.Amount__c,app.createddate, app.Expense__c,app.Assign_To_PM__c,app.Project_Manager_Approval_Status__c, app.Project_Manager_Comment__c, app.Approver_PM__c '+
          'FROM salesforce.Custom_Approval__c app '+
          'INNER JOIN salesforce.Contact con ON app.Approver_RM__c=con.sfid '+
          'INNER JOIN salesforce.Contact con2 ON app.submitter_heroku__c=con2.sfid '+
          'INNER JOIN salesforce.Milestone1_Expense__c exp '+
          'ON app.Expense__c = exp.sfid '+
          'where app.sfid = $1 '; 

          let qryPM ='SELECT app.sfid as appsdif ,app.name as appname , app.Approval_Type__c, app.comment__c,app.Reporting_Manager_Comment__c, app.Submitter_Heroku__c, '+
          'app.Project_Manager_Comment__c, app.Status__c,  app.Approver_RM__c,userpm.name as conname,exp.name as expname,con2.name as submitter, '+
          'app.Amount__c,app.createddate, app.Expense__c,app.Assign_To_PM__c,app.Project_Manager_Approval_Status__c, app.Project_Manager_Comment__c, app.Approver_PM__c '+
          'FROM salesforce.Custom_Approval__c app '+
          'INNER JOIN salesforce.User userpm ON app.Approver_PM__c=userpm.sfid '+
          'INNER JOIN salesforce.Contact con2 ON app.submitter_heroku__c=con2.sfid '+
          'INNER JOIN salesforce.Milestone1_Expense__c exp '+
          'ON app.Expense__c = exp.sfid '+
          'where app.sfid = $1 '; 
          
          let qryPMRM ='SELECT app.sfid as appsdif ,app.name as appname , app.Approval_Type__c, app.comment__c,app.Reporting_Manager_Comment__c, app.Submitter_Heroku__c, '+
          'app.Project_Manager_Comment__c, app.Status__c,  app.Approver_RM__c,userrm.name as connamerm,userpm.name as conname,exp.name as expname,con2.name as submitter, '+
          'app.Amount__c,app.createddate, app.Expense__c,app.Assign_To_PM__c,app.Project_Manager_Approval_Status__c, app.Project_Manager_Comment__c, app.Approver_PM__c '+
          'FROM salesforce.Custom_Approval__c app '+
          'INNER JOIN salesforce.User userpm ON app.Approver_PM__c=userpm.sfid '+
          'INNER JOIN salesforce.User userrm ON app.Approver_PM__c=userrm.sfid '+
          'INNER JOIN salesforce.Contact con2 ON app.submitter_heroku__c=con2.sfid '+
          'INNER JOIN salesforce.Milestone1_Expense__c exp '+
          'ON app.Expense__c = exp.sfid '+
          'where app.sfid = $1 '; 
           /*  let qry ='SELECT app.sfid as appsfid, app.name as appname, app.Approval_Type__c, app.comment__c, app.Reporting_Manager_Comment__c, app.Submitter_Heroku__c, cont.name as contname, '+
          'app.Project_Manager_Comment__c, app.Status__c, con.name as conname, exp.name as expname, exp.sfid as expsfid, app.Approver_RM__c, usr.name as username, '+
          'app.Amount__c,app.createddate, app.Expense__c, app.Assign_To_PM__c, app.Project_Manager_Approval_Status__c, app.Project_Manager_Comment__c, app.Approver_PM__c '+
          'FROM salesforce.Custom_Approval__c app '+
         'INNER JOIN salesforce.Contact con '+
         'ON app.Approver_RM__c=con.sfid '+
         'INNER JOIN salesforce.User usr '+
         'ON app.Approver_PM__c = usr.sfid '+
         'INNER JOIN salesforce.Milestone1_Expense__c exp '+
         'ON app.Expense__c = exp.sfid '+
         'WHERE app.sfid = $1 ';  */ 
        // let qry ='Select sfid ,name as appname ,Approval_Type__c, Approver_RM__c FROM salesforce.Custom_Approval__c WHERE sfid = $1 ';
        
          console.log('qry '+qryRM);
          pool
            .query(qryTest,[approvalId])
            .then((querryResult)=>{
                console.log('testttt '+JSON.stringify(querryResult.rows));
                if(querryResult.rowCount > 0)
                {

                    if(querryResult.rows[0].approver_pm__c!=null && querryResult.rows[0].approver_rm__c!=null){
                        pool
                        .query(qryPMRM,[approvalId])
                        .then((querryResult)=>{
                            console.log('querryResult RMPM '+JSON.stringify(querryResult.rows));
                            approvalFormAndRelatedRecords.approvalFormDetails = querryResult.rows;
                            response.send(approvalFormAndRelatedRecords); 
                             
                         })
                         .catch((error)=>{
                             console.log('Error in PM Querryy '+error.stack);
                         })
                    }
                    else{
                        if(querryResult.rows[0].approver_rm__c!=null){
                            pool
                            .query(qryRM,[approvalId])
                            .then((querryResult)=>{
                                console.log('querryResult Rm '+JSON.stringify(querryResult.rows));
                                approvalFormAndRelatedRecords.approvalFormDetails = querryResult.rows;
                                response.send(approvalFormAndRelatedRecords); 
                                 
                             })
                             .catch((error)=>{
                                 console.log('Error in RM Querryy '+error.stack);
                             })
                        }
    
                        if(querryResult.rows[0].approver_pm__c!=null){
                            pool
                            .query(qryPM,[approvalId])
                            .then((querryResult)=>{
                                console.log('querryResult PM '+JSON.stringify(querryResult.rows));
                                approvalFormAndRelatedRecords.approvalFormDetails = querryResult.rows;
                                response.send(approvalFormAndRelatedRecords); 
                                 
                             })
                             .catch((error)=>{
                                 console.log('Error in PM Querryy '+error.stack);
                             })
                        }
    
                    }

                                


                  /*   console.log('querryResult  '+JSON.stringify(querryResult.rows));
                   // let approver_pm = querryResult.rows[0].approver_pm__c;
                   // console.log('approver_pm '+approver_pm);
                    approvalFormAndRelatedRecords.approvalFormDetails = querryResult.rows;
                    response.send(approvalFormAndRelatedRecords); */
                }
                else
                {
                    approvalFormAndRelatedRecords.approvalFormDetails = [];
                }
                    //console.log('QuerryResult=>'+JSON.stringify(querryResult.rows));
                //response.send(querryResult.rows);
            })
            .catch((approvalQueryError)=> {
                console.log('approvalQueryError  : '+approvalQueryError.stack);
                approvalFormAndRelatedRecords.approvalFormDetails = [];
            })
        
    /*
            let query ='SELECT hist.sfid, hist.name as histname, hist.Status__c,app.name as appname, hist.Approver_Email__c, hist.Comment__c, hist.approver_profile__c '+
            'FROM salesforce.approval_history__c hist '+
            'INNER JOIN salesforce.approval__c app '+
            'ON hist.approval__c = app.sfid '+
            'WHERE app.sfid = $1 ';
            console.log('query '+query);
              await
              pool
              .query(query,[approvalId])
            .then((approvalHistoryResult)=> {
                    if(approvalHistoryResult.rowCount > 0)
                    {   
                            console.log('approvalHistoryResult  '+approvalHistoryResult.rows);
                            approvalFormAndRelatedRecords.relatedHistrory = approvalHistoryResult.rows;
                    }
                    else
                    {
                        approvalFormAndRelatedRecords.relatedHistrory = [];
                    }
        
            })
            .catch((relatedHistroryError)=> {
                console.log('relatedHistroryError  '+relatedHistroryError.stack);
                approvalFormAndRelatedRecords.relatedHistrory = [];
            })*/
            
    
          })
    
          router.post('/handleExpenseApproval', verify, async (request, response) =>{

            let objUser = request.user;
            console.log('objUser  : '+JSON.stringify(objUser));
            let body = request.body;
            console.log('body  : '+JSON.stringify(body));
            let comm = request.body.comment;
            console.log('comment +++  '+comm);

            const schema=joi.object({
                comm:joi.string().min(3).required().label('Please Fill Comment'),
                
            })
            let result=schema.validate({comm:comm});
            if(result.error){
                console.log('fd'+result.error);
                response.send(result.error.details[0].context.label);    
            }
            else{            
            
            if(objUser.isManager)
            {
                
                    let customApprovalUpdateQuery = 'UPDATE salesforce.Custom_Approval__c SET '+
                                                    'status__c = \''+body.type+'\' ,'+
                                                    'Reporting_Manager_Comment__c= \''+body.comment+'\' '+
                                                    'WHERE sfid = $1';
                    
                    console.log('customApprovalUpdateQuery  : '+customApprovalUpdateQuery);
                    await
                    pool.query(customApprovalUpdateQuery,[body.customApprovalId])
                    .then((customApprovalResult) => {
                        console.log('customApprovalResult  : '+JSON.stringify(customApprovalResult.rows));
                    })
                    .catch((customApprovalError) => {
                            console.log('customApprovalError  '+customApprovalError);
                    })
        
        
                    let expenseUpdateQuery = 'UPDATE salesforce.Milestone1_Expense__c SET '+ 
                                            'isHerokuEditButtonDisabled__c = false , '+
                                            'isHerokuApprovalButtonDisabled__c = false ,'+
                                            'isHerokuFeedbackButtonDisabled__c = true ,'+ 
                                            'approval_status__c = \''+body.type+'\' '+
                                            'WHERE sfid = $1';
                    
                    console.log('expenseUpdateQuery  : '+expenseUpdateQuery);
        
                    await
                    pool.query(expenseUpdateQuery,[body.expenseId])
                    .then((expenseUpdateResult) => {
                        console.log('expenseUpdateResult  : '+JSON.stringify(expenseUpdateResult.rows));
                    
                            if(body.type == 'Approved')
                            {
                                response.send('Approved!');
                            }
                            else if(body.type == 'Rejected')
                            {
                                response.send('Rejected!');
                            }
        
                    })
                    .catch((expenseErrorResult) => {
                        console.log('expenseErrorResult  '+expenseErrorResult);
                    })
        
            }
        }
        
        });
    

module.exports = router;
