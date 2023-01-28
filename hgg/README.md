# Hgg.js

针对实验3——“人员管理系统”、使用`typescript`开发的一个简单MVVM框架。

用法类似Vue，但实现简单、粗糙。

定义了3个类：Hgg、Observer、Compiler。

支持的指令：{{}}、h-model、h-for、h-on:click。

## 编译
```sh
tsc hgg.ts -t ES2016
```

## 模板引擎

使用递归渲染DOM树，将data渲染到页面。

## 双向绑定

input元素值改变会同步更新对应的data；
反之，数据劫持会让新值同步更新到input元素。

## 演示地址
[在线使用](https://www.hummingg.com/HRMS/index.html)

[演示视频](https://www.hummingg.com/HRMS/HRMS.mp4)