# Task: gen-ds-min_stack-1487 | Score: 100% | 2026-02-12T19:12:25.693571

n = int(input())
stack = []
min_stack = []

for _ in range(n):
    line = input().split()
    op = line[0]

    if op == "push":
        x = int(line[1])
        stack.append(x)
        if not min_stack or x <= min_stack[-1]:
            min_stack.append(x)
    elif op == "pop":
        if stack:
            popped = stack.pop()
            if popped == min_stack[-1]:
                min_stack.pop()
    elif op == "min":
        if min_stack:
            print(min_stack[-1])