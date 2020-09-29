function dataforAction(userlogontype) {
    let firstLoadSwitch = false;
    if(firstLoadSwitch == true){
        manipulateData.userTable(userlogontype);
        return;
    }
    //Read JSON data
    if (document.querySelector("#file-input").files.length == 0) {
        alert('Error : No file selected');
        return;
    }
    // first file selected by user
    var file = document.querySelector("#file-input").files[0];


    // read the file
    var reader = new FileReader();

    // file reading started
    reader.addEventListener('loadstart', function () {
        console.log('File reading started');
    });

    // file reading finished successfully
    reader.addEventListener('load', function (e) {
        // contents of file in variable     
        text = e.target.result;
        let log = JSON.parse(text);
        manipulateData(log);
    });

    // file reading failed
    reader.addEventListener('error', function () {
        alert('Error : Failed to read file');
    });

    // file read progress 
    reader.addEventListener('progress', function (e) {
        if (e.lengthComputable == true) {
            var percent_read = Math.floor((e.loaded / e.total) * 100);
            console.log(percent_read + '% read');
        }
    });

    // read as text file
    reader.readAsText(file);

    
    //Manipulate Data ------------------------------------------------------------------------------------
    function manipulateData(log) {


        let usernameData = {};

        let actionData = {
            "Logon-Success": 0,
            "Logon-Failure": 0,
            "Other": 0
        }

        let targetData = {}


        for (let event of log) {
            //Action Data
            let action = event["Action"];
            if (action == "Logon-Success") {
                actionData["Logon-Success"] += 1;
            } else if (action == "Logon-Failure") {
                actionData["Logon-Failure"] += 1;
            } else if (action == null) {
                actionData["Other"] += 1;
            }

            //UserName Data with Counting Success and Failure
            let userName = event["UserName"];
            if (userName in usernameData) {
                if (action == "Logon-Success") {
                    usernameData[userName]["Logon-Success"] += 1;
                } else if (action == "Logon-Failure") {
                    usernameData[userName]["Logon-Failure"] += 1;
                } else if (action == null) {
                    usernameData[userName]["Other"] += 1;
                }
            } else {
                if (action == "Logon-Success") {
                    usernameData[userName] = { "Logon-Success": 1, "Logon-Failure": 0, "Other": 0 };
                } else if (action == "Logon-Failure") {
                    usernameData[userName] = { "Logon-Success": 0, "Logon-Failure": 1, "Other": 0 };
                } else if (action == null) {
                    usernameData[userName] = { "Logon-Success": 1, "Logon-Failure": 0, "Other": 1 };
                }
            }
            //Target
            let target = event['Target'];
            if (target in targetData) {
                targetData[target] += 1;
            } else {
                targetData[target] = 0;
            }
        }

        // Load google charts
        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(drawChart);

        // Draw the chart and set the chart values
        function drawChart() {
            var sortable = [];
            for (var target in targetData) {
                sortable.push([target, targetData[target]]);
            }
            sortable.sort(function(a, b) {
                return b[1] - a[1];
            });
            sortable.unshift(['Target Address', 'Number of Attempts'])
            var data = google.visualization.arrayToDataTable(
                sortable
            );

            // Optional; add a title and set the width and height of the chart
            var options = {'title':'Target Attempts', 'width':550, 'height':400};

            // Display the chart inside the <div> element with id="piechart"
            var chart = new google.visualization.BarChart(document.getElementById('barchart'));
            chart.draw(data, options);
        }

        // Insert data into Action table and display the table
        document.getElementById("success").innerHTML = actionData["Logon-Success"];
        document.getElementById("failure").innerHTML = actionData["Logon-Failure"];
        document.getElementById("unknown").innerHTML = actionData["Other"];
        document.getElementById("logontable").style.display="table";
        
        // Insert data into User table
        function userTable(logontype){
            let sorted = []
            for (var usr in usernameData) {
                sorted.push([usr, usernameData[usr]]);
            }
            sorted.sort(function(a, b) {
                return b[1][logontype] - a[1][logontype];
            });
            var node= document.getElementById("userData");
            while (node.firstChild) {
                node.removeChild(node.childNodes[0]); 
            }
            // Add table rows
            sorted = sorted.slice(0,20);
            for(var usr of sorted){
                let tr = document.createElement('tr');
                tr.innerHTML = `<td id="firstuser">${usr[0]}</td><td id="firstdata">${usr[1][logontype]}</td>`
                document.getElementById('userData').appendChild(tr);
            }
            // Display table
            document.getElementById("userAttempts").style.display="table";
            
            // Change active
            if(logontype == 'Logon-Success'){
                document.getElementById("buttonSuccess").className = "btn btn-primary userDataTable successButton active";
                document.getElementById("buttonFailure").className = "btn btn-primary userDataTable successButton";
                document.getElementById("buttonUnknown").className = "btn btn-primary userDataTable successButton";
            } else if(logontype == 'Logon-Failure'){
                document.getElementById("buttonSuccess").className = "btn btn-primary userDataTable failureButton";
                document.getElementById("buttonFailure").className = "btn btn-primary userDataTable failureButton active";
                document.getElementById("buttonUnknown").className = "btn btn-primary userDataTable failureButton";
            } else {
                document.getElementById("buttonSuccess").className = "btn btn-primary userDataTable unknownButton";
                document.getElementById("buttonFailure").className = "btn btn-primary userDataTable unknownButton";
                document.getElementById("buttonUnknown").className = "btn btn-primary userDataTable unknownButton active";
            }
        }
        userTable(userlogontype);
    }

}
