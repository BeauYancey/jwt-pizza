# CloudFormation Support for RDS
The CloudFormation script we built for the JWT Pizza Service allows us to quickly tear down and set up the ECS and ALB configurartion for the JWT Pizza backend. 
This reduces costs becuase I can take down the backend when I don’t need it, and spin it back up only for assignmments and deliverables. This only cut my costs by 
about half though, the majority of my AWS bill was coming from my RDS instance which was always running. So I decided to look into automating the tear-down and set-up 
of that critical part of my infrastucture as well.

## Problems
1. The database needs to be persistent
2. The database needs a specified master password
3. The database hostname will be different every time a new one is created

## Solutions
1. AWS allows users to take a snapshot of a database
   - This is free
   - The snapshot contains all the data stored in the database, enabling persistence across different stacks
   - This can be specified as the deletion policy for an RDS instance in a CloudFormation stack, meaning it will happen automatically if the stack is deleted
   - The snapshot can be used to restore a database using the `DBSnapshotIdentifier` property on the `AWS::RDS::DBInstance` resource
2. The `AWS::RDS::DBInstance` resouce in CloudFormation can optionally specify the `MasterUserPassword` property
   - This can be given as a stack parameter
3. The `DB_HOSTNAME` repository secret can be updated with the new hostname
   - The hostname can be easily found by clicking the linked ARN of the enw RDS instance
   - After updating the environment secret, the CI pipeline in GitHub Actions will need to be run again.

## Modified Stack
The following demonstrates the necessary changes to the CloudFormation script to enable the easy tear-down and set-up of the RDS database
**Note:** Before creating this stack, you must delete the existing the jwt-pizza-service-db database to avoid a naming conflict. When you do so, be sure to take a snapshot 
of the database. You can do this by selecting the database, opening the actions menu, and choosing "Take Snapshot." Alternatively, you can choose to delete the databse and 
you will be asked if you would like to take a final snapshot before deletion. Either method is fine.

### Parameters
The following parameters must be added to the CloudFormation Script:
- `DBSnapshotIdentifier` — this is used so CloudFormation knows which snaphot you would like to restore your database from. This is where all the data is.
- `DBSubnetGroup` — this tells CloudFormation which subnets the database belongs to, governing how it can be accessed
- `DBSecurityGroups` — this tells CloudFormation which secirity groups the databse belongs to, governing how it can be accessed
- `DBPassword` — this is used to set the master password for the new database. Without setting this, we would have no way to access the database
```
  "Parameters": {
    ...
    "DBSnapshotIdentifier": {
      "Type": "String",
      "Description": "The snapshot identifier of the RDS database",
      "Default": ""
    },
    "DBSubnetGroup": {
      "Type": "String",
      "Description": "The subnet group name for the RDS instance",
      "Default": ""
    },
    "DBSecurityGroups": {
      "Type": "CommaDelimitedList",
      "Description": "A list of security group ids for the RDS instance",
      "Default": ""
    },
    "DBPassword": {
      "Type": "String",
      "Description": "The password for the DB master user",
      "Default": ""
    }
  },
```

### Resources
The following resource must be added to the CloudFormation script.
- The deletion policy specifies that we want to take a snapshot of the database when we delete this stack, that provides us with something to restore next time we create this stack
- The `DBSnapshotIdentifier` property indicates which snapshot we are restoring
- All other properties mimic the setup we followed for the course assignment and/or keep costs low.
```
  "Resources": {
    ...
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": "jwt-pizza-service-db",
        "DBInstanceClass": "db.t4g.micro",
        "DBSnapshotIdentifier": { "Ref": "DBSnapshotIdentifier" },
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VPCSecurityGroups": { "Ref": "DBSecurityGroups" },
        "MultiAZ": "false",
        "AllocatedStorage": "20",
        "PubliclyAccessible": "false",
        "StorageType": "gp3",
        "StorageThroughput": "125",
        "MaxAllocatedStorage": "1000",
        "StorageEncrypted": true,
        "EnableIAMDatabaseAuthentication": true,
        "MasterUserPassword": { "Ref": "DBPassword" }
      }
    }
  },
```

### Outputs
- We output the ARN of the new RDS instance after the stack has completed.
```
  "Outputs": {
    ...
    "RDSInstance": {
      "Description": "RDS Instance",
      "Value": {
        "Ref": "RDSInstance"
      }
    }
  }
```
