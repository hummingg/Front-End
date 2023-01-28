let vm;
window.onload = function () {
    vm = new Hgg({
        el: '#app',
        data: {
            // appName: "人员管理系统",
            name: 'Hgg',
            age: '35',
            people: [{name: 'Tom', age: 20},{name: 'Jerry', age: 19},{name: 'Alice', age: 18}],
            person: {}, // Hgg.js内部使用
        },
        methods: {
            // 保存
            save() {
                let data = this.$data;
                const name = data.name.trim();
                let age = data.age.trim();
                age = Number(age, 10);
                if(!name || isNaN(age) || age <= 0 || age > 200){
                    alert('输入的姓名或年龄非法');
                    return;
                }
                // 浅拷贝。因为数组是对象类型，是引用，所以要拷贝才能比较新旧值是否相等。
                let people = data.people.slice();
                people.push({name: data.name, age: data.age});
                data.people = people;
            },
            // 上传
            upload(){
                console.log(this.$data.people);
            },
            // 删除data-idx=idx的tr对应的person
            del(e, idx){
                if(e.target.getAttribute('class') != 'del'){
                    return;
                }
                let people = this.$data.people.slice();
                people.splice(idx, 1);
                this.$data.people = people; // 浅拷贝
            }
        }
    });
}