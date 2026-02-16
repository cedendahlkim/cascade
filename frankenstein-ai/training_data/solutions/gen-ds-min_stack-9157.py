# Task: gen-ds-min_stack-9157 | Score: 100% | 2026-02-15T10:28:58.230728

n = int(input())
stack = []
for _ in range(n):
    line = input().split()
    if line[0] == 'push':
        stack.append(int(line[1]))
    elif line[0] == 'pop':
        if stack:
            stack.pop()
    elif line[0] == 'min':
        if stack:
            print(min(stack))