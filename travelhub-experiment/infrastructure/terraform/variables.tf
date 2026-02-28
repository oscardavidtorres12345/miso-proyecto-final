variable "aws_region" {
  description = "Región de AWS donde se desplegará el cluster"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "Nombre del cluster EKS"
  type        = string
  default     = "travelhub-poc"
}

variable "cluster_version" {
  description = "Versión de Kubernetes para el cluster EKS"
  type        = string
  default     = "1.29"
}

variable "environment" {
  description = "Entorno de despliegue"
  type        = string
  default     = "poc"
}

variable "node_instance_type" {
  description = "Tipo de instancia EC2 para los nodos del cluster"
  type        = string
  default     = "t3.medium"
}

variable "node_min_size" {
  description = "Número mínimo de nodos"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Número máximo de nodos (para absorber el HPA)"
  type        = number
  default     = 5
}

variable "node_desired_size" {
  description = "Número deseado de nodos al inicio"
  type        = number
  default     = 2
}

variable "vpc_cidr" {
  description = "CIDR block de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

