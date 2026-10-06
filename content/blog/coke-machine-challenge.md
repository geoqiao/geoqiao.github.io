---
issue_number: 14
type: blog
title: 'Coke Machine Challenge '
slug: coke-machine-challenge
description: 什么是 Coke Machine
created_date: '2023-09-03'
update_date: '2023-09-03'
published_at: '2023-09-03T13:02:25Z'
updated_at: '2026-08-02T10:03:22Z'
tags:
- name: python
  key: python
---

## 什么是 Coke Machine

Coke Machine 是[CS50P](https://cs50.harvard.edu/python/2022/)课程中 loop 章节的其中一个课后练习，这个课后练习需要使用 Python 语言中的 loop 语法实现一个可乐售卖机，具体要求如下：

> Suppose that a machine sells bottles of Coca-Cola (Coke) for 50 cents and only accepts coins in these denominations: 25 cents, 10 cents, and 5 cents.
>
> In a file called `coke.py`, implement a program that prompts the user to insert a coin, one at a time, each time informing the user of the amount due. Once the user has inputted at least 50 cents, output how many cents in change the user is owed. Assume that the user will only input integers, and ignore any integer that isn’t an accepted denomination.

实际上，这是一个很简单的实现，但是我在这里被困了 2 个小时，这里重新记录一遍过程，当作**错题集**。

## 任务拆解

1. 假设输入只有 25、10、5 几种情况，且只输入整数格式，忽略任何不符合要求的数字
2. 文件名为 coke.py
3. 提示用户投入一枚硬币，每次都要通知应付金额
4. 一旦用户投入的金额大于等于 50，输出找零金额

## 代码实现

### 初始化

可乐需要 50 美分；一开始没有任何硬币投入；投入的硬币只有三种情况；提示用户可乐的价格。

代码如下：

```python
amount_due = 50
change = 0
coin_list = [5,10,25]
print(f"Amount Due: {amount_due}") # 告诉客户coke价格
```

### 付费环节

由于条件限制，用户无法一次投入 50 美分，需要多次投入（循环），每次都要提醒用户还要投多少钱。

```python
while amount_due > 0: # 循环开始的条件，如果用户还需要投的钱大于0，则说明钱还不够
    coin = input("Insert a coin (25, 10, or 5): ")
    # 这里用try 语句来避免用户输入一些无法转换为整数的文本内容
    try:
        coin = int(coin)
    except ValueError:
        print("Invalid coin")
        continue
    # if语句用来判断用户投入的硬币是否符合要求
    if coin in coin_list:
        amount_due -= coin # 总共需要投入的减去已经投入的就是还需要投入的
        change += coin # 这里用来统计用户总共投入的多少
        print(f"Amount Due: {amount_due}")
    else: # 如果用户投入的硬币不符合要求，重新提示可乐价格
        print("Amount Due: 50")
```

### 付费结束之后

付费结束之后，有可能刚好投入了 50 美分，但也有可能客户给多了，需要给用户找零，代码如下：

```python
# 还需要付费金额小于等于0，即付够钱了
# 仍需付费金额的绝对值，即为需要找零的钱
if amount_due <= 0:
    print(f"Change Owed: {abs(amount_due)}")
```

## 完整代码

把以上代码优化一下，当 coke.py 当作脚本运行是可以处罚，但是当 import 到其他 Python 文件中则不会触发：

```python
def coke():
    amount_due = 50
    change = 0
    coin_list = [5, 10, 25]
    print(f"Amount Due: {amount_due}")

    while amount_due > 0:
        coin = input("Insert a coin (25, 10, or 5): ")
        try:
            coin = int(coin)
        except ValueError:
            print("Invalid coin")
            continue

        if coin in coin_list:
            amount_due -= coin
            change += coin
            print(f"Amount Due: {amount_due}")
        else:
            print("Amount Due: 50")

    if amount_due <= 0:
        print(f"Change Owed: {abs(amount_due)}")

if __name__ == "__main__":
    coke()
```

重写一遍才发现，`change`这个变量好像根本没用。

本来是想记录一下用户投入了多少美分，然后用总共投入的钱减去可乐的价格，就是需要找零的钱。现在看来这个变量完全可以去掉，从而使代码更加简洁。

我就不删了，希望之后重看的时候还能发现这个不完美的地方。
