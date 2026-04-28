apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: travelhub
  labels:
    project: travelhub
    environment: dev
spec:
  amiFamily: AL2023
<<<<<<< HEAD
  # Instance profile generado por Terraform (module.karpenter)
  instanceProfile: "${instance_profile}"
  # Dejar que Karpenter auto-descubra la AMI EKS-optimizada AL2023 via SSM.
  # Karpenter inyecta userData automaticamente con cluster-name, endpoint y CA.
=======
  instanceProfile: "${instance_profile}"
>>>>>>> 4f8b825 (fixing terraform issues and karperter setup issues when recreating the infra)
  amiSelectorTerms:
    - alias: al2023@latest
  subnetSelectorTerms:
    - tags:
<<<<<<< HEAD
        # Estas subnets son las privadas del VPC creado por Terraform
        kubernetes.io/role/internal-elb: "1"
  securityGroupSelectorTerms:
    # Usar el mismo SG que los nodos del managed node group (output del module EKS).
    # Debe coincidir con module.eks.node_security_group_id.
=======
        kubernetes.io/role/internal-elb: "1"
  securityGroupSelectorTerms:
>>>>>>> 4f8b825 (fixing terraform issues and karperter setup issues when recreating the infra)
    - id: "${node_security_group_id}"
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 20Gi
        volumeType: gp3
        encrypted: true
  metadataOptions:
    httpEndpoint: enabled
    httpProtocolIPv6: disabled
    httpPutResponseHopLimit: 2
    httpTokens: required
  detailedMonitoring: false
