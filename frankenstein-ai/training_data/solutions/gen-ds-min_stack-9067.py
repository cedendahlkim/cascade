# Task: gen-ds-min_stack-9067 | Score: 100% | 2026-02-11T12:09:34.211047

def solve():
    n = int(input())
    stack = []
    min_stack = []

    for _ in range(n):
        line = input().split()
        op = line[0]

        if op == "push":
            val = int(line[1])
            stack.append(val)
            if not min_stack or val <= min_stack[-1]:
                min_stack.append(val)
        elif op == "pop":
            if stack:
                popped = stack.pop()
                if min_stack and popped == min_stack[-1]:
                    min_stack.pop()
        elif op == "min":
            if min_stack:
                print(min_stack[-1])

solve()