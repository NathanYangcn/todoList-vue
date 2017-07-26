import Vue from 'vue';
import AV from 'leancloud-storage';

var APP_ID = '1munuLrHWIXQWrh75lKkK5Ai-gzGzoHsz';
var APP_KEY = 'CHI35NhICz695oRTI1j4EbI5';
AV.init({
    appId: APP_ID,
    appKey: APP_KEY
});

var filters = {
    all: function (tasks) {
        return tasks;
    },
    finished: function (tasks) {
        return tasks.filter(function (task) {
            return task.completed;
        })
    },
    unfinished: function (tasks) {
        return tasks.filter(function (task) {
            return !task.completed;
        })
    }
};

var app = new Vue({
    el: '#app',
    data: {
        signType: 'signIn',
        signUpData: {
            username: '',
            password: '',
            passwordConfirm: '',
            email: '',
            phoneNum: ''
        },
        signInData: {
            username: '',
            password: ''
        },
        currentUser: null,
        newTaskTitle: '',
        newTaskDetail: '',
        tasks: [],
        tasksData: [],
        isCheckout: true,
        taskItem: '',
        taskIndex: null,
        editDataCache: null,
        projects: [],   // 清单列表
        newProjectName: '',
        curProject: null  // 当前清单
    },
    created: function () {
        this.currentUser = this.getCurrentUser();
        if( this.currentUser ){
            this.fetchTasks();
        }
    },
    methods: {
        tasksSaveOrUpdate: function () {
            if(this.tasksData.id || this.projects.id){
                this.updateTasks();
            }else {
                this.saveTasks();
            }
        },
        projectsSaveOrUpdate: function () {
            if(this.projects.id || this.tasksData.id){
                this.updateProjects();
            }else {
                this.saveProjects();
            }
        },
        // 数据存储
        saveTasks: function () {
            var self = this;
            var tasksDataStr = JSON.stringify(this.tasksData);
            var AVTasks = AV.Object.extend('AllTasks'); // 新建一个 Task
            var avTasks = new AVTasks();
            avTasks.set('tasksList', tasksDataStr);

            var acl = new AV.ACL(); // 新建一个 ACL 实例
            acl.setReadAccess(AV.User.current(),true);
            acl.setWriteAccess(AV.User.current(),true);

            avTasks.setACL(acl); // 将 ACL 实例赋予 Post 对象
            avTasks.save().then(function(task) {
                console.log('0000000000000000000')
                console.log(task)
                self.tasksData.id = task.id;
                alert('success'); // 保存成功
            }).catch(function(error) {
                console.log(error);
            });
        },
        saveProjects: function () {
            var self = this;
            var projectsDataStr = JSON.stringify(this.projects);
            var AVTasks = AV.Object.extend('AllTasks'); // 新建一个 Task
            var avTasks = new AVTasks();
            avTasks.set('projectsList', projectsDataStr);

            var acl = new AV.ACL(); // 新建一个 ACL 实例
            acl.setReadAccess(AV.User.current(),true);
            acl.setWriteAccess(AV.User.current(),true);

            avTasks.setACL(acl); // 将 ACL 实例赋予 Post 对象
            avTasks.save().then(function(project) {
                self.projects.id = project.id;
                alert('success'); // 保存成功
            }).catch(function(error) {
                console.log(error);
            });
        },
        updateTasks: function () {
            var tasksDataStr = JSON.stringify(this.tasksData);
            var avTasks = AV.Object.createWithoutData('AllTasks', (this.tasksData.id || this.projects.id));  // 第一个参数是 className，第二个参数是 objectId
            avTasks.set('tasksList', tasksDataStr);  // 修改属性
            avTasks.save().then( function () {
                console.log('ok!')
            });  // 保存到云端
        },
        updateProjects: function () {
            var projectsDataStr = JSON.stringify(this.projects);
            var avTasks = AV.Object.createWithoutData('AllTasks', (this.projects.id || this.tasksData.id));  // 第一个参数是 className，第二个参数是 objectId
            avTasks.set('projectsList', projectsDataStr);  // 修改属性
            avTasks.save().then( function () {
                console.log('ok!')
            });  // 保存到云端
        },
        fetchTasks: function () {
            var self = this;
            var query = new AV.Query('AllTasks');
            query.find()
                .then(function (tasks) {
                    let avAllTasks = tasks[0];
                    console.log('---------')
                    console.log(tasks[0]);
                    let id = avAllTasks.id;
                    console.log(avAllTasks.id);
                    self.tasksData = JSON.parse(avAllTasks.attributes.tasksList);
                    self.projects = JSON.parse(avAllTasks.attributes.projectsList);
                    self.tasksData.id = id;
                    self.projects.id = id;
                    console.log(self.tasksData)
                })
                .then(function(tasks) {
                    console.log(self.tasks);
                    console.log(self.tasksData);
                    self.tasks = self.tasksData;
                    alert('获取成功');
                }, function (error) {
                    console.log(error);
                    alert('获取失败');
                });
        },
        // 注册账号
        signUp: function () {
            var self = this;
            var user = new AV.User(); // 新建 AVUser 对象实例
            user.setUsername(this.signUpData.username); // 设置用户名
            user.setPassword(this.signUpData.password); // 设置密码
            user.setEmail(this.signUpData.email); // 设置邮箱
            user.signUp().then(function (loginedUser) {
                console.log(loginedUser);
                self.currentUser = self.getCurrentUser();
                this.fetchTasks();
            }, function (error) {
                console.log(error);
            });
        },
        // 用户登录
        signIn: function () {
            var self = this;
            AV.User.logIn(this.signInData.username, this.signInData.password).then(function (loginedUser) {
                self.currentUser = self.getCurrentUser();
                self.fetchTasks();
            }, function (error) {
                console.log(error);
            });
        },
        // 获取当前用户，用于判断用户是否登录
        getCurrentUser: function () {
            var curUser = AV.User.current();
            if(curUser) {
                let {id, createdAt, attributes: {username}} = curUser;
                return {id, createdAt, username};
            }else {
                return null;
            }
        },
        // 用户登出
        signOut: function () {
            AV.User.logOut(); // 现在的 currentUser 是 null 了
            this.currentUser = AV.User.current(); // 赋值null过去
            window.location.reload();  // 刷新页面
        },
        addTask: function () {
            if (!this.newTaskTitle) {
                return
            }
            this.tasksData.push({
                title: this.newTaskTitle,
                content: this.newTaskDetail,
                createdAt: ( this.formatTime( new Date() ) ),
                completed: false,
                belongTo: this.curProject   // 设立清单归属
            });
            this.newTaskTitle = '';
            console.log(this.tasks);
            this.tasksSaveOrUpdate();
        },
        removeTaskNew: function () {
            let index = this.taskIndex;
            this.tasksData.splice(index, 1);
            this.isCheckout = true;
            this.tasksSaveOrUpdate();
            console.log('detele');
        },
        finishTask: function (item) {
            this.tasksSaveOrUpdate();
        },
        checkoutTask: function (item, index) {
            this.isCheckout = false;
            this.taskItem = item;
            this.taskIndex = index;
        },
        editing: function (item) {
            this.editDataCache = item.title;
        },
        changeTitleC: function (item) {
            let index = this.taskIndex;
            this.tasksData[index].title = item.title;
            if(this.editDataCache === item.title){
                return
            }else {
                this.tasksSaveOrUpdate();
                console.log('changeTile');
            }
        },
        cancleEdit: function(item) {
            item.title = this.editDataCache;
        },
        changeTitleR: function () {
            let index = this.taskIndex;
            this.tasksData[index].title = this.taskItem.title;
            console.log('changeTile')
        },
        changeDetial: function () {
            let index = this.taskIndex;
            this.tasksData[index].content = this.taskItem.content;
            console.log('changeDetial')
        },
        changeCompleted: function () {
            let index = this.taskIndex;
            this.tasksData[index].completed = this.taskItem.completed;
            console.log('changeCompleted');
            this.tasksSaveOrUpdate();
        },
        changeSave: function () {
            this.tasksSaveOrUpdate();
            console.log('changeSave');
        },
        formatTime: function(){
            var dt = new Date(),
                yy = dt.getFullYear(),
                mm = dt.getMonth()+1,
                dd = dt.getDate(),
                hh = dt.getHours(),
                ms = dt.getMinutes(),
                dtArray = [];
            dtArray.push(yy,mm,dd,hh,ms);
            for(var i=0;i<dtArray.length;i++){
                if(dtArray[i]<10){
                    dtArray[i] = '0'+ dtArray[i]
                }
            }
            var tpl = dtArray[0] +'年'+ dtArray[1] +'月'+ dtArray[2] +'日 ';
            return tpl
        },
        // 任务分类显示-任务过滤器
        filterAll: function () {
            this.tasks = this.tasksData;
        },
        ftlterFinished: function () {
            var finished = [];
            for(var i = 0; i < this.tasksData.length; i++){
                if(this.tasksData[i].completed){
                    finished.push(this.tasksData[i]);
                    console.log(finished);
                }
            }
            this.tasks = finished;
        },
        filterUnfinish: function () {
            var unfinish = [];
            for(var i = 0; i < this.tasksData.length; i++){
                if(!this.tasksData[i].completed){
                    unfinish.push(this.tasksData[i]);
                    console.log(unfinish);
                }
            }
            this.tasks = unfinish;
        },
        filterToday: function () {
            var todayArr = [];
            var todayDate = this.formatTime( new Date() );
            for(var i = 0; i < this.tasksData.length; i++){
                if( (todayDate === this.tasksData[i].createdAt) && (!this.tasksData[i].completed) ) {
                    todayArr.push(this.tasksData[i]);
                    console.log(todayArr);
                }
            }
            this.tasks = todayArr;
        },
        filterOverTime: function () {
            var overTime = [];
            var overTimeDate =  this.filterFormatTime( this.formatTime( new Date() ) );
            console.log(overTimeDate);
            for(var i = 0; i < this.tasksData.length; i++){
                if( ( overTimeDate > this.filterFormatTime(this.tasksData[i].createdAt) ) && (!this.tasksData[i].completed) ) {
                    overTime.push(this.tasksData[i]);
                    console.log('overtime');
                }
            }
            this.tasks = overTime;
        },
        filterFormatTime: function (timeStr) {
            let result = timeStr.replace(/\D/g, '-');
            return Date.parse( result.slice(0,-2));
        },
        addProject: function () {
            if (!this.newProjectName) {
                return
            }
            this.projects.push({
                name: this.newProjectName
            });
            this.newProjectName = '';
            console.log(this.projects);
            this.projectsSaveOrUpdate();
        },
        filterProjectList: function (item, index) {
            this.curProject = item.name;

            var proTask = [];
            for(var i = 0; i < this.tasksData.length; i++){
                if( ( this.tasksData[i].belongTo === this.curProject ) && (!this.tasksData[i].completed) ) {
                    proTask.push(this.tasksData[i]);
                    console.log('proTask');
                }
            }
            this.tasks = proTask;
        }
    }
});