# Task: gen-ds-reverse_with_stack-5886 | Score: 100% | 2026-02-12T16:45:05.934786

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

reversed_list = []
for _ in range(n):
    reversed_list.append(stack.pop())

print(*reversed_list)