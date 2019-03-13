# docker-scratch-www
Docker container for Scratch www

## 检出代码
在开发主机上执行下面的git复制代码
```
git clone --recursive https://github.com/CodePlayerBox/docker-scratch-www.git
```


## 自动部署到树莓派

在开发主机上，通过Ansible将代码同步到树莓派上并运行
```
cd playbooks
ansible-playbook -i inventories/hosts deploy-to-rpi.yml
```

## 在树莓派上手工构建

在开发主机上，通过Ansible将代码同步到树莓派上之后

1. 在树莓派上，执行下面的命令进行构建
```
cd ~/CodePlayerBox/docker-scratch-www
docker-compose build
```

2. 进入script目录下，然后执行下面的命令启动
```
cd script
./scratch_www start
