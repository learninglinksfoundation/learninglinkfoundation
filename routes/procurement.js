const pool = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const format = require('pg-format');
const joi = require('@hapi/joi');
const Router = require('express-promise-router');
const { response, request } = require('express');
const { body } = require('express-validator');
const { json } = require('body-parser');
const router = new Router();

router.get('/',verify,(request, response)=> {
   
        let objUser=request.user;
        console.log('user '+objUser);  
        response.render('assetRequistionForms',{objUser});    
});

router.get('/assetDetails',verify,(request, response)=> {
    console.log('inside asset details zz');
    console.log('Asset request.user '+JSON.stringify(request.user));
    var userId = request.user.sfid;
    var objUser = request.user;
    var isEnableNewButton;
   
    console.log('Asset userId : '+userId);
    let qry ='SELECT asset.sfid, asset.isHerokuApprovalButtonDisabled__c,asset.Activity_Code_project__c,asset.accounts_approval__c,asset.Requested_Closure_Plan_Date__c,asset.Status__c,asset.Name, proj.name as projname, proj.sfid as projId,'+
            'asset.Manager_Approval__c, asset.Procurement_Head_Approval__c, asset.Procurement_Committee_Approval__c, '+
            'asset.Procurement_Comt_Approval_for_fortnight__c, asset.Management_Approval__c, asset.Chairperson_Approval__c, asset.Management_Approval_less_than_3_quotes__c, '+
            'asset.Management_Approval_for_fortnight_limit__c, asset.Management_Approval_Activity_Code__c, asset.createddate, '+
             'asset.Number_Of_IT_Product__c, asset.Number_Of_Non_IT_Product__c, asset.Procurement_IT_total_amount__c, asset.Procurement_Non_IT_total_amount__c, asset.Total_amount__c FROM  salesforce.Asset_Requisition_Form__c asset '+
             'INNER JOIN salesforce.Milestone1_Project__c proj '+
             'ON asset.project_department__c =  proj.sfid '+
            // 'INNER JOIN salesforce.Activity_Code__c act '+
            // 'ON asset.Activity_Code_project__c =  act.sfid '+
             ' WHERE asset.Submitted_By_Heroku_User__c = $1 AND asset.sfid IS NOT NULL';

    pool
    .query(qry,[userId])
    .then((assetQueryResult) => {
            console.log('assetQueryResult   '+assetQueryResult.rows);
            if(assetQueryResult.rowCount > 0)
            {
              let modifiedList = [];
            console.log('assetQueryResult   : '+JSON.stringify(assetQueryResult.rows));
            for(let i=0 ; i < assetQueryResult.rows.length; i++)
            {
                let isNull = false,isApproved = false,isPending = false,isRejected = false,accountApprovalEnabled = false;
                let obj = {};
                let crDate = new Date(assetQueryResult.rows[i].createddate);
                crDate.setHours(crDate.getHours() + 5);
                crDate.setMinutes(crDate.getMinutes() + 30);    
                let strDate = crDate.toLocaleString();

                let targetDate = new Date(assetQueryResult.rows[i].requested_closure_plan_date__c);
                targetDate.setHours(targetDate.getHours()+5);
                targetDate.setMinutes(targetDate.getMinutes() + 30);
                let strDateOfRecev = targetDate.toLocaleString();

              obj.sequence = i+1;
             // obj.editbutton = '<button    data-toggle="modal" data-target="#assetRequisitionEditModal" class="btn btn-primary assetRequisitionEditModalButton"   id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
              
              obj.name = '<a href="'+assetQueryResult.rows[i].sfid+'" data-toggle="modal" data-target="#popup" class="assetTag" id="name'+assetQueryResult.rows[i].sfid+'"  >'+assetQueryResult.rows[i].name+'</a>';
              obj.projectname = assetQueryResult.rows[i].projname;
              obj.noit = assetQueryResult.rows[i].number_of_it_product__c;
              obj.nononit = assetQueryResult.rows[i].number_of_non_it_product__c;
              obj.itamount = assetQueryResult.rows[i].procurement_it_total_amount__c;
              obj.nonitamount = assetQueryResult.rows[i].procurement_non_it_total_amount__c;
             // obj.totalamount = '<span id="amount'+expenseQueryResult.rows[i].sfid+'" ><h6>INR</h6>'+assetQueryResult.rows[i].total_amount__c+'</span>';
              obj.totalamount  = '<span id="amount'+assetQueryResult.rows[i].sfid+'" >'+assetQueryResult.rows[i].total_amount__c+'</span>';
              obj.dateofRec = strDateOfRecev.toLocaleString().split(',')[0];
              obj.actCode = assetQueryResult.rows[i].actname;
              obj.accAppStatus=assetQueryResult.rows[i].accounts_approval__c;
              obj.status = assetQueryResult.rows[i].status__c

              if(assetQueryResult.rows[i].manager_approval__c == 'Approved' || assetQueryResult.rows[i].procurement_head_approval__c == 'Approved' ||
              assetQueryResult.rows[i].procurement_committee_approval__c == 'Approved' || assetQueryResult.rows[i].procurement_comt_approval_for_fortnight__c == 'Approved' || 
              assetQueryResult.rows[i].management_approval__c == 'Approved' || assetQueryResult.rows[i].chairperson_approval__c == 'Approved' ||
              assetQueryResult.rows[i].management_approval_less_than_3_quotes__c == 'Approved' || assetQueryResult.rows[i].management_approval_for_fortnight_limit__c == 'Approved' || 
              assetQueryResult.rows[i].management_approval_activity_code__c == 'Approved') 
                {
                 isApproved = true;
                }
                if(assetQueryResult.rows[i].manager_approval__c == 'Pending' || assetQueryResult.rows[i].procurement_head_approval__c == 'Pending' ||
                assetQueryResult.rows[i].procurement_committee_approval__c == 'Pending' || assetQueryResult.rows[i].procurement_comt_approval_for_fortnight__c == 'Pending' || 
                assetQueryResult.rows[i].management_approval__c == 'Pending' || assetQueryResult.rows[i].chairperson_approval__c == 'Pending' ||
                assetQueryResult.rows[i].management_approval_less_than_3_quotes__c == 'Pending' || assetQueryResult.rows[i].management_approval_for_fortnight_limit__c == 'Pending' || 
                assetQueryResult.rows[i].management_approval_activity_code__c == 'Pending') 
                  {
                  isPending = true;
                  }
               if(assetQueryResult.rows[i].manager_approval__c == 'Rejected' || assetQueryResult.rows[i].procurement_head_approval__c == 'Rejected' ||
                  assetQueryResult.rows[i].procurement_committee_approval__c == 'Rejected' || assetQueryResult.rows[i].procurement_comt_approval_for_fortnight__c == 'Rejected' || 
                  assetQueryResult.rows[i].management_approval__c == 'Rejected' || assetQueryResult.rows[i].chairperson_approval__c == 'Rejected' ||
                  assetQueryResult.rows[i].management_approval_less_than_3_quotes__c == 'Rejected' || assetQueryResult.rows[i].management_approval_for_fortnight_limit__c == 'Rejected' || 
                  assetQueryResult.rows[i].management_approval_activity_code__c == 'Rejected') 
                    {
                        isRejected = true;
                    }
               else{
                        isNull = true;
                   }
               
                   console.log('isApproved 103 '+i+': '+assetQueryResult.rows[i].name+': : : '+isApproved);
                   console.log('isRejected 104 '+i+': '+isRejected);
                   console.log('isPending 105 '+i+': '+isPending);
                   console.log('accountApprovalEnabled '+i+': '+accountApprovalEnabled);
                   console.log('line : 107 (isPending == true && isApproved == false && isRejected == false ) '+(isPending == true && isApproved == false && isRejected == false ));
                if(isRejected == true && isPending == false && isApproved == false)
                {
                   console.log(' +++ Inside is rejected 109  +++ ')
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true"  id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = false;
                  accountApprovalEnabled = false;
                }
               else if(isPending == true && isApproved == false && isRejected == false)
                {
                    console.log(' +++ Inside is Pending 119  +++ ')
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true"  id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal" disabled = "true"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = false;
                  accountApprovalEnabled = false;
                }        
                else if(isApproved == true && isRejected == true && isPending == false)
                {
                    
                    console.log(' +++ Inside is Pending 129  +++ ')
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup"  id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = true;
                  accountApprovalEnabled = false;
                }
                else if(isApproved == true && isRejected == false && isPending == true)
                {    
                    console.log(' +++ Inside is Pending 138 +++ ')
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" disabled = "true"  id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true"  id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal" disabled = "true"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = false;
                  accountApprovalEnabled = false;
                }    
                else if(isApproved == true && isPending == false && isRejected == false)
                {
                    console.log(' +++ Inside is Approved 147 +++ '+i);
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup"  id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal" disabled = "true"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = false;
                  accountApprovalEnabled = true;
                  console.log('accountApprovalEnabled '+i+': '+accountApprovalEnabled);
                }
                else if(isApproved == true && isPending == true && isRejected == true)
                {
                    console.log(' +++ Inside is Approved 157 +++ '+i);
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = false;
                  accountApprovalEnabled = false;
                  console.log('accountApprovalEnabled '+i+': '+accountApprovalEnabled);
                }
                else if(isApproved == false && isPending == true && isRejected == true)
                {
                    console.log(' +++ Inside is Approved 167 +++ '+i);
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = false;
                  accountApprovalEnabled = false;
                  console.log('accountApprovalEnabled '+i+': '+accountApprovalEnabled);
                }
                 if(accountApprovalEnabled == true && (assetQueryResult.rows[i].accounts_approval__c == null)  )
                {
                    console.log(' +++ Inside is Approveddddd 177 +++ ')
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup"  id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal" disabled = "true"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = true;
                }
               
                else if(assetQueryResult.rows[i].accounts_approval__c == 'Pending' )
                {
                    console.log(' +++ Inside is Accounts approval Pending  186 +++ ')
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal" disabled = "true"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = true;
                }
                else if(assetQueryResult.rows[i].accounts_approval__c == 'Approved' )
                {
                    console.log(' +++ Inside is Accounts approval Approved 194 +++ ')
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = true;
                }
                else if(assetQueryResult.rows[i].accounts_approval__c == 'Rejected' )
                {
                    console.log(' +++ Inside is Accounts approval rejected 202 +++ ')
                  obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                  obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                  obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                  obj.isEnableNewButton = false;
                }    
                else{
                    console.log(' +++ Inside else  +++ ')
                    console.log('isApproved 176 '+i+': '+isApproved);
                    console.log('isRejected 177 '+i+': '+isRejected);
                    console.log('isPending 178 '+i+': '+isPending);
                    console.log('accountApprovalEnabled 196 '+i+': '+accountApprovalEnabled);
                    if(isApproved == false && isRejected == false && isPending == false ){
                        obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" id="'+assetQueryResult.rows[i].sfid+'" >1st Stage Approval</button>'
                        obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" disabled = "true" id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
                        obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal"  id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
                        obj.isEnableNewButton = false;
    
                    }
                   
                }
               obj.createdDate = strDate;
              modifiedList.push(obj);
              }
              response.send(modifiedList);
              let successMessages = [];
              successMessages.push({s_msg : 'Asset Data Received'})
              request.flash({successs_msg : 'Asset Data Received'});
          }
          else
          {
              response.send([]);
          }
    })
    .catch((assetQueryError) => {
      console.log('assetQueryError   '+assetQueryError.stack);
      response.send({objUser: objUser, assetList : []});
    })
});

router.get('/assetEditDetails',verify ,async(request, response) =>{
   console.log('hii inside asset details');
    let assetId = request.query.assetId;
    console.log('assetId  '+assetId);
    let objUser = request.user;
    console.log('User:' +objUser);
    let qyr='SELECT  asset.sfid as sfidt,asset.name as name ,asset.Activity_Code_Project__c,asset.Requested_Closure_Plan_Date__c,asset.Project_Department__c as pid, '+
    'asset.Manager_Approval__c,asset.Management_Approval__c,asset.Procurement_Committee_Approval__c,asset.Chairperson_Approval__c,'+
    'asset.Accounts_Approval__c,asset.UTR_Number_Transaction_details__c,asset.Advance_Payment_Status__c,asset.Payment_Status__c,asset.PO_Attachment_URL__c,asset.Procurement_Head_Approval__c,'+
    'asset.Number_Of_IT_Product__c,asset.Number_Of_Non_IT_Product__c,asset.Procurement_IT_total_amount__c,asset.Procurement_Non_IT_total_amount__c, asset.Total_amount__c,proj.name as projname,proj.sfid as profsfid,'+
    'asset.Management_Approval_Activity_Code__c,asset.Management_Approval_for_fortnight_limit__c,asset.P_O_attachment__c, '+
    'asset.Management_Approval_less_than_3_quotes__c,asset.Procurement_Comt_Approval_for_fortnight__c, '+
     'asset.P_O_attachment__c,po_attachment_url__c,payment_status__c,asset.status__c,asset.payment_received_acknowledgement__c,asset.receiver_name__c,asset.received_quantity_goods__c,asset.date_of_receiving_goods__c, '+
     'asset.if_3_quotations_specify_Reason__c,asset.reason_for_non_registered_GST_Vendor__c, asset.Pricing_Terms_Cost_comparison__c, asset.Delivery_Terms_Delivery_Place__c, asset.Delivery_Terms_Delivery_Time__c,asset.Delivery_cost_Incl__c '+
    'FROM  salesforce.Asset_Requisition_Form__c asset '+
     'INNER JOIN salesforce.Milestone1_Project__c proj '+
     'ON asset.Project_Department__c =  proj.sfid '+
      'WHERE asset.sfid = $1';

      console.log('qry '+qyr);
      let popupDetails = [];
      var objData =  {};
      await
       pool
       .query(qyr,[assetId])
       .then((assetQueryResult)=> {
           if(assetQueryResult.rowCount > 0)
           {
               console.log('assetQueryResult EDIT '+JSON.stringify(assetQueryResult.rows));
               //response.send(assetQueryResult.rows[0]);
               //popupDetails.push(assetQueryResult.rows[0]);
               //details.push(popupDetails);
               objData.asset = assetQueryResult.rows;
               console.log('hello i am inside Procurement Activity Code');
                 let projectId ;
               let activity ;
                               pool
                               .query('SELECT sfid, Project_Department__c FROM salesforce.Asset_Requisition_Form__c WHERE  sfid = $1',[assetId])
                               .then((ProcurementQueryResult) => {
                                 console.log('ProcurementQueryResult :' +JSON.stringify(ProcurementQueryResult.rows));
                                 if(ProcurementQueryResult.rowCount > 0)
                                 {
                                    activity = ProcurementQueryResult.rows[0] ;
                                    console.log('activity ++ '+activity);
                                   projectId = activity.project_department__c;
                                   console.log('Inside Procurement query  : '+projectId);
                                   pool
                                   .query('Select sfid , Name FROM salesforce.Activity_Code__c where sfid != $1 AND Project__c = $2', ['null',projectId])
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
                                       objData.activity = lstActivityCode;
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

                        pool
                        .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[objUser.sfid])
                        .then(teamMemberResult => {
                            console.log('Name of TeamMemberId  : '+teamMemberResult.rows[0].name+' sfid :'+teamMemberResult.rows[0].sfid);
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
                                        objData.projectlist = projectQueryResult.rows;
                                        response.send(objData);
                                })
                                .catch((projectQueryError) => {
                                    console.log('projectQueryError  '+projectQueryError.stack);
                                    response.send({});

                                })
                                })   
                            .catch((projectTeamQueryError)=> {
                                console.log('projectTeamQueryError  '+projectTeamQueryError.stack);
                                response.send({});
                            })
                            })
                            .catch((teamMemberQueryError) => {
                            console.log('teamMemberQueryError  '+teamMemberQueryError.stack);
                            response.send({});
                            })

                            
           }
           else
           {
               response.send({});
           }
       })
       .catch((assetQueryError)=> {
           console.log('assetQueryError  : '+assetQueryError.stack);
           response.send({});
       })

});

