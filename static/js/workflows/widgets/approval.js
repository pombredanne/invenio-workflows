/*
 * This file is part of Invenio.
 * Copyright (C) 2013, 2014 CERN.
 *
 * Invenio is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * Invenio is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Invenio; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.
 */

var WORKFLOWS_APPROVAL = (function ($, holdingpen) {
    "use strict";

    var recordsToApprove = holdingpen.recordsToApprove;
    var bwoid = null;
    var datapreview = "hd";
    var number_of_objs = $(".theform").length;
    var current_number = number_of_objs - 1;
    var url = {};


    $(document).ready(function () {
        $(".message").hide();
        $("#batch-btn").popover();

        $(".theform #submitButton").click(function (event) {

        event.preventDefault();

        var form_name = $(this)[0].form.name;
        var bwo_id = form_name.substring(form_name.indexOf("bwobject_id") + 12);
        var form_id = $(this)[0].form.id.substring(4);

        btn_div_id = "decision-btns" + form_id;
        hr_id = "hr"+form_id;

        formdata = $(this)[0].value;
        formurl = event.currentTarget.parentElement.name;
        console.log(formurl);
        $.ajax({
            type: "POST",
            url: formurl,
            data: {"decision": formdata},
            success: function(data){
                $("#"+form_id).fadeOut(400);
                $("#"+btn_div_id).fadeOut(400);
                $("#"+hr_id).fadeOut(400);
                current_number--;
            }
        });
        if (current_number === 0){
            $("#goodbye-msg").text("All Done!");
        }
        });

        $("#submitButtonMini").click(function (event){
            console.log(event);
        });

        $("body").append(
          '<div id="confirmationModal" class="modal hide fade" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'+
              '<div class="modal-header">'+
                  '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'+
                  '<h3 id="myModalLabel">Please Confirm</h3>'+
              '</div>'+
              '<div class="modal-body">'+
                  '<p>Are you sure you want to delete the selected records?</p>'+
              '</div>'+
              '<div class="modal-footer">'+
                  '<button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>'+
                  '<a class="btn btn-danger" href="#" data-dismiss="modal" onclick="disapproveRecords()">Delete Records</a>'+
              '</div>'+
          '</div>');

        $("#drop-down-accept").on("click", function (){
            for(i=0; i<recordsToApprove.length; i++){
                console.log(recordsToApprove[i]);
                jQuery.ajax({
                    type: "POST",
                    url: url.resolve_widget,
                    data: {"objectid": recordsToApprove[i],
                         "widget": "approval_widget",
                         "decision": "Accept"},
                    success: function(json){
                        recordsToApprove = [];
                        $("#refresh_button").click();
                        checkRecordsToApprove();
                    }
                });
            }
        });

        $("#drop-down-reject").on("click", function (){
            for(i=0; i<recordsToApprove.length; i++){
                console.log(recordsToApprove[i]);
                jQuery.ajax({
                    type: "POST",
                    url: url.resolve_widget,
                    data: {"objectid": recordsToApprove[i],
                           "widget": "approval_widget",
                           "decision": "Reject"},
                    success: function(json){
                        recordsToApprove = [];
                        $("#refresh_button").click();
                        checkRecordsToApprove();
                    }
                });
            }
        });

        $("button.preview").click(function () {
            bwoid = $(this).attr("data-id");
            format = $(this).attr("name");
            data_preview.show(url_preview, bwoid, format);
            $("button.preview").each(function() {
                $(this).removeClass("active");
            });
            $(this).addClass("active");
        });

        $("button.preview.active").each(function () {
            bwoid = $(this).attr("data-id");
            format = $(this).attr("name");
            data_preview.show(url_preview, bwoid, format);
        });

    });

    var init_urls_approval = function (url_){
        url = url_;
    };

    var checkRecordsToApprove = function (){
        if(recordsToApprove.length > 1){
            hideApproveAll();
            approveAll();
        }
        else{
            hideApproveAll();
        }
    };

    var disapproveRecords = function (){
        console.log("deleting");
        deleteRecords(recordsToApprove);
        recordsToApprove = [];
        // TODO: 
        // the bug here will occur when there are records with other widgets
        // than approval.
        checkRecordsToApprove();
    };

    var hideApproveAll = function (){
        $("#multi-approval").empty();
    };

    var approveAll = function () {
        var rejectBtn = '<button type="button" class="btn btn-danger">'+
                        '<a id="reject-multi" href="#confirmationModal" class="mini-approval-btn" data-toggle="modal">'+
                        'Reject</a></button>';
        var acceptBtn = '<button type="button" class="btn btn-success">'+
                        '<a id="accept-multi" href="javascript:void(0)" class="mini-approval-btn">'+
                        'Accept</a></button>';

        if($('#batch-btn').length < 1){
            var accept_link = "<a id='drop-down-accept' class='drop-down-btns btn' href='#'>Accept All</a>";
            var reject_link = "<a id='drop-down-reject' class='drop-down-btns btn' href='#'>Reject All</a>";

            var batch_btn = '<li class="dropdown">'+
                  '<a href="#" id="batch-btn" class="dropdown-toggle" data-toggle="dropdown">Dropdown <b class="caret"></b></a>'+
                  '<ul class="dropdown-menu">'+
                    '<li>'+accept_link+'</li>'+
                    '<li>'+reject_link+'</li>'+
                    '<li class="divider"></li>'+
                    '<li><a href="#">Go to Widget</a></li>'+
                  '</ul>'+
                '</li>';

            $("#navbar-right").append(batch_btn);
            $(".dropdown-toggle").dropdown();
        }
    };

    var mini_approval = function (decision, event, objectid){
        jQuery.ajax({
            type: "POST",
            url: url.resolve_widget,
            data: {"objectid": objectid,
                   "widget": "approval_widget",
                   "decision": decision},
            success: function(json){
                deselectAll();
                recordsToApprove = [];
                $("#refresh_button").click();     
                checkRecordsToApprove();
            }
        });
        oTable.fnDraw(false);
    };

    var deleteRecords = function (bwolist){
        for(i=0; i<recordsToApprove.length; i++){
            console.log(bwolist[i]);
            jQuery.ajax({
                url: url.delete_single,
                data: {"objectid": bwolist[i]},
                success: function(){
                    $("#refresh_button").click();
                }
            });
        }
    };

    return {
        init_urls_approval: init_urls_approval,
        checkRecordsToApprove: checkRecordsToApprove,
        deleteRecords: deleteRecords,
        mini_approval: mini_approval,
        disapproveRecords: disapproveRecords,
    };
})(window.jQuery, holdingpen);

