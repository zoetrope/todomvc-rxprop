/*global todomvc, angular */
'use strict';

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
todomvc.controller('TodoCtrl', function TodoCtrl($scope, $routeParams, todoStorage, filterFilter) {
    $scope.todos = new rxprop.ReactiveCollection($scope, todoStorage.get());

    $scope.newTodo = '';
    $scope.editedTodo = null;

    $scope.todos
        .subscribe(function (values) {
            todoStorage.put(values);
        });

    $scope.remainingCount = $scope.todos
        .select(function (values) {
            return filterFilter(values, { completed: false }).length;
        }).toReactiveProperty($scope);

    $scope.completedCount = $scope.todos
        .select(function (values) {
            return values.length - $scope.remainingCount.value;
        })
        .toReactiveProperty($scope);

    $scope.allChecked = $scope.remainingCount
        .select(function (value) {
            return !value;
        })
        .toReactiveProperty($scope);

    $scope.statusFilter = $scope.$onAsObservable('$routeChangeSuccess')
        .select(function (_) {
            var status = $scope.status = $routeParams.status || '';
            return (status === 'active') ?
            { completed: false } :
                (status === 'completed') ? { completed: true } : null;
        }).toReactiveProperty($scope);

    $scope.addTodo = new rxprop.ReactiveCommand($scope);
    $scope.addTodo
        .select(function (_) {
            return $scope.newTodo.trim();
        })
        .where(function (newTodo) {
            return newTodo.length !== 0;
        })
        .subscribe(function (newTodo) {
            $scope.todos.add({
                title: newTodo,
                completed: false
            });
            $scope.newTodo = '';
        });

    $scope.editTodo = new rxprop.ReactiveCommand($scope, function (todo) {
        $scope.editedTodo = todo;
        $scope.originalTodo = angular.extend({}, todo);
    });

    $scope.doneEditing = new rxprop.ReactiveCommand($scope);
    $scope.doneEditing
        .select(function (todo) {
            $scope.editedTodo = null;
            todo.title = todo.title.trim();
            return todo;
        })
        .where(function (todo) {
            return todo.title === "";
        })
        .subscribe(function (todo) {
            $scope.removeTodo.execute(todo);
        });

    $scope.revertEditing = new rxprop.ReactiveCommand($scope, function (todo) {
        $scope.todos.update(todo, $scope.originalTodo);
        $scope.doneEditing.execute($scope.originalTodo);
    });

    $scope.removeTodo = new rxprop.ReactiveCommand($scope, function (todo) {
        $scope.todos.remove(todo);
    });

    $scope.clearCompletedTodos = new rxprop.ReactiveCommand($scope, function (_) {
        $scope.todos.values = $scope.todos.values.filter(function (val) {
            return !val.completed;
        });
    });

    $scope.markAll = new rxprop.ReactiveCommand($scope, function (completed) {
        $scope.todos.values.forEach(function (todo) {
            todo.completed = !completed;
        });
    });
});