router.get('/fetchActivityCode', verify ,(request, response) => {

    console.log('hello i am inside Procurement Activity Code');
  
    let assetId = request.query.assetId;
    console.log('assetId :' +assetId)
    let projectId ;
    let activity ;
                    pool
                    .query('SELECT sfid, Project_Department__c FROM salesforce.Asset_Requisition_Form__c WHERE  sfid = $1',[assetId])
                    .then((ProcurementQueryResult) => {
                      console.log('ProcurementQueryResult :' +JSON.stringify(ProcurementQueryResult.rows));
                      if(ProcurementQueryResult.rowCount > 0)
                      {
                         activity = ProcurementQueryResult.rows[0] ;
                        projectId = activity.project_department__c;
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
                  })


                  router.get('/fetchActivityCodeforCreateNew', verify ,(request, response) => {

                    let projId = request.query.proj;
                    console.log('hello i am inside create new activity code Project');
                    console.log('projId '+projId);
                    var userId = request.user.sfid; 
                
                                          console.log('start activity code ++++');
                                        //  console.log('lstProjectId ++++  '+lstProjectId);
                                          pool
                                          .query('Select sfid , Name FROM salesforce.Activity_Code__c where sfid != $1 AND Project__c = $2', ['null',projId])
                                          .then((activityCodeQueryResult) => {
                                            console.log('activityCodeQueryResult  : '+JSON.stringify(activityCodeQueryResult.rows));
                                            let numberOfRows;
                                            if(activityCodeQueryResult.rowCount > 0)
                                            {
                                              numberOfRows = activityCodeQueryResult.rows.length;
                                              console.log('activityCodeQueryResult  : '+JSON.stringify(activityCodeQueryResult.rows));
                                              response.send(activityCodeQueryResult.rows);;
                                            }
                                          })
                                          .catch((activityCodeQueryError) => {
                                            console.log('activityCodeQueryError  : '+activityCodeQueryError.stack);
                                            response.send([]);
                                          })
                                       
                                         
                                            
                                      
                                    })
                                    
                                    router.get('/detailsApproval',verify,(request, response) => {

                                        let assetRequisitionFormId = request.query.assetRequisitionFormId;
                                        console.log('assetRequisitionFormId  : '+assetRequisitionFormId);
                                        let queryText = 'SELECT sfid, if_3_quotations_specify_Reason__c,reason_for_non_registered_GST_Vendor__c,Pricing_Terms_Cost_comparison__c,Delivery_Terms_Delivery_Place__c, Delivery_Terms_Delivery_Time__c, Delivery_cost_Incl__c FROM  salesforce.Asset_Requisition_Form__c '+
                                                         ' WHERE sfid = $1 ';
                                      
                                        pool
                                        .query(queryText,[assetRequisitionFormId])
                                        .then((assetQueryResult) => {
                                              console.log('assetQueryResult for approval '+JSON.stringify(assetQueryResult.rows));
                                              if(assetQueryResult.rowCount > 0)
                                              for(let i=0 ; i < assetQueryResult.rows.length; i++)
                                               {
                                                 {
                                                  console.log('assetQueryResult.rows[i].if_3_quotations_specify_reason__c '+assetQueryResult.rows[i].if_3_quotations_specify_Reason__c );
                                               /* if(assetQueryResult.rows[i].if_3_quotations_specify_reason__c == null  || assetQueryResult.rows[i].reason_for_non_registered_gst_vendor__c == null || assetQueryResult.rows[i].pricing_terms_cost_comparison__c == null || assetQueryResult.rows[i].delivery_terms_delivery_place__c == null || assetQueryResult.rows[i].delivery_terms_delivery_time__c == null || assetQueryResult.rows[i].delivery_cost_incl__c == null)
                                                   {
                                                    response.send('Unless and until , the purchase order checklist is not filled completely, the form can not be sent for approval.');
                                                   } */
                                                  // if((assetQueryResult.rows[i].if_3_quotations_specify_reason__c == null  && assetQueryResult.rows[i].reason_for_non_registered_gst_vendor__c == null && assetQueryResult.rows[i].pricing_terms_cost_comparison__c == null && assetQueryResult.rows[i].delivery_terms_delivery_place__c == null && assetQueryResult.rows[i].delivery_terms_delivery_time__c == null && assetQueryResult.rows[i].delivery_cost_incl__c == null) || 
                                                    if(assetQueryResult.rows[i].if_3_quotations_specify_reason__c == null  || assetQueryResult.rows[i].reason_for_non_registered_gst_vendor__c == null || assetQueryResult.rows[i].pricing_terms_cost_comparison__c == null || assetQueryResult.rows[i].delivery_terms_delivery_place__c == null || assetQueryResult.rows[i].delivery_terms_delivery_time__c == null || assetQueryResult.rows[i].delivery_cost_incl__c == null || 
                                                        assetQueryResult.rows[i].if_3_quotations_specify_reason__c == ""  || assetQueryResult.rows[i].reason_for_non_registered_gst_vendor__c == "" || assetQueryResult.rows[i].pricing_terms_cost_comparison__c == "" || assetQueryResult.rows[i].delivery_terms_delivery_place__c == "" || assetQueryResult.rows[i].delivery_terms_delivery_time__c == "" || assetQueryResult.rows[i].delivery_cost_incl__c == "" ||
                                                        assetQueryResult.rows[i].if_3_quotations_specify_reason__c == 'None'  || assetQueryResult.rows[i].reason_for_non_registered_gst_vendor__c == 'None' || assetQueryResult.rows[i].pricing_terms_cost_comparison__c == 'None' || assetQueryResult.rows[i].delivery_terms_delivery_place__c == 'None' || assetQueryResult.rows[i].delivery_terms_delivery_time__c == 'None' || assetQueryResult.rows[i].delivery_cost_incl__c == 'None' ) 
                                                   {
                                                    console.log('Inside if loop for approval check list');   
                                                    response.send('Unless and until , the purchase order checklist is not filled completely, the form can not be sent for approval.');
                                                   }
                                                 else{
                                                     response.send('Approval Sent Successfully');
                                                     }
                                              }
                                            }
                                              else
                                              {
                                                response.send({});
                                              }
                                               
                                        })
                                        .catch((assetQueryError) => {
                                              console.log('assetQueryError  '+assetQueryError.stack);
                                              response.send({});
                                        })
                                      
                                      })
                                               

router.get('/details',verify, async(request, response) => {

    var assetId = request.query.assetId;
    console.log('assetId   '+assetId);
    var isEnableNewButton ;
    var assetFormAndRelatedRecords = {};

    let qyr1='SELECT asset.id, asset.sfid,asset.name as name ,asset.Requested_Closure_Plan_Date__c,asset.Project_Department__c,asset.Activity_Code_Project__c as actname, '+
 'asset.Manager_Approval__c,asset.Management_Approval__c,asset.Procurement_Committee_Approval__c,asset.Chairperson_Approval__c,'+
 'asset.Accounts_Approval__c,asset.Procurement_Head_Approval__c,'+
 'asset.Number_Of_IT_Product__c,asset.Number_Of_Non_IT_Product__c,asset.Procurement_IT_total_amount__c,asset.Procurement_Non_IT_total_amount__c, asset.Total_amount__c,proj.name as projname,proj.sfid, '+
 'asset.Management_Approval_Activity_Code__c,asset.Management_Approval_for_fortnight_limit__c, '+
 'asset.Management_Approval_less_than_3_quotes__c,asset.Procurement_Comt_Approval_for_fortnight__c,asset.PO_Attachment_URL_By_Accounts__c, '+
  'asset.P_O_attachment__c,po_attachment_url__c,asset.advance_payment_status__c,asset.payment_status__c,asset.Status__c,asset.Payment_Received_Acknowledgement__c,asset.receiver_name__c,asset.received_quantity_goods__c,asset.date_of_receiving_goods__c, '+
  'asset.utr_number_transaction_details__c, asset.advance_payment_status__c, '+
  'asset.if_3_quotations_specify_Reason__c,asset.reason_for_non_registered_GST_Vendor__c, asset.Pricing_Terms_Cost_comparison__c, asset.Delivery_Terms_Delivery_Place__c, asset.Delivery_Terms_Delivery_Time__c,asset.Delivery_cost_Incl__c '+
 'FROM  salesforce.Asset_Requisition_Form__c asset '+
  'INNER JOIN salesforce.Milestone1_Project__c proj ON asset.Project_Department__c =  proj.sfid '+
   'WHERE asset.sfid = $1';
    
 let qyr='SELECT asset.id, asset.sfid,asset.name as name ,act.name as actname,asset.Requested_Closure_Plan_Date__c,asset.Project_Department__c, '+
 'asset.Manager_Approval__c,asset.Management_Approval__c,asset.Procurement_Committee_Approval__c,asset.Chairperson_Approval__c,'+
 'asset.Accounts_Approval__c,asset.Procurement_Head_Approval__c,'+
 'asset.Number_Of_IT_Product__c,asset.Number_Of_Non_IT_Product__c,asset.Procurement_IT_total_amount__c,asset.Procurement_Non_IT_total_amount__c, asset.Total_amount__c,proj.name as projname,proj.sfid, '+
 'asset.Management_Approval_Activity_Code__c,asset.Management_Approval_for_fortnight_limit__c,asset.po_attachment_url_by_accounts__c,asset.P_O_attachment__c,'+
 'asset.Management_Approval_less_than_3_quotes__c,asset.Procurement_Comt_Approval_for_fortnight__c, '+
  'asset.P_O_attachment__c,po_attachment_url__c,asset.advance_payment_status__c,asset.payment_status__c,asset.Status__c,asset.Payment_Received_Acknowledgement__c,asset.receiver_name__c,asset.received_quantity_goods__c,asset.date_of_receiving_goods__c, '+
  'asset.utr_number_transaction_details__c, asset.advance_payment_status__c, '+
  'asset.if_3_quotations_specify_Reason__c,asset.reason_for_non_registered_GST_Vendor__c, asset.Pricing_Terms_Cost_comparison__c, asset.Delivery_Terms_Delivery_Place__c, asset.Delivery_Terms_Delivery_Time__c,asset.Delivery_cost_Incl__c '+
 'FROM  salesforce.Asset_Requisition_Form__c asset '+
  'INNER JOIN salesforce.Milestone1_Project__c proj '+
  'ON asset.Project_Department__c =  proj.sfid '+
  'INNER JOIN salesforce.Activity_Code__c act ON asset.Activity_Code_Project__c = act.sfid '+
   'WHERE asset.sfid = $1';
   console.log('qry '+qyr);
    await
    pool
    .query(qyr,[assetId])
    .then((assetQueryResult)=> {
        if(assetQueryResult.rowCount > 0)
        {
            console.log('assetQueryResult  '+JSON.stringify(assetQueryResult.rows));
            assetFormAndRelatedRecords.assetFormDetails = assetQueryResult.rows;        
        }
        else
        {
            pool
            .query(qyr1,[assetId])
            .then((assetQueryResultwithouActivityCode)=> {
                assetFormAndRelatedRecords.assetFormDetails = assetQueryResultwithouActivityCode.rows; 
            })
            .catch((assetQueryError)=> {
                console.log('assetQueryError  : '+assetQueryError.stack);
                assetFormAndRelatedRecords.assetFormDetails = [];
            })
        }
    })
    .catch((assetQueryError)=> {
        console.log('assetQueryError  : '+assetQueryError.stack);
        assetFormAndRelatedRecords.assetFormDetails = [];
    })

    await
    pool
    .query('SELECT sfid, Name,Products_Services_Name__c, Items__c,Quantity__c, Others__c, Budget__c FROM  salesforce.Product_Line_Item__c WHERE Asset_Requisition_Form__c = $1',[assetId])
    .then((NonItProductResult)=> {
            if(NonItProductResult.rowCount > 0)
            {   
                    console.log('NonItProductResult  '+NonItProductResult.rows);
                    assetFormAndRelatedRecords.nonItProducts = NonItProductResult.rows;
            }
            else
            {
                assetFormAndRelatedRecords.nonItProducts = [];
            }

    })
    .catch((NonItProductError)=> {
        console.log('NonItProductError  '+NonItProductError.stack);
        assetFormAndRelatedRecords.nonItProducts = [];
    })

    await
    pool
    .query('SELECT sfid, Name, Items__c, Quantity__c, Budget__c FROM salesforce.Product_Line_Item_IT__c WHERE Asset_Requisition_Form__c = $1 ',[assetId])
    .then((ItProductResult) => {
            if(ItProductResult.rowCount > 0)
            {
                console.log('ItProductResult  '+ItProductResult.rows);
                assetFormAndRelatedRecords.itProducts = ItProductResult.rows;
            }
            else
            {
                assetFormAndRelatedRecords.itProducts = [];
            }
     })
    .catch((ItProductError) => {
        console.log('ItProductError   '+ItProductError.stack);
        assetFormAndRelatedRecords.itProducts = [];
    })


    await
    pool
    .query('SELECT sfid, Name, Approval_Type__c, Status__c, Approver_s_Emails__c FROM salesforce.Approval__c WHERE Asset_Requisition_Form__c = $1 ',[assetId])
    .then((approvalQueryResult) => {
            if(approvalQueryResult.rowCount > 0)
            {
                console.log('approvalQueryResult  '+approvalQueryResult.rows);
                assetFormAndRelatedRecords.approvals = approvalQueryResult.rows;
            }
            else
            {
                assetFormAndRelatedRecords.approvals = [];
            }
     })
    .catch((approvalQueryError) => {
        console.log('approvalQueryError   '+approvalQueryError.stack);
        assetFormAndRelatedRecords.approvals = [];
    })


    response.send(assetFormAndRelatedRecords);

});

router.post('/insertAsssetForm',(request,response)=>{
    let body = request.body;
    let datepicker=request.body.date_from;
    console.log('Form Value =>'+JSON.stringify(body));
   const{assetRequisitionName,project,date_from,submittedBy,act}=request.body;
   console.log('Asset name=> '+assetRequisitionName);
   console.log('Asset project=> '+project);
   console.log('Asset planDate=> '+date_from);
   console.log('Asset spocApproval=> '+submittedBy);
   console.log('Activity code '+act);
   if(datepicker==''){
       console.log('dsjjd');
       datepicker=null;      
   }


const schema=joi.object({
    assetRequisitionName:joi.string().min(3).required().label('Please Fill Asset Requisition Name'),
    asset: joi.string().max(255).required().label('Asset Requisition Name is too long'),
    project:joi.string().required().label('Please choose Project/Department'),
    plandte:joi.date().required().label('Please Fill Target Date')
})
let result=schema.validate({assetRequisitionName,project,asset:assetRequisitionName,plandte:datepicker});
if(result.error){
    console.log('fd'+result.error);
    response.send(result.error.details[0].context.label);    
}
else{
   let query ='INSERT INTO salesforce.Asset_Requisition_Form__c (name,Project_Department__c,Requested_Closure_Plan_Date__c,Activity_Code_project__c,Submitted_By_Heroku_User__c) values ($1,$2,$3,$4,$5)';
   console.log('asset Insert Query= '+query);
   pool
   .query(query,[assetRequisitionName,project,date_from,act,submittedBy])
   .then((assetQueryResult) => {     
            console.log('assetQueryResult.rows '+JSON.stringify(assetQueryResult));
            response.send('Successfully Inserted');
   })
   .catch((assetInserError) => {
        console.log('assetInserError   '+assetInserError.stack);
        response.send('Error');
   })
}
})

router.post('/updateasset',(request,response)=>{
    let body = request.body;
    let closurePlanDate =request.body.date_from1;
    let goodsDate=request.body.goodsDate;
    let deliveryTime = request.body.deliveryTime;
    console.log('---- 678 procurement.js body  : '+JSON.stringify(body));

    let {assetsfid, assetName,activityCode,paymentStatus,status,payement,receiverName,receivedQuantity,quotations,reason,pricing,deliveryPlace,deliveryCost,attachment,totamt} = request.body;
    
    if(closurePlanDate=='' || typeof(closurePlanDate) == "undefined"){
        closurePlanDate='';
    }
  
     if(goodsDate == '' || typeof(goodsDate) == "undefined"){
        goodsDate= closurePlanDate;
    } 

    if(deliveryTime=='' || typeof(deliveryTime) == "undefined"){
        console.log('deliveryTime ');
        deliveryTime= closurePlanDate;
        console.log('deliveryTime'+deliveryTime)
    } 

    console.log('--- 697 procurement.js goodsDate'+goodsDate);
    console.log('--- 698 procurement.js deliveryTime'+deliveryTime);

    let updateQuerry = 'UPDATE salesforce.Asset_Requisition_Form__c SET '+
    'Name = \''+assetName+'\', '+
    'Requested_Closure_Plan_Date__c = \''+closurePlanDate+'\', '+
    'Activity_Code_Project__c = \''+activityCode+'\', '+
    'p_o_attachment__c = \''+attachment+'\', '+
    'Status__c = \''+status+'\', '+
    'Payment_Received_Acknowledgement__c = \''+payement+'\', '+
    'Receiver_Name__c = \''+receiverName+'\', '+
    'if_3_quotations_specify_reason__c= \''+quotations+'\', '+
    'reason_for_non_registered_gst_Vendor__c= \''+reason+'\', '+
    'pricing_terms_cost_comparison__c= \''+pricing+'\', '+
    'delivery_terms_delivery_place__c= \''+deliveryPlace+'\', ';
    
    if(totamt >= 1) {
        updateQuerry += 'Payment_Status__c = \''+paymentStatus+'\', '+
        'delivery_terms_delivery_time__c= \''+deliveryTime+'\', ';
    }

    if(deliveryCost != '') {
        updateQuerry += 'delivery_cost_incl__c= \''+deliveryCost+'\', ';
    }

    updateQuerry += 'Received_Quantity_Goods__c= \''+receivedQuantity+'\', '+
    'Date_of_Receiving_Goods__c= \''+goodsDate+'\' '+
    'WHERE sfid = $1';
    console.log('---- 725 procurement.js updateQuerry: ' + updateQuerry);

    var payPass='';
    var attchPass='';
    var quant='';
    
    console.log('---- 731 procurement.js receivedQuantity: ' + receivedQuantity);
    if(receivedQuantity > 0 || receivedQuantity == null || receivedQuantity == '')
    {
        quant = true;
    }
    else
    {
        quant = false;
    }
   
    if(paymentStatus=='Released'){
        if(status=='Closed' || status=='Open'){
            payPass='true';
            console.log('status :'+status+' paymetStatus :'+paymentStatus+' payPass:'+payPass);
        } 
    }
    else{
        if(status!='Closed'){
            payPass='false';
        }
    }
    if(attachment!=null && attachment!=''){
        console.log('reason '+reason+' quotations:'+quotations+' pricing:'+pricing+' deliveryPlace:'+deliveryPlace+' deliveryTime:'+deliveryTime+' deliveryCost:'+deliveryCost);
        if(reason=='true' || quotations =='true' || pricing=='true'  || deliveryPlace!='' || deliveryTime!='' || deliveryCost!='' ){
            attchPass='true';
            console.log('attchPass '+attchPass);
        }
    }

    if(attachment==null || attachment=='' ){  
        if(payPass=='true' || payPass=='false'){

            const schema=joi.object({
                assetName:joi.string().min(3).required().label('Please Fill Asset Requisition Name'),
            })
            let result=schema.validate({assetName});
            if(result.error){
                console.log('fd'+result.error);
                response.send(result.error.details[0].context.label);    
            }
            else{
                console.log('******');
        pool.query(updateQuerry,[assetsfid])
        .then((queryResultUpdate)=>{
         console.log('queryResultUpdate '+JSON.stringify(queryResultUpdate));
         response.send('Successfully Updated!');
        }).catch((eroor)=>{console.log(JSON.stringify(eroor.stack))})
            }
     }
     else{
         response.send('Final Payment Status can be chosen as Closed only when Final Payment Status is Released.');
         return;
     }
    }
    else{
        console.log('---- 785 procurement.js quant: ' + quant);
        console.log('---- 786 procurement.js attchPass: ' + attchPass);
        console.log('---- 787 procurement.js payPass: ' + payPass);
        if(attchPass=='true')
        {
            if(payPass=='true' || payPass=='false')
            {
                console.log('---- 792 procurement.js (quant == \'true\'): ' + (quant == 'true'));
                if(quant == true || quant == 'true')
                {
                    const schema=joi.object({
                        assetName:joi.string().min(3).required().label('Please Fill Asset Requisition Name'),
                    })
                    let result=schema.validate({assetName});
                    if(result.error){
                        console.log('fd'+result.error);
                        response.send(result.error.details[0].context.label);    
                    }
                    else{
                        pool.query(updateQuerry,[assetsfid])
                    .then((queryResultUpdate)=>{
                    console.log('queryResultUpdate '+JSON.stringify(queryResultUpdate));
                    response.send('Successfully Updated!');
                    }).catch((eroor)=>{console.log(JSON.stringify(eroor.stack));})
                    }
                }
                else{
                    response.send('Received Quantity(Goods) should not be negative.');
                    return;
                }
            }
            else{
                response.send('Choose Status Closed only When payment is Released !!!');
                return;
            }
        }
        else{
            response.send('Please fill all field in Purchase Order Checklist');
            return;
        }
    }
})
 
   router.get('/nonItProducts/:parentAssetId&:isDisabled',verify, (request,response) => {

    let parentAssetId = request.params.parentAssetId;
    console.log('parentAssetId  '+parentAssetId);
    var userId = request.user.sfid; 
    var objUser = request.user;
    console.log('Expense userId : '+userId);
    isDisabled = request.params.isDisabled;
    console.log(' ++++ isDisabled ++++ '+isDisabled); 
    response.render('procurementNonIT',{name: request.user.name,objUser: objUser, email: request.user.email,isDisabled: isDisabled, parentAssetId: parentAssetId});

});



router.post('/nonItProducts', (request,response) => {

    let nonItFormResult = request.body;
 
    console.log('nonItFormResult  '+JSON.stringify(nonItFormResult));
    let parentProcurementId = nonItFormResult.parentProcurementId;
    console.log('parent Id Asset Requisition Form '+parentProcurementId);
 
    const{state,district,unit,unitCost,vendor,itemsCategory,items,itemSpecification,quantity,budget}=request.body;
    let numberOfRows,lstNonItProcurement = [];
    
    if(typeof(nonItFormResult.quantity) != 'object')
    { 
         let schema=joi.object({
             state:joi.string().required().label('Please select State.'),
              district:joi.string().required().label('Please select District.'),
              itemsCategory:joi.string().required().label('Please select Item Category.'),
              items:joi.string().invalid('None').required().label('Please fill Items'),
              vendor:joi.string().required().label(' Please select Vendor from Vendor Picklist.'),
             itemSpecification:joi.string().min(3).required().label('Please fill Item Specification.'),   
             itemSpeci:joi.string().invalid(' ').label('Please fill Item Specification.'),          
             quantity:joi.number().required().label('Please enter Quantity.'),
             quanty:joi.number().min(0).label('The Quantity cannot be negative.'),
             budget:joi.number().required().label('Please enter Budget.'),
             budg:joi.number().min(0).label('The Budget cannot be negative.'),
         })
         let result=schema.validate({state:state,items:items,itemsCategory:itemsCategory,district:district,vendor:vendor,itemSpecification:itemSpecification,itemSpeci:itemSpecification,quantity:quantity,quanty:quantity,budget:budget,budg:budget});
         console.log('validation hsh '+JSON.stringify(result.error));
         if(result.error){
             console.log('fd'+result.error);
             response.send(result.error.details[0].context.label);
         }
         else{
             if(nonItFormResult.quoteNum<3 && (nonItFormResult.justification==null || nonItFormResult.justification=="" || nonItFormResult.justification==' ')){
                     response.send('Please enter Justification because quote count is not equal to 3.');    
            }
            else{
             let singleRecordValues = [];
             singleRecordValues.push(nonItFormResult.itemsCategory);
             singleRecordValues.push(nonItFormResult.items);
             singleRecordValues.push(nonItFormResult.state);
             singleRecordValues.push(nonItFormResult.district);
             singleRecordValues.push(nonItFormResult.unitCost);
             singleRecordValues.push(nonItFormResult.unit);
           //  singleRecordValues.push(nonItFormResult.otherItems);
             singleRecordValues.push(nonItFormResult.itemSpecification);
             singleRecordValues.push(nonItFormResult.quantity);
             singleRecordValues.push(nonItFormResult.budget);
             singleRecordValues.push(nonItFormResult.imgpath1);
             singleRecordValues.push(nonItFormResult.imgpath2);
             singleRecordValues.push(nonItFormResult.imgpath3);
             singleRecordValues.push(nonItFormResult.quoteNum    );
             singleRecordValues.push(nonItFormResult.justification);
             singleRecordValues.push(nonItFormResult.vendor);
             singleRecordValues.push(nonItFormResult.parentProcurementId);
             lstNonItProcurement.push(singleRecordValues);
             console.log('lstNOnIt'+lstNonItProcurement);
            }
       
 
         }      
    }
    else
    {
         numberOfRows = nonItFormResult.quantity.length;
         console.log('ROW COUnct'+numberOfRows);
         for(let i=0; i< numberOfRows ; i++)
         { 
             let schema=joi.object({
                 state:joi.string().required().label('Please select State.'),
                 district:joi.string().required().label('Please select District.'),
                 itemsCategory:joi.string().required().label('Please select Item Category.'),
                 items:joi.string().invalid('None').required().label('Please fill Items'),
                 vendor:joi.string().required().label(' Please select Vendor from Vendor Picklist.'),
                 itemSpecification:joi.string().min(3).required().label('Please fill Item Specification.'), 
                 itemSpeci:joi.string().invalid(' ').label('Please fill Item Specification.'),            
                 quantity:joi.number().required().label('Please enter Quantity.'),
                 quanty:joi.number().min(0).label('The Quantity cannot be negative.'),
                 budget:joi.number().required().label('Please enter Budget.'),
                 budg:joi.number().min(0).label('The Budget cannot be negative.'),
     
             })
             let result=schema.validate({state:state[i],items:items[i],itemsCategory:itemsCategory[i],district:district[i],vendor:vendor[i],itemSpecification:itemSpecification[i],itemSpeci:itemSpecification[i],quantity:quantity[i],quanty:quantity[i],budget:budget[i],budg:budget[i]});
             console.log('validation REsult mul'+JSON.stringify(result.error));
             if(result.error){
                 console.log('Validation error'+result.error);
                 response.send(result.error.details[0].context.label);
             }
             else{
                // if(nonItFormResult.quoteNum[i]<3 &&(nonItFormResult.justification[i]==null || nonItFormResult.justification[i]=="" || nonItFormResult.justification[i]== ' ')){               
                   if(nonItFormResult.quoteNum[i]<3 && nonItFormResult.justification[i].length <3){
                    console.log('charter count '+nonItFormResult.justification[i].length);
                    response.send('Please enter Justification because quote count is not equal to 3.');    
                 }
                 else{
 
                     let singleRecordValues = [];
                     singleRecordValues.push(nonItFormResult.itemsCategory[i]);
                     singleRecordValues.push(nonItFormResult.items[i]);
                     singleRecordValues.push(nonItFormResult.state[i]);
                     singleRecordValues.push(nonItFormResult.district[i]);
                     singleRecordValues.push(nonItFormResult.unitCost[i]);
                     singleRecordValues.push(nonItFormResult.unit[i]);
                    // singleRecordValues.push(nonItFormResult.otherItems[i]);       
                     singleRecordValues.push(nonItFormResult.itemSpecification[i]);
                     singleRecordValues.push(nonItFormResult.quantity[i]);
                     singleRecordValues.push(nonItFormResult.budget[i]);
                     singleRecordValues.push(nonItFormResult.imgpath1[i]);
                     singleRecordValues.push(nonItFormResult.imgpath2[i]);
                     singleRecordValues.push(nonItFormResult.imgpath3[i]);
                     singleRecordValues.push(nonItFormResult.quoteNum[i]);
                     singleRecordValues.push(nonItFormResult.justification[i]);
                     singleRecordValues.push(nonItFormResult.vendor[i]);
                     singleRecordValues.push(nonItFormResult.parentProcurementId[i]);
                     lstNonItProcurement.push(singleRecordValues);
                     console.log('dj'+singleRecordValues);
                 }
             }
 
        }
    }
    if(typeof(nonItFormResult.quantity) != 'object')
    {
     let nonItProductsInsertQuery = format('INSERT INTO salesforce.Product_Line_Item__c (Products_Services_Name__c, Items__c,State__c,District__c,Per_Unit_Cost__c,unit__c, Product_Service__c, Quantity__c, Budget__c, Quote1__c,Quote2__c	,Quote3__c,Number_of_quotes__c,justification__c,Impaneled_Vendor__c, Asset_Requisition_Form__c ) VALUES %L returning id',lstNonItProcurement);
     console.log('nonItProductsInsertQuery '+nonItProductsInsertQuery);
     pool.query(nonItProductsInsertQuery)
     .then((nonItProductsInsertQueryResult) => {
          console.log('nonItProductsInsertQueryResult  '+JSON.stringify(nonItProductsInsertQueryResult.rows));
          response.send('Saved Successfully');
     })
     .catch((nonItProductsInsertQueryError) => {
          console.log('nonItProductsInsertQueryError  '+nonItProductsInsertQueryError.stack);
          response.send('Error Occured !');
     })
    }
    else{
     console.log('lstNonItProcurement:'+lstNonItProcurement.length+' number of rows :'+nonItFormResult.quantity.length);
    if(lstNonItProcurement.length==nonItFormResult.quantity.length){
     let nonItProductsInsertQuery = format('INSERT INTO salesforce.Product_Line_Item__c (Products_Services_Name__c, Items__c,State__c,District__c,Per_Unit_Cost__c,unit__c, Product_Service__c, Quantity__c, Budget__c, Quote1__c,Quote2__c	,Quote3__c,Number_of_quotes__c,justification__c,Impaneled_Vendor__c, Asset_Requisition_Form__c ) VALUES %L returning id',lstNonItProcurement);
     console.log('nonItProductsInsertQuery '+nonItProductsInsertQuery);
     pool.query(nonItProductsInsertQuery)
     .then((nonItProductsInsertQueryResult) => {
          console.log('nonItProductsInsertQueryResult  '+JSON.stringify(nonItProductsInsertQueryResult.rows));
          response.send('Saved Successfully');
     })
     .catch((nonItProductsInsertQueryError) => {
          console.log('nonItProductsInsertQueryError  '+nonItProductsInsertQueryError.stack);
          response.send('Error Occured !');
     })
    }
 }
 });
 

router.get('/itProducts/:parentAssetId&:isDisabled',verify, (request,response) => {

    let parentAssetId = request.params.parentAssetId;
    console.log('parentAssetId  '+parentAssetId);
    var userId = request.user.sfid; 
    var objUser = request.user;
    console.log('Expense userId : '+userId);
    isDisabled = request.params.isDisabled;
    console.log(' ++++ isDisabled ++++ '+isDisabled); 
    response.render('procurementIT',{name: request.user.name,objUser: objUser, email: request.user.email,isDisabled: isDisabled, parentAssetId: parentAssetId});
});
router.post('/itProducts', (request,response) => {

    console.log('Inside ItProducts Post Method');
    let itFormResult = request.body;
    const{state,items,district,vendor,itemCategory,unitCost,unit,itemSpecification,quantity,budget,justification}=request.body;
    let parentProcurementId = '';
  
    console.log('itFormResult  '+JSON.stringify(itFormResult));
    if(typeof(request.body.parentProcurementId)!='object'){
        parentProcurementId =request.body.parentProcurementId;
        console.log('parentProcurementId '+parentProcurementId);
     }
     else{
        parentProcurementId = request.body.parentProcurementId[0];
       console.log('parentProcurementId '+parentProcurementId);
     }

    let numberOfRows, lstItProducts= [];

    pool
    .query('SELECT sfid,Manager_Approval__c,Procurement_Head_Approval__c,Procurement_Committee_Approval__c,Management_Approval__c,Chairperson_Approval__c FROM salesforce.Asset_Requisition_Form__c WHERE  sfid = $1',[parentProcurementId])
    .then((assetRequistionQueryResult)=>{
      console.log('assetRequistionQueryResult => '+JSON.stringify(assetRequistionQueryResult.rows));
      let str = assetRequistionQueryResult.rows[0];
      console.log('str Asset Detail =>'+JSON.stringify(str));
      if(str.manager_approval__c=='Approved' || str.manager_approval__c=='Pending' || str.procurement_head_approval__c=='Approved' ||  str.procurement_head_approval__c=='Pending' || str.Procurement_Committee_Approval__c=='Approved' || str.Procurement_Committee_Approval__c=='Pending' ||  str.Management_Approval__c=='Approved' || str.Management_Approval__c=='Pending' ||  str.Chairperson_Approval__c=='Approved' || str.Chairperson_Approval__c=='pending' )
      {
        console.log('inside validation');
        response.send('The record cannot be created as the Asset Requisition Form status is PENDING/APPROVED');
       }
      else{
        if(typeof(itFormResult.quantity) != 'object')
        {
            const schema = joi.object({
                 state:joi.string().required().label('Please select State.'),
                 district:joi.string().required().label('Please select District.'),
                 itemCategory:joi.string().required().label('Please select Item Category.'),
                 items:joi.string().invalid('None').required().label('Please fill Items'),
                 vendor:joi.string().required().label(' Please select Vendor from Vendor Picklist.'),
                 itemSpecification:joi.string().min(3).required().label('Please fill Item Specification.'),
                 itemSpeci:joi.string().invalid(' ').label('Please fill Item Specification.'),
                 quantity:joi.number().required().label('Please enter Quantity.'),
                 quanty:joi.number().min(0).label('The Quantity cannot be negative.'),
                 budget:joi.number().required().label('Please enter Budget.'),
                 budg:joi.number().min(0).label('The budget cannot be negative.'),
                })
            let result=schema.validate({state:state,district:district,itemCategory:itemCategory,items:items,vendor:vendor,itemSpecification:itemSpecification,itemSpeci:itemSpecification,quantity:quantity,quanty:quantity,budget:budget,budg:budget});
            console.log('validation REsult '+JSON.stringify(result.error));
            if(result.error){
                console.log('fd'+result.error);
                response.send(result.error.details[0].context.label);
            }
            else{
               // if(itFormResult.quoteNum<3 &&(itFormResult.justification==null || itFormResult.justification=="" || itFormResult.justification==' ')){
                  if(itFormResult.quoteNum<3 && itFormResult.justification.length < 2 ){
                       response.send('Please enter Justification because quote count is not equal to 3.');     
                 }
                 else{
                    let singleItProductRecordValue = [];
                    singleItProductRecordValue.push(itFormResult.items);
                    singleItProductRecordValue.push(itFormResult.vendor);
                    singleItProductRecordValue.push(itFormResult.itemSpecification);
                    singleItProductRecordValue.push(itFormResult.state);
                    singleItProductRecordValue.push(itFormResult.district );
                    singleItProductRecordValue.push(itFormResult.unitCost);
                    singleItProductRecordValue.push(itFormResult.unit);
                    singleItProductRecordValue.push(itFormResult.quantity);
                    singleItProductRecordValue.push(itFormResult.budget);
                    singleItProductRecordValue.push(itFormResult.imgpath1);
                    singleItProductRecordValue.push(itFormResult.imgpath2);
                    singleItProductRecordValue.push(itFormResult.imgpath3);
                    singleItProductRecordValue.push(itFormResult.quoteNum);
                    singleItProductRecordValue.push(itFormResult.justification);
                    singleItProductRecordValue.push(itFormResult.parentProcurementId);
                    lstItProducts.push(singleItProductRecordValue);
                    console.log('else '+lstItProducts);
                 }          
               
            }
        }
        else
        {
            numberOfRows = itFormResult.quantity.length;
            console.log('rowCount= '+numberOfRows);
            for(let i=0; i< numberOfRows ; i++)
            {
                const schema = joi.object({
                    state:joi.string().required().label('Please select State.'),
                    district:joi.string().required().label('Please select District.'),
                    items:joi.string().invalid('None').required().label('Please fill Items'),
                    vendor:joi.string().required().label(' Please select Vendor from Vendor Picklist.'),
                    itemSpecification:joi.string().min(3).required().label('Please fill Item Specification.'),  
                    itemSpeci:joi.string().invalid(' ').label('Please fill Item Specification.'),        
                    quantity:joi.number().required().label('Please enter Quantity.'),
                    quanty:joi.number().min(0).label('The Quantity cannot be negative.'),
                    budget:joi.number().required().label('Please enter Budget.'),
                    budg:joi.number().min(0).label('The budget cannot be negative.'),
                })
                let result=schema.validate({state:state[i],items:items[i],district:district[i],vendor:vendor[i],itemSpecification:itemSpecification[i],itemSpeci:itemSpecification[i],quantity:quantity[i],quanty:quantity[i],budget:budget[i],budg:budget[i]});
                console.log('validation REsult '+JSON.stringify(result.error));
                if(result.error){
                    console.log('fd'+result.error);
                    response.send(result.error.details[0].context.label);
                }
                else{                
                   // if(itFormResult.quoteNum[i]<3 &&(itFormResult.justification[i]==null || itFormResult.justification[i]=="" || itFormResult.justification[i]== ' ' || itFormResult.justification=='  ')){
                    if(itFormResult.quoteNum[i]<3 && itFormResult.justification[i].length<3){
                       response.send('Please enter Your Justificaton for Quote less than 3 in row number');     
                 }
                 else{
                    let singleItProductRecordValue = [];
                    singleItProductRecordValue.push(itFormResult.items[i]);
                    singleItProductRecordValue.push(itFormResult.vendor[i]);
                    singleItProductRecordValue.push(itFormResult.itemSpecification[i]);
                    singleItProductRecordValue.push(itFormResult.state[i]);
                    singleItProductRecordValue.push(itFormResult.district[i]);
                    singleItProductRecordValue.push(itFormResult.unitCost[i]);
                    singleItProductRecordValue.push(itFormResult.unit[i]);
                    singleItProductRecordValue.push(itFormResult.quantity[i]);
                    singleItProductRecordValue.push(itFormResult.budget[i]);
                    singleItProductRecordValue.push(itFormResult.imgpath1[i]);
                    singleItProductRecordValue.push(itFormResult.imgpath2[i]);
                    singleItProductRecordValue.push(itFormResult.imgpath3[i]);
                    singleItProductRecordValue.push(itFormResult.quoteNum[i]);
                    singleItProductRecordValue.push(itFormResult.justification[i]);
                    singleItProductRecordValue.push(itFormResult.parentProcurementId[i]);
                    lstItProducts.push(singleItProductRecordValue);
                    console.log('itFormResult.items[i]'+itFormResult.items[i]);
                    console.log('itFormResult.vendor[i]'+itFormResult.vendor[i]);
                    console.log('itFormResult.itemSpecification[i]'+itFormResult.itemSpecification[i]);
                    console.log('itFormResult.state[i]'+itFormResult.state[i]);
                 }
                }
            }
            console.log('lstProduct '+lstItProducts);
        }
    
        console.log('lstItProducts  '+JSON.stringify(lstItProducts));
        if(typeof(itFormResult.quantity)!='object'){
            console.log('single row');
            const itProductsInsertQuery = format('INSERT INTO salesforce.Product_Line_Item_IT__c (Items__c,Impaneled_Vendor__c,Product_Service_specification__c,State__c,District__c,Per_Unit_Cost__c,Unit__c, Quantity__c, Budget__c,Quote1__c,Quote2__c,Quote3__c,Number_of_quotes__c,justification__c ,Asset_Requisition_Form__c ) values %L returning id',lstItProducts);
            console.log(itProductsInsertQuery);
            pool.query(itProductsInsertQuery)
            .then((itProductsInsertQueryResult) => {
                console.log('itProductsInsertQueryResult  : '+JSON.stringify(itProductsInsertQueryResult.rows));
                response.send('Saved Successfully !');
            })
            .catch((itProductsInsertQueryError) => {
                console.log('itProductsInsertQueryError  : '+itProductsInsertQueryError.stack);
                response.send('Error Occurred !');
            })
    
        }
       if(lstItProducts.length==numberOfRows)
       {
        const itProductsInsertQuery = format('INSERT INTO salesforce.Product_Line_Item_IT__c (Items__c,Impaneled_Vendor__c,Product_Service_specification__c,State__c,District__c,Per_Unit_Cost__c,Unit__c, Quantity__c, Budget__c,Quote1__c,Quote2__c,Quote3__c,Number_of_quotes__c,justification__c ,Asset_Requisition_Form__c ) values %L returning id',lstItProducts);
        console.log('itProductsInsertQuery'+itProductsInsertQuery);
        pool.query(itProductsInsertQuery)
        .then((itProductsInsertQueryResult) => {
            console.log('itProductsInsertQueryResult  : '+JSON.stringify(itProductsInsertQueryResult.rows));
            response.send('Saved Successfully !');
        })
        .catch((itProductsInsertQueryError) => {
            console.log('itProductsInsertQueryError  : '+itProductsInsertQueryError.stack);
            response.send('Error Occurred !');
        })
       }
        

      }
    })
    .catch((error)=>{
        console.log('Error in validation Parent Objct Asset REquisition Form '+JSON.stringify(error.stack));
    })
});

router.get('/getRelatedQuote',(request, response) => {
    let filterValues = request.query.filtervalues;
    console.log('filtervalues  '+JSON.stringify(filterValues));
    console.log('filterValues.itemsCategoryValue '+filterValues.itemsCategoryValue);

    pool.query('SELECT sfid FROM salesforce.Impaneled_Vendor__c WHERE location_vendor__c = $1 ',[filterValues.placeValue])
    .then((QuoteQueryResult) => {
        console.log('QuoteQueryResult  '+JSON.stringify(QuoteQueryResult.rows));
        if(QuoteQueryResult.rowCount > 0)
        {
            response.send(QuoteQueryResult.rows[0]);
        }
        else
        {
            console.log('Else Block');
            response.send('Not Found');
        }
    })
    .catch((QuoteQueryError) => {
        console.log('QuoteQueryError  '+QuoteQueryError.stack);
        response.send('Not Found');
    })
});

router.get('/getCostandGSt',async(request,response)=>{
    let data=request.query.data;
    console.log('Data requiremet'+JSON.stringify(data));
    let st =data[0].state;
    let dstr=data[0].district;
    let ite=data[0].item;
    console.log('district'+dstr);
    console.log('item'+ite);
    console.log('state'+st);
    let qry='';
    let lst=[];
    let vender=[];
    let itemDesId=[];
    let qryItem='select sfid ,name,Impaneled_Vendor__c from salesforce.Item_Description__c WHERE Items__c =$1';  
     console.log('qryItem '+qryItem);
     await
     pool.query(qryItem,[ite])
     .then((result)=>{
         console.log('result '+JSON.stringify(result.rows));
         result.rows.forEach((each)=>{
            itemDesId.push(each);
         })
     })
     .catch((error)=>{
         console.log('Error  '+JSON.stringify(error.stack));
         response.send(error);
     })
     if(dstr=='' || dstr==null)
     {
         qry='SELECT sfid,vendor_name__c,GST_No__c FROM salesforce.Impaneled_Vendor__c WHERE state__c = $1 ';
         lst.push(st);
         lst.push(ite);
         console.log('qryyy '+qry+'lstItem '+lst);
     }
     else{
         qry='SELECT sfid,vendor_name__c,GST_No__c FROM salesforce.Impaneled_Vendor__c WHERE state__c = $1 AND District__c = $2  ';
         lst=[st,dstr];
         console.log('qry '+qry+'lst '+lst);
     }
     console.log("items "+JSON.stringify(itemDesId));
     await
     pool
     .query(qry,lst)
     .then((querryResult)=>{
         console.log('querryResult '+JSON.stringify(querryResult.rows));
         if(querryResult.rowCount>0)
         {
            querryResult.rows.forEach((each)=>{
                   itemDesId.forEach((eachItem)=>{
                       if(each.sfid==eachItem.impaneled_vendor__c){
                        vender.push(each);
                       }
            })
           })  
           console.log
           response.send(vender);                   
         }       
     })
     .catch((querryError)=>{
         console.log('querryError '+querryError.stack);
         response.send(querryError);
     })
})

router.get('/getCostPerUnit',(request,response)=>{
    let sid=request.query.sid;
    console.log('seleceted ID =>'+sid);
    pool
    .query('SELECT sfid,Per_Unit_Cost__c,unit__c,items__c,Public_Quote_URL__c FROM salesforce.Item_Description__c where Impaneled_Vendor__c =$1',[sid])
    .then((querryResult)=>{
        console.log('queryResult  =>'+JSON.stringify(querryResult)+' '+ querryResult.rowCount);
        response.send(querryResult.rows);
    })
    .catch((querryError)=>{
        console.log(querryError.stack);
        response.send(querryError);
    })
})

router.get('/getProjectList', verify ,(request,response) => {

    console.log('hello i am inside Expense Project');
    console.log('Expense request.user '+JSON.stringify(request.user));
    var userId = request.user.sfid; 
    var projectName =''; 
    var objUser =request.user;
      console.log('Obj user => '+JSON.stringify(objUser));
      var projectName ='';
      if(objUser.isManager){
        console.log('manager login ... ');
        pool
        .query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',[userId])
        .then(contactResult => 
          {
            console.log('Name of Contact  :: '+contactResult.rows[0].name+' sfid'+contactResult.rows[0].sfid);
            var contactId = contactResult.rows[0].sfid;                 
            pool
            .query('SELECT sfid, Name FROM salesforce.team__c WHERE manager__c = $1 ;',[contactId])
            .then(teamMemberResult => 
              {
                console.log('Name of TeamMemberId  : '+teamMemberResult.rows[0].name+'   sfid :'+teamMemberResult.rows[0].sfid);
                console.log('Team Id  : '+teamMemberResult.rows[0].sfid);
                console.log('Number of Team Member '+teamMemberResult.rows.length);
                  var projectTeamparams = [], lstTeamId = [];
                  for(var i = 1; i <= teamMemberResult.rows.length; i++) 
                   {
                     projectTeamparams.push('$' + i);
                    lstTeamId.push(teamMemberResult.rows[i-1].sfid);
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
    else {
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
})

router.get('/getProcurementApproval/:parentAssetId&:isDisabled',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    let parentAssetId = request.params.parentAssetId;
    console.log('parentAssetId  '+parentAssetId);
    let isDisabled = request.params.isDisabled;
    console.log('parentAssetId  '+isDisabled);
    response.render('approvalView',{objUser,isDisabled,parentAssetId:parentAssetId});
})

router.get('/getProcurementApprovalList',verify,(request,response)=>{
    let assetId=request.query.parentId;
    console.log('AssetId  '+assetId);
    pool
    .query('SELECT sfid, Name, Approval_Type__c, Status__c, Approver_s_Emails__c,createddate FROM salesforce.Approval__c WHERE Asset_Requisition_Form__c = $1 ',[assetId])
    .then((approvalQueryResult) => {
        console.log('approvalQueryResultnonIt'+JSON.stringify(approvalQueryResult.rows)+'ROWCOUNT: '+approvalQueryResult.rowCount);
        if(approvalQueryResult.rowCount>0){

            let modifiedApprovalList = [],i =1;
            approvalQueryResult.rows.forEach((eachRecord) => {
              let obj = {};
              let crDate = new Date(eachRecord.createddate);
              crDate.setHours(crDate.getHours() + 5);
              crDate.setMinutes(crDate.getMinutes() + 30);
              let strDate = crDate.toLocaleString();
              obj.sequence = i;
              obj.name = '<a href="#" data-toggle="modal" data-target=""  id="'+eachRecord.sfid+'" class="approvalTag" >'+eachRecord.name+'</a>';

           //   obj.name = '<a href="#" class="approvalTag"" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
              obj.type = eachRecord.approval_type__c;
              obj.status=eachRecord.status__c;
              obj.app_email = eachRecord.approver_s_emails__c;
              obj.createddate = strDate;
              i= i+1;
              modifiedApprovalList.push(obj);
            })
            response.send(modifiedApprovalList);
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

router.get('/getProcurementApprovalDetails',verify,(request,response)=>{
    let approvalId=request.query.approvalId;
    console.log('approvalId  '+approvalId);
    let approvalDetail={};
    let qry='SELECT app.sfid, app.Name,app.Approval_Type__c,app.Status__c,app.Approver_s_Emails__c, asset.name as assetname, con.name as conname, app.Approval_Comment__c,app.Asset_Requisition_Form__c,app.Submitted_By_Heroku_User__c '+
    'FROM salesforce.Approval__c app '+
    'INNER JOIN salesforce.Asset_Requisition_Form__c asset '+
    'ON app.Asset_Requisition_Form__c = asset.sfid '+
    'INNER JOIN salesforce.Contact con '+
    'ON app.Submitted_By_Heroku_User__c = con.sfid '+
     'WHERE app.sfid=$1';

     let historyQry='SELECT apphist.sfid,apphist.Name,apphist.Approval__c,apphist.Status__c,apphist.Approver_Email__c,apphist.Comment__c,apphist.Approver__c, usr.name as username '+
     'FROM salesforce.Approval_History__c apphist '+
     'INNER JOIN salesforce.User usr '+
     'ON apphist.Approver__c=usr.sfid '+
      'WHERE apphist.Approval__c = $1';
  
    console.log('Querryyy of approval' +qry);
    console.log('history Query' +historyQry);

    pool
    .query(qry,[approvalId])
    .then((querryResult)=>{
    console.log('QuerryResult=>'+JSON.stringify(querryResult.rows));
   approvalDetail.approval=querryResult.rows;
    console.log('approvalDetailsQueryResult '+JSON.stringify(approvalDetail));
    pool
    .query(historyQry,[approvalId])
                .then((queryResult)=>{
                         console.log('queryResult'+JSON.stringify(queryResult));
                         approvalDetail.history=queryResult.rows;
                         console.log('approvalDetail list :'+JSON.stringify(approvalDetail));
                         response.send(approvalDetail);
                })
                .catch((error)=>{
                    console.log('erroror '+JSON.stringify(error.stack));
                })
                .catch((querryError)=>{
                console.log('QuerrError '+querryError.stack);
                response.send(querryError);
                })
    })


})


router.get('/getProcurementItListView/:parentAssetId&:isDisabled',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    let parentAssetId = request.params.parentAssetId;
    console.log('parentAssetId ++++  '+parentAssetId);
    isDisabled = request.params.isDisabled;
    console.log(' ++++ isDisabled ++++ '+isDisabled); 
    response.render('procurementListView',{objUser,isDisabled,parentAssetId: parentAssetId});
})

router.get('/itProcurementList',(request,response)=>{
    let parentAssetId=request.query.parentId;
    console.log('parentAssetId '+parentAssetId);
    console.log('Your are inside the IT PRCUREMENT List Router method');
    let qry='SELECT procIT.sfid,procIT.Name as procItName ,procIT.Items__c,procIT.Number_of_quotes__c , procIT.createddate, procIT.Product_Service_specification__c,vend.name as venderName,procIT.Quantity__c, procIT.Budget__c,procIT.Impaneled_Vendor__c '+
            'FROM salesforce.Product_Line_Item_IT__c procIT '+
            'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
            'ON procIT.Impaneled_Vendor__c =  vend.sfid '+
            'WHERE procIT.Asset_Requisition_Form__c=$1';
            console.log('qyer '+qry)
     pool
    .query(qry,[parentAssetId])
    .then((querryResult)=>{
        console.log('querryResult'+JSON.stringify(querryResult.rows)+'ROWCOUNT: '+querryResult.rowCount);
        if(querryResult.rowCount>0){

            let modifiedProcurementITList = [],i =1;
            querryResult.rows.forEach((eachRecord) => {
              let obj = {};
              let crDate = new Date(eachRecord.createddate);
                crDate.setHours(crDate.getHours() + 5);
                crDate.setMinutes(crDate.getMinutes() + 30);
                let strDate = crDate.toLocaleString();
              obj.sequence = i;
              obj.name = '<a href="#" class="procureItTag" id="'+eachRecord.sfid+'" >'+eachRecord.procitname+'</a>';
              obj.item = eachRecord.items__c;
              obj.item_spec = eachRecord.product_service_specification__c;
              obj.quantity = eachRecord.quantity__c;
              obj.budget = eachRecord.budget__c;
              obj.no = eachRecord.number_of_quotes__c;
              obj.vendor=eachRecord.vendername;
              obj.createdDate = strDate;
             // obj.editAction = '<button href="#" class="btn btn-primary editProcIt" id="'+eachRecord.sfid+'" >Edit</button>'
             if(isDisabled == 'true')
             {
                console.log('++Inside if check ++ '+isDisabled);
             obj.deleteAction = '<button href="#" class="btn btn-primary deleteProcIt" disabled = "true" id="'+eachRecord.sfid+'" >Delete</button>'
            } else{
                console.log('++Inside else check ++ '+isDisabled);
                obj.deleteAction = '<button href="#" class="btn btn-primary deleteProcIt" id="'+eachRecord.sfid+'" >Delete</button>'
            }
              i= i+1;
              modifiedProcurementITList.push(obj);
            })
            response.send(modifiedProcurementITList);
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
router.get('/getProcurementITDetail',(request,response)=>{
      let procurementId=request.query.procurementId;
      var procDetail={};
        console.log('getProcurementITDetail Id='+procurementId);
        let qry='SELECT procIT.sfid,procIT.Name as procItName,procIT.Others__c,procIT.state__c,procIT.district__c,procIT.Justification__c,procIT.Number_of_quotes__c,procIT.Per_Unit_Cost__c,procIT.Unit__c,procIT.Quote1__c,procIT.Quote2__c,procIT.Quote3__c,procIT.Items__c ,procIT.Product_Service_specification__c,vend.name as venderName,procIT.Quantity__c, procIT.Budget__c,procIT.Impaneled_Vendor__c '+
        'FROM salesforce.Product_Line_Item_IT__c procIT '+
        'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
        'ON procIT.Impaneled_Vendor__c =  vend.sfid '+        
        'WHERE procIt.SFID=$1';
    console.log('Query '+qry);
    pool
    .query(qry,[procurementId])
    .then((querryResult)=>{
        console.log('QuerryResult=>'+JSON.stringify(querryResult.rows));
        procDetail.proc=querryResult.rows;
        pool.query('SELECT sfid,Name,Timely_submissions_of_Deliverables_Goods__c,Work_Quality_Goods_Quality__c,Quyantiut__c,Issue_Knowledge_Expertise__c,Procurement_IT__c FROM salesforce.Feedbacks_IT__c WHERE Procurement_IT__c=$1',[procurementId])
                .then((queryResult)=>{
                         console.log('queryResult'+JSON.stringify(queryResult));
                         procDetail.feedback=queryResult.rows;
                         console.log('procDetail list :'+JSON.stringify(procDetail));
                         response.send(procDetail);
                })
                .catch((error)=>{
                    console.log('erroror '+JSON.stringify(error.stack));
                })
    
    })
    .catch((querryError)=>{
        console.log('QuerrError '+querryError.stack);
        response.send(querryError);

    })
})
/**********************************  NON IT PROCUREMENT LIST VIEW   ******************************/
var isDisabled = false;

router.get('/getNonItProcurementListVIew/:parentAssetId&:isDisabled',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    let parentAssetId = request.params.parentAssetId;
    console.log('parentAssetId  '+parentAssetId);
     isDisabled = request.params.isDisabled;
    console.log(' ++++ isDisabled ++++ '+isDisabled); 
    response.render('getNonItProcurementList',{objUser,isDisabled,parentAssetId: parentAssetId});
    
})

router.get('/NonItProcurementList',(request,response)=>{
    let parentAssetId=request.query.parentId;
    console.log('nonIT DETAIL LIST for parent id=  '+parentAssetId);
   
    let qry='SELECT proc.sfid,proc.Name as procName ,proc.Items__c ,proc.Products_Services_Name__c, proc.createddate, vend.name as vendorName,proc.Product_Service__c,proc.Quantity__c, proc.Number_of_quotes__c, proc.Budget__c,proc.Impaneled_Vendor__c '+
    'FROM salesforce.Product_Line_Item__c proc '+
    'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
    'ON proc.Impaneled_Vendor__c =  vend.sfid '+
    'WHERE proc.Asset_Requisition_Form__c=$1';
    console.log('Queryy=> '+qry);
    pool
    .query(qry,[parentAssetId])
    .then((querryResult)=>{
        console.log('querryResultnonIt'+JSON.stringify(querryResult.rows)+'ROWCOUNT: '+querryResult.rowCount);
        if(querryResult.rowCount>0){

            let modifiedProcurementList = [],i =1;
            querryResult.rows.forEach((eachRecord) => {
              let obj = {};
              let crDate = new Date(eachRecord.createddate);
              crDate.setHours(crDate.getHours() + 5);
              crDate.setMinutes(crDate.getMinutes() + 30);
              let strDate = crDate.toLocaleString();
              obj.sequence = i;
              obj.name = '<a href="#" class="procurementTag" id="'+eachRecord.sfid+'" >'+eachRecord.procname+'</a>';
              obj.item = eachRecord.items__c;
              obj.item_spec=eachRecord.product_service__c;
              obj.item_category = eachRecord.products_services_name__c;
              obj.quantity = eachRecord.quantity__c;
              obj.budget = eachRecord.budget__c;
              obj.no = eachRecord.number_of_quotes__c;
              obj.vendor=eachRecord.vendorname;
              obj.createdDate = strDate;
           //   obj.editAction = '<button href="#" class="btn btn-primary editProcurement" id="'+eachRecord.sfid+'" >Edit</button>'
             console.log('++Inside PROCUREMENT NON-IT isDisabled ++ '+isDisabled);
            if(isDisabled == 'true')
            {
                console.log('++Inside if check ++ '+isDisabled);
                obj.deleteAction = '<button href="#" class="btn btn-primary deleteProcIt" disabled = "true" id="'+eachRecord.sfid+'" >Delete</button>'
            } else{
                console.log('++Inside else check ++ '+isDisabled);
                obj.deleteAction = '<button href="#" class="btn btn-primary deleteProcIt" id="'+eachRecord.sfid+'" >Delete</button>'
            }
             
           i= i+1;
              modifiedProcurementList.push(obj);
            })
            response.send(modifiedProcurementList);
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
router.get('/getProcurementDetail',async(request,response)=>{
    let procurementId=request.query.procurementId;
    console.log('getProcurementITDetail Id='+procurementId);
    let procDetail={};
    let qry='SELECT proc.sfid,proc.Name as procName ,proc.Items__c ,proc.Others__c,proc.Products_Services_Name__c,vend.name as vendorName,proc.Product_Service__c,proc.Quantity__c, proc.Budget__c,proc.Impaneled_Vendor__c, '+
    'proc.State__c,proc.District__c,proc.Quote1__c,proc.Quote2__c,proc.Quote3__c,proc.Per_Unit_Cost__c,proc.unit__c,proc.Number_of_quotes__c,proc.justification__c '+
    'FROM salesforce.Product_Line_Item__c proc '+
    'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
    'ON proc.Impaneled_Vendor__c =  vend.sfid '+
    'WHERE proc.sfid=$1';
    pool
    .query(qry,[procurementId])
    .then((querryResult)=>{
    console.log('QuerryResult=>'+JSON.stringify(querryResult.rows));
   // response.send(querryResult.rows);
    procDetail.proc=querryResult.rows;
    console.log('oddskd '+JSON.stringify(procDetail));
    pool.query('SELECT sfid,Name,Timely_submissions_of_all_Deliverables__c,Work_Quality_Goods_Quality__c,Issue_Knowledge_Expertise__c,quantity_requested_vs_received__c,Procurement_Non_IT__c FROM salesforce.Feedback__c WHERE Procurement_Non_IT__c = $1',[procurementId])
                .then((queryResult)=>{
                         console.log('queryResult'+JSON.stringify(queryResult));
                         procDetail.feedback=queryResult.rows;
                         console.log('procDetail list :'+JSON.stringify(procDetail));
                         response.send(procDetail);
                })
                .catch((error)=>{
                    console.log('erroror '+JSON.stringify(error.stack));
                })
                .catch((querryError)=>{
                console.log('QuerrError '+querryError.stack);
                response.send(querryError);
                })
    })
})
router.post('/updateProcurement',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { specification, quantity,budget,hide} = request.body;
    console.log('specification of Item  '+specification);
    console.log('Procurement id  '+hide);
    console.log('budget  '+budget);
    let updateQuerry = 'UPDATE salesforce.Product_Line_Item__c SET '+
                         'product_service__c = \''+specification+'\', '+
                         'quantity__c = \''+quantity+'\', '+
                         'budget__c = \''+budget+'\' '+
                         'WHERE sfid = $1';
  console.log('updateQuerry  '+updateQuerry);
    pool
    .query(updateQuerry,[hide])
    .then((updateProcurementResult) => {     
             console.log('updateProcurementResult '+JSON.stringify(updateProcurementResult));
             response.send('Success');
    })
    .catch((updatetError) => {
         console.log('updatetError   '+updatetError.stack);
         response.send('Error');
    })
})

router.post('/updateProcurementIt',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { specification, quantity,budget,hide} = request.body;
    console.log('specification of Item  '+specification);
    console.log('Procurement id  '+hide);
    console.log('budget  '+budget);
    let updateQuerry = 'UPDATE salesforce.Product_Line_Item_IT__c SET '+
                         'product_service_specification__c = \''+specification+'\', '+
                         'quantity__c = \''+quantity+'\', '+
                         'budget__c = \''+budget+'\' '+
                         'WHERE sfid = $1';
  console.log('updateQuerry  '+updateQuerry);
    pool
    .query(updateQuerry,[hide])
    .then((updateProcurementITResult) => {     
             console.log('updateProcurementItResult =>>'+JSON.stringify(updateProcurementITResult));
             response.send('Success');
    })
    .catch((updatetError) => {
         console.log('updatetError'+updatetError.stack);
         response.send('Error');
    })
  })

router.get('/getVendorListView',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);  
    response.render('VendorlistView',{objUser});

})

router.get('/getVendorsList',(request,response)=>{
    let qry ='select sfid ,name,vendor_Name__c ,Contact_No__c,name_of_signing_authority__c,address__c,createddate,GST_No__c,Reason_for_not_providing_GST_no__c,Bank_IFSC_Code__c ,Bank_Account_No__c,State__c,District__c '+
     'FROM salesforce.Impaneled_Vendor__c WHERE sfid IS NOT NULL';
     console.log('qry  =>'+qry)
     pool.query(qry)
     .then((vendorQueryResult) => {
         console.log('vendorQueryResult  : '+JSON.stringify(vendorQueryResult.rows));
         if(vendorQueryResult.rowCount>0){

            let modifiedList = [],i =1;
            vendorQueryResult.rows.forEach((eachRecord) => {
              let obj = {};
              let crDate = new Date(eachRecord.createddate);
              crDate.setHours(crDate.getHours() + 5);
              crDate.setMinutes(crDate.getMinutes() + 30);
              let strDate = crDate.toLocaleString();
              obj.sequence = i;
              obj.editAction = '<button href="#" class="btn btn-primary editVendor" id="'+eachRecord.sfid+'" >Edit</button>'
              obj.name = '<a href="#" class="vendorTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
              obj.vendorname = eachRecord.vendor_name__c;
              obj.state = eachRecord.state__c;
              obj.district = eachRecord.district__c;
              obj.signAuthority=eachRecord.name_of_signing_authority__c;
              obj.contact =eachRecord.contact_no__c;
              obj.add = eachRecord.address__c;
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

router.get('/getVondor/:parentId',verify,(request,resposne)=>{
    let parentId=request.params.parentId;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+parentId);
    resposne.render('vendorDetailPage',{parentId,objUser});
})


router.get('/getVendorDetail',async(request,response)=>{
    let vendorId=request.query.vendorId;
    console.log('vendorId '+vendorId);
    
    let qry ='';
    console.log('qry Detail =>'+qry);
    let recordDeatil={};
    await
    pool
    .query('select sfid ,name,vendor_Name__c ,contact_no__c,name_of_signing_authority__c,bank_details__c,pan_no__c,address__c,GST_No__c,Reason_for_not_providing_GST_no__c,Bank_IFSC_Code__c ,Bank_Account_No__c,ownerid,State__c,District__c '+
    'FROM salesforce.Impaneled_Vendor__c where sfid =$1 ',[vendorId])
    .then((queryResult)=>{
        console.log('queryResult +>'+JSON.stringify(queryResult.rows));
        recordDeatil.VendorDetail=queryResult.rows;
        console.log('record '+recordDeatil);

        //response.send(queryResult.rows);
    })
    .catch((error)=>{
        console.log('error =>'+JSON.stringify(error.stack));
        response.send(error);
    })
await
pool
.query('select sfid ,name,Impaneled_Vendor__c,Unit__c,	Items__c,Per_Unit_Cost__c,Category__c '+
'FROM salesforce.Item_Description__c where impaneled_vendor__c=$1',[vendorId])
.then((itemdescriptionQueryy)=>{
    console.log('ten description =>'+JSON.stringify(itemdescriptionQueryy.rows));
    recordDeatil.item=itemdescriptionQueryy.rows;
})
.catch((error)=>{
    console.log('error '+error.stack);
    response.send(error);
})
console.log('reccord' +recordDeatil);
response.send(recordDeatil);
})
router.get('/createvendor',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    response.render('createImpaneledVendor',{objUser});
})
router.get('/ItemDescription/:parentVendor',verify,(request,response)=>{
    let parentVendor = request.params.parentVendor;
    console.log('parentVendor '+parentVendor);
    let objUser=request.user;
    console.log('user '+objUser);
    response.render('ItemDescriptionForm',{parentVendor,objUser});

})
router.post('/saveItemDescription',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    let schema, result;
    const{name,items,category,unit,cost,other,hide}=request.body;
    let record = [];
    if(items == 'Other Items')
    {
        schema=joi.object({
            category:joi.string().required().label('Please Choose Item Category'),
            unit:joi.string().min(2).required().label('Please Fill Unit'),
            items:joi.string().required().label('Please Select Items'),
            cost:joi.string().min(1).required().label('Please Fill Per Unit Cost'),
            other:joi.string().min(1).max(255).required().label('Please Fill Others as you have choosen other Items'),
              })
        result = schema.validate({category:category,unit:unit,items:items,cost:cost,other:other});
        
    }
    
    else
    {
        schema=joi.object({
            category:joi.string().required().label('Please Choose Item Category'),
            unit:joi.string().min(2).required().label('Please Fill Unit'),
            items:joi.string().required().label('Please Select Items'),
            cost:joi.string().min(1).required().label('Please Fill Per Unit Cost'),
              })
        result = schema.validate({category:category,unit:unit,items:items,cost:cost});
    }
        if(result.error)
        {
            console.log('fd'+result.error);
            response.send(result.error.details[0].context.label);    
        }
          else{

                    record.push(items);
                    record.push(cost);
                    record.push(category);
                    record.push(unit);
                    record.push(other);
                    record.push(hide);
                    let recordlist=[];
                recordlist.push(record);
                console.log(recordlist);

                let itemDescQuery = format('INSERT INTO salesforce.Item_Description__c (Items__c,Per_Unit_Cost__c, Category__c,Unit__c,Other_Items__c,Impaneled_Vendor__c ) VALUES %L returning id',recordlist);
                console.log('impaneledVendor=>'+itemDescQuery);
                pool
                .query(itemDescQuery)
                .then((querryResult)=>{
                    console.log('QuerryResult'+JSON.stringify(querryResult));
                    response.send('Succesfully Inserted');
                })
                .catch((error)=>{
                    console.log(error.stack);
                    response.send(error);
                })
          }
})
  router.post('/saveVendor',(request,response)=>{
    let body = request.body;
    let schema, result;
    console.log('body  : '+JSON.stringify(body));
    const{name,authority, cont,bankkDet,ifsc,pan,gst,add,accNo,state,url,other,district,reason}=request.body;
    console.log(name+authority+cont+bankkDet+ifsc+pan+gst+add+accNo+state+url+other+district+reason);

    if(gst == null || gst == '' )
    {    
        if(request.body.pan){
            console.log('aaaaaaaaaaaaaaaa');
            schema=joi.object({
                state:joi.string().required().label('Please Choose State'),
               district:joi.string().required().label('Please Choose District'),
               name:joi.string().min(3).max(80).required().label('Please Fill Vendor Name'),
               conta:joi.string().required().label('Please Enter Contact Number'),
               cont:joi.number().integer().min(1000000000).max(9999999999).required().label('Contact number should have exact 10 digits'),
               pan:joi.string().min(10).max(10).label('Pan Number Should be Exactly of 10 Digits'),
               bankkDet:joi.string().min(3).max(255).required().label('Please Fill Bank Details'),
               accNo:joi.string().min(3).required().label('Please Fill Bank Account Number'),
               ifsc:joi.string().min(3).max(20).required().label('Please Fill Bank IFSC Code.'),
               reason:joi.string().min(3).max(255).required().label('Please Fill Reason for not providing GST no.'),
               
                 })
           result = schema.validate({pan:pan,conta:cont,cont:cont,state:state,district:district,name:name,bankkDet:bankkDet,accNo:accNo,ifsc:ifsc,reason:reason});
           
        }
        else{

            console.log('bbbbbbbbbbbbbbbbbbbb');
            schema=joi.object({
                state:joi.string().required().label('Please Choose State'),
               district:joi.string().required().label('Please Choose District'),
               name:joi.string().min(3).max(80).required().label('Please Fill Vendor Name'),
               conta:joi.string().required().label('Please Enter Contact Number'),
               cont:joi.number().integer().min(1000000000).max(9999999999).required().label('Contact number should have exact 10 digits'),
              // pan:joi.string().min(10).max(10).label('Pan Number Should be Exactly of 10 Digits'),
               bankkDet:joi.string().min(3).max(255).required().label('Please Fill Bank Details'),
               accNo:joi.string().min(3).required().label('Please Fill Bank Account Number'),
               ifsc:joi.string().min(3).max(20).required().label('Please Fill Bank IFSC Code.'),
               reason:joi.string().min(3).max(255).required().label('Please Fill Reason for not providing GST no.'),
               
                 })
             result = schema.validate({conta:cont,cont:cont,state:state,district:district,name:name,bankkDet:bankkDet,accNo:accNo,ifsc:ifsc,reason:reason});
           

        }
       
    }

     else
     {   
         if(request.body.pan){
             console.log('ccccccccccccccc');
            schema=joi.object({
                state:joi.string().required().label('Please Choose State'),
                district:joi.string().required().label('Please Choose District'),
                name:joi.string().min(3).max(80).required().label('Please Fill Vendor Name'),
                conta:joi.string().required().label('Please Enter Contact Number'),
                cont:joi.number().integer().min(1000000000).max(9999999999).required().label('Contact number should have exact 10 digits'),
                bankkDet:joi.string().min(3).max(255).required().label('Please Fill Bank Details'),
                pan:joi.string().min(10).max(10).label('Pan Number Should be Exactly of 10 Digits'),
                accNo:joi.number().required().label('Please Fill Bank Account Number'),
                ifsc:joi.string().min(3).max(20).required().label('Please Fill Bank IFSC Code.'),
                  })
             result = schema.validate({pan:pan,conta:cont,cont:cont,state:state,district:district,name:name,bankkDet:bankkDet,accNo:accNo,ifsc:ifsc});

         }
         else{
             console.log('dddddddddddddddddddddddddddd');
            schema=joi.object({
                state:joi.string().required().label('Please Choose State'),
                district:joi.string().required().label('Please Choose District'),
                name:joi.string().min(3).max(80).required().label('Please Fill Vendor Name'),
                conta:joi.string().required().label('Please Enter Contact Number'),
                cont:joi.number().integer().min(1000000000).max(9999999999).required().label('Contact number should have exact 10 digits'),
                bankkDet:joi.string().min(3).max(255).required().label('Please Fill Bank Details'),
              //  pan:joi.string().min(10).max(10).label('Pan Nuber Should be Exactly of 10 Digits'),
                accNo:joi.number().required().label('Please Fill Bank Account Number'),
                ifsc:joi.string().min(3).max(20).required().label('Please Fill Bank IFSC Code.'),
                  })
             result = schema.validate({conta:cont,cont:cont,state:state,district:district,name:name,bankkDet:bankkDet,accNo:accNo,ifsc:ifsc});


         }

        
     }
  
    
    if(result.error){
        console.log('fd  validaion eeror'+result.error);
        response.send(result.error.details[0].context.label);    
    }
      else{
          
    
    let record = [];
    record.push(name);
    record.push(authority);
    record.push(cont);
    record.push(bankkDet);
    record.push(ifsc);
    record.push(pan);
    record.push(gst);
    record.push(add);
    record.push(accNo);
    record.push(state);
    record.push(district);
   // record.push(url);
   // record.push(other);
    record.push(reason);
let recordlist=[];
recordlist.push(record);
console.log(recordlist);

       let impaneledVendor = format('INSERT INTO salesforce.Impaneled_Vendor__c (Vendor_Name__c,Name_of_Signing_Authority__c,Contact_No__c,Bank_Details__c,Bank_IFSC_Code__c, PAN_No__c,GST_No__c,Address__c,Bank_Account_No__c,State__c,District__c,Reason_for_not_providing_GST_no__c ) VALUES %L returning id',recordlist);
       console.log('impaneledVendor=>'+impaneledVendor);
    pool.query(impaneledVendor)
    .then((vendorQueryResult) => {
        console.log('vendorQueryResult  : '+JSON.stringify(vendorQueryResult.rows));
        response.send('Saved Successfully !');
    })
    .catch((error) => {
        console.log('error  : '+error.stack);
        response.send('Error Occurred !');
    })
}

    })
router.get('/ItemDescriptionListView',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    let vendorId = request.query.vendorId;
    console.log('vendor Id =>'+vendorId);
    response.render('ItemDescriptionListView',{objUser,vendorId});

})

router.get('/getItemList',(request,response)=>{
    let id=request.query.id;
    console.log('Idd '+id);
    let qry='select item.sfid ,item.name as itemName,item.items__c, item.category__c,item.per_unit_cost__c,item.unit__c,item.other_items__c,vend.name as vendername,item.impaneled_vendor__c,item.createddate '+
                'FROM salesforce.Item_Description__c item '+
                'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
                'ON item.Impaneled_Vendor__c = vend.sfid '+
                'where item.impaneled_vendor__c=$1 AND item.sfid IS NOT null';
   console.log('qyer '+qry)
    pool
    .query(qry, [id])
    .then((querryResult)=>{
        console.log('QueryyResult '+JSON.stringify(querryResult.rows));
        if(querryResult.rowCount>0){

            let modifieldList = [],i =1;
            querryResult.rows.forEach((eachRecord) => {
                console.log('sfid '+eachRecord.sfid);
              let obj = {};
              let crDate = new Date(eachRecord.createddate);
              crDate.setHours(crDate.getHours() + 5);
              crDate.setMinutes(crDate.getMinutes() + 30);
              let strDate = crDate.toLocaleString();
              obj.sequence = i;
              obj.editAction = '<button href="#" class="btn btn-primary editItem" id="'+eachRecord.sfid+'" >Edit</button>'
              obj.name = '<a href="#" class="itemDetailTag" id="'+eachRecord.sfid+'" >'+eachRecord.itemname+'</a>';
              obj.category = eachRecord.category__c;
              obj.item = eachRecord.items__c;
              obj.unit = eachRecord.unit__c;
              obj.cost = eachRecord.per_unit_cost__c;
              obj.vendor=eachRecord.vendername;
              obj.createdDate = strDate;
              i= i+1;
              modifieldList.push(obj);
            })
            response.send(modifieldList);
        }
        else
        response.send('[]');
    })
    .catch((error)=>{
        console.log('error '+error.stack);
        response.send(error);
    })
})

router.post('/sendProcurementApproval',verify, (request, response) => {
    let objUser = request.user;
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    let comment = body.comment;
    console.log('comment'+comment);
    let trueValue = true;
    let falseValue = false;

    const schema=joi.object({
        comment:joi.string().min(4).required().label('Please Fill Comment'),
    })

   let result=schema.validate({comment:comment});
   if(result.error){
    console.log('fd'+result.error);
    response.send(result.error.details[0].context.label);    
     }
     else{
    pool
    .query('UPDATE salesforce.Asset_Requisition_Form__c SET isSentForApprovalFromHeroku__c = $1 ,Heroku_Approval_Comment__c =$2, isHerokuApprovalButtonDisabled__c = $3, Submitted_By_Heroku_User__c = $4 WHERE sfid= $5;',[trueValue, body.comment,trueValue,objUser.sfid, body.assetRequisitionFormId])
    .then((requisitionQueryResult) =>{
        console.log('requisitionQueryResult  : '+JSON.stringify(requisitionQueryResult));
        response.send('Approval Sent Successfully !');
    })
    .catch((requisitionQueryError) =>{
        console.log('requisitionQueryError   '+requisitionQueryError);
        response.send('Error occured while sending approval !');
    })  
       }
});

router.post('/sendProcurementAccountsApproval',verify,(request, response) => {
    let objUser = request.user;
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    let comment = body.comment;
    let sendAccountsApproval = true;

    pool
    .query('SELECT id, sfid, isSentForAccountsApprovalFromHeroku__c from salesforce.Asset_Requisition_Form__c where sfid = $1',[body.assetRequisitionFormId])
    .then((assetQueryResult) =>{
        console.log('assetQueryResult.rows  '+JSON.stringify(assetQueryResult.rows));
        if(assetQueryResult.rowCount > 0)
        {
                if(assetQueryResult.rows[0].issentforaccountsapprovalfromheroku__c)
                {
                        response.send('Accounts approval sent already !');
                        return;
                }
                else
                {
                    console.log('comment'+comment);
                    let selectqry ='SELECT asset.id, asset.sfid as sfid,asset.name as name ,asset.Requested_Closure_Plan_Date__c,asset.Project_Department__c, '+
                    'asset.Manager_Approval__c,asset.Management_Approval__c,asset.Procurement_Committee_Approval__c,asset.Chairperson_Approval__c,'+
                    'asset.Accounts_Approval__c,asset.Procurement_Head_Approval__c,'+
                    'asset.Number_Of_IT_Product__c,asset.Number_Of_Non_IT_Product__c,asset.Procurement_IT_total_amount__c,asset.Procurement_Non_IT_total_amount__c, asset.Total_amount__c,proj.name as projname,proj.sfid as profsfid, '+
                    'asset.Management_Approval_Activity_Code__c,asset.Management_Approval_for_fortnight_limit__c, '+
                    'asset.Management_Approval_less_than_3_quotes__c,asset.Procurement_Comt_Approval_for_fortnight__c, '+
                     'asset.P_O_attachment__c,po_attachment_url__c,payment_status__c,asset.status__c,asset.payment_received_acknowledgement__c,asset.receiver_name__c,asset.received_quantity_goods__c,asset.date_of_receiving_goods__c '+
                    'FROM  salesforce.Asset_Requisition_Form__c asset '+
                     'INNER JOIN salesforce.Milestone1_Project__c proj '+
                     'ON asset.Project_Department__c =  proj.sfid '+
                      'WHERE asset.sfid = $1';
                      console.log(selectqry);
                
                      pool.query(selectqry,[body.assetRequisitionFormId])
                      .then((result)=>{
                          console.log('result '+JSON.stringify(result.rows));
                          let eachRequisitionForm=result.rows[0];
                          if((eachRequisitionForm.manager_approval__c == null) &&
                              (eachRequisitionForm.procurement_head_approval__c == null) &&
                              (eachRequisitionForm.procurement_committee_approval__c == null) &&
                              (eachRequisitionForm.procurement_comt_approval_for_fortnight__c == null)  &&
                              (eachRequisitionForm.management_approval__c == null)  &&
                              (eachRequisitionForm.chairperson_approval__c == null) &&
                              (eachRequisitionForm.management_approval_less_than_3_quotes__c == null ) &&
                              (eachRequisitionForm.management_approval_for_fortnight_limit__c == null) &&
                              (eachRequisitionForm.management_approval_activity_code__c == null )
                          ){
                              console.log('All Approval fields are null');
                              response.send('Please send the record for 1st approval stage , then only it can be send for Accounts Approval.');
                          }
                          else if((eachRequisitionForm.manager_approval__c == 'Pending') ||
                          ( eachRequisitionForm.procurement_head_approval__c == 'Pending') ||
                          ( eachRequisitionForm.procurement_committee_approval__c == 'Pending') ||
                          ( eachRequisitionForm.procurement_comt_approval_for_fortnight__c == 'Pending') ||
                          ( eachRequisitionForm.management_approval__c == 'Pending') ||
                          ( eachRequisitionForm.chairperson_approval__c == 'Pending') ||
                          ( eachRequisitionForm.management_approval_less_than_3_quotes__c == 'Pending') ||
                          ( eachRequisitionForm.management_approval_for_fortnight_limit__c == 'Pending') ||
                          (  eachRequisitionForm.management_approval_activity_code__c == 'Pending')
                          )
                          {
                              console.log('One of the fields are in pending state');
                              response.send('You cannot send for accounts approval until there is a pending status !');
                          }
                          else{
                              console.log('READY FOR SEND Accout APPROVAL');
                              const schema=joi.object({
                                comment:joi.string().required().label('Please Fill Comment'),
                            })
                        
                           let result=schema.validate({comment});
                           if(result.error){
                            console.log('fd'+result.error);
                            response.send(result.error.details[0].context.label);    
                             }
                             else{
                
                              pool
                              .query('UPDATE salesforce.Asset_Requisition_Form__c SET isSentForAccountsApprovalFromHeroku__c = $1 ,Heroku_Accounts_Approval_Comment__c =$2, Submitted_By_Heroku_User__c = $3 WHERE sfid= $4;',[sendAccountsApproval, body.comment, objUser.sfid, body.assetRequisitionFormId])
                              .then((requisitionQueryResult) =>{
                                  console.log('requisitionQueryResult  : '+JSON.stringify(requisitionQueryResult));
                                  response.send('Accounts Approval Sent Successfully !');
                              })
                              .catch((error)=>{
                                  console.log('error '+JSON.stringify(error.stack));
                                  response.send(error);
                            })
                          }
                        }
                      })
                    .catch((requisitionQueryError) =>{
                        console.log('requisitionQueryError   '+requisitionQueryError);
                        response.send('Error occured while sending approval !');
                    }) 

                }
        }
    })
    .catch((assetQueryError)=>{
        console.log('assetQueryError  : '+assetQueryError.stack);
        response.send('Error occured while sending approval !');
    })
});

router.post('/updateVendor',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { name, state,district,aacc,auth,cont,bankDetail,ifsc,pan,add,gst,other,quote,hide,reason} = request.body;
    console.log('state state state  '+state);
    console.log('Vendor id  '+hide);
    console.log('name  '+name);
    console.log('district  '+district);
    console.log('aacc  '+aacc);
    console.log('auth  '+auth);
    console.log('cont  '+cont);
    console.log('bankDetail  '+bankDetail);
    console.log('ifsc  '+ifsc);
    console.log('pan  '+pan);
    console.log('add  '+add);
    console.log('gst  '+gst);
    console.log('other'  +other);
    console.log('quote  '+quote);
    console.log('reason  '+reason);

    if(gst == null || gst == '' )
    {
         schema=joi.object({
            state:joi.string().required().label('Please Choose State'),
            district:joi.string().required().label('Please Choose District'),
            name:joi.string().min(3).max(80).required().label('Please Fill Vendor Name'),
            bankDetail:joi.string().min(3).max(255).required().label('Please Fill Bank Details'),
            aacc:joi.string().min(3).required().label('Please Fill Bank Account Number'),
            ifsc:joi.string().min(3).max(20).required().label('Please Fill Bank IFSC Code.'),
            reason:joi.string().min(3).max(255).required().label('Please Fill Reason for not providing GST no.'),
            
              })
        result = schema.validate({state:state,district:district,name:name,bankDetail:bankDetail,aacc:aacc,ifsc:ifsc,reason:reason});
        
    }
    else
    {
        schema=joi.object({
           state:joi.string().required().label('Please Choose State'),
           district:joi.string().required().label('Please Choose District'),
           name:joi.string().min(3).max(80).required().label('Please Fill Vendor Name'),
           bankDetail:joi.string().min(3).max(255).required().label('Please Fill Bank Details'),
           aacc:joi.string().required(3).label('Please Fill Bank Account Number'),
           ifsc:joi.string().min(3).max(20).required().label('Please Fill Bank IFSC Code.'),
             })
        result = schema.validate({state:state,district:district,name:name,bankDetail:bankDetail,aacc:aacc,ifsc:ifsc});
    }

    if(result.error){
        console.log('fd'+result.error);
        response.send(result.error.details[0].context.label);    
    }
    else{
    let updateQuerry = 'UPDATE salesforce.Impaneled_Vendor__c SET '+
                         'vendor_Name__c = \''+name+'\', '+
                         'District__c = \''+district+'\', '+
                         'State__c = \''+state+'\', '+
                         'Bank_Account_No__c = \''+aacc+'\', '+
                         'contact_no__c = \''+cont+'\', '+
                         'name_of_signing_authority__c = \''+auth+'\', '+
                         'bank_details__c = \''+bankDetail+'\', '+
                         'Bank_IFSC_Code__c = \''+ifsc+'\', '+
                         'pan_no__c = \''+pan+'\', '+
                         'address__c = \''+add+'\', '+
                         'GST_No__c = \''+gst+'\', '+ 
                         'Reason_for_not_providing_GST_no__c = \''+reason+'\' '+ 
                      //   'Others__c = \''+other+'\' '+ 
                      //   'quote_public_url__c = \''+quote+'\' '+                       
                         'WHERE sfid = $1';
                        //  console.log('dolorr>>>>>>>>>>>',$1)
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
router.get('/getItemDetail',(request,response)=>{
let itemId=request.query.itemId;
console.log('itemId '+itemId);
let qry='select item.sfid ,item.name as itemName,item.items__c, item.category__c,item.Public_Quote_URL__c,item.per_unit_cost__c,item.unit__c,item.other_items__c,vend.name as vendername,item.impaneled_vendor__c '+
                'FROM salesforce.Item_Description__c item '+
                'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
                'ON item.Impaneled_Vendor__c = vend.sfid '+
                'where item.sfid=$1 ';
pool.query(qry,[itemId])
.then((itemdescriptionQueryy)=>{
console.log('Item description Detail=>'+JSON.stringify(itemdescriptionQueryy.rows));
response.send(itemdescriptionQueryy.rows);
})
.catch((error)=>{
    console.log('error '+error.stack);
    response.send(error);
})
})
router.post('/updateItemescription',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { item, cate,cost,unit,other,quote,hide} = request.body;
    console.log('item    '+item);
    console.log('cost  '+cost);
    console.log('cate  '+cate);
    console.log('unit  '+unit);
    console.log('other  '+other);
    console.log('Item ID  '+hide);
    let updateQuerry = 'UPDATE salesforce.Item_Description__c SET '+
    'category__c = \''+cate+'\', '+
    'items__c = \''+item+'\', '+
    'unit__c = \''+unit+'\', '+
    'per_unit_cost__c = \''+cost+'\', '+
    'Other_Items__c= \''+other+'\' '+
    'WHERE sfid = $1';
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


})

router.get('/createFeedback/:procid',verify,(request,response)=>{
    let procid=request.params.procid;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+procid);
    response.render('createFeedbackform',{procid,objUser});

})
router.get('/createFeedbackIT/:procid',verify,(request,response)=>{
    let procid=request.params.procid;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+procid);
    response.render('createFeedbackITform',{procid,objUser});
})

router.get('/getfeedback/:procid',verify,(request,response)=>{
    let procid=request.params.procid;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+procid);
    response.render('getlistFeedback',{procid,objUser});

})
router.get('/getFeedbacklist',verify,(request,response)=>{
    let parentid=request.query.parentId;
    console.log('parentid '+parentid);
    let qry = 'SELECT sfid,Name,quantity_requested_vs_received__c,createddate,Timely_submissions_of_all_Deliverables__c,Work_Quality_Goods_Quality__c,Issue_Knowledge_Expertise__c,Procurement_Non_IT__c FROM salesforce.Feedback__c WHERE Procurement_Non_IT__c=$1 AND sfid IS NOT NULL';
    console.log('qry  =>'+qry)
     pool.query(qry,[parentid])
     .then((feedbackqueryresult) => {
         console.log('feedbackqueryresult  : '+JSON.stringify(feedbackqueryresult.rows));
         if(feedbackqueryresult.rowCount>0){
            let modifiedList = [],i =1;
             feedbackqueryresult.rows.forEach((eachRecord) => {
              let obj = {};
              let crDate = new Date(eachRecord.createddate);
              crDate.setHours(crDate.getHours() + 5);
              crDate.setMinutes(crDate.getMinutes() + 30);
              let strDate = crDate.toLocaleString();
              obj.sequence = i;
              obj.name = '<a href="#" class="vendorTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
              obj.time=eachRecord.timely_submissions_of_all_deliverables__c;
              obj.quality=eachRecord.work_quality_goods_quality__c;
              obj.issue = eachRecord.issue_knowledge_expertise__c;
              obj.quant =eachRecord.quantity_requested_vs_received__c;
              obj.createDdate = strDate;
              obj.editAction = '<button href="#" class="btn btn-primary feededit" id="'+eachRecord.sfid+'" >Edit</button>'
              i= i+1;
              modifiedList.push(obj);
            })
            console.log('modifiedList '+JSON.stringify(modifiedList));
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

router.get('/getfeedbackIT/:procid',verify,(request,response)=>{
    let procid=request.params.procid;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+procid);
    response.render('getlistFeedbackIT',{procid,objUser});
})
router.get('/getfeedbackITlist',verify,(request,response)=>{
    let parentid=request.query.parentId;
    console.log('parentid '+parentid);
    let qry = 'SELECT sfid,Name,quyantiut__c,timely_submissions_of_deliverables_goods__c,work_quality_goods_quality__c,issue_knowledge_expertise__c,Procurement_IT__c FROM salesforce.Feedbacks_IT__c WHERE Procurement_IT__c=$1 AND sfid IS NOT NULL';
    console.log('qry  =>'+qry)
     pool.query(qry,[parentid])
     .then((feedbackqueryresult) => {
         console.log('feedbackqueryresult IT : '+JSON.stringify(feedbackqueryresult.rows));
         if(feedbackqueryresult.rowCount>0){
            let modifiedList = [],i =1;
             feedbackqueryresult.rows.forEach((eachRecord) => {
              let obj = {};
              obj.sequence = i;
              obj.editAction = '<button href="#" class="btn btn-primary editfeedIt" id="'+eachRecord.sfid+'" >Edit</button>'
              obj.name = '<a href="#" class="vendorTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
              obj.quantity=eachRecord.quyantiut__c
              obj.time=eachRecord.timely_submissions_of_deliverables_goods__c;
              obj.quality=eachRecord.work_quality_goods_quality__c;
              obj.issue = eachRecord.issue_knowledge_expertise__c;
              i= i+1;
              modifiedList.push(obj);
            })
            console.log('modifiedList '+JSON.stringify(modifiedList));
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
router.get('/getfeedbackdetail',(request,response)=>{
    let parentid=request.query.parentId;
    console.log('parentid '+parentid);
    let qry = 'SELECT sfid,Name,Timely_submissions_of_all_Deliverables__c,Work_Quality_Goods_Quality__c,Issue_Knowledge_Expertise__c,Procurement_Non_IT__c FROM salesforce.Feedback__c WHERE sfid=$1';
    console.log('qry  =>'+qry)
    pool.query(qry,[parentid])
    .then((result)=>{
        console.log(JSON.stringify(result.rows));
        response.send(result.rows);
    }).catch((eroor)=>{
        console.log(JSON.stringify(error.stack))
    })

})
router.get('/getfeedbackdetailIT',(request,response)=>{
    let parentid=request.query.parentId;
    console.log('parentid '+parentid);
    let qry = 'SELECT sfid,Name,quyantiut__c,timely_submissions_of_deliverables_goods__c,work_quality_goods_quality__c,issue_knowledge_expertise__c,procurement_it__c FROM salesforce.Feedbacks_IT__c WHERE sfid=$1';
    console.log('qry  =>'+qry)
    pool.query(qry,[parentid])
    .then((result)=>{
        console.log(JSON.stringify(result.rows));
        response.send(result.rows);
    }).catch((eroor)=>{
        console.log(JSON.stringify(error.stack))
    })

})

router.post('/savefeedback',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const{time,quality, issue,quantity,hide}=request.body;
    console.log('time'+time);
    console.log('quality'+quality);
    console.log('procidt'+hide);
    console.log('issue'+issue);
    console.log('quantity '+quantity);

    let feedCreateqry = 'INSERT INTO salesforce.Feedback__c (quantity_requested_vs_received__c,work_quality_goods_quality__c,timely_submissions_of_all_deliverables__c,procurement_non_it__c,issue_knowledge_expertise__c ) VALUES ($1,$2,$3,$4,$5)';
    console.log('feedCreateqry=>'+feedCreateqry);
    pool.query(feedCreateqry,[quantity,time,quality,hide,issue])
    .then((queryResult)=>{
        console.log('feedback INsert query result '+JSON.stringify(queryResult));
        response.send('Succesfully Inserted');
    })
    .catch((error)=>{
        console.log(error.stack);
        response.send(error);
    })
})

router.post('/updatefeedBack',(request,response)=>{

    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { name, time,issue,quality,qua,feedid} = request.body;
    console.log('name    '+name);
    console.log('time  '+time);
    console.log('issue  '+issue);
    console.log('quality  '+quality);
    console.log('feedid  '+feedid);
    console.log('qua  '+qua);
    let updateQuerry = 'UPDATE salesforce.Feedback__c SET '+
    'Timely_submissions_of_all_Deliverables__c = \''+time+'\', '+
    'Issue_Knowledge_Expertise__c = \''+issue+'\', '+
    'quantity_requested_vs_received__c = \''+qua+'\', '+
    'Work_Quality_Goods_Quality__c= \''+quality+'\' '+
    'WHERE sfid = $1';
console.log('updateQuerry  '+updateQuerry);
pool
.query(updateQuerry,[feedid])
.then((updateQuerryResult) => {     
console.log('updateQuerryResult =>>'+JSON.stringify(updateQuerryResult));
response.send("succesfully Update");
})
.catch((updatetError) => {
console.log('updatetError'+updatetError.stack);
response.send('Error');
})

})

router.post('/savefeedbackIT',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const{time,quality,name, issue,quantity,hide}=request.body;
    console.log('name '+name);
    console.log('time'+time);
    console.log('quality'+quality);
    console.log('procidt'+hide);
    console.log('issue'+issue);
    console.log('quantity '+quantity);
    let record=[];
    record.push(quantity);
    record.push(time);
    record.push(quality);
    record.push(issue);
    record.push(hide);
    let lstRecord =[];
    lstRecord.push(record);
    console.log('lst record '+lstRecord);
    let feedCreateqry = format('INSERT INTO salesforce.Feedbacks_IT__c (quyantiut__c,timely_submissions_of_deliverables_goods__c,work_quality_goods_quality__c,issue_knowledge_expertise__c,Procurement_IT__c ) VALUES %L returning id',lstRecord);;
    console.log('feedCreateqry=>'+feedCreateqry);
    pool.query(feedCreateqry)
    .then((queryResult)=>{
        console.log('feedback INsert query result '+JSON.stringify(queryResult));
        response.send('Succesfully Inserted');
    })
    .catch((error)=>{
        console.log(error.stack);
        response.send(error.stack);
    })

})
router.post('/updateITfeedback',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const{time,quality,name, issue,quantity,feedid}=request.body;
    console.log('name '+name);
    console.log('time'+time);
    console.log('quality'+quality);
    console.log('procidt'+feedid);
    console.log('issue'+issue);
    console.log('quantity '+quantity);
    
    let updateQuerry = 'UPDATE salesforce.Feedbacks_IT__c SET '+
    'quyantiut__c = \''+quantity+'\', '+
    'timely_submissions_of_deliverables_goods__c = \''+time+'\', '+
    'issue_knowledge_expertise__c = \''+issue+'\', '+
    'work_quality_goods_quality__c= \''+quality+'\' '+
    'WHERE sfid = $1';
console.log('updateQuerry  '+updateQuerry);
pool
.query(updateQuerry,[feedid])
.then((updateQuerryResult) => {     
console.log('updateQuerryResult =>>'+JSON.stringify(updateQuerryResult));
response.send("succesfully Update");
})
    .catch((error)=>{
        console.log(error.stack);
        response.send(error.stack);
    })

})

router.get('/upload/:parentAssetId&:isDisabled',verify,(request,response)=>{

    let parentAssetId = request.params.parentAssetId;
    let objUser=request.user;
    console.log('parentAssetId  '+parentAssetId);
    let isDisabled = request.params.isDisabled;
    console.log(' ++++ isDisabled ++++ '+isDisabled);
    response.render('uploadFile',{parentAssetId,isDisabled,objUser});
})

router.post('/uploadFiless',(request,response)=>{
    let body=request.body;
    console.log('body '+JSON.stringify(body));
    const { imgpath,hide}=request.body;
    console.log('hide '+hide);
    console.log('imgpath '+imgpath);
   // var poattachment='Yes';

    let updateQuerry = 'UPDATE salesforce.Asset_Requisition_Form__c SET '+
    //'P_O_attachment__c = \''+poattachment+'\', '+
    'PO_Attachment_URL__c = \''+imgpath+'\' '+
    'WHERE sfid = $1';
    console.log('updateQuerry '+updateQuerry);
    if(imgpath!='demo'){
        pool.query(updateQuerry,[hide])
        .then((queryResultUpdate)=>{
            console.log('queryResultUpdate '+JSON.stringify(queryResultUpdate));
            response.send('Attachment saved Successfully');
        }).catch((eroor)=>{console.log(JSON.stringify(eroor.stack))})

    }
    else{
        response.send('Error: Please Choose File');
    }
  
})

router.get('/uploadItemNotes/:itemId',verify,(request,response)=>{

    let itemId = request.params.itemId;
    let objUser=request.user;
    console.log('itemId  '+itemId);
    response.render('uploadItemFile',{itemId,objUser});
})

router.post('/uploadItemFiless',(request,response)=>{
    let body=request.body;
    console.log('body '+JSON.stringify(body));
    const { imgpath,hide}=request.body;
    console.log('hide '+hide);
    console.log('imgpath '+imgpath);
   // var poattachment='Yes';

    let updateQuerry = 'UPDATE salesforce.Item_Description__c SET '+
    //'P_O_attachment__c = \''+poattachment+'\', '+
    'Public_Quote_URL__c = \''+imgpath+'\' '+
    'WHERE sfid = $1';
    console.log('updateQuerry '+updateQuerry);
    if(imgpath!='demo'){
        pool.query(updateQuerry,[hide])
        .then((queryResultUpdate)=>{
            console.log('queryResultUpdate '+JSON.stringify(queryResultUpdate));
            response.send('Attachment saved Successfully');
        }).catch((eroor)=>{console.log(JSON.stringify(eroor.stack))})

    }
    else{
        response.send('ERROR PLEASE CHOOSE FILE ');
    }
  
})


router.get('/assetRequisitionViewRel/:parentExpenseId&:isDisabled',verify,(request, response) => {
    var parentprocurementId = request.params.parentExpenseId;
    console.log('parentExpenseId  '+parentprocurementId);
    isDisabled = request.params.isDisabled;
    console.log(' ++++ isDisabled ++++ '+isDisabled); 
    
  let objUser=request.user;
        console.log('user '+objUser);  
        response.render('AssetLandingPage',{objUser,isDisabled,parentprocurementId:parentprocurementId}); 
})

router.get('/impaneledVendorUpload/:itemId',verify,(request, response) => {
    var itemId = request.params.itemId;
    console.log('itemId  '+itemId);
     let objUser=request.user;
        console.log('user '+objUser);  
        let qry ='SELECT sfid,name,Impaneled_Vendor__c FROM salesforce.Item_Description__c WHERE  sfid = $1';
        pool.query(qry,[itemId])
        .then((testQueryResult) => 
        {
          console.log('testQueryResult '+JSON.stringify(testQueryResult.rows));
           if(testQueryResult.rowCount>0)
           {
             console.log('testQueryResult[0].sfid; '+testQueryResult.rows[0].sfid);
             let vendorId = testQueryResult.rows[0].impaneled_vendor__c;
             console.log('vendorId '+vendorId);  
             response.render('ImpaneledLandingPage',{objUser,vendorId:vendorId}); 
           }
        })
        .catch((testQueryError) => {
          response.send(testQueryError.stack);
        })
})

router.get('/ItemDescriptionViewRel/:vendorId',verify,(request, response) => {
    var vendorId = request.params.vendorId;
    console.log('vendorId  '+vendorId);
     let objUser=request.user;
        console.log('user '+objUser);  
        response.render('ImpaneledLandingPage',{objUser,vendorId:vendorId}); 
})

router.get('/itemdescriptionUpload/:itemId',verify,(request, response) => {
    var itemId = request.params.itemId;
    console.log('itemId  '+itemId);
         let objUser=request.user;
        console.log('user '+objUser);  
        response.render('ItemDescriptionLandingPage',{objUser,itemId:itemId}); 
})

router.get('/assetRequisitionITFeedback/:procid',verify,(request, response) => {
    var procId = request.params.procid;
    console.log('procId '+procId);
    let objUser=request.user;
    console.log('user '+objUser); 
    let qry ='SELECT sfid,name,asset_requisition_form__c as assetid FROM salesforce.Product_Line_Item_IT__c WHERE  sfid = $1';
    pool.query(qry,[procId])
    .then((testQueryResult) => {
      console.log('testQueryResult '+JSON.stringify(testQueryResult.rows));
       if(testQueryResult.rowCount>0){
         console.log('testQueryResult[0].sfid; '+testQueryResult.rows[0].assetid);
         let parentprocurementId =testQueryResult.rows[0].assetid;
         response.render('AssetLandingPage',{objUser,parentprocurementId :parentprocurementId }); 
       //response.render('./expenses/expensePageRealted',{objUser,parentExpenseId:parentExpenseId}); 
       }
    })
    .catch((testQueryError) => {
      response.send(testQueryError.stack);
    })
    
  })

  router.get('/assetRequisitionNonITFeedback/:procid',verify,(request, response) => {
    var procId = request.params.procid;
    console.log('procId '+procId);
    let objUser=request.user;
    console.log('user '+objUser); 
    let qry ='SELECT sfid,name,asset_requisition_form__c as assetid FROM salesforce.Product_Line_Item__c WHERE  sfid = $1';
    pool.query(qry,[procId])
    .then((testQueryResult) => {
      console.log('testQueryResult '+JSON.stringify(testQueryResult.rows));
       if(testQueryResult.rowCount>0){
         console.log('testQueryResult[0].sfid; '+testQueryResult.rows[0].assetid);
         let parentprocurementId =testQueryResult.rows[0].assetid;
         response.render('AssetLandingPage',{objUser,parentprocurementId :parentprocurementId }); 
       //response.render('./expenses/expensePageRealted',{objUser,parentExpenseId:parentExpenseId}); 
       }
    })
    .catch((testQueryError) => {
      response.send(testQueryError.stack);
    })
    
  })

  
  router.get('/feedbackProcurementIT/:procid',verify,(request, response) => {
    var procurementId  = request.params.procid;
    console.log('procid  '+procurementId );
  let objUser=request.user;
        console.log('user '+objUser);  
        response.render('procurementITLandingPage',{objUser,procurementId :procurementId }); 
})

router.get('/feedbackProcurementNonIT/:procid',verify,(request, response) => {
    var procurementId  = request.params.procid;
    console.log('procid  '+procurementId );
  let objUser=request.user;
        console.log('user '+objUser);  
        response.render('ProcurementNonITLandingPage',{objUser,procurementId :procurementId }); 
})
    
router.get('/deleteProcurementIt/:parentId',(request,response)=>{

       var procurementId  = request.params.parentId;
      console.log('procurementIt Id1111 ='+procurementId);
   
         let deleteQuerry = 'DELETE FROM salesforce.Product_Line_Item_IT__c '+
         'WHERE sfid = $1';
        console.log('deleteQuerry  '+deleteQuerry);
        pool
        .query(deleteQuerry,[procurementId])
        .then((deleteProcurementITResult) => {     
        console.log('deleteProcurementITResult =>>'+JSON.stringify(deleteProcurementITResult));
        response.send('Success');
        })
        .catch((deleteError) => {
        console.log('deleteError'+deleteError.stack);
        response.send('Error');
        })
})

router.get('/deleteProcurementNonIt/:parentId',(request,response)=>{

    var procurementId  = request.params.parentId;
   console.log('procurementIt Id1111 ='+procurementId);

      let deleteQuerry = 'DELETE FROM salesforce.Product_Line_Item__c '+
      'WHERE sfid = $1';
     console.log('deleteQuerry  '+deleteQuerry);
     pool
     .query(deleteQuerry,[procurementId])
     .then((deleteProcurementITResult) => {     
     console.log('deleteProcurementITResult =>>'+JSON.stringify(deleteProcurementITResult));
     response.send('Success');
     })
     .catch((deleteError) => {
     console.log('deleteError'+deleteError.stack);
     response.send('Error');
     })
})

router.get('/getprocurementAssetDetail',verify,(request,response)=>{
    let proid=request.query.proid;
    console.log('getProcurement non ITDetail Id ++++ ='+proid);
  
    let objUser=request.user;
    console.log('user '+objUser); 

    let qry ='SELECT sfid,name,asset_requisition_form__c as assetid FROM salesforce.Product_Line_Item__c WHERE  sfid = $1';
    pool.query(qry,[proid])
    .then((testQueryResult) => {
      console.log('testQueryResult '+JSON.stringify(testQueryResult.rows));
       if(testQueryResult.rowCount>0){
         console.log('testQueryResult[0].sfid; '+testQueryResult.rows[0].assetid);
         let parentprocurementId = testQueryResult.rows[0].assetid;
         console.log('parentprocurementId '+parentprocurementId); 

         let qry ='SELECT sfid,name,Payment_Status__c FROM salesforce.Asset_Requisition_Form__c WHERE  sfid = $1';
        pool.query(qry,[parentprocurementId])
        .then((AssetQueryResult) => {
        console.log('AssetQueryResult '+JSON.stringify(AssetQueryResult.rows));
        if(AssetQueryResult.rowCount>0){
         console.log('AssetQueryResult[0].sfid; '+AssetQueryResult.rows[0].assetid);
         let name = AssetQueryResult.rows[0].name;
         let status = AssetQueryResult.rows[0].payment_status__c;
         console.log('Status under asset '+status);
         console.log('Status under name '+name);

         if(status == 'Released'){
             response.send('OK');
         }
         else{
             response.send('Rejected');
         }
       
       }
    })
    .catch((AssetQueryResultError) => {
      response.send(AssetQueryResultError.stack);
    })
       
       }
    })
    .catch((testQueryError) => {
      response.send(testQueryError.stack);
    })
})
 
router.get('/getprocurementITAssetDetail',verify,(request,response)=>{
    let proid=request.query.proid;
    console.log('getProcurement ITDetail Id ++++ ='+proid);
  
    let objUser=request.user;
    console.log('user '+objUser); 

    let qry ='SELECT sfid,name,asset_requisition_form__c as assetid FROM salesforce.Product_Line_Item_IT__c WHERE  sfid = $1';
    pool.query(qry,[proid])
    .then((testQueryResult) => {
      console.log('testQueryResult '+JSON.stringify(testQueryResult.rows));
       if(testQueryResult.rowCount>0){
         console.log('testQueryResult[0].sfid; '+testQueryResult.rows[0].assetid);
         let parentprocurementId = testQueryResult.rows[0].assetid;
         console.log('parentprocurementId '+parentprocurementId); 

         let qry ='SELECT sfid,name,Payment_Status__c FROM salesforce.Asset_Requisition_Form__c WHERE  sfid = $1';
        pool.query(qry,[parentprocurementId])
        .then((AssetQueryResult) => {
        console.log('AssetQueryResult '+JSON.stringify(AssetQueryResult.rows));
        if(AssetQueryResult.rowCount>0){
         console.log('AssetQueryResult[0].sfid; '+AssetQueryResult.rows[0].assetid);
         let name = AssetQueryResult.rows[0].name;
         let status = AssetQueryResult.rows[0].payment_status__c;
         console.log('Status under asset '+status);
         console.log('Status under name '+name);

         if(status == 'Released'){
             response.send('OK');
         }
         else{
             response.send('Rejected');
         }
       
       }
    })
    .catch((AssetQueryResultError) => {
      response.send(AssetQueryResultError.stack);
    })
       
       }
    })
    .catch((testQueryError) => {
      response.send(testQueryError.stack);
    })
})
   

module.exports = router;
