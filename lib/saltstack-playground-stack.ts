import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2'
export class SaltstackPlaygroundStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'app-vpc', {
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'salt',
          subnetType: ec2.SubnetType.PUBLIC
        }
      ]
    })

    const secGroup = new ec2.SecurityGroup(this, 'salt-security', {
      allowAllOutbound: true,
      vpc: vpc as ec2.IVpc,
      
    })
    secGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'ssh rule')
    secGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(22), 'ssh-rule-v6')
    const saltMasterUserData = ec2.UserData.forLinux()
    const userDataSaltMaster: string[] = []
    userDataSaltMaster.push(`curl -L https://bootstrap.saltproject.io > script.sh`)
    userDataSaltMaster.push(`yum update -y`)
    userDataSaltMaster.push(`yum install python3-pip`)
    userDataSaltMaster.push(`pip3 install -U requests`)
    userDataSaltMaster.push(`sudo bash script.sh -M -x python3`)
    userDataSaltMaster.push(`echo 'master: localhost' >> /etc/salt/minion`)
    userDataSaltMaster.push(`systemctl restart salt-master`)
    userDataSaltMaster.push(`systemctl restart salt-minion`)
    userDataSaltMaster.push(`salt-key -A -y`)
    saltMasterUserData.addCommands(...userDataSaltMaster)
    const saltMaster = new ec2.Instance(this, 'salt-master', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
      vpc: vpc as ec2.IVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      instanceName: 'salt-master',
      securityGroup: secGroup,
      userDataCausesReplacement: true,
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        edition: ec2.AmazonLinuxEdition.STANDARD,
        virtualization: ec2.AmazonLinuxVirt.HVM,
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
        storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE
      }),
      userData: saltMasterUserData,
    })
  }
}
