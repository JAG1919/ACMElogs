import http.client
import json
import datetime
import time

#Variables for indexing
currentIndex = 0
endingIndex = 0

#File switch
firstRunThrough = True

#Get data from API using http
connection = http.client.HTTPSConnection('challenger.btbsecurity.com')

while True:

    #Authentication
    connection.request("GET", "/auth")
    response = connection.getresponse()
    auth = response.read()

    #Check Number of Events
    connection.request("GET", "/get-events",headers={ 'Authorization' : 'Token %s' % auth })
    response = connection.getresponse()
    string = response.read().decode('utf-8')
    eventNum = json.loads(string)
    eventNumber = eventNum['EntryCount']

    #Wait a minute before checking the API when all events are normalized and saved
    
    if eventNumber == endingIndex:
        time.sleep(60)
        continue
    
    #Update index of current entries
    if (currentIndex + 499) > eventNumber:
        endingIndex = eventNumber
    else:
        endingIndex = currentIndex + 499

    #Get entries
    connection.request("GET", "/get-events?from=%d&to=%d" % (currentIndex, endingIndex),headers={ 'Authorization' : 'Token %s' % auth })
    response = connection.getresponse()
    string = response.read().decode('utf-8')
    info = json.loads(string)

    #Update index of current entries
    currentIndex = endingIndex + 1

    #Normalize the data
    for x in info:
        #Change key name
        x['AcmeApiId'] = x.pop('id')
        x['UserName'] = x.pop('user_Name')
        x['SourceIp'] = x.pop('ips')
        x['Target'] = x.pop('target')
        x['Action'] = x.pop('EVENT_0_ACTION')
        x['EventTime'] = x.pop('DateTimeAndStuff')

        #UserName
        x['UserName'] = x['UserName'].lower()
        if "username is: " in x['UserName']:
            x['UserName'] = x['UserName'][13:]

        #SourceIP
        x['SourceIp'] = x['SourceIp'][0]

        #EventTime
        x['EventTime'] = datetime.datetime.fromtimestamp(x['EventTime']).strftime('%I:%M:%S %p %A, %B %d, %Y')

        #Action
        if "success" in x['Action'].lower():
            x['Action'] = "Logon-Success"
        elif "failed" in x['Action'].lower():
            x['Action'] = "Logon-Failure"
        elif "idk" in x['Action'].lower():
            x['Action'] = None

    #Save data to Json file
    # appendedList = None
    if firstRunThrough == False:
        with open('data.json', 'r') as f:
            data = json.load(f)
            info = data + info
            
    firstRunThrough = False
    with open('data.json', 'w') as f:
        json.dump(info, f)

    # for x in info:
    #     print x

    # print("Status: {} and reason: {}".format(response.status, response.reason))

connection.close()